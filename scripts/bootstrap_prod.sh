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
  detect_compose_cmd

  log_info "$PREFIX" "Validating prod env before bootstrap..."
  "$SCRIPT_DIR/validate_prod_env.sh"

  log_info "$PREFIX" "Bootstrapping backend..."
  "$SCRIPT_DIR/deploy_backend.sh"

  RUN_SEED="$(normalize_bool "${RUN_SEED:-false}")"
  if [ "$RUN_SEED" = "true" ]; then
    log_info "$PREFIX" "Importing MVP demo seed data..."
    seed_demo_data "$SEED_SQL_FILE"
  else
    log_info "$PREFIX" "Skipping demo seed import (RUN_SEED=false)."
  fi

  log_info "$PREFIX" "Bootstrapping admin web..."
  "$SCRIPT_DIR/deploy_admin_web.sh"

  log_info "$PREFIX" "Reloading host nginx..."
  "$SCRIPT_DIR/reload_host_nginx.sh"

  log_info "$PREFIX" "Bootstrap completed."
}

main "$@"
