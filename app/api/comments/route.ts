/**
 * 博客评论提交
 *
 * POST /api/comments — 匿名或登录均可；登录时写入 authorId。
 * 成功后写入用户活动（登录用户归入其活动流；访客 user_id 为空）。
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, posts, users } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import {
  getClientMetaFromRequest,
  logUserActivity,
  UserActivityAction,
} from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";
import { checkRateLimit } from "@/lib/utils/request-rate-limit";

function detectSpamContent(content: string): { isSpam: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const normalized = content.toLowerCase();
  const suspiciousKeywords = ["viagra", "casino", "loan", "bitcoin", "http://", "https://", "telegram", "whatsapp"];
  const hitKeywords = suspiciousKeywords.filter((kw) => normalized.includes(kw));
  if (hitKeywords.length >= 2) {
    reasons.push("命中多个高风险关键词");
  }
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount >= 2) {
    reasons.push("包含过多链接");
  }
  if (content.length > 2000) {
    reasons.push("内容长度异常");
  }
  return { isSpam: reasons.length > 0, reasons };
}

async function handleCommentsPOST(request: NextRequest) {
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

    await db.insert(comments).values({
      postId,
      authorId: user?.userId ?? null,
      authorName: resolvedAuthorName,
      authorEmail: resolvedAuthorEmail,
      content,
      // 评论默认待审核；命中反垃圾规则时直接标记 spam，减轻人工审核压力。
      status: spamCheck.isSpam ? "spam" : "pending",
      ipAddress,
      userAgent,
    });

    logUserActivity({
      userId: user?.userId ?? null,
      action: UserActivityAction.COMMENT_CREATED,
      metadata: { postId, status: spamCheck.isSpam ? "spam" : "pending", spamReasons: spamCheck.reasons },
      request,
    });

    return NextResponse.json(
      createSuccessResponse(
        null,
        spamCheck.isSpam ? "评论已提交，系统已进入风控审核队列" : "评论提交成功，审核通过后将展示"
      ),
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers(
  { POST: handleCommentsPOST },
  { onUnhandledErrorResponse: () => NextResponse.json(createErrorResponse("评论提交失败"), { status: 500 }) }
);
