#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="bootstrap-prod"
SEED_SQL_FILE="$(project_root)/scripts/sql/mvp_demo_seed.sql"

main() {
  cd "$(project_root)"
  load_runtime_envs
  DEPLOY_NODE_ROLE="$(normalize_deploy_node_role "${DEPLOY_NODE_ROLE:-}")"
  export DEPLOY_NODE_ROLE
  detect_compose_cmd

  log_info "$PREFIX" "Validating prod env before bootstrap..."
  "$SCRIPT_DIR/validate_prod_env.sh"

  case "$DEPLOY_NODE_ROLE" in
    backend)
      log_info "$PREFIX" "Bootstrapping backend node..."
      "$SCRIPT_DIR/deploy_backend.sh"

      RUN_SEED="$(normalize_bool "${RUN_SEED:-false}")"
      if [ "$RUN_SEED" = "true" ]; then
        log_info "$PREFIX" "Importing MVP demo seed data..."
        seed_demo_data "$SEED_SQL_FILE"
      else
        log_info "$PREFIX" "Skipping demo seed import (RUN_SEED=false)."
      fi
      ;;
    web)
      log_info "$PREFIX" "Bootstrapping web node..."
      "$SCRIPT_DIR/deploy_admin_web.sh"

      log_info "$PREFIX" "Reloading host nginx..."
      "$SCRIPT_DIR/reload_host_nginx.sh"
      ;;
  esac

  log_info "$PREFIX" "Bootstrap completed."
}

main "$@"
