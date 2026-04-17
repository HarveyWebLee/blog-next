import { NextResponse } from "next/server";

import { getAboutOwnerPublic, type AboutOwnerPublic } from "@/lib/services/about-owner.service";
import type { ApiResponse } from "@/types/blog";

/**
 * GET /api/about/owner
 * 公开接口：返回关于页可用的站长联系信息（超级管理员 user_profiles.user_id=<super_admin_id>）。
 * 未启用超级管理员或未填写时 data 可能为 null 或字段为 null，前端应回退到词典默认值。
 */
export async function GET() {
  try {
    const data = await getAboutOwnerPublic();
    return NextResponse.json<ApiResponse<AboutOwnerPublic | null>>({
      success: true,
      data,
      message: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/about/owner] GET failed:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "获取站长公开信息失败",
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
