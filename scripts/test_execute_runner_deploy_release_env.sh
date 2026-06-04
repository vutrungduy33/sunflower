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
cat > "$WORK_DIR/deploy-target/scripts/check_nonprod_mock_payment_deploy_lane.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "nonprod validation should not run in production lane" >&2
exit 1
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

NONPROD_WORK_DIR="$(mktemp -d "$WORK_DIR/nonprod.XXXXXX")"
mkdir -p "$NONPROD_WORK_DIR/deploy-target/scripts"
touch "$NONPROD_WORK_DIR/deploy-target/docker-compose.backend.yml"
touch "$NONPROD_WORK_DIR/deploy-target/.env.nonprod-mock.example"
cat > "$NONPROD_WORK_DIR/deploy-target/scripts/validate_prod_env.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "production validation should not run in nonprod lane" >&2
exit 1
EOF
cat > "$NONPROD_WORK_DIR/deploy-target/scripts/check_nonprod_mock_payment_deploy_lane.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "nonprod-validation-ran" > "$TEST_DEPLOY_ROOT/nonprod-validation.log"
EOF
cat > "$NONPROD_WORK_DIR/deploy-target/scripts/deploy_prod.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "deploy-ran:${PROD_ENV_FILE:-unset}:${RUNTIME_OVERLAY_ENV_FILE:-unset}:$1" > "$TEST_DEPLOY_ROOT/nonprod-deploy.log"
EOF
chmod +x "$NONPROD_WORK_DIR/deploy-target/scripts/"*.sh

TEST_DEPLOY_ROOT="$NONPROD_WORK_DIR" \
BACKEND_IMAGE="new-backend" \
ADMIN_WEB_IMAGE="" \
SOURCE_SHA="new-sha" \
DEPLOY_TARGET="backend" \
DEPLOYMENT_LANE="nonprod-mock-payment" \
RUN_SEED="false" \
DEPLOY_NODE_ROLE="backend" \
ECS_DEPLOY_PATH="$NONPROD_WORK_DIR/deploy-target" \
  bash "$WORK_DIR/execute_runner_deploy.sh" >/dev/null 2>&1

if ! grep -q '^nonprod-validation-ran$' "$NONPROD_WORK_DIR/nonprod-validation.log"; then
  echo "[runner-deploy-test] ERROR: nonprod validation did not run" >&2
  exit 1
fi

if ! grep -q '^deploy-ran:unset:.env.nonprod-mock.example:backend$' "$NONPROD_WORK_DIR/nonprod-deploy.log"; then
  echo "[runner-deploy-test] ERROR: nonprod deploy did not use the nonprod overlay env file" >&2
  exit 1
fi

echo "[runner-deploy-test] PASS: nonprod mock-payment lane selects nonprod validation and overlay"

OVERLAY_WORK_DIR="$(mktemp -d "$WORK_DIR/overlay.XXXXXX")"
mkdir -p "$OVERLAY_WORK_DIR/scripts"
cp "$ROOT_DIR/scripts/deploy_lib.sh" "$OVERLAY_WORK_DIR/scripts/deploy_lib.sh"
cat > "$OVERLAY_WORK_DIR/.env.prod" <<'EOF'
PROD_ENV_FILE=wrong-prod.env
RUNTIME_OVERLAY_ENV_FILE=wrong-overlay.env
RELEASE_ENV_FILE=wrong-release.env
MYSQL_DATABASE=sunflower
MYSQL_USER=sunflower
MYSQL_PASSWORD=base-db-password
AUTH_TOKEN_SECRET=base-auth-token
WECHAT_PAY_MOCK_ENABLED=false
EOF
cat > "$OVERLAY_WORK_DIR/.env.nonprod-mock.example" <<'EOF'
SUNFLOWER_DEPLOY_LANE=nonprod-mock-payment
WECHAT_PAY_MOCK_ENABLED=true
WECHAT_PAY_API_V3_KEY=00000000000000000000000000000000
EOF
cat > "$OVERLAY_WORK_DIR/.release.env" <<'EOF'
BACKEND_IMAGE=test-backend-image
EOF

(
  cd "$OVERLAY_WORK_DIR"
  # shellcheck disable=SC1091
  . "$OVERLAY_WORK_DIR/scripts/deploy_lib.sh"
  PROD_ENV_FILE=".env.prod"
  RUNTIME_OVERLAY_ENV_FILE=".env.nonprod-mock.example"
  RELEASE_ENV_FILE=".release.env"
  load_runtime_envs

  [ "$MYSQL_DATABASE" = "sunflower" ] || fail test "base MYSQL_DATABASE was not loaded"
  [ "$MYSQL_USER" = "sunflower" ] || fail test "base MYSQL_USER was not loaded"
  [ "$MYSQL_PASSWORD" = "base-db-password" ] || fail test "base MYSQL_PASSWORD was overridden"
  [ "$AUTH_TOKEN_SECRET" = "base-auth-token" ] || fail test "base AUTH_TOKEN_SECRET was overridden"
  [ "$WECHAT_PAY_MOCK_ENABLED" = "true" ] || fail test "overlay WECHAT_PAY_MOCK_ENABLED was not applied"
  [ "$WECHAT_PAY_API_V3_KEY" = "00000000000000000000000000000000" ] || fail test "overlay WECHAT_PAY_API_V3_KEY was not applied"
  [ "$BACKEND_IMAGE" = "test-backend-image" ] || fail test "release metadata was not loaded"
  [ "$PROD_ENV_FILE" = ".env.prod" ] || fail test "base env file path was overwritten by env contents"
  [ "$RUNTIME_OVERLAY_ENV_FILE" = ".env.nonprod-mock.example" ] || fail test "overlay env file path was overwritten by env contents"
  [ "$RELEASE_ENV_FILE" = ".release.env" ] || fail test "release env file path was overwritten by env contents"
)

echo "[runner-deploy-test] PASS: runtime overlay preserves base credentials and applies mock payment"
