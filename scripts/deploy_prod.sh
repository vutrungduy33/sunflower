#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="deploy-prod"

resolve_target() {
  local requested="${1:-${DEPLOY_TARGET:-auto}}"
  local role="${DEPLOY_NODE_ROLE:-}"

  case "$requested" in
    auto)
      case "$role" in
        backend)
          if [ -n "${BACKEND_IMAGE:-}" ]; then
            printf 'backend\n'
          else
            fail "$PREFIX" "backend host cannot resolve auto target without BACKEND_IMAGE"
          fi
          ;;
        web)
          if [ -n "${ADMIN_WEB_IMAGE:-}" ]; then
            printf 'all\n'
          else
            printf 'nginx\n'
          fi
          ;;
        *)
          fail "$PREFIX" "unsupported DEPLOY_NODE_ROLE for auto target: ${role}"
          ;;
      esac
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
  DEPLOY_NODE_ROLE="$(normalize_deploy_node_role "${DEPLOY_NODE_ROLE:-}")"
  export DEPLOY_NODE_ROLE

  target="$(resolve_target "${1:-}")"
  log_info "$PREFIX" "Resolved deploy target: ${target} for role ${DEPLOY_NODE_ROLE}"

  case "$DEPLOY_NODE_ROLE" in
    backend)
      case "$target" in
        backend|all)
          "$SCRIPT_DIR/deploy_backend.sh"
          ;;
        *)
          fail "$PREFIX" "backend host only supports targets: backend, all"
          ;;
      esac
      ;;
    web)
      case "$target" in
        admin-web)
          "$SCRIPT_DIR/deploy_admin_web.sh"
          ;;
        nginx)
          ;;
        all)
          "$SCRIPT_DIR/deploy_admin_web.sh"
          ;;
        *)
          fail "$PREFIX" "web host only supports targets: admin-web, nginx, all"
          ;;
      esac

      if [ "$target" = "nginx" ] || [ "$target" = "all" ]; then
        "$SCRIPT_DIR/reload_host_nginx.sh"
      fi
      ;;
  esac

  log_info "$PREFIX" "Deploy target '${target}' completed."
}

main "$@"
