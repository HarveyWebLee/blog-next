/**
 * 转义 SQL LIKE 通配符（MySQL 默认以 `\` 为转义符）。
 * 避免搜索字符串中的 `%`、`_`、`\` 被当作通配符处理。
 */
export function escapeLikeWildcards(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
