import { logger } from "@/lib/server/logger";

type RouteUnhandledErrorPayload = {
  method: string;
  path: string;
  ms: number;
  message: string;
  meta: Record<string, unknown>;
};

/**
 * 轻量告警桥接（示例）：
 * - `LOG_ALERTS_ENABLED=1` 时启用
 * - 可选 `LOG_ALERT_WEBHOOK_URL`，异步 POST 告警摘要
 */
export function notifyRouteUnhandledError(payload: RouteUnhandledErrorPayload): void {
  if (process.env.LOG_ALERTS_ENABLED !== "1") return;

  logger.warn("alert", "route unhandled error", {
    channel: "route",
    ...payload,
  });

  const webhook = (process.env.LOG_ALERT_WEBHOOK_URL || "").trim();
  if (!webhook) return;

  const body = JSON.stringify({
    title: "Route Unhandled Error",
    ...payload,
    ts: new Date().toISOString(),
  });

  void fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch((error) => {
    logger.warn("alert", "webhook notify failed", {
      path: payload.path,
      err: error instanceof Error ? error.message : String(error),
    });
  });
}
