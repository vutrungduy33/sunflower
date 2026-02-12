#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAN_FILE="$ROOT_DIR/docs/Agent-Stage-Plan.md"
BACKLOG_FILE="$ROOT_DIR/docs/Backlog.md"
REPORT_DIR="$ROOT_DIR/docs/stage-reports"
API_GUARD_SCRIPT="$ROOT_DIR/scripts/api_contract_guard.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/stage_guard.sh pre Sx
  ./scripts/stage_guard.sh post Sx

Examples:
  ./scripts/stage_guard.sh pre S1
  ./scripts/stage_guard.sh post S1
EOF
}

fail() {
  echo "[stage-guard] ERROR: $*" >&2
  exit 1
}

warn() {
  echo "[stage-guard] WARN: $*" >&2
}

mode="${1:-}"
stage="${2:-}"

if [[ -z "$mode" || -z "$stage" ]]; then
  usage
  exit 1
fi

if [[ "$mode" != "pre" && "$mode" != "post" ]]; then
  fail "mode must be 'pre' or 'post'"
fi

if [[ ! "$stage" =~ ^S[0-9]+$ ]]; then
  fail "stage must match S<number>, e.g. S1"
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  fail "missing plan file: $PLAN_FILE"
fi

if [[ ! -f "$BACKLOG_FILE" ]]; then
  fail "missing backlog file: $BACKLOG_FILE"
fi

if ! rg -q "^### ${stage}\\b" "$PLAN_FILE"; then
  fail "${stage} not found in docs/Agent-Stage-Plan.md"
fi

if ! rg -q "^- \\[( |x)\\] ${stage}\\b" "$BACKLOG_FILE"; then
  fail "${stage} not found in docs/Backlog.md status list"
fi

if [[ "$mode" == "pre" ]]; then
  if rg -q "^- \\[x\\] ${stage}\\b" "$BACKLOG_FILE"; then
    warn "${stage} is already marked complete in docs/Backlog.md"
  fi
  echo "[stage-guard] PRE-CHECK PASS for ${stage}"
  exit 0
fi

if ! rg -q "^- \\[x\\] ${stage}\\b" "$BACKLOG_FILE"; then
  fail "${stage} must be marked [x] in docs/Backlog.md for post-check"
fi

report_file="$REPORT_DIR/${stage}.md"
if [[ ! -f "$report_file" ]]; then
  fail "missing stage report: docs/stage-reports/${stage}.md"
fi

required_headers=(
  "## 需求确认"
  "## 代码改动"
  "## 自动化测试"
  "## 人工复核步骤"
  "## DoD Checklist"
  "## API 契约影响"
  "## 风险与后续"
)

for header in "${required_headers[@]}"; do
  if ! rg -q "^${header}$" "$report_file"; then
    fail "stage report missing required heading '${header}'"
  fi
done

if ! rg -q "^- \\[x\\] " "$report_file"; then
  fail "stage report must include at least one checked item '- [x]' (DoD evidence)"
fi

if [[ -x "$API_GUARD_SCRIPT" ]]; then
  "$API_GUARD_SCRIPT" || true
else
  warn "api contract guard script not executable: $API_GUARD_SCRIPT"
fi

echo "[stage-guard] POST-CHECK PASS for ${stage}"
