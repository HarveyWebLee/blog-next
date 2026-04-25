#!/usr/bin/env bash
# Let’s Encrypt 申请与续期；证书失败时不退出主循环，保持 HTTP 可用。
set -euo pipefail

log() {
  echo "[blog-edge cert-manager] $*"
}

read_file_trimmed() {
  local file_path="$1"
  awk 'NR==1 { sub(/^[[:space:]]+/, "", $0); sub(/[[:space:]]+$/, "", $0); print; exit }' "${file_path}"
}

load_tls_mode() {
  if [[ -n "${TLS_MODE_FILE:-}" ]] && [[ -f "${TLS_MODE_FILE}" ]]; then
    TLS_MODE="$(read_file_trimmed "${TLS_MODE_FILE}")"
  fi
  TLS_MODE="${TLS_MODE:-auto}"
  export TLS_MODE
}

domains_args=()
IFS=',' read -r -a domains_array <<< "${DOMAINS}"
for domain in "${domains_array[@]}"; do
  domain="${domain//[[:space:]]/}"
  [[ -z "${domain}" ]] && continue
  domains_args+=( -d "${domain}" )
done

PRIMARY_DOMAIN="${DOMAINS%%,*}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-300}"
RENEW_BEFORE_SECONDS="${RENEW_BEFORE_SECONDS:-1800}"
RENEW_STRATEGY="${RENEW_STRATEGY:-official_30d}"
OFFICIAL_RENEW_WINDOW_SECONDS="${OFFICIAL_RENEW_WINDOW_SECONDS:-2592000}"

load_tls_mode

issue_or_renew() {
  certbot certonly \
    --webroot \
    -w /var/www/certbot \
    --non-interactive \
    --agree-tos \
    --email "${CERTBOT_EMAIL}" \
    "${domains_args[@]}" \
    "$@"
}

switch_full_https_config() {
  envsubst '${DOMAINS_SPACED} ${PRIMARY_DOMAIN} ${APP_UPSTREAM}' \
    < /etc/nginx/templates/nginx.full.template.conf \
    > /etc/nginx/conf.d/blog-edge.conf
}

# 仅在 TLS_MODE=auto 时切换到带 443 的配置；http_only 时永不切换（文档 §7.8 回退）
switch_full_https_config_if_auto() {
  load_tls_mode
  if [[ "${TLS_MODE}" == "http_only" ]]; then
    log "TLS_MODE=http_only，跳过切换 HTTPS 配置（保持纯 HTTP 反代）。"
    return 0
  fi
  switch_full_https_config
}

cert_expires_within() {
  local cert_file="$1"
  local threshold_seconds="$2"
  # openssl -checkend：若证书在 threshold 秒内会过期则返回非 0；仍有效则返回 0。
  if openssl x509 -checkend "${threshold_seconds}" -noout -in "${cert_file}" >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

wait_nginx_ready() {
  for _ in $(seq 1 30); do
    if wget -q --spider http://127.0.0.1/.well-known/acme-challenge/health; then
      return 0
    fi
    sleep 1
  done

  log "Nginx 启动等待超时，无法执行证书申请。"
  return 1
}

main() {
  wait_nginx_ready

  local cert_file="/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem"

  if [[ ! -f "${cert_file}" ]]; then
    log "开始首次申请证书..."
    if issue_or_renew; then
      switch_full_https_config_if_auto
      nginx -s reload
      log "首次申请成功，已按需切换 HTTPS 并重载 Nginx。"
    else
      log "首次申请失败：保持 Bootstrap HTTP 配置，站点仍可通过 HTTP 访问；将在后续周期重试。"
    fi
  else
    log "检测到现有证书，进入续期监控循环。"
  fi

  while true; do
    load_tls_mode
    cert_file="/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem"
    if [[ -f "${cert_file}" ]]; then
      log "检测证书到期窗口..."
      if [[ "${RENEW_STRATEGY}" == "official_30d" ]]; then
        if cert_expires_within "${cert_file}" "${OFFICIAL_RENEW_WINDOW_SECONDS}"; then
          log "进入官方续期窗口（<= ${OFFICIAL_RENEW_WINDOW_SECONDS} 秒），执行 certbot renew..."
          certbot renew --webroot -w /var/www/certbot --deploy-hook "nginx -s reload"
          log "官方续期检查完成（仅在证书实际更新时会执行 deploy-hook reload）。"
          if [[ "${TLS_MODE}" == "auto" ]]; then
            switch_full_https_config_if_auto
            nginx -s reload || true
          fi
        fi
      elif [[ "${RENEW_STRATEGY}" == "custom_seconds" ]]; then
        if cert_expires_within "${cert_file}" "${RENEW_BEFORE_SECONDS}"; then
          log "距离到期小于等于 ${RENEW_BEFORE_SECONDS} 秒，触发强制续期..."
          if issue_or_renew --force-renewal; then
            switch_full_https_config_if_auto
            nginx -s reload
            log "续期完成，Nginx 已重载。"
          else
            log "强制续期失败，保持当前 Nginx 配置。"
          fi
        fi
      else
        log "未知 RENEW_STRATEGY=${RENEW_STRATEGY}，本轮跳过续期。"
      fi
    else
      log "证书文件缺失，尝试重新申请..."
      if issue_or_renew; then
        switch_full_https_config_if_auto
        nginx -s reload
        log "重新申请成功，Nginx 已重载。"
      else
        log "重新申请失败，仍保持 HTTP。"
      fi
    fi

    sleep "${CHECK_INTERVAL_SECONDS}"
  done
}

main "$@"
