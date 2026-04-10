import { NextRequest, NextResponse } from "next/server";

import { hashPassword, validatePasswordStrength } from "@/lib/utils";
import { ApiResponse } from "@/types/blog";

// 模拟令牌验证（实际项目中应该从数据库验证）
const validTokens = new Map<string, { userId: number; expiry: Date }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // 验证输入
    if (!token || !newPassword) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "重置令牌和新密码不能为空",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "密码强度不符合要求",
          error: passwordValidation.errors.join("; "),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 验证重置令牌（这里使用内存存储，实际项目中应该从数据库验证）
    const tokenData = validTokens.get(token);
    if (!tokenData) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "无效或过期的重置令牌",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 检查令牌是否过期
    if (new Date() > tokenData.expiry) {
      validTokens.delete(token);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "重置令牌已过期，请重新申请",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 这里应该更新数据库中的用户密码
    // 由于当前没有重置令牌字段，我们模拟更新
    console.log(`用户 ${tokenData.userId} 的密码已重置`);

    // 删除已使用的令牌
    validTokens.delete(token);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "密码重置成功，请使用新密码登录",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("重置密码错误:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "服务器内部错误",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 用于测试的辅助函数（实际项目中不需要）
// export function addTestToken(token: string, userId: number, expiryMinutes: number = 30) {
//   validTokens.set(token, {
//     userId,
//     expiry: new Date(Date.now() + expiryMinutes * 60 * 1000),
//   });
// }
