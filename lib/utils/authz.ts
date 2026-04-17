/**
 * 权限辅助：区分「普通用户 / 管理员 / 超级管理员 root 会话」。
 */

import type { NextRequest } from "next/server";

import type { AuthJwtPayload } from "@/lib/utils/request-auth";
import { requireAuthUser } from "@/lib/utils/request-auth";

/** JWT 是否表示超级管理员 root 会话 */
export function isJwtInMemorySuperRoot(payload: AuthJwtPayload | null | undefined): boolean {
  if (!payload) return false;
  return payload.role === "super_admin" && payload.isRoot === true;
}

/** 站点级管理权限：超级管理员 root 会话或数据库 role=admin */
export function hasSiteAdminPrivileges(payload: AuthJwtPayload | null | undefined): boolean {
  if (!payload) return false;
  if (isJwtInMemorySuperRoot(payload)) return true;
  return payload.role === "admin";
}

/** 供 Route Handler 使用：仅允许超级管理员 root 会话（JWT role=super_admin + isRoot=true） */
export type RequireSuperRootResult =
  | { ok: true; user: AuthJwtPayload }
  | { ok: false; status: 401 | 403; message: string };

/** 浏览器端根据 localStorage 的 user 判断是否超级管理员会话（UI 侧以 role 为准）。 */
export function isInMemorySuperRootClientUser(user: { id: number; role: string } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "super_admin";
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
