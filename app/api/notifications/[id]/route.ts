/**
 * 单个通知API路由
 * 提供指定ID通知的增删改查接口（使用 user_notifications 表）
 *
 * GET /api/notifications/[id] - 获取通知详情（本人；超级管理员可跨用户）
 * PUT /api/notifications/[id] - 更新通知（本人；超级管理员可跨用户）
 * DELETE /api/notifications/[id] - 删除通知（本人；超级管理员可跨用户）
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userNotifications } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, UserNotification } from "@/types/blog";

const NOTIFICATION_TYPES = new Set(["comment", "like", "follow", "mention", "system"]);

async function getScopedNotification(notificationId: number, request: NextRequest) {
  const auth = requireAuthUser(request);
  if (!auth.ok) {
    return {
      ok: false as const,
      response: NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }
  const [row] = await db.select().from(userNotifications).where(eq(userNotifications.id, notificationId)).limit(1);
  if (!row) {
    return {
      ok: false as const,
      response: NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "通知不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      ),
    };
  }
  const isRoot = isJwtInMemorySuperRoot(auth.user);
  if (!isRoot && row.userId !== auth.user.userId) {
    return {
      ok: false as const,
      response: NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无权访问该通知",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true as const, auth: auth.user, notification: row };
}

/**
 * GET /api/notifications/[id]
 * 获取通知详情
 * @tag 通知
 * @version 1.1.0
 */
async function handleNotificationByIdGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的通知ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const scoped = await getScopedNotification(notificationId, request);
    if (!scoped.ok) {
      return scoped.response;
    }
    const row = scoped.notification;
    const notification: UserNotification = {
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
    };

    return NextResponse.json<ApiResponse<UserNotification>>({
      success: true,
      data: notification,
      message: "获取通知详情成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * PUT /api/notifications/[id]
 * 更新通知
 * @tag 通知
 * @version 1.1.0
 */
async function handleNotificationByIdPUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notificationId = parseInt(id);
    const scoped = await getScopedNotification(notificationId, request);
    if (!scoped.ok) {
      return scoped.response;
    }
    const row = scoped.notification;
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      type?: string;
      isRead?: boolean;
      data?: Record<string, unknown>;
    };

    if (isNaN(notificationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的通知ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const patch: Partial<typeof userNotifications.$inferInsert> = {};
    if (typeof body.title === "string") {
      patch.title = body.title.trim();
    }
    if (typeof body.content === "string") {
      patch.content = body.content.trim() || null;
    }
    if (typeof body.type === "string") {
      if (!NOTIFICATION_TYPES.has(body.type)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "无效的通知类型",
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      patch.type = body.type as (typeof userNotifications.$inferInsert)["type"];
    }
    if (typeof body.isRead === "boolean") {
      patch.isRead = body.isRead;
      patch.readAt = body.isRead ? new Date() : null;
    }
    if (body.data !== undefined) {
      patch.data = body.data ? JSON.stringify(body.data) : null;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供可更新字段",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    await db.update(userNotifications).set(patch).where(eq(userNotifications.id, row.id));
    const [updated] = await db.select().from(userNotifications).where(eq(userNotifications.id, row.id)).limit(1);

    return NextResponse.json<ApiResponse<UserNotification>>({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        type: updated.type,
        title: updated.title,
        content: updated.content ?? undefined,
        data: updated.data ? JSON.parse(updated.data) : undefined,
        isRead: updated.isRead ?? false,
        readAt: updated.readAt ?? undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.createdAt,
      },
      message: "通知更新成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * DELETE /api/notifications/[id]
 * 删除通知
 * @tag 通知
 * @version 1.1.0
 */
async function handleNotificationByIdDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "无效的通知ID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const scoped = await getScopedNotification(notificationId, request);
    if (!scoped.ok) {
      return scoped.response;
    }

    await db.delete(userNotifications).where(eq(userNotifications.id, notificationId));
    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "通知删除成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { GET, PUT, DELETE } = defineApiHandlers(
  {
    GET: handleNotificationByIdGET,
    PUT: handleNotificationByIdPUT,
    DELETE: handleNotificationByIdDELETE,
  },
  {
    onError: (payload) => {
      notifyRouteUnhandledError(payload);
    },
    onUnhandledErrorResponse: ({ method }) => {
      const messageMap: Record<string, string> = {
        GET: "获取通知详情失败",
        PUT: "更新通知失败",
        DELETE: "删除通知失败",
      };
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: messageMap[method] || "通知处理失败",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    },
  }
);
