---
name: api-contract-sync
description: 同步 Next.js Route Handlers 的接口契约与 API 文档元数据。用于用户提到 API、接口、route.ts、Route Handler、请求参数、响应结构、鉴权、app/api、接口文档、api-docs 时，且变更对象是 app/api/**/route.ts。
---

# API Contract Sync

## 适用场景

- 变更 `app/api/**/route.ts` 的对外行为。
- 新增或移除接口路径、HTTP 方法、鉴权方式、关键请求参数或返回字段。

## 不处理范围

- 不处理数据库表结构变更（交给 `db-schema-sync`）。
- 不处理通用功能说明文档沉淀（交给 `feature-doc-closure`）。
- 不处理提交信息生成（交给 `commit-message-angular-cn`）。

## 执行步骤

1. 确认接口行为变化点
   - 路径、方法、鉴权、请求参数、响应结构。
2. 更新接口实现附近注释
   - 在对应 `route.ts` 顶部或方法附近补充简明 JSDoc，描述行为与约束。
3. 更新内置 API 文档元数据
   - 修改 `lib/utils/api-docs-endpoint-meta.ts` 中相关分组说明、端点说明、鉴权提示。
4. 同步 Markdown 全量接口文档
   - 更新 `docs/接口文档.md` 的对应条目。
5. 追加接口变更流水
   - 在 `docs/接口变更文档.md` 顶部新增本次变更记录（日期、标题、影响面、文件路径）。
6. 若涉及 API 文案展示变更
   - 按需同步 `dictionaries/*` 的 `apiDocs` 相关键。

## 完成标准

- 接口实现、元数据、全量接口文档、接口变更流水四处一致。
- 未引入与本次接口改动无关的文档或代码修改。

## 最小使用示例

- 示例触发语句：`帮我给 app/api/tags 增加分页参数，并同步接口文档`
- 预期行为：仅更新接口实现与 API 文档相关文件，不触碰数据库结构文件。
