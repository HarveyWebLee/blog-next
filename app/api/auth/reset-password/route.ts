import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailVerifications, users } from "@/lib/db/schema";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { hashPassword, validatePasswordStrength } from "@/lib/utils";
import { ApiResponse } from "@/types/blog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 验证输入
    if (!token || !newPassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "重置令牌和新密码不能为空",
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
          message: "密码强度不符合要求",
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
          message: "无效或过期的重置令牌",
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
          message: "重置令牌已过期，请重新申请",
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
      message: "密码重置成功，请使用新密码登录",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("重置密码错误:", error);
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
