import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { emailVerifications, userProfiles, users } from "@/lib/db/schema";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { generatePasswordResetToken, isValidEmail } from "@/lib/utils";
import { checkDistributedRateLimit } from "@/lib/utils/distributed-rate-limit";
import { sendPasswordResetLinkEmail } from "@/lib/utils/email";
import { ApiResponse } from "@/types/blog";

export async function POST(request: NextRequest) {
  try {
    /**
     * 兼容 API 文档调试器的空请求体场景：
     * - Content-Type: application/json 但 body 为空时，request.json() 会抛 SyntaxError
     * - 这里先按 text 读取，再按 JSON 解析；解析失败统一按空对象处理，走 400 参数校验
     */
    const rawBody = await request.text();
    let body: Record<string, unknown> = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "请求体 JSON 格式不正确",
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // 兼容 email 通过 query 传入，优先 body.email
    const bodyEmail = typeof body.email === "string" ? body.email : "";
    const queryEmail = request.nextUrl.searchParams.get("email") || "";
    const email = (bodyEmail || queryEmail).trim();

    // 验证输入
    if (!email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮箱地址不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮箱格式不正确",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 分布式限流（Redis 优先）-> 数据库回退：10 分钟最多 3 次。
    const distributedLimiter = await checkDistributedRateLimit(`forgot-password:${email}`, 3, 10 * 60 * 1000);
    if (distributedLimiter.supported && !distributedLimiter.allowed) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "请求过于频繁，请稍后重试",
          timestamp: new Date().toISOString(),
        },
        { status: 429, headers: { "Retry-After": String(distributedLimiter.retryAfterSeconds || 600) } }
      );
    }
    if (!distributedLimiter.supported) {
      const windowStart = new Date(Date.now() - 10 * 60 * 1000);
      const recentResetCount = await db
        .select({ c: count() })
        .from(emailVerifications)
        .where(
          and(
            eq(emailVerifications.email, email),
            eq(emailVerifications.type, "reset_password"),
            gt(emailVerifications.createdAt, windowStart)
          )
        );
      const hitCount = Number(recentResetCount[0]?.c ?? 0);
      if (hitCount >= 3) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: "请求过于频繁，请稍后重试",
            timestamp: new Date().toISOString(),
          },
          { status: 429, headers: { "Retry-After": "600" } }
        );
      }
    }

    // 查找用户
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "该邮箱地址未注册",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 生成一次性重置 token（长度受 email_verifications.code 字段约束）。
    const resetToken = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 失效同邮箱旧 token，只保留最新一条，避免多 token 并存导致风险。
    await db
      .update(emailVerifications)
      .set({ isUsed: true, updatedAt: new Date() })
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.type, "reset_password"),
          eq(emailVerifications.isUsed, false)
        )
      );

    await db.insert(emailVerifications).values({
      email,
      code: resetToken,
      type: "reset_password",
      isUsed: false,
      expiresAt,
    });

    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user[0].id)).limit(1);
    const locale =
      profile?.language === "en-US" || profile?.language === "ja-JP" || profile?.language === "zh-CN"
        ? profile.language
        : "zh-CN";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    const emailSent = await sendPasswordResetLinkEmail(email, resetUrl, locale);

    if (!emailSent) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "邮件发送失败，请稍后重试",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    logUserActivity({
      userId: user[0].id,
      action: UserActivityAction.PASSWORD_RESET_REQUESTED,
      description: "发起密码重置请求",
      metadata: { email, locale },
      request,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "密码重置邮件已发送，请检查您的邮箱",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("忘记密码处理失败:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "服务器内部错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
