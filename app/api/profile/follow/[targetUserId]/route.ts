/**
 * 用户关注关系 API（按目标用户维度）
 *
 * DELETE /api/profile/follow/{targetUserId} - 当前用户取消关注目标用户
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userFollows } from "@/lib/db/schema";
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
          message: authErrorMessage(request, auth.reason),
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
          message: apiMessage(request, "profile.unfollowInvalidId"),
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
          message: apiMessage(request, "profile.notFollowing"),
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
      message: apiMessage(request, "profile.unfollowSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { DELETE } = defineApiHandlers({ DELETE: handleProfileFollowByTargetDELETE });
