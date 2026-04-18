/**
 * 用户点赞列表 API
 * GET /api/profile/likes - 获取当前用户点赞的文章列表
 * DELETE /api/profile/likes?postId=1 - 取消点赞
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { categories, posts, userPostLikes, users } from "@/lib/db/schema";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, PaginatedResponseData, PostData } from "@/types/blog";

type ProfileLikeItem = {
  userId: number;
  postId: number;
  createdAt: Date;
  post?: PostData;
};

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const likeRows = await db
      .select({
        likeUserId: userPostLikes.userId,
        likePostId: userPostLikes.postId,
        likeCreatedAt: userPostLikes.createdAt,
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
      .from(userPostLikes)
      .leftJoin(posts, eq(userPostLikes.postId, posts.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(userPostLikes.userId, auth.user.userId))
      .orderBy(desc(userPostLikes.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(userPostLikes)
      .where(eq(userPostLikes.userId, auth.user.userId));

    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const responseData: PaginatedResponseData<ProfileLikeItem> = {
      data: likeRows.map((row) => ({
        userId: row.likeUserId,
        postId: row.likePostId,
        createdAt: row.likeCreatedAt,
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
                favoriteCount: 0,
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
                  createdAt: row.likeCreatedAt,
                  updatedAt: row.likeCreatedAt,
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
                      createdAt: row.likeCreatedAt,
                      updatedAt: row.likeCreatedAt,
                    }
                  : null,
                tags: [],
                comments: [],
                readTime: 0,
                createdAt: row.likeCreatedAt,
                updatedAt: row.likeCreatedAt,
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

    return NextResponse.json<ApiResponse<PaginatedResponseData<ProfileLikeItem>>>({
      success: true,
      data: responseData,
      message: "点赞列表获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取点赞列表失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取点赞列表失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const postId = Number(searchParams.get("postId"));
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "文章ID不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    await db
      .delete(userPostLikes)
      .where(and(eq(userPostLikes.userId, auth.user.userId), eq(userPostLikes.postId, postId)));

    const rows = await db.select({ likeCount: posts.likeCount }).from(posts).where(eq(posts.id, postId)).limit(1);
    const current = Math.max(Number(rows[0]?.likeCount || 0), 0);
    await db
      .update(posts)
      .set({
        likeCount: Math.max(current - 1, 0),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    logUserActivity({
      userId: auth.user.userId,
      action: UserActivityAction.POST_UNLIKED,
      metadata: { postId, source: "profile_likes_delete" },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "取消点赞成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("取消点赞失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "取消点赞失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
