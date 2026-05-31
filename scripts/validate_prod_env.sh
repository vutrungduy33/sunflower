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

validate_not_placeholder_domain() {
  local name="$1"
  local value="${!name:-}"

  require_value "$name"

  case "$value" in
    admin.example.com|example.com|*.example.com)
      fail validate "${name} must use a real domain, got placeholder value '${value}'"
      ;;
  esac
}

validate_https_url() {
  local name="$1"
  local value="${!name:-}"

  require_value "$name"

  case "$value" in
    https://*)
      ;;
    *)
      fail validate "${name} must use an https URL, got '${value}'"
      ;;
  esac

  case "$value" in
    *example.com*|*localhost*|*127.0.0.1*)
      fail validate "${name} must use a real public URL, got '${value}'"
      ;;
  esac
}

main() {
  cd "$(project_root)"
  load_prod_env
  DEPLOY_NODE_ROLE="$(normalize_deploy_node_role "${DEPLOY_NODE_ROLE:-}")"
  export DEPLOY_NODE_ROLE

  HOST_NGINX_ENABLED="$(normalize_bool "${HOST_NGINX_ENABLED:-true}")"

  case "$DEPLOY_NODE_ROLE" in
    backend)
      validate_secret_not_placeholder AUTH_TOKEN_SECRET
      validate_secret_not_placeholder ADMIN_AUTH_TOKEN_SECRET

      require_value MYSQL_ROOT_PASSWORD
      require_value MYSQL_DATABASE
      require_value MYSQL_USER
      require_value MYSQL_PASSWORD
      require_value ADMIN_ACTIVATION_ALLOWLIST
      require_value ADMIN_SMS_PROVIDER

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

      WECHAT_AUTH_MOCK_ENABLED="$(normalize_bool "${WECHAT_AUTH_MOCK_ENABLED:-false}")"
      WECHAT_MANUAL_PHONE_BIND_ENABLED="$(normalize_bool "${WECHAT_MANUAL_PHONE_BIND_ENABLED:-false}")"
      WECHAT_PAY_MOCK_ENABLED="$(normalize_bool "${WECHAT_PAY_MOCK_ENABLED:-false}")"

      if [ "$WECHAT_AUTH_MOCK_ENABLED" != "false" ]; then
        fail validate "WECHAT_AUTH_MOCK_ENABLED must be false in prod"
      fi

      if [ "$WECHAT_MANUAL_PHONE_BIND_ENABLED" != "false" ]; then
        fail validate "WECHAT_MANUAL_PHONE_BIND_ENABLED must be false in prod"
      fi

      if [ "$WECHAT_PAY_MOCK_ENABLED" != "false" ]; then
        fail validate "WECHAT_PAY_MOCK_ENABLED must be false in prod"
      fi

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
      validate_https_url WECHAT_PAY_PAYMENT_NOTIFY_URL
      validate_https_url WECHAT_PAY_REFUND_NOTIFY_URL

      [ -f "$WECHAT_PAY_PRIVATE_KEY_PATH" ] || fail validate "WECHAT_PAY_PRIVATE_KEY_PATH file not found: ${WECHAT_PAY_PRIVATE_KEY_PATH}"
      [ -f "$WECHAT_PAY_PUBLIC_KEY_PATH" ] || fail validate "WECHAT_PAY_PUBLIC_KEY_PATH file not found: ${WECHAT_PAY_PUBLIC_KEY_PATH}"

      if [ "${#WECHAT_PAY_API_V3_KEY}" -ne 32 ]; then
        fail validate "WECHAT_PAY_API_V3_KEY must be 32 characters"
      fi

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
      ;;
    web)
      require_numeric ADMIN_WEB_HOST_PORT
      require_value BACKEND_UPSTREAM_HOST
      require_numeric BACKEND_UPSTREAM_PORT

      if [ "$HOST_NGINX_ENABLED" = "true" ]; then
        require_value HOST_NGINX_SITE_NAME
        validate_not_placeholder_domain HOST_NGINX_ADMIN_SERVER_NAME
        validate_not_placeholder_domain HOST_NGINX_API_SERVER_NAME
        require_value HOST_NGINX_ADMIN_TLS_CERT_PATH
        require_value HOST_NGINX_ADMIN_TLS_KEY_PATH
        require_value HOST_NGINX_API_TLS_CERT_PATH
        require_value HOST_NGINX_API_TLS_KEY_PATH

        [ -f "$HOST_NGINX_ADMIN_TLS_CERT_PATH" ] || fail validate "HOST_NGINX_ADMIN_TLS_CERT_PATH file not found: ${HOST_NGINX_ADMIN_TLS_CERT_PATH}"
        [ -f "$HOST_NGINX_ADMIN_TLS_KEY_PATH" ] || fail validate "HOST_NGINX_ADMIN_TLS_KEY_PATH file not found: ${HOST_NGINX_ADMIN_TLS_KEY_PATH}"
        [ -f "$HOST_NGINX_API_TLS_CERT_PATH" ] || fail validate "HOST_NGINX_API_TLS_CERT_PATH file not found: ${HOST_NGINX_API_TLS_CERT_PATH}"
        [ -f "$HOST_NGINX_API_TLS_KEY_PATH" ] || fail validate "HOST_NGINX_API_TLS_KEY_PATH file not found: ${HOST_NGINX_API_TLS_KEY_PATH}"
      fi
      ;;
  esac

  log_info validate "prod env validation passed for ${PROD_ENV_FILE}"
}

main "$@"
