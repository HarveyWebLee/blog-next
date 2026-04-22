import Redis from "ioredis";

let redisClient: Redis | null | undefined;
let redisInitLogged = false;

function getRedisClient(): Redis | null {
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

    redisClient.on("error", (error) => {
      if (!redisInitLogged) {
        console.error("[distributed-rate-limit] Redis 不可用，将自动回退本地/数据库限流:", error);
        redisInitLogged = true;
      }
    });
  } catch (error) {
    console.error("[distributed-rate-limit] Redis 客户端初始化失败:", error);
    redisClient = null;
  }

  return redisClient;
}

/**
 * Redis 分布式限流（固定窗口）：
 * - 优先用于跨实例部署；
 * - 若 Redis 不可用，调用方应回退到其他限流策略。
 */
export async function checkDistributedRateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): Promise<{ supported: boolean; allowed: boolean; retryAfterSeconds: number }> {
  const client = getRedisClient();
  if (!client) {
    return { supported: false, allowed: true, retryAfterSeconds: 0 };
  }

  try {
    if (client.status !== "ready") {
      await client.connect();
    }

    const now = Date.now();
    const windowIndex = Math.floor(now / windowMs);
    const redisKey = `rate-limit:${key}:${windowIndex}`;

    const hits = await client.incr(redisKey);
    if (hits === 1) {
      await client.expire(redisKey, Math.ceil(windowMs / 1000) + 1);
    }

    if (hits > maxHits) {
      const windowEnd = (windowIndex + 1) * windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((windowEnd - now) / 1000));
      return { supported: true, allowed: false, retryAfterSeconds };
    }

    return { supported: true, allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    console.error("[distributed-rate-limit] Redis 限流执行失败，将回退:", error);
    return { supported: false, allowed: true, retryAfterSeconds: 0 };
  }
}
