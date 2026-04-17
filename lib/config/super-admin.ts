/**
 * 超级管理员（真实 DB 用户）配置与登录辅助。
 * 安全风险：若泄露 SUPER_ADMIN_* 等同于交出整站权限，生产务必强密码、限制网络、默认关闭。
 */

import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import { generateAccessToken, generateRefreshToken, verifyPassword } from "@/lib/utils/auth";
import type { User, UserProfile } from "@/types/blog";

type UserProfileRow = InferSelectModel<typeof userProfiles>;
type UserRow = InferSelectModel<typeof users>;

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
    userId: -1,
    email: `${username}@superadmin.local`,
    avatar: undefined,
    firstName: undefined,
    lastName: undefined,
    phone: undefined,
    website: undefined,
    location: undefined,
    notifications: {},
    privacy: {},
    socialLinks: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 将超级管理员资料行合并为前端 {@link UserProfile}（无行则返回默认占位）。
 */
export function mergeSuperAdminProfileFromRow(row: UserProfileRow | undefined, username: string): UserProfile {
  const base = getSyntheticSuperAdminUserProfile(username);
  if (!row) return base;
  const socialLinks = parseProfileJson(row.socialLinks, {}) as UserProfile["socialLinks"];
  const avatar = typeof socialLinks?.avatar === "string" ? socialLinks.avatar.trim() : "";
  return {
    id: row.id,
    userId: row.userId,
    email: row.email?.trim() || base.email,
    avatar: avatar || undefined,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    location: row.location ?? undefined,
    notifications: parseProfileJson(row.notifications, {}) as UserProfile["notifications"],
    privacy: parseProfileJson(row.privacy, {}) as UserProfile["privacy"],
    socialLinks,
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

function buildSuperAdminPlaceholderEmail(username: string): string {
  return `${username}@superadmin.local`;
}

/** 查询超级管理员用户 id（以 SUPER_ADMIN_USERNAME 命中 users.username） */
export async function getSuperAdminProfileUserId(): Promise<number | null> {
  const username = readEnv().username;
  if (!username) return null;
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  return rows[0]?.id ?? null;
}

async function ensureSuperAdminDbUser(username: string, passwordBcrypt: string): Promise<UserRow> {
  const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing) {
    // 与配置保持一致：超管账号始终可用（active + admin + 邮箱已验证）；密码哈希跟随 env。
    const shouldUpdate =
      existing.role !== "admin" ||
      existing.status !== "active" ||
      existing.emailVerified !== true ||
      existing.password !== passwordBcrypt;
    if (shouldUpdate) {
      await db
        .update(users)
        .set({
          role: "admin",
          status: "active",
          emailVerified: true,
          password: passwordBcrypt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      const [updated] = await db.select().from(users).where(eq(users.id, existing.id)).limit(1);
      if (updated) return updated;
    }
    return existing;
  }

  const values: InferInsertModel<typeof users> = {
    username,
    email: buildSuperAdminPlaceholderEmail(username),
    password: passwordBcrypt,
    role: "admin",
    status: "active",
    emailVerified: true,
  };
  const [insertResult] = await db.insert(users).values(values);
  const insertId = Number(insertResult.insertId);
  const [created] = await db.select().from(users).where(eq(users.id, insertId)).limit(1);
  if (!created) {
    throw new Error("创建超级管理员数据库账号失败");
  }
  return created;
}

async function ensureSuperAdminProfileRow(dbUserId: number, username: string): Promise<void> {
  const [profileForDbUser] = await db.select().from(userProfiles).where(eq(userProfiles.userId, dbUserId)).limit(1);
  if (profileForDbUser) return;

  await db.insert(userProfiles).values({
    userId: dbUserId,
    email: buildSuperAdminPlaceholderEmail(username),
    notifications: "{}",
    privacy: "{}",
    socialLinks: "{}",
  });
}

/** 读取超级管理员配置用户名（未配置时返回空字符串） */
export function getSuperAdminConfiguredUsername(): string {
  return readEnv().username;
}

/** 是否启用超级管理员登录（三项均需配置且开关为 true） */
export function isSuperAdminEnabled(): boolean {
  const { enabled, username, passwordBcrypt } = readEnv();
  return enabled && username.length > 0 && passwordBcrypt.length > 0;
}

/**
 * 在不校验口令的情况下，确保超管数据库身份存在并返回（供 refresh / 只读场景使用）。
 */
export async function ensureSuperAdminDbIdentity(): Promise<{ userId: number; username: string } | null> {
  const { enabled, username, passwordBcrypt } = readEnv();
  if (!enabled || !username || !passwordBcrypt) {
    return null;
  }
  const dbUser = await ensureSuperAdminDbUser(username, passwordBcrypt);
  await ensureSuperAdminProfileRow(dbUser.id, username);
  return { userId: dbUser.id, username: dbUser.username };
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

  const dbUser = await ensureSuperAdminDbUser(username, passwordBcrypt);
  await ensureSuperAdminProfileRow(dbUser.id, username);

  const now = dbUser.createdAt ?? new Date();
  const user: Omit<User, "password"> = {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    displayName: dbUser.displayName ?? undefined,
    avatar: dbUser.avatar ?? undefined,
    bio: dbUser.bio ?? undefined,
    role: "super_admin",
    status: dbUser.status ?? "active",
    emailVerified: dbUser.emailVerified ?? true,
    createdAt: now,
    updatedAt: dbUser.updatedAt ?? now,
  };

  const accessToken = generateAccessToken({
    userId: dbUser.id,
    username: dbUser.username,
    role: "super_admin",
    isRoot: true,
  });
  const refreshToken = generateRefreshToken({
    userId: dbUser.id,
    username: dbUser.username,
    role: "super_admin",
    isRoot: true,
  });

  return { user, accessToken, refreshToken };
}
