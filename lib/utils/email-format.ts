/**
 * 邮箱格式校验（纯函数、无 Node 依赖）
 * 供客户端组件与 API 共用，避免从含 bcrypt/jwt 的模块间接打包到浏览器。
 */

/** 与历史逻辑一致：本地部分 @ 域名 . 后缀，且不含空白 */
export const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 判断邮箱是否符合规范（会先 trim，避免仅首尾空格导致误判）
 */
export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) {
    return false;
  }
  return EMAIL_FORMAT_REGEX.test(trimmed);
}
