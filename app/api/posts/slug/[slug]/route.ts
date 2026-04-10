/**
 * 通过slug获取文章API路由
 * GET /api/posts/slug/[slug] - 根据slug获取文章详情
 */

import { NextRequest, NextResponse } from "next/server";

import { postService } from "@/lib/services/post.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";

/**
 * GET /api/posts/slug/[slug]
 * 根据slug获取文章详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // 验证slug参数
    if (!slug) {
      return NextResponse.json(createErrorResponse("文章slug不能为空"), {
        status: 400,
      });
    }

    // 调用服务层获取文章详情
    const post = await postService.getPostBySlug(slug, true);

    // 检查文章是否存在
    if (!post) {
      return NextResponse.json(createErrorResponse("文章不存在"), {
        status: 404,
      });
    }

    // 增加浏览次数（异步操作，不等待结果）
    postService.incrementViewCount(post.id).catch((error) => {
      console.error("增加浏览次数失败:", error);
    });

    // 返回成功响应
    return NextResponse.json(createSuccessResponse(post, "获取文章详情成功"), {
      status: 200,
    });
  } catch (error) {
    console.error("获取文章详情失败:", error);

    // 返回错误响应
    return NextResponse.json(
      createErrorResponse("获取文章详情失败", error instanceof Error ? error.message : "未知错误"),
      { status: 500 }
    );
  }
}
