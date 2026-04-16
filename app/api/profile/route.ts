/**
 * 个人资料API路由
 * 提供个人资料的增删改查接口
 *
 * GET /api/profile - 获取当前用户个人资料
 * POST /api/profile - 创建个人资料
 * PUT /api/profile - 更新个人资料
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { mergeSuperAdminProfileFromRow } from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import { resolveProfileEmailUpdateOrError, verifyProfileEmailCodeOrError } from "@/lib/services/profile-email.service";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, UpdateProfileRequest, UserProfile } from "@/types/blog";

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份（JWT 无效时由 requireAuthUser 处理，避免 verifyToken 抛错落入外层 500）
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const decoded = auth.user;

    // 内存超级管理员：users 表无 id=0；个人资料落在 user_profiles.user_id = 0
    if (isJwtInMemorySuperRoot(decoded)) {
      const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, decoded.userId)).limit(1);
      const data = mergeSuperAdminProfileFromRow(profile[0], decoded.username);
      return NextResponse.json<ApiResponse<UserProfile>>({
        success: true,
        data,
        message: "个人资料获取成功",
        timestamp: new Date().toISOString(),
      });
    }

    // 获取用户基本信息
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (user.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "用户不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 获取用户个人资料
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, decoded.userId)).limit(1);

    const userData = user[0];
    const profileData = profile[0];

    return NextResponse.json<ApiResponse<UserProfile>>({
      success: true,
      data: {
        id: profileData?.id || 0,
        userId: userData.id,
        email: userData.email,
        avatar: userData.avatar ?? undefined,
        firstName: profileData?.firstName ?? undefined,
        lastName: profileData?.lastName ?? undefined,
        phone: profileData?.phone ?? undefined,
        website: profileData?.website ?? undefined,
        location: profileData?.location ?? undefined,
        notifications: profileData?.notifications ? JSON.parse(profileData.notifications) : {},
        privacy: profileData?.privacy ? JSON.parse(profileData.privacy) : {},
        socialLinks: profileData?.socialLinks ? JSON.parse(profileData.socialLinks) : {},
        createdAt: profileData?.createdAt || new Date(),
        updatedAt: profileData?.updatedAt || new Date(),
      },
      message: "个人资料获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取个人资料失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取个人资料失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const decoded = auth.user;

    const body: UpdateProfileRequest = await request.json();

    const emailResolved = await resolveProfileEmailUpdateOrError(body, decoded.userId);
    if (!emailResolved.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: emailResolved.message,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    const emailNormalized = emailResolved.normalized;
    const avatarNormalized = body.avatar?.trim() || undefined;

    // 若本次要改邮箱，需先通过 change_email 验证码校验
    if (emailNormalized !== undefined) {
      const currentEmail = isJwtInMemorySuperRoot(decoded)
        ? (
            await db
              .select({ email: userProfiles.email })
              .from(userProfiles)
              .where(eq(userProfiles.userId, decoded.userId))
              .limit(1)
          )[0]?.email
        : (await db.select({ email: users.email }).from(users).where(eq(users.id, decoded.userId)).limit(1))[0]?.email;

      const verification = await verifyProfileEmailCodeOrError({
        oldEmail: currentEmail ?? undefined,
        newEmail: emailNormalized,
        code: body.emailVerificationCode,
      });
      if (!verification.ok) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: verification.message,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // 检查是否已存在个人资料（含超级管理员 user_id=0）
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, decoded.userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "个人资料已存在，请使用PUT方法更新",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const socialLinksRaw = body.socialLinks ? { ...body.socialLinks } : {};
    const socialLinksWithAvatar =
      isJwtInMemorySuperRoot(decoded) && avatarNormalized !== undefined
        ? { ...socialLinksRaw, avatar: avatarNormalized }
        : socialLinksRaw;

    const [insertResult] = await db.insert(userProfiles).values({
      userId: decoded.userId,
      email: isJwtInMemorySuperRoot(decoded) && emailNormalized !== undefined ? emailNormalized : null,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      website: body.website,
      location: body.location,
      notifications: body.notifications ? JSON.stringify(body.notifications) : null,
      privacy: body.privacy ? JSON.stringify(body.privacy) : null,
      socialLinks: Object.keys(socialLinksWithAvatar).length > 0 ? JSON.stringify(socialLinksWithAvatar) : null,
    });

    if (!isJwtInMemorySuperRoot(decoded) && emailNormalized !== undefined) {
      await db.update(users).set({ email: emailNormalized, updatedAt: new Date() }).where(eq(users.id, decoded.userId));
    }
    if (!isJwtInMemorySuperRoot(decoded) && avatarNormalized !== undefined) {
      await db
        .update(users)
        .set({ avatar: avatarNormalized, updatedAt: new Date() })
        .where(eq(users.id, decoded.userId));
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: insertResult.insertId },
        message: "个人资料创建成功",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建个人资料失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "创建个人资料失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const decoded = auth.user;

    const body: UpdateProfileRequest = await request.json();

    const emailResolved = await resolveProfileEmailUpdateOrError(body, decoded.userId);
    if (!emailResolved.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: emailResolved.message,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    const emailNormalized = emailResolved.normalized;
    const avatarNormalized = body.avatar?.trim() || undefined;

    // 检查个人资料是否存在
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, decoded.userId))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "个人资料不存在，请先创建",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 若本次要改邮箱，需先通过 change_email 验证码校验
    if (emailNormalized !== undefined) {
      const currentEmail = isJwtInMemorySuperRoot(decoded)
        ? existingProfile[0]?.email
        : (await db.select({ email: users.email }).from(users).where(eq(users.id, decoded.userId)).limit(1))[0]?.email;

      const verification = await verifyProfileEmailCodeOrError({
        oldEmail: currentEmail ?? undefined,
        newEmail: emailNormalized,
        code: body.emailVerificationCode,
      });
      if (!verification.ok) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: verification.message,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // 更新个人资料（超级管理员邮箱仅存 user_profiles.email）
    const existingSocialLinks = existingProfile[0]?.socialLinks;
    let mergedSocialLinks: Record<string, unknown> = {};
    if (existingSocialLinks) {
      try {
        mergedSocialLinks = JSON.parse(existingSocialLinks) as Record<string, unknown>;
      } catch {
        mergedSocialLinks = {};
      }
    }
    if (body.socialLinks) {
      mergedSocialLinks = { ...mergedSocialLinks, ...body.socialLinks };
    }
    if (isJwtInMemorySuperRoot(decoded) && avatarNormalized !== undefined) {
      mergedSocialLinks.avatar = avatarNormalized;
    }

    await db
      .update(userProfiles)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        website: body.website,
        location: body.location,
        notifications: body.notifications ? JSON.stringify(body.notifications) : null,
        privacy: body.privacy ? JSON.stringify(body.privacy) : null,
        socialLinks: Object.keys(mergedSocialLinks).length > 0 ? JSON.stringify(mergedSocialLinks) : null,
        updatedAt: new Date(),
        ...(isJwtInMemorySuperRoot(decoded) && emailNormalized !== undefined ? { email: emailNormalized } : {}),
      })
      .where(eq(userProfiles.userId, decoded.userId));

    if (!isJwtInMemorySuperRoot(decoded) && emailNormalized !== undefined) {
      await db.update(users).set({ email: emailNormalized, updatedAt: new Date() }).where(eq(users.id, decoded.userId));
    }
    if (!isJwtInMemorySuperRoot(decoded) && avatarNormalized !== undefined) {
      await db
        .update(users)
        .set({ avatar: avatarNormalized, updatedAt: new Date() })
        .where(eq(users.id, decoded.userId));
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "个人资料更新成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("更新个人资料失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "更新个人资料失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
