#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKLIST_FILE="$ROOT_DIR/docs/S14-Release-Acceptance-Checklist.md"
RUNBOOK_FILE="$ROOT_DIR/docs/S14-Release-Runbook.md"

fail() {
  echo "[release-assets] ERROR: $*" >&2
  exit 1
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

require_heading() {
  local heading="$1"
  local file="$2"
  if ! has_match "^${heading}$" "$file"; then
    fail "missing heading '${heading}' in ${file#$ROOT_DIR/}"
  fi
}

require_keyword() {
  local keyword="$1"
  local file="$2"
  if ! has_match "$keyword" "$file"; then
    fail "missing keyword '${keyword}' in ${file#$ROOT_DIR/}"
  fi
}

[[ -f "$CHECKLIST_FILE" ]] || fail "missing release acceptance checklist: ${CHECKLIST_FILE#$ROOT_DIR/}"
[[ -f "$RUNBOOK_FILE" ]] || fail "missing release runbook: ${RUNBOOK_FILE#$ROOT_DIR/}"

require_heading "# S14 联调验收清单" "$CHECKLIST_FILE"
require_heading "## 验收前提" "$CHECKLIST_FILE"
require_heading "## 联调验收步骤" "$CHECKLIST_FILE"
require_heading "## 发布后巡检" "$CHECKLIST_FILE"
require_heading "## 验收结论" "$CHECKLIST_FILE"
require_keyword "小程序" "$CHECKLIST_FILE"
require_keyword "管理后台" "$CHECKLIST_FILE"
require_keyword "API" "$CHECKLIST_FILE"

require_heading "# S14 发布与回滚说明" "$RUNBOOK_FILE"
require_heading "## 发布前检查" "$RUNBOOK_FILE"
require_heading "## 标准发布步骤" "$RUNBOOK_FILE"
require_heading "## 回滚步骤" "$RUNBOOK_FILE"
require_heading "## 故障定位" "$RUNBOOK_FILE"
require_keyword "GitHub Actions" "$RUNBOOK_FILE"
require_keyword "workflow_dispatch" "$RUNBOOK_FILE"
require_keyword "回滚" "$RUNBOOK_FILE"

echo "[release-assets] PASS: release checklist and runbook are present"
