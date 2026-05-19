#!/bin/bash
cd "$(dirname "$0")" || exit 1

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"
LOG_FILE="$(pwd)/creative-file-studio-start.log"
exec > >(tee "${LOG_FILE}") 2>&1

START_PORT="${PORT:-4173}"
PORT="${START_PORT}"
URL="http://localhost:${PORT}"

echo "Creative File Studio"
echo "Project: $(pwd)"
echo "Log: ${LOG_FILE}"
echo "URL: ${URL}"
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

is_port_busy() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else
    is_http_up "$1"
  fi
}

if is_http_up "${PORT}"; then
  echo "すでに ${URL} でサーバーが起動しています。ブラウザを開きます。"
  open "${URL}"
  echo
  read -r -p "Enterキーで閉じます..."
  exit 0
fi

if is_port_busy "${PORT}"; then
  echo "${PORT} 番ポートは別のプロセスが使用中です。空きポートを探します。"
  for candidate in $(seq $((START_PORT + 1)) $((START_PORT + 20))); do
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
echo "サーバーを ${URL} で起動します。終了するには Ctrl + C を押してください。"
(sleep 2; open "${URL}") &
node server.js

STATUS=$?
echo
echo "サーバーが停止しました。終了コード: ${STATUS}"
echo "接続できない場合は、上に表示されたエラー内容を確認してください。"
echo "ログも保存されています: ${LOG_FILE}"
echo
read -r -p "Enterキーで閉じます..."
