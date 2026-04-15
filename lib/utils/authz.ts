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
