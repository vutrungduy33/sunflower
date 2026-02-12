#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/api_contract_guard.sh [--strict] [<git-range>]

Examples:
  ./scripts/api_contract_guard.sh
  ./scripts/api_contract_guard.sh main..HEAD
  ./scripts/api_contract_guard.sh --strict origin/main..HEAD
EOF
}

warn_msg() {
  local message="$1"
  echo "[api-contract-guard] WARN: ${message}" >&2
  if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    echo "::warning::${message}"
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

strict=0
range=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      strict=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$range" ]]; then
        echo "[api-contract-guard] ERROR: duplicate range argument" >&2
        usage
        exit 1
      fi
      range="$1"
      shift
      ;;
  esac
done

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[api-contract-guard] INFO: not a git repository, skip"
  exit 0
fi

if [[ -n "$range" ]]; then
  changed_files="$(git -C "$ROOT_DIR" diff --name-only "$range")"
else
  changed_files="$(
    {
      git -C "$ROOT_DIR" diff --name-only
      git -C "$ROOT_DIR" diff --cached --name-only
    } | sort -u
  )"
fi

if [[ -z "$changed_files" ]]; then
  echo "[api-contract-guard] INFO: no changed files detected"
  exit 0
fi

backend_contract_touched=0
sync_touched=0

if echo "$changed_files" | stdin_has_match "^sunflower-backend/src/main/java/.*/.*Controller\\.java$|^sunflower-backend/src/main/java/.*/dto/"; then
  backend_contract_touched=1
fi

if echo "$changed_files" | stdin_has_match "^sunflower-miniapp/utils/mvp/api\\.js$|^docs/API\\.md$|^docs/API-Schemas\\.md$"; then
  sync_touched=1
fi

if [[ "$backend_contract_touched" -eq 1 && "$sync_touched" -eq 0 ]]; then
  message="Detected backend Controller/DTO changes without miniapp/api docs sync. Please verify contract compatibility or update sunflower-miniapp/utils/mvp/api.js + docs/API*.md."
  warn_msg "$message"
  if [[ "$strict" -eq 1 ]]; then
    echo "[api-contract-guard] ERROR: strict mode enabled" >&2
    exit 1
  fi
fi

echo "[api-contract-guard] CHECK DONE"
