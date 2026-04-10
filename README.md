# 荒野博客 (Wilderness Blog)

> 在数字荒野中探索技术，在思考森林中寻找真理

基于 **Next.js 15** 的现代化多语言博客：文章与分类标签、JWT 认证、个人中心（含收藏等）、内置 API 文档站等。详细开发说明与专题文档见 **[docs/文档索引.md](./docs/文档索引.md)**。

## 功能特性（与当前实现一致）

### 多语言

- 中文（zh-CN，默认）、英文（en-US）、日文（ja-JP）
- 中间件为页面路径补充语言前缀；`dictionaries/*.json` + `getDictionary`
- API 路由路径为 `/api/*`，**不带** 语言前缀

### 用户认证

- JWT、`bcryptjs`；注册、登录、邮箱验证码、忘记/重置密码
- 角色：`admin` / `author` / `user`（具体接口内校验）

### 文章与编辑器

- 文章 CRUD、草稿/发布/归档、可见性、浏览计数
- 编辑端使用 **Toast UI Editor**（`components/blog/simple-editor.tsx`）

### 分类与标签

- 层级分类、多对多标签；前台与管理页面位于 `app/[lang]/categories`、`app/[lang]/tags` 等路径下

### 评论

- 数据库表 **`comments` 已定义**；统一的评论 REST API 与完整前台评论流 **仍在迭代中**（勿在文档中写成已全线贯通，除非代码已补齐）

### 个人中心

- 资料、文章、**收藏**（`/api/profile/favorites`）、通知、活动等（见 `docs/用户中心实现说明.md`）

### UI

- HeroUI、Tailwind CSS 4、明暗主题、`next-themes`

## 技术栈

| 类别 | 技术                                           |
| ---- | ---------------------------------------------- |
| 框架 | Next.js 15（App Router）、React 19、TypeScript |
| UI   | HeroUI、Tailwind 4、Framer Motion              |
| 数据 | MySQL 8+、Drizzle ORM                          |
| 认证 | JWT、bcryptjs（**非** NextAuth）               |
| 工具 | ESLint、Prettier、pnpm 9+                      |

## 项目结构（精简）

```
app/
  [lang]/          # 多语言页面
  api/             # Route Handlers
components/        # blog、layout、profile、ui...
lib/db/            # Drizzle schema、连接
lib/services/      # PostService 等
dictionaries/      # 界面文案
docs/              # 中文专题文档（入口：文档索引.md）
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+（见 `packageManager` 字段）
- MySQL 8+

### 安装

```bash
pnpm install
cp env.example .env.local
# 编辑 .env.local：至少填写 DB_* 与 JWT_SECRET
```

环境变量 **`以 env.example 为准`**（`DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`、`JWT_SECRET`、`NEXT_PUBLIC_APP_URL`、`SMTP_*` 等）。勿使用已过时的 `DATABASE_URL` / `NEXTAUTH_*` 示例。

### 数据库

```bash
pnpm db:generate    # 修改 schema 后
pnpm db:migrate     # 或开发阶段 pnpm db:push
pnpm db:seed        # 可选：测试数据
```

### 开发服务器

```bash
pnpm dev
```

浏览器访问：`http://localhost:3000`（根路径会按中间件跳到 `/zh-CN/...` 等）。

## 常用路径示例

- 首页：`/zh-CN`、`/en-US`、`/ja-JP`
- 文章管理：`/zh-CN/blog/manage`（其他语言替换前缀即可）
- API 文档页：`/zh-CN/api-docs`

## 常用命令

```bash
pnpm dev
pnpm build && pnpm start
pnpm lint && pnpm format:check

pnpm db:studio
pnpm db:backup
pnpm db:reset:dev          # 开发环境重置，见 docs/数据库重置与验证指南.md

pnpm test:api
pnpm test:db:connect
```

## API 入口（节选）

完整列表以 **`/{lang}/api-docs`** 扫描结果为准。

| 方法      | 路径                                        | 说明            |
| --------- | ------------------------------------------- | --------------- |
| POST      | `/api/auth/login`                           | 登录            |
| POST      | `/api/auth/register`                        | 注册            |
| POST      | `/api/auth/send-verification-code`          | 发送邮箱验证码  |
| POST      | `/api/auth/verify-code`                     | 校验验证码      |
| POST      | `/api/auth/forgot-password`                 | 忘记密码        |
| POST      | `/api/auth/reset-password`                  | 重置密码        |
| GET/POST… | `/api/posts`                                | 文章列表/创建等 |
| GET       | `/api/posts/[id]`、`/api/posts/slug/[slug]` | 文章详情        |
| GET/POST  | `/api/tags`、`/api/categories`              | 标签与分类      |

## 更多文档

- [docs/文档索引.md](./docs/文档索引.md)
- [docs/博客系统开发说明.md](./docs/博客系统开发说明.md)
- [docs/部署操作指南.md](./docs/部署操作指南.md)
- [scripts/数据库初始化脚本说明.md](./scripts/数据库初始化脚本说明.md)（`init-db.sql` 备选）

## 许可证

本项目采用 MIT 许可证 — 见仓库内 `LICENSE`（若存在）。

## 致谢

- [Next.js](https://nextjs.org/)、[HeroUI](https://heroui.com/)、[Tailwind CSS](https://tailwindcss.com/)、[Drizzle ORM](https://orm.drizzle.team/)
