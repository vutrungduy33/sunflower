#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_STEP_ATTEMPTS="${AUDIT_STEP_ATTEMPTS:-2}"
AUDIT_STEP_RETRY_DELAY_SECONDS="${AUDIT_STEP_RETRY_DELAY_SECONDS:-3}"

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
  local attempt=1
  shift

  log INFO "$label"
  while true; do
    if "$@"; then
      break
    fi

    if (( attempt >= AUDIT_STEP_ATTEMPTS )); then
      log ERROR "$label failed after ${attempt} attempt(s)" >&2
      exit 1
    fi

    log WARN "$label failed on attempt ${attempt}/${AUDIT_STEP_ATTEMPTS}; retrying in ${AUDIT_STEP_RETRY_DELAY_SECONDS}s"
    sleep "$AUDIT_STEP_RETRY_DELAY_SECONDS"
    attempt=$((attempt + 1))
  done
  pass "$label"
}

main() {
  log INFO "starting read-only production audit from $ROOT_DIR"
  log INFO "this command checks configuration and runtime health; it does not push, deploy, reload nginx, or change ECS/firewall/security-group state"

  run_step "deploy config static checks" "$ROOT_DIR/scripts/check_deploy_config.sh"
  run_step "production public and ECS internal smoke" env RUN_INTERNAL=1 "$ROOT_DIR/scripts/check_production_smoke.sh"
  run_step "backend 8080 exposure read-only checks" env RUN_INTERNAL=1 "$ROOT_DIR/scripts/check_backend_8080_exposure.sh"
  run_step "backend payment config readiness read-only check" env RUN_INTERNAL=1 "$ROOT_DIR/scripts/check_backend_payment_config_readiness.sh"

  log INFO "completed ${pass_count} read-only audit step(s)"
}

main "$@"
