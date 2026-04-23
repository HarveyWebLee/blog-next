import { logger } from "@/lib/server/logger";

/**
 * 解析 Drizzle / mysql2 抛出的错误链。
 * Drizzle 常把「Failed query」包在外层，真实 MySQL 驱动错误在 `cause` 上。
 */
export function findMysqlDriverError(
  error: unknown
): { errno?: number; code?: string; sqlMessage?: string } | undefined {
  const visited = new WeakSet<object>();
  let current: unknown = error;

  for (let depth = 0; depth < 12 && current != null; depth++) {
    if (typeof current !== "object") break;
    if (visited.has(current as object)) break;
    visited.add(current as object);

    const o = current as {
      errno?: number;
      code?: string;
      sqlMessage?: string;
      cause?: unknown;
    };

    if (typeof o.errno === "number" || (typeof o.code === "string" && o.code.length > 0)) {
      return {
        errno: o.errno,
        code: o.code,
        sqlMessage: o.sqlMessage,
      };
    }

    current = o.cause;
  }

  return undefined;
}

/**
 * 表不存在（未建表或未执行迁移）。
 * MySQL errno 1146 / SQLSTATE 42S02
 */
export function isMysqlTableMissingError(error: unknown): boolean {
  const m = findMysqlDriverError(error);
  return m?.errno === 1146 || m?.code === "ER_NO_SUCH_TABLE";
}

/**
 * Node 网络层在连库阶段常见错误码（在 error / error.cause 链上，如 mysql2 的 ETIMEDOUT）。
 * 与 MySQL 协议层 errno（如 1146）区分，便于对外映射为 503 / 统一日志字段。
 */
const CONNECTIVITY_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ECONNRESET",
  "EPIPE",
]);

/**
 * 从整条异常链上解析 TCP/连接阶段错误码（若有）。
 */
export function findConnectivityErrorCode(error: unknown): string | undefined {
  const visited = new WeakSet<object>();
  let current: unknown = error;

  for (let depth = 0; depth < 12 && current != null; depth++) {
    if (typeof current !== "object") break;
    if (visited.has(current as object)) break;
    visited.add(current as object);

    const o = current as { code?: unknown; cause?: unknown };
    if (typeof o.code === "string" && CONNECTIVITY_ERROR_CODES.has(o.code)) {
      return o.code;
    }
    current = o.cause;
  }

  return undefined;
}

/** 是否为「连不上库」类错误（超时、拒绝连接、DNS 失败等） */
export function isMysqlConnectionError(error: unknown): boolean {
  return findConnectivityErrorCode(error) !== undefined;
}

/**
 * 生成单行摘要：优先网络码与 SQL 语义，避免把 Drizzle 整段「Failed query + SQL」打进日志正文。
 */
export function summarizeDbError(error: unknown): string {
  const connectivity = findConnectivityErrorCode(error);
  if (connectivity) {
    return `connect ${connectivity}`;
  }

  const driver = findMysqlDriverError(error);
  if (driver?.sqlMessage) {
    return driver.sqlMessage.slice(0, 160);
  }

  if (error instanceof Error) {
    const firstLine = error.message.split("\n")[0];
    // Drizzle 外层常为 Failed query，真实原因多在 cause；此处仅作降级摘要
    if (firstLine.startsWith("Failed query:")) {
      return "query failed (see connectivity/mysql fields if logged)";
    }
    return firstLine.slice(0, 200);
  }

  return String(error).slice(0, 120);
}

/**
 * 服务端记录数据库相关异常：走统一 {@link logger}（error 级别），结构化字段 + 单行摘要。
 * 开发环境另打一条 debug 附带 stack，避免刷屏整段 Drizzle SQL。
 *
 * @param scope 业务位置，如 `[home]`、`GET /api/subscriptions`
 */
export function logDbError(scope: string, error: unknown): void {
  const connectivity = findConnectivityErrorCode(error);
  const driver = findMysqlDriverError(error);
  const summary = summarizeDbError(error);

  logger.error("db", summary, {
    scope,
    connectivity: connectivity ?? undefined,
    mysqlErrno: driver?.errno ?? undefined,
    mysqlCode: driver?.code ?? undefined,
  });

  if (process.env.NODE_ENV === "development" && error instanceof Error && error.stack) {
    logger.debug("db", "(stack)", { scope, stack: error.stack });
  }
}
