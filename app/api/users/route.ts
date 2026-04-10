/**
 * 用户管理API路由
 * 提供用户的增删改查接口
 *
 * GET /api/users - 获取用户列表
 * POST /api/users - 创建用户
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: [],
    message: "用户列表获取成功",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    data: { id: 1, ...body },
    message: "用户创建成功",
    timestamp: new Date().toISOString(),
  });
}
