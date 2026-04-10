/**
 * 用户收藏API路由
 * 提供用户收藏文章的管理接口
 *
 * GET /api/profile/favorites - 获取用户收藏列表
 * POST /api/profile/favorites - 收藏文章
 * DELETE /api/profile/favorites - 取消收藏
 */

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { categories, posts, userFavorites, users } from "@/lib/db/schema";
import { verifyToken } from "@/lib/utils/auth";
import { ApiResponse, FavoritePostRequest, PaginatedResponseData, PostData, UserFavorite } from "@/types/blog";

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

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
      .select({ count: userFavorites.id })
      .from(userFavorites)
      .where(eq(userFavorites.userId, decoded.userId));

    const total = totalResult.length;
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<UserFavorite> = {
      data: favoriteRows.map((row) => ({
        id: row.favId,
        userId: row.favUserId,
        postId: row.refPostId,
        createdAt: row.favCreatedAt,
        updatedAt: row.favCreatedAt,
        post:
          row.postId != null
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
    console.error("获取收藏列表失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取收藏列表失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

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
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

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
    console.error("收藏文章失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "收藏文章失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的认证令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

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

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "取消收藏成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("取消收藏失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "取消收藏失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
