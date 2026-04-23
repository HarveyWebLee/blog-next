import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailSubscriptions, users } from "@/lib/db/schema";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { consumeEmailVerificationCode } from "@/lib/services/email-verification-consume";
import { logUserActivity, maskEmailForActivityLog, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { isValidEmail } from "@/lib/utils/auth";
import { isMysqlConnectionError, isMysqlTableMissingError, logDbError } from "@/lib/utils/mysql-error";
import { requireAuthUser } from "@/lib/utils/request-auth";
import { ApiResponse, CreateSubscriptionRequest, EmailSubscription } from "@/types/blog";

/**
 * 订阅相关接口共用的 DB 异常响应：先结构化落日志，再返回不把 SQL/堆栈暴露给前端的 JSON。
 */
function subscriptionDbErrorResponse(scope: string, error: unknown, http500UserMessage: string): NextResponse {
  logDbError(scope, error);
  const timestamp = new Date().toISOString();

  if (isMysqlTableMissingError(error)) {
    return NextResponse.json(
      {
        success: false,
        message: "订阅服务暂时不可用，请稍后再试",
        code: "DB_SCHEMA_OUTDATED",
        timestamp,
      } as ApiResponse<null>,
      { status: 503 }
    );
  }

  if (isMysqlConnectionError(error)) {
    return NextResponse.json(
      {
        success: false,
        message: "服务暂时不可用，请稍后再试",
        code: "DB_UNAVAILABLE",
        timestamp,
      } as ApiResponse<null>,
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: http500UserMessage,
      code: "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && error instanceof Error
        ? { debug: error.message.slice(0, 500) }
        : {}),
      timestamp,
    } as ApiResponse<null>,
    { status: 500 }
  );
}

/**
 * GET /api/subscriptions?email=xxx
 * 查询某邮箱的订阅状态
 */
async function handleSubscriptionsGET(request: NextRequest) {
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
    return subscriptionDbErrorResponse("GET /api/subscriptions", error, "查询订阅状态失败");
  }
}

/**
 * 已登录用户：须携带有效 JWT，且 body.email 与账号邮箱一致（防止伪造 userId）。
 * 访客：须先通过邮件收到验证码，并在 body.verificationCode 中提交，校验通过后写入订阅。
 */
async function handleSubscriptionsPOST(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    /** 带了 Bearer 但 JWT 无效/过期：与访客缺码区分，提示重新登录 */
    if (!auth.ok && auth.reason === "invalid") {
      return NextResponse.json(
        {
          success: false,
          message: "登录已失效，请重新登录后再试",
          code: "AUTH_TOKEN_INVALID",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body: CreateSubscriptionRequest = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode.trim() : "";

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

    let effectiveUserId: number | null = null;

    if (auth.ok) {
      const [account] = await db.select().from(users).where(eq(users.id, auth.user.userId)).limit(1);
      if (!account) {
        return NextResponse.json(
          {
            success: false,
            message: "用户不存在",
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 401 }
        );
      }
      const accountEmail = account.email.trim().toLowerCase();
      if (accountEmail !== email) {
        return NextResponse.json(
          {
            success: false,
            message: "仅可为当前登录账号的邮箱办理订阅",
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 403 }
        );
      }
      effectiveUserId = account.id;
    } else {
      if (!verificationCode) {
        return NextResponse.json(
          {
            success: false,
            message: "请先获取邮箱验证码，验证通过后方可订阅",
            code: "SUBSCRIPTION_VERIFICATION_REQUIRED",
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
      const consumed = await consumeEmailVerificationCode(email, verificationCode, "subscription");
      if (!consumed.ok) {
        return NextResponse.json(
          {
            success: false,
            message: consumed.message,
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
      effectiveUserId = null;
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
          userId: effectiveUserId ?? existing.userId ?? null,
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(emailSubscriptions.id, existing.id));
    } else {
      await db.insert(emailSubscriptions).values({
        email,
        userId: effectiveUserId,
        isActive: true,
      });
    }

    const [saved] = await db.select().from(emailSubscriptions).where(eq(emailSubscriptions.email, email)).limit(1);

    logUserActivity({
      userId: effectiveUserId,
      action: UserActivityAction.NEWSLETTER_SUBSCRIBED,
      metadata: { emailMasked: maskEmailForActivityLog(email) },
      request,
    });

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
    return subscriptionDbErrorResponse("POST /api/subscriptions", error, "订阅失败");
  }
}

type DeleteSubscriptionBody = {
  email?: string;
  /** 访客退订必填：与发码类型 subscription_unsubscribe 对应 */
  verificationCode?: string;
};

/**
 * 已登录用户：JWT 有效且邮箱与账号一致即可退订。
 * 访客：须提交邮箱验证码（类型 subscription_unsubscribe）校验通过后再退订。
 */
async function handleSubscriptionsDELETE(request: NextRequest) {
  try {
    const auth = requireAuthUser(request);
    if (!auth.ok && auth.reason === "invalid") {
      return NextResponse.json(
        {
          success: false,
          message: "登录已失效，请重新登录后再试",
          code: "AUTH_TOKEN_INVALID",
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body = (await request.json()) as DeleteSubscriptionBody;
    const email = (body.email || "").trim().toLowerCase();
    const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode.trim() : "";

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

    if (auth.ok) {
      const [account] = await db.select().from(users).where(eq(users.id, auth.user.userId)).limit(1);
      if (!account) {
        return NextResponse.json(
          {
            success: false,
            message: "用户不存在",
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 401 }
        );
      }
      const accountEmail = account.email.trim().toLowerCase();
      if (accountEmail !== email) {
        return NextResponse.json(
          {
            success: false,
            message: "仅可为当前登录账号的邮箱办理退订",
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 403 }
        );
      }
    } else {
      if (!verificationCode) {
        return NextResponse.json(
          {
            success: false,
            message: "请先获取邮箱验证码，验证通过后方可取消订阅",
            code: "SUBSCRIPTION_VERIFICATION_REQUIRED",
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
      const consumed = await consumeEmailVerificationCode(email, verificationCode, "subscription_unsubscribe");
      if (!consumed.ok) {
        return NextResponse.json(
          {
            success: false,
            message: consumed.message,
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>,
          { status: 400 }
        );
      }
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

    const unsubUserId = auth.ok ? auth.user.userId : null;
    logUserActivity({
      userId: unsubUserId,
      action: UserActivityAction.NEWSLETTER_UNSUBSCRIBED,
      metadata: { emailMasked: maskEmailForActivityLog(email) },
      request,
    });

    return NextResponse.json({
      success: true,
      message: "取消订阅成功",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  } catch (error) {
    return subscriptionDbErrorResponse("DELETE /api/subscriptions", error, "取消订阅失败");
  }
}

/** 统一访问日志与未捕获异常记录，见 lib/server/define-api-handlers.ts */
export const { GET, POST, DELETE } = defineApiHandlers({
  GET: handleSubscriptionsGET,
  POST: handleSubscriptionsPOST,
  DELETE: handleSubscriptionsDELETE,
});
