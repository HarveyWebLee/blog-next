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
