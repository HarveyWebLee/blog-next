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

import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { resolveProfileEmailUpdateOrError, verifyProfileEmailCodeOrError } from "@/lib/services/profile-email.service";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, UpdateProfileRequest, UserProfile } from "@/types/blog";

function asObjectRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

function normalizeProfileSocialLinks(raw: unknown): Record<string, string> {
  const obj = asObjectRecord(raw);
  const normalized: Record<string, string> = {};
  const pickString = (...keys: string[]) => {
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    return "";
  };

  const github = pickString("github");
  const wechatQr = pickString("wechatQr", "wechat_qr", "wechatQR", "wechat");
  const douyin = pickString("douyin");
  const bilibili = pickString("bilibili");
  const avatar = pickString("avatar");

  if (github) normalized.github = github;
  if (wechatQr) normalized.wechatQr = wechatQr;
  if (douyin) normalized.douyin = douyin;
  if (bilibili) normalized.bilibili = bilibili;
  if (avatar) normalized.avatar = avatar;

  return normalized;
}

function parseJsonRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return asObjectRecord(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function handleProfileGET(request: NextRequest) {
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
    const socialLinks = normalizeProfileSocialLinks(parseJsonRecord(profileData?.socialLinks ?? null));

    const avatarFromUser =
      typeof userData.avatar === "string" && userData.avatar.trim() !== "" ? userData.avatar.trim() : undefined;

    return NextResponse.json<ApiResponse<UserProfile>>({
      success: true,
      data: {
        id: profileData?.id || 0,
        userId: userData.id,
        displayName: userData.displayName ?? undefined,
        email: userData.email,
        avatar: avatarFromUser,
        firstName: profileData?.firstName ?? undefined,
        lastName: profileData?.lastName ?? undefined,
        phone: profileData?.phone ?? undefined,
        website: profileData?.website ?? undefined,
        location: profileData?.location ?? undefined,
        notifications: profileData?.notifications ? JSON.parse(profileData.notifications) : {},
        privacy: profileData?.privacy ? JSON.parse(profileData.privacy) : {},
        socialLinks,
        createdAt: profileData?.createdAt || new Date(),
        updatedAt: profileData?.updatedAt || new Date(),
      },
      message: "个人资料获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

async function handleProfilePOST(request: NextRequest) {
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
    const displayNameNormalized = body.displayName?.trim() || undefined;

    // 若本次要改邮箱，需先通过 change_email 验证码校验
    if (emailNormalized !== undefined) {
      const currentEmail = (
        await db.select({ email: users.email }).from(users).where(eq(users.id, decoded.userId)).limit(1)
      )[0]?.email;

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

    // 检查是否已存在个人资料
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

    let socialLinksRaw = normalizeProfileSocialLinks(body.socialLinks);
    // 与 users.avatar 对齐，避免 social_links 中残留旧默认图覆盖登录合并逻辑
    if (avatarNormalized !== undefined) {
      socialLinksRaw = { ...socialLinksRaw, avatar: avatarNormalized };
    }

    const [insertResult] = await db.insert(userProfiles).values({
      userId: decoded.userId,
      email: emailNormalized ?? null,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      website: body.website,
      location: body.location,
      notifications: body.notifications ? JSON.stringify(body.notifications) : null,
      privacy: body.privacy ? JSON.stringify(body.privacy) : null,
      socialLinks: Object.keys(socialLinksRaw).length > 0 ? JSON.stringify(socialLinksRaw) : null,
    });

    if (emailNormalized !== undefined) {
      await db.update(users).set({ email: emailNormalized, updatedAt: new Date() }).where(eq(users.id, decoded.userId));
    }
    if (avatarNormalized !== undefined) {
      await db
        .update(users)
        .set({ avatar: avatarNormalized, updatedAt: new Date() })
        .where(eq(users.id, decoded.userId));
    }
    if (displayNameNormalized !== undefined) {
      await db
        .update(users)
        .set({ displayName: displayNameNormalized, updatedAt: new Date() })
        .where(eq(users.id, decoded.userId));
    }

    logUserActivity({
      userId: decoded.userId,
      action: UserActivityAction.PROFILE_UPDATED,
      description: "创建个人资料",
      metadata: { phase: "create" },
      request,
    });

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
    throw error;
  }
}

async function handleProfilePUT(request: NextRequest) {
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
    const displayNameNormalized = body.displayName?.trim() || undefined;

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
      const currentEmail = (
        await db.select({ email: users.email }).from(users).where(eq(users.id, decoded.userId)).limit(1)
      )[0]?.email;

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

    // 更新个人资料
    const existingSocialLinks = existingProfile[0]?.socialLinks;
    let mergedSocialLinks: Record<string, unknown> = normalizeProfileSocialLinks(
      parseJsonRecord(existingSocialLinks ?? null)
    );
    if (body.socialLinks) {
      mergedSocialLinks = { ...mergedSocialLinks, ...normalizeProfileSocialLinks(body.socialLinks) };
    }
    if (avatarNormalized !== undefined) {
      mergedSocialLinks = { ...mergedSocialLinks, avatar: avatarNormalized };
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
        ...(emailNormalized !== undefined ? { email: emailNormalized } : {}),
      })
      .where(eq(userProfiles.userId, decoded.userId));

    if (emailNormalized !== undefined) {
      await db.update(users).set({ email: emailNormalized, updatedAt: new Date() }).where(eq(users.id, decoded.userId));
    }
    if (avatarNormalized !== undefined) {
      await db
        .update(users)
        .set({ avatar: avatarNormalized, updatedAt: new Date() })
        .where(eq(users.id, decoded.userId));
    }
    if (displayNameNormalized !== undefined) {
      await db
        .update(users)
        .set({ displayName: displayNameNormalized, updatedAt: new Date() })
        .where(eq(users.id, decoded.userId));
    }

    logUserActivity({
      userId: decoded.userId,
      action: UserActivityAction.PROFILE_UPDATED,
      description: "更新个人资料",
      metadata: { phase: "update", emailChanged: emailNormalized !== undefined },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "个人资料更新成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { GET, POST, PUT } = defineApiHandlers(
  {
    GET: handleProfileGET,
    POST: handleProfilePOST,
    PUT: handleProfilePUT,
  },
  {
    onError: (payload) => {
      notifyRouteUnhandledError(payload);
    },
    onUnhandledErrorResponse: ({ method }) =>
      NextResponse.json<ApiResponse>(
        {
          success: false,
          message: method === "GET" ? "获取个人资料失败" : method === "POST" ? "创建个人资料失败" : "更新个人资料失败",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      ),
  }
);
