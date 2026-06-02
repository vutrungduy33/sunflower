#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-http://47.113.223.248}"
BACKEND_PUBLIC_BASE_URL="${BACKEND_PUBLIC_BASE_URL:-http://47.120.42.15:8080}"
WEB_HOST="${WEB_HOST:-47.113.223.248}"
BACKEND_HOST="${BACKEND_HOST:-47.120.42.15}"
BACKEND_PRIVATE_BASE_URL="${BACKEND_PRIVATE_BASE_URL:-http://172.25.121.83:8080}"
WEB_ADMIN_HEALTH_URL="${WEB_ADMIN_HEALTH_URL:-http://127.0.0.1:18080/healthz}"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-$ROOT_DIR/.secrets/aliyun_mba_codex.pem}"
RUN_INTERNAL="${RUN_INTERNAL:-0}"
ENFORCE_BACKEND_PRIVATE="${ENFORCE_BACKEND_PRIVATE:-0}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-8}"
CURL_MAX_TIME="${CURL_MAX_TIME:-15}"

pass_count=0
warn_count=0

log() {
  local level="$1"
  shift
  echo "[prod-smoke] ${level}: $*"
}

pass() {
  pass_count=$((pass_count + 1))
  log PASS "$*"
}

warn() {
  warn_count=$((warn_count + 1))
  log WARN "$*"
}

fail() {
  log ERROR "$*" >&2
  exit 1
}

normalize_bool() {
  local value
  value="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$value" in
    1|true|yes|y|on)
      printf '1'
      ;;
    *)
      printf '0'
      ;;
  esac
}

curl_body() {
  local url="$1"
  curl -fsS \
    --connect-timeout "$CURL_CONNECT_TIMEOUT" \
    --max-time "$CURL_MAX_TIME" \
    "$url"
}

curl_head() {
  local url="$1"
  curl -fsSI \
    --connect-timeout "$CURL_CONNECT_TIMEOUT" \
    --max-time "$CURL_MAX_TIME" \
    "$url"
}

require_body_contains() {
  local url="$1"
  local needle="$2"
  local label="$3"
  local body

  if ! body="$(curl_body "$url")"; then
    fail "$label failed: $url"
  fi

  if ! printf '%s' "$body" | grep -Fq "$needle"; then
    fail "$label response did not contain '$needle'"
  fi

  pass "$label"
}

require_head_ok() {
  local url="$1"
  local label="$2"
  local headers

  if ! headers="$(curl_head "$url")"; then
    fail "$label failed: $url"
  fi

  if ! printf '%s' "$headers" | grep -Eq '^HTTP/[0-9.]+ 200'; then
    fail "$label did not return HTTP 200"
  fi

  pass "$label"
}

probe_backend_public() {
  local url="${BACKEND_PUBLIC_BASE_URL%/}/api/health"
  local body
  local status=0

  body="$(curl_body "$url" 2>&1)" || status=$?
  if [ "$status" -eq 0 ] && printf '%s' "$body" | grep -Fq '"status":"UP"'; then
    if [ "$(normalize_bool "$ENFORCE_BACKEND_PRIVATE")" = "1" ]; then
      fail "backend public endpoint is reachable but ENFORCE_BACKEND_PRIVATE=1: $url"
    fi
    warn "backend public endpoint is reachable; restrict 8080 to ECS-1 before launch: $url"
    return
  fi

  pass "backend public endpoint is not directly usable from this network"
}

ssh_cmd() {
  local host="$1"
  shift

  [ -f "$SSH_KEY" ] || fail "SSH key not found: $SSH_KEY"

  ssh -i "$SSH_KEY" \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout="$CURL_CONNECT_TIMEOUT" \
    "${SSH_USER}@${host}" "$@"
}

run_internal_smoke() {
  local web_output
  local backend_output

  web_output="$(ssh_cmd "$WEB_HOST" "
    set -e
    systemctl is-active nginx
    docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep -F 'sunflower-admin-web'
    curl -fsS '$WEB_ADMIN_HEALTH_URL'
    curl -fsS '${BACKEND_PRIVATE_BASE_URL%/}/api/health'
  ")" || fail "ECS-1 internal smoke failed"

  printf '%s\n' "$web_output" | grep -Fq 'active' || fail "ECS-1 nginx is not active"
  printf '%s\n' "$web_output" | grep -Fq 'sunflower-admin-web' || fail "ECS-1 admin-web container not found"
  printf '%s\n' "$web_output" | grep -Fq '"status":"UP"' || fail "ECS-1 cannot reach backend private health"
  pass "ECS-1 nginx/admin-web/private backend smoke"

  backend_output="$(ssh_cmd "$BACKEND_HOST" "
    set -e
    docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep -E 'sunflower-(backend|mysql)'
    curl -fsS '${BACKEND_PRIVATE_BASE_URL%/}/api/health'
    ss -ltnp | grep -E ':(8080|3306)' || true
  ")" || fail "ECS-2 internal smoke failed"

  printf '%s\n' "$backend_output" | grep -Fq 'sunflower-backend' || fail "ECS-2 backend container not found"
  printf '%s\n' "$backend_output" | grep -Fq 'sunflower-mysql' || fail "ECS-2 mysql container not found"
  printf '%s\n' "$backend_output" | grep -Fq '"status":"UP"' || fail "ECS-2 private backend health failed"
  pass "ECS-2 backend/mysql/private health smoke"

  if printf '%s\n' "$backend_output" | grep -Fq '0.0.0.0:8080'; then
    warn "ECS-2 backend still listens on 0.0.0.0:8080; rely on security group/firewall restriction before launch"
  fi
}

main() {
  log INFO "public base: $PUBLIC_BASE_URL"

  require_body_contains "${PUBLIC_BASE_URL%/}/api/health" '"status":"UP"' "public API health"
  require_body_contains "${PUBLIC_BASE_URL%/}/api/content/home" '"banners"' "public home content"
  require_body_contains "${PUBLIC_BASE_URL%/}/healthz" 'ok' "admin-web container healthz through ingress"
  require_head_ok "${PUBLIC_BASE_URL%/}/" "admin web HTML through ingress"
  probe_backend_public

  if [ "$(normalize_bool "$RUN_INTERNAL")" = "1" ]; then
    run_internal_smoke
  else
    warn "internal ECS smoke skipped; set RUN_INTERNAL=1 to check Nginx/container/private upstream via SSH"
  fi

  log INFO "completed with ${pass_count} pass(es), ${warn_count} warning(s)"
}

main "$@"
