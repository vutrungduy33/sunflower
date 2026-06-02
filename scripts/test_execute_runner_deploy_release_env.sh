#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

cp "$ROOT_DIR/scripts/execute_runner_deploy.sh" "$WORK_DIR/execute_runner_deploy.sh"

cat > "$WORK_DIR/deploy_lib.sh" <<'EOF'
fail() {
  echo "[$1] ERROR: ${*:2}" >&2
  exit 1
}
project_root() {
  printf '%s\n' "$TEST_DEPLOY_ROOT"
}
normalize_bool() {
  printf '%s\n' "${1:-false}"
}
normalize_deploy_node_role() {
  printf '%s\n' "${1:-}"
}
normalize_deploy_path() {
  printf '%s\n' "${1:-}"
}
EOF

mkdir -p "$WORK_DIR/deploy-target/scripts"
touch "$WORK_DIR/deploy-target/docker-compose.backend.yml"
cat > "$WORK_DIR/deploy-target/scripts/validate_prod_env.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exit 37
EOF
cat > "$WORK_DIR/deploy-target/scripts/deploy_prod.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "deploy should not run" >&2
exit 1
EOF
chmod +x "$WORK_DIR/deploy-target/scripts/"*.sh

cat > "$WORK_DIR/deploy-target/.release.env" <<'EOF'
BACKEND_IMAGE=old-backend
ADMIN_WEB_IMAGE=old-web
SOURCE_SHA=old-sha
DEPLOY_TARGET=backend
RUN_SEED=false
EOF
printf '%s\n' "old-sha" > "$WORK_DIR/deploy-target/.deploy-source-sha"

set +e
TEST_DEPLOY_ROOT="$WORK_DIR" \
BACKEND_IMAGE="new-backend" \
ADMIN_WEB_IMAGE="" \
SOURCE_SHA="new-sha" \
DEPLOY_TARGET="backend" \
RUN_SEED="false" \
DEPLOY_NODE_ROLE="backend" \
ECS_DEPLOY_PATH="$WORK_DIR/deploy-target" \
  bash "$WORK_DIR/execute_runner_deploy.sh" >/dev/null 2>&1
rc=$?
set -e

if [ "$rc" -ne 37 ]; then
  echo "[runner-deploy-test] ERROR: expected validate failure rc=37, got ${rc}" >&2
  exit 1
fi

if ! grep -q '^SOURCE_SHA=old-sha$' "$WORK_DIR/deploy-target/.release.env"; then
  echo "[runner-deploy-test] ERROR: .release.env was overwritten on failed validation" >&2
  exit 1
fi

if ! grep -q '^old-sha$' "$WORK_DIR/deploy-target/.deploy-source-sha"; then
  echo "[runner-deploy-test] ERROR: .deploy-source-sha was overwritten on failed validation" >&2
  exit 1
fi

if [ -e "$WORK_DIR/deploy-target/.release.env.pending" ] || [ -e "$WORK_DIR/deploy-target/.deploy-source-sha.pending" ]; then
  echo "[runner-deploy-test] ERROR: pending release files were not cleaned up" >&2
  exit 1
fi

echo "[runner-deploy-test] PASS: failed validation preserves committed release metadata"
