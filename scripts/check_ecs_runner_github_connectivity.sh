#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_HOST="${BACKEND_HOST:-47.120.42.15}"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-$ROOT_DIR/.secrets/aliyun_mba_codex.pem}"
RUN_INTERNAL="${RUN_INTERNAL:-0}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-8}"
CURL_MAX_TIME="${CURL_MAX_TIME:-20}"
RUNNER_ROOT_HINT="${RUNNER_ROOT_HINT:-/home/actions-runner/actions-runner}"
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/vutrungduy33/sunflower.git}"

pass_count=0
warn_count=0

log() {
  local level="$1"
  shift
  echo "[runner-github-connectivity] ${level}: $*"
}

pass() {
  pass_count=$((pass_count + 1))
  log PASS "$*"
}

warn() {
  warn_count=$((warn_count + 1))
  log WARN "$*"
}

fail() {
  log ERROR "$*" >&2
  exit 1
}

normalize_bool() {
  local value
  value="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$value" in
    1|true|yes|y|on)
      printf '1'
      ;;
    *)
      printf '0'
      ;;
  esac
}

ssh_cmd() {
  local host="$1"
  shift

  [ -f "$SSH_KEY" ] || fail "SSH key not found: $SSH_KEY"

  ssh -i "$SSH_KEY" \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout="$CURL_CONNECT_TIMEOUT" \
    "${SSH_USER}@${host}" "$@"
}

evaluate_remote_output() {
  local output="$1"

  printf '%s\n' "$output" | sed -n 's/^PASS /[runner-github-connectivity] PASS: /p'
  printf '%s\n' "$output" | sed -n 's/^WARN /[runner-github-connectivity] WARN: /p'
  printf '%s\n' "$output" | sed -n 's/^INFO /[runner-github-connectivity] INFO: /p'

  pass_count=$((pass_count + $(printf '%s\n' "$output" | grep -Ec '^PASS ' || true)))
  warn_count=$((warn_count + $(printf '%s\n' "$output" | grep -Ec '^WARN ' || true)))

  if printf '%s\n' "$output" | grep -Eq '^FAIL '; then
    printf '%s\n' "$output" | sed -n 's/^FAIL /[runner-github-connectivity] ERROR: /p' >&2
    fail "ECS runner GitHub connectivity diagnostic failed"
  fi
}

run_remote_diagnostic() {
  local output

  case "$RUNNER_ROOT_HINT" in
    *[![:alnum:]_./~-]*)
      fail "RUNNER_ROOT_HINT contains unsupported characters"
      ;;
  esac

  case "$REPOSITORY_URL" in
    *[![:alnum:]_./:~?\&=%@+-]*)
      fail "REPOSITORY_URL contains unsupported characters"
      ;;
  esac

  output="$(ssh_cmd "$BACKEND_HOST" \
    "RUNNER_ROOT_HINT='$RUNNER_ROOT_HINT' REPOSITORY_URL='$REPOSITORY_URL' CURL_CONNECT_TIMEOUT='$CURL_CONNECT_TIMEOUT' CURL_MAX_TIME='$CURL_MAX_TIME' bash -s" <<'REMOTE'
set -euo pipefail

pass() { echo "PASS $*"; }
warn() { echo "WARN $*"; }
info() { echo "INFO $*"; }
fail() { echo "FAIL $*"; exit 0; }

runner_root="${RUNNER_ROOT_HINT:-/home/actions-runner/actions-runner}"
repository_url="${REPOSITORY_URL:-https://github.com/vutrungduy33/sunflower.git}"
connect_timeout="${CURL_CONNECT_TIMEOUT:-8}"
max_time="${CURL_MAX_TIME:-20}"

info "host=$(hostname)"
info "runner_root_hint=$runner_root"

if command -v systemctl >/dev/null 2>&1; then
  systemctl --no-pager --plain list-units 'actions.runner*' 2>/dev/null | sed -n 's/^/INFO systemd /p' || true
fi

if pgrep -af 'Runner.Listener|runsvc.sh|actions-runner' >/dev/null 2>&1; then
  pass "actions runner process is present"
else
  warn "actions runner process was not found by pgrep"
fi

if [ -d "$runner_root" ]; then
  pass "runner root exists"
else
  warn "runner root hint does not exist: $runner_root"
fi

diag_dir="$runner_root/_diag"
if [ -d "$diag_dir" ]; then
  pass "runner _diag directory exists"
  recent_worker="$(find "$diag_dir" -maxdepth 1 -type f -name 'Worker_*.log' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- || true)"
  if [ -n "$recent_worker" ]; then
    info "recent_worker_log=$recent_worker"
    grep -E 'GnuTLS|github.com|timed out|Failed to connect|unable to access|exit code 128' "$recent_worker" 2>/dev/null | tail -8 | sed -n 's/^/INFO recent_worker_error /p' || true
  else
    warn "no Worker_*.log found under _diag"
  fi
else
  warn "runner _diag directory not found: $diag_dir"
fi

if command -v getent >/dev/null 2>&1; then
  if getent hosts github.com >/dev/null; then
    pass "DNS resolves github.com"
    getent hosts github.com | head -3 | sed -n 's/^/INFO github_dns /p'
  else
    fail "DNS cannot resolve github.com"
  fi
else
  warn "getent is unavailable; skipping DNS check"
fi

if command -v curl >/dev/null 2>&1; then
  if curl -fsSI --connect-timeout "$connect_timeout" --max-time "$max_time" https://github.com/ >/tmp/sunflower-github-head.txt 2>/tmp/sunflower-github-head.err; then
    pass "HTTPS HEAD to github.com succeeds"
    sed -n '1,3p' /tmp/sunflower-github-head.txt | sed -n 's/^/INFO github_head /p'
  else
    warn "HTTPS HEAD to github.com failed"
    sed -n '1,5p' /tmp/sunflower-github-head.err | sed -n 's/^/INFO github_head_error /p'
  fi
else
  warn "curl is unavailable; skipping HTTPS HEAD check"
fi

if command -v git >/dev/null 2>&1; then
  info "git_version=$(git --version)"
  if timeout "$max_time" git ls-remote --heads "$repository_url" >/tmp/sunflower-git-ls-remote.txt 2>/tmp/sunflower-git-ls-remote.err; then
    pass "git ls-remote to repository succeeds"
    sed -n '1,3p' /tmp/sunflower-git-ls-remote.txt | sed -n 's/^/INFO git_ref /p'
  else
    warn "git ls-remote to repository failed or timed out"
    sed -n '1,8p' /tmp/sunflower-git-ls-remote.err | sed -n 's/^/INFO git_ls_remote_error /p'
  fi
else
  fail "git is unavailable on runner host"
fi

if command -v df >/dev/null 2>&1; then
  df -h "$runner_root" 2>/dev/null | sed -n 's/^/INFO disk /p' || df -h / | sed -n 's/^/INFO disk /p'
fi

pass "read-only runner GitHub connectivity diagnostic completed"
REMOTE
  )" || fail "ECS runner diagnostic SSH check failed"

  evaluate_remote_output "$output"
}

main() {
  log INFO "checking ECS runner GitHub connectivity without mutating ECS"

  if [ "$(normalize_bool "$RUN_INTERNAL")" != "1" ]; then
    warn "internal ECS runner diagnostic skipped; set RUN_INTERNAL=1 to inspect ECS-2 runner connectivity"
    log INFO "completed with ${pass_count} pass(es), ${warn_count} warning(s)"
    return
  fi

  run_remote_diagnostic
  log INFO "completed with ${pass_count} pass(es), ${warn_count} warning(s)"
}

main "$@"
