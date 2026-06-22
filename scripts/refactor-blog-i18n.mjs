#!/usr/bin/env node
/** 将 blog 组件 inline t 替换为 useClientDictionary */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const FILES = [
  { file: "components/blog/blog-page-content.tsx", section: "listPage" },
  { file: "components/blog/blog-sidebar.tsx", section: "sidebar" },
  { file: "components/blog/post-card.tsx", section: "postCard" },
  { file: "app/[lang]/blog/manage/page.tsx", section: "manage" },
  { file: "app/[lang]/blog/manage/create/page.tsx", section: "manageCreate" },
  { file: "app/[lang]/blog/manage/edit/[id]/page.tsx", section: "manageEdit" },
];

const pattern = /const t =\s*\n\s*lang === "en-US"[\s\S]*?\n\s*\};\s*\n/;

for (const { file, section } of FILES) {
  const fp = path.join(ROOT, file);
  let src = fs.readFileSync(fp, "utf8");
  if (!pattern.test(src)) {
    console.warn("skip", file);
    continue;
  }
  src = src.replace(pattern, "");
  if (!src.includes("useClientDictionary")) {
    src = src.replace(
      /^(import .+\n)+/m,
      (m) =>
        m +
        'import { useClientDictionary } from "@/lib/hooks/use-client-dictionary";\nimport { isTextReady, pickText } from "@/lib/i18n/pick-text";\n'
    );
  }
  const inject = `  const dict = useClientDictionary(lang);\n  const t = pickText((dict as { blog?: { ${section}?: Record<string, string> } })?.blog?.${section});\n\n`;
  // insert after lang = line
  src = src.replace(/(const lang = [^\n]+\n)/, `$1${inject}`);
  fs.writeFileSync(fp, src);
  console.log("refactored", file);
}

console.log("done");
