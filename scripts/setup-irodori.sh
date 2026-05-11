#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor"
UPSTREAM_DIR="$VENDOR_DIR/Irodori-TTS"
REPO_URL="https://github.com/Aratako/Irodori-TTS.git"

mkdir -p "$VENDOR_DIR"

if [ ! -f "$UPSTREAM_DIR/infer.py" ]; then
  if ! command -v git >/dev/null 2>&1; then
    echo "git is required to download Irodori-TTS." >&2
    echo "Install git, then run this setup again." >&2
    exit 1
  fi
  if [ -e "$UPSTREAM_DIR" ]; then
    echo "$UPSTREAM_DIR exists but infer.py was not found." >&2
    echo "Move it away or set the correct Irodori-TTS path in the app settings." >&2
    exit 1
  fi
  git clone "$REPO_URL" "$UPSTREAM_DIR"
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

if [ "${#UV_CMD[@]}" -eq 0 ]; then
  echo "uv is required to run Irodori-TTS." >&2
  echo "Install with: python3 -m pip install --user uv" >&2
  echo "Or follow: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi

cd "$UPSTREAM_DIR"
"${UV_CMD[@]}" sync

echo "Irodori-TTS is ready: $UPSTREAM_DIR"
