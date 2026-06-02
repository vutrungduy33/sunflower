#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="${TMPDIR:-/tmp}"
BACKEND_COMPOSE_OUT="${TMP_DIR%/}/sunflower-backend-compose-config.yml"
WEB_COMPOSE_OUT="${TMP_DIR%/}/sunflower-web-compose-config.yml"

log() {
  local level="$1"
  shift
  echo "[deploy-config] ${level}: $*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log ERROR "required command not found: $1"
    exit 1
  fi
}

check_workflow_yaml() {
  log INFO "checking GitHub Actions deployment workflow YAML"
  ruby -e 'require "yaml"; YAML.load_file(ARGV.fetch(0))' \
    "$ROOT_DIR/.github/workflows/deploy-backend.yml"
  log PASS "deployment workflow YAML parsed"
}

check_compose_rendering() {
  log INFO "rendering backend compose with example env"
  docker compose \
    -f "$ROOT_DIR/docker-compose.backend.yml" \
    --env-file "$ROOT_DIR/.env.prod.example" \
    config >"$BACKEND_COMPOSE_OUT"
  log PASS "backend compose rendered"

  log INFO "rendering web compose with example env"
  docker compose \
    -f "$ROOT_DIR/docker-compose.web.yml" \
    --env-file "$ROOT_DIR/.env.prod.web.example" \
    config >"$WEB_COMPOSE_OUT"
  log PASS "web compose rendered"
}

check_shell_syntax() {
  local scripts=(
    scripts/deploy_lib.sh
    scripts/validate_prod_env.sh
    scripts/deploy_backend.sh
    scripts/deploy_admin_web.sh
    scripts/bootstrap_prod.sh
    scripts/deploy_prod.sh
    scripts/reload_host_nginx.sh
    scripts/sync_deploy_bundle.sh
    scripts/execute_runner_deploy.sh
    scripts/test_execute_runner_deploy_release_env.sh
    scripts/start_backend_with_mvp_seed.sh
    scripts/start_admin_web.sh
    scripts/check_production_smoke.sh
    scripts/check_backend_8080_exposure.sh
    scripts/check_backend_payment_config_readiness.sh
    scripts/check_ecs_runner_github_connectivity.sh
    scripts/check_nonprod_mock_payment_deploy_lane.sh
    scripts/dispatch_nonprod_mock_payment_deploy.sh
    scripts/check_production_readonly_audit.sh
  )

  log INFO "checking deployment shell syntax"
  (
    cd "$ROOT_DIR"
    bash -n "${scripts[@]}"
  )
  log PASS "deployment shell syntax checked"
}

check_node_syntax() {
  log INFO "checking deployment Node.js script syntax"
  node --check "$ROOT_DIR/scripts/check_deployment_approval_preflight.js"
  node --check "$ROOT_DIR/scripts/check_workflow_dispatch_lane_matrix.js"
  node --check "$ROOT_DIR/scripts/check_nonprod_dispatch_readiness.js"
  log PASS "deployment Node.js script syntax checked"
}

check_runner_deploy_release_metadata() {
  log INFO "checking runner deploy release metadata failure behavior"
  bash "$ROOT_DIR/scripts/test_execute_runner_deploy_release_env.sh"
  log PASS "runner deploy release metadata failure behavior checked"
}

check_workflow_dispatch_lane_matrix() {
  log INFO "checking workflow dispatch deployment lane matrix"
  node "$ROOT_DIR/scripts/check_workflow_dispatch_lane_matrix.js"
  log PASS "workflow dispatch deployment lane matrix checked"
}

check_nonprod_dispatch_readiness() {
  log INFO "checking non-production dispatch readiness"
  ALLOW_DIRTY=1 node "$ROOT_DIR/scripts/check_nonprod_dispatch_readiness.js"
  log PASS "non-production dispatch readiness checked"
}

check_nonprod_dispatch_helper() {
  log INFO "checking non-production mock-payment dispatch helper dry-run"
  ALLOW_DIRTY=1 "$ROOT_DIR/scripts/dispatch_nonprod_mock_payment_deploy.sh" --dry-run >/dev/null
  log PASS "non-production mock-payment dispatch helper dry-run checked"
}

check_nonprod_mock_payment_lane() {
  log INFO "checking non-production mock-payment deploy lane example"
  bash "$ROOT_DIR/scripts/check_nonprod_mock_payment_deploy_lane.sh"
  log PASS "non-production mock-payment deploy lane example checked"
}

main() {
  require_command ruby
  require_command docker
  require_command bash
  require_command node

  check_workflow_yaml
  check_compose_rendering
  check_shell_syntax
  check_nonprod_mock_payment_lane
  check_runner_deploy_release_metadata
  check_workflow_dispatch_lane_matrix
  check_nonprod_dispatch_readiness
  check_nonprod_dispatch_helper
  check_node_syntax

  log INFO "deploy config checks completed"
}

main "$@"
