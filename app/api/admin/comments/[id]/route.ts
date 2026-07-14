/**
 * 单条评论审核
 *
 * PATCH  /api/admin/comments/:id — 更新审核状态；approved/spam 时通知评论作者（有 authorId）。
 * DELETE /api/admin/comments/:id — 删除单条评论（有子评论则软删占位，否则硬删；写审计）。
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, posts } from "@/lib/db/schema";
import { apiMessage } from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { deleteCommentsPreferSoftParent } from "@/lib/services/comment.service";
import { notifyOnCommentModeration } from "@/lib/services/notification.service";
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
      { success: false, message: apiMessage(request, "admin.invalidCommentId"), timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { status?: CommentStatus; reason?: string };
  const rawStatus = body.status;
  if (!rawStatus || !["pending", "approved", "spam"].includes(rawStatus)) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: apiMessage(request, "admin.invalidCommentStatus"),
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
  const nextStatus = rawStatus as "pending" | "approved" | "spam";

  try {
    const [exists] = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        status: comments.status,
        postSlug: posts.slug,
        postTitle: posts.title,
      })
      .from(comments)
      .leftJoin(posts, eq(comments.postId, posts.id))
      .where(eq(comments.id, id))
      .limit(1);
    if (!exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: apiMessage(request, "admin.commentNotFound"), timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const previousStatus = exists.status as CommentStatus;
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : undefined;

    await db.update(comments).set({ status: nextStatus, updatedAt: new Date() }).where(eq(comments.id, id));
    logUserActivity({
      userId: gate.user.userId,
      action: UserActivityAction.COMMENT_MODERATED,
      description: `审核评论 #${id}`,
      metadata: {
        commentId: id,
        status: nextStatus,
        previousStatus,
        reason,
      },
      request,
    });

    await notifyOnCommentModeration({
      commentId: id,
      postId: exists.postId,
      postSlug: exists.postSlug || "",
      postTitle: exists.postTitle || "",
      commentAuthorId: exists.authorId,
      nextStatus,
      previousStatus,
      reason,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id, status: nextStatus },
      message: apiMessage(request, "admin.commentUpdateSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * DELETE /api/admin/comments/:id
 * 删除单条评论：有未删子评论则软删占位，否则硬删。
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
      { success: false, message: apiMessage(request, "admin.invalidCommentId"), timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const { softDeletedIds, hardDeletedIds } = await deleteCommentsPreferSoftParent([id]);
    if (softDeletedIds.length === 0 && hardDeletedIds.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: apiMessage(request, "admin.commentNotFound"), timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const mode = softDeletedIds.includes(id) ? "soft" : "hard";
    logUserActivity({
      userId: gate.user.userId,
      action: UserActivityAction.COMMENT_DELETED,
      description: mode === "soft" ? `软删评论 #${id}（保留子评论占位）` : `硬删评论 #${id}`,
      metadata: { commentId: id, mode, softDeletedIds, hardDeletedIds },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id, mode, softDeletedIds, hardDeletedIds },
      message: apiMessage(request, "admin.commentDeleteSuccess"),
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
