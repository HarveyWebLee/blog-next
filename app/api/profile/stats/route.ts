/**
 * 个人中心统计信息API路由
 * 提供用户的各种统计信息
 *
 * GET /api/profile/stats - 获取用户统计信息
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, posts, userActivities, userFavorites, userFollows, userNotifications, users } from "@/lib/db/schema";
import { verifyToken } from "@/lib/utils/auth";
import { ApiResponse, ProfileStats } from "@/types/blog";

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

    const userId = decoded.userId;

    // 并行获取各种统计信息
    const [
      postsResult,
      commentsResult,
      viewsResult,
      likesResult,
      favoritesResult,
      followersResult,
      followingResult,
      unreadNotificationsResult,
      lastActivityResult,
    ] = await Promise.all([
      // 用户文章数量
      db.select({ count: count() }).from(posts).where(eq(posts.authorId, userId)),

      // 用户评论数量
      db.select({ count: count() }).from(comments).where(eq(comments.authorId, userId)),

      // 用户文章总浏览量
      db
        .select({
          totalViews: sql<number>`COALESCE(SUM(${posts.viewCount}), 0)`,
        })
        .from(posts)
        .where(eq(posts.authorId, userId)),

      // 用户文章总点赞数
      db
        .select({
          totalLikes: sql<number>`COALESCE(SUM(${posts.likeCount}), 0)`,
        })
        .from(posts)
        .where(eq(posts.authorId, userId)),

      // 用户收藏数量
      db.select({ count: count() }).from(userFavorites).where(eq(userFavorites.userId, userId)),

      // 粉丝数量
      db.select({ count: count() }).from(userFollows).where(eq(userFollows.followingId, userId)),

      // 关注数量
      db.select({ count: count() }).from(userFollows).where(eq(userFollows.followerId, userId)),

      // 未读通知数量
      db
        .select({ count: count() })
        .from(userNotifications)
        .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, false))),

      // 最后活动时间
      db
        .select({
          lastActivityAt: sql<Date>`MAX(${userActivities.createdAt})`,
        })
        .from(userActivities)
        .where(eq(userActivities.userId, userId)),
    ]);

    const stats: ProfileStats = {
      totalPosts: postsResult[0]?.count || 0,
      totalComments: commentsResult[0]?.count || 0,
      totalViews: viewsResult[0]?.totalViews || 0,
      totalLikes: likesResult[0]?.totalLikes || 0,
      totalFavorites: favoritesResult[0]?.count || 0,
      totalFollowers: followersResult[0]?.count || 0,
      totalFollowing: followingResult[0]?.count || 0,
      unreadNotifications: unreadNotificationsResult[0]?.count || 0,
      lastActivityAt: lastActivityResult[0]?.lastActivityAt || undefined,
    };

    return NextResponse.json<ApiResponse<ProfileStats>>({
      success: true,
      data: stats,
      message: "统计信息获取成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取统计信息失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取统计信息失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
