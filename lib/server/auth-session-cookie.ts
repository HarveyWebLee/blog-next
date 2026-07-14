import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isHttpsRequest } from "@/lib/server/request-protocol";

/** HttpOnly refresh token Cookie 名；仅挂载在 /api/auth 路径下。 */
export const REFRESH_TOKEN_COOKIE_NAME = "blog_refresh_token";

/** Cookie Path：仅认证相关接口携带，降低误发面。 */
export const REFRESH_TOKEN_COOKIE_PATH = "/api/auth";

const DEFAULT_REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * 将 JWT 风格时长（如 7d / 12h / 3600）解析为 Cookie maxAge 秒数。
 * 无法解析时回退到默认 30 天，与 env.example 中 JWT_REFRESH_EXPIRES_IN 对齐。
 */
export function parseDurationToSeconds(
  value: string | undefined,
  fallbackSeconds: number = DEFAULT_REFRESH_MAX_AGE_SECONDS
): number {
  if (!value) return fallbackSeconds;

  const trimmed = value.trim();
  const match = /^(\d+)([smhd])$/i.exec(trimmed);
  if (match) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return amount * (multipliers[unit] ?? 1);
  }

  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return Math.floor(asNumber);
  }

  return fallbackSeconds;
}

export function getRefreshTokenCookieMaxAgeSeconds(
  expiresIn: string | undefined = process.env.JWT_REFRESH_EXPIRES_IN
): number {
  return parseDurationToSeconds(expiresIn);
}

/**
 * 是否给 refresh Cookie 加 Secure。
 * - `AUTH_COOKIE_SECURE=true|false` 显式覆盖
 * - 默认 auto：跟随对外协议（含 `X-Forwarded-Proto`），**不再**因 NODE_ENV=production 强行 Secure
 *   （无 SSL 的 HTTP 生产站否则浏览器会丢弃 Cookie，导致登录/刷新失败）
 */
export function shouldUseSecureCookie(request?: NextRequest): boolean {
  const raw = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  if (!request) return false;
  return isHttpsRequest(request);
}

function buildCookieOptions(request?: NextRequest, maxAge?: number) {
  return {
    httpOnly: true as const,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax" as const,
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge,
  };
}

/** 写入或轮换 refresh token Cookie。 */
export function setRefreshTokenCookie(response: NextResponse, token: string, request?: NextRequest): void {
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...buildCookieOptions(request, getRefreshTokenCookieMaxAgeSeconds()),
  });
}

/** 登出或刷新失败时清除 Cookie。 */
export function clearRefreshTokenCookie(response: NextResponse, request?: NextRequest): void {
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
    ...buildCookieOptions(request, 0),
  });
}

export function readRefreshTokenCookie(request: NextRequest): string | null {
  const value = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value?.trim();
  return value || null;
}

/** 成功响应上附带 refresh Cookie，便于登录/刷新共用。 */
export function attachRefreshTokenCookie(response: NextResponse, token: string, request: NextRequest): NextResponse {
  setRefreshTokenCookie(response, token, request);
  return response;
}
