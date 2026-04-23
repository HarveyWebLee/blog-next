#!/usr/bin/env node
/**
 * 生成 PASSWORD_TRANSPORT 用的 RSA 密钥对（4096-bit PKCS#8），输出单行 Base64 便于写入 .env。
 * 用法：node scripts/generate-password-transport-keys.mjs
 */
import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const b64 = Buffer.from(privateKey, "utf8").toString("base64");

console.log("# 将下行写入 .env.local（勿提交仓库）");
console.log(`PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64=${b64}`);
console.log("");
console.log("# 公钥（仅供核对，运行时由私钥推导并通过 GET /api/auth/password-transport-params 下发）");
console.log(publicKey);
