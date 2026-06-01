#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pass_count=0

log() {
  local level="$1"
  shift
  echo "[prod-readonly-audit] ${level}: $*"
}

pass() {
  pass_count=$((pass_count + 1))
  log PASS "$*"
}

run_step() {
  local label="$1"
  shift

  log INFO "$label"
  "$@"
  pass "$label"
}

main() {
  log INFO "starting read-only production audit from $ROOT_DIR"
  log INFO "this command checks configuration and runtime health; it does not push, deploy, reload nginx, or change ECS/firewall/security-group state"

  run_step "deploy config static checks" "$ROOT_DIR/scripts/check_deploy_config.sh"
  run_step "production public and ECS internal smoke" env RUN_INTERNAL=1 "$ROOT_DIR/scripts/check_production_smoke.sh"
  run_step "backend 8080 exposure read-only checks" env RUN_INTERNAL=1 "$ROOT_DIR/scripts/check_backend_8080_exposure.sh"

  log INFO "completed ${pass_count} read-only audit step(s)"
}

main "$@"
