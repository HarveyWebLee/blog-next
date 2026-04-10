import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { ApiScanner } from "@/lib/utils/api-scanner";

// Simple in-memory cache
let apiCache: {
  data: any;
  timestamp: number;
  stats: { totalGroups: number; totalEndpoints: number; lastScan: string };
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/api-docs
 * 获取所有API接口信息（支持自动发现新接口）
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const refresh = url.searchParams.get("refresh") === "true";

    if (apiCache && !refresh && Date.now() - apiCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(createSuccessResponse(apiCache.data, "API文档获取成功"), {
        status: 200,
      });
    }

    const scanner = new ApiScanner();
    const apiGroups = await scanner.scanAllApis();

    const totalGroups = apiGroups.length;
    const totalEndpoints = apiGroups.reduce((sum, group) => sum + group.endpoints.length, 0);
    const lastScan = new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    const stats = { totalGroups, totalEndpoints, lastScan };

    apiCache = { data: apiGroups, timestamp: Date.now(), stats };

    return NextResponse.json(createSuccessResponse(apiGroups, "API文档获取成功"), {
      status: 200,
    });
  } catch (error) {
    console.error("获取API文档失败:", error);
    return NextResponse.json(
      createErrorResponse("获取API文档失败", error instanceof Error ? error.message : "未知错误"),
      { status: 500 }
    );
  }
}
