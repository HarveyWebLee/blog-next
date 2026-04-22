#!/usr/bin/env tsx
import { getDefaultApiDocsManifestPath, writeApiDocsManifestSync } from "../lib/utils/api-docs-manifest";
import { ApiScanner } from "../lib/utils/api-scanner";

async function main() {
  console.log("开始生成 API 文档 manifest...");

  const scanner = new ApiScanner();
  // 生成脚本自行负责写文件，避免扫描器内部重复写入。
  const groups = await scanner.scanAllApis(true, { persistManifest: false });
  const manifest = writeApiDocsManifestSync(groups);

  const endpointCount = groups.reduce((sum, group) => sum + group.endpoints.length, 0);
  console.log(
    `API 文档 manifest 生成成功：${groups.length} 个分组，${endpointCount} 个端点，输出 ${getDefaultApiDocsManifestPath()}`
  );
  console.log(`生成时间：${manifest.generatedAt}`);
}

main().catch((error) => {
  console.error("生成 API 文档 manifest 失败:", error);
  process.exit(1);
});
