import fs from "fs";
import path from "path";

import type { ApiGroup } from "@/lib/utils/api-scanner";

export interface ApiDocsManifest {
  generatedAt: string;
  groups: ApiGroup[];
}

const DEFAULT_MANIFEST_PATH = path.join(process.cwd(), "generated", "api-docs-manifest.json");

/**
 * 读取 API 文档 manifest（同步版本）
 * - 生产环境 Route Handler 内优先使用，避免运行时扫源码目录失败。
 */
export function readApiDocsManifestSync(manifestPath: string = DEFAULT_MANIFEST_PATH): ApiDocsManifest | null {
  try {
    if (!fs.existsSync(manifestPath)) return null;
    const content = fs.readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(content) as Partial<ApiDocsManifest>;
    if (!parsed || !Array.isArray(parsed.groups)) return null;
    return {
      generatedAt: parsed.generatedAt || "",
      groups: parsed.groups,
    };
  } catch (error) {
    console.warn("读取 API 文档 manifest 失败:", error);
    return null;
  }
}

/**
 * 写入 API 文档 manifest（同步版本）
 * - 构建阶段与开发重扫时调用，确保文档数据可在生产环境稳定读取。
 */
export function writeApiDocsManifestSync(
  groups: ApiGroup[],
  manifestPath: string = DEFAULT_MANIFEST_PATH
): ApiDocsManifest {
  const manifest: ApiDocsManifest = {
    generatedAt: new Date().toISOString(),
    groups,
  };

  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  return manifest;
}

export function getDefaultApiDocsManifestPath(): string {
  return DEFAULT_MANIFEST_PATH;
}
