#!/usr/bin/env node
/**
 * 将 auth / profile 组件中的 inline t 三元块替换为词典 hook 调用。
 * 运行：node scripts/refactor-inline-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const AUTH_PAGES = [
  { file: "app/[lang]/auth/login/page.tsx", pageKey: "loginPage", hook: "auth" },
  { file: "app/[lang]/auth/register/page.tsx", pageKey: "registerPage", hook: "auth" },
  { file: "app/[lang]/auth/forgot-password/page.tsx", pageKey: "forgotPasswordPage", hook: "auth" },
  { file: "app/[lang]/auth/reset-password/page.tsx", pageKey: "resetPasswordPage", hook: "auth" },
];

const PROFILE_COMPONENTS = [
  { file: "components/profile/profile-stats.tsx", section: "stats", hook: "profile" },
  { file: "components/profile/profile-posts.tsx", section: "posts", hook: "profile" },
  { file: "components/profile/profile-likes.tsx", section: "likes", hook: "profile" },
  { file: "components/profile/profile-favorites.tsx", section: "favorites", hook: "profile" },
  { file: "components/profile/profile-activities.tsx", section: "activities", hook: "profile" },
  { file: "components/profile/profile-overview.tsx", section: "overview", hook: "profile" },
  { file: "components/profile/profile-followers.tsx", section: "followers", hook: "profile" },
  { file: "components/profile/profile-following.tsx", section: "following", hook: "profile" },
  { file: "components/profile/public-user-profile.tsx", section: "public", hook: "profile" },
];

function stripInlineT(src, varName) {
  const re = new RegExp(
    `const ${varName} =\\s*\\n\\s*(?:${varName === "t" ? "lang|locale" : "x"} === "en-US"[\\s\\S]*?;\\s*\\n)`,
    "m"
  );
  // Match: const t = \n    lang === "en-US" ... };
  const pattern = /const t =\s*\n\s*(?:lang|locale) === "en-US"[\s\S]*?\n\s*\};\s*\n/;
  if (!pattern.test(src)) return null;
  return src.replace(pattern, "");
}

function refactorAuth(file, pageKey) {
  let src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const stripped = stripInlineT(src, "t");
  if (!stripped) {
    console.warn("skip auth (no t block)", file);
    return;
  }
  src = stripped;
  if (!src.includes("useClientDictionary")) {
    src = src.replace(
      /^(import .+\n)+/m,
      (m) => m + 'import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";\n'
    );
  }
  const inject = `  const dict = useClientDictionary(lang);\n  const t = (dict as { auth?: { ${pageKey}?: Record<string, string> } })?.auth?.${pageKey};\n  if (!t) return null;\n\n`;
  // insert after lang = line
  src = src.replace(/(const lang = [^\n]+\n)/, `$1${inject}`);
  fs.writeFileSync(path.join(ROOT, file), src);
  console.log("refactored auth", file);
}

function refactorProfile(file, section) {
  let src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const stripped = stripInlineT(src, "t");
  if (!stripped) {
    console.warn("skip profile (no t block)", file);
    return;
  }
  src = stripped;
  if (!src.includes("useProfileDict")) {
    src = src.replace(
      /^(import .+\n)+/m,
      (m) => m + 'import { useProfileDict } from "@/lib/contexts/profile-dict-context";\n'
    );
  }
  const inject = `  const t = useProfileDict<Record<string, unknown>>("${section}");\n  if (!t) return null;\n\n`;
  // find first const t was - insert after locale/lang resolution
  const anchor = src.match(/const (?:locale|routeLang|lang) = [^\n]+\n/);
  if (anchor) {
    const idx = src.indexOf(anchor[0]) + anchor[0].length;
    src = src.slice(0, idx) + inject + src.slice(idx);
  } else {
    console.warn("no anchor", file);
    return;
  }
  fs.writeFileSync(path.join(ROOT, file), src);
  console.log("refactored profile", file);
}

for (const p of AUTH_PAGES) refactorAuth(p.file, p.pageKey);
for (const p of PROFILE_COMPONENTS) refactorProfile(p.file, p.section);

console.log("refactor done");
