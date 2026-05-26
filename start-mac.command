#!/bin/bash
cd "$(dirname "$0")" || exit 1

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"
LOG_FILE="$(pwd)/creative-file-studio-start.log"
ANIMADEX_LOG_FILE="$(pwd)/animadex-start.log"
exec > >(tee "${LOG_FILE}") 2>&1

START_PORT="${PORT:-4173}"
PORT="${START_PORT}"
HOST="${HOST:-0.0.0.0}"
URL="http://localhost:${PORT}"
ANIMADEX_DIR="${ANIMADEX_DIR:-${HOME}/AnimaDex}"
ANIMADEX_URL="${ANIMADEX_URL:-http://127.0.0.1:5000}"
ANIMADEX_PID=""
ANIMADEX_STARTED=0

echo "Creative File Studio"
echo "Project: $(pwd)"
echo "Log: ${LOG_FILE}"
echo "URL: ${URL}"
if [ "${HOST}" = "0.0.0.0" ]; then
  echo "Smartphone URL candidates:"
  for iface in en0 en1 en2; do
    IP="$(ipconfig getifaddr "${iface}" 2>/dev/null || true)"
    if [ -n "${IP}" ]; then
      echo "  http://${IP}:${PORT}"
    fi
  done
fi
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js が見つかりません。Node.js v18以上をインストールしてください。"
  echo "Homebrew版Node.jsの場合は /opt/homebrew/bin または /usr/local/bin に node があるか確認してください。"
  echo
  read -r -p "Enterキーで閉じます..."
  exit 1
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null)"
if [ -z "${NODE_MAJOR}" ] || [ "${NODE_MAJOR}" -lt 18 ]; then
  echo "Node.js v18以上が必要です。現在のバージョン: $(node -v)"
  echo "https://nodejs.org/ からLTS版をインストールしてください。"
  echo
  read -r -p "Enterキーで閉じます..."
  exit 1
fi

echo "Node: $(node -v)"
echo

is_http_up() {
  curl -fsS "http://localhost:$1" >/dev/null 2>&1
}

is_current_server_up() {
  curl -fsS -X POST \
    -H "content-type: application/json" \
    --data '{}' \
    "http://localhost:$1/api/image-edit/video-gif/status" >/dev/null 2>&1
}

is_port_busy() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    is_http_up "$1"
  fi
}

is_url_up() {
  curl -fsS "$1" >/dev/null 2>&1
}

animadex_health_url() {
  printf "%s/api/characters/search" "${ANIMADEX_URL%/}"
}

start_animadex() {
  case "${ANIMADEX_AUTOSTART:-1}" in
    0|false|FALSE|no|NO)
      echo "AnimaDex自動起動: OFF"
      return 0
      ;;
  esac

  echo "AnimaDex URL: ${ANIMADEX_URL}"
  echo "AnimaDex log: ${ANIMADEX_LOG_FILE}"

  if is_url_up "$(animadex_health_url)"; then
    echo "AnimaDexはすでに起動しています。"
    return 0
  fi

  if [ ! -d "${ANIMADEX_DIR}" ]; then
    echo "AnimaDexフォルダが見つからないため、自動起動をスキップします: ${ANIMADEX_DIR}"
    echo "必要な場合は ~/AnimaDex にAnimaDexをセットアップしてください。"
    return 0
  fi

  if [ ! -f "${ANIMADEX_DIR}/.venv/bin/activate" ]; then
    echo "AnimaDexの仮想環境が見つからないため、自動起動をスキップします: ${ANIMADEX_DIR}/.venv"
    echo "AnimaDexフォルダでセットアップを完了してから再度起動してください。"
    return 0
  fi

  echo "AnimaDexを起動しています..."
  (
    cd "${ANIMADEX_DIR}" || exit 1
    PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"
    exec zsh -lc '. .venv/bin/activate && python -m animadex serve'
  ) > "${ANIMADEX_LOG_FILE}" 2>&1 &
  ANIMADEX_PID="$!"
  ANIMADEX_STARTED=1

  for _ in $(seq 1 30); do
    if is_url_up "$(animadex_health_url)"; then
      echo "AnimaDexを起動しました。"
      return 0
    fi
    if ! kill -0 "${ANIMADEX_PID}" >/dev/null 2>&1; then
      echo "AnimaDexの起動に失敗しました。ログを確認してください: ${ANIMADEX_LOG_FILE}"
      tail -n 40 "${ANIMADEX_LOG_FILE}" 2>/dev/null || true
      ANIMADEX_PID=""
      ANIMADEX_STARTED=0
      return 0
    fi
    sleep 1
  done

  echo "AnimaDexの起動確認がタイムアウトしました。Creative File Studioは続けて起動します。"
  echo "必要に応じてログを確認してください: ${ANIMADEX_LOG_FILE}"
}

stop_started_animadex() {
  case "${ANIMADEX_STOP_WITH_APP:-1}" in
    0|false|FALSE|no|NO)
      return 0
      ;;
  esac

  if [ "${ANIMADEX_STARTED}" = "1" ] && [ -n "${ANIMADEX_PID}" ] && kill -0 "${ANIMADEX_PID}" >/dev/null 2>&1; then
    echo "AnimaDexを停止します。"
    kill "${ANIMADEX_PID}" >/dev/null 2>&1 || true
  fi
}

start_animadex
echo

if is_http_up "${PORT}"; then
  if is_current_server_up "${PORT}"; then
    echo "すでに ${URL} で最新版サーバーが起動しています。ブラウザを開きます。"
    open "${URL}"
    echo
    read -r -p "Enterキーで閉じます..."
    exit 0
  fi
  echo "${PORT} 番ポートには古いサーバーが起動している可能性があります。空きポートで最新版を起動します。"
fi

if is_port_busy "${PORT}"; then
  echo "${PORT} 番ポートは別のプロセスが使用中です。空きポートを探します。"
  for candidate in $(seq $((START_PORT + 1)) $((START_PORT + 20))); do
    if is_current_server_up "${candidate}"; then
      PORT="${candidate}"
      URL="http://localhost:${PORT}"
      echo "すでに ${URL} で最新版サーバーが起動しています。ブラウザを開きます。"
      open "${URL}"
      echo
      read -r -p "Enterキーで閉じます..."
      exit 0
    fi
    if ! is_port_busy "${candidate}"; then
      PORT="${candidate}"
      URL="http://localhost:${PORT}"
      break
    fi
  done
fi

if is_port_busy "${PORT}"; then
  echo "空きポートが見つかりませんでした。起動中の別アプリを終了してから再試行してください。"
  echo
  read -r -p "Enterキーで閉じます..."
  exit 1
fi

export PORT
export HOST
echo "サーバーを ${URL} で起動します。終了するには Ctrl + C を押してください。"
if [ "${HOST}" = "0.0.0.0" ]; then
  echo "Smartphone URL candidates:"
  for iface in en0 en1 en2; do
    IP="$(ipconfig getifaddr "${iface}" 2>/dev/null || true)"
    if [ -n "${IP}" ]; then
      echo "  http://${IP}:${PORT}"
    fi
  done
  echo "同じネットワークのスマホからは、このURLを開いてください。"
fi
(sleep 2; open "${URL}") &
if [ "${ANIMADEX_STARTED}" = "1" ]; then
  trap stop_started_animadex EXIT INT TERM
fi
node server.js

STATUS=$?
echo
echo "サーバーが停止しました。終了コード: ${STATUS}"
echo "接続できない場合は、上に表示されたエラー内容を確認してください。"
echo "ログも保存されています: ${LOG_FILE}"
echo
read -r -p "Enterキーで閉じます..."
