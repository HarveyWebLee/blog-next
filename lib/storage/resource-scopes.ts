/**
 * 对象存储中的业务路径前缀（位于 bucket 之下）。
 * 例：bucket=blog-resource → 对象键 article/42/xxx.webp
 */
export const OBJECT_STORAGE_SCOPES = ["article", "profile"] as const;

export type ObjectStorageScope = (typeof OBJECT_STORAGE_SCOPES)[number];

export function isObjectStorageScope(s: string): s is ObjectStorageScope {
  return (OBJECT_STORAGE_SCOPES as readonly string[]).includes(s);
}
