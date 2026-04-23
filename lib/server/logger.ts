/**
 * 服务端统一日志（Next Route Handler / Server Components / Node 脚本）。
 *
 * - **分级**：`debug` / `info` / `warn` / `error`，控制台按级别着色（TTY 且未设置 NO_COLOR）。
 * - **格式**：`ISO时间 | LEVEL | [scope] message` + 可选 JSON `meta`。
 * - **环境**：`LOG_LEVEL`=debug|info|warn|error（未设置时 development 默认为 debug，否则 info）；
 *   `FORCE_COLOR=1` 强制着色，`NO_COLOR` 禁用着色。
 *
 * API 路由请优先用 {@link defineApiHandlers} 包一层，自动打访问日志（状态码 + 耗时），避免每个 route 手写。
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function parseMinLevel(raw: string | undefined): LogLevel {
  const v = (raw || "").toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

const MIN_LEVEL: LogLevel = parseMinLevel(process.env.LOG_LEVEL);

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];
}

function ttyColorEnabled(): boolean {
  if (process.env.FORCE_COLOR === "1") return true;
  if (process.env.NO_COLOR != null || process.env.TERM === "dumb") return false;
  return Boolean(process.stdout?.isTTY);
}

const ansi = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function paintLevel(level: LogLevel, label: string): string {
  if (!ttyColorEnabled()) return label;
  switch (level) {
    case "debug":
      return `${ansi.dim}${label}${ansi.reset}`;
    case "info":
      return `${ansi.cyan}${label}${ansi.reset}`;
    case "warn":
      return `${ansi.yellow}${label}${ansi.reset}`;
    case "error":
      return `${ansi.red}${label}${ansi.reset}`;
    default:
      return label;
  }
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' {"_meta":"serialize_failed"}';
  }
}

function emit(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  if (!shouldEmit(level)) return;

  const ts = new Date().toISOString();
  const levelLabel = level.toUpperCase().padEnd(5);
  const coloredLevel = paintLevel(level, levelLabel);
  const scopeBracket = ttyColorEnabled() ? `${ansi.dim}[${scope}]${ansi.reset}` : `[${scope}]`;
  const line = `${ts} ${coloredLevel} ${scopeBracket} ${message}${formatMeta(meta)}`;

  switch (level) {
    case "debug":
    case "info":
      console.log(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

export const logger = {
  debug(scope: string, message: string, meta?: Record<string, unknown>): void {
    emit("debug", scope, message, meta);
  },

  info(scope: string, message: string, meta?: Record<string, unknown>): void {
    emit("info", scope, message, meta);
  },

  warn(scope: string, message: string, meta?: Record<string, unknown>): void {
    emit("warn", scope, message, meta);
  },

  error(scope: string, message: string, meta?: Record<string, unknown>): void {
    emit("error", scope, message, meta);
  },

  /**
   * 未捕获异常：记录 message；开发环境在 meta 中带 stack（由调用方传入或从 Error 提取）。
   */
  exception(scope: string, err: unknown, meta?: Record<string, unknown>): void {
    const message = err instanceof Error ? err.message : String(err);
    const extra: Record<string, unknown> = { ...meta };
    if (process.env.NODE_ENV === "development" && err instanceof Error && err.stack) {
      extra.stack = err.stack;
    }
    emit("error", scope, message, extra);
  },

  /**
   * HTTP 访问摘要：由 defineApiHandlers 调用；按状态码选 warn（4xx）/ error（5xx）/ info（其它）。
   */
  httpAccess(method: string, path: string, status: number, ms: number): void {
    const summary = `${method} ${path} → ${status} ${ms}ms`;
    const meta = { method, path, status, ms };
    if (status >= 500) emit("error", "http", summary, meta);
    else if (status >= 400) emit("warn", "http", summary, meta);
    else emit("info", "http", summary, meta);
  },
};
