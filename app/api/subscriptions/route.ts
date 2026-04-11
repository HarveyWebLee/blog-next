import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailSubscriptions } from "@/lib/db/schema";
import { isValidEmail } from "@/lib/utils/auth";
import { isMysqlTableMissingError } from "@/lib/utils/mysql-error";
import { ApiResponse, CreateSubscriptionRequest, EmailSubscription } from "@/types/blog";

/**
 * GET /api/subscriptions?email=xxx
 * 查询某邮箱的订阅状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "邮箱不能为空",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const [subscription] = await db
      .select()
      .from(emailSubscriptions)
      .where(eq(emailSubscriptions.email, email))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        email,
        isSubscribed: Boolean(subscription?.isActive),
      },
      message: "订阅状态获取成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<{ email: string; isSubscribed: boolean }>);
  } catch (error) {
    console.error("查询订阅状态失败:", error);
    // 线上常见：未执行 Drizzle 迁移，缺少 email_subscriptions 表
    if (isMysqlTableMissingError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "订阅服务暂时不可用，请稍后再试",
          code: "DB_SCHEMA_OUTDATED",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "查询订阅状态失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * 订阅邮箱（防重复订阅）
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSubscriptionRequest = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const userId = body.userId;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "请输入有效的邮箱地址",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const [existing] = await db.select().from(emailSubscriptions).where(eq(emailSubscriptions.email, email)).limit(1);

    if (existing) {
      // 已存在且处于订阅状态：直接返回成功，避免重复订阅
      if (existing.isActive) {
        return NextResponse.json({
          success: true,
          data: {
            ...existing,
            isActive: true,
          },
          message: "该邮箱已订阅，无需重复订阅",
          timestamp: new Date().toISOString(),
        } as ApiResponse<EmailSubscription>);
      }

      // 已存在但已取消：重新激活
      await db
        .update(emailSubscriptions)
        .set({
          isActive: true,
          userId: userId ?? existing.userId ?? null,
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(emailSubscriptions.id, existing.id));
    } else {
      await db.insert(emailSubscriptions).values({
        email,
        userId: userId ?? null,
        isActive: true,
      });
    }

    const [saved] = await db.select().from(emailSubscriptions).where(eq(emailSubscriptions.email, email)).limit(1);

    return NextResponse.json(
      {
        success: true,
        data: saved,
        message: "订阅成功",
        timestamp: new Date().toISOString(),
      } as ApiResponse<EmailSubscription>,
      { status: 201 }
    );
  } catch (error) {
    console.error("订阅失败:", error);
    if (isMysqlTableMissingError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "订阅服务暂时不可用，请稍后再试",
          code: "DB_SCHEMA_OUTDATED",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "订阅失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions
 * 取消订阅
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "请输入有效的邮箱地址",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(emailSubscriptions)
      .where(and(eq(emailSubscriptions.email, email), eq(emailSubscriptions.isActive, true)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({
        success: true,
        message: "该邮箱当前未订阅",
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }

    await db
      .update(emailSubscriptions)
      .set({
        isActive: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(emailSubscriptions.id, existing.id));

    return NextResponse.json({
      success: true,
      message: "取消订阅成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  } catch (error) {
    console.error("取消订阅失败:", error);
    if (isMysqlTableMissingError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "订阅服务暂时不可用，请稍后再试",
          code: "DB_SCHEMA_OUTDATED",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "取消订阅失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
