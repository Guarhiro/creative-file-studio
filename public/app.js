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
  libraryStatus: "all",
  libraryCharacterId: "all",
  librarySort: "newest",
  worldSheetFile: null,
  promptUseMemo: true,
  generatedPrompts: [],
  openRouterModels: [],
  openRouterModelStatus: "idle",
  openRouterModelError: ""
};

const navItems = [
  ["studio", "作品とキャラ"],
  ["import", "画像取込"],
  ["gallery", "画像一覧"],
  ["library", "画像整理"],
  ["prompt", "Prompt Lab"],
  ["settings", "設定"]
];

const workColors = ["#d85f43", "#1f8a84", "#677a2f", "#b78017", "#7b5ea7", "#bd4d72", "#4a7fbd"];

const fallbackOpenRouterModels = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] } },
  { id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", architecture: { input_modalities: ["text", "image"], output_modalities: ["text"] } }
];

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
const assetsForWork = (workId) => state.db.assets.filter((asset) => !workId || asset.workId === workId);
const apiKey = () => localStorage.getItem("openrouter_api_key") || "";

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

function normalizeSettings() {
  state.db.settings = {
    defaultModel: "google/gemini-2.5-flash",
    textModel: "google/gemini-2.5-flash",
    worldModel: state.db.settings?.defaultModel || "google/gemini-2.5-flash",
    ...(state.db.settings || {})
  };
  if (!state.db.settings.worldModel) state.db.settings.worldModel = state.db.settings.defaultModel || state.db.settings.textModel;
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

async function loadOpenRouterModels({ force = false } = {}) {
  if (!force && (state.openRouterModelStatus === "loaded" || state.openRouterModelStatus === "loading")) return;
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

async function postJson(url, body, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || JSON.stringify(payload));
  return payload;
}

async function saveDb() {
  await postJson("/api/db", state.db, "PUT");
}

async function relocateAsset(asset) {
  const char = characterForAsset(asset);
  if (char) asset.workId = char.workId;
  const work = workForAsset(asset) || byId(state.db.works, char?.workId);
  const moved = await postJson("/api/move-upload", {
    url: asset.url,
    workName: work?.name,
    characterName: char?.name
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
  node.textContent = message;
  document.body.append(node);
  window.setTimeout(() => node.remove(), 3200);
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
          ${state.db.works.length} 作品 / ${state.db.characters.length} キャラ / ${state.db.assets.length} 画像
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
  if (state.view === "library") return ["画像整理", "取り込んだ画像を作品・キャラ・状態で確認します。"];
  if (state.view === "prompt") return ["Prompt Lab", "差分やシーン案から生成プロンプトをまとめて作ります。"];
  return ["設定", "OpenRouter の接続情報とモデルを設定します。"];
}

function renderView() {
  if (state.view === "studio") return renderStudio();
  if (state.view === "import") return renderImport();
  if (state.view === "gallery") return renderGallery();
  if (state.view === "library") return renderLibrary();
  if (state.view === "prompt") return renderPromptLab();
  return renderSettings();
}

function renderStudio() {
  const work = byId(state.db.works, state.selectedWorkId) || state.db.works[0] || null;
  if (!state.selectedWorkId && work) state.selectedWorkId = work.id;
  const chars = work ? charactersForWork(work.id) : [];
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
            <div class="meta">${work ? `${chars.length} キャラ / ${assetsForWork(work.id).length} 画像` : "作品を選択してください。"}</div>
          </div>
          <div class="group">
            ${work ? `<button class="ghost" data-action="edit-work" data-id="${work.id}">作品編集</button><button data-action="new-character">キャラ追加</button>` : ""}
          </div>
        </div>
        ${work ? renderWorldInfo(work) : ""}
        ${chars.length ? `<div class="grid">${chars.map(renderCharacterCard).join("")}</div>` : `<div class="empty">この作品にはまだキャラがありません。</div>`}
      </section>
    </div>
  `;
}

function renderWorldInfo(work) {
  const setting = normalizeWorldSetting(work.worldSetting);
  const sheets = setting.sheets;
  const hasSetting = Boolean(work.worldSetting && (setting.title || setting.reading_log || setting.regeneration_prompt || setting.sourceImageUrl || sheets.length));
  const selectedFile = state.worldSheetFile;
  return `
    <section class="panel world-panel">
      <div class="panel-header">
        <div>
          <h2>作品情報 / 世界観設定</h2>
          <div class="meta">世界観設定シートを複数枚保存できます。後から追加したシートも履歴として残ります。</div>
        </div>
        <div class="group">
          <button class="ghost" data-action="edit-world-setting" data-id="${work.id}">${hasSetting ? "作品情報変更" : "手動入力"}</button>
          <button class="ghost" data-action="choose-world-sheet">シート選択</button>
          <button data-action="analyze-world-sheet" data-id="${work.id}" ${selectedFile ? "" : "disabled"}>${sheets.length ? "追加読解" : "APIで読解"}</button>
        </div>
      </div>
      <div class="panel-body">
        <input id="world-sheet-input" class="is-hidden" type="file" accept="image/*">
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
            ${setting.sourceImageUrl ? `<img class="world-source" src="${escapeHtml(setting.sourceImageUrl)}" alt="">` : `<div class="empty compact">設定シート未登録</div>`}
            <div class="meta">${selectedFile ? `選択中: ${escapeHtml(selectedFile.name)}` : setting.sourceImageName ? `表示中: ${escapeHtml(setting.sourceImageName)}` : "画像を選択してAPI読解できます。"}</div>
            <div class="meta">登録シート: ${sheets.length} 枚</div>
            <div class="meta">${setting.updatedAt ? `最終更新: ${new Date(setting.updatedAt).toLocaleString("ja-JP")}` : ""}</div>
          </div>
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
        ` : `<div class="empty compact">まだ世界観設定がありません。シート画像を選択して「APIで読解」を押すか、手動入力してください。</div>`}
      </div>
    </section>
  `;
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
  const count = charactersForWork(work.id).length;
  return `
    <div class="work-row ${state.selectedWorkId === work.id ? "active" : ""}" data-action="select-work" data-id="${work.id}">
      <span class="swatch" style="background:${escapeHtml(work.color)}"></span>
      <div>
        <div class="work-title">${escapeHtml(work.name)}</div>
        <div class="meta">${count} キャラ / ${assetsForWork(work.id).length} 画像</div>
      </div>
      <button class="ghost" data-action="edit-work" data-id="${work.id}">編集</button>
    </div>
  `;
}

function renderCharacterCard(char) {
  const work = byId(state.db.works, char.workId);
  const assetCount = state.db.assets.filter((asset) => asset.characterId === char.id).length;
  return `
    <article class="character-card">
      ${char.portraitUrl ? `<img class="portrait" src="${escapeHtml(char.portraitUrl)}" alt="">` : `<div class="portrait empty">立ち絵なし</div>`}
      <div class="body">
        <div>
          <div class="char-name">${escapeHtml(char.name)}</div>
          <div class="meta">${escapeHtml(work?.name || "未所属")} / ${assetCount} 画像</div>
        </div>
        <div class="tag-row">
          <span class="tag">${promptFormatLabel(promptFormatOf(char))}</span>
          ${char.basePrompt ? `<span class="tag">base prompt</span>` : ""}
          ${char.negativePrompt ? `<span class="tag">negative</span>` : ""}
        </div>
        <div class="card-actions">
          <button class="ghost" data-action="show-character-images" data-id="${char.id}">画像一覧</button>
          <button class="ghost" data-action="edit-character" data-id="${char.id}">編集</button>
        </div>
      </div>
    </article>
  `;
}

function renderImport() {
  const importWorkId = state.selectedWorkId || "";
  const importCharacters = charactersForWork(importWorkId);
  const selectedImportCharacter = byId(state.db.characters, state.importCharacterId);
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
          <div class="full meta">${selectedImportCharacter ? `手動指定中: ${escapeHtml(selectedImportCharacter.name)} に直接保存します。` : "作品を指定した場合、その作品に登録されたキャラだけを候補にします。"}</div>
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
  const assets = getVisibleLibraryAssets();
  const libraryCharacters = charactersForWork(state.selectedWorkId);
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
          <option value="all" ${state.libraryCharacterId === "all" ? "selected" : ""}>全キャラ</option>
          <option value="unassigned" ${state.libraryCharacterId === "unassigned" ? "selected" : ""}>未割当</option>
          ${libraryCharacters.map((char) => `<option value="${char.id}" ${state.libraryCharacterId === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`).join("")}
        </select>
        <select id="library-sort">
          <option value="newest" ${state.librarySort === "newest" ? "selected" : ""}>新しい順</option>
          <option value="character" ${state.librarySort === "character" ? "selected" : ""}>キャラ順</option>
        </select>
      </div>
      <div class="group">
        <button data-action="classify-visible" ${assets.length ? "" : "disabled"}>表示中をAI判別</button>
        <button class="ghost danger-outline" data-action="delete-visible-history" ${assets.length ? "" : "disabled"}>表示中の履歴削除</button>
      </div>
    </div>
    ${assets.length ? `<div class="grid">${assets.map(renderAssetCard).join("")}</div>` : `<div class="empty">条件に合う画像がありません。</div>`}
  `;
}

function getVisibleLibraryAssets() {
  return state.db.assets
    .filter((asset) => !state.selectedWorkId || asset.workId === state.selectedWorkId)
    .filter((asset) => state.libraryStatus === "all" || asset.status === state.libraryStatus)
    .filter((asset) => state.libraryCharacterId === "all" || (state.libraryCharacterId === "unassigned" ? !asset.characterId : asset.characterId === state.libraryCharacterId))
    .sort(sortLibraryAssets);
}

function sortLibraryAssets(a, b) {
  if (state.librarySort === "character") {
    const charA = characterForAsset(a)?.name || "未割当";
    const charB = characterForAsset(b)?.name || "未割当";
    return charA.localeCompare(charB, "ja") || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  }
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

function renderAssetCard(asset) {
  const char = byId(state.db.characters, asset.characterId);
  const workChars = charactersForWork(asset.workId);
  const statusLabel = asset.status === "matched" ? "判別済み" : asset.status === "failed" ? "判別失敗" : "未設定";
  const dimensions = assetDimensionLabel(asset);
  return `
    <article class="asset-card">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="">
      <div class="body">
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(char?.name || "未割当")} ${asset.confidence ? `/ confidence ${Math.round(asset.confidence * 100)}%` : ""}</div>
          ${dimensions ? `<div class="meta">${escapeHtml(dimensions)}</div>` : ""}
        </div>
        <div class="tag-row"><span class="tag status-${asset.status}">${statusLabel}</span></div>
        <select data-action="assign-asset" data-id="${asset.id}">
          <option value="">未割当</option>
          ${workChars.map((candidate) => `<option value="${candidate.id}" ${candidate.id === asset.characterId ? "selected" : ""}>${escapeHtml(candidate.name)}</option>`).join("")}
        </select>
        <button class="ghost" data-action="classify-one" data-id="${asset.id}">AI再判定</button>
        <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
        <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
        <button class="ghost danger-outline" data-action="delete-asset-history" data-id="${asset.id}">履歴削除</button>
      </div>
    </article>
  `;
}

function renderGallery() {
  const galleryWorkId = state.galleryWorkId ?? state.selectedWorkId ?? "";
  const chars = charactersForWork(galleryWorkId);
  const assets = state.db.assets
    .filter((asset) => !galleryWorkId || asset.workId === galleryWorkId)
    .filter((asset) => !state.galleryCharacterId || (state.galleryCharacterId === "unassigned" ? !asset.characterId : asset.characterId === state.galleryCharacterId));
  const grouped = groupAssetsByCharacter(assets);
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
          <label class="full">キャラ
            <select id="gallery-character">
              <option value="" ${!state.galleryCharacterId ? "selected" : ""}>全キャラ</option>
              <option value="unassigned" ${state.galleryCharacterId === "unassigned" ? "selected" : ""}>未割当</option>
              ${chars.map((char) => `<option value="${char.id}" ${state.galleryCharacterId === char.id ? "selected" : ""}>${escapeHtml(char.name)}</option>`).join("")}
            </select>
          </label>
          <div class="full meta">画像は data/uploads の作品名フォルダ、キャラ名フォルダに保存されます。</div>
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

function groupAssetsByCharacter(assets) {
  const groups = new Map();
  for (const asset of assets) {
    const key = asset.characterId || "unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(asset);
  }
  return [...groups.entries()].map(([characterId, items]) => ({
    characterId,
    character: characterId === "unassigned" ? null : byId(state.db.characters, characterId),
    items
  }));
}

function renderGalleryGroup(group) {
  const title = group.character?.name || "未割当";
  return `
    <div class="gallery-group">
      <div class="gallery-group-title">
        <h3>${escapeHtml(title)}</h3>
        <span class="meta">${group.items.length} 画像</span>
      </div>
      <div class="grid">${group.items.map(renderGalleryAsset).join("")}</div>
    </div>
  `;
}

function renderGalleryAsset(asset) {
  const work = workForAsset(asset);
  const char = characterForAsset(asset);
  const dimensions = assetDimensionLabel(asset);
  return `
    <article class="asset-card">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="">
      <div class="body">
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(work?.name || "未分類")} / ${escapeHtml(char?.name || "未割当")}</div>
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
        <div class="full meta">${escapeHtml(statusText)}</div>
        <div class="full meta">キーはブラウザ内に保存されます。作品データと画像はこのアプリの data フォルダに保存されます。世界観読み込みモデルは設定シート画像の読解に使います。JSONが崩れる場合は、Gemini系やClaude Sonnet/Opus系など、長文と画像の両方に強いモデルを選ぶと安定しやすいです。</div>
        <div class="full toolbar">
          <button data-action="save-settings">設定を保存</button>
          <button class="ghost" data-action="test-openrouter">接続テスト</button>
          <button class="ghost" data-action="reload-openrouter-models">モデル一覧を再取得</button>
        </div>
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
  if (state.view === "library") bindLibrary();
  if (state.view === "prompt") bindPromptLab();
  if (state.view === "settings") bindSettings();
}

function bindStudio() {
  document.querySelectorAll("[data-action='select-work']").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.selectedWorkId = row.dataset.id;
      state.worldSheetFile = null;
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
  document.querySelectorAll("[data-action='show-character-images']").forEach((button) => {
    button.addEventListener("click", () => {
      const char = byId(state.db.characters, button.dataset.id);
      state.selectedWorkId = char.workId;
      state.galleryWorkId = char.workId;
      state.galleryCharacterId = char.id;
      state.view = "gallery";
      render();
    });
  });
  const worldSheetInput = document.querySelector("#world-sheet-input");
  document.querySelector("[data-action='choose-world-sheet']")?.addEventListener("click", () => worldSheetInput?.click());
  worldSheetInput?.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const preview = await fileToDataUrl(file);
    state.worldSheetFile = {
      name: file.name,
      preview,
      imageInfo: await getImageInfo(preview)
    };
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
    if (state.importCharacterId && !validCharacters.some((char) => char.id === state.importCharacterId)) {
      state.importCharacterId = "";
    }
    render();
  });
  document.querySelector("#import-character")?.addEventListener("change", (event) => {
    state.importCharacterId = event.target.value;
    const char = byId(state.db.characters, state.importCharacterId);
    if (char) state.selectedWorkId = char.workId;
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
  const targetCharacter = byId(state.db.characters, selectedCharacterId);
  const targetWorkId = targetCharacter?.workId || workId || null;
  const targetWork = byId(state.db.works, targetWorkId);
  const created = [];
  try {
    for (const item of state.importFiles) {
      const uploaded = await postJson("/api/upload", {
        dataUrl: item.preview,
        name: item.name,
        workName: targetWork?.name,
        characterName: targetCharacter?.name
      });
      const asset = {
        id: uid(),
        workId: targetWorkId,
        characterId: targetCharacter?.id || null,
        name: item.name,
        url: uploaded.url,
        status: targetCharacter ? "matched" : "unassigned",
        confidence: targetCharacter ? 1 : null,
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
    render();
  });
  document.querySelector("#library-status")?.addEventListener("change", (event) => {
    state.libraryStatus = event.target.value;
    render();
  });
  document.querySelector("#library-character")?.addEventListener("change", (event) => {
    state.libraryCharacterId = event.target.value;
    render();
  });
  document.querySelector("#library-sort")?.addEventListener("change", (event) => {
    state.librarySort = event.target.value;
    render();
  });
  document.querySelectorAll("[data-action='assign-asset']").forEach((select) => {
    select.addEventListener("change", async () => {
      const asset = byId(state.db.assets, select.dataset.id);
      asset.characterId = select.value || null;
      const char = byId(state.db.characters, asset.characterId);
      if (char) asset.workId = char.workId;
      asset.status = select.value ? "matched" : "unassigned";
      asset.confidence = select.value ? 1 : null;
      await relocateAsset(asset);
      await saveDb();
      render();
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
    const visible = getVisibleLibraryAssets();
    for (const asset of visible) {
      await classifyAsset(asset);
      await relocateAsset(asset);
    }
    await saveDb();
    toast("表示中の画像を判別しました。");
    render();
  });
  document.querySelector("[data-action='delete-visible-history']")?.addEventListener("click", async () => {
    const visible = getVisibleLibraryAssets();
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
  const memoContext = state.promptUseMemo ? char.memo : "";
  if (!char || !variations.length) {
    toast("キャラと差分指定を入力してください。");
    return;
  }
  try {
    const content = await callOpenRouter({
      textOnly: true,
      temperature: 0.55,
      maxTokens: 2600,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `あなたは画像生成向けプロンプトの編集者です。ベースプロンプトの人物同一性を守り、指定ごとに完成度の高い生成プロンプトを作ります。${promptFormatInstruction(promptFormatOf(char))} 説明文やMarkdownを付けず、必ずJSONオブジェクトだけを返してください。`
        },
        {
          role: "user",
          content: `キャラ名: ${char.name}\nプロンプト形式: ${promptFormatOf(char)}\nベースプロンプト: ${char.basePrompt}\nネガティブプロンプト: ${char.negativePrompt}\nメモを加味する: ${state.promptUseMemo ? "yes" : "no"}\nメモ: ${memoContext}\n補足: ${notes}\n差分指定: ${JSON.stringify(variations)}\n返答形式: {"items":[{"title":"指定名","prompt":"指定形式の生成プロンプト","negativePrompt":"指定形式のネガティブプロンプト"}]}`
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

function bindSettings() {
  loadOpenRouterModels();
  document.querySelector("[data-action='save-settings']")?.addEventListener("click", async () => {
    localStorage.setItem("openrouter_api_key", document.querySelector("#setting-api-key").value.trim());
    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    state.db.settings.worldModel = document.querySelector("#setting-world-model").value.trim();
    await saveDb();
    toast("設定を保存しました。");
  });
  document.querySelector("[data-action='test-openrouter']")?.addEventListener("click", async () => {
    localStorage.setItem("openrouter_api_key", document.querySelector("#setting-api-key").value.trim());
    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    state.db.settings.worldModel = document.querySelector("#setting-world-model").value.trim();
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
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });
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
        else state.db.works.push(payload);
        state.selectedWorkId = payload.id;
        if (editing) await relocateAssetsForWork(payload.id);
        await saveDb();
        close();
        render();
      });
      modal.querySelector("[data-action='delete-work']")?.addEventListener("click", async () => {
        state.db.works = state.db.works.filter((item) => item.id !== work.id);
        state.db.characters = state.db.characters.filter((char) => char.workId !== work.id);
        state.db.assets.forEach((asset) => {
          if (asset.workId === work.id) {
            asset.workId = null;
            asset.characterId = null;
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

function buildWorldSettingRequest(work, imageName) {
  const promptSchema = createEmptyWorldSetting();
  delete promptSchema.sourceImageUrl;
  delete promptSchema.sourceImageName;
  delete promptSchema.updatedAt;
  delete promptSchema.activeSheetId;
  delete promptSchema.sheets;
  const schema = JSON.stringify(promptSchema, null, 2);
  return `添付した「世界観設定資料＋キャラクター設定資料」シートを読み取り、テキスト資料として再利用できるように、情報を可能な限り漏れなく整理してください。

対象作品名: ${work?.name || "未設定"}
画像名: ${imageName || "unknown"}

目的:
この画像を見なくても、世界観・キャラクター・衣装・道具・建築・文化・誌面構成を後から再現、修正、発展できる状態にすること。

重要ルール:
- 見えている事実と、そこから推測した意味を必ず分けてください。
- 見えない部分、不鮮明な部分、読めない文字は無理に補完せず「不明」と書いてください。
- 衣装・道具・建築・素材・配色・記号が示す文化的意味は、根拠を添えて推定してください。
- 小さな道具、素材サンプル、文字、紋章、矢印、番号、背景カットも見落とさないでください。
- キャラクター単体ではなく、そのキャラクターが生きる世界の情報として読み取ってください。
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

async function extractWorldSettingFromSheet(dataUrl, imageName, work) {
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは世界観設定資料とキャラクター設定資料を読む創作設定編集者です。視覚的事実と推測を分け、後で作品設定として編集できる構造化データに変換します。"
      },
      {
        role: "user",
        content: [
          { type: "text", text: buildWorldSettingRequest(work, imageName) },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
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
      const repaired = await repairWorldSettingJson(content, imageName, parseError);
      repaired.uncertain_points.needs_confirmation.push("初回AI応答がJSONとして読めなかったため、JSON整形リトライで保存しました。");
      return repaired;
    } catch (repairError) {
      const fallback = fallbackWorldSettingFromRaw(content, imageName, parseError);
      fallback.uncertain_points.needs_confirmation.push(`JSON整形リトライも失敗しました: ${repairError.message}`);
      return fallback;
    }
  }
}

async function analyzeWorldSheet(work) {
  if (!state.worldSheetFile) {
    toast("先に世界観設定シート画像を選択してください。");
    return;
  }
  try {
    toast("世界観設定シートを読解しています。少し時間がかかります。");
    const selected = state.worldSheetFile;
    const uploaded = await postJson("/api/upload", {
      dataUrl: selected.preview,
      name: selected.name,
      workName: work.name,
      characterName: "_世界観設定シート"
    });
    const setting = await extractWorldSettingFromSheet(selected.preview, selected.name, work);
    setting.sourceImageUrl = uploaded.url;
    setting.sourceImageName = selected.name;
    setting.updatedAt = new Date().toISOString();
    const current = ensureWorldSetting(work);
    const sheet = createWorldSheetRecord(setting, {
      url: uploaded.url,
      name: selected.name
    });
    work.worldSetting = normalizeWorldSetting({
      ...setting,
      sourceImageUrl: sheet.sourceImageUrl,
      sourceImageName: sheet.sourceImageName,
      updatedAt: sheet.updatedAt,
      activeSheetId: sheet.id,
      sheets: [...current.sheets, sheet]
    });
    state.worldSheetFile = null;
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

function openAssetModal(asset) {
  const char = byId(state.db.characters, asset.characterId);
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
          <div class="full meta">割当: ${escapeHtml(char?.name || "未割当")}</div>
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
    state.galleryWorkId = state.selectedWorkId;
    await normalizeStoredUploads();
    render();
  } catch (error) {
    app.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}

boot();
