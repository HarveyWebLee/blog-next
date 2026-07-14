export type ApiRateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEnvironment = {
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW?: string;
};

const DEFAULT_MAX_REQUESTS = 100;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_LIMIT = 10_000;
const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

function readPositiveInteger(value: string | undefined, fallback: number, max: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    return fallback;
  }

  return parsed;
}

/**
 * API 全局限流配置。
 *
 * RATE_LIMIT_WINDOW 以毫秒为单位，RATE_LIMIT_MAX_REQUESTS 为每个客户端 IP 在该窗口内的总请求上限。
 * 单个路由仍可叠加自己的更严格规则。
 */
export function getApiRateLimitConfig(env?: RateLimitEnvironment): ApiRateLimitConfig {
  const source = env ?? (process.env as RateLimitEnvironment);

  return {
    windowMs: readPositiveInteger(source.RATE_LIMIT_WINDOW, DEFAULT_WINDOW_MS, MAX_WINDOW_MS),
    maxRequests: readPositiveInteger(source.RATE_LIMIT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS, MAX_REQUESTS_LIMIT),
  };
}
