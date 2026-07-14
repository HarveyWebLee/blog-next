import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, posts, users } from "@/lib/db/schema";
import { apiMessage } from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { deleteCommentsPreferSoftParent } from "@/lib/services/comment.service";
import { notifyOnCommentModeration } from "@/lib/services/notification.service";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";
import type { ApiResponse, CommentStatus, PaginatedResponseData } from "@/types/blog";

type AdminCommentRow = {
  id: number;
  postId: number;
  postTitle: string | null;
  authorId: number | null;
  authorName: string | null;
  content: string;
  status: CommentStatus;
  createdAt: Date;
};

/**
 * GET /api/admin/comments?page=&limit=&status=&q=&authorId=&postId=&dateFrom=&dateTo=
 * 评论审核列表（仅超级管理员可访问）
 */
async function handleAdminCommentsGET(request: NextRequest) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;
    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const authorId = Number(searchParams.get("authorId") || "");
    const postId = Number(searchParams.get("postId") || "");
    const dateFrom = (searchParams.get("dateFrom") || "").trim();
    const dateTo = (searchParams.get("dateTo") || "").trim();
    const validStatuses: CommentStatus[] = ["pending", "approved", "spam", "deleted"];

    const whereConditions = [];
    if (validStatuses.includes(status as CommentStatus)) {
      whereConditions.push(eq(comments.status, status as CommentStatus));
    }
    if (q) {
      const keyword = `%${q.replace(/[%_\\]/g, "")}%`;
      whereConditions.push(or(like(comments.content, keyword), like(posts.title, keyword)));
    }
    if (Number.isInteger(authorId) && authorId > 0) {
      whereConditions.push(eq(comments.authorId, authorId));
    }
    if (Number.isInteger(postId) && postId > 0) {
      whereConditions.push(eq(comments.postId, postId));
    }
    if (dateFrom) {
      const start = new Date(dateFrom);
      if (!Number.isNaN(start.getTime())) {
        whereConditions.push(gte(comments.createdAt, start));
      }
    }
    if (dateTo) {
      const end = new Date(dateTo);
      if (!Number.isNaN(end.getTime())) {
        whereConditions.push(lte(comments.createdAt, end));
      }
    }
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    const [rows, totalRows] = await Promise.all([
      db
        .select({
          id: comments.id,
          postId: comments.postId,
          postTitle: posts.title,
          authorId: comments.authorId,
          authorName: users.displayName,
          content: comments.content,
          status: comments.status,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .leftJoin(posts, eq(comments.postId, posts.id))
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ c: count() }).from(comments).leftJoin(posts, eq(comments.postId, posts.id)).where(whereClause),
    ]);

    const total = Number(totalRows[0]?.c ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const data: AdminCommentRow[] = rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      postTitle: row.postTitle,
      authorId: row.authorId,
      authorName: row.authorName || null,
      content: row.content,
      status: row.status as CommentStatus,
      createdAt: row.createdAt,
    }));

    const payload: PaginatedResponseData<AdminCommentRow> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponseData<AdminCommentRow>>>({
      success: true,
      data: payload,
      message: apiMessage(request, "admin.commentsListSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * PATCH /api/admin/comments
 * 批量更新评论审核状态（仅超级管理员可访问）
 * Body: { ids: number[]; status: "pending" | "approved" | "spam"; reason?: string }
 * approved/spam 时对有 authorId 的评论作者写入站内通知。
 */
async function handleAdminCommentsPATCH(request: NextRequest) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { ids?: number[]; status?: CommentStatus; reason?: string };
  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)))
    : [];
  const rawStatus = body.status;
  if (ids.length === 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: apiMessage(request, "admin.idsRequired"), timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }
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
    const exists = await db
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
      .where(inArray(comments.id, ids));
    if (exists.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: apiMessage(request, "admin.commentNotFound"), timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }
    const existingIds = exists.map((item) => item.id);
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : undefined;

    await db
      .update(comments)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(inArray(comments.id, existingIds));

    logUserActivity({
      userId: gate.user.userId,
      action: UserActivityAction.COMMENT_BATCH_MODERATED,
      description: `批量审核评论（${existingIds.length} 条）`,
      metadata: {
        ids: existingIds,
        status: nextStatus,
        reason,
      },
      request,
    });

    await Promise.all(
      exists.map((row) =>
        notifyOnCommentModeration({
          commentId: row.id,
          postId: row.postId,
          postSlug: row.postSlug || "",
          postTitle: row.postTitle || "",
          commentAuthorId: row.authorId,
          nextStatus,
          previousStatus: row.status as CommentStatus,
          reason,
        })
      )
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { ids: existingIds, status: nextStatus, updatedCount: existingIds.length },
      message: apiMessage(request, "admin.batchCommentUpdateSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * DELETE /api/admin/comments
 * 批量删除评论（仅超级管理员可访问）
 * Body: { ids: number[] }
 * 若根评论仍有未删除子评论则软删为 deleted 占位；否则硬删。写入 COMMENT_BATCH_DELETED 审计。
 */
async function handleAdminCommentsDELETE(request: NextRequest) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: gate.message, timestamp: new Date().toISOString() },
      { status: gate.status }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { ids?: number[] };
  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)))
    : [];
  if (ids.length === 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: apiMessage(request, "admin.idsRequired"), timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const { softDeletedIds, hardDeletedIds } = await deleteCommentsPreferSoftParent(ids);
    if (softDeletedIds.length === 0 && hardDeletedIds.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: apiMessage(request, "admin.commentNotFound"), timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const allIds = [...softDeletedIds, ...hardDeletedIds];
    logUserActivity({
      userId: gate.user.userId,
      action: UserActivityAction.COMMENT_BATCH_DELETED,
      description: `批量删除评论（硬删 ${hardDeletedIds.length} / 软删占位 ${softDeletedIds.length}）`,
      metadata: { ids: allIds, softDeletedIds, hardDeletedIds },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ids: allIds,
        deletedCount: allIds.length,
        softDeletedIds,
        hardDeletedIds,
      },
      message: apiMessage(request, "admin.batchCommentDeleteSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { GET, PATCH, DELETE } = defineApiHandlers(
  {
    GET: handleAdminCommentsGET,
    PATCH: handleAdminCommentsPATCH,
    DELETE: handleAdminCommentsDELETE,
  },
  {
    onError: (payload) => notifyRouteUnhandledError(payload),
    onUnhandledErrorResponse: ({ method }) => {
      const map: Record<string, string> = {
        GET: "获取评论审核列表失败",
        PATCH: "批量更新评论状态失败",
        DELETE: "批量删除评论失败",
      };
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: map[method] || "评论管理处理失败",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    },
  }
);
