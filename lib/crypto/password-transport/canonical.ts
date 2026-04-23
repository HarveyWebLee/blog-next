import type { PasswordTransportEnvelopeV1 } from "./types";

/**
 * HMAC 输入规范化字符串：字段顺序固定，禁止随意调整（与服务端校验必须一致）。
 */
export function buildCanonicalV1(envelope: Omit<PasswordTransportEnvelopeV1, "signB64">): string {
  return [
    "v1",
    String(envelope.v),
    envelope.keyId,
    String(envelope.ts),
    envelope.nonce,
    envelope.ivB64,
    envelope.aesKeyWrappedB64,
    envelope.cipherB64,
  ].join("|");
}
