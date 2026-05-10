import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(dataDir, "uploads");
const videoDir = path.join(dataDir, "videos");
const dbPath = path.join(dataDir, "db.json");
const seedanceGuidePath = path.join(__dirname, "Seedance2.0_Prompt_Guide_v2.md");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

const emptyDb = {
  schemaVersion: 1,
  settings: {
    defaultModel: "google/gemini-2.5-flash",
    textModel: "google/gemini-2.5-flash",
    worldModel: "google/gemini-2.5-flash",
    videoAgentModel: "google/gemini-2.5-flash",
    seedanceBaseUrl: "https://ark.ap-southeast.bytepluses.com/api/v3",
    seedanceModel: "dreamina-seedance-2-0-260128",
    seedanceResolution: "720p"
  },
  works: [],
  worldItems: [],
  characters: [],
  assets: [],
  videoMedia: [],
  videoJobs: []
};

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(videoDir, { recursive: true });

async function readDb() {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return normalizeDb(JSON.parse(raw));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeDb(emptyDb);
    return structuredClone(emptyDb);
  }
}

async function writeDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, `${JSON.stringify(normalizeDb(db), null, 2)}\n`, "utf8");
}

function normalizeDb(db = {}) {
  return {
    ...emptyDb,
    ...db,
    settings: {
      ...emptyDb.settings,
      ...(db.settings || {})
    },
    schemaVersion: 1
  };
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, status, value) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(value);
}

async function readBody(req, maxBytes = 28 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readJson(req, maxBytes) {
  const body = await readBody(req, maxBytes);
  return body ? JSON.parse(body) : {};
}

function safeUploadName(originalName, ext) {
  const parsed = path.parse(path.basename(originalName || "image"));
  const base = (parsed.name || "image").replace(/[^\w.-]+/g, "_").slice(0, 80);
  return `${Date.now()}-${crypto.randomUUID()}-${base || "image"}${ext}`;
}

function extensionForMedia(kind, subtype) {
  const clean = String(subtype || "").toLowerCase();
  if (kind === "image") {
    if (clean === "jpeg" || clean === "jpg") return ".jpg";
    if (["png", "webp", "gif"].includes(clean)) return `.${clean}`;
  }
  if (kind === "video") {
    if (clean === "quicktime") return ".mov";
    if (["mp4", "webm"].includes(clean)) return `.${clean}`;
  }
  if (kind === "audio") {
    if (clean === "mpeg" || clean === "mp3") return ".mp3";
    if (clean === "mp4" || clean === "m4a" || clean === "x-m4a") return ".m4a";
    if (["wav", "ogg", "webm"].includes(clean)) return `.${clean}`;
  }
  return kind === "video" ? ".mp4" : kind === "audio" ? ".m4a" : ".png";
}

function mimeForExtension(ext) {
  return mimeTypes[String(ext || "").toLowerCase()] || "application/octet-stream";
}

function parseDataUrl(dataUrl, allowedKinds = ["image"]) {
  const match = String(dataUrl || "").match(/^data:(image|video|audio)\/([\w.+-]+);base64,(.+)$/i);
  if (!match) throw new Error(`${allowedKinds.join("/")} の data URL が必要です。`);
  const [, kind, subtype, base64] = match;
  const normalizedKind = kind.toLowerCase();
  if (!allowedKinds.includes(normalizedKind)) throw new Error(`${allowedKinds.join("/")} の data URL が必要です。`);
  return {
    kind: normalizedKind,
    subtype: subtype.toLowerCase(),
    base64,
    ext: extensionForMedia(normalizedKind, subtype)
  };
}

function safeFolderName(value, fallback) {
  const name = String(value || "").trim().replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_").replace(/\.+$/g, "").slice(0, 80);
  return name || fallback;
}

function uploadUrlFor(filePath) {
  const relative = path.relative(uploadDir, filePath);
  return `/uploads/${relative.split(path.sep).map(encodeURIComponent).join("/")}`;
}

function uploadPathFromUrl(uploadUrl) {
  const parsed = new URL(uploadUrl, "http://localhost");
  if (!parsed.pathname.startsWith("/uploads/")) throw new Error("uploads 配下の画像URLではありません。");
  const relative = path.normalize(decodeURIComponent(parsed.pathname.slice("/uploads/".length)));
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("画像パスが不正です。");
  const filePath = path.join(uploadDir, relative);
  if (!filePath.startsWith(uploadDir)) throw new Error("画像パスが不正です。");
  return filePath;
}

async function localUploadAsDataUrl(uploadUrl, maxBytes = 64 * 1024 * 1024) {
  const filePath = uploadPathFromUrl(uploadUrl);
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) throw new Error("参照素材ファイルが見つかりません。");
  if (stat.size > maxBytes) {
    throw new Error(`参照素材が大きすぎます（${Math.round(stat.size / 1024 / 1024)}MB）。APIが直接参照できるURLに置いてから指定してください。`);
  }
  const ext = path.extname(filePath).toLowerCase();
  const data = await fs.readFile(filePath);
  return `data:${mimeForExtension(ext)};base64,${data.toString("base64")}`;
}

async function uniqueFilePath(dir, fileName) {
  const parsed = path.parse(fileName);
  let candidate = path.join(dir, fileName);
  let index = 2;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${parsed.name}-${index}${parsed.ext}`);
      index += 1;
    } catch {
      return candidate;
    }
  }
}

async function moveUploadToFolders(uploadUrl, workName, characterName) {
  const source = uploadPathFromUrl(uploadUrl);
  await fs.access(source);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const characterFolder = safeFolderName(characterName, "_未割当");
  const targetDir = path.join(uploadDir, workFolder, characterFolder);
  await fs.mkdir(targetDir, { recursive: true });
  const desired = path.join(targetDir, path.basename(source));
  const target = path.resolve(source) === path.resolve(desired) ? source : await uniqueFilePath(targetDir, path.basename(source));
  if (path.resolve(source) !== path.resolve(target)) {
    await fs.rename(source, target);
  }
  return { url: uploadUrlFor(target), path: target };
}

async function pruneEmptyUploadDirs(startDir) {
  let current = path.dirname(startDir);
  while (current.startsWith(uploadDir) && current !== uploadDir) {
    try {
      await fs.rmdir(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

async function serveFile(req, res, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return false;
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "content-length": stat.size
    });
    if (req.method === "HEAD") {
      res.end();
      return true;
    }
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

function normalizePublicPath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return clean === "/" ? "/index.html" : clean;
}

async function handleUpload(req, res) {
  const { dataUrl, name, workName, characterName } = await readJson(req);
  let parsed;
  try {
    parsed = parseDataUrl(dataUrl, ["image"]);
  } catch {
    return sendJson(res, 400, { error: "画像の data URL が必要です。" });
  }
  const fileName = safeUploadName(name, parsed.ext);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const characterFolder = safeFolderName(characterName, "_未割当");
  const destinationDir = path.join(uploadDir, workFolder, characterFolder);
  await fs.mkdir(destinationDir, { recursive: true });
  const filePath = path.join(destinationDir, fileName);
  await fs.writeFile(filePath, Buffer.from(parsed.base64, "base64"));
  sendJson(res, 200, { url: uploadUrlFor(filePath), path: filePath });
}

async function handleMediaUpload(req, res) {
  const { dataUrl, name, workName } = await readJson(req, 220 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(dataUrl, ["image", "video", "audio"]);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
  const fileName = safeUploadName(name, parsed.ext);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const kindFolder = parsed.kind === "image" ? "_動画生成_画像" : parsed.kind === "video" ? "_動画生成_動画" : "_動画生成_音声";
  const destinationDir = path.join(uploadDir, workFolder, kindFolder);
  await fs.mkdir(destinationDir, { recursive: true });
  const filePath = path.join(destinationDir, fileName);
  await fs.writeFile(filePath, Buffer.from(parsed.base64, "base64"));
  sendJson(res, 200, {
    url: uploadUrlFor(filePath),
    path: filePath,
    kind: parsed.kind,
    mimeType: `${parsed.kind}/${parsed.subtype}`
  });
}

async function handleMoveUpload(req, res) {
  const { url, workName, characterName } = await readJson(req);
  if (!url) return sendJson(res, 400, { error: "画像URLが必要です。" });
  try {
    const moved = await moveUploadToFolders(url, workName, characterName);
    sendJson(res, 200, moved);
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendJson(res, 404, { error: "画像ファイルが見つかりません。", missing: true, url });
    }
    throw error;
  }
}

async function handleRevealUpload(req, res) {
  const { url } = await readJson(req);
  if (!url) return sendJson(res, 400, { error: "画像URLが必要です。" });
  const filePath = uploadPathFromUrl(url);
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendJson(res, 404, { error: "画像ファイルが見つかりません。", missing: true, path: filePath });
    }
    throw error;
  }
  if (process.platform === "darwin") {
    spawn("open", ["-R", filePath], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "win32") {
    spawn("explorer.exe", ["/select,", filePath], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [path.dirname(filePath)], { detached: true, stdio: "ignore" }).unref();
  }
  sendJson(res, 200, { ok: true, path: filePath });
}

async function handleDeleteUpload(req, res) {
  const { url } = await readJson(req);
  if (!url) return sendJson(res, 400, { error: "画像URLが必要です。" });
  const filePath = uploadPathFromUrl(url);
  try {
    await fs.unlink(filePath);
    await pruneEmptyUploadDirs(filePath);
    sendJson(res, 200, { ok: true, deleted: true, path: filePath });
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendJson(res, 200, { ok: true, deleted: false, missing: true, path: filePath });
    }
    throw error;
  }
}

async function handleOpenRouter(req, res) {
  const { apiKey, model, messages, response_format, temperature = 0.2, max_tokens = 1800 } = await readJson(req);
  if (!apiKey) return sendJson(res, 400, { error: "OpenRouter API キーが未設定です。" });
  if (!model) return sendJson(res, 400, { error: "OpenRouter model が未設定です。" });
  if (!Array.isArray(messages)) return sendJson(res, 400, { error: "messages が必要です。" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
        "http-referer": "http://localhost",
        "x-title": "Creative File Studio"
      },
      body: JSON.stringify({
        model,
        messages,
        response_format,
        temperature,
        max_tokens
      })
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    sendJson(res, response.status, payload);
  } catch (error) {
    sendJson(res, 502, { error: `OpenRouter への接続に失敗しました: ${error.message}` });
  }
}

async function handleOpenRouterModels(req, res) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      signal: AbortSignal.timeout(15000),
      headers: {
        "accept": "application/json",
        "http-referer": "http://localhost",
        "x-title": "Creative File Studio"
      }
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) return sendJson(res, response.status, payload);
    const models = Array.isArray(payload.data) ? payload.data : [];
    sendJson(res, 200, {
      data: models.map((model) => ({
        id: model.id,
        name: model.name || model.id,
        architecture: {
          input_modalities: Array.isArray(model.architecture?.input_modalities) ? model.architecture.input_modalities : [],
          output_modalities: Array.isArray(model.architecture?.output_modalities) ? model.architecture.output_modalities : []
        }
      }))
    });
  } catch (error) {
    const message = error.name === "TimeoutError" ? "OpenRouter の応答が15秒以内に返りませんでした。" : error.message;
    sendJson(res, 502, { error: `OpenRouter モデル一覧の取得に失敗しました: ${message}` });
  }
}

async function handleOpenRouterVideoModels(req, res) {
  const { apiKey } = await readJson(req).catch(() => ({}));
  try {
    const headers = {
      "accept": "application/json",
      "http-referer": "http://localhost",
      "x-title": "Creative File Studio"
    };
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    const response = await fetch("https://openrouter.ai/api/v1/videos/models", {
      signal: AbortSignal.timeout(15000),
      headers
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) return sendJson(res, response.status, payload);
    const models = Array.isArray(payload.data) ? payload.data : [];
    sendJson(res, 200, {
      data: models.map((model) => ({
        id: model.id,
        canonical_slug: model.canonical_slug || model.id,
        name: model.name || model.id,
        description: model.description || "",
        generate_audio: model.generate_audio,
        seed: model.seed ?? null,
        supported_aspect_ratios: Array.isArray(model.supported_aspect_ratios) ? model.supported_aspect_ratios : [],
        supported_durations: Array.isArray(model.supported_durations) ? model.supported_durations : [],
        supported_frame_images: Array.isArray(model.supported_frame_images) ? model.supported_frame_images : [],
        supported_resolutions: Array.isArray(model.supported_resolutions) ? model.supported_resolutions : [],
        supported_sizes: Array.isArray(model.supported_sizes) ? model.supported_sizes : [],
        allowed_passthrough_parameters: Array.isArray(model.allowed_passthrough_parameters) ? model.allowed_passthrough_parameters : [],
        pricing_skus: model.pricing_skus || {}
      }))
    });
  } catch (error) {
    const message = error.name === "TimeoutError" ? "OpenRouter の動画モデル一覧の応答が15秒以内に返りませんでした。" : error.message;
    sendJson(res, 502, { error: `OpenRouter 動画モデル一覧の取得に失敗しました: ${message}` });
  }
}

function normalizeSeedanceBaseUrl(value) {
  const raw = String(value || "https://ark.ap-southeast.bytepluses.com/api/v3").trim().replace(/\/+$/g, "");
  if (raw.includes("openrouter.ai")) {
    if (raw.endsWith("/videos")) return raw;
    if (raw.endsWith("/api/v1")) return `${raw}/videos`;
    return raw;
  }
  if (raw.endsWith("/contents/generations/tasks")) return raw;
  if (raw.endsWith("/api/v3")) return `${raw}/contents/generations/tasks`;
  return `${raw}/api/v3/contents/generations/tasks`;
}

function seedanceProviderFromBaseUrl(value) {
  return String(value || "").includes("openrouter.ai") ? "openrouter" : "official";
}

function normalizeSeedanceStatus(status) {
  if (status === "completed") return "succeeded";
  return status || "";
}

async function seedanceContentItem(reference) {
  const type = reference.kind === "video" ? "video_url" : reference.kind === "audio" ? "audio_url" : "image_url";
  const url = String(reference.url || "");
  const resolvedUrl = url.startsWith("/uploads/") ? await localUploadAsDataUrl(url) : url;
  const item = {
    type,
    role: reference.role || (reference.kind === "image" ? "reference_image" : reference.kind === "video" ? "reference_video" : "reference_audio")
  };
  item[type] = { url: resolvedUrl };
  return item;
}

async function buildOpenRouterReference(reference) {
  if (reference.kind !== "image") {
    throw new Error("OpenRouterの動画生成APIでは、この画面からは画像参照のみ送信できます。動画・音声参照を使う場合は公式APIを選択してください。");
  }
  const url = String(reference.url || "");
  const resolvedUrl = url.startsWith("/uploads/") ? await localUploadAsDataUrl(url) : url;
  return {
    type: "image_url",
    image_url: { url: resolvedUrl }
  };
}

async function buildOpenRouterVideoPayload(options) {
  const {
    model,
    prompt,
    ratio,
    duration,
    resolution,
    generateAudio,
    seed,
    references = []
  } = options;
  const payload = {
    model,
    prompt,
    duration: Number(duration),
    resolution,
    aspect_ratio: ratio,
    generate_audio: Boolean(generateAudio)
  };
  if (Number(seed) >= 0) payload.seed = Number(seed);

  const frameImages = [];
  const inputReferences = [];
  for (const reference of references) {
    const item = await buildOpenRouterReference(reference);
    if (reference.role === "first_frame" || reference.role === "last_frame") {
      frameImages.push({ ...item, frame_type: reference.role });
    } else {
      inputReferences.push(item);
    }
  }
  if (frameImages.length) payload.frame_images = frameImages;
  if (inputReferences.length && !frameImages.length) payload.input_references = inputReferences;
  return payload;
}

function scrubRequestMediaUrl(item) {
  const next = { ...item };
  if (next.image_url?.url?.startsWith("data:")) next.image_url = { url: "[local data url]" };
  if (next.video_url?.url?.startsWith("data:")) next.video_url = { url: "[local data url]" };
  if (next.audio_url?.url?.startsWith("data:")) next.audio_url = { url: "[local data url]" };
  return next;
}

function extractTaskId(payload) {
  return payload?.id || payload?.task_id || payload?.taskId || payload?.data?.id || payload?.data?.task_id || "";
}

function extractVideoUrl(payload) {
  const candidates = [
    payload?.unsigned_urls?.[0],
    payload?.content?.video_url,
    payload?.content?.videoUrl,
    payload?.content?.url,
    payload?.video_url,
    payload?.videoUrl,
    payload?.url,
    payload?.data?.unsigned_urls?.[0],
    payload?.data?.content?.video_url,
    payload?.data?.video_url
  ];
  const fromArray = Array.isArray(payload?.content)
    ? payload.content.find((item) => item?.type === "video_url" || item?.video_url)?.video_url?.url
    : "";
  return candidates.find(Boolean) || fromArray || "";
}

function extensionFromVideoResponse(contentType, videoUrl) {
  const extFromUrl = path.extname(new URL(videoUrl, "http://localhost").pathname).toLowerCase();
  if ([".mp4", ".mov", ".webm"].includes(extFromUrl)) return extFromUrl;
  if (String(contentType || "").includes("quicktime")) return ".mov";
  if (String(contentType || "").includes("webm")) return ".webm";
  return ".mp4";
}

function normalizeVideoDownloadUrl(videoUrl, baseUrl) {
  const raw = String(videoUrl || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).href;
  } catch {
    const origin = new URL(normalizeSeedanceBaseUrl(baseUrl)).origin;
    return new URL(raw, origin).href;
  }
}

function shouldAuthorizeVideoDownload(videoUrl, baseUrl = "") {
  try {
    const parsed = new URL(videoUrl);
    if (parsed.hostname.endsWith("openrouter.ai") && parsed.pathname.startsWith("/api/")) return true;
    if (baseUrl) {
      const base = new URL(normalizeSeedanceBaseUrl(baseUrl));
      return parsed.origin === base.origin && (parsed.pathname.startsWith(base.pathname) || parsed.pathname.startsWith("/api/"));
    }
    return false;
  } catch {
    return false;
  }
}

function openRouterContentDownloadUrl(baseUrl, taskId) {
  return `${normalizeSeedanceBaseUrl(baseUrl)}/${encodeURIComponent(taskId)}/content?index=0`;
}

function videoDownloadHeaders(apiKey) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Accept": "video/*,*/*",
    "HTTP-Referer": "http://localhost",
    "X-Title": "Creative File Studio"
  };
}

async function fetchGeneratedVideo(videoUrl, apiKey, useAuth) {
  return await fetch(videoUrl, {
    headers: useAuth && apiKey ? videoDownloadHeaders(apiKey) : {},
    signal: AbortSignal.timeout(120000)
  });
}

async function downloadGeneratedVideo(videoUrl, apiKey, baseUrl = "") {
  const preferAuth = shouldAuthorizeVideoDownload(videoUrl, baseUrl);
  const attempts = preferAuth ? [true, false] : [false, true];
  const errors = [];
  for (const useAuth of attempts) {
    if (useAuth && !apiKey) continue;
    const response = await fetchGeneratedVideo(videoUrl, apiKey, useAuth);
    if (response.ok) return response;
    const detail = await response.text().catch(() => "");
    const suffix = detail ? ` ${detail.slice(0, 220)}` : "";
    errors.push(`生成動画のダウンロードに失敗しました: ${response.status} (${useAuth ? "auth" : "no-auth"})${suffix}`);
    if (![401, 403].includes(response.status)) break;
  }
  throw new Error(errors.join(" / ") || "生成動画のダウンロードに失敗しました。");
}

async function saveGeneratedVideo(videoUrls, taskId, { apiKey = "", baseUrl = "" } = {}) {
  const candidates = [...new Set([videoUrls].flat().map((url) => normalizeVideoDownloadUrl(url, baseUrl)).filter(Boolean))];
  if (!candidates.length) return null;
  const safeId = String(taskId || crypto.randomUUID()).replace(/[^\w.-]+/g, "_").slice(0, 90);
  const existing = (await fs.readdir(videoDir).catch(() => [])).find((name) => name.startsWith(`${safeId}.`));
  if (existing) {
    const filePath = path.join(videoDir, existing);
    return { url: `/videos/${encodeURIComponent(existing)}`, path: filePath };
  }
  const errors = [];
  for (const videoUrl of candidates) {
    try {
      const response = await downloadGeneratedVideo(videoUrl, apiKey, baseUrl);
      const ext = extensionFromVideoResponse(response.headers.get("content-type"), videoUrl);
      const fileName = `${safeId}${ext}`;
      const filePath = path.join(videoDir, fileName);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
      return { url: `/videos/${encodeURIComponent(fileName)}`, path: filePath };
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (errors.length > 1) {
    throw new Error(`生成動画のダウンロードに失敗しました。${errors.length}件の取得候補を試しました: ${errors.join(" / ").slice(0, 520)}`);
  }
  throw new Error(errors[0] || "生成動画のダウンロードに失敗しました。");
}

async function handleSeedanceGuide(req, res) {
  try {
    const text = await fs.readFile(seedanceGuidePath, "utf8");
    sendJson(res, 200, { text });
  } catch (error) {
    sendJson(res, 404, { error: `Seedanceガイドを読み込めませんでした: ${error.message}` });
  }
}

async function handleSeedanceCreate(req, res) {
  const body = await readJson(req, 90 * 1024 * 1024);
  const {
    apiKey,
    baseUrl,
    model,
    prompt,
    ratio = "16:9",
    duration = 5,
    resolution = "720p",
    generateAudio = true,
    watermark = false,
    cameraFixed = false,
    seed = -1,
    returnLastFrame = false,
    references = []
  } = body;
  if (!apiKey) return sendJson(res, 400, { error: "Seedance API キーが未設定です。" });
  if (!model) return sendJson(res, 400, { error: "Seedance model が未設定です。" });
  if (!prompt && !references.length) return sendJson(res, 400, { error: "プロンプトまたは参照素材が必要です。" });

  try {
    const provider = seedanceProviderFromBaseUrl(baseUrl);
    let requestPayload;
    if (provider === "openrouter") {
      requestPayload = await buildOpenRouterVideoPayload({
        model,
        prompt,
        ratio,
        duration,
        resolution,
        generateAudio,
        seed,
        references
      });
    } else {
      const content = [];
      if (prompt) content.push({ type: "text", text: prompt });
      for (const reference of references) {
        content.push(await seedanceContentItem(reference));
      }
      requestPayload = {
        model,
        content,
        ratio,
        duration: Number(duration),
        resolution,
        generate_audio: Boolean(generateAudio),
        watermark: Boolean(watermark),
        camera_fixed: Boolean(cameraFixed)
      };
      if (Number(seed) >= 0) requestPayload.seed = Number(seed);
      if (returnLastFrame) requestPayload.return_last_frame = true;
    }

    const response = await fetch(normalizeSeedanceBaseUrl(baseUrl), {
      method: "POST",
      headers: {
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) return sendJson(res, response.status, payload);
    sendJson(res, 200, {
      ...payload,
      id: extractTaskId(payload),
      status: normalizeSeedanceStatus(payload.status || payload?.data?.status),
      request: {
        ...requestPayload,
        content: requestPayload.content?.map((item) => scrubRequestMediaUrl(item)),
        frame_images: requestPayload.frame_images?.map((item) => scrubRequestMediaUrl(item)),
        input_references: requestPayload.input_references?.map((item) => scrubRequestMediaUrl(item))
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `Seedance への接続に失敗しました: ${error.message}` });
  }
}

async function handleSeedanceStatus(req, res) {
  const { apiKey, baseUrl, taskId } = await readJson(req);
  if (!apiKey) return sendJson(res, 400, { error: "Seedance API キーが未設定です。" });
  if (!taskId) return sendJson(res, 400, { error: "taskId が必要です。" });
  try {
    const provider = seedanceProviderFromBaseUrl(baseUrl);
    const endpoint = `${normalizeSeedanceBaseUrl(baseUrl)}/${encodeURIComponent(taskId)}`;
    const response = await fetch(endpoint, {
      headers: { "authorization": `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(30000)
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    if (!response.ok) return sendJson(res, response.status, payload);
    const status = normalizeSeedanceStatus(payload.status || payload?.data?.status);
    const videoUrl = extractVideoUrl(payload);
    const fallbackVideoUrl = provider === "openrouter" ? openRouterContentDownloadUrl(baseUrl, taskId) : "";
    let saved = null;
    if (status === "succeeded") {
      const downloadUrls = [videoUrl, fallbackVideoUrl].filter(Boolean);
      saved = await saveGeneratedVideo(downloadUrls, taskId, { apiKey, baseUrl });
    }
    sendJson(res, 200, {
      ...payload,
      status,
      videoUrl: videoUrl || fallbackVideoUrl,
      localUrl: saved?.url || "",
      localPath: saved?.path || ""
    });
  } catch (error) {
    sendJson(res, 502, { error: `Seedance タスク確認に失敗しました: ${error.message}` });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/db") {
      return sendJson(res, 200, await readDb());
    }

    if (req.method === "PUT" && url.pathname === "/api/db") {
      const db = await readJson(req);
      await writeDb({ ...emptyDb, ...db, schemaVersion: 1 });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/upload") {
      return await handleUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/media-upload") {
      return await handleMediaUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/move-upload") {
      return await handleMoveUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/reveal-upload") {
      return await handleRevealUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/delete-upload") {
      return await handleDeleteUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/openrouter/chat") {
      return await handleOpenRouter(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/openrouter/models") {
      return await handleOpenRouterModels(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/openrouter/video-models") {
      return await handleOpenRouterVideoModels(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/seedance/guide") {
      return await handleSeedanceGuide(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/seedance/create") {
      return await handleSeedanceCreate(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/seedance/status") {
      return await handleSeedanceStatus(req, res);
    }

    if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/uploads/")) {
      const relative = path.normalize(decodeURIComponent(url.pathname.slice("/uploads/".length)));
      if (relative.startsWith("..") || path.isAbsolute(relative)) return sendText(res, 403, "Forbidden");
      const filePath = path.join(uploadDir, relative);
      if (!filePath.startsWith(uploadDir)) return sendText(res, 403, "Forbidden");
      const served = await serveFile(req, res, filePath);
      if (!served) return sendText(res, 404, "Not found");
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/videos/")) {
      const relative = path.normalize(decodeURIComponent(url.pathname.slice("/videos/".length)));
      if (relative.startsWith("..") || path.isAbsolute(relative)) return sendText(res, 403, "Forbidden");
      const filePath = path.join(videoDir, relative);
      if (!filePath.startsWith(videoDir)) return sendText(res, 403, "Forbidden");
      const served = await serveFile(req, res, filePath);
      if (!served) return sendText(res, 404, "Not found");
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      const safePath = normalizePublicPath(url.pathname);
      const filePath = path.join(publicDir, safePath);
      if (!filePath.startsWith(publicDir)) return sendText(res, 403, "Forbidden");
      const served = await serveFile(req, res, filePath);
      if (!served) return sendText(res, 404, "Not found");
      return;
    }

    sendText(res, 405, "Method not allowed");
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Creative File Studio: http://localhost:${port}`);
});
