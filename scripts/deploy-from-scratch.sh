#!/usr/bin/env bash

# =============================================================================
# 荒野博客：从零拉起依赖并完成 Drizzle 迁移（唯一建表路径）
# -----------------------------------------------------------------------------
# - 与 docs/Docker编排与流水线部署.md 一致：使用仓库根目录 docker-compose.yml。
# - 不使用、也不依赖已移除的 init-db.sql 等「纯 SQL 一次性建库」脚本。
# - 流程：Compose 启动 mysql + redis → db-migrate 容器执行 pnpm db:migrate →
#   可选：根据 deploy/.env.docker 同步本机 .env.local（供宿主机 pnpm 连库）→ db:seed。
#
# 依赖：Docker（含 compose 插件）、pnpm；在仓库根目录执行：
#   bash scripts/deploy-from-scratch.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# 统一带 env 文件的 compose 调用（避免路径写错）
compose() {
  docker compose --env-file deploy/.env.docker "$@"
}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# 跨平台 in-place sed（GNU sed 与 BSD sed）
sedi() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

# 从 deploy/.env.docker 读取一行 KEY=value（value 中勿含未转义换行）
get_kv() {
  local key="$1"
  local file="deploy/.env.docker"
  grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

check_dependencies() {
  log_info "检查依赖（Docker、Compose、pnpm）…"
  if ! command -v docker >/dev/null 2>&1; then
    log_error "未检测到 Docker，请先安装"
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    log_error "需要 Docker Compose v2（命令：docker compose）"
    exit 1
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
    log_error "未检测到 pnpm，请先安装"
    exit 1
  fi
  log_success "依赖检查通过"
}

ensure_deploy_env() {
  if [[ ! -f deploy/.env.docker ]]; then
    if [[ -f deploy/env.docker.example ]]; then
      cp deploy/env.docker.example deploy/.env.docker
      log_error "已生成 deploy/.env.docker，请先编辑其中的密码、JWT 等占位符后再运行本脚本"
      exit 1
    fi
    log_error "缺少 deploy/.env.docker 与 deploy/env.docker.example"
    exit 1
  fi
  # 常见占位符未替换时直接退出，避免用默认弱口令上线
  if grep -qE '请改为|your_password_here|your_jwt_secret' deploy/.env.docker 2>/dev/null; then
    log_error "deploy/.env.docker 仍含占位符（请改为… / your_password… 等），请改为真实密钥后再执行"
    exit 1
  fi
}

remove_legacy_standalone_mysql() {
  # 历史脚本曾用 docker run --name blog-mysql；与 compose 服务容器名冲突时先清理
  if docker ps -a --format '{{.Names}}' | grep -Fxq blog-mysql; then
    if ! docker inspect blog-mysql --format '{{index .Config.Labels "com.docker.compose.service"}}' 2>/dev/null | grep -q mysql; then
      log_warning "发现非 Compose 创建的 blog-mysql 容器，将删除以免与 compose 冲突"
      docker rm -f blog-mysql 2>/dev/null || true
    fi
  fi
}

compose_up_infra() {
  log_info "启动 MySQL、Redis（docker compose up）…"
  # --wait：Compose v2.20+ 等待 healthcheck 通过后再返回
  if compose up -d --wait mysql redis 2>/dev/null; then
    log_success "MySQL / Redis 已就绪（--wait）"
  else
    log_warning "当前环境不支持或未开启 --wait，改用固定等待时间"
    compose up -d mysql redis
    log_info "等待 MySQL 健康检查（最多约 90s）…"
    local i
    for i in $(seq 1 45); do
      if compose ps mysql 2>/dev/null | grep -q healthy; then
        log_success "MySQL 状态 healthy"
        break
      fi
      sleep 2
    done
  fi
}

run_drizzle_migrate_job() {
  log_info "执行 Drizzle 迁移（服务 db-migrate，一次性容器）…"
  compose --profile migrate run --rm db-migrate
  log_success "Drizzle 迁移完成"
}

# 将宿主机访问 Compose 暴露端口所需的变量写入 .env.local（便于 pnpm db:seed / test:db:connect）
sync_host_env_local() {
  local pub rport dbn duser dpass
  pub=$(get_kv MYSQL_PUBLISH_PORT)
  pub=${pub:-13307}
  rport=$(get_kv REDIS_PUBLISH_PORT)
  rport=${rport:-16380}
  dbn=$(get_kv MYSQL_DATABASE)
  dbn=${dbn:-blog_system}
  duser=$(get_kv DB_USER)
  duser=${duser:-root}
  dpass=$(get_kv DB_PASSWORD)
  [[ -z "$dpass" ]] && dpass=$(get_kv MYSQL_ROOT_PASSWORD)

  if [[ ! -f .env.local ]]; then
    cp env.example .env.local
    log_success "已从 env.example 创建 .env.local"
  fi

  sedi "s/^DB_HOST=.*/DB_HOST=127.0.0.1/" .env.local
  sedi "s/^DB_PORT=.*/DB_PORT=${pub}/" .env.local
  sedi "s/^DB_NAME=.*/DB_NAME=${dbn}/" .env.local
  sedi "s/^DB_USER=.*/DB_USER=${duser}/" .env.local
  sedi "s|^REDIS_URL=.*|REDIS_URL=redis://127.0.0.1:${rport}|" .env.local

  # 密码可能含特殊字符，优先用 perl；若无 perl 则提示手工同步
  if [[ -n "$dpass" ]] && command -v perl >/dev/null 2>&1; then
    export PERL_DBPASS="$dpass"
    perl -i -pe 's/^DB_PASSWORD=.*/DB_PASSWORD=$ENV{PERL_DBPASS}/' .env.local
    unset PERL_DBPASS
  else
    log_warning "请确认 .env.local 中 DB_PASSWORD 与 deploy/.env.docker 中数据库密码一致"
  fi

  log_success "已根据 deploy/.env.docker 同步 .env.local 中的 DB_* 与 REDIS_URL（本机连宿主机端口）"
  log_info "本地 pnpm dev 仍常用 3000：可按需保留 NEXT_PUBLIC_APP_URL=http://localhost:3000；Compose 站点见 deploy 模板中的 13001"
}

run_seed_optional() {
  log_info "填充种子数据（pnpm db:seed，失败不中断）…"
  if pnpm db:seed; then
    log_success "种子数据已写入"
  else
    log_warning "db:seed 未完成，可检查 .env.local 后手动执行 pnpm db:seed"
  fi
}

print_summary() {
  local pub rport app_port
  pub=$(get_kv MYSQL_PUBLISH_PORT)
  pub=${pub:-13307}
  rport=$(get_kv REDIS_PUBLISH_PORT)
  rport=${rport:-16380}
  app_port=$(get_kv APP_PORT)
  app_port=${app_port:-13001}

  echo ""
  log_success "编排与迁移阶段完成"
  echo "=================================================="
  echo "📌 建表方式：仅 Drizzle（compose 服务 db-migrate 已执行 pnpm db:migrate）"
  echo "📌 宿主机端口（默认，以 deploy/.env.docker 为准）："
  echo "   - MySQL: ${pub}"
  echo "   - Redis: ${rport}"
  echo "   - 应用（Compose blog-web）: ${app_port}"
  echo ""
  echo "🔧 常用命令："
  echo "   - 本机开发：pnpm dev → 默认 http://localhost:3000/zh-CN"
  echo "   - 连库测试：pnpm test:db:connect"
  echo "   - 仅重跑迁移：pnpm run docker:migrate"
  echo "   - 完整部署说明：docs/Docker编排与流水线部署.md"
  echo ""
}

main() {
  check_dependencies
  ensure_deploy_env
  remove_legacy_standalone_mysql
  compose_up_infra
  run_drizzle_migrate_job
  sync_host_env_local
  run_seed_optional
  print_summary
  log_info "如需跑 API 自测：pnpm test:api（需应用已启动或按测试脚本要求）"
}

main "$@"
