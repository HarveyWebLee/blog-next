/**
 * 权限辅助：区分「普通用户 / 管理员 / 超级管理员 root 会话」。
 */

import type { NextRequest } from "next/server";

import { apiMessage } from "@/lib/i18n/api-response";
import type { AuthJwtPayload } from "@/lib/utils/request-auth";
import { authErrorMessage, requireAuthUser } from "@/lib/utils/request-auth";

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

/**
 * 分类/标签写操作权限：author、admin，或超级管理员 root 会话。
 * 普通 role=user 仅可登录读本人数据，不可创建/改/删。
 */
export function hasTaxonomyManagePrivileges(payload: AuthJwtPayload | null | undefined): boolean {
  if (!payload) return false;
  if (isJwtInMemorySuperRoot(payload)) return true;
  return payload.role === "author" || payload.role === "admin";
}

/** 浏览器端：与 {@link hasTaxonomyManagePrivileges} 对齐（含 super_admin 会话）。 */
export function canManageTaxonomyClient(user: { role?: string | null } | null | undefined): boolean {
  if (!user?.role) return false;
  return user.role === "author" || user.role === "admin" || user.role === "super_admin";
}

/** 供 Route Handler 使用：仅允许超级管理员 root 会话（JWT role=super_admin + isRoot=true） */
export type RequireSuperRootResult =
  | { ok: true; user: AuthJwtPayload }
  | { ok: false; status: 401 | 403; message: string };

export type RequireTaxonomyManagerResult =
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
      message: authErrorMessage(request, auth.reason),
    };
  }
  if (!isJwtInMemorySuperRoot(auth.user)) {
    return { ok: false, status: 403, message: apiMessage(request, "common.superAdminRequired") };
  }
  return { ok: true, user: auth.user };
}

/** 分类/标签写接口：须登录且具备 author/admin/super_admin 权限。 */
export function requireTaxonomyManager(request: NextRequest): RequireTaxonomyManagerResult {
  const auth = requireAuthUser(request);
  if (!auth.ok) {
    return {
      ok: false,
      status: 401,
      message: authErrorMessage(request, auth.reason),
    };
  }
  if (!hasTaxonomyManagePrivileges(auth.user)) {
    return { ok: false, status: 403, message: apiMessage(request, "taxonomy.manageForbidden") };
  }
  return { ok: true, user: auth.user };
}
