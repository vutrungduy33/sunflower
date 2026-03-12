#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADMIN_WEB_HOST_PORT="${ADMIN_WEB_HOST_PORT:-18080}"
BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-8080}"

fail() {
  echo "[deploy-web] ERROR: $*" >&2
  exit 1
}

detect_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
    return
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
    return
  fi
  fail "docker compose is not installed"
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

start_admin_web_service() {
  if [[ -n "${ADMIN_WEB_IMAGE:-}" ]]; then
    echo "[deploy-web] Pulling admin web image from registry: ${ADMIN_WEB_IMAGE}"
    "${COMPOSE_CMD[@]}" pull admin-web
    # Admin-only deploys should reuse the existing backend and never trigger a local backend build.
    "${COMPOSE_CMD[@]}" up -d --no-deps admin-web
    return
  fi

  echo "[deploy-web] Starting admin web service with local build..."
  "${COMPOSE_CMD[@]}" up -d --build --no-deps admin-web
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

  detect_compose_cmd
  cd "$ROOT_DIR"

  echo "[deploy-web] Waiting backend healthy before starting admin web..."
  wait_backend_ready

  echo "[deploy-web] Starting admin web service..."
  start_admin_web_service

  echo "[deploy-web] Waiting admin web healthy..."
  wait_admin_web_ready

  echo "[deploy-web] Admin web startup completed."
}

main "$@"
