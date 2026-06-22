/**
 * 刷新访问令牌：支持数据库用户与超级管理员 root 会话。
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { ensureSuperAdminDbIdentity, isSuperAdminEnabled } from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/utils/auth";
import { ApiResponse } from "@/types/blog";

type RefreshBody = {
  refreshToken?: string;
};

async function handleAuthRefreshPOST(request: NextRequest) {
  try {
    const body = (await request.json()) as RefreshBody;
    const refreshToken = body.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.refreshTokenMissing"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let decoded: {
      userId: number;
      username: string;
      role?: string;
      isRoot?: boolean;
    };
    try {
      decoded = verifyRefreshToken(refreshToken) as typeof decoded;
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.invalidRefreshToken"),
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (typeof decoded.userId !== "number") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.invalidRefreshToken"),
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 超级管理员 root 会话：统一使用真实 DB userId 刷新
    if (decoded.role === "super_admin" && decoded.isRoot === true) {
      if (!isSuperAdminEnabled()) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: apiMessage(request, "auth.superAdminDisabled"),
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
      const ensured = await ensureSuperAdminDbIdentity();
      if (!ensured) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: apiMessage(request, "auth.superAdminUnavailable"),
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
      const username = ensured.username || decoded.username;
      const token = generateAccessToken({
        userId: ensured.userId,
        username,
        role: "super_admin",
        isRoot: true,
      });
      const newRefresh = generateRefreshToken({
        userId: ensured.userId,
        username,
        role: "super_admin",
        isRoot: true,
      });
      return NextResponse.json({
        success: true,
        message: apiMessage(request, "auth.refreshSuccess"),
        data: { token, refreshToken: newRefresh },
        timestamp: new Date().toISOString(),
      });
    }

    const rows = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "common.userNotFound"),
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const userData = rows[0];
    if (userData.status !== "active") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.accountUnavailable"),
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const accessToken = generateAccessToken({
      userId: userData.id,
      username: userData.username,
      role: userData.role || "user",
    });
    const newRefresh = generateRefreshToken({
      userId: userData.id,
      username: userData.username,
    });

    return NextResponse.json({
      success: true,
      message: apiMessage(request, "auth.refreshSuccess"),
      data: { token: accessToken, refreshToken: newRefresh },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleAuthRefreshPOST });
