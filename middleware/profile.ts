/**
 * 个人中心认证中间件
 * 用于保护个人中心相关页面
 */

import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/utils/auth";

export async function profileAuthMiddleware(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}
