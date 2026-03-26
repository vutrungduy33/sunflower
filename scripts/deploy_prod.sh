#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="deploy-prod"

resolve_target() {
  local requested="${1:-${DEPLOY_TARGET:-auto}}"

  case "$requested" in
    auto)
      if [ -n "${BACKEND_IMAGE:-}" ] && [ -n "${ADMIN_WEB_IMAGE:-}" ]; then
        printf 'all\n'
      elif [ -n "${BACKEND_IMAGE:-}" ]; then
        printf 'backend\n'
      elif [ -n "${ADMIN_WEB_IMAGE:-}" ]; then
        printf 'admin-web\n'
      else
        printf 'nginx\n'
      fi
      ;;
    backend|admin-web|nginx|all)
      printf '%s\n' "$requested"
      ;;
    bootstrap)
      fail "$PREFIX" "bootstrap target must use scripts/bootstrap_prod.sh"
      ;;
    *)
      fail "$PREFIX" "unsupported deploy target: $requested"
      ;;
  esac
}

main() {
  cd "$(project_root)"
  load_runtime_envs

  target="$(resolve_target "${1:-}")"
  log_info "$PREFIX" "Resolved deploy target: ${target}"

  case "$target" in
    backend)
      "$SCRIPT_DIR/deploy_backend.sh"
      ;;
    admin-web)
      "$SCRIPT_DIR/deploy_admin_web.sh"
      ;;
    nginx)
      ;;
    all)
      "$SCRIPT_DIR/deploy_backend.sh"
      "$SCRIPT_DIR/deploy_admin_web.sh"
      ;;
  esac

  "$SCRIPT_DIR/reload_host_nginx.sh"
  log_info "$PREFIX" "Deploy target '${target}' completed."
}

main "$@"
