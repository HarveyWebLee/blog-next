/**
 * 单个用户API路由
 * 提供单个用户的增删改查接口
 *
 * GET /api/users/[id] - 获取单个用户
 * PUT /api/users/[id] - 更新用户
 * DELETE /api/users/[id] - 删除用户
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return NextResponse.json({
    success: true,
    data: { id, name: "示例用户", email: "user@example.com" },
    message: "用户获取成功",
    timestamp: new Date().toISOString(),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  return NextResponse.json({
    success: true,
    data: { id, ...body },
    message: "用户更新成功",
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return NextResponse.json({
    success: true,
    data: null,
    message: "用户删除成功",
    timestamp: new Date().toISOString(),
  });
}
