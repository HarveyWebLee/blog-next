#!/usr/bin/env bash
set -euo pipefail

# 生产上线执行脚本（命令版清单对应实现）
# 用法：
#   bash scripts/deploy-prod-checklist.sh
#
# 可选环境变量：
#   ENV_FILE=deploy/.env.docker
#   SKIP_KEYGEN=1                # 跳过密钥生成提示
#   SKIP_MINIO_INIT=1            # 跳过 minio-init
#   SKIP_MIGRATE=1               # 跳过数据库迁移
#   CHECK_URL=http://127.0.0.1:13001
#   SUPER_ADMIN_TOKEN=xxx        # 用于 /api/test-env 自检

ENV_FILE="${ENV_FILE:-deploy/.env.docker}"
CHECK_URL="${CHECK_URL:-http://127.0.0.1:13001}"

echo "==> [1/8] 基础检查"
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker 未安装或不在 PATH"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose 不可用"
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: 缺少环境文件 $ENV_FILE"
  echo "提示：cp deploy/env.docker.example $ENV_FILE 后再执行。"
  exit 1
fi

echo "==> [2/8] 检查密码传输关键变量"
if ! rg -n "^PASSWORD_TRANSPORT_REQUIRED=true$" "$ENV_FILE" >/dev/null 2>&1; then
  echo "WARN: $ENV_FILE 未显式设置 PASSWORD_TRANSPORT_REQUIRED=true（生产建议开启）"
fi
if ! rg -n "^PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64=.+$" "$ENV_FILE" >/dev/null 2>&1; then
  echo "WARN: 未检测到 PASSWORD_TRANSPORT_RSA_PRIVATE_KEY_B64，生产下密码接口可能返回 503。"
  if [[ "${SKIP_KEYGEN:-0}" != "1" ]]; then
    echo "可执行：node scripts/generate-password-transport-keys.mjs"
  fi
fi

echo "==> [3/8] 启动依赖服务（mysql/redis/minio）"
docker compose --env-file "$ENV_FILE" up -d mysql redis minio

if [[ "${SKIP_MINIO_INIT:-0}" != "1" ]]; then
  echo "==> [4/8] MinIO 初始化（幂等）"
  docker compose --env-file "$ENV_FILE" --profile minio-init run --rm minio-init
else
  echo "==> [4/8] 跳过 MinIO 初始化（SKIP_MINIO_INIT=1）"
fi

if [[ "${SKIP_MIGRATE:-0}" != "1" ]]; then
  echo "==> [5/8] 执行数据库迁移（带 --build）"
  docker compose --env-file "$ENV_FILE" --profile migrate run --rm --build db-migrate
else
  echo "==> [5/8] 跳过数据库迁移（SKIP_MIGRATE=1）"
fi

echo "==> [6/8] 构建并启动应用"
docker compose --env-file "$ENV_FILE" up -d --build blog-web

echo "==> [7/8] 查看容器状态"
docker compose --env-file "$ENV_FILE" ps

echo "==> [8/8] 应用启动日志（检查 password-transport 启动状态）"
docker compose --env-file "$ENV_FILE" logs --tail=200 blog-web || true

if [[ -n "${SUPER_ADMIN_TOKEN:-}" ]]; then
  echo "==> 运行 /api/test-env 自检"
  curl -sS -H "Authorization: Bearer ${SUPER_ADMIN_TOKEN}" "${CHECK_URL}/api/test-env" || true
else
  echo "==> 未提供 SUPER_ADMIN_TOKEN，跳过 /api/test-env 自检"
  echo "提示：SUPER_ADMIN_TOKEN=... CHECK_URL=${CHECK_URL} bash scripts/deploy-prod-checklist.sh"
fi

echo "==> 完成。建议手动再验证："
echo "    1) 登录请求 body 是否为 passwordTransport"
echo "    2) 密码文章解锁后 URL 是否为 ?unlock=..."
