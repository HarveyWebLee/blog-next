import assert from "node:assert/strict";
import test from "node:test";

import { detectSpamContent } from "@/lib/utils/comment-spam";

test("普通短评不判 spam", () => {
  const result = detectSpamContent("写得很清楚，学到了，谢谢分享。");
  assert.equal(result.isSpam, false);
  assert.equal(result.reasons.length, 0);
});

test("单独高风险关键词判 spam", () => {
  const result = detectSpamContent("buy cheap viagra online today");
  assert.equal(result.isSpam, true);
  assert.ok(result.reasons.some((r) => r.includes("高风险")));
});

test("多链接判 spam", () => {
  const result = detectSpamContent("见 https://a.example 和 https://b.example");
  assert.equal(result.isSpam, true);
});

test("重复字符刷屏判 spam", () => {
  const result = detectSpamContent("啊啊啊啊啊啊啊啊啊啊");
  assert.equal(result.isSpam, true);
});

test("链接占比过高判 spam", () => {
  const result = detectSpamContent("https://spam.example/very/long/path/here");
  assert.equal(result.isSpam, true);
});
