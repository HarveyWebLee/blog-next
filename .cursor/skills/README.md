# blog-next Skills 总览

本目录用于存放项目级 Skills，原则是职责单一、边界清晰、可组合，不做重复职责。

## 边界与优先级

- `api-contract-sync`：仅处理 API 契约与接口文档同步。
- `db-schema-sync`：仅处理 Drizzle schema、迁移与库表文档同步。
- `i18n-consistency-guard`：仅处理三语词典与语言路由一致性。
- `feature-doc-closure`：仅处理功能级文档沉淀、索引与统一变更记录。
- `security-env-boundary-check`：仅处理安全与环境变量边界审查。
- `precommit-quality-gate`：仅处理收尾质量检查与可提交结论。
- `commit-message-angular-cn`：仅处理提交信息生成规范。
- `release-readiness-check`：仅处理发版准备度与语义版本判断。

## 冲突仲裁规则

1. 同一任务触发多个 skill 时，按流程串行：实现同步类 -> 安全审查 -> 质量门禁 -> 提交信息 -> 发版检查。
2. 若发现职责重叠，以“更贴近文件变更对象”的 skill 为主：
   - 改 `app/api` 优先 `api-contract-sync`
   - 改 `lib/db/schema.ts` 优先 `db-schema-sync`
3. 任一 skill 不得覆盖其他 skill 的核心输出物。
4. 需要跨域协作时，只能“引用下一环节”而不是“代替执行”。

## 触发词速查表

- `api-contract-sync`：API、接口、`route.ts`、Route Handler、请求参数、响应结构、鉴权、`app/api`、接口文档、api-docs
- `db-schema-sync`：`schema.ts`、Drizzle、migration、`db:generate`、`db:migrate`、`db:push`、数据表、字段、索引
- `i18n-consistency-guard`：i18n、国际化、词典、`dictionaries`、`app/[lang]`、locale、翻译缺失、语言前缀
- `feature-doc-closure`：文档沉淀、方案记录、变更记录、文档索引、功能说明、复盘、写 docs
- `security-env-boundary-check`：JWT、token、密码、SMTP、env、`NEXT_PUBLIC`、权限校验、安全检查、敏感信息
- `precommit-quality-gate`：precommit、lint、format、质量检查、冒烟验证、能否提交、提交前检查
- `commit-message-angular-cn`：commit、提交信息、提交标题、Angular 规范、语义化提交、changelog
- `release-readiness-check`：发版、release、main 合并前检查、workflow、自动发布、版本升级级别

## 常见任务推荐组合

- 改接口并准备提交：`api-contract-sync` -> `security-env-boundary-check` -> `precommit-quality-gate` -> `commit-message-angular-cn`
- 改表结构并准备提交：`db-schema-sync` -> `security-env-boundary-check` -> `precommit-quality-gate` -> `commit-message-angular-cn`
- 纯前台多语言文案改动：`i18n-consistency-guard` -> `precommit-quality-gate` -> `commit-message-angular-cn`
- 合并前确认发版影响：`commit-message-angular-cn` -> `release-readiness-check`
