/**
 * 内存态超级管理员（配置 + 进程内校验登录；不依赖 users 表存在 id=0 行）。
 * 个人资料持久化约定：使用 `user_profiles.user_id = 0` 唯一一行（与 users 无 FK，可单独落库）。
 *
 * 安全风险：若泄露 SUPER_ADMIN_* 等同于交出整站权限，生产务必强密码、限制网络、默认关闭。
 */

import type { InferSelectModel } from "drizzle-orm";

import { userProfiles } from "@/lib/db/schema";
import { generateAccessToken, generateRefreshToken, verifyPassword } from "@/lib/utils/auth";
import type { User, UserProfile } from "@/types/blog";

/** 与 JWT 约定：占用 userId=0；禁止在 users 表插入 id=0，个人资料见 user_profiles.user_id=0 */
export const RESERVED_SUPER_ADMIN_USER_ID = 0;

type UserProfileRow = InferSelectModel<typeof userProfiles>;

function parseProfileJson(raw: string | null, fallback: Record<string, unknown>): Record<string, unknown> {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return fallback;
  }
}

/**
 * 无 DB 行时的默认资料；有行时与 {@link mergeSuperAdminProfileFromRow} 合并。
 */
export function getSyntheticSuperAdminUserProfile(username: string): UserProfile {
  const now = new Date();
  return {
    id: 0,
    userId: RESERVED_SUPER_ADMIN_USER_ID,
    email: `${username}@superadmin.local`,
    firstName: undefined,
    lastName: undefined,
    phone: undefined,
    website: undefined,
    location: undefined,
    timezone: undefined,
    language: "zh-CN",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    theme: "system",
    notifications: {},
    privacy: {},
    socialLinks: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 将 `user_profiles` 中 user_id=0 的行合并为前端 {@link UserProfile}（无行则仅返回默认）。
 */
export function mergeSuperAdminProfileFromRow(row: UserProfileRow | undefined, username: string): UserProfile {
  const base = getSyntheticSuperAdminUserProfile(username);
  if (!row) return base;
  return {
    id: row.id,
    userId: RESERVED_SUPER_ADMIN_USER_ID,
    email: row.email?.trim() || base.email,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    location: row.location ?? undefined,
    timezone: row.timezone ?? undefined,
    language: row.language || base.language,
    dateFormat: row.dateFormat || base.dateFormat,
    timeFormat: row.timeFormat || base.timeFormat,
    theme: row.theme || base.theme,
    notifications: parseProfileJson(row.notifications, {}) as UserProfile["notifications"],
    privacy: parseProfileJson(row.privacy, {}) as UserProfile["privacy"],
    socialLinks: parseProfileJson(row.socialLinks, {}) as UserProfile["socialLinks"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * 从 .env 读取的 bcrypt 字符串：去掉首尾空白、去掉可能被一并读入的成对引号。
 * 标准 bcrypt 哈希长度为 60（如 $2b$12$...）。
 */
function normalizeBcryptHash(raw: string): string {
  let s = raw.trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * 优先使用 Base64（不含 $，避免 Windows / dotenv-expand 等把 `$` 当变量导致截断为 32 等异常长度）。
 */
function resolvePasswordBcryptFromEnv(): { hash: string; source: "base64" | "plain" } {
  const b64 = (process.env.SUPER_ADMIN_PASSWORD_BCRYPT_BASE64 ?? "").trim();
  if (b64.length > 0) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      return { hash: normalizeBcryptHash(decoded), source: "base64" };
    } catch {
      return { hash: "", source: "base64" };
    }
  }
  return {
    hash: normalizeBcryptHash(process.env.SUPER_ADMIN_PASSWORD_BCRYPT ?? ""),
    source: "plain",
  };
}

function readEnv() {
  const enabled = process.env.SUPER_ADMIN_ENABLED === "true";
  const username = (process.env.SUPER_ADMIN_USERNAME ?? "").trim();
  const { hash: passwordBcrypt, source: bcryptSource } = resolvePasswordBcryptFromEnv();
  return { enabled, username, passwordBcrypt, bcryptSource };
}

/** 是否启用内存超级管理员（三项均需配置且开关为 true） */
export function isSuperAdminEnabled(): boolean {
  const { enabled, username, passwordBcrypt } = readEnv();
  return enabled && username.length > 0 && passwordBcrypt.length > 0;
}

/** 开发时便于发现 .env 中哈希被截断（正常应为 60 字符） */
function warnIfBcryptLengthWrong(passwordBcrypt: string, bcryptSource: "base64" | "plain"): void {
  if (process.env.NODE_ENV !== "development") return;
  if (!passwordBcrypt) return;
  if (passwordBcrypt.length === 60) return;
  const hint =
    bcryptSource === "base64"
      ? "请核对 SUPER_ADMIN_PASSWORD_BCRYPT_BASE64 是否为完整 Base64。"
      : "若仍异常，请改用 SUPER_ADMIN_PASSWORD_BCRYPT_BASE64（见 env.example），可避免 $ 被环境解析截断。";
  console.warn(`[super-admin] bcrypt 哈希长度异常（期望 60，当前 ${passwordBcrypt.length}）。${hint}`);
}

/**
 * 登录流程调用：在访问数据库之前执行。
 * - `none`：未启用或用户名不是超级管理员账号
 * - `bad_credentials`：用户名命中超级管理员账号但密码错误（不得再查库，避免双密码歧义）
 * - 成功：返回与数据库登录一致的 token 与 user 外形（role 为 super_admin）
 */
export async function resolveSuperAdminLogin(
  loginName: string,
  plainPassword: string
): Promise<
  | "none"
  | "bad_credentials"
  | {
      user: Omit<User, "password">;
      accessToken: string;
      refreshToken: string;
    }
> {
  const { enabled, username, passwordBcrypt, bcryptSource } = readEnv();
  warnIfBcryptLengthWrong(passwordBcrypt, bcryptSource);
  if (!enabled || !username || !passwordBcrypt) {
    return "none";
  }

  const id = loginName.trim();
  if (id !== username) {
    return "none";
  }

  const ok = await verifyPassword(plainPassword, passwordBcrypt);
  if (!ok) {
    return "bad_credentials";
  }

  const now = new Date();
  const user: Omit<User, "password"> = {
    id: RESERVED_SUPER_ADMIN_USER_ID,
    username,
    email: `${username}@superadmin.local`,
    role: "super_admin",
    status: "active",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  };

  const accessToken = generateAccessToken({
    userId: RESERVED_SUPER_ADMIN_USER_ID,
    username,
    role: "super_admin",
    isRoot: true,
  });
  const refreshToken = generateRefreshToken({
    userId: RESERVED_SUPER_ADMIN_USER_ID,
    username,
    role: "super_admin",
    isRoot: true,
  });

  return { user, accessToken, refreshToken };
}
