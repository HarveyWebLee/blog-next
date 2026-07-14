import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("文章列表使用单次标签批量查询", async () => {
  const source = await readFile(new URL("../../lib/services/post.service.ts", import.meta.url), "utf8");
  const getPostsStart = source.indexOf("async getPosts(");
  const nextMethodStart = source.indexOf("\n  /**", getPostsStart);
  const getPostsSource = source.slice(getPostsStart, nextMethodStart);

  assert.notEqual(getPostsStart, -1, "找不到 PostService.getPosts");
  assert.match(source, /where\(inArray\(postTags\.postId, uniquePostIds\)\)/);
  assert.match(getPostsSource, /await this\.getTagsByPostIds\(postsData\.map\(\(post\) => post\.id\)\)/);
  assert.doesNotMatch(getPostsSource, /await this\.getPostTags\(/);
});
