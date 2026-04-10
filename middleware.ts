import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

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
  const headers = { "accept-language": request.headers.get("accept-language") || "zh-CN" };
  const languages = new Negotiator({ headers }).languages();

  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    // 跳过所有内部路径 (_next)
    "/((?!_next|api|favicon.ico|.*\\..*).*)",
  ],
};
