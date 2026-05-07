@echo off
setlocal
cd /d "%~dp0"

echo Creative File Studio Updater
echo Project: %cd%
echo.
echo Press Enter to download the latest release from GitHub.
echo Or enter an update ZIP / extracted latest folder path:
set /p SOURCE="> "

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$releaseUrl='https://github.com/Guarhiro/creative-file-studio/releases/latest/download/creative-file-studio-upload.zip';" ^
  "$app=(Get-Location).Path;" ^
  "$src='%SOURCE%'.Trim();" ^
  "$src=$src.Trim([char]34).Trim([char]39);" ^
  "$temp=$null;" ^
  "if([string]::IsNullOrWhiteSpace($src)){" ^
  "  $temp=Join-Path ([IO.Path]::GetTempPath()) ('creative-file-studio-update-' + [guid]::NewGuid());" ^
  "  New-Item -ItemType Directory -Path $temp | Out-Null;" ^
  "  $src=Join-Path $temp 'creative-file-studio-upload.zip';" ^
  "  Write-Host 'GitHub Releasesから最新版をダウンロードしています...';" ^
  "  Write-Host $releaseUrl;" ^
  "  Invoke-WebRequest -Uri $releaseUrl -OutFile $src;" ^
  "}" ^
  "if(-not (Test-Path -LiteralPath $src)){ throw '指定されたファイルまたはフォルダが見つかりません。' }" ^
  "if(Test-Path -LiteralPath $src -PathType Leaf){" ^
  "  if([IO.Path]::GetExtension($src).ToLower() -ne '.zip'){ throw 'ZIPファイル、または展開済みフォルダを指定してください。' }" ^
  "  if(-not $temp){ $temp=Join-Path ([IO.Path]::GetTempPath()) ('creative-file-studio-update-' + [guid]::NewGuid()); New-Item -ItemType Directory -Path $temp | Out-Null }" ^
  "  $extract=Join-Path $temp 'extract';" ^
  "  New-Item -ItemType Directory -Path $extract -Force | Out-Null;" ^
  "  Expand-Archive -LiteralPath $src -DestinationPath $extract -Force;" ^
  "  $src=$extract;" ^
  "}" ^
  "$nested=Join-Path $src 'creative-file-studio-upload';" ^
  "if(Test-Path -LiteralPath $nested -PathType Container){ $src=$nested }" ^
  "if(-not (Test-Path -LiteralPath (Join-Path $src 'server.js')) -or -not (Test-Path -LiteralPath (Join-Path $src 'public'))){ throw '最新版フォルダの形式が正しくありません。server.js と public\ が必要です。' }" ^
  "Write-Host 'ユーザーデータを保持したまま更新します。';" ^
  "Write-Host '保持するもの: data\, .env, node_modules\, ログ';" ^
  "$files=@('server.js','package.json','README.md','.gitignore','.env.example','start-mac.command','start-windows.bat','update-mac.command','update-windows.bat');" ^
  "foreach($file in $files){ $from=Join-Path $src $file; if(Test-Path -LiteralPath $from -PathType Leaf){ Copy-Item -LiteralPath $from -Destination (Join-Path $app $file) -Force } }" ^
  "$publicFrom=Join-Path $src 'public'; $publicTo=Join-Path $app 'public';" ^
  "if(Test-Path -LiteralPath $publicFrom -PathType Container){ if(Test-Path -LiteralPath $publicTo){ Remove-Item -LiteralPath $publicTo -Recurse -Force }; Copy-Item -LiteralPath $publicFrom -Destination $publicTo -Recurse -Force }" ^
  "if($temp){ Remove-Item -LiteralPath $temp -Recurse -Force }" ^
  "Write-Host ''; Write-Host '更新が完了しました。起動中のサーバーがある場合は停止して再起動してください。';"

if errorlevel 1 (
  echo.
  echo Update failed.
  pause
  exit /b 1
)

echo.
pause
