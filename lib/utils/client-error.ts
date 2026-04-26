/**
 * 浏览器端请求错误解析：优先返回服务端 message，其次回退到可读的 HTTP/网络信息。
 */
export async function extractResponseErrorMessage(response: Response, fallback: string): Promise<string> {
  const statusPart = `HTTP ${response.status}`;
  try {
    const raw = await response.text();
    if (!raw) return `${fallback}（${statusPart}）`;
    try {
      const parsed = JSON.parse(raw) as { message?: string; error?: string };
      const msg = parsed?.message || parsed?.error;
      return msg ? `${msg}（${statusPart}）` : `${fallback}（${statusPart}）`;
    } catch {
      const plain = raw.trim();
      if (!plain) return `${fallback}（${statusPart}）`;
      const clipped = plain.length > 180 ? `${plain.slice(0, 180)}...` : plain;
      return `${clipped}（${statusPart}）`;
    }
  } catch {
    return `${fallback}（${statusPart}）`;
  }
}

export function extractUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return `${fallback}：${error.message}`;
  if (typeof error === "string" && error.trim()) return `${fallback}：${error}`;
  return fallback;
}
