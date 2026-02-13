#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAN_FILE="$ROOT_DIR/docs/Agent-Stage-Plan.md"
BACKLOG_FILE="$ROOT_DIR/docs/Backlog.md"
REPORT_DIR="$ROOT_DIR/docs/stage-reports"
API_GUARD_SCRIPT="$ROOT_DIR/scripts/api_contract_guard.sh"
SEED_SQL_FILE_REL="scripts/sql/mvp_demo_seed.sql"
SEED_STARTUP_SCRIPT_REL="scripts/start_backend_with_mvp_seed.sh"

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

has_match() {
  local pattern="$1"
  local file="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q -- "$pattern" "$file"
  else
    grep -Eq -- "$pattern" "$file"
  fi
}

stdin_has_match() {
  local pattern="$1"
  if command -v rg >/dev/null 2>&1; then
    rg -q -- "$pattern"
  else
    grep -Eq -- "$pattern"
  fi
}

collect_changed_files() {
  local base_sha=""
  local branch_changes=""
  local working_tree_changes=""
  local untracked_changes=""

  if git -C "$ROOT_DIR" rev-parse --verify origin/main >/dev/null 2>&1; then
    base_sha="$(git -C "$ROOT_DIR" merge-base HEAD origin/main || true)"
  fi

  if [[ -n "$base_sha" ]]; then
    branch_changes="$(git -C "$ROOT_DIR" diff --name-only "$base_sha...HEAD" || true)"
  else
    branch_changes="$(git -C "$ROOT_DIR" diff --name-only HEAD || true)"
  fi

  working_tree_changes="$(git -C "$ROOT_DIR" diff --name-only HEAD -- || true)"
  untracked_changes="$(git -C "$ROOT_DIR" ls-files --others --exclude-standard || true)"

  printf "%s\n%s\n%s\n" "$branch_changes" "$working_tree_changes" "$untracked_changes" \
    | sed '/^[[:space:]]*$/d' \
    | sort -u
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

stage_boundary="([^[:alnum:]_]|$)"

if ! has_match "^###[[:space:]]+${stage}${stage_boundary}" "$PLAN_FILE"; then
  fail "${stage} not found in docs/Agent-Stage-Plan.md"
fi

if ! has_match "^- \\[( |x)\\][[:space:]]+${stage}${stage_boundary}" "$BACKLOG_FILE"; then
  fail "${stage} not found in docs/Backlog.md status list"
fi

if [[ "$mode" == "pre" ]]; then
  if has_match "^- \\[x\\][[:space:]]+${stage}${stage_boundary}" "$BACKLOG_FILE"; then
    warn "${stage} is already marked complete in docs/Backlog.md"
  fi
  echo "[stage-guard] PRE-CHECK PASS for ${stage}"
  exit 0
fi

if ! has_match "^- \\[x\\][[:space:]]+${stage}${stage_boundary}" "$BACKLOG_FILE"; then
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
  if ! has_match "^${header}$" "$report_file"; then
    fail "stage report missing required heading '${header}'"
  fi
done

if ! has_match "^- \\[x\\] " "$report_file"; then
  fail "stage report must include at least one checked item '- [x]' (DoD evidence)"
fi

if [[ -x "$API_GUARD_SCRIPT" ]]; then
  "$API_GUARD_SCRIPT" || true
else
  warn "api contract guard script not executable: $API_GUARD_SCRIPT"
fi

changed_files="$(collect_changed_files)"
data_migration_pattern='^(sunflower-backend/src/main/resources/db/migration/|sunflower-backend/src/main/java/.*/persistence/)'
if [[ -n "$changed_files" ]] && echo "$changed_files" | stdin_has_match "$data_migration_pattern"; then
  if ! echo "$changed_files" | stdin_has_match "^${SEED_SQL_FILE_REL}$"; then
    fail "data migration/persistence changes detected, must sync ${SEED_SQL_FILE_REL}"
  fi
  if ! echo "$changed_files" | stdin_has_match "^${SEED_STARTUP_SCRIPT_REL}$|^\\.github/workflows/deploy-backend\\.yml$"; then
    warn "consider checking ${SEED_STARTUP_SCRIPT_REL} / deploy workflow for startup behavior"
  fi
fi

echo "[stage-guard] POST-CHECK PASS for ${stage}"
