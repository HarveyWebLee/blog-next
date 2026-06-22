/** 客户端词典切片：加载前返回空对象，避免 TS 与 hooks 顺序问题 */
export function pickText<T extends Record<string, unknown>>(slice: T | null | undefined): T {
  return (slice ?? {}) as T;
}

/** 词典是否已加载（至少有一个键） */
export function isTextReady(slice: Record<string, unknown> | null | undefined): boolean {
  return !!slice && Object.keys(slice).length > 0;
}
