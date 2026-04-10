import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailVerifications, users } from "@/lib/db/schema";
import { isValidEmail } from "@/lib/utils";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/utils/email";
import { ApiResponse } from "@/types/blog";

/**
 * 发送邮箱验证码
 * POST /api/auth/send-verification-code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type = "register" } = body;

    // 验证输入
    if (!email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮箱地址不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮箱格式不正确",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证类型
    if (!["register", "reset_password", "change_email"].includes(type)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "验证码类型不正确",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 如果是注册类型，检查邮箱是否已存在
    if (type === "register") {
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "该邮箱已被注册",
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // 检查是否在1分钟内已发送过验证码
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentVerification = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.type, type),
          gt(emailVerifications.createdAt, oneMinuteAgo)
        )
      )
      .limit(1);

    if (recentVerification.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "验证码发送过于频繁，请1分钟后再试",
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 将之前的验证码标记为已使用
    await db
      .update(emailVerifications)
      .set({ isUsed: true })
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.type, type),
          eq(emailVerifications.isUsed, false)
        )
      );

    // 保存新的验证码
    await db.insert(emailVerifications).values({
      email,
      code,
      type,
      expiresAt,
    });

    // 发送邮件
    const emailSent = await sendVerificationEmail(email, code, type);

    if (!emailSent) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮件发送失败，请稍后重试",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "验证码已发送到您的邮箱",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("发送验证码错误:", error);
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
