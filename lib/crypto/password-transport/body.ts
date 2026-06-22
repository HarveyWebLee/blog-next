import {
  fetchPasswordTransportParams,
  isBrowserPasswordTransportSupported,
  isPasswordTransportBlockedInBrowser,
  PasswordTransportSecureContextRequiredError,
  sealPlaintextToPasswordTransportV1,
} from "./client";

/**
 * 为 JSON 请求体封装密码字段：若服务端启用传输封装则写入 passwordTransport 并去掉明文字段。
 * 非安全上下文（HTTP）下 Web Crypto 不可用：若服务端未强制封装则退回明文；强制时抛出可映射 i18n 的错误。
 */
export async function sealPasswordInRequestBody(
  body: Record<string, unknown>,
  plainPassword: string,
  field: "password" | "newPassword"
): Promise<Record<string, unknown>> {
  const params = await fetchPasswordTransportParams();

  if (isPasswordTransportBlockedInBrowser(params)) {
    throw new PasswordTransportSecureContextRequiredError();
  }

  if (params.enabled && params.publicKeySpkiB64 && isBrowserPasswordTransportSupported()) {
    const next: Record<string, unknown> = { ...body };
    delete next.password;
    delete next.newPassword;
    delete next.passwordTransport;
    next.passwordTransport = await sealPlaintextToPasswordTransportV1(plainPassword, params);
    return next;
  }
  return { ...body, [field]: plainPassword };
}
