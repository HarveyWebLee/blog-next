/**
 * GET /api/posts/engagement
 * Query：`ids`（逗号分隔文章 id）。未登录返回匿名占位；登录后查 `user_post_likes` / `user_favorites`。
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFavorites, userPostLikes } from "@/lib/db/schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { findMysqlDriverError } from "@/lib/utils/mysql-error";
import { requireAuthUser } from "@/lib/utils/request-auth";

type PostEngagementState = {
  postId: number;
  liked: boolean;
  favorited: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsRaw = (searchParams.get("ids") || "").trim();
    if (!idsRaw) {
      return NextResponse.json(createErrorResponse("缺少 ids 参数"), { status: 400 });
    }

    const ids = Array.from(
      new Set(
        idsRaw
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0)
          .map((n) => Math.floor(n))
      )
    ).slice(0, 100);

    if (ids.length === 0) {
      return NextResponse.json(createErrorResponse("ids 参数无有效文章ID"), { status: 400 });
    }

    const auth = requireAuthUser(request);
    if (!auth.ok) {
      const anonymousStates: PostEngagementState[] = ids.map((postId) => ({
        postId,
        liked: false,
        favorited: false,
      }));
      return NextResponse.json(createSuccessResponse(anonymousStates, "获取互动状态成功"), { status: 200 });
    }

    const [likesRows, favoritesRows] = await Promise.all([
      db
        .select({ postId: userPostLikes.postId })
        .from(userPostLikes)
        .where(and(eq(userPostLikes.userId, auth.user.userId), inArray(userPostLikes.postId, ids))),
      db
        .select({ postId: userFavorites.postId })
        .from(userFavorites)
        .where(and(eq(userFavorites.userId, auth.user.userId), inArray(userFavorites.postId, ids))),
    ]);

    // 统一转成 number，避免驱动返回 bigint 时 Set.has(数字) 恒为 false，以及后续序列化隐患
    const likedSet = new Set(likesRows.map((x) => Number(x.postId)));
    const favoritedSet = new Set(favoritesRows.map((x) => Number(x.postId)));
    const states: PostEngagementState[] = ids.map((postId) => ({
      postId,
      liked: likedSet.has(postId),
      favorited: favoritedSet.has(postId),
    }));

    return NextResponse.json(createSuccessResponse(states, "获取互动状态成功"), { status: 200 });
  } catch (error) {
    const my = findMysqlDriverError(error);
    console.error("[GET /api/posts/engagement]", error instanceof Error ? error.message : error, my);
    return NextResponse.json(
      createErrorResponse("获取互动状态失败", error instanceof Error ? error.message : "未知错误"),
      { status: 500 }
    );
  }
}
