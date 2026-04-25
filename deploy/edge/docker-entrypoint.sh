#!/usr/bin/env bash
# 对外入口容器入口：从 *_FILE 读取敏感配置，渲染 Nginx，再拉起 cert-manager 与 Nginx。
set -euo pipefail

log() {
  echo "[blog-edge entrypoint] $*"
}

read_file_trimmed() {
  local file_path="$1"
  awk 'NR==1 { sub(/^[[:space:]]+/, "", $0); sub(/[[:space:]]+$/, "", $0); print; exit }' "${file_path}"
}

load_value_from_env_or_file() {
  local var_name="$1"
  local default_value="${2:-}"
  local required="${3:-false}"
  local file_var_name="${var_name}_FILE"
  local value=""

  if [[ -n "${!var_name:-}" ]]; then
    value="${!var_name}"
  elif [[ -n "${!file_var_name:-}" ]]; then
    if [[ ! -f "${!file_var_name}" ]]; then
      echo "文件变量 ${file_var_name} 指向的文件不存在：${!file_var_name}" >&2
      exit 1
    fi
    value="$(read_file_trimmed "${!file_var_name}")"
  else
    value="${default_value}"
  fi

  if [[ "${required}" == "true" ]] && [[ -z "${value}" ]]; then
    echo "变量 ${var_name} 未设置（支持 ${var_name} 或 ${var_name}_FILE）。" >&2
    exit 1
  fi

  export "${var_name}=${value}"
}

load_value_from_env_or_file "DOMAINS" "" "true"
load_value_from_env_or_file "CERTBOT_EMAIL" "" "true"
# 与根 compose 中 blog-web 的 container_name 对齐，保证 Docker DNS 可解析
load_value_from_env_or_file "APP_UPSTREAM" "http://blog-next-app:3000" "false"
load_value_from_env_or_file "CHECK_INTERVAL_SECONDS" "300" "false"
load_value_from_env_or_file "RENEW_BEFORE_SECONDS" "1800" "false"
load_value_from_env_or_file "RENEW_STRATEGY" "official_30d" "false"
load_value_from_env_or_file "OFFICIAL_RENEW_WINDOW_SECONDS" "2592000" "false"
# auto：有证则启用 HTTPS；http_only：强制仅 HTTP（应急回退，见文档 §7.8）
load_value_from_env_or_file "TLS_MODE" "auto" "false"

# DOMAINS: "example.com,www.example.com"
export DOMAINS_SPACED="${DOMAINS//,/ }"
export PRIMARY_DOMAIN="${DOMAINS%%,*}"

mkdir -p /var/www/certbot /etc/letsencrypt

touch /var/www/certbot/.well-known-placeholder

EDGE_CONF="/etc/nginx/conf.d/blog-edge.conf"

log "渲染 Nginx 模板（TLS_MODE=${TLS_MODE}）..."
envsubst '${DOMAINS_SPACED} ${APP_UPSTREAM}' \
  < /etc/nginx/templates/nginx.bootstrap.template.conf \
  > "${EDGE_CONF}"

if [[ "${TLS_MODE}" == "http_only" ]]; then
  log "TLS_MODE=http_only：不启用 HTTPS 站点，仅保持 HTTP 反代（含 ACME 路径）。"
elif [[ -f "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem" ]] && \
     [[ -f "/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem" ]]; then
  log "检测到已存在证书且 TLS_MODE=auto，切换为完整 HTTPS 配置。"
  envsubst '${DOMAINS_SPACED} ${PRIMARY_DOMAIN} ${APP_UPSTREAM}' \
    < /etc/nginx/templates/nginx.full.template.conf \
    > "${EDGE_CONF}"
else
  log "未检测到证书或 TLS_MODE=auto 尚无证书：先以 Bootstrap HTTP 配置启动（ACME + 反代）。"
fi

log "启动证书管理后台任务..."
(
  while true; do
    /usr/local/bin/cert-manager.sh
    log "cert-manager 进程异常退出，10 秒后重试。"
    sleep 10
  done
) &

log "启动 Nginx 前台进程..."
exec nginx -g 'daemon off;'
