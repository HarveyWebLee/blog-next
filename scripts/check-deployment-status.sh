#!/usr/bin/env bash

# =============================================================================
# 检查本机/开发环境：Compose 中的 MySQL、.env、数据库连通、Drizzle 表是否齐全
# -----------------------------------------------------------------------------
# 与 scripts/deploy-from-scratch.sh 一致：依赖 docker compose + Drizzle 迁移，
# 不假设「导入 init-db.sql」类流程。
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

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

# Drizzle 迁移完成后业务表数量级（SHOW TABLES 还会含 __drizzle_migrations 等，略高于纯业务表数）
MIN_EXPECTED_TABLES=10

compose_ps_mysql_line() {
  if [[ -f deploy/.env.docker ]]; then
    docker compose --env-file deploy/.env.docker ps mysql 2>/dev/null || true
  fi
}

check_docker_mysql() {
  log_info "检查 MySQL 容器（优先 docker compose）…"

  if [[ -f deploy/.env.docker ]] && compose_ps_mysql_line | grep -q 'blog-mysql\|mysql'; then
    if compose_ps_mysql_line | grep -q 'Up'; then
      log_success "Compose 服务 mysql 容器在运行"
      compose_ps_mysql_line | head -5
      return 0
    fi
  fi

  if docker ps --format '{{.Names}}' | grep -Fxq blog-mysql; then
    log_success "发现运行中的 blog-mysql 容器"
    docker ps | grep blog-mysql || true
    return 0
  fi

  log_error "未检测到运行中的 MySQL 容器（可先：docker compose --env-file deploy/.env.docker up -d mysql redis）"
  return 1
}

check_database_connection() {
  log_info "检查数据库连接（pnpm test:db:connect）…"

  if pnpm test:db:connect > /dev/null 2>&1; then
    log_success "数据库连接正常"
  else
    log_error "数据库连接失败（确认 .env.local 中 DB_HOST/DB_PORT 与 Compose 暴露端口一致）"
    return 1
  fi
}

check_environment() {
  log_info "检查 .env.local…"

  if [[ -f .env.local ]]; then
    log_success "存在 .env.local"
  else
    log_error "缺少 .env.local（可 env.example 复制后按 deploy/.env.docker 填库端口与密码）"
    return 1
  fi
}

# 从 test:db:connect 输出解析「表数量: N」
parse_table_count() {
  pnpm test:db:connect 2>/dev/null | grep "表数量" | sed -E 's/.*表数量: *([0-9]+).*/\1/' | head -1
}

check_database_tables() {
  log_info "检查表数量（应已执行 Drizzle 迁移）…"

  local count
  count=$(parse_table_count || echo "0")
  # 排除非数字
  if ! [[ "$count" =~ ^[0-9]+$ ]]; then
    count=0
  fi

  if [[ "$count" -ge $MIN_EXPECTED_TABLES ]]; then
    log_success "当前约有 ${count} 张表（>= ${MIN_EXPECTED_TABLES}，可认为已跑过迁移）"
  elif [[ "$count" -gt 0 ]]; then
    log_warning "表数量偏少（${count}），若为新库请执行：pnpm run docker:migrate 或 pnpm db:migrate"
  else
    log_warning "未能解析表数量或库为空，请执行 Drizzle 迁移后再试"
  fi
}

check_api_endpoints() {
  log_info "检查 /api/test-db（需有进程监听）…"

  if curl -sf http://localhost:3000/api/test-db > /dev/null 2>&1; then
    log_success "http://localhost:3000/api/test-db 可访问（pnpm dev 默认端口）"
  else
    log_warning "3000 端口无响应或未启动 dev（Compose 应用默认见 13001）"
  fi
}

check_frontend_pages() {
  log_info "检查前台首页…"

  if curl -sf http://localhost:3000/zh-CN > /dev/null 2>&1; then
    log_success "http://localhost:3000/zh-CN 可访问"
  else
    log_warning "首页不可访问（可能未执行 pnpm dev）"
  fi
}

show_system_info() {
  echo ""
  echo "📊 摘要"
  echo "=================================================="
  echo "🐳 MySQL 容器:"
  if [[ -f deploy/.env.docker ]]; then
    compose_ps_mysql_line | head -3 || echo "   （compose 未运行）"
  else
    docker ps | grep blog-mysql || echo "   未运行"
  fi

  echo ""
  echo "🗄️ 数据库（pnpm test:db:connect）:"
  if pnpm test:db:connect > /dev/null 2>&1; then
    pnpm test:db:connect 2>/dev/null | grep -E "数据库版本|表数量" || true
  else
    echo "   连接失败"
  fi

  echo ""
  echo "🌐 URL 提示："
  echo "   - pnpm dev: http://localhost:3000/zh-CN"
  echo "   - Compose blog-web（默认）: 见 deploy/.env.docker APP_PORT（如 13001）"
  echo ""
  echo "🔧 文档：docs/Docker编排与流水线部署.md"
  echo "🔧 从零脚本：bash scripts/deploy-from-scratch.sh"
}

main() {
  local ok=true

  check_docker_mysql || ok=false
  check_environment || ok=false
  check_database_connection || ok=false
  check_database_tables || true
  check_api_endpoints || true
  check_frontend_pages || true

  show_system_info

  echo ""
  if [[ "$ok" == true ]]; then
    log_success "核心检查通过"
  else
    log_warning "部分检查未通过，请根据上文提示处理"
  fi
}

main "$@"
