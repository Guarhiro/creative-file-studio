# Creative File Studio

ローカル環境で動く、創作支援向けのファイル管理アプリです。作品、キャラ設定、取り込み画像、世界観資料、生成プロンプト、画像生成、画像編集、音声、動画をまとめて扱えます。
画像生成はComfyUI互換APIでローカルGPUとクラウドGPUを切り替え、画像編集は簡易ローカル処理、アスペクト比変換、手動フリーモード、ローカルAI rembg、ローカルAI backgroundremover、remove.bgクラウドAPIを切り替え、動画背景除去と動画GIF化も扱えます。動画生成は公式Seedance APIまたはOpenRouterの動画モデル、音声生成はOpenRouter TTS、ElevenLabs、Voicebox、ローカル Irodori-TTS を切り替えて使えます。

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
- `scripts/setup-irodori.sh`
- `scripts/setup-rembg.sh`
- `scripts/rembg-remove.py`
- `scripts/setup-backgroundremover.sh`
- `scripts/backgroundremover-run.py`
- `scripts/backgroundremover_sitecustomize/`
- `public/`
- `data/.gitkeep`

ZIPに含めないもの:

- `data/db.json`
- `data/uploads/`
- `data/audios/`
- `data/videos/`
- `data/rembg-models/`
- `data/backgroundremover-home/`
- `vendor/`
- `.env`
- `node_modules/`
- `.DS_Store`
- `creative-file-studio-start.log`

## 主な機能

### 作品とキャラ管理

- 作品単位でキャラ、世界観設定、その他情報を管理
- キャラ名、メモ、基本立ち絵、ベースプロンプト、ネガティブプロンプトを保存
- キャラごとにプロンプト形式を自然言語/タグから選択
- 基本立ち絵からOpenRouter経由で生成プロンプトを抽出
- 作品タイトルの並び順を画面上で変更して保存

### 世界観設定と作品資料

- 作品情報欄で世界観設定を閲覧、編集
- 画像シート最大5枚、Markdown/Textファイル、直接入力テキストを資料として取り込み
- OpenRouterで設定資料を読み取り、世界観、キャラ、衣装、道具、建築、配色、保持すべき要素を構造化
- その他情報として背景、場所、小物、設定画像などを作品に紐づけて管理

### 画像取込、画像一覧、画像整理

- 複数画像をまとめて取り込み
- 取り込み時に作品、キャラ、保存先を手動指定
- 作品内キャラだけを候補にしたAI判別
- 取り込み後に元ファイルをゴミ箱へ移動する設定に対応
- 画像の縦横サイズ、アスペクト比、判別状態を保存
- 画像一覧で作品別、キャラ別に閲覧
- 画像一覧で画面内の全選択、選択した画像のまとめて完全削除
- 画像整理で未設定、判別失敗、判別済みを絞り込み
- 大量画像でも扱いやすいページ表示、表示件数切り替え、遅延読み込み
- Finderで保存場所を表示
- 取り込み履歴だけの削除、または画像ファイル本体を含む完全削除

### Prompt Lab

- 表情差分、衣装差分、イベントシーンなどの生成プロンプトをまとめて作成
- 作品情報、世界観設定、キャラメモを反映したプロンプト生成
- キャラ設定に合わせて自然言語またはタグ形式で出力
- キャラメモを加味するかどうかを切り替え

### 画像生成

- 作品情報、世界観、キャラ情報を読んだ画像生成エージェント
- ComfyUI互換APIに送信し、ローカルGPUまたはクラウドGPUを生成ごとに選択
- API Format workflow JSONを設定し、Positive、Negative、Seed、Size、Steps、CFG、Sampler、CheckpointのNode IDを指定
- workflow JSONはJSON編集とビジュアル確認を切り替え、Node IDの差し替え対象や接続を確認
- 幅、高さ、Steps、CFG、Sampler、Scheduler、Batch、Seed、Checkpointを画面から指定
- LoRA名、Model強度、CLIP強度を指定し、生成時にComfyUIのLoraLoaderとして読み込み
- ComfyUIのCheckpoint / LoRA一覧を取得し、入力候補として表示
- 生成前にworkflowのNode ID、LoRA接続、Checkpoint / LoRA名を事前チェック
- Comfy設定をプリセットとして保存し、立ち絵、背景、表情差分など用途別に呼び出し
- 画像一覧、キャラ立ち絵、その他情報、追加アップロード画像をComfy参照画像として選択
- 選択した参照画像をComfyUIへアップロードし、指定したLoadImage系Nodeの入力へ差し替え
- Seed、CFG、Stepsを軸に複数案を投げる生成比較モード
- 生成待ちジョブの状態確認、完成画像の自動保存
- 完成画像を `data/uploads/<作品名>/_画像生成/` に保存し、画像一覧と画像整理に自動登録
- キャラ指定ありで生成した画像は、そのキャラの画像として保存

### 画像編集

- 左メニューの「画像編集」配下に「背景除去」「アスペクト比変換」「動画GIF化」を表示する階層メニューに対応
- 画像一覧、キャラ立ち絵、その他情報、生成画像、追加アップロード画像から編集元を選択
- 背景除去と透過PNG変換に対応
- 背景除去の処理方式はプルダウンではなく画面上のボタンで切り替え
- アスペクト比変換では画像を指定比率へ変換し、余白を透過/白/黒で埋め、画像位置と拡大率をスライダー・数値ステッパーで調整。操作内容はプレビューへリアルタイム反映
- 簡易ローカル処理では端末内のCanvasで背景色を推定し、許容値と境界ぼかしを調整
- 手動フリーモードではCanvas上で境界指定、ペン除去、復元ペンを使って透過PNGを調整
- ローカルAI rembgでは `isnet-general-use`、`isnet-anime`、`birefnet-general`、`u2net_human_seg` などのモデルを選択
- rembg未導入環境では画像編集画面から `vendor/rembg-venv` にセットアップ可能
- ローカルAI backgroundremoverでは `u2net`、`u2netp`、`u2net_human_seg` を選択し、Alpha mattingも試用可能
- 画像編集画面の動画背景除去ではbackgroundremoverで透過GIF、透過MOV、マット動画MP4を作成
- 動画GIF化ではffmpegでFPS、最大幅、開始秒、長さを指定してGIFを書き出し、保存時のキャラ指定があれば `data/uploads/<作品名>/<キャラ名>/`、紐づけなしなら `data/uploads/<作品名>/_画像編集/` に保存
- backgroundremover未導入環境では画像編集画面から `vendor/backgroundremover-venv` にセットアップ可能。動画処理用のffmpeg/ffprobeもアプリ内venvに用意
- クラウド処理ではremove.bg APIを選択し、透過PNGを取得
- 編集結果を `data/uploads/<作品名>/_画像編集/` に保存し、画像一覧と画像整理に自動登録
- 保存時にキャラを指定すると、そのキャラの画像として登録
- 動画背景除去の結果は `data/videos/` に保存し、動画生成の参照素材にも自動登録

### 動画生成

- 作品情報、世界観、キャラ情報、参照素材を読んだ動画生成エージェント
- 公式Seedance API、OpenRouter動画モデル、Replicate Seedance 2.0を選択
- OpenRouterではSeedance、Kling、Veo、Soraなど、ReplicateではSeedance 2.0 / Fastをプルダウンで選択
- モデルごとの対応秒数、アスペクト比、解像度、開始/終了フレーム設定を画面に反映
- 秒数、アスペクト比、解像度、音声生成、カメラ固定、透かし、Seedを指定
- 参照素材として取り込み画像、キャラ立ち絵、その他情報の参考画像、動画、音声を選択
- 作品、キャラ、素材種別で参照素材を絞り込み
- 選択中の参照素材を一覧の先頭に表示し、解除すると元の並びに戻す
- 生成待ちジョブの状態確認、完成動画の自動保存
- 生成履歴から動画、プロンプト、保存先を確認
- 今月の動画生成コスト、日本円換算、現在モデルの1秒料金を表示
- OpenRouter動画モデルの現在料金、Replicateの固定秒単価、USD/JPYレートを使って概算

### 音声生成

- 作品情報、世界観、キャラ情報を読んだ音声生成エージェント
- OpenRouter TTS、ElevenLabs、Voicebox、ローカル Irodori-TTS を切り替え
- OpenRouterでは `google/gemini-3.1-flash-tts-preview` と `x-ai/grok-voice-tts-1.0` を切り替え
- ElevenLabsではVoice ID、モデル、出力形式、Stability、Similarity、Style、Speed、Speaker Boost、言語コード、Seedを指定
- VoiceboxではローカルAPI URL、プロファイル、言語、Model size、Seed、演技指示を指定
- Irodori-TTSではVoiceDesign/Reference、Steps、候補数、Seed、CFG、デバイス、精度、参照音声を指定
- 生成音声をキャラ情報に紐づけ、作品ページのキャラカードから確認
- キャラに紐づいた生成音声を、動画生成の参照素材「音声」として選択

### 設定とモデル管理

- OpenRouter APIキー、ElevenLabs APIキー、Seedance/Replicate APIキー、ComfyUIクラウドAPIキーをブラウザのlocalStorageに保存
- 画像判別、テキスト生成、世界観読み込み、画像生成エージェント、動画エージェント、音声エージェントのモデルを個別に設定
- OpenRouterのモデル一覧と動画モデル対応設定を再取得
- ComfyUIのローカルURL、クラウドURL、workflow、Node ID、既定生成値、LoRA、workflow表示モード、モデル候補取得、事前チェック、プリセットを設定
- 画像編集画面からローカルAI rembg / backgroundremoverの状態確認とセットアップ
- 動画生成プロバイダーを公式 / OpenRouter / Replicateから選択
- VoiceboxのAPI URL、既定プロファイル、言語、Model sizeを設定
- Irodori-TTSの既存フォルダ指定、または `scripts/setup-irodori.sh` による取得

## 保存場所

- 作品、キャラ、画像メタデータ: `data/db.json`
- 取り込み画像、立ち絵: `data/uploads/作品名/キャラ名/`
- 生成完了後に保存された画像: `data/uploads/作品名/_画像生成/`
- 画像編集後に保存された画像: `data/uploads/作品名/_画像編集/`
- Comfy参照画像として追加した画像: `data/uploads/作品名/_Comfy参照画像/`
- 生成完了後に保存された音声: `data/audios/`
- 動画生成用に追加した素材: `data/uploads/作品名/_動画生成_画像/`、`_動画生成_動画/`、`_動画生成_音声/`
- 生成完了後に保存された動画: `data/videos/`
- rembgモデルキャッシュ: `data/rembg-models/`
- backgroundremoverモデルキャッシュ: `data/backgroundremover-home/.u2net/`
- OpenRouter API キー: ブラウザの localStorage
- ElevenLabs API キー: ブラウザの localStorage
- Seedance API キー: ブラウザの localStorage
- ComfyUI クラウドAPI キー: ブラウザの localStorage
- remove.bg API キー: ブラウザの localStorage

既存の `data/uploads/` 直下にある画像は、アプリ読み込み時に現在の作品・キャラ割当に合わせて自動で移動されます。未割当画像は `作品名/_未割当/` に入ります。

画像取込の「取り込み元ファイル」を「取り込み後にゴミ箱へ移動」にすると、アップロード保存と取り込み履歴の保存が終わった後で元ファイルをゴミ箱へ移動します。通常ブラウザでは元ファイルの絶対パスが取得できないため、「取り込み元フォルダ」を指定した場合だけ、そのフォルダ直下の同名、同サイズ、同内容のファイルを移動します。アプリの `data/` フォルダ内のファイルは移動対象にしません。

画像整理の「履歴削除」は `data/db.json` から取り込み記録だけを削除します。画像ファイル本体とキャラ設定の立ち絵は削除しません。

画像一覧の「完全削除」は取り込み記録と画像ファイル本体を削除します。選択した画像をまとめて完全削除することもできます。ただし同じ画像ファイルが別の履歴、キャラ立ち絵、作品情報、その他情報で使われている場合、ファイル本体は残して登録だけ削除します。

## GitHub 公開時の注意

`.gitignore` で以下を公開対象から外しています。

- `data/*`
- `node_modules/`
- `vendor/`
- `.env`
- `.DS_Store`

`data/.gitkeep` だけを含めることで、空の `data/` フォルダはリポジトリに残ります。作品データ、キャラ設定、プロンプト、取り込み画像は公開されません。

## OpenRouter

設定画面で API キーとモデルIDを保存してください。

- 画像判別モデル: 取り込み画像のキャラ判定に使います。vision 対応モデルを指定します。
- テキスト生成モデル: 通常のテキスト生成に使います。
- 世界観読み込みモデル: 設定シート画像、Markdown/Textファイル、直接入力テキストの読解に使います。vision と長文JSONに強いモデルが向いています。
- 画像生成エージェントモデル: 画像生成画面のチャットエージェントに使います。
- 動画エージェントモデル: 動画生成画面のチャットエージェントに使います。参照画像を読むため、vision 対応モデルが向いています。
- 音声エージェントモデル: 音声生成画面のチャットエージェントに使います。実際の音声生成は、音声生成画面で選んだ OpenRouter TTS、ElevenLabs、Voicebox、または Irodori-TTS で行います。

モデル一覧は設定画面の「モデル一覧を再取得」で OpenRouter から読み込みます。

## 画像生成

設定画面の ComfyUI セクションで以下を設定します。

- 既定GPU: ローカルGPUまたはクラウドGPUを選びます。画像生成画面でも生成ごとに切り替えできます。
- ローカルComfyUI URL: Comfyアプリ内の「設定」→「サーバー設定」でホストとポートを確認し、`http://(ホスト):(ポート)` の形式で入力します。例 `http://127.0.0.1:8000`
- クラウドComfyUI URL: ComfyUI互換の `/prompt`、`/history/{prompt_id}`、`/view`、`/system_stats` を公開しているURLを指定します。
- クラウドAPIキー: 必要な場合だけ保存します。送信時は `Authorization: Bearer` と `x-api-key` の両方に入ります。
- Workflow JSON: ComfyUIの `Save (API Format)` で保存したJSONを貼り付けます。
- Node ID: Positive、Negative、Seed、Size、Steps、CFG、Sampler、Checkpointの入力を書き換えるノード番号を指定します。

画像生成画面では、作品、キャラ、GPU、幅、高さ、Steps、CFG、Sampler、Scheduler、Batch、Seed、Checkpointを指定できます。エージェントに相談してプロンプト案を作ることも、プロンプト欄へ直接入力することもできます。生成比較モードをONにすると、Seed、CFG、Stepsのいずれかを軸に複数ジョブを投入し、比較結果から採用した案を生成設定へ戻せます。

生成が完了すると、画像は `data/uploads/<作品名>/_画像生成/` に保存され、画像一覧と画像整理に自動登録されます。キャラ指定ありで生成した場合は、そのキャラの画像として登録されます。

「モデル一覧取得」で `ComfyUIに接続できませんでした` と表示される場合は、ComfyUI本体が起動していないか、設定したURL/ポートが違います。ローカル利用ではComfyUIを別途起動し、Comfyアプリ内の「設定」→「サーバー設定」に表示されているホストとポートを使って、ブラウザで `http://(ホスト):(ポート)/system_stats` が開ける状態にしてから再取得してください。別ポートで起動した場合は、設定画面のローカルComfyUI URLも同じポートに変更します。

## 音声生成

音声生成画面では、作品、キャラ、生成方式、読み上げテキストを指定して音声を作成できます。キャラ指定は任意です。

生成方式は以下から選択できます。

- OpenRouter TTS: `google/gemini-3.1-flash-tts-preview` または `x-ai/grok-voice-tts-1.0` を使います。
- ElevenLabs: 指定した Voice ID とモデルでElevenLabs APIを呼び出し、音声ファイルを保存します。
- Voicebox: この端末またはリモートで起動したVoicebox APIへ接続し、保存済みプロファイルの声で音声ファイルを保存します。
- Irodori-TTS: この端末上の Irodori-TTS を `uv run python infer.py` で実行し、WAVを保存します。

OpenRouter選択時:

- 生成モデル: `google/gemini-3.1-flash-tts-preview`、`x-ai/grok-voice-tts-1.0`
- ボイス: Geminiは `Kore` などのGemini TTSボイス、Grokは `eve`、`ara`、`rex`、`sal`、`leo` を選択できます。
- 出力形式: MP3またはPCMを選べます。PCMはアプリ内で再生しやすいようWAVに変換して保存します。Geminiは従来どおりPCM保存が既定、GrokはMP3保存が既定です。
- APIキー: 設定画面のOpenRouter APIキーを使います。
- 演技指示: 声質、感情、速度、間、距離感、アクセント、インライン音声タグを指定できます。
- エージェント: 作品情報、世界観、キャラメモを参照して、読み上げ本文と演技指示を分けて作ります。Geminiでは生成時に本文と演技指示をTTS向けのプロンプトに合成します。Grokでは本文とボイスを中心に送信し、本文内の `[pause]`、`[laugh]`、`<whisper>` などのタグで演技ニュアンスを補えます。

ElevenLabs選択時:

- APIキー: 設定画面のElevenLabs APIキーを使います。
- Voice ID: 既定値を設定画面で保存でき、音声生成画面でもプルダウンから生成ごとに変更できます。
- 音声一覧: 設定画面または音声生成画面の「音声一覧取得」で利用可能なVoice IDを読み込み、声の名前付きプルダウンから選べます。
- モデル: `eleven_multilingual_v2`、`eleven_turbo_v2_5`、`eleven_flash_v2_5`、`eleven_v3` などをプルダウンから選べます。「モデル一覧取得」でElevenLabs APIのTTS対応モデルも読み込めます。
- 出力形式: MP3、WAV、PCMを選べます。PCMはアプリ内で再生しやすいようWAVに変換して保存します。
- 演技指示: 音声生成画面で声質、感情、速度、間、距離感をメモとして指定でき、生成履歴にも保存されます。
- Voice settings: Stability、Similarity、Style、Speed、Speaker Boost、言語コード、Seedを指定できます。

Voicebox選択時:

- API URL: 既定では `http://127.0.0.1:17493` に接続します。Voiceboxアプリを起動してから「プロファイル取得」を押します。
- プロファイル: Voicebox側で作成済みの音声プロファイルを一覧から選びます。
- 言語、Model size、Seed: 生成ごとに指定できます。
- 演技指示: Voiceboxの `instruct` に送信し、生成履歴にも保存します。対応しないエンジンでは無視される場合があります。
- 生成結果はVoiceboxの `/generate` と `/audio/{generation_id}` から取得し、このアプリの `data/audios/` に保存します。

Irodori-TTS選択時:

- 出力形式: WAV
- VoiceDesign / Reference を選択できます。
- Steps、候補数、Seed、Text CFG、Caption CFG、Speaker CFG、モデル/Codecのデバイスと精度、カスタムチェックポイントを指定できます。
- Reference用の参照音声をアップロードできます。
- 設定画面の「Irodori-TTS連携」で既存のIrodori-TTSフォルダを指定できます。
- 未導入環境では「Irodori-TTSを取得」を押すと `scripts/setup-irodori.sh` が `vendor/Irodori-TTS` にGitHubから取得し、`uv sync` を実行します。`uv` がない場合はインストール案内が表示されます。

キャラを指定して生成した音声は、そのキャラに紐づいて保存されます。作品ページのキャラカードから最新音声を再生でき、「音声一覧」で過去の音声も確認できます。

動画生成画面で参照素材の種類を「音声」にすると、アップロード済み音声に加えて、キャラに紐づいた生成音声も表示されます。キャラで絞り込むと、そのキャラの音声だけを参照素材として選べます。

## 動画生成

設定画面の Seedance セクションで以下を設定します。

- API キー: 公式APIを使う場合は公式側のキー、OpenRouterを使う場合はOpenRouterキー、Replicateを使う場合はReplicate tokenを使います。OpenRouterを選んだ場合は、上のOpenRouter APIキー欄のキーを優先して使います。
- 動画生成プロバイダー: `公式 BytePlus / Volcengine`、`OpenRouter`、`Replicate` をプルダウンで選択します。
- 動画モデル: 公式APIでは `dreamina-seedance-2-0-260128`、OpenRouterでは動画モデル一覧、Replicateでは `bytedance/seedance-2.0` または `bytedance/seedance-2.0-fast` から選択します。
- 既定解像度: 動画生成画面の初期値として使います。

OpenRouter選択時は、動画モデル専用APIから対応設定を取得します。取得できない場合も、以下のモデルはフォールバック設定で選択できます。

- `bytedance/seedance-2.0`
- `bytedance/seedance-2.0-fast`
- `kwaivgi/kling-v3.0-std`
- `kwaivgi/kling-v3.0-pro`
- `google/veo-3.1-fast`
- `google/veo-3.1-lite`
- `google/veo-3.1`
- `openai/sora-2-pro`

Replicate選択時は、`https://api.replicate.com/v1/models/{owner}/{model}/predictions` に送信し、`predictions/{id}` をポーリングします。完成動画URLは取得後に `data/videos` へ保存します。

動画生成画面では、作品、キャラ、秒数、アスペクト比、解像度、音声生成、カメラ固定、透かし、Seedを指定できます。

画面上部には、今月作成した動画ジョブ全体のコスト目安を表示します。

- `現在料金を取得`: OpenRouter選択時は動画モデル料金とUSD/JPYレート、Replicate選択時は固定秒単価とUSD/JPYレートを保存します。
- 日本円概算: 生成履歴の実コストが取得できる場合は実コストを優先し、未取得のジョブはモデル、秒数、解像度、アスペクト比から概算します。
- 現在モデルの1秒料金: 選択中の動画モデル、解像度、アスペクト比に応じた秒単価を表示します。

OpenRouterの料金取得にはOpenRouter APIキーが必要です。Replicateはアプリ内の固定秒単価を使います。取得できない場合も、保存済み料金またはフォールバック料金で概算表示します。

生成中は、プロバイダが進捗率を返す場合はパーセントを表示します。進捗率が返らない場合も、送信中・待機中・生成中などの状態、経過時間、最終更新時刻を表示します。

参照素材には以下を使えます。

- 取り込み済み画像
- キャラの基本立ち絵
- その他情報の参考画像
- 動画生成画面から追加した画像、動画、音声
- 音声生成画面で作成し、キャラに紐づいた音声

参照素材は作品、キャラ、素材種別で絞り込めます。チェックした素材はすぐ解除できるよう一覧の先頭に移動し、チェックを外すと元の並びに戻ります。

生成が完了すると、動画は自動で `data/videos/` に保存されます。保存済み動画は動画生成画面のジョブ一覧から確認できます。「最終フレーム返却」がONのジョブでは、保存済み動画の最後のフレームをPNGとして `data/uploads/<作品名>/_動画生成_画像/` に保存し、参照素材へ自動追加します。既存の完了ジョブは、ジョブ一覧の「最終フレーム保存」から後で追加できます。

## トラブルシュート

更新後に新しい機能が動かない、または `Not found` が出る場合は、起動中のサーバーが古いままの可能性があります。ターミナルで `Ctrl + C` を押して停止し、もう一度起動してください。ブラウザもリロードしてください。

Seedance/OpenRouter/Replicateの動画生成で `401` が出る場合は、設定画面のOpenRouter APIキーとSeedance/Replicate APIキーを確認してください。OpenRouter経由の完成動画は、保存時にも認証が必要になることがあります。このアプリはOpenRouter選択時に認証付きダウンロードを試します。

生成ジョブの「更新」を押しても古いエラーが残る場合は、アプリを完全に再起動してから再度「更新」を押してください。
