#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EDGE_GATEWAY_HTTP_PORT="${EDGE_GATEWAY_HTTP_PORT:-80}"
BACKEND_HOST_PORT="${BACKEND_HOST_PORT:-8080}"
ADMIN_WEB_HOST_PORT="${ADMIN_WEB_HOST_PORT:-18080}"

fail() {
  echo "[deploy-gateway] ERROR: $*" >&2
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

wait_gateway_ready() {
  for _ in $(seq 1 40); do
    if curl -fsS "http://127.0.0.1:${EDGE_GATEWAY_HTTP_PORT}/healthz" >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  fail "edge gateway is not ready on http://127.0.0.1:${EDGE_GATEWAY_HTTP_PORT}/healthz"
}

main() {
  case "$EDGE_GATEWAY_HTTP_PORT" in
    ''|*[!0-9]*)
      fail "EDGE_GATEWAY_HTTP_PORT must be numeric, got '$EDGE_GATEWAY_HTTP_PORT'"
      ;;
  esac

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

  echo "[deploy-gateway] Waiting backend healthy before starting gateway..."
  wait_backend_ready

  echo "[deploy-gateway] Waiting admin web healthy before starting gateway..."
  wait_admin_web_ready

  echo "[deploy-gateway] Starting edge gateway..."
  "${COMPOSE_CMD[@]}" up -d edge-gateway

  echo "[deploy-gateway] Waiting edge gateway healthy..."
  wait_gateway_ready

  echo "[deploy-gateway] Edge gateway startup completed."
}

main "$@"
