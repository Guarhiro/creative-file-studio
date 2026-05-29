#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT_DIR/vendor/VoxCPM"
VENV_DIR="$APP_DIR/.venv"
CACHE_DIR="$APP_DIR/hf-cache"

mkdir -p "$APP_DIR" "$CACHE_DIR"

PYTHON_CMD="${VOXCPM_PYTHON:-}"
if [ -z "$PYTHON_CMD" ]; then
  for candidate in python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      if "$candidate" -c 'import sys; raise SystemExit(0 if (3, 10) <= sys.version_info < (3, 13) else 1)' >/dev/null 2>&1; then
        PYTHON_CMD="$candidate"
        break
      fi
    fi
  done
fi

if [ -z "$PYTHON_CMD" ]; then
  echo "VoxCPM requires Python >= 3.10 and < 3.13." >&2
  echo "Install Python 3.10, 3.11, or 3.12, then run setup again." >&2
  exit 1
fi

if ! "$PYTHON_CMD" -c 'import sys; raise SystemExit(0 if (3, 10) <= sys.version_info < (3, 13) else 1)' >/dev/null 2>&1; then
  echo "Selected Python is not supported by VoxCPM: $PYTHON_CMD" >&2
  "$PYTHON_CMD" --version >&2 || true
  exit 1
fi

UV_CMD=()
if command -v uv >/dev/null 2>&1; then
  UV_CMD=(uv)
elif [ -x "$HOME/Library/Python/3.9/bin/uv" ]; then
  UV_CMD=("$HOME/Library/Python/3.9/bin/uv")
elif [ -x "$HOME/.local/bin/uv" ]; then
  UV_CMD=("$HOME/.local/bin/uv")
elif python3 -m uv --version >/dev/null 2>&1; then
  UV_CMD=(python3 -m uv)
fi

export UV_CACHE_DIR="$APP_DIR/uv-cache"
export HF_HOME="$APP_DIR/hf-home"
export HF_HUB_CACHE="$CACHE_DIR"

if [ "${#UV_CMD[@]}" -gt 0 ]; then
  "${UV_CMD[@]}" venv "$VENV_DIR" --python "$PYTHON_CMD"
else
  "$PYTHON_CMD" -m venv "$VENV_DIR"
fi

if [ -x "$VENV_DIR/bin/python" ]; then
  VENV_PYTHON="$VENV_DIR/bin/python"
elif [ -x "$VENV_DIR/Scripts/python.exe" ]; then
  VENV_PYTHON="$VENV_DIR/Scripts/python.exe"
else
  echo "Could not find Python in $VENV_DIR." >&2
  exit 1
fi

if [ "${#UV_CMD[@]}" -gt 0 ]; then
  "${UV_CMD[@]}" pip install --python "$VENV_PYTHON" --upgrade voxcpm soundfile
else
  "$VENV_PYTHON" -m pip install --upgrade pip
  "$VENV_PYTHON" -m pip install --upgrade voxcpm soundfile
fi

"$VENV_PYTHON" -c 'import importlib.metadata as m; print("VoxCPM ready:", m.version("voxcpm"))'
echo "VoxCPM app dir: $APP_DIR"
echo "VoxCPM model cache: $CACHE_DIR"
