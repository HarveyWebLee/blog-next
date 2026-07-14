/**
 * 评论树构建（前台最多两层：根评论 + 直接回复）。
 * 纯函数，便于单测；不依赖 DB。
 */

export type CommentTreeInput = {
  id: number;
  parentId?: number | null;
  createdAt?: Date | string;
};

export type CommentTreeNode<T extends CommentTreeInput> = T & {
  replies: CommentTreeNode<T>[];
};

function createdAtMs(value: Date | string | undefined): number {
  if (!value) return 0;
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * 将扁平评论列表组装为最多两层的树。
 * - 无 parentId：根节点
 * - parent 为根：挂到其 replies
 * - parent 本身也是回复（第三层）：折叠挂到祖父根节点的 replies，避免更深嵌套
 * - parent 缺失：降级为根节点，避免断链丢评论
 */
export function buildCommentTree<T extends CommentTreeInput>(items: T[]): CommentTreeNode<T>[] {
  const nodes = new Map<number, CommentTreeNode<T>>();
  for (const item of items) {
    nodes.set(item.id, { ...item, replies: [] });
  }

  const roots: CommentTreeNode<T>[] = [];

  for (const item of items) {
    const node = nodes.get(item.id);
    if (!node) continue;

    const parentId = item.parentId ?? null;
    if (parentId == null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    const grandparentId = parent.parentId ?? null;
    if (grandparentId == null) {
      parent.replies.push(node);
      continue;
    }

    const grandparent = nodes.get(grandparentId);
    if (grandparent && (grandparent.parentId ?? null) == null) {
      grandparent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const root of roots) {
    root.replies.sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt));
  }

  return roots;
}

/** 统计树中节点总数（含回复）。 */
export function countCommentTree(tree: Array<{ replies?: unknown[] }> | null | undefined): number {
  if (!tree?.length) return 0;
  let total = 0;
  for (const node of tree) {
    total += 1 + countCommentTree((node.replies as Array<{ replies?: unknown[] }> | undefined) ?? []);
  }
  return total;
}

/**
 * 校验「回复目标」是否可作为父评论（同文章内、且本身为根评论）。
 * 返回 null 表示合法；否则返回错误码键后缀。
 */
export function validateReplyParent(input: {
  parentPostId: number;
  targetPostId: number;
  parentIdOfParent: number | null | undefined;
}): "parentNotFound" | "parentCrossPost" | "parentDepthExceeded" | null {
  if (input.parentPostId !== input.targetPostId) {
    return "parentCrossPost";
  }
  if (input.parentIdOfParent != null) {
    return "parentDepthExceeded";
  }
  return null;
}
