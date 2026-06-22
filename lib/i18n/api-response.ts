import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRequestLocale } from "@/lib/i18n/locale";
import { tApi, tApiOrRaw, type ApiMessageKey, type MessageParams } from "@/lib/i18n/messages";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/tool";
import type { Locale } from "@/types/common";

export function apiMessage(request: NextRequest, key: ApiMessageKey, params?: MessageParams): string {
  return tApi(getRequestLocale(request), key, params);
}

export function apiTimestamp(): string {
  return new Date().toISOString();
}

/** 标准 ApiResponse 成功体（含 timestamp） */
export function apiSuccessBody<T>(request: NextRequest, data: T, key?: ApiMessageKey, params?: MessageParams) {
  const message = key ? apiMessage(request, key, params) : tApi(getRequestLocale(request), "common.operationSuccess");
  return {
    ...createSuccessResponse(data, message),
    timestamp: apiTimestamp(),
  };
}

/** 标准 ApiResponse 错误体（含 timestamp 与顶层 message） */
export function apiErrorBody(request: NextRequest, key: ApiMessageKey, code?: string, params?: MessageParams) {
  const message = apiMessage(request, key, params);
  return {
    ...createErrorResponse(message, code),
    message,
    timestamp: apiTimestamp(),
  };
}

export function jsonSuccess<T>(
  request: NextRequest,
  data: T,
  key?: ApiMessageKey,
  status = 200,
  params?: MessageParams
) {
  return NextResponse.json(apiSuccessBody(request, data, key, params), { status });
}

export function jsonError(
  request: NextRequest,
  key: ApiMessageKey,
  status = 400,
  code?: string,
  params?: MessageParams
) {
  return NextResponse.json(apiErrorBody(request, key, code, params), { status });
}

/** 401：未提供 / 无效 Bearer */
export function jsonAuthError(request: NextRequest, reason: "missing" | "invalid") {
  const key: ApiMessageKey = reason === "missing" ? "common.tokenMissing" : "common.tokenInvalid";
  return jsonError(request, key, 401);
}

/** createErrorResponse 的 i18n 版本（用于仍返回 NextResponse.json(createErrorResponse(...)) 的路由） */
export function localizedErrorResponse(
  request: NextRequest,
  key: ApiMessageKey,
  code?: string,
  params?: MessageParams
) {
  return createErrorResponse(apiMessage(request, key, params), code);
}

export function localizedErrorFromRaw(request: NextRequest, message: string, code?: string, params?: MessageParams) {
  return createErrorResponse(tApiOrRaw(getRequestLocale(request), message, params), code);
}

export function localizedSuccessResponse<T>(
  request: NextRequest,
  data: T,
  key?: ApiMessageKey,
  params?: MessageParams
) {
  const message = key ? apiMessage(request, key, params) : undefined;
  return createSuccessResponse(data, message);
}

/** defineApiHandlers 默认 500 文案 */
export function defaultServiceUnavailableMessage(locale: Locale): string {
  return tApi(locale, "common.serviceUnavailable");
}

/** 限流类错误 */
export function jsonRateLimitError(
  request: NextRequest,
  retryAfterSeconds: number,
  key: ApiMessageKey = "common.rateLimit"
) {
  return NextResponse.json(
    {
      ...apiErrorBody(request, key, "RATE_LIMITED", { seconds: retryAfterSeconds }),
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
