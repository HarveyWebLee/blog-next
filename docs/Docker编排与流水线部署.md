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

**网络**：各服务位于 Compose 网络 **`blog-net`**。应用容器内 **`DB_HOST=mysql`**、**`REDIS_URL=redis://:密码@redis:6379`** 由 compose 覆盖，勿在模板里把应用指向 `localhost` 访问库或缓存。

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

## 3. 数据库迁移目录（关键）

`Dockerfile.migrate` 会 **`COPY drizzle ./drizzle`**，因此仓库必须存在并提交 **`drizzle/`** 迁移目录。

请按以下原则执行：

- **只在两种场景执行 `pnpm db:generate`**：
  1. 仓库首次没有 `drizzle/`；
  2. `lib/db/schema.ts` 发生变更，需要产出新迁移。
- **日常部署不需要每次 generate**：有迁移文件时直接 `db-migrate` 即可。
- 团队约定：**改 schema 必须同时提交 `drizzle/*.sql`**，否则 CI/目标机构建 `db-migrate` 会因缺少目录失败。

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

## 6. GitHub 自动化部署（main 推送即部署）

本项目已提供工作流 **`.github/workflows/deploy.yml`**：当代码推送到 **`main`** 时，GitHub Actions 通过 SSH 登录服务器并执行：

1. `git fetch/checkout/pull` 拉取最新 `main`
2. `docker compose up -d mysql redis`
3. `docker compose --profile migrate run --rm db-migrate`
4. `docker compose up -d --build blog-web`

为确保该流程稳定，需同时完成「服务器配置」与「GitHub 配置」两部分。

### 6.0 通信与权限模型（重点）

自动部署里有 **两条 SSH 通信链路**，二者不是同一把密钥：

1. **链路 A（GitHub Actions -> 服务器）**
   - 作用：让工作流能 SSH 登录你的服务器执行部署命令。
   - 使用密钥：本地生成的 `github_actions_deploy` 私钥（私钥存 GitHub Secret，公钥放服务器 `authorized_keys`）。
   - 相关配置：`SERVER_HOST` / `SERVER_PORT` / `SERVER_USER` / `SERVER_SSH_KEY`。

2. **链路 B（服务器 -> GitHub 仓库）**
   - 作用：让服务器执行 `git pull origin main` 时有权限访问仓库。
   - 使用密钥：服务器生成的 `github_deploy_key`（公钥加到仓库 Deploy keys）。
   - 相关配置：服务器 `~/.ssh/config`、`~/.ssh/known_hosts`、仓库 `Deploy keys`。

> 一句话判断故障归属：
>
> - 工作流连不上服务器：优先检查 **链路 A**。
> - 能连服务器但 `git pull` 失败：优先检查 **链路 B**。

### 6.1 服务器侧必须配置（111.229.191.217）

#### A. 安装基础软件

- 安装并可用：`git`、`docker`、`docker compose`。
- 为部署用户加入 docker 组（示例用户 `deployer`）：`sudo usermod -aG docker deployer`。

#### A-1. 部署用户与最小权限建议（必须）

- 使用专用用户（如 `deployer`），不要直接使用 `root` 作为 `SERVER_USER`。
- 部署目录归属该用户，避免 Git 所有权与写权限冲突：
  - `sudo chown -R deployer:deployer /opt/blog-next`
- `deployer` 仅加入 `docker` 组（用于执行 `docker compose`），避免授予不必要 sudo 全权限。
- 若安全策略允许，建议禁用 root SSH 登录，仅允许密钥登录。

#### B. 准备部署目录与环境文件

```bash
sudo mkdir -p /opt/blog-next
sudo chown -R deployer:deployer /opt/blog-next
```

首次拉取代码到 `/opt/blog-next` 后，创建部署环境文件：

```bash
cd /opt/blog-next
cp deploy/env.docker.example deploy/.env.docker
# 按生产值修改 deploy/.env.docker（数据库/JWT/邮件/REDIS_PASSWORD 等）
```

> `deploy/.env.docker` 含敏感信息，不可提交到仓库。

#### C. 配置「服务器 -> GitHub」拉代码权限（关键）

自动部署时，`git pull origin main` 是在服务器上执行，因此服务器必须具备访问仓库权限。

在服务器（`deployer` 用户）执行：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "server-deploy-key" -f ~/.ssh/github_deploy_key
ssh-keyscan github.com >> ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
cat > ~/.ssh/config <<'CFG'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy_key
  IdentitiesOnly yes
CFG
chmod 600 ~/.ssh/config
```

然后复制公钥：`cat ~/.ssh/github_deploy_key.pub`，去 GitHub 仓库添加为 Deploy Key（见 6.2-D）。

> 权限原则：
>
> - `~/.ssh` 目录 `700`
> - 私钥文件（`github_deploy_key`）`600`
> - `~/.ssh/config` `600`
> - `~/.ssh/known_hosts` `644`

#### D. 确认仓库远端地址为 SSH

```bash
cd /opt/blog-next
git remote -v
```

应为 `git@github.com:<owner>/<repo>.git`。若不是，改为：

```bash
git remote set-url origin git@github.com:<owner>/<repo>.git
```

#### E. 验证服务器可访问 GitHub

```bash
ssh -T git@github.com
```

出现认证成功提示后，`git pull` 才能在工作流中稳定执行。

### 6.2 GitHub 侧必须配置

#### A. Repository secrets（Actions）

仓库路径：`Settings -> Secrets and variables -> Actions -> Repository secrets`

至少创建以下 4 个：

- `SERVER_HOST`：`111.229.191.217`
- `SERVER_PORT`：`22`（若改端口填实际值）
- `SERVER_USER`：服务器部署用户（如 `deployer`）
- `SERVER_SSH_KEY`：**本地生成的私钥全文**（用于 GitHub Actions 登录服务器）

> 这里使用的是 **Repository secrets**，不是 Environment secrets。

> `SERVER_USER` 必须与服务器目录 owner 一致（推荐 `deployer`），否则容易出现 `dubious ownership`、无写权限、Docker 执行权限不足等问题。

#### B. 本地生成「GitHub Actions -> 服务器」SSH 密钥

Windows PowerShell 示例：

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\.ssh"
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$HOME\.ssh\github_actions_deploy"
```

- 私钥内容（填 `SERVER_SSH_KEY`）：
  `Get-Content "$HOME\.ssh\github_actions_deploy" -Raw`
- 公钥内容（加入服务器 `~/.ssh/authorized_keys`）：
  `Get-Content "$HOME\.ssh\github_actions_deploy.pub"`

#### C. 将 Actions 公钥加入服务器

把上一步生成的 `github_actions_deploy.pub` 追加到服务器部署用户：

- `/home/deployer/.ssh/authorized_keys`

并确保权限：

```bash
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
chown -R deployer:deployer /home/deployer/.ssh
```

#### D. 添加 Deploy Key（服务器拉仓库所需）

仓库路径：`Settings -> Deploy keys -> Add deploy key`

- Title：自定义（如 `server-deploy-key`）
- Key：服务器上的 `~/.ssh/github_deploy_key.pub`
- 权限：建议勾选 **Allow write access**（涉及 release/tag 场景更稳妥）

### 6.3 首次联调建议

1. 先在服务器手工跑一遍部署命令（见第 4 节），确认环境无误。
2. 推送一次 `main` 小改动，触发 `Actions -> Deploy`。
3. 若失败，优先查看 deploy job 的 `Setup SSH` 与 `Deploy on server` 两步日志。

### 6.4 通信与权限快速验收清单（建议逐项打勾）

- [ ] `SERVER_USER` 为专用部署用户（如 `deployer`），且在服务器存在。
- [ ] `/opt/blog-next` 归属 `SERVER_USER`，并可读写。
- [ ] `SERVER_USER` 已加入 `docker` 组，可直接执行 `docker compose`。
- [ ] GitHub `Repository secrets` 中 4 个键均已配置且名称完全一致。
- [ ] 服务器 `~/.ssh/known_hosts` 已含 `github.com` 指纹。
- [ ] 服务器 `git remote -v` 使用 `git@github.com:...` SSH 地址。
- [ ] 仓库 `Deploy keys` 已添加服务器公钥，且权限符合仓库策略。
- [ ] 服务器执行 `ssh -T git@github.com` 能通过认证。
- [ ] 本地用 Actions 私钥可登录 `SERVER_USER@SERVER_HOST`。

数据库备份、回滚见 [数据库重置与验证指南.md](./数据库重置与验证指南.md)。

## 7. 安全与生产加固

- **不暴露** MySQL/Redis 到公网时：去掉 **`mysql` / `redis` 的 `ports`** 映射，仅保留 **`blog-web`** 的宿主机端口（默认 **13001**）或由反向代理暴露 **443**。
- **Redis 密码**：在 `redis` 服务使用 `requirepass`，并把 **`REDIS_URL`** 改为 `redis://:密码@redis:6379`。
- **HTTPS**：在应用前放置 Nginx / Caddy / 云负载均衡。

## 8. 本地开发构建说明

- **普通** `pnpm run build`：**不**设置 `NEXT_STANDALONE`，可在 Windows 上完成构建。
- **验证 standalone**（Linux/WSL/容器）：`NEXT_STANDALONE=true pnpm run build`。

## 9. 常见问题

| 现象                                   | 处理                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db-migrate` 报找不到迁移              | 若日志含 `COPY drizzle ./drizzle ... "/drizzle": not found`：先 `pnpm db:generate` 生成并提交 `drizzle/*.sql`，再重跑 `docker compose ... --profile migrate run --rm db-migrate`   |
| 应用连不上数据库                       | 检查 `depends_on` 与 MySQL **healthy**；确认 `DB_*` 与 MySQL 一致                                                                                                                  |
| Compose 提示缺少 `MYSQL_ROOT_PASSWORD` | 使用 `docker compose --env-file deploy/.env.docker`，且文件内已赋值                                                                                                                |
| 宿主机连 MySQL                         | `127.0.0.1:13307`（默认），用户/库见 `.env.docker`                                                                                                                                 |
| `fatal: detected dubious ownership`    | 服务器仓库目录 owner 与部署用户不一致。执行 `sudo chown -R <SERVER_USER>:<SERVER_USER> /opt/blog-next`，并在工作流中保留 `git config --global --add safe.directory /opt/blog-next` |
| `Host key verification failed`         | 服务器无法校验 `github.com` 主机指纹。执行 `ssh-keyscan github.com >> ~/.ssh/known_hosts`，并确认服务器已配置可访问仓库的 SSH key（Deploy Key）                                    |

---

**维护**：变更 Compose 端口或服务时，同步更新 **`deploy/env.docker.example`**、**`docker-compose.yml` 默认值** 与本篇。
