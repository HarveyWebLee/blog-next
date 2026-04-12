/**
 * 浏览器端从 localStorage 读取 JWT，供管理页、编辑页等对受保护 API 的 fetch 使用。
 * 与 {@link AuthProvider} 写入的 `accessToken` 键一致。
 */
export function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/** 合并到 fetch headers；无 token 时返回空对象（仅依赖 Cookie 的接口不受影响）。 */
export function clientBearerHeaders(): Record<string, string> {
  const token = getClientAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
