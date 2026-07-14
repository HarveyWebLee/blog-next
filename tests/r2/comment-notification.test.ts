import assert from "node:assert/strict";
import test from "node:test";

import { tApi } from "../../lib/i18n/messages";
import { uniqueRecipientIds } from "../../lib/services/notification.service";

test("uniqueRecipientIds：去重、排除自身、忽略无效 ID", () => {
  assert.deepEqual(uniqueRecipientIds([1, 2, 1, null, 0, -1, undefined, 2], 1), [2]);
  assert.deepEqual(uniqueRecipientIds([5, 5, 5], null), [5]);
  assert.deepEqual(uniqueRecipientIds([null, undefined, 0], 9), []);
});

test("uniqueRecipientIds：回复场景 — 父作者与文章作者去重", () => {
  const parentAuthorId = 10;
  const postAuthorId = 10;
  const actorUserId = 20;
  assert.deepEqual(uniqueRecipientIds([parentAuthorId, postAuthorId], actorUserId), [10]);
});

test("uniqueRecipientIds：作者自回复时不通知自己", () => {
  assert.deepEqual(uniqueRecipientIds([3, 7], 3), [7]);
  assert.deepEqual(uniqueRecipientIds([3], 3), []);
});

test("评论通知文案：三语键齐全且含占位符", () => {
  const keys = [
    "notification.comment.replyTitle",
    "notification.comment.replyContent",
    "notification.comment.newTitle",
    "notification.comment.newContent",
    "notification.comment.approvedTitle",
    "notification.comment.approvedContent",
    "notification.comment.rejectedTitle",
    "notification.comment.rejectedContent",
    "notification.comment.rejectedDefaultReason",
  ] as const;

  for (const key of keys) {
    for (const locale of ["zh-CN", "en-US", "ja-JP"] as const) {
      const text = tApi(locale, key, {
        actorName: "Alice",
        postTitle: "Hello",
        preview: "hi",
        reason: "spam",
      });
      assert.ok(text.length > 0);
      assert.equal(text.includes("{"), false, `${locale} ${key} 仍有未替换占位符: ${text}`);
    }
  }
});
