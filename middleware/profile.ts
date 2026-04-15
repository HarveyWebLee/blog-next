/**
 * 个人中心认证中间件
 * 用于保护个人中心相关页面
 */

import { NextRequest, NextResponse } from "next/server";

import { requireAuthUser } from "@/lib/utils/request-auth";

export async function profileAuthMiddleware(request: NextRequest) {
  const auth = requireAuthUser(request);
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}
