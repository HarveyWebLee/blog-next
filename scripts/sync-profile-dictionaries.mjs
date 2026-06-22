#!/usr/bin/env node
/**
 * 从 profile client 组件 inline t 提取三语，合并到 dictionaries/*.json 的 profile.{section}。
 * 运行：node scripts/sync-profile-dictionaries.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const COMPONENTS = [
  { section: "stats", file: "components/profile/profile-stats.tsx" },
  { section: "posts", file: "components/profile/profile-posts.tsx" },
  { section: "likes", file: "components/profile/profile-likes.tsx" },
  { section: "favorites", file: "components/profile/profile-favorites.tsx" },
  { section: "activities", file: "components/profile/profile-activities.tsx" },
  { section: "settings", file: "components/profile/profile-settings.tsx" },
  { section: "overview", file: "components/profile/profile-overview.tsx" },
  { section: "followers", file: "components/profile/profile-followers.tsx" },
  { section: "following", file: "components/profile/profile-following.tsx" },
  { section: "accountsAdmin", file: "components/profile/profile-accounts-admin.tsx" },
  { section: "sidebarExtra", file: "components/profile/profile-sidebar.tsx" },
  { section: "public", file: "components/profile/public-user-profile.tsx" },
];

function parseBlock(text) {
  const out = {};
  let current = out;
  let stack = [out];
  for (const line of text.split("\n")) {
    const nest = line.match(/^\s*(\w+):\s*\{\s*$/);
    if (nest) {
      const child = {};
      out[nest[1]] = child;
      current = child;
      stack.push(child);
      continue;
    }
    if (/^\s*\},?\s*$/.test(line) && stack.length > 1) {
      stack.pop();
      current = stack[stack.length - 1];
      continue;
    }
    const m = line.match(/^\s*(\w+):\s*"(.*)",?\s*$/);
    if (m) current[m[1]] = m[2].replace(/\\"/g, '"');
  }
  return out;
}

function extractLocaleBlock(src, locale) {
  const varName = src.includes('locale === "en-US"') ? "locale" : "lang";
  if (locale === "en-US") {
    const m = src.match(
      new RegExp(`${varName} === "en-US"\\s*\\?\\s*\\{([\\s\\S]*?)\\n\\s*\\}\\s*:\\s*${varName} === "ja-JP"`)
    );
    if (!m) throw new Error(`en-US block not found (${varName})`);
    return parseBlock(m[1]);
  }
  if (locale === "ja-JP") {
    const m = src.match(new RegExp(`${varName} === "ja-JP"\\s*\\?\\s*\\{([\\s\\S]*?)\\n\\s*\\}\\s*:\\s*\\{`));
    if (!m) throw new Error(`ja-JP block not found (${varName})`);
    return parseBlock(m[1]);
  }
  const idx = src.indexOf(`${varName} === "en-US"`);
  if (idx < 0) throw new Error(`no locale ternary (${varName})`);
  const tail = src.slice(idx);
  const m = tail.match(/:\s*\{([\s\S]*?)\n\s*\};\s*\n/);
  if (!m) throw new Error(`zh-CN block not found (${varName})`);
  return parseBlock(m[1]);
}

const localeFiles = {
  "zh-CN": path.join(ROOT, "dictionaries/zh-CN.json"),
  "en-US": path.join(ROOT, "dictionaries/en-US.json"),
  "ja-JP": path.join(ROOT, "dictionaries/ja-JP.json"),
};

const dicts = Object.fromEntries(
  Object.entries(localeFiles).map(([loc, f]) => [loc, JSON.parse(fs.readFileSync(f, "utf8"))])
);

for (const comp of COMPONENTS) {
  const src = fs.readFileSync(path.join(ROOT, comp.file), "utf8");
  if (!src.includes('"en-US"')) {
    console.warn("skip (no inline t)", comp.file);
    continue;
  }
  for (const loc of ["zh-CN", "en-US", "ja-JP"]) {
    try {
      const block = extractLocaleBlock(src, loc);
      dicts[loc].profile = dicts[loc].profile || {};
      dicts[loc].profile[comp.section] = { ...(dicts[loc].profile[comp.section] || {}), ...block };
    } catch (e) {
      console.error(comp.section, loc, e.message);
    }
  }
  console.log("synced profile.", comp.section);
}

for (const [loc, file] of Object.entries(localeFiles)) {
  fs.writeFileSync(file, JSON.stringify(dicts[loc], null, 2) + "\n");
}

console.log("done");
