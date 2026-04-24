import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailSubscriptions, emailVerifications, users } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { isValidEmail } from "@/lib/utils";
import {
  generateVerificationCode,
  sendVerificationEmailDetailed,
  type SendVerificationEmailResult,
} from "@/lib/utils/email";
import { ApiResponse } from "@/types/blog";

function mapEmailSendErrorMessage(result: Exclude<SendVerificationEmailResult, { ok: true }>): string {
  if (result.code === "RECIPIENT_NOT_FOUND" || result.code === "RECIPIENT_REJECTED") {
    return "邮箱不存在或无法接收邮件，请检查后重试";
  }
  return "邮件发送失败，请稍后重试";
}

/**
 * 发送邮箱验证码
 * POST /api/auth/send-verification-code
 */
async function handleAuthSendVerificationCodePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = "register" } = body;
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    /** 订阅类验证码统一小写，与订阅表 email 一致 */
    const email = type === "subscription" || type === "subscription_unsubscribe" ? rawEmail.toLowerCase() : rawEmail;

    // 与注册接口文案对齐：先区分「未填」与「格式不符」
    if (!email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮箱为必填项",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮箱格式不符合规范，请填写有效的邮箱地址",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证类型
    if (!["register", "reset_password", "change_email", "subscription", "subscription_unsubscribe"].includes(type)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "验证码类型不正确",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 访客订阅：已在有效订阅中则无需再发验证码
    if (type === "subscription") {
      const [activeSub] = await db
        .select()
        .from(emailSubscriptions)
        .where(and(eq(emailSubscriptions.email, email), eq(emailSubscriptions.isActive, true)))
        .limit(1);
      if (activeSub) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "该邮箱已处于订阅状态，无需重复订阅",
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // 访客退订：必须存在有效订阅才发验证码，避免对任意邮箱滥发
    if (type === "subscription_unsubscribe") {
      const [activeSub] = await db
        .select()
        .from(emailSubscriptions)
        .where(and(eq(emailSubscriptions.email, email), eq(emailSubscriptions.isActive, true)))
        .limit(1);
      if (!activeSub) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "该邮箱当前未订阅，无法发送退订验证码",
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // 如果是注册类型，发送验证码前先检查邮箱是否已被用户表占用。
    // 命中占用时直接阻断发码，避免对已注册邮箱重复发送验证码。
    if (type === "register") {
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "邮箱已存在，已被用户使用",
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

    // 保存新的验证码（与 schema 中 mysqlEnum 取值一致）
    const verificationType = type as (typeof emailVerifications.$inferInsert)["type"];
    await db.insert(emailVerifications).values({
      email,
      code,
      type: verificationType,
      expiresAt,
    });

    // 发送邮件：若 SMTP 返回收件人不存在/拒收，向前端返回更明确提示。
    const emailSendResult = await sendVerificationEmailDetailed(email, code, verificationType);

    if (!emailSendResult.ok) {
      logger.warn("auth", "send verification email failed", {
        email,
        type: verificationType,
        code: emailSendResult.code,
        detail: emailSendResult.detail,
      });
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: mapEmailSendErrorMessage(emailSendResult),
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
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleAuthSendVerificationCodePOST });
