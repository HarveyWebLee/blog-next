/**
 * 个人资料中修改邮箱：与 users 表全局唯一（不含当前用户自身）。
 */

import { and, eq, gt, ne, sql } from "drizzle-orm";

import { RESERVED_SUPER_ADMIN_USER_ID } from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { emailVerifications, userProfiles, users } from "@/lib/db/schema";
import { isValidEmailFormat } from "@/lib/utils/email-format";

export function normalizeProfileEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * @param excludeUserId 当前登录用户的数据库 id；超级管理员为 0（users 中无此行，不排除任何 id）
 * @returns 有冲突时返回错误文案，否则 null
 */
export async function getProfileEmailConflictMessage(
  newEmailRaw: string,
  excludeUserId: number
): Promise<string | null> {
  const email = normalizeProfileEmail(newEmailRaw);
  if (!email) {
    return "邮箱不能为空";
  }
  if (!isValidEmailFormat(email)) {
    return "邮箱格式不正确";
  }

  const rows =
    excludeUserId === RESERVED_SUPER_ADMIN_USER_ID
      ? await db
          .select({ id: users.id })
          .from(users)
          .where(sql`LOWER(TRIM(${users.email})) = ${email}`)
          .limit(1)
      : await db
          .select({ id: users.id })
          .from(users)
          .where(and(sql`LOWER(TRIM(${users.email})) = ${email}`, ne(users.id, excludeUserId)))
          .limit(1);

  if (rows.length > 0) {
    return "该邮箱已被其他账号使用";
  }

  // 超级管理员邮箱（user_profiles.user_id=0 的 email）同样属于全局唯一标识，普通账号不可占用
  const superAdminProfile = await db
    .select({ email: userProfiles.email })
    .from(userProfiles)
    .where(eq(userProfiles.userId, RESERVED_SUPER_ADMIN_USER_ID))
    .limit(1);
  const superAdminEmail = superAdminProfile[0]?.email?.trim().toLowerCase() || "";
  if (superAdminEmail && superAdminEmail === email && excludeUserId !== RESERVED_SUPER_ADMIN_USER_ID) {
    return "该邮箱已被超级管理员使用，请更换邮箱";
  }

  return null;
}

/**
 * 解析资料请求中的邮箱变更：未传 `email` 则不修改；传了则校验格式与全局占用。
 */
export async function resolveProfileEmailUpdateOrError(
  body: { email?: string },
  excludeUserId: number
): Promise<{ ok: true; normalized?: string } | { ok: false; message: string }> {
  if (body.email === undefined) {
    return { ok: true };
  }
  const trimmed = body.email.trim();
  if (!trimmed) {
    return { ok: false, message: "邮箱不能为空" };
  }
  const msg = await getProfileEmailConflictMessage(trimmed, excludeUserId);
  if (msg) {
    return { ok: false, message: msg };
  }
  return { ok: true, normalized: normalizeProfileEmail(trimmed) };
}

/**
 * 邮箱变更验证码校验：
 * - 仅在邮箱发生变更时需要；
 * - 验证通过后会把验证码置为已使用，避免重复提交复用同一验证码。
 */
export async function verifyProfileEmailCodeOrError(params: {
  oldEmail?: string;
  newEmail?: string;
  code?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const oldNormalized = params.oldEmail ? normalizeProfileEmail(params.oldEmail) : "";
  const newNormalized = params.newEmail ? normalizeProfileEmail(params.newEmail) : "";

  // 邮箱未变更时，无需验证码
  if (!newNormalized || oldNormalized === newNormalized) {
    return { ok: true };
  }

  const code = params.code?.trim() ?? "";
  if (!code) {
    return { ok: false, message: "修改邮箱需要先验证邮箱验证码" };
  }

  const rows = await db
    .select({ id: emailVerifications.id })
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, newNormalized),
        eq(emailVerifications.code, code),
        eq(emailVerifications.type, "change_email"),
        eq(emailVerifications.isUsed, false),
        gt(emailVerifications.expiresAt, new Date())
      )
    )
    .limit(1);

  if (rows.length === 0) {
    return { ok: false, message: "邮箱验证码无效或已过期" };
  }

  await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, rows[0].id));
  return { ok: true };
}
