import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword } from "@/lib/utils";
import { ApiResponse, LoginRequest, LoginResponse } from "@/types/blog";

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // 验证输入
    if (!username || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "用户名和密码不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.status, "active"),
          // 支持用户名或邮箱登录
          username.includes("@") ? eq(users.email, username) : eq(users.username, username)
        )
      )
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "用户名或密码错误",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const userData = user[0];

    // 验证密码
    const isPasswordValid = await verifyPassword(password, userData.password);
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "用户名或密码错误",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userData.id));

    // 生成令牌
    const accessToken = generateAccessToken({
      userId: userData.id,
      username: userData.username,
      role: userData.role || "user",
    });

    const refreshToken = generateRefreshToken({
      userId: userData.id,
      username: userData.username,
    });

    // 构建响应数据（排除密码）
    const { password: _, ...userWithoutPassword } = userData;

    const response: LoginResponse = {
      user: userWithoutPassword as any,
      token: accessToken,
      refreshToken: refreshToken,
    };

    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      message: "登录成功",
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("登录错误:", error);
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
