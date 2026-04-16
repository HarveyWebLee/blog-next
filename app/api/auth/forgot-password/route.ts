import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { users } from "@/lib/db/schema";
import { generatePasswordResetToken, isValidEmail } from "@/lib/utils";
import { ApiResponse } from "@/types/blog";

// 模拟发送邮件功能（实际项目中应该集成真实的邮件服务）
async function sendPasswordResetEmail(email: string, resetToken: string) {
  // 这里应该集成真实的邮件服务，如 SendGrid、Nodemailer 等
  console.log(`密码重置邮件发送到: ${email}`);
  console.log(`重置令牌: ${resetToken}`);
  console.log(`重置链接: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`);

  // 模拟邮件发送成功
  return true;
}

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

    // 生成重置令牌
    const resetToken = generatePasswordResetToken();

    // 这里应该将重置令牌存储到数据库，并设置过期时间
    // 为了简化，我们暂时跳过这一步

    // 发送重置邮件
    const emailSent = await sendPasswordResetEmail(email, resetToken);

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
