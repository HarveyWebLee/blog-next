import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { resolveSecretFromBody } from "@/lib/crypto/password-transport/resolve-secret";
import { db } from "@/lib/db/config";
import { emailVerifications, users } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { getRequestLocale } from "@/lib/i18n/locale";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { hashPassword, validatePasswordStrength } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/utils/request-rate-limit";
import { ApiResponse } from "@/types/blog";

async function handleAuthResetPasswordPOST(request: NextRequest) {
  try {
    // 速率限制：5 次/15 分钟（按客户端 IP）
    const clientIp = getClientIp(request);
    const limiter = checkRateLimit(`reset-password:ip:${clientIp}`, 5, 15 * 60 * 1000);
    if (!limiter.allowed) {
      return jsonRateLimitError(request, limiter.retryAfterSeconds);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const locale = getRequestLocale(request);
    const secret = await resolveSecretFromBody({ body, plainField: "newPassword", locale, request });
    if (!secret.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: secret.message,
          timestamp: new Date().toISOString(),
        },
        { status: secret.status }
      );
    }
    const newPassword = secret.plaintext;
    const token = typeof body.token === "string" ? body.token : "";

    // 验证输入
    if (!token || !newPassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.resetTokenPasswordRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
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

    // 基于数据库校验 token：必须存在、未使用、未过期。
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.code, token),
          eq(emailVerifications.type, "reset_password"),
          eq(emailVerifications.isUsed, false)
        )
      )
      .limit(1);

    if (!verification) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.resetTokenInvalid"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查令牌是否过期
    if (new Date() > verification.expiresAt) {
      await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, verification.id));
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.resetTokenExpired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.email, verification.email));
    await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, verification.id));

    const [updatedUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, verification.email))
      .limit(1);
    if (updatedUser) {
      logUserActivity({
        userId: updatedUser.id,
        action: UserActivityAction.PASSWORD_RESET_COMPLETED,
        description: "完成密码重置",
        metadata: { email: updatedUser.email },
        request,
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: apiMessage(request, "auth.resetPasswordSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleAuthResetPasswordPOST });
