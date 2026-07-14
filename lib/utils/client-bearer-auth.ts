/**
 * 浏览器端 accessToken 读写与 Bearer 头拼装的唯一入口。
 * 组件与业务 fetch 勿直接读 localStorage；会话持久化仍由 AuthProvider 经本模块写入。
 */

export const CLIENT_ACCESS_TOKEN_KEY = "accessToken";
export const CLIENT_USER_STORAGE_KEY = "user";
/** 历史遗留键；仅用于启动/登出时清理 */
export const CLIENT_LEGACY_REFRESH_TOKEN_KEY = "refreshToken";

/** 浏览器端从统一存储读取 JWT。 */
export function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLIENT_ACCESS_TOKEN_KEY);
}

/** 登录/刷新成功后写入 accessToken（仅 Auth 层与刷新通路调用）。 */
export function setClientAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_ACCESS_TOKEN_KEY, token);
}

/** 合并到 fetch headers；无 token 时返回空对象（公开接口不受影响）。 */
export function clientBearerHeaders(): Record<string, string> {
  const token = getClientAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 清除 access / user / 遗留 refresh 本地键（登出或会话失效时）。 */
export function clearClientAuthStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLIENT_USER_STORAGE_KEY);
  localStorage.removeItem(CLIENT_ACCESS_TOKEN_KEY);
  localStorage.removeItem(CLIENT_LEGACY_REFRESH_TOKEN_KEY);
}

export function getStoredClientUserJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLIENT_USER_STORAGE_KEY);
}

export function setStoredClientUserJson(userJson: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_USER_STORAGE_KEY, userJson);
}

export function clearLegacyRefreshTokenStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLIENT_LEGACY_REFRESH_TOKEN_KEY);
}
