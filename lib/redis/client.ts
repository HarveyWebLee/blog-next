import Redis from "ioredis";

let redisClient: Redis | null | undefined;
let redisInitError: Error | null = null;

/**
 * 获取全局 Redis 客户端
 * - 单例模式，首次初始化后复用
 * - 若初始化失败返回 null，调用方应实现降级方案
 */
export function getRedisClient(): Redis | null {
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
      if (redisInitError === null) {
        redisInitError = error;
        console.error("[redis-client] Redis 连接失败:", error.message);
      }
    });

    redisClient.on("connect", () => {
      console.info("[redis-client] Redis 连接成功");
    });
  } catch (error) {
    redisInitError = error instanceof Error ? error : new Error(String(error));
    console.error("[redis-client] Redis 客户端初始化失败:", redisInitError.message);
    redisClient = null;
  }

  return redisClient;
}

/**
 * 判断 Redis 是否可用（已连接或正在尝试）
 */
export function isRedisAvailable(): boolean {
  const client = getRedisClient();
  return client !== null && (client.status === "ready" || client.status === "connecting");
}

/**
 * 获取 Redis 初始化错误（若有）
 */
export function getRedisInitError(): Error | null {
  getRedisClient(); // 确保已初始化
  return redisInitError;
}
