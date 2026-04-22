/**
 * 博客评论提交
 *
 * POST /api/comments — 匿名或登录均可；登录时写入 authorId。
 * 成功后写入用户活动（登录用户归入其活动流；访客 user_id 为空）。
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, posts } from "@/lib/db/schema";
import {
  getClientMetaFromRequest,
  logUserActivity,
  UserActivityAction,
} from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";
import { checkRateLimit } from "@/lib/utils/request-rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      postId?: number;
      content?: string;
      authorName?: string;
      authorEmail?: string;
    };

    const postId = Number(body.postId);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), { status: 400 });
    }

    if (!content || content.length > 8000) {
      return NextResponse.json(createErrorResponse("评论内容长度不符合要求"), { status: 400 });
    }

    const [postRow] = await db
      .select({ id: posts.id, allowComments: posts.allowComments })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postRow) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
    }

    if (!postRow.allowComments) {
      return NextResponse.json(createErrorResponse("该文章未开放评论"), { status: 403 });
    }

    const user = getAuthUserFromRequest(request);
    const { ipAddress, userAgent } = getClientMetaFromRequest(request);
    const limiterKey = user ? `comments:user:${user.userId}:post:${postId}` : `comments:ip:${ipAddress}:post:${postId}`;
    const limiter = checkRateLimit(limiterKey, 8, 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json(createErrorResponse(`提交过于频繁，请 ${limiter.retryAfterSeconds} 秒后重试`), {
        status: 429,
        headers: { "Retry-After": String(limiter.retryAfterSeconds) },
      });
    }

    await db.insert(comments).values({
      postId,
      authorId: user?.userId ?? null,
      authorName: typeof body.authorName === "string" ? body.authorName.trim().slice(0, 100) || null : null,
      authorEmail: typeof body.authorEmail === "string" ? body.authorEmail.trim().slice(0, 100) || null : null,
      content,
      status: "approved",
      ipAddress,
      userAgent,
    });

    logUserActivity({
      userId: user?.userId ?? null,
      action: UserActivityAction.COMMENT_CREATED,
      metadata: { postId },
      request,
    });

    return NextResponse.json(createSuccessResponse(null, "评论提交成功"), { status: 201 });
  } catch (error) {
    console.error("[POST /api/comments]", error);
    return NextResponse.json(createErrorResponse("评论提交失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}
