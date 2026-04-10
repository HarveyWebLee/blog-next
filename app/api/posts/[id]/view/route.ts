// 实现文章浏览次数增加

import { NextRequest, NextResponse } from "next/server";

import { postService } from "@/lib/services/post.service";
import { createSuccessResponse } from "@/lib/utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  postService.incrementViewCount(postId).catch((error) => {
    console.error("增加浏览次数失败:", error);
  });
  // 返回成功响应
  return NextResponse.json(createSuccessResponse(true, "增加浏览次数成功"), {
    status: 200,
  });
}
