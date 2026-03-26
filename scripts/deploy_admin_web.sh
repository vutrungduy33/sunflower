#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="deploy-web"

start_admin_web_service() {
  if [ -n "${ADMIN_WEB_IMAGE:-}" ]; then
    log_info "$PREFIX" "Pulling admin web image from registry: ${ADMIN_WEB_IMAGE}"
    pull_service_with_retry admin-web "$PREFIX"
    compose up -d --no-deps admin-web
    return
  fi

  log_info "$PREFIX" "Starting admin web service with local build..."
  compose up -d --build --no-deps admin-web
}

main() {
  cd "$(project_root)"
  load_runtime_envs
  detect_compose_cmd

  require_numeric BACKEND_HOST_PORT
  require_numeric ADMIN_WEB_HOST_PORT

  log_info "$PREFIX" "Waiting backend healthy before starting admin web..."
  wait_service_healthy backend "$PREFIX"
  wait_http_ready "http://127.0.0.1:${BACKEND_HOST_PORT}/api/health" "$PREFIX"

  log_info "$PREFIX" "Starting admin web service..."
  start_admin_web_service

  log_info "$PREFIX" "Waiting admin web healthy..."
  wait_service_healthy admin-web "$PREFIX"
  wait_http_ready "http://127.0.0.1:${ADMIN_WEB_HOST_PORT}/healthz" "$PREFIX"

  log_info "$PREFIX" "Admin web deployment completed."
}

main "$@"
