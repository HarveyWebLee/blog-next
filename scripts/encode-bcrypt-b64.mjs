#!/usr/bin/env node
/**
 * 将 60 字符 bcrypt 转为 Base64，写入 SUPER_ADMIN_PASSWORD_BCRYPT_BASE64，避免 .env 中 $ 被解析截断。
 * 用法：node scripts/encode-bcrypt-b64.mjs '$2b$12$xxxxxxxx...'
 */
const h = process.argv[2];
if (!h || h.length < 50) {
  console.error("用法: node scripts/encode-bcrypt-b64.mjs '<60字符的bcrypt整段>'");
  process.exit(1);
}
console.log(Buffer.from(h, "utf8").toString("base64"));
