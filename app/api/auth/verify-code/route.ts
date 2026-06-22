import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailVerifications } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { ApiResponse } from "@/types/blog";

/**
 * 验证邮箱验证码
 * POST /api/auth/verify-code
 */
async function handleAuthVerifyCodePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, type = "register" } = body;

    // 验证输入
    if (!email || !code) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.verifyEmailCodeRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 查找验证码记录
    const verification = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.code, code),
          eq(emailVerifications.type, type),
          eq(emailVerifications.isUsed, false),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verification.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.verifyCodeInvalid"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 标记验证码为已使用
    await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, verification[0].id));

    return NextResponse.json<ApiResponse>({
      success: true,
      message: apiMessage(request, "auth.verifyCodeSuccess"),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers({ POST: handleAuthVerifyCodePOST });
