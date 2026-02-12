#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/check_stage_convention.sh <branch-name> [<base-sha> <head-sha>]

Examples:
  ./scripts/check_stage_convention.sh codex/s1-db-migration
  ./scripts/check_stage_convention.sh codex/s1-db-migration abc123 def456
EOF
}

fail() {
  echo "[stage-convention] ERROR: $*" >&2
  exit 1
}

branch_name="${1:-}"
base_sha="${2:-}"
head_sha="${3:-HEAD}"

if [[ -z "$branch_name" ]]; then
  usage
  exit 1
fi

if [[ ! "$branch_name" =~ ^codex/(s[0-9]+)-[a-z0-9._-]+$ ]]; then
  fail "branch must match 'codex/s<stage>-<slug>', e.g. codex/s1-db-migration"
fi

stage_lower="${BASH_REMATCH[1]}"
stage_upper="$(echo "$stage_lower" | tr '[:lower:]' '[:upper:]')"
expected_prefix="[${stage_upper}]"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "stage=${stage_upper}" >> "$GITHUB_OUTPUT"
fi

if [[ -z "$base_sha" ]]; then
  echo "[stage-convention] PASS: branch name ok (${branch_name}), commit range skipped"
  exit 0
fi

commit_subjects="$(git log --format=%s "${base_sha}..${head_sha}")"
if [[ -z "$commit_subjects" ]]; then
  fail "no commits found in range ${base_sha}..${head_sha}"
fi

invalid=0
while IFS= read -r subject; do
  [[ -z "$subject" ]] && continue
  if [[ "$subject" != "${expected_prefix}"* ]]; then
    echo "[stage-convention] invalid commit subject: ${subject}" >&2
    invalid=1
  fi
done <<< "$commit_subjects"

if [[ "$invalid" -eq 1 ]]; then
  fail "all commit subjects in this PR must start with '${expected_prefix}'"
fi

echo "[stage-convention] PASS: branch and commit subjects conform (${expected_prefix})"
