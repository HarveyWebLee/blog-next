/** 与 middleware 一致的前台语言前缀，用于校验站内回跳路径 */
const LOCALE_PREFIXES = new Set(["zh-CN", "en-US", "ja-JP"]);

/** 法律类静态页在 `/{locale}/` 后的路径段，用于禁止 return / referrer 仍停留在当前页 */
export type LegalSelfSegment = "privacy" | "terms";

/**
 * 解析 URL 查询参数中的 `return`（或调用方传入的已解码路径片段），仅允许：
 * - 以 `/` 开头且非 `//` 的站内相对路径；
 * - 首段为受支持的语言代码；
 * - 路径第二段不得为 `forbidSecondSegment`（避免从隐私/条款页跳回自身）。
 */
export function parseSafeInternalReturn(
  raw: string | null | undefined,
  forbidSecondSegment: LegalSelfSegment
): string | null {
  if (raw == null || raw === "") return null;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return null;

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 1) return null;
  if (!LOCALE_PREFIXES.has(segments[0]!)) return null;
  if (segments.length >= 2 && segments[1] === forbidSecondSegment) return null;

  return path;
}

/** 判断 document.referrer 是否为本站且 referrer 路径第二段不是当前法律页（用于 history.back） */
export function isSameOriginReferrerExceptSegment(forbidSecondSegment: LegalSelfSegment): boolean {
  if (typeof document === "undefined") return false;
  const ref = document.referrer;
  if (!ref) return false;
  try {
    const u = new URL(ref);
    if (u.origin !== window.location.origin) return false;
    const segs = u.pathname.split("/").filter(Boolean);
    if (segs.length >= 2 && segs[1] === forbidSecondSegment) return false;
    return true;
  } catch {
    return false;
  }
}
