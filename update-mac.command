#!/bin/bash
cd "$(dirname "$0")" || exit 1

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"
RELEASE_URL="https://github.com/Guarhiro/creative-file-studio/releases/latest/download/creative-file-studio-upload.zip"

echo "Creative File Studio Updater"
echo "Project: $(pwd)"
echo
echo "Enterだけ押すとGitHub Releasesから最新版を自動取得します。"
echo "手動更新する場合は、更新ZIPまたは展開済み最新版フォルダをこのウィンドウへドラッグしてEnterを押してください。"
read -r -p "> " SOURCE

SOURCE="${SOURCE%\"}"
SOURCE="${SOURCE#\"}"
SOURCE="${SOURCE%\'}"
SOURCE="${SOURCE#\'}"
SOURCE="${SOURCE% }"

APP_DIR="$(pwd)"
WORK_DIR=""

if [ -z "${SOURCE}" ]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl が見つからないため、自動更新できません。手動で更新ZIPを指定してください。"
    echo
    read -r -p "Enterキーで閉じます..."
    exit 1
  fi
  WORK_DIR="$(mktemp -d)"
  SOURCE="${WORK_DIR}/creative-file-studio-upload.zip"
  echo "GitHub Releasesから最新版をダウンロードしています..."
  echo "${RELEASE_URL}"
  if ! curl -fL "${RELEASE_URL}" -o "${SOURCE}"; then
    echo "最新版ZIPのダウンロードに失敗しました。Releaseに creative-file-studio-upload.zip が添付されているか確認してください。"
    echo
    read -r -p "Enterキーで閉じます..."
    exit 1
  fi
fi

if [ ! -e "${SOURCE}" ]; then
  echo "指定されたファイルまたはフォルダが見つかりません。"
  echo
  read -r -p "Enterキーで閉じます..."
  exit 1
fi

if [ -f "${SOURCE}" ]; then
  case "${SOURCE}" in
    *.zip)
      if [ -z "${WORK_DIR}" ]; then
        WORK_DIR="$(mktemp -d)"
      fi
      EXTRACT_DIR="${WORK_DIR}/extract"
      mkdir -p "${EXTRACT_DIR}"
      echo "ZIPを展開しています..."
      ditto -x -k "${SOURCE}" "${EXTRACT_DIR}"
      SOURCE_DIR="${EXTRACT_DIR}"
      ;;
    *)
      echo "ZIPファイル、または展開済みフォルダを指定してください。"
      echo
      read -r -p "Enterキーで閉じます..."
      exit 1
      ;;
  esac
else
  SOURCE_DIR="${SOURCE}"
fi

if [ -d "${SOURCE_DIR}/creative-file-studio-upload" ]; then
  SOURCE_DIR="${SOURCE_DIR}/creative-file-studio-upload"
fi

if [ ! -f "${SOURCE_DIR}/server.js" ] || [ ! -d "${SOURCE_DIR}/public" ]; then
  echo "最新版フォルダの形式が正しくありません。server.js と public/ が必要です。"
  echo
  read -r -p "Enterキーで閉じます..."
  exit 1
fi

echo
echo "ユーザーデータを保持したまま更新します。"
echo "保持するもの: data/, .env, node_modules/, ログ"
echo

copy_item() {
  local item="$1"
  if [ -e "${SOURCE_DIR}/${item}" ]; then
    rsync -a --delete "${SOURCE_DIR}/${item}" "${APP_DIR}/"
  fi
}

copy_file() {
  local item="$1"
  if [ -f "${SOURCE_DIR}/${item}" ]; then
    cp "${SOURCE_DIR}/${item}" "${APP_DIR}/${item}"
  fi
}

copy_item "public"
copy_file "server.js"
copy_file "package.json"
copy_file "README.md"
copy_file ".gitignore"
copy_file ".env.example"
copy_file "start-mac.command"
copy_file "start-windows.bat"
copy_file "update-mac.command"
copy_file "update-windows.bat"

chmod +x "${APP_DIR}/start-mac.command" 2>/dev/null
chmod +x "${APP_DIR}/update-mac.command" 2>/dev/null

if [ -n "${WORK_DIR}" ]; then
  rm -rf "${WORK_DIR}"
fi

echo
echo "更新が完了しました。"
echo "起動中のサーバーがある場合は Ctrl + C で停止し、再起動してください。"
echo
read -r -p "Enterキーで閉じます..."
