import type { NextRequest } from "next/server";

import type { Locale } from "@/types/common";

/** 与 middleware.ts、dictionaries 保持一致 */
export const SUPPORTED_LOCALES: readonly Locale[] = ["zh-CN", "en-US", "ja-JP"] as const;
export const DEFAULT_LOCALE: Locale = "zh-CN";

/** 将任意 lang 字符串收窄为受支持 Locale */
export function resolveLocale(lang?: string | null): Locale {
  if (lang && SUPPORTED_LOCALES.includes(lang as Locale)) {
    return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * 从 API 请求解析用户语言（优先级：X-Locale > lang 查询参数 > Accept-Language > 默认 zh-CN）。
 * 浏览器端 fetch 拦截器会为同源 /api 请求自动附加 X-Locale。
 */
export function getRequestLocale(request: NextRequest): Locale {
  const headerLocale = request.headers.get("x-locale")?.trim();
  if (headerLocale && isLocale(headerLocale)) {
    return headerLocale;
  }

  const queryLang = request.nextUrl.searchParams.get("lang")?.trim();
  if (queryLang && isLocale(queryLang)) {
    return queryLang;
  }

  const accept = request.headers.get("accept-language");
  if (accept) {
    const parts = accept
      .split(",")
      .map((p) => p.split(";")[0]?.trim().toLowerCase())
      .filter(Boolean);
    for (const part of parts) {
      if (part === "zh-cn" || part.startsWith("zh")) return "zh-CN";
      if (part === "ja-jp" || part.startsWith("ja")) return "ja-JP";
      if (part === "en-us" || part.startsWith("en")) return "en-US";
    }
  }

  return DEFAULT_LOCALE;
}

/** 浏览器端：从 pathname 首段解析当前页面语言 */
export function getClientPageLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const first = window.location.pathname.split("/").filter(Boolean)[0];
  return resolveLocale(first);
}
