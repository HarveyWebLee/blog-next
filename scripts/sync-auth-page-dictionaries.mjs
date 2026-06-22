#!/usr/bin/env node
/**
 * 从 auth 页面 inline t 对象提取三语文案，写入 dictionaries/*.json 的 auth.*Page 节。
 * 运行：node scripts/sync-auth-page-dictionaries.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const PAGES = [
  { key: "loginPage", file: "app/[lang]/auth/login/page.tsx", anchor: "const { login" },
  { key: "registerPage", file: "app/[lang]/auth/register/page.tsx", anchor: "const [" },
  { key: "forgotPasswordPage", file: "app/[lang]/auth/forgot-password/page.tsx", anchor: "const [" },
  { key: "resetPasswordPage", file: "app/[lang]/auth/reset-password/page.tsx", anchor: "const [" },
];

function parseObjectLiteral(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(\w+):\s*"(.*)",?\s*$/);
    if (m) out[m[1]] = m[2].replace(/\\"/g, '"');
  }
  return out;
}

function extractLocaleBlock(src, locale) {
  if (locale === "en-US") {
    const m = src.match(/lang === "en-US"\s*\?\s*\{([\s\S]*?)\n\s*\}\s*:\s*lang === "ja-JP"/);
    if (!m) throw new Error("en-US block not found");
    return parseObjectLiteral(m[1]);
  }
  if (locale === "ja-JP") {
    const m = src.match(/lang === "ja-JP"\s*\?\s*\{([\s\S]*?)\n\s*\}\s*:\s*\{/);
    if (!m) throw new Error("ja-JP block not found");
    return parseObjectLiteral(m[1]);
  }
  // zh-CN: last branch before anchor
  const idx = src.indexOf('lang === "en-US"');
  const tail = src.slice(idx);
  const m = tail.match(/:\s*\{([\s\S]*?)\n\s*\};\s*\n\s*const /);
  if (!m) throw new Error("zh-CN block not found");
  return parseObjectLiteral(m[1]);
}

const localeFiles = {
  "zh-CN": path.join(ROOT, "dictionaries/zh-CN.json"),
  "en-US": path.join(ROOT, "dictionaries/en-US.json"),
  "ja-JP": path.join(ROOT, "dictionaries/ja-JP.json"),
};

const dicts = Object.fromEntries(
  Object.entries(localeFiles).map(([loc, f]) => [loc, JSON.parse(fs.readFileSync(f, "utf8"))])
);

for (const page of PAGES) {
  const src = fs.readFileSync(path.join(ROOT, page.file), "utf8");
  for (const loc of ["zh-CN", "en-US", "ja-JP"]) {
    const block = extractLocaleBlock(src, loc);
    dicts[loc].auth = dicts[loc].auth || {};
    dicts[loc].auth[page.key] = block;
  }
  console.log("synced", page.key);
}

for (const [loc, file] of Object.entries(localeFiles)) {
  fs.writeFileSync(file, JSON.stringify(dicts[loc], null, 2) + "\n");
  console.log("wrote", file);
}
