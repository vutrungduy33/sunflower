#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW_FILE="deploy-backend.yml"
TARGET="backend"
REF="main"
IMAGE_TAG=""
EXECUTE=0

log() {
  local level="$1"
  shift
  echo "[nonprod-dispatch-helper] ${level}: $*"
}

usage() {
  cat <<'EOF'
Usage:
  scripts/dispatch_nonprod_mock_payment_deploy.sh [--dry-run] [--execute] [--target auto|backend] [--image-tag <tag>] [--ref <git-ref>]

Default behavior is dry-run only. It runs the local nonprod dispatch readiness
guard and prints the exact GitHub CLI command without triggering GitHub Actions.

To actually dispatch after approval:
  CONFIRM_NONPROD_MOCK_DISPATCH=1 scripts/dispatch_nonprod_mock_payment_deploy.sh --execute

This helper hard-codes deployment_lane=nonprod-mock-payment. It does not support
production, admin-web, nginx, all, bootstrap, real payment, or real refund.
EOF
}

shell_quote_command() {
  printf '%q ' "$@"
  printf '\n'
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log ERROR "required command not found: $1"
    exit 1
  fi
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      EXECUTE=0
      shift
      ;;
    --execute)
      EXECUTE=1
      shift
      ;;
    --target)
      if [ "$#" -lt 2 ]; then
        log ERROR "--target requires auto or backend"
        exit 1
      fi
      TARGET="$2"
      shift 2
      ;;
    --image-tag)
      if [ "$#" -lt 2 ]; then
        log ERROR "--image-tag requires a value"
        exit 1
      fi
      IMAGE_TAG="$2"
      shift 2
      ;;
    --ref)
      if [ "$#" -lt 2 ]; then
        log ERROR "--ref requires a value"
        exit 1
      fi
      REF="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log ERROR "unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

case "$TARGET" in
  auto|backend)
    ;;
  *)
    log ERROR "nonprod-mock-payment dispatch only supports target=auto or target=backend; got ${TARGET}"
    exit 1
    ;;
esac

cd "$ROOT_DIR"

log INFO "running local nonprod dispatch readiness guard"
node scripts/check_nonprod_dispatch_readiness.js

GH_ARGS=(
  workflow run "$WORKFLOW_FILE"
  --ref "$REF"
  -f "target=${TARGET}"
  -f "run_seed=false"
  -f "deployment_lane=nonprod-mock-payment"
)

if [ -n "$IMAGE_TAG" ]; then
  GH_ARGS+=(-f "image_tag=${IMAGE_TAG}")
fi

log INFO "prepared backend-only nonprod/mock-payment dispatch"
log INFO "boundary: no production lane, no admin-web/Nginx refresh, no real payment/refund evidence"
echo
echo "Command:"
shell_quote_command gh "${GH_ARGS[@]}"
echo

if [ "$EXECUTE" -ne 1 ]; then
  log INFO "dry-run only; no workflow_dispatch was triggered"
  exit 0
fi

if [ "${CONFIRM_NONPROD_MOCK_DISPATCH:-}" != "1" ]; then
  log ERROR "set CONFIRM_NONPROD_MOCK_DISPATCH=1 to execute this approved nonprod dispatch"
  exit 1
fi

require_command gh
log INFO "executing approved nonprod/mock-payment workflow_dispatch"
gh "${GH_ARGS[@]}"
