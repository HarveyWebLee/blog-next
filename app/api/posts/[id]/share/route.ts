/**
 * POST /api/posts/{id}/share
 * 前端点击「分享文章」时打点：写入用户活动（可选登录；匿名则 user_id 为空）。
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";
import { checkRateLimit } from "@/lib/utils/request-rate-limit";

async function handlePostSharePOST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), { status: 400 });
    }

    const [row] = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        status: posts.status,
        visibility: posts.visibility,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!row) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
    }
    if (row.status !== "published" || row.visibility === "private") {
      return NextResponse.json(createErrorResponse("该文章当前不可分享"), { status: 403 });
    }

    const user = getAuthUserFromRequest(request);
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp =
      (forwarded ? forwarded.split(",")[0]?.trim() : null) || request.headers.get("x-real-ip") || "unknown";
    const limiterKey = user ? `share:user:${user.userId}:post:${postId}` : `share:ip:${clientIp}:post:${postId}`;
    const limiter = checkRateLimit(limiterKey, 30, 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json(createErrorResponse(`分享操作过于频繁，请 ${limiter.retryAfterSeconds} 秒后重试`), {
        status: 429,
        headers: { "Retry-After": String(limiter.retryAfterSeconds) },
      });
    }

    logUserActivity({
      userId: user?.userId ?? null,
      action: UserActivityAction.POST_SHARED,
      description: row.title ?? undefined,
      metadata: { postId: row.id, slug: row.slug },
      request,
    });

    return NextResponse.json(createSuccessResponse({ postId: row.id }, "已记录分享"), { status: 200 });
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers(
  { POST: handlePostSharePOST },
  { onUnhandledErrorResponse: () => NextResponse.json(createErrorResponse("记录分享失败"), { status: 500 }) }
);
