/**
 * 用户活动日志API路由
 * 提供用户活动日志的管理接口
 *
 * GET /api/profile/activities - 获取用户活动日志
 * POST /api/profile/activities - 记录用户活动
 */

import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userActivities } from "@/lib/db/schema";
import { verifyToken } from "@/lib/utils/auth";
import { ApiResponse, PaginatedResponseData, UserActivity } from "@/types/blog";

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = eq(userActivities.userId, decoded.userId);

    if (action) {
      whereConditions = eq(userActivities.action, action);
    }

    // 获取活动日志
    const activities = await db
      .select()
      .from(userActivities)
      .where(whereConditions)
      .orderBy(desc(userActivities.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db.select({ count: userActivities.id }).from(userActivities).where(whereConditions);

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<UserActivity> = {
      data: activities.map((activity) => ({
        id: activity.id,
        userId: activity.userId,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : undefined,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponseData<UserActivity>>>({
      success: true,
      data: responseData,
      message: "活动日志获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取活动日志失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取活动日志失败",
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

    const body = await request.json();
    const { action, description, metadata } = body;

    if (!action) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "活动类型不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 获取客户端信息
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 记录活动
    const newActivity = await db.insert(userActivities).values({
      userId: decoded.userId,
      action,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: newActivity.insertId },
        message: "活动记录成功",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("记录活动失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "记录活动失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
