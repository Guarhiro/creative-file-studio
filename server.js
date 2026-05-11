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
const audioDir = path.join(dataDir, "audios");
const dbPath = path.join(dataDir, "db.json");
const seedanceGuidePath = path.join(__dirname, "Seedance2.0_Prompt_Guide_v2.md");
const irodoriSetupScriptPath = path.join(__dirname, "scripts", "setup-irodori.sh");
const irodoriVendorDir = path.join(__dirname, "vendor", "Irodori-TTS");
const localIrodoriAppDir = "/Users/guarhiro/Documents/irodori TTSアプリ";
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
    audioAgentModel: "google/gemini-2.5-flash",
    audioProvider: "openrouter",
    audioModel: "google/gemini-3.1-flash-tts-preview",
    audioVoice: "Kore",
    audioActingPrompt: "自然な日本語で、感情と間を大切にして読み上げてください。",
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
    irodoriDefaults: {
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
    },
    seedanceBaseUrl: "https://ark.ap-southeast.bytepluses.com/api/v3",
    seedanceModel: "dreamina-seedance-2-0-260128",
    seedanceResolution: "720p"
  },
  works: [],
  worldItems: [],
  characters: [],
  assets: [],
  videoMedia: [],
  videoJobs: [],
  audioItems: []
};

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(videoDir, { recursive: true });
await fs.mkdir(audioDir, { recursive: true });

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

function readableProviderError(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(readableProviderError).filter(Boolean).join(" / ");
  if (typeof value === "object") {
    return readableProviderError(value.message)
      || readableProviderError(value.error)
      || readableProviderError(value.detail)
      || readableProviderError(value.reason)
      || readableProviderError(value.raw)
      || JSON.stringify(value);
  }
  return String(value);
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

function cleanFileNamePart(value, fallback, maxLength = 160) {
  const clean = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_")
    .replace(/\.+$/g, "")
    .slice(0, maxLength);
  return clean || fallback;
}

function safeOriginalFileName(originalName, ext, fallback = "image") {
  const parsed = path.parse(path.basename(String(originalName || fallback)));
  const base = cleanFileNamePart(parsed.name, fallback);
  const originalExt = String(parsed.ext || "").toLowerCase();
  const safeExt = originalExt && mimeTypes[originalExt] ? parsed.ext : ext;
  return `${base}${safeExt || ""}`;
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

function audioUrlFor(filePath) {
  const relative = path.relative(audioDir, filePath);
  return `/audios/${relative.split(path.sep).map(encodeURIComponent).join("/")}`;
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

function localMediaPathFromUrl(mediaUrl) {
  const parsed = new URL(mediaUrl, "http://localhost");
  const roots = [
    { prefix: "/uploads/", dir: uploadDir, label: "uploads" },
    { prefix: "/audios/", dir: audioDir, label: "audios" },
    { prefix: "/videos/", dir: videoDir, label: "videos" }
  ];
  const root = roots.find((item) => parsed.pathname.startsWith(item.prefix));
  if (!root) throw new Error("ローカルメディアURLではありません。");
  const relative = path.normalize(decodeURIComponent(parsed.pathname.slice(root.prefix.length)));
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`${root.label} パスが不正です。`);
  const filePath = path.join(root.dir, relative);
  if (!filePath.startsWith(root.dir)) throw new Error(`${root.label} パスが不正です。`);
  return filePath;
}

async function localUploadAsDataUrl(uploadUrl, maxBytes = 64 * 1024 * 1024) {
  const filePath = localMediaPathFromUrl(uploadUrl);
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) throw new Error("参照素材ファイルが見つかりません。");
  if (stat.size > maxBytes) {
    throw new Error(`参照素材が大きすぎます（${Math.round(stat.size / 1024 / 1024)}MB）。APIが直接参照できるURLに置いてから指定してください。`);
  }
  const ext = path.extname(filePath).toLowerCase();
  const data = await fs.readFile(filePath);
  return `data:${mimeForExtension(ext)};base64,${data.toString("base64")}`;
}

function expandLocalPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const home = process.env.HOME || "";
  if (raw === "~") return home;
  if (raw.startsWith("~/")) return path.join(home, raw.slice(2));
  return path.isAbsolute(raw) ? raw : path.resolve(__dirname, raw);
}

async function isFile(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function clipProcessOutput(value, maxLength = 24000) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, 4000)}\n...\n${text.slice(-maxLength + 4000)}` : text;
}

function commandLabel(commandParts) {
  return commandParts.map((part) => /\s/.test(part) ? JSON.stringify(part) : part).join(" ");
}

function runProcess(commandParts, { cwd = __dirname, timeoutMs = 120000, env = {} } = {}) {
  return new Promise((resolve) => {
    const [command, ...args] = commandParts;
    let stdout = "";
    let stderr = "";
    let settled = false;
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        PYTHONPYCACHEPREFIX: process.env.PYTHONPYCACHEPREFIX || "/private/tmp/creative-file-studio-irodori-pycache",
        ...env
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        ...payload,
        command: commandLabel(commandParts),
        stdout: clipProcessOutput(stdout),
        stderr: clipProcessOutput(stderr)
      });
    };
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish({ ok: false, code: null, timedOut: true, error: "処理がタイムアウトしました。" });
    }, timeoutMs);
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => finish({ ok: false, code: null, error: error.message }));
    child.on("close", (code) => finish({ ok: code === 0, code, error: code === 0 ? "" : `終了コード ${code}` }));
  });
}

async function findUvCommand() {
  const home = process.env.HOME || "";
  const candidates = [
    ["uv"],
    [path.join(home, "Library/Python/3.9/bin/uv")],
    [path.join(home, ".local/bin/uv")],
    ["python3", "-m", "uv"]
  ];
  for (const candidate of candidates) {
    const result = await runProcess([...candidate, "--version"], { timeoutMs: 10000 });
    if (result.ok) return { command: candidate, version: result.stdout.trim() || result.stderr.trim() };
  }
  return null;
}

async function resolveIrodoriWorkspace(configuredPath = "") {
  const candidates = [
    configuredPath,
    process.env.IRODORI_TTS_DIR,
    irodoriVendorDir,
    localIrodoriAppDir,
    path.join(localIrodoriAppDir, "upstream", "Irodori-TTS")
  ]
    .map(expandLocalPath)
    .filter(Boolean);
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const directInfer = path.join(candidate, "infer.py");
    if (await isFile(directInfer)) {
      const nestedInApp = path.basename(candidate) === "Irodori-TTS" && path.basename(path.dirname(candidate)) === "upstream";
      return {
        found: true,
        configuredPath: candidate,
        appDir: nestedInApp ? path.dirname(path.dirname(candidate)) : candidate,
        upstreamDir: candidate,
        inferPath: directInfer
      };
    }
    const nestedInfer = path.join(candidate, "upstream", "Irodori-TTS", "infer.py");
    if (await isFile(nestedInfer)) {
      return {
        found: true,
        configuredPath: candidate,
        appDir: candidate,
        upstreamDir: path.dirname(nestedInfer),
        inferPath: nestedInfer
      };
    }
  }
  return {
    found: false,
    configuredPath: expandLocalPath(configuredPath),
    candidates: [...seen],
    setupScript: irodoriSetupScriptPath,
    suggestedPath: path.relative(__dirname, irodoriVendorDir) || irodoriVendorDir
  };
}

function boundedNumber(value, fallback, min, max, integer = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const bounded = Math.min(max, Math.max(min, number));
  return integer ? Math.round(bounded) : bounded;
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
  const fileName = safeOriginalFileName(name, parsed.ext);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const characterFolder = safeFolderName(characterName, "_未割当");
  const destinationDir = path.join(uploadDir, workFolder, characterFolder);
  await fs.mkdir(destinationDir, { recursive: true });
  const filePath = await uniqueFilePath(destinationDir, fileName);
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
  const fileName = safeOriginalFileName(name, parsed.ext, parsed.kind);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const kindFolder = parsed.kind === "image" ? "_動画生成_画像" : parsed.kind === "video" ? "_動画生成_動画" : "_動画生成_音声";
  const destinationDir = path.join(uploadDir, workFolder, kindFolder);
  await fs.mkdir(destinationDir, { recursive: true });
  const filePath = await uniqueFilePath(destinationDir, fileName);
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

async function handleUsdJpyRate(req, res) {
  const sources = [
    {
      name: "open.er-api.com",
      url: "https://open.er-api.com/v6/latest/USD",
      parse: (payload) => Number(payload?.rates?.JPY)
    },
    {
      name: "frankfurter.app",
      url: "https://api.frankfurter.app/latest?from=USD&to=JPY",
      parse: (payload) => Number(payload?.rates?.JPY)
    }
  ];
  const errors = [];
  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        signal: AbortSignal.timeout(12000),
        headers: { "accept": "application/json" }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        errors.push(`${source.name}: ${response.status}`);
        continue;
      }
      const rate = source.parse(payload);
      if (Number.isFinite(rate) && rate > 0) {
        return sendJson(res, 200, {
          rate,
          source: source.name,
          fetchedAt: new Date().toISOString()
        });
      }
      errors.push(`${source.name}: JPY rate missing`);
    } catch (error) {
      errors.push(`${source.name}: ${error.message}`);
    }
  }
  sendJson(res, 502, { error: `USD/JPY レートの取得に失敗しました: ${errors.join(" / ")}` });
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
  const resolvedUrl = url.startsWith("/") ? await localUploadAsDataUrl(url) : url;
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
  const resolvedUrl = url.startsWith("/") ? await localUploadAsDataUrl(url) : url;
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

function extensionFromAudioResponse(contentType, responseFormat = "mp3") {
  const type = String(contentType || "").toLowerCase();
  if (type.includes("mpeg") || type.includes("mp3")) return ".mp3";
  if (type.includes("wav")) return ".wav";
  if (type.includes("ogg")) return ".ogg";
  if (type.includes("pcm")) return ".pcm";
  return responseFormat === "pcm" ? ".pcm" : ".mp3";
}

function extensionFromElevenLabsFormat(format = "mp3_44100_128") {
  const codec = String(format || "").split("_")[0].toLowerCase();
  if (codec === "mp3") return ".mp3";
  if (codec === "wav") return ".wav";
  if (codec === "pcm") return ".pcm";
  if (codec === "ulaw") return ".ulaw";
  return ".mp3";
}

function sampleRateFromElevenLabsFormat(format = "pcm_24000") {
  const sampleRate = Number(String(format || "").split("_")[1]);
  return Number.isFinite(sampleRate) && sampleRate >= 8000 && sampleRate <= 48000 ? sampleRate : 24000;
}

function modelRequiresPcmAudio(model) {
  const id = String(model || "").toLowerCase();
  return id.includes("gemini") && id.includes("tts");
}

function pcmToWavBuffer(pcmBuffer, { sampleRate = 24000, channels = 1, bitDepth = 16 } = {}) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

async function handleOpenRouterSpeech(req, res) {
  const {
    apiKey,
    model = "google/gemini-3.1-flash-tts-preview",
    input,
    voice = "Kore",
    responseFormat = "mp3",
    speed,
    title = "generated-audio"
  } = await readJson(req, 2 * 1024 * 1024);
  const cleanInput = String(input || "").trim();
  const cleanFormat = modelRequiresPcmAudio(model) ? "pcm" : responseFormat === "pcm" ? "pcm" : "mp3";
  if (!apiKey) return sendJson(res, 400, { error: "OpenRouter API キーが未設定です。" });
  if (!model) return sendJson(res, 400, { error: "音声生成モデルが未設定です。" });
  if (!cleanInput) return sendJson(res, 400, { error: "読み上げテキストが必要です。" });

  try {
    const requestPayload = {
      model,
      input: cleanInput,
      voice: String(voice || "Kore").trim() || "Kore",
      response_format: cleanFormat
    };
    const speedNumber = Number(speed);
    if (Number.isFinite(speedNumber) && speedNumber > 0) requestPayload.speed = speedNumber;

    const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
        "accept": cleanFormat === "pcm" ? "audio/pcm,*/*" : "audio/mpeg,*/*",
        "http-referer": "http://localhost",
        "x-title": "Creative File Studio"
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: text || `OpenRouter TTS が ${response.status} を返しました。` };
      }
      const message = readableProviderError(payload.error) || readableProviderError(payload) || `OpenRouter TTS が ${response.status} を返しました。`;
      return sendJson(res, response.status, {
        ...payload,
        error: message,
        providerError: payload.error || payload
      });
    }

    const contentType = response.headers.get("content-type") || "";
    const ext = extensionFromAudioResponse(contentType, cleanFormat);
    const saveAsWav = cleanFormat === "pcm" || ext === ".pcm";
    const fileName = safeUploadName(title, saveAsWav ? ".wav" : ext);
    const filePath = path.join(audioDir, fileName);
    if (saveAsWav) {
      const pcmBuffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, pcmToWavBuffer(pcmBuffer));
    } else {
      await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
    }
    const stat = await fs.stat(filePath);
    sendJson(res, 200, {
      url: `/audios/${encodeURIComponent(fileName)}`,
      path: filePath,
      mimeType: saveAsWav ? "audio/wav" : contentType || mimeForExtension(ext),
      format: saveAsWav ? "wav" : ext.replace(".", "") || cleanFormat,
      generationId: response.headers.get("x-generation-id") || "",
      size: stat.size,
      request: {
        ...requestPayload,
        input: cleanInput.length > 1200 ? `${cleanInput.slice(0, 1200)}...` : cleanInput
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `OpenRouter 音声生成に失敗しました: ${error.message}` });
  }
}

async function handleElevenLabsVoices(req, res) {
  const { apiKey } = await readJson(req, 256 * 1024);
  if (!apiKey) return sendJson(res, 400, { error: "ElevenLabs API キーが未設定です。" });
  try {
    const response = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", {
      headers: {
        "xi-api-key": apiKey,
        "accept": "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text || `ElevenLabs voices API が ${response.status} を返しました。` };
    }
    if (!response.ok) {
      return sendJson(res, response.status, {
        ...payload,
        error: readableProviderError(payload.error) || readableProviderError(payload) || `ElevenLabs voices API が ${response.status} を返しました。`,
        providerError: payload.error || payload
      });
    }
    const voices = Array.isArray(payload.voices) ? payload.voices.map((voice) => ({
      voiceId: voice.voice_id,
      name: voice.name || voice.voice_id,
      category: voice.category || "",
      description: voice.description || "",
      labels: voice.labels || {},
      previewUrl: voice.preview_url || "",
      settings: voice.settings || null
    })).filter((voice) => voice.voiceId) : [];
    sendJson(res, 200, { voices, raw: payload });
  } catch (error) {
    sendJson(res, 502, { error: `ElevenLabs 音声一覧の取得に失敗しました: ${error.message}` });
  }
}

async function handleElevenLabsModels(req, res) {
  const { apiKey } = await readJson(req, 256 * 1024);
  if (!apiKey) return sendJson(res, 400, { error: "ElevenLabs API キーが未設定です。" });
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: {
        "xi-api-key": apiKey,
        "accept": "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text || `ElevenLabs models API が ${response.status} を返しました。` };
    }
    if (!response.ok) {
      return sendJson(res, response.status, {
        ...payload,
        error: readableProviderError(payload.error) || readableProviderError(payload) || `ElevenLabs models API が ${response.status} を返しました。`,
        providerError: payload.error || payload
      });
    }
    const source = Array.isArray(payload) ? payload : Array.isArray(payload.models) ? payload.models : [];
    const models = source.map((model) => ({
      modelId: model.model_id || model.modelId || model.id || "",
      name: model.name || model.model_id || model.id || "",
      description: model.description || "",
      canDoTextToSpeech: model.can_do_text_to_speech !== false,
      canUseStyle: Boolean(model.can_use_style),
      canUseSpeakerBoost: Boolean(model.can_use_speaker_boost),
      languages: Array.isArray(model.languages) ? model.languages : [],
      maxCharactersFreeUser: model.max_characters_request_free_user || null,
      maxCharactersSubscribedUser: model.max_characters_request_subscribed_user || null,
      maximumTextLengthPerRequest: model.maximum_text_length_per_request || null
    })).filter((model) => model.modelId && model.canDoTextToSpeech);
    sendJson(res, 200, { models, raw: payload });
  } catch (error) {
    sendJson(res, 502, { error: `ElevenLabs モデル一覧の取得に失敗しました: ${error.message}` });
  }
}

async function handleElevenLabsSpeech(req, res) {
  const {
    apiKey,
    voiceId,
    modelId = "eleven_multilingual_v2",
    input,
    outputFormat = "mp3_44100_128",
    title = "elevenlabs-audio",
    languageCode = "",
    seed,
    voiceSettings = {}
  } = await readJson(req, 2 * 1024 * 1024);
  const cleanInput = String(input || "").trim();
  const cleanVoiceId = String(voiceId || "").trim();
  const cleanModelId = String(modelId || "eleven_multilingual_v2").trim() || "eleven_multilingual_v2";
  const cleanOutputFormat = String(outputFormat || "mp3_44100_128").trim() || "mp3_44100_128";
  if (!apiKey) return sendJson(res, 400, { error: "ElevenLabs API キーが未設定です。" });
  if (!cleanVoiceId) return sendJson(res, 400, { error: "ElevenLabs voice ID が未設定です。" });
  if (!cleanInput) return sendJson(res, 400, { error: "読み上げテキストが必要です。" });

  const stability = boundedNumber(voiceSettings.stability, 0.5, 0, 1);
  const similarityBoost = boundedNumber(voiceSettings.similarityBoost ?? voiceSettings.similarity_boost, 0.75, 0, 1);
  const style = boundedNumber(voiceSettings.style, 0, 0, 1);
  const speed = boundedNumber(voiceSettings.speed, 1, 0.7, 1.2);
  const useSpeakerBoost = Boolean(voiceSettings.useSpeakerBoost ?? voiceSettings.use_speaker_boost ?? true);
  const seedText = String(seed || "").trim();
  const requestPayload = {
    text: cleanInput,
    model_id: cleanModelId,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: useSpeakerBoost,
      speed
    }
  };
  if (languageCode) requestPayload.language_code = String(languageCode).trim();
  if (/^\d+$/.test(seedText)) requestPayload.seed = Number(seedText);

  try {
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cleanVoiceId)}?output_format=${encodeURIComponent(cleanOutputFormat)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        "accept": "audio/*,*/*"
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: text || `ElevenLabs TTS が ${response.status} を返しました。` };
      }
      return sendJson(res, response.status, {
        ...payload,
        error: readableProviderError(payload.error) || readableProviderError(payload) || `ElevenLabs TTS が ${response.status} を返しました。`,
        providerError: payload.error || payload
      });
    }

    const contentType = response.headers.get("content-type") || "";
    const savePcmAsWav = cleanOutputFormat.startsWith("pcm_");
    const ext = savePcmAsWav
      ? ".wav"
      : extensionFromAudioResponse(contentType, cleanOutputFormat.startsWith("pcm") ? "pcm" : "mp3");
    const fallbackExt = extensionFromElevenLabsFormat(cleanOutputFormat);
    const fileName = safeUploadName(title, ext === ".mp3" && fallbackExt !== ".mp3" ? fallbackExt : ext);
    const filePath = path.join(audioDir, fileName);
    if (savePcmAsWav) {
      const pcmBuffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, pcmToWavBuffer(pcmBuffer, { sampleRate: sampleRateFromElevenLabsFormat(cleanOutputFormat) }));
    } else {
      await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
    }
    const stat = await fs.stat(filePath);
    sendJson(res, 200, {
      url: `/audios/${encodeURIComponent(fileName)}`,
      path: filePath,
      mimeType: savePcmAsWav ? "audio/wav" : contentType || mimeForExtension(path.extname(fileName)),
      format: savePcmAsWav ? "wav" : path.extname(fileName).replace(".", "") || cleanOutputFormat,
      generationId: response.headers.get("request-id") || response.headers.get("history-item-id") || "",
      size: stat.size,
      request: {
        ...requestPayload,
        voice_id: cleanVoiceId,
        output_format: cleanOutputFormat,
        text: cleanInput.length > 1200 ? `${cleanInput.slice(0, 1200)}...` : cleanInput
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `ElevenLabs 音声生成に失敗しました: ${error.message}` });
  }
}

const irodoriBaseCheckpoint = "Aratako/Irodori-TTS-500M-v2";
const irodoriVoiceDesignCheckpoint = "Aratako/Irodori-TTS-500M-v2-VoiceDesign";

function irodoriPrecision(value, device) {
  return value === "bf16" && device === "cuda" ? "bf16" : "fp32";
}

function irodoriDevice(value) {
  const clean = String(value || "auto").trim().toLowerCase();
  return ["cpu", "mps", "cuda"].includes(clean) ? clean : "";
}

function savedIrodoriOutputPaths(outputPath, numCandidates) {
  if (numCandidates <= 1) return [outputPath];
  const parsed = path.parse(outputPath);
  return Array.from({ length: numCandidates }, (_, index) => path.join(parsed.dir, `${parsed.name}_${String(index + 1).padStart(3, "0")}${parsed.ext || ".wav"}`));
}

async function outputInfo(filePath) {
  const stat = await fs.stat(filePath);
  return {
    url: audioUrlFor(filePath),
    path: filePath,
    mimeType: mimeForExtension(path.extname(filePath) || ".wav"),
    size: stat.size
  };
}

async function handleIrodoriStatus(req, res) {
  const { appDir } = await readJson(req, 256 * 1024);
  const workspace = await resolveIrodoriWorkspace(appDir);
  const uv = await findUvCommand();
  return sendJson(res, 200, {
    ...workspace,
    uvFound: Boolean(uv),
    uvCommand: uv ? commandLabel(uv.command) : "",
    uvVersion: uv?.version || "",
    setupScript: irodoriSetupScriptPath,
    suggestedPath: path.relative(__dirname, irodoriVendorDir) || irodoriVendorDir
  });
}

async function handleIrodoriSetup(req, res) {
  const exists = await isFile(irodoriSetupScriptPath);
  if (!exists) return sendJson(res, 404, { error: "Irodori-TTS セットアップスクリプトが見つかりません。" });
  const result = await runProcess(["bash", irodoriSetupScriptPath], { cwd: __dirname, timeoutMs: 45 * 60 * 1000 });
  const workspace = await resolveIrodoriWorkspace(irodoriVendorDir);
  return sendJson(res, result.ok ? 200 : 500, {
    ok: result.ok,
    error: result.ok ? "" : `Irodori-TTS セットアップに失敗しました: ${result.error || result.stderr || "unknown error"}`,
    workspace,
    result
  });
}

async function handleIrodoriSpeech(req, res) {
  const body = await readJson(req, 4 * 1024 * 1024);
  const cleanInput = String(body.input || "").trim();
  const title = String(body.title || "irodori-audio").trim() || "irodori-audio";
  if (!cleanInput) return sendJson(res, 400, { error: "読み上げテキストが必要です。" });

  const workspace = await resolveIrodoriWorkspace(body.appDir);
  if (!workspace.found) {
    return sendJson(res, 400, {
      error: "Irodori-TTS が見つかりません。設定画面でパスを指定するか、Irodori-TTS をセットアップしてください。",
      workspace
    });
  }
  const uv = await findUvCommand();
  if (!uv) {
    return sendJson(res, 400, {
      error: "uv が見つかりません。Irodori-TTS の実行には uv が必要です。",
      installHint: "python3 -m pip install --user uv または https://astral.sh/uv/ の手順で uv を入れてください。"
    });
  }

  const mode = body.mode === "Reference" ? "Reference" : "VoiceDesign";
  const numSteps = boundedNumber(body.numSteps, 40, 8, 80, true);
  const numCandidates = boundedNumber(body.numCandidates, 1, 1, 4, true);
  const cfgScaleText = boundedNumber(body.cfgScaleText, 3, 0, 10);
  const cfgScaleCaption = boundedNumber(body.cfgScaleCaption, 4, 0, 10);
  const cfgScaleSpeaker = boundedNumber(body.cfgScaleSpeaker, 5, 0, 10);
  const modelDevice = irodoriDevice(body.modelDevice);
  const codecDevice = irodoriDevice(body.codecDevice);
  const modelPrecision = irodoriPrecision(body.modelPrecision, modelDevice);
  const codecPrecision = irodoriPrecision(body.codecPrecision, codecDevice);
  const caption = String(body.caption || "").trim();
  const customCheckpoint = String(body.customCheckpoint || "").trim();
  const outputName = safeUploadName(title, ".wav");
  const outputPath = path.join(audioDir, outputName);
  const args = [
    ...uv.command,
    "run",
    "python",
    "infer.py",
    "--text",
    cleanInput,
    "--output-wav",
    outputPath,
    "--model-precision",
    modelPrecision,
    "--codec-precision",
    codecPrecision,
    "--num-steps",
    String(numSteps),
    "--num-candidates",
    String(numCandidates),
    "--cfg-scale-text",
    String(cfgScaleText),
    "--cfg-scale-caption",
    String(cfgScaleCaption),
    "--cfg-scale-speaker",
    String(mode === "VoiceDesign" ? 0 : cfgScaleSpeaker),
    "--cfg-min-t",
    "0.5",
    "--cfg-max-t",
    "1.0"
  ];
  if (modelDevice) args.push("--model-device", modelDevice);
  if (codecDevice) args.push("--codec-device", codecDevice);
  if (customCheckpoint) {
    args.push("--checkpoint", customCheckpoint);
  } else {
    args.push("--hf-checkpoint", mode === "VoiceDesign" ? irodoriVoiceDesignCheckpoint : irodoriBaseCheckpoint);
  }
  if (caption) args.push("--caption", caption);
  const seed = String(body.seed || "").trim();
  if (/^-?\d+$/.test(seed)) args.push("--seed", seed);
  if (mode === "Reference" && body.referenceAudioUrl) {
    try {
      const refPath = localMediaPathFromUrl(body.referenceAudioUrl);
      await fs.access(refPath);
      args.push("--ref-wav", refPath);
    } catch (error) {
      return sendJson(res, 400, { error: `参照音声を読み込めません: ${error.message}` });
    }
  } else {
    args.push("--no-ref");
  }

  const result = await runProcess(args, { cwd: workspace.upstreamDir, timeoutMs: 45 * 60 * 1000 });
  if (!result.ok) {
    return sendJson(res, 500, {
      error: `Irodori-TTS 音声生成に失敗しました: ${result.error || result.stderr || "unknown error"}`,
      result
    });
  }

  const candidatePaths = savedIrodoriOutputPaths(outputPath, numCandidates);
  const outputs = [];
  for (const candidatePath of candidatePaths) {
    if (await isFile(candidatePath)) outputs.push(await outputInfo(candidatePath));
  }
  if (!outputs.length) {
    return sendJson(res, 500, {
      error: "Irodori-TTS は完了しましたが、出力 WAV が見つかりませんでした。",
      result
    });
  }
  sendJson(res, 200, {
    ...outputs[0],
    outputs,
    request: {
      provider: "irodori",
      mode,
      caption,
      numSteps,
      numCandidates,
      cfgScaleText,
      cfgScaleCaption,
      cfgScaleSpeaker,
      modelDevice: modelDevice || "auto",
      codecDevice: codecDevice || "auto",
      modelPrecision,
      codecPrecision,
      checkpoint: customCheckpoint || (mode === "VoiceDesign" ? irodoriVoiceDesignCheckpoint : irodoriBaseCheckpoint),
      input: cleanInput.length > 1200 ? `${cleanInput.slice(0, 1200)}...` : cleanInput
    },
    result
  });
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

    if (req.method === "POST" && url.pathname === "/api/openrouter/speech") {
      return await handleOpenRouterSpeech(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/elevenlabs/voices") {
      return await handleElevenLabsVoices(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/elevenlabs/models") {
      return await handleElevenLabsModels(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/elevenlabs/speech") {
      return await handleElevenLabsSpeech(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/irodori/status") {
      return await handleIrodoriStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/irodori/setup") {
      return await handleIrodoriSetup(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/irodori/speech") {
      return await handleIrodoriSpeech(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/exchange-rate/usd-jpy") {
      return await handleUsdJpyRate(req, res);
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

    if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/audios/")) {
      const relative = path.normalize(decodeURIComponent(url.pathname.slice("/audios/".length)));
      if (relative.startsWith("..") || path.isAbsolute(relative)) return sendText(res, 403, "Forbidden");
      const filePath = path.join(audioDir, relative);
      if (!filePath.startsWith(audioDir)) return sendText(res, 403, "Forbidden");
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
