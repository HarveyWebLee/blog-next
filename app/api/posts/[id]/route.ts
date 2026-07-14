/**
 * 单个文章API路由
 * 提供指定ID文章的增删改查接口
 *
 * GET /api/posts/[id] - 获取指定文章详情
 * PUT /api/posts/[id] - 更新指定文章
 * DELETE /api/posts/[id] - 删除指定文章
 */
import { NextRequest, NextResponse } from "next/server";

import { resolveOptionalPasswordForPostBody } from "@/lib/crypto/password-transport/resolve-secret";
import { localizedErrorFromRaw, localizedErrorResponse, localizedSuccessResponse } from "@/lib/i18n/api-response";
import { getRequestLocale } from "@/lib/i18n/locale";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { notifyRouteUnhandledError } from "@/lib/server/route-alert";
import { postService } from "@/lib/services/post.service";
import { subscriptionService } from "@/lib/services/subscription.service";
import { logUserActivity, UserActivityAction } from "@/lib/services/user-activity-log.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { requirePostAuthorMutation } from "@/lib/utils/post-author-guard";
import { UpdatePostRequest } from "@/types/blog";

/**
 * GET /api/posts/[id]
 * 获取指定文章的详细信息
 * 支持包含关联数据（作者、分类、标签、评论等）
 */
async function handlePostByIdGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), {
        status: 400,
      });
    }

    // 是否包含关联数据
    const includeRelations = searchParams.get("includeRelations") !== "false";

    // 调用服务层获取文章详情
    const post = await postService.getPostById(postId, includeRelations);

    // 检查文章是否存在
    if (!post) {
      return NextResponse.json(localizedErrorResponse(request, "post.notFound"), {
        status: 404,
      });
    }

    // 增加浏览次数（异步操作，不等待结果）
    postService.incrementViewCount(postId).catch((error) => {
      logger.warn("api/posts/[id]", "incrementViewCount 异步失败", { postId, err: String(error) });
    });

    // 返回成功响应
    return NextResponse.json(localizedSuccessResponse(request, post, "post.fetchDetailSuccess"), {
      status: 200,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * PUT /api/posts/[id]
 * 更新指定文章的信息
 * 需要登录且 **仅文章作者本人** 可操作（非作者含管理员亦不可代编辑）。
 */
async function handlePostByIdPUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), {
        status: 400,
      });
    }

    const guard = await requirePostAuthorMutation(request, postId);
    if (!guard.ok) {
      return guard.response;
    }
    const beforePost = guard.post;

    // 获取请求体数据（密码字段支持 passwordTransport）
    const raw = (await request.json()) as Record<string, unknown>;
    const locale = getRequestLocale(request);
    const pwdPart = await resolveOptionalPasswordForPostBody(raw, locale, request);
    if (!pwdPart.ok) {
      return NextResponse.json(localizedErrorFromRaw(request, pwdPart.message), { status: pwdPart.status });
    }
    const { passwordTransport: _pt, password: _pp, ...rest } = raw;
    const body: UpdatePostRequest = {
      ...(rest as UpdatePostRequest),
      ...(pwdPart.password !== undefined ? { password: pwdPart.password } : {}),
    };

    // 验证更新数据
    if (body.title && body.title.length > 200) {
      return NextResponse.json(localizedErrorResponse(request, "post.titleTooLong"), { status: 400 });
    }

    if (body.content && body.content.length < 10) {
      return NextResponse.json(localizedErrorResponse(request, "post.contentTooShort"), { status: 400 });
    }
    // 可见性切到 password 时必须保证“最终密码”存在：
    // - 本次 body 传了 password：以本次为准；
    // - 未传 password：沿用原文章密码；
    // 为空则拒绝，避免出现“密码保护但无密码”的不可访问状态。
    const nextVisibility =
      body.visibility ?? ((beforePost as { visibility?: string }).visibility as string | undefined);
    const nextPassword = body.password ?? (beforePost as { password?: string | null }).password ?? undefined;
    if (nextVisibility === "password" && !nextPassword?.trim()) {
      return NextResponse.json(localizedErrorResponse(request, "post.passwordVisibilityRequired"), { status: 400 });
    }

    // 调用服务层更新文章
    const updatedPost = await postService.updatePost(postId, body);
    const updatedPostCore = (updatedPost as any)?.posts || updatedPost;

    // 从未发布 -> 已发布：触发订阅通知
    if (beforePost && beforePost.status !== "published" && updatedPostCore.status === "published") {
      await subscriptionService.notifyOnPostPublished({
        title: updatedPostCore.title,
        slug: updatedPostCore.slug,
        excerpt: updatedPostCore.excerpt,
      });
    }

    logUserActivity({
      userId: guard.user.userId,
      action: UserActivityAction.POST_UPDATED,
      description: updatedPostCore?.title,
      metadata: { postId, slug: updatedPostCore?.slug },
      request,
    });

    // 返回成功响应
    return NextResponse.json(localizedSuccessResponse(request, updatedPost, "post.updateSuccess"), { status: 200 });
  } catch (error) {
    // 处理特定错误类型
    if (error instanceof Error) {
      if (error.message.includes("文章不存在")) {
        return NextResponse.json(localizedErrorResponse(request, "post.notFound"), {
          status: 404,
        });
      }

      if (error.message.includes("文章别名已存在")) {
        return NextResponse.json(localizedErrorResponse(request, "post.slugExists"), { status: 409 });
      }
    }

    throw error;
  }
}

/**
 * DELETE /api/posts/[id]
 * 删除指定文章
 * 需要登录且 **仅文章作者本人** 可删除。
 */
async function handlePostByIdDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), {
        status: 400,
      });
    }

    const guard = await requirePostAuthorMutation(request, postId);
    if (!guard.ok) {
      return guard.response;
    }

    // 删除前记录标题等，供活动日志使用
    const delTitle = (guard.post as { title?: string }).title;
    const delSlug = (guard.post as { slug?: string }).slug;

    // 调用服务层删除文章
    const result = await postService.deletePost(postId);

    if (!result) {
      return NextResponse.json(localizedErrorResponse(request, "post.deleteFailed"), {
        status: 500,
      });
    }

    logUserActivity({
      userId: guard.user.userId,
      action: UserActivityAction.POST_DELETED,
      description: delTitle,
      metadata: { postId, slug: delSlug },
      request,
    });

    // 返回成功响应
    return NextResponse.json(localizedSuccessResponse(request, null, "post.deleteSuccess"), {
      status: 200,
    });
  } catch (error) {
    // 处理特定错误类型
    if (error instanceof Error) {
      if (error.message.includes("文章不存在")) {
        return NextResponse.json(localizedErrorResponse(request, "post.notFound"), {
          status: 404,
        });
      }
    }

    throw error;
  }
}

/**
 * PATCH /api/posts/[id]
 * 部分更新文章信息
 * 主要用于更新文章状态、可见性等字段；**仅作者本人**。
 */
async function handlePostByIdPATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidId"), {
        status: 400,
      });
    }

    const guard = await requirePostAuthorMutation(request, postId);
    if (!guard.ok) {
      return guard.response;
    }
    const beforePost = guard.post;

    // 获取请求体数据（密码字段支持 passwordTransport）
    const raw = (await request.json()) as Record<string, unknown>;
    const locale = getRequestLocale(request);
    const pwdPart = await resolveOptionalPasswordForPostBody(raw, locale, request);
    if (!pwdPart.ok) {
      return NextResponse.json(localizedErrorFromRaw(request, pwdPart.message), { status: pwdPart.status });
    }
    const { passwordTransport: _pt, password: _pp, ...rest } = raw;
    const body: UpdatePostRequest = {
      ...(rest as unknown as UpdatePostRequest),
      ...(pwdPart.password !== undefined ? { password: pwdPart.password } : {}),
    };

    // 验证更新数据
    if (body.status && !["draft", "published", "archived"].includes(body.status)) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidStatus"), {
        status: 400,
      });
    }

    if (body.visibility && !["public", "private", "password"].includes(body.visibility)) {
      return NextResponse.json(localizedErrorResponse(request, "post.invalidVisibility"), {
        status: 400,
      });
    }
    // PATCH 场景同样要求：最终可见性为 password 时必须存在访问密码（本次或历史）。
    const nextVisibility =
      body.visibility ?? ((beforePost as { visibility?: string }).visibility as string | undefined);
    const nextPassword = body.password ?? (beforePost as { password?: string | null }).password ?? undefined;
    if (nextVisibility === "password" && !nextPassword?.trim()) {
      return NextResponse.json(localizedErrorResponse(request, "post.passwordVisibilityRequired"), { status: 400 });
    }

    // 调用服务层更新文章
    const updatedPost = await postService.updatePost(postId, body);
    const updatedPostCore = (updatedPost as any)?.posts || updatedPost;

    // 从未发布 -> 已发布：触发订阅通知
    if (beforePost && beforePost.status !== "published" && updatedPostCore.status === "published") {
      await subscriptionService.notifyOnPostPublished({
        title: updatedPostCore.title,
        slug: updatedPostCore.slug,
        excerpt: updatedPostCore.excerpt,
      });
    }

    logUserActivity({
      userId: guard.user.userId,
      action: UserActivityAction.POST_UPDATED,
      description: updatedPostCore?.title,
      metadata: { postId, slug: updatedPostCore?.slug, patch: true },
      request,
    });

    // 返回成功响应
    return NextResponse.json(localizedSuccessResponse(request, updatedPost, "post.updateSuccess"), { status: 200 });
  } catch (error) {
    throw error;
  }
}

export const { GET, PUT, DELETE, PATCH } = defineApiHandlers(
  {
    GET: handlePostByIdGET,
    PUT: handlePostByIdPUT,
    DELETE: handlePostByIdDELETE,
    PATCH: handlePostByIdPATCH,
  },
  {
    onError: (payload) => {
      notifyRouteUnhandledError(payload);
    },
    onUnhandledErrorResponse: ({ request, method }) => {
      if (method === "GET")
        return NextResponse.json(localizedErrorResponse(request, "post.fetchFailed"), { status: 500 });
      if (method === "DELETE")
        return NextResponse.json(localizedErrorResponse(request, "post.deleteFailed"), { status: 500 });
      return NextResponse.json(localizedErrorResponse(request, "post.updateFailed"), { status: 500 });
    },
  }
);
