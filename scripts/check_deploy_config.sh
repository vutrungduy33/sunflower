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
    scripts/start_backend_with_mvp_seed.sh
    scripts/start_admin_web.sh
    scripts/check_production_smoke.sh
    scripts/check_backend_8080_exposure.sh
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
  log PASS "deployment Node.js script syntax checked"
}

main() {
  require_command ruby
  require_command docker
  require_command bash
  require_command node

  check_workflow_yaml
  check_compose_rendering
  check_shell_syntax
  check_node_syntax

  log INFO "deploy config checks completed"
}

main "$@"
