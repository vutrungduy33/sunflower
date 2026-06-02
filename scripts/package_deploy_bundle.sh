#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="package-bundle"

log() {
  echo "[${PREFIX}] $*"
}

fail() {
  echo "[${PREFIX}] ERROR: $*" >&2
  exit 1
}

main() {
  local output_file="${1:-}"
  local output_dir
  local temp_file

  [ -n "$output_file" ] || fail "output tar.gz path is required"
  case "$output_file" in
    /*)
      ;;
    *)
      output_file="$PWD/$output_file"
      ;;
  esac

  output_dir="$(dirname "$output_file")"
  mkdir -p "$output_dir"
  temp_file="${output_file}.tmp"
  rm -f "$temp_file"

  (
    cd "$ROOT_DIR"
    tar -czf "$temp_file" \
      .env.empty \
      .env.prod.example \
      .env.prod.web.example \
      .env.nonprod-mock.example \
      docker-compose.backend.yml \
      docker-compose.web.yml \
      deploy/nginx \
      scripts
  )

  mv "$temp_file" "$output_file"
  log "Deployment bundle packaged at ${output_file}"
}

main "$@"
