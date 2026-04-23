import { promises as fs } from "fs";
import path from "path";

const API_DIR = path.join(process.cwd(), "app", "api");

type Violation = {
  file: string;
  reason: string;
};

async function collectRouteFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectRouteFiles(full)));
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      results.push(full);
    }
  }

  return results;
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function checkRouteFile(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  const rel = toPosix(path.relative(process.cwd(), filePath));

  if (/^\s*export\s+async\s+function\s+/m.test(content)) {
    violations.push({
      file: rel,
      reason: "仍在使用 export async function；请改为 defineApiHandlers 包装导出",
    });
  }

  // 允许极少数纯常量路由，但当前约束要求统一接入包装器。
  if (!/defineApiHandlers\s*\(/.test(content)) {
    violations.push({
      file: rel,
      reason: "缺少 defineApiHandlers(...) 调用",
    });
  }

  return violations;
}

async function main() {
  const routeFiles = await collectRouteFiles(API_DIR);
  const violations: Violation[] = [];

  for (const file of routeFiles) {
    const content = await fs.readFile(file, "utf8");
    violations.push(...checkRouteFile(file, content));
  }

  if (violations.length === 0) {
    console.log(`✅ API Route 包装检查通过（${routeFiles.length} 个 route.ts）`);
    return;
  }

  console.error("❌ API Route 包装检查未通过：");
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.reason}`);
  }
  console.error("\n修复建议：统一使用 `export const { GET, ... } = defineApiHandlers({ ... })`。");
  process.exit(1);
}

main().catch((error) => {
  console.error("❌ 检查脚本执行失败:", error);
  process.exit(1);
});
