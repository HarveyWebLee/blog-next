/**
 * 浏览器侧封装密码（Web Crypto）。仅在客户端调用；服务端渲染阶段勿用。
 */

import { buildCanonicalV1 } from "./canonical";
import { PASSWORD_TRANSPORT_AES_KEY_LENGTH, PASSWORD_TRANSPORT_IV_LENGTH } from "./constants";
import type { PasswordTransportEnvelopeV1, PasswordTransportPublicParams } from "./types";

function assertBrowserCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("当前环境不支持 Web Crypto（password-transport）");
  }
  return subtle;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function bufferFrom(bytes: ArrayBuffer): Uint8Array {
  return new Uint8Array(bytes);
}

/**
 * 使用 GET /api/auth/password-transport-params 返回的公钥参数封装明文密码。
 */
export async function sealPlaintextToPasswordTransportV1(
  plaintextPassword: string,
  params: PasswordTransportPublicParams
): Promise<PasswordTransportEnvelopeV1> {
  if (!params.enabled || !params.publicKeySpkiB64) {
    throw new Error("password-transport 未启用");
  }

  const subtle = assertBrowserCrypto();
  const aesKeyRaw = new Uint8Array(PASSWORD_TRANSPORT_AES_KEY_LENGTH);
  const iv = new Uint8Array(PASSWORD_TRANSPORT_IV_LENGTH);
  crypto.getRandomValues(aesKeyRaw);
  crypto.getRandomValues(iv);

  const spkiDer = Uint8Array.from(atob(params.publicKeySpkiB64), (c) => c.charCodeAt(0));

  const rsaPub = await subtle.importKey("spki", spkiDer, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);

  const aesCryptoKey = await subtle.importKey("raw", aesKeyRaw, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);

  const encoded = new TextEncoder().encode(plaintextPassword);
  const cipherFull = bufferFrom(
    await subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: 128,
      },
      aesCryptoKey,
      encoded
    )
  );

  const wrappedKey = bufferFrom(await subtle.encrypt({ name: "RSA-OAEP" }, rsaPub, aesKeyRaw));

  const ivB64 = uint8ToBase64(iv);
  const aesKeyWrappedB64 = uint8ToBase64(wrappedKey);
  const cipherB64 = uint8ToBase64(cipherFull);

  const ts = Date.now();
  const nonce =
    typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${ts}-${Math.random().toString(16).slice(2)}`;

  const envelopeBase: Omit<PasswordTransportEnvelopeV1, "signB64"> = {
    v: 1,
    keyId: params.keyId,
    ts,
    nonce,
    ivB64,
    aesKeyWrappedB64,
    cipherB64,
  };

  const canonical = buildCanonicalV1(envelopeBase);

  const hmacKey = await subtle.importKey("raw", aesKeyRaw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuf = bufferFrom(await subtle.sign("HMAC", hmacKey, new TextEncoder().encode(canonical)));
  const signB64 = uint8ToBase64(sigBuf);

  return {
    ...envelopeBase,
    signB64,
  };
}

/**
 * 拉取封装参数；失败时返回 enabled:false，调用方可退回明文（若服务端允许）。
 */
export async function fetchPasswordTransportParams(baseUrl?: string): Promise<PasswordTransportPublicParams> {
  const prefix = baseUrl?.replace(/\/$/, "") ?? "";
  try {
    const res = await fetch(`${prefix}/api/auth/password-transport-params`, { method: "GET", cache: "no-store" });
    const json = (await res.json()) as { success?: boolean; data?: PasswordTransportPublicParams };
    if (json?.success && json.data) {
      return json.data;
    }
  } catch {
    // ignore
  }
  return {
    enabled: false,
    keyId: "off",
    publicKeySpkiB64: "",
    maxClockSkewMs: 0,
  };
}
