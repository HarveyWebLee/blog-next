#!/usr/bin/env tsx
import { readApiDocsManifestSync } from "../lib/utils/api-docs-manifest";
import { ApiScanner } from "../lib/utils/api-scanner";

type EndpointIdentity = `${string} ${string}`;

function buildEndpointSet(
  groups: Array<{ endpoints: Array<{ method: string; path: string }> }>
): Set<EndpointIdentity> {
  const set = new Set<EndpointIdentity>();
  for (const group of groups) {
    for (const endpoint of group.endpoints) {
      set.add(`${endpoint.method.toUpperCase()} ${endpoint.path}` as EndpointIdentity);
    }
  }
  return set;
}

function diffSet(source: Set<string>, target: Set<string>): string[] {
  const result: string[] = [];
  source.forEach((item) => {
    if (!target.has(item)) result.push(item);
  });
  return result.sort((a, b) => a.localeCompare(b));
}

async function main() {
  console.log("开始校验 API 文档 manifest 与源码扫描结果一致性...");

  const manifest = readApiDocsManifestSync();
  if (!manifest || !manifest.groups?.length) {
    console.error("未找到可用 manifest，请先执行 pnpm api-docs:generate");
    process.exit(1);
  }

  const scanner = new ApiScanner();
  const scannedGroups = await scanner.scanAllApis(true, { persistManifest: false });

  const manifestSet = buildEndpointSet(manifest.groups);
  const scannedSet = buildEndpointSet(scannedGroups);

  const missingInManifest = diffSet(scannedSet, manifestSet);
  const staleInManifest = diffSet(manifestSet, scannedSet);

  if (missingInManifest.length === 0 && staleInManifest.length === 0) {
    console.log(
      `校验通过：manifest 与源码一致（${manifest.groups.length} 个分组，${manifestSet.size} 个端点，生成时间 ${manifest.generatedAt}）`
    );
    return;
  }

  console.error("校验失败：manifest 与源码扫描结果不一致。");
  if (missingInManifest.length > 0) {
    console.error(`manifest 缺失 ${missingInManifest.length} 个端点（源码存在）:`);
    for (const endpoint of missingInManifest) {
      console.error(`  + ${endpoint}`);
    }
  }
  if (staleInManifest.length > 0) {
    console.error(`manifest 多出 ${staleInManifest.length} 个端点（源码不存在）:`);
    for (const endpoint of staleInManifest) {
      console.error(`  - ${endpoint}`);
    }
  }

  console.error("请执行 pnpm api-docs:generate 后重新提交。");
  process.exit(1);
}

main().catch((error) => {
  console.error("api-docs manifest 校验异常:", error);
  process.exit(1);
});
