/**
 * 用户关注关系 API（按目标用户维度）
 *
 * DELETE /api/profile/follow/{targetUserId} - 当前用户取消关注目标用户
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFollows } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse } from "@/types/blog";

async function handleProfileFollowByTargetDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ targetUserId: string }> }
) {
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

    const { targetUserId: targetUserIdRaw } = await params;
    const targetUserId = Number.parseInt(targetUserIdRaw, 10);
    const currentUserId = auth.user.userId;

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "targetUserId 无效",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const existed = await db
      .select({ id: userFollows.id })
      .from(userFollows)
      .where(and(eq(userFollows.followerId, currentUserId), eq(userFollows.followingId, targetUserId)))
      .limit(1);

    if (!existed[0]) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "尚未关注该用户",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, currentUserId), eq(userFollows.followingId, targetUserId)));

    logUserActivity({
      userId: currentUserId,
      action: UserActivityAction.USER_UNFOLLOWED,
      metadata: { targetUserId, source: "profile_follow_delete_api" },
      request,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "已取消关注",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { DELETE } = defineApiHandlers({ DELETE: handleProfileFollowByTargetDELETE });
