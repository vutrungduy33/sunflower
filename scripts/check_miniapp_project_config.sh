#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$ROOT_DIR/sunflower-miniapp/project.config.json"
EXPECTED_APPID="touristappid"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "[miniapp-appid-guard] ERROR: missing config file: $CONFIG_FILE" >&2
  exit 1
fi

actual_appid="$(python3 - "$CONFIG_FILE" <<'PY'
import json
import sys
from pathlib import Path

config_path = Path(sys.argv[1])
config = json.loads(config_path.read_text())
print(config.get("appid", ""))
PY
)"

if [[ "$actual_appid" != "$EXPECTED_APPID" ]]; then
  echo "[miniapp-appid-guard] ERROR: sunflower-miniapp/project.config.json must keep placeholder appid '$EXPECTED_APPID' in git." >&2
  echo "[miniapp-appid-guard] ERROR: found appid '${actual_appid:-<missing>}'." >&2
  exit 1
fi

echo "[miniapp-appid-guard] PASS: repository project.config.json keeps placeholder appid '$EXPECTED_APPID'."
