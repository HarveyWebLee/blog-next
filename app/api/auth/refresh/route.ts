/**
 * 刷新访问令牌：支持数据库用户与内存态超级管理员（userId=0 + isRoot）。
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { isSuperAdminEnabled, RESERVED_SUPER_ADMIN_USER_ID } from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/utils/auth";
import { ApiResponse } from "@/types/blog";

type RefreshBody = {
  refreshToken?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RefreshBody;
    const refreshToken = body.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "未提供刷新令牌",
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
          message: "无效的刷新令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (typeof decoded.userId !== "number") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效的刷新令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 内存超级管理员：不访问数据库
    if (decoded.userId === RESERVED_SUPER_ADMIN_USER_ID && decoded.isRoot === true) {
      if (!isSuperAdminEnabled()) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "超级管理员登录已禁用",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
      const username = decoded.username;
      const token = generateAccessToken({
        userId: RESERVED_SUPER_ADMIN_USER_ID,
        username,
        role: "super_admin",
        isRoot: true,
      });
      const newRefresh = generateRefreshToken({
        userId: RESERVED_SUPER_ADMIN_USER_ID,
        username,
        role: "super_admin",
        isRoot: true,
      });
      return NextResponse.json({
        success: true,
        message: "刷新成功",
        data: { token, refreshToken: newRefresh },
        timestamp: new Date().toISOString(),
      });
    }

    const rows = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "用户不存在",
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
          message: "账户不可用",
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
      message: "刷新成功",
      data: { token: accessToken, refreshToken: newRefresh },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("刷新令牌错误:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "服务器内部错误",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
