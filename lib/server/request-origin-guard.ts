import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { apiMessage } from "@/lib/i18n/api-response";
import { getAllowedCorsOrigin } from "@/lib/server/api-cors";
import type { ApiResponse } from "@/types/blog";

/**
 * Cookie 会话写操作的 Origin/Referer 校验。
 * 允许：与 Host 同站，或落在 CORS_ORIGIN 白名单。
 * 缺少 Origin 与 Referer 时拒绝，降低跨站表单 CSRF 面。
 */
export function isMutationOriginAllowed(request: NextRequest): boolean {
  const host = request.headers.get("host")?.trim();
  const originHeader = request.headers.get("origin")?.trim();

  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      if (host && originUrl.host === host) return true;
      return getAllowedCorsOrigin(originHeader) !== null;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer")?.trim();
  if (!referer) return false;

  try {
    const refererUrl = new URL(referer);
    if (host && refererUrl.host === host) return true;
    return getAllowedCorsOrigin(refererUrl.origin) !== null;
  } catch {
    return false;
  }
}

/** 未通过 Origin 校验时返回 403；通过则返回 null。 */
export function rejectIfMutationOriginDenied(request: NextRequest): NextResponse | null {
  if (isMutationOriginAllowed(request)) return null;

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      message: apiMessage(request, "auth.originRejected"),
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}
