#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_PUBLIC_BASE_URL="${BACKEND_PUBLIC_BASE_URL:-http://47.120.42.15:8080}"
BACKEND_PRIVATE_BASE_URL="${BACKEND_PRIVATE_BASE_URL:-http://172.25.121.83:8080}"
WEB_HOST="${WEB_HOST:-47.113.223.248}"
BACKEND_HOST="${BACKEND_HOST:-47.120.42.15}"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-$ROOT_DIR/.secrets/aliyun_mba_codex.pem}"
RUN_INTERNAL="${RUN_INTERNAL:-0}"
ENFORCE_RESTRICTED="${ENFORCE_RESTRICTED:-0}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-8}"
CURL_MAX_TIME="${CURL_MAX_TIME:-15}"

pass_count=0
warn_count=0

log() {
  local level="$1"
  shift
  echo "[backend-8080] ${level}: $*"
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

probe_backend_public() {
  local url="${BACKEND_PUBLIC_BASE_URL%/}/api/health"
  local output
  local status=0

  output="$(curl_body "$url" 2>&1)" || status=$?
  if [ "$status" -eq 0 ] && printf '%s' "$output" | grep -Fq '"status":"UP"'; then
    if [ "$(normalize_bool "$ENFORCE_RESTRICTED")" = "1" ]; then
      fail "backend public 8080 is reachable but ENFORCE_RESTRICTED=1: $url"
    fi
    warn "backend public 8080 is reachable from this network: $url"
    return
  fi

  pass "backend public 8080 is not directly usable from this network"
}

run_internal_readonly_checks() {
  local web_output
  local backend_output

  web_output="$(ssh_cmd "$WEB_HOST" "
    set -e
    curl -fsS '${BACKEND_PRIVATE_BASE_URL%/}/api/health'
  ")" || fail "ECS-1 cannot reach backend private upstream"

  printf '%s\n' "$web_output" | grep -Fq '"status":"UP"' || fail "ECS-1 private backend health response is not UP"
  pass "ECS-1 can reach backend through private upstream"

  backend_output="$(ssh_cmd "$BACKEND_HOST" "
    set -e
    echo '--- docker ps ---'
    docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep -E 'sunflower-(backend|mysql)'
    echo '--- local health ---'
    curl -fsS http://127.0.0.1:8080/api/health
    echo '--- listeners ---'
    ss -ltnp | grep -E ':(8080|3306)' || true
    echo '--- ufw ---'
    if command -v ufw >/dev/null 2>&1; then ufw status || true; else echo 'ufw not installed'; fi
    echo '--- iptables 8080 ---'
    if command -v iptables >/dev/null 2>&1; then iptables -S | grep -E '(8080|172\\.25\\.121\\.84)' || true; else echo 'iptables not installed'; fi
  ")" || fail "ECS-2 read-only backend 8080 inspection failed"

  printf '%s\n' "$backend_output" | grep -Fq 'sunflower-backend' || fail "ECS-2 backend container not found"
  printf '%s\n' "$backend_output" | grep -Fq '"status":"UP"' || fail "ECS-2 local backend health is not UP"
  pass "ECS-2 backend container and local health are present"

  if printf '%s\n' "$backend_output" | grep -Fq '0.0.0.0:8080'; then
    warn "ECS-2 docker-proxy still listens on 0.0.0.0:8080; external restriction must be proven by security group/firewall evidence"
  else
    pass "ECS-2 backend 8080 is not shown as 0.0.0.0 in listener output"
  fi

  if printf '%s\n' "$backend_output" | grep -Eq '172\.25\.121\.84|DROP|REJECT'; then
    pass "ECS-2 local firewall output includes possible restriction evidence"
  else
    warn "ECS-2 local firewall output did not prove 8080 restriction; Alibaba Cloud security group evidence is still required"
  fi
}

main() {
  log INFO "public backend probe: ${BACKEND_PUBLIC_BASE_URL%/}/api/health"
  probe_backend_public

  if [ "$(normalize_bool "$RUN_INTERNAL")" = "1" ]; then
    run_internal_readonly_checks
  else
    warn "internal SSH inspection skipped; set RUN_INTERNAL=1 to inspect ECS listeners and private upstream"
  fi

  log INFO "completed with ${pass_count} pass(es), ${warn_count} warning(s)"
}

main "$@"
