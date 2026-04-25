# Docker Compose 编排与流水线部署（唯一部署说明）

本文是「荒野博客」**唯一**的部署与编排说明：使用仓库根目录 **`docker-compose.yml`** 启动 **MySQL 8**、**Redis 7**、**MinIO**、**Next.js 应用**，以及（可选）通过 **`--profile edge`** 启用的 **`blog-edge`**（**HTTPS / Let’s Encrypt** 对外入口），配合 **`deploy/env.docker.example`**（复制为 **`deploy/.env.docker`**）、**`deploy/secrets/edge.example/`**（复制为 **`deploy/secrets/edge/`** 并配置 **`EDGE_SECRETS_DIR`**）、**`Dockerfile`** / **`Dockerfile.migrate`** / **`Dockerfile.edge`**。

本地纯 **`pnpm dev`** 开发仍可用根目录 **`env.example`**；**上线路径一律以本文与 Compose 为准**。

> **编排说明（`edge`）**  
> 对外入口服务名为 **`blog-edge`**（`container_name: blog-next-edge`），与 **`mysql` / `redis` / `minio` / `blog-web`** 同属 **`blog-net`**。Secret 单行文件默认读取 **`EDGE_SECRETS_DIR`**（未设置时回退到仓库内 **`deploy/secrets/edge.example/`**，仅便于本地校验；**生产请使用 `deploy/secrets/edge/` 并勿提交**）。历史目录 **`domain/`** 为旧版独立 Compose 参考，**以根 `docker-compose.yml` 为准**。

## 0. 默认宿主机端口（可按需改 `.env.docker`）

| 服务                                  | 宿主机端口                                               | 容器内端口 | 环境变量（模板）             |
| ------------------------------------- | -------------------------------------------------------- | ---------- | ---------------------------- |
| MySQL                                 | **13307**                                                | 3306       | `MYSQL_PUBLISH_PORT`         |
| Redis                                 | **16380**                                                | 6379       | `REDIS_PUBLISH_PORT`         |
| MinIO API                             | **19000**                                                | 9000       | `MINIO_API_PUBLISH_PORT`     |
| MinIO 控制台                          | **19001**                                                | 9001       | `MINIO_CONSOLE_PUBLISH_PORT` |
| blog-web                              | **13001**                                                | 3000       | `APP_PORT`                   |
| **blog-edge**（**`--profile edge`**） | **80** / **443**（`EDGE_HTTP_PORT` / `EDGE_HTTPS_PORT`） | 80 / 443   | 与 `APP_PORT` 独立           |

应用在容器内始终监听 **3000**；本地无网关时浏览器访问 **`http://localhost:13001`**（前台路由带语言前缀，如 `/zh-CN`）。  
**`NEXT_PUBLIC_APP_URL`**、**`CORS_ORIGIN`** 在模板中默认与 **13001** 对齐；**生产启用 `edge` 且走域名 HTTPS 时**，须改为 **`https://你的域名`**（与浏览器地址栏一致，见 **§7.7**）。

**生产建议**：公网仅暴露 **80 / 443**（**`blog-edge`**）；**`blog-web` 的 `APP_PORT`** 可不映射到公网，由 **`blog-edge`** 在 **`blog-net`** 内反代至 **`http://blog-next-app:3000`**（与 `blog-web` 的 **`container_name`** 一致，见 **`deploy/secrets/edge.example/app_upstream`**）。

## 1. 架构与文件清单

| 路径                               | 说明                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`               | 服务：`mysql`、`redis`、`minio`、`blog-web`、**`blog-edge`**（**profile `edge`**）；迁移：`db-migrate`（**profile `migrate`**）；MinIO 建桶：`minio-init`（**profile `minio-init`**） |
| `Dockerfile`                       | 多阶段构建生产镜像；构建阶段设置 **`NEXT_STANDALONE=true`** 生成 Next standalone；**敏感信息不得写入**本文件或构建参数默认值                                                          |
| `Dockerfile.migrate`               | 仅含 Drizzle 迁移依赖，用于 **`db-migrate`**                                                                                                                                          |
| **`Dockerfile.edge`**              | **Nginx + certbot + 脚本** 入口镜像；**仅**复制模板与脚本；域名/邮箱等来自 **Compose `secrets`（`EDGE_SECRETS_DIR` 下文件）**                                                         |
| `deploy/env.docker.example`        | Compose 与应用的**环境变量模板**（复制为 `deploy/.env.docker`）；含 **`EDGE_SECRETS_DIR`**、**`EDGE_HTTP_PORT`** / **`EDGE_HTTPS_PORT`**（见文件内注释）                              |
| **`deploy/secrets/edge.example/`** | **`blog-edge`** 用 **单行文件** 模板；生产复制为 **`deploy/secrets/edge/`** 并在 **`deploy/.env.docker`** 设 **`EDGE_SECRETS_DIR=./deploy/secrets/edge`**（目录已 **`.gitignore`**）  |
| `.dockerignore`                    | 缩小构建上下文；**须排除** `deploy/.env.docker`、`deploy/secrets/edge/` 等含真实密钥的路径，避免打入镜像层                                                                            |
| `next.config.ts`                   | 仅当 **`NEXT_STANDALONE=true`** 时启用 `output: "standalone"`；并为 `localhost:13001` 配置 `images` 远程模式                                                                          |

**网络**：各服务位于 Compose 网络 **`blog-net`**。应用容器内 **`DB_HOST=mysql`**、**`REDIS_URL=redis://:密码@redis:6379`** 由 compose 覆盖，勿在模板里把应用指向 `localhost` 访问库或缓存。

### Redis 地址如何区分（重点）

- 根因：`REDIS_URL` 的主机名/端口取决于 **Next.js 进程运行位置**（宿主机还是容器内）。
- 本地开发（Next 在宿主机 `pnpm dev`，Redis 在 Docker）：使用 **`127.0.0.1:16380`**（宿主机映射端口）。
- 生产/容器化运行（Next 与 Redis 都在 Compose 网络）：使用 **`redis:6379`**（容器服务名 + 容器端口）。
- 避免混写：`redis:16380` 通常是错误组合（服务名来自容器网络，16380 来自宿主机映射）。

推荐配置：

- `.env.local`（本地开发）：
  - `REDIS_URL=redis://:密码@127.0.0.1:16380`
- `deploy/.env.docker`（容器内运行）：
  - `REDIS_URL=redis://:密码@redis:6379`

**Redis**：业务可渐进接入；本地根目录 **`env.example`** 仅列当前 Next 代码实际读取的键，**`REDIS_URL`** 等在 **`deploy/env.docker.example`** 与容器 **`blog-web`** 环境注入。

## 2. 准备配置

```bash
cp deploy/env.docker.example deploy/.env.docker
```

用编辑器修改 **`deploy/.env.docker`**：

- **`MYSQL_ROOT_PASSWORD`**、**`JWT_SECRET`**、**`JWT_REFRESH_SECRET`**：生产必须改为强随机值。
- **`NEXT_PUBLIC_APP_URL`**、**`CORS_ORIGIN`**：与对外访问 URL 一致（默认本地 **13001**）。
- **`DB_USER`** / **`DB_PASSWORD`** / **`DB_NAME`**：需与 MySQL 初始化一致。
- **`MINIO_ROOT_USER`** / **`MINIO_ROOT_PASSWORD`** / **`MINIO_BUCKET`**：MinIO 必填；合并本仓库 MinIO 相关改动后，若服务器上已有旧版 `.env.docker`，需**手工补全**上述键，否则 `compose up` 会报错。
- 启用 **`blog-edge`** 时：在 **`deploy/.env.docker`** 设置 **`EDGE_SECRETS_DIR=./deploy/secrets/edge`**，并自 **`deploy/secrets/edge.example/`** 复制出 **`deploy/secrets/edge/`** 后填入真实域名与邮箱（见 **§9.1b**）。

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
# 1）基础设施（含 MinIO；对象数据在 **`MINIO_HOST_DATA_DIR`** 绑定目录，默认 **`./data/minio`**）
docker compose --env-file deploy/.env.docker up -d mysql redis minio

# 1b）创建默认公开读 bucket（幂等，可每次部署执行）
docker compose --env-file deploy/.env.docker --profile minio-init run --rm minio-init

# 2）等待 mysql healthy 后执行迁移（一次性；**必须 --build**，否则会沿用旧镜像里的 drizzle/）
docker compose --env-file deploy/.env.docker --profile migrate run --rm --build db-migrate

# 3）构建并启动应用
docker compose --env-file deploy/.env.docker up -d --build blog-web

# 4）生产公网 HTTPS 入口（可选；需已准备 deploy/secrets/edge 与 EDGE_SECRETS_DIR）
docker compose --env-file deploy/.env.docker --profile edge up -d --build blog-edge
```

访问：**`http://localhost:13001`**（若修改了 `APP_PORT`，以 `.env.docker` 为准）。启用 **`edge`** 且 DNS 指向本机后，对外访问以 **`https://你的域名`** 为准。

## 5. npm 脚本

- **`pnpm run docker:up:deps`** — 启动 MySQL + Redis + MinIO
- **`pnpm run docker:minio:init`** — 运行 `minio-init`（创建 `MINIO_BUCKET` 并设匿名下载策略，幂等）
- **`pnpm run docker:migrate`** — 运行 `db-migrate`（脚本内含 `--build`，确保迁移镜像与最新 `drizzle/` 对齐）
- **`pnpm run docker:up:app`** — 构建并启动 `blog-web`
- **`pnpm run docker:up:edge`** — 构建并启动 **`blog-edge`**（`--profile edge`）
- **`pnpm run docker:down`** — `compose down`

均假定已存在 **`deploy/.env.docker`**。

## 6. GitHub 自动化部署（main 推送即部署）

本项目已提供工作流 **`.github/workflows/deploy.yml`**：当代码推送到 **`main`** 时，GitHub Actions 通过 SSH 登录服务器并执行：

1. `git fetch/checkout/pull` 拉取最新 `main`
2. `docker compose up -d mysql redis minio`
3. `docker compose --profile minio-init run --rm minio-init`（幂等；与本地「1b」一致）
4. **数据库迁移（两步）**：先 `docker compose --profile migrate build db-migrate`（**`pnpm install`** 在此阶段），再 `docker compose --profile migrate run --rm -T --no-deps db-migrate`（仅执行 **`drizzle-kit migrate`**；**不再** `--build`，避免重复构建）
5. `docker compose up -d --build blog-web`
6. **（可选）** 若服务器存在 **`deploy/secrets/edge/domains`** 与 **`deploy/secrets/edge/certbot_email`**：导出 **`EDGE_SECRETS_DIR=$APP_DIR/deploy/secrets/edge`** 并执行 **`docker compose --profile edge up -d --build blog-edge`**（与 **`.github/workflows/deploy.yml`** 中 **step3b** 一致）；否则跳过 **`blog-edge`**。

**说明**：工作流在远端设置 **`DOCKER_BUILDKIT=1`** / **`COMPOSE_DOCKER_CLI_BUILD=1`**，使 **`Dockerfile.migrate`** 的 pnpm store **缓存挂载**生效。对 **步骤 4 的 `build`** 使用 **`timeout`（默认 3600 秒）**、对 **`run`** 使用 **600 秒**。若 **step2a** 报 **124**，多为依赖安装过慢；若 **step2b** 报 **124**，多为连库或迁移挂起。可调大 **`.github/workflows/deploy.yml`** 中的 **`BUILD_DB_MIGRATE_TIMEOUT_SEC`** / **`MIGRATE_RUN_TIMEOUT_SEC`**。

为确保该流程稳定，需同时完成「服务器配置」与「GitHub 配置」两部分。

### 6.0 MinIO 与「每次推 main 会不会把对象存储清空？」

- **GitHub Actions 不在 Runner 里长期跑 MinIO**：工作流只是 **SSH 到你的服务器**，在 **`/opt/blog-next`** 执行与本机相同的 `docker compose` 命令；MinIO 与 MySQL 一样跑在**你的机器**上。
- **每次部署会执行 `up -d minio`**：若 Compose 未改镜像/配置，Docker 往往只是保持容器运行或**原地重建容器**；**二进制对象在 `MINIO_HOST_DATA_DIR` 指向的宿主机目录**（默认仓库下 **`data/minio`**），**不会因为代码推送而自动清空**。
- **`minio-init` 每次都会跑**：只做「建 bucket（已存在则跳过）+ 匿名下载策略」，**幂等**，不删除已有对象。
- **会丢数据的典型操作**：删除/清空宿主机上该数据目录、换服务器未拷贝该目录、误改 `MINIO_HOST_DATA_DIR` 指到新空路径等——与「推 main」无必然关系。
- **曾使用旧版命名卷 `minio_data` 的部署**：合并本变更后需将对象迁到绑定目录，或自行用 `docker run --rm -v minio_data:/from -v "$PWD/data/minio:/to" ...` 类方式拷贝（按实际卷名调整）。

生产若**不暴露** MinIO 到公网：可去掉 `minio` 的 `ports` 映射，仅让 `blog-net` 内应用通过 `http://minio:9000` 访问（见第 7 节思路）。

### 6.1 通信与权限模型（重点）

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

### 6.2 服务器侧必须配置（111.229.191.217）

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

然后复制公钥：`cat ~/.ssh/github_deploy_key.pub`，去 GitHub 仓库添加为 Deploy Key（见 6.3-D）。

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

### 6.3 GitHub 侧必须配置

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

mac 示例

```
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$HOME/.ssh/github_actions_deploy"
# or

ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
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

### 6.4 首次联调建议

1. 先在服务器手工跑一遍部署命令（见第 4 节），确认环境无误。
2. 推送一次 `main` 小改动，触发 `Actions -> Deploy`。
3. 若失败，优先查看 deploy job 的 `Setup SSH` 与 `Deploy on server` 两步日志。

### 6.5 通信与权限快速验收清单（建议逐项打勾）

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

### 7.1 数据层与中间件暴露面

- **不暴露** MySQL/Redis/MinIO 到公网时：去掉 **`mysql` / `redis` / `minio` 的 `ports`** 映射；应用在 **`blog-net`** 内仍可用 **`http://minio:9000`** 访问对象存储 API。
- **`blog-web`**：生产可**不将 `APP_PORT` 暴露到公网**，仅由 **`blog-edge`** 在同一 Docker 网络内反代 **`http://blog-next-app:3000`**；本地或排障仍可使用 **13001**。
- **Redis 密码**：在 `redis` 服务使用 `requirepass`，并把 **`REDIS_URL`** 改为 `redis://:密码@redis:6379`。

### 7.2 HTTPS：单 Compose 多 Profile（`edge` / `blog-edge`）

- **唯一编排文件**：根目录 **`docker-compose.yml`**（已含 **`name: blog-next`**），**`blog-edge`** 与 **`blog-web`** 共用 **`blog-net`**，避免「主栈 + 独立 `domain` compose」双份网络名、启动顺序问题。
- **DNS**：你已配置 A/AAAA 指向服务器；**80 / 443** 须可被 Let’s Encrypt **HTTP-01** 访问，且不与宿主机其他占用 **80/443** 的进程冲突。
- **行为**：首次以 Bootstrap **HTTP** 起服 → ACME webroot 签发 → **`tls_mode=auto`** 时切换 **HTTPS** 并重载 Nginx → 周期检查续期（推荐 **`official_30d`**）；**首次签发失败时仍保持 HTTP 反代**（见 **§7.8**）。

### 7.3 敏感信息管理原则（强制）

| 约束                               | 说明                                                                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dockerfile / `Dockerfile.edge`** | **不得**写入真实域名、邮箱、数据库密码、JWT、私钥等；仅通用依赖与**非密钥**模板/脚本。                                                                                                                                                                              |
| **`docker-compose.yml`**           | **不得**用 `environment:` 明文写上述敏感值；Compose 插值用的非敏感端口等可保留；密钥类用 **`secrets: file:`** 或 **`env_file`** 指向**宿主机路径**，且该路径文件**不入 Git**。                                                                                      |
| **应用栈**                         | 继续使用 **`deploy/.env.docker`**（由 **`deploy/env.docker.example`** 复制），已在 **`.gitignore`**。                                                                                                                                                               |
| **入口栈（`blog-edge`）**          | 使用**与 `blog-web` 分离**的一组文件，推荐 **`deploy/secrets/edge/`**（每键一个文件、单行值）；路径由 **`EDGE_SECRETS_DIR`** 指定（默认 **`./deploy/secrets/edge.example`** 便于本地校验）。**真实目录 `deploy/secrets/edge/`** 已在 **`.gitignore`**，**勿提交**。 |
| **构建上下文**                     | **`.dockerignore`** 排除 `deploy/.env.docker`、`deploy/secrets/edge/`，防止 `docker build` 将密钥打进镜像层。                                                                                                                                                       |

### 7.4 Profile 职责一览（约定）

| Profile      | 说明                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrate`    | 一次性/流水线：执行 Drizzle 迁移                                                                                                                            |
| `minio-init` | 幂等：创建 MinIO bucket 与策略                                                                                                                              |
| **`edge`**   | **可选常驻**：**`blog-edge`** — TLS 终结、反代 **`blog-next-app:3000`**、Let’s Encrypt 申请与续期（默认不随无 profile 的 `up` 启动，避免本地开发占 80/443） |

### 7.5 与 `deploy/.env.docker` 的协同（域名上线必查）

启用 **`blog-edge`** 后，服务器上的 **`deploy/.env.docker`** 须与浏览器访问方式一致，至少：

- **`NEXT_PUBLIC_APP_URL`**、**`CORS_ORIGIN`**：`https://你的主域名`（或含路径前缀的正式对外 URL）。
- **MinIO 浏览器可访问的公网地址**：**`MINIO_PUBLIC_BASE_URL`** / **`NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL`** 若为外链图片，须为 **HTTPS** 可达地址（子域或同域反代路径需与 Nginx 路由设计一致）。

修改后需 **`docker compose ... up -d --build blog-web`**（或流水线等价步骤）使 Next 构建期/运行期读取到新值。

### 7.6 启动与运维顺序（生产目标）

1. 与 **§4** 相同：依赖 → `minio-init` → `migrate` → **`blog-web`**（保证 **`blog-web`** 在 **`blog-net`** 内已可访问）。
2. 再执行 **`docker compose --env-file deploy/.env.docker --profile edge up -d --build blog-edge`**，使证书申请时反代上游已就绪。
3. **证书与 ACME 数据**：Compose 命名卷 **`letsencrypt_data`**、**`certbot_webroot`** 持久化，避免容器重建丢证。

### 7.7 与独立 `domain/` 目录的关系

- 仓库内 **`domain/`** 为历史「第二套 Compose + 外部网络」参考实现；能力已并入根 **`docker-compose.yml`** 的 **`blog-edge`**，`domain/` **可删除或保留只读归档**。
- 迁移完成后，部署文档**仅以本文 + 根 `docker-compose.yml` 为权威**，不再要求手工 `docker network connect` 或单独 `cd domain && compose up`。

### 7.8 HTTPS 失败与域名不可用回退策略（主站 + MinIO）

> 目标：任何单点异常（证书申请失败、续期失败、域名过期/解析异常）都不导致业务不可访问。

#### 7.8.1 回退分级

| 级别            | 触发条件                         | 主站访问                                            | MinIO 对外访问                                    |
| --------------- | -------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| **L0 正常**     | 证书与域名均正常                 | `https://<domain>`                                  | `https://<minio-domain 或同域路径>`               |
| **L1 证书异常** | 首次申请失败、续期失败、证书过期 | `http://<domain>`（**`blog-edge`** 保持 HTTP 反代） | `http://<domain-path>` 或 `http://<minio-domain>` |
| **L2 域名异常** | 域名过期、DNS 失效、解析错误     | `http://<server-ip>:${APP_PORT}`                    | `http://<server-ip>:${MINIO_API_PUBLISH_PORT}`    |

#### 7.8.2 关键约束（强制）

- **`blog-edge` 必须支持“无证书可运行”**：即使 ACME 失败，也要保持 **HTTP 80** 可反代到 **`http://blog-next-app:3000`**。
- **证书签发逻辑不得阻断主流程**：证书失败只影响 HTTPS，不影响 HTTP 兜底通道。
- **MinIO 内部访问固定不变**：容器内始终使用 `http://minio:9000`；仅“对外公开 URL”在域名与 IP 之间切换。
- **公网端口兜底策略要提前定案**：若需要 L2 回退，生产需保留 `APP_PORT` 与 `MINIO_API_PUBLISH_PORT` 可访问路径（公网直开或受控网络白名单）。

#### 7.8.3 回退时环境变量调整

1. 主站：
   - `NEXT_PUBLIC_APP_URL`、`CORS_ORIGIN` 在 L1 改为 `http://<domain>`；
   - L2 改为 `http://<server-ip>:${APP_PORT}`。
2. MinIO 对外地址：
   - L1 改为 HTTP 域名地址；
   - L2 改为 `http://<server-ip>:${MINIO_API_PUBLISH_PORT}`。
3. 将 **`deploy/secrets/edge/tls_mode`** 改为 **`http_only`** 后执行 **`docker compose ... restart blog-edge`**（或 **`up -d blog-edge`**），强制仅 HTTP；恢复 **`auto`** 并重启 **`blog-edge`** 后，若磁盘上已有有效证书则入口会加载 HTTPS 配置。
4. 完成后执行：
   - `docker compose --env-file deploy/.env.docker up -d --build blog-web`
   - `docker compose --env-file deploy/.env.docker --profile edge up -d blog-edge`

#### 7.8.4 恢复流程（从回退回到 HTTPS）

1. 先恢复域名与 DNS（确认 A/AAAA 生效、80/443 可达）。
2. 再恢复证书链路（**`blog-edge`** 日志确认签发/续期成功）。
3. 将 `NEXT_PUBLIC_APP_URL`、`CORS_ORIGIN`、MinIO 对外 URL 改回 HTTPS 域名。
4. 重建 **`blog-web`** 并重启 **`blog-edge`**。
5. 按 **§9.11 故障演练清单**做完整验证。

## 8. 本地开发构建说明

- **普通** `pnpm run build`：**不**设置 `NEXT_STANDALONE`，可在 Windows 上完成构建。
- **验证 standalone**（Linux/WSL/容器）：`NEXT_STANDALONE=true pnpm run build`。

## 9. 详细上线执行清单（命令版）

> 目标：你可以从 0 到上线，严格按命令一步步执行。  
> 前提：已安装 `docker` + `docker compose`，并在仓库根目录执行命令。

### 9.1 首次准备（仅首次）

```bash
# 0) 进入项目根目录
cd /opt/blog-next

# 1) 准备部署环境文件（勿提交真实值）
cp deploy/env.docker.example deploy/.env.docker
```

编辑 `deploy/.env.docker`，至少确认以下键：

- 基础：`MYSQL_ROOT_PASSWORD`、`REDIS_PASSWORD`、`JWT_SECRET`、`JWT_REFRESH_SECRET`
- 对外地址：`NEXT_PUBLIC_APP_URL`、`CORS_ORIGIN`
- MinIO：`MINIO_ROOT_USER`、`MINIO_ROOT_PASSWORD`、`MINIO_BUCKET`、`MINIO_PUBLIC_BASE_URL`、`NEXT_PUBLIC_MINIO_PUBLIC_BASE_URL`
- 密码传输加固（生产）：
  - `PASSWORD_TRANSPORT_REQUIRED=true`
  - `PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64=<生成值>`
  - `PASSWORD_TRANSPORT_MAX_SKEW_MS=300000`
  - `POST_PASSWORD_UNLOCK_EXPIRES_SECONDS=600`
  - `POST_PASSWORD_UNLOCK_SECRET=<强随机串>`

### 9.1b 准备入口栈 Secret 文件（`blog-edge`）

在仓库根目录首次执行：

```bash
cp -r deploy/secrets/edge.example deploy/secrets/edge
# 按 deploy/secrets/edge.example/README.md 说明编辑 deploy/secrets/edge/* 各单行文件
chmod -R go-rwx deploy/secrets/edge
```

在 **`deploy/.env.docker`** 增加（或修改）：

```env
EDGE_SECRETS_DIR=./deploy/secrets/edge
```

**原则**：Let’s Encrypt 邮箱、域名列表等**仅**出现在 **`deploy/secrets/edge/`**（已 **`.gitignore`**），**不**写入 `Dockerfile.edge` 或 `docker-compose.yml` 的明文环境变量。未配置生产目录时，Compose 默认使用仓库内 **`deploy/secrets/edge.example/`**（**勿用于真实证书申请**）。

### 9.2 生成密码传输私钥（本地或服务器执行一次）

```bash
# 在仓库根目录执行
node scripts/generate-password-transport-keys.mjs
```

将输出的：

- `PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64=...`

复制到 `deploy/.env.docker`。

### 9.3 启动依赖服务

```bash
# 2) 启动 mysql + redis + minio
docker compose --env-file deploy/.env.docker up -d mysql redis minio

# 3) 初始化 MinIO bucket（幂等）
docker compose --env-file deploy/.env.docker --profile minio-init run --rm minio-init
```

### 9.4 执行数据库迁移

```bash
# 4) 迁移（建议带 --build，确保迁移镜像使用最新 drizzle）
docker compose --env-file deploy/.env.docker --profile migrate run --rm --build db-migrate
```

### 9.5 启动应用

```bash
# 5) 构建并启动应用
docker compose --env-file deploy/.env.docker up -d --build blog-web
```

### 9.5b 启动对外 HTTPS 入口（`blog-edge`）

```bash
# 6) 构建并启动 blog-edge（需已配置 EDGE_SECRETS_DIR 与 deploy/secrets/edge/）
docker compose --env-file deploy/.env.docker --profile edge up -d --build blog-edge
```

### 9.6 上线后健康检查（强烈建议逐项执行）

```bash
# 6) 查看容器状态
docker compose --env-file deploy/.env.docker ps

# 7) 查看应用启动日志（应看到 [password-transport][startup] 状态行）
docker compose --env-file deploy/.env.docker logs --tail=200 blog-web

# 8) 环境与策略自检（需超级管理员 token）
curl -sS -H "Authorization: Bearer <SUPER_ADMIN_ACCESS_TOKEN>" \
  "http://127.0.0.1:${APP_PORT:-13001}/api/test-env"
```

`/api/test-env` 重点看：

- `details.passwordTransport.required` 应为 `true`（生产默认）
- `details.passwordTransport.configured` 应为 `true`
- `details.passwordTransport.ready` 应为 `true`

### 9.7 验证密码加固链路（建议）

1. 打开登录页，正常输入账号密码应可登录。
2. 浏览器 DevTools 网络面板确认登录请求 body 为 `passwordTransport`（而非明文 `password`）。
3. 访问密码保护文章，解锁后 URL 参数应为 `?unlock=...`（不应再出现 `?password=...`）。

### 9.8 常用回滚/重启命令

```bash
# 重启应用
docker compose --env-file deploy/.env.docker restart blog-web

# 仅重建应用镜像并拉起
docker compose --env-file deploy/.env.docker up -d --build blog-web

# 停止所有服务
docker compose --env-file deploy/.env.docker down
```

### 9.8b 紧急回退命令（证书/域名故障）

```bash
# A) 证书异常但域名可用：将 deploy/secrets/edge/tls_mode 改为 http_only，并（按需）将 deploy/.env.docker 中对外 URL 切为 http://<domain>
docker compose --env-file deploy/.env.docker --profile edge up -d blog-edge
docker compose --env-file deploy/.env.docker up -d --build blog-web

# B) 保持 blog-edge 存活（HTTP 兜底）
docker compose --env-file deploy/.env.docker --profile edge up -d blog-edge

# C) 域名不可用：改 deploy/.env.docker 为 IP:端口后，重建应用
#    NEXT_PUBLIC_APP_URL=http://<server-ip>:${APP_PORT}
#    MINIO_PUBLIC_BASE_URL=http://<server-ip>:${MINIO_API_PUBLISH_PORT}
docker compose --env-file deploy/.env.docker up -d --build blog-web
```

### 9.9 失败场景快速定位

- **密码接口返回 503**：
  - 检查 `PASSWORD_TRANSPORT_REQUIRED` 与 `PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64` 是否同时正确配置。
  - 查 `blog-web` 日志是否有 `CRITICAL` 提示（password-transport 配置缺失）。
- **前端仍发送明文 password**：
  - 确认部署的是最新镜像（执行过 `up -d --build blog-web`）。
  - 清缓存后再测（避免旧前端资源）。
- **`/api/test-env` 显示 passwordTransport not ready**：
  - 以 `details.passwordTransport.reason` 为准修复配置，然后重启 `blog-web`。

### 9.10 一键执行脚本（可选）

仓库提供与本节清单对应的脚本：

```bash
bash scripts/deploy-prod-checklist.sh
```

常见用法：

```bash
# 指定 env 文件
ENV_FILE=deploy/.env.docker bash scripts/deploy-prod-checklist.sh

# 跳过 minio-init / migrate（仅排障场景）
SKIP_MINIO_INIT=1 SKIP_MIGRATE=1 bash scripts/deploy-prod-checklist.sh

# 启用 /api/test-env 自检（需超管 token）
SUPER_ADMIN_TOKEN=<TOKEN> CHECK_URL=http://127.0.0.1:13001 bash scripts/deploy-prod-checklist.sh
```

生产启用 **`edge`** 后，自检 URL 可改为 **`https://你的域名`**（或经反代后的同源地址），与 **`NEXT_PUBLIC_APP_URL`** 一致。

### 9.11 故障演练清单（建议每月一次）

- [ ] **演练 A（证书失败回退）**：临时模拟 ACME 不可达，确认主站仍可通过 `http://<domain>` 访问。
- [ ] **演练 B（域名失效回退）**：在不改服务的前提下，按预案切换到 `http://<server-ip>:${APP_PORT}` 访问主站。
- [ ] **演练 C（MinIO 外链回退）**：将 MinIO 对外 URL 切到 IP:端口，确认历史文章图片可打开。
- [ ] **恢复演练**：恢复 DNS/证书后切回 HTTPS 域名，并完成 `blog-web` 重建与页面抽检。

## 10. 常见问题

| 现象                                          | 处理                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db-migrate` 报找不到迁移                     | 若日志含 `COPY drizzle ./drizzle ... "/drizzle": not found`：先 `pnpm db:generate` 生成并提交 `drizzle/*.sql`，再 **`docker compose ... --profile migrate build db-migrate`** 后 **`run --rm db-migrate`**（或一条 **`run --rm --build`**）                                           |
| 迁移显示成功但库里没有新表                    | 多为 **未重建 db-migrate 镜像**：部署前需 **`build db-migrate`**（或 **`run --build`**）；流水线见 **`.github/workflows/deploy.yml`** 的 **step2a**。                                                                                                                                 |
| 部署日志 **step2a**/**step2b** 退出码 **124** | **`timeout` 超时**。**step2a**：**`pnpm install`** 过慢（日志常见 **`reused:0`**、全量下载）。**step2b**：连库或 **`drizzle-kit migrate`** 过久。确认远端已 **`export DOCKER_BUILDKIT=1`**（工作流已写）；可调大 **`BUILD_DB_MIGRATE_TIMEOUT_SEC`** / **`MIGRATE_RUN_TIMEOUT_SEC`**。 |
| 应用连不上数据库                              | 检查 `depends_on` 与 MySQL **healthy**；确认 `DB_*` 与 MySQL 一致                                                                                                                                                                                                                     |
| Compose 提示缺少 `MYSQL_ROOT_PASSWORD`        | 使用 `docker compose --env-file deploy/.env.docker`，且文件内已赋值                                                                                                                                                                                                                   |
| 宿主机连 MySQL                                | `127.0.0.1:13307`（默认），用户/库见 `.env.docker`                                                                                                                                                                                                                                    |
| `fatal: detected dubious ownership`           | 服务器仓库目录 owner 与部署用户不一致。执行 `sudo chown -R <SERVER_USER>:<SERVER_USER> /opt/blog-next`，并在工作流中保留 `git config --global --add safe.directory /opt/blog-next`                                                                                                    |
| `Host key verification failed`                | 服务器无法校验 `github.com` 主机指纹。执行 `ssh-keyscan github.com >> ~/.ssh/known_hosts`，并确认服务器已配置可访问仓库的 SSH key（Deploy Key）                                                                                                                                       |
| Compose 提示缺少 `MINIO_ROOT_*`               | 在 **`deploy/.env.docker`** 中补齐 **`MINIO_ROOT_USER`** / **`MINIO_ROOT_PASSWORD`**（及可选 **`MINIO_BUCKET`**），与 **`deploy/env.docker.example`** 对照。                                                                                                                          |
| `minio-init` 失败                             | 核对 **`MINIO_ROOT_USER`/`PASSWORD`** 与 **`minio` 服务一致**；在服务器执行 `docker compose ... logs minio`；确认 **`minio` 已 healthy** 后再跑 **`--profile minio-init`**。                                                                                                          |
| MinIO 数据目录                                | 在 **`deploy/.env.docker`** 设置 **`MINIO_HOST_DATA_DIR`**（默认 **`./data/minio`**，相对路径相对于 **`docker-compose.yml`** 所在目录即仓库根）。已 **`.gitignore` `/data/minio/`**。Linux 注意目录权限与容器 UID。                                                                   |
| macOS `mounts denied`（MinIO）                | 勿将 **`MINIO_HOST_DATA_DIR`** 设为 **`/data/minio`** 等根路径；Docker Desktop 未共享该路径。改为 **`./data/minio`**（仓库下）或 **`/Users/…/…`**，或在 Docker Desktop → Settings → Resources → File Sharing 添加允许路径（不推荐随意开放根目录）。                                   |
| **`blog-edge` 首次签发证书失败**              | 核对 DNS 已指向本机、**80** 未被其他进程占用、安全组放通 **80/443**；`docker compose ... logs blog-edge`；确认 **`deploy/secrets/edge/`** 内域名、邮箱等文件无多余换行；站点仍可通过 **HTTP** 访问（Bootstrap）。                                                                     |
| **证书失败后仍希望可用**                      | 按 **§7.8 / §9.8b**：**`tls_mode=http_only`** 或保持 **`auto`**（首次失败不落 HTTPS）；`NEXT_PUBLIC_APP_URL`、`CORS_ORIGIN` 与 MinIO 对外地址临时改 **HTTP**；随后 **`up -d --build blog-web`**。                                                                                     |
| **域名到期/不可用需要兜底**                   | 将主站与 MinIO 对外地址切至 `http://<server-ip>:<port>`（`APP_PORT`、`MINIO_API_PUBLISH_PORT`），并重建 **`blog-web`**；域名恢复后再切回 **HTTPS**。                                                                                                                                  |
| **502 / 反代不到应用**（`blog-edge`）         | 确认 **`blog-web`** 已启动且与 **`blog-edge`** 同属 **`blog-net`**；默认上游为 **`http://blog-next-app:3000`**（见 **`app_upstream`** secret）。                                                                                                                                      |

---

**维护**：变更 Compose 端口、Profile 或服务时，同步更新 **`deploy/env.docker.example`**、**`deploy/secrets/edge.example/`**（若有）、**`docker-compose.yml` 默认值**、**`.github/workflows/deploy.yml`** 与本篇。
