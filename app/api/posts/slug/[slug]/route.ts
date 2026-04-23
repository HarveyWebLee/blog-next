/**
 * 通过 slug 获取文章详情
 * GET /api/posts/slug/[slug] - 根据 slug 获取文章详情（含密码保护校验）
 * PATCH /api/posts/slug/[slug] - 校验密码保护文章密码
 */

import { NextRequest, NextResponse } from "next/server";

import { resolveSecretFromBody } from "@/lib/crypto/password-transport/resolve-secret";
import { defineApiHandlers } from "@/lib/server/define-api-handlers";
import { logger } from "@/lib/server/logger";
import { postService } from "@/lib/services/post.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils";
import { generatePostUnlockTicket, verifyPostUnlockTicket } from "@/lib/utils/post-password-ticket";
import { getAuthUserFromRequest } from "@/lib/utils/request-auth";

type PostCore = {
  id: number;
  slug?: string;
  authorId?: number;
  visibility?: string;
  password?: string | null;
  content?: string;
  contentHtml?: string | null;
};

function resolvePostCore(post: unknown): PostCore {
  const row = post as { posts?: PostCore } & PostCore;
  return row.posts || row;
}

function sanitizePostForResponse(post: unknown, passwordVerified: boolean, hideContent: boolean) {
  const row = post as any;
  const core = resolvePostCore(post);
  if (row.posts) {
    return {
      ...row,
      posts: {
        ...row.posts,
        password: undefined,
        passwordVerified,
        content: hideContent ? "" : core.content,
        contentHtml: hideContent ? null : core.contentHtml,
      },
      passwordVerified,
    };
  }
  return {
    ...row,
    password: undefined,
    passwordVerified,
    content: hideContent ? "" : core.content,
    contentHtml: hideContent ? null : core.contentHtml,
  };
}

/**
 * GET /api/posts/slug/[slug]
 * 根据slug获取文章详情
 */
async function handlePostBySlugGET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(createErrorResponse("文章slug不能为空"), { status: 400 });
    }

    const post = await postService.getPostBySlug(slug, true);
    if (!post) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
    }

    const core = resolvePostCore(post);
    const isPasswordProtected = core.visibility === "password";
    const authUser = getAuthUserFromRequest(request);
    const isAuthor = Boolean(authUser && core.authorId && authUser.userId === core.authorId);
    const unlockToken = new URL(request.url).searchParams.get("unlock") || "";
    const passwordVerified = !isPasswordProtected || isAuthor || verifyPostUnlockTicket(unlockToken, slug);
    const responsePost = sanitizePostForResponse(post, passwordVerified, isPasswordProtected && !passwordVerified);

    if (passwordVerified) {
      postService.incrementViewCount(core.id).catch((error) => {
        logger.warn("api/posts/slug/[slug]", "incrementViewCount 异步失败", { slug, err: String(error) });
      });
    }

    return NextResponse.json(createSuccessResponse(responsePost, "获取文章详情成功"), { status: 200 });
  } catch (error) {
    throw error;
  }
}

/**
 * PATCH /api/posts/slug/[slug]
 * 校验密码保护文章密码
 */
async function handlePostBySlugPATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(createErrorResponse("文章slug不能为空"), { status: 400 });
    }

    const post = await postService.getPostBySlug(slug, true);
    if (!post) {
      return NextResponse.json(createErrorResponse("文章不存在"), { status: 404 });
    }
    const core = resolvePostCore(post);
    const rawBody = (await request.json()) as Record<string, unknown>;
    const secret = await resolveSecretFromBody({ body: rawBody, plainField: "password" });
    if (!secret.ok) {
      return NextResponse.json(createErrorResponse(secret.message), { status: secret.status });
    }
    const password = secret.plaintext.trim();

    if (core.visibility !== "password") {
      return NextResponse.json(createSuccessResponse(sanitizePostForResponse(post, true, false), "文章无需密码"), {
        status: 200,
      });
    }

    const authUser = getAuthUserFromRequest(request);
    const isAuthor = Boolean(authUser && core.authorId && authUser.userId === core.authorId);
    if (!isAuthor && (!core.password || password !== String(core.password))) {
      return NextResponse.json(createErrorResponse("密码错误"), { status: 403 });
    }

    const unlockToken = generatePostUnlockTicket(slug);
    const responsePost = {
      ...sanitizePostForResponse(post, true, false),
      unlockToken,
    };

    return NextResponse.json(createSuccessResponse(responsePost, "密码验证成功"), {
      status: 200,
    });
  } catch (error) {
    throw error;
  }
}

export const { GET, PATCH } = defineApiHandlers({
  GET: handlePostBySlugGET,
  PATCH: handlePostBySlugPATCH,
});
