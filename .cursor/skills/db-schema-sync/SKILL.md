---
name: db-schema-sync
description: 同步 Drizzle schema、迁移与数据库文档。用于用户提到 schema.ts、Drizzle、migration、db:generate、db:migrate、db:push、数据表、索引、字段变更时，且变更对象是 lib/db/schema.ts 或迁移文件。
---

# DB Schema Sync

## 适用场景

- 修改 `lib/db/schema.ts`。
- 新增或变更 `drizzle` 迁移文件。
- 需要执行 `pnpm db:generate`、`pnpm db:migrate`、`pnpm db:push`。

## 不处理范围

- 不处理接口契约与 API 文档（交给 `api-contract-sync`）。
- 不处理页面文案或 i18n 键一致性（交给 `i18n-consistency-guard`）。
- 不处理发布检查（交给 `release-readiness-check`）。

## 执行步骤

1. 识别结构变更
   - 表、字段、索引、约束、默认值、枚举等。
2. 执行数据库流程
   - 按团队流程执行 `pnpm db:generate` 与后续迁移命令。
3. 校验代码与迁移一致
   - 确认 `lib/db/schema.ts` 与迁移结果不冲突。
4. 更新数据库全量文档
   - 回写 `docs/数据库表记录文档.md`。
5. 追加数据表变更流水
   - 在 `docs/数据表变更文档.md` 顶部记录迁移文件、前后差异、兼容注意项。

## 完成标准

- schema、迁移、数据库文档与变更流水一致。
- 结构变更可追溯，且无仅改迁移不改 schema 的断裂状态。

## 最小使用示例

- 示例触发语句：`给 posts 表新增 status 字段并生成迁移，同时更新数据表文档`
- 预期行为：聚焦 schema 与迁移链路，不修改接口契约文档。
