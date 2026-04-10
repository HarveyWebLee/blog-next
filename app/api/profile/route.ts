/**
 * 个人资料API路由
 * 提供个人资料的增删改查接口
 *
 * GET /api/profile - 获取当前用户个人资料
 * POST /api/profile - 创建个人资料
 * PUT /api/profile - 更新个人资料
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import { verifyToken } from "@/lib/utils/auth";
import { ApiResponse, UpdateProfileRequest, UserProfile } from "@/types/blog";

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
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
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
        phone: profileData?.phone,
        website: profileData?.website,
        location: profileData?.location,
        timezone: profileData?.timezone,
        language: profileData?.language || "zh-CN",
        dateFormat: profileData?.dateFormat || "YYYY-MM-DD",
        timeFormat: profileData?.timeFormat || "24h",
        theme: profileData?.theme || "system",
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
    // 验证用户身份
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body: UpdateProfileRequest = await request.json();

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

    // 创建个人资料
    const newProfile = await db.insert(userProfiles).values({
      userId: decoded.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      website: body.website,
      location: body.location,
      timezone: body.timezone,
      language: body.language || "zh-CN",
      dateFormat: body.dateFormat || "YYYY-MM-DD",
      timeFormat: body.timeFormat || "24h",
      theme: body.theme || "system",
      notifications: body.notifications ? JSON.stringify(body.notifications) : null,
      privacy: body.privacy ? JSON.stringify(body.privacy) : null,
      socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: newProfile.insertId },
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
    // 验证用户身份
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body: UpdateProfileRequest = await request.json();

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

    // 更新个人资料
    await db
      .update(userProfiles)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        website: body.website,
        location: body.location,
        timezone: body.timezone,
        language: body.language,
        dateFormat: body.dateFormat,
        timeFormat: body.timeFormat,
        theme: body.theme,
        notifications: body.notifications ? JSON.stringify(body.notifications) : null,
        privacy: body.privacy ? JSON.stringify(body.privacy) : null,
        socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, decoded.userId));

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
