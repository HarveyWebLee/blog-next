const API_CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const API_CORS_HEADERS = "Authorization, Content-Type, X-Requested-With";
const API_CORS_MAX_AGE_SECONDS = "600";

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.pathname !== "/" || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/** 解析 CORS_ORIGIN：仅接受逗号分隔的 http(s) 源，拒绝通配符和带路径 URL。 */
export function parseAllowedCorsOrigins(value: string | undefined = process.env.CORS_ORIGIN): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((origin) => normalizeOrigin(origin.trim()))
        .filter((origin): origin is string => origin !== null)
    )
  );
}

/** 若请求 Origin 在白名单中，返回规范化后的 Origin；否则返回 null。 */
export function getAllowedCorsOrigin(
  requestOrigin: string | null,
  configuredOrigins: string | undefined = process.env.CORS_ORIGIN
): string | null {
  if (!requestOrigin) return null;

  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  if (!normalizedRequestOrigin) return null;

  return parseAllowedCorsOrigins(configuredOrigins).includes(normalizedRequestOrigin) ? normalizedRequestOrigin : null;
}

/** 为已通过白名单校验的 API 响应写入 CORS 头（含 credentials，供 Cookie 会话跨域）。 */
export function applyApiCorsHeaders(headers: Headers, allowedOrigin: string): void {
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", API_CORS_METHODS);
  headers.set("Access-Control-Allow-Headers", API_CORS_HEADERS);
  headers.set("Access-Control-Max-Age", API_CORS_MAX_AGE_SECONDS);

  const vary = headers.get("Vary");
  const varyValues = new Set(
    (vary || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  varyValues.add("Origin");
  headers.set("Vary", Array.from(varyValues).join(", "));
}
