import { and, asc, eq, inArray, or } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { comments, users } from "@/lib/db/schema";
import { buildCommentTree, type CommentTreeNode } from "@/lib/utils/comment-tree";
import type { CommentStatus } from "@/types/blog";

/** 前台公开评论节点（不含邮箱/IP/UA 等隐私字段）。 */
export type PublicCommentAuthor = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
};

export type PublicComment = {
  id: number;
  postId: number;
  parentId: number | null;
  authorId?: number;
  authorName: string | null;
  content: string;
  status: CommentStatus;
  /** 父评论软删后的前台占位 */
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: PublicCommentAuthor;
  replies?: PublicComment[];
};

export type ApprovedCommentsPayload = {
  comments: CommentTreeNode<PublicComment>[];
  total: number;
};

/**
 * 读取某文章前台可见评论：已通过审核，以及「有子回复的已软删父评论」占位。
 * 组装为最多两层的树；不返回隐私字段。
 */
export async function listApprovedCommentsForPost(postId: number): Promise<ApprovedCommentsPayload> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      parentId: comments.parentId,
      authorId: comments.authorId,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorName: comments.authorName,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
      authorAvatar: users.avatar,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(
      and(
        eq(comments.postId, postId),
        or(
          eq(comments.status, "approved"),
          // 软删根评论仅在有其他行挂接时才有意义；先取整帖 deleted，树裁剪时再丢掉无子女的占位
          eq(comments.status, "deleted")
        )
      )
    )
    .orderBy(asc(comments.createdAt));

  const flat: PublicComment[] = rows.map((row) => {
    const isDeleted = row.status === "deleted";
    return {
      id: row.id,
      postId: row.postId,
      parentId: row.parentId ?? null,
      authorId: isDeleted ? undefined : (row.authorId ?? undefined),
      authorName: isDeleted ? null : row.authorName,
      content: isDeleted ? "" : row.content,
      status: row.status as CommentStatus,
      isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author:
        !isDeleted && row.authorId
          ? {
              id: row.authorId,
              username: row.authorUsername || "",
              displayName: row.authorDisplayName || row.authorUsername || row.authorName || "",
              avatar: row.authorAvatar || undefined,
            }
          : undefined,
    };
  });

  const tree = buildCommentTree(flat)
    .filter((root) => root.status !== "deleted" || (root.replies?.length ?? 0) > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    comments: tree,
    total: countVisibleComments(tree),
  };
}

function countVisibleComments(tree: CommentTreeNode<PublicComment>[]): number {
  let total = 0;
  for (const node of tree) {
    if (!node.isDeleted) total += 1;
    if (node.replies?.length) total += countVisibleComments(node.replies);
  }
  return total;
}

/** 按 ID 读取评论（校验回复父级 / 通知联动时使用）。 */
export async function getCommentById(commentId: number): Promise<{
  id: number;
  postId: number;
  parentId: number | null;
  authorId: number | null;
  status: CommentStatus;
} | null> {
  const [row] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      parentId: comments.parentId,
      authorId: comments.authorId,
      status: comments.status,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    postId: row.postId,
    parentId: row.parentId ?? null,
    authorId: row.authorId ?? null,
    status: row.status as CommentStatus,
  };
}

export type CommentDeleteResult = {
  softDeletedIds: number[];
  hardDeletedIds: number[];
};

/**
 * 删除评论：若根评论仍有「未一并删除」的子评论，则软删为 deleted 占位并擦除隐私字段；否则硬删。
 */
export async function deleteCommentsPreferSoftParent(ids: number[]): Promise<CommentDeleteResult> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  const softDeletedIds: number[] = [];
  const hardDeletedIds: number[] = [];
  if (uniqueIds.length === 0) {
    return { softDeletedIds, hardDeletedIds };
  }

  const deleteSet = new Set(uniqueIds);
  const rows = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      status: comments.status,
    })
    .from(comments)
    .where(inArray(comments.id, uniqueIds));

  if (rows.length === 0) {
    return { softDeletedIds, hardDeletedIds };
  }

  const existingIds = rows.map((r) => r.id);
  const childRows = await db
    .select({ id: comments.id, parentId: comments.parentId })
    .from(comments)
    .where(inArray(comments.parentId, existingIds));

  const remainingChildCount = new Map<number, number>();
  for (const child of childRows) {
    if (child.parentId == null) continue;
    if (deleteSet.has(child.id)) continue;
    remainingChildCount.set(child.parentId, (remainingChildCount.get(child.parentId) || 0) + 1);
  }

  const toSoft: number[] = [];
  const toHard: number[] = [];
  for (const row of rows) {
    const isRoot = row.parentId == null;
    if (isRoot && (remainingChildCount.get(row.id) || 0) > 0) {
      toSoft.push(row.id);
    } else {
      toHard.push(row.id);
    }
  }

  if (toSoft.length > 0) {
    await db
      .update(comments)
      .set({
        status: "deleted",
        content: "",
        authorName: null,
        authorEmail: null,
        authorWebsite: null,
        authorId: null,
        ipAddress: null,
        userAgent: null,
        updatedAt: new Date(),
      })
      .where(inArray(comments.id, toSoft));
    softDeletedIds.push(...toSoft);
  }

  if (toHard.length > 0) {
    await db.delete(comments).where(inArray(comments.id, toHard));
    hardDeletedIds.push(...toHard);
  }

  return { softDeletedIds, hardDeletedIds };
}
