/**
 * 权限辅助：区分「数据库管理员」与「内存态 Root」。
 * 路由或 service 在需要「整站级」能力时可调用 {@link hasSiteAdminPrivileges}。
 */

import type { NextRequest } from "next/server";

import { RESERVED_SUPER_ADMIN_USER_ID } from "@/lib/config/super-admin";
import type { AuthJwtPayload } from "@/lib/utils/request-auth";
import { requireAuthUser } from "@/lib/utils/request-auth";

/** JWT 是否表示内存态超级管理员（与签发约定一致） */
export function isJwtInMemorySuperRoot(payload: AuthJwtPayload | null | undefined): boolean {
  if (!payload) return false;
  return payload.userId === RESERVED_SUPER_ADMIN_USER_ID && payload.role === "super_admin" && payload.isRoot === true;
}

/** 站点级管理权限：内存 Root 或数据库 role=admin */
export function hasSiteAdminPrivileges(payload: AuthJwtPayload | null | undefined): boolean {
  if (!payload) return false;
  if (isJwtInMemorySuperRoot(payload)) return true;
  return payload.role === "admin";
}

/** 供 Route Handler 使用：仅允许内存态超级管理员（JWT userId=0 + isRoot） */
export type RequireSuperRootResult =
  | { ok: true; user: AuthJwtPayload }
  | { ok: false; status: 401 | 403; message: string };

/**
 * 浏览器端根据登录接口写回 localStorage 的 `user` 判断是否内存超级管理员会话。
 * 与 {@link isJwtInMemorySuperRoot} 约定一致：id=0 且 role=super_admin（JWT 内另有 isRoot，此处以业务约定推断）。
 */
export function isInMemorySuperRootClientUser(user: { id: number; role: string } | null | undefined): boolean {
  if (!user) return false;
  return user.id === RESERVED_SUPER_ADMIN_USER_ID && user.role === "super_admin";
}

export function requireInMemorySuperRoot(request: NextRequest): RequireSuperRootResult {
  const auth = requireAuthUser(request);
  if (!auth.ok) {
    return {
      ok: false,
      status: 401,
      message: auth.reason === "missing" ? "未提供认证令牌" : "无效的认证令牌",
    };
  }
  if (!isJwtInMemorySuperRoot(auth.user)) {
    return { ok: false, status: 403, message: "需要超级管理员权限" };
  }
  return { ok: true, user: auth.user };
}
