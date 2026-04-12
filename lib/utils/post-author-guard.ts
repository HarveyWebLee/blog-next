import { NextRequest, NextResponse } from "next/server";

import { postService } from "@/lib/services/post.service";
import { createErrorResponse } from "@/lib/utils";
import { getAuthUserFromRequest, type AuthJwtPayload } from "@/lib/utils/request-auth";
import type { PostData } from "@/types/blog";

/** 从 getPostById 等返回结构中解析 author_id（兼容扁平与 posts 嵌套） */
export function resolvePostAuthorId(post: PostData | null): number | null {
  if (!post) return null;
  const row = post as unknown as { authorId?: number; posts?: { authorId?: number } };
  if (typeof row.authorId === "number") return row.authorId;
  if (row.posts && typeof row.posts.authorId === "number") return row.posts.authorId;
  return null;
}

/**
 * 校验：已登录且当前用户为文章作者。仅作者可改删（不含管理员代操作）。
 * @returns 成功时携带已加载的 post，失败时直接返回 HTTP 响应
 */
export async function requirePostAuthorMutation(
  request: NextRequest,
  postId: number
): Promise<{ ok: true; user: AuthJwtPayload; post: PostData } | { ok: false; response: NextResponse }> {
  const user = getAuthUserFromRequest(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(createErrorResponse("请先登录后再操作文章"), { status: 401 }),
    };
  }

  const post = await postService.getPostById(postId, false);
  if (!post) {
    return {
      ok: false,
      response: NextResponse.json(createErrorResponse("文章不存在"), { status: 404 }),
    };
  }

  const authorId = resolvePostAuthorId(post);
  if (authorId == null) {
    return {
      ok: false,
      response: NextResponse.json(createErrorResponse("文章数据异常，无法校验作者"), { status: 500 }),
    };
  }

  if (user.userId !== authorId) {
    return {
      ok: false,
      response: NextResponse.json(createErrorResponse("只有文章作者本人可以编辑或删除该文章"), { status: 403 }),
    };
  }

  return { ok: true, user, post };
}
