import type { NextRequest } from "next/server";

/**
 * 判断对外协议是否为 HTTPS（优先信任反代注入的 X-Forwarded-Proto）。
 * 无 SSL、直接以 HTTP 访问生产站时返回 false。
 */
export function isHttpsRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto === "https") return true;
  if (forwardedProto === "http") return false;
  return request.nextUrl.protocol === "https:";
}
