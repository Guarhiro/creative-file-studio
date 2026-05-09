# Creative File Studio

ローカル環境で動く、創作支援向けのファイル管理アプリです。作品、キャラ設定、取り込み画像、AIによる振り分け、生成プロンプト作成をまとめて扱えます。
Seedance / OpenRouter 経由の動画生成エージェントも搭載しています。

## 起動

```bash
npm start
```

ブラウザで `http://localhost:4173` を開きます。

### Windowsで起動

`start-windows.bat` をダブルクリックします。

終了するときは、開いた黒い画面を閉じるか `Ctrl + C` を押します。

### Macで起動

初回だけターミナルで実行権限を付けます。

```bash
chmod +x start-mac.command
```

その後は `start-mac.command` をダブルクリックします。

終了するときは、開いたターミナルを閉じるか `Ctrl + C` を押します。

すでに `http://localhost:4173` でサーバーが起動している場合、`start-mac.command` は新しく起動せずブラウザだけ開きます。エラーが起きた場合もターミナルを閉じず、原因を表示します。

4173番ポートが別アプリで使用中の場合は、4174以降の空きポートを自動で探して起動します。その場合はターミナルに表示されたURLを使ってください。

起動に失敗した場合は、同じフォルダに `creative-file-studio-start.log` が作成されます。そこに表示されたエラー内容を確認してください。

## ユーザーデータを保持したまま更新

GitHub Releasesの最新版ZIP、手元の更新用ZIP、または展開済みの最新版フォルダを使って、`data/` を残したままアプリ本体だけ更新できます。

最新版ZIPのRelease添付URL:

```text
https://github.com/Guarhiro/creative-file-studio/releases/latest/download/creative-file-studio-upload.zip
```

保持されるもの:

- `data/db.json`
- `data/uploads/`
- `.env`
- `node_modules/`
- `creative-file-studio-start.log`

### Windowsで更新

`update-windows.bat` をダブルクリックします。

- Enterだけ押す: GitHub Releasesから最新版を自動取得して更新
- パスを入力する: 手元の更新ZIPまたは展開済み最新版フォルダから更新

### Macで更新

初回だけ実行権限を付けます。

```bash
chmod +x update-mac.command
```

その後は `update-mac.command` をダブルクリックします。

- Enterだけ押す: GitHub Releasesから最新版を自動取得して更新
- ZIP/フォルダをドラッグしてEnter: 手元の更新ZIPまたは展開済み最新版フォルダから更新

更新後、起動中のサーバーがある場合は `Ctrl + C` で停止してから再起動してください。

## Release ZIPの作成

GitHub Releasesには、最新版の公開構成を `creative-file-studio-upload.zip` という名前で添付します。

ZIPに含めるもの:

- `.gitignore`
- `.env.example`
- `README.md`
- `package.json`
- `server.js`
- `Seedance2.0_Prompt_Guide_v2.md`
- `start-mac.command`
- `start-windows.bat`
- `update-mac.command`
- `update-windows.bat`
- `public/`
- `data/.gitkeep`

ZIPに含めないもの:

- `data/db.json`
- `data/uploads/`
- `data/videos/`
- `.env`
- `node_modules/`
- `.DS_Store`
- `creative-file-studio-start.log`

## 主な機能

- 作品ごとのキャラ管理
- キャラ名、ベースプロンプト、ネガティブプロンプト、メモ、基本立ち絵の保存
- キャラごとにプロンプト形式を自然言語/タグから選択
- 基本立ち絵から OpenRouter 経由でプロンプト抽出
- 複数画像の一括取り込み
- 取り込み時に画像の縦横サイズとアスペクト比を保存
- 取り込み時に保存先キャラを手動指定
- 作品指定時は、その作品内のキャラだけを候補にしたAI判別
- 画像分析時に自然言語/タグ形式を選択
- 画像一覧で作品別、キャラ別に閲覧
- Finderで画像の保存場所を表示
- 画像一覧から登録と画像ファイル本体を完全削除
- 未設定、判別失敗、判別済みの画像整理
- 画像整理でキャラ別に絞り込み
- 画像整理から取り込み履歴を個別/表示中まとめて削除
- 表情差分やイベントシーン指定からのプロンプト一括生成
- 差分プロンプトはキャラ設定の形式に合わせて自然言語またはタグで生成
- 差分プロンプト生成時にキャラメモを加味するか切り替え
- 作品情報、世界観、キャラ情報、参照素材を読んだ動画生成エージェント
- Seedance 2.0 向けのプロンプト案作成
- Seedance API Base URL を公式 / OpenRouter から選択
- 動画生成の参照素材として、取り込み画像、キャラ立ち絵、その他参考画像、動画、音声を選択
- 動画生成画面で作品・キャラ・素材種別による参照素材の絞り込み
- 選択した参照素材を自動で一覧の先頭に表示し、チェック解除で元の位置に戻す
- 生成待ちジョブの状態確認と、完成動画の自動保存

## 保存場所

- 作品、キャラ、画像メタデータ: `data/db.json`
- 取り込み画像、立ち絵: `data/uploads/作品名/キャラ名/`
- 動画生成用に追加した素材: `data/uploads/作品名/_動画生成_画像/`、`_動画生成_動画/`、`_動画生成_音声/`
- 生成完了後に保存された動画: `data/videos/`
- OpenRouter API キー: ブラウザの localStorage
- Seedance API キー: ブラウザの localStorage

既存の `data/uploads/` 直下にある画像は、アプリ読み込み時に現在の作品・キャラ割当に合わせて自動で移動されます。未割当画像は `作品名/_未割当/` に入ります。

画像整理の「履歴削除」は `data/db.json` から取り込み記録だけを削除します。画像ファイル本体とキャラ設定の立ち絵は削除しません。

画像一覧の「完全削除」は取り込み記録と画像ファイル本体を削除します。ただし同じ画像ファイルが別の履歴やキャラ立ち絵で使われている場合、ファイル本体は残して登録だけ削除します。

## GitHub 公開時の注意

`.gitignore` で以下を公開対象から外しています。

- `data/*`
- `node_modules/`
- `.env`
- `.DS_Store`

`data/.gitkeep` だけを含めることで、空の `data/` フォルダはリポジトリに残ります。作品データ、キャラ設定、プロンプト、取り込み画像は公開されません。

## OpenRouter

設定画面で API キーとモデルIDを保存してください。

- 画像判別モデル: 取り込み画像のキャラ判定に使います。vision 対応モデルを指定します。
- テキスト生成モデル: 通常のテキスト生成に使います。
- 世界観読み込みモデル: 設定シート画像の読解に使います。vision と長文JSONに強いモデルが向いています。
- 動画エージェントモデル: 動画生成画面のチャットエージェントに使います。参照画像を読むため、vision 対応モデルが向いています。

モデル一覧は設定画面の「モデル一覧を再取得」で OpenRouter から読み込みます。

## Seedance / 動画生成

設定画面の Seedance セクションで以下を設定します。

- API キー: 公式APIを使う場合は公式側のキー、OpenRouterを使う場合はOpenRouterキーを使います。OpenRouterを選んだ場合は、上のOpenRouter APIキー欄のキーを優先して使います。
- API Base URL: `公式 BytePlus / Volcengine` または `OpenRouter` をプルダウンで選択します。
- Seedance モデル: 公式APIでは `dreamina-seedance-2-0-260128`、OpenRouterでは `bytedance/seedance-2.0` が既定です。
- 既定解像度: 動画生成画面の初期値として使います。

動画生成画面では、作品、キャラ、秒数、アスペクト比、解像度、音声生成、カメラ固定、透かし、Seedを指定できます。

参照素材には以下を使えます。

- 取り込み済み画像
- キャラの基本立ち絵
- その他情報の参考画像
- 動画生成画面から追加した画像、動画、音声

参照素材は作品、キャラ、素材種別で絞り込めます。チェックした素材はすぐ解除できるよう一覧の先頭に移動し、チェックを外すと元の並びに戻ります。

生成が完了すると、動画は自動で `data/videos/` に保存されます。保存済み動画は動画生成画面のジョブ一覧から確認できます。

## トラブルシュート

更新後に新しい機能が動かない、または `Not found` が出る場合は、起動中のサーバーが古いままの可能性があります。ターミナルで `Ctrl + C` を押して停止し、もう一度起動してください。ブラウザもリロードしてください。

Seedance/OpenRouterの動画生成で `401` が出る場合は、設定画面のOpenRouter APIキーとSeedance APIキーを確認してください。OpenRouter経由の完成動画は、保存時にも認証が必要になることがあります。このアプリはOpenRouter選択時に認証付きダウンロードを試します。

生成ジョブの「更新」を押しても古いエラーが残る場合は、アプリを完全に再起動してから再度「更新」を押してください。
