/**
 * 用户关注关系 API
 *
 * POST /api/profile/follow - 当前用户关注指定目标用户
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFollows, userNotifications, users } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { authErrorMessage, requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, FollowUserRequest } from "@/types/blog";

async function handleProfileFollowPOST(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: authErrorMessage(request, auth.reason),
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
          message: apiMessage(request, "profile.followInvalidId"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "profile.followSelf"),
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
          message: apiMessage(request, "profile.followTargetNotFound"),
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (existed[0]) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "profile.alreadyFollowing"),
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
      logger.warn("api/profile/follow", "创建关注通知失败", { err: String(e) });
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
        message: apiMessage(request, "profile.followSuccess"),
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleProfileFollowPOST });
