#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

validate_secret_not_placeholder() {
  local name="$1"
  local value="${!name:-}"

  require_value "$name"

  case "$value" in
    dev-only-change-me-please|dev-admin-auth-secret-change-me|local-dev-secret|changeme|replace-me|replace-with-*|example-*|please-change-me*)
      fail validate "${name} must use a production secret, got placeholder value"
      ;;
  esac
}

main() {
  cd "$(project_root)"
  load_prod_env

  validate_secret_not_placeholder AUTH_TOKEN_SECRET
  validate_secret_not_placeholder ADMIN_AUTH_TOKEN_SECRET

  require_value MYSQL_ROOT_PASSWORD
  require_value MYSQL_DATABASE
  require_value MYSQL_USER
  require_value MYSQL_PASSWORD
  require_value ADMIN_ACTIVATION_ALLOWLIST
  require_value ADMIN_SMS_PROVIDER
  require_value HOST_NGINX_SITE_NAME
  require_value HOST_NGINX_SERVER_NAME
  require_value HOST_NGINX_TLS_CERT_PATH
  require_value HOST_NGINX_TLS_KEY_PATH

  require_numeric AUTH_TOKEN_TTL_SECONDS
  require_numeric ADMIN_AUTH_TOKEN_TTL_SECONDS
  require_numeric ADMIN_SMS_CODE_LENGTH
  require_numeric ADMIN_SMS_CODE_TTL_SECONDS
  require_numeric ADMIN_SMS_RESEND_COOLDOWN_SECONDS
  require_numeric ADMIN_SMS_HOURLY_SEND_LIMIT
  require_numeric ADMIN_SMS_DAILY_SEND_LIMIT
  require_numeric ADMIN_SMS_MAX_VERIFY_ATTEMPTS
  require_numeric ADMIN_LOGIN_FAILURE_LIMIT
  require_numeric ADMIN_LOGIN_LOCK_SECONDS
  require_numeric MYSQL_HOST_PORT
  require_numeric BACKEND_HOST_PORT
  require_numeric ADMIN_WEB_HOST_PORT

  WECHAT_AUTH_MOCK_ENABLED="$(normalize_bool "${WECHAT_AUTH_MOCK_ENABLED:-false}")"
  WECHAT_MANUAL_PHONE_BIND_ENABLED="$(normalize_bool "${WECHAT_MANUAL_PHONE_BIND_ENABLED:-false}")"

  if [ "$WECHAT_AUTH_MOCK_ENABLED" != "false" ]; then
    fail validate "WECHAT_AUTH_MOCK_ENABLED must be false in prod"
  fi

  if [ "$WECHAT_MANUAL_PHONE_BIND_ENABLED" != "false" ]; then
    fail validate "WECHAT_MANUAL_PHONE_BIND_ENABLED must be false in prod"
  fi

  require_value WECHAT_APP_ID
  require_value WECHAT_APP_SECRET
  require_value WECHAT_JSCODE2SESSION_URL
  require_value WECHAT_STABLE_ACCESS_TOKEN_URL
  require_value WECHAT_GET_PHONE_NUMBER_URL

  ADMIN_SMS_PROVIDER="$(printf '%s' "$ADMIN_SMS_PROVIDER" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$ADMIN_SMS_PROVIDER" in
    tencent)
      require_value TENCENT_SMS_SECRET_ID
      require_value TENCENT_SMS_SECRET_KEY
      require_value TENCENT_SMS_REGION
      require_value TENCENT_SMS_SDK_APP_ID
      require_value TENCENT_SMS_SIGN_NAME
      require_value TENCENT_SMS_TEMPLATE_ID_ACTIVATE
      require_value TENCENT_SMS_TEMPLATE_ID_RESET_PASSWORD
      ;;
    *)
      fail validate "ADMIN_SMS_PROVIDER must be 'tencent' in prod, got '${ADMIN_SMS_PROVIDER}'"
      ;;
  esac

  case "$ADMIN_ACTIVATION_ALLOWLIST" in
    *:admin*|*:operator*)
      ;;
    *)
      fail validate "ADMIN_ACTIVATION_ALLOWLIST must use '手机号:角色' entries separated by commas"
      ;;
  esac

  log_info validate "prod env validation passed for ${PROD_ENV_FILE}"
}

main "$@"
