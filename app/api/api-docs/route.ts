import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { ApiEndpoint, ApiGroup, ApiScanner } from "@/lib/utils/api-scanner";
import { requireInMemorySuperRoot } from "@/lib/utils/authz";

// Simple in-memory cache（仅超级管理员可命中；仍避免频繁扫盘）
let apiCache: {
  data: ApiGroup[];
  timestamp: number;
  stats: {
    totalGroups: number;
    totalEndpoints: number;
    lastScan: string;
    methodStats: Record<string, number>;
    versionStats: {
      withVersion: number;
      withoutVersion: number;
      versions: Record<string, number>;
    };
  };
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * 文档接口调用统计（进程内）：
 * - 用于观察文档站使用情况与导出频率；
 * - 非持久化，进程重启后归零。
 */
const docsUsageStats = {
  totalRequests: 0,
  refreshRequests: 0,
  openApiRequests: 0,
  lastAccessAt: "",
};

type OpenApiOperation = {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: Array<{
    name: string;
    in: "query" | "path" | "header";
    required?: boolean;
    description?: string;
    schema?: { type: string };
  }>;
  requestBody?: {
    required?: boolean;
    content: {
      "application/json": {
        schema?: unknown;
        example?: unknown;
      };
    };
  };
  responses: Record<string, { description: string; content: { "application/json": { example?: unknown } } }>;
  security?: Array<Record<string, string[]>>;
};

function buildMethodStats(groups: ApiGroup[]): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const group of groups) {
    for (const endpoint of group.endpoints) {
      stats[endpoint.method] = (stats[endpoint.method] || 0) + 1;
    }
  }
  return stats;
}

function buildVersionStats(groups: ApiGroup[]) {
  const versions: Record<string, number> = {};
  let withVersion = 0;
  let withoutVersion = 0;
  for (const group of groups) {
    for (const endpoint of group.endpoints) {
      if (endpoint.version && endpoint.version.trim()) {
        withVersion += 1;
        versions[endpoint.version] = (versions[endpoint.version] || 0) + 1;
      } else {
        withoutVersion += 1;
      }
    }
  }
  return { withVersion, withoutVersion, versions };
}

function filterApiGroupsByVersion(groups: ApiGroup[], versionQuery: string): ApiGroup[] {
  const normalized = versionQuery.trim();
  if (!normalized) return groups;

  return groups
    .map((group) => ({
      ...group,
      endpoints: group.endpoints.filter((endpoint) => {
        // 特殊值 none：筛选未标注版本的端点
        if (normalized === "none") {
          return !endpoint.version || !endpoint.version.trim();
        }
        return (endpoint.version || "").trim() === normalized;
      }),
    }))
    .filter((group) => group.endpoints.length > 0);
}

function toOpenApiOperation(endpoint: ApiEndpoint): OpenApiOperation {
  const operation: OpenApiOperation = {
    summary: endpoint.description || `${endpoint.method} ${endpoint.path}`,
    description: endpoint.authHint,
    tags: endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : undefined,
    deprecated: endpoint.deprecated,
    parameters: endpoint.parameters?.map((p) => ({
      name: p.name,
      in: p.location,
      required: p.required,
      description: p.description,
      schema: { type: p.type || "string" },
    })),
    responses: {},
  };

  if (endpoint.requestBody) {
    operation.requestBody = {
      required: endpoint.requestBody.required,
      content: {
        "application/json": {
          schema: endpoint.requestBody.schema,
          example: endpoint.requestBody.example,
        },
      },
    };
  }

  const hasBearerHint = (endpoint.authHint || "").toLowerCase().includes("bearer");
  if (hasBearerHint) {
    operation.security = [{ bearerAuth: [] }];
  }

  const responses =
    endpoint.responses && endpoint.responses.length > 0
      ? endpoint.responses
      : [{ status: 200, description: "成功响应" }];
  for (const resp of responses) {
    operation.responses[String(resp.status)] = {
      description: resp.description || "响应",
      content: {
        "application/json": {
          example: resp.example,
        },
      },
    };
  }

  return operation;
}

function buildOpenApiSpec(groups: ApiGroup[], request: NextRequest) {
  const paths: Record<string, Record<string, OpenApiOperation>> = {};
  for (const group of groups) {
    for (const endpoint of group.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      paths[endpoint.path][endpoint.method.toLowerCase()] = toOpenApiOperation({
        ...endpoint,
        tags: endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : [group.name],
      });
    }
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "blog-next API",
      version: "1.0.0",
      description: "由 /api/api-docs 扫描结果自动生成的 OpenAPI 文档",
    },
    servers: [{ url: request.nextUrl.origin }],
    tags: groups.map((group) => ({ name: group.name, description: group.description })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };
}

/**
 * GET /api/api-docs
 * 获取所有API接口信息（支持自动发现新接口）
 *
 * 安全：仅超级管理员可访问，避免泄露全站路由结构给未授权用户。
 */
export async function GET(request: NextRequest) {
  const gate = requireInMemorySuperRoot(request);
  if (!gate.ok) {
    return NextResponse.json(
      {
        success: false,
        message: gate.message,
        code: gate.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        timestamp: new Date().toISOString(),
      },
      { status: gate.status }
    );
  }

  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";
    const format = (url.searchParams.get("format") || "").toLowerCase();
    const shouldDownload = url.searchParams.get("download") === "true";
    const versionQuery = (url.searchParams.get("version") || "").trim();

    docsUsageStats.totalRequests += 1;
    if (refresh) docsUsageStats.refreshRequests += 1;
    if (format === "openapi") docsUsageStats.openApiRequests += 1;
    docsUsageStats.lastAccessAt = new Date().toISOString();

    if (apiCache && !refresh && Date.now() - apiCache.timestamp < CACHE_DURATION) {
      const filteredGroups = filterApiGroupsByVersion(apiCache.data, versionQuery);
      const filteredStats = {
        totalGroups: filteredGroups.length,
        totalEndpoints: filteredGroups.reduce((sum, group) => sum + group.endpoints.length, 0),
        lastScan: apiCache.stats.lastScan,
        methodStats: buildMethodStats(filteredGroups),
        versionStats: buildVersionStats(filteredGroups),
      };
      if (format === "openapi") {
        const spec = buildOpenApiSpec(filteredGroups, request);
        return NextResponse.json(spec, {
          status: 200,
          headers: shouldDownload
            ? {
                "Content-Disposition": 'attachment; filename="openapi.json"',
              }
            : undefined,
        });
      }
      return NextResponse.json(
        {
          ...createSuccessResponse(filteredGroups, "API文档获取成功"),
          stats: filteredStats,
          usageStats: docsUsageStats,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const scanner = new ApiScanner();
    // refresh=true 时允许跳过缓存并触发重新扫描（开发环境可用于同步最新接口）
    const apiGroups = await scanner.scanAllApis(refresh);

    const totalGroups = apiGroups.length;
    const totalEndpoints = apiGroups.reduce((sum, group) => sum + group.endpoints.length, 0);
    const methodStats = buildMethodStats(apiGroups);
    const versionStats = buildVersionStats(apiGroups);
    const lastScan = new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    const stats = { totalGroups, totalEndpoints, lastScan, methodStats, versionStats };

    apiCache = { data: apiGroups, timestamp: Date.now(), stats };

    const filteredGroups = filterApiGroupsByVersion(apiGroups, versionQuery);
    const filteredStats = {
      totalGroups: filteredGroups.length,
      totalEndpoints: filteredGroups.reduce((sum, group) => sum + group.endpoints.length, 0),
      lastScan,
      methodStats: buildMethodStats(filteredGroups),
      versionStats: buildVersionStats(filteredGroups),
    };

    if (format === "openapi") {
      const spec = buildOpenApiSpec(filteredGroups, request);
      return NextResponse.json(spec, {
        status: 200,
        headers: shouldDownload
          ? {
              "Content-Disposition": 'attachment; filename="openapi.json"',
            }
          : undefined,
      });
    }

    return NextResponse.json(
      {
        ...createSuccessResponse(filteredGroups, "API文档获取成功"),
        stats: filteredStats,
        usageStats: docsUsageStats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("获取API文档失败:", error);
    return NextResponse.json(
      createErrorResponse("获取API文档失败", error instanceof Error ? error.message : "未知错误"),
      { status: 500 }
    );
  }
}
