/**
 * 统一浏览器端 API 请求：自动附带 Bearer（若有）、credentials: include，
 * 并在调用方需要时与 Cookie refresh / 401 拦截器协同。
 */

import {
  clearLegacyRefreshTokenStorage,
  clientBearerHeaders,
  getClientAccessToken,
  setClientAccessToken,
} from "@/lib/utils/client-bearer-auth";

type FetchInput = RequestInfo | URL;

let refreshInFlight: Promise<boolean> | null = null;

function mergeHeaders(init?: RequestInit, extra?: Record<string, string>): Headers {
  const headers = new Headers(init?.headers);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (!headers.has(key)) {
        headers.set(key, value);
      }
    }
  }
  return headers;
}

/**
 * 使用 HttpOnly refresh Cookie 换取新的 accessToken。
 * 单飞：并发调用共享同一 Promise，避免刷新风暴。
 * @param fetchImpl 默认 window.fetch；拦截器内应传入原始 fetch 以避免递归。
 */
export async function refreshClientAccessToken(
  fetchImpl: typeof fetch = typeof window !== "undefined" ? window.fetch.bind(window) : fetch
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetchImpl("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        data?: { token?: string };
      } | null;

      if (response.ok && data?.success && data.data?.token) {
        setClientAccessToken(data.data.token);
        clearLegacyRefreshTokenStorage();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export type ClientApiFetchOptions = RequestInit & {
  /** 默认 true：合并当前 accessToken 为 Authorization（调用方已设置则不覆盖） */
  auth?: boolean;
};

/**
 * 业务侧推荐入口：同源 /api 请求统一带 Cookie 与可选 Bearer。
 * 401 刷新重试由 {@link installClientApi401Interceptor} 在全局 fetch 层处理。
 */
export async function clientApiFetch(input: FetchInput, init: ClientApiFetchOptions = {}): Promise<Response> {
  const { auth = true, ...rest } = init;
  const headers = mergeHeaders(rest, auth ? clientBearerHeaders() : undefined);

  return fetch(input, {
    ...rest,
    credentials: rest.credentials ?? "include",
    headers,
  });
}

/** 是否已持有可附带的 accessToken（用于门禁跳转等，勿直接读 localStorage）。 */
export function hasClientAccessToken(): boolean {
  return Boolean(getClientAccessToken());
}
