const app = document.querySelector("#app");
const modalTemplate = document.querySelector("#modal-template");

const state = {
  db: null,
  view: "studio",
  selectedWorkId: null,
  galleryWorkId: null,
  galleryCharacterId: "",
  galleryFiltersCollapsed: false,
  importFiles: [],
  importAutoClassify: true,
  importPromptFormat: "natural",
  importCharacterId: "",
  importWorldItemId: "",
  libraryStatus: "all",
  libraryCharacterId: "all",
  librarySort: "newest",
  libraryPage: 1,
  libraryPageSize: 48,
  videoWorkId: null,
  videoCharacterId: "",
  videoReferenceKind: "all",
  videoSelectedReferenceIds: [],
  videoReferenceRoles: {},
  videoChatMessages: [
    { role: "assistant", content: "Seedance用の動画生成エージェントです。作りたい場面、秒数、縦横比、使いたい参照素材を教えてください。" }
  ],
  videoPromptDraft: null,
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
  audioIsThinking: false,
  audioIsGenerating: false,
  audioGenerationStartedAt: 0,
  audioGenerationTimer: null,
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
  videoPricingStatus: "idle",
  videoPricingError: "",
  videoCostCollapsed: false
};

const navItems = [
  ["studio", "作品とキャラ"],
  ["import", "画像取込"],
  ["gallery", "画像一覧"],
  ["audio", "音声生成"],
  ["video", "動画生成"],
  ["library", "画像整理"],
  ["prompt", "Prompt Lab"],
  ["settings", "設定"]
];

const openRouterTtsModel = "google/gemini-3.1-flash-tts-preview";

const audioProviders = [
  ["openrouter", "OpenRouter / Gemini TTS"],
  ["elevenlabs", "ElevenLabs"],
  ["irodori", "Irodori-TTS"]
];

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

const defaultAudioActingPrompt = "自然な日本語で、感情と間を大切にして読み上げてください。";

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
const isOpenRouterSeedanceBaseUrl = (value = state.db?.settings?.seedanceBaseUrl) => String(value || "").includes("openrouter.ai");
const activeSeedanceApiKey = (baseUrl = state.db?.settings?.seedanceBaseUrl) =>
  isOpenRouterSeedanceBaseUrl(baseUrl) ? (apiKey() || seedanceApiKey()) : seedanceApiKey();

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
  return {
    id: item.id || uid(),
    workId: item.workId || null,
    characterId: item.characterId || null,
    title: item.title || item.name || "生成音声",
    input: item.input || item.text || "",
    provider,
    voice: item.voice || (provider === "irodori" ? irodori?.mode || "VoiceDesign" : "Kore"),
    model: item.model || (provider === "irodori" ? "Irodori-TTS" : openRouterTtsModel),
    format: item.format || (provider === "irodori" ? "wav" : "mp3"),
    url: item.url || "",
    localPath: item.localPath || item.path || "",
    mimeType: item.mimeType || (provider === "irodori" ? "audio/wav" : "audio/mpeg"),
    generationId: item.generationId || "",
    size: Number(item.size) || null,
    agentNote: item.agentNote || "",
    caption: item.caption || irodori?.caption || "",
    actingPrompt: item.actingPrompt || item.caption || "",
    irodori,
    elevenLabs: item.elevenLabs || null,
    referenceAudio: item.referenceAudio || null,
    createdAt: item.createdAt || new Date().toISOString()
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

function boundedSettingNumber(value, fallback, min, max, integer = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const bounded = Math.min(max, Math.max(min, number));
  return integer ? Math.round(bounded) : Number(bounded.toFixed(2));
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

function normalizeSettings() {
  state.db.settings = {
    defaultModel: "google/gemini-2.5-flash",
    textModel: "google/gemini-2.5-flash",
    worldModel: state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    videoAgentModel: state.db.settings?.textModel || state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    audioAgentModel: state.db.settings?.textModel || state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    audioProvider: "openrouter",
    audioModel: openRouterTtsModel,
    audioVoice: "Kore",
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
    irodoriAppDir: "vendor/Irodori-TTS",
    irodoriDefaults: { ...irodoriDefaultSettings },
    seedanceBaseUrl: "https://ark.ap-southeast.bytepluses.com/api/v3",
    seedanceModel: "dreamina-seedance-2-0-260128",
    seedanceResolution: "720p",
    videoPricing: {
      updatedAt: "",
      usdJpyRate: 155,
      usdJpySource: "fallback",
      models: {}
    },
    ...(state.db.settings || {})
  };
  if (!state.db.settings.worldModel) state.db.settings.worldModel = state.db.settings.defaultModel || state.db.settings.textModel;
  if (!state.db.settings.videoAgentModel) state.db.settings.videoAgentModel = state.db.settings.textModel || state.db.settings.defaultModel;
  if (!state.db.settings.audioAgentModel) state.db.settings.audioAgentModel = state.db.settings.textModel || state.db.settings.defaultModel;
  state.db.settings.audioProvider = normalizedAudioProvider(state.db.settings.audioProvider);
  state.audioProvider = normalizedAudioProvider(state.db.settings.audioProvider || state.audioProvider);
  state.db.settings.audioModel = state.db.settings.audioModel || openRouterTtsModel;
  state.db.settings.audioVoice = ttsVoices.some(([voice]) => voice === state.db.settings.audioVoice) ? state.db.settings.audioVoice : "Kore";
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
  state.db.settings.irodoriAppDir = String(state.db.settings.irodoriAppDir || "vendor/Irodori-TTS").trim() || "vendor/Irodori-TTS";
  state.db.settings.irodoriDefaults = normalizedIrodoriSettings(state.db.settings.irodoriDefaults);
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
    <label class="full">API Base URL
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

function videoModelConfig(modelId, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  if (!isOpenRouterSeedanceBaseUrl(baseUrl)) {
    return modelId && modelId !== officialSeedanceVideoModel.id
      ? { ...officialSeedanceVideoModel, id: modelId, name: modelId }
      : officialSeedanceVideoModel;
  }
  return openRouterVideoModelChoices(modelId).find((model) => model.id === modelId) || openRouterVideoModelChoices()[0];
}

function compatibleVideoModelId(modelId, baseUrl = state.db?.settings?.seedanceBaseUrl) {
  const defaultModel = seedanceApiBasePreset(baseUrl).defaultModel;
  const value = modelId || defaultModel;
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

function inferVideoPricingFromModel(model = {}) {
  const fallback = fallbackOpenRouterVideoPricing[model.id] || {};
  const pricing = {
    modelId: model.id || "",
    name: model.name || model.id || "",
    usdPerSecond: fallback.usdPerSecond ?? null,
    usdPerSecondByResolution: { ...(fallback.usdPerSecondByResolution || {}) },
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

function videoPricingForModel(modelId) {
  const stored = state.db?.settings?.videoPricing?.models?.[modelId];
  if (stored) return stored;
  const model = videoModelConfig(modelId, state.db?.settings?.seedanceBaseUrl);
  return inferVideoPricingFromModel(model || { id: modelId, name: modelId });
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

function estimateUsdPerSecond(modelId, resolution = "720p", ratio = "16:9") {
  const pricing = videoPricingForModel(modelId);
  const byResolution = pricing?.usdPerSecondByResolution || {};
  const resolutionRate = numberOrNull(byResolution[resolution] ?? byResolution[String(resolution).toLowerCase()] ?? byResolution[String(resolution).toUpperCase()]);
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
  const rate = estimateUsdPerSecond(modelId, resolution, ratio);
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

function currentVideoRateSummary(modelId, resolution, ratio) {
  const pricing = videoPricingForModel(modelId);
  const usdPerSecond = estimateUsdPerSecond(modelId, resolution, ratio);
  const usdJpyRate = numberOrNull(state.db.settings?.videoPricing?.usdJpyRate) || 155;
  return {
    modelId,
    usdPerSecond,
    jpyPerSecond: usdPerSecond === null ? null : usdPerSecond * usdJpyRate,
    source: pricing?.source || "fallback",
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
  const models = isOpenRouterSeedanceBaseUrl() ? mergedOpenRouterVideoModels() : [officialSeedanceVideoModel];
  const pricingModels = { ...(previous.models || {}) };
  models.forEach((model) => {
    pricingModels[model.id] = inferVideoPricingFromModel(model);
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
	    throw new Error(readableError(payload.error) || readableError(payload) || text || `${response.status} ${response.statusText}`);
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
  return state.db.characters.some((char) => char.portraitUrl === url)
    || state.db.assets.some((asset) => asset.id !== excludingAssetId && asset.url === url);
}

async function deleteAssetCompletely(asset) {
  if (!asset) return;
  const shared = isUploadUrlReferenced(asset.url, asset.id);
  const ok = window.confirm(
    shared
      ? `「${asset.name}」の登録を削除します。この画像ファイルは他の登録またはキャラ立ち絵で使われているため、ファイル本体は残します。`
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
  throw new Error(`AI応答を JSON として読み取れませんでした。応答の先頭: ${preview || "空の応答"}`);
}

function selectedOpenRouterModel({ textOnly = false, purpose = "" } = {}) {
  if (purpose === "world") return state.db.settings.worldModel || state.db.settings.defaultModel || state.db.settings.textModel;
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
  return payload.choices?.[0]?.message?.content || "";
}

function render() {
  const [title, sub] = currentTitle();
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>Creative<br>File Studio</strong>
          <span>local creator archive</span>
        </div>
        <nav class="nav">
          ${navItems.map(([id, label]) => `<button class="${state.view === id ? "active" : ""}" data-view="${id}">${label}</button>`).join("")}
        </nav>
        <div class="sidebar-meta">
          ${state.db.works.length} 作品 / ${state.db.characters.length} キャラ / ${state.db.worldItems?.length || 0} その他 / ${state.db.assets.length} 画像 / ${state.db.audioItems?.length || 0} 音声 / ${state.db.videoJobs?.length || 0} 動画
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h1>${title}</h1>
            <p>${sub}</p>
          </div>
          <button class="ghost" data-action="save-now">保存</button>
        </header>
        <section class="content">${renderView()}</section>
      </main>
    </div>
  `;
  bindCommon();
  bindView();
}

function currentTitle() {
  if (state.view === "studio") return ["作品とキャラ", "作品単位でキャラ設定と立ち絵を管理します。"];
  if (state.view === "import") return ["画像取込", "複数画像を取り込み、AIでキャラ別に振り分けます。"];
  if (state.view === "gallery") return ["画像一覧", "作品ごと、キャラごとに保存済み画像を閲覧します。"];
  if (state.view === "audio") return ["音声生成", "OpenRouter TTSでキャラ音声やナレーションを作ります。"];
  if (state.view === "video") return ["動画生成", "Seedance向けの指示書作成と生成を行います。"];
  if (state.view === "library") return ["画像整理", "取り込んだ画像を作品・キャラ・状態で確認します。"];
  if (state.view === "prompt") return ["Prompt Lab", "差分やシーン案から生成プロンプトをまとめて作ります。"];
  return ["設定", "OpenRouter の接続情報とモデルを設定します。"];
}

function renderView() {
  if (state.view === "studio") return renderStudio();
  if (state.view === "import") return renderImport();
  if (state.view === "gallery") return renderGallery();
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
          <button class="accent" data-action="run-import" ${state.importFiles.length ? "" : "disabled"}>取り込む</button>
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
    <div class="library-resultbar">
      <div class="meta">${allAssets.length ? `${pageInfo.start + 1}-${pageInfo.end} / ${allAssets.length} 件を表示中` : "0 件"}</div>
      ${renderLibraryPager(pageInfo, allAssets.length)}
    </div>
    ${assets.length ? `<div class="grid">${assets.map(renderAssetCard).join("")}</div>` : `<div class="empty">条件に合う画像がありません。</div>`}
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
  const statusLabel = asset.status === "matched" ? "判別済み" : asset.status === "failed" ? "判別失敗" : "未設定";
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
        <div class="tag-row"><span class="tag status-${asset.status}">${statusLabel}</span></div>
        <select data-action="assign-asset" data-id="${asset.id}">
          <option value="" ${selectedSubject === "unassigned" ? "selected" : ""}>未割当</option>
          ${workChars.length ? `<optgroup label="キャラ">${workChars.map((candidate) => `<option value="char:${candidate.id}" ${selectedSubject === `char:${candidate.id}` ? "selected" : ""}>${escapeHtml(candidate.name)}</option>`).join("")}</optgroup>` : ""}
          ${workWorldItems.length ? `<optgroup label="その他情報">${workWorldItems.map((item) => `<option value="world:${item.id}" ${selectedSubject === `world:${item.id}` ? "selected" : ""}>${escapeHtml(worldItemCategoryLabel(item.category))}: ${escapeHtml(item.name)}</option>`).join("")}</optgroup>` : ""}
        </select>
        <button class="ghost" data-action="classify-one" data-id="${asset.id}" ${asset.worldItemId ? "disabled" : ""}>AIキャラ判定</button>
        <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
        <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
        <button class="ghost danger-outline" data-action="delete-asset-history" data-id="${asset.id}">履歴削除</button>
      </div>
    </article>
  `;
}

function renderGallery() {
  const galleryWorkId = state.galleryWorkId ?? state.selectedWorkId ?? "";
  const assets = state.db.assets
    .filter((asset) => !galleryWorkId || asset.workId === galleryWorkId)
    .filter((asset) => !state.galleryCharacterId || (state.galleryCharacterId === "unassigned" ? !asset.characterId && !asset.worldItemId : assetSubjectKey(asset) === state.galleryCharacterId || asset.characterId === state.galleryCharacterId));
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
          ${state.galleryFiltersCollapsed ? `<button class="ghost" data-action="toggle-gallery-filters">表示条件</button>` : ""}
        </div>
        ${assets.length ? grouped.map(renderGalleryGroup).join("") : `<div class="empty">表示できる画像がありません。</div>`}
      </section>
    </div>
  `;
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
  return `
    <article class="asset-card">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="" loading="lazy" decoding="async">
      <div class="body">
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(work?.name || "未分類")} / ${escapeHtml(subjectLabelForAsset(asset))}</div>
          ${dimensions ? `<div class="meta">${escapeHtml(dimensions)}</div>` : ""}
        </div>
        <div class="card-actions">
          <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
          <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
          <button class="ghost danger-outline" data-action="delete-asset-completely" data-id="${asset.id}">完全削除</button>
        </div>
      </div>
    </article>
  `;
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
    prompt: document.querySelector("#video-prompt-text")?.value.trim() || state.videoPromptDraft?.prompt || ""
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
  return `あなたはSeedance 2.0向けの動画監督エージェントです。ユーザーのチャット、作品情報、世界観、キャラ情報、参照素材を読み、足りない情報があれば短く聞き取り、十分ならAPI送信用プロンプト案を作ります。

必ず次のJSONだけを返してください。
{
  "message": "ユーザーに見せる日本語の返答。聞き取り、意図の整理、または生成に入れる状態の説明。",
  "ready": true または false,
  "questions": ["必要な確認事項"],
  "draft": {
    "title": "短いタイトル",
    "prompt": "Seedance APIに送る英語プロンプト。参照素材がある場合は @Image1 / @Video1 / @Audio1 を使う。",
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

Seedanceプロンプトの優先ルール:
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
    title: source.title || "Seedance video",
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
  const input = document.querySelector("#video-chat-input")?.value.trim();
  const message = input || (forceDraft ? "ここまでの会話と選択素材から、Seedance API送信用のプロンプト案を作ってください。" : "");
  if (!message) return toast("メッセージを入力してください。");
  const controls = videoControlsFromDom();
  state.videoWorkId = controls.workId || null;
  state.videoChatMessages.push({ role: "user", content: message });
  state.videoIsThinking = true;
  render();
  try {
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
    render();
  } catch (error) {
    state.videoIsThinking = false;
    state.videoChatMessages.push({ role: "assistant", content: `エラー: ${error.message}` });
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
  const prompt = controls.prompt;
  const seedanceKey = activeSeedanceApiKey();
  if (!seedanceKey) return toast(isOpenRouterSeedanceBaseUrl() ? "設定画面で OpenRouter API キーを保存してください。" : "設定画面で Seedance API キーを保存してください。");
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
      title: state.videoPromptDraft?.title || "Seedance video",
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
      job.error = "Seedance の task id を取得できませんでした。";
      job.updatedAt = new Date().toISOString();
      await saveDb();
      render();
      throw new Error(job.error);
    }
    job.status = payload.status || "submitted";
    job.updatedAt = new Date().toISOString();
    await saveDb();
    render();
    toast("Seedance生成タスクを開始しました。");
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
  if (!job?.providerTaskId || !seedanceKey) {
    state.videoIsGenerating = false;
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
    job.videoUrl = payload.videoUrl || job.videoUrl || "";
    job.localUrl = payload.localUrl || job.localUrl || "";
    job.localPath = payload.localPath || job.localPath || "";
    job.providerPayload = payload;
    job.updatedAt = new Date().toISOString();
    await saveDb();
    const done = ["succeeded", "failed", "expired", "cancelled"].includes(job.status);
    if (done) {
      state.videoIsGenerating = false;
      state.videoPollingJobId = "";
      toast(job.status === "succeeded" ? "生成動画を保存しました。" : `生成タスクが ${job.status} で終了しました。`);
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
        workName: work?.name
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
  return {
    provider,
    workId: selectedChar?.workId || document.querySelector("#audio-work")?.value || state.audioWorkId || state.selectedWorkId || "",
    characterId: selectedCharId,
    voice: provider === "elevenlabs" ? elevenLabs.voiceId : document.querySelector("#audio-voice")?.value || state.audioVoice || state.db.settings.audioVoice || "Kore",
    irodori,
    elevenLabs,
    actingPrompt,
    caption: provider === "irodori" ? irodori.caption : actingPrompt,
    title: document.querySelector("#audio-title")?.value.trim() || state.audioPromptDraft?.title || "生成音声",
    input: document.querySelector("#audio-input-text")?.value.trim() || state.audioPromptDraft?.input || ""
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

function buildAudioAgentSystemPrompt() {
  const voices = ttsVoices.map(([voice, label]) => `${voice}: ${label}`).join("\n");
  return `あなたは創作向けの音声演出エージェントです。ユーザーの要望、作品情報、キャラ情報から、音声生成に送る読み上げテキストを作ります。

必ず次のJSONだけを返してください。
{
  "message": "ユーザーに見せる日本語の返答。確認事項や作成意図を短く説明。",
  "ready": true または false,
  "questions": ["必要な確認事項"],
    "draft": {
      "title": "短い音声タイトル",
      "input": "実際に読み上げる本文。説明文や演技指示は入れず、台詞・ナレーションだけにする。",
      "voice": "下記ボイス名のどれか",
      "actingPrompt": "演技指示。声質、感情、速度、間、距離感、アクセントを書く。Geminiでは必要なインライン音声タグも少量だけ使える。",
      "caption": "Irodori-TTSで使う声質・演技・距離感の指定。actingPrompt と同じ方針でよい。",
      "agentNote": "演技意図の短いメモ"
    }
  }

音声作成ルール:
- APIに送るのは説明文ではなく、実際に読み上げる本文にする。
- キャラ指定がある場合は、キャラの性格、立場、メモ、作品世界に合う声色と台詞にする。
- キャラ指定がない場合は、ナレーションや汎用ボイスとして自然に使える本文にする。
- Gemini TTSの場合は actingPrompt に「低い声、怒りを抑える、少し速め、近い距離、語尾を弱める」などを具体的に書く。
- Gemini TTSでは必要に応じて actingPrompt または input に [whispers] [laughs] [excited] [short pause] などのインライン音声タグを少量だけ使える。
- ElevenLabsの場合は voice ID と voice_settings が主な制御なので、input は読み上げ本文に集中し、actingPrompt は画面で確認・保存できる演技指示として短くまとめる。
- 過剰な演技タグは避け、重要な間や感情だけに使う。
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
provider=${controls.provider}, voice=${controls.voice}, actingPrompt=${controls.actingPrompt || ""}, elevenLabsVoiceId=${controls.elevenLabs?.voiceId || ""}, elevenLabsModel=${controls.elevenLabs?.modelId || ""}, irodoriMode=${controls.irodori?.mode || "VoiceDesign"}, caption=${controls.irodori?.caption || ""}, title=${controls.title}, characterId=${controls.characterId || "未指定"}

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
  const irodori = normalizedIrodoriSettings({ ...fallbackControls.irodori, caption: source.caption || actingPrompt || fallbackControls.irodori?.caption });
  return {
    title: source.title || fallbackControls.title || "生成音声",
    input: source.input || "",
    voice: ttsVoices.some(([item]) => item === voice) ? voice : fallbackControls.voice || "Kore",
    provider: fallbackControls.provider || "openrouter",
    elevenLabs: fallbackControls.elevenLabs,
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
  const input = document.querySelector("#audio-chat-input")?.value.trim();
  const message = input || (forceDraft ? "ここまでの会話と選択中のキャラ設定から、音声生成用の読み上げテキスト案を作ってください。" : "");
  if (!message) return toast("メッセージを入力してください。");
  const controls = audioControlsFromDom();
  state.audioWorkId = controls.workId || null;
  state.audioCharacterId = controls.characterId || "";
  state.audioVoice = controls.voice;
  state.audioProvider = controls.provider;
  state.db.settings.audioProvider = controls.provider;
  state.db.settings.audioActingPrompt = controls.actingPrompt || defaultAudioActingPrompt;
  state.db.settings.irodoriDefaults = controls.irodori;
  state.audioChatMessages.push({ role: "user", content: message });
  state.audioIsThinking = true;
  render();
  try {
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
    render();
  } catch (error) {
    state.audioIsThinking = false;
    state.audioChatMessages.push({ role: "assistant", content: `エラー: ${error.message}` });
    render();
  }
}

async function startAudioGeneration() {
  const controls = audioControlsFromDom();
  if (!controls.input) return toast("読み上げテキストを入力してください。");
  const key = apiKey();
  const elevenKey = elevenLabsApiKey();
  if (controls.provider === "openrouter" && !key) return toast("設定画面で OpenRouter API キーを保存してください。");
  if (controls.provider === "elevenlabs" && !elevenKey) return toast("設定画面で ElevenLabs API キーを保存してください。");
  if (controls.provider === "elevenlabs" && !controls.elevenLabs.voiceId) return toast("ElevenLabs voice ID を指定してください。");
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
  state.db.settings.audioModel = openRouterTtsModel;
  state.db.settings.elevenLabsVoiceId = controls.elevenLabs.voiceId;
  state.db.settings.elevenLabsModelId = controls.elevenLabs.modelId;
  state.db.settings.elevenLabsOutputFormat = controls.elevenLabs.outputFormat;
  state.db.settings.elevenLabsStability = controls.elevenLabs.stability;
  state.db.settings.elevenLabsSimilarityBoost = controls.elevenLabs.similarityBoost;
  state.db.settings.elevenLabsStyle = controls.elevenLabs.style;
  state.db.settings.elevenLabsSpeed = controls.elevenLabs.speed;
  state.db.settings.elevenLabsSpeakerBoost = controls.elevenLabs.useSpeakerBoost;
  state.db.settings.elevenLabsLanguageCode = controls.elevenLabs.languageCode;
  state.db.settings.irodoriDefaults = controls.irodori;
  startAudioGenerationClock();
  render();
  try {
    let created = [];
    if (controls.provider === "openrouter") {
      const payload = await postJson("/api/openrouter/speech", {
        apiKey: key,
        model: openRouterTtsModel,
        input: composeGeminiTtsInput(controls.input, controls.actingPrompt),
        voice: controls.voice,
        responseFormat: "pcm",
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
        model: openRouterTtsModel,
        format,
        caption: controls.actingPrompt,
        actingPrompt: controls.actingPrompt,
        url: payload.url,
        localPath: payload.path,
        mimeType: payload.mimeType,
        generationId: payload.generationId,
        size: payload.size,
        agentNote: state.audioPromptDraft?.agentNote || "",
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
  const providerLabel = audio.provider === "irodori" ? "Irodori-TTS" : audio.provider === "elevenlabs" ? "ElevenLabs" : "OpenRouter TTS";
  const voiceLabel = audio.provider === "irodori"
    ? `${audio.irodori?.mode || audio.voice || "VoiceDesign"}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`
    : audio.provider === "elevenlabs"
      ? `${audio.voice || "voice ID未設定"} / ${audio.model || "eleven_multilingual_v2"}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`
    : `${audio.voice || "Kore"}${audio.caption ? ` / ${compactPromptText(audio.caption, 90)}` : ""}`;
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
  const voiceValue = controls.voice || state.audioVoice || state.db.settings.audioVoice || "Kore";
  const actingPromptValue = controls.actingPrompt || (providerValue === "openrouter" ? controls.caption : "") || state.db.settings.audioActingPrompt || defaultAudioActingPrompt;
  const elevenLabsValue = elevenLabsSettingsFromControls(controls.elevenLabs || {});
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
            <label class="full">ボイス
              <select id="audio-voice">${renderTtsVoiceOptions(voiceValue)}</select>
            </label>
            <label class="full">演技指示
              <textarea id="audio-acting-prompt" rows="4" placeholder="例：低く静かな声。怒りを抑え、近い距離で囁くように。重要な間だけ [short pause] を入れる。">${escapeHtml(actingPromptValue)}</textarea>
            </label>
            <div class="full meta">生成モデル: ${escapeHtml(openRouterTtsModel)} / 形式: WAV（PCMを受信して保存）</div>
          ` : providerValue === "elevenlabs" ? `
            <div class="full meta">ElevenLabsを使って音声を生成します。voice ID と voice settings を指定できます。</div>
            <label class="full">演技指示
              <textarea id="audio-acting-prompt" rows="4" placeholder="例：穏やかで少し低め。親しい距離感で、語尾はやわらかく。大事な一文の前に短い間を置く。">${escapeHtml(actingPromptValue)}</textarea>
            </label>
            ${renderElevenLabsParameters(elevenLabsValue)}
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
              <textarea id="audio-chat-input" placeholder="例：燐谷奏汰の低く落ち着いた声で、雨音の中の独白を作って"></textarea>
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
        <div class="meta">経過 ${escapeHtml(elapsedText)}。Irodori-TTSは数分かかることがあります。完了後にキャラ情報と参照素材へ保存します。</div>
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
            <div class="meta">${escapeHtml(rateJpyDisplay)} / ${escapeHtml(videoPricingSourceLabel(currentRate.source))}</div>
          </div>
        </div>
        <div class="meta cost-note">${escapeHtml(unknownText)}</div>
      </div>`}
    </section>
  `;
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
  const modelStatusText = isOpenRouterSeedanceBaseUrl()
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
  const currentRate = currentVideoRateSummary(currentModelId, resolutionValue, ratioValue);
  const jobs = (state.db.videoJobs || [])
    .filter((job) => !state.videoWorkId || job.workId === state.videoWorkId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 12);
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
              <textarea id="video-chat-input" placeholder="例：雛森陽澄が雨の路地で振り返る、8秒、縦型、静かな不穏さ"></textarea>
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
  return `
    <div class="seedance-animation">
      <div class="film-loader"><span></span><span></span><span></span><span></span></div>
      <div>
        <strong>Seedance生成中</strong>
        <div class="meta">完了後に自動保存します。</div>
      </div>
    </div>
  `;
}

function renderVideoJob(job) {
  const work = byId(state.db.works, job.workId);
  const cost = videoJobCostSummary(job);
  const providerError = job.error || readableError(job.providerPayload?.error) || readableError(job.providerPayload?.providerPayload?.error);
  const status = !job.providerTaskId && providerError ? "failed" : job.status;
  const costText = cost.usd !== null
    ? `${cost.source === "actual" ? "実コスト" : "概算"} ${formatUsd(cost.usd)}`
    : "";
  return `
    <article class="video-job ${status}">
      <div>
        <div class="char-name">${escapeHtml(job.title || "Seedance video")}</div>
        <div class="meta">${escapeHtml(work?.name || "全作品")} / ${escapeHtml(status || "unknown")} / ${job.updatedAt ? escapeHtml(new Date(job.updatedAt).toLocaleString("ja-JP")) : ""}${costText ? ` / ${escapeHtml(costText)}` : ""}</div>
      </div>
      ${job.localUrl ? `<video class="generated-video" controls src="${escapeHtml(job.localUrl)}"></video>` : ""}
      <div class="result-text">${escapeHtml(compactPromptText(job.prompt, 900))}</div>
      <div class="card-actions">
        <button class="ghost" data-action="refresh-video-job" data-id="${job.id}" ${!job.providerTaskId || ["succeeded", "failed", "expired", "cancelled"].includes(status) ? "disabled" : ""}>更新</button>
        <button class="ghost" data-action="copy-video-job-prompt" data-id="${job.id}">プロンプト</button>
      </div>
      ${job.localPath ? `<div class="meta">保存先: ${escapeHtml(job.localPath)}</div>` : ""}
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
	  const videoStatusText = isOpenRouterSeedanceBaseUrl()
    ? state.openRouterVideoModelStatus === "loaded"
      ? "OpenRouter動画モデルの対応設定を読み込みました。"
      : state.openRouterVideoModelStatus === "loading"
        ? "OpenRouter動画モデルの対応設定を読み込み中です。"
        : state.openRouterVideoModelError || "OpenRouter動画モデルはフォールバック設定で表示しています。"
	    : "公式API向けの既定設定です。";
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
        ${renderModelSelect("setting-video-agent-model", "動画エージェントモデル", state.db.settings.videoAgentModel || state.db.settings.textModel || "", "image")}
        ${renderModelSelect("setting-audio-agent-model", "音声エージェントモデル", state.db.settings.audioAgentModel || state.db.settings.textModel || "", "text")}
        <label class="full">音声生成モデル
          <input value="${escapeHtml(openRouterTtsModel)}" readonly>
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
    <section class="panel settings-panel">
      <div class="panel-header"><h2>Seedance</h2></div>
      <div class="panel-body form-grid">
        <label class="full">API キー
          <input id="setting-seedance-api-key" type="password" placeholder="BytePlus / OpenRouter API key" value="${escapeHtml(seedanceApiKey())}">
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
        <div class="full meta">${escapeHtml(videoStatusText)}</div>
        <div class="full meta">生成動画は完了後に data/videos に保存されます。OpenRouterを選んだ場合は、上のOpenRouter APIキー欄のキーを優先して使います。</div>
      </div>
    </section>
  `;
}

function bindCommon() {
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
}

function bindView() {
  if (state.view === "studio") bindStudio();
  if (state.view === "import") bindImport();
  if (state.view === "gallery") bindGallery();
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
  document.querySelector("[data-action='run-import']")?.addEventListener("click", runImport);
}

async function loadImportFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith("image/"));
  state.importFiles = await Promise.all(images.map(async (file) => {
    const preview = await fileToDataUrl(file);
    return {
      name: file.name,
      file,
      preview,
      imageInfo: await getImageInfo(preview)
    };
  }));
  render();
}

async function runImport() {
  const workId = document.querySelector("#import-work")?.value || "";
  const selectedCharacterId = document.querySelector("#import-character")?.value || "";
  const selectedWorldItemId = document.querySelector("#import-world-item")?.value || "";
  const targetCharacter = byId(state.db.characters, selectedCharacterId);
  const targetWorldItem = workWorldItemById(selectedWorldItemId);
  const targetWorkId = targetCharacter?.workId || targetWorldItem?.workId || workId || null;
  const targetWork = byId(state.db.works, targetWorkId);
  const created = [];
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
        status: targetCharacter || targetWorldItem ? "matched" : "unassigned",
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
      state.db.assets.unshift(asset);
      created.push({ asset, dataUrl: item.preview });
    }
    await saveDb();
    toast(`${created.length} 件を取り込みました。`);
    if (targetCharacter) {
      toast(`${created.length} 件を ${targetCharacter.name} に取り込みました。`);
    } else if (targetWorldItem) {
      toast(`${created.length} 件を ${worldItemCategoryLabel(targetWorldItem.category)}: ${targetWorldItem.name} に取り込みました。`);
    } else if (state.importAutoClassify && created.length) {
      for (const item of created) {
        await classifyAsset(item.asset, item.dataUrl, state.importPromptFormat);
        await relocateAsset(item.asset);
      }
      await saveDb();
      toast("AI判別が完了しました。");
    }
    state.importFiles = [];
    state.view = "library";
    render();
  } catch (error) {
    toast(error.message);
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
      await classifyAsset(asset);
      await relocateAsset(asset);
      await saveDb();
      render();
    });
  });
  document.querySelector("[data-action='classify-visible']")?.addEventListener("click", async () => {
    const visible = getVisibleLibraryPageAssets().filter((asset) => !asset.worldItemId);
    for (const asset of visible) {
      await classifyAsset(asset);
      await relocateAsset(asset);
    }
    await saveDb();
    toast(visible.length ? "表示中の画像を判別しました。" : "キャラ判別対象の画像がありません。");
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
    render();
  });
  document.querySelector("#gallery-character")?.addEventListener("change", (event) => {
    state.galleryCharacterId = event.target.value;
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
      elevenLabs: controls.elevenLabs,
      ...controls.irodori,
      actingPrompt: controls.actingPrompt,
      caption: controls.caption
    };
    state.db.settings.audioProvider = controls.provider;
    state.db.settings.audioVoice = controls.voice;
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
    state.db.settings.irodoriDefaults = controls.irodori;
  };
  [
    "#audio-voice",
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
  document.querySelector("#audio-provider")?.addEventListener("change", () => {
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
  if (isOpenRouterSeedanceBaseUrl()) loadOpenRouterVideoModels();
}

async function classifyAsset(asset, knownDataUrl = null, fallbackPromptFormat = state.importPromptFormat) {
  const candidates = charactersForWork(asset.workId);
  if (!candidates.length) {
    asset.status = "failed";
    asset.aiReason = "判別候補のキャラが登録されていません。";
    return;
  }
  const dataUrl = knownDataUrl || await imageUrlToDataUrl(asset.url);
  const candidateText = candidates.map((char) => ({
    id: char.id,
    name: char.name,
    promptFormat: promptFormatOf(char),
    basePrompt: char.basePrompt,
    memo: char.memo
  }));
  const fallbackInstruction = promptFormatInstruction(fallbackPromptFormat);
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
    if (isOpenRouterSeedanceBaseUrl(selected.value)) {
      loadOpenRouterVideoModels().then(() => updateSettingSeedanceModelOptions(selected.value, nextModel));
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
	    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    state.db.settings.worldModel = document.querySelector("#setting-world-model").value.trim();
    state.db.settings.videoAgentModel = document.querySelector("#setting-video-agent-model").value.trim();
    state.db.settings.audioAgentModel = document.querySelector("#setting-audio-agent-model").value.trim();
    state.db.settings.audioModel = openRouterTtsModel;
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
	    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    state.db.settings.worldModel = document.querySelector("#setting-world-model").value.trim();
    state.db.settings.videoAgentModel = document.querySelector("#setting-video-agent-model").value.trim();
    state.db.settings.audioAgentModel = document.querySelector("#setting-audio-agent-model").value.trim();
    state.db.settings.audioModel = openRouterTtsModel;
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
	  document.querySelector("[data-action='check-irodori']")?.addEventListener("click", checkIrodoriConnection);
  document.querySelector("[data-action='setup-irodori']")?.addEventListener("click", setupIrodori);
  document.querySelector("[data-action='reload-openrouter-models']")?.addEventListener("click", () => loadOpenRouterModels({ force: true }));
}

function openModal(title, bodyHtml, footerHtml, onBind) {
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
  modal.querySelector("[data-action='close-modal']").addEventListener("click", close);
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
  const promptSchema = createEmptyWorldSetting();
  delete promptSchema.sourceImageUrl;
  delete promptSchema.sourceImageName;
  delete promptSchema.updatedAt;
  delete promptSchema.activeSheetId;
  delete promptSchema.sheets;
  const schema = JSON.stringify(promptSchema, null, 2);
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

読解ログのテンプレート:
${WORLD_SETTING_READING_TEMPLATE}

返答形式:
説明文やMarkdownコードフェンスを付けず、必ず次のJSONオブジェクトだけを返してください。
{
  "reading_log": "テンプレートを埋めたMarkdown全文。最後に見落とし防止チェックも含める。",
  "world_setting": ${schema}
}

world_setting は上記スキーマのキーを維持し、該当情報が見えない場合は空文字・空配列ではなく、判断が必要な箇所は uncertain_points にも記録してください。characters / objects / architecture は見つかった分だけ id を CH-01, TOOL-01, BG-01 のように採番してください。`;
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
    `AI応答をJSONとして読み取れませんでした: ${parseError.message}`
  ];
  setting.regeneration_prompt = "";
  return setting;
}

async function repairWorldSettingJson(rawContent, imageName, parseError) {
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは壊れたAI応答をJSONに整形する編集者です。内容を新規創作せず、与えられた本文から読み取れる情報だけを指定JSONに移してください。説明文、Markdown、コードフェンスは出さず、JSONオブジェクトだけを返してください。"
      },
      {
        role: "user",
        content: `元の画像名: ${imageName || "unknown"}\n直前のJSON解析エラー: ${parseError.message}\n\n返答形式:\n{\n  "reading_log": "読解ログのMarkdown全文。元応答に読解ログがある場合はそれを保持。なければ元応答を整理して保存。",\n  "world_setting": ${worldSettingSchemaText()}\n}\n\n壊れた元応答:\n${String(rawContent || "").slice(0, 60000)}`
      }
    ],
    responseFormat: { type: "json_object" },
    temperature: 0,
    purpose: "world",
    maxTokens: 9000
  });
  return normalizeWorldSettingResult(parseAiJson(content));
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

function buildWorldSettingContent(work, { images = [], text = "", sourceName = "" } = {}) {
  const trimmedText = String(text || "").trim();
  const truncatedText = trimmedText.slice(0, maxWorldTextChars);
  const sourceSummary = worldImportSourceSummary(images, trimmedText);
  const blocks = [buildWorldSettingRequest(work, sourceName, sourceSummary)];
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
  try {
    return normalizeWorldSettingResult(parseAiJson(content));
  } catch (parseError) {
    try {
      const repaired = await repairWorldSettingJson(content, sourceName, parseError);
      repaired.uncertain_points.needs_confirmation.push("初回AI応答がJSONとして読めなかったため、JSON整形リトライで保存しました。");
      return repaired;
    } catch (repairError) {
      const fallback = fallbackWorldSettingFromRaw(content, sourceName, parseError);
      fallback.uncertain_points.needs_confirmation.push(`JSON整形リトライも失敗しました: ${repairError.message}`);
      return fallback;
    }
  }
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
    toast(`設定シートを追加しました。登録シート: ${work.worldSetting.sheets.length} 枚`);
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
    state.audioWorkId = state.selectedWorkId;
    state.videoWorkId = state.selectedWorkId;
    state.galleryWorkId = state.selectedWorkId;
    await normalizeStoredUploads();
    render();
    const activeJob = (state.db.videoJobs || []).find((job) => job.providerTaskId && ["submitting", "submitted", "pending", "queued", "running", "processing"].includes(job.status));
    if (activeJob) window.setTimeout(() => pollSeedanceJob(activeJob.id), 1200);
  } catch (error) {
    app.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}

boot();
