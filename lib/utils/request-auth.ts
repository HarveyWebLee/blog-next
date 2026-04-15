import type { NextRequest } from "next/server";

import { verifyToken } from "@/lib/utils/auth";

/** JWT 载荷（与登录接口签发字段一致） */
export type AuthJwtPayload = {
  userId: number;
  username: string;
  role: string;
  /** 内存态超级管理员等 */
  isRoot?: boolean;
};

/**
 * 从 Authorization: Bearer 解析当前用户；无效或未登录返回 null。
 */
export function getAuthUserFromRequest(request: NextRequest): AuthJwtPayload | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    const decoded = verifyToken(token) as AuthJwtPayload;
    if (decoded == null || typeof decoded.userId !== "number") return null;
    return decoded;
  } catch {
    return null;
  }
}

/** 与 API 路由配合：区分未带 Bearer 与 JWT 校验失败（后者含过期、签名错误等），避免 verifyToken 抛错被误当作 500 */
export type RequireAuthResult = { ok: true; user: AuthJwtPayload } | { ok: false; reason: "missing" | "invalid" };

/**
 * 从请求解析已登录用户；未提供 Authorization: Bearer、或令牌无效时返回 reason。
 */
export function requireAuthUser(request: NextRequest): RequireAuthResult {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return { ok: false, reason: "missing" };
  }
  const user = getAuthUserFromRequest(request);
  if (!user) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, user };
}
