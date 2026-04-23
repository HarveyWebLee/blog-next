import Redis from "ioredis";

import { PASSWORD_TRANSPORT_DEFAULT_MAX_SKEW_MS, PASSWORD_TRANSPORT_NONCE_TTL_SECONDS } from "./constants";

/** 与 distributed-rate-limit 相同懒加载策略，避免无 Redis 时抛出 */
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    redisClient = null;
    return redisClient;
  }
  try {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

/** 进程内 nonce 窗口（仅无 Redis 或 Redis 故障时）；结构：nonce -> 过期时间戳 */
const memoryNonces = new Map<string, number>();

function sweepMemoryNonces(): void {
  const now = Date.now();
  for (const [k, exp] of Array.from(memoryNonces.entries())) {
    if (exp <= now) memoryNonces.delete(k);
  }
}

/**
 * 断言 nonce 未被使用过（SET NX）；失败表示潜在重放。
 */
export async function assertPasswordTransportNonceFresh(nonce: string): Promise<{ ok: true } | { ok: false }> {
  const trimmed = nonce.trim();
  if (!trimmed || trimmed.length < 8) {
    return { ok: false };
  }

  const ttl = Math.max(
    PASSWORD_TRANSPORT_NONCE_TTL_SECONDS,
    Math.ceil(PASSWORD_TRANSPORT_DEFAULT_MAX_SKEW_MS / 1000) + 120
  );
  const redisKey = `pw-tx-nonce:${trimmed}`;

  const client = getRedis();
  if (client) {
    try {
      if (client.status !== "ready") {
        await client.connect();
      }
      const r = await client.set(redisKey, "1", "EX", ttl, "NX");
      if (r !== "OK") {
        return { ok: false };
      }
      return { ok: true };
    } catch {
      // fall through memory
    }
  }

  sweepMemoryNonces();
  if (memoryNonces.has(trimmed)) {
    return { ok: false };
  }
  memoryNonces.set(trimmed, Date.now() + ttl * 1000);
  return { ok: true };
}
