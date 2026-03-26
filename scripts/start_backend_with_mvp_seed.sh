#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_SQL_FILE="$(cd "$SCRIPT_DIR/.." && pwd)/scripts/sql/mvp_demo_seed.sql"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="deploy-seed"

main() {
  cd "$(project_root)"
  load_runtime_envs
  detect_compose_cmd

  "$SCRIPT_DIR/deploy_backend.sh"

  log_info "$PREFIX" "Seeding MVP demo data..."
  seed_demo_data "$SEED_SQL_FILE"
  log_info "$PREFIX" "Seed completed."
}

main "$@"
