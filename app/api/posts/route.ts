/**
 * 文章API路由
 * 提供文章的增删改查接口
 *
 * GET /api/posts - 获取文章列表（支持分页、搜索、过滤）
 * POST /api/posts - 创建新文章
 */

import { NextRequest, NextResponse } from "next/server";

import { resolveOptionalPasswordForPostBody } from "@/lib/crypto/password-transport/resolve-secret";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { postService } from "@/lib/services/post.service";
import { subscriptionService } from "@/lib/services/subscription.service";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { isJwtInMemorySuperRoot } from "@/lib/utils/authz";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";
import { CreatePostRequest, PostQueryParams } from "@/types/blog";

/**
 * GET /api/posts
 * 获取文章列表
 * 支持分页、搜索、状态过滤、标签过滤等
 */
async function handlePostsGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder: "asc" | "desc" = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";

    // 解析查询参数
    const queryParams: PostQueryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder,
      status: (searchParams.get("status") as any) || undefined,
      visibility: (searchParams.get("visibility") as any) || undefined,
      // 安全收敛：列表默认不放开密码保护文章，避免存在性侧信道暴露。
      includePasswordProtected: false,
      authorId: searchParams.get("authorId") ? parseInt(searchParams.get("authorId")!) : undefined,
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

    // 按 authorId 筛选（管理后台）时：必须登录。
    // 普通用户只能查询本人；超级管理员可查询任意作者。
    if (queryParams.authorId != null && !Number.isNaN(queryParams.authorId)) {
      const viewer = getAuthUserFromRequest(request);
      if (!viewer) {
        return NextResponse.json(createErrorResponse("按作者筛选文章需先登录"), { status: 401 });
      }
      const canViewAnyAuthor = isJwtInMemorySuperRoot(viewer);
      if (!canViewAnyAuthor && viewer.userId !== queryParams.authorId) {
        return NextResponse.json(createErrorResponse("无权查看其他作者的管理列表"), { status: 403 });
      }
    }

    // 调用服务层获取文章列表
    const result = await postService.getPosts(queryParams);

    // 返回成功响应
    return NextResponse.json(createSuccessResponse(result, "获取文章列表成功"), { status: 200 });
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/posts
 * 创建新文章
 * 需要用户认证和适当的权限
 */
async function handlePostsPOST(request: NextRequest) {
  try {
    // 获取请求体数据（密码字段支持 passwordTransport）
    const raw = (await request.json()) as Record<string, unknown>;
    const pwdPart = await resolveOptionalPasswordForPostBody(raw);
    if (!pwdPart.ok) {
      return NextResponse.json(createErrorResponse(pwdPart.message), { status: pwdPart.status });
    }
    const { passwordTransport: _pt, password: _pp, ...rest } = raw;
    const body: CreatePostRequest = {
      ...(rest as unknown as CreatePostRequest),
      ...(pwdPart.password !== undefined ? { password: pwdPart.password } : {}),
    };

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

    const viewer = getAuthUserFromRequest(request);
    if (!viewer) {
      return NextResponse.json(createErrorResponse("请先登录后再创建文章"), { status: 401 });
    }

    // 调用服务层创建文章（作者固定为当前登录用户）
    const newPost = await postService.createPost(body, viewer.userId);

    const postCore = (newPost as any)?.posts || newPost;

    // 新建即发布：触发订阅通知
    if (postCore && postCore.status === "published") {
      await subscriptionService.notifyOnPostPublished({
        title: postCore.title,
        slug: postCore.slug,
        excerpt: postCore.excerpt,
      });
    }

    if (postCore?.id) {
      logUserActivity({
        userId: viewer.userId,
        action: UserActivityAction.POST_CREATED,
        description: postCore.title,
        metadata: { postId: postCore.id, slug: postCore.slug, status: postCore.status },
        request,
      });
    }

    // 返回成功响应
    return NextResponse.json(createSuccessResponse(newPost, "文章创建成功"), {
      status: 201,
    });
  } catch (error) {
    // 处理特定错误类型
    if (error instanceof Error) {
      if (error.message.includes("文章别名已存在")) {
        return NextResponse.json(createErrorResponse("文章别名已存在，请使用不同的标题或别名"), { status: 409 });
      }
    }

    throw error;
  }
}

export const { GET, POST } = defineApiHandlers(
  {
    GET: handlePostsGET,
    POST: handlePostsPOST,
  },
  {
    // 示例：对核心路由的未捕获异常触发 5xx 告警桥接（开关由 LOG_ALERTS_ENABLED 控制）
    onError: (payload) => {
      notifyRouteUnhandledError(payload);
    },
    onUnhandledErrorResponse: ({ method }) =>
      NextResponse.json(createErrorResponse(method === "GET" ? "获取文章列表失败" : "创建文章失败"), { status: 500 }),
  }
);
