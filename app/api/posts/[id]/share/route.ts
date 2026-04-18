/**
 * POST /api/posts/{id}/share
 * 前端点击「分享文章」时打点：写入用户活动（可选登录；匿名则 user_id 为空）。
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts } from "@/lib/db/schema";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), { status: 400 });
    }

    const [row] = await db
      .select({ id: posts.id, slug: posts.slug, title: posts.title })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!row) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
    }

    const user = getAuthUserFromRequest(request);
    logUserActivity({
      userId: user?.userId ?? null,
      action: UserActivityAction.POST_SHARED,
      description: row.title ?? undefined,
      metadata: { postId: row.id, slug: row.slug },
      request,
    });

    return NextResponse.json(createSuccessResponse({ postId: row.id }, "已记录分享"), { status: 200 });
  } catch (error) {
    console.error("[POST /api/posts/[id]/share]", error);
    return NextResponse.json(createErrorResponse("记录分享失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}
