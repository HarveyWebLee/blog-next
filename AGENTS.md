# AGENTS.md

本文件为在本仓库工作的 AI 助手/自动化 Agent 提供长期、非显而易见的操作指引。仓库编码规范、i18n、接口/数据库文档同步等约定见 `.cursor/rules/` 与 `.cursorrules`；开发文档入口见 `docs/文档索引.md`。

## Cursor Cloud specific instructions

面向「已执行过启动更新脚本（`pnpm install`）」的后续云端 Agent。此处只记录非显而易见的启动/运行注意事项，常规命令请参考 `README.md` 与 `package.json` scripts。

### 服务概览

- **Next.js 应用**（前台页面 + `app/api/*` 路由处理器，同一进程）：`pnpm dev`（Turbopack，默认 http://localhost:3000）。根路径会 307 跳转到 `/zh-CN`。
- **MySQL 8**（必需）：主数据存储，Drizzle ORM。
- 可选服务（本环境未配置，均有降级）：Redis（分布式限流，未配置回退数据库限流）、MinIO（特色图上传，未配置时仍可手动填图片 URL）、SMTP（邮件验证码/找回密码）。核心开发无需它们。

### 启动前置（本 VM 快照已安装 MySQL，但服务不会随开机自动运行）

1. 启动 MySQL：`sudo service mysql start`（数据库 `blog_system` 与示例数据已在快照磁盘中持久化）。
   - root 密码为 `blognextpass`。校验：`mysql -uroot -pblognextpass -h 127.0.0.1 blog_system -e "SHOW TABLES;"`。
2. `.env.local` 已存在（被 git 忽略、随快照保留），`DB_HOST=127.0.0.1`（用 TCP 而非 socket；本机 mysql CLI 的 unix socket 对普通用户权限不足，务必用 `-h 127.0.0.1`）。
3. 启动应用：`pnpm dev`。

### 数据库迁移注意

- 迁移文件已提交在 `drizzle/`。全新/空库用 `pnpm db:migrate`（drizzle-kit migrate，非交互）应用。
- **不要用 `pnpm db:push`**：它需要交互式 TTY 确认，在非交互 shell 会报 “Interactive prompts require a TTY terminal” 而失败。改用 `db:generate` + `db:migrate`。

### tsx 脚本会「跑完不退出」（重要陷阱）

`scripts/*.ts`（如 `pnpm db:seed`、`pnpm test:api`）使用 `lib/db/config.ts` 的连接池，脚本结束后**不主动关闭连接池**，进程会挂起：

- 现象一：脚本实际已完成，但因进程不退出，`| tail` 之类管道拿不到 EOF，看起来「无输出卡住」。
- 现象二：`pnpm test:api` 会打印「🎉 所有测试完成！/ 数据库连接已关闭」后仍不退出。
- 建议：用 `timeout 90 pnpm test:api` 之类包裹运行；被 timeout 杀掉时 pnpm 会报 `ELIFECYCLE Command failed`，属预期，**不代表测试失败**——以脚本自身打印的成功日志为准。校验数据可直接查 MySQL。

### UI 注册流程依赖 SMTP（本环境不可用）

前台注册页 `app/[lang]/auth/register/page.tsx` 硬编码 `useEmailVerification: true`，提交按钮要求 6 位邮箱验证码；本环境未配置 SMTP，故**无法通过 UI 完成注册**。若需测试账号：

- 后端 API `POST /api/auth/register` 支持 `useEmailVerification:false`，可用 curl 直接注册（开发环境 `PASSWORD_TRANSPORT_REQUIRED` 默认 false，可直接传明文 `password`）。
- 已存在可用账号：`demouser` / `Test1234!`（普通用户，可登录、写文章）。

### 校验命令

- Lint：`pnpm lint`（当前 0 error，4 个既有 warning）。
- 类型检查：`pnpm typecheck`（等价 `rm -rf .next && tsc --noEmit`）。注意它会删除 `.next`，会打断正在运行的 `pnpm dev`；若 dev 在跑，可直接 `npx tsc --noEmit` 避免删缓存。
- 该仓库无单元测试框架，「测试」即 `scripts/` 下的 tsx 冒烟脚本 + lint/typecheck。
