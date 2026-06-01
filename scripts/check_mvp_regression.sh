#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_BACKEND="${RUN_BACKEND:-1}"
RUN_ADMIN="${RUN_ADMIN:-1}"
RUN_MINIAPP="${RUN_MINIAPP:-1}"
RUN_EVIDENCE="${RUN_EVIDENCE:-1}"
RUN_PRODUCTION="${RUN_PRODUCTION:-0}"

pass_count=0

log() {
  local level="$1"
  shift
  echo "[mvp-regression] ${level}: $*"
}

pass() {
  pass_count=$((pass_count + 1))
  log PASS "$*"
}

normalize_bool() {
  local value
  value="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$value" in
    1|true|yes|y|on)
      printf '1'
      ;;
    *)
      printf '0'
      ;;
  esac
}

run_step() {
  local label="$1"
  shift

  log INFO "$label"
  "$@"
  pass "$label"
}

run_backend_checks() {
  (
    cd "$ROOT_DIR/sunflower-backend"
    mvn -B test
  )
}

run_admin_checks() {
  (
    cd "$ROOT_DIR/sunflower-admin-web"
    npm run lint
    npm run test
    npm run build
  )
}

run_miniapp_checks() {
  (
    cd "$ROOT_DIR"
    node scripts/check_miniapp_mvp_smoke.js
    bash scripts/check_miniapp_project_config.sh
    bash scripts/check_mvp_subpage_nav.sh
  )
}

run_evidence_checks() {
  (
    cd "$ROOT_DIR"
    node scripts/check_mvp_launch_evidence.js
    node scripts/check_miniapp_manual_qa.js
    node scripts/check_admin_web_manual_qa.js
  )
}

run_production_checks() {
  (
    cd "$ROOT_DIR"
    RUN_INTERNAL=1 scripts/check_production_smoke.sh
    RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
  )
}

main() {
  log INFO "starting MVP regression from $ROOT_DIR"

  if [ "$(normalize_bool "$RUN_BACKEND")" = "1" ]; then
    run_step "backend tests" run_backend_checks
  else
    log WARN "backend tests skipped"
  fi

  if [ "$(normalize_bool "$RUN_ADMIN")" = "1" ]; then
    run_step "admin-web lint/test/build" run_admin_checks
  else
    log WARN "admin-web checks skipped"
  fi

  if [ "$(normalize_bool "$RUN_MINIAPP")" = "1" ]; then
    run_step "miniapp smoke checks" run_miniapp_checks
  else
    log WARN "miniapp checks skipped"
  fi

  if [ "$(normalize_bool "$RUN_EVIDENCE")" = "1" ]; then
    run_step "MVP evidence ledger checks" run_evidence_checks
  else
    log WARN "evidence checks skipped"
  fi

  if [ "$(normalize_bool "$RUN_PRODUCTION")" = "1" ]; then
    run_step "production smoke and backend 8080 read-only checks" run_production_checks
  else
    log WARN "production checks skipped; set RUN_PRODUCTION=1 to run read-only ECS/public smoke"
  fi

  log INFO "completed ${pass_count} enabled step(s)"
}

main "$@"
