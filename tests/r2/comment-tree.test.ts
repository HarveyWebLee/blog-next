import assert from "node:assert/strict";
import test from "node:test";

import { buildCommentTree, countCommentTree, validateReplyParent } from "../../lib/utils/comment-tree";

test("buildCommentTree：根评论 + 一层回复，最多两层", () => {
  const tree = buildCommentTree([
    { id: 1, parentId: null, createdAt: "2026-07-01T10:00:00Z", content: "root-a" },
    { id: 2, parentId: 1, createdAt: "2026-07-01T11:00:00Z", content: "reply-1" },
    { id: 3, parentId: 1, createdAt: "2026-07-01T10:30:00Z", content: "reply-0" },
    { id: 4, parentId: null, createdAt: "2026-07-01T12:00:00Z", content: "root-b" },
  ]);

  assert.equal(tree.length, 2);
  const rootA = tree.find((n) => n.id === 1);
  assert.ok(rootA);
  assert.equal(rootA.replies.length, 2);
  assert.equal(rootA.replies[0]?.id, 3);
  assert.equal(rootA.replies[1]?.id, 2);
  assert.equal(countCommentTree(tree), 4);
});

test("buildCommentTree：第三层折叠到祖父根节点 replies", () => {
  const tree = buildCommentTree([
    { id: 1, parentId: null, createdAt: "2026-07-01T10:00:00Z" },
    { id: 2, parentId: 1, createdAt: "2026-07-01T11:00:00Z" },
    { id: 3, parentId: 2, createdAt: "2026-07-01T12:00:00Z" },
  ]);

  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.replies.length, 2);
  assert.deepEqual(
    tree[0]?.replies.map((r) => r.id).sort((a, b) => a - b),
    [2, 3]
  );
});

test("buildCommentTree：父评论缺失时降级为根，避免丢评论", () => {
  const tree = buildCommentTree([{ id: 10, parentId: 999, createdAt: "2026-07-01T10:00:00Z" }]);
  assert.equal(tree.length, 1);
  assert.equal(tree[0]?.id, 10);
});

test("validateReplyParent：拒绝跨文章与超过两层", () => {
  assert.equal(validateReplyParent({ parentPostId: 1, targetPostId: 1, parentIdOfParent: null }), null);
  assert.equal(validateReplyParent({ parentPostId: 2, targetPostId: 1, parentIdOfParent: null }), "parentCrossPost");
  assert.equal(validateReplyParent({ parentPostId: 1, targetPostId: 1, parentIdOfParent: 9 }), "parentDepthExceeded");
});
