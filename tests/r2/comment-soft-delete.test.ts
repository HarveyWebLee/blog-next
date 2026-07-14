import assert from "node:assert/strict";
import test from "node:test";

import { buildCommentTree, countCommentTree } from "@/lib/utils/comment-tree";

/**
 * 模拟公开列表裁剪逻辑：deleted 根且无回复则丢弃；计数不含 deleted。
 */
function filterPublicTree<T extends { status: string; replies?: T[] }>(
  roots: Array<T & { replies: T[] }>
): Array<T & { replies: T[] }> {
  return roots.filter((root) => root.status !== "deleted" || (root.replies?.length ?? 0) > 0);
}

function countVisible(nodes: Array<{ status: string; isDeleted?: boolean; replies?: unknown[] }>): number {
  let total = 0;
  for (const node of nodes) {
    if (!(node.isDeleted || node.status === "deleted")) total += 1;
    if (node.replies?.length) {
      total += countVisible(node.replies as Array<{ status: string; isDeleted?: boolean; replies?: unknown[] }>);
    }
  }
  return total;
}

test("软删根保留有回复的占位，并排除无子女的 deleted 根", () => {
  const flat = [
    { id: 1, parentId: null, status: "deleted", isDeleted: true, createdAt: "2026-07-01T10:00:00Z" },
    { id: 2, parentId: 1, status: "approved", createdAt: "2026-07-01T11:00:00Z" },
    { id: 3, parentId: null, status: "deleted", isDeleted: true, createdAt: "2026-07-01T12:00:00Z" },
  ];
  const tree = filterPublicTree(buildCommentTree(flat));
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, 1);
  assert.equal(tree[0].replies.length, 1);
  assert.equal(countVisible(tree), 1);
  assert.equal(countCommentTree(tree), 2);
});
