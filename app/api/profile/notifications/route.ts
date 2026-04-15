/**
 * 用户通知API路由
 * 提供用户通知的管理接口
 *
 * GET /api/profile/notifications - 获取用户通知列表
 * PUT /api/profile/notifications - 标记通知为已读
 * DELETE /api/profile/notifications - 删除通知
 */

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, SQL } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userNotifications } from "@/lib/db/schema";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, NotificationQueryParams, PaginatedResponseData, UserNotification } from "@/types/blog";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const offset = (page - 1) * limit;

    // 构建查询条件（and() 在部分类型定义下可能为 SQL | undefined，此处用非空断言收窄）
    let whereConditions: SQL = eq(userNotifications.userId, decoded.userId);

    if (type) {
      whereConditions = and(whereConditions, eq(userNotifications.type, type as any))!;
    }

    if (isRead === "true" || isRead === "false") {
      whereConditions = and(whereConditions, eq(userNotifications.isRead, isRead === "true"))!;
    }

    // 获取通知列表
    const notifications = await db
      .select()
      .from(userNotifications)
      .where(whereConditions)
      .orderBy(desc(userNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db.select({ count: userNotifications.id }).from(userNotifications).where(whereConditions);

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<UserNotification> = {
      data: notifications.map((notification) => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        content: notification.content ?? undefined,
        data: notification.data ? JSON.parse(notification.data) : undefined,
        isRead: notification.isRead ?? false,
        readAt: notification.readAt ?? undefined,
        createdAt: notification.createdAt,
        updatedAt: notification.createdAt,
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

    return NextResponse.json<ApiResponse<PaginatedResponseData<UserNotification>>>({
      success: true,
      data: responseData,
      message: "通知列表获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取通知列表失败",
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

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // 标记所有通知为已读
      await db
        .update(userNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(and(eq(userNotifications.userId, decoded.userId), eq(userNotifications.isRead, false)));
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 标记指定通知为已读
      await db
        .update(userNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(and(eq(userNotifications.userId, decoded.userId), inArray(userNotifications.id, notificationIds)));
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "请提供要标记的通知ID或设置markAllAsRead为true",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "通知标记成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("标记通知失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "标记通知失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "通知ID不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 删除通知
    await db
      .delete(userNotifications)
      .where(and(eq(userNotifications.userId, decoded.userId), eq(userNotifications.id, parseInt(notificationId))));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "通知删除成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("删除通知失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "删除通知失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
