/**
 * GET/POST /api/posts/{id}/like
 * 匿名可读总数；登录可读是否已赞。POST 切换点赞并维护 `posts.like_count`。
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts, userPostLikes } from "@/lib/db/schema";
import { localizedErrorFromRaw, localizedErrorResponse, localizedSuccessResponse } from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse, toJsonSafeInt } from "@/lib/utils";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import type { AuthJwtPayload } from "@/lib/utils/request-auth";
import { requireAuthUser } from "@/lib/utils/request-auth";

async function getLikeCount(postId: number): Promise<number> {
  const rows = await db.select({ likeCount: posts.likeCount }).from(posts).where(eq(posts.id, postId)).limit(1);
  return toJsonSafeInt(rows[0]?.likeCount, 0);
}

function canInteractPost(
  post: { status: string | null; visibility: string | null; authorId: number },
  authUser?: AuthJwtPayload
): boolean {
  if (post.status !== "published")
    return Boolean(authUser && (authUser.userId === post.authorId || isJwtInMemorySuperRoot(authUser)));
  if (post.visibility !== "private") return true;
  return Boolean(authUser && (authUser.userId === post.authorId || isJwtInMemorySuperRoot(authUser)));
}

async function handlePostLikeGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), { status: 400 });
    }

    const postRows = await db
      .select({ id: posts.id, authorId: posts.authorId, status: posts.status, visibility: posts.visibility })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (postRows.length === 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.notFound"), { status: 404 });
    }

    const auth = requireAuthUser(request);
    if (!auth.ok) {
      if (!canInteractPost(postRows[0])) {
        return NextResponse.json(localizedErrorResponse(request, "post.notInteractive"), { status: 403 });
      }
      const likeCount = await getLikeCount(postId);
      return NextResponse.json(
        localizedSuccessResponse(request, { liked: false, likeCount }, "post.likeStatusSuccess"),
        {
          status: 200,
        }
      );
    }
    if (!canInteractPost(postRows[0], auth.user)) {
      return NextResponse.json(localizedErrorResponse(request, "post.notInteractive"), { status: 403 });
    }

    const likedRows = await db
      .select({ userId: userPostLikes.userId })
      .from(userPostLikes)
      .where(and(eq(userPostLikes.userId, auth.user.userId), eq(userPostLikes.postId, postId)))
      .limit(1);
    const likeCount = await getLikeCount(postId);

    return NextResponse.json(
      localizedSuccessResponse(request, { liked: likedRows.length > 0, likeCount }, "post.likeStatusSuccess"),
      { status: 200 }
    );
  } catch (error) {
    throw error;
  }
}

async function handlePostLikePOST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(localizedErrorResponse(request, "common.pleaseLogin"), { status: 401 });
    }

    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), { status: 400 });
    }

    const postRows = await db
      .select({ id: posts.id, authorId: posts.authorId, status: posts.status, visibility: posts.visibility })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (postRows.length === 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.notFound"), { status: 404 });
    }
    if (!canInteractPost(postRows[0], auth.user)) {
      return NextResponse.json(localizedErrorResponse(request, "post.notInteractive"), { status: 403 });
    }

    const likedRows = await db
      .select({ userId: userPostLikes.userId })
      .from(userPostLikes)
      .where(and(eq(userPostLikes.userId, auth.user.userId), eq(userPostLikes.postId, postId)))
      .limit(1);

    let liked = false;
    if (likedRows.length > 0) {
      await db
        .delete(userPostLikes)
        .where(and(eq(userPostLikes.userId, auth.user.userId), eq(userPostLikes.postId, postId)));
      const [row] = await db.select({ likeCount: posts.likeCount }).from(posts).where(eq(posts.id, postId)).limit(1);
      const cur = toJsonSafeInt(row?.likeCount, 0);
      await db
        .update(posts)
        .set({
          likeCount: Math.max(cur - 1, 0),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));
      liked = false;
    } else {
      // 显式写入 created_at：部分 MySQL 版本对 timestamp 表达式默认值支持不一致，避免 NOT NULL 无默认导致 INSERT 失败
      await db.insert(userPostLikes).values({
        userId: auth.user.userId,
        postId,
        createdAt: new Date(),
      });
      const [row] = await db.select({ likeCount: posts.likeCount }).from(posts).where(eq(posts.id, postId)).limit(1);
      const cur = toJsonSafeInt(row?.likeCount, 0);
      await db
        .update(posts)
        .set({
          likeCount: cur + 1,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));
      liked = true;
    }

    const likeCount = await getLikeCount(postId);
    logUserActivity({
      userId: auth.user.userId,
      action: liked ? UserActivityAction.POST_LIKED : UserActivityAction.POST_UNLIKED,
      metadata: { postId, likeCount },
      request,
    });
    return NextResponse.json(
      localizedSuccessResponse(request, { liked, likeCount }, liked ? "post.likeSuccess" : "post.unlikeSuccess"),
      { status: 200 }
    );
  } catch (error) {
    throw error;
  }
}

export const { GET, POST } = defineApiHandlers(
  {
    GET: handlePostLikeGET,
    POST: handlePostLikePOST,
  },
  {
    onUnhandledErrorResponse: ({ request, method }) =>
      NextResponse.json(
        localizedErrorResponse(request, method === "GET" ? "post.likeStatusFailed" : "post.likeFailed"),
        { status: 500 }
      ),
  }
);
