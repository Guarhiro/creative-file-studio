const app = document.querySelector("#app");
const modalTemplate = document.querySelector("#modal-template");

const state = {
  db: null,
  view: "studio",
  selectedWorkId: null,
  galleryWorkId: null,
  galleryCharacterId: "",
  importFiles: [],
  importAutoClassify: true,
  libraryStatus: "all",
  libraryCharacterId: "all",
  librarySort: "newest",
  generatedPrompts: []
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

async function normalizeStoredUploads() {
  let changed = false;
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

function parseAiJson(content) {
  const text = String(content || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = Math.min(
      ...["{", "["].map((mark) => {
        const index = text.indexOf(mark);
        return index === -1 ? Number.POSITIVE_INFINITY : index;
      })
    );
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (Number.isFinite(start) && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("AI応答を JSON として読み取れませんでした。");
  }
}

async function callOpenRouter({ messages, responseFormat, temperature = 0.2, maxTokens = 1800, textOnly = false }) {
  const key = apiKey();
  const model = textOnly ? state.db.settings.textModel : state.db.settings.defaultModel;
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
        ${chars.length ? `<div class="grid">${chars.map(renderCharacterCard).join("")}</div>` : `<div class="empty">この作品にはまだキャラがありません。</div>`}
      </section>
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
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>取り込み条件</h2></div>
        <div class="panel-body form-grid">
          <label class="full">作品フォルダ
            <select id="import-work">
              <option value="">指定なし（全キャラから判別）</option>
              ${state.db.works.map((work) => `<option value="${work.id}" ${state.selectedWorkId === work.id ? "selected" : ""}>${escapeHtml(work.name)}</option>`).join("")}
            </select>
          </label>
          <label class="full">AI判別
            <select id="auto-classify">
              <option value="on" ${state.importAutoClassify ? "selected" : ""}>取り込み後に自動判別</option>
              <option value="off" ${!state.importAutoClassify ? "selected" : ""}>取り込みだけ行う</option>
            </select>
          </label>
          <div class="full meta">作品を指定した場合、その作品に登録されたキャラだけを候補にします。</div>
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
        ${state.importFiles.length ? `<div class="preview-strip">${state.importFiles.map((file) => `<img src="${escapeHtml(file.preview)}" alt="${escapeHtml(file.name)}">`).join("")}</div>` : ""}
        <div class="toolbar" style="margin-top:18px;">
          <div class="meta">${state.importFiles.length} 件選択中</div>
          <button class="accent" data-action="run-import" ${state.importFiles.length ? "" : "disabled"}>取り込む</button>
        </div>
      </section>
    </div>
  `;
}

function renderLibrary() {
  const assets = state.db.assets
    .filter((asset) => !state.selectedWorkId || asset.workId === state.selectedWorkId)
    .filter((asset) => state.libraryStatus === "all" || asset.status === state.libraryStatus)
    .filter((asset) => state.libraryCharacterId === "all" || (state.libraryCharacterId === "unassigned" ? !asset.characterId : asset.characterId === state.libraryCharacterId))
    .sort(sortLibraryAssets);
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
      <button data-action="classify-visible" ${assets.length ? "" : "disabled"}>表示中をAI判別</button>
    </div>
    ${assets.length ? `<div class="grid">${assets.map(renderAssetCard).join("")}</div>` : `<div class="empty">条件に合う画像がありません。</div>`}
  `;
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
  return `
    <article class="asset-card">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="">
      <div class="body">
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(char?.name || "未割当")} ${asset.confidence ? `/ confidence ${Math.round(asset.confidence * 100)}%` : ""}</div>
        </div>
        <div class="tag-row"><span class="tag status-${asset.status}">${statusLabel}</span></div>
        <select data-action="assign-asset" data-id="${asset.id}">
          <option value="">未割当</option>
          ${workChars.map((candidate) => `<option value="${candidate.id}" ${candidate.id === asset.characterId ? "selected" : ""}>${escapeHtml(candidate.name)}</option>`).join("")}
        </select>
        <button class="ghost" data-action="classify-one" data-id="${asset.id}">AI再判定</button>
        <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
        <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
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
    <div class="layout">
      <section class="panel">
        <div class="panel-header"><h2>表示条件</h2></div>
        <div class="panel-body form-grid">
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
  return `
    <article class="asset-card">
      <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="">
      <div class="body">
        <div>
          <div class="asset-name">${escapeHtml(asset.name)}</div>
          <div class="meta">${escapeHtml(work?.name || "未分類")} / ${escapeHtml(char?.name || "未割当")}</div>
        </div>
        <div class="card-actions">
          <button class="ghost" data-action="reveal-asset" data-id="${asset.id}">Finder</button>
          <button class="ghost" data-action="view-asset" data-id="${asset.id}">詳細</button>
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
  return `
    <section class="panel">
      <div class="panel-header"><h2>OpenRouter</h2></div>
      <div class="panel-body form-grid">
        <label class="full">API キー
          <input id="setting-api-key" type="password" placeholder="sk-or-v1-..." value="${escapeHtml(apiKey())}">
        </label>
        <label>画像判別モデル
          <input id="setting-model" value="${escapeHtml(state.db.settings.defaultModel || "")}">
        </label>
        <label>テキスト生成モデル
          <input id="setting-text-model" value="${escapeHtml(state.db.settings.textModel || "")}">
        </label>
        <div class="full meta">キーはブラウザ内に保存されます。作品データと画像はこのアプリの data フォルダに保存されます。</div>
        <div class="full toolbar">
          <button data-action="save-settings">設定を保存</button>
          <button class="ghost" data-action="test-openrouter">接続テスト</button>
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
  });
  document.querySelector("#auto-classify")?.addEventListener("change", (event) => {
    state.importAutoClassify = event.target.value === "on";
  });
  document.querySelector("[data-action='run-import']")?.addEventListener("click", runImport);
}

async function loadImportFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith("image/"));
  state.importFiles = await Promise.all(images.map(async (file) => ({
    name: file.name,
    file,
    preview: await fileToDataUrl(file)
  })));
  render();
}

async function runImport() {
  const workId = document.querySelector("#import-work")?.value || "";
  const targetWorkId = workId || null;
  const created = [];
  try {
    for (const item of state.importFiles) {
      const work = byId(state.db.works, targetWorkId);
      const uploaded = await postJson("/api/upload", {
        dataUrl: item.preview,
        name: item.name,
        workName: work?.name
      });
      const asset = {
        id: uid(),
        workId: targetWorkId,
        characterId: null,
        name: item.name,
        url: uploaded.url,
        status: "unassigned",
        confidence: null,
        aiPrompt: "",
        aiReason: "",
        createdAt: new Date().toISOString()
      };
      state.db.assets.unshift(asset);
      created.push({ asset, dataUrl: item.preview });
    }
    await saveDb();
    toast(`${created.length} 件を取り込みました。`);
    if (state.importAutoClassify && created.length) {
      for (const item of created) {
        await classifyAsset(item.asset, item.dataUrl);
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
    const visible = state.db.assets
      .filter((asset) => !state.selectedWorkId || asset.workId === state.selectedWorkId)
      .filter((asset) => state.libraryStatus === "all" || asset.status === state.libraryStatus)
      .filter((asset) => state.libraryCharacterId === "all" || (state.libraryCharacterId === "unassigned" ? !asset.characterId : asset.characterId === state.libraryCharacterId))
      .sort(sortLibraryAssets);
    for (const asset of visible) {
      await classifyAsset(asset);
      await relocateAsset(asset);
    }
    await saveDb();
    toast("表示中の画像を判別しました。");
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
}

function bindGallery() {
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
}

async function classifyAsset(asset, knownDataUrl = null) {
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
    basePrompt: char.basePrompt,
    memo: char.memo
  }));
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは創作支援アプリの画像整理AIです。候補キャラから最も近い人物を選び、画像生成向けの短いプロンプトも抽出します。必ずJSONだけを返してください。"
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `候補キャラ: ${JSON.stringify(candidateText)}\n返答形式: {"characterId": "候補idまたはnull", "confidence": 0から1, "generatedPrompt": "画像の生成プロンプト", "negativePrompt": "必要なら", "reason": "短い理由"}\n0.55未満の自信なら characterId は null にしてください。`
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
  asset.aiPrompt = result.generatedPrompt || "";
  asset.aiNegativePrompt = result.negativePrompt || "";
  asset.aiReason = result.reason || "";
}

function bindPromptLab() {
  document.querySelector("#prompt-work")?.addEventListener("change", (event) => {
    state.selectedWorkId = event.target.value || null;
    render();
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
          content: "あなたは画像生成向けプロンプトの編集者です。ベースプロンプトの人物同一性を守り、指定ごとに完成度の高い生成プロンプトを作ります。必ずJSONだけを返してください。"
        },
        {
          role: "user",
          content: `キャラ名: ${char.name}\nベースプロンプト: ${char.basePrompt}\nネガティブプロンプト: ${char.negativePrompt}\nメモ: ${char.memo}\n補足: ${notes}\n差分指定: ${JSON.stringify(variations)}\n返答形式: {"items":[{"title":"指定名","prompt":"生成プロンプト","negativePrompt":"ネガティブプロンプト"}]}`
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
  document.querySelector("[data-action='save-settings']")?.addEventListener("click", async () => {
    localStorage.setItem("openrouter_api_key", document.querySelector("#setting-api-key").value.trim());
    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
    await saveDb();
    toast("設定を保存しました。");
  });
  document.querySelector("[data-action='test-openrouter']")?.addEventListener("click", async () => {
    localStorage.setItem("openrouter_api_key", document.querySelector("#setting-api-key").value.trim());
    state.db.settings.defaultModel = document.querySelector("#setting-model").value.trim();
    state.db.settings.textModel = document.querySelector("#setting-text-model").value.trim();
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
          const result = await extractPromptFromImage(source, modal.querySelector("#char-name").value.trim());
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

async function extractPromptFromImage(dataUrl, name) {
  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content: "あなたは画像生成プロンプトを抽出する編集者です。人物の外見、髪、服、雰囲気を簡潔にまとめます。必ずJSONだけを返してください。"
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `キャラ名: ${name || "unknown"}\n返答形式: {"basePrompt":"英語中心の生成プロンプト","negativePrompt":"破綻や不要要素のネガティブプロンプト","memo":"日本語の短い観察メモ"}`
          },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ],
    responseFormat: { type: "json_object" },
    maxTokens: 1100
  });
  return parseAiJson(content);
}

function openAssetModal(asset) {
  const char = byId(state.db.characters, asset.characterId);
  openModal(
    "画像詳細",
    `
      <div class="split">
        <img class="asset-thumb" src="${escapeHtml(asset.url)}" alt="">
        <div class="form-grid">
          <label class="full">名前<input value="${escapeHtml(asset.name)}" id="asset-name"></label>
          <label class="full">AI抽出プロンプト<textarea id="asset-prompt">${escapeHtml(asset.aiPrompt || "")}</textarea></label>
          <label class="full">AI理由<textarea id="asset-reason">${escapeHtml(asset.aiReason || "")}</textarea></label>
          <div class="full meta">割当: ${escapeHtml(char?.name || "未割当")}</div>
        </div>
      </div>
    `,
    `<div></div><button data-action="save-asset-detail">保存</button>`,
    (modal, close) => {
      modal.querySelector("[data-action='save-asset-detail']").addEventListener("click", async () => {
        asset.name = modal.querySelector("#asset-name").value.trim() || asset.name;
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
