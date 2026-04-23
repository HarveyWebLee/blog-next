import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";
import type { ApiResponse, CommentStatus } from "@/types/blog";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/comments/:id
 * 更新评论审核状态（pending/approved/spam）
 */
async function handleAdminCommentByIdPATCH(request: NextRequest, context: RouteContext) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  const id = parseInt((await context.params).id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "无效的评论 ID", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { status?: CommentStatus; reason?: string };
  const nextStatus = body.status;
  if (!nextStatus || !["pending", "approved", "spam"].includes(nextStatus)) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "status 必须为 pending/approved/spam", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const [exists] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1);
    if (!exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "评论不存在", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    await db.update(comments).set({ status: nextStatus, updatedAt: new Date() }).where(eq(comments.id, id));
    logUserActivity({
      userId: gate.user.userId,
      action: UserActivityAction.COMMENT_MODERATED,
      description: `审核评论 #${id}`,
      metadata: {
        commentId: id,
        status: nextStatus,
        reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : undefined,
      },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id, status: nextStatus },
      message: "评论状态更新成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * DELETE /api/admin/comments/:id
 * 删除单条评论（仅超级管理员可访问）
 */
async function handleAdminCommentByIdDELETE(request: NextRequest, context: RouteContext) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  const id = parseInt((await context.params).id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "无效的评论 ID", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const [exists] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1);
    if (!exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "评论不存在", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    await db.delete(comments).where(eq(comments.id, id));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id },
      message: "评论删除成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { PATCH, DELETE } = defineApiHandlers(
  {
    PATCH: handleAdminCommentByIdPATCH,
    DELETE: handleAdminCommentByIdDELETE,
  },
  {
    onError: (payload) => notifyRouteUnhandledError(payload),
    onUnhandledErrorResponse: ({ method }) =>
      NextResponse.json<ApiResponse>(
        {
          success: false,
          message: method === "PATCH" ? "更新评论状态失败" : "删除评论失败",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      ),
  }
);
