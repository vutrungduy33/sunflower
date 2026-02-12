#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MVP_PAGES_DIR="$ROOT_DIR/sunflower-miniapp/pages/mvp"

if [[ ! -d "$MVP_PAGES_DIR" ]]; then
  echo "[mvp-nav-guard] INFO: mvp pages directory not found, skip"
  exit 0
fi

missing_pages=()

while IFS= read -r page_wxml; do
  if rg -q "<mvp-tabbar" "$page_wxml"; then
    continue
  fi

  if rg -q "<mvp-nav-actions" "$page_wxml"; then
    continue
  fi

  missing_pages+=("${page_wxml#$ROOT_DIR/}")
done < <(find "$MVP_PAGES_DIR" -mindepth 2 -maxdepth 2 -type f -name "index.wxml" | sort)

if [[ "${#missing_pages[@]}" -gt 0 ]]; then
  echo "[mvp-nav-guard] ERROR: pages missing <mvp-nav-actions>:" >&2
  for page in "${missing_pages[@]}"; do
    echo "  - ${page}" >&2
  done
  echo "[mvp-nav-guard] INFO: non-tab mvp pages must include <mvp-nav-actions> to provide back/home entry." >&2
  exit 1
fi

echo "[mvp-nav-guard] PASS: all non-tab mvp pages contain <mvp-nav-actions>"
