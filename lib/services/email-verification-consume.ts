import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailVerifications } from "@/lib/db/schema";
import { logger } from "@/lib/server/logger";

/**
 * 与 `email_verifications.type` 枚举一致（含订阅相关场景）。
 * 集中定义便于订阅 API 与发码接口共享类型约束。
 */
export type ConsumableEmailVerificationType =
  | "register"
  | "reset_password"
  | "change_email"
  | "subscription"
  | "subscription_unsubscribe";

/**
 * 与 `send-verification-code` 路由保持一致的邮箱规范化规则。
 */
function normalizeEmailForVerification(email: string, type: ConsumableEmailVerificationType): string {
  const trimmed = email.trim();
  if (type === "subscription" || type === "subscription_unsubscribe") {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

/**
 * 校验并一次性消费邮箱验证码（标记 is_used）。
 * 用于注册、订阅/退订等「验证通过后再执行业务」的场景。
 *
 * 使用条件 UPDATE（WHERE is_used = false）依赖数据库单行原子性，
 * 比「SELECT + UPDATE」事务更能防止并发重复使用。
 */
export async function consumeEmailVerificationCode(
  email: string,
  code: string,
  type: ConsumableEmailVerificationType
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalizedEmail = normalizeEmailForVerification(email, type);
  const normalizedCode = String(code ?? "").trim();
  if (!normalizedEmail || !normalizedCode) {
    return { ok: false, message: "邮箱和验证码不能为空" };
  }

  try {
    const [updateResult] = await db
      .update(emailVerifications)
      .set({ isUsed: true })
      .where(
        and(
          eq(emailVerifications.email, normalizedEmail),
          eq(emailVerifications.code, normalizedCode),
          eq(emailVerifications.type, type),
          eq(emailVerifications.isUsed, false),
          gt(emailVerifications.expiresAt, new Date())
        )
      );

    if (!updateResult.affectedRows) {
      return { ok: false, message: "验证码无效或已过期" };
    }

    return { ok: true };
  } catch (error) {
    logger.error("email-verification-consume", "验证码消费失败", {
      email: normalizedEmail,
      type,
      error: String(error),
    });
    return { ok: false, message: "验证码校验失败，请重试" };
  }
}
