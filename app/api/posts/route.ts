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

    const includePasswordProtectedFlag = searchParams.get("includePasswordProtected") === "true";
    const includePrivateFlag = searchParams.get("includePrivate") === "true";
    const authorId = searchParams.get("authorId") ? parseInt(searchParams.get("authorId")!) : undefined;

    // 解析查询参数
    const queryParams: PostQueryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder,
      status: (searchParams.get("status") as any) || undefined,
      visibility: (searchParams.get("visibility") as any) || undefined,
      // 列表默认不放开密码保护文章；但管理端（authorId 过滤）允许回看本人密码文章。
      includePasswordProtected: includePasswordProtectedFlag || (authorId != null && !Number.isNaN(authorId)),
      // private 可见性仅在管理查询中显式放开（需后续鉴权通过）。
      includePrivate: includePrivateFlag,
      authorId,
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

    // includePrivate=true：属于管理视角查询，必须登录。
    // - 带 authorId：沿用上方 authorId 权限校验（普通用户仅本人，超级管理员可任意作者）。
    // - 不带 authorId：仅超级管理员可看全站 private 列表。
    if (queryParams.includePrivate) {
      const viewer = getAuthUserFromRequest(request);
      if (!viewer) {
        return NextResponse.json(createErrorResponse("查看 private 文章需先登录"), { status: 401 });
      }
      const canViewAnyAuthor = isJwtInMemorySuperRoot(viewer);
      if ((queryParams.authorId == null || Number.isNaN(queryParams.authorId)) && !canViewAnyAuthor) {
        return NextResponse.json(createErrorResponse("仅超级管理员可查看全站 private 文章"), { status: 403 });
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
    // 当可见性为密码保护时，访问密码为必填（接口兜底，防止绕过前端校验）。
    if (body.visibility === "password" && !body.password?.trim()) {
      return NextResponse.json(createErrorResponse("可见性为密码保护时，访问密码不能为空"), { status: 400 });
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
    onUnhandledErrorResponse: ({ method, error }) => {
      const fallbackMessage = method === "GET" ? "获取文章列表失败" : "创建文章失败";
      // 开发环境透传真实异常，便于联调定位；生产环境保持通用提示，避免内部实现细节泄露。
      const message =
        process.env.NODE_ENV !== "production" && error instanceof Error && error.message
          ? error.message
          : fallbackMessage;
      return NextResponse.json(createErrorResponse(message), { status: 500 });
    },
  }
);
