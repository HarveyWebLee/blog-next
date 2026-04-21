# 标签 API 实现说明（按当前代码）

## 概述

当前标签能力由 `app/api/tags/route.ts` 与 `app/api/tags/[id]/route.ts` 提供，前端通过 `useTags` 在 `/{lang}/tags` 页面完成展示与管理。

## 关键约束（必须注意）

- 所有标签接口都要求 `Authorization: Bearer`。
- 标签数据按 `ownerId` 隔离：只能访问与操作当前登录用户的标签。
- 名称与 `slug` 的唯一性校验在“当前 owner 维度”内进行，而非全局唯一。

## API 行为

### `GET /api/tags`

- 支持分页、搜索、状态过滤与排序。
- 常用参数：`page`、`limit`、`search`、`isActive`、`sortBy`、`sortOrder`。
- 返回每个标签的 `postCount` 聚合值。

### `POST /api/tags`

- 必填：`name`、`slug`。
- 自动将 `ownerId` 写为当前登录用户。
- `name` 或 `slug` 冲突时返回 `409`。

### `GET /api/tags/{id}`

- 返回单个标签详情与文章引用计数（`postCount`）。

### `PUT /api/tags/{id}`

- 支持部分更新。
- 若更新 `name`/`slug`，会校验同 owner 下是否冲突（冲突返回 `409`）。

### `DELETE /api/tags/{id}`

- 若标签仍有关联文章，返回 `409`，不允许删除。
- 删除成功后返回成功响应并写入用户活动日志。

## 前端接入

### 标签页

- 页面：`app/[lang]/tags/page.tsx`
- 路径：`/{lang}/tags`

主要能力：

- 标签云与热门标签展示
- 搜索、防抖请求
- 状态筛选、排序、分页
- 新建/编辑/删除标签（登录态）
- 点击标签跳转 `/{lang}/blog?tagId={id}` 查看该标签文章

### Hook

- 文件：`lib/hooks/useTags.ts`
- 提供：`fetchTags`、`createTag`、`updateTag`、`deleteTag`、`refreshTags`
- 同步管理：`pagination`、`loading`、`error` 与查询条件状态

## 活动日志联动

标签成功创建/更新/删除后，后端会记录到 `user_activities`，对应动作：

- `tag_created`
- `tag_updated`
- `tag_deleted`

## 本地验证

```bash
pnpm install
pnpm dev
```

可直接访问：

- `http://localhost:3000/zh-CN/tags`
- `http://localhost:3000/en-US/tags`
- `http://localhost:3000/ja-JP/tags`

如需接口全量清单，请查看 `docs/接口文档.md`。
