/**
 * POST /api/posts/{id}/share
 * 前端点击「分享文章」时打点：写入用户活动（可选登录；匿名则 user_id 为空）。
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
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
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), { status: 400 });
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
      return NextResponse.json(localizedErrorResponse(request, "post.notFound"), { status: 404 });
    }
    if (row.status !== "published" || row.visibility === "private") {
      return NextResponse.json(localizedErrorResponse(request, "post.notShareable"), { status: 403 });
    }

    const user = getAuthUserFromRequest(request);
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp =
      (forwarded ? forwarded.split(",")[0]?.trim() : null) || request.headers.get("x-real-ip") || "unknown";
    const limiterKey = user ? `share:user:${user.userId}:post:${postId}` : `share:ip:${clientIp}:post:${postId}`;
    const limiter = checkRateLimit(limiterKey, 30, 60 * 1000);
    if (!limiter.allowed) {
      return jsonRateLimitError(request, limiter.retryAfterSeconds, "post.shareRateLimit");
    }

    logUserActivity({
      userId: user?.userId ?? null,
      action: UserActivityAction.POST_SHARED,
      description: row.title ?? undefined,
      metadata: { postId: row.id, slug: row.slug },
      request,
    });

    return NextResponse.json(localizedSuccessResponse(request, { postId: row.id }, "post.shareRecorded"), {
      status: 200,
    });
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers(
  { POST: handlePostSharePOST },
  {
    onUnhandledErrorResponse: ({ request }) =>
      NextResponse.json(localizedErrorResponse(request, "post.shareFailed"), { status: 500 }),
  }
);
