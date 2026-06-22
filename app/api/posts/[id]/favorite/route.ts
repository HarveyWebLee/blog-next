/**
 * GET/POST /api/posts/{id}/favorite
 * 登录用户可切换收藏；插入 `user_favorites` 时显式写入 `created_at`。
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts, userFavorites } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import type { AuthJwtPayload } from "@/lib/utils/request-auth";
import { requireAuthUser } from "@/lib/utils/request-auth";

async function getFavoriteCount(postId: number): Promise<number> {
  const rows = await db.select({ id: userFavorites.id }).from(userFavorites).where(eq(userFavorites.postId, postId));
  return rows.length;
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

async function handlePostFavoriteGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      const favoriteCount = await getFavoriteCount(postId);

      return NextResponse.json(
        localizedSuccessResponse(request, { favorited: false, favoriteCount }, "post.favoriteStatusSuccess"),
        { status: 200 }
      );
    }

    const favoritedRows = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, auth.user.userId), eq(userFavorites.postId, postId)))
      .limit(1);

    return NextResponse.json(
      localizedSuccessResponse(
        request,
        { favorited: favoritedRows.length > 0, favoriteCount: await getFavoriteCount(postId) },
        "post.favoriteStatusSuccess"
      ),
      { status: 200 }
    );
  } catch (error) {
    throw error;
  }
}

async function handlePostFavoritePOST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const favoritedRows = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, auth.user.userId), eq(userFavorites.postId, postId)))
      .limit(1);

    let favorited = false;
    if (favoritedRows.length > 0) {
      await db
        .delete(userFavorites)
        .where(and(eq(userFavorites.userId, auth.user.userId), eq(userFavorites.postId, postId)));
      favorited = false;
    } else {
      await db.insert(userFavorites).values({
        userId: auth.user.userId,
        postId,
        createdAt: new Date(),
      });
      favorited = true;
    }

    const favoriteCount = await getFavoriteCount(postId);
    logUserActivity({
      userId: auth.user.userId,
      action: favorited ? UserActivityAction.POST_FAVORITED : UserActivityAction.POST_UNFAVORITED,
      metadata: { postId, favoriteCount },
      request,
    });
    return NextResponse.json(
      localizedSuccessResponse(
        request,
        { favorited, favoriteCount },
        favorited ? "post.favoriteSuccess" : "post.unfavoriteSuccess"
      ),
      { status: 200 }
    );
  } catch (error) {
    throw error;
  }
}

export const { GET, POST } = defineApiHandlers(
  {
    GET: handlePostFavoriteGET,
    POST: handlePostFavoritePOST,
  },
  {
    onUnhandledErrorResponse: ({ request, method }) =>
      NextResponse.json(
        localizedErrorResponse(request, method === "GET" ? "post.favoriteStatusFailed" : "post.favoriteFailed"),
        { status: 500 }
      ),
  }
);
