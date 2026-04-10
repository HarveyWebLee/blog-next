/**
 * 文章API路由
 * 提供文章的增删改查接口
 *
 * GET /api/posts - 获取文章列表（支持分页、搜索、过滤）
 * POST /api/posts - 创建新文章
 */

import { NextRequest, NextResponse } from "next/server";

import { postService } from "@/lib/services/post.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { CreatePostRequest, PostQueryParams } from "@/types/blog";

/**
 * GET /api/posts
 * 获取文章列表
 * 支持分页、搜索、状态过滤、分类过滤等
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const queryParams: PostQueryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      status: (searchParams.get("status") as any) || undefined,
      visibility: (searchParams.get("visibility") as any) || undefined,
      authorId: searchParams.get("authorId") ? parseInt(searchParams.get("authorId")!) : undefined,
      categoryId: searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!) : undefined,
      tagId: searchParams.get("tagId") ? parseInt(searchParams.get("tagId")!) : undefined,
      search: searchParams.get("search") || undefined,
      featured: searchParams.get("featured") === "true",
    };

    // 验证分页参数
    if ((queryParams.page || 1) < 1) {
      return NextResponse.json(createErrorResponse("页码必须大于0"), {
        status: 400,
      });
    }

    if ((queryParams.limit || 10) < 1 || (queryParams.limit || 10) > 100) {
      return NextResponse.json(createErrorResponse("每页数量必须在1-100之间"), {
        status: 400,
      });
    }

    // 调用服务层获取文章列表
    const result = await postService.getPosts(queryParams);

    // 返回成功响应
    return NextResponse.json(createSuccessResponse(result, "获取文章列表成功"), { status: 200 });
  } catch (error) {
    console.error("获取文章列表失败:", error);

    // 返回错误响应
    return NextResponse.json(
      createErrorResponse("获取文章列表失败", error instanceof Error ? error.message : "未知错误"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 * 创建新文章
 * 需要用户认证和适当的权限
 */
export async function POST(request: NextRequest) {
  try {
    // 获取请求体数据
    const body: CreatePostRequest = await request.json();

    // 验证必需字段
    if (!body.title || !body.content) {
      return NextResponse.json(createErrorResponse("文章标题和内容不能为空"), {
        status: 400,
      });
    }

    // 验证标题长度
    if (body.title.length > 200) {
      return NextResponse.json(createErrorResponse("文章标题不能超过200个字符"), { status: 400 });
    }

    // 验证内容长度
    if (body.content.length < 10) {
      return NextResponse.json(createErrorResponse("文章内容不能少于10个字符"), { status: 400 });
    }

    // TODO: 这里应该从JWT token中获取用户ID
    // 目前暂时使用固定值进行演示
    const authorId = 1; // 实际应用中应该从认证中间件获取

    // 调用服务层创建文章
    const newPost = await postService.createPost(body, authorId);

    // 返回成功响应
    return NextResponse.json(createSuccessResponse(newPost, "文章创建成功"), {
      status: 201,
    });
  } catch (error) {
    console.error("创建文章失败:", error);

    // 处理特定错误类型
    if (error instanceof Error) {
      if (error.message.includes("文章别名已存在")) {
        return NextResponse.json(createErrorResponse("文章别名已存在，请使用不同的标题或别名"), { status: 409 });
      }
    }

    // 返回通用错误响应
    return NextResponse.json(createErrorResponse("创建文章失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}
