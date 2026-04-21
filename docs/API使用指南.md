# 博客 API 使用指南（前端调用视角）

## 概述

本文档说明当前前端如何通过 `PostsAPI` 与 `usePosts` 使用博客相关接口。  
若需查看全量接口与鉴权摘要，请以 `docs/接口文档.md` 为准。

## 调用分层

```text
页面组件
  -> usePosts (状态与业务动作)
  -> PostsAPI (HTTP 调用封装)
  -> /api/posts* Route Handlers
```

关键文件：

- `lib/api/posts.ts`
- `lib/hooks/usePosts.ts`
- `components/blog/blog-page-content.tsx`

## PostsAPI 能力清单

### 文章查询

- `PostsAPI.getPosts(params)`
- `PostsAPI.getPostById(id)`
- `PostsAPI.getPostBySlug(slug)`

`getPosts` 支持的常用参数：

- `page`、`limit`
- `search`
- `status`
- `visibility`
- `includePasswordProtected`
- `authorId`
- `tagId`
- `sortBy`、`sortOrder`

### 写操作

- `PostsAPI.createPost(data)`
- `PostsAPI.updatePost(id, data)`
- `PostsAPI.deletePost(id)`
- `PostsAPI.updatePostStatus(id, status)`（兼容方法，当前代码库未提供独立 `/api/posts/{id}/status` 路由，建议改用 `updatePost` 传 `status` 或直接调用 `PATCH /api/posts/{id}`）

### 互动与统计

- `PostsAPI.incrementViewCount(id)`
- `PostsAPI.incrementLikeCount(id)`（历史兼容方法，实际命中点赞切换接口）
- `PostsAPI.getEngagementStates(ids)`
- `PostsAPI.toggleLike(id)`
- `PostsAPI.toggleFavorite(id)`

## usePosts 返回能力（当前实现）

### 状态

- `posts`
- `loading`
- `error`
- `pagination`
- `params`

### 数据与动作

- `fetchPosts`
- `getPost`
- `getPostBySlug`
- `createPost`
- `updatePost`
- `deletePost`
- `updatePostStatus`（同上，建议优先 `updatePost` 或 `PATCH /api/posts/{id}`）
- `incrementViewCount`
- `incrementLikeCount`
- `toggleLike`
- `toggleFavorite`

### 查询控制

- `searchPosts`
- `filterByTag`
- `filterByStatus`
- `goToPage`
- `changePageSize`
- `sortPosts`

### 工具

- `clearError`
- `resetParams`

## 最小使用示例

```typescript
import { usePosts } from "@/lib/hooks/usePosts";

export function ExampleList() {
  const { posts, loading, error, pagination, searchPosts, filterByTag, sortPosts, goToPage } = usePosts({
    initialParams: {
      status: "published",
      includePasswordProtected: true,
      limit: 6,
    },
  });

  // 例如：searchPosts("nextjs"), filterByTag(12), sortPosts("publishedAt", "desc"), goToPage(2)
  return null;
}
```

## 注意事项

- 写操作依赖 Bearer 登录态（`PostsAPI` 通过 `clientBearerHeaders()` 自动带 token）。
- 密码文章阅读前置校验不在 `usePosts` 内，而在页面中调用 `PATCH /api/posts/slug/{slug}` 完成。
- `getEngagementStates` 适合列表批量读取用户点赞/收藏状态，减少逐条请求。
- `incrementLikeCount` 会触发“点赞/取消点赞切换”，并非单纯数值递增；业务层应优先使用 `toggleLike`。

## 本地调试

```bash
pnpm install
pnpm dev
```
