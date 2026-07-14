import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import {
  getSuperAdminConfiguredUsername,
  getSuperAdminProfileUserId,
  resolveSuperAdminLogin,
} from "@/lib/config/super-admin";
import { resolveSecretFromBody } from "@/lib/crypto/password-transport/resolve-secret";
import { db } from "@/lib/db/config";
import { userProfiles, users } from "@/lib/db/schema";
import {
  apiMessage,
  jsonRateLimitError,
  localizedErrorResponse,
  localizedSuccessResponse,
} from "@/lib/i18n/api-response";
import { getRequestLocale } from "@/lib/i18n/locale";
import { attachRefreshTokenCookie } from "@/lib/server/auth-session-cookie";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { generateAccessToken, generateRefreshToken, verifyPassword } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/utils/request-rate-limit";
import { ApiResponse, LoginResponse } from "@/types/blog";

/**
 * 用户登录（含超级管理员应急通道）。
 * 成功后写入 HttpOnly `blog_refresh_token` Cookie；响应体仅返回 accessToken（`token`）与用户信息。
 */
async function handleAuthLoginPOST(request: NextRequest) {
  try {
    // 速率限制：5 次/15 分钟
    const clientIp = getClientIp(request);
    const limiter = checkRateLimit(`login:ip:${clientIp}`, 5, 15 * 60 * 1000);
    if (!limiter.allowed) {
      return jsonRateLimitError(request, limiter.retryAfterSeconds);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const locale = getRequestLocale(request);
    const secret = await resolveSecretFromBody({ body, plainField: "password", locale, request });
    if (!secret.ok) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: secret.message,
          timestamp: new Date().toISOString(),
        },
        { status: secret.status }
      );
    }
    const usernameRaw = body.username;
    const password = secret.plaintext;
    const username = typeof usernameRaw === "string" ? usernameRaw.trim() : String(usernameRaw ?? "").trim();

    // 验证输入
    if (!username || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.usernamePasswordRequired"),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ① 超级管理员（支持用户名登录；若绑定邮箱，也支持邮箱登录）
    let superAdminLoginName = username;
    if (username.includes("@")) {
      const superProfileUserId = await getSuperAdminProfileUserId();
      const profileRows =
        superProfileUserId == null
          ? []
          : await db
              .select({ email: userProfiles.email })
              .from(userProfiles)
              .where(eq(userProfiles.userId, superProfileUserId))
              .limit(1);
      const superEmail = profileRows[0]?.email?.trim().toLowerCase() || "";
      if (superEmail && superEmail === username.toLowerCase()) {
        const configuredUsername = getSuperAdminConfiguredUsername();
        if (configuredUsername) {
          superAdminLoginName = configuredUsername;
        }
      }
    }

    const superAdminResult = await resolveSuperAdminLogin(superAdminLoginName, password);
    if (superAdminResult === "bad_credentials") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.invalidCredentials"),
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    if (typeof superAdminResult === "object") {
      const profileRows = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, superAdminResult.user.id))
        .limit(1);
      let persistedAvatar: string | undefined;
      let persistedEmail: string | undefined;
      let persistedDisplayName: string | undefined;
      if (profileRows[0]) {
        persistedEmail = profileRows[0].email?.trim() || undefined;
        const firstName = profileRows[0].firstName?.trim() || "";
        const lastName = profileRows[0].lastName?.trim() || "";
        persistedDisplayName = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
        try {
          const social = profileRows[0].socialLinks
            ? (JSON.parse(profileRows[0].socialLinks) as Record<string, unknown>)
            : {};
          persistedAvatar = typeof social.avatar === "string" ? social.avatar.trim() || undefined : undefined;
        } catch {
          persistedAvatar = undefined;
        }
      }
      // 头像：以 users 表为准（资料保存写入 users.avatar）；social_links 仅作历史兼容回退，避免旧默认图覆盖新头像
      const dbAvatar = typeof superAdminResult.user.avatar === "string" ? superAdminResult.user.avatar.trim() : "";
      const mergedAvatar = dbAvatar || persistedAvatar || undefined;
      // 与普通用户分支一致：成功登录后写入最后登录时间，管理端用户列表才能展示
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, superAdminResult.user.id));

      const response: LoginResponse = {
        user: {
          ...superAdminResult.user,
          ...(persistedEmail ? { email: persistedEmail } : {}),
          ...(persistedDisplayName ? { displayName: persistedDisplayName } : {}),
          ...(mergedAvatar !== undefined ? { avatar: mergedAvatar } : {}),
        },
        token: superAdminResult.accessToken,
      };
      return attachRefreshTokenCookie(
        NextResponse.json<ApiResponse<LoginResponse>>({
          success: true,
          message: apiMessage(request, "auth.loginSuccess"),
          data: response,
          timestamp: new Date().toISOString(),
        }),
        superAdminResult.refreshToken,
        request
      );
    }

    // ② 数据库用户：先按用户名/邮箱命中行，再验密码；非 active 时明确提示（与刷新令牌逻辑一致）
    const identifier = username.includes("@") ? eq(users.email, username) : eq(users.username, username);
    const userRows = await db.select().from(users).where(identifier).limit(1);

    if (userRows.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.invalidCredentials"),
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const userData = userRows[0];

    const isPasswordValid = await verifyPassword(password, userData.password);
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.invalidCredentials"),
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (userData.status !== "active") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "auth.accountDisabled"),
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 更新最后登录时间
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userData.id));

    // 生成令牌
    const accessToken = generateAccessToken({
      userId: userData.id,
      username: userData.username,
      role: userData.role || "user",
    });

    const refreshToken = generateRefreshToken({
      userId: userData.id,
      username: userData.username,
    });

    // 构建响应数据（排除密码）
    const { password: _, ...userWithoutPassword } = userData;

    const response: LoginResponse = {
      user: userWithoutPassword as any,
      token: accessToken,
    };

    return attachRefreshTokenCookie(
      NextResponse.json<ApiResponse<LoginResponse>>({
        success: true,
        message: apiMessage(request, "auth.loginSuccess"),
        data: response,
        timestamp: new Date().toISOString(),
      }),
      refreshToken,
      request
    );
  } catch (error) {
    throw error;
  }
}

export const { POST } = defineApiHandlers(
  { POST: handleAuthLoginPOST },
  {
    onError: (payload) => {
      notifyRouteUnhandledError(payload);
    },
    onUnhandledErrorResponse: ({ request }) =>
      NextResponse.json<ApiResponse>(
        {
          success: false,
          message: apiMessage(request, "common.internalError"),
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      ),
  }
);
