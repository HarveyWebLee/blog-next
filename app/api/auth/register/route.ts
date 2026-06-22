import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getSuperAdminProfileUserId } from "@/lib/config/super-admin";
import { resolveSecretFromBody } from "@/lib/crypto/password-transport/resolve-secret";
import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import { apiMessage, jsonRateLimitError } from "@/lib/i18n/api-response";
import { getRequestLocale } from "@/lib/i18n/locale";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { consumeEmailVerificationCode } from "@/lib/services/email-verification-consume";
import { hashPassword, isValidEmail, validatePasswordStrength } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/utils/request-rate-limit";
import { ApiResponse } from "@/types/blog";

async function handleAuthRegisterPOST(request: NextRequest) {
  try {
    // 速率限制：3 次/小时
    const clientIp = getClientIp(request);
    const limiter = checkRateLimit(`register:ip:${clientIp}`, 3, 60 * 60 * 1000);
    if (!limiter.allowed) {
      return jsonRateLimitError(request, limiter.retryAfterSeconds);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const locale = getRequestLocale(request);
    const resolved = await resolveSecretFromBody({ body, plainField: "password", locale });
    if (!resolved.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: resolved.message,
          timestamp: new Date().toISOString(),
        },
        { status: resolved.status }
      );
    }
    const password = resolved.plaintext;
    const { useEmailVerification = false } = body as { useEmailVerification?: boolean };

    // 统一 trim 文本字段，避免仅空白字符通过必填校验
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode.trim() : "";

    // 分项校验，便于前端将提示展示在对应字段旁（尤其邮箱：必填与格式分开说明）
    if (!username) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.usernameRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!displayName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.displayNameRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.emailRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.emailInvalid"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.passwordRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (useEmailVerification && !verificationCode) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.verificationCodeRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.passwordWeak"),
          error: passwordValidation.errors.join("; "),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.usernameExists"),
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.emailRegistered"),
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 超级管理员资料中绑定的邮箱同样保留，不允许普通注册占用
    const superAdminProfileUserId = await getSuperAdminProfileUserId();
    const superAdminProfiles =
      superAdminProfileUserId == null
        ? []
        : await db
            .select({ email: userProfiles.email })
            .from(userProfiles)
            .where(eq(userProfiles.userId, superAdminProfileUserId))
            .limit(1);
    const emailLower = email.toLowerCase();
    const occupiedBySuperAdmin = superAdminProfiles.some((x) => (x.email?.trim().toLowerCase() || "") === emailLower);
    if (occupiedBySuperAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.emailRegistered"),
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // 业务校验通过后再消费验证码，避免弱密码/重复账号等场景误消耗验证码
    if (useEmailVerification) {
      const verificationResult = await consumeEmailVerificationCode(email, verificationCode, "register");
      if (!verificationResult.ok) {
        logger.warn("auth/register", "验证码校验未通过", { email });
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: apiMessage(request, "auth.verificationCodeInvalid"),
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const [insertResult] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      displayName,
      role: "user",
      status: "active",
      emailVerified: useEmailVerification, // 如果使用邮箱验证，则邮箱已验证
    });

    // 获取新创建的用户信息
    const newUser = await db.select().from(users).where(eq(users.id, insertResult.insertId)).limit(1);

    // 构建响应数据（排除密码）
    const { password: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json<ApiResponse>({
      success: true,
      message: apiMessage(request, "auth.registerSuccess"),
      data: userWithoutPassword,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleAuthRegisterPOST });
