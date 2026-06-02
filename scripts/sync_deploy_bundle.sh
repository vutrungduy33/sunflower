#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="sync-bundle"

main() {
  local target_path
  local bundle_file
  cd "$(project_root)"

  target_path="$(normalize_deploy_path "${1:-${ECS_DEPLOY_PATH:-}}")"
  [ -n "$target_path" ] || fail "$PREFIX" "deploy path is required"

  mkdir -p "$target_path/deploy"

  rm -f \
    "$target_path/.env.empty" \
    "$target_path/.env.prod.example" \
    "$target_path/.env.prod.web.example" \
    "$target_path/.env.nonprod-mock.example" \
    "$target_path/docker-compose.backend.yml" \
    "$target_path/docker-compose.web.yml"
  rm -rf "$target_path/deploy/nginx" "$target_path/scripts"

  bundle_file="$(mktemp "${TMPDIR:-/tmp}/sunflower-deploy-bundle.XXXXXX.tar.gz")"
  trap "rm -f '$bundle_file'" EXIT
  "$SCRIPT_DIR/package_deploy_bundle.sh" "$bundle_file"
  tar -C "$target_path" -xzf "$bundle_file"

  [ -f "$target_path/docker-compose.backend.yml" ] || fail "$PREFIX" "backend compose file missing after sync"
  [ -f "$target_path/docker-compose.web.yml" ] || fail "$PREFIX" "web compose file missing after sync"
  [ -f "$target_path/scripts/validate_prod_env.sh" ] || fail "$PREFIX" "deploy scripts missing after sync"
  [ -f "$target_path/.env.nonprod-mock.example" ] || fail "$PREFIX" "nonprod env template missing after sync"

  log_info "$PREFIX" "Deployment bundle synchronized to ${target_path}"
}

main "$@"
