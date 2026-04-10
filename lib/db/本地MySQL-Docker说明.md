# 本地 MySQL（Docker）数据目录说明

在 **Windows** 环境下使用 Git Bash 或 WSL 时，常把容器内 MySQL 数据目录挂载到本机固定路径，以便重装容器后不丢数据。

## 示例（摘自历史开发笔记）

先确保本机存在可挂载目录（需按你的环境修改路径）：

```bash
# 示例：在 Git Bash 下将数据落到 E:/mysql_data
mkdir -p /e/mysql_data
```

启动容器（**root 密码与卷路径请自行修改**）：

```bash
docker run -d \
  --name mysql-server \
  --restart unless-stopped \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -v /e/mysql_data:/var/lib/mysql \
  mysql:8.0
```

一行等价命令（便于复制时自行调整）：

```
docker run -d --name mysql-server --restart unless-stopped -e MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -v /e/mysql_data:/var/lib/mysql mysql:8.0
```

## 与项目配置对接

容器运行后，在 `.env.local` 中填写与之一致的 `DB_HOST`（通常 `localhost`）、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`，再执行：

```bash
pnpm test:db:connect
pnpm db:migrate   # 或 db:push，见根目录 README / docs
```

## 注意

- 不同 Docker 版本在 Windows 上对路径写法可能不同；若挂载失败可改用 **Docker Desktop 提供的命名卷** 或 WSL2 内的 Linux 路径。
- 生产与统一部署请见 **`docs/Docker编排与流水线部署.md`**（`docker-compose` 中 MySQL 等）。
