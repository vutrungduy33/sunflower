#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_HOST="${BACKEND_HOST:-47.120.42.15}"
BACKEND_DEPLOY_PATH="${BACKEND_DEPLOY_PATH:-/home/chenyao/sunflower}"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-$ROOT_DIR/.secrets/aliyun_mba_codex.pem}"
RUN_INTERNAL="${RUN_INTERNAL:-0}"
ENFORCE_PAYMENT_CONFIG="${ENFORCE_PAYMENT_CONFIG:-0}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-8}"

pass_count=0
warn_count=0
missing_count=0

log() {
  local level="$1"
  shift
  echo "[payment-config] ${level}: $*"
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

evaluate_remote_output() {
  local output="$1"

  if printf '%s\n' "$output" | grep -Eq '^MISSING '; then
    missing_count="$(printf '%s\n' "$output" | grep -Ec '^MISSING ')"
    printf '%s\n' "$output" | sed -n 's/^MISSING /[payment-config] WARN: missing /p'
  fi

  if printf '%s\n' "$output" | grep -Eq '^MISSING_FILE '; then
    missing_count=$((missing_count + $(printf '%s\n' "$output" | grep -Ec '^MISSING_FILE ')))
    printf '%s\n' "$output" | sed -n 's/^MISSING_FILE /[payment-config] WARN: missing file for /p'
  fi

  if printf '%s\n' "$output" | grep -Eq '^INVALID '; then
    missing_count=$((missing_count + $(printf '%s\n' "$output" | grep -Ec '^INVALID ')))
    printf '%s\n' "$output" | sed -n 's/^INVALID /[payment-config] WARN: invalid /p'
  fi

  if printf '%s\n' "$output" | grep -Fq 'MOCK_ENABLED=true'; then
    warn "WECHAT_PAY_MOCK_ENABLED is true; this is not production payment readiness"
    return
  fi

  if [ "$missing_count" -eq 0 ]; then
    pass "backend WeChat Pay production config looks present without printing secret values"
  else
    warn "backend WeChat Pay production config is incomplete (${missing_count} issue(s))"
  fi
}

check_backend_payment_config() {
  local output

  case "$BACKEND_DEPLOY_PATH" in
    *[![:alnum:]_./~-]*)
      fail "BACKEND_DEPLOY_PATH contains unsupported characters"
      ;;
  esac

  output="$(ssh_cmd "$BACKEND_HOST" "BACKEND_DEPLOY_PATH=$BACKEND_DEPLOY_PATH bash -s" <<'REMOTE'
set -euo pipefail

cd "$BACKEND_DEPLOY_PATH"
if [ ! -f .env.prod ]; then
  echo "MISSING .env.prod"
  exit 0
fi

set -a
# shellcheck disable=SC1091
. ./.env.prod
set +a

check_value() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ]; then
    echo "MISSING $name"
    return
  fi
  case "$value" in
    replace-with-*|example-*|please-change-me*|changeme|replace-me)
      echo "INVALID $name"
      ;;
    *)
      echo "PRESENT $name"
      ;;
  esac
}

check_file() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ]; then
    echo "MISSING $name"
    return
  fi
  if [ -f "$value" ]; then
    echo "PRESENT_FILE $name"
  else
    echo "MISSING_FILE $name"
  fi
}

mock_enabled="$(printf '%s' "${WECHAT_PAY_MOCK_ENABLED:-false}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
echo "MOCK_ENABLED=$mock_enabled"

check_value WECHAT_PAY_MCH_ID
check_value WECHAT_PAY_MERCHANT_SERIAL_NO
check_file WECHAT_PAY_PRIVATE_KEY_PATH
check_value WECHAT_PAY_PUBLIC_KEY_ID
check_file WECHAT_PAY_PUBLIC_KEY_PATH
check_value WECHAT_PAY_API_V3_KEY

api_v3_key="${WECHAT_PAY_API_V3_KEY:-}"
if [ -n "$api_v3_key" ] && [ "${#api_v3_key}" -ne 32 ]; then
  echo "INVALID WECHAT_PAY_API_V3_KEY_LENGTH"
fi

case "${WECHAT_PAY_PAYMENT_NOTIFY_URL:-}" in
  https://*example.com*|*localhost*|*127.0.0.1*|"")
    echo "INVALID WECHAT_PAY_PAYMENT_NOTIFY_URL"
    ;;
  https://*)
    echo "PRESENT WECHAT_PAY_PAYMENT_NOTIFY_URL"
    ;;
  *)
    echo "INVALID WECHAT_PAY_PAYMENT_NOTIFY_URL"
    ;;
esac

case "${WECHAT_PAY_REFUND_NOTIFY_URL:-}" in
  https://*example.com*|*localhost*|*127.0.0.1*|"")
    echo "INVALID WECHAT_PAY_REFUND_NOTIFY_URL"
    ;;
  https://*)
    echo "PRESENT WECHAT_PAY_REFUND_NOTIFY_URL"
    ;;
  *)
    echo "INVALID WECHAT_PAY_REFUND_NOTIFY_URL"
    ;;
esac
REMOTE
  )" || fail "backend payment config SSH check failed"

  evaluate_remote_output "$output"
}

main() {
  log INFO "checking backend payment config readiness without printing secret values"

  if [ "$(normalize_bool "$RUN_INTERNAL")" != "1" ]; then
    warn "internal ECS payment config inspection skipped; set RUN_INTERNAL=1 to check backend .env.prod"
    log INFO "completed with ${pass_count} pass(es), ${warn_count} warning(s)"
    return
  fi

  check_backend_payment_config

  if [ "$missing_count" -gt 0 ] && [ "$(normalize_bool "$ENFORCE_PAYMENT_CONFIG")" = "1" ]; then
    fail "backend payment config is incomplete and ENFORCE_PAYMENT_CONFIG=1"
  fi

  log INFO "completed with ${pass_count} pass(es), ${warn_count} warning(s), ${missing_count} issue(s)"
}

main "$@"
