/**
 * 通知API路由
 * 提供通知的增删改查接口
 *
 * GET /api/notifications - 获取通知列表
 * POST /api/notifications - 创建通知
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/notifications
 * 获取通知列表
 * @tag 通知
 * @version 1.0.0
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;

    // 模拟数据
    const notifications = [
      {
        id: 1,
        title: "新评论通知",
        content: "您的文章收到了一条新评论",
        type: "comment",
        status: "unread",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: "系统更新通知",
        content: "系统将在今晚进行维护更新",
        type: "system",
        status: "read",
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: notifications.length,
          totalPages: Math.ceil(notifications.length / limit),
        },
      },
      message: "获取通知列表成功",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取通知列表失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 创建通知
 * @tag 通知
 * @version 1.0.0
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, userId } = body;

    // 验证必填字段
    if (!title || !content || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "标题、内容和类型是必填项",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 模拟创建通知
    const notification = {
      id: Date.now(),
      title,
      content,
      type,
      userId: userId || null,
      status: "unread",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: notification,
        message: "通知创建成功",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建通知失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "创建通知失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
