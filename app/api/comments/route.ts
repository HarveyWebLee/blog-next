/**
 * 博客评论
 *
 * GET  /api/comments?postId= — 公开读取某文章已通过（approved）评论，树形最多两层；不含邮箱/IP 等隐私字段。
 * POST /api/comments — 匿名或登录均可；登录时写入 authorId；可选 parentId 回复根评论（不可跨文章、不可再套一层）。
 *   提交成功（非 spam）后：根评论通知文章作者；回复额外通知被回复者（须有 authorId），写入 user_notifications。
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, posts, users } from "@/lib/db/schema";
import { jsonRateLimitError, localizedErrorResponse, localizedSuccessResponse } from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { getCommentById, listApprovedCommentsForPost } from "@/lib/services/comment.service";
import { notifyOnCommentSubmit } from "@/lib/services/notification.service";
import {
  getClientMetaFromRequest,
  logUserActivity,
  UserActivityAction,
} from "@/lib/services/user-activity-log.service";
import { detectSpamContent } from "@/lib/utils/comment-spam";
import { validateReplyParent } from "@/lib/utils/comment-tree";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";
import { checkRateLimit } from "@/lib/utils/request-rate-limit";

async function handleCommentsGET(request: NextRequest) {
  try {
    const postId = Number(new URL(request.url).searchParams.get("postId") || "");
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), { status: 400 });
    }

    const [postRow] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!postRow) {
      return NextResponse.json(localizedErrorResponse(request, "post.notFound"), { status: 404 });
    }

    const payload = await listApprovedCommentsForPost(postId);
    return NextResponse.json(localizedSuccessResponse(request, payload, "comment.listSuccess"));
  } catch (error) {
    throw error;
  }
}

async function handleCommentsPOST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      postId?: number;
      content?: string;
      authorName?: string;
      authorEmail?: string;
      parentId?: number | null;
    };

    const postId = Number(body.postId);
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const rawParentId = body.parentId;
    const parentId = rawParentId === null || rawParentId === undefined ? null : Number(rawParentId);

    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), { status: 400 });
    }

    if (!content || content.length > 8000) {
      return NextResponse.json(localizedErrorResponse(request, "comment.contentInvalid"), { status: 400 });
    }

    if (parentId != null && (!Number.isFinite(parentId) || parentId <= 0)) {
      return NextResponse.json(localizedErrorResponse(request, "comment.parentInvalid"), { status: 400 });
    }

    const [postRow] = await db
      .select({
        id: posts.id,
        allowComments: posts.allowComments,
        authorId: posts.authorId,
        slug: posts.slug,
        title: posts.title,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postRow) {
      return NextResponse.json(localizedErrorResponse(request, "post.notFound"), { status: 404 });
    }

    if (!postRow.allowComments) {
      return NextResponse.json(localizedErrorResponse(request, "comment.notAllowed"), { status: 403 });
    }

    let resolvedParentId: number | null = null;
    let parentAuthorId: number | null = null;
    if (parentId != null) {
      const parent = await getCommentById(parentId);
      if (!parent) {
        return NextResponse.json(localizedErrorResponse(request, "comment.parentNotFound"), { status: 400 });
      }
      // 软删占位不可再接回复；未通过审核的根评论也不开放回复入口
      if (parent.status === "deleted") {
        return NextResponse.json(localizedErrorResponse(request, "comment.parentDeleted"), { status: 400 });
      }
      if (parent.status !== "approved") {
        return NextResponse.json(localizedErrorResponse(request, "comment.parentNotFound"), { status: 400 });
      }
      const parentError = validateReplyParent({
        parentPostId: parent.postId,
        targetPostId: postId,
        parentIdOfParent: parent.parentId,
      });
      if (parentError === "parentCrossPost") {
        return NextResponse.json(localizedErrorResponse(request, "comment.parentCrossPost"), { status: 400 });
      }
      if (parentError === "parentDepthExceeded") {
        return NextResponse.json(localizedErrorResponse(request, "comment.parentDepthExceeded"), { status: 400 });
      }
      resolvedParentId = parent.id;
      parentAuthorId = parent.authorId;
    }

    const user = getAuthUserFromRequest(request);
    const { ipAddress, userAgent } = getClientMetaFromRequest(request);
    const limiterKey = user ? `comments:user:${user.userId}:post:${postId}` : `comments:ip:${ipAddress}:post:${postId}`;
    const limiter = checkRateLimit(limiterKey, 8, 60 * 1000);
    if (!limiter.allowed) {
      return jsonRateLimitError(request, limiter.retryAfterSeconds, "comment.submitRateLimit");
    }

    const spamCheck = detectSpamContent(content);
    let resolvedAuthorName: string | null = null;
    let resolvedAuthorEmail: string | null = null;

    if (user?.userId) {
      // 登录用户评论时，作者身份仅以服务端鉴权结果为准，避免前端伪造昵称/邮箱。
      const [authorRow] = await db
        .select({
          username: users.username,
          displayName: users.displayName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, user.userId))
        .limit(1);
      resolvedAuthorName = authorRow?.displayName?.trim() || authorRow?.username?.trim() || null;
      resolvedAuthorEmail = authorRow?.email?.trim() || null;
    } else {
      resolvedAuthorName = typeof body.authorName === "string" ? body.authorName.trim().slice(0, 100) || null : null;
      resolvedAuthorEmail = typeof body.authorEmail === "string" ? body.authorEmail.trim().slice(0, 100) || null : null;
    }

    const commentStatus = spamCheck.isSpam ? "spam" : "pending";
    const [insertResult] = await db.insert(comments).values({
      postId,
      parentId: resolvedParentId,
      authorId: user?.userId ?? null,
      authorName: resolvedAuthorName,
      authorEmail: resolvedAuthorEmail,
      content,
      // 评论默认待审核；命中反垃圾规则时直接标记 spam，减轻人工审核压力。
      status: commentStatus,
      ipAddress,
      userAgent,
    });
    const commentId = Number(insertResult.insertId);

    logUserActivity({
      userId: user?.userId ?? null,
      action: UserActivityAction.COMMENT_CREATED,
      metadata: {
        postId,
        commentId: Number.isFinite(commentId) ? commentId : undefined,
        parentId: resolvedParentId,
        status: commentStatus,
        spamReasons: spamCheck.reasons,
      },
      request,
    });

    // 通知失败不影响提交主流程（与关注通知一致）
    if (Number.isFinite(commentId) && commentId > 0) {
      await notifyOnCommentSubmit({
        commentId,
        postId,
        postSlug: postRow.slug,
        postTitle: postRow.title,
        postAuthorId: postRow.authorId,
        parentAuthorId,
        actorUserId: user?.userId ?? null,
        actorName: resolvedAuthorName || "Anonymous",
        content,
        isReply: resolvedParentId != null,
        status: commentStatus,
      });
    }

    return NextResponse.json(
      localizedSuccessResponse(request, null, spamCheck.isSpam ? "comment.submitSpam" : "comment.submitPending"),
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const { GET, POST } = defineApiHandlers(
  { GET: handleCommentsGET, POST: handleCommentsPOST },
  {
    onUnhandledErrorResponse: ({ request, method }) =>
      NextResponse.json(
        localizedErrorResponse(request, method === "GET" ? "comment.listFailed" : "comment.submitFailed"),
        { status: 500 }
      ),
  }
);
