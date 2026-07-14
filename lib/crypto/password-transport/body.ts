import {
  fetchPasswordTransportParams,
  isBrowserPasswordTransportSupported,
  isPasswordTransportBlockedInBrowser,
  sealPlaintextToPasswordTransportV1,
} from "./client";

/**
 * 为 JSON 请求体封装密码字段：若服务端启用传输封装则写入 passwordTransport 并去掉明文字段。
 * 非安全上下文（HTTP）下 Web Crypto 不可用：退回明文，由服务端按协议/策略最终裁决（HTTP 会自动放宽强制）。
 */
export async function sealPasswordInRequestBody(
  body: Record<string, unknown>,
  plainPassword: string,
  field: "password" | "newPassword"
): Promise<Record<string, unknown>> {
  const params = await fetchPasswordTransportParams();

  // HTTP 等非安全上下文无 Web Crypto：直接明文提交，避免阻断无 SSL 生产登录
  if (isPasswordTransportBlockedInBrowser(params) || !isBrowserPasswordTransportSupported()) {
    return { ...body, [field]: plainPassword };
  }

  if (params.enabled && params.publicKeySpkiB64) {
    const next: Record<string, unknown> = { ...body };
    delete next.password;
    delete next.newPassword;
    delete next.passwordTransport;
    next.passwordTransport = await sealPlaintextToPasswordTransportV1(plainPassword, params);
    return next;
  }
  return { ...body, [field]: plainPassword };
}
