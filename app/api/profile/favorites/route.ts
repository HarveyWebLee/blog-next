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
import { categories, posts, postTags, tags, userFavorites, users } from "@/lib/db/schema";
import { verifyToken } from "@/lib/utils/auth";
import { ApiResponse, FavoritePostRequest, PaginatedResponseData, UserFavorite } from "@/types/blog";

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

    // 获取用户收藏列表
    const favorites = await db
      .select({
        id: userFavorites.id,
        userId: userFavorites.userId,
        postId: userFavorites.postId,
        createdAt: userFavorites.createdAt,
        updatedAt: userFavorites.updatedAt,
        post: {
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          excerpt: posts.excerpt,
          featuredImage: posts.featuredImage,
          viewCount: posts.viewCount,
          likeCount: posts.likeCount,
          publishedAt: posts.publishedAt,
          author: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatar: users.avatar,
          },
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
        },
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
      data: favorites.map((fav) => ({
        id: fav.id,
        userId: fav.userId,
        postId: fav.postId,
        createdAt: fav.createdAt,
        updatedAt: fav.updatedAt,
        post: fav.post,
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

    // 添加收藏
    const newFavorite = await db.insert(userFavorites).values({
      userId: decoded.userId,
      postId: postId,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: newFavorite.insertId },
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
