/**
 * 通知API路由
 * 提供通知列表与创建接口（使用 user_notifications 表）
 *
 * GET /api/notifications - 获取通知列表（本人；超级管理员可按 userId 查询）
 * PUT /api/notifications - 批量标记已读（本人；超级管理员可按 userId 跨用户）
 * POST /api/notifications - 创建通知（本人可给自己创建；超级管理员可给任意用户创建）
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userNotifications } from "@/lib/db/schema";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, PaginatedResponseData, UserNotification } from "@/types/blog";

const NOTIFICATION_TYPES = new Set(["comment", "like", "follow", "mention", "system"]);

/**
 * GET /api/notifications
 * 获取通知列表
 * @tag 通知
 * @version 1.1.0
 */
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

    const isRoot = isJwtInMemorySuperRoot(auth.user);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const userIdQuery = searchParams.get("userId");
    const userIdFromQuery = userIdQuery ? parseInt(userIdQuery, 10) : NaN;
    const targetUserId =
      isRoot && Number.isFinite(userIdFromQuery) && userIdFromQuery > 0 ? userIdFromQuery : auth.user.userId;
    const offset = (page - 1) * limit;

    const whereConditions = [eq(userNotifications.userId, targetUserId)];
    if (type) {
      if (!NOTIFICATION_TYPES.has(type)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "无效的通知类型",
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      whereConditions.push(eq(userNotifications.type, type as (typeof userNotifications.$inferSelect)["type"]));
    }
    if (isRead === "true" || isRead === "false") {
      whereConditions.push(eq(userNotifications.isRead, isRead === "true"));
    }

    const whereClause = and(...whereConditions)!;
    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(userNotifications)
        .where(whereClause)
        .orderBy(desc(userNotifications.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(userNotifications).where(whereClause),
    ]);
    const total = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<UserNotification> = {
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        type: row.type,
        title: row.title,
        content: row.content ?? undefined,
        data: row.data ? JSON.parse(row.data) : undefined,
        isRead: row.isRead ?? false,
        readAt: row.readAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
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
      message: "获取通知列表成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    return NextResponse.json(
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

/**
 * PUT /api/notifications
 * 批量标记通知为已读
 * @tag 通知
 * @version 1.2.0
 */
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

    const body = (await request.json()) as { notificationIds?: number[]; markAllAsRead?: boolean; userId?: number };
    const isRoot = isJwtInMemorySuperRoot(auth.user);
    const targetUserId =
      isRoot && Number.isFinite(body.userId) && Number(body.userId) > 0 ? Number(body.userId) : auth.user.userId;

    if (body.markAllAsRead === true) {
      await db
        .update(userNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(userNotifications.userId, targetUserId), eq(userNotifications.isRead, false)));
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        message: "已全部标记为已读",
        timestamp: new Date().toISOString(),
      });
    }

    const ids = Array.isArray(body.notificationIds)
      ? body.notificationIds.filter((id) => Number.isInteger(id) && id > 0)
      : [];
    if (ids.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "请提供 notificationIds 或 markAllAsRead=true",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const candidates = await db
      .select({ id: userNotifications.id })
      .from(userNotifications)
      .where(eq(userNotifications.userId, targetUserId));
    const allowedIdSet = new Set(candidates.map((row) => row.id));
    const scopedIds = ids.filter((id) => allowedIdSet.has(id));
    if (scopedIds.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无可操作的通知",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    await db
      .update(userNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(userNotifications.userId, targetUserId),
          inArray(userNotifications.id, scopedIds),
          eq(userNotifications.isRead, false)
        )
      );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { updatedCount: scopedIds.length },
      message: "通知批量标记成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("批量标记通知失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "批量标记通知失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * 删除通知（支持清理已读）
 * @tag 通知
 * @version 1.3.0
 */
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

    const body = (await request.json().catch(() => ({}))) as {
      notificationIds?: number[];
      clearRead?: boolean;
      userId?: number;
    };
    const isRoot = isJwtInMemorySuperRoot(auth.user);
    const targetUserId =
      isRoot && Number.isFinite(body.userId) && Number(body.userId) > 0 ? Number(body.userId) : auth.user.userId;

    if (body.clearRead === true) {
      await db
        .delete(userNotifications)
        .where(and(eq(userNotifications.userId, targetUserId), eq(userNotifications.isRead, true)));
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        message: "已清理全部已读通知",
        timestamp: new Date().toISOString(),
      });
    }

    const ids = Array.isArray(body.notificationIds)
      ? body.notificationIds.filter((id) => Number.isInteger(id) && id > 0)
      : [];
    if (ids.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "请提供 notificationIds 或 clearRead=true",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    await db
      .delete(userNotifications)
      .where(and(eq(userNotifications.userId, targetUserId), inArray(userNotifications.id, ids)));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "通知删除成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("批量删除通知失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "批量删除通知失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 创建通知
 * @tag 通知
 * @version 1.1.0
 */
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

    const body = (await request.json()) as {
      title?: string;
      content?: string;
      type?: string;
      userId?: number;
      data?: Record<string, unknown>;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const isRoot = isJwtInMemorySuperRoot(auth.user);
    const targetUserId =
      isRoot && Number.isFinite(body.userId) && Number(body.userId) > 0 ? Number(body.userId) : auth.user.userId;

    // 验证必填字段
    if (!title || !type) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "标题和类型是必填项",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    if (!NOTIFICATION_TYPES.has(type)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的通知类型",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const [insertResult] = await db.insert(userNotifications).values({
      userId: targetUserId,
      type: type as (typeof userNotifications.$inferInsert)["type"],
      title,
      content: content || null,
      data: body.data ? JSON.stringify(body.data) : null,
      isRead: false,
    });
    const [created] = await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.id, Number(insertResult.insertId)))
      .limit(1);

    return NextResponse.json<ApiResponse<UserNotification>>(
      {
        success: true,
        data: {
          id: created.id,
          userId: created.userId,
          type: created.type,
          title: created.title,
          content: created.content ?? undefined,
          data: created.data ? JSON.parse(created.data) : undefined,
          isRead: created.isRead ?? false,
          readAt: created.readAt ?? undefined,
          createdAt: created.createdAt,
          updatedAt: created.createdAt,
        },
        message: "通知创建成功",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建通知失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "创建通知失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
