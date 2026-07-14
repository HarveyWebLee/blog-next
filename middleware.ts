import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import { applyApiCorsHeaders, getAllowedCorsOrigin } from "@/lib/server/api-cors";

// 支持的语言列表
const locales = ["zh-CN", "en-US", "ja-JP"];
const defaultLocale = "zh-CN";

// 获取首选语言
function getLocale(request: NextRequest): string {
  // 从 URL 路径中获取语言
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

  if (pathnameHasLocale) {
    const locale = pathname.split("/")[1];
    return locale;
  }

  // 从 Accept-Language 头部获取语言
  const headers = {
    "accept-language": request.headers.get("accept-language") || "zh-CN",
  };
  const languages = new Negotiator({ headers }).languages();

  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    const requestOrigin = request.headers.get("origin");
    const allowedOrigin = getAllowedCorsOrigin(requestOrigin);

    if (request.method === "OPTIONS") {
      if (requestOrigin && !allowedOrigin) {
        return NextResponse.json(
          {
            success: false,
            message: "CORS origin is not allowed",
            timestamp: new Date().toISOString(),
          },
          { status: 403, headers: { Vary: "Origin" } }
        );
      }

      const response = new NextResponse(null, { status: 204 });
      if (allowedOrigin) {
        applyApiCorsHeaders(response.headers, allowedOrigin);
      }
      return response;
    }

    const response = NextResponse.next();
    if (allowedOrigin) {
      applyApiCorsHeaders(response.headers, allowedOrigin);
    }
    return response;
  }

  // 检查路径是否已经包含语言代码
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

  if (pathnameHasLocale) return;

  // 重定向到包含语言代码的路径
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // 跳过静态资源；API 在 middleware 内单独处理 CORS，不参与语言重定向。
    "/((?!_next|favicon.ico|.*\\..*).*)",
  ],
};
