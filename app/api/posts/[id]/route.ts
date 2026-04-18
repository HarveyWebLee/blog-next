/**
 * 单个文章API路由
 * 提供指定ID文章的增删改查接口
 *
 * GET /api/posts/[id] - 获取指定文章详情
 * PUT /api/posts/[id] - 更新指定文章
 * DELETE /api/posts/[id] - 删除指定文章
 */

import { NextRequest, NextResponse } from "next/server";

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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), {
        status: 400,
      });
    }

    // 是否包含关联数据
    const includeRelations = searchParams.get("includeRelations") !== "false";

    // 调用服务层获取文章详情
    const post = await postService.getPostById(postId, includeRelations);

    // 检查文章是否存在
    if (!post) {
      return NextResponse.json(createErrorResponse("文章不存在"), {
        status: 404,
      });
    }

    // 增加浏览次数（异步操作，不等待结果）
    postService.incrementViewCount(postId).catch((error) => {
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

/**
 * PUT /api/posts/[id]
 * 更新指定文章的信息
 * 需要登录且 **仅文章作者本人** 可操作（非作者含管理员亦不可代编辑）。
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), {
        status: 400,
      });
    }

    const guard = await requirePostAuthorMutation(request, postId);
    if (!guard.ok) {
      return guard.response;
    }
    const beforePost = guard.post;

    // 获取请求体数据
    const body: UpdatePostRequest = await request.json();

    // 验证更新数据
    if (body.title && body.title.length > 200) {
      return NextResponse.json(createErrorResponse("文章标题不能超过200个字符"), { status: 400 });
    }

    if (body.content && body.content.length < 10) {
      return NextResponse.json(createErrorResponse("文章内容不能少于10个字符"), { status: 400 });
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
    return NextResponse.json(createSuccessResponse(updatedPost, "文章更新成功"), { status: 200 });
  } catch (error) {
    console.error("更新文章失败:", error);

    // 处理特定错误类型
    if (error instanceof Error) {
      if (error.message.includes("文章不存在")) {
        return NextResponse.json(createErrorResponse("文章不存在"), {
          status: 404,
        });
      }

      if (error.message.includes("文章别名已存在")) {
        return NextResponse.json(createErrorResponse("文章别名已存在，请使用不同的标题或别名"), { status: 409 });
      }
    }

    // 返回通用错误响应
    return NextResponse.json(createErrorResponse("更新文章失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}

/**
 * DELETE /api/posts/[id]
 * 删除指定文章
 * 需要登录且 **仅文章作者本人** 可删除。
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), {
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
      return NextResponse.json(createErrorResponse("删除文章失败"), {
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
    return NextResponse.json(createSuccessResponse(null, "文章删除成功"), {
      status: 200,
    });
  } catch (error) {
    console.error("删除文章失败:", error);

    // 处理特定错误类型
    if (error instanceof Error) {
      if (error.message.includes("文章不存在")) {
        return NextResponse.json(createErrorResponse("文章不存在"), {
          status: 404,
        });
      }
    }

    // 返回通用错误响应
    return NextResponse.json(createErrorResponse("删除文章失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}

/**
 * PATCH /api/posts/[id]
 * 部分更新文章信息
 * 主要用于更新文章状态、可见性等字段；**仅作者本人**。
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 验证ID参数
    const postId = parseInt(id);
    if (isNaN(postId) || postId <= 0) {
      return NextResponse.json(createErrorResponse("无效的文章ID"), {
        status: 400,
      });
    }

    const guard = await requirePostAuthorMutation(request, postId);
    if (!guard.ok) {
      return guard.response;
    }
    const beforePost = guard.post;

    // 获取请求体数据
    const body = await request.json();

    // 验证更新数据
    if (body.status && !["draft", "published", "archived"].includes(body.status)) {
      return NextResponse.json(createErrorResponse("无效的文章状态"), {
        status: 400,
      });
    }

    if (body.visibility && !["public", "private", "password"].includes(body.visibility)) {
      return NextResponse.json(createErrorResponse("无效的文章可见性"), {
        status: 400,
      });
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
    return NextResponse.json(createSuccessResponse(updatedPost, "文章更新成功"), { status: 200 });
  } catch (error) {
    console.error("部分更新文章失败:", error);

    // 返回错误响应
    return NextResponse.json(createErrorResponse("更新文章失败", error instanceof Error ? error.message : "未知错误"), {
      status: 500,
    });
  }
}
