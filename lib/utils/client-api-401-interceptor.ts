/**
 * 浏览器端全局 fetch 401 处理：在「响应阶段」拦截本域 /api 返回的 401，
 * 先尝试 Cookie 刷新并重试一次，仍失败再登出并跳转登录页。
 *
 * 注意：
 * - 仅替换 window.fetch；服务端 Node fetch 不受影响。
 * - 登录/注册等「凭据错误」返回的 401 不应触发整站登出，见 {@link isCredentialAuthApiPath}。
 */

import { getClientPageLocale } from "@/lib/i18n/locale";
import { refreshClientAccessToken } from "@/lib/utils/client-api-fetch";
import { getClientAccessToken } from "@/lib/utils/client-bearer-auth";
import type { Locale } from "@/types/common";

/** 与 middleware 中 locales、默认语言保持一致 */
const LOCALES: readonly Locale[] = ["zh-CN", "en-US", "ja-JP"];
const DEFAULT_LOCALE: Locale = "zh-CN";

/**
 * 这些接口的 401 表示账号/验证码等业务错误，而非「登录态失效」，
 * 不应触发 clearStorage + 跳转登录。
 */
const CREDENTIAL_AUTH_PATH_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/send-verification-code",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
] as const;

export function isCredentialAuthApiPath(pathname: string): boolean {
  return CREDENTIAL_AUTH_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 根据当前页面 URL 第一段解析语言，生成带语言前缀的登录路径。
 */
export function getLoginRedirectPath(): string {
  if (typeof window === "undefined") {
    return `/${DEFAULT_LOCALE}/auth/login`;
  }
  const first = window.location.pathname.split("/").filter(Boolean)[0];
  const lang: Locale = LOCALES.includes(first as Locale) ? (first as Locale) : DEFAULT_LOCALE;
  return `/${lang}/auth/login`;
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
}

function withUpdatedBearer(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }
  return { ...init, headers };
}

/**
 * 包装 window.fetch：若响应为 401 且命中规则则先刷新重试，仍失败再 onUnauthorized。
 * @returns 卸载函数，用于 React useEffect 清理或 HMR，恢复原生 fetch。
 */
export function installClientApi401Interceptor(onUnauthorized: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const originalFetch = window.fetch.bind(window);
  let inFlightUnauthorized = false;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // 在请求发出前记录是否曾持有 accessToken，用于区分「登录态失效」与「未登录访问受保护资源」
    const hadAccessTokenBefore = Boolean(getClientAccessToken());

    // 同源 /api 请求自动附加当前页面语言，供后端 apiMessage 解析
    let patchedInit = init;
    const urlStr = resolveRequestUrl(input);
    try {
      const u = new URL(urlStr, window.location.origin);
      if (u.origin === window.location.origin && u.pathname.startsWith("/api")) {
        const locale = getClientPageLocale();
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("X-Locale")) {
          headers.set("X-Locale", locale);
        }
        patchedInit = { ...init, credentials: init?.credentials ?? "include", headers };
      }
    } catch {
      // 忽略 URL 解析失败，走原始 fetch
    }

    const response = await originalFetch(input, patchedInit);

    if (response.status !== 401) {
      return response;
    }

    let pathname: string;
    try {
      const u = new URL(urlStr, window.location.origin);
      if (u.origin !== window.location.origin) {
        return response;
      }
      pathname = u.pathname;
    } catch {
      return response;
    }

    if (!pathname.startsWith("/api")) {
      return response;
    }
    if (isCredentialAuthApiPath(pathname)) {
      return response;
    }

    // 从未持有过访问令牌的 401（例如访客误调受保护接口）只把响应交给调用方，不执行整站登出
    if (!hadAccessTokenBefore) {
      return response;
    }

    // refresh 自身 401：直接视为会话失效
    if (pathname === "/api/auth/refresh" || pathname.startsWith("/api/auth/refresh/")) {
      if (!inFlightUnauthorized) {
        inFlightUnauthorized = true;
        try {
          onUnauthorized();
        } finally {
          queueMicrotask(() => {
            inFlightUnauthorized = false;
          });
        }
      }
      return response;
    }

    // 先尝试 Cookie 刷新并重试一次（使用原始 fetch，避免递归）
    const refreshed = await refreshClientAccessToken(originalFetch);
    if (refreshed) {
      const token = getClientAccessToken();
      const retryInit = withUpdatedBearer(patchedInit, token);
      const retryResponse = await originalFetch(input, retryInit);
      if (retryResponse.status !== 401) {
        return retryResponse;
      }
    }

    if (inFlightUnauthorized) {
      return response;
    }
    inFlightUnauthorized = true;
    try {
      onUnauthorized();
    } finally {
      queueMicrotask(() => {
        inFlightUnauthorized = false;
      });
    }

    return response;
  };

  return () => {
    window.fetch = originalFetch;
  };
}
