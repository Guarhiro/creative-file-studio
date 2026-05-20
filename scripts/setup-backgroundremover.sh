#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$APP_DIR/vendor/backgroundremover-venv"

PYTHON_BIN="${PYTHON_BIN:-python3}"

if ! "$PYTHON_BIN" - <<'PY'
import sys
raise SystemExit(0 if (3, 10) <= sys.version_info < (3, 14) else 1)
PY
then
  echo "backgroundremover requires Python >=3.10 and <3.14 for this bundled setup. Current python: $($PYTHON_BIN --version 2>&1)" >&2
  exit 1
fi

mkdir -p "$APP_DIR/vendor"

if [ ! -x "$VENV_DIR/bin/python" ]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install --upgrade pip

case "$(uname -s)" in
  Darwin*)
    "$VENV_DIR/bin/python" -m pip install --upgrade torch torchvision
    ;;
  *)
    "$VENV_DIR/bin/python" -m pip install --upgrade torch torchvision --index-url https://download.pytorch.org/whl/cpu
    ;;
esac

"$VENV_DIR/bin/python" -m pip install --upgrade backgroundremover static-ffmpeg
"$VENV_DIR/bin/python" - <<'PY'
from pathlib import Path
from static_ffmpeg import run

venv_bin = Path(__import__("sys").executable).resolve().parent
ffmpeg, ffprobe = run.get_or_fetch_platform_executables_else_raise()
for name, source in {"ffmpeg": ffmpeg, "ffprobe": ffprobe}.items():
    target = venv_bin / name
    if target.exists() or target.is_symlink():
        target.unlink()
    target.symlink_to(Path(source).resolve())
PY
"$VENV_DIR/bin/python" - <<'PY'
import backgroundremover
import torch
print("backgroundremover is ready")
print("torch", torch.__version__)
PY

if ! PATH="$VENV_DIR/bin:$PATH" command -v ffmpeg >/dev/null 2>&1 || ! PATH="$VENV_DIR/bin:$PATH" command -v ffprobe >/dev/null 2>&1; then
  echo "warning: ffmpeg/ffprobe was not found. Image background removal can work, but video background removal requires ffmpeg and ffprobe." >&2
fi
