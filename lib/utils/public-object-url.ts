/**
 * 浏览器端：从 MinIO path-style 公开 URL 解析对象键（不含 bucket）。
 * 依赖 NEXT_PUBLIC_MINIO_BUCKET；pathname 形如 /{bucket}/article/1/uuid.webp
 */
export function extractObjectKeyFromPathStyleUrl(imageUrl: string): string | null {
  const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET?.trim();
  if (!bucket || !imageUrl) return null;
  try {
    const u = new URL(imageUrl);
    const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (segments.length < 2 || segments[0] !== bucket) return null;
    return segments.slice(1).join("/");
  } catch {
    return null;
  }
}
