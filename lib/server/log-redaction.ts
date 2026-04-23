/**
 * 服务端日志脱敏工具：
 * - 文本：去除 SQL failed query 明细、脱敏邮箱/token/password/cookie 等敏感片段
 * - 元数据：按 key 递归脱敏，避免误打到日志聚合系统
 */

const SENSITIVE_KEY_RE = /password|passwd|pwd|token|authorization|cookie|secret|apikey|api_key|sql|query|params|email/i;

const EMAIL_RE = /([A-Za-z0-9._%+-]{1,64})@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const BEARER_RE = /\bBearer\s+([A-Za-z0-9\-._~+/]+=*)/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function maskEmail(raw: string): string {
  const [name, domain] = raw.split("@");
  if (!name || !domain) return "***";
  if (name.length <= 2) return `**@${domain}`;
  return `${name.slice(0, 1)}***${name.slice(-1)}@${domain}`;
}

export function sanitizeLogMessage(raw: string): string {
  if (!raw) return "unhandled error";
  const firstLine = raw.split("\n")[0].slice(0, 500);

  // Drizzle 常见错误会把 SQL 和 params 拼在 message，统一降噪。
  if (firstLine.startsWith("Failed query:")) {
    return "database query failed";
  }

  return firstLine
    .replace(EMAIL_RE, (m) => maskEmail(m))
    .replace(BEARER_RE, "Bearer [REDACTED]")
    .replace(JWT_RE, "[JWT_REDACTED]")
    .replace(/(password|token|secret)\s*[=:]\s*[^,\s;]+/gi, "$1=[REDACTED]");
}

export function sanitizeLogMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const walk = (value: unknown, depth: number, keyHint?: string): unknown => {
    if (depth > 6) return "[TRUNCATED]";
    if (keyHint && SENSITIVE_KEY_RE.test(keyHint)) return "[REDACTED]";

    if (typeof value === "string") {
      return sanitizeLogMessage(value);
    }

    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => walk(item, depth + 1));
    }

    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = walk(v, depth + 1, k);
      }
      return out;
    }

    return value;
  };

  return walk(meta, 0) as Record<string, unknown>;
}
