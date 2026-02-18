#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED_SQL_FILE="$ROOT_DIR/scripts/sql/mvp_demo_seed.sql"
MYSQL_CONTAINER_NAME="${MYSQL_CONTAINER_NAME:-sunflower-mysql}"

fail() {
  echo "[deploy-seed] ERROR: $*" >&2
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

wait_mysql_ready() {
  for _ in $(seq 1 40); do
    if docker exec "$MYSQL_CONTAINER_NAME" mysqladmin ping -h 127.0.0.1 -uroot -proot >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  fail "mysql container is not ready: $MYSQL_CONTAINER_NAME"
}

wait_backend_ready() {
  for _ in $(seq 1 40); do
    if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  fail "backend is not ready on http://127.0.0.1:8080/api/health"
}

seed_demo_data() {
  docker exec -i "$MYSQL_CONTAINER_NAME" \
    mysql --default-character-set=utf8mb4 -uroot -proot sunflower < "$SEED_SQL_FILE"
}

main() {
  [[ -f "$SEED_SQL_FILE" ]] || fail "seed sql file not found: $SEED_SQL_FILE"

  detect_compose_cmd
  cd "$ROOT_DIR"

  echo "[deploy-seed] Starting mysql service..."
  "${COMPOSE_CMD[@]}" up -d mysql

  echo "[deploy-seed] Waiting mysql healthy..."
  wait_mysql_ready

  echo "[deploy-seed] Starting backend service (runs Flyway migrations)..."
  "${COMPOSE_CMD[@]}" up -d --build backend

  echo "[deploy-seed] Waiting backend healthy..."
  wait_backend_ready

  echo "[deploy-seed] Seeding MVP demo data..."
  seed_demo_data

  echo "[deploy-seed] Seed completed."
}

main "$@"
