/**
 * 刷新访问令牌：仅读取 HttpOnly Cookie `blog_refresh_token`。
 * 须带 Cookie 且通过 Origin/Referer 校验；成功后轮换 Cookie。响应体只返回新的 accessToken。
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { ensureSuperAdminDbIdentity, isSuperAdminEnabled } from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
import { apiMessage } from "@/lib/i18n/api-response";
import {
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
} from "@/lib/server/auth-session-cookie";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { rejectIfMutationOriginDenied } from "@/lib/server/request-origin-guard";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/utils/auth";
import { ApiResponse } from "@/types/blog";

function jsonRefreshFailure(
  request: NextRequest,
  messageKey: "auth.refreshTokenMissing" | "auth.invalidRefreshToken",
  status: number
): NextResponse {
  const response = NextResponse.json<ApiResponse>(
    {
      success: false,
      message: apiMessage(request, messageKey),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
  if (messageKey === "auth.invalidRefreshToken") {
    clearRefreshTokenCookie(response, request);
  }
  return response;
}

function jsonAccessTokenResponse(request: NextRequest, token: string, newRefresh: string): NextResponse {
  return attachRefreshTokenCookie(
    NextResponse.json({
      success: true,
      message: apiMessage(request, "auth.refreshSuccess"),
      data: { token },
      timestamp: new Date().toISOString(),
    }),
    newRefresh,
    request
  );
}

async function handleAuthRefreshPOST(request: NextRequest) {
  try {
    const refreshToken = readRefreshTokenCookie(request);
    if (!refreshToken) {
      return jsonRefreshFailure(request, "auth.refreshTokenMissing", 400);
    }

    const denied = rejectIfMutationOriginDenied(request);
    if (denied) return denied;

    let decoded: {
      userId: number;
      username: string;
      role?: string;
      isRoot?: boolean;
    };
    try {
      decoded = verifyRefreshToken(refreshToken) as typeof decoded;
    } catch {
      return jsonRefreshFailure(request, "auth.invalidRefreshToken", 401);
    }

    if (typeof decoded.userId !== "number") {
      return jsonRefreshFailure(request, "auth.invalidRefreshToken", 401);
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
      return jsonAccessTokenResponse(request, token, newRefresh);
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

    return jsonAccessTokenResponse(request, accessToken, newRefresh);
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleAuthRefreshPOST });
