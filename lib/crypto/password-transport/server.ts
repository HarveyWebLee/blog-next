/**
 * 服务端解密密码传输信封（Node crypto）；仅应在 Route Handler / Server Action 中调用。
 */

import {
  constants,
  createDecipheriv,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  timingSafeEqual,
} from "crypto";

import { buildCanonicalV1 } from "./canonical";
import {
  PASSWORD_TRANSPORT_AES_KEY_LENGTH,
  PASSWORD_TRANSPORT_DEFAULT_MAX_SKEW_MS,
  PASSWORD_TRANSPORT_GCM_TAG_LENGTH,
} from "./constants";
import { assertPasswordTransportNonceFresh } from "./nonce-store";
import type { PasswordTransportEnvelopeV1 } from "./types";

function loadRsaPrivateKeyPem(): string | null {
  const b64 = process.env.PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  const raw = process.env.PASSWORD_TRANSPORT_RSA_PRIVATE_KEY?.trim();
  if (raw) {
    return raw.replace(/\\n/g, "\n");
  }
  return null;
}

/** 是否已配置 RSA 私钥（启用应用层封装） */
export function isPasswordTransportConfigured(): boolean {
  return Boolean(loadRsaPrivateKeyPem());
}

/** 由私钥导出 SPKI DER Base64，供 GET 接口下发给浏览器 */
export function getPasswordTransportPublicSpkiB64(): string | null {
  const pem = loadRsaPrivateKeyPem();
  if (!pem) return null;
  try {
    const priv = createPrivateKey(pem);
    const pub = createPublicKey(priv);
    const der = pub.export({ type: "spki", format: "der" }) as Buffer;
    return der.toString("base64");
  } catch {
    return null;
  }
}

export function getPasswordTransportKeyId(): string {
  const spki = getPasswordTransportPublicSpkiB64();
  if (!spki) return "off";
  return createHash("sha256").update(spki, "utf8").digest("hex").slice(0, 16);
}

export function getPasswordTransportMaxSkewMs(): number {
  const raw = process.env.PASSWORD_TRANSPORT_MAX_SKEW_MS?.trim();
  if (!raw) return PASSWORD_TRANSPORT_DEFAULT_MAX_SKEW_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 30_000 && n <= 60 * 60 * 1000 ? n : PASSWORD_TRANSPORT_DEFAULT_MAX_SKEW_MS;
}

function assertTimestamp(ts: number): { ok: true } | { ok: false; message: string } {
  const skew = getPasswordTransportMaxSkewMs();
  const now = Date.now();
  if (!Number.isFinite(ts) || ts <= 0) {
    return { ok: false, message: "无效的时间戳" };
  }
  if (Math.abs(now - ts) > skew) {
    return { ok: false, message: "请求已过期或时钟偏差过大，请重试" };
  }
  return { ok: true };
}

function rsaUnwrapAesKey(wrappedB64: string, pem: string): Buffer {
  const wrapped = Buffer.from(wrappedB64, "base64");
  const priv = createPrivateKey(pem);
  const aesKey = privateDecrypt(
    {
      key: priv,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    wrapped
  );
  if (aesKey.length !== PASSWORD_TRANSPORT_AES_KEY_LENGTH) {
    throw new Error("AES 密钥长度异常");
  }
  return aesKey;
}

function aesGcmDecrypt(iv: Buffer, ciphertextAndTag: Buffer, aesKey: Buffer): Buffer {
  if (ciphertextAndTag.length <= PASSWORD_TRANSPORT_GCM_TAG_LENGTH) {
    throw new Error("密文过短");
  }
  const tag = ciphertextAndTag.subarray(ciphertextAndTag.length - PASSWORD_TRANSPORT_GCM_TAG_LENGTH);
  const enc = ciphertextAndTag.subarray(0, ciphertextAndTag.length - PASSWORD_TRANSPORT_GCM_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

function verifyHmac(aesKey: Buffer, canonical: string, signB64: string): boolean {
  const expected = createHmac("sha256", aesKey).update(canonical, "utf8").digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signB64, "base64");
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/**
 * 解密 v1 信封为 UTF-8 密码/密钥字符串。
 */
export async function decryptPasswordTransportV1(
  envelope: PasswordTransportEnvelopeV1
): Promise<{ ok: true; plaintext: string } | { ok: false; message: string; status: number }> {
  const pem = loadRsaPrivateKeyPem();
  if (!pem) {
    return { ok: false, message: "服务端未启用密码传输封装", status: 503 };
  }

  if (!envelope || envelope.v !== 1) {
    return { ok: false, message: "不支持的密码封装版本", status: 400 };
  }

  const tsCheck = assertTimestamp(envelope.ts);
  if (!tsCheck.ok) {
    return { ok: false, message: tsCheck.message, status: 400 };
  }

  const nonceCheck = await assertPasswordTransportNonceFresh(envelope.nonce);
  if (!nonceCheck.ok) {
    return { ok: false, message: "重复的请求（nonce），请刷新页面后重试", status: 409 };
  }

  let aesKey: Buffer;
  try {
    aesKey = rsaUnwrapAesKey(envelope.aesKeyWrappedB64, pem);
  } catch {
    return { ok: false, message: "密钥解封装失败", status: 400 };
  }

  const canonical = buildCanonicalV1(envelope);
  if (!verifyHmac(aesKey, canonical, envelope.signB64)) {
    return { ok: false, message: "签名校验失败", status: 400 };
  }

  let iv: Buffer;
  let cipherBuf: Buffer;
  try {
    iv = Buffer.from(envelope.ivB64, "base64");
    if (iv.length !== 12) {
      return { ok: false, message: "IV 无效", status: 400 };
    }
    cipherBuf = Buffer.from(envelope.cipherB64, "base64");
  } catch {
    return { ok: false, message: "密文格式无效", status: 400 };
  }

  try {
    const plainBuf = aesGcmDecrypt(iv, cipherBuf, aesKey);
    const plaintext = plainBuf.toString("utf8");
    return { ok: true, plaintext };
  } catch {
    return { ok: false, message: "解密失败", status: 400 };
  }
}
