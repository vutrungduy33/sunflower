#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/deploy_lib.sh"

PREFIX="runner-deploy"

sanitize_image_ref() {
  printf '%s' "${1:-}" | tr -d '\r\n' | tr -cd '[:alnum:]._:/-'
}

sanitize_plain() {
  printf '%s' "${1:-}" | tr -d '\r\n'
}

main() {
  local target_path
  local role
  local pending_release_env_file=".release.env.pending"
  local pending_source_sha_file=".deploy-source-sha.pending"

  cd "$(project_root)"

  BACKEND_IMAGE="$(sanitize_image_ref "${BACKEND_IMAGE:-}")"
  ADMIN_WEB_IMAGE="$(sanitize_image_ref "${ADMIN_WEB_IMAGE:-}")"
  SOURCE_SHA="$(sanitize_plain "${SOURCE_SHA:-}")"
  DEPLOY_TARGET="$(sanitize_plain "${DEPLOY_TARGET:-}")"
  RUN_SEED="$(normalize_bool "${RUN_SEED:-false}")"
  role="$(normalize_deploy_node_role "${DEPLOY_NODE_ROLE:-}")"
  target_path="$(normalize_deploy_path "${ECS_DEPLOY_PATH:-}")"

  [ -n "$SOURCE_SHA" ] || fail "$PREFIX" "SOURCE_SHA is required"
  [ -n "$DEPLOY_TARGET" ] || fail "$PREFIX" "DEPLOY_TARGET is required"
  [ -n "$target_path" ] || fail "$PREFIX" "ECS_DEPLOY_PATH is required"

  mkdir -p "$target_path"
  cd "$target_path"
  trap 'rm -f .release.env.pending .deploy-source-sha.pending' EXIT

  case "$role" in
    backend)
      [ -f docker-compose.backend.yml ] || fail "$PREFIX" "backend compose file missing after bundle sync"
      ;;
    web)
      [ -f docker-compose.web.yml ] || fail "$PREFIX" "web compose file missing after bundle sync"
      [ -f deploy/nginx/sunflower-host.conf.template ] || fail "$PREFIX" "nginx template missing after bundle sync"
      ;;
  esac
  [ -f scripts/validate_prod_env.sh ] || fail "$PREFIX" "deploy scripts missing after bundle sync"

  printf '%s\n' "$SOURCE_SHA" > "$pending_source_sha_file"
  : > "$pending_release_env_file"
  printf '%s\n' "BACKEND_IMAGE=$BACKEND_IMAGE" >> "$pending_release_env_file"
  printf '%s\n' "ADMIN_WEB_IMAGE=$ADMIN_WEB_IMAGE" >> "$pending_release_env_file"
  printf '%s\n' "SOURCE_SHA=$SOURCE_SHA" >> "$pending_release_env_file"
  printf '%s\n' "DEPLOY_TARGET=$DEPLOY_TARGET" >> "$pending_release_env_file"
  printf '%s\n' "RUN_SEED=$RUN_SEED" >> "$pending_release_env_file"

  export DEPLOY_NODE_ROLE="$role"
  export RELEASE_ENV_FILE="$pending_release_env_file"
  chmod +x scripts/*.sh
  ./scripts/validate_prod_env.sh

  if [ "$DEPLOY_TARGET" = "bootstrap" ]; then
    ./scripts/bootstrap_prod.sh
  else
    ./scripts/deploy_prod.sh "$DEPLOY_TARGET"
  fi

  mv "$pending_release_env_file" .release.env
  mv "$pending_source_sha_file" .deploy-source-sha
}

main "$@"
