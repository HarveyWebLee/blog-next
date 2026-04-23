/**
 * 用户收藏API路由
 * 提供用户收藏文章的管理接口
 *
 * GET /api/profile/favorites - 获取用户收藏列表
 * POST /api/profile/favorites - 收藏文章
 * DELETE /api/profile/favorites - 取消收藏
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { categories, posts, userFavorites, users } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import type { AuthJwtPayload } from "@/lib/utils/request-auth";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, FavoritePostRequest, PaginatedResponseData, PostData, UserFavorite } from "@/types/blog";

function canInteractPost(
  post: { status: string | null; visibility: string | null; authorId: number },
  authUser: AuthJwtPayload
): boolean {
  if (post.status !== "published") return authUser.userId === post.authorId || isJwtInMemorySuperRoot(authUser);
  if (post.visibility !== "private") return true;
  return authUser.userId === post.authorId || isJwtInMemorySuperRoot(authUser);
}

async function handleProfileFavoritesGET(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const decoded = auth.user;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // 获取用户收藏列表（Drizzle MySQL 的 .select 不支持多层嵌套对象，改为扁平列再在内存中组装）
    const favoriteRows = await db
      .select({
        favId: userFavorites.id,
        favUserId: userFavorites.userId,
        refPostId: userFavorites.postId,
        favCreatedAt: userFavorites.createdAt,
        postId: posts.id,
        postTitle: posts.title,
        postSlug: posts.slug,
        postExcerpt: posts.excerpt,
        postFeaturedImage: posts.featuredImage,
        postViewCount: posts.viewCount,
        postLikeCount: posts.likeCount,
        postPublishedAt: posts.publishedAt,
        postStatus: posts.status,
        postVisibility: posts.visibility,
        authorId: users.id,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatar: users.avatar,
        catId: categories.id,
        catName: categories.name,
        catSlug: categories.slug,
      })
      .from(userFavorites)
      .leftJoin(posts, eq(userFavorites.postId, posts.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(userFavorites.userId, decoded.userId))
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db
      .select({ count: count() })
      .from(userFavorites)
      .where(eq(userFavorites.userId, decoded.userId));

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<UserFavorite> = {
      data: favoriteRows.map((row) => ({
        // 私密或非发布文章在权限不足时隐藏，避免收藏列表侧信道泄漏文章信息。
        id: row.favId,
        userId: row.favUserId,
        postId: row.refPostId,
        createdAt: row.favCreatedAt,
        updatedAt: row.favCreatedAt,
        post:
          row.postId != null &&
          !(
            (row.postStatus !== "published" || row.postVisibility === "private") &&
            (row.authorId == null || row.authorId !== decoded.userId)
          )
            ? ({
                id: row.postId,
                title: row.postTitle ?? "",
                slug: row.postSlug ?? "",
                excerpt: row.postExcerpt,
                content: "",
                contentHtml: null,
                featuredImage: row.postFeaturedImage,
                authorId: row.authorId ?? 0,
                categoryId: row.catId,
                status: "published",
                visibility: "public",
                password: null,
                allowComments: true,
                viewCount: row.postViewCount ?? 0,
                likeCount: row.postLikeCount ?? 0,
                publishedAt: row.postPublishedAt,
                author: {
                  id: row.authorId ?? 0,
                  username: row.authorUsername ?? "",
                  email: "",
                  password: "",
                  displayName: row.authorDisplayName ?? row.authorUsername ?? "",
                  avatar: row.authorAvatar,
                  bio: undefined,
                  role: "user",
                  status: "active",
                  emailVerified: false,
                  lastLoginAt: undefined,
                  createdAt: row.favCreatedAt,
                  updatedAt: row.favCreatedAt,
                },
                category: row.catId
                  ? {
                      id: row.catId,
                      name: row.catName ?? "",
                      slug: row.catSlug ?? "",
                      description: undefined,
                      parentId: null,
                      sortOrder: 0,
                      isActive: true,
                      createdAt: row.favCreatedAt,
                      updatedAt: row.favCreatedAt,
                    }
                  : null,
                tags: [],
                comments: [],
                readTime: 0,
                createdAt: row.favCreatedAt,
                updatedAt: row.favCreatedAt,
              } as unknown as PostData)
            : undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponseData<UserFavorite>>>({
      success: true,
      data: responseData,
      message: "收藏列表获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

async function handleProfileFavoritesPOST(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const decoded = auth.user;

    const body: FavoritePostRequest = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "文章ID不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查文章是否存在
    const post = await db
      .select({ id: posts.id, authorId: posts.authorId, status: posts.status, visibility: posts.visibility })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "文章不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    if (!canInteractPost(post[0], decoded)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "该文章当前不可收藏",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 检查是否已经收藏
    const existingFavorite = await db
      .select()
      .from(userFavorites)
      .where(and(eq(userFavorites.userId, decoded.userId), eq(userFavorites.postId, postId)))
      .limit(1);

    if (existingFavorite.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "已经收藏过该文章",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const [insertResult] = await db.insert(userFavorites).values({
      userId: decoded.userId,
      postId: postId,
    });

    logUserActivity({
      userId: decoded.userId,
      action: UserActivityAction.POST_FAVORITED,
      metadata: { postId, source: "profile_favorites_post" },
      request,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: insertResult.insertId },
        message: "收藏成功",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

async function handleProfileFavoritesDELETE(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    const decoded = auth.user;

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "文章ID不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 删除收藏
    await db
      .delete(userFavorites)
      .where(and(eq(userFavorites.userId, decoded.userId), eq(userFavorites.postId, parseInt(postId))));

    logUserActivity({
      userId: decoded.userId,
      action: UserActivityAction.POST_UNFAVORITED,
      metadata: { postId: parseInt(postId, 10), source: "profile_favorites_delete" },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "取消收藏成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { GET, POST, DELETE } = defineApiHandlers(
  {
    GET: handleProfileFavoritesGET,
    POST: handleProfileFavoritesPOST,
    DELETE: handleProfileFavoritesDELETE,
  },
  {
    onError: (payload) => {
      notifyRouteUnhandledError(payload);
    },
    onUnhandledErrorResponse: ({ method }) => {
      const messageMap: Record<string, string> = {
        GET: "获取收藏列表失败",
        POST: "收藏文章失败",
        DELETE: "取消收藏失败",
      };
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: messageMap[method] || "收藏接口处理失败",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    },
  }
);
