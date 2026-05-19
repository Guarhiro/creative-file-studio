#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$APP_DIR/vendor/rembg-venv"

PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! "$PYTHON_BIN" - <<'PY'
import sys
raise SystemExit(0 if (3, 11) <= sys.version_info < (3, 14) else 1)
PY
then
  echo "rembg requires Python >=3.11 and <3.14. Current python: $($PYTHON_BIN --version 2>&1)" >&2
  exit 1
fi

mkdir -p "$APP_DIR/vendor"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install --upgrade pip
"$VENV_DIR/bin/python" -m pip install --upgrade "rembg[cpu]"
"$VENV_DIR/bin/python" - <<'PY'
import rembg
from PIL import Image
print("rembg is ready")
PY
