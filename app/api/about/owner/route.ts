import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { getAboutOwnerPublic, type AboutOwnerPublic } from "@/lib/services/about-owner.service";
import type { ApiResponse } from "@/types/blog";

/**
 * GET /api/about/owner
 * 公开接口：返回关于页可用的站长联系信息（超级管理员 user_profiles.user_id=<super_admin_id>）。
 * 未启用超级管理员或未填写时 data 可能为 null 或字段为 null，前端应回退到词典默认值。
 */
async function handleAboutOwnerGET(_request: NextRequest) {
  try {
    const data = await getAboutOwnerPublic();
    return NextResponse.json<ApiResponse<AboutOwnerPublic | null>>({
      success: true,
      data,
      message: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}

export const { GET } = defineApiHandlers({ GET: handleAboutOwnerGET });
