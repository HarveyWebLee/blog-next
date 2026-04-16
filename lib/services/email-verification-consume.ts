import { and, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailVerifications } from "@/lib/db/schema";

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
 * 校验并一次性消费邮箱验证码（标记 is_used）。
 * 用于访客订阅/退订等「验证通过后再执行业务」的场景。
 */
export async function consumeEmailVerificationCode(
  email: string,
  code: string,
  type: ConsumableEmailVerificationType
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code ?? "").trim();
  if (!normalizedEmail || !normalizedCode) {
    return { ok: false, message: "邮箱和验证码不能为空" };
  }

  const [row] = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, normalizedEmail),
        eq(emailVerifications.code, normalizedCode),
        eq(emailVerifications.type, type),
        eq(emailVerifications.isUsed, false),
        gt(emailVerifications.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!row) {
    return { ok: false, message: "验证码无效或已过期" };
  }

  await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, row.id));

  return { ok: true };
}
