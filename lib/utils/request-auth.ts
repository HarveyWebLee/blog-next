import type { NextRequest } from "next/server";

import { verifyToken } from "@/lib/utils/auth";

/** JWT 载荷（与登录接口签发字段一致） */
export type AuthJwtPayload = {
  userId: number;
  username: string;
  role: string;
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
