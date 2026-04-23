// 实现文章浏览次数增加

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { postService } from "@/lib/services/post.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { checkRateLimit } from "@/lib/utils/request-rate-limit";

async function handlePostViewPOST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json(createErrorResponse("无效的文章ID"), { status: 400 });
  }

  const [postRow] = await db
    .select({ id: posts.id, status: posts.status, visibility: posts.visibility })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!postRow) {
    return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
  }
  if (postRow.status !== "published" || postRow.visibility === "private") {
    return NextResponse.json(createErrorResponse("该文章当前不可访问"), { status: 403 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) || request.headers.get("x-real-ip") || "unknown";
  const limiter = checkRateLimit(`view:ip:${clientIp}:post:${postId}`, 60, 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json(createErrorResponse(`请求过于频繁，请 ${limiter.retryAfterSeconds} 秒后重试`), {
      status: 429,
      headers: { "Retry-After": String(limiter.retryAfterSeconds) },
    });
  }

  postService.incrementViewCount(postId).catch((error) => {
    logger.warn("api/posts/[id]/view", "incrementViewCount 异步失败", { postId, err: String(error) });
  });
  // 返回成功响应
  return NextResponse.json(createSuccessResponse(true, "增加浏览次数成功"), {
    status: 200,
  });
}

export const { POST } = defineApiHandlers({ POST: handlePostViewPOST });
