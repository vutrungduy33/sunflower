#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="nonprod-mock-lane"
DEFAULT_NONPROD_ENV_FILE=".env.nonprod-mock.example"

validate_secret_present_but_not_prod_placeholder() {
  local name="$1"
  local value="${!name:-}"

  require_value "$name"

  case "$value" in
    dev-only-change-me-please|dev-admin-auth-secret-change-me|local-dev-secret|changeme|replace-me|please-change-me*)
      fail "$PREFIX" "${name} must be set to a non-empty non-default value"
      ;;
  esac
}

validate_https_url_shape() {
  local name="$1"
  local value="${!name:-}"

  require_value "$name"
  case "$value" in
    https://*)
      ;;
    *)
      fail "$PREFIX" "${name} must use an https URL, got '${value}'"
      ;;
  esac
}

validate_private_backend_bind() {
  local value="${BACKEND_BIND_HOST:-127.0.0.1}"

  case "$value" in
    127.*|10.*|172.16.*|172.17.*|172.18.*|172.19.*|172.2[0-9].*|172.3[0-1].*|192.168.*|localhost)
      ;;
    *)
      fail "$PREFIX" "BACKEND_BIND_HOST must stay local/private in the non-production mock-payment lane, got '${value}'"
      ;;
  esac
}

main() {
  local lane

  cd "$(project_root)"
  PROD_ENV_FILE="${NONPROD_ENV_FILE:-$DEFAULT_NONPROD_ENV_FILE}"
  export PROD_ENV_FILE
  load_prod_env

  lane="$(printf '%s' "${SUNFLOWER_DEPLOY_LANE:-}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  [ "$lane" = "nonprod-mock-payment" ] || fail "$PREFIX" "SUNFLOWER_DEPLOY_LANE must be nonprod-mock-payment"

  require_deploy_node_role backend
  validate_private_backend_bind

  validate_secret_present_but_not_prod_placeholder AUTH_TOKEN_SECRET
  validate_secret_present_but_not_prod_placeholder ADMIN_AUTH_TOKEN_SECRET

  require_value MYSQL_ROOT_PASSWORD
  require_value MYSQL_DATABASE
  require_value MYSQL_USER
  require_value MYSQL_PASSWORD
  require_numeric AUTH_TOKEN_TTL_SECONDS
  require_numeric ADMIN_AUTH_TOKEN_TTL_SECONDS
  require_numeric MYSQL_HOST_PORT
  require_numeric BACKEND_HOST_PORT

  WECHAT_AUTH_MOCK_ENABLED="$(normalize_bool "${WECHAT_AUTH_MOCK_ENABLED:-false}")"
  WECHAT_MANUAL_PHONE_BIND_ENABLED="$(normalize_bool "${WECHAT_MANUAL_PHONE_BIND_ENABLED:-false}")"
  WECHAT_PAY_MOCK_ENABLED="$(normalize_bool "${WECHAT_PAY_MOCK_ENABLED:-false}")"

  [ "$WECHAT_AUTH_MOCK_ENABLED" = "false" ] || fail "$PREFIX" "WECHAT_AUTH_MOCK_ENABLED must stay false; this lane only mocks payment"
  [ "$WECHAT_MANUAL_PHONE_BIND_ENABLED" = "false" ] || fail "$PREFIX" "WECHAT_MANUAL_PHONE_BIND_ENABLED must stay false; this lane only mocks payment"
  [ "$WECHAT_PAY_MOCK_ENABLED" = "true" ] || fail "$PREFIX" "WECHAT_PAY_MOCK_ENABLED must be true"

  require_value WECHAT_APP_ID
  require_value WECHAT_APP_SECRET
  require_value WECHAT_JSCODE2SESSION_URL
  require_value WECHAT_STABLE_ACCESS_TOKEN_URL
  require_value WECHAT_GET_PHONE_NUMBER_URL
  require_value WECHAT_PAY_MCH_ID
  require_value WECHAT_PAY_MERCHANT_SERIAL_NO
  require_value WECHAT_PAY_PRIVATE_KEY_PATH
  require_value WECHAT_PAY_PUBLIC_KEY_ID
  require_value WECHAT_PAY_PUBLIC_KEY_PATH
  require_value WECHAT_PAY_API_V3_KEY
  validate_https_url_shape WECHAT_PAY_PAYMENT_NOTIFY_URL
  validate_https_url_shape WECHAT_PAY_REFUND_NOTIFY_URL

  if [ "${#WECHAT_PAY_API_V3_KEY}" -ne 32 ]; then
    fail "$PREFIX" "WECHAT_PAY_API_V3_KEY must be 32 characters even when payment is mocked"
  fi

  require_value ADMIN_ACTIVATION_ALLOWLIST
  require_value ADMIN_SMS_PROVIDER
  ADMIN_SMS_PROVIDER="$(printf '%s' "$ADMIN_SMS_PROVIDER" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  [ "$ADMIN_SMS_PROVIDER" = "tencent" ] || fail "$PREFIX" "ADMIN_SMS_PROVIDER must be tencent in this lane"

  log_info "$PREFIX" "non-production mock-payment deploy lane validation passed for ${PROD_ENV_FILE}"
}

main "$@"
