/**
 * 密码「应用层传输封装」类型（AES-256-GCM + RSA-OAEP-256 + HMAC-SHA256 + 时间戳/nonce）。
 * 用于在 HTTPS 之上降低明文密码在网关日志、反向代理或异常抓包分析中的暴露面；
 * nonce 可在 Redis 侧防重放（无 Redis 时进程内兜底，多实例建议配置 REDIS_URL）。
 */

/** v1 信封：客户端生成随机 AES 密钥，RSA 公钥封装密钥；HMAC 使用原始 AES 密钥绑定整包完整性 */
export type PasswordTransportEnvelopeV1 = {
  v: 1;
  /** 与 GET /api/auth/password-transport-params 返回的 keyId 对齐 */
  keyId: string;
  /** Unix 毫秒时间戳，服务端校验时钟偏移 */
  ts: number;
  /** 客户端一次性随机串，服务端 NX 写入防重放 */
  nonce: string;
  /** AES-GCM IV（12 字节）Base64 */
  ivB64: string;
  /** RSA-OAEP(SHA-256) 封装后的 AES-256 密钥（32 字节明文）Base64 */
  aesKeyWrappedB64: string;
  /** AES-256-GCM 密文（末尾含 16 字节 auth tag）Base64 */
  cipherB64: string;
  /** HMAC-SHA256(aesKey, canonicalV1)，Base64 */
  signB64: string;
};

/** GET 接口返回给浏览器用于 importKey + encrypt */
export type PasswordTransportPublicParams = {
  enabled: boolean;
  keyId: string;
  /** PKCS#1 SPKI DER 的 Base64（Web Crypto importKey spki） */
  publicKeySpkiB64: string;
  /** 允许客户端与服务端时钟差的毫秒上限 */
  maxClockSkewMs: number;
};
