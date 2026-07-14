/**
 * 登出：清除 HttpOnly refresh token Cookie。
 * 浏览器端须 credentials: "include"；携带 Cookie 时校验 Origin/Referer。
 */
import { NextRequest, NextResponse } from "next/server";

import { apiMessage } from "@/lib/i18n/api-response";
import { clearRefreshTokenCookie, readRefreshTokenCookie } from "@/lib/server/auth-session-cookie";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { rejectIfMutationOriginDenied } from "@/lib/server/request-origin-guard";
import { ApiResponse } from "@/types/blog";

async function handleAuthLogoutPOST(request: NextRequest) {
  const cookieToken = readRefreshTokenCookie(request);
  if (cookieToken) {
    const denied = rejectIfMutationOriginDenied(request);
    if (denied) return denied;
  }

  const response = NextResponse.json<ApiResponse>({
    success: true,
    message: apiMessage(request, "auth.logoutSuccess"),
    timestamp: new Date().toISOString(),
  });
  clearRefreshTokenCookie(response, request);
  return response;
}

export const { POST } = defineApiHandlers({ POST: handleAuthLogoutPOST });
