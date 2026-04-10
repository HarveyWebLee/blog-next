# Docker Compose 编排与流水线部署（唯一部署说明）

本文是「荒野博客」**唯一**的部署与编排说明：使用仓库根目录 **`docker-compose.yml`** 启动 **MySQL 8**、**Redis 7** 与 **Next.js 应用**，配合 **`deploy/env.docker.example`**（复制为 **`deploy/.env.docker`**）、**`Dockerfile`** / **`Dockerfile.migrate`**。

本地纯 **`pnpm dev`** 开发仍可用根目录 **`env.example`**；**上线路径一律以本文与 Compose 为准**。

## 0. 默认宿主机端口（可按需改 `.env.docker`）

| 服务     | 宿主机端口 | 容器内端口 | 环境变量（模板）     |
| -------- | ---------- | ---------- | -------------------- |
| MySQL    | **13307**  | 3306       | `MYSQL_PUBLISH_PORT` |
| Redis    | **16380**  | 6379       | `REDIS_PUBLISH_PORT` |
| blog-web | **13001**  | 3000       | `APP_PORT`           |

应用在容器内始终监听 **3000**；浏览器访问 **`http://localhost:13001`**（前台路由带语言前缀，如 `/zh-CN`）。  
**`NEXT_PUBLIC_APP_URL`**、**`CORS_ORIGIN`** 在模板中默认与 **13001** 对齐，部署到域名时请改为实际地址。

## 1. 架构与文件清单

| 路径                        | 说明                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `docker-compose.yml`        | 服务：`mysql`、`redis`、`blog-web`；一次性迁移：`db-migrate`（profile `migrate`）                            |
| `Dockerfile`                | 多阶段构建生产镜像；构建阶段设置 **`NEXT_STANDALONE=true`** 生成 Next standalone                             |
| `Dockerfile.migrate`        | 仅含 Drizzle 迁移依赖，用于 **`db-migrate`**                                                                 |
| `deploy/env.docker.example` | Compose 与应用的**环境变量模板**（复制为 `deploy/.env.docker`）                                              |
| `.dockerignore`             | 缩小构建上下文、避免把本地密钥打进镜像                                                                       |
| `next.config.ts`            | 仅当 **`NEXT_STANDALONE=true`** 时启用 `output: "standalone"`；并为 `localhost:13001` 配置 `images` 远程模式 |

**网络**：各服务位于 Compose 网络 **`blog-net`**。应用容器内 **`DB_HOST=mysql`**、**`REDIS_URL=redis://redis:6379`** 由 compose 覆盖，勿在模板里把应用指向 `localhost` 访问库或缓存。

**Redis**：业务可渐进接入；`env.example` 中已有 **`REDIS_URL`**，容器内已注入。

## 2. 准备配置

```bash
cp deploy/env.docker.example deploy/.env.docker
```

用编辑器修改 **`deploy/.env.docker`**：

- **`MYSQL_ROOT_PASSWORD`**、**`JWT_SECRET`**、**`JWT_REFRESH_SECRET`**：生产必须改为强随机值。
- **`NEXT_PUBLIC_APP_URL`**、**`CORS_ORIGIN`**：与对外访问 URL 一致（默认本地 **13001**）。
- **`DB_USER`** / **`DB_PASSWORD`** / **`DB_NAME`**：需与 MySQL 初始化一致。

**勿将 `deploy/.env.docker` 提交到 Git**（已在 `.gitignore` 中）。

## 3. 数据库迁移目录

`Dockerfile.migrate` 会 **`COPY drizzle ./drizzle`**。请保证仓库中存在 **`drizzle/` 下迁移 SQL**（开发机可执行 `pnpm db:generate`）。

## 4. 启动顺序

在项目根目录执行：

```bash
# 1）基础设施
docker compose --env-file deploy/.env.docker up -d mysql redis

# 2）等待 mysql healthy 后执行迁移（一次性）
docker compose --env-file deploy/.env.docker --profile migrate run --rm db-migrate

# 3）构建并启动应用
docker compose --env-file deploy/.env.docker up -d --build blog-web
```

访问：**`http://localhost:13001`**（若修改了 `APP_PORT`，以 `.env.docker` 为准）。

## 5. npm 脚本

- **`pnpm run docker:up:deps`** — 仅启动 MySQL + Redis
- **`pnpm run docker:migrate`** — 运行 `db-migrate`
- **`pnpm run docker:up:app`** — 构建并启动 `blog-web`
- **`pnpm run docker:down`** — `compose down`

均假定已存在 **`deploy/.env.docker`**。

## 6. 流水线（CI/CD）建议

1. **构建镜像**：`docker build -t your-registry/blog-next:${TAG} .`（Linux Runner，`NEXT_STANDALONE` 在 Dockerfile 内已设）。
2. **推送镜像**。
3. **目标机**：准备 **`deploy/.env.docker`** → `docker compose up -d mysql redis` → `migrate` → 更新 **`blog-web`** 镜像并 `up`。

数据库备份、回滚见 [数据库重置与验证指南.md](./数据库重置与验证指南.md)。

## 7. 安全与生产加固

- **不暴露** MySQL/Redis 到公网时：去掉 **`mysql` / `redis` 的 `ports`** 映射，仅保留 **`blog-web`** 的宿主机端口（默认 **13001**）或由反向代理暴露 **443**。
- **Redis 密码**：在 `redis` 服务使用 `requirepass`，并把 **`REDIS_URL`** 改为 `redis://:密码@redis:6379`。
- **HTTPS**：在应用前放置 Nginx / Caddy / 云负载均衡。

## 8. 本地开发构建说明

- **普通** `pnpm run build`：**不**设置 `NEXT_STANDALONE`，可在 Windows 上完成构建。
- **验证 standalone**（Linux/WSL/容器）：`NEXT_STANDALONE=true pnpm run build`。

## 9. 常见问题

| 现象                                   | 处理                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `db-migrate` 报找不到迁移              | 确认 `drizzle/` 已提交或已挂载；本地 `pnpm db:generate` / `pnpm db:migrate` 验证 |
| 应用连不上数据库                       | 检查 `depends_on` 与 MySQL **healthy**；确认 `DB_*` 与 MySQL 一致                |
| Compose 提示缺少 `MYSQL_ROOT_PASSWORD` | 使用 `docker compose --env-file deploy/.env.docker`，且文件内已赋值              |
| 宿主机连 MySQL                         | `127.0.0.1:13307`（默认），用户/库见 `.env.docker`                               |

---

**维护**：变更 Compose 端口或服务时，同步更新 **`deploy/env.docker.example`**、**`docker-compose.yml` 默认值** 与本篇。
