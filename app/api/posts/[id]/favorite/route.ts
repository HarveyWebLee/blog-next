/**
 * GET/POST /api/posts/{id}/favorite
 * 登录用户可切换收藏；插入 `user_favorites` 时显式写入 `created_at`。
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { posts, userFavorites } from "@/lib/db/schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { findMysqlDriverError } from "@/lib/utils/mysql-error";
import { requireAuthUser } from "@/lib/utils/request-auth";

async function getFavoriteCount(postId: number): Promise<number> {
  const rows = await db.select({ id: userFavorites.id }).from(userFavorites).where(eq(userFavorites.postId, postId));
  return rows.length;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), { status: 400 });
    }

    const postRows = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (postRows.length === 0) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
    }

    const auth = requireAuthUser(request);
    if (!auth.ok) {
      const favoriteCount = await getFavoriteCount(postId);
      return NextResponse.json(createSuccessResponse({ favorited: false, favoriteCount }, "获取收藏状态成功"), {
        status: 200,
      });
    }

    const favoritedRows = await db
      .select({ id: userFavorites.id })
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, auth.user.userId), eq(userFavorites.postId, postId)))
      .limit(1);

    return NextResponse.json(
      createSuccessResponse(
        { favorited: favoritedRows.length > 0, favoriteCount: await getFavoriteCount(postId) },
        "获取收藏状态成功"
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[GET /api/posts/[id]/favorite]",
      error instanceof Error ? error.message : error,
      findMysqlDriverError(error)
    );
    return NextResponse.json(
      createErrorResponse("获取收藏状态失败", error instanceof Error ? error.message : "未知错误"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json(createErrorResponse("请先登录"), { status: 401 });
    }

    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), { status: 400 });
    }

    const postRows = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (postRows.length === 0) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
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

    return NextResponse.json(
      createSuccessResponse(
        { favorited, favoriteCount: await getFavoriteCount(postId) },
        favorited ? "收藏成功" : "取消收藏成功"
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[POST /api/posts/[id]/favorite]",
      error instanceof Error ? error.message : error,
      findMysqlDriverError(error)
    );
    return NextResponse.json(createErrorResponse("收藏操作失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}
