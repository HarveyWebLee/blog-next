import { NextRequest } from "next/server";

type RateLimitBucket = {
  hits: number[];
};

const BUCKETS = new Map<string, RateLimitBucket>();

/**
 * 轻量内存限流（单实例生效）：
 * - 适用于匿名防刷打点类接口；
 * - 使用滑动时间窗统计命中次数；
 * - 进程重启后会自动清空。
 */
export function checkRateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const bucket = BUCKETS.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((ts) => ts > windowStart);

  if (bucket.hits.length >= maxHits) {
    const oldestHit = bucket.hits[0] ?? now;
    const retryAfterMs = Math.max(1000, windowMs - (now - oldestHit));
    BUCKETS.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  bucket.hits.push(now);
  BUCKETS.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * 从 NextRequest 中提取客户端 IP 地址。
 * 优先信任反向代理注入的头；无可用头时返回 `unknown`（与活动日志等模块一致）。
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}
