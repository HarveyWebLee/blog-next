/**
 * 用户关注关系 API
 *
 * POST /api/profile/follow - 当前用户关注指定目标用户
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFollows, userNotifications, users } from "@/lib/db/schema";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, FollowUserRequest } from "@/types/blog";

export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as FollowUserRequest;
    const targetUserId = Number(body.followingId);
    const currentUserId = auth.user.userId;

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "followingId 无效",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "不能关注自己",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const [targetUser, existed] = await Promise.all([
      db.select({ id: users.id, username: users.username }).from(users).where(eq(users.id, targetUserId)).limit(1),
      db
        .select({ id: userFollows.id })
        .from(userFollows)
        .where(and(eq(userFollows.followerId, currentUserId), eq(userFollows.followingId, targetUserId)))
        .limit(1),
    ]);

    if (!targetUser[0]) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "目标用户不存在",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (existed[0]) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "已关注该用户",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    const [insertResult] = await db.insert(userFollows).values({
      followerId: currentUserId,
      followingId: targetUserId,
    });

    // 尽量创建“被关注”通知；通知失败不影响关注主流程。
    try {
      await db.insert(userNotifications).values({
        userId: targetUserId,
        type: "follow",
        title: "你收到了一个新的关注",
        content: `${auth.user.username} 关注了你`,
        data: JSON.stringify({ followerId: currentUserId }),
        isRead: false,
      });
    } catch (e) {
      console.error("创建关注通知失败:", e);
    }

    logUserActivity({
      userId: currentUserId,
      action: UserActivityAction.USER_FOLLOWED,
      metadata: { targetUserId, source: "profile_follow_api" },
      request,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id: insertResult.insertId, followerId: currentUserId, followingId: targetUserId },
        message: "关注成功",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("关注用户失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "关注用户失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
