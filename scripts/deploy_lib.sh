#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_PROD_ENV_FILE=".env.prod"
DEFAULT_RELEASE_ENV_FILE=".release.env"
REGISTRY_PULL_MAX_ATTEMPTS="${REGISTRY_PULL_MAX_ATTEMPTS:-4}"
REGISTRY_PULL_INITIAL_DELAY_SECONDS="${REGISTRY_PULL_INITIAL_DELAY_SECONDS:-3}"

fail() {
  local prefix="${1:-deploy}"
  shift || true
  echo "[${prefix}] ERROR: $*" >&2
  exit 1
}

log_info() {
  local prefix="$1"
  shift
  echo "[${prefix}] $*"
}

project_root() {
  printf '%s\n' "$ROOT_DIR"
}

resolve_env_files() {
  export PROD_ENV_FILE="${PROD_ENV_FILE:-$DEFAULT_PROD_ENV_FILE}"
  export RELEASE_ENV_FILE="${RELEASE_ENV_FILE:-$DEFAULT_RELEASE_ENV_FILE}"
  PROD_ENV_PATH="$ROOT_DIR/$PROD_ENV_FILE"
  RELEASE_ENV_PATH="$ROOT_DIR/$RELEASE_ENV_FILE"
}

source_env_file() {
  local path="$1"
  [ -f "$path" ] || fail env "missing env file: ${path#$ROOT_DIR/}"

  set -a
  # shellcheck disable=SC1090
  . "$path"
  set +a
}

source_optional_env_file() {
  local path="$1"
  if [ -f "$path" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$path"
    set +a
  fi
}

load_prod_env() {
  resolve_env_files
  source_env_file "$PROD_ENV_PATH"
}

load_runtime_envs() {
  load_prod_env
  source_optional_env_file "$RELEASE_ENV_PATH"
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

  fail compose "docker compose is not installed"
}

compose() {
  "${COMPOSE_CMD[@]}" "$@"
}

pull_service_with_retry() {
  local service="$1"
  local prefix="${2:-deploy}"
  local attempt=1
  local delay="$REGISTRY_PULL_INITIAL_DELAY_SECONDS"

  while true; do
    if compose pull "$service"; then
      return
    fi

    if (( attempt >= REGISTRY_PULL_MAX_ATTEMPTS )); then
      fail "$prefix" "failed to pull '$service' image after ${REGISTRY_PULL_MAX_ATTEMPTS} attempts"
    fi

    log_info "$prefix" "WARN: pull '$service' failed on attempt ${attempt}/${REGISTRY_PULL_MAX_ATTEMPTS}, retrying in ${delay}s..."
    sleep "$delay"
    attempt=$((attempt + 1))
    delay=$((delay * 2))
  done
}

service_container_id() {
  local service="$1"
  local container_id

  container_id="$(compose ps -q "$service" | tail -n 1)"
  [ -n "$container_id" ] || fail deploy "service '$service' is not running"
  printf '%s\n' "$container_id"
}

wait_service_healthy() {
  local service="$1"
  local prefix="$2"
  local attempts="${3:-60}"
  local interval_seconds="${4:-2}"
  local container_id
  local status

  for _ in $(seq 1 "$attempts"); do
    container_id="$(compose ps -q "$service" | tail -n 1)"
    if [ -n "$container_id" ]; then
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
      if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
        return
      fi
    fi
    sleep "$interval_seconds"
  done

  fail "$prefix" "service '$service' did not become healthy"
}

wait_http_ready() {
  local url="$1"
  local prefix="$2"
  local attempts="${3:-40}"
  local interval_seconds="${4:-2}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return
    fi
    sleep "$interval_seconds"
  done

  fail "$prefix" "service endpoint is not ready: $url"
}

seed_demo_data() {
  local seed_sql_file="$1"
  [ -f "$seed_sql_file" ] || fail seed "seed sql file not found: ${seed_sql_file#$ROOT_DIR/}"
  [ -n "${MYSQL_ROOT_PASSWORD:-}" ] || fail seed "MYSQL_ROOT_PASSWORD must be set before seeding"
  [ -n "${MYSQL_DATABASE:-}" ] || fail seed "MYSQL_DATABASE must be set before seeding"

  compose exec -T mysql \
    mysql --default-character-set=utf8mb4 -uroot "-p${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$seed_sql_file"
}

require_value() {
  local name="$1"
  local value="${!name:-}"
  [ -n "$value" ] || fail validate "${name} is required"
}

require_numeric() {
  local name="$1"
  local value="${!name:-}"
  case "$value" in
    ''|*[!0-9]*)
      fail validate "${name} must be numeric, got '${value}'"
      ;;
  esac
}

normalize_bool() {
  local value
  value="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$value" in
    1|true|yes|y|on)
      printf 'true\n'
      ;;
    0|false|no|n|off|'')
      printf 'false\n'
      ;;
    *)
      fail validate "invalid boolean value '${1}'"
      ;;
  esac
}
