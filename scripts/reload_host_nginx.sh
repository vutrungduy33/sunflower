#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-8080}"
ADMIN_WEB_HOST_PORT="${ADMIN_WEB_HOST_PORT:-18080}"
HOST_NGINX_SITE_NAME="${HOST_NGINX_SITE_NAME:-sunflower}"
HOST_NGINX_AVAILABLE_DIR="${HOST_NGINX_AVAILABLE_DIR:-/etc/nginx/sites-available}"
HOST_NGINX_ENABLED_DIR="${HOST_NGINX_ENABLED_DIR:-/etc/nginx/sites-enabled}"
HOST_NGINX_TEMPLATE_PATH="$ROOT_DIR/deploy/nginx/sunflower-host.conf.template"

fail() {
  echo "[deploy-nginx] ERROR: $*" >&2
  exit 1
}

wait_backend_ready() {
  for _ in $(seq 1 40); do
    if curl -fsS "http://127.0.0.1:${BACKEND_HOST_PORT}/api/health" >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  fail "backend is not ready on http://127.0.0.1:${BACKEND_HOST_PORT}/api/health"
}

wait_admin_web_ready() {
  for _ in $(seq 1 40); do
    if curl -fsS "http://127.0.0.1:${ADMIN_WEB_HOST_PORT}/healthz" >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  fail "admin web is not ready on http://127.0.0.1:${ADMIN_WEB_HOST_PORT}/healthz"
}

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
  [ -f "$HOST_NGINX_TEMPLATE_PATH" ] || fail "nginx template not found: $HOST_NGINX_TEMPLATE_PATH"
  sed \
    -e "s/__BACKEND_HOST_PORT__/${BACKEND_HOST_PORT}/g" \
    -e "s/__ADMIN_WEB_HOST_PORT__/${ADMIN_WEB_HOST_PORT}/g" \
    "$HOST_NGINX_TEMPLATE_PATH"
}

main() {
  case "$BACKEND_HOST_PORT" in
    ''|*[!0-9]*)
      fail "BACKEND_HOST_PORT must be numeric, got '$BACKEND_HOST_PORT'"
      ;;
  esac

  case "$ADMIN_WEB_HOST_PORT" in
    ''|*[!0-9]*)
      fail "ADMIN_WEB_HOST_PORT must be numeric, got '$ADMIN_WEB_HOST_PORT'"
      ;;
  esac

  case "$HOST_NGINX_SITE_NAME" in
    '')
      fail "HOST_NGINX_SITE_NAME must not be empty"
      ;;
  esac

  command -v nginx >/dev/null 2>&1 || fail "nginx is not installed on host"
  command -v systemctl >/dev/null 2>&1 || fail "systemctl is not available on host"

  detect_sudo_prefix

  echo "[deploy-nginx] Waiting backend healthy before nginx reload..."
  wait_backend_ready

  echo "[deploy-nginx] Waiting admin web healthy before nginx reload..."
  wait_admin_web_ready

  tmp_config="$(mktemp)"
  trap 'rm -f "$tmp_config"' EXIT
  render_config > "$tmp_config"

  site_available_path="${HOST_NGINX_AVAILABLE_DIR}/${HOST_NGINX_SITE_NAME}"
  site_enabled_path="${HOST_NGINX_ENABLED_DIR}/${HOST_NGINX_SITE_NAME}"

  echo "[deploy-nginx] Installing host nginx site config..."
  "${SUDO_CMD[@]}" mkdir -p "$HOST_NGINX_AVAILABLE_DIR" "$HOST_NGINX_ENABLED_DIR"
  "${SUDO_CMD[@]}" install -m 644 "$tmp_config" "$site_available_path"
  "${SUDO_CMD[@]}" ln -sfn "$site_available_path" "$site_enabled_path"

  echo "[deploy-nginx] Removing deprecated container edge gateway if present..."
  docker rm -f sunflower-edge-gateway >/dev/null 2>&1 || true

  echo "[deploy-nginx] Validating nginx config..."
  "${SUDO_CMD[@]}" nginx -t

  echo "[deploy-nginx] Reloading host nginx..."
  "${SUDO_CMD[@]}" systemctl reload nginx

  echo "[deploy-nginx] Host nginx reload completed."
}

main "$@"
