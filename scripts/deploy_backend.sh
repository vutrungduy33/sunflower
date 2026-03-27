#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="deploy-backend"

start_backend_service() {
  compose up -d mysql
  wait_service_healthy mysql "$PREFIX"
  assert_mysql_app_access "$PREFIX"

  if [ -n "${BACKEND_IMAGE:-}" ]; then
    if local_image_exists "$BACKEND_IMAGE"; then
      log_info "$PREFIX" "Using preloaded backend image: ${BACKEND_IMAGE}"
    else
      log_info "$PREFIX" "Pulling backend image from registry: ${BACKEND_IMAGE}"
      pull_image_with_retry "$BACKEND_IMAGE" "$PREFIX" "backend"
    fi
    compose up -d backend
  else
    log_info "$PREFIX" "Starting backend service with local build..."
    compose up -d --build backend
  fi
}

main() {
  cd "$(project_root)"
  load_runtime_envs
  require_deploy_node_role backend
  detect_compose_cmd
  set_compose_file backend

  require_numeric BACKEND_HOST_PORT

  log_info "$PREFIX" "Starting mysql and backend services..."
  start_backend_service

  log_info "$PREFIX" "Waiting backend healthy..."
  wait_service_healthy backend "$PREFIX"
  wait_http_ready "http://127.0.0.1:${BACKEND_HOST_PORT}/api/health" "$PREFIX"

  log_info "$PREFIX" "Backend deployment completed."
}

main "$@"
