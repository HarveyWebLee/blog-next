/**
 * 个人资料中修改邮箱：与 users 表全局唯一（不含当前用户自身）。
 */

import { and, ne, sql } from "drizzle-orm";

import { RESERVED_SUPER_ADMIN_USER_ID } from "@/lib/config/super-admin";
import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
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
