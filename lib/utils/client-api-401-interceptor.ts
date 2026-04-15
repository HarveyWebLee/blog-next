/**
 * 浏览器端全局 fetch 401 处理：在「响应阶段」拦截本域 /api 返回的 401，
 * 执行登出并跳转登录页（效果上接近 axios 的 response interceptor）。
 *
 * 注意：
 * - 仅替换 window.fetch；服务端 Node fetch 不受影响。
 * - 登录/注册等「凭据错误」返回的 401 不应触发整站登出，见 {@link isCredentialAuthApiPath}。
 */

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

/**
 * 包装 window.fetch：若响应为 401 且命中规则则调用 onUnauthorized（登出 + 跳转等）。
 * @returns 卸载函数，用于 React useEffect 清理或 HMR，恢复原生 fetch。
 */
export function installClientApi401Interceptor(onUnauthorized: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const originalFetch = window.fetch.bind(window);
  let inFlight401 = false;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // 在请求发出前记录是否曾持有 accessToken，用于区分「登录态失效」与「未登录访问受保护资源」
    const hadAccessTokenBefore = Boolean(localStorage.getItem("accessToken"));

    const response = await originalFetch(input, init);

    if (response.status !== 401) {
      return response;
    }

    const urlStr = resolveRequestUrl(input);
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

    if (inFlight401) {
      return response;
    }
    inFlight401 = true;
    try {
      onUnauthorized();
    } finally {
      queueMicrotask(() => {
        inFlight401 = false;
      });
    }

    return response;
  };

  return () => {
    window.fetch = originalFetch;
  };
}
