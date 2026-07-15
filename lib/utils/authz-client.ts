/**
 * 仅含浏览器可用的角色判断（不依赖 JWT_SECRET / request-auth）。
 * 客户端组件必须从此文件导入，禁止经 authz / @/lib/utils 桶导入服务端 auth。
 */

/** 浏览器端：与服务端 hasTaxonomyManagePrivileges 对齐（含 super_admin 会话）。 */
export function canManageTaxonomyClient(user: { role?: string | null } | null | undefined): boolean {
  if (!user?.role) return false;
  return user.role === "author" || user.role === "admin" || user.role === "super_admin";
}

/** 供 UI 根据 localStorage 的 user 判断是否超级管理员会话（以 role 为准）。 */
export function isInMemorySuperRootClientUser(user: { id: number; role: string } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "super_admin";
}
