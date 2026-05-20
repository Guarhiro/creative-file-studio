const app = document.querySelector("#app");
const modalTemplate = document.querySelector("#modal-template");

const state = {
  db: null,
  view: "studio",
  selectedWorkId: null,
  galleryWorkId: null,
  galleryCharacterId: "",
  gallerySelectedAssetIds: [],
  galleryFiltersCollapsed: false,
  importFiles: [],
  importIsRunning: false,
  importAutoClassify: true,
  importPromptFormat: "natural",
  importCharacterId: "",
  importWorldItemId: "",
  libraryStatus: "all",
  libraryCharacterId: "all",
  librarySort: "newest",
  libraryPage: 1,
  libraryPageSize: 48,
  imageWorkId: null,
  imageCharacterId: "",
  imageGpuMode: "local",
  imageChatMessages: [
    { role: "assistant", content: "画像生成エージェントです。作りたい絵の構図、雰囲気、衣装、背景、避けたい要素を教えてください。" }
  ],
  imagePromptDraft: null,
  imageChatDraft: "",
  imageIsThinking: false,
  imageIsGenerating: false,
  imagePollingJobId: "",
  imageCompareEnabled: false,
  imageCompareCount: 3,
  imageCompareMode: "seed",
  imageEditWorkId: null,
  imageEditCharacterId: "",
  imageEditSourceKey: "",
  imageEditProvider: "local",
  imageEditBackgroundMode: "auto",
  imageEditTolerance: 42,
  imageEditFeather: 18,
  imageEditChromaColor: "#ffffff",
  imageEditRembgModel: "isnet-general-use",
  imageEditRembgAlphaMatting: false,
  imageEditRembgPostProcess: true,
  imageEditBackgroundRemoverModel: "u2net",
  imageEditBackgroundRemoverAlphaMatting: false,
  imageEditBackgroundRemoverErodeSize: 10,
  imageEditManualTool: "erase",
  imageEditManualBrushSize: 42,
  imageEditInputFile: null,
  imageEditResult: null,
  imageEditIsRunning: false,
  rembgStatus: "idle",
  rembgInfo: null,
  rembgError: "",
  backgroundRemoverStatus: "idle",
  backgroundRemoverInfo: null,
  backgroundRemoverError: "",
  backgroundRemoverVideoFile: null,
  backgroundRemoverVideoModel: "u2net",
  backgroundRemoverVideoMode: "transparent-gif",
  backgroundRemoverVideoFrameRate: 30,
  backgroundRemoverVideoFrameLimit: -1,
  backgroundRemoverVideoGpuBatchSize: 1,
  backgroundRemoverVideoWorkerCount: 1,
  backgroundRemoverVideoResult: null,
  backgroundRemoverVideoIsRunning: false,
  videoGifFile: null,
  videoGifFrameRate: 12,
  videoGifWidth: 640,
  videoGifStartTime: 0,
  videoGifDuration: 6,
  videoGifResult: null,
  videoGifIsRunning: false,
  videoGifStatus: "idle",
  videoGifInfo: null,
  videoGifError: "",
  videoWorkId: null,
  videoCharacterId: "",
  videoReferenceKind: "all",
  videoSelectedReferenceIds: [],
  videoReferenceRoles: {},
  videoChatMessages: [
    { role: "assistant", content: "動画生成エージェントです。作りたい場面の構成、タイムライン、使いたいエフェクトやカメラ効果を教えてください。" }
  ],
  videoPromptDraft: null,
  videoChatDraft: "",
  videoIsThinking: false,
  videoIsGenerating: false,
  videoPollingJobId: "",
  audioWorkId: null,
  audioCharacterId: "",
  audioVoice: "Kore",
  audioProvider: "openrouter",
  audioIrodoriReference: null,
  audioChatMessages: [
    { role: "assistant", content: "音声生成エージェントです。台詞、ナレーション、声の雰囲気、キャラ指定があれば教えてください。" }
  ],
  audioPromptDraft: null,
  audioChatDraft: "",
  audioIsThinking: false,
  audioIsGenerating: false,
  audioGenerationStartedAt: 0,
  audioGenerationTimer: null,
  lastOpenRouterDebug: null,
  irodoriStatus: "idle",
  irodoriStatusMessage: "",
  seedanceGuide: "",
  worldSheetFiles: [],
  worldTextDraft: "",
  worldTextSourceName: "",
  promptUseMemo: true,
  generatedPrompts: [],
  openRouterModels: [],
  openRouterModelStatus: "idle",
  openRouterModelError: "",
  openRouterVideoModels: [],
  openRouterVideoModelStatus: "idle",
  openRouterVideoModelError: "",
  elevenLabsVoices: [],
  elevenLabsVoiceStatus: "idle",
  elevenLabsVoiceError: "",
  elevenLabsModels: [],
  elevenLabsModelStatus: "idle",
  elevenLabsModelError: "",
  voiceboxProfiles: [],
  voiceboxProfileStatus: "idle",
  voiceboxProfileError: "",
  comfyModels: { checkpoints: [], loras: [], updatedAt: "" },
  comfyModelStatus: "idle",
  comfyModelError: "",
  comfyValidation: null,
  videoPricingStatus: "idle",
  videoPricingError: "",
  videoCostCollapsed: false
};

const navItems = [
  { id: "studio", label: "作品とキャラ" },
  { id: "import", label: "画像取込" },
  { id: "gallery", label: "画像一覧" },
  { id: "image", label: "画像生成" },
  {
    id: "edit",
    label: "画像編集",
    defaultView: "edit",
    children: [
      { id: "edit", label: "背景除去" },
      { id: "edit-gif", label: "動画GIF化" }
    ]
  },
  { id: "audio", label: "音声生成" },
  { id: "video", label: "動画生成" },
  { id: "library", label: "画像整理" },
  { id: "prompt", label: "Prompt Lab" },
  { id: "settings", label: "設定" }
];

const screenHelpContent = {
  studio: {
    title: "作品とキャラのヘルプ",
    lead: "作品を起点に、キャラ、作品情報 / 世界観設定、背景や小物などのその他情報を整理する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "作品を追加", description: "作品ごとの保存先、キャラ、画像、音声、世界観設定をまとめる単位を作ります。" },
          { term: "作品を選択", description: "左の作品一覧を押すと、その作品に紐づくキャラと設定が右側に表示されます。" },
          { term: "キャラ追加", description: "名前、立ち絵、ベースプロンプト、ネガティブプロンプト、メモを登録します。" },
          { term: "その他追加", description: "背景、小物、生物など、キャラ以外の参照素材や生成用の設定を登録します。" }
        ]
      },
      {
        title: "項目の意味",
        items: [
          { term: "作品情報 / 世界観設定", description: "画像シート、Markdown、テキストをAIで読解して、作品の雰囲気、素材、色、ルールを保存します。" },
          { term: "保存済み設定シート", description: "読解した資料の履歴です。表示、編集、再構造化、削除ができます。" },
          { term: "ベースプロンプト", description: "キャラやその他情報の固定要素です。Prompt Labや生成案の土台になります。" },
          { term: "ネガティブプロンプト", description: "崩れ、不要要素、避けたい表現などをまとめます。" },
          { term: "自然言語 / タグ", description: "プロンプトを文章寄りにするか、カンマ区切りのタグ寄りにするかの形式です。" }
        ]
      }
    ]
  },
  import: {
    title: "画像取込のヘルプ",
    lead: "複数画像を作品・キャラ・その他情報へ取り込み、必要に応じてAIで自動判別する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "画像を選択", description: "PNG、JPEG、WebP、GIFをまとめて選択、またはドラッグして追加します。" },
          { term: "取り込む", description: "選択中の画像をdata/uploads配下へ保存し、画像整理画面に登録します。" },
          { term: "AI判別ON", description: "取り込み後にキャラ候補へ自動判別し、進行状況は画像整理画面に表示されます。" },
          { term: "手動指定", description: "取り込み先キャラまたはその他情報を選ぶと、AI判別を挟まず直接そこへ保存します。" }
        ]
      },
      {
        title: "項目の意味",
        items: [
          { term: "作品フォルダ", description: "保存先の作品です。指定するとAI判別の候補もその作品内に絞られます。" },
          { term: "取り込み先キャラ", description: "画像を特定キャラの画像として直接保存します。" },
          { term: "取り込み先その他情報", description: "背景、小物、生物など、キャラ以外の情報として直接保存します。" },
          { term: "未割当時の分析形式", description: "AIが抽出する生成プロンプトを自然言語またはタグ形式にします。" },
          { term: "取り込み元ファイル", description: "取り込み後に元ファイルを残すか、条件が合う場合にゴミ箱へ移動するかを選びます。" },
          { term: "取り込み元フォルダ", description: "ブラウザが元パスを渡せない場合に、同名・同サイズ・同内容の元ファイルを探す範囲です。" }
        ]
      }
    ]
  },
  gallery: {
    title: "画像一覧のヘルプ",
    lead: "保存済み画像を作品や割当先ごとに閲覧し、Finder表示、詳細確認、完全削除を行う画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "表示条件", description: "作品と割当先で表示する画像を絞り込みます。" },
          { term: "画面内を全選択", description: "現在表示されている画像だけをまとめて選択します。" },
          { term: "選択を完全削除", description: "選択した登録と、他から参照されていない画像ファイル本体を削除します。" },
          { term: "詳細", description: "AI抽出プロンプト、判別形式、理由などを確認・編集できます。" }
        ]
      },
      {
        title: "項目の意味",
        items: [
          { term: "全作品 / 作品指定", description: "すべての作品を見るか、1作品だけを見るかを切り替えます。" },
          { term: "割当先", description: "キャラ、その他情報、未割当など、画像の紐づき先です。" },
          { term: "Finder", description: "保存済み画像の場所をFinderで開きます。" },
          { term: "完全削除", description: "履歴だけでなく、参照が残らない画像ファイル本体も削除対象にします。" }
        ]
      }
    ]
  },
  image: {
    title: "画像生成のヘルプ",
    lead: "ComfyUIへ生成指示を送り、生成画像を作品フォルダと画像一覧へ保存する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "エージェント", description: "作りたい構図や雰囲気を会話で伝え、Comfy送信用プロンプトの案を作ります。" },
          { term: "Comfy送信用プロンプト", description: "手動編集できます。生成開始時にComfyUIのworkflowへ差し込まれます。" },
          { term: "参照画像", description: "LoadImage系NodeのIDと入力名を指定し、選択した画像でworkflowの画像入力を差し替えます。" },
          { term: "生成履歴", description: "進行中ステータス、完成画像、保存先、再利用用のプロンプトを確認できます。" }
        ]
      },
      {
        title: "設定値の意味",
        items: [
          { term: "GPU", description: "ローカルGPUまたはクラウドGPUのComfyUI URLを選びます。URLは設定画面で管理します。" },
          { term: "幅 / 高さ", description: "生成画像のピクセルサイズです。大きいほど重くなります。" },
          { term: "Steps", description: "生成の反復回数です。増やすと時間がかかりますが、細部が安定しやすくなります。" },
          { term: "CFG", description: "プロンプトにどれだけ強く従うかの値です。高すぎると硬い絵になりやすいです。" },
          { term: "Sampler / Scheduler", description: "ComfyUI側の生成方式です。workflowとモデルに合う名前を指定します。" },
          { term: "Batch", description: "一度に生成する枚数です。" },
          { term: "Seed", description: "同じ条件で再現したい時の乱数です。空欄ならランダムになります。" },
          { term: "Checkpoint / LoRA", description: "使うモデルと追加学習モデルです。モデル一覧取得後は候補から選べます。" },
          { term: "生成比較モード", description: "枚数や比較軸を指定して、複数パターンを並べて試します。" }
        ]
      }
    ]
  },
  edit: {
    title: "画像編集のヘルプ",
    lead: "画像や動画/GIFの背景除去、透過PNG作成、動画のGIF化、処理結果の保存を行う画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "編集元", description: "作品内の保存済み画像、または追加した画像ファイルから処理対象を選びます。" },
          { term: "透過PNGを作成", description: "選択した処理方式で背景を抜いたPNGを作ります。" },
          { term: "画像一覧へ保存", description: "処理後のPNGを作品の画像一覧へ登録します。" },
          { term: "動画/GIFを選択", description: "動画背景除去で処理する元ファイルを追加します。" },
          { term: "動画背景除去を開始", description: "選択した動画またはGIFをbackgroundremoverで処理し、結果を動画生成の参照素材にも登録します。" },
          { term: "動画GIF化", description: "動画ファイルからGIFを作成し、画像一覧と動画生成の参照素材へ登録します。" }
        ]
      },
      {
        title: "設定値の意味",
        items: [
          { term: "作品", description: "編集結果を保存する作品です。保存先フォルダと画像一覧への登録先になります。" },
          { term: "保存時のキャラ", description: "処理後の画像を画像一覧へ保存する時に紐づけるキャラです。指定なしでも保存できます。" },
          { term: "対象画像", description: "背景除去に使う元画像です。保存済み画像または追加画像から選びます。" },
          { term: "処理", description: "背景除去に使う方式です。軽い確認、ローカルAI、クラウドAPIを用途に応じて切り替えます。" },
          { term: "簡易ローカル", description: "ブラウザ内で背景色を推定して透過します。軽い確認向きです。" },
          { term: "手動フリーモード", description: "境界指定、ペン除去、復元ペンで透過PNGを手動調整します。" },
          { term: "ローカルAI rembg", description: "rembgを使う高精度な背景除去です。初回セットアップが必要です。" },
          { term: "ローカルAI backgroundremover", description: "静止画に加えて動画/GIF背景除去にも使うローカル処理です。" },
          { term: "クラウド remove.bg", description: "remove.bg APIキーを使ってクラウドで背景除去します。" },
          { term: "remove.bg APIキー", description: "クラウド remove.bg を使う時に必要なAPIキーです。ブラウザ内に保存されます。" },
          { term: "rembgモデル", description: "rembgで使う切り抜きモデルです。汎用、アニメ向け、人物向けなどから選びます。" },
          { term: "backgroundremoverモデル", description: "backgroundremoverで使うモデルです。U2-Netは汎用、U2-Net Pは軽量、U2-Net Humanは人物向けです。" },
          { term: "マスク後処理", description: "rembgで作ったマスクの穴やノイズを整える補助処理です。" },
          { term: "背景", description: "簡易ローカル処理で抜く色の決め方です。自動、白、黒、指定色から選びます。" },
          { term: "指定色", description: "背景を指定色で抜く時の色です。背景が単色に近い画像で使います。" },
          { term: "許容値", description: "背景色として扱う色の幅です。0-160で、高いほど広く抜けます。" },
          { term: "境界ぼかし", description: "切り抜き境界をなじませる量です。0-80で、上げるほど境界がやわらかくなります。" },
          { term: "手動ツール", description: "ペン除去、復元ペン、境界指定を切り替えます。" },
          { term: "ペンサイズ", description: "手動フリーモードで使うブラシの太さです。" },
          { term: "Alpha matting", description: "髪や半透明部分などの境界を補正する処理です。" },
          { term: "エッジ調整", description: "backgroundremoverのAlpha matting時に、境界をどれだけ内側へ削るかの値です。1-25で指定します。" },
          { term: "モデル（動画背景除去）", description: "動画/GIF処理で使うbackgroundremoverモデルです。静止画側のbackgroundremoverモデルと同じ候補です。" },
          { term: "出力", description: "透過GIF、透過MOV、マット動画MP4から選びます。透過が必要ならGIFまたはMOV、白黒マスク確認ならマット動画を使います。" },
          { term: "FPS", description: "動画処理で扱う1秒あたりのフレーム数です。1-60で、高いほど滑らかですが処理時間と出力サイズが増えます。" },
          { term: "フレーム上限", description: "-1で全体処理、1-20000で処理する最大フレーム数です。長い動画は少ない値で試すと安全です。" },
          { term: "GPU batch", description: "一度にまとめて処理するフレーム数です。1-8で、大きいほど高速化しやすい一方、GPU/メモリ使用量が増えます。" },
          { term: "Workers", description: "動画処理の並列ワーカー数です。1-4で、多いほど速くなる場合がありますが、CPU負荷とメモリ使用量も増えます。" },
          { term: "最大幅（GIF化）", description: "GIF化時の横幅です。縦横比は維持され、値を下げるほど軽くなります。" },
          { term: "開始秒 / 長さ", description: "動画のどこから何秒GIF化するかを指定します。長さ0なら末尾まで変換します。" }
        ]
      }
    ]
  },
  "edit-gif": {
    title: "動画GIF化のヘルプ",
    lead: "動画をGIFに変換し、作品の画像一覧と動画生成用の参照素材に保存する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "動画を選択", description: "MP4、MOV、WebMなどの動画、またはGIFを選択します。" },
          { term: "GIF化を開始", description: "FPS、最大幅、開始秒、長さに従ってGIFを書き出します。" },
          { term: "保存先", description: "保存時のキャラを選ぶとキャラの画像フォルダへ、紐づけなしなら作品の _画像編集 へ保存されます。" }
        ]
      }
    ]
  },
  audio: {
    title: "音声生成のヘルプ",
    lead: "台詞やナレーションを、OpenRouter TTS、ElevenLabs、Voicebox、Irodori-TTSで生成する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "作品 / キャラ指定", description: "生成音声の保存先と、キャラへの紐づけを選びます。" },
          { term: "エージェント", description: "声の雰囲気や台詞の意図を伝え、読み上げテキスト案を作ります。" },
          { term: "読み上げテキスト", description: "実際に音声化する本文です。手動編集できます。" },
          { term: "生成履歴", description: "生成済み音声の再生、保存先、キャラ紐づけを確認できます。" }
        ]
      },
      {
        title: "設定値の意味",
        items: [
          { term: "生成方式", description: "使う音声プロバイダーです。必要なAPIキーやローカル連携は設定画面で管理します。" },
          { term: "モデル", description: "OpenRouter TTSまたはElevenLabsで使う音声生成モデルです。" },
          { term: "ボイス / Voice ID / プロファイル", description: "声の種類です。プロバイダーごとに指定方法が異なります。" },
          { term: "出力形式", description: "mp3、wavなど、保存される音声ファイルの形式です。" },
          { term: "演技指示", description: "声色、感情、間、距離感など、読み方に関する指示です。" },
          { term: "Stability / Similarity / Style / Speed", description: "ElevenLabsの安定度、声の近さ、表現量、速度です。" },
          { term: "Steps / Candidates / Seed", description: "Irodori-TTSの生成回数、候補数、再現用の乱数です。" }
        ]
      }
    ]
  },
  video: {
    title: "動画生成のヘルプ",
    lead: "選択した動画モデルへ指示を送り、参照素材つきの動画生成と履歴管理を行う画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "生成設定", description: "作品、動画モデル、秒数、比率、解像度、音声有無などを選びます。" },
          { term: "参照素材", description: "画像、動画、音声を追加・選択し、モデルが対応する範囲で生成に使います。" },
          { term: "エージェント", description: "構成、タイムライン、カメラ、エフェクトなどを会話で整理し、API送信用プロンプト案を作ります。" },
          { term: "生成履歴", description: "送信後のステータス、進行率、保存動画、エラー、最終フレーム保存を確認します。" }
        ]
      },
      {
        title: "設定値の意味",
        items: [
          { term: "今月の動画コスト", description: "履歴と現在の単価から概算した当月コストです。取得できない単価は未計上になることがあります。" },
          { term: "モード", description: "テキスト生成、参照画像/動画付き生成など、モデルが対応する入力形式です。" },
          { term: "秒数", description: "出力動画の長さです。モデルごとに選べる値が異なります。" },
          { term: "アスペクト比", description: "16:9、9:16など画面比率です。" },
          { term: "解像度", description: "720pなど出力サイズの目安です。高いほど時間とコストが増えやすくなります。" },
          { term: "音声", description: "対応モデルで動画内音声も生成するかを選びます。" },
          { term: "カメラ固定", description: "カメラ移動を抑えたい時にONにします。" },
          { term: "透かし", description: "対応プロバイダーでウォーターマークを付けるかを選びます。" },
          { term: "最終フレーム返却", description: "完了後に最後のフレームを保存し、参照素材として再利用しやすくします。" },
          { term: "Seed", description: "-1はランダムです。同じ値を入れると近い条件の再現に使えます。" }
        ]
      }
    ]
  },
  library: {
    title: "画像整理のヘルプ",
    lead: "取り込んだ画像の判別状態、割当先、AI抽出プロンプトを確認・修正する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "絞り込み", description: "作品、判別状態、割当先、並び順で表示する画像を絞ります。" },
          { term: "割当先変更", description: "画像カード内のセレクトでキャラ、その他情報、未割当を手動変更できます。" },
          { term: "AIキャラ判定", description: "選択した画像だけをAIへ送り、候補キャラとプロンプトを抽出します。" },
          { term: "このページをAI判別", description: "現在のページに表示されている画像をまとめて判別します。" },
          { term: "履歴削除", description: "画像一覧の登録を消します。別用途から参照されている画像ファイル本体は残します。" }
        ]
      },
      {
        title: "項目の意味",
        items: [
          { term: "判別済み", description: "AIまたは手動でキャラ/その他情報に割り当てられた状態です。" },
          { term: "AI判別中", description: "送信準備、API返答待ち、保存中など、判別処理が進行中の状態です。" },
          { term: "未設定", description: "まだ割当先が決まっていない状態です。" },
          { term: "判別失敗", description: "APIエラーや候補不足などで自動判別できなかった状態です。" },
          { term: "confidence", description: "AIが候補にどれくらい自信を持ったかの目安です。" },
          { term: "1ページの表示数", description: "大量画像で画面が重くならないよう、ページあたりのカード数を調整します。" }
        ]
      }
    ]
  },
  prompt: {
    title: "Prompt Labのヘルプ",
    lead: "キャラの固定要素と作品情報 / 世界観設定を使い、差分ごとの生成プロンプトをまとめて作る画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "作品 / キャラ", description: "生成プロンプトの対象キャラを選びます。" },
          { term: "差分・イベント指定", description: "表情差分、衣装差分、シーン案などを1行ずつ入力します。" },
          { term: "補足", description: "絵柄、構図、NG要素、衣装統一など、全案に反映したい条件を書きます。" },
          { term: "一括生成", description: "入力した差分ごとにプロンプトとネガティブプロンプトを生成します。" },
          { term: "全コピー / コピー", description: "生成結果をまとめて、または1件ずつクリップボードへコピーします。" }
        ]
      },
      {
        title: "項目の意味",
        items: [
          { term: "キャラメモを加味", description: "ONにするとキャラのメモも参照します。固定要素が強すぎる時はOFFで軽くできます。" },
          { term: "作品情報 / 世界観設定", description: "素材、配色、背景、小物、社会的役割、光や気候などを自然に反映する文脈です。" },
          { term: "ベースプロンプト", description: "キャラの同一性を守るための土台です。" },
          { term: "Negative", description: "避けたい要素や品質低下を抑えるためのプロンプトです。" }
        ]
      }
    ]
  },
  settings: {
    title: "設定のヘルプ",
    lead: "外部API、ローカル連携、ComfyUI workflow、動画生成プロバイダーの接続情報を管理する画面です。",
    sections: [
      {
        title: "使い方",
        items: [
          { term: "設定を保存", description: "入力したAPIキー、モデル、URL、既定値を保存します。" },
          { term: "接続テスト", description: "OpenRouterのキーとモデル接続を確認します。" },
          { term: "モデル一覧を再取得", description: "OpenRouter、ComfyUI、ElevenLabsなどの候補を最新状態で読み込みます。" },
          { term: "事前チェック", description: "ComfyUI workflowのNode IDや参照画像設定が生成時に使えるか確認します。" }
        ]
      },
      {
        title: "設定値の意味",
        items: [
          { term: "OpenRouter APIキー", description: "画像判別、テキスト生成、世界観読解、エージェント、OpenRouter TTSで使います。" },
          { term: "画像判別モデル", description: "取り込み画像をキャラ候補へ分類するモデルです。" },
          { term: "テキスト生成モデル", description: "Prompt Labなど、文章生成に使う既定モデルです。" },
          { term: "世界観読み込みモデル", description: "設定シート画像や資料テキストを作品情報へ構造化するモデルです。" },
          { term: "画像 / 動画 / 音声エージェントモデル", description: "各生成画面の会話型アシスタントがプロンプト案を作るためのモデルです。" },
          { term: "ElevenLabs", description: "APIキー、Voice ID、モデル、出力形式、声質パラメータを管理します。" },
          { term: "Voicebox", description: "ローカルVoicebox APIのURLと既定プロファイルを管理します。" },
          { term: "Irodori-TTS連携", description: "ローカルIrodori-TTSの場所確認やセットアップを行います。" },
          { term: "ComfyUI", description: "ローカル/クラウドURL、workflow JSON、差し替えるNode ID、既定生成値を管理します。" },
          { term: "Seedance", description: "BytePlus、OpenRouter、Replicateなどの動画生成API接続と既定モデルを管理します。" }
        ]
      }
    ]
  }
};

const defaultOpenRouterTtsModel = "google/gemini-3.1-flash-tts-preview";
const grokOpenRouterTtsModel = "x-ai/grok-voice-tts-1.0";

const audioProviders = [
  ["openrouter", "OpenRouter TTS"],
  ["elevenlabs", "ElevenLabs"],
  ["voicebox", "Voicebox"],
  ["irodori", "Irodori-TTS"]
];

const imageEditProviders = [
  ["local", "簡易ローカル"],
  ["manual", "手動フリーモード"],
  ["rembg", "ローカルAI rembg"],
  ["backgroundremover", "ローカルAI backgroundremover"],
  ["removebg", "クラウド remove.bg"]
];

const backgroundRemoverModelOptions = [
  ["u2net", "U2-Net（汎用）"],
  ["u2netp", "U2-Net P（軽量）"],
  ["u2net_human_seg", "U2-Net Human（人物向け）"]
];

const backgroundRemoverVideoModeOptions = [
  ["transparent-gif", "透過GIF"],
  ["transparent-mov", "透過MOV"],
  ["matte", "マット動画 MP4"]
];

const rembgModelOptions = [
  ["isnet-general-use", "IS-Net General（高精度）"],
  ["isnet-anime", "IS-Net Anime（イラスト向け）"],
  ["birefnet-general", "BiRefNet General（高精度）"],
  ["birefnet-general-lite", "BiRefNet Lite（軽量）"],
  ["u2net", "U2-Net"],
  ["u2netp", "U2-Net P（軽量）"],
  ["u2net_human_seg", "U2-Net Human（人物向け）"],
  ["silueta", "Silueta（軽量）"]
];

const imageEditBackgroundModes = [
  ["auto", "背景色を推定"],
  ["white", "白背景"],
  ["black", "黒背景"],
  ["chroma", "指定色"]
];

const manualImageEditTools = [
  ["erase", "ペンで除去"],
  ["restore", "復元ペン"],
  ["boundary", "境界指定"]
];

const voiceboxDefaultSettings = {
  baseUrl: "http://127.0.0.1:17493",
  profileId: "",
  language: "ja",
  modelSize: "1.7B",
  seed: ""
};

const voiceboxLanguageOptions = ["ja", "en", "zh", "ko", "de", "fr", "ru", "pt", "es", "it", "ar", "hi", "sv", "tr"];

const voiceboxModelSizeOptions = ["1.7B", "0.6B", "default"];

const irodoriDefaultSettings = {
  mode: "VoiceDesign",
  caption: "落ち着いた自然な日本語の声で、距離感は近めに読み上げてください。",
  modelDevice: "auto",
  modelPrecision: "fp32",
  codecDevice: "auto",
  codecPrecision: "fp32",
  numSteps: 40,
  numCandidates: 1,
  seed: "",
  cfgScaleText: 3,
  cfgScaleCaption: 4,
  cfgScaleSpeaker: 5,
  customCheckpoint: ""
};

const defaultComfyWorkflow = {
  "3": {
    class_type: "KSampler",
    _meta: { title: "KSampler" },
    inputs: {
      seed: 0,
      steps: 28,
      cfg: 7,
      sampler_name: "euler",
      scheduler: "normal",
      denoise: 1,
      model: ["4", 0],
      positive: ["6", 0],
      negative: ["7", 0],
      latent_image: ["5", 0]
    }
  },
  "4": {
    class_type: "CheckpointLoaderSimple",
    _meta: { title: "Load Checkpoint" },
    inputs: { ckpt_name: "model.safetensors" }
  },
  "5": {
    class_type: "EmptyLatentImage",
    _meta: { title: "Empty Latent Image" },
    inputs: { width: 1024, height: 1024, batch_size: 1 }
  },
  "6": {
    class_type: "CLIPTextEncode",
    _meta: { title: "Positive Prompt" },
    inputs: { text: "", clip: ["4", 1] }
  },
  "7": {
    class_type: "CLIPTextEncode",
    _meta: { title: "Negative Prompt" },
    inputs: { text: "low quality, blurry, distorted anatomy, extra fingers, watermark, text", clip: ["4", 1] }
  },
  "8": {
    class_type: "VAEDecode",
    _meta: { title: "VAE Decode" },
    inputs: { samples: ["3", 0], vae: ["4", 2] }
  },
  "9": {
    class_type: "SaveImage",
    _meta: { title: "Save Image" },
    inputs: { filename_prefix: "creative_file_studio", images: ["8", 0] }
  }
};

const comfyDefaultSettings = {
  gpuMode: "local",
  localBaseUrl: "http://127.0.0.1:8188",
  cloudBaseUrl: "",
  workflowJson: JSON.stringify(defaultComfyWorkflow, null, 2),
  workflowViewMode: "json",
  positiveNodeId: "6",
  negativeNodeId: "7",
  seedNodeId: "3",
  sizeNodeId: "5",
  stepsNodeId: "3",
  cfgNodeId: "3",
  samplerNodeId: "3",
  checkpointNodeId: "4",
  width: 1024,
  height: 1024,
  steps: 28,
  cfg: 7,
  samplerName: "euler",
  scheduler: "normal",
  batchSize: 1,
  checkpoint: "",
  seed: "",
  loras: [],
  referenceSlots: []
};

const defaultAudioActingPrompt = "自然な日本語で、感情と間を大切にして読み上げてください。音声案の本文には [laughs] [whispers] [sighs] [excited] などの感情タグを必ず1つ以上入れてください。";

const audioEmotionTags = ["[laughs]", "[whispers]", "[sighs]", "[excited]"];

const grokSpeechTags = ["[pause]", "[long-pause]", "[laugh]", "[chuckle]", "[sigh]", "<whisper>", "<slow>", "<fast>", "<emphasis>"];

const activeImageJobStatuses = ["submitting", "submitted", "pending", "queued", "running", "processing"];

const activeVideoJobStatuses = ["submitting", "submitted", "pending", "queued", "running", "processing"];

const imageCompareModes = [
  ["seed", "Seed"],
  ["cfg", "CFG"],
  ["steps", "Steps"]
];

const elevenLabsModelOptions = [
  "eleven_multilingual_v2",
  "eleven_turbo_v2_5",
  "eleven_flash_v2_5",
  "eleven_v3"
];

const elevenLabsModelNames = {
  eleven_multilingual_v2: "Eleven Multilingual v2",
  eleven_turbo_v2_5: "Eleven Turbo v2.5",
  eleven_flash_v2_5: "Eleven Flash v2.5",
  eleven_v3: "Eleven v3"
};

const elevenLabsOutputFormats = [
  "mp3_44100_128",
  "mp3_44100_192",
  "mp3_22050_32",
  "wav_44100",
  "pcm_24000"
];

const ttsVoices = [
  ["Kore", "Firm / 女性"],
  ["Zephyr", "Bright / 女性"],
  ["Puck", "Upbeat / 男性"],
  ["Charon", "Informative / 男性"],
  ["Fenrir", "Excitable / 男性"],
  ["Leda", "Youthful / 女性"],
  ["Orus", "Firm / 男性"],
  ["Aoede", "Breezy / 女性"],
  ["Callirrhoe", "Easy-going / 女性"],
  ["Autonoe", "Bright / 女性"],
  ["Enceladus", "Breathy / 男性"],
  ["Iapetus", "Clear / 男性"],
  ["Umbriel", "Easy-going / 男性"],
  ["Algenib", "Gravelly / 男性"],
  ["Despina", "Smooth / 女性"],
  ["Erinome", "Clear / 女性"],
  ["Laomedeia", "Upbeat / 女性"],
  ["Achernar", "Soft / 女性"],
  ["Algieba", "Smooth / 男性"],
  ["Schedar", "Even / 男性"],
  ["Gacrux", "Mature / 女性"],
  ["Pulcherrima", "Forward / 女性"],
  ["Achird", "Friendly / 男性"],
  ["Zubenelgenubi", "Casual / 男性"],
  ["Vindemiatrix", "Gentle / 女性"],
  ["Sadachbia", "Lively / 男性"],
  ["Sadaltager", "Knowledgeable / 男性"],
  ["Sulafat", "Warm / 女性"],
  ["Alnilam", "Firm / 男性"],
  ["Rasalgethi", "Informative / 男性"]
];

const grokTtsVoices = [
  ["eve", "Energetic / upbeat"],
  ["ara", "Warm / friendly"],
  ["rex", "Confident / clear"],
  ["sal", "Smooth / balanced"],
  ["leo", "Authoritative / strong"]
];

const openRouterTtsResponseFormats = [
  ["mp3", "MP3"],
  ["pcm", "PCM（WAV保存）"]
];

function openRouterTtsModelConfigs() {
  return [
    {
      id: defaultOpenRouterTtsModel,
      label: "Gemini 3.1 Flash TTS Preview",
      provider: "Google",
      defaultVoice: "Kore",
      defaultResponseFormat: "pcm",
      voiceOptions: ttsVoices,
      formatNote: "PCMで受信し、アプリ内ではWAVとして保存します。"
    },
    {
      id: grokOpenRouterTtsModel,
      label: "Grok Voice TTS 1.0",
      provider: "xAI",
      defaultVoice: "eve",
      defaultResponseFormat: "mp3",
      voiceOptions: grokTtsVoices,
      formatNote: "標準ではMP3保存。PCMを選ぶとアプリ内ではWAVとして保存します。"
    }
  ];
}

function openRouterTtsModelConfig(modelId) {
  const current = String(modelId || "").trim();
  return openRouterTtsModelConfigs().find((model) => model.id === current) || openRouterTtsModelConfigs()[0];
}

function normalizeOpenRouterTtsModel(modelId) {
  return openRouterTtsModelConfig(modelId).id;
}

function openRouterTtsVoiceOptions(modelId) {
  return openRouterTtsModelConfig(modelId).voiceOptions || ttsVoices;
}

function normalizeOpenRouterTtsVoice(voice, modelId) {
  const options = openRouterTtsVoiceOptions(modelId);
  const raw = String(voice || "").trim();
  const exact = options.find(([value]) => value === raw);
  if (exact) return exact[0];
  const lower = raw.toLowerCase();
  const ci = options.find(([value]) => String(value).toLowerCase() === lower);
  if (ci) return ci[0];
  return openRouterTtsModelConfig(modelId).defaultVoice || options[0]?.[0] || "Kore";
}

function normalizeOpenRouterTtsResponseFormat(format, modelId) {
  const raw = String(format || "").trim().toLowerCase();
  if (openRouterTtsResponseFormats.some(([value]) => value === raw)) return raw;
  return openRouterTtsModelConfig(modelId).defaultResponseFormat || "mp3";
}

function renderOpenRouterTtsModelOptions(selectedModel) {
  const current = normalizeOpenRouterTtsModel(selectedModel);
  return openRouterTtsModelConfigs()
    .map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === current ? "selected" : ""}>${escapeHtml(model.label)} / ${escapeHtml(model.id)}</option>`)
    .join("");
}

function renderOpenRouterTtsVoiceOptions(selectedVoice, modelId) {
  const currentModel = normalizeOpenRouterTtsModel(modelId);
  const current = normalizeOpenRouterTtsVoice(selectedVoice, currentModel);
  return openRouterTtsVoiceOptions(currentModel)
    .map(([voice, label]) => `<option value="${escapeHtml(voice)}" ${voice === current ? "selected" : ""}>${escapeHtml(voice)} (${escapeHtml(label)})</option>`)
    .join("");
}

function renderOpenRouterTtsResponseFormatOptions(selectedFormat, modelId) {
  const current = normalizeOpenRouterTtsResponseFormat(selectedFormat, modelId);
  return openRouterTtsResponseFormats
    .map(([format, label]) => `<option value="${escapeHtml(format)}" ${format === current ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

const workColors = ["#d85f43", "#1f8a84", "#677a2f", "#b78017", "#7b5ea7", "#bd4d72", "#4a7fbd"];

const defaultWorldItemTemplates = [
  { category: "background", name: "背景", memo: "街並み、建築、自然環境、室内、舞台になる場所を管理します。" },
  { category: "prop", name: "小物", memo: "道具、装備、家具、通貨、素材サンプル、記号類を管理します。" },
  { category: "creature", name: "生物", memo: "動物、魔物、植物、精霊、群衆以外の生物設定を管理します。" }
];

const worldItemCategoryLabels = {
  background: "背景",
  prop: "小物",
  creature: "生物",
  other: "その他"
};

const fallbackOpenRouterModels = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] } },
  { id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] } }
];

const seedanceApiBaseOptions = [
  {
    label: "公式 BytePlus / Volcengine",
    value: "https://ark.ap-southeast.bytepluses.com/api/v3",
    defaultModel: "dreamina-seedance-2-0-260128"
  },
  {
    label: "OpenRouter",
    value: "https://openrouter.ai/api/v1/videos",
    defaultModel: "bytedance/seedance-2.0"
  },
  {
    label: "Replicate",
    value: "https://api.replicate.com/v1",
    defaultModel: "bytedance/seedance-2.0"
  }
];

const targetOpenRouterVideoModelIds = [
  "bytedance/seedance-2.0",
  "bytedance/seedance-2.0-fast",
  "kwaivgi/kling-v3.0-std",
  "kwaivgi/kling-v3.0-pro",
  "google/veo-3.1-fast",
  "google/veo-3.1-lite",
  "google/veo-3.1",
  "openai/sora-2-pro"
];

const fallbackOpenRouterVideoModels = [
  {
    id: "bytedance/seedance-2.0",
    name: "ByteDance: Seedance 2.0",
    generate_audio: true,
    supported_durations: [5, 10],
    supported_aspect_ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supported_resolutions: ["480p", "720p", "1080p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "bytedance/seedance-2.0-fast",
    name: "ByteDance: Seedance 2.0 Fast",
    generate_audio: true,
    supported_durations: [5, 10],
    supported_aspect_ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supported_resolutions: ["480p", "720p", "1080p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "kwaivgi/kling-v3.0-std",
    name: "Kling: Video v3.0 Standard",
    generate_audio: true,
    supported_durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_resolutions: ["720p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "kwaivgi/kling-v3.0-pro",
    name: "Kling: Video v3.0 Pro",
    generate_audio: true,
    supported_durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    supported_aspect_ratios: ["16:9", "9:16", "1:1"],
    supported_resolutions: ["720p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "google/veo-3.1-fast",
    name: "Google: Veo 3.1 Fast",
    generate_audio: true,
    supported_durations: [4, 5, 6, 7, 8],
    supported_aspect_ratios: ["16:9", "9:16"],
    supported_resolutions: ["720p", "1080p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "google/veo-3.1-lite",
    name: "Google: Veo 3.1 Lite",
    generate_audio: true,
    supported_durations: [4, 5, 6, 7, 8],
    supported_aspect_ratios: ["16:9", "9:16"],
    supported_resolutions: ["720p", "1080p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "google/veo-3.1",
    name: "Google: Veo 3.1",
    generate_audio: true,
    supported_durations: [5, 8],
    supported_aspect_ratios: ["16:9", "9:16"],
    supported_resolutions: ["720p", "1080p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "openai/sora-2-pro",
    name: "OpenAI: Sora 2 Pro",
    generate_audio: true,
    supported_durations: [4, 8, 12],
    supported_aspect_ratios: ["16:9", "9:16"],
    supported_resolutions: ["720p", "1080p"],
    supported_frame_images: ["first_frame"]
  }
];

const fallbackOpenRouterVideoPricing = {
  "bytedance/seedance-2.0": { usdPerMillionVideoTokens: 7, source: "fallback-token" },
  "bytedance/seedance-2.0-fast": { usdPerMillionVideoTokens: 5.6, source: "fallback-token" },
  "kwaivgi/kling-v3.0-std": { usdPerSecond: 0.126, source: "fallback-per-second" },
  "kwaivgi/kling-v3.0-pro": { usdPerSecond: 0.168, source: "fallback-per-second" },
  "google/veo-3.1-fast": { usdPerSecond: 0.1, source: "fallback-per-second" },
  "google/veo-3.1-lite": { usdPerSecond: 0.05, source: "fallback-per-second" },
  "google/veo-3.1": { usdPerSecond: 0.4, source: "fallback-per-second" },
  "openai/sora-2-pro": {
    usdPerSecond: 0.3,
    usdPerSecondByResolution: { "720p": 0.3, "1080p": 0.5 },
    source: "fallback-per-second"
  }
};

const officialSeedanceVideoModel = {
  id: "dreamina-seedance-2-0-260128",
  name: "Seedance 2.0",
  generate_audio: true,
  supported_durations: [4, 5, 6, 7, 8, 9, 10, 15],
  supported_aspect_ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"],
  supported_resolutions: ["480p", "720p", "1080p", "2K"],
  supported_frame_images: ["first_frame", "last_frame"]
};

const replicateSeedanceVideoModels = [
  {
    id: "bytedance/seedance-2.0",
    name: "ByteDance: Seedance 2.0 on Replicate",
    generate_audio: true,
    supported_durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    supported_aspect_ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"],
    supported_resolutions: ["480p", "720p", "1080p"],
    supported_frame_images: ["first_frame", "last_frame"]
  },
  {
    id: "bytedance/seedance-2.0-fast",
    name: "ByteDance: Seedance 2.0 Fast on Replicate",
    generate_audio: true,
    supported_durations: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    supported_aspect_ratios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"],
    supported_resolutions: ["480p", "720p"],
    supported_frame_images: ["first_frame", "last_frame"]
  }
];

const replicateSeedanceVideoPricing = {
  "bytedance/seedance-2.0": {
    modelId: "bytedance/seedance-2.0",
    name: "ByteDance: Seedance 2.0 on Replicate",
    usdPerSecondByResolution: { "480p": 0.08, "720p": 0.18, "1080p": 0.45 },
    usdPerSecondVideoInByResolution: { "480p": 0.10, "720p": 0.22, "1080p": 0.55 },
    source: "replicate"
  },
  "bytedance/seedance-2.0-fast": {
    modelId: "bytedance/seedance-2.0-fast",
    name: "ByteDance: Seedance 2.0 Fast on Replicate",
    usdPerSecondByResolution: { "480p": 0.07, "720p": 0.15 },
    usdPerSecondVideoInByResolution: { "480p": 0.08, "720p": 0.17 },
    source: "replicate"
  }
};

const libraryPageSizes = [48, 72, 120];
const maxWorldSheetImages = 5;
const maxWorldTextChars = 60000;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const uid = () => crypto.randomUUID();
const byId = (items, id) => items.find((item) => item.id === id);
const charactersForWork = (workId) => state.db.characters.filter((char) => !workId || char.workId === workId);
const worldItemsForWork = (workId) => (state.db.worldItems || []).filter((item) => !workId || item.workId === workId);
const assetsForWork = (workId) => state.db.assets.filter((asset) => !workId || asset.workId === workId);
const apiKey = () => localStorage.getItem("openrouter_api_key") || "";
const seedanceApiKey = () => localStorage.getItem("seedance_api_key") || "";
const elevenLabsApiKey = () => localStorage.getItem("elevenlabs_api_key") || "";
const comfyCloudApiKey = () => localStorage.getItem("comfy_cloud_api_key") || "";
const removeBgApiKey = () => localStorage.getItem("removebg_api_key") || "";
const isOpenRouterSeedanceBaseUrl = (value = state.db?.settings?.seedanceBaseUrl) => String(value || "").includes("openrouter.ai");
const isReplicateSeedanceBaseUrl = (value = state.db?.settings?.seedanceBaseUrl) => String(value || "").includes("replicate.com");
const activeSeedanceApiKey = (baseUrl = state.db?.settings?.seedanceBaseUrl) =>
  isOpenRouterSeedanceBaseUrl(baseUrl) ? (apiKey() || seedanceApiKey()) : seedanceApiKey();
const seedanceProviderLabel = (baseUrl = state.db?.settings?.seedanceBaseUrl) =>
  isOpenRouterSeedanceBaseUrl(baseUrl) ? "OpenRouter" : isReplicateSeedanceBaseUrl(baseUrl) ? "Replicate" : "Seedance";
const activeComfySettings = () => normalizedComfySettings(state.db?.settings?.comfy || {});
const activeComfyBaseUrl = (gpuMode = activeComfySettings().gpuMode) => {
  const settings = activeComfySettings();
  return gpuMode === "cloud" ? settings.cloudBaseUrl : settings.localBaseUrl;
};
const activeComfyApiKey = (gpuMode = activeComfySettings().gpuMode) => gpuMode === "cloud" ? comfyCloudApiKey() : "";
const clientSourcePathForFile = (file) => {
  const value = typeof file?.path === "string" ? file.path.trim() : "";
  return value && (/^\/|^[a-zA-Z]:[\\/]|^~\//.test(value)) ? value : "";
};

const WORLD_SETTING_READING_TEMPLATE = `# 世界観設定資料＋キャラクター設定資料 読解ログ

## 0. 読解メタ情報
【画像名・仮タイトル】
【シートの種類】
【読解対象の範囲】
- シート全体：
- キャラクター：
- 背景カット：
- 道具・装備：
- 文字・記号：
- 素材サンプル：
- 読み取れない領域：
【読解精度】
- 明瞭に読める部分：
- 一部不明瞭な部分：
- 推測が必要な部分：
- 判読不能な部分：

## 1. シート全体の第一印象
【全体の雰囲気】
【ジャンル感】
【最も目立つ視覚要素】
【世界観の核になっている要素】
【この世界らしさを一言で表すと】

## 2. 画像から抽出した視覚ルール
### 2-1. 形状言語
【基本形】
【反復している形】
【線の特徴】
【シルエットの特徴】
- 建築：
- 衣装：
- 道具：
- 紋章・記号：
- 誌面レイアウト：
### 2-2. 配色ルール
【主色】
【補助色】
【差し色】
【色の意味・役割】
【彩度・明度の傾向】
【キャラクターと背景の色の関係】
### 2-3. 素材ルール
【主要素材】
【衣装に使われている素材】
【道具に使われている素材】
【建築に使われている素材】
【装飾や紋章に使われている素材】
【素材から推測できる環境・技術】
- 見えた事実：
- 推測：
### 2-4. 模様・記号ルール
【よく出てくる模様】
【紋章・所属印】
【文字・記録記号】
【模様の配置場所】
【模様が示す意味の推測】

## 3. 世界観ボードの情報
### 3-1. 環境・地形・気候
【見えている地形】
【気候の印象】
【光の状態】
【危険要素】
【移動のしづらさ】
【環境から生まれた生活上の工夫】
### 3-2. 資源
【豊富そうな資源】
【不足していそうな資源】
【交換・交易されそうなもの】
【資源制約が衣装・建築・道具に与えた影響】
### 3-3. 街並み・建築
【住居の形】
【屋根・壁・入口・窓の特徴】
【建物の配置】
【公共施設らしきもの】
【宗教施設・儀礼施設らしきもの】
【作業場・市場・倉庫らしきもの】
【建築の素材】
【建築から推測できる生活】
- 見えた事実：
- 推測：
### 3-4. 生活空間
【家具】
【収納具】
【食器・調理具】
【寝具・休息空間】
【照明・火・エネルギー源】
【標識・案内表示】
【生活感のある要素】

## 4. 社会・制度・文化の読み取り
### 4-1. 共同体の仕組み
【共同体の規模感】
【役割分担】
【身分・階級・所属の表現】
【制服・規格化された衣装要素】
【所属印・紋章】
【教育・師弟・家族制度の推測】
### 4-2. 交換・貨幣・商い
【貨幣らしきもの】
【交換品・交易品】
【市場・商いの道具】
【価値がありそうな素材】
【交換方法の推測】
### 4-3. 儀礼・信仰・禁忌
【信仰対象らしきもの】
【祈り・儀礼の道具】
【祭り・祝祭の痕跡】
【禁忌を示す表現】
【身体装飾・服飾装飾の意味】
【死生観・葬送の推測】

## 5. 技術・記録・通信
【素材加工技術】
【移動技術】
【通信手段】
【記録媒体】
【文字・数字・記号体系】
【エネルギー源・動力】
【道具の構造的特徴】
【技術水準の推測】

## 6. キャラクター設定資料
複数人いる場合は、キャラクターごとに CH-01 から繰り返す。
- 仮称
- 性別・年齢感
- 役割・職能
- 立場・身分
- 全身シルエット
- ポーズ
- 表情・態度
- 髪型・頭部装飾
- 顔周りの特徴
- 衣装のレイヤー構造
- 衣装の留め方
- 衣装の可動部
- 収納・携行の仕組み
- 素材
- 配色
- 模様・紋章
- 装備・携行品
- 仕事道具
- 武器・防具
- 背面図・側面図
- 衣装ディテール図
- このキャラクターが世界とつながっている点
- 見えた事実
- 推測
- 不明点

## 保持すべき要素リスト

## 再生成用要約プロンプト

## 見落とし防止チェック
【キャラクター全身】
【衣装レイヤー】
【背面図・側面図】
【装備・携行品】
【生活道具】
【仕事道具】
【建築・街並み】
【室内・家具】
【乗り物・移動手段】
【文字・ラベル】
【紋章・記号】
【通貨・交換品】
【素材サンプル】
【配色ルール】
【信仰・儀礼】
【社会制度・所属表現】
【誌面デザイン】`;

function createEmptyWorldSetting() {
  return {
    title: "",
    sheet_type: "",
    overall_mood: "",
    world_core: "",
    visual_rules: {
      shape_language: {
        basic_shapes: [],
        repeated_motifs: [],
        silhouette_rules: {
          architecture: "",
          costume: "",
          tools: "",
          symbols: ""
        }
      },
      color_rules: {
        main_colors: [],
        accent_colors: [],
        color_meanings: {}
      },
      material_rules: {
        main_materials: [],
        costume_materials: [],
        architecture_materials: [],
        tool_materials: []
      },
      symbols: {
        motifs: [],
        crests: [],
        writing_style: ""
      }
    },
    environment: {
      climate: "",
      terrain: "",
      light: "",
      dangers: [],
      resources: {
        abundant: [],
        scarce: []
      },
      mobility: ""
    },
    society: {
      community_type: "",
      roles: [],
      hierarchy_signs: [],
      exchange_system: "",
      rituals: [],
      taboos: [],
      belief: ""
    },
    life_culture: {
      housing: "",
      food: "",
      transport: "",
      tools: [],
      clothing_habits: "",
      seasonal_events: [],
      currency: "",
      writing: "",
      emblems: []
    },
    characters: [],
    objects: [],
    architecture: [],
    text_and_symbols: {
      labels: [],
      unreadable_text: [],
      arrows_and_numbers: [],
      crests: []
    },
    sheet_design: {
      layout_type: "",
      composition: "",
      background_medium: "",
      annotation_style: "",
      relation_to_world: ""
    },
    must_keep: {
      elements: [],
      do_not_change: [],
      flexible_elements: []
    },
    uncertain_points: {
      unreadable: [],
      inferred: [],
      needs_confirmation: []
    },
    regeneration_prompt: "",
    reading_log: "",
    sourceImageUrl: "",
    sourceImageName: "",
    updatedAt: "",
    activeSheetId: "",
    sheets: []
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, update) {
  if (!isPlainObject(update)) return structuredClone(base);
  const next = structuredClone(base);
  for (const [key, value] of Object.entries(update)) {
    if (isPlainObject(value) && isPlainObject(next[key])) {
      next[key] = deepMerge(next[key], value);
    } else if (value !== undefined) {
      next[key] = value;
    }
  }
  return next;
}

function normalizeWorldSetting(value = {}) {
  const next = deepMerge(createEmptyWorldSetting(), isPlainObject(value) ? value : {});
  next.visual_rules.shape_language.basic_shapes = asArray(next.visual_rules.shape_language.basic_shapes);
  next.visual_rules.shape_language.repeated_motifs = asArray(next.visual_rules.shape_language.repeated_motifs);
  next.visual_rules.color_rules.main_colors = asArray(next.visual_rules.color_rules.main_colors);
  next.visual_rules.color_rules.accent_colors = asArray(next.visual_rules.color_rules.accent_colors);
  next.visual_rules.material_rules.main_materials = asArray(next.visual_rules.material_rules.main_materials);
  next.visual_rules.material_rules.costume_materials = asArray(next.visual_rules.material_rules.costume_materials);
  next.visual_rules.material_rules.architecture_materials = asArray(next.visual_rules.material_rules.architecture_materials);
  next.visual_rules.material_rules.tool_materials = asArray(next.visual_rules.material_rules.tool_materials);
  next.visual_rules.symbols.motifs = asArray(next.visual_rules.symbols.motifs);
  next.visual_rules.symbols.crests = asArray(next.visual_rules.symbols.crests);
  next.environment.dangers = asArray(next.environment.dangers);
  next.environment.resources.abundant = asArray(next.environment.resources.abundant);
  next.environment.resources.scarce = asArray(next.environment.resources.scarce);
  next.society.roles = asArray(next.society.roles);
  next.society.hierarchy_signs = asArray(next.society.hierarchy_signs);
  next.society.rituals = asArray(next.society.rituals);
  next.society.taboos = asArray(next.society.taboos);
  next.life_culture.tools = asArray(next.life_culture.tools);
  next.life_culture.seasonal_events = asArray(next.life_culture.seasonal_events);
  next.life_culture.emblems = asArray(next.life_culture.emblems);
  next.characters = Array.isArray(next.characters) ? next.characters : [];
  next.objects = Array.isArray(next.objects) ? next.objects : [];
  next.architecture = Array.isArray(next.architecture) ? next.architecture : [];
  next.text_and_symbols.labels = asArray(next.text_and_symbols.labels);
  next.text_and_symbols.unreadable_text = asArray(next.text_and_symbols.unreadable_text);
  next.text_and_symbols.arrows_and_numbers = asArray(next.text_and_symbols.arrows_and_numbers);
  next.text_and_symbols.crests = asArray(next.text_and_symbols.crests);
  next.must_keep.elements = asArray(next.must_keep.elements);
  next.must_keep.do_not_change = asArray(next.must_keep.do_not_change);
  next.must_keep.flexible_elements = asArray(next.must_keep.flexible_elements);
  next.uncertain_points.unreadable = asArray(next.uncertain_points.unreadable);
  next.uncertain_points.inferred = asArray(next.uncertain_points.inferred);
  next.uncertain_points.needs_confirmation = asArray(next.uncertain_points.needs_confirmation);
  next.sheets = Array.isArray(next.sheets) ? next.sheets.map(normalizeWorldSheetRecord).filter(Boolean) : [];
  next.activeSheetId = String(next.activeSheetId || "");
  if (!next.sheets.length && (next.sourceImageUrl || next.sourceImageName || next.reading_log)) {
    const migratedSheet = createWorldSheetRecord(next, {
      url: next.sourceImageUrl,
      name: next.sourceImageName || next.title || "設定シート"
    });
    if (next.activeSheetId) migratedSheet.id = next.activeSheetId;
    next.sheets = [migratedSheet];
    next.activeSheetId = migratedSheet.id;
  }
  return next;
}

function normalizeWorldSheetRecord(value) {
  if (!isPlainObject(value)) return null;
  const data = worldSettingForSheetData(value.data || value.world_setting || value.setting || {});
  const id = String(value.id || uid());
  return {
    id,
    title: String(value.title || data.title || value.sourceImageName || "設定シート").trim(),
    sheet_type: String(value.sheet_type || data.sheet_type || "").trim(),
    sourceImageUrl: String(value.sourceImageUrl || data.sourceImageUrl || "").trim(),
    sourceImageName: String(value.sourceImageName || data.sourceImageName || "").trim(),
    reading_log: String(value.reading_log || data.reading_log || "").trim(),
    data,
    createdAt: value.createdAt || value.updatedAt || new Date().toISOString(),
    updatedAt: value.updatedAt || value.createdAt || new Date().toISOString()
  };
}

function worldSettingForSheetData(value = {}) {
  const data = deepMerge(createEmptyWorldSetting(), isPlainObject(value) ? value : {});
  data.sheets = [];
  data.activeSheetId = "";
  return data;
}

function createWorldSheetRecord(setting, source) {
  const data = worldSettingForSheetData(setting);
  data.sourceImageUrl = source.url || data.sourceImageUrl;
  data.sourceImageName = source.name || data.sourceImageName;
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: data.title || source.name || "設定シート",
    sheet_type: data.sheet_type || "",
    sourceImageUrl: data.sourceImageUrl,
    sourceImageName: data.sourceImageName,
    reading_log: data.reading_log || "",
    data,
    createdAt: now,
    updatedAt: now
  };
}

function applyWorldSheetToWork(work, sheetId) {
  const current = ensureWorldSetting(work);
  const sheet = current.sheets.find((item) => item.id === sheetId);
  if (!sheet) return null;
  const next = normalizeWorldSetting({
    ...sheet.data,
    sourceImageUrl: sheet.sourceImageUrl,
    sourceImageName: sheet.sourceImageName,
    reading_log: sheet.reading_log || sheet.data.reading_log,
    updatedAt: sheet.updatedAt,
    activeSheetId: sheet.id,
    sheets: current.sheets
  });
  work.worldSetting = next;
  return next;
}

function rebuildWorldSettingAfterSheetRemoval(work, removedSheetId) {
  const current = ensureWorldSetting(work);
  current.sheets = current.sheets.filter((sheet) => sheet.id !== removedSheetId);
  if (!current.sheets.length) {
    work.worldSetting = createEmptyWorldSetting();
    return;
  }
  const nextActive = current.sheets.some((sheet) => sheet.id === current.activeSheetId)
    ? current.activeSheetId
    : current.sheets.at(-1).id;
  applyWorldSheetToWork(work, nextActive);
}

function ensureWorldSetting(work) {
  work.worldSetting = normalizeWorldSetting(work.worldSetting);
  return work.worldSetting;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== "");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function splitList(value) {
  return String(value || "")
    .split(/[\n,、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listText(value) {
  return asArray(value).join("\n");
}

function renderInlineList(value, fallback = "未設定") {
  const items = asArray(value);
  return items.length ? items.map(escapeHtml).join(" / ") : fallback;
}

function plainInlineList(value, fallback = "未設定") {
  const items = asArray(value);
  return items.length ? items.join(" / ") : fallback;
}

function renderTagList(value) {
  const items = asArray(value);
  return items.length ? `<div class="tag-row">${items.slice(0, 8).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>` : "";
}

function parseJsonField(value, fallback) {
  const text = String(value || "").trim();
  if (!text) return structuredClone(fallback);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("JSON欄の形式を確認してください。");
  }
}

function createDefaultWorldItem(workId, template) {
  return {
    id: uid(),
    workId,
    category: template.category,
    name: template.name,
    description: "",
    referenceUrl: "",
    basePrompt: "",
    memo: template.memo,
    createdAt: new Date().toISOString(),
    autoCreated: true
  };
}

function normalizeWorldItem(item) {
  return {
    id: item.id || uid(),
    workId: item.workId || null,
    category: item.category || "other",
    name: item.name || worldItemCategoryLabels[item.category] || "その他情報",
    description: item.description || "",
    referenceUrl: item.referenceUrl || "",
    basePrompt: item.basePrompt || "",
    memo: item.memo || "",
    createdAt: item.createdAt || new Date().toISOString(),
    autoCreated: Boolean(item.autoCreated)
  };
}

function ensureDefaultWorldItemsForWork(work) {
  state.db.worldItems = (state.db.worldItems || []).map(normalizeWorldItem);
  const existing = worldItemsForWork(work.id);
  let changed = false;
  for (const template of defaultWorldItemTemplates) {
    if (!existing.some((item) => item.category === template.category && item.autoCreated)) {
      state.db.worldItems.push(createDefaultWorldItem(work.id, template));
      changed = true;
    }
  }
  return changed;
}

function worldItemCategoryLabel(category) {
  return worldItemCategoryLabels[category] || "その他";
}

function workWorldItemById(id) {
  return byId(state.db.worldItems || [], id);
}

function normalizeAudioItem(item = {}) {
  const provider = normalizedAudioProvider(item.provider || (item.model === "Irodori-TTS" ? "irodori" : "openrouter"));
  const irodori = provider === "irodori" ? normalizedIrodoriSettings(item.irodori || item.parameters || item.request || {}) : null;
  const voicebox = provider === "voicebox" ? voiceboxSettingsFromControls(item.voicebox || item.parameters || item.request || {}) : null;
  return {
    id: item.id || uid(),
    workId: item.workId || null,
    characterId: item.characterId || null,
    title: item.title || item.name || "生成音声",
    input: item.input || item.text || "",
    provider,
    voice: item.voice || (provider === "irodori" ? irodori?.mode || "VoiceDesign" : provider === "voicebox" ? voicebox?.profileId || "Voicebox" : "Kore"),
    model: item.model || (provider === "irodori" ? "Irodori-TTS" : provider === "voicebox" ? "Voicebox" : defaultOpenRouterTtsModel),
    format: item.format || (provider === "irodori" || provider === "voicebox" ? "wav" : "mp3"),
    url: item.url || "",
    localPath: item.localPath || item.path || "",
    mimeType: item.mimeType || (provider === "irodori" || provider === "voicebox" ? "audio/wav" : "audio/mpeg"),
    generationId: item.generationId || "",
    size: Number(item.size) || null,
    agentNote: item.agentNote || "",
    caption: item.caption || irodori?.caption || "",
    actingPrompt: item.actingPrompt || item.caption || "",
    audioResponseFormat: item.audioResponseFormat || item.responseFormat || "",
    irodori,
    elevenLabs: item.elevenLabs || null,
    voicebox,
    referenceAudio: item.referenceAudio || null,
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function normalizeImageJob(job = {}) {
  const images = Array.isArray(job.images) ? job.images : [];
  return {
    id: job.id || uid(),
    workId: job.workId || null,
    characterId: job.characterId || null,
    title: job.title || "生成画像",
    prompt: job.prompt || "",
    negativePrompt: job.negativePrompt || "",
    provider: "comfy",
    gpuMode: job.gpuMode === "cloud" ? "cloud" : "local",
    status: job.status || "pending",
    providerTaskId: job.providerTaskId || job.promptId || "",
    providerPayload: job.providerPayload || null,
    request: job.request || null,
    settings: job.settings || {},
    compareGroupId: job.compareGroupId || "",
    compareGroupTitle: job.compareGroupTitle || "",
    compareIndex: Number.isFinite(Number(job.compareIndex)) ? Number(job.compareIndex) : null,
    compareTotal: Number.isFinite(Number(job.compareTotal)) ? Number(job.compareTotal) : null,
    compareMode: normalizeImageCompareMode(job.compareMode),
    compareLabel: job.compareLabel || "",
    images: images.map((image) => ({
      url: image.url || image.localUrl || "",
      localPath: image.localPath || image.path || "",
      nodeId: image.nodeId || "",
      filename: image.filename || ""
    })).filter((image) => image.url),
    progress: job.progress ?? null,
    progressMessage: job.progressMessage || "",
    error: job.error || "",
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: job.updatedAt || job.createdAt || new Date().toISOString()
  };
}

function audioItemsForCharacter(characterId) {
  return (state.db.audioItems || [])
    .filter((item) => item.characterId === characterId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function audioItemsForWork(workId) {
  return (state.db.audioItems || [])
    .filter((item) => !workId || item.workId === workId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function imageJobsForWork(workId) {
  return (state.db.imageJobs || [])
    .filter((job) => !workId || job.workId === workId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function worldItemForAsset(asset) {
  return workWorldItemById(asset?.worldItemId);
}

function assetSubjectKey(asset) {
  if (asset.worldItemId) return `world:${asset.worldItemId}`;
  if (asset.characterId) return `char:${asset.characterId}`;
  return "unassigned";
}

function assetSubjectSelectValue(asset) {
  const key = assetSubjectKey(asset);
  return key === "unassigned" ? "" : key;
}

function parseSubjectValue(value) {
  const raw = String(value || "");
  if (raw.startsWith("char:")) return { type: "character", id: raw.slice(5) };
  if (raw.startsWith("world:")) return { type: "world", id: raw.slice(6) };
  if (raw && raw !== "all" && raw !== "unassigned") return { type: "character", id: raw };
  return { type: raw || "unassigned", id: "" };
}

function subjectLabelForAsset(asset) {
  const worldItem = worldItemForAsset(asset);
  if (worldItem) return `${worldItemCategoryLabel(worldItem.category)}: ${worldItem.name}`;
  const char = characterForAsset(asset);
  return char?.name || "未割当";
}

function renderSubjectOptions(workId, selectedValue, { includeAll = true } = {}) {
  const chars = charactersForWork(workId);
  const items = worldItemsForWork(workId);
  return `
    ${includeAll ? `<option value="all" ${selectedValue === "all" ? "selected" : ""}>全割当先</option>` : ""}
    <option value="unassigned" ${selectedValue === "unassigned" ? "selected" : ""}>未割当</option>
    ${chars.length ? `<optgroup label="キャラ">${chars.map((char) => `<option value="char:${char.id}" ${selectedValue === `char:${char.id}` || selectedValue === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`).join("")}</optgroup>` : ""}
    ${items.length ? `<optgroup label="その他情報">${items.map((item) => `<option value="world:${item.id}" ${selectedValue === `world:${item.id}` ? "selected" : ""}>${escapeHtml(worldItemCategoryLabel(item.category))}: ${escapeHtml(item.name)}</option>`).join("")}</optgroup>` : ""}
  `;
}

function compactPromptText(value, limit = 900) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function compactRawText(value, limit = 4000) {
  const text = String(value || "").trim();
  return text.length > limit ? `${text.slice(0, limit)}\n...` : text;
}

function cleanFileLabel(value, fallback = "file") {
  return String(value || fallback)
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/\.+$/g, "")
    .slice(0, 80) || fallback;
}

function compactPromptList(value, limit = 10) {
  return asArray(value)
    .map((item) => compactPromptText(item, 120))
    .filter(Boolean)
    .slice(0, limit)
    .join(" / ");
}

function promptContextLine(label, value, { limit = 900 } = {}) {
  const text = Array.isArray(value)
    ? value.map((item) => compactPromptText(item, 220)).filter(Boolean).join(" / ")
    : compactPromptText(value, limit);
  return text ? `${label}: ${text}` : "";
}

function buildPromptLabWorldContext(work) {
  if (!work) return "作品情報: 未指定";
  const setting = normalizeWorldSetting(work.worldSetting);
  const sheetSummaries = setting.sheets.map((sheet) => {
    const data = normalizeWorldSetting(sheet.data || {});
    return [
      sheet.title || data.title,
      sheet.sheet_type || data.sheet_type,
      data.overall_mood,
      data.world_core
    ].map((item) => compactPromptText(item, 140)).filter(Boolean).join(" / ");
  }).filter(Boolean);
  const worldItemSummaries = worldItemsForWork(work.id)
    .map((item) => [
      `${worldItemCategoryLabel(item.category)}: ${item.name}`,
      item.description,
      item.basePrompt ? `生成要素=${item.basePrompt}` : "",
      item.memo
    ].map((value) => compactPromptText(value, 180)).filter(Boolean).join(" / "))
    .filter(Boolean)
    .slice(0, 12);
  const colorMeanings = isPlainObject(setting.visual_rules.color_rules.color_meanings)
    ? Object.entries(setting.visual_rules.color_rules.color_meanings).map(([key, value]) => `${key}=${value}`).join(" / ")
    : compactPromptText(setting.visual_rules.color_rules.color_meanings);
  const abundantResources = compactPromptList(setting.environment.resources.abundant);
  const scarceResources = compactPromptList(setting.environment.resources.scarce);
  const lines = [
    promptContextLine("作品名", work.name),
    promptContextLine("作品メモ", work.description),
    promptContextLine("登録設定シート", sheetSummaries, { limit: 1200 }),
    promptContextLine("世界観タイトル", setting.title),
    promptContextLine("シート種類", setting.sheet_type),
    promptContextLine("全体の雰囲気", setting.overall_mood),
    promptContextLine("世界観の核", setting.world_core),
    promptContextLine("形状ルール", [
      compactPromptList(setting.visual_rules.shape_language.basic_shapes),
      compactPromptList(setting.visual_rules.shape_language.repeated_motifs),
      setting.visual_rules.shape_language.silhouette_rules.architecture,
      setting.visual_rules.shape_language.silhouette_rules.costume,
      setting.visual_rules.shape_language.silhouette_rules.tools,
      setting.visual_rules.shape_language.silhouette_rules.symbols
    ]),
    promptContextLine("配色ルール", [
      compactPromptList(setting.visual_rules.color_rules.main_colors),
      compactPromptList(setting.visual_rules.color_rules.accent_colors),
      colorMeanings
    ]),
    promptContextLine("素材ルール", [
      compactPromptList(setting.visual_rules.material_rules.main_materials),
      compactPromptList(setting.visual_rules.material_rules.costume_materials),
      compactPromptList(setting.visual_rules.material_rules.architecture_materials),
      compactPromptList(setting.visual_rules.material_rules.tool_materials)
    ]),
    promptContextLine("模様・紋章・文字", [
      compactPromptList(setting.visual_rules.symbols.motifs),
      compactPromptList(setting.visual_rules.symbols.crests),
      setting.visual_rules.symbols.writing_style
    ]),
    promptContextLine("環境", [
      setting.environment.terrain,
      setting.environment.climate,
      setting.environment.light,
      compactPromptList(setting.environment.dangers),
      setting.environment.mobility,
      abundantResources ? `豊富=${abundantResources}` : "",
      scarceResources ? `不足=${scarceResources}` : ""
    ]),
    promptContextLine("社会・信仰", [
      setting.society.community_type,
      compactPromptList(setting.society.roles),
      compactPromptList(setting.society.hierarchy_signs),
      setting.society.exchange_system,
      compactPromptList(setting.society.rituals),
      compactPromptList(setting.society.taboos),
      setting.society.belief
    ]),
    promptContextLine("生活文化", [
      setting.life_culture.housing,
      setting.life_culture.food,
      setting.life_culture.transport,
      compactPromptList(setting.life_culture.tools),
      setting.life_culture.clothing_habits,
      setting.life_culture.currency,
      setting.life_culture.writing,
      compactPromptList(setting.life_culture.emblems)
    ]),
    promptContextLine("保持すべき要素", setting.must_keep.elements),
    promptContextLine("変更しない要素", setting.must_keep.do_not_change),
    promptContextLine("再生成用要約", setting.regeneration_prompt, { limit: 1600 }),
    promptContextLine("読解ログ抜粋", setting.reading_log, { limit: 1400 }),
    worldItemSummaries.length ? `その他情報:\n- ${worldItemSummaries.join("\n- ")}` : ""
  ];
  return lines.filter(Boolean).join("\n");
}

function normalizedAudioProvider(value) {
  return audioProviders.some(([provider]) => provider === value) ? value : "openrouter";
}

function hasAudioInlineTag(text) {
  const matches = String(text || "").match(/\[[a-z][a-z0-9 _-]{1,32}\]/gi) || [];
  return matches.some((tag) => !/\b(pause|silence|break)\b/i.test(tag));
}

function suggestedAudioEmotionTag(text, actingPrompt = "") {
  const source = `${text || ""}\n${actingPrompt || ""}`.toLowerCase();
  if (/笑|楽|明る|冗談|微笑|happy|laugh|smile/.test(source)) return "[laughs]";
  if (/囁|ささや|静か|近い|内緒|whisper/.test(source)) return "[whispers]";
  if (/ため息|吐息|疲|諦|呆|sigh/.test(source)) return "[sighs]";
  if (/怒|戦闘|叫|熱血|興奮|勢い|驚|必死|excited|angry|shout/.test(source)) return "[excited]";
  return audioEmotionTags[0];
}

function ensureAudioEmotionTag(text, actingPrompt = "") {
  const cleanText = String(text || "").trim();
  if (!cleanText || hasAudioInlineTag(cleanText)) return cleanText;
  return `${suggestedAudioEmotionTag(cleanText, actingPrompt)} ${cleanText}`;
}

function boundedSettingNumber(value, fallback, min, max, integer = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const bounded = Math.min(max, Math.max(min, number));
  return integer ? Math.round(bounded) : Number(bounded.toFixed(2));
}

function emptyComfyLora() {
  return { name: "", strengthModel: 1, strengthClip: 1 };
}

function normalizedComfyLoras(value = [], minSlots = 3) {
  const source = Array.isArray(value) ? value : [];
  const items = source.slice(0, 3).map((item) => ({
    name: String(item?.name || item?.loraName || "").trim(),
    strengthModel: boundedSettingNumber(item?.strengthModel ?? item?.strength_model ?? 1, 1, -2, 2),
    strengthClip: boundedSettingNumber(item?.strengthClip ?? item?.strength_clip ?? 1, 1, -2, 2)
  }));
  while (items.length < minSlots) items.push(emptyComfyLora());
  return items;
}

function activeComfyLoras(value = []) {
  return normalizedComfyLoras(value, 0).filter((item) => item.name);
}

function emptyComfyReferenceSlot(index = 0) {
  return { label: `参照${index + 1}`, key: "", name: "", url: "", nodeId: "", inputName: "image" };
}

function normalizedComfyReferenceSlots(value = [], minSlots = 3) {
  const source = Array.isArray(value) ? value : [];
  const items = source.slice(0, 3).map((item, index) => ({
    label: String(item?.label || item?.name || `参照${index + 1}`).trim() || `参照${index + 1}`,
    key: String(item?.key || item?.referenceKey || "").trim(),
    name: String(item?.name || "").trim(),
    url: String(item?.url || "").trim(),
    nodeId: String(item?.nodeId || item?.node_id || "").trim(),
    inputName: String(item?.inputName || item?.input_name || "image").trim() || "image"
  }));
  while (items.length < minSlots) items.push(emptyComfyReferenceSlot(items.length));
  return items;
}

function comfyReferenceSlotSettings(slots = []) {
  return normalizedComfyReferenceSlots(slots).map((slot, index) => ({
    label: slot.label || `参照${index + 1}`,
    nodeId: slot.nodeId,
    inputName: slot.inputName || "image"
  }));
}

function activeComfyReferenceSlots(slots = []) {
  return normalizedComfyReferenceSlots(slots, 0).filter((slot) => slot.key && slot.url && slot.nodeId);
}

function normalizedIrodoriSettings(value = {}) {
  const source = { ...irodoriDefaultSettings, ...(value || {}) };
  const modelDevice = ["auto", "cpu", "mps", "cuda"].includes(source.modelDevice) ? source.modelDevice : "auto";
  const codecDevice = ["auto", "cpu", "mps", "cuda"].includes(source.codecDevice) ? source.codecDevice : "auto";
  return {
    mode: source.mode === "Reference" ? "Reference" : "VoiceDesign",
    caption: String(source.caption || "").trim() || irodoriDefaultSettings.caption,
    modelDevice,
    modelPrecision: source.modelPrecision === "bf16" && modelDevice === "cuda" ? "bf16" : "fp32",
    codecDevice,
    codecPrecision: source.codecPrecision === "bf16" && codecDevice === "cuda" ? "bf16" : "fp32",
    numSteps: boundedSettingNumber(source.numSteps, 40, 8, 80, true),
    numCandidates: boundedSettingNumber(source.numCandidates, 1, 1, 4, true),
    seed: String(source.seed || "").trim(),
    cfgScaleText: boundedSettingNumber(source.cfgScaleText, 3, 0, 10),
    cfgScaleCaption: boundedSettingNumber(source.cfgScaleCaption, 4, 0, 10),
    cfgScaleSpeaker: boundedSettingNumber(source.cfgScaleSpeaker, 5, 0, 10),
    customCheckpoint: String(source.customCheckpoint || "").trim()
  };
}

function voiceboxSettingsFromControls(source = {}) {
  const defaults = {
    ...voiceboxDefaultSettings,
    baseUrl: state.db?.settings?.voiceboxBaseUrl || voiceboxDefaultSettings.baseUrl,
    profileId: state.db?.settings?.voiceboxProfileId || voiceboxDefaultSettings.profileId,
    language: state.db?.settings?.voiceboxLanguage || voiceboxDefaultSettings.language,
    modelSize: state.db?.settings?.voiceboxModelSize || voiceboxDefaultSettings.modelSize
  };
  const merged = { ...defaults, ...(source || {}) };
  const language = String(merged.language || voiceboxDefaultSettings.language).trim() || voiceboxDefaultSettings.language;
  const modelSize = String(merged.modelSize || merged.model_size || voiceboxDefaultSettings.modelSize).trim() || voiceboxDefaultSettings.modelSize;
  return {
    baseUrl: String(merged.baseUrl || merged.base_url || voiceboxDefaultSettings.baseUrl).trim() || voiceboxDefaultSettings.baseUrl,
    profileId: String(merged.profileId || merged.profile_id || defaults.profileId || "").trim(),
    profileName: String(merged.profileName || merged.profile_name || "").trim(),
    defaultEngine: String(merged.defaultEngine || merged.default_engine || merged.presetEngine || merged.preset_engine || "").trim(),
    language,
    modelSize,
    seed: String(merged.seed || "").trim()
  };
}

function normalizedComfySettings(value = {}) {
  const source = { ...comfyDefaultSettings, ...(value || {}) };
  const gpuMode = source.gpuMode === "cloud" ? "cloud" : "local";
  return {
    gpuMode,
    localBaseUrl: String(source.localBaseUrl || comfyDefaultSettings.localBaseUrl).trim() || comfyDefaultSettings.localBaseUrl,
    cloudBaseUrl: String(source.cloudBaseUrl || "").trim(),
    workflowJson: String(source.workflowJson || comfyDefaultSettings.workflowJson).trim() || comfyDefaultSettings.workflowJson,
    workflowViewMode: source.workflowViewMode === "visual" ? "visual" : "json",
    positiveNodeId: String(source.positiveNodeId || "6").trim(),
    negativeNodeId: String(source.negativeNodeId || "7").trim(),
    seedNodeId: String(source.seedNodeId || "3").trim(),
    sizeNodeId: String(source.sizeNodeId || "5").trim(),
    stepsNodeId: String(source.stepsNodeId || source.seedNodeId || "3").trim(),
    cfgNodeId: String(source.cfgNodeId || source.seedNodeId || "3").trim(),
    samplerNodeId: String(source.samplerNodeId || source.seedNodeId || "3").trim(),
    checkpointNodeId: String(source.checkpointNodeId || "4").trim(),
    width: boundedSettingNumber(source.width, 1024, 64, 4096, true),
    height: boundedSettingNumber(source.height, 1024, 64, 4096, true),
    steps: boundedSettingNumber(source.steps, 28, 1, 150, true),
    cfg: boundedSettingNumber(source.cfg, 7, 0, 30),
    samplerName: String(source.samplerName || "euler").trim() || "euler",
    scheduler: String(source.scheduler || "normal").trim() || "normal",
    batchSize: boundedSettingNumber(source.batchSize, 1, 1, 8, true),
    checkpoint: String(source.checkpoint || "").trim(),
    seed: String(source.seed ?? "").trim(),
    loras: normalizedComfyLoras(source.loras),
    referenceSlots: comfyReferenceSlotSettings(source.referenceSlots)
  };
}

function normalizedComfyPreset(value = {}, index = 0) {
  const settingsSource = value.settings || value.comfy || value;
  return {
    id: String(value.id || uid()).trim(),
    name: String(value.name || `Comfy Preset ${index + 1}`).trim() || `Comfy Preset ${index + 1}`,
    memo: String(value.memo || value.description || "").trim(),
    settings: normalizedComfySettings(settingsSource),
    createdAt: value.createdAt || new Date().toISOString(),
    updatedAt: value.updatedAt || value.createdAt || new Date().toISOString()
  };
}

function normalizedComfyPresets(value = []) {
  return (Array.isArray(value) ? value : [])
    .map((item, index) => normalizedComfyPreset(item, index))
    .filter((item) => item.name);
}

const comfyPresets = () => normalizedComfyPresets(state.db?.settings?.comfyPresets || []);

function normalizeSettings() {
  state.db.settings = {
    defaultModel: "google/gemini-2.5-flash",
    textModel: "google/gemini-2.5-flash",
    worldModel: state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    imageAgentModel: state.db.settings?.textModel || state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    videoAgentModel: state.db.settings?.textModel || state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    audioAgentModel: state.db.settings?.textModel || state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    audioProvider: "openrouter",
    audioModel: defaultOpenRouterTtsModel,
    audioVoice: "Kore",
    audioResponseFormat: "pcm",
    audioActingPrompt: defaultAudioActingPrompt,
    elevenLabsVoiceId: "JBFqnCBsd6RMkjVDRZzb",
    elevenLabsModelId: "eleven_multilingual_v2",
    elevenLabsOutputFormat: "mp3_44100_128",
    elevenLabsStability: 0.5,
    elevenLabsSimilarityBoost: 0.75,
    elevenLabsStyle: 0,
    elevenLabsSpeed: 1,
    elevenLabsSpeakerBoost: true,
    elevenLabsLanguageCode: "ja",
    voiceboxBaseUrl: voiceboxDefaultSettings.baseUrl,
    voiceboxProfileId: "",
    voiceboxLanguage: voiceboxDefaultSettings.language,
    voiceboxModelSize: voiceboxDefaultSettings.modelSize,
    irodoriAppDir: "vendor/Irodori-TTS",
    irodoriDefaults: { ...irodoriDefaultSettings },
    seedanceBaseUrl: "https://ark.ap-southeast.bytepluses.com/api/v3",
    seedanceModel: "dreamina-seedance-2-0-260128",
    seedanceResolution: "720p",
    comfy: { ...comfyDefaultSettings },
    comfyPresets: [],
    moveImportedSourcesToTrash: false,
    importSourceRoot: "",
    videoPricing: {
      updatedAt: "",
      usdJpyRate: 155,
      usdJpySource: "fallback",
      models: {}
    },
    ...(state.db.settings || {})
  };
  if (!state.db.settings.worldModel) state.db.settings.worldModel = state.db.settings.defaultModel || state.db.settings.textModel;
  if (!state.db.settings.imageAgentModel) state.db.settings.imageAgentModel = state.db.settings.textModel || state.db.settings.defaultModel;
  if (!state.db.settings.videoAgentModel) state.db.settings.videoAgentModel = state.db.settings.textModel || state.db.settings.defaultModel;
  if (!state.db.settings.audioAgentModel) state.db.settings.audioAgentModel = state.db.settings.textModel || state.db.settings.defaultModel;
  state.db.settings.audioProvider = normalizedAudioProvider(state.db.settings.audioProvider);
  state.audioProvider = normalizedAudioProvider(state.db.settings.audioProvider || state.audioProvider);
  state.db.settings.audioModel = normalizeOpenRouterTtsModel(state.db.settings.audioModel || defaultOpenRouterTtsModel);
  state.db.settings.audioVoice = normalizeOpenRouterTtsVoice(state.db.settings.audioVoice, state.db.settings.audioModel);
  state.db.settings.audioResponseFormat = normalizeOpenRouterTtsResponseFormat(state.db.settings.audioResponseFormat, state.db.settings.audioModel);
  state.db.settings.audioActingPrompt = String(state.db.settings.audioActingPrompt || defaultAudioActingPrompt).trim() || defaultAudioActingPrompt;
  state.db.settings.elevenLabsVoiceId = String(state.db.settings.elevenLabsVoiceId || "JBFqnCBsd6RMkjVDRZzb").trim() || "JBFqnCBsd6RMkjVDRZzb";
  state.db.settings.elevenLabsModelId = String(state.db.settings.elevenLabsModelId || "eleven_multilingual_v2").trim() || "eleven_multilingual_v2";
  state.db.settings.elevenLabsOutputFormat = String(state.db.settings.elevenLabsOutputFormat || "mp3_44100_128").trim() || "mp3_44100_128";
  state.db.settings.elevenLabsStability = boundedSettingNumber(state.db.settings.elevenLabsStability, 0.5, 0, 1);
  state.db.settings.elevenLabsSimilarityBoost = boundedSettingNumber(state.db.settings.elevenLabsSimilarityBoost, 0.75, 0, 1);
  state.db.settings.elevenLabsStyle = boundedSettingNumber(state.db.settings.elevenLabsStyle, 0, 0, 1);
  state.db.settings.elevenLabsSpeed = boundedSettingNumber(state.db.settings.elevenLabsSpeed, 1, 0.7, 1.2);
  state.db.settings.elevenLabsSpeakerBoost = state.db.settings.elevenLabsSpeakerBoost !== false;
  state.db.settings.elevenLabsLanguageCode = String(state.db.settings.elevenLabsLanguageCode || "ja").trim();
  state.db.settings.voiceboxBaseUrl = String(state.db.settings.voiceboxBaseUrl || voiceboxDefaultSettings.baseUrl).trim() || voiceboxDefaultSettings.baseUrl;
  state.db.settings.voiceboxProfileId = String(state.db.settings.voiceboxProfileId || "").trim();
  state.db.settings.voiceboxLanguage = String(state.db.settings.voiceboxLanguage || voiceboxDefaultSettings.language).trim() || voiceboxDefaultSettings.language;
  state.db.settings.voiceboxModelSize = String(state.db.settings.voiceboxModelSize || voiceboxDefaultSettings.modelSize).trim() || voiceboxDefaultSettings.modelSize;
  state.db.settings.irodoriAppDir = String(state.db.settings.irodoriAppDir || "vendor/Irodori-TTS").trim() || "vendor/Irodori-TTS";
  state.db.settings.irodoriDefaults = normalizedIrodoriSettings(state.db.settings.irodoriDefaults);
  state.db.settings.comfy = normalizedComfySettings(state.db.settings.comfy);
  state.db.settings.comfyPresets = normalizedComfyPresets(state.db.settings.comfyPresets);
  state.imageGpuMode = state.db.settings.comfy.gpuMode || state.imageGpuMode;
  state.db.settings.moveImportedSourcesToTrash = state.db.settings.moveImportedSourcesToTrash === true;
  state.db.settings.importSourceRoot = String(state.db.settings.importSourceRoot || "").trim();
  state.db.settings.videoPricing = {
    updatedAt: "",
    usdJpyRate: 155,
    usdJpySource: "fallback",
    models: {},
    ...(state.db.settings.videoPricing || {})
  };
  if (!state.db.settings.videoPricing.models || typeof state.db.settings.videoPricing.models !== "object") {
    state.db.settings.videoPricing.models = {};
  }
}

function modelModalities(model, key) {
  return Array.isArray(model?.architecture?.[key]) ? model.architecture[key] : [];
}

function modelSupportsPurpose(model, purpose) {
  const input = modelModalities(model, "input_modalities");
  const output = modelModalities(model, "output_modalities");
  if (purpose === "text") return input.includes("text") && (!output.length || output.includes("text"));
  return input.includes("image") && (!output.length || output.includes("text"));
}

function openRouterModelChoices(purpose, selectedId) {
  const source = state.openRouterModels.length ? state.openRouterModels : fallbackOpenRouterModels;
  const seen = new Set();
  const filtered = source
    .filter((model) => model?.id && modelSupportsPurpose(model, purpose))
    .filter((model) => {
      if (seen.has(model.id)) return false;
      seen.add(model.id);
      return true;
    });
  if (selectedId && !seen.has(selectedId)) {
    filtered.unshift({
      id: selectedId,
      name: selectedId,
      architecture: { input_modalities: purpose === "text" ? ["text"] : ["text", "image"], output_modalities: ["text"] }
    });
  }
  return filtered;
}

function renderModelSelect(id, label, value, purpose) {
  const choices = openRouterModelChoices(purpose, value);
  return `
    <label>${label}
      <select id="${id}">
        ${choices.map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === value ? "selected" : ""}>${escapeHtml(model.name || model.id)} (${escapeHtml(model.id)})</option>`).join("")}
      </select>
    </label>
  `;
}

function seedanceApiBasePreset(value) {
  return seedanceApiBaseOptions.find((option) => option.value === value) || seedanceApiBaseOptions[0];
}

function renderSeedanceApiBaseSelect(value) {
  const current = seedanceApiBasePreset(value).value;
  return `
    <label class="full">動画生成プロバイダー
      <select id="setting-seedance-base-url">
        ${seedanceApiBaseOptions.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === current ? "selected" : ""}>${escapeHtml(option.label)} (${escapeHtml(option.value)})</option>`).join("")}
      </select>
    </label>
  `;
}

function normalizeOpenRouterVideoModel(model) {
  return {
    id: model.id,
    canonical_slug: model.canonical_slug || model.id,
    name: model.name || model.id,
    description: model.description || "",
    generate_audio: model.generate_audio,
    seed: model.seed ?? null,
    supported_aspect_ratios: Array.isArray(model.supported_aspect_ratios) ? model.supported_aspect_ratios : [],
    supported_durations: Array.isArray(model.supported_durations) ? model.supported_durations.map(Number).filter(Boolean) : [],
    supported_frame_images: Array.isArray(model.supported_frame_images) ? model.supported_frame_images : [],
    supported_resolutions: Array.isArray(model.supported_resolutions) ? model.supported_resolutions : [],
    supported_sizes: Array.isArray(model.supported_sizes) ? model.supported_sizes : [],
    allowed_passthrough_parameters: Array.isArray(model.allowed_passthrough_parameters) ? model.allowed_passthrough_parameters : [],
    pricing_skus: model.pricing_skus || {}
  };
}

function mergedOpenRouterVideoModels() {
  const map = new Map(fallbackOpenRouterVideoModels.map((model) => [model.id, normalizeOpenRouterVideoModel(model)]));
  state.openRouterVideoModels.forEach((model) => {
    if (targetOpenRouterVideoModelIds.includes(model.id)) map.set(model.id, normalizeOpenRouterVideoModel({ ...map.get(model.id), ...model }));
  });
  return targetOpenRouterVideoModelIds.map((id) => map.get(id)).filter(Boolean);
}

function openRouterVideoModelChoices(selectedId = "") {
  const models = mergedOpenRouterVideoModels();
  if (selectedId && !models.some((model) => model.id === selectedId)) {
    models.unshift(normalizeOpenRouterVideoModel({
      id: selectedId,
      name: selectedId,
      generate_audio: true,
      supported_durations: [5],
      supported_aspect_ratios: ["16:9"],
      supported_resolutions: ["720p"],
      supported_frame_images: ["first_frame", "last_frame"]
    }));
  }
  return models;
}

function replicateVideoModelChoices(selectedId = "") {
  const models = replicateSeedanceVideoModels.map((model) => normalizeOpenRouterVideoModel(model));
  if (selectedId && !models.some((model) => model.id === selectedId)) {
    models.unshift(normalizeOpenRouterVideoModel({
      id: selectedId,
      name: selectedId,
      generate_audio: true,
      supported_durations: [5],
      supported_aspect_ratios: ["16:9"],
      supported_resolutions: ["720p"],
      supported_frame_images: ["first_frame", "last_frame"]
    }));
  }
  return models;
}

function videoModelConfig(modelId, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  if (isReplicateSeedanceBaseUrl(baseUrl)) {
    return replicateVideoModelChoices(modelId).find((model) => model.id === modelId) || replicateVideoModelChoices()[0];
  }
  if (!isOpenRouterSeedanceBaseUrl(baseUrl)) {
    return modelId && modelId !== officialSeedanceVideoModel.id
      ? { ...officialSeedanceVideoModel, id: modelId, name: modelId }
      : officialSeedanceVideoModel;
  }
  return openRouterVideoModelChoices(modelId).find((model) => model.id === modelId) || openRouterVideoModelChoices()[0];
}

function videoModelBrand(modelId = "", baseUrl = state.db?.settings?.seedanceBaseUrl) {
  const model = videoModelConfig(modelId || state.db?.settings?.seedanceModel, baseUrl);
  const text = `${model?.name || ""} ${model?.id || modelId || ""}`.toLowerCase();
  if (text.includes("kling")) return "Kling";
  if (text.includes("seedance") || text.includes("bytedance")) return "Seedance";
  if (text.includes("veo")) return "Veo";
  if (text.includes("sora")) return "Sora";
  return "動画生成";
}

function defaultVideoJobTitle(modelId = "", baseUrl = state.db?.settings?.seedanceBaseUrl) {
  const brand = videoModelBrand(modelId, baseUrl);
  return brand === "動画生成" ? "動画生成" : `${brand} video`;
}

function displayVideoJobTitle(job) {
  const title = String(job?.title || "").trim();
  if (title && title !== "Seedance video") return title;
  return defaultVideoJobTitle(job?.settings?.model || job?.request?.model || state.db?.settings?.seedanceModel, job?.settings?.baseUrl);
}

function compatibleVideoModelId(modelId, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  const defaultModel = seedanceApiBasePreset(baseUrl).defaultModel;
  const value = modelId || defaultModel;
  if (isReplicateSeedanceBaseUrl(baseUrl)) {
    return replicateSeedanceVideoModels.some((model) => model.id === value) ? value : defaultModel;
  }
  if (isOpenRouterSeedanceBaseUrl(baseUrl)) {
    return targetOpenRouterVideoModelIds.includes(value) ? value : defaultModel;
  }
  return targetOpenRouterVideoModelIds.includes(value) ? defaultModel : value;
}

function optionList(values, fallback) {
  const list = Array.isArray(values) ? values.filter((value) => value !== null && value !== undefined && value !== "") : [];
  return [...new Set((list.length ? list : fallback).map(String))];
}

function optionValue(value, options) {
  const normalized = String(value ?? "");
  return options.includes(normalized) ? normalized : options[0];
}

function videoModeOptionsForModel(model) {
  const frameTypes = new Set(model?.supported_frame_images || []);
  const options = [
    ["reference", "参照素材"],
    ["text", "テキストのみ"]
  ];
  if (frameTypes.has("first_frame")) options.push(["first_frame", "開始フレーム"]);
  if (frameTypes.has("first_frame") && frameTypes.has("last_frame")) options.push(["first_last", "開始＋終了"]);
  return options;
}

function renderVideoModelSelect(id, value, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  if (isReplicateSeedanceBaseUrl(baseUrl)) {
    const choices = replicateVideoModelChoices(value);
    const current = choices.some((model) => model.id === value) ? value : seedanceApiBasePreset(baseUrl).defaultModel;
    return `
      <select id="${id}">
        ${choices.map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === current ? "selected" : ""}>${escapeHtml(model.name || model.id)} (${escapeHtml(model.id)})</option>`).join("")}
      </select>
    `;
  }
  if (!isOpenRouterSeedanceBaseUrl(baseUrl)) {
    const current = value || officialSeedanceVideoModel.id;
    return `<select id="${id}"><option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option></select>`;
  }
  const choices = openRouterVideoModelChoices(value);
  const current = choices.some((model) => model.id === value) ? value : seedanceApiBaseOptions.find((option) => option.value.includes("openrouter.ai"))?.defaultModel || choices[0]?.id || "";
  return `
    <select id="${id}">
      ${choices.map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === current ? "selected" : ""}>${escapeHtml(model.name || model.id)} (${escapeHtml(model.id)})</option>`).join("")}
    </select>
  `;
}

function updateSettingSeedanceResolutionOptions(modelId, baseUrl) {
  const select = document.querySelector("#setting-seedance-resolution");
  if (!select) return;
  const model = videoModelConfig(modelId, baseUrl);
  const options = optionList(model.supported_resolutions, [state.db.settings.seedanceResolution || "720p"]);
  const current = optionValue(select.value || state.db.settings.seedanceResolution || "720p", options);
  select.innerHTML = options.map((value) => `<option value="${escapeHtml(value)}" ${value === current ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function updateSettingSeedanceModelOptions(baseUrl, preferredModel = "") {
  const select = document.querySelector("#setting-seedance-model");
  if (!select) return;
  if (isReplicateSeedanceBaseUrl(baseUrl)) {
    const choices = replicateVideoModelChoices(preferredModel);
    const current = choices.some((model) => model.id === preferredModel) ? preferredModel : seedanceApiBasePreset(baseUrl).defaultModel;
    select.innerHTML = choices.map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === current ? "selected" : ""}>${escapeHtml(model.name || model.id)} (${escapeHtml(model.id)})</option>`).join("");
    updateSettingSeedanceResolutionOptions(current, baseUrl);
    return;
  }
  if (!isOpenRouterSeedanceBaseUrl(baseUrl)) {
    const current = preferredModel || officialSeedanceVideoModel.id;
    select.innerHTML = `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`;
    updateSettingSeedanceResolutionOptions(current, baseUrl);
    return;
  }
  const choices = openRouterVideoModelChoices(preferredModel);
  const current = choices.some((model) => model.id === preferredModel) ? preferredModel : seedanceApiBasePreset(baseUrl).defaultModel;
  select.innerHTML = choices.map((model) => `<option value="${escapeHtml(model.id)}" ${model.id === current ? "selected" : ""}>${escapeHtml(model.name || model.id)} (${escapeHtml(model.id)})</option>`).join("");
  updateSettingSeedanceResolutionOptions(current, baseUrl);
}

function seedanceSettingsStatusText(baseUrl = state.db?.settings?.seedanceBaseUrl) {
  if (isReplicateSeedanceBaseUrl(baseUrl)) {
    return "Replicate Predictions API向けのSeedance 2.0候補を表示しています。料金はReplicateの秒単価で概算します。";
  }
  if (isOpenRouterSeedanceBaseUrl(baseUrl)) {
    return state.openRouterVideoModelStatus === "loaded"
      ? "OpenRouter動画モデルの対応設定を読み込みました。"
      : state.openRouterVideoModelStatus === "loading"
        ? "OpenRouter動画モデルの対応設定を読み込み中です。"
        : state.openRouterVideoModelError || "OpenRouter動画モデルはフォールバック設定で表示しています。";
  }
  return "公式API向けの既定設定です。";
}

async function loadOpenRouterVideoModels({ force = false } = {}) {
  if (!force && ["loaded", "loading", "failed"].includes(state.openRouterVideoModelStatus)) return;
  state.openRouterVideoModelStatus = "loading";
  state.openRouterVideoModelError = "";
  if (state.view === "settings" || state.view === "video") render();
  try {
    const key = apiKey() || seedanceApiKey();
    if (!key) throw new Error("OpenRouter APIキーを保存すると、動画モデルの対応設定を自動取得できます。");
    const payload = await postJson("/api/openrouter/video-models", { apiKey: key });
    state.openRouterVideoModels = Array.isArray(payload.data) ? payload.data.map(normalizeOpenRouterVideoModel) : [];
    state.openRouterVideoModelStatus = "loaded";
  } catch (error) {
    state.openRouterVideoModels = [];
    state.openRouterVideoModelStatus = "failed";
    state.openRouterVideoModelError = `${error.message} フォールバック設定で表示します。`;
  }
  if (state.view === "settings" || state.view === "video") render();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function formatUsd(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  const decimals = Math.abs(number) >= 1 ? 2 : digits;
  const sign = number < 0 ? "-" : "";
  const [integer, fraction = ""] = Math.abs(number).toFixed(decimals).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${sign}${grouped}${decimals ? `.${fraction}` : ""}`;
}

function formatJpy(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `約${String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}円`;
}

function formatPlainNumber(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  const [integer, fraction = ""] = Math.abs(number).toFixed(digits).split(".");
  const sign = number < 0 ? "-" : "";
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cleanFraction = fraction.replace(/0+$/g, "");
  return `${sign}${grouped}${digits && cleanFraction ? `.${cleanFraction}` : ""}`;
}

function videoPricingSourceLabel(source = "") {
  if (source === "replicate") return "Replicate固定料金";
  if (source === "openrouter") return "OpenRouter取得";
  if (source === "fallback-token") return "フォールバック（トークン単価）";
  if (source === "fallback-per-second") return "フォールバック（秒単価）";
  if (source === "fallback") return "フォールバック";
  return source || "未取得";
}

function pricingResolutionKey(text = "") {
  const value = String(text).toLowerCase();
  if (value.includes("1080")) return "1080p";
  if (value.includes("720")) return "720p";
  if (value.includes("480")) return "480p";
  if (value.includes("2k") || value.includes("1440")) return "2K";
  if (value.includes("4k") || value.includes("2160")) return "4K";
  return "";
}

function collectPricingEntries(value, path = []) {
  const entries = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      entries.push(...collectPricingEntries(item, [...path, String(index)]));
    });
    return entries;
  }
  if (value && typeof value === "object") {
    const direct = numberOrNull(value.price ?? value.amount ?? value.cost ?? value.rate ?? value.unit_price ?? value.usd ?? value.value);
    if (direct !== null) {
      entries.push({
        key: [
          ...path,
          value.name,
          value.title,
          value.sku,
          value.unit,
          value.type,
          value.modality,
          value.metric,
          value.resolution,
          value.size
        ].filter(Boolean).join(" "),
        value: direct
      });
    }
    Object.entries(value).forEach(([key, child]) => {
      entries.push(...collectPricingEntries(child, [...path, key]));
    });
    return entries;
  }
  const direct = numberOrNull(value);
  if (direct !== null) entries.push({ key: path.join(" "), value: direct });
  return entries;
}

function fallbackVideoPricingForModel(modelId, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  if (isReplicateSeedanceBaseUrl(baseUrl)) return replicateSeedanceVideoPricing[modelId] || {};
  return fallbackOpenRouterVideoPricing[modelId] || {};
}

function inferVideoPricingFromModel(model = {}, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  const fallback = fallbackVideoPricingForModel(model.id, baseUrl);
  const pricing = {
    modelId: model.id || "",
    name: model.name || model.id || "",
    usdPerSecond: fallback.usdPerSecond ?? null,
    usdPerSecondByResolution: { ...(fallback.usdPerSecondByResolution || {}) },
    usdPerSecondVideoInByResolution: { ...(fallback.usdPerSecondVideoInByResolution || {}) },
    usdPerMillionVideoTokens: fallback.usdPerMillionVideoTokens ?? null,
    source: fallback.source || "fallback",
    pricingSkus: model.pricing_skus || {}
  };
  const entries = collectPricingEntries(model.pricing_skus || {});
  entries.forEach((entry) => {
    if (!Number.isFinite(entry.value) || entry.value <= 0) return;
    const key = String(entry.key || "").toLowerCase();
    const resolution = pricingResolutionKey(key);
    const looksPerSecond = key.includes("second") || key.includes("sec") || key.includes("per_second") || key.includes("per second");
    const looksToken = key.includes("token");
    const looksVideo = key.includes("video") || key.includes("generation") || key.includes("output");
    if (looksPerSecond && !looksToken) {
      if (resolution) pricing.usdPerSecondByResolution[resolution] = entry.value;
      else pricing.usdPerSecond = entry.value;
      pricing.source = "openrouter";
      return;
    }
    if (looksToken || (looksVideo && entry.value < 0.001)) {
      pricing.usdPerMillionVideoTokens = key.includes("million") || entry.value >= 0.01 ? entry.value : entry.value * 1000000;
      pricing.source = "openrouter";
      return;
    }
    if (looksVideo && !pricing.usdPerSecond) {
      pricing.usdPerSecond = entry.value;
      pricing.source = "openrouter";
    }
  });
  return pricing;
}

function videoPricingForModel(modelId, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  if (isReplicateSeedanceBaseUrl(baseUrl) && replicateSeedanceVideoPricing[modelId]) {
    return replicateSeedanceVideoPricing[modelId];
  }
  const stored = state.db?.settings?.videoPricing?.models?.[modelId];
  if (stored && !(isOpenRouterSeedanceBaseUrl(baseUrl) && stored.source === "replicate")) return stored;
  const model = videoModelConfig(modelId, baseUrl);
  return inferVideoPricingFromModel(model || { id: modelId, name: modelId }, baseUrl);
}

function pixelsForVideoSetting(resolution = "720p", ratio = "16:9") {
  const base = Number(String(resolution).match(/\d+/)?.[0]) || 720;
  const [rawW, rawH] = String(ratio || "16:9").split(":").map(Number);
  const widthRatio = Number.isFinite(rawW) && rawW > 0 ? rawW : 16;
  const heightRatio = Number.isFinite(rawH) && rawH > 0 ? rawH : 9;
  const width = widthRatio >= heightRatio ? base * (widthRatio / heightRatio) : base;
  const height = widthRatio >= heightRatio ? base : base * (heightRatio / widthRatio);
  return Math.round(width) * Math.round(height);
}

function estimateUsdPerSecond(modelId, resolution = "720p", ratio = "16:9", options = {}) {
  const pricing = videoPricingForModel(modelId, options.baseUrl);
  const byResolution = pricing?.usdPerSecondByResolution || {};
  const videoInByResolution = pricing?.usdPerSecondVideoInByResolution || {};
  const rateTable = options.hasVideoInput && Object.keys(videoInByResolution).length ? videoInByResolution : byResolution;
  const resolutionRate = numberOrNull(rateTable[resolution] ?? rateTable[String(resolution).toLowerCase()] ?? rateTable[String(resolution).toUpperCase()]);
  if (resolutionRate !== null) return resolutionRate;
  const perSecond = numberOrNull(pricing?.usdPerSecond);
  if (perSecond !== null) return perSecond;
  const tokenRate = numberOrNull(pricing?.usdPerMillionVideoTokens);
  if (tokenRate !== null) {
    const videoTokensPerSecond = pixelsForVideoSetting(resolution, ratio) * 24 / 1024;
    return videoTokensPerSecond * tokenRate / 1000000;
  }
  return null;
}

function hasVideoInputReferences(references = []) {
  return Array.isArray(references) && references.some((item) => item?.kind === "video" || String(item?.role || "").includes("video"));
}

function videoJobHasVideoInput(job) {
  if (hasVideoInputReferences(job?.references)) return true;
  const input = job?.request?.input || {};
  if (Array.isArray(input.reference_videos) && input.reference_videos.length) return true;
  const content = Array.isArray(job?.request?.content) ? job.request.content : [];
  return content.some((item) => item?.type === "video_url" || item?.video_url);
}

function durationSecondsForVideoJob(job) {
  return numberOrNull(job?.settings?.duration ?? job?.request?.duration ?? job?.request?.duration_seconds) || 0;
}

function actualVideoJobCostUsd(job) {
  const usage = job?.providerPayload?.usage || job?.providerPayload?.data?.usage || {};
  const candidates = [
    usage.cost,
    usage.total_cost,
    usage.cost_usd,
    usage.total_cost_usd,
    job?.providerPayload?.cost,
    job?.providerPayload?.total_cost
  ];
  for (const candidate of candidates) {
    const value = numberOrNull(candidate);
    if (value !== null) return value;
  }
  return null;
}

function videoJobCostSummary(job) {
  const actual = actualVideoJobCostUsd(job);
  if (actual !== null) return { usd: actual, source: "actual" };
  const status = String(job?.status || "").toLowerCase();
  if (["failed", "cancelled", "expired"].includes(status)) return { usd: null, source: "excluded" };
  const duration = durationSecondsForVideoJob(job);
  const modelId = job?.settings?.model || job?.request?.model || state.db?.settings?.seedanceModel || "";
  const resolution = job?.settings?.resolution || job?.request?.resolution || state.db?.settings?.seedanceResolution || "720p";
  const ratio = job?.settings?.ratio || job?.request?.ratio || "16:9";
  const rate = estimateUsdPerSecond(modelId, resolution, ratio, {
    baseUrl: job?.settings?.baseUrl || state.db?.settings?.seedanceBaseUrl,
    hasVideoInput: videoJobHasVideoInput(job)
  });
  if (rate !== null && duration > 0) return { usd: rate * duration, source: "estimated" };
  return { usd: null, source: "unknown" };
}

function currentMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    label: `${now.getFullYear()}年${now.getMonth() + 1}月`
  };
}

function monthlyVideoCostSummary() {
  const month = currentMonthRange();
  const jobs = (state.db.videoJobs || []).filter((job) => {
    const date = new Date(job.createdAt || job.updatedAt || "");
    return Number.isFinite(date.getTime()) && date >= month.start && date < month.end;
  });
  const rate = numberOrNull(state.db.settings?.videoPricing?.usdJpyRate) || 155;
  const totals = jobs.reduce((summary, job) => {
    const cost = videoJobCostSummary(job);
    const seconds = durationSecondsForVideoJob(job);
    summary.seconds += seconds;
    if (cost.usd !== null) {
      summary.usd += cost.usd;
      summary.counted += 1;
      if (cost.source === "actual") summary.actualUsd += cost.usd;
      if (cost.source === "estimated") summary.estimatedUsd += cost.usd;
    } else if (cost.source !== "excluded") {
      summary.unknown += 1;
    }
    return summary;
  }, { usd: 0, actualUsd: 0, estimatedUsd: 0, seconds: 0, counted: 0, unknown: 0 });
  return {
    ...month,
    ...totals,
    jobCount: jobs.length,
    usdJpyRate: rate,
    usdJpySource: state.db.settings?.videoPricing?.usdJpySource || "fallback",
    updatedAt: state.db.settings?.videoPricing?.updatedAt || "",
    jpy: totals.usd * rate
  };
}

function currentVideoRateSummary(modelId, resolution, ratio, options = {}) {
  const baseUrl = options.baseUrl || state.db?.settings?.seedanceBaseUrl;
  const pricing = videoPricingForModel(modelId, baseUrl);
  const usdPerSecond = estimateUsdPerSecond(modelId, resolution, ratio, options);
  const usdJpyRate = numberOrNull(state.db.settings?.videoPricing?.usdJpyRate) || 155;
  return {
    modelId,
    usdPerSecond,
    jpyPerSecond: usdPerSecond === null ? null : usdPerSecond * usdJpyRate,
    source: pricing?.source || "fallback",
    tier: pricing?.source === "replicate" ? (options.hasVideoInput ? "video_in" : "non_video_in") : "",
    pricing
  };
}

async function refreshVideoPricing() {
  state.videoPricingStatus = "loading";
  state.videoPricingError = "";
  render();
  const previous = state.db.settings.videoPricing || {};
  let usdJpyRate = numberOrNull(previous.usdJpyRate) || 155;
  let usdJpySource = previous.usdJpySource || "fallback";
  const notes = [];
  try {
    const ratePayload = await getJson("/api/exchange-rate/usd-jpy");
    const nextRate = numberOrNull(ratePayload.rate);
    if (nextRate !== null) {
      usdJpyRate = nextRate;
      usdJpySource = ratePayload.source || "api";
    }
  } catch (error) {
    notes.push(`為替は保存済みレートを使いました: ${error.message}`);
  }
  if (isOpenRouterSeedanceBaseUrl()) {
    await loadOpenRouterVideoModels({ force: true });
    if (state.openRouterVideoModelStatus === "failed") {
      notes.push(state.openRouterVideoModelError || "OpenRouter動画モデル料金はフォールバックを使いました。");
    }
  }
  const models = isOpenRouterSeedanceBaseUrl()
    ? mergedOpenRouterVideoModels()
    : isReplicateSeedanceBaseUrl()
      ? replicateSeedanceVideoModels
      : [officialSeedanceVideoModel];
  const pricingModels = { ...(previous.models || {}) };
  models.forEach((model) => {
    pricingModels[model.id] = inferVideoPricingFromModel(model, state.db.settings.seedanceBaseUrl);
  });
  state.db.settings.videoPricing = {
    updatedAt: new Date().toISOString(),
    usdJpyRate,
    usdJpySource,
    models: pricingModels
  };
  state.videoPricingStatus = "loaded";
  state.videoPricingError = notes.join(" ");
  await saveDb();
  render();
  toast(notes.length ? "動画料金を更新しました。一部は保存済みまたはフォールバックです。" : "動画料金と為替レートを更新しました。");
}

async function loadOpenRouterModels({ force = false } = {}) {
  if (!force && ["loaded", "loading", "failed"].includes(state.openRouterModelStatus)) return;
  state.openRouterModelStatus = "loading";
  state.openRouterModelError = "";
  if (state.view === "settings") render();
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);
    const response = await fetch("/api/openrouter/models", { signal: controller.signal });
    window.clearTimeout(timeoutId);
    const payload = await response.json().catch(async () => ({ error: await response.text().catch(() => "") }));
    if (!response.ok) {
      const restartHint = response.status === 404 ? "アプリを再起動すると新しいモデル一覧APIが有効になります。" : "";
      throw new Error([payload.error || `モデル一覧APIが ${response.status} を返しました。`, restartHint].filter(Boolean).join(" "));
    }
    const models = Array.isArray(payload.data) ? payload.data : [];
    state.openRouterModels = models
      .filter((model) => model?.id)
      .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), "ja"));
    state.openRouterModelStatus = "loaded";
  } catch (error) {
    state.openRouterModels = [];
    state.openRouterModelStatus = "failed";
    state.openRouterModelError = error.name === "AbortError" ? "モデル一覧の取得が18秒でタイムアウトしました。時間を置いて再取得してください。" : error.message;
  }
  if (state.view === "settings") render();
}

function promptFormatOf(char) {
  return char?.promptFormat === "tags" ? "tags" : "natural";
}

function promptFormatLabel(format) {
  return format === "tags" ? "タグ" : "自然言語";
}

function promptFormatInstruction(format) {
  if (format === "tags") {
    return "Danbooru/Stable Diffusion系のカンマ区切りタグで返してください。短い英語タグを中心にし、文章にはしないでください。";
  }
  return "自然言語の文章で返してください。生成したい絵の内容、人物、表情、服装、構図、雰囲気を読みやすい英文または日本語文でまとめてください。";
}

function elapsedTextSince(value) {
  const time = new Date(value || "").getTime();
  if (!Number.isFinite(time)) return "";
  const elapsed = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (elapsed >= 3600) return `${Math.floor(elapsed / 3600)}時間${Math.floor((elapsed % 3600) / 60)}分`;
  if (elapsed >= 60) return `${Math.floor(elapsed / 60)}分${String(elapsed % 60).padStart(2, "0")}秒`;
  return `${elapsed}秒`;
}

function imageAssetStatusLabel(asset) {
  return {
    matched: "判別済み",
    failed: "判別失敗",
    classifying: "AI判別中",
    unassigned: "未設定"
  }[asset?.status] || "未設定";
}

function isAssetClassifying(asset) {
  return asset?.status === "classifying";
}

function setAssetClassificationProgress(asset, stage, message) {
  if (!asset) return;
  const now = new Date().toISOString();
  asset.status = "classifying";
  asset.classifyStage = stage;
  asset.classifyMessage = message || "AI判別の処理中です。";
  asset.classifyStartedAt = asset.classifyStartedAt || now;
  asset.classifyUpdatedAt = now;
}

function clearAssetClassificationProgress(asset) {
  if (!asset) return;
  delete asset.classifyStage;
  delete asset.classifyMessage;
  delete asset.classifyStartedAt;
  delete asset.classifyUpdatedAt;
}

function markAssetClassificationFailed(asset, error) {
  if (!asset) return;
  asset.status = "failed";
  asset.confidence = null;
  asset.aiReason = readableError(error?.message || error) || "AI判別に失敗しました。";
  clearAssetClassificationProgress(asset);
}

function markInterruptedImageClassifications() {
  let changed = false;
  for (const asset of state.db?.assets || []) {
    if (!isAssetClassifying(asset)) continue;
    asset.status = "failed";
    asset.confidence = null;
    asset.aiReason = "前回のAI判別はページ再読み込みまたはアプリ終了で中断されました。必要ならAIキャラ判定を再実行してください。";
    clearAssetClassificationProgress(asset);
    changed = true;
  }
  return changed;
}

function workForAsset(asset) {
  return byId(state.db.works, asset.workId);
}

function characterForAsset(asset) {
  return byId(state.db.characters, asset.characterId);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function getImageInfo(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const aspectRatio = width && height ? Number((width / height).toFixed(4)) : null;
      resolve({
        width,
        height,
        aspectRatio,
        aspectRatioText: formatAspectRatio(width, height)
      });
    };
    image.onerror = () => resolve({ width: null, height: null, aspectRatio: null, aspectRatioText: "" });
    image.src = dataUrl;
  });
}

function gcd(a, b) {
  let x = Math.abs(Number(a) || 0);
  let y = Math.abs(Number(b) || 0);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function formatAspectRatio(width, height) {
  if (!width || !height) return "";
  const divisor = gcd(width, height);
  const simpleWidth = width / divisor;
  const simpleHeight = height / divisor;
  if (simpleWidth <= 30 && simpleHeight <= 30) return `${simpleWidth}:${simpleHeight}`;
  return `${(width / height).toFixed(2)}:1`;
}

function assetDimensionLabel(asset) {
  if (!asset?.width || !asset?.height) return "";
  return `${asset.width}x${asset.height}${asset.aspectRatioText ? ` / ${asset.aspectRatioText}` : ""}`;
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return fileToDataUrl(blob);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function readableError(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(readableError).filter(Boolean).join(" / ");
  if (typeof value === "object") {
    const nested = readableError(value.message)
      || readableError(value.error)
      || readableError(value.detail)
      || readableError(value.reason)
      || readableError(value.raw);
    if (nested) return nested;
    const json = JSON.stringify(value);
    return json === "{}" ? "" : json;
  }
  return String(value);
}

async function postJson(url, body, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }
	  if (!response.ok) {
	    if (url.startsWith("/api/irodori/") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("Irodori-TTS APIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    if (url.startsWith("/api/elevenlabs/") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("ElevenLabs APIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    if (url.startsWith("/api/voicebox/") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("Voicebox APIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    if (url.startsWith("/api/remove-bg") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("画像編集クラウドAPIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    if (url.startsWith("/api/rembg/") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("rembg APIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    if (url.startsWith("/api/backgroundremover/") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("backgroundremover APIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    if (url.startsWith("/api/image-edit/") && /Method not allowed|Not found/i.test(text)) {
	      throw new Error("画像編集APIが起動中のサーバーに反映されていません。アプリのサーバーを停止して再起動し、ブラウザをリロードしてください。");
	    }
	    const error = new Error(readableError(payload.error) || readableError(payload) || text || `${response.status} ${response.statusText}`);
	    error.payload = payload;
	    error.responseText = text;
	    throw error;
	  }
  return payload;
}

async function saveDb() {
  await postJson("/api/db", state.db, "PUT");
}

async function relocateAsset(asset) {
  const char = characterForAsset(asset);
  const worldItem = worldItemForAsset(asset);
  if (char) {
    asset.workId = char.workId;
    asset.worldItemId = null;
  } else if (worldItem) {
    asset.workId = worldItem.workId;
    asset.characterId = null;
  }
  const work = workForAsset(asset) || byId(state.db.works, char?.workId || worldItem?.workId);
  const moved = await postJson("/api/move-upload", {
    url: asset.url,
    workName: work?.name,
    characterName: char?.name || worldItem?.name
  });
  asset.url = moved.url;
  asset.localPath = moved.path;
}

async function relocateUploadUrl(uploadUrl, work, char) {
  if (!uploadUrl) return uploadUrl;
  const moved = await postJson("/api/move-upload", {
    url: uploadUrl,
    workName: work?.name,
    characterName: char?.name
  });
  return moved.url;
}

async function relocateAssetsForWork(workId) {
  for (const asset of state.db.assets.filter((item) => item.workId === workId)) {
    await relocateAsset(asset);
  }
}

async function relocateAssetsForCharacter(characterId) {
  const char = byId(state.db.characters, characterId);
  const work = byId(state.db.works, char?.workId);
  for (const asset of state.db.assets.filter((item) => item.characterId === characterId)) {
    await relocateAsset(asset);
  }
  if (char?.portraitUrl) {
    char.portraitUrl = await relocateUploadUrl(char.portraitUrl, work, char);
  }
}

async function relocateAssetsForWorldItem(worldItemId) {
  const item = workWorldItemById(worldItemId);
  const work = byId(state.db.works, item?.workId);
  for (const asset of state.db.assets.filter((candidate) => candidate.worldItemId === worldItemId)) {
    await relocateAsset(asset);
  }
  if (item?.referenceUrl) {
    item.referenceUrl = await relocateUploadUrl(item.referenceUrl, work, item);
  }
}

async function revealUpload(asset) {
  const result = await postJson("/api/reveal-upload", { url: asset.url });
  toast(`Finderで表示しました: ${result.path}`);
}

function isUploadUrlReferenced(url, excludingAssetId = null) {
  return isUploadUrlReferencedOutsideAssetIds(url, excludingAssetId ? new Set([excludingAssetId]) : new Set());
}

function isUploadUrlReferencedOutsideAssetIds(url, excludingAssetIds = new Set()) {
  if (!url) return false;
  return state.db.characters.some((char) => char.portraitUrl === url)
    || state.db.works.some((work) => {
      const setting = work.worldSetting;
      if (!setting) return false;
      return setting.sourceImageUrl === url
        || (setting.sheets || []).some((sheet) => sheet.sourceImageUrl === url);
    })
    || (state.db.worldItems || []).some((item) => item.referenceUrl === url)
    || state.db.assets.some((asset) => !excludingAssetIds.has(asset.id) && asset.url === url);
}

async function deleteAssetCompletely(asset) {
  if (!asset) return;
  const shared = isUploadUrlReferenced(asset.url, asset.id);
  const ok = window.confirm(
    shared
      ? `「${asset.name}」の登録を削除します。この画像ファイルは他の登録、キャラ立ち絵、作品情報、その他情報で使われているため、ファイル本体は残します。`
      : `「${asset.name}」の登録と画像ファイル本体を削除します。この操作は元に戻せません。`
  );
  if (!ok) return;

  if (!shared) {
    await postJson("/api/delete-upload", { url: asset.url });
  }
  state.db.assets = state.db.assets.filter((item) => item.id !== asset.id);
  await saveDb();
  toast(shared ? "登録を削除しました。画像ファイル本体は残しました。" : "登録と画像ファイル本体を削除しました。");
  render();
}

async function deleteGalleryAssetsCompletely(assets) {
  if (!assets.length) return;
  const deletingIds = new Set(assets.map((asset) => asset.id));
  const deletingUrls = new Set();
  for (const asset of assets) {
    if (!asset.url || isUploadUrlReferencedOutsideAssetIds(asset.url, deletingIds)) continue;
    deletingUrls.add(asset.url);
  }
  const sharedCount = assets.filter((asset) => !deletingUrls.has(asset.url)).length;
  const ok = window.confirm(
    `選択中の ${assets.length} 件の登録を完全削除します。`
    + (deletingUrls.size ? `参照が残らない画像ファイル本体 ${deletingUrls.size} 件も削除します。` : "画像ファイル本体は他の登録、キャラ立ち絵、作品情報、その他情報で使われているため残します。")
    + (sharedCount && deletingUrls.size ? ` ${sharedCount} 件分の共有ファイルは残します。` : "")
    + "この操作は元に戻せません。"
  );
  if (!ok) return;

  for (const url of deletingUrls) {
    await postJson("/api/delete-upload", { url });
  }
  state.db.assets = state.db.assets.filter((asset) => !deletingIds.has(asset.id));
  state.gallerySelectedAssetIds = (state.gallerySelectedAssetIds || []).filter((id) => !deletingIds.has(id));
  await saveDb();
  toast(`${assets.length} 件の登録を削除しました。${deletingUrls.size ? `画像ファイル本体 ${deletingUrls.size} 件も削除しました。` : "画像ファイル本体は残しました。"}`);
  render();
}

async function normalizeStoredUploads() {
  let changed = false;
  const oldSettings = JSON.stringify(state.db.settings || {});
  normalizeSettings();
  if (JSON.stringify(state.db.settings) !== oldSettings) changed = true;
  if (!Array.isArray(state.db.worldItems)) {
    state.db.worldItems = [];
    changed = true;
  }
  if (!Array.isArray(state.db.videoMedia)) {
    state.db.videoMedia = [];
    changed = true;
  }
  if (!Array.isArray(state.db.videoJobs)) {
    state.db.videoJobs = [];
    changed = true;
  }
  if (!Array.isArray(state.db.imageJobs)) {
    state.db.imageJobs = [];
    changed = true;
  }
  if (!Array.isArray(state.db.audioItems)) {
    state.db.audioItems = [];
    changed = true;
  }
  const oldWorldItems = JSON.stringify(state.db.worldItems);
  state.db.worldItems = state.db.worldItems.map(normalizeWorldItem);
  if (JSON.stringify(state.db.worldItems) !== oldWorldItems) changed = true;
  const oldAudioItems = JSON.stringify(state.db.audioItems);
  state.db.audioItems = state.db.audioItems.map(normalizeAudioItem).filter((item) => item.url);
  if (JSON.stringify(state.db.audioItems) !== oldAudioItems) changed = true;
  const oldImageJobs = JSON.stringify(state.db.imageJobs);
  state.db.imageJobs = state.db.imageJobs.map(normalizeImageJob);
  if (JSON.stringify(state.db.imageJobs) !== oldImageJobs) changed = true;
  for (const work of state.db.works) {
    if (ensureDefaultWorldItemsForWork(work)) changed = true;
  }
  for (const work of state.db.works) {
    if (work.worldSetting) {
      const normalized = normalizeWorldSetting(work.worldSetting);
      if (JSON.stringify(normalized) !== JSON.stringify(work.worldSetting)) {
        work.worldSetting = normalized;
        changed = true;
      }
    }
  }
  for (const char of state.db.characters) {
    if (!char.promptFormat) {
      char.promptFormat = "natural";
      changed = true;
    }
  }
  for (const asset of state.db.assets) {
    if (asset.characterId && asset.worldItemId) {
      asset.worldItemId = null;
      changed = true;
    }
    if (!asset.aiPromptFormat) {
      const char = characterForAsset(asset);
      asset.aiPromptFormat = promptFormatOf(char);
      changed = true;
    }
  }
  for (const char of state.db.characters) {
    if (!char.portraitUrl) continue;
    const work = byId(state.db.works, char.workId);
    try {
      const nextUrl = await relocateUploadUrl(char.portraitUrl, work, char);
      if (nextUrl !== char.portraitUrl) {
        char.portraitUrl = nextUrl;
        changed = true;
      }
    } catch {
      // Missing files stay visible in metadata so the user can repair them later.
    }
  }
  for (const asset of state.db.assets) {
    try {
      const oldUrl = asset.url;
      await relocateAsset(asset);
      if (asset.url !== oldUrl) changed = true;
    } catch {
      // Missing files stay visible in metadata so the user can repair them later.
    }
  }
  if (changed) await saveDb();
}

function toast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = readableError(message) || String(message || "");
  document.body.append(node);
  window.setTimeout(() => node.remove(), node.textContent.length > 80 ? 8000 : 3200);
}

function toastApiSubmitted(message = "APIに送信しました。返答を待っています。") {
  toast(message);
}

function cleanJsonCandidate(value) {
  return String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function findBalancedJson(text) {
  const source = String(text || "");
  const start = source.search(/[\[{]/);
  if (start === -1) return "";
  const opener = source[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === opener) depth += 1;
    if (char === closer) depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  return "";
}

function parseAiJson(content) {
  const text = String(content || "").trim();
  const codeBlocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((match) => match[1]);
  const candidates = [text, ...codeBlocks, findBalancedJson(text)].filter(Boolean).map(cleanJsonCandidate);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next extraction strategy.
    }
  }
  const preview = text.slice(0, 180).replace(/\s+/g, " ");
  const error = new Error(`AI応答を JSON として読み取れませんでした。応答の先頭: ${preview || "空の応答"}`);
  error.rawContent = text;
  throw error;
}

function selectedOpenRouterModel({ textOnly = false, purpose = "" } = {}) {
  if (purpose === "world") return state.db.settings.worldModel || state.db.settings.defaultModel || state.db.settings.textModel;
  if (purpose === "image") return state.db.settings.imageAgentModel || state.db.settings.textModel || state.db.settings.defaultModel;
  if (purpose === "video") return state.db.settings.videoAgentModel || state.db.settings.textModel || state.db.settings.defaultModel;
  if (purpose === "audio") return state.db.settings.audioAgentModel || state.db.settings.textModel || state.db.settings.defaultModel;
  if (textOnly || purpose === "text") return state.db.settings.textModel || state.db.settings.defaultModel;
  return state.db.settings.defaultModel || state.db.settings.textModel;
}

async function callOpenRouter({ messages, responseFormat, temperature = 0.2, maxTokens = 1800, textOnly = false, purpose = "" }) {
  const key = apiKey();
  const model = selectedOpenRouterModel({ textOnly, purpose });
  if (!key) throw new Error("設定画面で OpenRouter API キーを保存してください。");
  const payload = await postJson("/api/openrouter/chat", {
    apiKey: key,
    model,
    messages,
    response_format: responseFormat,
    temperature,
    max_tokens: maxTokens
  });
  const content = payload.choices?.[0]?.message?.content || "";
  state.lastOpenRouterDebug = {
    purpose,
    model,
    content,
    payload,
    createdAt: new Date().toISOString()
  };
  return content;
}

function openRouterDebugText(error) {
  const rawContent = String(error?.rawContent || "").trim();
  if (rawContent) return rawContent;
  if (error?.payload || error?.responseText) {
    return [
      error.responseText ? `responseText:\n${error.responseText}` : "",
      error.payload ? `payload:\n${JSON.stringify(error.payload, null, 2)}` : ""
    ].filter(Boolean).join("\n\n");
  }
  const debug = state.lastOpenRouterDebug;
  if (!debug) return "";
  const choice = debug.payload?.choices?.[0] || {};
  const lines = [
    `model: ${debug.model || ""}`,
    `purpose: ${debug.purpose || ""}`,
    `createdAt: ${debug.createdAt || ""}`,
    `finish_reason: ${choice.finish_reason || ""}`,
    `message.content: ${debug.content || "(空)"}`,
    "",
    "OpenRouter raw payload:",
    JSON.stringify(debug.payload || {}, null, 2)
  ];
  return lines.join("\n");
}

function debugChatText(error, limit = 4000) {
  const debugText = openRouterDebugText(error);
  if (!debugText) return "";
  return `\n\n--- デバッグ用のOpenRouter応答 ---\n${compactRawText(debugText, limit)}`;
}

function preserveLiveTextDrafts() {
  const audioInput = document.querySelector("#audio-input-text");
  if (audioInput) {
    state.audioPromptDraft = {
      ...(state.audioPromptDraft || {}),
      input: audioInput.value
    };
  }
  const audioChatInput = document.querySelector("#audio-chat-input");
  if (audioChatInput) state.audioChatDraft = audioChatInput.value;
  const videoPrompt = document.querySelector("#video-prompt-text");
  if (videoPrompt) {
    state.videoPromptDraft = {
      ...(state.videoPromptDraft || {}),
      prompt: videoPrompt.value
    };
  }
  const videoChatInput = document.querySelector("#video-chat-input");
  if (videoChatInput) state.videoChatDraft = videoChatInput.value;
  const imagePrompt = document.querySelector("#image-prompt-text");
  if (imagePrompt) {
    state.imagePromptDraft = {
      ...(state.imagePromptDraft || {}),
      prompt: imagePrompt.value
    };
  }
  const imageNegativePrompt = document.querySelector("#image-negative-prompt");
  if (imageNegativePrompt) {
    state.imagePromptDraft = {
      ...(state.imagePromptDraft || {}),
      negativePrompt: imageNegativePrompt.value
    };
  }
  const imageChatInput = document.querySelector("#image-chat-input");
  if (imageChatInput) state.imageChatDraft = imageChatInput.value;
}

function render(options = {}) {
  if (options.preserveLiveTextDrafts !== false) preserveLiveTextDrafts();
  const [title, sub] = currentTitle();
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>Creative<br>File Studio</strong>
          <span>local creator archive</span>
        </div>
        <nav class="nav">
          ${navItems.map(renderNavItem).join("")}
        </nav>
        <div class="sidebar-meta">
          ${state.db.works.length} 作品 / ${state.db.characters.length} キャラ / ${state.db.worldItems?.length || 0} その他 / ${state.db.assets.length} 画像 / ${state.db.imageJobs?.length || 0} 画像生成 / ${state.db.audioItems?.length || 0} 音声 / ${state.db.videoJobs?.length || 0} 動画
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${title}</h1>
            <p>${sub}</p>
          </div>
          <div class="topbar-actions">
            <button class="ghost" data-action="save-now">保存</button>
            <button class="ghost icon-button help-button" data-action="open-help" aria-label="${escapeHtml(title)}のヘルプを表示" title="ヘルプ">?</button>
          </div>
        </header>
        <section class="content">${renderView()}</section>
      </main>
    </div>
  `;
  bindCommon();
  bindView();
}

function navItemIsActive(item) {
  if (state.view === item.id) return true;
  return (item.children || []).some((child) => child.id === state.view);
}

function navItemIsExpanded(item) {
  return Boolean(item.children?.length && navItemIsActive(item));
}

function renderNavButton(item, className = "", extraAttrs = "") {
  const active = state.view === item.id;
  const classes = `${className} ${active ? "active" : ""}`.trim();
  return `<button class="${escapeHtml(classes)}" data-view="${escapeHtml(item.id)}" ${extraAttrs}>${escapeHtml(item.label)}</button>`;
}

function renderNavItem(item) {
  if (!item.children?.length) {
    return renderNavButton(item, "nav-button");
  }
  const expanded = navItemIsExpanded(item);
  const active = navItemIsActive(item);
  const defaultView = item.defaultView || item.children[0].id;
  return `
    <div class="nav-group ${expanded ? "expanded" : ""}">
      <button class="nav-button nav-parent ${active ? "active" : ""}" data-nav-parent="${escapeHtml(item.id)}" data-default-view="${escapeHtml(defaultView)}" aria-expanded="${expanded ? "true" : "false"}">
        <span>${escapeHtml(item.label)}</span>
      </button>
      <div class="nav-children" ${expanded ? "" : "hidden"}>
        ${item.children.map((child) => renderNavButton(child, "nav-button nav-child")).join("")}
      </div>
    </div>
  `;
}

function currentTitle() {
  if (state.view === "studio") return ["作品とキャラ", "作品単位でキャラ設定と立ち絵を管理します。"];
  if (state.view === "import") return ["画像取込", "複数画像を取り込み、AIでキャラ別に振り分けます。"];
  if (state.view === "gallery") return ["画像一覧", "作品ごと、キャラごとに保存済み画像を閲覧します。"];
  if (state.view === "image") return ["画像生成", "ComfyUIでローカルGPUまたはクラウドGPUに生成を投げます。"];
  if (state.view === "edit") return ["画像編集", "背景除去と透過PNG変換を行います。"];
  if (state.view === "edit-gif") return ["動画GIF化", "動画をGIFに変換して画像一覧へ保存します。"];
  if (state.view === "audio") return ["音声生成", "OpenRouter、ElevenLabs、Voicebox、Irodori-TTSでキャラ音声やナレーションを作ります。"];
  if (state.view === "video") return ["動画生成", "選択した動画モデル向けの指示書作成と生成を行います。"];
  if (state.view === "library") return ["画像整理", "取り込んだ画像を作品・キャラ・状態で確認します。"];
  if (state.view === "prompt") return ["Prompt Lab", "差分やシーン案から生成プロンプトをまとめて作ります。"];
  return ["設定", "OpenRouter の接続情報とモデルを設定します。"];
}

function currentHelpContent() {
  return screenHelpContent[state.view] || screenHelpContent.settings;
}

function renderHelpContent(help) {
  return `
    <div class="help-content">
      <p class="help-lead">${escapeHtml(help.lead || "")}</p>
      <div class="help-section-grid">
        ${(help.sections || []).map(renderHelpSection).join("")}
      </div>
    </div>
  `;
}

function renderHelpSection(section) {
  return `
    <section class="help-section">
      <h3>${escapeHtml(section.title || "")}</h3>
      <dl class="help-def-list">
        ${(section.items || []).map((item) => `
          <div>
            <dt>${escapeHtml(item.term || "")}</dt>
            <dd>${escapeHtml(item.description || "")}</dd>
          </div>
        `).join("")}
      </dl>
    </section>
  `;
}

function openCurrentHelpModal() {
  const help = currentHelpContent();
  openModal(
    help.title || "ヘルプ",
    renderHelpContent(help),
    `<span aria-hidden="true"></span><button class="accent" data-action="close-modal">閉じる</button>`,
    () => {}
  );
}

function renderView() {
  if (state.view === "studio") return renderStudio();
  if (state.view === "import") return renderImport();
  if (state.view === "gallery") return renderGallery();
  if (state.view === "image") return renderImageAgent();
  if (state.view === "edit") return renderImageEditor();
  if (state.view === "edit-gif") return renderVideoGifConverter();
  if (state.view === "audio") return renderAudioAgent();
  if (state.view === "video") return renderVideoAgent();
  if (state.view === "library") return renderLibrary();
  if (state.view === "prompt") return renderPromptLab();
  return renderSettings();
}

function renderStudio() {
  const work = byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.selectedWorkId && work) state.selectedWorkId = work.id;
  const chars = work ? charactersForWork(work.id) : [];
  const worldItems = work ? worldItemsForWork(work.id) : [];
  return `
    <div class="layout">
      <section class="panel">
        <div class="panel-header">
          <h2>作品</h2>
          <button data-action="new-work">追加</button>
        </div>
        <div class="panel-body">
          ${state.db.works.length ? `<div class="work-list">${state.db.works.map(renderWorkRow).join("")}</div>` : `<div class="empty">最初の作品を追加してください。</div>`}
        </div>
      </section>
      <section>
        <div class="toolbar">
          <div>
            <h2 class="section-title">${work ? escapeHtml(work.name) : "キャラ"}</h2>
            <div class="meta">${work ? `${chars.length} キャラ / ${worldItems.length} その他 / ${assetsForWork(work.id).length} 画像` : "作品を選択してください。"}</div>
          </div>
          <div class="group">
            ${work ? `<button class="ghost" data-action="edit-work" data-id="${work.id}">作品編集</button><button data-action="new-character">キャラ追加</button>` : ""}
          </div>
        </div>
        ${work ? renderWorldInfo(work) : ""}
        ${chars.length ? `<div class="grid">${chars.map(renderCharacterCard).join("")}</div>` : `<div class="empty">この作品にはまだキャラがありません。</div>`}
        ${work ? renderWorldItemsSection(work, worldItems) : ""}
      </section>
    </div>
  `;
}

function renderWorldItemsSection(work, items) {
  return `
    <section class="panel world-items-panel">
      <div class="panel-header">
        <div>
          <h2>その他情報</h2>
          <div class="meta">背景・小物・生物など、キャラ以外の設定と参考画像を管理します。</div>
        </div>
        <button class="ghost" data-action="new-world-item" data-work-id="${work.id}">その他追加</button>
      </div>
      <div class="panel-body">
        ${items.length ? `<div class="grid">${items.map(renderWorldItemCard).join("")}</div>` : `<div class="empty compact">その他情報がありません。</div>`}
      </div>
    </section>
  `;
}

function renderWorldItemCard(item) {
  const assetCount = state.db.assets.filter((asset) => asset.worldItemId === item.id).length;
  return `
    <article class="character-card world-item-card">
      ${item.referenceUrl ? `<img class="portrait" src="${escapeHtml(item.referenceUrl)}" alt="">` : `<div class="portrait empty">${escapeHtml(worldItemCategoryLabel(item.category))}</div>`}
      <div class="body">
        <div>
          <div class="char-name">${escapeHtml(item.name)}</div>
          <div class="meta">${escapeHtml(worldItemCategoryLabel(item.category))} / ${assetCount} 画像</div>
        </div>
        <div class="tag-row">
          <span class="tag">${escapeHtml(worldItemCategoryLabel(item.category))}</span>
          ${item.basePrompt ? `<span class="tag">prompt</span>` : ""}
          ${item.autoCreated ? `<span class="tag">auto</span>` : ""}
        </div>
        <div class="card-actions">
          <button class="ghost" data-action="show-world-item-images" data-id="${item.id}">画像一覧</button>
          <button class="ghost" data-action="edit-world-item" data-id="${item.id}">編集</button>
        </div>
      </div>
    </article>
  `;
}

function renderWorldInfo(work) {
  const setting = normalizeWorldSetting(work.worldSetting);
  const sheets = setting.sheets;
  const hasSetting = Boolean(work.worldSetting && (setting.title || setting.reading_log || setting.regeneration_prompt || setting.sourceImageUrl || sheets.length));
  const selectedImages = state.worldSheetFiles || [];
  const selectedText = String(state.worldTextDraft || "").trim();
  const hasImportSource = selectedImages.length || selectedText;
  const needsRestructure = shouldSuggestWorldRestructure(setting);
  return `
    <section class="panel world-panel">
      <div class="panel-header">
        <div>
          <h2>作品情報 / 世界観設定</h2>
          <div class="meta">画像シート、Markdown、テキスト入力をAPIで読解し、履歴として保存できます。</div>
        </div>
        <div class="group">
          <button class="ghost" data-action="edit-world-setting" data-id="${work.id}">${hasSetting ? "作品情報変更" : "手動入力"}</button>
          <button data-action="analyze-world-sheet" data-id="${work.id}" ${hasImportSource ? "" : "disabled"}>${sheets.length ? "追加読解" : "APIで読解"}</button>
        </div>
      </div>
      <div class="panel-body">
        <input id="world-sheet-input" class="is-hidden" type="file" accept="image/*" multiple>
        <input id="world-text-file-input" class="is-hidden" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain">
        <div class="world-summary">
          <div class="world-main">
            <dl class="info-list">
              <div><dt>仮タイトル</dt><dd>${escapeHtml(setting.title || work.name)}</dd></div>
              <div><dt>シート種類</dt><dd>${escapeHtml(setting.sheet_type || "未設定")}</dd></div>
              <div><dt>雰囲気</dt><dd>${escapeHtml(setting.overall_mood || "未設定")}</dd></div>
              <div><dt>世界観の核</dt><dd>${escapeHtml(setting.world_core || "未設定")}</dd></div>
              <div><dt>主色</dt><dd>${renderInlineList(setting.visual_rules.color_rules.main_colors)}</dd></div>
              <div><dt>主要素材</dt><dd>${renderInlineList(setting.visual_rules.material_rules.main_materials)}</dd></div>
            </dl>
            ${renderTagList(setting.must_keep.elements)}
            ${setting.regeneration_prompt ? `<label class="world-readonly">再生成用要約プロンプト<textarea readonly>${escapeHtml(setting.regeneration_prompt)}</textarea></label>` : ""}
          </div>
          <div class="world-side">
            ${renderWorldSourcePreview(setting, selectedImages)}
            <div class="meta">${escapeHtml(worldImportSummary(setting, selectedImages, selectedText))}</div>
            <div class="meta">登録シート: ${sheets.length} 枚</div>
            <div class="meta">${setting.updatedAt ? `最終更新: ${new Date(setting.updatedAt).toLocaleString("ja-JP")}` : ""}</div>
          </div>
        </div>
        ${needsRestructure ? `<div class="empty compact">構造化がされていません。再構造化ボタンを押下しお試しください。</div>` : ""}
        <div class="world-inputs">
          <div class="world-input-toolbar">
            <button class="ghost" data-action="choose-world-sheet">画像シート選択</button>
            <button class="ghost" data-action="choose-world-text">Markdown/Text選択</button>
            ${hasImportSource ? `<button class="ghost" data-action="clear-world-sources">選択クリア</button>` : ""}
            <div class="meta">画像は一度に${maxWorldSheetImages}枚まで、テキストは1件として同じAPIに送ります。</div>
          </div>
          <label class="world-text-entry">Markdown / テキスト入力
            <textarea id="world-text-draft" placeholder="作品設定、世界観メモ、キャラクター資料などを貼り付けてください。">${escapeHtml(state.worldTextDraft || "")}</textarea>
          </label>
        </div>
        ${sheets.length ? `
          <div class="world-sheet-list">
            <div class="meta">保存済み設定シート</div>
            ${sheets.map((sheet) => renderWorldSheetRow(sheet, setting.activeSheetId)).join("")}
          </div>
        ` : ""}
        ${hasSetting ? `
          <details class="world-log">
            <summary>読解ログを開く</summary>
            <pre>${escapeHtml(setting.reading_log || "読解ログはまだありません。")}</pre>
          </details>
        ` : `<div class="empty compact">まだ世界観設定がありません。画像、Markdown/Text、または直接入力を用意して「APIで読解」を押すか、手動入力してください。</div>`}
      </div>
    </section>
  `;
}

function shouldSuggestWorldRestructure(setting) {
  const data = normalizeWorldSetting(setting);
  const notices = [
    data.sheet_type,
    ...data.uncertain_points.needs_confirmation
  ].join("\n");
  return /構造化できなかった|JSONとして読み取れませんでした|構造化JSON整形リトライも失敗|JSON整形リトライも失敗/i.test(notices);
}

function renderWorldSourcePreview(setting, selectedImages) {
  if (selectedImages.length) {
    return `
      <div class="world-source-grid">
        ${selectedImages.map((file) => `<img class="world-source" src="${escapeHtml(file.preview)}" alt="">`).join("")}
      </div>
    `;
  }
  if (setting.sourceImageUrl) {
    return `<img class="world-source" src="${escapeHtml(setting.sourceImageUrl)}" alt="">`;
  }
  return `<div class="empty compact">設定資料未登録</div>`;
}

function worldImportSummary(setting, selectedImages = state.worldSheetFiles || [], selectedText = String(state.worldTextDraft || "").trim()) {
  const parts = [];
  if (selectedImages.length) {
    parts.push(`選択中画像: ${selectedImages.length}枚`);
  }
  if (selectedText) {
    parts.push(`選択中テキスト: ${state.worldTextSourceName || "直接入力"} (${selectedText.length.toLocaleString("ja-JP")}文字)`);
  }
  if (parts.length) return parts.join(" / ");
  if (setting.sourceImageName) return `表示中: ${setting.sourceImageName}`;
  return "画像、Markdown/Text、直接入力をAPI読解できます。";
}

function renderWorldSheetRow(sheet, activeSheetId) {
  const active = sheet.id === activeSheetId;
  return `
    <div class="world-sheet-row ${active ? "active" : ""}">
      <div>
        <div class="work-title">${escapeHtml(sheet.title || sheet.sourceImageName || "設定シート")}</div>
        <div class="meta">${escapeHtml(sheet.sheet_type || "種類未設定")} / ${sheet.updatedAt ? escapeHtml(new Date(sheet.updatedAt).toLocaleString("ja-JP")) : "更新日未設定"}${active ? " / 表示中" : ""}</div>
      </div>
      <div class="group">
        <button class="ghost" data-action="use-world-sheet" data-sheet-id="${sheet.id}" ${active ? "disabled" : ""}>表示</button>
        <button class="ghost" data-action="edit-world-sheet" data-sheet-id="${sheet.id}">編集</button>
        <button class="ghost" data-action="restructure-world-sheet" data-sheet-id="${sheet.id}">再構造化</button>
        <button class="ghost danger-outline" data-action="delete-world-sheet" data-sheet-id="${sheet.id}">削除</button>
      </div>
    </div>
  `;
}

function renderWorkRow(work) {
  const index = state.db.works.findIndex((item) => item.id === work.id);
  const isFirst = index <= 0;
  const isLast = index === state.db.works.length - 1;
  const count = charactersForWork(work.id).length;
  return `
    <div class="work-row ${state.selectedWorkId === work.id ? "active" : ""}" data-action="select-work" data-id="${work.id}">
      <span class="swatch" style="background:${escapeHtml(work.color)}"></span>
      <div>
        <div class="work-title">${escapeHtml(work.name)}</div>
        <div class="meta">${count} キャラ / ${assetsForWork(work.id).length} 画像</div>
      </div>
      <div class="work-row-actions">
        <button class="ghost icon-button" data-action="move-work" data-id="${work.id}" data-direction="-1" aria-label="${escapeHtml(work.name)}を上へ移動" title="上へ" ${isFirst ? "disabled" : ""}>↑</button>
        <button class="ghost icon-button" data-action="move-work" data-id="${work.id}" data-direction="1" aria-label="${escapeHtml(work.name)}を下へ移動" title="下へ" ${isLast ? "disabled" : ""}>↓</button>
        <button class="ghost" data-action="edit-work" data-id="${work.id}">編集</button>
      </div>
    </div>
  `;
}

function moveWorkInList(workId, direction) {
  const index = state.db.works.findIndex((item) => item.id === workId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= state.db.works.length) return false;
  const [work] = state.db.works.splice(index, 1);
  state.db.works.splice(nextIndex, 0, work);
  state.selectedWorkId = work.id;
  return true;
}

function renderCharacterCard(char) {
  const work = byId(state.db.works, char.workId);
  const assetCount = state.db.assets.filter((asset) => asset.characterId === char.id).length;
  const charAudios = audioItemsForCharacter(char.id);
  const latestAudio = charAudios[0];
  return `
    <article class="character-card">
      ${char.portraitUrl ? `<img class="portrait" src="${escapeHtml(char.portraitUrl)}" alt="">` : `<div class="portrait empty">立ち絵なし</div>`}
      <div class="body">
        <div>
          <div class="char-name">${escapeHtml(char.name)}</div>
          <div class="meta">${escapeHtml(work?.name || "未所属")} / ${assetCount} 画像 / ${charAudios.length} 音声</div>
        </div>
        <div class="tag-row">
          <span class="tag">${promptFormatLabel(promptFormatOf(char))}</span>
          ${char.basePrompt ? `<span class="tag">base prompt</span>` : ""}
          ${char.negativePrompt ? `<span class="tag">negative</span>` : ""}
          ${charAudios.length ? `<span class="tag">voice ${charAudios.length}</span>` : ""}
        </div>
        ${latestAudio ? `
          <div class="voice-mini">
            <div class="meta">${escapeHtml(latestAudio.title)} / ${escapeHtml(latestAudio.voice)}</div>
            <audio controls preload="none" src="${escapeHtml(latestAudio.url)}"></audio>
          </div>
        ` : ""}
        <div class="card-actions">
          <button class="ghost" data-action="show-character-images" data-id="${char.id}">画像一覧</button>
          ${charAudios.length ? `<button class="ghost" data-action="show-character-audios" data-id="${char.id}">音声一覧</button>` : ""}
          <button class="ghost" data-action="edit-character" data-id="${char.id}">編集</button>
        </div>
      </div>
    </article>
  `;
}

function renderImport() {
  const importWorkId = state.selectedWorkId || "";
  const importCharacters = charactersForWork(importWorkId);
  const importWorldItems = worldItemsForWork(importWorkId);
  const selectedImportCharacter = byId(state.db.characters, state.importCharacterId);
  const selectedImportWorldItem = workWorldItemById(state.importWorldItemId);
  const trashSources = state.db.settings.moveImportedSourcesToTrash === true;
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>取り込み条件</h2></div>
        <div class="panel-body form-grid">
          <label class="full">作品フォルダ
            <select id="import-work">
              <option value="">指定なし（全キャラから判別）</option>
              ${state.db.works.map((work) => `<option value="${work.id}" ${importWorkId === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">取り込み先キャラ
            <select id="import-character">
              <option value="">手動指定なし</option>
              ${importCharacters.map((char) => `<option value="${char.id}" ${state.importCharacterId === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">取り込み先その他情報
            <select id="import-world-item">
              <option value="">手動指定なし</option>
              ${importWorldItems.map((item) => `<option value="${item.id}" ${state.importWorldItemId === item.id ? "selected" : ""}>${escapeHtml(worldItemCategoryLabel(item.category))}: ${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">AI判別
            <select id="auto-classify">
              <option value="on" ${state.importAutoClassify ? "selected" : ""}>取り込み後に自動判別</option>
              <option value="off" ${!state.importAutoClassify ? "selected" : ""}>取り込みだけ行う</option>
            </select>
          </label>
          <label class="full">未割当時の分析形式
            <select id="import-prompt-format">
              <option value="natural" ${state.importPromptFormat === "natural" ? "selected" : ""}>自然言語</option>
              <option value="tags" ${state.importPromptFormat === "tags" ? "selected" : ""}>タグ</option>
            </select>
          </label>
          <label class="full">取り込み元ファイル
            <select id="move-imported-sources">
              <option value="off" ${trashSources ? "" : "selected"}>元ファイルを残す</option>
              <option value="on" ${trashSources ? "selected" : ""}>取り込み後にゴミ箱へ移動</option>
            </select>
          </label>
          <label class="full">取り込み元フォルダ
            <input id="import-source-root" value="${escapeHtml(state.db.settings.importSourceRoot || "")}" placeholder="/Users/guarhiro/Downloads">
          </label>
          <div class="full meta">ゴミ箱移動ON時は、元パスが取得できる環境ではそのファイルを、通常ブラウザでは取り込み元フォルダ内の同名・同サイズ・同内容のファイルだけ移動します。</div>
          <div class="full meta">${
            selectedImportCharacter
              ? `手動指定中: ${escapeHtml(selectedImportCharacter.name)} に直接保存します。`
              : selectedImportWorldItem
                ? `手動指定中: ${escapeHtml(worldItemCategoryLabel(selectedImportWorldItem.category))}: ${escapeHtml(selectedImportWorldItem.name)} に直接保存します。`
                : "作品を指定した場合、その作品に登録されたキャラだけを候補にします。その他情報を指定するとAI判別は行わず直接保存します。"
          }</div>
        </div>
      </section>
      <section>
        <div class="drop-zone" id="drop-zone">
          <div>
            <h2 class="section-title">画像をまとめて追加</h2>
            <p class="meta">PNG / JPEG / WebP / GIF を選択またはドラッグしてください。</p>
            <input id="file-input" type="file" accept="image/*" multiple hidden>
            <button data-action="choose-files">画像を選択</button>
          </div>
        </div>
        ${state.importFiles.length ? `<div class="preview-strip">${state.importFiles.map((file) => `
          <div class="preview-item">
            <img src="${escapeHtml(file.preview)}" alt="${escapeHtml(file.name)}">
            <div class="meta">${escapeHtml(file.imageInfo.aspectRatioText || "")} ${file.imageInfo.width ? `/${file.imageInfo.width}x${file.imageInfo.height}` : ""}</div>
          </div>
        `).join("")}</div>` : ""}
        <div class="toolbar" style="margin-top:18px;">
          <div class="meta">${state.importFiles.length} 件選択中</div>
          <button class="accent" data-action="run-import" ${state.importFiles.length && !state.importIsRunning ? "" : "disabled"}>${state.importIsRunning ? "取り込み中..." : "取り込む"}</button>
        </div>
      </section>
    </div>
  `;
}

function renderLibrary() {
  const allAssets = getVisibleLibraryAssets();
  const { assets, pageInfo } = getPagedLibraryAssets(allAssets);
  return `
    <div class="toolbar">
      <div class="group">
        <select id="library-work">
          <option value="">全作品</option>
          ${state.db.works.map((work) => `<option value="${work.id}" ${state.selectedWorkId === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
        </select>
        <select id="library-status">
          <option value="all" ${state.libraryStatus === "all" ? "selected" : ""}>全状態</option>
          <option value="matched" ${state.libraryStatus === "matched" ? "selected" : ""}>判別済み</option>
          <option value="classifying" ${state.libraryStatus === "classifying" ? "selected" : ""}>AI判別中</option>
          <option value="unassigned" ${state.libraryStatus === "unassigned" ? "selected" : ""}>未設定</option>
          <option value="failed" ${state.libraryStatus === "failed" ? "selected" : ""}>判別失敗</option>
        </select>
        <select id="library-character">
          ${renderSubjectOptions(state.selectedWorkId, state.libraryCharacterId)}
        </select>
        <select id="library-sort">
          <option value="newest" ${state.librarySort === "newest" ? "selected" : ""}>新しい順</option>
          <option value="character" ${state.librarySort === "character" ? "selected" : ""}>割当先順</option>
        </select>
      </div>
      <div class="group">
        <button data-action="classify-visible" ${assets.length ? "" : "disabled"}>このページをAI判別</button>
        <button class="ghost danger-outline" data-action="delete-visible-history" ${assets.length ? "" : "disabled"}>このページの履歴削除</button>
      </div>
    </div>
    ${renderImageClassificationSummary(allAssets)}
    <div class="library-resultbar">
      <div class="meta">${allAssets.length ? `${pageInfo.start + 1}-${pageInfo.end} / ${allAssets.length} 件を表示中` : "0 件"}</div>
      ${renderLibraryPager(pageInfo, allAssets.length)}
    </div>
    ${assets.length ? `<div class="grid">${assets.map(renderAssetCard).join("")}</div>` : `<div class="empty">条件に合う画像がありません。</div>`}
  `;
}

function renderImageClassificationSummary(assets) {
  const active = assets.filter(isAssetClassifying);
  if (!active.length) return "";
  const waiting = active.filter((asset) => asset.classifyStage === "waiting").length;
  const saving = active.filter((asset) => asset.classifyStage === "saving").length;
  const preparing = active.length - waiting - saving;
  const parts = [
    waiting ? `API返答待ち ${waiting} 件` : "",
    saving ? `保存中 ${saving} 件` : "",
    preparing ? `送信準備中 ${preparing} 件` : ""
  ].filter(Boolean).join(" / ");
  const started = active.map((asset) => asset.classifyStartedAt).filter(Boolean).sort()[0];
  const elapsed = elapsedTextSince(started);
  return `
    <div class="image-progress-summary">
      <div>
        <strong>AI判別中 ${active.length} 件</strong>
        <div class="meta">${escapeHtml(parts || "API送信の準備中です。")}${elapsed ? ` / 経過 ${escapeHtml(elapsed)}` : ""}</div>
      </div>
      <div class="progress-track indeterminate"><span></span></div>
    </div>
  `;
}

function renderImageClassificationStatus(asset) {
  const statusClass = asset?.status || "unassigned";
  const progress = isAssetClassifying(asset)
    ? `
      <div class="image-progress">
        <div class="meta">${escapeHtml(asset.classifyMessage || "API返答待ちです。")}${asset.classifyStartedAt ? ` / 経過 ${escapeHtml(elapsedTextSince(asset.classifyStartedAt))}` : ""}</div>
        <div class="progress-track indeterminate"><span></span></div>
      </div>
    `
    : "";
  return `
    <div class="tag-row"><span class="tag status-${escapeHtml(statusClass)}">${escapeHtml(imageAssetStatusLabel(asset))}</span></div>
    ${progress}
  `;
}

function getVisibleLibraryAssets() {
  return state.db.assets
    .filter((asset) => !state.selectedWorkId || asset.workId === state.selectedWorkId)
    .filter((asset) => state.libraryStatus === "all" || asset.status === state.libraryStatus)
    .filter((asset) => state.libraryCharacterId === "all" || (state.libraryCharacterId === "unassigned" ? !asset.characterId && !asset.worldItemId : assetSubjectKey(asset) === state.libraryCharacterId || asset.characterId === state.libraryCharacterId))
    .sort(sortLibraryAssets);
}

function sortLibraryAssets(a, b) {
  if (state.librarySort === "character") {
    const subjectA = subjectLabelForAsset(a);
    const subjectB = subjectLabelForAsset(b);
    return subjectA.localeCompare(subjectB, "ja") || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  }
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

function resetLibraryPage() {
  state.libraryPage = 1;
}

function getLibraryPageInfo(total) {
  const requestedPageSize = Number(state.libraryPageSize);
  const pageSize = libraryPageSizes.includes(requestedPageSize) ? requestedPageSize : libraryPageSizes[0];
  state.libraryPageSize = pageSize;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number(state.libraryPage) || 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  state.libraryPage = page;
  const start = total ? (page - 1) * pageSize : 0;
  const end = Math.min(start + pageSize, total);
  return { page, pageSize, pageCount, start, end };
}

function getPagedLibraryAssets(allAssets = getVisibleLibraryAssets()) {
  const pageInfo = getLibraryPageInfo(allAssets.length);
  return {
    pageInfo,
    assets: allAssets.slice(pageInfo.start, pageInfo.end)
  };
}

function getVisibleLibraryPageAssets() {
  return getPagedLibraryAssets().assets;
}

function renderLibraryPager(pageInfo, total) {
  const disabled = total <= 0;
  return `
    <div class="library-pager">
      <button class="ghost" data-action="library-page-prev" ${pageInfo.page <= 1 || disabled ? "disabled" : ""}>前へ</button>
      <span class="meta">${pageInfo.page} / ${pageInfo.pageCount} ページ</span>
      <button class="ghost" data-action="library-page-next" ${pageInfo.page >= pageInfo.pageCount || disabled ? "disabled" : ""}>次へ</button>
      <select id="library-page-size" aria-label="1ページの表示数">
        ${libraryPageSizes.map((size) => `<option value="${size}" ${pageInfo.pageSize === size ? "selected" : ""}>${size}件ずつ</option>`).join("")}
      </select>
    </div>
  `;
}

function renderAssetCard(asset) {
  const workChars = charactersForWork(asset.workId);
  const workWorldItems = worldItemsForWork(asset.workId);
  const dimensions = assetDimensionLabel(asset);
  const selectedSubject = assetSubjectKey(asset);
  return `
    <article class="asset-card">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="" loading="lazy" decoding="async">
      <div class="body">
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(subjectLabelForAsset(asset))} ${asset.confidence ? `/ confidence ${Math.round(asset.confidence * 100)}%` : ""}</div>
          ${dimensions ? `<div class="meta">${escapeHtml(dimensions)}</div>` : ""}
        </div>
        ${renderImageClassificationStatus(asset)}
        <select data-action="assign-asset" data-id="${asset.id}" ${isAssetClassifying(asset) ? "disabled" : ""}>
          <option value="" ${selectedSubject === "unassigned" ? "selected" : ""}>未割当</option>
          ${workChars.length ? `<optgroup label="キャラ">${workChars.map((candidate) => `<option value="char:${candidate.id}" ${selectedSubject === `char:${candidate.id}` ? "selected" : ""}>${escapeHtml(candidate.name)}</option>`).join("")}</optgroup>` : ""}
          ${workWorldItems.length ? `<optgroup label="その他情報">${workWorldItems.map((item) => `<option value="world:${item.id}" ${selectedSubject === `world:${item.id}` ? "selected" : ""}>${escapeHtml(worldItemCategoryLabel(item.category))}: ${escapeHtml(item.name)}</option>`).join("")}</optgroup>` : ""}
        </select>
        <button class="ghost" data-action="classify-one" data-id="${asset.id}" ${asset.worldItemId || isAssetClassifying(asset) ? "disabled" : ""}>AIキャラ判定</button>
        <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
        <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
        <button class="ghost danger-outline" data-action="delete-asset-history" data-id="${asset.id}">履歴削除</button>
      </div>
    </article>
  `;
}

function renderGallery() {
  const galleryWorkId = currentGalleryWorkId();
  const assets = getVisibleGalleryAssets();
  const selectedAssets = selectedVisibleGalleryAssets(assets);
  const allVisibleSelected = assets.length > 0 && selectedAssets.length === assets.length;
  const grouped = groupAssetsBySubject(assets);
  return `
    <div class="gallery-layout ${state.galleryFiltersCollapsed ? "filters-collapsed" : ""}">
      <section class="panel gallery-filter-panel">
        <div class="panel-header">
          <h2>表示条件</h2>
          <button class="ghost" data-action="toggle-gallery-filters">${state.galleryFiltersCollapsed ? "開く" : "閉じる"}</button>
        </div>
        <div class="panel-body form-grid ${state.galleryFiltersCollapsed ? "is-hidden" : ""}">
          <label class="full">作品
            <select id="gallery-work">
              <option value="">全作品</option>
              ${state.db.works.map((work) => `<option value="${work.id}" ${galleryWorkId === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">割当先
            <select id="gallery-character">
              <option value="" ${!state.galleryCharacterId ? "selected" : ""}>全割当先</option>
              ${renderSubjectOptions(galleryWorkId, state.galleryCharacterId, { includeAll: false })}
            </select>
          </label>
          <div class="full meta">画像は data/uploads の作品名フォルダ内で、キャラ名またはその他情報名のフォルダに保存されます。</div>
        </div>
      </section>
      <section>
        <div class="toolbar">
          <div>
            <h2 class="section-title">${assets.length} 画像</h2>
            <div class="meta">${galleryWorkId ? escapeHtml(byId(state.db.works, galleryWorkId)?.name || "") : "全作品"}</div>
          </div>
          <div class="group gallery-selection-actions">
            <span class="meta">${selectedAssets.length ? `${selectedAssets.length} 件選択中` : "未選択"}</span>
            <button class="ghost" data-action="gallery-select-all" ${assets.length && !allVisibleSelected ? "" : "disabled"}>画面内を全選択</button>
            <button class="ghost" data-action="gallery-clear-selection" ${selectedAssets.length ? "" : "disabled"}>選択解除</button>
            <button class="ghost danger-outline" data-action="delete-selected-gallery-assets" ${selectedAssets.length ? "" : "disabled"}>選択を完全削除</button>
          </div>
          ${state.galleryFiltersCollapsed ? `<button class="ghost" data-action="toggle-gallery-filters">表示条件</button>` : ""}
        </div>
        ${renderImageClassificationSummary(assets)}
        ${assets.length ? grouped.map(renderGalleryGroup).join("") : `<div class="empty">表示できる画像がありません。</div>`}
      </section>
    </div>
  `;
}

function currentGalleryWorkId() {
  return state.galleryWorkId ?? state.selectedWorkId ?? "";
}

function getVisibleGalleryAssets() {
  const galleryWorkId = currentGalleryWorkId();
  return state.db.assets
    .filter((asset) => !galleryWorkId || asset.workId === galleryWorkId)
    .filter((asset) => !state.galleryCharacterId || (state.galleryCharacterId === "unassigned" ? !asset.characterId && !asset.worldItemId : assetSubjectKey(asset) === state.galleryCharacterId || asset.characterId === state.galleryCharacterId));
}

function selectedVisibleGalleryAssets(assets = getVisibleGalleryAssets()) {
  const visibleIds = new Set(assets.map((asset) => asset.id));
  state.gallerySelectedAssetIds = (state.gallerySelectedAssetIds || []).filter((id) => visibleIds.has(id));
  const selectedIds = new Set(state.gallerySelectedAssetIds);
  return assets.filter((asset) => selectedIds.has(asset.id));
}

function groupAssetsBySubject(assets) {
  const groups = new Map();
  for (const asset of assets) {
    const key = assetSubjectKey(asset);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(asset);
  }
  return [...groups.entries()].map(([subjectKey, items]) => ({
    subjectKey,
    title: subjectKey === "unassigned" ? "未割当" : subjectLabelForAsset(items[0]),
    items
  }));
}

function renderGalleryGroup(group) {
  return `
    <div class="gallery-group">
      <div class="gallery-group-title">
        <h3>${escapeHtml(group.title)}</h3>
        <span class="meta">${group.items.length} 画像</span>
      </div>
      <div class="grid">${group.items.map(renderGalleryAsset).join("")}</div>
    </div>
  `;
}

function renderGalleryAsset(asset) {
  const work = workForAsset(asset);
  const dimensions = assetDimensionLabel(asset);
  const selected = (state.gallerySelectedAssetIds || []).includes(asset.id);
  return `
    <article class="asset-card ${selected ? "asset-selected" : ""}">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="" loading="lazy" decoding="async">
      <div class="body">
        <label class="asset-select">
          <input type="checkbox" data-action="select-gallery-asset" data-id="${asset.id}" ${selected ? "checked" : ""}>
          <span>選択</span>
        </label>
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(work?.name || "未分類")} / ${escapeHtml(subjectLabelForAsset(asset))}</div>
          ${dimensions ? `<div class="meta">${escapeHtml(dimensions)}</div>` : ""}
        </div>
        ${renderImageClassificationStatus(asset)}
        <div class="card-actions">
          <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
          <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
          <button class="ghost danger-outline" data-action="delete-asset-completely" data-id="${asset.id}">完全削除</button>
        </div>
      </div>
    </article>
  `;
}

function normalizedImageEditProvider(value) {
  return imageEditProviders.some(([provider]) => provider === value) ? value : "local";
}

function normalizedRembgModel(value) {
  const text = String(value || "").trim();
  return rembgModelOptions.some(([model]) => model === text) ? text : "isnet-general-use";
}

function normalizedBackgroundRemoverModel(value) {
  const text = String(value || "").trim();
  return backgroundRemoverModelOptions.some(([model]) => model === text) ? text : "u2net";
}

function normalizedBackgroundRemoverVideoMode(value) {
  const text = String(value || "").trim();
  return backgroundRemoverVideoModeOptions.some(([mode]) => mode === text) ? text : "transparent-gif";
}

function normalizedImageEditBackgroundMode(value) {
  return imageEditBackgroundModes.some(([mode]) => mode === value) ? value : "auto";
}

function normalizedManualImageEditTool(value) {
  return manualImageEditTools.some(([tool]) => tool === value) ? value : "erase";
}

function imageEditToleranceValue(value) {
  return boundedSettingNumber(value, 42, 0, 160, true);
}

function imageEditFeatherValue(value) {
  return boundedSettingNumber(value, 18, 0, 80, true);
}

function imageEditManualBrushSizeValue(value) {
  return boundedSettingNumber(value, 42, 4, 220, true);
}

function backgroundRemoverErodeSizeValue(value) {
  return boundedSettingNumber(value, 10, 1, 25, true);
}

function backgroundRemoverFrameRateValue(value) {
  return boundedSettingNumber(value, 30, 1, 60, true);
}

function backgroundRemoverFrameLimitValue(value) {
  return boundedSettingNumber(value, -1, -1, 20000, true);
}

function backgroundRemoverGpuBatchSizeValue(value) {
  return boundedSettingNumber(value, 1, 1, 8, true);
}

function backgroundRemoverWorkerCountValue(value) {
  return boundedSettingNumber(value, 1, 1, 4, true);
}

function videoGifFrameRateValue(value) {
  return boundedSettingNumber(value, 12, 1, 30, true);
}

function videoGifWidthValue(value) {
  return boundedSettingNumber(value, 640, 160, 1920, true);
}

function videoGifStartTimeValue(value) {
  return boundedSettingNumber(value, 0, 0, 36000, false);
}

function videoGifDurationValue(value) {
  return boundedSettingNumber(value, 6, 0, 600, false);
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function transparentPngName(name = "image", suffix = "transparent") {
  const parsed = String(name || "image").split(/[\\/]/).pop().replace(/\.[^.]+$/i, "");
  return `${parsed || "image"}-${suffix}.png`;
}

function allImageEditSources() {
  const items = [];
  const seen = new Set();
  const push = (item) => {
    if (!item?.key || !item.url || seen.has(item.key)) return;
    seen.add(item.key);
    items.push(item);
  };
  allVideoReferences()
    .filter((item) => item.kind === "image")
    .forEach((item) => push({
      ...item,
      key: item.key,
      source: item.source || "asset"
    }));
  (state.db.imageJobs || []).forEach((job) => {
    (job.images || []).forEach((image, index) => {
      if (!image.url) return;
      push({
        key: `image-job:${job.id}:${index}`,
        source: "generated-image",
        kind: "image",
        id: job.id,
        workId: job.workId || null,
        characterId: job.characterId || null,
        name: image.filename || job.title || "生成画像",
        url: image.url,
        subject: job.title || "画像生成",
        prompt: job.prompt || "",
        dimensions: job.settings?.width && job.settings?.height ? `${job.settings.width}x${job.settings.height}` : "",
        createdAt: job.createdAt
      });
    });
  });
  return items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function filteredImageEditSources() {
  const selectedKey = state.imageEditSourceKey;
  return allImageEditSources().filter((item) => {
    if (item.key === selectedKey) return true;
    if (state.imageEditWorkId && item.workId && item.workId !== state.imageEditWorkId) return false;
    if (state.imageEditCharacterId && item.characterId && item.characterId !== state.imageEditCharacterId) return false;
    if (state.imageEditCharacterId && !item.characterId) return false;
    return true;
  });
}

function selectedImageEditSource() {
  if (state.imageEditSourceKey === "upload" && state.imageEditInputFile) {
    return {
      key: "upload",
      source: "upload",
      kind: "image",
      workId: state.imageEditWorkId || null,
      characterId: state.imageEditCharacterId || null,
      name: state.imageEditInputFile.name || "upload.png",
      url: state.imageEditInputFile.preview,
      dataUrl: state.imageEditInputFile.preview,
      dimensions: state.imageEditInputFile.imageInfo?.width ? `${state.imageEditInputFile.imageInfo.width}x${state.imageEditInputFile.imageInfo.height}` : "",
      createdAt: state.imageEditInputFile.createdAt
    };
  }
  return allImageEditSources().find((item) => item.key === state.imageEditSourceKey) || null;
}

function imageEditCharacterOptions(workId, selectedValue) {
  const selected = selectedValue || "";
  const chars = charactersForWork(workId);
  return [
    `<option value="">紐づけなし</option>`,
    ...chars.map((char) => `<option value="${escapeHtml(char.id)}" ${selected === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`)
  ].join("");
}

function renderImageEditSourceOptions(sources, selectedKey) {
  const options = [];
  if (state.imageEditInputFile) {
    options.push(`<option value="upload" ${selectedKey === "upload" ? "selected" : ""}>アップロード: ${escapeHtml(state.imageEditInputFile.name)}</option>`);
  }
  sources.forEach((item) => {
    const subject = item.subject ? ` / ${item.subject}` : "";
    options.push(`<option value="${escapeHtml(item.key)}" ${selectedKey === item.key ? "selected" : ""}>${escapeHtml(item.name || "画像")}${escapeHtml(subject)}</option>`);
  });
  return options.length ? options.join("") : `<option value="">画像がありません</option>`;
}

function rembgStatusText() {
  if (state.rembgStatus === "loading") return "rembgの状態を確認中です。";
  if (state.rembgStatus === "installing") return "rembgをセットアップ中です。初回は数分かかることがあります。";
  if (state.rembgInfo?.found) {
    return `rembg使用可能: Python ${state.rembgInfo.pythonVersion || ""} / ${state.rembgInfo.pythonPath || ""}`;
  }
  return state.rembgError || "rembgは未確認です。初回は状態確認またはセットアップを実行してください。モデルは初回処理時にダウンロードされます。";
}

function renderRembgModelOptions(selectedValue) {
  const selected = normalizedRembgModel(selectedValue);
  return rembgModelOptions
    .map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function backgroundRemoverStatusText() {
  if (state.backgroundRemoverStatus === "loading") return "backgroundremoverの状態を確認中です。";
  if (state.backgroundRemoverStatus === "installing") return "backgroundremoverをセットアップ中です。PyTorchを含むため初回は時間がかかります。";
  if (state.backgroundRemoverInfo?.found) {
    const ffmpegText = state.backgroundRemoverInfo.ffmpegFound ? "ffmpegあり" : "ffmpeg未検出";
    return `backgroundremover使用可能: Python ${state.backgroundRemoverInfo.pythonVersion || ""} / ${ffmpegText}`;
  }
  return state.backgroundRemoverError || "backgroundremoverは未確認です。初回は状態確認またはセットアップを実行してください。動画処理にはffmpegが必要です。";
}

function renderBackgroundRemoverModelOptions(selectedValue) {
  const selected = normalizedBackgroundRemoverModel(selectedValue);
  return backgroundRemoverModelOptions
    .map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function renderBackgroundRemoverVideoModeOptions(selectedValue) {
  const selected = normalizedBackgroundRemoverVideoMode(selectedValue);
  return backgroundRemoverVideoModeOptions
    .map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function backgroundRemoverVideoModeLabel(value) {
  const mode = normalizedBackgroundRemoverVideoMode(value);
  return backgroundRemoverVideoModeOptions.find(([option]) => option === mode)?.[1] || "透過GIF";
}

function renderImageEditor() {
  const work = byId(state.db.works, state.imageEditWorkId) || byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.imageEditWorkId && work) state.imageEditWorkId = work.id;
  if (state.imageEditCharacterId && !charactersForWork(state.imageEditWorkId).some((char) => char.id === state.imageEditCharacterId)) {
    state.imageEditCharacterId = "";
  }
  const sources = filteredImageEditSources();
  if (!state.imageEditSourceKey && (state.imageEditInputFile || sources[0])) {
    state.imageEditSourceKey = state.imageEditInputFile ? "upload" : sources[0].key;
  }
  const selectedSource = selectedImageEditSource();
  const provider = normalizedImageEditProvider(state.imageEditProvider);
  const mode = normalizedImageEditBackgroundMode(state.imageEditBackgroundMode);
  const result = state.imageEditResult;
  const isRembgBusy = state.rembgStatus === "loading" || state.rembgStatus === "installing";
  const isBackgroundRemoverBusy = state.backgroundRemoverStatus === "loading" || state.backgroundRemoverStatus === "installing";
  const runButtonLabel = provider === "manual" ? "手動編集を結果に反映" : "透過PNGを作成";
  return `
    <div class="image-edit-stack">
    <div class="video-layout image-edit-layout">
      <section class="panel">
        <div class="panel-header"><h2>編集元</h2></div>
        <div class="panel-body form-grid">
          <label>作品
            <select id="image-edit-work">
              ${state.db.works.map((item) => `<option value="${escapeHtml(item.id)}" ${state.imageEditWorkId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label>保存時のキャラ
            <select id="image-edit-character">${imageEditCharacterOptions(state.imageEditWorkId, state.imageEditCharacterId)}</select>
          </label>
          <label class="full">対象画像
            <select id="image-edit-source">${renderImageEditSourceOptions(sources, state.imageEditSourceKey)}</select>
          </label>
          <input id="image-edit-file-input" type="file" accept="image/*" hidden>
          <div class="full toolbar">
            <button class="ghost" data-action="choose-image-edit-file">画像を追加</button>
            <button class="ghost" data-action="clear-image-edit-file" ${state.imageEditInputFile ? "" : "disabled"}>追加画像を解除</button>
          </div>
          <label>処理
            <select id="image-edit-provider">
              ${imageEditProviders.map(([value, label]) => `<option value="${value}" ${provider === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
            </select>
          </label>
          ${provider === "manual" ? `
            <label>手動ツール
              <select id="image-edit-manual-tool">
                ${manualImageEditTools.map(([value, label]) => `<option value="${value}" ${state.imageEditManualTool === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
              </select>
            </label>
            <label>ペンサイズ
              <input id="image-edit-manual-brush-size" type="range" min="4" max="220" value="${escapeHtml(state.imageEditManualBrushSize)}">
            </label>
            <div class="full toolbar">
              <button class="ghost" data-action="manual-image-edit-undo" ${selectedSource ? "" : "disabled"}>戻す</button>
              <button class="ghost" data-action="manual-image-edit-reset" ${selectedSource ? "" : "disabled"}>リセット</button>
              <button class="ghost" data-action="manual-image-edit-clear-boundary" ${selectedSource ? "" : "disabled"}>境界を消去</button>
            </div>
            <div class="full toolbar">
              <button class="ghost" data-action="manual-image-edit-keep-inside" ${selectedSource ? "" : "disabled"}>境界の外側を除去</button>
              <button class="ghost" data-action="manual-image-edit-remove-inside" ${selectedSource ? "" : "disabled"}>境界の内側を除去</button>
            </div>
          ` : provider === "removebg" ? `
            <label>remove.bg APIキー
              <input id="image-edit-removebg-key" type="password" value="${escapeHtml(removeBgApiKey())}" placeholder="remove.bg API key">
            </label>
          ` : provider === "rembg" ? `
            <label class="full">rembgモデル
              <select id="image-edit-rembg-model">${renderRembgModelOptions(state.imageEditRembgModel)}</select>
            </label>
            <label class="check-row">
              <input id="image-edit-rembg-post-process" type="checkbox" ${state.imageEditRembgPostProcess ? "checked" : ""}>
              <span>マスク後処理</span>
            </label>
            <label class="check-row">
              <input id="image-edit-rembg-alpha-matting" type="checkbox" ${state.imageEditRembgAlphaMatting ? "checked" : ""}>
              <span>Alpha matting</span>
            </label>
            <div class="full toolbar">
              <button class="ghost" data-action="check-rembg" ${isRembgBusy ? "disabled" : ""}>rembg確認</button>
              <button class="ghost" data-action="setup-rembg" ${isRembgBusy ? "disabled" : ""}>rembgをセットアップ</button>
            </div>
            <div class="full meta">${escapeHtml(rembgStatusText())}</div>
          ` : provider === "backgroundremover" ? `
            <label class="full">backgroundremoverモデル
              <select id="image-edit-backgroundremover-model">${renderBackgroundRemoverModelOptions(state.imageEditBackgroundRemoverModel)}</select>
            </label>
            <label class="check-row">
              <input id="image-edit-backgroundremover-alpha-matting" type="checkbox" ${state.imageEditBackgroundRemoverAlphaMatting ? "checked" : ""}>
              <span>Alpha matting</span>
            </label>
            <label>エッジ調整
              <input id="image-edit-backgroundremover-erode-size" type="number" min="1" max="25" value="${escapeHtml(state.imageEditBackgroundRemoverErodeSize)}" ${state.imageEditBackgroundRemoverAlphaMatting ? "" : "disabled"}>
            </label>
            <div class="full toolbar">
              <button class="ghost" data-action="check-backgroundremover" ${isBackgroundRemoverBusy ? "disabled" : ""}>backgroundremover確認</button>
              <button class="ghost" data-action="setup-backgroundremover" ${isBackgroundRemoverBusy ? "disabled" : ""}>backgroundremoverをセットアップ</button>
            </div>
            <div class="full meta">${escapeHtml(backgroundRemoverStatusText())}</div>
          ` : `
            <label>背景
              <select id="image-edit-background-mode">
                ${imageEditBackgroundModes.map(([value, label]) => `<option value="${value}" ${mode === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
              </select>
            </label>
            <label>指定色
              <input id="image-edit-chroma-color" type="color" value="${escapeHtml(state.imageEditChromaColor || "#ffffff")}" ${mode === "chroma" ? "" : "disabled"}>
            </label>
            <label>許容値
              <input id="image-edit-tolerance" type="range" min="0" max="160" value="${escapeHtml(state.imageEditTolerance)}">
            </label>
            <label>境界ぼかし
              <input id="image-edit-feather" type="range" min="0" max="80" value="${escapeHtml(state.imageEditFeather)}">
            </label>
          `}
          <div class="full toolbar">
            <button class="accent" data-action="run-image-edit" ${state.imageEditIsRunning || !selectedSource ? "disabled" : ""}>${runButtonLabel}</button>
            <button class="ghost" data-action="save-image-edit-result" ${result ? "" : "disabled"}>画像一覧へ保存</button>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>プレビュー</h2></div>
        <div class="panel-body">
          <div class="image-edit-preview-grid">
            <article class="image-edit-preview-card">
              <div class="meta">元画像</div>
              ${selectedSource ? `<img class="transparent-preview" src="${escapeHtml(selectedSource.url)}" alt="">` : `<div class="empty compact">画像を選択してください。</div>`}
              ${selectedSource ? `<div class="meta">${escapeHtml(selectedSource.name || "")}${selectedSource.dimensions ? ` / ${escapeHtml(selectedSource.dimensions)}` : ""}</div>` : ""}
            </article>
            <article class="image-edit-preview-card">
              <div class="meta">処理後</div>
              ${provider === "manual" && selectedSource ? `
                <div class="manual-editor-stage">
                  <canvas id="image-edit-manual-canvas" class="manual-editor-canvas"></canvas>
                  <canvas id="image-edit-manual-overlay" class="manual-editor-overlay"></canvas>
                </div>
                <div class="meta">${escapeHtml(result?.provider === "manual" ? `${result.name || ""}${result.width ? ` / ${result.width}x${result.height}` : ""} / ${result.providerLabel || ""}` : "手動編集中")}</div>
              ` : state.imageEditIsRunning ? `<div class="empty compact">処理中です。</div>` : result ? `<img class="transparent-preview" src="${escapeHtml(result.dataUrl)}" alt="">` : `<div class="empty compact">まだ結果がありません。</div>`}
              ${provider !== "manual" && result ? `<div class="meta">${escapeHtml(result.name || "")}${result.width ? ` / ${escapeHtml(`${result.width}x${result.height}`)}` : ""} / ${escapeHtml(result.providerLabel || "")}</div>` : ""}
            </article>
          </div>
        </div>
      </section>
    </div>
    ${renderBackgroundRemoverVideoPanel(work)}
    </div>
  `;
}

function renderBackgroundRemoverVideoPanel(work) {
  const busy = state.backgroundRemoverVideoIsRunning;
  const statusBusy = state.backgroundRemoverStatus === "loading" || state.backgroundRemoverStatus === "installing";
  const file = state.backgroundRemoverVideoFile;
  const result = state.backgroundRemoverVideoResult;
  const isGifResult = result?.mimeType === "image/gif";
  return `
    <section class="panel backgroundremover-video-panel">
      <div class="panel-header">
        <div>
          <h2>動画背景除去</h2>
          <p>backgroundremoverで透過GIF、透過MOV、マット動画を作成します。</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="backgroundremover-video-grid">
          <div class="form-grid">
            <input id="backgroundremover-video-input" type="file" accept="video/*,.gif" hidden>
            <div class="full toolbar">
              <button class="ghost" data-action="choose-backgroundremover-video">動画/GIFを選択</button>
              <button class="ghost" data-action="clear-backgroundremover-video" ${file ? "" : "disabled"}>選択を解除</button>
            </div>
            <div class="full meta">${file ? `${escapeHtml(file.name)} / ${escapeHtml(formatBytes(file.size || 0))}` : "動画またはGIFを選択してください。"}</div>
            <label>モデル
              <select id="backgroundremover-video-model">${renderBackgroundRemoverModelOptions(state.backgroundRemoverVideoModel)}</select>
            </label>
            <label>出力
              <select id="backgroundremover-video-mode">${renderBackgroundRemoverVideoModeOptions(state.backgroundRemoverVideoMode)}</select>
            </label>
            <label>FPS
              <input id="backgroundremover-video-frame-rate" type="number" min="1" max="60" value="${escapeHtml(state.backgroundRemoverVideoFrameRate)}">
            </label>
            <label>フレーム上限
              <input id="backgroundremover-video-frame-limit" type="number" min="-1" max="20000" value="${escapeHtml(state.backgroundRemoverVideoFrameLimit)}">
            </label>
            <label>GPU batch
              <input id="backgroundremover-video-gpu-batch-size" type="number" min="1" max="8" value="${escapeHtml(state.backgroundRemoverVideoGpuBatchSize)}">
            </label>
            <label>Workers
              <input id="backgroundremover-video-worker-count" type="number" min="1" max="4" value="${escapeHtml(state.backgroundRemoverVideoWorkerCount)}">
            </label>
            <div class="full meta">フレーム上限は -1 で全体処理。まず短い動画や少ないフレームで試すと安全です。</div>
            <div class="full toolbar">
              <button class="ghost" data-action="check-backgroundremover" ${statusBusy ? "disabled" : ""}>backgroundremover確認</button>
              <button class="ghost" data-action="setup-backgroundremover" ${statusBusy ? "disabled" : ""}>backgroundremoverをセットアップ</button>
              <button class="accent" data-action="run-backgroundremover-video" ${busy || !file ? "disabled" : ""}>動画背景除去を開始</button>
            </div>
            <div class="full meta">${escapeHtml(backgroundRemoverStatusText())}</div>
          </div>
          <div class="backgroundremover-video-preview">
            ${busy ? `<div class="empty compact">動画を処理中です。長い動画はかなり時間がかかります。</div>` : result ? `
              <div class="meta">${escapeHtml(result.name || "")} / ${escapeHtml(backgroundRemoverVideoModeLabel(result.mode))} / ${escapeHtml(formatBytes(result.size || 0))}</div>
              ${isGifResult
                ? `<img class="transparent-preview" src="${escapeHtml(result.url)}" alt="">`
                : `<video class="generated-video" controls src="${escapeHtml(result.url)}"></video>`}
              <div class="meta">動画生成の参照素材にも登録済みです。</div>
            ` : `<div class="empty compact">まだ動画処理結果がありません。</div>`}
          </div>
        </div>
      </div>
    </section>
  `;
}

function videoGifStatusText() {
  if (state.videoGifStatus === "loading") return "ffmpegの状態を確認中です。";
  if (state.videoGifInfo?.found) return `ffmpeg使用可能: ${state.videoGifInfo.version || ""}`;
  return state.videoGifError || "ffmpegは未確認です。動画GIF化にはffmpegが必要です。";
}

function renderVideoGifInputPreview(file) {
  if (!file?.dataUrl) return `<div class="empty compact">動画を選択してください。</div>`;
  const isGif = file.type === "image/gif" || /\.gif$/i.test(file.name || "");
  return isGif
    ? `<img class="transparent-preview" src="${escapeHtml(file.dataUrl)}" alt="">`
    : `<video class="generated-video" controls src="${escapeHtml(file.dataUrl)}"></video>`;
}

function renderVideoGifConverter() {
  const work = byId(state.db.works, state.imageEditWorkId) || byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.imageEditWorkId && work) state.imageEditWorkId = work.id;
  if (state.imageEditCharacterId && !charactersForWork(state.imageEditWorkId).some((char) => char.id === state.imageEditCharacterId)) {
    state.imageEditCharacterId = "";
  }
  const file = state.videoGifFile;
  const result = state.videoGifResult;
  const busy = state.videoGifIsRunning;
  const selectedChar = byId(state.db.characters, state.imageEditCharacterId);
  const saveTargetText = selectedChar ? `保存先: ${selectedChar.name} の画像フォルダ` : "保存先: 作品の _画像編集";
  return `
    <div class="video-layout image-edit-layout">
      <section class="panel">
        <div class="panel-header"><h2>GIF化設定</h2></div>
        <div class="panel-body form-grid">
          <label>作品
            <select id="video-gif-work">
              ${state.db.works.map((item) => `<option value="${escapeHtml(item.id)}" ${state.imageEditWorkId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label>保存時のキャラ
            <select id="video-gif-character">${imageEditCharacterOptions(state.imageEditWorkId, state.imageEditCharacterId)}</select>
          </label>
          <input id="video-gif-input" type="file" accept="video/*,.gif" hidden>
          <div class="full toolbar">
            <button class="ghost" data-action="choose-video-gif-file">動画を選択</button>
            <button class="ghost" data-action="clear-video-gif-file" ${file ? "" : "disabled"}>選択を解除</button>
          </div>
          <div class="full meta">${file ? `${escapeHtml(file.name)} / ${escapeHtml(formatBytes(file.size || 0))}` : "MP4、MOV、WebMなどの動画を選択してください。"}</div>
          <div class="full meta">${escapeHtml(saveTargetText)}。元動画は保存せず、作成したGIFだけを保存します。</div>
          <label>FPS
            <input id="video-gif-frame-rate" type="number" min="1" max="30" value="${escapeHtml(state.videoGifFrameRate)}">
          </label>
          <label>最大幅
            <input id="video-gif-width" type="number" min="160" max="1920" step="10" value="${escapeHtml(state.videoGifWidth)}">
          </label>
          <label>開始秒
            <input id="video-gif-start-time" type="number" min="0" max="36000" step="0.1" value="${escapeHtml(state.videoGifStartTime)}">
          </label>
          <label>長さ（秒）
            <input id="video-gif-duration" type="number" min="0" max="600" step="0.1" value="${escapeHtml(state.videoGifDuration)}">
          </label>
          <div class="full meta">長さは0で開始秒から末尾まで。GIFは大きくなりやすいので、まず短めの秒数と低めのFPSで試すと扱いやすくなります。</div>
          <div class="full toolbar">
            <button class="ghost" data-action="check-video-gif-ffmpeg" ${state.videoGifStatus === "loading" ? "disabled" : ""}>ffmpeg確認</button>
            <button class="accent" data-action="run-video-gif-conversion" ${busy || !file ? "disabled" : ""}>GIF化を開始</button>
          </div>
          <div class="full meta">${escapeHtml(videoGifStatusText())}</div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>プレビュー</h2></div>
        <div class="panel-body">
          <div class="video-gif-grid">
            <article class="image-edit-preview-card">
              <div class="meta">元動画</div>
              ${renderVideoGifInputPreview(file)}
            </article>
            <article class="image-edit-preview-card">
              <div class="meta">GIF</div>
              ${busy ? `<div class="empty compact">GIF化しています。動画の長さによって時間がかかります。</div>` : result ? `
                <img class="transparent-preview" src="${escapeHtml(result.url)}" alt="">
                <div class="meta">${escapeHtml(result.name || "")} / ${escapeHtml(formatBytes(result.size || 0))}</div>
                <div class="meta">${escapeHtml(result.saveTargetLabel || "画像一覧と動画生成の参照素材に登録済みです。")}</div>
              ` : `<div class="empty compact">まだGIFがありません。</div>`}
            </article>
          </div>
        </div>
      </section>
    </div>
  `;
}

function imageEditControlsFromDom() {
  return {
    workId: document.querySelector("#image-edit-work")?.value || state.imageEditWorkId || "",
    characterId: document.querySelector("#image-edit-character")?.value || "",
    sourceKey: document.querySelector("#image-edit-source")?.value || "",
    provider: normalizedImageEditProvider(document.querySelector("#image-edit-provider")?.value || state.imageEditProvider),
    backgroundMode: normalizedImageEditBackgroundMode(document.querySelector("#image-edit-background-mode")?.value || state.imageEditBackgroundMode),
    tolerance: imageEditToleranceValue(document.querySelector("#image-edit-tolerance")?.value || state.imageEditTolerance),
    feather: imageEditFeatherValue(document.querySelector("#image-edit-feather")?.value || state.imageEditFeather),
    chromaColor: document.querySelector("#image-edit-chroma-color")?.value || state.imageEditChromaColor || "#ffffff",
    rembgModel: normalizedRembgModel(document.querySelector("#image-edit-rembg-model")?.value || state.imageEditRembgModel),
    rembgAlphaMatting: document.querySelector("#image-edit-rembg-alpha-matting")?.checked ?? state.imageEditRembgAlphaMatting,
    rembgPostProcess: document.querySelector("#image-edit-rembg-post-process")?.checked ?? state.imageEditRembgPostProcess,
    backgroundRemoverModel: normalizedBackgroundRemoverModel(document.querySelector("#image-edit-backgroundremover-model")?.value || state.imageEditBackgroundRemoverModel),
    backgroundRemoverAlphaMatting: document.querySelector("#image-edit-backgroundremover-alpha-matting")?.checked ?? state.imageEditBackgroundRemoverAlphaMatting,
    backgroundRemoverErodeSize: backgroundRemoverErodeSizeValue(document.querySelector("#image-edit-backgroundremover-erode-size")?.value || state.imageEditBackgroundRemoverErodeSize),
    manualTool: normalizedManualImageEditTool(document.querySelector("#image-edit-manual-tool")?.value || state.imageEditManualTool),
    manualBrushSize: imageEditManualBrushSizeValue(document.querySelector("#image-edit-manual-brush-size")?.value || state.imageEditManualBrushSize),
    removeBgKey: document.querySelector("#image-edit-removebg-key")?.value.trim() || removeBgApiKey()
  };
}

function rememberImageEditControls(controls = imageEditControlsFromDom()) {
  state.imageEditWorkId = controls.workId || null;
  state.imageEditCharacterId = controls.characterId || "";
  state.imageEditSourceKey = controls.sourceKey || state.imageEditSourceKey || "";
  state.imageEditProvider = normalizedImageEditProvider(controls.provider);
  state.imageEditBackgroundMode = normalizedImageEditBackgroundMode(controls.backgroundMode);
  state.imageEditTolerance = imageEditToleranceValue(controls.tolerance);
  state.imageEditFeather = imageEditFeatherValue(controls.feather);
  state.imageEditChromaColor = controls.chromaColor || "#ffffff";
  state.imageEditRembgModel = normalizedRembgModel(controls.rembgModel);
  state.imageEditRembgAlphaMatting = Boolean(controls.rembgAlphaMatting);
  state.imageEditRembgPostProcess = Boolean(controls.rembgPostProcess);
  state.imageEditBackgroundRemoverModel = normalizedBackgroundRemoverModel(controls.backgroundRemoverModel);
  state.imageEditBackgroundRemoverAlphaMatting = Boolean(controls.backgroundRemoverAlphaMatting);
  state.imageEditBackgroundRemoverErodeSize = backgroundRemoverErodeSizeValue(controls.backgroundRemoverErodeSize);
  state.imageEditManualTool = normalizedManualImageEditTool(controls.manualTool);
  state.imageEditManualBrushSize = imageEditManualBrushSizeValue(controls.manualBrushSize);
  if (controls.removeBgKey) localStorage.setItem("removebg_api_key", controls.removeBgKey);
}

function backgroundRemoverVideoControlsFromDom() {
  return {
    model: normalizedBackgroundRemoverModel(document.querySelector("#backgroundremover-video-model")?.value || state.backgroundRemoverVideoModel),
    mode: normalizedBackgroundRemoverVideoMode(document.querySelector("#backgroundremover-video-mode")?.value || state.backgroundRemoverVideoMode),
    frameRate: backgroundRemoverFrameRateValue(document.querySelector("#backgroundremover-video-frame-rate")?.value || state.backgroundRemoverVideoFrameRate),
    frameLimit: backgroundRemoverFrameLimitValue(document.querySelector("#backgroundremover-video-frame-limit")?.value ?? state.backgroundRemoverVideoFrameLimit),
    gpuBatchSize: backgroundRemoverGpuBatchSizeValue(document.querySelector("#backgroundremover-video-gpu-batch-size")?.value || state.backgroundRemoverVideoGpuBatchSize),
    workerCount: backgroundRemoverWorkerCountValue(document.querySelector("#backgroundremover-video-worker-count")?.value || state.backgroundRemoverVideoWorkerCount)
  };
}

function rememberBackgroundRemoverVideoControls(controls = backgroundRemoverVideoControlsFromDom()) {
  state.backgroundRemoverVideoModel = normalizedBackgroundRemoverModel(controls.model);
  state.backgroundRemoverVideoMode = normalizedBackgroundRemoverVideoMode(controls.mode);
  state.backgroundRemoverVideoFrameRate = backgroundRemoverFrameRateValue(controls.frameRate);
  state.backgroundRemoverVideoFrameLimit = backgroundRemoverFrameLimitValue(controls.frameLimit);
  state.backgroundRemoverVideoGpuBatchSize = backgroundRemoverGpuBatchSizeValue(controls.gpuBatchSize);
  state.backgroundRemoverVideoWorkerCount = backgroundRemoverWorkerCountValue(controls.workerCount);
}

function videoGifControlsFromDom() {
  return {
    workId: document.querySelector("#video-gif-work")?.value || state.imageEditWorkId || "",
    characterId: document.querySelector("#video-gif-character")?.value || "",
    frameRate: videoGifFrameRateValue(document.querySelector("#video-gif-frame-rate")?.value || state.videoGifFrameRate),
    width: videoGifWidthValue(document.querySelector("#video-gif-width")?.value || state.videoGifWidth),
    startTime: videoGifStartTimeValue(document.querySelector("#video-gif-start-time")?.value ?? state.videoGifStartTime),
    duration: videoGifDurationValue(document.querySelector("#video-gif-duration")?.value ?? state.videoGifDuration)
  };
}

function rememberVideoGifControls(controls = videoGifControlsFromDom()) {
  state.imageEditWorkId = controls.workId || null;
  state.imageEditCharacterId = controls.characterId || "";
  state.videoGifFrameRate = videoGifFrameRateValue(controls.frameRate);
  state.videoGifWidth = videoGifWidthValue(controls.width);
  state.videoGifStartTime = videoGifStartTimeValue(controls.startTime);
  state.videoGifDuration = videoGifDurationValue(controls.duration);
}

function parseHexColor(value) {
  const match = String(value || "").trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return [255, 255, 255];
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
}

function imageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = dataUrl;
  });
}

const manualImageEditor = {
  sourceKey: "",
  sourceName: "",
  sourceDataUrl: "",
  width: 0,
  height: 0,
  canvas: null,
  context: null,
  overlay: null,
  overlayContext: null,
  originalImage: null,
  originalImageData: null,
  currentImageData: null,
  undoStack: [],
  lassoPoints: [],
  hoverPoint: null,
  isDrawing: false,
  pointerId: null,
  lastPoint: null,
  loadToken: 0
};

function manualImageEditSourceKey(source) {
  return [source?.key, source?.name, source?.createdAt, source?.url].filter(Boolean).join("|");
}

function manualImageEditorReady() {
  return Boolean(manualImageEditor.canvas && manualImageEditor.context && manualImageEditor.width && manualImageEditor.height);
}

function manualImageEditorAttach(canvas, overlay) {
  manualImageEditor.canvas = canvas;
  manualImageEditor.context = canvas.getContext("2d", { willReadFrequently: true });
  manualImageEditor.overlay = overlay;
  manualImageEditor.overlayContext = overlay.getContext("2d");
  const width = manualImageEditor.width || 1;
  const height = manualImageEditor.height || 1;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  if (overlay.width !== width || overlay.height !== height) {
    overlay.width = width;
    overlay.height = height;
  }
}

function manualImageEditorRedraw() {
  if (!manualImageEditorReady()) return;
  const context = manualImageEditor.context;
  context.clearRect(0, 0, manualImageEditor.width, manualImageEditor.height);
  if (manualImageEditor.currentImageData) {
    context.putImageData(manualImageEditor.currentImageData, 0, 0);
  } else if (manualImageEditor.originalImage) {
    context.drawImage(manualImageEditor.originalImage, 0, 0, manualImageEditor.width, manualImageEditor.height);
    manualImageEditor.currentImageData = context.getImageData(0, 0, manualImageEditor.width, manualImageEditor.height);
  }
  manualImageEditorDrawOverlay();
}

async function ensureManualImageEditor() {
  const canvas = document.querySelector("#image-edit-manual-canvas");
  const overlay = document.querySelector("#image-edit-manual-overlay");
  const source = selectedImageEditSource();
  if (!canvas || !overlay || !source) return false;
  const sourceKey = manualImageEditSourceKey(source);
  if (manualImageEditor.sourceKey === sourceKey && manualImageEditor.currentImageData) {
    manualImageEditorAttach(canvas, overlay);
    manualImageEditorRedraw();
    bindManualImageEditorCanvas();
    return true;
  }
  const loadToken = manualImageEditor.loadToken + 1;
  manualImageEditor.loadToken = loadToken;
  const dataUrl = await sourceDataUrlForImageEdit(source);
  const image = await imageFromDataUrl(dataUrl);
  if (manualImageEditor.loadToken !== loadToken || state.view !== "edit" || normalizedImageEditProvider(state.imageEditProvider) !== "manual") {
    return false;
  }
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  manualImageEditor.sourceKey = sourceKey;
  manualImageEditor.sourceName = source.name || "image.png";
  manualImageEditor.sourceDataUrl = dataUrl;
  manualImageEditor.width = width;
  manualImageEditor.height = height;
  manualImageEditor.originalImage = image;
  manualImageEditor.undoStack = [];
  manualImageEditor.lassoPoints = [];
  manualImageEditor.hoverPoint = null;
  manualImageEditor.isDrawing = false;
  manualImageEditor.pointerId = null;
  manualImageEditor.lastPoint = null;
  manualImageEditorAttach(canvas, overlay);
  const context = manualImageEditor.context;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  manualImageEditor.originalImageData = context.getImageData(0, 0, width, height);
  manualImageEditor.currentImageData = context.getImageData(0, 0, width, height);
  bindManualImageEditorCanvas();
  manualImageEditorDrawOverlay();
  return true;
}

function manualImageEditorPoint(event) {
  const canvas = manualImageEditor.canvas;
  const rect = canvas?.getBoundingClientRect();
  if (!canvas || !rect?.width || !rect?.height) return null;
  return {
    x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * (canvas.width / rect.width))),
    y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * (canvas.height / rect.height)))
  };
}

function manualImageEditorDistance(a, b) {
  const dx = (a?.x || 0) - (b?.x || 0);
  const dy = (a?.y || 0) - (b?.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function manualImageEditorDrawOverlay() {
  const context = manualImageEditor.overlayContext;
  if (!context || !manualImageEditor.overlay) return;
  const width = manualImageEditor.overlay.width;
  const height = manualImageEditor.overlay.height;
  context.clearRect(0, 0, width, height);
  const points = manualImageEditor.lassoPoints;
  if (points.length) {
    context.save();
    context.lineWidth = Math.max(2, Math.min(width, height) / 220);
    context.strokeStyle = "rgba(31, 138, 132, 0.95)";
    context.fillStyle = "rgba(31, 138, 132, 0.12)";
    context.setLineDash([10, 8]);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    if (!manualImageEditor.isDrawing && points.length > 2) context.closePath();
    context.stroke();
    if (!manualImageEditor.isDrawing && points.length > 2) context.fill();
    context.restore();
  }
  const tool = normalizedManualImageEditTool(state.imageEditManualTool);
  if (manualImageEditor.hoverPoint && tool !== "boundary") {
    const radius = imageEditManualBrushSizeValue(state.imageEditManualBrushSize) / 2;
    context.save();
    context.lineWidth = Math.max(2, radius / 10);
    context.strokeStyle = tool === "restore" ? "rgba(103, 122, 47, 0.95)" : "rgba(210, 82, 82, 0.95)";
    context.fillStyle = tool === "restore" ? "rgba(103, 122, 47, 0.12)" : "rgba(210, 82, 82, 0.12)";
    context.beginPath();
    context.arc(manualImageEditor.hoverPoint.x, manualImageEditor.hoverPoint.y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }
}

function manualImageEditorPushUndo() {
  if (!manualImageEditorReady()) return;
  manualImageEditor.undoStack.push(manualImageEditor.context.getImageData(0, 0, manualImageEditor.width, manualImageEditor.height));
  if (manualImageEditor.undoStack.length > 12) manualImageEditor.undoStack.shift();
}

function manualImageEditorInvalidateResult() {
  if (state.imageEditResult) state.imageEditResult = null;
  const saveButton = document.querySelector("[data-action='save-image-edit-result']");
  if (saveButton) saveButton.disabled = true;
}

function manualImageEditorCaptureCurrent() {
  if (!manualImageEditorReady()) return;
  manualImageEditor.currentImageData = manualImageEditor.context.getImageData(0, 0, manualImageEditor.width, manualImageEditor.height);
}

function manualImageEditorCommitEdit() {
  manualImageEditorCaptureCurrent();
  manualImageEditorInvalidateResult();
}

function manualImageEditorRestoreCircle(x, y, radius) {
  const context = manualImageEditor.context;
  const original = manualImageEditor.originalImageData;
  if (!context || !original) return;
  const left = Math.max(0, Math.floor(x - radius));
  const top = Math.max(0, Math.floor(y - radius));
  const right = Math.min(manualImageEditor.width, Math.ceil(x + radius));
  const bottom = Math.min(manualImageEditor.height, Math.ceil(y + radius));
  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return;
  const imageData = context.getImageData(left, top, width, height);
  const target = imageData.data;
  const source = original.data;
  const radiusSq = radius * radius;
  for (let yy = 0; yy < height; yy += 1) {
    for (let xx = 0; xx < width; xx += 1) {
      const px = left + xx;
      const py = top + yy;
      const dx = px - x;
      const dy = py - y;
      if ((dx * dx) + (dy * dy) > radiusSq) continue;
      const targetOffset = (yy * width + xx) * 4;
      const sourceOffset = (py * manualImageEditor.width + px) * 4;
      target[targetOffset] = source[sourceOffset];
      target[targetOffset + 1] = source[sourceOffset + 1];
      target[targetOffset + 2] = source[sourceOffset + 2];
      target[targetOffset + 3] = source[sourceOffset + 3];
    }
  }
  context.putImageData(imageData, left, top);
}

function manualImageEditorEraseSegment(from, to, brushSize) {
  const context = manualImageEditor.context;
  if (!context) return;
  context.save();
  context.globalCompositeOperation = "destination-out";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = brushSize;
  context.strokeStyle = "rgba(0, 0, 0, 1)";
  context.fillStyle = "rgba(0, 0, 0, 1)";
  if (manualImageEditorDistance(from, to) < 0.5) {
    context.beginPath();
    context.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }
  context.restore();
}

function manualImageEditorRestoreSegment(from, to, brushSize) {
  const radius = brushSize / 2;
  const distance = manualImageEditorDistance(from, to);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius / 3)));
  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps;
    manualImageEditorRestoreCircle(
      from.x + (to.x - from.x) * ratio,
      from.y + (to.y - from.y) * ratio,
      radius
    );
  }
}

function manualImageEditorApplyBrush(from, to) {
  const brushSize = imageEditManualBrushSizeValue(state.imageEditManualBrushSize);
  const tool = normalizedManualImageEditTool(state.imageEditManualTool);
  if (tool === "restore") {
    manualImageEditorRestoreSegment(from, to, brushSize);
  } else {
    manualImageEditorEraseSegment(from, to, brushSize);
  }
}

function manualImageEditorUndo() {
  if (!manualImageEditorReady() || !manualImageEditor.undoStack.length) return toast("戻せる手動編集がありません。");
  const previous = manualImageEditor.undoStack.pop();
  manualImageEditor.context.putImageData(previous, 0, 0);
  manualImageEditor.lassoPoints = [];
  manualImageEditorCommitEdit();
  manualImageEditorDrawOverlay();
}

function manualImageEditorReset() {
  if (!manualImageEditorReady() || !manualImageEditor.originalImage) return;
  manualImageEditorPushUndo();
  manualImageEditor.context.clearRect(0, 0, manualImageEditor.width, manualImageEditor.height);
  manualImageEditor.context.drawImage(manualImageEditor.originalImage, 0, 0, manualImageEditor.width, manualImageEditor.height);
  manualImageEditor.lassoPoints = [];
  manualImageEditorCommitEdit();
  manualImageEditorDrawOverlay();
}

function manualImageEditorClearBoundary() {
  manualImageEditor.lassoPoints = [];
  manualImageEditorDrawOverlay();
}

function manualImageEditorApplyBoundary(mode) {
  if (!manualImageEditorReady()) return;
  const points = manualImageEditor.lassoPoints;
  if (points.length < 3) return toast("境界指定がありません。");
  manualImageEditorPushUndo();
  const context = manualImageEditor.context;
  context.save();
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
  context.globalCompositeOperation = mode === "keep-inside" ? "destination-in" : "destination-out";
  context.fillStyle = "rgba(0, 0, 0, 1)";
  context.fill();
  context.restore();
  manualImageEditor.lassoPoints = [];
  manualImageEditorCommitEdit();
  manualImageEditorDrawOverlay();
}

function manualImageEditorPointerDown(event) {
  if (event.button !== 0 || !manualImageEditorReady()) return;
  const point = manualImageEditorPoint(event);
  if (!point) return;
  event.preventDefault();
  manualImageEditor.pointerId = event.pointerId;
  manualImageEditor.isDrawing = true;
  manualImageEditor.hoverPoint = point;
  manualImageEditor.overlay?.setPointerCapture?.(event.pointerId);
  const tool = normalizedManualImageEditTool(state.imageEditManualTool);
  if (tool === "boundary") {
    manualImageEditor.lassoPoints = [point];
  } else {
    manualImageEditorPushUndo();
    manualImageEditor.lastPoint = point;
    manualImageEditorApplyBrush(point, point);
  }
  manualImageEditorDrawOverlay();
}

function manualImageEditorPointerMove(event) {
  if (!manualImageEditorReady()) return;
  const point = manualImageEditorPoint(event);
  if (!point) return;
  manualImageEditor.hoverPoint = point;
  if (manualImageEditor.isDrawing && manualImageEditor.pointerId === event.pointerId) {
    event.preventDefault();
    const tool = normalizedManualImageEditTool(state.imageEditManualTool);
    if (tool === "boundary") {
      const previous = manualImageEditor.lassoPoints.at(-1);
      if (!previous || manualImageEditorDistance(previous, point) >= 3) manualImageEditor.lassoPoints.push(point);
    } else if (manualImageEditor.lastPoint) {
      manualImageEditorApplyBrush(manualImageEditor.lastPoint, point);
      manualImageEditor.lastPoint = point;
    }
  }
  manualImageEditorDrawOverlay();
}

function manualImageEditorPointerUp(event) {
  if (!manualImageEditor.isDrawing || manualImageEditor.pointerId !== event.pointerId) return;
  const point = manualImageEditorPoint(event);
  const tool = normalizedManualImageEditTool(state.imageEditManualTool);
  if (tool === "boundary" && point) {
    const previous = manualImageEditor.lassoPoints.at(-1);
    if (!previous || manualImageEditorDistance(previous, point) >= 3) manualImageEditor.lassoPoints.push(point);
  } else if (tool !== "boundary") {
    manualImageEditorCommitEdit();
  }
  manualImageEditor.isDrawing = false;
  manualImageEditor.pointerId = null;
  manualImageEditor.lastPoint = null;
  manualImageEditor.overlay?.releasePointerCapture?.(event.pointerId);
  manualImageEditorDrawOverlay();
}

function bindManualImageEditorCanvas() {
  const overlay = manualImageEditor.overlay;
  if (!overlay) return;
  overlay.onpointerdown = manualImageEditorPointerDown;
  overlay.onpointermove = manualImageEditorPointerMove;
  overlay.onpointerup = manualImageEditorPointerUp;
  overlay.onpointercancel = manualImageEditorPointerUp;
  overlay.onpointerleave = (event) => {
    if (manualImageEditor.isDrawing && manualImageEditor.pointerId === event.pointerId) return;
    manualImageEditor.hoverPoint = null;
    manualImageEditorDrawOverlay();
  };
}

async function createManualImageEditResult(source) {
  const ready = await ensureManualImageEditor();
  if (!ready || !manualImageEditorReady()) throw new Error("手動編集キャンバスを準備できませんでした。");
  manualImageEditorCaptureCurrent();
  const dataUrl = manualImageEditor.canvas.toDataURL("image/png");
  const info = await getImageInfo(dataUrl);
  state.imageEditResult = {
    dataUrl,
    name: transparentPngName(source.name, "manual"),
    sourceName: source.name || "",
    provider: "manual",
    providerLabel: "手動フリーモード",
    width: info.width,
    height: info.height,
    aspectRatio: info.aspectRatio,
    aspectRatioText: info.aspectRatioText,
    createdAt: new Date().toISOString()
  };
  toast("手動編集を透過PNGに反映しました。");
}

function averageImageColor(data, width, height, startX, startY, sampleSize) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const endX = Math.min(width, startX + sampleSize);
  const endY = Math.min(height, startY + sampleSize);
  for (let y = Math.max(0, startY); y < endY; y += 1) {
    for (let x = Math.max(0, startX); x < endX; x += 1) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] < 8) continue;
      r += data[offset];
      g += data[offset + 1];
      b += data[offset + 2];
      count += 1;
    }
  }
  return count ? [Math.round(r / count), Math.round(g / count), Math.round(b / count)] : [255, 255, 255];
}

function imageEditBackgroundColors(data, width, height, controls) {
  const mode = normalizedImageEditBackgroundMode(controls.backgroundMode);
  if (mode === "white") return [[255, 255, 255]];
  if (mode === "black") return [[0, 0, 0]];
  if (mode === "chroma") return [parseHexColor(controls.chromaColor)];
  const sampleSize = Math.max(3, Math.min(18, Math.floor(Math.min(width, height) / 16)));
  return [
    averageImageColor(data, width, height, 0, 0, sampleSize),
    averageImageColor(data, width, height, width - sampleSize, 0, sampleSize),
    averageImageColor(data, width, height, 0, height - sampleSize, sampleSize),
    averageImageColor(data, width, height, width - sampleSize, height - sampleSize, sampleSize)
  ];
}

function minColorDistanceSquared(data, offset, colors) {
  let best = Infinity;
  for (const color of colors) {
    const dr = data[offset] - color[0];
    const dg = data[offset + 1] - color[1];
    const db = data[offset + 2] - color[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < best) best = distance;
  }
  return best;
}

async function removeBackgroundLocally(dataUrl, controls) {
  const image = await imageFromDataUrl(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const colors = imageEditBackgroundColors(data, width, height, controls);
  const tolerance = imageEditToleranceValue(controls.tolerance);
  const feather = imageEditFeatherValue(controls.feather);
  const maxDistance = tolerance + feather;
  const thresholdSq = tolerance * tolerance;
  const maxDistanceSq = maxDistance * maxDistance;
  const pixelCount = width * height;
  const mask = new Uint8Array(pixelCount);
  const queue = [];
  const pushIfBackground = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (mask[index]) return;
    const offset = index * 4;
    if (data[offset + 3] < 8 || minColorDistanceSquared(data, offset, colors) <= maxDistanceSq) {
      mask[index] = 1;
      queue.push(index);
    }
  };
  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    pushIfBackground(x + 1, y);
    pushIfBackground(x - 1, y);
    pushIfBackground(x, y + 1);
    pushIfBackground(x, y - 1);
  }
  for (let index = 0; index < pixelCount; index += 1) {
    if (!mask[index]) continue;
    const offset = index * 4;
    if (data[offset + 3] < 8) {
      data[offset + 3] = 0;
      continue;
    }
    const distance = Math.sqrt(minColorDistanceSquared(data, offset, colors));
    if (distance <= tolerance || feather === 0) {
      data[offset + 3] = 0;
    } else {
      const ratio = Math.max(0, Math.min(1, (distance - tolerance) / feather));
      data[offset + 3] = Math.round(data[offset + 3] * ratio);
    }
  }
  context.putImageData(imageData, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height
  };
}

async function sourceDataUrlForImageEdit(source) {
  if (source?.dataUrl) return source.dataUrl;
  if (!source?.url) throw new Error("編集元画像が選択されていません。");
  return imageUrlToDataUrl(source.url);
}

async function runImageEdit() {
  const controls = imageEditControlsFromDom();
  rememberImageEditControls(controls);
  const source = selectedImageEditSource();
  if (!source) return toast("編集元画像を選択してください。");
  if (controls.provider === "manual") {
    try {
      await createManualImageEditResult(source);
      render();
    } catch (error) {
      toast(error.message);
    }
    return;
  }
  state.imageEditIsRunning = true;
  state.imageEditResult = null;
  render();
  try {
    const dataUrl = await sourceDataUrlForImageEdit(source);
    let output;
    let providerLabel = "簡易ローカル";
    if (controls.provider === "removebg") {
      if (!controls.removeBgKey) throw new Error("remove.bg API キーを入力してください。");
      localStorage.setItem("removebg_api_key", controls.removeBgKey);
      toastApiSubmitted("remove.bg に背景除去を送信しました。返答を待っています。");
      output = await postJson("/api/remove-bg", {
        apiKey: controls.removeBgKey,
        dataUrl,
        name: source.name || "image.png"
      });
      providerLabel = "remove.bg";
    } else if (controls.provider === "rembg") {
      toastApiSubmitted("rembgでローカルAI背景除去を開始しました。初回モデル読み込み時は時間がかかります。");
      output = await postJson("/api/rembg/remove", {
        dataUrl,
        name: source.name || "image.png",
        model: controls.rembgModel,
        alphaMatting: controls.rembgAlphaMatting,
        postProcessMask: controls.rembgPostProcess
      });
      providerLabel = `rembg / ${output.model || controls.rembgModel}`;
    } else if (controls.provider === "backgroundremover") {
      toastApiSubmitted("backgroundremoverでローカルAI背景除去を開始しました。初回モデル読み込み時は時間がかかります。");
      output = await postJson("/api/backgroundremover/image", {
        dataUrl,
        name: source.name || "image.png",
        model: controls.backgroundRemoverModel,
        alphaMatting: controls.backgroundRemoverAlphaMatting,
        erodeSize: controls.backgroundRemoverErodeSize
      });
      providerLabel = `backgroundremover / ${output.model || controls.backgroundRemoverModel}`;
    } else {
      output = await removeBackgroundLocally(dataUrl, controls);
    }
    const info = await getImageInfo(output.dataUrl);
    state.imageEditResult = {
      dataUrl: output.dataUrl,
      name: transparentPngName(source.name, controls.provider === "removebg" ? "removebg" : controls.provider === "rembg" ? "rembg" : controls.provider === "backgroundremover" ? "backgroundremover" : "transparent"),
      sourceName: source.name || "",
      provider: controls.provider,
      providerLabel,
      width: info.width,
      height: info.height,
      aspectRatio: info.aspectRatio,
      aspectRatioText: info.aspectRatioText,
      createdAt: new Date().toISOString()
    };
    toast("透過PNGを作成しました。");
  } catch (error) {
    toast(error.message);
  } finally {
    state.imageEditIsRunning = false;
    render();
  }
}

async function saveImageEditResult() {
  const result = state.imageEditResult;
  if (!result?.dataUrl) return toast("保存する編集結果がありません。");
  const controls = imageEditControlsFromDom();
  rememberImageEditControls(controls);
  const selectedChar = byId(state.db.characters, state.imageEditCharacterId);
  const work = byId(state.db.works, selectedChar?.workId || state.imageEditWorkId || state.selectedWorkId);
  try {
    const uploaded = await postJson("/api/media-upload", {
      dataUrl: result.dataUrl,
      name: result.name || "transparent.png",
      workName: work?.name,
      folderName: "_画像編集"
    });
    const info = await getImageInfo(result.dataUrl);
    state.db.assets.unshift({
      id: uid(),
      workId: work?.id || null,
      characterId: selectedChar?.id || null,
      worldItemId: null,
      name: result.name || "transparent.png",
      url: uploaded.url,
      localPath: uploaded.path,
      status: selectedChar ? "matched" : "unassigned",
      confidence: selectedChar ? 1 : null,
      aiPrompt: "",
      aiPromptFormat: selectedChar ? promptFormatOf(selectedChar) : "natural",
      aiReason: `${result.providerLabel || "画像編集"}で作成`,
      width: info.width,
      height: info.height,
      aspectRatio: info.aspectRatio,
      aspectRatioText: info.aspectRatioText,
      createdAt: new Date().toISOString()
    });
    await saveDb();
    toast("編集結果を画像一覧へ保存しました。");
    render();
  } catch (error) {
    toast(error.message);
  }
}

async function checkRembgStatus({ silent = false } = {}) {
  state.rembgStatus = "loading";
  state.rembgError = "";
  if (!silent) render();
  try {
    const result = await postJson("/api/rembg/status", {});
    state.rembgInfo = result;
    state.rembgStatus = result.found ? "ready" : "missing";
    state.rembgError = result.found ? "" : (result.installHint || "rembgが見つかりません。");
    if (!silent) {
      render();
      toast(result.found ? "rembgを利用できます。" : "rembgはまだセットアップされていません。");
    }
    return result;
  } catch (error) {
    state.rembgStatus = "failed";
    state.rembgError = error.message;
    if (!silent) {
      render();
      toast(error.message);
    }
    return null;
  }
}

async function setupRembg() {
  const ok = window.confirm("rembgを vendor/rembg-venv にセットアップします。Pythonパッケージとモデル実行環境をダウンロードするため、初回は時間がかかります。");
  if (!ok) return;
  state.rembgStatus = "installing";
  state.rembgError = "";
  render();
  try {
    const result = await postJson("/api/rembg/setup", {});
    state.rembgInfo = result.status || result;
    state.rembgStatus = state.rembgInfo?.found ? "ready" : "missing";
    state.rembgError = result.error || "";
    render();
    toast(state.rembgInfo?.found ? "rembgセットアップが完了しました。" : (result.error || "rembgセットアップを確認できませんでした。"));
  } catch (error) {
    state.rembgStatus = "failed";
    state.rembgError = error.message;
    render();
    toast(error.message);
  }
}

async function checkBackgroundRemoverStatus({ silent = false } = {}) {
  state.backgroundRemoverStatus = "loading";
  state.backgroundRemoverError = "";
  if (!silent) render();
  try {
    const result = await postJson("/api/backgroundremover/status", {});
    state.backgroundRemoverInfo = result;
    state.backgroundRemoverStatus = result.found ? "ready" : "missing";
    state.backgroundRemoverError = result.found ? "" : (result.installHint || "backgroundremoverが見つかりません。");
    if (!silent) {
      render();
      toast(result.found ? "backgroundremoverを利用できます。" : "backgroundremoverはまだセットアップされていません。");
    }
    return result;
  } catch (error) {
    state.backgroundRemoverStatus = "failed";
    state.backgroundRemoverError = error.message;
    if (!silent) {
      render();
      toast(error.message);
    }
    return null;
  }
}

async function setupBackgroundRemover() {
  const ok = window.confirm("backgroundremoverを vendor/backgroundremover-venv にセットアップします。PyTorchを含むため、初回はかなり時間がかかることがあります。");
  if (!ok) return;
  state.backgroundRemoverStatus = "installing";
  state.backgroundRemoverError = "";
  render();
  try {
    const result = await postJson("/api/backgroundremover/setup", {});
    state.backgroundRemoverInfo = result.status || result;
    state.backgroundRemoverStatus = state.backgroundRemoverInfo?.found ? "ready" : "missing";
    state.backgroundRemoverError = result.error || "";
    render();
    toast(state.backgroundRemoverInfo?.found ? "backgroundremoverセットアップが完了しました。" : (result.error || "backgroundremoverセットアップを確認できませんでした。"));
  } catch (error) {
    state.backgroundRemoverStatus = "failed";
    state.backgroundRemoverError = error.message;
    render();
    toast(error.message);
  }
}

function backgroundRemoverResultKind(result) {
  return String(result?.mimeType || "").startsWith("image/") ? "image" : "video";
}

async function runBackgroundRemoverVideo() {
  const file = state.backgroundRemoverVideoFile;
  if (!file?.dataUrl) return toast("動画またはGIFを選択してください。");
  const controls = backgroundRemoverVideoControlsFromDom();
  rememberBackgroundRemoverVideoControls(controls);
  state.backgroundRemoverVideoIsRunning = true;
  state.backgroundRemoverVideoResult = null;
  render();
  try {
    toastApiSubmitted("backgroundremoverで動画背景除去を開始しました。長い動画は時間がかかります。");
    const result = await postJson("/api/backgroundremover/video", {
      dataUrl: file.dataUrl,
      name: file.name || "video.mp4",
      model: controls.model,
      mode: controls.mode,
      frameRate: controls.frameRate,
      frameLimit: controls.frameLimit,
      gpuBatchSize: controls.gpuBatchSize,
      workerCount: controls.workerCount
    });
    state.backgroundRemoverVideoResult = result;
    const selectedChar = byId(state.db.characters, state.imageEditCharacterId);
    const work = byId(state.db.works, selectedChar?.workId || state.imageEditWorkId || state.selectedWorkId);
    state.db.videoMedia.unshift({
      id: uid(),
      workId: work?.id || null,
      characterId: selectedChar?.id || null,
      kind: backgroundRemoverResultKind(result),
      name: result.name || file.name || "backgroundremover output",
      url: result.url,
      localPath: result.path,
      mimeType: result.mimeType || "",
      subject: "backgroundremover 動画背景除去",
      memo: `${backgroundRemoverVideoModeLabel(result.mode)} / ${result.model || controls.model}`,
      createdAt: new Date().toISOString()
    });
    await saveDb();
    toast("動画背景除去の結果を保存しました。");
  } catch (error) {
    toast(error.message);
  } finally {
    state.backgroundRemoverVideoIsRunning = false;
    render();
  }
}

async function checkVideoGifStatus({ silent = false } = {}) {
  state.videoGifStatus = "loading";
  state.videoGifError = "";
  if (!silent) render();
  try {
    const result = await postJson("/api/image-edit/video-gif/status", {});
    state.videoGifInfo = result;
    state.videoGifStatus = result.found ? "ready" : "missing";
    state.videoGifError = result.found ? "" : (result.installHint || "ffmpegが見つかりません。");
    if (!silent) {
      render();
      toast(result.found ? "ffmpegを利用できます。" : "ffmpegが見つかりません。");
    }
    return result;
  } catch (error) {
    state.videoGifStatus = "failed";
    state.videoGifError = error.message;
    if (!silent) {
      render();
      toast(error.message);
    }
    return null;
  }
}

function videoGifMemo(controls) {
  const duration = Number(controls.duration) > 0 ? `${controls.duration}秒` : "末尾まで";
  return `${controls.frameRate}fps / 幅${controls.width}px / ${controls.startTime}秒から${duration}`;
}

async function runVideoGifConversion() {
  const file = state.videoGifFile;
  if (!file?.dataUrl) return toast("GIF化する動画を選択してください。");
  const controls = videoGifControlsFromDom();
  rememberVideoGifControls(controls);
  const selectedChar = byId(state.db.characters, state.imageEditCharacterId);
  const work = byId(state.db.works, selectedChar?.workId || state.imageEditWorkId || state.selectedWorkId);
  state.videoGifIsRunning = true;
  state.videoGifResult = null;
  render();
  try {
    toastApiSubmitted("動画のGIF化を開始しました。完了までお待ちください。");
    const result = await postJson("/api/image-edit/video-gif", {
      dataUrl: file.dataUrl,
      name: file.name || "video.mp4",
      workName: work?.name,
      characterName: selectedChar?.name || "",
      folderName: "_画像編集",
      frameRate: controls.frameRate,
      width: controls.width,
      startTime: controls.startTime,
      duration: controls.duration
    });
    result.saveTargetLabel = selectedChar
      ? `${selectedChar.name} の画像フォルダに保存し、画像一覧と動画生成の参照素材に登録済みです。`
      : "作品の _画像編集 に保存し、画像一覧と動画生成の参照素材に登録済みです。";
    state.videoGifResult = result;
    const info = await getImageInfo(result.url);
    const createdAt = new Date().toISOString();
    const memo = videoGifMemo(controls);
    state.db.assets.unshift({
      id: uid(),
      workId: work?.id || null,
      characterId: selectedChar?.id || null,
      worldItemId: null,
      name: result.name || file.name || "video.gif",
      url: result.url,
      localPath: result.path,
      status: selectedChar ? "matched" : "unassigned",
      confidence: selectedChar ? 1 : null,
      aiPrompt: "",
      aiPromptFormat: selectedChar ? promptFormatOf(selectedChar) : "natural",
      aiReason: `動画GIF化で作成（${memo}）`,
      width: info.width,
      height: info.height,
      aspectRatio: info.aspectRatio,
      aspectRatioText: info.aspectRatioText,
      createdAt
    });
    state.db.videoMedia.unshift({
      id: uid(),
      workId: work?.id || null,
      characterId: selectedChar?.id || null,
      kind: "image",
      name: result.name || file.name || "video.gif",
      url: result.url,
      localPath: result.path,
      mimeType: "image/gif",
      width: info.width || null,
      height: info.height || null,
      aspectRatio: info.aspectRatio || null,
      aspectRatioText: info.aspectRatioText || "",
      subject: "動画GIF化",
      memo,
      createdAt
    });
    await saveDb();
    toast(selectedChar ? `GIFを ${selectedChar.name} に保存しました。` : "GIF化した動画を画像一覧へ保存しました。");
  } catch (error) {
    toast(error.message);
  } finally {
    state.videoGifIsRunning = false;
    render();
  }
}

function bindImageEditor() {
  const persist = () => rememberImageEditControls();
  document.querySelector("#image-edit-work")?.addEventListener("change", (event) => {
    state.imageEditWorkId = event.target.value || null;
    state.selectedWorkId = state.imageEditWorkId;
    if (state.imageEditCharacterId && !charactersForWork(state.imageEditWorkId).some((char) => char.id === state.imageEditCharacterId)) {
      state.imageEditCharacterId = "";
    }
    state.imageEditSourceKey = state.imageEditInputFile ? "upload" : "";
    state.imageEditResult = null;
    render();
  });
  document.querySelector("#image-edit-character")?.addEventListener("change", (event) => {
    state.imageEditCharacterId = event.target.value || "";
    const char = byId(state.db.characters, state.imageEditCharacterId);
    if (char) {
      state.imageEditWorkId = char.workId;
      state.selectedWorkId = char.workId;
    }
    state.imageEditResult = null;
    render();
  });
  document.querySelector("#image-edit-source")?.addEventListener("change", (event) => {
    state.imageEditSourceKey = event.target.value;
    state.imageEditResult = null;
    render();
  });
  document.querySelector("#image-edit-provider")?.addEventListener("change", () => {
    persist();
    if (state.imageEditProvider === "rembg" && state.rembgStatus === "idle") {
      checkRembgStatus({ silent: true }).then(() => {
        if (state.view === "edit") render();
      });
    }
    if (state.imageEditProvider === "backgroundremover" && state.backgroundRemoverStatus === "idle") {
      checkBackgroundRemoverStatus({ silent: true }).then(() => {
        if (state.view === "edit") render();
      });
    }
    render();
  });
  ["#image-edit-rembg-model", "#image-edit-rembg-alpha-matting", "#image-edit-rembg-post-process"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", persist);
  });
  ["#image-edit-backgroundremover-model", "#image-edit-backgroundremover-alpha-matting", "#image-edit-backgroundremover-erode-size"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", persist);
    document.querySelector(selector)?.addEventListener("change", () => {
      persist();
      if (selector === "#image-edit-backgroundremover-alpha-matting") render();
    });
  });
  ["#image-edit-background-mode", "#image-edit-tolerance", "#image-edit-feather", "#image-edit-chroma-color"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", persist);
    document.querySelector(selector)?.addEventListener("change", () => {
      persist();
      if (selector === "#image-edit-background-mode") render();
    });
  });
  document.querySelector("#image-edit-manual-tool")?.addEventListener("change", () => {
    persist();
    manualImageEditor.lassoPoints = [];
    manualImageEditorDrawOverlay();
  });
  document.querySelector("#image-edit-manual-brush-size")?.addEventListener("input", () => {
    persist();
    manualImageEditorDrawOverlay();
  });
  document.querySelector("[data-action='manual-image-edit-undo']")?.addEventListener("click", async () => {
    await ensureManualImageEditor();
    manualImageEditorUndo();
  });
  document.querySelector("[data-action='manual-image-edit-reset']")?.addEventListener("click", async () => {
    await ensureManualImageEditor();
    manualImageEditorReset();
  });
  document.querySelector("[data-action='manual-image-edit-clear-boundary']")?.addEventListener("click", () => manualImageEditorClearBoundary());
  document.querySelector("[data-action='manual-image-edit-keep-inside']")?.addEventListener("click", async () => {
    await ensureManualImageEditor();
    manualImageEditorApplyBoundary("keep-inside");
  });
  document.querySelector("[data-action='manual-image-edit-remove-inside']")?.addEventListener("click", async () => {
    await ensureManualImageEditor();
    manualImageEditorApplyBoundary("remove-inside");
  });
  document.querySelector("#image-edit-removebg-key")?.addEventListener("change", () => {
    const key = document.querySelector("#image-edit-removebg-key")?.value.trim() || "";
    localStorage.setItem("removebg_api_key", key);
  });
  document.querySelector("[data-action='choose-image-edit-file']")?.addEventListener("click", () => {
    document.querySelector("#image-edit-file-input")?.click();
  });
  document.querySelector("#image-edit-file-input")?.addEventListener("change", async (event) => {
    const file = [...(event.target.files || [])].find((item) => item.type.startsWith("image/"));
    if (!file) return;
    const preview = await fileToDataUrl(file);
    state.imageEditInputFile = {
      name: file.name,
      preview,
      size: file.size,
      imageInfo: await getImageInfo(preview),
      createdAt: new Date().toISOString()
    };
    state.imageEditSourceKey = "upload";
    state.imageEditResult = null;
    render();
  });
  document.querySelector("[data-action='clear-image-edit-file']")?.addEventListener("click", () => {
    state.imageEditInputFile = null;
    if (state.imageEditSourceKey === "upload") state.imageEditSourceKey = "";
    state.imageEditResult = null;
    render();
  });
  document.querySelector("[data-action='run-image-edit']")?.addEventListener("click", runImageEdit);
  document.querySelector("[data-action='save-image-edit-result']")?.addEventListener("click", saveImageEditResult);
  document.querySelector("[data-action='check-rembg']")?.addEventListener("click", () => checkRembgStatus());
  document.querySelector("[data-action='setup-rembg']")?.addEventListener("click", setupRembg);
  document.querySelectorAll("[data-action='check-backgroundremover']").forEach((button) => {
    button.addEventListener("click", () => checkBackgroundRemoverStatus());
  });
  document.querySelectorAll("[data-action='setup-backgroundremover']").forEach((button) => {
    button.addEventListener("click", setupBackgroundRemover);
  });
  ["#backgroundremover-video-model", "#backgroundremover-video-mode", "#backgroundremover-video-frame-rate", "#backgroundremover-video-frame-limit", "#backgroundremover-video-gpu-batch-size", "#backgroundremover-video-worker-count"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", () => rememberBackgroundRemoverVideoControls());
    document.querySelector(selector)?.addEventListener("change", () => rememberBackgroundRemoverVideoControls());
  });
  document.querySelector("[data-action='choose-backgroundremover-video']")?.addEventListener("click", () => {
    document.querySelector("#backgroundremover-video-input")?.click();
  });
  document.querySelector("#backgroundremover-video-input")?.addEventListener("change", async (event) => {
    const file = [...(event.target.files || [])].find((item) => item.type.startsWith("video/") || item.type === "image/gif" || /\.gif$/i.test(item.name));
    if (!file) return;
    if (file.size > 180 * 1024 * 1024) {
      event.target.value = "";
      return toast("動画/GIFは180MB以下を選択してください。長い素材は短く切ってから試すと安定します。");
    }
    state.backgroundRemoverVideoFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: await fileToDataUrl(file),
      createdAt: new Date().toISOString()
    };
    state.backgroundRemoverVideoResult = null;
    if (state.backgroundRemoverStatus === "idle") {
      checkBackgroundRemoverStatus({ silent: true }).then(() => {
        if (state.view === "edit") render();
      });
    }
    render();
  });
  document.querySelector("[data-action='clear-backgroundremover-video']")?.addEventListener("click", () => {
    state.backgroundRemoverVideoFile = null;
    state.backgroundRemoverVideoResult = null;
    render();
  });
  document.querySelector("[data-action='run-backgroundremover-video']")?.addEventListener("click", runBackgroundRemoverVideo);
  if (normalizedImageEditProvider(state.imageEditProvider) === "manual") {
    requestAnimationFrame(() => {
      ensureManualImageEditor().catch((error) => toast(error.message));
    });
  }
}

function bindVideoGifConverter() {
  const persist = () => rememberVideoGifControls();
  document.querySelector("#video-gif-work")?.addEventListener("change", (event) => {
    state.imageEditWorkId = event.target.value || null;
    state.selectedWorkId = state.imageEditWorkId;
    if (state.imageEditCharacterId && !charactersForWork(state.imageEditWorkId).some((char) => char.id === state.imageEditCharacterId)) {
      state.imageEditCharacterId = "";
    }
    render();
  });
  document.querySelector("#video-gif-character")?.addEventListener("change", (event) => {
    state.imageEditCharacterId = event.target.value || "";
    const char = byId(state.db.characters, state.imageEditCharacterId);
    if (char) {
      state.imageEditWorkId = char.workId;
      state.selectedWorkId = char.workId;
    }
    render();
  });
  ["#video-gif-frame-rate", "#video-gif-width", "#video-gif-start-time", "#video-gif-duration"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", persist);
    document.querySelector(selector)?.addEventListener("change", persist);
  });
  document.querySelector("[data-action='choose-video-gif-file']")?.addEventListener("click", () => {
    document.querySelector("#video-gif-input")?.click();
  });
  document.querySelector("#video-gif-input")?.addEventListener("change", async (event) => {
    const file = [...(event.target.files || [])].find((item) => item.type.startsWith("video/") || item.type === "image/gif" || /\.gif$/i.test(item.name));
    if (!file) return;
    if (file.size > 180 * 1024 * 1024) {
      event.target.value = "";
      return toast("動画は180MB以下を選択してください。長い素材は短く切ってからGIF化すると安定します。");
    }
    state.videoGifFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: await fileToDataUrl(file),
      createdAt: new Date().toISOString()
    };
    state.videoGifResult = null;
    if (state.videoGifStatus === "idle") {
      checkVideoGifStatus({ silent: true }).then(() => {
        if (state.view === "edit-gif") render();
      });
    }
    render();
  });
  document.querySelector("[data-action='clear-video-gif-file']")?.addEventListener("click", () => {
    state.videoGifFile = null;
    state.videoGifResult = null;
    render();
  });
  document.querySelector("[data-action='check-video-gif-ffmpeg']")?.addEventListener("click", () => checkVideoGifStatus());
  document.querySelector("[data-action='run-video-gif-conversion']")?.addEventListener("click", runVideoGifConversion);
}

function mediaKindFromFile(file) {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "image";
}

function seedanceRoleForKind(kind, mode = "reference") {
  if (mode === "first_frame" && kind === "image") return "first_frame";
  if (kind === "video") return "reference_video";
  if (kind === "audio") return "reference_audio";
  return "reference_image";
}

function seedanceRoleLabel(role) {
  return {
    first_frame: "開始フレーム",
    last_frame: "終了フレーム",
    reference_image: "参照画像",
    reference_video: "参照動画",
    reference_audio: "参照音声"
  }[role] || role;
}

function allVideoReferences() {
  const items = [];
  const seen = new Set();
  const push = (item) => {
    if (!item.url || seen.has(item.key)) return;
    seen.add(item.key);
    items.push(item);
  };
  state.db.assets.forEach((asset) => {
    push({
      key: `asset:${asset.id}`,
      source: "asset",
      kind: "image",
      id: asset.id,
      workId: asset.workId,
      characterId: asset.characterId || null,
      worldItemId: asset.worldItemId || null,
      name: asset.name,
      url: asset.url,
      subject: subjectLabelForAsset(asset),
      prompt: asset.aiPrompt || "",
      dimensions: assetDimensionLabel(asset),
      createdAt: asset.createdAt
    });
  });
  state.db.characters.forEach((char) => {
    if (!char.portraitUrl) return;
    push({
      key: `character:${char.id}`,
      source: "character",
      kind: "image",
      id: char.id,
      workId: char.workId,
      characterId: char.id,
      worldItemId: null,
      name: `${char.name} 立ち絵`,
      url: char.portraitUrl,
      subject: char.name,
      prompt: char.basePrompt || "",
      dimensions: "",
      createdAt: char.createdAt
    });
  });
  (state.db.worldItems || []).forEach((item) => {
    if (!item.referenceUrl) return;
    push({
      key: `world:${item.id}`,
      source: "world",
      kind: "image",
      id: item.id,
      workId: item.workId,
      characterId: null,
      worldItemId: item.id,
      name: `${item.name} 参考画像`,
      url: item.referenceUrl,
      subject: `${worldItemCategoryLabel(item.category)}: ${item.name}`,
      prompt: item.basePrompt || item.description || "",
      dimensions: "",
      createdAt: item.createdAt
    });
  });
  (state.db.videoMedia || []).forEach((media) => {
    push({
      key: `media:${media.id}`,
      source: "media",
      kind: media.kind || "image",
      id: media.id,
      workId: media.workId,
      characterId: media.characterId || null,
      worldItemId: media.worldItemId || null,
      name: media.name,
      url: media.url,
      subject: media.subject || "動画生成素材",
      prompt: media.memo || "",
      dimensions: media.width && media.height ? `${media.width}x${media.height}${media.aspectRatioText ? ` / ${media.aspectRatioText}` : ""}` : "",
      createdAt: media.createdAt
    });
  });
  (state.db.audioItems || []).forEach((audio) => {
    const char = byId(state.db.characters, audio.characterId);
    const work = byId(state.db.works, audio.workId || char?.workId);
    push({
      key: `audio:${audio.id}`,
      source: "generated-audio",
      kind: "audio",
      id: audio.id,
      workId: audio.workId || char?.workId || null,
      characterId: audio.characterId || null,
      worldItemId: null,
      name: audio.title || "生成音声",
      url: audio.url,
      subject: char ? `${char.name} / 生成音声` : work ? `${work.name} / 生成音声` : "生成音声",
      prompt: audio.input || "",
      dimensions: audio.voice ? `voice: ${audio.voice}` : "",
      createdAt: audio.createdAt
    });
  });
  return items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function videoCharacterOptions() {
  return state.db.characters.filter((char) => !state.videoWorkId || char.workId === state.videoWorkId);
}

function sortVideoReferencesForDisplay(items) {
  const selectedOrder = new Map(state.videoSelectedReferenceIds.map((key, index) => [key, index]));
  return items
    .map((item, index) => ({ item, index, selectedIndex: selectedOrder.has(item.key) ? selectedOrder.get(item.key) : null }))
    .sort((a, b) => {
      const aSelected = a.selectedIndex !== null;
      const bSelected = b.selectedIndex !== null;
      if (aSelected && bSelected) return a.selectedIndex - b.selectedIndex;
      if (aSelected) return -1;
      if (bSelected) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

function filteredVideoReferences() {
  const selectedKeys = new Set(state.videoSelectedReferenceIds);
  const visible = allVideoReferences()
    .filter((item) => !state.videoWorkId || item.workId === state.videoWorkId || !item.workId)
    .filter((item) => !state.videoCharacterId || item.characterId === state.videoCharacterId || selectedKeys.has(item.key))
    .filter((item) => state.videoReferenceKind === "all" || item.kind === state.videoReferenceKind);
  return sortVideoReferencesForDisplay(visible);
}

function selectedVideoReferences() {
  const map = new Map(allVideoReferences().map((item) => [item.key, item]));
  return state.videoSelectedReferenceIds.map((key) => map.get(key)).filter(Boolean);
}

function selectedVideoReferenceCounts(nextItems = selectedVideoReferences()) {
  return nextItems.reduce((counts, item) => {
    counts[item.kind] = (counts[item.kind] || 0) + 1;
    return counts;
  }, { image: 0, video: 0, audio: 0 });
}

function seedanceReferenceLabel(item, selectedItems = selectedVideoReferences()) {
  let index = 0;
  for (const candidate of selectedItems) {
    if (candidate.kind === item.kind) index += 1;
    if (candidate.key === item.key) break;
  }
  if (item.kind === "video") return `@Video${index}`;
  if (item.kind === "audio") return `@Audio${index}`;
  return `@Image${index}`;
}

function renderVideoReferenceRoleSelect(item) {
  if (!state.videoSelectedReferenceIds.includes(item.key)) return "";
  const currentRole = state.videoReferenceRoles[item.key] || seedanceRoleForKind(item.kind, state.videoPromptDraft?.mode || "reference");
  const options = item.kind === "image"
    ? ["reference_image", "first_frame", "last_frame"]
    : item.kind === "video"
      ? ["reference_video"]
      : ["reference_audio"];
  return `
    <select data-action="change-video-ref-role" data-id="${item.key}">
      ${options.map((role) => `<option value="${role}" ${currentRole === role ? "selected" : ""}>${seedanceRoleLabel(role)}</option>`).join("")}
    </select>
  `;
}

function renderVideoReferenceCard(item) {
  const checked = state.videoSelectedReferenceIds.includes(item.key);
  const selectedItems = selectedVideoReferences();
  const label = checked ? seedanceReferenceLabel(item, selectedItems) : "";
  const preview = item.kind === "video"
    ? `<video class="reference-thumb" src="${escapeHtml(item.url)}" muted playsinline></video>`
    : item.kind === "audio"
      ? `<div class="reference-thumb audio-thumb">Audio</div>`
      : `<img class="reference-thumb" src="${escapeHtml(item.url)}" alt="">`;
  return `
    <article class="reference-card ${checked ? "selected" : ""}">
      ${preview}
      <div class="body">
        <label class="reference-check">
          <input type="checkbox" data-action="toggle-video-reference" data-id="${escapeHtml(item.key)}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(label || (item.kind === "image" ? "Image" : item.kind === "video" ? "Video" : "Audio"))}</span>
        </label>
        <div class="asset-name">${escapeHtml(item.name || "reference")}</div>
        <div class="meta">${escapeHtml(item.subject || "")}${item.dimensions ? ` / ${escapeHtml(item.dimensions)}` : ""}</div>
        ${renderVideoReferenceRoleSelect(item)}
      </div>
    </article>
  `;
}

function videoControlValue(id, fallback = "") {
  return document.querySelector(`#${id}`)?.value ?? fallback;
}

function videoControlsFromDom() {
  const defaultModel = compatibleVideoModelId(state.videoPromptDraft?.model || state.db.settings.seedanceModel, state.db.settings.seedanceBaseUrl);
  const promptInput = document.querySelector("#video-prompt-text");
  return {
    workId: videoControlValue("video-work", state.videoWorkId || state.selectedWorkId || ""),
    mode: videoControlValue("video-mode", state.videoPromptDraft?.mode || "reference"),
    model: videoControlValue("video-seedance-model", state.videoPromptDraft?.model || state.db.settings.seedanceModel || defaultModel),
    duration: Number(videoControlValue("video-duration", state.videoPromptDraft?.duration || 5)) || 5,
    ratio: videoControlValue("video-ratio", state.videoPromptDraft?.ratio || "16:9"),
    resolution: videoControlValue("video-resolution", state.videoPromptDraft?.resolution || state.db.settings.seedanceResolution || "720p"),
    generateAudio: videoControlValue("video-generate-audio", String(state.videoPromptDraft?.generateAudio ?? true)) === "true",
    cameraFixed: videoControlValue("video-camera-fixed", String(state.videoPromptDraft?.cameraFixed ?? false)) === "true",
    watermark: videoControlValue("video-watermark", String(state.videoPromptDraft?.watermark ?? false)) === "true",
    returnLastFrame: videoControlValue("video-return-last-frame", String(state.videoPromptDraft?.returnLastFrame ?? false)) === "true",
    seed: Number(videoControlValue("video-seed", state.videoPromptDraft?.seed ?? -1)),
    characterId: videoControlValue("video-character", state.videoCharacterId || ""),
    prompt: promptInput ? promptInput.value : state.videoPromptDraft?.prompt || ""
  };
}

function buildVideoReferenceContext(selectedItems, controls) {
  if (!selectedItems.length) return "参照素材: なし";
  const counters = { image: 0, video: 0, audio: 0 };
  const lines = selectedItems.map((item) => {
    counters[item.kind] += 1;
    const label = item.kind === "image" ? `@Image${counters.image}` : item.kind === "video" ? `@Video${counters.video}` : `@Audio${counters.audio}`;
    const role = state.videoReferenceRoles[item.key] || seedanceRoleForKind(item.kind, controls.mode);
    return `${label}: ${item.kind}, role=${role}, name=${item.name || ""}, subject=${item.subject || ""}, prompt=${compactPromptText(item.prompt, 300)}`;
  });
  return `参照素材:\n- ${lines.join("\n- ")}`;
}

async function loadSeedanceGuide() {
  if (state.seedanceGuide) return state.seedanceGuide;
  const payload = await getJson("/api/seedance/guide");
  state.seedanceGuide = payload.text || "";
  return state.seedanceGuide;
}

function buildSeedanceAgentSystemPrompt(guideText) {
  return `あなたは動画生成モデル向けの動画監督エージェントです。ユーザーのチャット、作品情報、世界観、キャラ情報、参照素材を読み、足りない情報があれば短く聞き取り、十分ならAPI送信用プロンプト案を作ります。

必ず次のJSONだけを返してください。
{
  "message": "ユーザーに見せる日本語の返答。聞き取り、意図の整理、または生成に入れる状態の説明。",
  "ready": true または false,
  "questions": ["必要な確認事項"],
  "draft": {
    "title": "短いタイトル",
    "prompt": "動画生成APIに送る英語プロンプト。参照素材がある場合は @Image1 / @Video1 / @Audio1 を使う。",
    "mode": "text|first_frame|first_last|reference",
    "duration": 4から15の整数,
    "ratio": "16:9|9:16|1:1|4:3|3:4|21:9|adaptive",
    "resolution": "480p|720p|1080p|2K",
    "generateAudio": true または false,
    "cameraFixed": true または false,
    "watermark": false,
    "returnLastFrame": false
  }
}

動画生成プロンプトの優先ルール:
- プロンプトは絵の説明ではなく撮影指示書として書く。
- Subject -> Action -> Environment -> Camera -> Style -> Constraints の順にまとめる。
- 主カメラ指示は1つだけにする。
- ネガティブプロンプト欄はないので Avoid 文で制約する。
- Image-to-Videoでは画像の見た目を長く再説明せず、動き・感情変化・カメラを優先する。
- 1プロンプトに主役と演出意図を詰め込みすぎない。

添付ガイド抜粋:
${String(guideText || "").slice(0, 14000)}`;
}

function buildVideoAgentText(inputText, controls, selectedItems) {
  const selectedChar = byId(state.db.characters, controls.characterId || state.videoCharacterId);
  const work = byId(state.db.works, selectedChar?.workId) || byId(state.db.works, controls.workId) || byId(state.db.works, state.selectedWorkId);
  const chars = selectedChar ? [selectedChar] : work ? charactersForWork(work.id) : [];
  const charText = chars.map((char) => [
    `名前=${char.name}`,
    `メモ=${compactPromptText(char.memo, 420)}`,
    `生成プロンプト=${compactPromptText(char.basePrompt, 620)}`,
    `NG=${compactPromptText(char.negativePrompt, 260)}`
  ].join(" / ")).join("\n");
  const history = state.videoChatMessages.slice(-10).map((message) => `${message.role}: ${message.content}`).join("\n");
  return `ユーザー入力:
${inputText}

現在の設定:
model=${controls.model}, mode=${controls.mode}, duration=${controls.duration}, ratio=${controls.ratio}, resolution=${controls.resolution}, generateAudio=${controls.generateAudio}, cameraFixed=${controls.cameraFixed}, watermark=${controls.watermark}

作品情報 / 世界観:
${buildPromptLabWorldContext(work)}

登場キャラ:
${charText || "未指定"}

${buildVideoReferenceContext(selectedItems, controls)}

直近チャット:
${history}

返答では、足りない情報がある場合も、今ある情報で暫定案が作れるなら draft を入れてください。`;
}

async function buildVideoAgentUserContent(inputText, controls, selectedItems) {
  const parts = [{ type: "text", text: buildVideoAgentText(inputText, controls, selectedItems) }];
  const imageRefs = selectedItems.filter((item) => item.kind === "image").slice(0, 6);
  for (const item of imageRefs) {
    try {
      parts.push({ type: "image_url", image_url: { url: await imageUrlToDataUrl(item.url) } });
    } catch {
      // The text metadata still gives the agent a usable reference trail.
    }
  }
  return parts;
}

function mergeVideoDraft(result, fallbackControls) {
  const source = result?.draft || result?.proposal || result?.seedance || {};
  if (!source.prompt && result?.prompt) source.prompt = result.prompt;
  if (!source.prompt) return null;
  return {
    title: source.title || defaultVideoJobTitle(fallbackControls.model),
    prompt: source.prompt || "",
    model: source.model || fallbackControls.model,
    mode: source.mode || fallbackControls.mode || "reference",
    duration: Number(source.duration || fallbackControls.duration || 5),
    ratio: source.ratio || fallbackControls.ratio || "16:9",
    resolution: source.resolution || fallbackControls.resolution || "720p",
    generateAudio: source.generateAudio ?? source.generate_audio ?? fallbackControls.generateAudio,
    cameraFixed: source.cameraFixed ?? source.camera_fixed ?? fallbackControls.cameraFixed,
    watermark: source.watermark ?? fallbackControls.watermark ?? false,
    returnLastFrame: source.returnLastFrame ?? source.return_last_frame ?? fallbackControls.returnLastFrame ?? false,
    seed: Number(source.seed ?? fallbackControls.seed ?? -1)
  };
}

async function handleVideoAgentMessage(forceDraft = false) {
  const chatInput = document.querySelector("#video-chat-input");
  const input = chatInput?.value.trim();
  const message = input || (forceDraft ? "ここまでの会話と選択素材から、動画生成API送信用のプロンプト案を作ってください。" : "");
  if (!message) return toast("メッセージを入力してください。");
  const controls = videoControlsFromDom();
  state.videoWorkId = controls.workId || null;
  state.videoChatDraft = "";
  if (chatInput) chatInput.value = "";
  state.videoChatMessages.push({ role: "user", content: message });
  state.videoIsThinking = true;
  render();
  try {
    toastApiSubmitted("動画プロンプト作成APIに送信しました。返答を待っています。");
    const guide = await loadSeedanceGuide();
    const selectedItems = selectedVideoReferences();
    const content = await callOpenRouter({
      purpose: "video",
      temperature: 0.4,
      maxTokens: 3600,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: buildSeedanceAgentSystemPrompt(guide) },
        { role: "user", content: await buildVideoAgentUserContent(message, controls, selectedItems) }
      ]
    });
    const result = parseAiJson(content);
    const assistantMessage = result.message || result.answer || "プロンプト案を更新しました。";
    state.videoChatMessages.push({ role: "assistant", content: assistantMessage });
    const draft = mergeVideoDraft(result, controls);
    if (draft) state.videoPromptDraft = draft;
    state.videoIsThinking = false;
    render({ preserveLiveTextDrafts: !draft });
  } catch (error) {
    state.videoIsThinking = false;
    state.videoChatMessages.push({ role: "assistant", content: `エラー: ${error.message}${debugChatText(error)}` });
    render();
  }
}

function referencesForSeedance(controls) {
  const selected = selectedVideoReferences();
  const images = selected.filter((item) => item.kind === "image");
  if (controls.mode === "text") return [];
  if (controls.mode === "first_frame") {
    if (!images.length) throw new Error("開始フレーム用の画像を1枚選択してください。");
    return [{ ...images[0], role: "first_frame" }];
  }
  if (controls.mode === "first_last") {
    if (images.length < 2) throw new Error("開始フレームと終了フレーム用に画像を2枚選択してください。");
    return [
      { ...images[0], role: "first_frame" },
      { ...images[1], role: "last_frame" }
    ];
  }
  return selected.map((item) => ({
    ...item,
    role: state.videoReferenceRoles[item.key] || seedanceRoleForKind(item.kind, controls.mode)
  }));
}

function validateSeedanceReferenceLimits(references) {
  const counts = selectedVideoReferenceCounts(references);
  if (counts.image > 9) throw new Error("参照画像は最大9枚までです。");
  if (counts.video > 3) throw new Error("参照動画は最大3本までです。");
  if (counts.audio > 3) throw new Error("参照音声は最大3本までです。");
}

async function startSeedanceGeneration() {
  const controls = videoControlsFromDom();
  const prompt = controls.prompt.trim();
  const seedanceKey = activeSeedanceApiKey();
  if (!seedanceKey) return toast(`設定画面で ${seedanceProviderLabel()} API キーを保存してください。`);
  if (!prompt) return toast("API送信用プロンプトを入力してください。");
  let job = null;
  try {
    state.db.settings.seedanceModel = controls.model;
    state.db.settings.seedanceResolution = controls.resolution;
    const references = referencesForSeedance(controls);
    validateSeedanceReferenceLimits(references);
    job = {
      id: uid(),
      workId: controls.workId || null,
      title: state.videoPromptDraft?.title || defaultVideoJobTitle(controls.model, state.db.settings.seedanceBaseUrl),
      prompt,
      status: "submitting",
      providerTaskId: "",
      providerPayload: null,
      request: null,
      settings: {
        ...controls,
        baseUrl: state.db.settings.seedanceBaseUrl
      },
      references: references.map((item) => ({
        key: item.key,
        kind: item.kind,
        role: item.role,
        name: item.name,
        url: item.url
      })),
      progress: 0,
      progressMessage: "送信中",
      videoUrl: "",
      localUrl: "",
      localPath: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.db.videoJobs.unshift(job);
    state.videoIsGenerating = true;
    await saveDb();
    render();
    toastApiSubmitted("動画生成APIに送信しました。返答を待っています。");
    const payload = await postJson("/api/seedance/create", {
      apiKey: seedanceKey,
      baseUrl: state.db.settings.seedanceBaseUrl,
      model: controls.model,
      prompt,
      ratio: controls.ratio,
      duration: controls.duration,
      resolution: controls.resolution,
      generateAudio: controls.generateAudio,
      cameraFixed: controls.cameraFixed,
      watermark: controls.watermark,
      seed: controls.seed,
      returnLastFrame: controls.returnLastFrame,
      references: references.map((item) => ({
        kind: item.kind,
        role: item.role,
        url: item.url,
        name: item.name
      }))
    });
    job.providerPayload = payload.providerPayload || payload;
    job.request = payload.request || payload.providerPayload?.request || null;
    const providerError = readableError(payload.error) || readableError(payload.providerPayload?.error);
    if (providerError) {
      job.status = "failed";
      job.error = providerError;
      job.updatedAt = new Date().toISOString();
      await saveDb();
      render();
      throw new Error(providerError);
    }
    job.providerTaskId = payload.id || payload.task_id || "";
    if (!job.providerTaskId) {
      job.status = "failed";
      job.error = "動画生成タスクIDを取得できませんでした。";
      job.updatedAt = new Date().toISOString();
      await saveDb();
      render();
      throw new Error(job.error);
    }
    job.status = payload.status || "submitted";
    job.progress = payload.progress ?? job.progress ?? 0;
    job.progressMessage = payload.progressMessage || job.progressMessage || "";
    job.updatedAt = new Date().toISOString();
    await saveDb();
    render();
    toast("動画生成タスクを開始しました。");
    await pollSeedanceJob(job.id);
  } catch (error) {
    state.videoIsGenerating = false;
    toast(error.message);
    const target = job || state.db.videoJobs[0];
    if (target && ["submitting", "submitted"].includes(target.status) && !target.providerTaskId) {
      target.status = "failed";
      target.error = target.error || error.message;
      target.updatedAt = new Date().toISOString();
      await saveDb();
      render();
    }
  }
}

async function pollSeedanceJob(jobId) {
  const job = byId(state.db.videoJobs || [], jobId);
  const jobBaseUrl = job?.settings?.baseUrl || state.db.settings.seedanceBaseUrl;
  const seedanceKey = activeSeedanceApiKey(jobBaseUrl);
  if (job && !activeVideoJobStatuses.includes(job.status)) {
    state.videoIsGenerating = false;
    if (state.videoPollingJobId === job.id) state.videoPollingJobId = "";
    render();
    return;
  }
  if (!job?.providerTaskId || !seedanceKey) {
    state.videoIsGenerating = false;
    if (state.videoPollingJobId === job?.id) state.videoPollingJobId = "";
    return;
  }
  state.videoPollingJobId = job.id;
  render();
  try {
    const payload = await postJson("/api/seedance/status", {
      apiKey: seedanceKey,
      baseUrl: jobBaseUrl,
      taskId: job.providerTaskId
    });
    job.status = payload.status || job.status;
    job.progress = payload.progress ?? (job.status === "succeeded" ? 100 : job.progress ?? null);
    job.progressMessage = payload.progressMessage || job.progressMessage || "";
    job.videoUrl = payload.videoUrl || job.videoUrl || "";
    job.localUrl = payload.localUrl || job.localUrl || "";
    job.localPath = payload.localPath || job.localPath || "";
    job.providerPayload = payload;
    job.updatedAt = new Date().toISOString();
    await saveDb();
    const done = ["succeeded", "failed", "expired", "cancelled"].includes(job.status);
    if (done) {
      let lastFrameMessage = "";
      if (job.status === "succeeded") {
        try {
          const lastFrame = await saveVideoLastFrameReference(job);
          if (lastFrame) {
            job.updatedAt = new Date().toISOString();
            await saveDb();
            lastFrameMessage = " 最終フレームも参照素材へ保存しました。";
          }
        } catch (frameError) {
          job.lastFrameError = frameError.message;
          job.updatedAt = new Date().toISOString();
          await saveDb();
          lastFrameMessage = " 最終フレームの保存には失敗しました。";
        }
      }
      state.videoIsGenerating = false;
      state.videoPollingJobId = "";
      toast(job.status === "succeeded" ? `生成動画を保存しました。${lastFrameMessage}` : `生成タスクが ${job.status} で終了しました。`);
      render();
      return;
    }
    window.setTimeout(() => pollSeedanceJob(job.id), 12000);
  } catch (error) {
    state.videoIsGenerating = false;
    state.videoPollingJobId = "";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    await saveDb();
    toast(error.message);
    render();
  }
}

async function uploadVideoReferenceFiles(files) {
  const selectedChar = byId(state.db.characters, state.videoCharacterId);
  const work = byId(state.db.works, selectedChar?.workId || state.videoWorkId || state.selectedWorkId);
  const accepted = [...files].filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/"));
  if (!accepted.length) return;
  try {
    for (const file of accepted) {
      const dataUrl = await fileToDataUrl(file);
      const kind = mediaKindFromFile(file);
      const uploaded = await postJson("/api/media-upload", {
        dataUrl,
        name: file.name,
        workName: work?.name,
        folderName: "_Comfy参照画像"
      });
      const info = kind === "image" ? await getImageInfo(dataUrl) : {};
      state.db.videoMedia.unshift({
        id: uid(),
        workId: work?.id || null,
        characterId: selectedChar?.id || null,
        kind: uploaded.kind || kind,
        name: file.name,
        url: uploaded.url,
        localPath: uploaded.path,
        mimeType: uploaded.mimeType || file.type,
        width: info.width || null,
        height: info.height || null,
        aspectRatio: info.aspectRatio || null,
        aspectRatioText: info.aspectRatioText || "",
        createdAt: new Date().toISOString()
      });
    }
    await saveDb();
    render();
    toast(`${accepted.length} 件を参照素材に追加しました。`);
  } catch (error) {
    toast(error.message);
  }
}

async function uploadImageReferenceFiles(files) {
  const selectedChar = byId(state.db.characters, state.imageCharacterId);
  const work = byId(state.db.works, selectedChar?.workId || state.imageWorkId || state.selectedWorkId);
  const accepted = [...files].filter((file) => file.type.startsWith("image/"));
  if (!accepted.length) return;
  try {
    for (const file of accepted) {
      const dataUrl = await fileToDataUrl(file);
      const uploaded = await postJson("/api/media-upload", {
        dataUrl,
        name: file.name,
        workName: work?.name
      });
      const info = await getImageInfo(dataUrl);
      state.db.videoMedia.unshift({
        id: uid(),
        workId: work?.id || null,
        characterId: selectedChar?.id || null,
        kind: "image",
        name: file.name,
        url: uploaded.url,
        localPath: uploaded.path,
        mimeType: uploaded.mimeType || file.type,
        width: info.width || null,
        height: info.height || null,
        aspectRatio: info.aspectRatio || null,
        aspectRatioText: info.aspectRatioText || "",
        subject: "Comfy参照画像",
        createdAt: new Date().toISOString()
      });
    }
    await saveDb();
    render({ preserveLiveTextDrafts: true });
    toast(`${accepted.length} 件をComfy参照画像に追加しました。`);
  } catch (error) {
    toast(error.message);
  }
}

function captureVideoLastFrameDataUrl(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };
    const fail = (message) => {
      cleanup();
      reject(new Error(message));
    };
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("error", () => fail("最終フレーム抽出用の動画を読み込めませんでした。"), { once: true });
    video.addEventListener("loadedmetadata", () => {
      const duration = Number(video.duration);
      if (!Number.isFinite(duration) || duration <= 0) {
        fail("動画の長さを取得できませんでした。");
        return;
      }
      video.currentTime = Math.max(0, duration - 0.08);
    }, { once: true });
    video.addEventListener("seeked", () => {
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) {
          fail("動画フレームのサイズを取得できませんでした。");
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        fail(`最終フレームを画像化できませんでした: ${error.message}`);
      }
    }, { once: true });
    video.src = `${videoUrl}${String(videoUrl).includes("?") ? "&" : "?"}lastFrame=${Date.now()}`;
    video.load();
  });
}

async function saveVideoLastFrameReference(job) {
  if (!job?.settings?.returnLastFrame || !job.localUrl || job.lastFrameUrl) return null;
  const existing = (state.db.videoMedia || []).find((media) => media.sourceJobId === job.id && media.kind === "image");
  if (existing) {
    job.lastFrameUrl = existing.url;
    job.lastFrameLocalPath = existing.localPath || "";
    return null;
  }
  const work = byId(state.db.works, job.workId);
  const dataUrl = await captureVideoLastFrameDataUrl(job.localUrl);
  const safeTitle = cleanFileLabel(displayVideoJobTitle(job) || "video");
  const uploaded = await postJson("/api/media-upload", {
    dataUrl,
    name: `${safeTitle}_last_frame.png`,
    workName: work?.name
  });
  const info = await getImageInfo(dataUrl);
  const media = {
    id: uid(),
    workId: job.workId || null,
    characterId: null,
    kind: "image",
    name: `${displayVideoJobTitle(job)} 最終フレーム`,
    url: uploaded.url,
    localPath: uploaded.path,
    mimeType: uploaded.mimeType || "image/png",
    width: info.width || null,
    height: info.height || null,
    aspectRatio: info.aspectRatio || null,
    aspectRatioText: info.aspectRatioText || "",
    sourceJobId: job.id,
    subject: "生成動画の最終フレーム",
    memo: job.prompt || "",
    createdAt: new Date().toISOString()
  };
  state.db.videoMedia.unshift(media);
  job.lastFrameUrl = media.url;
  job.lastFrameLocalPath = media.localPath;
  return media;
}

async function discardVideoWaitingJobs() {
  const activeJobs = (state.db.videoJobs || []).filter((job) => activeVideoJobStatuses.includes(job.status));
  state.videoIsGenerating = false;
  state.videoPollingJobId = "";
  if (!activeJobs.length) {
    render();
    return toast("待機中の動画生成はありません。");
  }
  activeJobs.forEach((job) => {
    job.status = "cancelled";
    if (job.providerTaskId) job.cancelledProviderTaskId = job.providerTaskId;
    job.providerTaskId = "";
    job.error = "ユーザー操作で待機状態を破棄しました。外部サービス側の生成自体は停止できない場合があります。";
    job.updatedAt = new Date().toISOString();
  });
  await saveDb();
  render();
  toast(`${activeJobs.length} 件の待機中ジョブを破棄しました。`);
}

function imageCharacterOptions() {
  return state.db.characters.filter((char) => !state.imageWorkId || char.workId === state.imageWorkId);
}

function imageGpuLabel(gpuMode) {
  return gpuMode === "cloud" ? "クラウドGPU" : "ローカルGPU";
}

function imageStatusLabel(status) {
  return {
    submitting: "送信中",
    submitted: "送信済み",
    pending: "待機中",
    queued: "待機中",
    running: "生成中",
    processing: "生成中",
    succeeded: "完了",
    failed: "失敗",
    cancelled: "破棄済み"
  }[status] || status || "確認中";
}

function imageJobProgress(job) {
  const value = job?.progress ?? job?.providerPayload?.progress;
  if (value === null || value === undefined || value === "") {
    if (job?.status === "succeeded") return 100;
    return null;
  }
  const number = Number(String(value).replace("%", ""));
  if (!Number.isFinite(number)) return null;
  const progress = number > 0 && number <= 1 ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function normalizeImageCompareMode(value) {
  const text = String(value || "").trim();
  return imageCompareModes.some(([mode]) => mode === text) ? text : "seed";
}

function imageCompareModeLabel(mode) {
  return imageCompareModes.find(([value]) => value === normalizeImageCompareMode(mode))?.[1] || "Seed";
}

function imageCompareCountValue(value) {
  return boundedSettingNumber(value, 3, 2, 6, true);
}

function randomComfySeed() {
  return Math.floor(Math.random() * 900000000000000) + 10000000000000;
}

function fixedComparisonSeed(seed) {
  const number = Number(seed);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : randomComfySeed();
}

function activeImageJobs() {
  return (state.db?.imageJobs || []).filter((job) => activeImageJobStatuses.includes(job.status));
}

function syncImageGenerationFlag() {
  state.imageIsGenerating = activeImageJobs().length > 0;
}

function activeImageJob() {
  return byId(state.db.imageJobs || [], state.imagePollingJobId)
    || activeImageJobs()[0]
    || null;
}

function imageControlValue(id, fallback = "") {
  return document.querySelector(`#${id}`)?.value ?? fallback;
}

function imageControlsFromDom() {
  const settings = activeComfySettings();
  const promptInput = document.querySelector("#image-prompt-text");
  const negativeInput = document.querySelector("#image-negative-prompt");
  const gpuMode = imageControlValue("image-gpu-mode", state.imageGpuMode || settings.gpuMode) === "cloud" ? "cloud" : "local";
  const loraFallback = state.imagePromptDraft?.loras || settings.loras;
  const referenceSlots = comfyReferenceSlotsFromDom("image", state.imagePromptDraft?.referenceSlots || settings.referenceSlots, true);
  const compareEnabled = document.querySelector("#image-compare-enabled")?.checked ?? Boolean(state.imagePromptDraft?.compareEnabled ?? state.imageCompareEnabled);
  return {
    workId: imageControlValue("image-work", state.imageWorkId || state.selectedWorkId || ""),
    characterId: imageControlValue("image-character", state.imageCharacterId || ""),
    gpuMode,
    title: imageControlValue("image-title", state.imagePromptDraft?.title || "生成画像").trim() || "生成画像",
    prompt: promptInput ? promptInput.value : state.imagePromptDraft?.prompt || "",
    negativePrompt: negativeInput ? negativeInput.value : state.imagePromptDraft?.negativePrompt || "",
    width: Number(imageControlValue("image-width", state.imagePromptDraft?.width || settings.width)) || settings.width,
    height: Number(imageControlValue("image-height", state.imagePromptDraft?.height || settings.height)) || settings.height,
    steps: Number(imageControlValue("image-steps", state.imagePromptDraft?.steps || settings.steps)) || settings.steps,
    cfg: Number(imageControlValue("image-cfg", state.imagePromptDraft?.cfg || settings.cfg)) || settings.cfg,
    samplerName: imageControlValue("image-sampler", state.imagePromptDraft?.samplerName || settings.samplerName),
    scheduler: imageControlValue("image-scheduler", state.imagePromptDraft?.scheduler || settings.scheduler),
    batchSize: Number(imageControlValue("image-batch-size", state.imagePromptDraft?.batchSize || settings.batchSize)) || settings.batchSize,
    seed: imageControlValue("image-seed", state.imagePromptDraft?.seed ?? settings.seed),
    checkpoint: imageControlValue("image-checkpoint", state.imagePromptDraft?.checkpoint || settings.checkpoint),
    loras: lorasFromDom("image", loraFallback),
    referenceSlots,
    references: activeComfyReferenceSlots(referenceSlots),
    compareEnabled,
    compareCount: imageCompareCountValue(imageControlValue("image-compare-count", state.imagePromptDraft?.compareCount || state.imageCompareCount || 3)),
    compareMode: normalizeImageCompareMode(imageControlValue("image-compare-mode", state.imagePromptDraft?.compareMode || state.imageCompareMode || "seed")),
    baseUrl: activeComfyBaseUrl(gpuMode),
    apiKey: activeComfyApiKey(gpuMode),
    workflowJson: settings.workflowJson,
    positiveNodeId: settings.positiveNodeId,
    negativeNodeId: settings.negativeNodeId,
    seedNodeId: settings.seedNodeId,
    sizeNodeId: settings.sizeNodeId,
    stepsNodeId: settings.stepsNodeId,
    cfgNodeId: settings.cfgNodeId,
    samplerNodeId: settings.samplerNodeId,
    checkpointNodeId: settings.checkpointNodeId
  };
}

function rememberImageControls(controls, { clearValidation = true } = {}) {
  const selectedChar = byId(state.db.characters, controls.characterId);
  const work = byId(state.db.works, selectedChar?.workId || controls.workId);
  state.imageWorkId = work?.id || controls.workId || null;
  state.imageCharacterId = selectedChar?.id || "";
  state.imageGpuMode = controls.gpuMode;
  state.imageCompareEnabled = Boolean(controls.compareEnabled);
  state.imageCompareCount = imageCompareCountValue(controls.compareCount);
  state.imageCompareMode = normalizeImageCompareMode(controls.compareMode);
  state.imagePromptDraft = {
    ...(state.imagePromptDraft || {}),
    title: controls.title,
    prompt: controls.prompt,
    negativePrompt: controls.negativePrompt,
    width: controls.width,
    height: controls.height,
    steps: controls.steps,
    cfg: controls.cfg,
    samplerName: controls.samplerName,
    scheduler: controls.scheduler,
    batchSize: controls.batchSize,
    seed: controls.seed,
    checkpoint: controls.checkpoint,
    loras: controls.loras,
    referenceSlots: controls.referenceSlots,
    compareEnabled: state.imageCompareEnabled,
    compareCount: state.imageCompareCount,
    compareMode: state.imageCompareMode
  };
  state.db.settings.comfy = {
    ...activeComfySettings(),
    gpuMode: controls.gpuMode,
    width: controls.width,
    height: controls.height,
    steps: controls.steps,
    cfg: controls.cfg,
    samplerName: controls.samplerName,
    scheduler: controls.scheduler,
    batchSize: controls.batchSize,
    seed: controls.seed,
    checkpoint: controls.checkpoint,
    loras: controls.loras,
    referenceSlots: comfyReferenceSlotSettings(controls.referenceSlots)
  };
  if (clearValidation) state.comfyValidation = null;
  return { selectedChar, work };
}

function currentComfySettingsForPreset() {
  if (state.view === "image") {
    const controls = imageControlsFromDom();
    rememberImageControls(controls, { clearValidation: false });
    return normalizedComfySettings({
      ...activeComfySettings(),
      gpuMode: controls.gpuMode,
      width: controls.width,
      height: controls.height,
      steps: controls.steps,
      cfg: controls.cfg,
      samplerName: controls.samplerName,
      scheduler: controls.scheduler,
      batchSize: controls.batchSize,
      seed: controls.seed,
      checkpoint: controls.checkpoint,
      loras: controls.loras,
      referenceSlots: comfyReferenceSlotSettings(controls.referenceSlots)
    });
  }
  if (state.view === "settings") return comfySettingsFromDom();
  return activeComfySettings();
}

function applyComfyPreset(presetId) {
  const preset = comfyPresets().find((item) => item.id === presetId);
  if (!preset) return false;
  const current = activeComfySettings();
  const next = normalizedComfySettings({
    ...preset.settings,
    localBaseUrl: current.localBaseUrl,
    cloudBaseUrl: current.cloudBaseUrl
  });
  state.db.settings.comfy = next;
  state.imageGpuMode = next.gpuMode;
  state.comfyValidation = null;
  if (state.view === "image") {
    state.imagePromptDraft = {
      ...(state.imagePromptDraft || {}),
      width: next.width,
      height: next.height,
      steps: next.steps,
      cfg: next.cfg,
      samplerName: next.samplerName,
      scheduler: next.scheduler,
      batchSize: next.batchSize,
      seed: next.seed,
      checkpoint: next.checkpoint,
      loras: next.loras,
      referenceSlots: next.referenceSlots,
      agentNote: `Comfyプリセット「${preset.name}」を適用しました。`
    };
  }
  return true;
}

function renderComfyPresetControls(prefix) {
  const presets = comfyPresets();
  return `
    <div class="full comfy-preset-panel">
      <label>Comfyプリセット
        <select id="${prefix}-comfy-preset">
          <option value="">選択してください</option>
          ${presets.map((preset) => `<option value="${preset.id}">${escapeHtml(preset.name)}</option>`).join("")}
        </select>
      </label>
      <div class="toolbar slim-toolbar">
        <button class="ghost" data-action="apply-comfy-preset" ${presets.length ? "" : "disabled"}>適用</button>
        <button class="ghost" data-action="save-comfy-preset">現在値を保存</button>
        <button class="ghost" data-action="update-comfy-preset" ${presets.length ? "" : "disabled"}>上書き</button>
        <button class="ghost danger" data-action="delete-comfy-preset" ${presets.length ? "" : "disabled"}>削除</button>
      </div>
      <div class="meta">${presets.length ? `${presets.length} 件のプリセット` : "立ち絵、背景、表情差分などの設定を保存できます。"}</div>
    </div>
  `;
}

function imageCompareHelpText(mode) {
  const normalized = normalizeImageCompareMode(mode);
  if (normalized === "cfg") return "同じSeedでCFGだけを段階的に変え、絵柄の強さやプロンプト追従を比較します。";
  if (normalized === "steps") return "同じSeedでStepsだけを段階的に変え、仕上がり密度と時間のバランスを比較します。";
  return "同じ設定でSeedだけを変え、構図や表情の当たりを比較します。";
}

function imageCompareGroupsForWork(workId) {
  const groups = new Map();
  imageJobsForWork(workId).forEach((job) => {
    if (!job.compareGroupId) return;
    if (!groups.has(job.compareGroupId)) {
      groups.set(job.compareGroupId, {
        id: job.compareGroupId,
        title: job.compareGroupTitle || job.title || "比較生成",
        mode: job.compareMode || "seed",
        createdAt: job.createdAt || "",
        updatedAt: job.updatedAt || job.createdAt || "",
        jobs: []
      });
    }
    const group = groups.get(job.compareGroupId);
    group.jobs.push(job);
    if (String(job.updatedAt || "").localeCompare(group.updatedAt || "") > 0) group.updatedAt = job.updatedAt;
  });
  return [...groups.values()]
    .map((group) => ({
      ...group,
      jobs: group.jobs.sort((a, b) => (a.compareIndex ?? 0) - (b.compareIndex ?? 0))
    }))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function renderImageCompareGroup(group) {
  const done = group.jobs.filter((job) => ["succeeded", "failed", "cancelled"].includes(job.status)).length;
  return `
    <article class="image-compare-group">
      <div class="compare-group-header">
        <div>
          <div class="char-name">${escapeHtml(group.title || "比較生成")}</div>
          <div class="meta">${escapeHtml(imageCompareModeLabel(group.mode))}比較 / ${done}/${group.jobs.length} 完了 / ${group.updatedAt ? escapeHtml(new Date(group.updatedAt).toLocaleString("ja-JP")) : ""}</div>
        </div>
      </div>
      <div class="image-compare-grid">
        ${group.jobs.map(renderImageCompareCard).join("")}
      </div>
    </article>
  `;
}

function renderImageCompareCard(job) {
  const progress = imageJobProgress(job);
  const image = job.images?.[0];
  const label = job.compareLabel || `${imageCompareModeLabel(job.compareMode)} ${job.compareIndex !== null ? job.compareIndex + 1 : ""}`.trim();
  return `
    <article class="image-compare-card ${job.status}">
      <div class="compare-card-media">
        ${image?.url ? `<img src="${escapeHtml(image.url)}" alt="">` : `<div class="empty compact">${escapeHtml(imageStatusLabel(job.status))}</div>`}
      </div>
      <div class="compare-card-body">
        <div class="compare-badge">${escapeHtml(label)}</div>
        <div class="meta">${escapeHtml(imageStatusLabel(job.status))}${progress !== null ? ` ${escapeHtml(`${progress}%`)}` : ""}</div>
        <div class="meta">Seed ${escapeHtml(job.settings?.seed ?? "")} / CFG ${escapeHtml(job.settings?.cfg ?? "")} / Steps ${escapeHtml(job.settings?.steps ?? "")}</div>
        ${job.error ? `<div class="meta danger-text">${escapeHtml(job.error)}</div>` : ""}
      </div>
      <div class="card-actions">
        <button class="ghost" data-action="adopt-image-job" data-id="${job.id}">採用</button>
        <button class="ghost" data-action="copy-image-job-prompt" data-id="${job.id}">プロンプト</button>
        <button class="ghost" data-action="refresh-image-job" data-id="${job.id}" ${!job.providerTaskId || ["succeeded", "cancelled"].includes(job.status) ? "disabled" : ""}>更新</button>
      </div>
    </article>
  `;
}

function renderImageAgent() {
  const work = byId(state.db.works, state.imageWorkId) || byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.imageWorkId && work) state.imageWorkId = work.id;
  const chars = imageCharacterOptions();
  if (state.imageCharacterId && !chars.some((char) => char.id === state.imageCharacterId)) {
    state.imageCharacterId = "";
  }
  const settings = activeComfySettings();
  const controls = {
    ...settings,
    compareEnabled: state.imageCompareEnabled,
    compareCount: state.imageCompareCount,
    compareMode: state.imageCompareMode,
    ...(state.imagePromptDraft || {})
  };
  const gpuMode = state.imageGpuMode || settings.gpuMode;
  const endpoint = activeComfyBaseUrl(gpuMode);
  const jobs = imageJobsForWork(state.imageWorkId).slice(0, 16);
  const compareGroups = imageCompareGroupsForWork(state.imageWorkId).slice(0, 4);
  const activeJobs = activeImageJobs();
  return `
    <div class="video-layout image-layout">
      <section class="panel">
        <div class="panel-header"><h2>生成設定</h2></div>
        <div class="panel-body form-grid">
          <label class="full">作品
            <select id="image-work">
              <option value="">全作品</option>
              ${state.db.works.map((item) => `<option value="${item.id}" ${state.imageWorkId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">キャラ指定
            <select id="image-character">
              <option value="">指定なし</option>
              ${chars.map((char) => `<option value="${char.id}" ${state.imageCharacterId === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">GPU
            <select id="image-gpu-mode">
              <option value="local" ${gpuMode === "local" ? "selected" : ""}>ローカルGPU</option>
              <option value="cloud" ${gpuMode === "cloud" ? "selected" : ""}>クラウドGPU</option>
            </select>
          </label>
          ${renderComfyPresetControls("image")}
          <div class="full image-compare-settings">
            <label class="check-row">
              <input id="image-compare-enabled" type="checkbox" ${controls.compareEnabled ? "checked" : ""}>
              <span>生成比較モード</span>
            </label>
            <div class="image-compare-controls">
              <label>比較枚数<input id="image-compare-count" type="number" min="2" max="6" value="${escapeHtml(controls.compareCount || 3)}"></label>
              <label>比較軸
                <select id="image-compare-mode">
                  ${imageCompareModes.map(([value, label]) => `<option value="${value}" ${normalizeImageCompareMode(controls.compareMode) === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
                </select>
              </label>
            </div>
            <div class="meta">${escapeHtml(imageCompareHelpText(controls.compareMode))}</div>
          </div>
          <label class="full">タイトル<input id="image-title" value="${escapeHtml(controls.title || "生成画像")}"></label>
          <label>幅<input id="image-width" type="number" min="64" max="4096" step="64" value="${escapeHtml(controls.width || settings.width)}"></label>
          <label>高さ<input id="image-height" type="number" min="64" max="4096" step="64" value="${escapeHtml(controls.height || settings.height)}"></label>
          <label>Steps<input id="image-steps" type="number" min="1" max="150" value="${escapeHtml(controls.steps || settings.steps)}"></label>
          <label>CFG<input id="image-cfg" type="number" min="0" max="30" step="0.5" value="${escapeHtml(controls.cfg || settings.cfg)}"></label>
          <label>Sampler<input id="image-sampler" value="${escapeHtml(controls.samplerName || settings.samplerName)}"></label>
          <label>Scheduler<input id="image-scheduler" value="${escapeHtml(controls.scheduler || settings.scheduler)}"></label>
          <label>Batch<input id="image-batch-size" type="number" min="1" max="8" value="${escapeHtml(controls.batchSize || settings.batchSize)}"></label>
          <label>Seed<input id="image-seed" type="number" placeholder="空欄でランダム" value="${escapeHtml(controls.seed ?? settings.seed)}"></label>
          <label class="full">Checkpoint<input id="image-checkpoint" list="comfy-checkpoint-options" placeholder="workflow側の既定値を使う場合は空欄" value="${escapeHtml(controls.checkpoint || settings.checkpoint)}"></label>
          <div class="full comfy-lora-list">
            <div class="field-label">LoRA</div>
            ${renderComfyLoraRows("image", controls.loras || settings.loras)}
          </div>
          <div class="full comfy-reference-panel">
            <div class="toolbar slim-toolbar">
              <div>
                <div class="field-label">参照画像</div>
                <div class="meta">LoadImage系NodeのIDを指定すると、選んだ画像をComfyUIへアップロードして差し替えます。</div>
              </div>
              <div>
                <input id="image-reference-file-input" type="file" accept="image/*" multiple hidden>
                <button class="ghost" data-action="choose-image-reference-files">画像追加</button>
              </div>
            </div>
            ${renderComfyReferenceSlotRows("image", controls.referenceSlots || settings.referenceSlots, { includeReference: true })}
          </div>
          ${renderComfyModelDatalists()}
          ${renderComfyModelStatus()}
          ${renderComfyValidationResult()}
          <div class="full toolbar slim-toolbar">
            <button class="ghost" data-action="load-comfy-models" ${state.comfyModelStatus === "loading" ? "disabled" : ""}>モデル一覧取得</button>
            <button class="ghost" data-action="validate-comfy-workflow">事前チェック</button>
          </div>
          <div class="full meta">${escapeHtml(imageGpuLabel(gpuMode))}: ${escapeHtml(endpoint || "設定画面でURLを指定してください。")}</div>
        </div>
      </section>
      <section class="video-main">
        <section class="panel video-chat-panel">
          <div class="panel-header">
            <h2>エージェント</h2>
            <button class="ghost" data-action="image-make-draft" ${state.imageIsThinking ? "disabled" : ""}>画像案</button>
          </div>
          <div class="panel-body">
            <div class="chat-log">
              ${state.imageChatMessages.map((message) => `<div class="chat-message ${message.role}"><div>${escapeHtml(message.content)}</div></div>`).join("")}
              ${state.imageIsThinking ? `<div class="chat-message assistant"><div>考えています...</div></div>` : ""}
            </div>
            <div class="chat-input-row">
              <textarea id="image-chat-input" placeholder="例：雨の夜、黒い制服の少女が古い駅のホームで振り返る。冷たい青い光、透明感のあるアニメ塗り。">${escapeHtml(state.imageChatDraft || "")}</textarea>
              <button data-action="image-send-message" ${state.imageIsThinking ? "disabled" : ""}>送信</button>
            </div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Comfy送信用プロンプト</h2>
              <div class="meta">${escapeHtml(state.imagePromptDraft?.agentNote || "手動入力できます。")}</div>
            </div>
            <div class="group">
              <button class="ghost" data-action="image-copy-prompt">コピー</button>
              ${(state.imageIsGenerating || state.imagePollingJobId || activeJobs.length) ? `<button class="ghost danger" data-action="discard-image-waiting">待機を破棄</button>` : ""}
              <button class="accent" data-action="image-start-generation" ${state.imageIsGenerating ? "disabled" : ""}>${controls.compareEnabled ? "比較生成開始" : "生成開始"}</button>
            </div>
          </div>
          <div class="panel-body">
            <textarea id="image-prompt-text" class="seedance-prompt-text" placeholder="masterpiece, best quality, cinematic lighting...">${escapeHtml(controls.prompt || "")}</textarea>
            <label class="full negative-prompt-field">Negative
              <textarea id="image-negative-prompt" placeholder="low quality, blurry, bad anatomy...">${escapeHtml(controls.negativePrompt || "")}</textarea>
            </label>
            ${state.imageIsGenerating || state.imagePollingJobId ? renderComfyAnimation() : ""}
          </div>
        </section>
        ${compareGroups.length ? `
          <section class="panel">
            <div class="panel-header"><h2>比較結果</h2></div>
            <div class="panel-body image-compare-group-list">
              ${compareGroups.map(renderImageCompareGroup).join("")}
            </div>
          </section>
        ` : ""}
        <section class="panel">
          <div class="panel-header"><h2>生成履歴</h2></div>
          <div class="panel-body image-job-list">
            ${jobs.length ? jobs.map(renderImageJob).join("") : `<div class="empty compact">生成画像はまだありません。</div>`}
          </div>
        </section>
      </section>
    </div>
  `;
}

function renderComfyAnimation() {
  const job = activeImageJob();
  const status = job?.status || (state.imageIsGenerating ? "submitting" : "pending");
  const progress = imageJobProgress(job);
  const elapsed = elapsedVideoText(job);
  const updatedAt = job?.updatedAt ? new Date(job.updatedAt).toLocaleTimeString("ja-JP") : "";
  const detail = [
    imageStatusLabel(status),
    progress !== null ? `${progress}%` : "",
    elapsed ? `経過 ${elapsed}` : "",
    updatedAt ? `最終更新 ${updatedAt}` : ""
  ].filter(Boolean).join(" / ");
  return `
    <div class="seedance-animation image-generating">
      <div class="image-loader"><span></span><span></span><span></span><span></span></div>
      <div class="generation-status">
        <strong>画像生成中</strong>
        <div class="progress-track ${progress === null ? "indeterminate" : ""}">
          <span style="width:${progress === null ? 38 : progress}%"></span>
        </div>
        <div class="meta">${escapeHtml(detail || "完了後に画像一覧へ保存します。")}</div>
        ${job?.progressMessage ? `<div class="meta">${escapeHtml(job.progressMessage)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderImageJob(job) {
  const work = byId(state.db.works, job.workId);
  const char = byId(state.db.characters, job.characterId);
  const progress = imageJobProgress(job);
  const status = job.status;
  const loraText = activeComfyLoras(job.settings?.loras).map((item) => item.name).join(", ");
  const referenceText = (job.settings?.references || []).map((item) => item.name || item.key).filter(Boolean).join(", ");
  const compareText = job.compareGroupId ? `${imageCompareModeLabel(job.compareMode)}比較 ${job.compareIndex !== null ? `${job.compareIndex + 1}/${job.compareTotal || "?"}` : ""}${job.compareLabel ? ` / ${job.compareLabel}` : ""}` : "";
  return `
    <article class="image-job ${status}">
      <div>
        <div class="char-name">${escapeHtml(job.title || "生成画像")}</div>
        <div class="meta">${compareText ? `${escapeHtml(compareText)} / ` : ""}${escapeHtml(work?.name || "全作品")} / ${char ? `${escapeHtml(char.name)} / ` : ""}${escapeHtml(imageGpuLabel(job.gpuMode))} / ${escapeHtml(imageStatusLabel(status))}${progress !== null ? ` ${escapeHtml(`${progress}%`)}` : ""}${loraText ? ` / LoRA: ${escapeHtml(loraText)}` : ""}${referenceText ? ` / 参照: ${escapeHtml(referenceText)}` : ""} / ${job.updatedAt ? escapeHtml(new Date(job.updatedAt).toLocaleString("ja-JP")) : ""}</div>
      </div>
      ${activeImageJobStatuses.includes(status) ? `
        <div class="progress-track ${progress === null ? "indeterminate" : ""}">
          <span style="width:${progress === null ? 38 : progress}%"></span>
        </div>
      ` : ""}
      ${job.images?.length ? `<div class="generated-image-grid">${job.images.map((image) => `<img class="generated-image" src="${escapeHtml(image.url)}" alt="">`).join("")}</div>` : ""}
      <div class="result-text">${escapeHtml(compactPromptText(job.prompt, 900))}</div>
      ${job.negativePrompt ? `<div class="meta">Negative</div><div class="result-text">${escapeHtml(compactPromptText(job.negativePrompt, 600))}</div>` : ""}
      <div class="card-actions">
        <button class="ghost" data-action="refresh-image-job" data-id="${job.id}" ${!job.providerTaskId || ["succeeded", "cancelled"].includes(status) ? "disabled" : ""}>更新</button>
        <button class="ghost" data-action="adopt-image-job" data-id="${job.id}">採用</button>
        <button class="ghost" data-action="copy-image-job-prompt" data-id="${job.id}">プロンプト</button>
      </div>
      ${job.images?.map((image) => image.localPath ? `<div class="meta">保存先: ${escapeHtml(image.localPath)}</div>` : "").join("") || ""}
      ${job.error ? `<div class="meta danger-text">${escapeHtml(job.error)}</div>` : ""}
    </article>
  `;
}

function buildImageAgentSystemPrompt() {
  return `あなたは画像生成モデル向けのプロンプト編集者です。ユーザーのチャット、作品情報、世界観、キャラ情報を読み、ComfyUIに送るプロンプト案を作ります。

必ず次のJSONだけを返してください。
{
  "message": "ユーザーに見せる日本語の返答。",
  "ready": true または false,
  "questions": ["必要な確認事項"],
  "draft": {
    "title": "短いタイトル",
    "prompt": "英語のポジティブプロンプト",
    "negativePrompt": "英語のネガティブプロンプト",
    "width": 512から2048の整数,
    "height": 512から2048の整数,
    "steps": 1から150の整数,
    "cfg": 0から30の数値,
    "seed": ""
  }
}

画像生成プロンプトの優先ルール:
- キャラの固定要素、作品情報、世界観設定を優先し、未設定の固有名詞や設定を捏造しない。
- PromptはSubject -> Appearance -> Clothing -> Pose -> Environment -> Lighting -> Style -> Qualityの順にまとめる。
- Negativeには低品質、崩れ、文字、透かし、余分な指などを入れる。
- 画面設定やGPU設定は現在のUI値を尊重し、必要なときだけ調整案に含める。`;
}

function buildImageAgentText(inputText, controls) {
  const selectedChar = byId(state.db.characters, controls.characterId || state.imageCharacterId);
  const work = byId(state.db.works, selectedChar?.workId) || byId(state.db.works, controls.workId) || byId(state.db.works, state.selectedWorkId);
  const chars = selectedChar ? [selectedChar] : work ? charactersForWork(work.id).slice(0, 12) : [];
  const loraText = activeComfyLoras(controls.loras).map((item) => `${item.name}(model=${item.strengthModel}, clip=${item.strengthClip})`).join(", ") || "なし";
  const referenceText = activeComfyReferenceSlots(controls.referenceSlots)
    .map((item) => `${item.name || item.key} -> node ${item.nodeId}.${item.inputName || "image"}`)
    .join(", ") || "なし";
  const charText = chars.map((char) => [
    `名前=${char.name}`,
    `メモ=${compactPromptText(char.memo, 460)}`,
    `生成プロンプト=${compactPromptText(char.basePrompt, 620)}`,
    `NG=${compactPromptText(char.negativePrompt, 260)}`
  ].join(" / ")).join("\n");
  const history = state.imageChatMessages.slice(-10).map((message) => `${message.role}: ${message.content}`).join("\n");
  return `ユーザー入力:
${inputText}

現在の設定:
gpu=${controls.gpuMode}, width=${controls.width}, height=${controls.height}, steps=${controls.steps}, cfg=${controls.cfg}, sampler=${controls.samplerName}, scheduler=${controls.scheduler}, batch=${controls.batchSize}, checkpoint=${controls.checkpoint || "workflow既定"}, lora=${loraText}, reference=${referenceText}

作品情報 / 世界観:
${buildPromptLabWorldContext(work)}

参照キャラ:
${charText || "未指定"}

直近チャット:
${history}

返答では、足りない情報がある場合も、今ある情報で暫定案が作れるなら draft を入れてください。`;
}

function mergeImageDraft(result, fallbackControls) {
  const source = result?.draft || result?.proposal || result?.image || {};
  if (!source.prompt && result?.prompt) source.prompt = result.prompt;
  if (!source.prompt) return null;
  return {
    title: source.title || fallbackControls.title || "生成画像",
    prompt: source.prompt || "",
    negativePrompt: source.negativePrompt || source.negative_prompt || fallbackControls.negativePrompt || "",
    width: Number(source.width || fallbackControls.width || 1024),
    height: Number(source.height || fallbackControls.height || 1024),
    steps: Number(source.steps || fallbackControls.steps || 28),
    cfg: Number(source.cfg || fallbackControls.cfg || 7),
    samplerName: source.samplerName || source.sampler_name || fallbackControls.samplerName,
    scheduler: source.scheduler || fallbackControls.scheduler,
    batchSize: Number(source.batchSize || source.batch_size || fallbackControls.batchSize || 1),
    seed: source.seed ?? fallbackControls.seed ?? "",
    checkpoint: source.checkpoint || source.ckpt_name || fallbackControls.checkpoint || "",
    loras: normalizedComfyLoras(source.loras || fallbackControls.loras || []),
    referenceSlots: normalizedComfyReferenceSlots(fallbackControls.referenceSlots || []),
    agentNote: source.agentNote || source.note || result?.message || ""
  };
}

async function handleImageAgentMessage(forceDraft = false) {
  const chatInput = document.querySelector("#image-chat-input");
  const input = chatInput?.value.trim();
  const message = input || (forceDraft ? "ここまでの会話と選択中の作品・キャラ設定から、画像生成用のプロンプト案を作ってください。" : "");
  if (!message) return toast("メッセージを入力してください。");
  const controls = imageControlsFromDom();
  state.imageWorkId = controls.workId || null;
  state.imageCharacterId = controls.characterId || "";
  state.imageGpuMode = controls.gpuMode;
  state.imageChatDraft = "";
  if (chatInput) chatInput.value = "";
  state.imageChatMessages.push({ role: "user", content: message });
  state.imageIsThinking = true;
  render();
  try {
    toastApiSubmitted("画像プロンプト作成APIに送信しました。返答を待っています。");
    const content = await callOpenRouter({
      purpose: "image",
      temperature: 0.45,
      maxTokens: 2600,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: buildImageAgentSystemPrompt() },
        { role: "user", content: buildImageAgentText(message, controls) }
      ]
    });
    const result = parseAiJson(content);
    state.imageChatMessages.push({ role: "assistant", content: result.message || result.answer || "画像案を更新しました。" });
    const draft = mergeImageDraft(result, controls);
    if (draft) state.imagePromptDraft = { ...(state.imagePromptDraft || {}), ...draft };
    state.imageIsThinking = false;
    render({ preserveLiveTextDrafts: !draft });
  } catch (error) {
    state.imageIsThinking = false;
    state.imageChatMessages.push({ role: "assistant", content: `エラー: ${error.message}${debugChatText(error)}` });
    render();
  }
}

async function registerComfyImagesAsAssets(job, images = []) {
  const work = byId(state.db.works, job.workId);
  const char = byId(state.db.characters, job.characterId);
  const existing = new Set((state.db.assets || []).filter((asset) => asset.sourceJobId === job.id).map((asset) => asset.url));
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (!image.url || existing.has(image.url)) continue;
    const info = await getImageInfo(image.url);
    state.db.assets.unshift({
      id: uid(),
      workId: work?.id || char?.workId || null,
      characterId: char?.id || null,
      worldItemId: null,
      name: images.length > 1 ? `${job.title || "生成画像"} ${index + 1}` : job.title || "生成画像",
      url: image.url,
      localPath: image.localPath || image.path || "",
      width: info.width || null,
      height: info.height || null,
      aspectRatio: info.aspectRatio || null,
      aspectRatioText: info.aspectRatioText || "",
      status: char ? "matched" : "unassigned",
      confidence: char ? 1 : null,
      aiPromptFormat: "natural",
      aiPrompt: job.prompt || "",
      aiNegativePrompt: job.negativePrompt || "",
      aiReason: "ComfyUIで生成した画像です。",
      source: "comfy",
      sourceJobId: job.id,
      createdAt: new Date().toISOString()
    });
    existing.add(image.url);
  }
}

async function validateComfyControls(controls, { renderResult = true } = {}) {
  if (!controls.workflowJson) {
    const result = { ok: false, errors: ["設定画面で ComfyUI workflow JSON を保存してください。"], warnings: [], summary: {} };
    state.comfyValidation = result;
    if (renderResult) render({ preserveLiveTextDrafts: true });
    return result;
  }
  if (renderResult) {
    state.comfyValidation = { status: "loading" };
    render({ preserveLiveTextDrafts: true });
  }
  try {
    const result = await postJson("/api/comfy/validate", controls);
    state.comfyValidation = result;
    if (renderResult) render({ preserveLiveTextDrafts: true });
    return result;
  } catch (error) {
    const result = error.payload || { ok: false, errors: [error.message], warnings: [], summary: {} };
    if (!Array.isArray(result.errors) || !result.errors.length) result.errors = [error.message];
    state.comfyValidation = result;
    if (renderResult) render({ preserveLiveTextDrafts: true });
    return result;
  }
}

async function validateCurrentComfyWorkflow() {
  if (state.view === "settings") saveComfySettingsFromDom();
  const settings = activeComfySettings();
  const controls = state.view === "image"
    ? imageControlsFromDom()
    : {
        ...settings,
        prompt: "__validation_prompt__",
        negativePrompt: "",
        baseUrl: activeComfyBaseUrl(settings.gpuMode),
        apiKey: activeComfyApiKey(settings.gpuMode)
      };
  if (state.view === "image") rememberImageControls(controls);
  const result = await validateComfyControls(controls);
  if (result.ok) {
    toast((result.warnings || []).length ? "事前チェックは通りました。注意があります。" : "ComfyUI workflowの事前チェックはOKです。");
  } else {
    toast((result.errors || [])[0] || "ComfyUI workflowの事前チェックで問題が見つかりました。");
  }
  return result;
}

function selectedComfyPresetId() {
  return document.querySelector("#image-comfy-preset")?.value
    || document.querySelector("#setting-comfy-preset")?.value
    || "";
}

function openComfyPresetModal() {
  const settings = currentComfySettingsForPreset();
  const defaultName = [
    settings.checkpoint || "workflow既定",
    `${settings.width}x${settings.height}`,
    activeComfyLoras(settings.loras).map((item) => item.name).join("+")
  ].filter(Boolean).join(" / ");
  openModal(
    "Comfyプリセット保存",
    `
      <div class="form-grid">
        <label class="full">名前<input id="comfy-preset-name" value="${escapeHtml(defaultName || "Comfyプリセット")}"></label>
        <label class="full">メモ<textarea id="comfy-preset-memo" placeholder="例：立ち絵、背景、表情差分、線画確認など"></textarea></label>
      </div>
    `,
    `<button data-action="save-comfy-preset-modal">保存</button>`,
    (modal, close) => {
      modal.querySelector("[data-action='save-comfy-preset-modal']").addEventListener("click", async () => {
        const name = modal.querySelector("#comfy-preset-name").value.trim() || "Comfyプリセット";
        const memo = modal.querySelector("#comfy-preset-memo").value.trim();
        state.db.settings.comfyPresets = [
          ...comfyPresets(),
          {
            id: uid(),
            name,
            memo,
            settings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        await saveDb();
        close();
        render({ preserveLiveTextDrafts: true });
        toast(`Comfyプリセット「${name}」を保存しました。`);
      });
    }
  );
}

async function applySelectedComfyPreset() {
  if (state.view === "settings") saveComfySettingsFromDom();
  const id = selectedComfyPresetId();
  if (!id) return toast("Comfyプリセットを選択してください。");
  const preset = comfyPresets().find((item) => item.id === id);
  if (!preset || !applyComfyPreset(id)) return toast("Comfyプリセットが見つかりません。");
  await saveDb();
  render({ preserveLiveTextDrafts: true });
  toast(`Comfyプリセット「${preset.name}」を適用しました。`);
}

async function updateSelectedComfyPreset() {
  const id = selectedComfyPresetId();
  const presets = comfyPresets();
  const index = presets.findIndex((item) => item.id === id);
  if (index === -1) return toast("上書きするComfyプリセットを選択してください。");
  const ok = window.confirm(`Comfyプリセット「${presets[index].name}」を現在値で上書きします。`);
  if (!ok) return;
  presets[index] = {
    ...presets[index],
    settings: currentComfySettingsForPreset(),
    updatedAt: new Date().toISOString()
  };
  state.db.settings.comfyPresets = presets;
  await saveDb();
  render({ preserveLiveTextDrafts: true });
  toast("Comfyプリセットを上書きしました。");
}

async function deleteSelectedComfyPreset() {
  const id = selectedComfyPresetId();
  const presets = comfyPresets();
  const preset = presets.find((item) => item.id === id);
  if (!preset) return toast("削除するComfyプリセットを選択してください。");
  const ok = window.confirm(`Comfyプリセット「${preset.name}」を削除します。`);
  if (!ok) return;
  state.db.settings.comfyPresets = presets.filter((item) => item.id !== id);
  await saveDb();
  render({ preserveLiveTextDrafts: true });
  toast("Comfyプリセットを削除しました。");
}

function comfySettingsSnapshotFromControls(controls) {
  return {
    width: controls.width,
    height: controls.height,
    steps: controls.steps,
    cfg: controls.cfg,
    samplerName: controls.samplerName,
    scheduler: controls.scheduler,
    batchSize: controls.batchSize,
    seed: controls.seed,
    checkpoint: controls.checkpoint,
    loras: controls.loras,
    references: controls.references,
    referenceSlots: comfyReferenceSlotSettings(controls.referenceSlots),
    baseUrl: controls.baseUrl
  };
}

function persistImageGenerationState(controls, prompt = controls.prompt.trim()) {
  const selectedChar = byId(state.db.characters, controls.characterId);
  const work = byId(state.db.works, selectedChar?.workId || controls.workId);
  state.db.settings.comfy = {
    ...activeComfySettings(),
    gpuMode: controls.gpuMode,
    width: controls.width,
    height: controls.height,
    steps: controls.steps,
    cfg: controls.cfg,
    samplerName: controls.samplerName,
    scheduler: controls.scheduler,
    batchSize: controls.batchSize,
    seed: controls.seed,
    checkpoint: controls.checkpoint,
    loras: controls.loras,
    referenceSlots: comfyReferenceSlotSettings(controls.referenceSlots)
  };
  state.imageGpuMode = controls.gpuMode;
  state.imageWorkId = work?.id || controls.workId || null;
  state.imageCharacterId = selectedChar?.id || "";
  state.imageCompareEnabled = Boolean(controls.compareEnabled);
  state.imageCompareCount = imageCompareCountValue(controls.compareCount);
  state.imageCompareMode = normalizeImageCompareMode(controls.compareMode);
  state.imagePromptDraft = {
    ...(state.imagePromptDraft || {}),
    title: controls.title,
    prompt,
    negativePrompt: controls.negativePrompt,
    width: controls.width,
    height: controls.height,
    steps: controls.steps,
    cfg: controls.cfg,
    samplerName: controls.samplerName,
    scheduler: controls.scheduler,
    batchSize: controls.batchSize,
    seed: controls.seed,
    checkpoint: controls.checkpoint,
    loras: controls.loras,
    referenceSlots: controls.referenceSlots,
    compareEnabled: state.imageCompareEnabled,
    compareCount: state.imageCompareCount,
    compareMode: state.imageCompareMode
  };
  return { selectedChar, work };
}

function buildImageJobFromControls(controls, overrides = {}) {
  const selectedChar = byId(state.db.characters, controls.characterId);
  const work = byId(state.db.works, selectedChar?.workId || controls.workId);
  return normalizeImageJob({
    id: uid(),
    workId: work?.id || controls.workId || null,
    characterId: selectedChar?.id || null,
    title: overrides.title || controls.title,
    prompt: overrides.prompt || controls.prompt.trim(),
    negativePrompt: controls.negativePrompt,
    gpuMode: controls.gpuMode,
    status: "submitting",
    settings: comfySettingsSnapshotFromControls(controls),
    compareGroupId: overrides.compareGroupId || "",
    compareGroupTitle: overrides.compareGroupTitle || "",
    compareIndex: overrides.compareIndex ?? null,
    compareTotal: overrides.compareTotal ?? null,
    compareMode: overrides.compareMode || "",
    compareLabel: overrides.compareLabel || "",
    progress: 0,
    progressMessage: "送信中",
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.createdAt || new Date().toISOString()
  });
}

function buildImageComparisonVariants(controls) {
  const count = imageCompareCountValue(controls.compareCount);
  const mode = normalizeImageCompareMode(controls.compareMode);
  const groupId = uid();
  const groupTitle = `${controls.title || "生成画像"} / ${imageCompareModeLabel(mode)}比較`;
  const baseSeed = fixedComparisonSeed(controls.seed);
  const baseCfg = boundedSettingNumber(controls.cfg, 7, 0, 30);
  const baseSteps = boundedSettingNumber(controls.steps, 28, 1, 150, true);
  const center = (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => {
    const variant = { ...controls, compareEnabled: false };
    let label = "";
    if (mode === "cfg") {
      variant.seed = String(baseSeed);
      variant.cfg = boundedSettingNumber(baseCfg + ((index - center) * 0.5), baseCfg, 0, 30);
      label = `CFG ${variant.cfg}`;
    } else if (mode === "steps") {
      variant.seed = String(baseSeed);
      variant.steps = boundedSettingNumber(baseSteps + Math.round((index - center) * 4), baseSteps, 1, 150, true);
      label = `Steps ${variant.steps}`;
    } else {
      variant.seed = String(baseSeed + index);
      label = `Seed ${variant.seed}`;
    }
    return {
      controls: variant,
      compareGroupId: groupId,
      compareGroupTitle: groupTitle,
      compareIndex: index,
      compareTotal: count,
      compareMode: mode,
      compareLabel: label
    };
  });
}

async function submitComfyImageJob(job, controls) {
  try {
    const payload = await postJson("/api/comfy/create", {
      ...controls,
      prompt: controls.prompt.trim()
    });
    job.providerPayload = payload.providerPayload || payload;
    job.request = payload.request || null;
    const providerError = readableError(payload.error) || readableError(payload.providerPayload?.error);
    if (providerError) throw new Error(providerError);
    job.providerTaskId = payload.id || payload.prompt_id || "";
    if (!job.providerTaskId) throw new Error("ComfyUIのprompt_idを取得できませんでした。");
    job.status = payload.status || "submitted";
    job.progress = payload.progress ?? job.progress ?? 0;
    job.progressMessage = "ComfyUIで生成待機中です。";
    job.updatedAt = new Date().toISOString();
    await saveDb();
    render();
    return true;
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    await saveDb();
    syncImageGenerationFlag();
    render();
    return false;
  }
}

async function startComfyGeneration() {
  const controls = imageControlsFromDom();
  const prompt = controls.prompt.trim();
  if (!controls.baseUrl) return toast(`${imageGpuLabel(controls.gpuMode)}のComfyUI URLを設定してください。`);
  if (!controls.workflowJson) return toast("設定画面で ComfyUI workflow JSON を保存してください。");
  if (!prompt) return toast("Comfy送信用プロンプトを入力してください。");
  rememberImageControls(controls);
  const validation = await validateComfyControls(controls);
  if (!validation.ok) {
    return toast((validation.errors || [])[0] || "ComfyUI workflowの事前チェックで問題が見つかりました。");
  }
  if (controls.compareEnabled) return startComfyComparisonGeneration({ ...controls, prompt });
  try {
    persistImageGenerationState(controls, prompt);
    const job = buildImageJobFromControls({ ...controls, prompt });
    state.db.imageJobs.unshift(job);
    state.imageIsGenerating = true;
    await saveDb();
    render();
    toastApiSubmitted("ComfyUIに画像生成を送信しました。返答を待っています。");
    const ok = await submitComfyImageJob(job, { ...controls, prompt });
    if (ok) {
      toast("画像生成タスクを開始しました。");
      await pollComfyJob(job.id);
    } else {
      toast(job.error || "画像生成タスクを開始できませんでした。");
    }
  } catch (error) {
    syncImageGenerationFlag();
    toast(error.message);
    await saveDb();
    render();
  }
}

async function startComfyComparisonGeneration(controls) {
  const variants = buildImageComparisonVariants(controls);
  const now = Date.now();
  persistImageGenerationState(controls, controls.prompt.trim());
  const jobs = variants.map((variant, index) => buildImageJobFromControls(variant.controls, {
    ...variant,
    prompt: controls.prompt.trim(),
    title: controls.title,
    createdAt: new Date(now + index).toISOString()
  }));
  state.db.imageJobs.unshift(...jobs);
  state.imageIsGenerating = true;
  await saveDb();
  render();
  toastApiSubmitted(`${jobs.length} 件の比較生成をComfyUIに送信します。返答を待っています。`);
  let submitted = 0;
  for (let index = 0; index < variants.length; index += 1) {
    const ok = await submitComfyImageJob(jobs[index], {
      ...variants[index].controls,
      prompt: controls.prompt.trim()
    });
    if (ok) submitted += 1;
  }
  syncImageGenerationFlag();
  await saveDb();
  render();
  jobs
    .filter((job) => job.providerTaskId && activeImageJobStatuses.includes(job.status))
    .forEach((job) => pollComfyJob(job.id));
  toast(submitted ? `${submitted} 件の比較生成タスクを開始しました。` : "比較生成タスクを開始できませんでした。");
}

async function adoptImageJob(jobId) {
  const job = byId(state.db.imageJobs || [], jobId);
  if (!job) return toast("採用する画像生成ジョブが見つかりません。");
  const settings = job.settings || {};
  const current = activeComfySettings();
  const referenceSlots = normalizedComfyReferenceSlots(settings.referenceSlots || settings.references || []);
  const nextControls = {
    ...current,
    gpuMode: job.gpuMode,
    workId: job.workId || "",
    characterId: job.characterId || "",
    title: job.title || "生成画像",
    prompt: job.prompt || "",
    negativePrompt: job.negativePrompt || "",
    width: settings.width ?? current.width,
    height: settings.height ?? current.height,
    steps: settings.steps ?? current.steps,
    cfg: settings.cfg ?? current.cfg,
    samplerName: settings.samplerName || current.samplerName,
    scheduler: settings.scheduler || current.scheduler,
    batchSize: settings.batchSize ?? current.batchSize,
    seed: settings.seed ?? "",
    checkpoint: settings.checkpoint || "",
    loras: normalizedComfyLoras(settings.loras || []),
    referenceSlots,
    references: activeComfyReferenceSlots(referenceSlots),
    compareEnabled: false,
    compareCount: state.imageCompareCount,
    compareMode: state.imageCompareMode
  };
  persistImageGenerationState(nextControls, nextControls.prompt);
  state.imageCompareEnabled = false;
  state.imagePromptDraft.compareEnabled = false;
  await saveDb();
  render({ preserveLiveTextDrafts: true });
  toast("比較案を生成設定に反映しました。");
}

async function pollComfyJob(jobId) {
  const job = byId(state.db.imageJobs || [], jobId);
  if (job && !activeImageJobStatuses.includes(job.status) && job.status !== "failed") {
    syncImageGenerationFlag();
    if (state.imagePollingJobId === job.id) state.imagePollingJobId = "";
    render();
    return;
  }
  if (!job?.providerTaskId) {
    syncImageGenerationFlag();
    if (state.imagePollingJobId === job?.id) state.imagePollingJobId = "";
    return;
  }
  const baseUrl = job.settings?.baseUrl || activeComfyBaseUrl(job.gpuMode);
  const apiKey = activeComfyApiKey(job.gpuMode);
  const work = byId(state.db.works, job.workId);
  state.imagePollingJobId = job.id;
  render();
  try {
    const payload = await postJson("/api/comfy/status", {
      baseUrl,
      apiKey,
      promptId: job.providerTaskId,
      workName: work?.name || "",
      title: job.title || "生成画像"
    });
    job.status = payload.status || job.status;
    job.progress = payload.progress ?? (job.status === "succeeded" ? 100 : job.progress ?? null);
    job.progressMessage = payload.progressMessage || job.progressMessage || "";
    job.providerPayload = payload.providerPayload || payload;
    if (Array.isArray(payload.images) && payload.images.length) {
      job.images = payload.images.map((image) => ({
        url: image.url,
        localPath: image.path || image.localPath || "",
        nodeId: image.nodeId || "",
        filename: image.filename || ""
      }));
      await registerComfyImagesAsAssets(job, job.images);
    }
    if (payload.error) job.error = readableError(payload.error);
    job.updatedAt = new Date().toISOString();
    await saveDb();
    const done = ["succeeded", "failed", "cancelled"].includes(job.status);
    if (done) {
      syncImageGenerationFlag();
      state.imagePollingJobId = "";
      toast(job.status === "succeeded" ? "生成画像を画像一覧へ保存しました。" : `画像生成タスクが ${imageStatusLabel(job.status)} で終了しました。`);
      render();
      return;
    }
    window.setTimeout(() => pollComfyJob(job.id), 8000);
  } catch (error) {
    syncImageGenerationFlag();
    state.imagePollingJobId = "";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    await saveDb();
    toast(error.message);
    render();
  }
}

async function discardImageWaitingJobs() {
  const activeJobs = (state.db.imageJobs || []).filter((job) => activeImageJobStatuses.includes(job.status));
  state.imageIsGenerating = false;
  state.imagePollingJobId = "";
  if (!activeJobs.length) {
    render();
    return toast("待機中の画像生成はありません。");
  }
  activeJobs.forEach((job) => {
    job.status = "cancelled";
    if (job.providerTaskId) job.cancelledProviderTaskId = job.providerTaskId;
    job.error = "ユーザー操作で待機状態を破棄しました。ComfyUI側の生成自体は停止できない場合があります。";
    job.updatedAt = new Date().toISOString();
  });
  await saveDb();
  render();
  toast(`${activeJobs.length} 件の待機中ジョブを破棄しました。`);
}

async function uploadIrodoriReferenceFile(file) {
  if (!file || !file.type.startsWith("audio/")) return toast("音声ファイルを選択してください。");
  const selectedChar = byId(state.db.characters, state.audioCharacterId);
  const work = byId(state.db.works, selectedChar?.workId || state.audioWorkId || state.selectedWorkId);
  try {
    const dataUrl = await fileToDataUrl(file);
    const uploaded = await postJson("/api/media-upload", {
      dataUrl,
      name: file.name,
      workName: work?.name
    });
    state.audioIrodoriReference = {
      name: file.name,
      url: uploaded.url,
      localPath: uploaded.path,
      mimeType: uploaded.mimeType || file.type
    };
    render();
    toast("Irodori-TTSの参照音声を設定しました。");
  } catch (error) {
    toast(error.message);
  }
}

function renderTtsVoiceOptions(selectedVoice = "Kore") {
  const current = ttsVoices.some(([voice]) => voice === selectedVoice) ? selectedVoice : "Kore";
  return ttsVoices.map(([voice, label]) => `<option value="${voice}" ${voice === current ? "selected" : ""}>${escapeHtml(voice)} (${escapeHtml(label)})</option>`).join("");
}

function elevenLabsVoiceLabel(voice) {
  const labelBits = [
    voice.name || voice.voiceId,
    voice.category,
    voice.labels?.gender,
    voice.labels?.accent
  ].filter(Boolean);
  return labelBits.join(" / ");
}

function renderElevenLabsVoiceOptions(selectedVoiceId) {
  const current = String(selectedVoiceId || state.db.settings.elevenLabsVoiceId || "JBFqnCBsd6RMkjVDRZzb").trim();
  const options = [];
  const seen = new Set();
  if (current) {
    const savedVoice = state.elevenLabsVoices.find((voice) => voice.voiceId === current);
    options.push({
      value: current,
      label: savedVoice ? `${elevenLabsVoiceLabel(savedVoice)} / ${current}` : `${current} / 保存中`
    });
    seen.add(current);
  }
  state.elevenLabsVoices.forEach((voice) => {
    if (!voice.voiceId || seen.has(voice.voiceId)) return;
    options.push({
      value: voice.voiceId,
      label: `${elevenLabsVoiceLabel(voice)} / ${voice.voiceId}`
    });
    seen.add(voice.voiceId);
  });
  if (!options.length) options.push({ value: "", label: "音声一覧取得後に選択" });
  return options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === current ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
}

function elevenLabsModelLabel(model) {
  const modelId = model.modelId || model;
  const name = model.name || elevenLabsModelNames[modelId] || modelId;
  const traits = [];
  if (model.canUseStyle) traits.push("style");
  if (model.canUseSpeakerBoost) traits.push("speaker boost");
  if (Array.isArray(model.languages) && model.languages.length) traits.push(`${model.languages.length} languages`);
  return `${name} / ${modelId}${traits.length ? ` / ${traits.join(", ")}` : ""}`;
}

function elevenLabsModelItems(selectedModelId) {
  const current = String(selectedModelId || state.db.settings.elevenLabsModelId || "eleven_multilingual_v2").trim();
  const options = [];
  const seen = new Set();
  state.elevenLabsModels.forEach((model) => {
    if (!model.modelId || seen.has(model.modelId)) return;
    options.push(model);
    seen.add(model.modelId);
  });
  elevenLabsModelOptions.forEach((modelId) => {
    if (seen.has(modelId)) return;
    options.push({ modelId, name: elevenLabsModelNames[modelId] || modelId });
    seen.add(modelId);
  });
  if (current && !seen.has(current)) options.unshift({ modelId: current, name: `${current} / 保存中` });
  return options;
}

function renderElevenLabsModelOptions(selectedModelId) {
  const current = String(selectedModelId || state.db.settings.elevenLabsModelId || "eleven_multilingual_v2").trim();
  return elevenLabsModelItems(current)
    .map((model) => `<option value="${escapeHtml(model.modelId)}" ${model.modelId === current ? "selected" : ""}>${escapeHtml(elevenLabsModelLabel(model))}</option>`)
    .join("");
}

function voiceboxProfileLabel(profile) {
  const bits = [
    profile.name || profile.id,
    profile.language,
    profile.defaultEngine || profile.presetEngine || profile.voiceType,
    profile.id
  ].filter(Boolean);
  return bits.join(" / ");
}

function renderVoiceboxProfileOptions(selectedProfileId) {
  const current = String(selectedProfileId || state.db.settings.voiceboxProfileId || "").trim();
  const options = [];
  const seen = new Set();
  if (current) {
    const savedProfile = state.voiceboxProfiles.find((profile) => profile.id === current);
    options.push({
      value: current,
      label: savedProfile ? voiceboxProfileLabel(savedProfile) : `${current} / 保存中`
    });
    seen.add(current);
  }
  state.voiceboxProfiles.forEach((profile) => {
    if (!profile.id || seen.has(profile.id)) return;
    options.push({
      value: profile.id,
      label: voiceboxProfileLabel(profile)
    });
    seen.add(profile.id);
  });
  if (!options.length) options.push({ value: "", label: "プロファイル取得後に選択" });
  return options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === current ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
}

function renderAudioProviderOptions(selectedProvider = "openrouter") {
  const current = normalizedAudioProvider(selectedProvider);
  return audioProviders.map(([provider, label]) => `<option value="${provider}" ${provider === current ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function renderSimpleOptions(options, selected) {
  return options.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function renderIrodoriParameters(params, referenceAudio) {
  const settings = normalizedIrodoriSettings(params);
  return `
    <div class="irodori-settings full">
      <label>モード
        <select id="audio-irodori-mode">
          <option value="VoiceDesign" ${settings.mode === "VoiceDesign" ? "selected" : ""}>VoiceDesign</option>
          <option value="Reference" ${settings.mode === "Reference" ? "selected" : ""}>Reference</option>
        </select>
      </label>
      <label>候補数
        <input id="audio-irodori-candidates" type="number" min="1" max="4" step="1" value="${settings.numCandidates}">
      </label>
      <label class="full">声の指定 / キャプション
        <textarea id="audio-irodori-caption" rows="3">${escapeHtml(settings.caption)}</textarea>
      </label>
      <label>Steps
        <input id="audio-irodori-steps" type="number" min="8" max="80" step="1" value="${settings.numSteps}">
      </label>
      <label>Seed
        <input id="audio-irodori-seed" placeholder="空欄でランダム" value="${escapeHtml(settings.seed)}">
      </label>
      <label>Text CFG
        <input id="audio-irodori-cfg-text" type="number" min="0" max="10" step="0.1" value="${settings.cfgScaleText}">
      </label>
      <label>Caption CFG
        <input id="audio-irodori-cfg-caption" type="number" min="0" max="10" step="0.1" value="${settings.cfgScaleCaption}">
      </label>
      <label>Speaker CFG
        <input id="audio-irodori-cfg-speaker" type="number" min="0" max="10" step="0.1" value="${settings.cfgScaleSpeaker}">
      </label>
      <label>モデル精度
        <select id="audio-irodori-model-precision">${renderSimpleOptions(["bf16", "fp32"], settings.modelPrecision)}</select>
      </label>
      <label>モデルデバイス
        <select id="audio-irodori-model-device">${renderSimpleOptions(["auto", "mps", "cuda", "cpu"], settings.modelDevice)}</select>
      </label>
      <label>Codecデバイス
        <select id="audio-irodori-codec-device">${renderSimpleOptions(["auto", "mps", "cuda", "cpu"], settings.codecDevice)}</select>
      </label>
      <label>Codec精度
        <select id="audio-irodori-codec-precision">${renderSimpleOptions(["bf16", "fp32"], settings.codecPrecision)}</select>
      </label>
      <label class="full">カスタムチェックポイント
        <input id="audio-irodori-checkpoint" placeholder="空欄なら公式HFモデルを使用" value="${escapeHtml(settings.customCheckpoint)}">
      </label>
      <label class="full">Reference用の参照音声
        <input id="audio-irodori-reference-file" type="file" accept="audio/*">
      </label>
      ${referenceAudio?.url ? `
        <div class="full irodori-reference">
          <div>
            <strong>${escapeHtml(referenceAudio.name || "参照音声")}</strong>
            <div class="meta">Referenceモードで使います。</div>
          </div>
          <audio controls preload="none" src="${escapeHtml(referenceAudio.url)}"></audio>
          <button class="ghost" data-action="clear-irodori-reference">解除</button>
        </div>
      ` : `<div class="full meta">Referenceモードでは参照音声を指定できます。未指定でも --no-ref で生成できます。</div>`}
    </div>
  `;
}

function elevenLabsSettingsFromControls(source = {}) {
  return {
    voiceId: String(source.voiceId || state.db.settings.elevenLabsVoiceId || "JBFqnCBsd6RMkjVDRZzb").trim(),
    modelId: String(source.modelId || state.db.settings.elevenLabsModelId || "eleven_multilingual_v2").trim() || "eleven_multilingual_v2",
    outputFormat: String(source.outputFormat || state.db.settings.elevenLabsOutputFormat || "mp3_44100_128").trim() || "mp3_44100_128",
    stability: boundedSettingNumber(source.stability ?? state.db.settings.elevenLabsStability, 0.5, 0, 1),
    similarityBoost: boundedSettingNumber(source.similarityBoost ?? state.db.settings.elevenLabsSimilarityBoost, 0.75, 0, 1),
    style: boundedSettingNumber(source.style ?? state.db.settings.elevenLabsStyle, 0, 0, 1),
    speed: boundedSettingNumber(source.speed ?? state.db.settings.elevenLabsSpeed, 1, 0.7, 1.2),
    useSpeakerBoost: source.useSpeakerBoost ?? state.db.settings.elevenLabsSpeakerBoost ?? true,
    languageCode: String(source.languageCode ?? state.db.settings.elevenLabsLanguageCode ?? "ja").trim(),
    seed: String(source.seed || "").trim()
  };
}

function renderElevenLabsParameters(params = {}) {
  const settings = elevenLabsSettingsFromControls(params);
  const voicesStatus = state.elevenLabsVoiceStatus === "loaded"
    ? `${state.elevenLabsVoices.length} 件の音声を読み込みました。`
    : state.elevenLabsVoiceStatus === "loading"
      ? "音声一覧を読み込み中です。"
      : state.elevenLabsVoiceError || "voice ID はElevenLabsのVoices画面、または音声一覧取得で選べます。";
  const modelsStatus = state.elevenLabsModelStatus === "loaded"
    ? `${state.elevenLabsModels.length} 件のTTS対応モデルを読み込みました。`
    : state.elevenLabsModelStatus === "loading"
      ? "モデル一覧を読み込み中です。"
      : state.elevenLabsModelError || "モデル未取得時は主要TTSモデルを候補表示します。";
  return `
    <div class="elevenlabs-settings full">
      <label class="full">Voice ID
        <select id="audio-elevenlabs-voice-id">${renderElevenLabsVoiceOptions(settings.voiceId)}</select>
      </label>
      <label>モデル
        <select id="audio-elevenlabs-model-id">${renderElevenLabsModelOptions(settings.modelId)}</select>
      </label>
      <label>出力形式
        <select id="audio-elevenlabs-output-format">${renderSimpleOptions(elevenLabsOutputFormats, settings.outputFormat)}</select>
      </label>
      <label>Stability
        <input id="audio-elevenlabs-stability" type="number" min="0" max="1" step="0.05" value="${settings.stability}">
      </label>
      <label>Similarity
        <input id="audio-elevenlabs-similarity" type="number" min="0" max="1" step="0.05" value="${settings.similarityBoost}">
      </label>
      <label>Style
        <input id="audio-elevenlabs-style" type="number" min="0" max="1" step="0.05" value="${settings.style}">
      </label>
      <label>Speed
        <input id="audio-elevenlabs-speed" type="number" min="0.7" max="1.2" step="0.05" value="${settings.speed}">
      </label>
      <label>言語コード
        <input id="audio-elevenlabs-language-code" placeholder="ja / en など" value="${escapeHtml(settings.languageCode)}">
      </label>
      <label>Seed
        <input id="audio-elevenlabs-seed" placeholder="空欄でランダム" value="${escapeHtml(settings.seed)}">
      </label>
      <label class="check-row full">
        <input id="audio-elevenlabs-speaker-boost" type="checkbox" ${settings.useSpeakerBoost ? "checked" : ""}>
        <span>Speaker Boostを使う</span>
      </label>
      <div class="full toolbar">
        <button class="ghost" data-action="load-elevenlabs-voices" ${state.elevenLabsVoiceStatus === "loading" ? "disabled" : ""}>音声一覧取得</button>
        <button class="ghost" data-action="load-elevenlabs-models" ${state.elevenLabsModelStatus === "loading" ? "disabled" : ""}>モデル一覧取得</button>
      </div>
      <div class="full meta">${escapeHtml(voicesStatus)}</div>
      <div class="full meta">${escapeHtml(modelsStatus)}</div>
    </div>
  `;
}

function renderVoiceboxParameters(params = {}) {
  const settings = voiceboxSettingsFromControls(params);
  const statusText = state.voiceboxProfileStatus === "loaded"
    ? `${state.voiceboxProfiles.length} 件のVoiceboxプロファイルを読み込みました。`
    : state.voiceboxProfileStatus === "loading"
      ? "Voiceboxプロファイルを読み込み中です。"
      : state.voiceboxProfileError || "Voiceboxアプリを起動して、プロファイル取得で声を選べます。";
  const languageOptions = Array.from(new Set([settings.language, ...voiceboxLanguageOptions].filter(Boolean)));
  const modelOptions = Array.from(new Set([settings.modelSize, ...voiceboxModelSizeOptions].filter(Boolean)));
  return `
    <div class="voicebox-settings full">
      <label class="full">Voicebox API URL
        <input id="audio-voicebox-base-url" value="${escapeHtml(settings.baseUrl)}" placeholder="http://127.0.0.1:17493">
      </label>
      <label class="full">プロファイル
        <select id="audio-voicebox-profile-id">${renderVoiceboxProfileOptions(settings.profileId)}</select>
      </label>
      <label>言語
        <select id="audio-voicebox-language">${languageOptions.map((language) => `<option value="${escapeHtml(language)}" ${language === settings.language ? "selected" : ""}>${escapeHtml(language)}</option>`).join("")}</select>
      </label>
      <label>Model size
        <select id="audio-voicebox-model-size">${modelOptions.map((modelSize) => `<option value="${escapeHtml(modelSize)}" ${modelSize === settings.modelSize ? "selected" : ""}>${escapeHtml(modelSize)}</option>`).join("")}</select>
      </label>
      <label>Seed
        <input id="audio-voicebox-seed" placeholder="空欄でランダム" value="${escapeHtml(settings.seed)}">
      </label>
      <div class="full toolbar">
        <button class="ghost" data-action="load-voicebox-profiles" ${state.voiceboxProfileStatus === "loading" ? "disabled" : ""}>プロファイル取得</button>
      </div>
      <div class="full meta">${escapeHtml(statusText)}</div>
    </div>
  `;
}

function audioCharacterOptions() {
  return state.db.characters.filter((char) => !state.audioWorkId || char.workId === state.audioWorkId);
}

function audioCharacterLabel(audio) {
  const char = byId(state.db.characters, audio.characterId);
  const work = byId(state.db.works, audio.workId || char?.workId);
  return `${char?.name || "キャラ指定なし"}${work ? ` / ${work.name}` : ""}`;
}

function audioControlsFromDom() {
  const selectedCharId = document.querySelector("#audio-character")?.value || state.audioCharacterId || "";
  const selectedChar = byId(state.db.characters, selectedCharId);
  const provider = normalizedAudioProvider(document.querySelector("#audio-provider")?.value || state.audioProvider || state.db.settings.audioProvider);
  const openRouterModel = normalizeOpenRouterTtsModel(
    document.querySelector("#audio-openrouter-model")?.value
    || state.audioPromptDraft?.audioModel
    || state.db.settings.audioModel
  );
  const openRouterResponseFormat = normalizeOpenRouterTtsResponseFormat(
    document.querySelector("#audio-openrouter-response-format")?.value
    || state.audioPromptDraft?.audioResponseFormat
    || state.db.settings.audioResponseFormat,
    openRouterModel
  );
  const openRouterVoice = normalizeOpenRouterTtsVoice(
    document.querySelector("#audio-voice")?.value
    || state.audioVoice
    || state.db.settings.audioVoice,
    openRouterModel
  );
  const audioInput = document.querySelector("#audio-input-text");
  const actingPrompt = (
    document.querySelector("#audio-acting-prompt")?.value
    || state.audioPromptDraft?.actingPrompt
    || (provider === "openrouter" ? state.audioPromptDraft?.caption : "")
    || state.db.settings.audioActingPrompt
    || defaultAudioActingPrompt
  ).trim();
  const irodori = normalizedIrodoriSettings({
    ...state.db.settings.irodoriDefaults,
    ...(state.audioPromptDraft || {}),
    mode: document.querySelector("#audio-irodori-mode")?.value || state.audioPromptDraft?.mode || state.db.settings.irodoriDefaults?.mode,
    caption: document.querySelector("#audio-irodori-caption")?.value || state.audioPromptDraft?.caption || state.db.settings.irodoriDefaults?.caption,
    modelDevice: document.querySelector("#audio-irodori-model-device")?.value || state.db.settings.irodoriDefaults?.modelDevice,
    modelPrecision: document.querySelector("#audio-irodori-model-precision")?.value || state.db.settings.irodoriDefaults?.modelPrecision,
    codecDevice: document.querySelector("#audio-irodori-codec-device")?.value || state.db.settings.irodoriDefaults?.codecDevice,
    codecPrecision: document.querySelector("#audio-irodori-codec-precision")?.value || state.db.settings.irodoriDefaults?.codecPrecision,
    numSteps: document.querySelector("#audio-irodori-steps")?.value || state.db.settings.irodoriDefaults?.numSteps,
    numCandidates: document.querySelector("#audio-irodori-candidates")?.value || state.db.settings.irodoriDefaults?.numCandidates,
    seed: document.querySelector("#audio-irodori-seed")?.value || "",
    cfgScaleText: document.querySelector("#audio-irodori-cfg-text")?.value || state.db.settings.irodoriDefaults?.cfgScaleText,
    cfgScaleCaption: document.querySelector("#audio-irodori-cfg-caption")?.value || state.db.settings.irodoriDefaults?.cfgScaleCaption,
    cfgScaleSpeaker: document.querySelector("#audio-irodori-cfg-speaker")?.value || state.db.settings.irodoriDefaults?.cfgScaleSpeaker,
    customCheckpoint: document.querySelector("#audio-irodori-checkpoint")?.value || ""
  });
  const elevenLabs = elevenLabsSettingsFromControls({
    voiceId: document.querySelector("#audio-elevenlabs-voice-id")?.value || state.audioPromptDraft?.elevenLabs?.voiceId,
    modelId: document.querySelector("#audio-elevenlabs-model-id")?.value || state.audioPromptDraft?.elevenLabs?.modelId,
    outputFormat: document.querySelector("#audio-elevenlabs-output-format")?.value || state.audioPromptDraft?.elevenLabs?.outputFormat,
    stability: document.querySelector("#audio-elevenlabs-stability")?.value || state.audioPromptDraft?.elevenLabs?.stability,
    similarityBoost: document.querySelector("#audio-elevenlabs-similarity")?.value || state.audioPromptDraft?.elevenLabs?.similarityBoost,
    style: document.querySelector("#audio-elevenlabs-style")?.value || state.audioPromptDraft?.elevenLabs?.style,
    speed: document.querySelector("#audio-elevenlabs-speed")?.value || state.audioPromptDraft?.elevenLabs?.speed,
    languageCode: document.querySelector("#audio-elevenlabs-language-code")?.value || state.audioPromptDraft?.elevenLabs?.languageCode,
    seed: document.querySelector("#audio-elevenlabs-seed")?.value || state.audioPromptDraft?.elevenLabs?.seed,
    useSpeakerBoost: document.querySelector("#audio-elevenlabs-speaker-boost")?.checked ?? state.audioPromptDraft?.elevenLabs?.useSpeakerBoost
  });
  const voicebox = voiceboxSettingsFromControls({
    baseUrl: document.querySelector("#audio-voicebox-base-url")?.value || state.audioPromptDraft?.voicebox?.baseUrl,
    profileId: document.querySelector("#audio-voicebox-profile-id")?.value || state.audioPromptDraft?.voicebox?.profileId,
    language: document.querySelector("#audio-voicebox-language")?.value || state.audioPromptDraft?.voicebox?.language,
    modelSize: document.querySelector("#audio-voicebox-model-size")?.value || state.audioPromptDraft?.voicebox?.modelSize,
    seed: document.querySelector("#audio-voicebox-seed")?.value || state.audioPromptDraft?.voicebox?.seed
  });
  return {
    provider,
    workId: selectedChar?.workId || document.querySelector("#audio-work")?.value || state.audioWorkId || state.selectedWorkId || "",
    characterId: selectedCharId,
    voice: provider === "elevenlabs"
      ? elevenLabs.voiceId
      : provider === "voicebox"
        ? voicebox.profileId
        : openRouterVoice,
    audioModel: openRouterModel,
    audioResponseFormat: openRouterResponseFormat,
    irodori,
    elevenLabs,
    voicebox,
    actingPrompt,
    caption: provider === "irodori" ? irodori.caption : actingPrompt,
    title: document.querySelector("#audio-title")?.value.trim() || state.audioPromptDraft?.title || "生成音声",
    input: audioInput ? audioInput.value : state.audioPromptDraft?.input || ""
  };
}

function composeGeminiTtsInput(text, actingPrompt) {
  const cleanText = String(text || "").trim();
  const cleanPrompt = String(actingPrompt || "").trim();
  if (!cleanPrompt) return cleanText;
  return `次の演技指示に従って、読み上げ本文だけを音声化してください。

演技指示:
${cleanPrompt}

読み上げ本文:
${cleanText}`;
}

function composeOpenRouterTtsInput(modelId, text, actingPrompt) {
  const cleanText = String(text || "").trim();
  const model = normalizeOpenRouterTtsModel(modelId);
  if (model === defaultOpenRouterTtsModel) return composeGeminiTtsInput(cleanText, actingPrompt);
  return cleanText;
}

function buildAudioAgentSystemPrompt() {
  const voices = [
    `Gemini TTS voices:\n${ttsVoices.map(([voice, label]) => `${voice}: ${label}`).join("\n")}`,
    `Grok Voice TTS voices:\n${grokTtsVoices.map(([voice, label]) => `${voice}: ${label}`).join("\n")}`
  ].join("\n\n");
  return `あなたは創作向けの音声演出エージェントです。ユーザーの要望、作品情報、キャラ情報から、音声生成に送る読み上げテキストを作ります。

必ず次のJSONだけを返してください。
{
  "message": "ユーザーに見せる日本語の返答。確認事項や作成意図を短く説明。",
  "ready": true または false,
  "questions": ["必要な確認事項"],
    "draft": {
      "title": "短い音声タイトル",
      "input": "実際に読み上げる本文。説明文や演技指示は入れず、台詞・ナレーションだけにする。本文中に [laughs] [whispers] [sighs] [excited] のような感情タグを必ず1つ以上入れる。",
      "voice": "下記ボイス名のどれか",
      "actingPrompt": "演技指示。声質、感情、速度、間、距離感、アクセントを書く。本文に入れた感情タグの意図も短く書く。",
      "caption": "Irodori-TTSで使う声質・演技・距離感の指定。actingPrompt と同じ方針でよい。",
      "agentNote": "演技意図の短いメモ"
    }
  }

音声作成ルール:
- APIに送るのは説明文ではなく、実際に読み上げる本文にする。
- draft.input には角括弧の感情タグを必ず1つ以上入れる。例: [laughs] [whispers] [sighs] [excited]。
- 感情タグは文脈に合う位置に置く。笑いなら [laughs]、囁きなら [whispers]、ため息なら [sighs]、強い感情や勢いなら [excited] を使う。
- キャラ指定がある場合は、キャラの性格、立場、メモ、作品世界に合う声色と台詞にする。
- キャラ指定がない場合は、ナレーションや汎用ボイスとして自然に使える本文にする。
- Gemini TTSの場合は actingPrompt に「低い声、怒りを抑える、少し速め、近い距離、語尾を弱める」などを具体的に書く。
- Gemini TTSでは input に [whispers] [laughs] [sighs] [excited] [short pause] などのインライン音声タグを少量だけ使える。感情タグは必須、間のタグは必要時だけ使う。
- Grok Voice TTSの場合は voice に eve / ara / rex / sal / leo のいずれかを使う。Grok向けタグは ${grokSpeechTags.join(" ")} を必要最小限だけ本文に入れられる。
- Grok Voice TTSでは actingPrompt は履歴・確認用メモとして保存し、APIへは本文とvoiceを主に送る。演技ニュアンスは本文内の自然な言葉と少量のタグに反映する。
- ElevenLabsの場合は voice ID と voice_settings が主な制御なので、input は読み上げ本文に集中し、actingPrompt は画面で確認・保存できる演技指示として短くまとめる。
- Voiceboxの場合は選択プロファイルで声が決まる。Qwen CustomVoice系では actingPrompt を自然言語の演技指示として使える。Chatterbox Turbo以外では角括弧タグがそのまま読まれる場合があるため、タグは必要最小限にする。
- 過剰な演技タグは避け、重要な間や感情だけに使う。1案につき1〜3個程度を目安にする。
- 日本語の台詞は日本語のまま自然に整える。英語に翻訳しない。
- Irodori-TTSの場合は caption に「低め、囁き、距離感、テンポ、感情」などの音声演出を書き、input には読み上げ本文だけを書く。

利用可能ボイス:
${voices}`;
}

function buildAudioAgentText(inputText, controls) {
  const selectedChar = byId(state.db.characters, controls.characterId || state.audioCharacterId);
  const work = byId(state.db.works, selectedChar?.workId) || byId(state.db.works, controls.workId) || byId(state.db.works, state.selectedWorkId);
  const chars = selectedChar ? [selectedChar] : work ? charactersForWork(work.id).slice(0, 12) : [];
  const charText = chars.map((char) => [
    `名前=${char.name}`,
    `メモ=${compactPromptText(char.memo, 460)}`,
    `生成プロンプト=${compactPromptText(char.basePrompt, 520)}`,
    `NG=${compactPromptText(char.negativePrompt, 220)}`
  ].join(" / ")).join("\n");
  const history = state.audioChatMessages.slice(-10).map((message) => `${message.role}: ${message.content}`).join("\n");
  return `ユーザー入力:
${inputText}

現在の設定:
provider=${controls.provider}, voice=${controls.voice}, openRouterTtsModel=${controls.audioModel || ""}, openRouterResponseFormat=${controls.audioResponseFormat || ""}, actingPrompt=${controls.actingPrompt || ""}, elevenLabsVoiceId=${controls.elevenLabs?.voiceId || ""}, elevenLabsModel=${controls.elevenLabs?.modelId || ""}, voiceboxProfileId=${controls.voicebox?.profileId || ""}, voiceboxLanguage=${controls.voicebox?.language || ""}, irodoriMode=${controls.irodori?.mode || "VoiceDesign"}, caption=${controls.irodori?.caption || ""}, title=${controls.title}, characterId=${controls.characterId || "未指定"}

作品情報 / 世界観:
${buildPromptLabWorldContext(work)}

参照キャラ:
${charText || "未指定"}

直近チャット:
${history}

返答では、今ある情報だけで作れる場合は draft を入れてください。`;
}

function mergeAudioDraft(result, fallbackControls) {
  const source = result?.draft || result?.proposal || result?.audio || {};
  if (!source.input && result?.input) source.input = result.input;
  if (!source.input && result?.text) source.input = result.text;
  if (!source.input) return null;
  const voice = source.voice || fallbackControls.voice || "Kore";
  const actingPrompt = String(
    source.actingPrompt
    || source.performancePrompt
    || source.direction
    || (fallbackControls.provider === "openrouter" ? source.caption : "")
    || fallbackControls.actingPrompt
    || fallbackControls.caption
    || defaultAudioActingPrompt
  ).trim();
  const taggedInput = ensureAudioEmotionTag(source.input || "", actingPrompt);
  const irodori = normalizedIrodoriSettings({ ...fallbackControls.irodori, caption: source.caption || actingPrompt || fallbackControls.irodori?.caption });
  const audioModel = fallbackControls.audioModel || state.db.settings.audioModel || defaultOpenRouterTtsModel;
  return {
    title: source.title || fallbackControls.title || "生成音声",
    input: taggedInput,
    voice: fallbackControls.provider === "openrouter" ? normalizeOpenRouterTtsVoice(voice, audioModel) : fallbackControls.voice || voice || "Kore",
    provider: fallbackControls.provider || "openrouter",
    audioModel,
    audioResponseFormat: fallbackControls.audioResponseFormat || state.db.settings.audioResponseFormat,
    elevenLabs: fallbackControls.elevenLabs,
    voicebox: fallbackControls.voicebox,
    ...irodori,
    actingPrompt,
    caption: fallbackControls.provider === "irodori" ? irodori.caption : actingPrompt,
    agentNote: source.agentNote || source.note || result?.message || ""
  };
}

function startAudioGenerationClock() {
  state.audioGenerationStartedAt = Date.now();
  if (state.audioGenerationTimer) clearInterval(state.audioGenerationTimer);
  state.audioGenerationTimer = setInterval(() => {
    if (!state.audioIsGenerating) {
      clearInterval(state.audioGenerationTimer);
      state.audioGenerationTimer = null;
      return;
    }
    render();
  }, 5000);
}

function stopAudioGenerationClock() {
  if (state.audioGenerationTimer) clearInterval(state.audioGenerationTimer);
  state.audioGenerationTimer = null;
  state.audioGenerationStartedAt = 0;
}

async function handleAudioAgentMessage(forceDraft = false) {
  const chatInput = document.querySelector("#audio-chat-input");
  const input = chatInput?.value.trim();
  const message = input || (forceDraft ? "ここまでの会話と選択中のキャラ設定から、音声生成用の読み上げテキスト案を作ってください。" : "");
  if (!message) return toast("メッセージを入力してください。");
  const controls = audioControlsFromDom();
  state.audioWorkId = controls.workId || null;
  state.audioCharacterId = controls.characterId || "";
  state.audioVoice = controls.voice;
  state.audioProvider = controls.provider;
  state.db.settings.audioProvider = controls.provider;
  state.db.settings.audioModel = controls.audioModel;
  state.db.settings.audioResponseFormat = controls.audioResponseFormat;
  state.db.settings.audioVoice = controls.voice;
  state.db.settings.audioActingPrompt = controls.actingPrompt || defaultAudioActingPrompt;
  state.db.settings.irodoriDefaults = controls.irodori;
  state.audioChatDraft = "";
  if (chatInput) chatInput.value = "";
  state.audioChatMessages.push({ role: "user", content: message });
  state.audioIsThinking = true;
  render();
  try {
    toastApiSubmitted("音声テキスト案作成APIに送信しました。返答を待っています。");
    const content = await callOpenRouter({
      purpose: "audio",
      textOnly: true,
      temperature: 0.45,
      maxTokens: 2400,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: buildAudioAgentSystemPrompt() },
        { role: "user", content: buildAudioAgentText(message, controls) }
      ]
    });
    const result = parseAiJson(content);
    state.audioChatMessages.push({ role: "assistant", content: result.message || result.answer || "音声案を更新しました。" });
    const draft = mergeAudioDraft(result, controls);
    if (draft) {
      state.audioPromptDraft = draft;
      state.audioVoice = draft.voice;
    }
    state.audioIsThinking = false;
    render({ preserveLiveTextDrafts: !draft });
  } catch (error) {
    state.audioIsThinking = false;
    state.audioChatMessages.push({ role: "assistant", content: `エラー: ${error.message}${debugChatText(error)}` });
    render();
  }
}

async function startAudioGeneration() {
  const controls = audioControlsFromDom();
  controls.input = controls.input.trim();
  if (!controls.input) return toast("読み上げテキストを入力してください。");
  const key = apiKey();
  const elevenKey = elevenLabsApiKey();
  if (controls.provider === "openrouter" && !key) return toast("設定画面で OpenRouter API キーを保存してください。");
  if (controls.provider === "elevenlabs" && !elevenKey) return toast("設定画面で ElevenLabs API キーを保存してください。");
  if (controls.provider === "elevenlabs" && !controls.elevenLabs.voiceId) return toast("ElevenLabs voice ID を指定してください。");
  if (controls.provider === "voicebox" && !controls.voicebox.profileId) return toast("Voiceboxプロファイルを指定してください。");
  const selectedChar = byId(state.db.characters, controls.characterId);
  const work = byId(state.db.works, selectedChar?.workId || controls.workId);
  state.audioIsGenerating = true;
  state.audioWorkId = work?.id || controls.workId || null;
  state.audioCharacterId = selectedChar?.id || "";
  state.audioVoice = controls.voice;
  state.audioProvider = controls.provider;
  state.db.settings.audioProvider = controls.provider;
  state.db.settings.audioVoice = controls.voice;
  state.db.settings.audioActingPrompt = controls.actingPrompt || defaultAudioActingPrompt;
  state.db.settings.audioModel = controls.audioModel;
  state.db.settings.audioResponseFormat = controls.audioResponseFormat;
  state.db.settings.elevenLabsVoiceId = controls.elevenLabs.voiceId;
  state.db.settings.elevenLabsModelId = controls.elevenLabs.modelId;
  state.db.settings.elevenLabsOutputFormat = controls.elevenLabs.outputFormat;
  state.db.settings.elevenLabsStability = controls.elevenLabs.stability;
  state.db.settings.elevenLabsSimilarityBoost = controls.elevenLabs.similarityBoost;
  state.db.settings.elevenLabsStyle = controls.elevenLabs.style;
  state.db.settings.elevenLabsSpeed = controls.elevenLabs.speed;
  state.db.settings.elevenLabsSpeakerBoost = controls.elevenLabs.useSpeakerBoost;
  state.db.settings.elevenLabsLanguageCode = controls.elevenLabs.languageCode;
  state.db.settings.voiceboxBaseUrl = controls.voicebox.baseUrl;
  state.db.settings.voiceboxProfileId = controls.voicebox.profileId;
  state.db.settings.voiceboxLanguage = controls.voicebox.language;
  state.db.settings.voiceboxModelSize = controls.voicebox.modelSize;
  state.db.settings.irodoriDefaults = controls.irodori;
  startAudioGenerationClock();
  render();
  try {
    let created = [];
    toastApiSubmitted("音声生成APIに送信しました。返答を待っています。");
    if (controls.provider === "openrouter") {
      const openRouterModelConfig = openRouterTtsModelConfig(controls.audioModel);
      const payload = await postJson("/api/openrouter/speech", {
        apiKey: key,
        model: controls.audioModel,
        input: composeOpenRouterTtsInput(controls.audioModel, controls.input, controls.actingPrompt),
        voice: controls.voice,
        responseFormat: controls.audioResponseFormat,
        title: controls.title
      });
      const format = payload.format || (String(payload.mimeType || "").includes("wav") ? "wav" : "mp3");
      created = [normalizeAudioItem({
        id: uid(),
        workId: work?.id || null,
        characterId: selectedChar?.id || null,
        provider: "openrouter",
        title: controls.title,
        input: controls.input,
        voice: controls.voice,
        model: controls.audioModel,
        format,
        caption: controls.actingPrompt,
        actingPrompt: controls.actingPrompt,
        url: payload.url,
        localPath: payload.path,
        mimeType: payload.mimeType,
        generationId: payload.generationId,
        size: payload.size,
        agentNote: [state.audioPromptDraft?.agentNote || "", `${openRouterModelConfig.label} / ${openRouterModelConfig.formatNote}`].filter(Boolean).join(" / "),
        audioResponseFormat: controls.audioResponseFormat,
        createdAt: new Date().toISOString()
      })];
    } else if (controls.provider === "elevenlabs") {
      const payload = await postJson("/api/elevenlabs/speech", {
        apiKey: elevenKey,
        voiceId: controls.elevenLabs.voiceId,
        modelId: controls.elevenLabs.modelId,
        outputFormat: controls.elevenLabs.outputFormat,
        input: controls.input,
        title: controls.title,
        languageCode: controls.elevenLabs.languageCode,
        seed: controls.elevenLabs.seed,
        voiceSettings: {
          stability: controls.elevenLabs.stability,
          similarityBoost: controls.elevenLabs.similarityBoost,
          style: controls.elevenLabs.style,
          speed: controls.elevenLabs.speed,
          useSpeakerBoost: controls.elevenLabs.useSpeakerBoost
        }
      });
      created = [normalizeAudioItem({
        id: uid(),
        workId: work?.id || null,
        characterId: selectedChar?.id || null,
        provider: "elevenlabs",
        title: controls.title,
        input: controls.input,
        voice: controls.elevenLabs.voiceId,
        model: controls.elevenLabs.modelId,
        format: payload.format || "mp3",
        url: payload.url,
        localPath: payload.path,
        mimeType: payload.mimeType,
        generationId: payload.generationId,
        size: payload.size,
        caption: controls.actingPrompt,
        actingPrompt: controls.actingPrompt,
        elevenLabs: controls.elevenLabs,
        agentNote: state.audioPromptDraft?.agentNote || "",
        createdAt: new Date().toISOString()
      })];
    } else if (controls.provider === "voicebox") {
      const payload = await postJson("/api/voicebox/speech", {
        baseUrl: controls.voicebox.baseUrl,
        profileId: controls.voicebox.profileId,
        language: controls.voicebox.language,
        modelSize: controls.voicebox.modelSize,
        seed: controls.voicebox.seed,
        instruct: controls.actingPrompt,
        input: controls.input,
        title: controls.title
      });
      const profile = state.voiceboxProfiles.find((item) => item.id === controls.voicebox.profileId);
      created = [normalizeAudioItem({
        id: uid(),
        workId: work?.id || null,
        characterId: selectedChar?.id || null,
        provider: "voicebox",
        title: controls.title,
        input: controls.input,
        voice: profile?.name || controls.voicebox.profileId,
        model: "Voicebox",
        format: payload.format || "wav",
        url: payload.url,
        localPath: payload.path,
        mimeType: payload.mimeType,
        generationId: payload.generationId,
        size: payload.size,
        caption: controls.actingPrompt,
        actingPrompt: controls.actingPrompt,
        voicebox: {
          ...controls.voicebox,
          profileName: profile?.name || "",
          defaultEngine: profile?.defaultEngine || profile?.presetEngine || ""
        },
        agentNote: state.audioPromptDraft?.agentNote || "",
        createdAt: new Date().toISOString()
      })];
    } else {
      const payload = await postJson("/api/irodori/speech", {
        appDir: state.db.settings.irodoriAppDir,
        input: controls.input,
        title: controls.title,
        referenceAudioUrl: state.audioIrodoriReference?.url || "",
        ...controls.irodori
      });
      const outputs = Array.isArray(payload.outputs) && payload.outputs.length ? payload.outputs : [payload];
      created = outputs.map((output, index) => normalizeAudioItem({
        id: uid(),
        workId: work?.id || null,
        characterId: selectedChar?.id || null,
        provider: "irodori",
        title: outputs.length > 1 ? `${controls.title} ${index + 1}` : controls.title,
        input: controls.input,
        voice: controls.irodori.mode,
        model: "Irodori-TTS",
        format: "wav",
        url: output.url,
        localPath: output.path,
        mimeType: output.mimeType,
        size: output.size,
        caption: controls.irodori.caption,
        irodori: controls.irodori,
        referenceAudio: state.audioIrodoriReference,
        agentNote: state.audioPromptDraft?.agentNote || "",
        createdAt: new Date().toISOString()
      }));
    }
    state.db.audioItems.unshift(...created);
    await saveDb();
    state.audioIsGenerating = false;
    stopAudioGenerationClock();
    render();
    const countText = created.length > 1 ? `${created.length} 件の` : "";
    toast(selectedChar ? `${selectedChar.name} の${countText}音声として保存しました。` : `${countText}音声を保存しました。`);
  } catch (error) {
    state.audioIsGenerating = false;
    stopAudioGenerationClock();
    toast(error.message);
    render();
  }
}

function renderAudioItem(audio) {
  const providerLabel = audio.provider === "irodori" ? "Irodori-TTS" : audio.provider === "elevenlabs" ? "ElevenLabs" : audio.provider === "voicebox" ? "Voicebox" : "OpenRouter TTS";
  const openRouterModelLabel = audio.provider === "openrouter" ? openRouterTtsModelConfig(audio.model).label : "";
  const voiceLabel = audio.provider === "irodori"
    ? `${audio.irodori?.mode || audio.voice || "VoiceDesign"}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`
    : audio.provider === "elevenlabs"
      ? `${audio.voice || "voice ID未設定"} / ${audio.model || "eleven_multilingual_v2"}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`
      : audio.provider === "voicebox"
        ? `${audio.voicebox?.profileName || audio.voicebox?.profileId || audio.voice || "profile未設定"} / ${audio.voicebox?.language || "ja"}${audio.voicebox?.defaultEngine ? ` / ${audio.voicebox.defaultEngine}` : ""}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`
        : `${openRouterModelLabel} / ${audio.voice || "Kore"}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`;
  return `
    <article class="audio-job">
      <div>
        <div class="char-name">${escapeHtml(audio.title || "生成音声")}</div>
        <div class="meta">${escapeHtml(audioCharacterLabel(audio))} / ${escapeHtml(providerLabel)} / ${escapeHtml(voiceLabel)} / ${audio.createdAt ? escapeHtml(new Date(audio.createdAt).toLocaleString("ja-JP")) : ""}</div>
      </div>
      <audio class="generated-audio" controls preload="none" src="${escapeHtml(audio.url)}"></audio>
      <div class="result-text">${escapeHtml(compactPromptText(audio.input, 900))}</div>
      ${audio.agentNote ? `<div class="meta">${escapeHtml(audio.agentNote)}</div>` : ""}
      ${audio.localPath ? `<div class="meta">保存先: ${escapeHtml(audio.localPath)}</div>` : ""}
    </article>
  `;
}

function renderAudioAgent() {
  const work = byId(state.db.works, state.audioWorkId) || byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.audioWorkId && work) state.audioWorkId = work.id;
  const chars = audioCharacterOptions();
  if (state.audioCharacterId && !chars.some((char) => char.id === state.audioCharacterId)) {
    state.audioCharacterId = "";
  }
  const controls = state.audioPromptDraft || {};
  const providerValue = normalizedAudioProvider(controls.provider || state.audioProvider || state.db.settings.audioProvider);
  const openRouterModelValue = normalizeOpenRouterTtsModel(controls.audioModel || state.db.settings.audioModel);
  const openRouterResponseFormatValue = normalizeOpenRouterTtsResponseFormat(controls.audioResponseFormat || state.db.settings.audioResponseFormat, openRouterModelValue);
  const voiceValue = providerValue === "openrouter"
    ? normalizeOpenRouterTtsVoice(controls.voice || state.audioVoice || state.db.settings.audioVoice, openRouterModelValue)
    : controls.voice || state.audioVoice || state.db.settings.audioVoice || "Kore";
  const actingPromptValue = controls.actingPrompt || (providerValue === "openrouter" ? controls.caption : "") || state.db.settings.audioActingPrompt || defaultAudioActingPrompt;
  const elevenLabsValue = elevenLabsSettingsFromControls(controls.elevenLabs || {});
  const voiceboxValue = voiceboxSettingsFromControls(controls.voicebox || {});
  const irodoriValue = normalizedIrodoriSettings({ ...state.db.settings.irodoriDefaults, ...controls });
  const history = audioItemsForWork(state.audioWorkId)
    .filter((item) => !state.audioCharacterId || item.characterId === state.audioCharacterId)
    .slice(0, 12);
  return `
    <div class="video-layout audio-layout">
      <section class="panel">
        <div class="panel-header"><h2>生成設定</h2></div>
        <div class="panel-body form-grid">
          <label class="full">作品
            <select id="audio-work">
              <option value="">全作品</option>
              ${state.db.works.map((item) => `<option value="${item.id}" ${state.audioWorkId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">キャラ指定
            <select id="audio-character">
              <option value="">指定なし</option>
              ${chars.map((char) => `<option value="${char.id}" ${state.audioCharacterId === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">生成方式
            <select id="audio-provider">${renderAudioProviderOptions(providerValue)}</select>
          </label>
          ${providerValue === "openrouter" ? `
            <label class="full">モデル
              <select id="audio-openrouter-model">${renderOpenRouterTtsModelOptions(openRouterModelValue)}</select>
            </label>
            <label class="full">ボイス
              <select id="audio-voice">${renderOpenRouterTtsVoiceOptions(voiceValue, openRouterModelValue)}</select>
            </label>
            <label>出力形式
              <select id="audio-openrouter-response-format">${renderOpenRouterTtsResponseFormatOptions(openRouterResponseFormatValue, openRouterModelValue)}</select>
            </label>
            <label class="full">演技指示
              <textarea id="audio-acting-prompt" rows="4" placeholder="例：低く静かな声。怒りを抑え、近い距離で囁くように。重要な間だけ [short pause] を入れる。">${escapeHtml(actingPromptValue)}</textarea>
            </label>
            <div class="full meta">生成モデル: ${escapeHtml(openRouterTtsModelConfig(openRouterModelValue).label)} / ${escapeHtml(openRouterTtsModelConfig(openRouterModelValue).formatNote)}</div>
          ` : providerValue === "elevenlabs" ? `
            <div class="full meta">ElevenLabsを使って音声を生成します。voice ID と voice settings を指定できます。</div>
            <label class="full">演技指示
              <textarea id="audio-acting-prompt" rows="4" placeholder="例：穏やかで少し低め。親しい距離感で、語尾はやわらかく。大事な一文の前に短い間を置く。">${escapeHtml(actingPromptValue)}</textarea>
            </label>
            ${renderElevenLabsParameters(elevenLabsValue)}
          ` : providerValue === "voicebox" ? `
            <div class="full meta">VoiceboxのローカルAPIを使って、保存済みプロファイルの声で音声を生成します。</div>
            <label class="full">演技指示
              <textarea id="audio-acting-prompt" rows="4" placeholder="例：低く静かな声。近い距離で、言葉の最後を少し弱める。">${escapeHtml(actingPromptValue)}</textarea>
            </label>
            ${renderVoiceboxParameters(voiceboxValue)}
          ` : `
            <div class="full meta">Irodori-TTSをローカル実行します。連携先は設定画面の「Irodori-TTS連携」で変更できます。</div>
            ${renderIrodoriParameters(irodoriValue, state.audioIrodoriReference)}
          `}
          <label class="full">タイトル<input id="audio-title" value="${escapeHtml(controls.title || "生成音声")}"></label>
        </div>
      </section>
      <section class="video-main">
        <section class="panel video-chat-panel">
          <div class="panel-header">
            <h2>エージェント</h2>
            <button class="ghost" data-action="audio-make-draft" ${state.audioIsThinking ? "disabled" : ""}>音声案</button>
          </div>
          <div class="panel-body">
            <div class="chat-log">
              ${state.audioChatMessages.map((message) => `<div class="chat-message ${message.role}"><div>${escapeHtml(message.content)}</div></div>`).join("")}
              ${state.audioIsThinking ? `<div class="chat-message assistant"><div>考えています...</div></div>` : ""}
            </div>
            <div class="chat-input-row">
              <textarea id="audio-chat-input" placeholder="例：燐谷奏汰の低く落ち着いた声で、雨音の中の独白を作って">${escapeHtml(state.audioChatDraft || "")}</textarea>
              <button data-action="audio-send-message" ${state.audioIsThinking ? "disabled" : ""}>送信</button>
            </div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>読み上げテキスト</h2>
              <div class="meta">${escapeHtml(state.audioPromptDraft?.agentNote || "手動入力できます。")}</div>
            </div>
            <div class="group">
              <button class="ghost" data-action="audio-copy-input">コピー</button>
              <button class="accent" data-action="audio-start-generation" ${state.audioIsGenerating ? "disabled" : ""}>生成開始</button>
            </div>
          </div>
          <div class="panel-body">
            <textarea id="audio-input-text" class="seedance-prompt-text audio-input-text" placeholder="ここに読み上げる台詞やナレーションを入力します。">${escapeHtml(controls.input || "")}</textarea>
            ${state.audioIsGenerating ? renderAudioGenerating() : ""}
          </div>
        </section>
        <section class="panel">
          <div class="panel-header"><h2>生成履歴</h2></div>
          <div class="panel-body audio-history-list">
            ${history.length ? history.map(renderAudioItem).join("") : `<div class="empty compact">生成音声はまだありません。</div>`}
          </div>
        </section>
      </section>
    </div>
  `;
}

function renderAudioGenerating() {
  const elapsed = state.audioGenerationStartedAt ? Math.max(0, Math.floor((Date.now() - state.audioGenerationStartedAt) / 1000)) : 0;
  const elapsedText = elapsed >= 60 ? `${Math.floor(elapsed / 60)}分${String(elapsed % 60).padStart(2, "0")}秒` : `${elapsed}秒`;
  return `
    <div class="seedance-animation audio-generating">
      <div class="wave-loader"><span></span><span></span><span></span><span></span></div>
      <div>
        <strong>音声生成中</strong>
        <div class="meta">経過 ${escapeHtml(elapsedText)}。Irodori-TTSやVoiceboxの初回生成は数分かかることがあります。完了後にキャラ情報と参照素材へ保存します。</div>
      </div>
    </div>
  `;
}

function renderVideoCostSummary(summary, currentRate) {
  const collapsed = state.videoCostCollapsed;
  const updatedText = summary.updatedAt ? new Date(summary.updatedAt).toLocaleString("ja-JP") : "未取得";
  const rateDisplay = currentRate.usdPerSecond !== null
    ? `${formatUsd(currentRate.usdPerSecond, 4)} / 秒`
    : "未取得";
  const rateJpyDisplay = currentRate.jpyPerSecond !== null
    ? `${formatJpy(currentRate.jpyPerSecond)} / 秒`
    : "未取得";
  const rateTierText = currentRate.tier ? ` / ${currentRate.tier}` : "";
  const statusText = state.videoPricingStatus === "loading"
    ? "取得中です。"
    : state.videoPricingError || `最終更新: ${updatedText} / USD-JPY ${formatPlainNumber(summary.usdJpyRate, 3)} (${summary.usdJpySource})`;
  const estimateText = summary.estimatedUsd > 0
    ? `概算 ${formatUsd(summary.estimatedUsd)} を含みます。`
    : "実コストが取れるジョブは実コストを優先します。";
  const unknownText = summary.unknown ? `単価未取得の ${summary.unknown} 件は未計上です。` : estimateText;
  return `
    <section class="panel video-cost-panel ${collapsed ? "collapsed" : ""}">
      <div class="panel-header">
        <div>
          <div class="video-cost-title-row">
            <h2>今月の動画コスト</h2>
            <strong>${formatJpy(summary.jpy)}</strong>
          </div>
          <div class="meta">${escapeHtml(summary.label)} / ${escapeHtml(statusText)}</div>
        </div>
        <div class="video-cost-actions">
          <button class="ghost" data-action="toggle-video-cost" aria-expanded="${collapsed ? "false" : "true"}">
            ${collapsed ? "詳細を表示" : "折りたたむ"}
          </button>
          <button class="ghost" data-action="refresh-video-pricing" ${state.videoPricingStatus === "loading" ? "disabled" : ""}>
            ${state.videoPricingStatus === "loading" ? "取得中..." : "現在料金を取得"}
          </button>
        </div>
      </div>
      ${collapsed ? "" : `<div class="panel-body">
        <div class="video-cost-grid">
          <div class="video-cost-main">
            <div class="meta">今月の日本円概算</div>
            <strong>${formatJpy(summary.jpy)}</strong>
          </div>
          <div>
            <div class="meta">USD概算</div>
            <strong>${formatUsd(summary.usd)}</strong>
          </div>
          <div>
            <div class="meta">生成数 / 秒数</div>
            <strong>${formatPlainNumber(summary.jobCount)}件 / ${formatPlainNumber(summary.seconds)}秒</strong>
          </div>
          <div>
            <div class="meta">現在モデルの1秒料金</div>
            <strong>${escapeHtml(rateDisplay)}</strong>
            <div class="meta">${escapeHtml(rateJpyDisplay)} / ${escapeHtml(videoPricingSourceLabel(currentRate.source))}${escapeHtml(rateTierText)}</div>
          </div>
        </div>
        <div class="meta cost-note">${escapeHtml(unknownText)}</div>
      </div>`}
    </section>
  `;
}

function videoJobProgress(job) {
  const values = [
    job?.progress,
    job?.providerPayload?.progress,
    job?.providerPayload?.data?.progress,
    job?.providerPayload?.percent,
    job?.providerPayload?.percentage
  ];
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(String(value).replace("%", ""));
    if (!Number.isFinite(number)) continue;
    const progress = number > 0 && number <= 1 ? number * 100 : number;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }
  if (job?.status === "succeeded") return 100;
  return null;
}

function videoStatusLabel(status) {
  return {
    submitting: "送信中",
    submitted: "送信済み",
    pending: "待機中",
    queued: "待機中",
    running: "生成中",
    processing: "生成中",
    succeeded: "完了",
    failed: "失敗",
    expired: "期限切れ",
    cancelled: "破棄済み"
  }[status] || status || "確認中";
}

function activeVideoJob() {
  return byId(state.db.videoJobs || [], state.videoPollingJobId)
    || (state.db.videoJobs || []).find((job) => activeVideoJobStatuses.includes(job.status))
    || null;
}

function elapsedVideoText(job) {
  if (!job?.createdAt) return "";
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 1000));
  if (elapsed >= 3600) return `${Math.floor(elapsed / 3600)}時間${Math.floor((elapsed % 3600) / 60)}分`;
  if (elapsed >= 60) return `${Math.floor(elapsed / 60)}分${String(elapsed % 60).padStart(2, "0")}秒`;
  return `${elapsed}秒`;
}

function renderVideoAgent() {
  const work = byId(state.db.works, state.videoWorkId) || byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.videoWorkId && work) state.videoWorkId = work.id;
  const referenceCharacters = videoCharacterOptions();
  if (state.videoCharacterId && !referenceCharacters.some((char) => char.id === state.videoCharacterId)) {
    state.videoCharacterId = "";
  }
  const controls = state.videoPromptDraft || {};
  const currentModelId = compatibleVideoModelId(controls.model || state.db.settings.seedanceModel, state.db.settings.seedanceBaseUrl);
  const currentModel = videoModelConfig(currentModelId);
  const modeOptions = videoModeOptionsForModel(currentModel);
  const durationOptions = optionList(currentModel.supported_durations, [5]);
  const ratioOptions = optionList(currentModel.supported_aspect_ratios, ["16:9"]);
  const resolutionOptions = optionList(currentModel.supported_resolutions, [state.db.settings.seedanceResolution || "720p"]);
  const modeValue = modeOptions.some(([value]) => value === (controls.mode || "reference")) ? (controls.mode || "reference") : modeOptions[0][0];
  const durationValue = optionValue(controls.duration || 5, durationOptions);
  const ratioValue = optionValue(controls.ratio || "16:9", ratioOptions);
  const resolutionValue = optionValue(controls.resolution || state.db.settings.seedanceResolution || "720p", resolutionOptions);
  const audioOptions = currentModel.generate_audio === false ? [["false", "生成しない"]] : [["true", "生成する"], ["false", "生成しない"]];
  const generateAudioValue = currentModel.generate_audio === false ? "false" : String(controls.generateAudio ?? true);
  const modelStatusText = isReplicateSeedanceBaseUrl()
    ? "Replicate Predictions APIでSeedance 2.0を実行します。参照動画を含む場合はvideo_in単価で概算します。"
    : isOpenRouterSeedanceBaseUrl()
    ? state.openRouterVideoModelStatus === "loaded"
      ? "OpenRouter動画モデルの対応設定を読み込み済み。"
      : state.openRouterVideoModelStatus === "loading"
        ? "OpenRouter動画モデルの対応設定を読み込み中。"
        : state.openRouterVideoModelError || "フォールバック設定を使用中。"
    : "公式API向けの既定設定です。";
  const references = filteredVideoReferences();
  const selectedItems = selectedVideoReferences();
  const counts = selectedVideoReferenceCounts(selectedItems);
  const monthlyCost = monthlyVideoCostSummary();
  const currentRate = currentVideoRateSummary(currentModelId, resolutionValue, ratioValue, {
    baseUrl: state.db.settings.seedanceBaseUrl,
    hasVideoInput: hasVideoInputReferences(selectedItems)
  });
  const jobs = (state.db.videoJobs || [])
    .filter((job) => !state.videoWorkId || job.workId === state.videoWorkId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 12);
  const activeJobs = (state.db.videoJobs || []).filter((job) => activeVideoJobStatuses.includes(job.status));
  return `
    ${renderVideoCostSummary(monthlyCost, currentRate)}
    <div class="video-layout">
      <section class="panel">
        <div class="panel-header"><h2>生成設定</h2></div>
        <div class="panel-body form-grid">
          <label class="full">作品
            <select id="video-work">
              <option value="">全作品</option>
              ${state.db.works.map((item) => `<option value="${item.id}" ${state.videoWorkId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </label>
          <label>モード
            <select id="video-mode">
              ${modeOptions.map(([value, label]) => `<option value="${value}" ${modeValue === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>秒数
            <select id="video-duration">
              ${durationOptions.map((value) => `<option value="${escapeHtml(value)}" ${durationValue === value ? "selected" : ""}>${escapeHtml(value)}秒</option>`).join("")}
            </select>
          </label>
          <label>アスペクト比
            <select id="video-ratio">
              ${ratioOptions.map((value) => `<option value="${escapeHtml(value)}" ${ratioValue === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
            </select>
          </label>
          <label>解像度
            <select id="video-resolution">
              ${resolutionOptions.map((value) => `<option value="${escapeHtml(value)}" ${resolutionValue === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
            </select>
          </label>
          <label class="full">動画モデル
            ${renderVideoModelSelect("video-seedance-model", currentModelId)}
          </label>
          <label>音声
            <select id="video-generate-audio">
              ${audioOptions.map(([value, label]) => `<option value="${value}" ${generateAudioValue === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>カメラ固定
            <select id="video-camera-fixed">
              <option value="false" ${!(controls.cameraFixed ?? false) ? "selected" : ""}>OFF</option>
              <option value="true" ${(controls.cameraFixed ?? false) ? "selected" : ""}>ON</option>
            </select>
          </label>
          <label>透かし
            <select id="video-watermark">
              <option value="false" ${!(controls.watermark ?? false) ? "selected" : ""}>OFF</option>
              <option value="true" ${(controls.watermark ?? false) ? "selected" : ""}>ON</option>
            </select>
          </label>
          <label>最終フレーム返却
            <select id="video-return-last-frame">
              <option value="false" ${!(controls.returnLastFrame ?? false) ? "selected" : ""}>OFF</option>
              <option value="true" ${(controls.returnLastFrame ?? false) ? "selected" : ""}>ON</option>
            </select>
          </label>
          <label class="full">Seed<input id="video-seed" type="number" value="${escapeHtml(controls.seed ?? -1)}"></label>
          <div class="full meta">${escapeHtml(modelStatusText)}</div>
        </div>
        <div class="panel-header compact-header">
          <h2>参照素材</h2>
          <input id="video-ref-file-input" type="file" accept="image/*,video/*,audio/*" multiple hidden>
          <button class="ghost" data-action="choose-video-reference-files">追加</button>
        </div>
        <div class="panel-body">
          <div class="toolbar slim-toolbar">
            <select id="video-reference-kind">
              ${[["all", "全素材"], ["image", "画像"], ["video", "動画"], ["audio", "音声"]].map(([value, label]) => `<option value="${value}" ${state.videoReferenceKind === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
            <label class="reference-filter-field">キャラ
              <select id="video-character">
                <option value="">全キャラ</option>
                ${referenceCharacters.map((char) => {
                  const optionWork = byId(state.db.works, char.workId);
                  const label = state.videoWorkId ? char.name : `${char.name}${optionWork ? ` / ${optionWork.name}` : ""}`;
                  return `<option value="${char.id}" ${state.videoCharacterId === char.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
                }).join("")}
              </select>
            </label>
            <div class="meta">画像 ${counts.image}/9 / 動画 ${counts.video}/3 / 音声 ${counts.audio}/3</div>
          </div>
          ${references.length ? `<div class="reference-grid">${references.map(renderVideoReferenceCard).join("")}</div>` : `<div class="empty compact">参照素材がありません。</div>`}
        </div>
      </section>
      <section class="video-main">
        <section class="panel video-chat-panel">
          <div class="panel-header">
            <h2>エージェント</h2>
            <button class="ghost" data-action="video-make-draft" ${state.videoIsThinking ? "disabled" : ""}>プロンプト案</button>
          </div>
          <div class="panel-body">
            <div class="chat-log">
              ${state.videoChatMessages.map((message) => `<div class="chat-message ${message.role}"><div>${escapeHtml(message.content)}</div></div>`).join("")}
              ${state.videoIsThinking ? `<div class="chat-message assistant"><div>考えています...</div></div>` : ""}
            </div>
            <div class="chat-input-row">
              <textarea id="video-chat-input" placeholder="例：雛森陽澄が雨の路地で振り返る、8秒、縦型、静かな不穏さ">${escapeHtml(state.videoChatDraft || "")}</textarea>
              <button data-action="video-send-message" ${state.videoIsThinking ? "disabled" : ""}>送信</button>
            </div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>API送信用プロンプト</h2>
              <div class="meta">${escapeHtml(state.videoPromptDraft?.title || "手動入力できます。")}</div>
            </div>
            <div class="group">
              <button class="ghost" data-action="video-copy-prompt">コピー</button>
              ${(state.videoIsGenerating || state.videoPollingJobId || activeJobs.length) ? `<button class="ghost danger" data-action="discard-video-waiting">待機を破棄</button>` : ""}
              <button class="accent" data-action="video-start-generation" ${state.videoIsGenerating ? "disabled" : ""}>生成開始</button>
            </div>
          </div>
          <div class="panel-body">
            <textarea id="video-prompt-text" class="seedance-prompt-text" placeholder="Create a 6-second cinematic video...">${escapeHtml(state.videoPromptDraft?.prompt || "")}</textarea>
            ${state.videoIsGenerating || state.videoPollingJobId ? renderSeedanceAnimation() : ""}
          </div>
        </section>
        <section class="panel">
          <div class="panel-header"><h2>生成履歴</h2></div>
          <div class="panel-body video-job-list">
            ${jobs.length ? jobs.map(renderVideoJob).join("") : `<div class="empty compact">生成履歴はまだありません。</div>`}
          </div>
        </section>
      </section>
    </div>
  `;
}

function renderSeedanceAnimation() {
  const job = activeVideoJob();
  const status = job?.status || (state.videoIsGenerating ? "submitting" : "pending");
  const progress = videoJobProgress(job);
  const elapsed = elapsedVideoText(job);
  const updatedAt = job?.updatedAt ? new Date(job.updatedAt).toLocaleTimeString("ja-JP") : "";
  const progressMessage = job?.progressMessage || job?.providerPayload?.progressMessage || "";
  const detail = [
    videoStatusLabel(status),
    progress !== null ? `${progress}%` : "",
    elapsed ? `経過 ${elapsed}` : "",
    updatedAt ? `最終更新 ${updatedAt}` : ""
  ].filter(Boolean).join(" / ");
  return `
    <div class="seedance-animation">
      <div class="film-loader"><span></span><span></span><span></span><span></span></div>
      <div class="generation-status">
        <strong>動画生成中</strong>
        <div class="progress-track ${progress === null ? "indeterminate" : ""}">
          <span style="width:${progress === null ? 38 : progress}%"></span>
        </div>
        <div class="meta">${escapeHtml(detail || "完了後に自動保存します。")}</div>
        ${progressMessage ? `<div class="meta">${escapeHtml(progressMessage)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderVideoJob(job) {
  const work = byId(state.db.works, job.workId);
  const cost = videoJobCostSummary(job);
  const providerError = job.error || readableError(job.providerPayload?.error) || readableError(job.providerPayload?.providerPayload?.error);
  const status = !job.providerTaskId && providerError ? "failed" : job.status;
  const progress = videoJobProgress(job);
  const costText = cost.usd !== null
    ? `${cost.source === "actual" ? "実コスト" : "概算"} ${formatUsd(cost.usd)}`
    : "";
  return `
    <article class="video-job ${status}">
      <div>
        <div class="char-name">${escapeHtml(displayVideoJobTitle(job))}</div>
        <div class="meta">${escapeHtml(work?.name || "全作品")} / ${escapeHtml(videoStatusLabel(status))}${progress !== null ? ` ${escapeHtml(`${progress}%`)}` : ""} / ${job.updatedAt ? escapeHtml(new Date(job.updatedAt).toLocaleString("ja-JP")) : ""}${costText ? ` / ${escapeHtml(costText)}` : ""}</div>
      </div>
      ${activeVideoJobStatuses.includes(status) ? `
        <div class="progress-track ${progress === null ? "indeterminate" : ""}">
          <span style="width:${progress === null ? 38 : progress}%"></span>
        </div>
      ` : ""}
      ${job.localUrl ? `<video class="generated-video" controls src="${escapeHtml(job.localUrl)}"></video>` : ""}
      <div class="result-text">${escapeHtml(compactPromptText(job.prompt, 900))}</div>
      <div class="card-actions">
        <button class="ghost" data-action="refresh-video-job" data-id="${job.id}" ${!job.providerTaskId || ["succeeded", "failed", "expired", "cancelled"].includes(status) ? "disabled" : ""}>更新</button>
        <button class="ghost" data-action="copy-video-job-prompt" data-id="${job.id}">プロンプト</button>
        ${status === "succeeded" && job.settings?.returnLastFrame && job.localUrl && !job.lastFrameUrl ? `<button class="ghost" data-action="save-video-last-frame" data-id="${job.id}">最終フレーム保存</button>` : ""}
      </div>
      ${job.localPath ? `<div class="meta">保存先: ${escapeHtml(job.localPath)}</div>` : ""}
      ${job.lastFrameUrl ? `<div class="meta">最終フレーム: ${escapeHtml(job.lastFrameLocalPath || job.lastFrameUrl)}</div>` : ""}
      ${job.lastFrameError ? `<div class="meta danger-text">最終フレーム保存エラー: ${escapeHtml(job.lastFrameError)}</div>` : ""}
      ${providerError ? `<div class="meta danger-text">${escapeHtml(providerError)}</div>` : ""}
    </article>
  `;
}

function renderPromptLab() {
  const promptChars = charactersForWork(state.selectedWorkId);
  const selectedChar = promptChars[0];
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>入力</h2></div>
        <div class="panel-body form-grid">
          <label class="full">作品
            <select id="prompt-work">
              <option value="">全作品</option>
              ${state.db.works.map((work) => `<option value="${work.id}" ${state.selectedWorkId === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">キャラ
            <select id="prompt-character">
              ${promptChars.map((char) => `<option value="${char.id}">${escapeHtml(char.name)}</option>`).join("")}
            </select>
          </label>
          <div class="full meta">生成時は作品メモ、作品情報 / 世界観設定、その他情報も自動で参照します。</div>
          <label class="full">差分・イベント指定
            <textarea id="prompt-variations" placeholder="笑顔、照れ顔、怒り顔&#10;雨の夜の路地で振り返る&#10;夏祭りで金魚すくいをしている"></textarea>
          </label>
          <label class="full">補足
            <textarea id="prompt-notes" placeholder="絵柄や構図、NG要素、統一したい衣装など"></textarea>
          </label>
          <button class="ghost full ${state.promptUseMemo ? "active-toggle" : ""}" data-action="toggle-prompt-memo" type="button">
            キャラメモを加味: ${state.promptUseMemo ? "ON" : "OFF"}
          </button>
          <button class="accent full" data-action="generate-prompts" ${selectedChar ? "" : "disabled"}>一括生成</button>
        </div>
      </section>
      <section>
        <div class="toolbar">
          <div>
            <h2 class="section-title">生成結果</h2>
            <div class="meta">${state.generatedPrompts.length} 件</div>
          </div>
          <button class="ghost" data-action="copy-all-prompts" ${state.generatedPrompts.length ? "" : "disabled"}>全コピー</button>
        </div>
        ${state.generatedPrompts.length ? `<div class="grid">${state.generatedPrompts.map(renderPromptCard).join("")}</div>` : `<div class="empty">ここにAI生成プロンプトが表示されます。</div>`}
      </section>
    </div>
  `;
}

function renderPromptCard(item, index) {
  return `
    <article class="prompt-card">
      <div class="body">
        <div class="char-name">${escapeHtml(item.title || `Prompt ${index + 1}`)}</div>
        <div class="result-text">${escapeHtml(item.prompt || "")}</div>
        ${item.negativePrompt ? `<div class="meta">Negative</div><div class="result-text">${escapeHtml(item.negativePrompt)}</div>` : ""}
        <button class="ghost" data-action="copy-prompt" data-index="${index}">コピー</button>
      </div>
    </article>
  `;
}

function renderComfyLoraRows(prefix, loras = []) {
  return normalizedComfyLoras(loras).map((lora, index) => `
    <div class="comfy-lora-row">
      <label>LoRA ${index + 1}
        <input id="${prefix}-lora-name-${index}" list="comfy-lora-options" placeholder="例: character_style.safetensors" value="${escapeHtml(lora.name)}">
      </label>
      <label>Model強度
        <input id="${prefix}-lora-model-${index}" type="number" min="-2" max="2" step="0.05" value="${escapeHtml(lora.strengthModel)}">
      </label>
      <label>CLIP強度
        <input id="${prefix}-lora-clip-${index}" type="number" min="-2" max="2" step="0.05" value="${escapeHtml(lora.strengthClip)}">
      </label>
    </div>
  `).join("");
}

function lorasFromDom(prefix, fallback = []) {
  const fallbackItems = normalizedComfyLoras(fallback);
  return fallbackItems.map((item, index) => ({
    name: document.querySelector(`#${prefix}-lora-name-${index}`)?.value.trim() ?? item.name,
    strengthModel: document.querySelector(`#${prefix}-lora-model-${index}`)?.value ?? item.strengthModel,
    strengthClip: document.querySelector(`#${prefix}-lora-clip-${index}`)?.value ?? item.strengthClip
  }));
}

function allImageReferences() {
  return allVideoReferences().filter((item) => item.kind === "image");
}

function imageReferenceOptionsForCurrentWork(selectedKeys = []) {
  const selected = new Set(selectedKeys);
  return allImageReferences().filter((item) => {
    if (selected.has(item.key)) return true;
    return !state.imageWorkId || item.workId === state.imageWorkId || !item.workId;
  });
}

function comfyReferenceSlotsFromDom(prefix, fallback = [], includeReference = false) {
  const fallbackItems = normalizedComfyReferenceSlots(fallback);
  const referenceMap = new Map(allImageReferences().map((item) => [item.key, item]));
  return fallbackItems.map((item, index) => {
    const key = includeReference
      ? (document.querySelector(`#${prefix}-reference-key-${index}`)?.value || item.key)
      : item.key;
    const reference = key ? referenceMap.get(key) : null;
    return {
      label: document.querySelector(`#${prefix}-reference-label-${index}`)?.value.trim() || item.label || `参照${index + 1}`,
      key: key || "",
      name: reference?.name || item.name || "",
      url: reference?.url || item.url || "",
      nodeId: document.querySelector(`#${prefix}-reference-node-${index}`)?.value.trim() || item.nodeId,
      inputName: document.querySelector(`#${prefix}-reference-input-${index}`)?.value.trim() || item.inputName || "image"
    };
  });
}

function renderComfyReferenceSlotRows(prefix, slots = [], { includeReference = false } = {}) {
  const normalized = normalizedComfyReferenceSlots(slots);
  const selectedKeys = normalized.map((slot) => slot.key).filter(Boolean);
  const references = imageReferenceOptionsForCurrentWork(selectedKeys);
  return normalized.map((slot, index) => {
    const selected = references.find((item) => item.key === slot.key);
    return `
      <div class="comfy-reference-row">
        ${includeReference ? `
          <label>画像 ${index + 1}
            <select id="${prefix}-reference-key-${index}">
              <option value="">指定なし</option>
              ${references.map((item) => `<option value="${escapeHtml(item.key)}" ${slot.key === item.key ? "selected" : ""}>${escapeHtml(item.name || item.subject || "参照画像")}</option>`).join("")}
            </select>
          </label>
        ` : `<label>ラベル<input id="${prefix}-reference-label-${index}" value="${escapeHtml(slot.label)}"></label>`}
        <label>Node ID
          <input id="${prefix}-reference-node-${index}" placeholder="LoadImageのNode ID" value="${escapeHtml(slot.nodeId)}">
        </label>
        <label>Input
          <input id="${prefix}-reference-input-${index}" value="${escapeHtml(slot.inputName || "image")}">
        </label>
        ${includeReference ? `<div class="reference-slot-preview">${selected ? `<img src="${escapeHtml(selected.url)}" alt=""><span>${escapeHtml(selected.subject || selected.name || "")}</span>` : `<span>未選択</span>`}</div>` : ""}
      </div>
    `;
  }).join("");
}

function renderComfyModelDatalists() {
  const checkpoints = Array.isArray(state.comfyModels?.checkpoints) ? state.comfyModels.checkpoints : [];
  const loras = Array.isArray(state.comfyModels?.loras) ? state.comfyModels.loras : [];
  return `
    <datalist id="comfy-checkpoint-options">
      ${checkpoints.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("")}
    </datalist>
    <datalist id="comfy-lora-options">
      ${loras.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("")}
    </datalist>
  `;
}

function renderComfyModelStatus() {
  const checkpoints = Array.isArray(state.comfyModels?.checkpoints) ? state.comfyModels.checkpoints : [];
  const loras = Array.isArray(state.comfyModels?.loras) ? state.comfyModels.loras : [];
  if (state.comfyModelStatus === "loading") return `<div class="full meta">ComfyUIのモデル一覧を取得中です。</div>`;
  if (state.comfyModelStatus === "failed") return `<div class="full meta danger-text">${escapeHtml(state.comfyModelError || "ComfyUIのモデル一覧を取得できませんでした。")}</div>`;
  if (!checkpoints.length && !loras.length) return `<div class="full meta">モデル一覧を取得すると、CheckpointとLoRA名を候補から選べます。</div>`;
  const updated = state.comfyModels?.updatedAt ? ` / ${new Date(state.comfyModels.updatedAt).toLocaleString("ja-JP")}` : "";
  return `<div class="full meta">ComfyUIモデル一覧: Checkpoint ${checkpoints.length}件 / LoRA ${loras.length}件${escapeHtml(updated)}</div>`;
}

function renderComfyValidationResult() {
  const result = state.comfyValidation;
  if (!result) return "";
  if (result.status === "loading") return `<div class="full comfy-validation">workflow事前チェック中です。</div>`;
  const errors = Array.isArray(result.errors) ? result.errors : [];
  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const summary = result.summary || {};
  const className = errors.length ? "failed" : warnings.length ? "warning" : "ok";
  const title = errors.length ? "事前チェック: 要修正" : warnings.length ? "事前チェック: 注意あり" : "事前チェック: OK";
  return `
    <div class="full comfy-validation ${className}">
      <strong>${escapeHtml(title)}</strong>
      <div class="meta">${escapeHtml(`${summary.nodeCount ?? "-"} nodes / ${summary.edgeCount ?? "-"} connections / LoRA ${summary.loraCount ?? 0}件 / 参照画像 ${summary.referenceCount ?? 0}件 / Checkpoint ${summary.checkpoint || "workflow既定"}`)}</div>
      ${errors.length ? `<ul>${errors.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${warnings.length ? `<ul>${warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    </div>
  `;
}

function parseComfyWorkflowForUi(workflowJson) {
  try {
    const parsed = JSON.parse(String(workflowJson || "{}"));
    const prompt = parsed?.prompt && typeof parsed.prompt === "object" ? parsed.prompt : parsed;
    if (!prompt || typeof prompt !== "object" || Array.isArray(prompt)) {
      return { prompt: null, error: "workflow JSONはComfyUIのAPI Formatオブジェクトである必要があります。" };
    }
    return { prompt, error: "" };
  } catch (error) {
    return { prompt: null, error: `workflow JSONを解析できません: ${error.message}` };
  }
}

function isComfyWorkflowLink(value) {
  return Array.isArray(value) && value.length >= 2 && (typeof value[0] === "string" || typeof value[0] === "number");
}

function comfyWorkflowNodeTitle(node, id) {
  return node?._meta?.title || node?.class_type || `Node ${id}`;
}

function comfyWorkflowValuePreview(value) {
  if (isComfyWorkflowLink(value)) return `Node ${value[0]}:${value[1]}`;
  if (typeof value === "string") return compactPromptText(value, 80);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return compactPromptText(JSON.stringify(value), 80);
}

function comfyWorkflowNodeBadges(id, node, settings) {
  const badges = [];
  const idText = String(id);
  if (idText === settings.positiveNodeId) badges.push("Positive");
  if (idText === settings.negativeNodeId) badges.push("Negative");
  if (idText === settings.seedNodeId) badges.push("Seed");
  if (idText === settings.sizeNodeId) badges.push("Size");
  if (idText === settings.stepsNodeId) badges.push("Steps");
  if (idText === settings.cfgNodeId) badges.push("CFG");
  if (idText === settings.samplerNodeId) badges.push("Sampler");
  if (idText === settings.checkpointNodeId) badges.push("Checkpoint");
  if (/lora/i.test(String(node?.class_type || ""))) badges.push("LoRA");
  return [...new Set(badges)];
}

function renderComfyWorkflowVisual(settings) {
  const { prompt, error } = parseComfyWorkflowForUi(settings.workflowJson);
  if (error) {
    return `<div class="workflow-visual"><div class="danger-text">${escapeHtml(error)}</div></div>`;
  }
  const entries = Object.entries(prompt).sort(([a], [b]) => {
    const aNum = Number(a);
    const bNum = Number(b);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
    return String(a).localeCompare(String(b), "ja");
  });
  const edges = [];
  const loraSummary = activeComfyLoras(settings.loras).map((item) => item.name).join(", ");
  const cards = entries.map(([id, node]) => {
    const inputs = Object.entries(node?.inputs || {});
    inputs.forEach(([key, value]) => {
      if (isComfyWorkflowLink(value)) {
        edges.push({ from: String(value[0]), output: value[1], to: String(id), input: key });
      }
    });
    const badges = comfyWorkflowNodeBadges(id, node, settings);
    const pinnedInputs = inputs
      .filter(([, value]) => !isComfyWorkflowLink(value))
      .slice(0, 4)
      .map(([key, value]) => `<li><span>${escapeHtml(key)}</span>${escapeHtml(comfyWorkflowValuePreview(value))}</li>`)
      .join("");
    return `
      <article class="workflow-node-card ${badges.length ? "highlight" : ""}">
        <div class="workflow-node-top">
          <strong>${escapeHtml(id)}</strong>
          <span>${escapeHtml(node?.class_type || "Unknown")}</span>
        </div>
        <div class="workflow-node-title">${escapeHtml(comfyWorkflowNodeTitle(node, id))}</div>
        ${badges.length ? `<div class="workflow-node-badges">${badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</div>` : ""}
        ${pinnedInputs ? `<ul class="workflow-node-inputs">${pinnedInputs}</ul>` : ""}
      </article>
    `;
  }).join("");
  const edgeHtml = edges.slice(0, 80).map((edge) => `
    <li><strong>${escapeHtml(edge.from)}:${escapeHtml(edge.output)}</strong><span>-&gt;</span><strong>${escapeHtml(edge.to)}</strong><span>${escapeHtml(edge.input)}</span></li>
  `).join("");
  return `
    <div class="workflow-visual">
      <div class="workflow-summary">${entries.length} nodes / ${edges.length} connections${loraSummary ? ` / LoRA: ${escapeHtml(loraSummary)}` : ""}</div>
      <div class="workflow-node-grid">${cards}</div>
      <div class="workflow-edge-list">
        <div class="meta">接続</div>
        <ul>${edgeHtml || "<li>接続はありません。</li>"}</ul>
      </div>
    </div>
  `;
}

function renderComfySettings() {
  const settings = activeComfySettings();
  return `
    <section class="panel settings-panel">
      <div class="panel-header">
        <h2>ComfyUI</h2>
        <div class="group">
          <button class="ghost" data-action="check-comfy">連携確認</button>
          <button class="ghost" data-action="load-comfy-models" ${state.comfyModelStatus === "loading" ? "disabled" : ""}>モデル一覧</button>
          <button class="ghost" data-action="validate-comfy-workflow">事前チェック</button>
        </div>
      </div>
      <div class="panel-body form-grid">
        ${renderComfyModelDatalists()}
        ${renderComfyPresetControls("setting")}
        <label class="full">既定GPU
          <select id="setting-comfy-gpu-mode">
            <option value="local" ${settings.gpuMode === "local" ? "selected" : ""}>ローカルGPU</option>
            <option value="cloud" ${settings.gpuMode === "cloud" ? "selected" : ""}>クラウドGPU</option>
          </select>
        </label>
        <label class="full">ローカルComfyUI URL
          <input id="setting-comfy-local-url" placeholder="http://127.0.0.1:8188" value="${escapeHtml(settings.localBaseUrl)}">
        </label>
        <label class="full">クラウドComfyUI URL
          <input id="setting-comfy-cloud-url" placeholder="https://your-comfy.example.com" value="${escapeHtml(settings.cloudBaseUrl)}">
        </label>
        <label class="full">クラウドAPIキー
          <input id="setting-comfy-cloud-api-key" type="password" placeholder="Bearer token / API key" value="${escapeHtml(comfyCloudApiKey())}">
        </label>
        <label>既定幅
          <input id="setting-comfy-width" type="number" min="64" max="4096" step="64" value="${escapeHtml(settings.width)}">
        </label>
        <label>既定高さ
          <input id="setting-comfy-height" type="number" min="64" max="4096" step="64" value="${escapeHtml(settings.height)}">
        </label>
        <label>既定Steps
          <input id="setting-comfy-steps" type="number" min="1" max="150" value="${escapeHtml(settings.steps)}">
        </label>
        <label>既定CFG
          <input id="setting-comfy-cfg" type="number" min="0" max="30" step="0.5" value="${escapeHtml(settings.cfg)}">
        </label>
        <label>既定Sampler
          <input id="setting-comfy-sampler" value="${escapeHtml(settings.samplerName)}">
        </label>
        <label>既定Scheduler
          <input id="setting-comfy-scheduler" value="${escapeHtml(settings.scheduler)}">
        </label>
        <label>既定Batch
          <input id="setting-comfy-batch-size" type="number" min="1" max="8" value="${escapeHtml(settings.batchSize)}">
        </label>
        <label>既定Seed
          <input id="setting-comfy-seed" type="number" placeholder="空欄でランダム" value="${escapeHtml(settings.seed)}">
        </label>
        <label class="full">既定Checkpoint
          <input id="setting-comfy-checkpoint" list="comfy-checkpoint-options" placeholder="例: animagineXL.safetensors" value="${escapeHtml(settings.checkpoint)}">
        </label>
        <div class="full comfy-lora-list">
          <div class="field-label">LoRA</div>
          ${renderComfyLoraRows("setting", settings.loras)}
        </div>
        <div class="full comfy-reference-panel">
          <div class="field-label">参照画像Node</div>
          <div class="meta">画像生成画面で選んだ参照画像を差し込むLoadImage系Nodeを指定します。</div>
          ${renderComfyReferenceSlotRows("setting", settings.referenceSlots)}
        </div>
        ${renderComfyModelStatus()}
        ${renderComfyValidationResult()}
        <div class="full comfy-node-grid">
          <label>Positive Node<input id="setting-comfy-positive-node" value="${escapeHtml(settings.positiveNodeId)}"></label>
          <label>Negative Node<input id="setting-comfy-negative-node" value="${escapeHtml(settings.negativeNodeId)}"></label>
          <label>Seed Node<input id="setting-comfy-seed-node" value="${escapeHtml(settings.seedNodeId)}"></label>
          <label>Size Node<input id="setting-comfy-size-node" value="${escapeHtml(settings.sizeNodeId)}"></label>
          <label>Steps Node<input id="setting-comfy-steps-node" value="${escapeHtml(settings.stepsNodeId)}"></label>
          <label>CFG Node<input id="setting-comfy-cfg-node" value="${escapeHtml(settings.cfgNodeId)}"></label>
          <label>Sampler Node<input id="setting-comfy-sampler-node" value="${escapeHtml(settings.samplerNodeId)}"></label>
          <label>Checkpoint Node<input id="setting-comfy-checkpoint-node" value="${escapeHtml(settings.checkpointNodeId)}"></label>
        </div>
        <label class="full">Workflow表示
          <select id="setting-comfy-workflow-mode">
            <option value="json" ${settings.workflowViewMode === "json" ? "selected" : ""}>JSON編集</option>
            <option value="visual" ${settings.workflowViewMode === "visual" ? "selected" : ""}>ビジュアル確認</option>
          </select>
        </label>
        ${settings.workflowViewMode === "visual"
          ? renderComfyWorkflowVisual(settings)
          : `<label class="full">Workflow JSON
              <textarea id="setting-comfy-workflow" class="json-textarea" spellcheck="false">${escapeHtml(settings.workflowJson)}</textarea>
            </label>`}
        <div class="full meta">ComfyUIで「Save (API Format)」したworkflowを貼り付けると、上のNode IDに対応する入力だけを生成時に差し替えます。完成画像は data/uploads の作品フォルダ内「_画像生成」に保存され、画像一覧にも登録されます。</div>
      </div>
    </section>
  `;
}

function renderSettings() {
  const statusText = {
    idle: "モデル一覧はまだ読み込まれていません。",
    loading: "OpenRouter からモデル一覧を読み込み中です。",
    loaded: `${state.openRouterModels.length} 件のモデルを読み込みました。`,
    failed: `モデル一覧を取得できませんでした。保存済み候補を表示しています。${state.openRouterModelError ? ` ${state.openRouterModelError}` : ""}`
  }[state.openRouterModelStatus] || "";
  const settingsVideoModelId = compatibleVideoModelId(state.db.settings.seedanceModel, state.db.settings.seedanceBaseUrl);
  const videoModel = videoModelConfig(settingsVideoModelId, state.db.settings.seedanceBaseUrl);
  const settingsResolutionOptions = optionList(videoModel.supported_resolutions, [state.db.settings.seedanceResolution || "720p"]);
  const settingsResolution = optionValue(state.db.settings.seedanceResolution || "720p", settingsResolutionOptions);
	  const videoStatusText = seedanceSettingsStatusText(state.db.settings.seedanceBaseUrl);
	  const elevenLabsVoiceText = state.elevenLabsVoiceStatus === "loaded"
	    ? `${state.elevenLabsVoices.length} 件のElevenLabs音声を読み込みました。`
	    : state.elevenLabsVoiceStatus === "loading"
	      ? "ElevenLabs音声一覧を読み込み中です。"
	      : state.elevenLabsVoiceError || "ElevenLabs APIキーを保存すると、音声生成画面で音声一覧を取得できます。";
	  const elevenLabsModelText = state.elevenLabsModelStatus === "loaded"
	    ? `${state.elevenLabsModels.length} 件のElevenLabs TTS対応モデルを読み込みました。`
	    : state.elevenLabsModelStatus === "loading"
	      ? "ElevenLabsモデル一覧を読み込み中です。"
	      : state.elevenLabsModelError || "未取得時は主要TTSモデルを候補表示します。";
	  const irodoriStatusText = state.irodoriStatusMessage || "Irodori-TTSの配置場所を確認できます。未導入の環境ではセットアップを実行すると vendor/Irodori-TTS に取得します。";
	  const voiceboxStatusText = state.voiceboxProfileStatus === "loaded"
	    ? `${state.voiceboxProfiles.length} 件のVoiceboxプロファイルを読み込みました。`
	    : state.voiceboxProfileStatus === "loading"
	      ? "Voiceboxプロファイルを読み込み中です。"
	      : state.voiceboxProfileError || "Voiceboxアプリを起動すると、ローカルAPIからプロファイルを取得できます。";
  return `
    <section class="panel">
      <div class="panel-header"><h2>OpenRouter</h2></div>
      <div class="panel-body form-grid">
        <label class="full">API キー
          <input id="setting-api-key" type="password" placeholder="sk-or-v1-..." value="${escapeHtml(apiKey())}">
        </label>
        ${renderModelSelect("setting-model", "画像判別モデル", state.db.settings.defaultModel || "", "image")}
        ${renderModelSelect("setting-text-model", "テキスト生成モデル", state.db.settings.textModel || "", "text")}
        ${renderModelSelect("setting-world-model", "世界観読み込みモデル", state.db.settings.worldModel || state.db.settings.defaultModel || "", "image")}
        ${renderModelSelect("setting-image-agent-model", "画像生成エージェントモデル", state.db.settings.imageAgentModel || state.db.settings.textModel || "", "text")}
        ${renderModelSelect("setting-video-agent-model", "動画エージェントモデル", state.db.settings.videoAgentModel || state.db.settings.textModel || "", "image")}
        ${renderModelSelect("setting-audio-agent-model", "音声エージェントモデル", state.db.settings.audioAgentModel || state.db.settings.textModel || "", "text")}
        <label class="full">音声生成モデル
          <select id="setting-audio-tts-model">${renderOpenRouterTtsModelOptions(state.db.settings.audioModel || defaultOpenRouterTtsModel)}</select>
        </label>
        <div class="full meta">${escapeHtml(statusText)}</div>
        <div class="full meta">キーはブラウザ内に保存されます。作品データ、画像、生成音声はこのアプリの data フォルダに保存されます。世界観読み込みモデルは設定シート画像の読解に使います。音声エージェントモデルは読み上げテキスト案の作成だけに使います。</div>
        <div class="full toolbar">
          <button data-action="save-settings">設定を保存</button>
          <button class="ghost" data-action="test-openrouter">接続テスト</button>
          <button class="ghost" data-action="reload-openrouter-models">モデル一覧を再取得</button>
        </div>
      </div>
	    </section>
	    <section class="panel settings-panel">
	      <div class="panel-header"><h2>ElevenLabs</h2></div>
	      <div class="panel-body form-grid">
	        <label class="full">API キー
	          <input id="setting-elevenlabs-api-key" type="password" placeholder="xi-api-key" value="${escapeHtml(elevenLabsApiKey())}">
	        </label>
	        <label class="full">既定 Voice ID
	          <select id="setting-elevenlabs-voice-id">${renderElevenLabsVoiceOptions(state.db.settings.elevenLabsVoiceId || "JBFqnCBsd6RMkjVDRZzb")}</select>
	        </label>
	        <label>既定モデル
	          <select id="setting-elevenlabs-model-id">${renderElevenLabsModelOptions(state.db.settings.elevenLabsModelId || "eleven_multilingual_v2")}</select>
	        </label>
	        <label>既定出力形式
	          <select id="setting-elevenlabs-output-format">${renderSimpleOptions(elevenLabsOutputFormats, state.db.settings.elevenLabsOutputFormat || "mp3_44100_128")}</select>
	        </label>
	        <label>Stability
	          <input id="setting-elevenlabs-stability" type="number" min="0" max="1" step="0.05" value="${state.db.settings.elevenLabsStability}">
	        </label>
	        <label>Similarity
	          <input id="setting-elevenlabs-similarity" type="number" min="0" max="1" step="0.05" value="${state.db.settings.elevenLabsSimilarityBoost}">
	        </label>
	        <label>Style
	          <input id="setting-elevenlabs-style" type="number" min="0" max="1" step="0.05" value="${state.db.settings.elevenLabsStyle}">
	        </label>
	        <label>Speed
	          <input id="setting-elevenlabs-speed" type="number" min="0.7" max="1.2" step="0.05" value="${state.db.settings.elevenLabsSpeed}">
	        </label>
	        <label>言語コード
	          <input id="setting-elevenlabs-language-code" value="${escapeHtml(state.db.settings.elevenLabsLanguageCode || "ja")}">
	        </label>
	        <label class="check-row">
	          <input id="setting-elevenlabs-speaker-boost" type="checkbox" ${state.db.settings.elevenLabsSpeakerBoost !== false ? "checked" : ""}>
	          <span>Speaker Boost</span>
	        </label>
	        <div class="full meta">${escapeHtml(elevenLabsVoiceText)}</div>
	        <div class="full meta">${escapeHtml(elevenLabsModelText)}</div>
	        <div class="full toolbar">
	          <button class="ghost" data-action="load-elevenlabs-voices" ${state.elevenLabsVoiceStatus === "loading" ? "disabled" : ""}>音声一覧取得</button>
	          <button class="ghost" data-action="load-elevenlabs-models" ${state.elevenLabsModelStatus === "loading" ? "disabled" : ""}>モデル一覧取得</button>
	        </div>
	      </div>
	    </section>
	    <section class="panel settings-panel">
	      <div class="panel-header"><h2>Voicebox</h2></div>
	      <div class="panel-body form-grid">
	        <label class="full">API URL
	          <input id="setting-voicebox-base-url" value="${escapeHtml(state.db.settings.voiceboxBaseUrl || voiceboxDefaultSettings.baseUrl)}" placeholder="http://127.0.0.1:17493">
	        </label>
	        <label class="full">既定プロファイル
	          <select id="setting-voicebox-profile-id">${renderVoiceboxProfileOptions(state.db.settings.voiceboxProfileId || "")}</select>
	        </label>
	        <label>既定言語
	          <select id="setting-voicebox-language">${Array.from(new Set([state.db.settings.voiceboxLanguage || "ja", ...voiceboxLanguageOptions].filter(Boolean))).map((language) => `<option value="${escapeHtml(language)}" ${language === (state.db.settings.voiceboxLanguage || "ja") ? "selected" : ""}>${escapeHtml(language)}</option>`).join("")}</select>
	        </label>
	        <label>既定Model size
	          <select id="setting-voicebox-model-size">${Array.from(new Set([state.db.settings.voiceboxModelSize || "1.7B", ...voiceboxModelSizeOptions].filter(Boolean))).map((modelSize) => `<option value="${escapeHtml(modelSize)}" ${modelSize === (state.db.settings.voiceboxModelSize || "1.7B") ? "selected" : ""}>${escapeHtml(modelSize)}</option>`).join("")}</select>
	        </label>
	        <div class="full meta">${escapeHtml(voiceboxStatusText)}</div>
	        <div class="full toolbar">
	          <button class="ghost" data-action="load-voicebox-profiles" ${state.voiceboxProfileStatus === "loading" ? "disabled" : ""}>プロファイル取得</button>
	        </div>
	        <div class="full meta">Voiceboxは通常この端末のローカルAPI（http://127.0.0.1:17493）へ接続します。プロファイルはVoicebox側で作成・管理します。</div>
	      </div>
	    </section>
	    <section class="panel settings-panel">
      <div class="panel-header"><h2>Irodori-TTS連携</h2></div>
      <div class="panel-body form-grid">
        <label class="full">Irodori-TTSフォルダ
          <input id="setting-irodori-app-dir" placeholder="vendor/Irodori-TTS または upstream/Irodori-TTS を含むフォルダ" value="${escapeHtml(state.db.settings.irodoriAppDir || "vendor/Irodori-TTS")}">
        </label>
        <div class="full meta">${escapeHtml(irodoriStatusText)}</div>
        <div class="full toolbar">
          <button class="ghost" data-action="check-irodori" ${state.irodoriStatus === "loading" ? "disabled" : ""}>連携確認</button>
          <button class="ghost" data-action="setup-irodori" ${state.irodoriStatus === "loading" ? "disabled" : ""}>Irodori-TTSを取得</button>
        </div>
        <div class="full meta">この端末では既存のIrodori-TTSも検出できます。別のユーザーは「Irodori-TTSを取得」でGitHubから取得し、uv sync まで実行できます。初回生成時はモデルのダウンロードで時間がかかります。</div>
      </div>
    </section>
    ${renderComfySettings()}
    <section class="panel settings-panel">
      <div class="panel-header"><h2>Seedance</h2></div>
      <div class="panel-body form-grid">
        <label class="full">API キー
          <input id="setting-seedance-api-key" type="password" placeholder="BytePlus / OpenRouter / Replicate API key" value="${escapeHtml(seedanceApiKey())}">
        </label>
        ${renderSeedanceApiBaseSelect(state.db.settings.seedanceBaseUrl)}
        <label>動画モデル
          ${renderVideoModelSelect("setting-seedance-model", settingsVideoModelId, state.db.settings.seedanceBaseUrl)}
        </label>
        <label>既定解像度
          <select id="setting-seedance-resolution">
            ${settingsResolutionOptions.map((value) => `<option value="${escapeHtml(value)}" ${value === settingsResolution ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
          </select>
        </label>
        <div id="setting-seedance-status" class="full meta">${escapeHtml(videoStatusText)}</div>
        <div class="full meta">生成動画は完了後に data/videos に保存されます。OpenRouterを選んだ場合は上のOpenRouter APIキー欄を優先し、Replicateを選んだ場合はこのAPIキー欄にReplicate tokenを保存してください。</div>
      </div>
    </section>
  `;
}

function bindCommon() {
  document.querySelectorAll("[data-nav-parent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.defaultView || button.dataset.navParent;
      render();
    });
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });
  document.querySelector("[data-action='save-now']")?.addEventListener("click", async () => {
    await saveDb();
    toast("保存しました。");
  });
  document.querySelector("[data-action='open-help']")?.addEventListener("click", openCurrentHelpModal);
}

function bindView() {
  if (state.view === "studio") bindStudio();
  if (state.view === "import") bindImport();
  if (state.view === "gallery") bindGallery();
  if (state.view === "image") bindImageAgent();
  if (state.view === "edit") bindImageEditor();
  if (state.view === "edit-gif") bindVideoGifConverter();
  if (state.view === "audio") bindAudioAgent();
  if (state.view === "video") bindVideoAgent();
  if (state.view === "library") bindLibrary();
  if (state.view === "prompt") bindPromptLab();
  if (state.view === "settings") bindSettings();
}

function bindStudio() {
  document.querySelectorAll("[data-action='select-work']").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.selectedWorkId = row.dataset.id;
      clearWorldImportSources();
      render();
    });
  });
  document.querySelectorAll("[data-action='move-work']").forEach((button) => {
    button.addEventListener("click", async () => {
      const direction = Number(button.dataset.direction);
      const moved = moveWorkInList(button.dataset.id, direction);
      if (!moved) return;
      await saveDb();
      render();
    });
  });
  document.querySelector("[data-action='new-work']")?.addEventListener("click", () => openWorkModal());
  document.querySelectorAll("[data-action='edit-work']").forEach((button) => {
    button.addEventListener("click", () => openWorkModal(byId(state.db.works, button.dataset.id)));
  });
  document.querySelector("[data-action='new-character']")?.addEventListener("click", () => openCharacterModal());
  document.querySelectorAll("[data-action='edit-character']").forEach((button) => {
    button.addEventListener("click", () => openCharacterModal(byId(state.db.characters, button.dataset.id)));
  });
  document.querySelector("[data-action='new-world-item']")?.addEventListener("click", () => openWorldItemModal());
  document.querySelectorAll("[data-action='edit-world-item']").forEach((button) => {
    button.addEventListener("click", () => openWorldItemModal(workWorldItemById(button.dataset.id)));
  });
  document.querySelectorAll("[data-action='show-character-images']").forEach((button) => {
    button.addEventListener("click", () => {
      const char = byId(state.db.characters, button.dataset.id);
      state.selectedWorkId = char.workId;
      state.galleryWorkId = char.workId;
      state.galleryCharacterId = `char:${char.id}`;
      state.view = "gallery";
      render();
    });
  });
  document.querySelectorAll("[data-action='show-character-audios']").forEach((button) => {
    button.addEventListener("click", () => openCharacterAudioModal(byId(state.db.characters, button.dataset.id)));
  });
  document.querySelectorAll("[data-action='show-world-item-images']").forEach((button) => {
    button.addEventListener("click", () => {
      const item = workWorldItemById(button.dataset.id);
      if (!item) return;
      state.selectedWorkId = item.workId;
      state.galleryWorkId = item.workId;
      state.galleryCharacterId = `world:${item.id}`;
      state.view = "gallery";
      render();
    });
  });
  const worldSheetInput = document.querySelector("#world-sheet-input");
  const worldTextFileInput = document.querySelector("#world-text-file-input");
  const worldTextDraft = document.querySelector("#world-text-draft");
  const worldAnalyzeButton = document.querySelector("[data-action='analyze-world-sheet']");
  const syncWorldAnalyzeState = () => {
    if (worldAnalyzeButton) {
      worldAnalyzeButton.disabled = !((state.worldSheetFiles || []).length || String(state.worldTextDraft || "").trim());
    }
  };
  document.querySelector("[data-action='choose-world-sheet']")?.addEventListener("click", () => worldSheetInput?.click());
  worldSheetInput?.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    if (files.length > maxWorldSheetImages) {
      toast(`画像シートは一度に${maxWorldSheetImages}枚までです。先頭${maxWorldSheetImages}枚を読み込みます。`);
    }
    state.worldSheetFiles = await Promise.all(files.slice(0, maxWorldSheetImages).map(async (file) => {
      const preview = await fileToDataUrl(file);
      return {
        name: file.name,
        preview,
        imageInfo: await getImageInfo(preview)
      };
    }));
    render();
  });
  document.querySelector("[data-action='choose-world-text']")?.addEventListener("click", () => worldTextFileInput?.click());
  worldTextFileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    state.worldTextDraft = await fileToText(file);
    state.worldTextSourceName = file.name;
    render();
  });
  worldTextDraft?.addEventListener("input", (event) => {
    state.worldTextDraft = event.target.value;
    if (!state.worldTextDraft.trim()) state.worldTextSourceName = "";
    syncWorldAnalyzeState();
  });
  document.querySelector("[data-action='clear-world-sources']")?.addEventListener("click", () => {
    clearWorldImportSources();
    render();
  });
  document.querySelector("[data-action='analyze-world-sheet']")?.addEventListener("click", async (event) => {
    const work = byId(state.db.works, event.currentTarget.dataset.id);
    if (!work) return;
    await analyzeWorldSheet(work);
  });
  document.querySelector("[data-action='edit-world-setting']")?.addEventListener("click", (event) => {
    const work = byId(state.db.works, event.currentTarget.dataset.id);
    if (work) openWorldSettingModal(work);
  });
  document.querySelectorAll("[data-action='use-world-sheet']").forEach((button) => {
    button.addEventListener("click", async () => {
      const work = byId(state.db.works, state.selectedWorkId);
      if (!work) return;
      applyWorldSheetToWork(work, button.dataset.sheetId);
      await saveDb();
      toast("表示する設定シートを切り替えました。");
      render();
    });
  });
  document.querySelectorAll("[data-action='edit-world-sheet']").forEach((button) => {
    button.addEventListener("click", () => {
      const work = byId(state.db.works, state.selectedWorkId);
      if (work) openWorldSettingModal(work, button.dataset.sheetId);
    });
  });
  document.querySelectorAll("[data-action='restructure-world-sheet']").forEach((button) => {
    button.addEventListener("click", async () => {
      const work = byId(state.db.works, state.selectedWorkId);
      if (!work) return;
      button.disabled = true;
      try {
        await restructureWorldSheet(work, button.dataset.sheetId);
      } catch (error) {
        toast(error.message);
        button.disabled = false;
      }
    });
  });
  document.querySelectorAll("[data-action='delete-world-sheet']").forEach((button) => {
    button.addEventListener("click", async () => {
      const work = byId(state.db.works, state.selectedWorkId);
      if (!work) return;
      const setting = ensureWorldSetting(work);
      const sheet = setting.sheets.find((item) => item.id === button.dataset.sheetId);
      const ok = window.confirm(`「${sheet?.title || "設定シート"}」を作品情報の履歴から削除します。画像ファイル本体は削除しません。`);
      if (!ok) return;
      rebuildWorldSettingAfterSheetRemoval(work, button.dataset.sheetId);
      await saveDb();
      toast("設定シートを削除しました。");
      render();
    });
  });
}

function bindImport() {
  const input = document.querySelector("#file-input");
  const zone = document.querySelector("#drop-zone");
  document.querySelector("[data-action='choose-files']")?.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => loadImportFiles(input.files));
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", async (event) => {
    event.preventDefault();
    zone.classList.remove("dragover");
    await loadImportFiles(event.dataTransfer.files);
  });
  document.querySelector("#import-work")?.addEventListener("change", (event) => {
    state.selectedWorkId = event.target.value || null;
    const validCharacters = charactersForWork(state.selectedWorkId);
    const validWorldItems = worldItemsForWork(state.selectedWorkId);
    if (state.importCharacterId && !validCharacters.some((char) => char.id === state.importCharacterId)) {
      state.importCharacterId = "";
    }
    if (state.importWorldItemId && !validWorldItems.some((item) => item.id === state.importWorldItemId)) {
      state.importWorldItemId = "";
    }
    render();
  });
  document.querySelector("#import-character")?.addEventListener("change", (event) => {
    state.importCharacterId = event.target.value;
    if (state.importCharacterId) state.importWorldItemId = "";
    const char = byId(state.db.characters, state.importCharacterId);
    if (char) state.selectedWorkId = char.workId;
    render();
  });
  document.querySelector("#import-world-item")?.addEventListener("change", (event) => {
    state.importWorldItemId = event.target.value;
    if (state.importWorldItemId) state.importCharacterId = "";
    const item = workWorldItemById(state.importWorldItemId);
    if (item) state.selectedWorkId = item.workId;
    render();
  });
  document.querySelector("#auto-classify")?.addEventListener("change", (event) => {
    state.importAutoClassify = event.target.value === "on";
  });
  document.querySelector("#import-prompt-format")?.addEventListener("change", (event) => {
    state.importPromptFormat = event.target.value;
  });
  document.querySelector("#move-imported-sources")?.addEventListener("change", async (event) => {
    state.db.settings.moveImportedSourcesToTrash = event.target.value === "on";
    await saveDb();
  });
  document.querySelector("#import-source-root")?.addEventListener("change", async (event) => {
    state.db.settings.importSourceRoot = event.target.value.trim();
    await saveDb();
  });
  document.querySelector("[data-action='run-import']")?.addEventListener("click", runImport);
}

async function loadImportFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith("image/"));
  state.importFiles = await Promise.all(images.map(async (file) => {
    const preview = await fileToDataUrl(file);
    return {
      name: file.name,
      file,
      sourcePath: clientSourcePathForFile(file),
      relativePath: file.webkitRelativePath || "",
      size: file.size,
      preview,
      imageInfo: await getImageInfo(preview)
    };
  }));
  render();
}

async function trashImportedSourceFiles(created) {
  if (state.db.settings.moveImportedSourcesToTrash !== true || !created.length) return;
  const results = [];
  for (const item of created) {
    const source = item.source || {};
    const result = await postJson("/api/trash-import-source", {
      uploadedUrl: item.asset.url,
      sourcePath: source.sourcePath || "",
      relativePath: source.relativePath || "",
      sourceRoot: state.db.settings.importSourceRoot || "",
      name: source.name || item.asset.name,
      size: source.size || 0
    });
    results.push(result);
  }
  const movedCount = results.filter((item) => item.trashed).length;
  const skippedCount = results.length - movedCount;
  if (movedCount) {
    toast(`元ファイル ${movedCount} 件をゴミ箱に移動しました。${skippedCount ? ` ${skippedCount} 件はスキップしました。` : ""}`);
  } else if (skippedCount) {
    const reason = results.find((item) => item.reason)?.reason || "元ファイルを特定できませんでした。";
    toast(`元ファイルのゴミ箱移動はスキップされました。${reason}`);
  }
}

function renderImageProgressView() {
  if (state.view === "library" || state.view === "gallery") render();
}

async function classifyAndRelocateAsset(asset, knownDataUrl = null, fallbackPromptFormat = state.importPromptFormat) {
  if (!asset) return false;
  let completed = false;
  try {
    await classifyAsset(asset, knownDataUrl, fallbackPromptFormat, { onProgress: renderImageProgressView });
    await relocateAsset(asset);
    completed = true;
  } catch (error) {
    markAssetClassificationFailed(asset, error);
  } finally {
    clearAssetClassificationProgress(asset);
    await saveDb();
    renderImageProgressView();
  }
  return completed;
}

async function classifyImportedAssets(created, fallbackPromptFormat) {
  let errors = 0;
  for (const item of created) {
    const asset = byId(state.db.assets, item.asset.id);
    if (!asset) continue;
    const completed = await classifyAndRelocateAsset(asset, item.dataUrl, fallbackPromptFormat);
    if (!completed) errors += 1;
  }
  toast(errors ? `AI判別が完了しました。${errors} 件は処理に失敗しました。` : "AI判別が完了しました。");
  renderImageProgressView();
}

async function runImport() {
  if (state.importIsRunning) return;
  if (!state.importFiles.length) return;
  const workId = document.querySelector("#import-work")?.value || "";
  const selectedCharacterId = document.querySelector("#import-character")?.value || "";
  const selectedWorldItemId = document.querySelector("#import-world-item")?.value || "";
  state.db.settings.moveImportedSourcesToTrash = document.querySelector("#move-imported-sources")?.value === "on";
  state.db.settings.importSourceRoot = document.querySelector("#import-source-root")?.value.trim() || "";
  const targetCharacter = byId(state.db.characters, selectedCharacterId);
  const targetWorldItem = workWorldItemById(selectedWorldItemId);
  const targetWorkId = targetCharacter?.workId || targetWorldItem?.workId || workId || null;
  const targetWork = byId(state.db.works, targetWorkId);
  const shouldAutoClassify = !targetCharacter && !targetWorldItem && state.importAutoClassify;
  const created = [];
  state.importIsRunning = true;
  render();
  try {
    for (const item of state.importFiles) {
      const uploaded = await postJson("/api/upload", {
        dataUrl: item.preview,
        name: item.name,
        workName: targetWork?.name,
        characterName: targetCharacter?.name || targetWorldItem?.name
      });
      const asset = {
        id: uid(),
        workId: targetWorkId,
        characterId: targetCharacter?.id || null,
        worldItemId: targetWorldItem?.id || null,
        name: item.name,
        url: uploaded.url,
        status: targetCharacter || targetWorldItem ? "matched" : shouldAutoClassify ? "classifying" : "unassigned",
        confidence: targetCharacter || targetWorldItem ? 1 : null,
        aiPrompt: "",
        aiPromptFormat: targetCharacter ? promptFormatOf(targetCharacter) : state.importPromptFormat,
        aiReason: "",
        width: item.imageInfo.width,
        height: item.imageInfo.height,
        aspectRatio: item.imageInfo.aspectRatio,
        aspectRatioText: item.imageInfo.aspectRatioText,
        createdAt: new Date().toISOString()
      };
      if (shouldAutoClassify) {
        setAssetClassificationProgress(asset, "queued", "AI判別APIへの送信順を待っています。");
      }
      state.db.assets.unshift(asset);
      created.push({
        asset,
        dataUrl: item.preview,
        source: {
          name: item.name,
          sourcePath: item.sourcePath || "",
          relativePath: item.relativePath || "",
          size: item.size || 0
        }
      });
    }
    await saveDb();
    await trashImportedSourceFiles(created);
    if (targetCharacter) {
      toast(`${created.length} 件を ${targetCharacter.name} に取り込みました。`);
    } else if (targetWorldItem) {
      toast(`${created.length} 件を ${worldItemCategoryLabel(targetWorldItem.category)}: ${targetWorldItem.name} に取り込みました。`);
    } else if (shouldAutoClassify && created.length) {
      toastApiSubmitted("API送信を開始しました。反映までお待ちください。進行状況は画像整理画面から確認できます。");
      state.importFiles = [];
      state.importIsRunning = false;
      state.view = "library";
      state.libraryStatus = "all";
      resetLibraryPage();
      render();
      classifyImportedAssets(created, state.importPromptFormat).catch((error) => {
        toast(error.message);
        renderImageProgressView();
      });
      return;
    } else {
      toast(`${created.length} 件を取り込みました。`);
    }
    state.importFiles = [];
    state.importIsRunning = false;
    state.view = "library";
    resetLibraryPage();
    render();
  } catch (error) {
    state.importIsRunning = false;
    toast(error.message);
    render();
  }
}

function bindLibrary() {
  document.querySelector("#library-work")?.addEventListener("change", (event) => {
    state.selectedWorkId = event.target.value || null;
    state.libraryCharacterId = "all";
    resetLibraryPage();
    render();
  });
  document.querySelector("#library-status")?.addEventListener("change", (event) => {
    state.libraryStatus = event.target.value;
    resetLibraryPage();
    render();
  });
  document.querySelector("#library-character")?.addEventListener("change", (event) => {
    state.libraryCharacterId = event.target.value;
    resetLibraryPage();
    render();
  });
  document.querySelector("#library-sort")?.addEventListener("change", (event) => {
    state.librarySort = event.target.value;
    resetLibraryPage();
    render();
  });
  document.querySelector("[data-action='library-page-prev']")?.addEventListener("click", () => {
    state.libraryPage -= 1;
    render();
  });
  document.querySelector("[data-action='library-page-next']")?.addEventListener("click", () => {
    state.libraryPage += 1;
    render();
  });
  document.querySelector("#library-page-size")?.addEventListener("change", (event) => {
    state.libraryPageSize = Number(event.target.value);
    resetLibraryPage();
    render();
  });
  document.querySelectorAll("[data-action='assign-asset']").forEach((select) => {
    select.addEventListener("change", async () => {
      const asset = byId(state.db.assets, select.dataset.id);
      if (!asset) return;
      const previous = {
        workId: asset.workId || null,
        characterId: asset.characterId || null,
        worldItemId: asset.worldItemId || null,
        status: asset.status || "unassigned",
        confidence: asset.confidence ?? null,
        url: asset.url,
        localPath: asset.localPath
      };
      select.disabled = true;
      const subject = parseSubjectValue(select.value);
      try {
        asset.characterId = subject.type === "character" ? subject.id : null;
        asset.worldItemId = subject.type === "world" ? subject.id : null;
        const char = byId(state.db.characters, asset.characterId);
        const worldItem = workWorldItemById(asset.worldItemId);
        if (char) asset.workId = char.workId;
        if (worldItem) asset.workId = worldItem.workId;
        asset.status = select.value ? "matched" : "unassigned";
        asset.confidence = select.value ? 1 : null;
        await relocateAsset(asset);
        await saveDb();
        render();
      } catch (error) {
        Object.assign(asset, previous);
        select.disabled = false;
        select.value = assetSubjectSelectValue(asset);
        toast(error.message);
      }
    });
  });
  document.querySelectorAll("[data-action='classify-one']").forEach((button) => {
    button.addEventListener("click", async () => {
      const asset = byId(state.db.assets, button.dataset.id);
      if (!asset || isAssetClassifying(asset)) return;
      setAssetClassificationProgress(asset, "queued", "AI判別APIへの送信順を待っています。");
      await saveDb();
      render();
      toastApiSubmitted("AI判別APIに送信しました。API返答待ちの状況は画像整理画面で確認できます。");
      await classifyAndRelocateAsset(asset);
    });
  });
  document.querySelector("[data-action='classify-visible']")?.addEventListener("click", async () => {
    const visible = getVisibleLibraryPageAssets().filter((asset) => !asset.worldItemId && !isAssetClassifying(asset));
    if (!visible.length) {
      toast("キャラ判別対象の画像がありません。");
      return;
    }
    visible.forEach((asset) => setAssetClassificationProgress(asset, "queued", "AI判別APIへの送信順を待っています。"));
    await saveDb();
    render();
    toastApiSubmitted("AI判別APIに送信しました。API返答待ちの状況は画像整理画面で確認できます。");
    for (const asset of visible) {
      await classifyAndRelocateAsset(asset);
    }
    toast("表示中の画像を判別しました。");
    render();
  });
  document.querySelector("[data-action='delete-visible-history']")?.addEventListener("click", async () => {
    const visible = getVisibleLibraryPageAssets();
    if (!visible.length) return;
    const ok = window.confirm(`表示中の ${visible.length} 件の履歴を削除します。画像ファイル本体とキャラ設定の立ち絵は削除されません。`);
    if (!ok) return;
    const ids = new Set(visible.map((asset) => asset.id));
    state.db.assets = state.db.assets.filter((asset) => !ids.has(asset.id));
    await saveDb();
    toast(`${visible.length} 件の履歴を削除しました。`);
    render();
  });
  document.querySelectorAll("[data-action='view-asset']").forEach((button) => {
    button.addEventListener("click", () => openAssetModal(byId(state.db.assets, button.dataset.id)));
  });
  document.querySelectorAll("[data-action='reveal-asset']").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await revealUpload(byId(state.db.assets, button.dataset.id));
      } catch (error) {
        toast(error.message);
      }
    });
  });
  document.querySelectorAll("[data-action='delete-asset-history']").forEach((button) => {
    button.addEventListener("click", async () => {
      const asset = byId(state.db.assets, button.dataset.id);
      if (!asset) return;
      const ok = window.confirm(`「${asset.name}」の履歴を削除します。画像ファイル本体とキャラ設定の立ち絵は削除されません。`);
      if (!ok) return;
      state.db.assets = state.db.assets.filter((item) => item.id !== asset.id);
      await saveDb();
      toast("履歴を削除しました。");
      render();
    });
  });
}

function bindGallery() {
  document.querySelectorAll("[data-action='toggle-gallery-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      state.galleryFiltersCollapsed = !state.galleryFiltersCollapsed;
      render();
    });
  });
  document.querySelector("#gallery-work")?.addEventListener("change", (event) => {
    state.galleryWorkId = event.target.value || null;
    state.selectedWorkId = state.galleryWorkId;
    state.galleryCharacterId = "";
    state.gallerySelectedAssetIds = [];
    render();
  });
  document.querySelector("#gallery-character")?.addEventListener("change", (event) => {
    state.galleryCharacterId = event.target.value;
    state.gallerySelectedAssetIds = [];
    render();
  });
  document.querySelector("[data-action='gallery-select-all']")?.addEventListener("click", () => {
    const ids = getVisibleGalleryAssets().map((asset) => asset.id);
    state.gallerySelectedAssetIds = [...new Set([...(state.gallerySelectedAssetIds || []), ...ids])];
    render();
  });
  document.querySelector("[data-action='gallery-clear-selection']")?.addEventListener("click", () => {
    const visibleIds = new Set(getVisibleGalleryAssets().map((asset) => asset.id));
    state.gallerySelectedAssetIds = (state.gallerySelectedAssetIds || []).filter((id) => !visibleIds.has(id));
    render();
  });
  document.querySelector("[data-action='delete-selected-gallery-assets']")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      button.disabled = true;
      await deleteGalleryAssetsCompletely(selectedVisibleGalleryAssets());
    } catch (error) {
      toast(error.message);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  });
  document.querySelectorAll("[data-action='select-gallery-asset']").forEach((input) => {
    input.addEventListener("change", () => {
      const ids = new Set(state.gallerySelectedAssetIds || []);
      if (input.checked) {
        ids.add(input.dataset.id);
      } else {
        ids.delete(input.dataset.id);
      }
      state.gallerySelectedAssetIds = [...ids];
      render();
    });
  });
  document.querySelectorAll("[data-action='view-asset']").forEach((button) => {
    button.addEventListener("click", () => openAssetModal(byId(state.db.assets, button.dataset.id)));
  });
  document.querySelectorAll("[data-action='reveal-asset']").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await revealUpload(byId(state.db.assets, button.dataset.id));
      } catch (error) {
        toast(error.message);
      }
    });
  });
  document.querySelectorAll("[data-action='delete-asset-completely']").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteAssetCompletely(byId(state.db.assets, button.dataset.id));
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function bindImageAgent() {
  const persistImageControls = () => {
    const controls = imageControlsFromDom();
    rememberImageControls(controls);
  };
  [
    "#image-gpu-mode",
    "#image-title",
    "#image-width",
    "#image-height",
    "#image-steps",
    "#image-cfg",
    "#image-sampler",
    "#image-scheduler",
    "#image-batch-size",
    "#image-seed",
    "#image-checkpoint",
    "#image-prompt-text",
    "#image-negative-prompt",
    "#image-lora-name-0",
    "#image-lora-name-1",
    "#image-lora-name-2",
    "#image-lora-model-0",
    "#image-lora-model-1",
    "#image-lora-model-2",
    "#image-lora-clip-0",
    "#image-lora-clip-1",
    "#image-lora-clip-2",
    "#image-reference-key-0",
    "#image-reference-key-1",
    "#image-reference-key-2",
    "#image-reference-node-0",
    "#image-reference-node-1",
    "#image-reference-node-2",
    "#image-reference-input-0",
    "#image-reference-input-1",
    "#image-reference-input-2",
    "#image-compare-enabled",
    "#image-compare-count",
    "#image-compare-mode"
  ].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", persistImageControls);
  });
  document.querySelectorAll("[id^='image-reference-']").forEach((input) => {
    input.addEventListener("input", persistImageControls);
  });
  document.querySelectorAll("[id^='image-lora-']").forEach((input) => {
    input.addEventListener("input", persistImageControls);
  });
  document.querySelector("#image-prompt-text")?.addEventListener("input", (event) => {
    state.imagePromptDraft = {
      ...(state.imagePromptDraft || {}),
      prompt: event.target.value
    };
    state.comfyValidation = null;
  });
  document.querySelector("#image-negative-prompt")?.addEventListener("input", (event) => {
    state.imagePromptDraft = {
      ...(state.imagePromptDraft || {}),
      negativePrompt: event.target.value
    };
    state.comfyValidation = null;
  });
  document.querySelector("#image-chat-input")?.addEventListener("input", (event) => {
    state.imageChatDraft = event.target.value;
  });
  document.querySelector("#image-gpu-mode")?.addEventListener("change", () => {
    persistImageControls();
    render();
  });
  ["#image-compare-enabled", "#image-compare-mode"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", () => {
      persistImageControls();
      render({ preserveLiveTextDrafts: true });
    });
  });
  document.querySelector("#image-work")?.addEventListener("change", (event) => {
    persistImageControls();
    state.imageWorkId = event.target.value || null;
    state.selectedWorkId = state.imageWorkId;
    if (state.imageCharacterId && !imageCharacterOptions().some((char) => char.id === state.imageCharacterId)) {
      state.imageCharacterId = "";
    }
    render();
  });
  document.querySelector("#image-character")?.addEventListener("change", (event) => {
    persistImageControls();
    state.imageCharacterId = event.target.value || "";
    const char = byId(state.db.characters, state.imageCharacterId);
    if (char) {
      state.imageWorkId = char.workId;
      state.selectedWorkId = char.workId;
    }
    render();
  });
  document.querySelector("[data-action='image-send-message']")?.addEventListener("click", () => handleImageAgentMessage(false));
  document.querySelector("[data-action='image-make-draft']")?.addEventListener("click", () => handleImageAgentMessage(true));
  document.querySelector("[data-action='image-copy-prompt']")?.addEventListener("click", () => {
    const prompt = document.querySelector("#image-prompt-text")?.value || "";
    const negative = document.querySelector("#image-negative-prompt")?.value || "";
    copyText(`${prompt}${negative ? `\nNegative: ${negative}` : ""}`);
  });
  document.querySelector("[data-action='discard-image-waiting']")?.addEventListener("click", discardImageWaitingJobs);
  document.querySelectorAll("[data-action='load-comfy-models']").forEach((button) => {
    button.addEventListener("click", () => loadComfyModels());
  });
  document.querySelectorAll("[data-action='validate-comfy-workflow']").forEach((button) => {
    button.addEventListener("click", validateCurrentComfyWorkflow);
  });
  document.querySelector("[data-action='choose-image-reference-files']")?.addEventListener("click", () => {
    document.querySelector("#image-reference-file-input")?.click();
  });
  document.querySelector("#image-reference-file-input")?.addEventListener("change", async (event) => {
    await uploadImageReferenceFiles(event.target.files);
  });
  document.querySelector("[data-action='apply-comfy-preset']")?.addEventListener("click", applySelectedComfyPreset);
  document.querySelector("[data-action='save-comfy-preset']")?.addEventListener("click", openComfyPresetModal);
  document.querySelector("[data-action='update-comfy-preset']")?.addEventListener("click", updateSelectedComfyPreset);
  document.querySelector("[data-action='delete-comfy-preset']")?.addEventListener("click", deleteSelectedComfyPreset);
  document.querySelector("[data-action='image-start-generation']")?.addEventListener("click", startComfyGeneration);
  document.querySelectorAll("[data-action='refresh-image-job']").forEach((button) => {
    button.addEventListener("click", () => pollComfyJob(button.dataset.id));
  });
  document.querySelectorAll("[data-action='copy-image-job-prompt']").forEach((button) => {
    button.addEventListener("click", () => {
      const job = byId(state.db.imageJobs || [], button.dataset.id);
      if (job) copyText(`${job.prompt || ""}${job.negativePrompt ? `\nNegative: ${job.negativePrompt}` : ""}`);
    });
  });
  document.querySelectorAll("[data-action='adopt-image-job']").forEach((button) => {
    button.addEventListener("click", () => adoptImageJob(button.dataset.id));
  });
}

function bindAudioAgent() {
  const persistAudioControls = () => {
    const controls = audioControlsFromDom();
    state.audioWorkId = controls.workId || null;
    state.audioCharacterId = controls.characterId || "";
    state.audioVoice = controls.voice;
    state.audioProvider = controls.provider;
    state.audioPromptDraft = {
      ...(state.audioPromptDraft || {}),
      title: controls.title,
      input: controls.input,
      voice: controls.voice,
      provider: controls.provider,
      audioModel: controls.audioModel,
      audioResponseFormat: controls.audioResponseFormat,
      elevenLabs: controls.elevenLabs,
      voicebox: controls.voicebox,
      ...controls.irodori,
      actingPrompt: controls.actingPrompt,
      caption: controls.caption
    };
    state.db.settings.audioProvider = controls.provider;
    state.db.settings.audioVoice = controls.voice;
    state.db.settings.audioModel = controls.audioModel;
    state.db.settings.audioResponseFormat = controls.audioResponseFormat;
    state.db.settings.audioActingPrompt = controls.actingPrompt || defaultAudioActingPrompt;
    state.db.settings.elevenLabsVoiceId = controls.elevenLabs.voiceId;
    state.db.settings.elevenLabsModelId = controls.elevenLabs.modelId;
    state.db.settings.elevenLabsOutputFormat = controls.elevenLabs.outputFormat;
    state.db.settings.elevenLabsStability = controls.elevenLabs.stability;
    state.db.settings.elevenLabsSimilarityBoost = controls.elevenLabs.similarityBoost;
    state.db.settings.elevenLabsStyle = controls.elevenLabs.style;
    state.db.settings.elevenLabsSpeed = controls.elevenLabs.speed;
    state.db.settings.elevenLabsSpeakerBoost = controls.elevenLabs.useSpeakerBoost;
    state.db.settings.elevenLabsLanguageCode = controls.elevenLabs.languageCode;
    state.db.settings.voiceboxBaseUrl = controls.voicebox.baseUrl;
    state.db.settings.voiceboxProfileId = controls.voicebox.profileId;
    state.db.settings.voiceboxLanguage = controls.voicebox.language;
    state.db.settings.voiceboxModelSize = controls.voicebox.modelSize;
    state.db.settings.irodoriDefaults = controls.irodori;
  };
  [
    "#audio-openrouter-model",
    "#audio-voice",
    "#audio-openrouter-response-format",
    "#audio-acting-prompt",
    "#audio-title",
    "#audio-input-text",
    "#audio-elevenlabs-voice-id",
    "#audio-elevenlabs-model-id",
    "#audio-elevenlabs-output-format",
    "#audio-elevenlabs-stability",
    "#audio-elevenlabs-similarity",
    "#audio-elevenlabs-style",
    "#audio-elevenlabs-speed",
    "#audio-elevenlabs-language-code",
    "#audio-elevenlabs-seed",
    "#audio-elevenlabs-speaker-boost",
    "#audio-voicebox-base-url",
    "#audio-voicebox-profile-id",
    "#audio-voicebox-language",
    "#audio-voicebox-model-size",
    "#audio-voicebox-seed",
    "#audio-irodori-mode",
    "#audio-irodori-caption",
    "#audio-irodori-steps",
    "#audio-irodori-candidates",
    "#audio-irodori-seed",
    "#audio-irodori-cfg-text",
    "#audio-irodori-cfg-caption",
    "#audio-irodori-cfg-speaker",
    "#audio-irodori-model-device",
    "#audio-irodori-model-precision",
    "#audio-irodori-codec-device",
    "#audio-irodori-codec-precision",
    "#audio-irodori-checkpoint"
  ].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", persistAudioControls);
  });
  document.querySelector("#audio-input-text")?.addEventListener("input", (event) => {
    state.audioPromptDraft = {
      ...(state.audioPromptDraft || {}),
      input: event.target.value
    };
  });
  document.querySelector("#audio-chat-input")?.addEventListener("input", (event) => {
    state.audioChatDraft = event.target.value;
  });
  document.querySelector("#audio-provider")?.addEventListener("change", () => {
    persistAudioControls();
    render();
  });
  document.querySelector("#audio-openrouter-model")?.addEventListener("change", () => {
    persistAudioControls();
    render();
  });
  document.querySelector("#audio-irodori-reference-file")?.addEventListener("change", (event) => {
    persistAudioControls();
    uploadIrodoriReferenceFile(event.target.files?.[0]);
  });
  document.querySelector("[data-action='load-elevenlabs-voices']")?.addEventListener("click", async () => {
    persistAudioControls();
    await loadElevenLabsVoices();
  });
  document.querySelector("[data-action='load-elevenlabs-models']")?.addEventListener("click", async () => {
    persistAudioControls();
    await loadElevenLabsModels();
  });
  document.querySelector("[data-action='load-voicebox-profiles']")?.addEventListener("click", async () => {
    persistAudioControls();
    await loadVoiceboxProfiles();
  });
  document.querySelector("[data-action='clear-irodori-reference']")?.addEventListener("click", () => {
    state.audioIrodoriReference = null;
    render();
  });
  document.querySelector("#audio-work")?.addEventListener("change", (event) => {
    persistAudioControls();
    state.audioWorkId = event.target.value || null;
    state.selectedWorkId = state.audioWorkId;
    if (state.audioCharacterId && !audioCharacterOptions().some((char) => char.id === state.audioCharacterId)) {
      state.audioCharacterId = "";
    }
    render();
  });
  document.querySelector("#audio-character")?.addEventListener("change", (event) => {
    persistAudioControls();
    state.audioCharacterId = event.target.value || "";
    const char = byId(state.db.characters, state.audioCharacterId);
    if (char) {
      state.audioWorkId = char.workId;
      state.selectedWorkId = char.workId;
    }
    render();
  });
  document.querySelector("[data-action='audio-send-message']")?.addEventListener("click", () => handleAudioAgentMessage(false));
  document.querySelector("[data-action='audio-make-draft']")?.addEventListener("click", () => handleAudioAgentMessage(true));
  document.querySelector("[data-action='audio-copy-input']")?.addEventListener("click", () => {
    const text = document.querySelector("#audio-input-text")?.value || "";
    copyText(text);
  });
  document.querySelector("[data-action='audio-start-generation']")?.addEventListener("click", startAudioGeneration);
}

function bindVideoAgent() {
  const persistVideoControls = () => {
    const controls = videoControlsFromDom();
    state.videoCharacterId = controls.characterId || "";
    state.videoPromptDraft = {
      ...(state.videoPromptDraft || {}),
      model: controls.model,
      mode: controls.mode,
      duration: controls.duration,
      ratio: controls.ratio,
      resolution: controls.resolution,
      generateAudio: controls.generateAudio,
      cameraFixed: controls.cameraFixed,
      watermark: controls.watermark,
      returnLastFrame: controls.returnLastFrame,
      seed: controls.seed,
      prompt: controls.prompt
    };
    state.db.settings.seedanceModel = controls.model;
    state.db.settings.seedanceResolution = controls.resolution;
  };
  ["#video-duration", "#video-ratio", "#video-resolution", "#video-seedance-model", "#video-generate-audio", "#video-camera-fixed", "#video-watermark", "#video-return-last-frame", "#video-seed", "#video-prompt-text"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("change", persistVideoControls);
  });
  document.querySelector("#video-prompt-text")?.addEventListener("input", (event) => {
    state.videoPromptDraft = {
      ...(state.videoPromptDraft || {}),
      prompt: event.target.value
    };
  });
  document.querySelector("#video-chat-input")?.addEventListener("input", (event) => {
    state.videoChatDraft = event.target.value;
  });
  document.querySelector("#video-seedance-model")?.addEventListener("change", () => {
    persistVideoControls();
    render();
  });
  document.querySelector("#video-work")?.addEventListener("change", (event) => {
    persistVideoControls();
    state.videoWorkId = event.target.value || null;
    state.selectedWorkId = state.videoWorkId;
    if (state.videoCharacterId && !videoCharacterOptions().some((char) => char.id === state.videoCharacterId)) {
      state.videoCharacterId = "";
    }
    state.videoSelectedReferenceIds = state.videoSelectedReferenceIds.filter((key) => {
      const item = allVideoReferences().find((candidate) => candidate.key === key);
      return !state.videoWorkId || !item?.workId || item.workId === state.videoWorkId;
    });
    render();
  });
  document.querySelector("#video-reference-kind")?.addEventListener("change", (event) => {
    persistVideoControls();
    state.videoReferenceKind = event.target.value;
    render();
  });
  document.querySelector("#video-character")?.addEventListener("change", (event) => {
    persistVideoControls();
    state.videoCharacterId = event.target.value || "";
    render();
  });
  document.querySelector("#video-mode")?.addEventListener("change", () => {
    persistVideoControls();
    render();
  });
  document.querySelector("[data-action='choose-video-reference-files']")?.addEventListener("click", () => {
    document.querySelector("#video-ref-file-input")?.click();
  });
  document.querySelector("#video-ref-file-input")?.addEventListener("change", async (event) => {
    await uploadVideoReferenceFiles(event.target.files);
  });
  document.querySelectorAll("[data-action='toggle-video-reference']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.id;
      const item = allVideoReferences().find((candidate) => candidate.key === id);
      if (!item) return;
      if (!checkbox.checked) {
        persistVideoControls();
        state.videoSelectedReferenceIds = state.videoSelectedReferenceIds.filter((key) => key !== id);
        delete state.videoReferenceRoles[id];
        render();
        return;
      }
      const next = [...selectedVideoReferences(), item];
      const counts = selectedVideoReferenceCounts(next);
      if (counts.image > 9 || counts.video > 3 || counts.audio > 3) {
        checkbox.checked = false;
        return toast("参照素材の上限を超えています。");
      }
      persistVideoControls();
      state.videoSelectedReferenceIds.push(id);
      state.videoReferenceRoles[id] = seedanceRoleForKind(item.kind, videoControlValue("video-mode", "reference"));
      render();
    });
  });
  document.querySelectorAll("[data-action='change-video-ref-role']").forEach((select) => {
    select.addEventListener("change", () => {
      state.videoReferenceRoles[select.dataset.id] = select.value;
    });
  });
  document.querySelector("[data-action='video-send-message']")?.addEventListener("click", () => handleVideoAgentMessage(false));
  document.querySelector("[data-action='video-make-draft']")?.addEventListener("click", () => handleVideoAgentMessage(true));
  document.querySelector("[data-action='toggle-video-cost']")?.addEventListener("click", () => {
    state.videoCostCollapsed = !state.videoCostCollapsed;
    render();
  });
  document.querySelector("[data-action='refresh-video-pricing']")?.addEventListener("click", refreshVideoPricing);
  document.querySelector("[data-action='video-copy-prompt']")?.addEventListener("click", () => {
    const text = document.querySelector("#video-prompt-text")?.value || "";
    copyText(text);
  });
  document.querySelector("[data-action='discard-video-waiting']")?.addEventListener("click", discardVideoWaitingJobs);
  document.querySelector("[data-action='video-start-generation']")?.addEventListener("click", startSeedanceGeneration);
  document.querySelectorAll("[data-action='refresh-video-job']").forEach((button) => {
    button.addEventListener("click", () => pollSeedanceJob(button.dataset.id));
  });
  document.querySelectorAll("[data-action='copy-video-job-prompt']").forEach((button) => {
    button.addEventListener("click", () => {
      const job = byId(state.db.videoJobs || [], button.dataset.id);
      if (job) copyText(job.prompt || "");
    });
  });
  document.querySelectorAll("[data-action='save-video-last-frame']").forEach((button) => {
    button.addEventListener("click", async () => {
      const job = byId(state.db.videoJobs || [], button.dataset.id);
      if (!job) return;
      try {
        const lastFrame = await saveVideoLastFrameReference(job);
        await saveDb();
        render();
        toast(lastFrame ? "最終フレームを参照素材へ保存しました。" : "最終フレームはすでに保存済みです。");
      } catch (error) {
        job.lastFrameError = error.message;
        await saveDb();
        render();
        toast(error.message);
      }
    });
  });
  if (isOpenRouterSeedanceBaseUrl()) loadOpenRouterVideoModels();
}

async function classifyAsset(asset, knownDataUrl = null, fallbackPromptFormat = state.importPromptFormat, options = {}) {
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
  const reportProgress = (stage, message) => {
    setAssetClassificationProgress(asset, stage, message);
    onProgress?.(asset);
  };
  const candidates = charactersForWork(asset.workId);
  if (!candidates.length) {
    asset.status = "failed";
    asset.aiReason = "判別候補のキャラが登録されていません。";
    return;
  }
  reportProgress("preparing", knownDataUrl ? "AI判別APIへの送信準備中です。" : "画像データを読み込み中です。");
  const dataUrl = knownDataUrl || await imageUrlToDataUrl(asset.url);
  const candidateText = candidates.map((char) => ({
    id: char.id,
    name: char.name,
    promptFormat: promptFormatOf(char),
    basePrompt: char.basePrompt,
    memo: char.memo
  }));
  const fallbackInstruction = promptFormatInstruction(fallbackPromptFormat);
  reportProgress("waiting", "APIへ送信済み。返答を待っています。");
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは創作支援アプリの画像整理AIです。候補キャラから最も近い人物を選び、画像生成向けの短いプロンプトも抽出します。説明文やMarkdownを付けず、必ずJSONオブジェクトだけを返してください。"
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `候補キャラ: ${JSON.stringify(candidateText)}\n返答形式: {"characterId": "候補idまたはnull", "confidence": 0から1, "promptFormat": "naturalまたはtags", "generatedPrompt": "画像の生成プロンプト", "negativePrompt": "必要なら", "reason": "短い理由"}\n0.55未満の自信なら characterId は null にしてください。\n一致した候補がある場合は、その候補の promptFormat に従って generatedPrompt を作ってください。未判別の場合は ${fallbackPromptFormat} 形式で作ってください。${fallbackInstruction}`
          },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ],
    responseFormat: { type: "json_object" },
    maxTokens: 1300
  });
  reportProgress("saving", "API返答を受け取りました。割当先を保存中です。");
  const result = parseAiJson(content);
  const match = result.characterId ? byId(candidates, result.characterId) : null;
  asset.characterId = match && Number(result.confidence) >= 0.55 ? match.id : null;
  asset.worldItemId = null;
  if (asset.characterId && match?.workId) asset.workId = match.workId;
  asset.status = asset.characterId ? "matched" : "failed";
  asset.confidence = Number(result.confidence) || null;
  asset.aiPromptFormat = asset.characterId ? promptFormatOf(match) : (result.promptFormat === "tags" ? "tags" : fallbackPromptFormat);
  asset.aiPrompt = result.generatedPrompt || "";
  asset.aiNegativePrompt = result.negativePrompt || "";
  asset.aiReason = result.reason || "";
}

function bindPromptLab() {
  document.querySelector("#prompt-work")?.addEventListener("change", (event) => {
    state.selectedWorkId = event.target.value || null;
    render();
  });
  document.querySelector("[data-action='toggle-prompt-memo']")?.addEventListener("click", () => {
    state.promptUseMemo = !state.promptUseMemo;
    const button = document.querySelector("[data-action='toggle-prompt-memo']");
    button.textContent = `キャラメモを加味: ${state.promptUseMemo ? "ON" : "OFF"}`;
    button.classList.toggle("active-toggle", state.promptUseMemo);
  });
  document.querySelector("[data-action='generate-prompts']")?.addEventListener("click", generatePrompts);
  document.querySelector("[data-action='copy-all-prompts']")?.addEventListener("click", () => copyText(
    state.generatedPrompts.map(formatPromptForCopy).join("\n\n")
  ));
  document.querySelectorAll("[data-action='copy-prompt']").forEach((button) => {
    button.addEventListener("click", () => copyText(formatPromptForCopy(state.generatedPrompts[Number(button.dataset.index)])));
  });
}

async function generatePrompts() {
  const charId = document.querySelector("#prompt-character")?.value;
  const char = byId(state.db.characters, charId);
  const variations = document.querySelector("#prompt-variations").value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const notes = document.querySelector("#prompt-notes").value.trim();
  const memoContext = state.promptUseMemo && char ? char.memo : "";
  if (!char || !variations.length) {
    toast("キャラと差分指定を入力してください。");
    return;
  }
  const work = byId(state.db.works, char.workId) || byId(state.db.works, state.selectedWorkId);
  const workContext = buildPromptLabWorldContext(work);
  try {
    toastApiSubmitted("プロンプト生成APIに送信しました。返答を待っています。");
    const content = await callOpenRouter({
      textOnly: true,
      temperature: 0.55,
      maxTokens: 3400,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `あなたは画像生成向けプロンプトの編集者です。ベースプロンプトの人物同一性を守り、指定ごとに完成度の高い生成プロンプトを作ります。作品情報・世界観設定・その他情報がある場合は、衣装の素材、配色、背景、小物、社会的役割、光や気候の描写に自然に反映してください。キャラの固定要素と世界観の保持すべき要素を優先し、未設定や不明な情報は捏造しないでください。${promptFormatInstruction(promptFormatOf(char))} 説明文やMarkdownを付けず、必ずJSONオブジェクトだけを返してください。`
        },
        {
          role: "user",
          content: `作品情報 / 世界観設定:\n${workContext}\n\nキャラ名: ${char.name}\nプロンプト形式: ${promptFormatOf(char)}\nベースプロンプト: ${char.basePrompt}\nネガティブプロンプト: ${char.negativePrompt}\nメモを加味する: ${state.promptUseMemo ? "yes" : "no"}\nキャラメモ: ${memoContext}\n補足: ${notes}\n差分指定: ${JSON.stringify(variations)}\n返答形式: {"items":[{"title":"指定名","prompt":"指定形式の生成プロンプト","negativePrompt":"指定形式のネガティブプロンプト"}]}`
        }
      ]
    });
    const result = parseAiJson(content);
    state.generatedPrompts = Array.isArray(result.items) ? result.items : [];
    render();
    toast("プロンプトを生成しました。");
  } catch (error) {
    toast(error.message);
  }
}

function formatPromptForCopy(item) {
  return `${item.title || "Prompt"}\n${item.prompt || ""}${item.negativePrompt ? `\nNegative: ${item.negativePrompt}` : ""}`;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  toast("コピーしました。");
}

async function loadElevenLabsVoices() {
  const key = elevenLabsApiKey();
  if (!key) return toast("設定画面で ElevenLabs API キーを保存してください。");
  state.elevenLabsVoiceStatus = "loading";
  state.elevenLabsVoiceError = "";
  if (state.view === "audio" || state.view === "settings") render();
  try {
    const result = await postJson("/api/elevenlabs/voices", { apiKey: key });
    state.elevenLabsVoices = Array.isArray(result.voices) ? result.voices : [];
    state.elevenLabsVoiceStatus = "loaded";
    toast(`${state.elevenLabsVoices.length} 件のElevenLabs音声を読み込みました。`);
  } catch (error) {
    state.elevenLabsVoices = [];
    state.elevenLabsVoiceStatus = "failed";
    state.elevenLabsVoiceError = error.message;
    toast(error.message);
  }
  if (state.view === "audio" || state.view === "settings") render();
}

async function loadElevenLabsModels() {
  const key = elevenLabsApiKey();
  if (!key) return toast("設定画面で ElevenLabs API キーを保存してください。");
  state.elevenLabsModelStatus = "loading";
  state.elevenLabsModelError = "";
  if (state.view === "audio" || state.view === "settings") render();
  try {
    const result = await postJson("/api/elevenlabs/models", { apiKey: key });
    state.elevenLabsModels = Array.isArray(result.models) ? result.models : [];
    state.elevenLabsModelStatus = "loaded";
    toast(`${state.elevenLabsModels.length} 件のElevenLabsモデルを読み込みました。`);
  } catch (error) {
    state.elevenLabsModels = [];
    state.elevenLabsModelStatus = "failed";
    state.elevenLabsModelError = error.message;
    toast(error.message);
  }
  if (state.view === "audio" || state.view === "settings") render();
}

async function loadVoiceboxProfiles() {
  const current = voiceboxSettingsFromControls({
    baseUrl: document.querySelector("#audio-voicebox-base-url")?.value
      || document.querySelector("#setting-voicebox-base-url")?.value
      || state.db.settings.voiceboxBaseUrl,
    profileId: document.querySelector("#audio-voicebox-profile-id")?.value
      || document.querySelector("#setting-voicebox-profile-id")?.value
      || state.db.settings.voiceboxProfileId,
    language: document.querySelector("#audio-voicebox-language")?.value
      || document.querySelector("#setting-voicebox-language")?.value
      || state.db.settings.voiceboxLanguage,
    modelSize: document.querySelector("#audio-voicebox-model-size")?.value
      || document.querySelector("#setting-voicebox-model-size")?.value
      || state.db.settings.voiceboxModelSize
  });
  state.db.settings.voiceboxBaseUrl = current.baseUrl;
  state.voiceboxProfileStatus = "loading";
  state.voiceboxProfileError = "";
  if (state.view === "audio" || state.view === "settings") render();
  try {
    const result = await postJson("/api/voicebox/profiles", { baseUrl: current.baseUrl });
    state.voiceboxProfiles = Array.isArray(result.profiles) ? result.profiles : [];
    state.voiceboxProfileStatus = "loaded";
    if (!state.db.settings.voiceboxProfileId && state.voiceboxProfiles[0]?.id) {
      state.db.settings.voiceboxProfileId = state.voiceboxProfiles[0].id;
    }
    toast(`${state.voiceboxProfiles.length} 件のVoiceboxプロファイルを読み込みました。`);
  } catch (error) {
    state.voiceboxProfiles = [];
    state.voiceboxProfileStatus = "failed";
    state.voiceboxProfileError = error.message;
    toast(error.message);
  }
  if (state.view === "audio" || state.view === "settings") render();
}

async function checkIrodoriConnection() {
  const appDir = document.querySelector("#setting-irodori-app-dir")?.value.trim() || state.db.settings.irodoriAppDir || "vendor/Irodori-TTS";
  state.db.settings.irodoriAppDir = appDir;
  state.irodoriStatus = "loading";
  state.irodoriStatusMessage = "Irodori-TTSの配置と uv を確認しています。";
  render();
  try {
    const result = await postJson("/api/irodori/status", { appDir });
    if (result.found && result.uvFound) {
      state.irodoriStatus = "ready";
      state.irodoriStatusMessage = `連携できます。Irodori-TTS: ${result.upstreamDir} / uv: ${result.uvCommand}`;
      await saveDb();
      toast("Irodori-TTSに連携できます。");
    } else if (result.found) {
      state.irodoriStatus = "missing";
      state.irodoriStatusMessage = `Irodori-TTSは見つかりましたが uv が見つかりません。${result.upstreamDir}`;
      toast("uv が見つかりません。");
    } else {
      state.irodoriStatus = "missing";
      state.irodoriStatusMessage = `Irodori-TTSが見つかりません。候補: ${(result.candidates || []).join(" / ")}`;
      toast("Irodori-TTSが見つかりません。");
    }
  } catch (error) {
    state.irodoriStatus = "missing";
    state.irodoriStatusMessage = error.message;
    toast(error.message);
  }
  render();
}

async function setupIrodori() {
  state.irodoriStatus = "loading";
  state.irodoriStatusMessage = "Irodori-TTSを取得し、uv sync を実行しています。初回はしばらくかかります。";
  render();
  try {
    await postJson("/api/irodori/setup", {});
    state.db.settings.irodoriAppDir = "vendor/Irodori-TTS";
    state.irodoriStatus = "ready";
    state.irodoriStatusMessage = "Irodori-TTSを vendor/Irodori-TTS に準備しました。";
    await saveDb();
    toast("Irodori-TTSのセットアップが完了しました。");
  } catch (error) {
    state.irodoriStatus = "missing";
    state.irodoriStatusMessage = error.message;
    toast(error.message);
  }
  render();
}

function saveElevenLabsSettingsFromDom() {
  const keyInput = document.querySelector("#setting-elevenlabs-api-key");
  if (keyInput) localStorage.setItem("elevenlabs_api_key", keyInput.value.trim());
  state.db.settings.elevenLabsVoiceId = document.querySelector("#setting-elevenlabs-voice-id")?.value.trim() || state.db.settings.elevenLabsVoiceId || "JBFqnCBsd6RMkjVDRZzb";
  state.db.settings.elevenLabsModelId = document.querySelector("#setting-elevenlabs-model-id")?.value.trim() || state.db.settings.elevenLabsModelId || "eleven_multilingual_v2";
  state.db.settings.elevenLabsOutputFormat = document.querySelector("#setting-elevenlabs-output-format")?.value || state.db.settings.elevenLabsOutputFormat || "mp3_44100_128";
  state.db.settings.elevenLabsStability = boundedSettingNumber(document.querySelector("#setting-elevenlabs-stability")?.value, state.db.settings.elevenLabsStability || 0.5, 0, 1);
  state.db.settings.elevenLabsSimilarityBoost = boundedSettingNumber(document.querySelector("#setting-elevenlabs-similarity")?.value, state.db.settings.elevenLabsSimilarityBoost || 0.75, 0, 1);
  state.db.settings.elevenLabsStyle = boundedSettingNumber(document.querySelector("#setting-elevenlabs-style")?.value, state.db.settings.elevenLabsStyle || 0, 0, 1);
  state.db.settings.elevenLabsSpeed = boundedSettingNumber(document.querySelector("#setting-elevenlabs-speed")?.value, state.db.settings.elevenLabsSpeed || 1, 0.7, 1.2);
  state.db.settings.elevenLabsLanguageCode = document.querySelector("#setting-elevenlabs-language-code")?.value.trim() ?? state.db.settings.elevenLabsLanguageCode ?? "ja";
  state.db.settings.elevenLabsSpeakerBoost = document.querySelector("#setting-elevenlabs-speaker-boost")?.checked ?? state.db.settings.elevenLabsSpeakerBoost ?? true;
}

function saveVoiceboxSettingsFromDom() {
  const settings = voiceboxSettingsFromControls({
    baseUrl: document.querySelector("#setting-voicebox-base-url")?.value || state.db.settings.voiceboxBaseUrl,
    profileId: document.querySelector("#setting-voicebox-profile-id")?.value || state.db.settings.voiceboxProfileId,
    language: document.querySelector("#setting-voicebox-language")?.value || state.db.settings.voiceboxLanguage,
    modelSize: document.querySelector("#setting-voicebox-model-size")?.value || state.db.settings.voiceboxModelSize
  });
  state.db.settings.voiceboxBaseUrl = settings.baseUrl;
  state.db.settings.voiceboxProfileId = settings.profileId;
  state.db.settings.voiceboxLanguage = settings.language;
  state.db.settings.voiceboxModelSize = settings.modelSize;
}

function comfySettingsFromDom() {
  const current = activeComfySettings();
  return normalizedComfySettings({
    ...current,
    gpuMode: document.querySelector("#setting-comfy-gpu-mode")?.value || current.gpuMode,
    localBaseUrl: document.querySelector("#setting-comfy-local-url")?.value.trim() || current.localBaseUrl,
    cloudBaseUrl: document.querySelector("#setting-comfy-cloud-url")?.value.trim() || "",
    workflowJson: document.querySelector("#setting-comfy-workflow")?.value.trim() || current.workflowJson,
    workflowViewMode: document.querySelector("#setting-comfy-workflow-mode")?.value || current.workflowViewMode,
    positiveNodeId: document.querySelector("#setting-comfy-positive-node")?.value.trim() || current.positiveNodeId,
    negativeNodeId: document.querySelector("#setting-comfy-negative-node")?.value.trim() || current.negativeNodeId,
    seedNodeId: document.querySelector("#setting-comfy-seed-node")?.value.trim() || current.seedNodeId,
    sizeNodeId: document.querySelector("#setting-comfy-size-node")?.value.trim() || current.sizeNodeId,
    stepsNodeId: document.querySelector("#setting-comfy-steps-node")?.value.trim() || current.stepsNodeId,
    cfgNodeId: document.querySelector("#setting-comfy-cfg-node")?.value.trim() || current.cfgNodeId,
    samplerNodeId: document.querySelector("#setting-comfy-sampler-node")?.value.trim() || current.samplerNodeId,
    checkpointNodeId: document.querySelector("#setting-comfy-checkpoint-node")?.value.trim() || current.checkpointNodeId,
    width: document.querySelector("#setting-comfy-width")?.value ?? current.width,
    height: document.querySelector("#setting-comfy-height")?.value ?? current.height,
    steps: document.querySelector("#setting-comfy-steps")?.value ?? current.steps,
    cfg: document.querySelector("#setting-comfy-cfg")?.value ?? current.cfg,
    samplerName: document.querySelector("#setting-comfy-sampler")?.value.trim() || current.samplerName,
    scheduler: document.querySelector("#setting-comfy-scheduler")?.value.trim() || current.scheduler,
    batchSize: document.querySelector("#setting-comfy-batch-size")?.value ?? current.batchSize,
    seed: document.querySelector("#setting-comfy-seed")?.value.trim() ?? current.seed,
    checkpoint: document.querySelector("#setting-comfy-checkpoint")?.value.trim() ?? current.checkpoint,
    loras: lorasFromDom("setting", current.loras),
    referenceSlots: comfyReferenceSlotsFromDom("setting", current.referenceSlots)
  });
}

function saveComfySettingsFromDom() {
  const keyInput = document.querySelector("#setting-comfy-cloud-api-key");
  if (keyInput) localStorage.setItem("comfy_cloud_api_key", keyInput.value.trim());
  state.db.settings.comfy = comfySettingsFromDom();
  state.imageGpuMode = state.db.settings.comfy.gpuMode;
  state.comfyValidation = null;
}

async function loadComfyModels({ silent = false } = {}) {
  if (state.view === "settings") saveComfySettingsFromDom();
  const controls = state.view === "image" ? imageControlsFromDom() : null;
  if (controls) rememberImageControls(controls);
  const gpuMode = controls?.gpuMode || activeComfySettings().gpuMode;
  const baseUrl = controls?.baseUrl || activeComfyBaseUrl(gpuMode);
  const apiKeyValue = controls?.apiKey || activeComfyApiKey(gpuMode);
  if (!baseUrl) return toast(`${imageGpuLabel(gpuMode)}のComfyUI URLを設定してください。`);
  state.comfyModelStatus = "loading";
  state.comfyModelError = "";
  if (!silent) render({ preserveLiveTextDrafts: true });
  try {
    const result = await postJson("/api/comfy/models", { baseUrl, apiKey: apiKeyValue });
    state.comfyModels = {
      checkpoints: Array.isArray(result.checkpoints) ? result.checkpoints : [],
      loras: Array.isArray(result.loras) ? result.loras : [],
      updatedAt: result.updatedAt || new Date().toISOString()
    };
    state.comfyModelStatus = "loaded";
    state.comfyModelError = "";
    if (!silent) {
      render({ preserveLiveTextDrafts: true });
      toast(`ComfyUIモデル一覧を取得しました。Checkpoint ${state.comfyModels.checkpoints.length}件 / LoRA ${state.comfyModels.loras.length}件`);
    }
    return state.comfyModels;
  } catch (error) {
    state.comfyModelStatus = "failed";
    state.comfyModelError = error.message;
    if (!silent) {
      render({ preserveLiveTextDrafts: true });
      toast(error.message);
    }
    return null;
  }
}

async function checkComfyConnection() {
  saveComfySettingsFromDom();
  const settings = activeComfySettings();
  const baseUrl = activeComfyBaseUrl(settings.gpuMode);
  if (!baseUrl) return toast(`${imageGpuLabel(settings.gpuMode)}のComfyUI URLを設定してください。`);
  try {
    const result = await postJson("/api/comfy/check", {
      baseUrl,
      apiKey: activeComfyApiKey(settings.gpuMode)
    });
    await saveDb();
    const deviceText = Array.isArray(result.devices) && result.devices.length
      ? ` / ${result.devices.map((device) => device.name || device.type || "device").join(", ")}`
      : "";
    toast(`ComfyUIに接続できました。${deviceText}`);
    await loadComfyModels({ silent: true });
    if (state.view === "settings" || state.view === "image") render({ preserveLiveTextDrafts: true });
  } catch (error) {
    toast(error.message);
  }
}

function bindSettings() {
  loadOpenRouterModels();
  if (isOpenRouterSeedanceBaseUrl()) loadOpenRouterVideoModels();
  document.querySelector("#setting-seedance-base-url")?.addEventListener("change", (event) => {
    const selected = seedanceApiBasePreset(event.target.value);
    const modelInput = document.querySelector("#setting-seedance-model");
    const knownDefaultModels = seedanceApiBaseOptions.map((option) => option.defaultModel);
    const nextModel = modelInput && (!modelInput.value.trim() || knownDefaultModels.includes(modelInput.value.trim()) || targetOpenRouterVideoModelIds.includes(modelInput.value.trim()))
      ? selected.defaultModel
      : modelInput?.value.trim() || selected.defaultModel;
    updateSettingSeedanceModelOptions(selected.value, nextModel);
    const status = document.querySelector("#setting-seedance-status");
    if (status) status.textContent = seedanceSettingsStatusText(selected.value);
    if (isOpenRouterSeedanceBaseUrl(selected.value)) {
      loadOpenRouterVideoModels().then(() => {
        updateSettingSeedanceModelOptions(selected.value, nextModel);
        const nextStatus = document.querySelector("#setting-seedance-status");
        if (nextStatus) nextStatus.textContent = seedanceSettingsStatusText(selected.value);
      });
    }
  });
  document.querySelector("#setting-seedance-model")?.addEventListener("change", (event) => {
    const baseUrl = document.querySelector("#setting-seedance-base-url")?.value || state.db.settings.seedanceBaseUrl;
    updateSettingSeedanceResolutionOptions(event.target.value, baseUrl);
  });
	  document.querySelector("[data-action='save-settings']")?.addEventListener("click", async () => {
	    localStorage.setItem("openrouter_api_key", document.querySelector("#setting-api-key").value.trim());
	    localStorage.setItem("seedance_api_key", document.querySelector("#setting-seedance-api-key")?.value.trim() || "");
	    saveElevenLabsSettingsFromDom();
	    saveVoiceboxSettingsFromDom();
	    saveComfySettingsFromDom();
	    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    state.db.settings.worldModel = document.querySelector("#setting-world-model").value.trim();
    state.db.settings.imageAgentModel = document.querySelector("#setting-image-agent-model").value.trim();
    state.db.settings.videoAgentModel = document.querySelector("#setting-video-agent-model").value.trim();
    state.db.settings.audioAgentModel = document.querySelector("#setting-audio-agent-model").value.trim();
    state.db.settings.audioModel = normalizeOpenRouterTtsModel(document.querySelector("#setting-audio-tts-model")?.value || state.db.settings.audioModel);
    state.db.settings.audioVoice = normalizeOpenRouterTtsVoice(state.db.settings.audioVoice, state.db.settings.audioModel);
    state.db.settings.audioResponseFormat = normalizeOpenRouterTtsResponseFormat(state.db.settings.audioResponseFormat, state.db.settings.audioModel);
    state.db.settings.irodoriAppDir = document.querySelector("#setting-irodori-app-dir")?.value.trim() || "vendor/Irodori-TTS";
    state.db.settings.seedanceBaseUrl = document.querySelector("#setting-seedance-base-url")?.value.trim() || "https://ark.ap-southeast.bytepluses.com/api/v3";
    state.db.settings.seedanceModel = document.querySelector("#setting-seedance-model")?.value.trim() || "dreamina-seedance-2-0-260128";
    state.db.settings.seedanceResolution = document.querySelector("#setting-seedance-resolution")?.value || "720p";
    await saveDb();
    toast("設定を保存しました。");
  });
	  document.querySelector("[data-action='test-openrouter']")?.addEventListener("click", async () => {
	    localStorage.setItem("openrouter_api_key", document.querySelector("#setting-api-key").value.trim());
	    saveElevenLabsSettingsFromDom();
	    saveVoiceboxSettingsFromDom();
	    saveComfySettingsFromDom();
	    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    state.db.settings.worldModel = document.querySelector("#setting-world-model").value.trim();
    state.db.settings.imageAgentModel = document.querySelector("#setting-image-agent-model").value.trim();
    state.db.settings.videoAgentModel = document.querySelector("#setting-video-agent-model").value.trim();
    state.db.settings.audioAgentModel = document.querySelector("#setting-audio-agent-model").value.trim();
    state.db.settings.audioModel = normalizeOpenRouterTtsModel(document.querySelector("#setting-audio-tts-model")?.value || state.db.settings.audioModel);
    state.db.settings.audioVoice = normalizeOpenRouterTtsVoice(state.db.settings.audioVoice, state.db.settings.audioModel);
    state.db.settings.audioResponseFormat = normalizeOpenRouterTtsResponseFormat(state.db.settings.audioResponseFormat, state.db.settings.audioModel);
    state.db.settings.irodoriAppDir = document.querySelector("#setting-irodori-app-dir")?.value.trim() || "vendor/Irodori-TTS";
    try {
      await callOpenRouter({
        textOnly: true,
        maxTokens: 40,
        messages: [{ role: "user", content: "日本語で OK とだけ返してください。" }]
      });
      await saveDb();
      toast("OpenRouter に接続できました。");
    } catch (error) {
      toast(error.message);
    }
	  });
	  document.querySelector("[data-action='load-elevenlabs-voices']")?.addEventListener("click", async () => {
	    saveElevenLabsSettingsFromDom();
	    await loadElevenLabsVoices();
	  });
	  document.querySelector("[data-action='load-elevenlabs-models']")?.addEventListener("click", async () => {
	    saveElevenLabsSettingsFromDom();
	    await loadElevenLabsModels();
	  });
	  document.querySelector("[data-action='load-voicebox-profiles']")?.addEventListener("click", async () => {
	    saveVoiceboxSettingsFromDom();
	    await loadVoiceboxProfiles();
	  });
	  document.querySelector("[data-action='check-irodori']")?.addEventListener("click", checkIrodoriConnection);
  document.querySelector("[data-action='check-comfy']")?.addEventListener("click", checkComfyConnection);
  document.querySelectorAll("[data-action='load-comfy-models']").forEach((button) => {
    button.addEventListener("click", () => loadComfyModels());
  });
  document.querySelectorAll("[data-action='validate-comfy-workflow']").forEach((button) => {
    button.addEventListener("click", validateCurrentComfyWorkflow);
  });
  document.querySelector("[data-action='apply-comfy-preset']")?.addEventListener("click", applySelectedComfyPreset);
  document.querySelector("[data-action='save-comfy-preset']")?.addEventListener("click", openComfyPresetModal);
  document.querySelector("[data-action='update-comfy-preset']")?.addEventListener("click", updateSelectedComfyPreset);
  document.querySelector("[data-action='delete-comfy-preset']")?.addEventListener("click", deleteSelectedComfyPreset);
  document.querySelector("#setting-comfy-workflow-mode")?.addEventListener("change", () => {
    saveComfySettingsFromDom();
    render();
  });
  document.querySelector("[data-action='setup-irodori']")?.addEventListener("click", setupIrodori);
  document.querySelector("[data-action='reload-openrouter-models']")?.addEventListener("click", () => loadOpenRouterModels({ force: true }));
}

function openModal(title, bodyHtml, footerHtml, onBind = () => {}) {
  const fragment = modalTemplate.content.cloneNode(true);
  const backdrop = fragment.querySelector(".modal-backdrop");
  const modal = fragment.querySelector(".modal");
  modal.innerHTML = `
    <div class="modal-header">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      <button class="ghost" data-action="close-modal">閉じる</button>
    </div>
    <div class="panel-body">${bodyHtml}</div>
    <div class="modal-footer">${footerHtml}</div>
  `;
  document.body.append(backdrop);
  const close = () => backdrop.remove();
  modal.querySelectorAll("[data-action='close-modal']").forEach((button) => {
    button.addEventListener("click", close);
  });
  onBind(modal, close);
}

function openWorkModal(work = null) {
  const editing = Boolean(work);
  const selectedColor = work?.color || workColors[state.db.works.length % workColors.length];
  openModal(
    editing ? "作品編集" : "作品追加",
    `
      <div class="form-grid">
        <label>作品名<input id="work-name" value="${escapeHtml(work?.name || "")}"></label>
        <label>カラー<input id="work-color" type="color" value="${escapeHtml(selectedColor)}"></label>
        <label class="full">メモ<textarea id="work-description">${escapeHtml(work?.description || "")}</textarea></label>
      </div>
    `,
    `<div>${editing ? `<button class="danger" data-action="delete-work">削除</button>` : ""}</div><button data-action="save-work">保存</button>`,
    (modal, close) => {
      modal.querySelector("[data-action='save-work']").addEventListener("click", async () => {
        const payload = {
          id: work?.id || uid(),
          name: modal.querySelector("#work-name").value.trim() || "Untitled Work",
          color: modal.querySelector("#work-color").value,
          description: modal.querySelector("#work-description").value.trim(),
          createdAt: work?.createdAt || new Date().toISOString()
        };
        if (editing) Object.assign(work, payload);
        else {
          state.db.works.push(payload);
          ensureDefaultWorldItemsForWork(payload);
        }
        state.selectedWorkId = payload.id;
        if (editing) await relocateAssetsForWork(payload.id);
        await saveDb();
        close();
        render();
      });
      modal.querySelector("[data-action='delete-work']")?.addEventListener("click", async () => {
        state.db.works = state.db.works.filter((item) => item.id !== work.id);
        state.db.worldItems = state.db.worldItems.filter((item) => item.workId !== work.id);
        state.db.characters = state.db.characters.filter((char) => char.workId !== work.id);
        state.db.assets.forEach((asset) => {
          if (asset.workId === work.id) {
            asset.workId = null;
            asset.characterId = null;
            asset.worldItemId = null;
            asset.status = "unassigned";
          }
        });
        state.selectedWorkId = state.db.works[0]?.id || null;
        await saveDb();
        close();
        render();
      });
    }
  );
}

function openWorldItemModal(item = null) {
  const editing = Boolean(item);
  let referenceDataUrl = null;
  const workId = item?.workId || state.selectedWorkId || state.db.works[0]?.id || "";
  openModal(
    editing ? "その他情報編集" : "その他情報追加",
    `
      <div class="form-grid">
        <label>作品
          <select id="world-item-work">
            ${state.db.works.map((work) => `<option value="${work.id}" ${workId === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
          </select>
        </label>
        <label>種類
          <select id="world-item-category">
            ${Object.entries(worldItemCategoryLabels).map(([value, label]) => `<option value="${value}" ${(item?.category || "other") === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
        <label class="full">名前<input id="world-item-name" value="${escapeHtml(item?.name || "")}" placeholder="例：港町の市場、封印された短剣、森の発光虫"></label>
        <label class="full">参考画像<input id="world-item-reference" type="file" accept="image/*"></label>
        <div class="full">${item?.referenceUrl ? `<img class="portrait" style="max-width:220px;" src="${escapeHtml(item.referenceUrl)}" alt="">` : `<div class="empty compact">参考画像プレビュー</div>`}</div>
        <label class="full">説明<textarea id="world-item-description">${escapeHtml(item?.description || "")}</textarea></label>
        <label class="full">ベースプロンプト<textarea id="world-item-base">${escapeHtml(item?.basePrompt || "")}</textarea></label>
        <label class="full">メモ<textarea id="world-item-memo">${escapeHtml(item?.memo || "")}</textarea></label>
      </div>
    `,
    `<div>${editing && !item.autoCreated ? `<button class="danger" data-action="delete-world-item">削除</button>` : ""}</div><button data-action="save-world-item">保存</button>`,
    (modal, close) => {
      modal.querySelector("#world-item-reference").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        referenceDataUrl = await fileToDataUrl(file);
        const slot = modal.querySelector(".portrait, .empty");
        slot.outerHTML = `<img class="portrait" style="max-width:220px;" src="${escapeHtml(referenceDataUrl)}" alt="">`;
      });
      modal.querySelector("[data-action='save-world-item']").addEventListener("click", async () => {
        const targetWork = byId(state.db.works, modal.querySelector("#world-item-work").value);
        const targetName = modal.querySelector("#world-item-name").value.trim() || worldItemCategoryLabel(modal.querySelector("#world-item-category").value);
        let referenceUrl = item?.referenceUrl || "";
        if (referenceDataUrl) {
          const uploaded = await postJson("/api/upload", {
            dataUrl: referenceDataUrl,
            name: `${targetName}.png`,
            workName: targetWork?.name,
            characterName: targetName
          });
          referenceUrl = uploaded.url;
        }
        const payload = normalizeWorldItem({
          id: item?.id || uid(),
          workId: targetWork?.id || modal.querySelector("#world-item-work").value,
          category: modal.querySelector("#world-item-category").value,
          name: targetName,
          description: modal.querySelector("#world-item-description").value.trim(),
          referenceUrl,
          basePrompt: modal.querySelector("#world-item-base").value.trim(),
          memo: modal.querySelector("#world-item-memo").value.trim(),
          createdAt: item?.createdAt || new Date().toISOString(),
          autoCreated: item?.autoCreated || false
        });
        if (editing) Object.assign(item, payload);
        else state.db.worldItems.push(payload);
        state.selectedWorkId = payload.workId;
        if (editing) await relocateAssetsForWorldItem(payload.id);
        await saveDb();
        close();
        render();
      });
      modal.querySelector("[data-action='delete-world-item']")?.addEventListener("click", async () => {
        const ok = window.confirm(`「${item.name}」を削除します。関連画像は未割当に戻ります。`);
        if (!ok) return;
        state.db.worldItems = state.db.worldItems.filter((candidate) => candidate.id !== item.id);
        state.db.assets.forEach((asset) => {
          if (asset.worldItemId === item.id) {
            asset.worldItemId = null;
            asset.status = "unassigned";
          }
        });
        await saveDb();
        close();
        render();
      });
    }
  );
}

function openCharacterModal(char = null) {
  const editing = Boolean(char);
  let portraitDataUrl = null;
  openModal(
    editing ? "キャラ編集" : "キャラ追加",
    `
      <div class="form-grid">
        <label>作品
          <select id="char-work">
            ${state.db.works.map((work) => `<option value="${work.id}" ${(char?.workId || state.selectedWorkId) === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
          </select>
        </label>
        <label>キャラ名<input id="char-name" value="${escapeHtml(char?.name || "")}"></label>
        <label>プロンプト形式
          <select id="char-prompt-format">
            <option value="natural" ${promptFormatOf(char) === "natural" ? "selected" : ""}>自然言語</option>
            <option value="tags" ${promptFormatOf(char) === "tags" ? "selected" : ""}>タグ</option>
          </select>
        </label>
        <label class="full">基本立ち絵<input id="char-portrait" type="file" accept="image/*"></label>
        <div class="full">${char?.portraitUrl ? `<img class="portrait" style="max-width:220px;" src="${escapeHtml(char.portraitUrl)}" alt="">` : `<div class="empty">立ち絵プレビュー</div>`}</div>
        <label class="full">ベースプロンプト<textarea id="char-base">${escapeHtml(char?.basePrompt || "")}</textarea></label>
        <label class="full">ネガティブプロンプト<textarea id="char-negative">${escapeHtml(char?.negativePrompt || "")}</textarea></label>
        <label class="full">メモ<textarea id="char-memo">${escapeHtml(char?.memo || "")}</textarea></label>
      </div>
    `,
    `<div>${editing ? `<button class="danger" data-action="delete-character">削除</button>` : ""}</div><div class="group"><button class="ghost" data-action="extract-character-prompt">立ち絵からプロンプト抽出</button><button data-action="save-character">保存</button></div>`,
    (modal, close) => {
      modal.querySelector("#char-portrait").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        portraitDataUrl = await fileToDataUrl(file);
        const slot = modal.querySelector(".portrait, .empty");
        slot.outerHTML = `<img class="portrait" style="max-width:220px;" src="${escapeHtml(portraitDataUrl)}" alt="">`;
      });
      modal.querySelector("[data-action='extract-character-prompt']").addEventListener("click", async () => {
        try {
          const source = portraitDataUrl || (char?.portraitUrl ? await imageUrlToDataUrl(char.portraitUrl) : null);
          if (!source) return toast("先に立ち絵を設定してください。");
          toastApiSubmitted("立ち絵プロンプト抽出APIに送信しました。返答を待っています。");
          const result = await extractPromptFromImage(
            source,
            modal.querySelector("#char-name").value.trim(),
            modal.querySelector("#char-prompt-format").value
          );
          modal.querySelector("#char-base").value = result.basePrompt || "";
          modal.querySelector("#char-negative").value = result.negativePrompt || "";
          toast("立ち絵からプロンプトを抽出しました。");
        } catch (error) {
          toast(error.message);
        }
      });
      modal.querySelector("[data-action='save-character']").addEventListener("click", async () => {
        let portraitUrl = char?.portraitUrl || "";
        const targetWork = byId(state.db.works, modal.querySelector("#char-work").value);
        const targetName = modal.querySelector("#char-name").value.trim() || "Unnamed Character";
        if (portraitDataUrl) {
          const uploaded = await postJson("/api/upload", {
            dataUrl: portraitDataUrl,
            name: `${targetName}.png`,
            workName: targetWork?.name,
            characterName: targetName
          });
          portraitUrl = uploaded.url;
        }
        const payload = {
          id: char?.id || uid(),
          workId: modal.querySelector("#char-work").value,
          name: targetName,
          promptFormat: modal.querySelector("#char-prompt-format").value,
          portraitUrl,
          basePrompt: modal.querySelector("#char-base").value.trim(),
          negativePrompt: modal.querySelector("#char-negative").value.trim(),
          memo: modal.querySelector("#char-memo").value.trim(),
          createdAt: char?.createdAt || new Date().toISOString()
        };
        if (editing) Object.assign(char, payload);
        else state.db.characters.push(payload);
        state.selectedWorkId = payload.workId;
        await relocateAssetsForCharacter(payload.id);
        await saveDb();
        close();
        render();
      });
      modal.querySelector("[data-action='delete-character']")?.addEventListener("click", async () => {
        state.db.characters = state.db.characters.filter((item) => item.id !== char.id);
        state.db.assets.forEach((asset) => {
          if (asset.characterId === char.id) {
            asset.characterId = null;
            asset.status = "unassigned";
          }
        });
        await saveDb();
        close();
        render();
      });
    }
  );
}

async function extractPromptFromImage(dataUrl, name, promptFormat = "natural") {
  const formatInstruction = promptFormatInstruction(promptFormat);
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: `あなたは画像生成プロンプトを抽出する編集者です。人物の外見、髪、服、雰囲気を簡潔にまとめます。${formatInstruction} 説明文やMarkdownを付けず、必ずJSONオブジェクトだけを返してください。`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `キャラ名: ${name || "unknown"}\nプロンプト形式: ${promptFormat}\n返答形式: {"basePrompt":"指定形式の生成プロンプト","negativePrompt":"指定形式に合うネガティブプロンプト","memo":"日本語の短い観察メモ"}`
          },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ],
    responseFormat: { type: "json_object" },
    maxTokens: 1100
  });
  try {
    return parseAiJson(content);
  } catch {
    return {
      basePrompt: String(content || "").trim(),
      negativePrompt: "",
      memo: "AI応答がJSON形式ではなかったため、応答本文をベースプロンプトとして保存しました。"
    };
  }
}

function buildWorldSettingRequest(work, sourceName, sourceSummary = "") {
  const schema = worldSettingSchemaText();
  return `添付または入力された「世界観設定資料＋キャラクター設定資料」を読み取り、テキスト資料として再利用できるように、情報を可能な限り漏れなく整理してください。

対象作品名: ${work?.name || "未設定"}
資料名: ${sourceName || "unknown"}
${sourceSummary ? `資料構成: ${sourceSummary}` : ""}

目的:
この資料を見なくても、世界観・キャラクター・衣装・道具・建築・文化・誌面構成を後から再現、修正、発展できる状態にすること。

重要ルール:
- 見えている事実と、そこから推測した意味を必ず分けてください。
- 見えない部分、不鮮明な部分、読めない文字は無理に補完せず「不明」と書いてください。
- 衣装・道具・建築・素材・配色・記号が示す文化的意味は、根拠を添えて推定してください。
- 小さな道具、素材サンプル、文字、紋章、矢印、番号、背景カットも見落とさないでください。
- キャラクター単体ではなく、そのキャラクターが生きる世界の情報として読み取ってください。
- 複数の画像やテキスト資料がある場合は、重複を統合し、矛盾点や不明点は uncertain_points に記録してください。
- 最後に「保持すべき要素リスト」と「再生成用要約プロンプト」を作ってください。
- このステップでは構造化JSONだけを作ります。詳細な読解ログ、Markdown本文、長い考察は書かないでください。
- 各フィールドは後で検索・編集しやすい短文にしてください。characters / objects / architecture は1項目あたり要点中心の短いオブジェクトにしてください。
- reading_log は空文字にしてください。詳細ログは別ステップで生成します。

返答形式:
説明文やMarkdownコードフェンスを付けず、必ず次のJSONオブジェクトだけを返してください。
{
  "world_setting": ${schema}
}

world_setting は上記スキーマのキーを維持し、該当情報が見えない場合は空文字・空配列ではなく、判断が必要な箇所は uncertain_points にも記録してください。characters / objects / architecture は見つかった分だけ id を CH-01, TOOL-01, BG-01 のように採番してください。`;
}

function buildWorldSettingReadingLogRequest(work, setting, sourceName, sourceSummary = "") {
  const promptSetting = worldSettingForSheetData(setting);
  promptSetting.reading_log = "";
  const structuredSummary = compactRawText(JSON.stringify(promptSetting, null, 2), 22000);
  return `次は「詳細読解ログ」だけを作成してください。構造化JSONはすでに作成済みです。

対象作品名: ${work?.name || "未設定"}
資料名: ${sourceName || "unknown"}
${sourceSummary ? `資料構成: ${sourceSummary}` : ""}

目的:
作品情報画面で人間が確認・修正するためのMarkdown読解ログを残すこと。

重要ルール:
- 返答はMarkdown本文だけにしてください。JSON、コードフェンス、前置き、後書きは不要です。
- 構造化済みJSONと添付/入力資料を照合し、見えている事実、推測、不明点を分けてください。
- 長くなりすぎる場合は、キャラクターや道具の全項目を羅列しすぎず、世界観の核、保持すべき要素、矛盾・不明点を優先してください。
- 目安は日本語で6000字以内です。途中で切れるほど長くしないでください。

読解ログのテンプレート:
${WORLD_SETTING_READING_TEMPLATE}

構造化済みJSON:
${structuredSummary}`;
}

function worldSettingSchemaText() {
  const promptSchema = createEmptyWorldSetting();
  delete promptSchema.sourceImageUrl;
  delete promptSchema.sourceImageName;
  delete promptSchema.updatedAt;
  delete promptSchema.activeSheetId;
  delete promptSchema.sheets;
  return JSON.stringify(promptSchema, null, 2);
}

function composeWorldSettingReadingLog(setting) {
  return `# 世界観設定資料＋キャラクター設定資料 読解ログ

## 0. 読解メタ情報

【画像名・仮タイトル】
- ${setting.title || "不明"}

【シートの種類】
- ${setting.sheet_type || "不明"}

## 1. シート全体の第一印象

【全体の雰囲気】
- ${setting.overall_mood || "不明"}

【世界観の核になっている要素】
- ${setting.world_core || "不明"}

## 2. 画像から抽出した視覚ルール

【基本形】
- ${plainInlineList(setting.visual_rules.shape_language.basic_shapes, "不明")}

【主色】
- ${plainInlineList(setting.visual_rules.color_rules.main_colors, "不明")}

【主要素材】
- ${plainInlineList(setting.visual_rules.material_rules.main_materials, "不明")}

## 保持すべき要素リスト
- ${plainInlineList(setting.must_keep.elements, "不明")}

## 再生成用要約プロンプト
${setting.regeneration_prompt || "不明"}

## 見落とし防止チェック
【キャラクター全身】
- 読み取り済み：${setting.characters.length ? setting.characters.map((item) => item.name_or_label || item.id).join(" / ") : "不明"}
- 不明：${plainInlineList(setting.uncertain_points.needs_confirmation, "不明")}`;
}

function normalizeWorldSettingResult(result) {
  const candidate = result.world_setting || result.worldSetting || result.setting || result;
  const setting = normalizeWorldSetting(candidate);
  const readingLog = result.reading_log || result.readingLog || setting.reading_log;
  const missedCheck = result.miss_check || result.missed_check || result.omission_check || "";
  setting.reading_log = readingLog || composeWorldSettingReadingLog(setting);
  if (missedCheck && !setting.reading_log.includes("見落とし防止チェック")) {
    setting.reading_log = `${setting.reading_log.trim()}\n\n${missedCheck}`;
  }
  return setting;
}

function fallbackWorldSettingFromRaw(content, imageName, parseError) {
  const text = String(content || "").trim();
  const setting = createEmptyWorldSetting();
  setting.title = imageName || "設定シート";
  setting.sheet_type = "AI応答を構造化できなかった設定シート";
  setting.overall_mood = "未整理";
  setting.world_core = "未整理";
  setting.reading_log = text || `AI応答が空、またはJSONとして読み取れませんでした。`;
  setting.uncertain_points.needs_confirmation = [
    `AI応答をJSONとして読み取れませんでした: ${parseError.message}`,
    "再構造化ボタンを押下しお試しください。"
  ];
  setting.regeneration_prompt = "";
  return setting;
}

async function repairWorldSettingJson(rawContent, imageName, parseError) {
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは壊れたAI応答をJSONに整形する編集者です。内容を新規創作せず、与えられた本文から読み取れる構造化情報だけを指定JSONに移してください。詳細ログやMarkdownは出さず、JSONオブジェクトだけを返してください。"
      },
      {
        role: "user",
        content: `元の画像名: ${imageName || "unknown"}\n直前のJSON解析エラー: ${parseError.message}\n\n返答形式:\n{\n  "world_setting": ${worldSettingSchemaText()}\n}\n\nworld_setting.reading_log は空文字にしてください。詳細な読解ログは別ステップで作成します。\n\n壊れた元応答:\n${String(rawContent || "").slice(0, 60000)}`
      }
    ],
    responseFormat: { type: "json_object" },
    temperature: 0,
    purpose: "world",
    maxTokens: 9000
  });
  return normalizeWorldSettingResult(parseAiJson(content));
}

function worldSheetReadingDataText(sheet) {
  const data = worldSettingForSheetData(sheet?.data || {});
  const readingLog = String(sheet?.reading_log || data.reading_log || "").trim();
  data.reading_log = "";
  data.sourceImageUrl = "";
  data.sourceImageName = "";
  const existingData = JSON.stringify(data, null, 2);
  return [
    `シート名: ${sheet?.title || sheet?.sourceImageName || "設定シート"}`,
    `シート種別: ${sheet?.sheet_type || data.sheet_type || "未設定"}`,
    sheet?.sourceImageName ? `元資料名: ${sheet.sourceImageName}` : "",
    readingLog ? `読解ログまたはAI生応答:\n${compactRawText(readingLog, 60000)}` : "",
    `既存の構造化データ:\n${compactRawText(existingData, 18000)}`
  ].filter(Boolean).join("\n\n");
}

function buildWorldSettingRestructureRequest(work, sheet) {
  return `保存済みの読解データを、作品情報 / 世界観設定の構造化JSONに変換してください。

対象作品名: ${work?.name || "未設定"}

目的:
以前のAI読解ログ、AI生応答、途中で切れたJSON、または手動メモから、編集可能な world_setting を作り直すこと。

重要ルール:
- 与えられた読解データから読み取れる情報だけを使ってください。新規創作や穴埋めの捏造は禁止です。
- 読解データが途中で切れている場合でも、読める範囲の情報を最大限構造化してください。
- 見えている事実と推測は分け、不確かな内容は uncertain_points に入れてください。
- 詳細なMarkdown読解ログは出さないでください。reading_log は空文字にしてください。
- characters / objects / architecture は見つかった分だけ id を CH-01, TOOL-01, BG-01 のように採番してください。
- 各フィールドは検索・編集しやすい短文にまとめてください。

返答形式:
説明文やMarkdownコードフェンスを付けず、必ず次のJSONオブジェクトだけを返してください。
{
  "world_setting": ${worldSettingSchemaText()}
}

読解データ:
${worldSheetReadingDataText(sheet)}`;
}

async function restructureWorldSettingFromSheetData(work, sheet) {
  const sourceText = worldSheetReadingDataText(sheet);
  if (!sourceText.trim()) throw new Error("再構造化できる読解データがありません。");
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは保存済みの創作設定読解データを、アプリの作品情報スキーマへ再構造化する編集者です。説明文やMarkdownを付けず、JSONオブジェクトだけを返してください。"
      },
      {
        role: "user",
        content: buildWorldSettingRestructureRequest(work, sheet)
      }
    ],
    responseFormat: { type: "json_object" },
    temperature: 0.05,
    purpose: "world",
    maxTokens: 9000
  });
  try {
    return normalizeWorldSettingResult(parseAiJson(content));
  } catch (parseError) {
    const repaired = await repairWorldSettingJson(content, sheet?.title || sheet?.sourceImageName, parseError);
    repaired.uncertain_points.needs_confirmation.push("再構造化AI応答がJSONとして読めなかったため、JSON整形リトライで保存しました。");
    return repaired;
  }
}

async function restructureWorldSheet(work, sheetId) {
  const current = ensureWorldSetting(work);
  const sheet = current.sheets.find((item) => item.id === sheetId);
  if (!sheet) throw new Error("再構造化する設定シートが見つかりません。");
  const originalLog = String(sheet.reading_log || sheet.data?.reading_log || "").trim();
  toastApiSubmitted("再構造化APIに送信しました。返答を待っています。");
  const setting = await restructureWorldSettingFromSheetData(work, sheet);
  const now = new Date().toISOString();
  setting.reading_log = originalLog || setting.reading_log || composeWorldSettingReadingLog(setting);
  setting.sourceImageUrl = sheet.sourceImageUrl || setting.sourceImageUrl;
  setting.sourceImageName = sheet.sourceImageName || setting.sourceImageName || sheet.title;
  setting.updatedAt = now;
  setting.uncertain_points.needs_confirmation.push("保存済みの読解データから再構造化しました。");
  sheet.title = setting.title || sheet.title || sheet.sourceImageName || "設定シート";
  sheet.sheet_type = setting.sheet_type || sheet.sheet_type || "";
  sheet.sourceImageUrl = setting.sourceImageUrl;
  sheet.sourceImageName = setting.sourceImageName;
  sheet.reading_log = setting.reading_log;
  sheet.data = worldSettingForSheetData(setting);
  sheet.updatedAt = now;
  if (current.activeSheetId === sheet.id) {
    applyWorldSheetToWork(work, sheet.id);
  } else {
    work.worldSetting = normalizeWorldSetting(current);
  }
  await saveDb();
  toast("読解データを再構造化しました。");
  render();
}

function worldImportSourceName(images = state.worldSheetFiles || [], text = String(state.worldTextDraft || "").trim()) {
  const parts = [];
  if (images.length) {
    const imageNames = images.map((image) => image.name).filter(Boolean).join(" / ");
    parts.push(`${images.length}枚の画像${imageNames ? `: ${imageNames}` : ""}`);
  }
  if (text) {
    parts.push(state.worldTextSourceName || "直接入力テキスト");
  }
  return parts.join(" + ") || "設定資料";
}

function worldImportSourceSummary(images = state.worldSheetFiles || [], text = String(state.worldTextDraft || "").trim()) {
  const parts = [];
  if (images.length) parts.push(`画像${images.length}枚`);
  if (text) parts.push(`テキスト${Math.min(text.length, maxWorldTextChars).toLocaleString("ja-JP")}文字`);
  return parts.join(" + ");
}

function clearWorldImportSources() {
  state.worldSheetFiles = [];
  state.worldTextDraft = "";
  state.worldTextSourceName = "";
}

function buildWorldSettingContent(work, { images = [], text = "", sourceName = "", requestText = "" } = {}) {
  const trimmedText = String(text || "").trim();
  const truncatedText = trimmedText.slice(0, maxWorldTextChars);
  const sourceSummary = worldImportSourceSummary(images, trimmedText);
  const blocks = [requestText || buildWorldSettingRequest(work, sourceName, sourceSummary)];
  if (truncatedText) {
    blocks.push(`入力テキスト資料（Markdown/Text）:\n${truncatedText}`);
    if (trimmedText.length > maxWorldTextChars) {
      blocks.push(`注記: テキストは長いため先頭${maxWorldTextChars.toLocaleString("ja-JP")}文字だけを送信しています。`);
    }
  }
  return [
    { type: "text", text: blocks.join("\n\n") },
    ...images.map((image) => ({ type: "image_url", image_url: { url: image.preview } }))
  ];
}

async function generateWorldSettingReadingLog({ images = [], text = "", sourceName = "", work, setting } = {}) {
  const sourceSummary = worldImportSourceSummary(images, String(text || "").trim());
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは世界観設定資料とキャラクター設定資料を読む創作設定編集者です。今回は構造化JSONではなく、人間が確認しやすいMarkdownの読解ログだけを作ります。"
      },
      {
        role: "user",
        content: buildWorldSettingContent(work, {
          images,
          text,
          sourceName,
          requestText: buildWorldSettingReadingLogRequest(work, setting, sourceName, sourceSummary)
        })
      }
    ],
    temperature: 0.15,
    purpose: "world",
    maxTokens: 7000
  });
  return String(content || "").trim();
}

async function extractWorldSettingFromSources({ images = [], text = "", sourceName = "", work } = {}) {
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは世界観設定資料とキャラクター設定資料を読む創作設定編集者です。視覚的事実とテキスト事実、推測を分け、後で作品設定として編集できる構造化データに変換します。"
      },
      {
        role: "user",
        content: buildWorldSettingContent(work, { images, text, sourceName })
      }
    ],
    responseFormat: { type: "json_object" },
    temperature: 0.15,
    purpose: "world",
    maxTokens: 9000
  });
  let setting;
  try {
    setting = normalizeWorldSettingResult(parseAiJson(content));
  } catch (parseError) {
    try {
      setting = await repairWorldSettingJson(content, sourceName, parseError);
      setting.uncertain_points.needs_confirmation.push("初回AI応答がJSONとして読めなかったため、構造化JSON整形リトライで保存しました。");
    } catch (repairError) {
      const fallback = fallbackWorldSettingFromRaw(content, sourceName, parseError);
      fallback.uncertain_points.needs_confirmation.push(`構造化JSON整形リトライも失敗しました: ${repairError.message}`);
      return fallback;
    }
  }
  try {
    toast("構造化が完了しました。詳細読解ログを別生成しています。");
    const readingLog = await generateWorldSettingReadingLog({ images, text, sourceName, work, setting });
    setting.reading_log = readingLog || setting.reading_log || composeWorldSettingReadingLog(setting);
  } catch (logError) {
    setting.reading_log = setting.reading_log || composeWorldSettingReadingLog(setting);
    setting.uncertain_points.needs_confirmation.push(`詳細読解ログの別生成に失敗しました: ${logError.message}`);
  }
  return normalizeWorldSetting(setting);
}

async function extractWorldSettingFromSheet(dataUrl, imageName, work) {
  return extractWorldSettingFromSources({
    images: [{ name: imageName, preview: dataUrl }],
    sourceName: imageName,
    work
  });
}

async function analyzeWorldSheet(work) {
  const images = (state.worldSheetFiles || []).slice(0, maxWorldSheetImages);
  const text = String(state.worldTextDraft || "").trim();
  if (!images.length && !text) {
    toast("先に画像、Markdown/Text、または直接入力テキストを用意してください。");
    return;
  }
  try {
    toast("世界観設定資料を読解しています。少し時間がかかります。");
    const uploadedImages = [];
    for (const image of images) {
      const uploaded = await postJson("/api/upload", {
        dataUrl: image.preview,
        name: image.name,
        workName: work.name,
        characterName: "_世界観設定シート"
      });
      uploadedImages.push(uploaded);
    }
    const sourceName = worldImportSourceName(images, text);
    toastApiSubmitted("世界観読解APIに送信しました。返答を待っています。");
    const setting = await extractWorldSettingFromSources({
      images,
      text,
      sourceName,
      work
    });
    setting.sourceImageUrl = uploadedImages[0]?.url || "";
    setting.sourceImageName = sourceName;
    setting.updatedAt = new Date().toISOString();
    const current = ensureWorldSetting(work);
    const sheet = createWorldSheetRecord(setting, {
      url: setting.sourceImageUrl,
      name: sourceName
    });
    work.worldSetting = normalizeWorldSetting({
      ...setting,
      sourceImageUrl: sheet.sourceImageUrl,
      sourceImageName: sheet.sourceImageName,
      updatedAt: sheet.updatedAt,
      activeSheetId: sheet.id,
      sheets: [...current.sheets, sheet]
    });
    clearWorldImportSources();
    await saveDb();
    toast(shouldSuggestWorldRestructure(setting)
      ? "設定シートを追加しましたが、構造化がされていません。再構造化ボタンを押下しお試しください。"
      : `設定シートを追加しました。登録シート: ${work.worldSetting.sheets.length} 枚`);
    render();
  } catch (error) {
    toast(error.message);
  }
}

function openWorldSettingModal(work, sheetId = null) {
  const workSetting = ensureWorldSetting(work);
  const sheet = sheetId ? workSetting.sheets.find((item) => item.id === sheetId) : null;
  const setting = sheet ? normalizeWorldSetting(sheet.data) : workSetting;
  openModal(
    sheet ? "設定シートの手動変更" : "世界観設定の手動変更",
    `
      <div class="form-grid">
        <label>仮タイトル<input id="world-title" value="${escapeHtml(setting.title)}"></label>
        <label>シートの種類<input id="world-sheet-type" value="${escapeHtml(setting.sheet_type)}"></label>
        <label class="full">全体の雰囲気<textarea id="world-mood">${escapeHtml(setting.overall_mood)}</textarea></label>
        <label class="full">世界観の核<textarea id="world-core">${escapeHtml(setting.world_core)}</textarea></label>
        <label>主色（改行またはカンマ区切り）<textarea id="world-main-colors">${escapeHtml(listText(setting.visual_rules.color_rules.main_colors))}</textarea></label>
        <label>差し色（改行またはカンマ区切り）<textarea id="world-accent-colors">${escapeHtml(listText(setting.visual_rules.color_rules.accent_colors))}</textarea></label>
        <label>基本形（改行またはカンマ区切り）<textarea id="world-basic-shapes">${escapeHtml(listText(setting.visual_rules.shape_language.basic_shapes))}</textarea></label>
        <label>反復モチーフ（改行またはカンマ区切り）<textarea id="world-repeated-motifs">${escapeHtml(listText(setting.visual_rules.shape_language.repeated_motifs))}</textarea></label>
        <label>主要素材（改行またはカンマ区切り）<textarea id="world-main-materials">${escapeHtml(listText(setting.visual_rules.material_rules.main_materials))}</textarea></label>
        <label>危険要素（改行またはカンマ区切り）<textarea id="world-dangers">${escapeHtml(listText(setting.environment.dangers))}</textarea></label>
        <label>地形<textarea id="world-terrain">${escapeHtml(setting.environment.terrain)}</textarea></label>
        <label>気候<textarea id="world-climate">${escapeHtml(setting.environment.climate)}</textarea></label>
        <label>共同体の規模感<input id="world-community" value="${escapeHtml(setting.society.community_type)}"></label>
        <label>信仰<input id="world-belief" value="${escapeHtml(setting.society.belief)}"></label>
        <label>住居<textarea id="world-housing">${escapeHtml(setting.life_culture.housing)}</textarea></label>
        <label>移動手段<textarea id="world-transport">${escapeHtml(setting.life_culture.transport)}</textarea></label>
        <label>保持すべき要素<textarea id="world-must-keep">${escapeHtml(listText(setting.must_keep.elements))}</textarea></label>
        <label>変更しない要素<textarea id="world-do-not-change">${escapeHtml(listText(setting.must_keep.do_not_change))}</textarea></label>
        <label class="full">再生成用要約プロンプト<textarea id="world-regeneration">${escapeHtml(setting.regeneration_prompt)}</textarea></label>
        <label class="full">読解ログ<textarea class="tall-textarea" id="world-reading-log">${escapeHtml(setting.reading_log)}</textarea></label>
        <label class="full">キャラクター JSON<textarea class="json-textarea" id="world-characters-json">${escapeHtml(JSON.stringify(setting.characters, null, 2))}</textarea></label>
        <label class="full">道具・建築・記号 JSON<textarea class="json-textarea" id="world-objects-json">${escapeHtml(JSON.stringify({
          objects: setting.objects,
          architecture: setting.architecture,
          text_and_symbols: setting.text_and_symbols,
          sheet_design: setting.sheet_design,
          uncertain_points: setting.uncertain_points
        }, null, 2))}</textarea></label>
      </div>
    `,
    `<div><button class="danger" data-action="clear-world-setting">${sheet ? "このシートを削除" : "初期化"}</button></div><button data-action="save-world-setting">保存</button>`,
    (modal, close) => {
      modal.querySelector("[data-action='save-world-setting']").addEventListener("click", async () => {
        try {
          const extra = parseJsonField(modal.querySelector("#world-objects-json").value, {});
          const next = normalizeWorldSetting(setting);
          next.title = modal.querySelector("#world-title").value.trim();
          next.sheet_type = modal.querySelector("#world-sheet-type").value.trim();
          next.overall_mood = modal.querySelector("#world-mood").value.trim();
          next.world_core = modal.querySelector("#world-core").value.trim();
          next.visual_rules.color_rules.main_colors = splitList(modal.querySelector("#world-main-colors").value);
          next.visual_rules.color_rules.accent_colors = splitList(modal.querySelector("#world-accent-colors").value);
          next.visual_rules.shape_language.basic_shapes = splitList(modal.querySelector("#world-basic-shapes").value);
          next.visual_rules.shape_language.repeated_motifs = splitList(modal.querySelector("#world-repeated-motifs").value);
          next.visual_rules.material_rules.main_materials = splitList(modal.querySelector("#world-main-materials").value);
          next.environment.dangers = splitList(modal.querySelector("#world-dangers").value);
          next.environment.terrain = modal.querySelector("#world-terrain").value.trim();
          next.environment.climate = modal.querySelector("#world-climate").value.trim();
          next.society.community_type = modal.querySelector("#world-community").value.trim();
          next.society.belief = modal.querySelector("#world-belief").value.trim();
          next.life_culture.housing = modal.querySelector("#world-housing").value.trim();
          next.life_culture.transport = modal.querySelector("#world-transport").value.trim();
          next.must_keep.elements = splitList(modal.querySelector("#world-must-keep").value);
          next.must_keep.do_not_change = splitList(modal.querySelector("#world-do-not-change").value);
          next.regeneration_prompt = modal.querySelector("#world-regeneration").value.trim();
          next.reading_log = modal.querySelector("#world-reading-log").value.trim();
          next.characters = parseJsonField(modal.querySelector("#world-characters-json").value, []);
          if (!Array.isArray(next.characters)) throw new Error("キャラクター JSON は配列で入力してください。");
          next.objects = Array.isArray(extra.objects) ? extra.objects : [];
          next.architecture = Array.isArray(extra.architecture) ? extra.architecture : [];
          next.text_and_symbols = isPlainObject(extra.text_and_symbols) ? extra.text_and_symbols : createEmptyWorldSetting().text_and_symbols;
          next.sheet_design = isPlainObject(extra.sheet_design) ? extra.sheet_design : createEmptyWorldSetting().sheet_design;
          next.uncertain_points = isPlainObject(extra.uncertain_points) ? extra.uncertain_points : createEmptyWorldSetting().uncertain_points;
          next.updatedAt = new Date().toISOString();
          if (sheet) {
            const current = ensureWorldSetting(work);
            const savedSheet = current.sheets.find((item) => item.id === sheet.id);
            if (!savedSheet) throw new Error("編集対象の設定シートが見つかりません。");
            next.sourceImageUrl = savedSheet.sourceImageUrl;
            next.sourceImageName = savedSheet.sourceImageName;
            savedSheet.title = next.title || savedSheet.sourceImageName || "設定シート";
            savedSheet.sheet_type = next.sheet_type;
            savedSheet.reading_log = next.reading_log;
            savedSheet.data = worldSettingForSheetData(next);
            savedSheet.updatedAt = next.updatedAt;
            if (current.activeSheetId === savedSheet.id) {
              applyWorldSheetToWork(work, savedSheet.id);
            } else {
              work.worldSetting = normalizeWorldSetting(current);
            }
          } else {
            next.sourceImageUrl = workSetting.sourceImageUrl;
            next.sourceImageName = workSetting.sourceImageName;
            next.activeSheetId = workSetting.activeSheetId;
            next.sheets = workSetting.sheets;
            work.worldSetting = normalizeWorldSetting(next);
          }
          await saveDb();
          close();
          render();
          toast(sheet ? "設定シートを保存しました。" : "世界観設定を保存しました。");
        } catch (error) {
          toast(error.message);
        }
      });
      modal.querySelector("[data-action='clear-world-setting']").addEventListener("click", async () => {
        const ok = window.confirm(sheet ? "この設定シートを履歴から削除します。画像ファイル本体は削除しません。" : "この作品の世界観設定を初期化します。保存済みの設定内容は消えます。");
        if (!ok) return;
        if (sheet) rebuildWorldSettingAfterSheetRemoval(work, sheet.id);
        else work.worldSetting = createEmptyWorldSetting();
        await saveDb();
        close();
        render();
        toast(sheet ? "設定シートを削除しました。" : "世界観設定を初期化しました。");
      });
    }
  );
}

function openCharacterAudioModal(char) {
  if (!char) return;
  const audios = audioItemsForCharacter(char.id);
  openModal(
    `${char.name} の音声`,
    `
      <div class="audio-history-list">
        ${audios.length ? audios.map(renderAudioItem).join("") : `<div class="empty compact">このキャラに紐づいた音声はまだありません。</div>`}
      </div>
    `,
    `<div></div><button data-action="close-audio-list">閉じる</button>`,
    (modal, close) => {
      modal.querySelector("[data-action='close-audio-list']").addEventListener("click", close);
    }
  );
}

function openAssetModal(asset) {
  const dimensions = assetDimensionLabel(asset);
  openModal(
    "画像詳細",
    `
      <div class="split">
        <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="">
        <div class="form-grid">
          <label class="full">名前<input value="${escapeHtml(asset.name)}" id="asset-name"></label>
          <label class="full">プロンプト形式
            <select id="asset-prompt-format">
              <option value="natural" ${(asset.aiPromptFormat || "natural") === "natural" ? "selected" : ""}>自然言語</option>
              <option value="tags" ${asset.aiPromptFormat === "tags" ? "selected" : ""}>タグ</option>
            </select>
          </label>
          <label class="full">AI抽出プロンプト<textarea id="asset-prompt">${escapeHtml(asset.aiPrompt || "")}</textarea></label>
          <label class="full">AI理由<textarea id="asset-reason">${escapeHtml(asset.aiReason || "")}</textarea></label>
          <div class="full meta">割当: ${escapeHtml(subjectLabelForAsset(asset))}</div>
          <div class="full meta">画像情報: ${escapeHtml(dimensions || "未取得")}</div>
        </div>
      </div>
    `,
    `<div></div><button data-action="save-asset-detail">保存</button>`,
    (modal, close) => {
      modal.querySelector("[data-action='save-asset-detail']").addEventListener("click", async () => {
        asset.name = modal.querySelector("#asset-name").value.trim() || asset.name;
        asset.aiPromptFormat = modal.querySelector("#asset-prompt-format").value;
        asset.aiPrompt = modal.querySelector("#asset-prompt").value.trim();
        asset.aiReason = modal.querySelector("#asset-reason").value.trim();
        await saveDb();
        close();
        render();
      });
    }
  );
}

async function boot() {
  try {
    state.db = await getJson("/api/db");
    state.selectedWorkId = state.db.works[0]?.id || null;
    state.imageWorkId = state.selectedWorkId;
    state.audioWorkId = state.selectedWorkId;
    state.videoWorkId = state.selectedWorkId;
    state.galleryWorkId = state.selectedWorkId;
    const hadInterruptedClassifications = markInterruptedImageClassifications();
    await normalizeStoredUploads();
    if (hadInterruptedClassifications) await saveDb();
    render();
    const activeImageJob = (state.db.imageJobs || []).find((job) => job.providerTaskId && activeImageJobStatuses.includes(job.status));
    if (activeImageJob) window.setTimeout(() => pollComfyJob(activeImageJob.id), 1200);
    const activeJob = (state.db.videoJobs || []).find((job) => job.providerTaskId && activeVideoJobStatuses.includes(job.status));
    if (activeJob) window.setTimeout(() => pollSeedanceJob(activeJob.id), 1200);
  } catch (error) {
    app.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}

boot();
