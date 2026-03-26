#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="deploy-nginx"
HOST_NGINX_AVAILABLE_DIR="${HOST_NGINX_AVAILABLE_DIR:-/etc/nginx/sites-available}"
HOST_NGINX_ENABLED_DIR="${HOST_NGINX_ENABLED_DIR:-/etc/nginx/sites-enabled}"
HOST_NGINX_TEMPLATE_PATH="$(cd "$SCRIPT_DIR/.." && pwd)/deploy/nginx/sunflower-host.conf.template"

detect_sudo_prefix() {
  if [ "$(id -u)" -eq 0 ]; then
    SUDO_CMD=()
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    SUDO_CMD=(sudo)
    return
  fi
  fail "root or sudo privileges are required to install nginx config"
}

render_config() {
  [ -f "$HOST_NGINX_TEMPLATE_PATH" ] || fail "$PREFIX" "nginx template not found: $HOST_NGINX_TEMPLATE_PATH"
  sed \
    -e "s/__BACKEND_HOST_PORT__/${BACKEND_HOST_PORT}/g" \
    -e "s/__ADMIN_WEB_HOST_PORT__/${ADMIN_WEB_HOST_PORT}/g" \
    -e "s/__HOST_NGINX_SERVER_NAME__/${HOST_NGINX_SERVER_NAME}/g" \
    -e "s#__HOST_NGINX_TLS_CERT_PATH__#${HOST_NGINX_TLS_CERT_PATH}#g" \
    -e "s#__HOST_NGINX_TLS_KEY_PATH__#${HOST_NGINX_TLS_KEY_PATH}#g" \
    "$HOST_NGINX_TEMPLATE_PATH"
}

main() {
  cd "$(project_root)"
  load_runtime_envs
  detect_compose_cmd

  require_numeric BACKEND_HOST_PORT
  require_numeric ADMIN_WEB_HOST_PORT
  require_value HOST_NGINX_SITE_NAME
  require_value HOST_NGINX_SERVER_NAME
  require_value HOST_NGINX_TLS_CERT_PATH
  require_value HOST_NGINX_TLS_KEY_PATH

  command -v nginx >/dev/null 2>&1 || fail "$PREFIX" "nginx is not installed on host"
  command -v systemctl >/dev/null 2>&1 || fail "$PREFIX" "systemctl is not available on host"

  detect_sudo_prefix

  log_info "$PREFIX" "Waiting backend healthy before nginx reload..."
  wait_service_healthy backend "$PREFIX"
  wait_http_ready "http://127.0.0.1:${BACKEND_HOST_PORT}/api/health" "$PREFIX"

  log_info "$PREFIX" "Waiting admin web healthy before nginx reload..."
  wait_service_healthy admin-web "$PREFIX"
  wait_http_ready "http://127.0.0.1:${ADMIN_WEB_HOST_PORT}/healthz" "$PREFIX"

  tmp_config="$(mktemp)"
  trap 'rm -f "$tmp_config"' EXIT
  render_config > "$tmp_config"

  site_available_path="${HOST_NGINX_AVAILABLE_DIR}/${HOST_NGINX_SITE_NAME}"
  site_enabled_path="${HOST_NGINX_ENABLED_DIR}/${HOST_NGINX_SITE_NAME}"

  log_info "$PREFIX" "Installing host nginx site config..."
  "${SUDO_CMD[@]}" mkdir -p "$HOST_NGINX_AVAILABLE_DIR" "$HOST_NGINX_ENABLED_DIR"
  "${SUDO_CMD[@]}" install -m 644 "$tmp_config" "$site_available_path"
  "${SUDO_CMD[@]}" ln -sfn "$site_available_path" "$site_enabled_path"

  log_info "$PREFIX" "Removing deprecated container edge gateway if present..."
  docker rm -f sunflower-edge-gateway >/dev/null 2>&1 || true

  log_info "$PREFIX" "Validating nginx config..."
  "${SUDO_CMD[@]}" nginx -t

  log_info "$PREFIX" "Reloading host nginx..."
  "${SUDO_CMD[@]}" systemctl reload nginx

  log_info "$PREFIX" "Host nginx reload completed."
}

main "$@"
