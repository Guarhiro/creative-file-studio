import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await loadDotEnv(path.join(__dirname, ".env"));
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(dataDir, "uploads");
const videoDir = path.join(dataDir, "videos");
const audioDir = path.join(dataDir, "audios");
const modelLibraryDir = path.join(dataDir, "model-library");
const dbPath = path.join(dataDir, "db.json");
const seedanceGuidePath = path.join(__dirname, "Seedance2.0_Prompt_Guide_v2.md");
const irodoriSetupScriptPath = path.join(__dirname, "scripts", "setup-irodori.sh");
const voxcpmSetupScriptPath = path.join(__dirname, "scripts", "setup-voxcpm.sh");
const voxcpmRunScriptPath = path.join(__dirname, "scripts", "voxcpm-run.py");
const misottsSetupScriptPath = path.join(__dirname, "scripts", "setup-misotts.sh");
const misottsRunScriptPath = path.join(__dirname, "scripts", "misotts-run.py");
const rembgSetupScriptPath = path.join(__dirname, "scripts", "setup-rembg.sh");
const rembgRemoveScriptPath = path.join(__dirname, "scripts", "rembg-remove.py");
const backgroundRemoverSetupScriptPath = path.join(__dirname, "scripts", "setup-backgroundremover.sh");
const backgroundRemoverRunScriptPath = path.join(__dirname, "scripts", "backgroundremover-run.py");
const backgroundRemoverSitecustomizeDir = path.join(__dirname, "scripts", "backgroundremover_sitecustomize");
const irodoriVendorDir = path.join(__dirname, "vendor", "Irodori-TTS");
const voxcpmVendorDir = path.join(__dirname, "vendor", "VoxCPM");
const misottsVendorDir = path.join(__dirname, "vendor", "MisoTTS");
const rembgVenvDir = path.join(__dirname, "vendor", "rembg-venv");
const rembgModelsDir = path.join(dataDir, "rembg-models");
const backgroundRemoverVenvDir = path.join(__dirname, "vendor", "backgroundremover-venv");
const backgroundRemoverHomeDir = path.join(dataDir, "backgroundremover-home");
const localIrodoriAppDir = "/Users/guarhiro/Documents/irodori TTSアプリ";
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const animaDexLocalBaseUrl = "http://127.0.0.1:5000";
const animaDexOfficialBaseUrl = "https://animadex.net";
const animaDexBlobOrigin = "https://blobs.animadex.net";
const animaDexSearchCacheTtlMs = 5 * 60 * 1000;
const animaDexSearchCache = new Map();

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
    imageAgentModel: "google/gemini-2.5-flash",
    videoAgentModel: "google/gemini-2.5-flash",
    audioAgentModel: "google/gemini-2.5-flash",
    audioProvider: "openrouter",
    audioModel: "google/gemini-3.1-flash-tts-preview",
    audioVoice: "Kore",
    audioResponseFormat: "pcm",
    audioActingPrompt: "自然な日本語で、感情と間を大切にして読み上げてください。音声案の本文には [laughs] [whispers] [sighs] [excited] などの感情タグを必ず1つ以上入れてください。",
    elevenLabsVoiceId: "JBFqnCBsd6RMkjVDRZzb",
    elevenLabsModelId: "eleven_multilingual_v2",
    elevenLabsOutputFormat: "mp3_44100_128",
    elevenLabsStability: 0.5,
    elevenLabsSimilarityBoost: 0.75,
    elevenLabsStyle: 0,
    elevenLabsSpeed: 1,
    elevenLabsSpeakerBoost: true,
    elevenLabsLanguageCode: "ja",
    voiceboxBaseUrl: "http://127.0.0.1:17493",
    voiceboxProfileId: "",
    voiceboxLanguage: "ja",
    voiceboxModelSize: "1.7B",
    animadexBaseUrl: animaDexLocalBaseUrl,
    animadexFavorites: {
      characters: [],
      artists: []
    },
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
    voxcpmAppDir: "vendor/VoxCPM",
    voxcpmDefaults: {
      mode: "VoiceDesign",
      voicePrompt: "落ち着いた自然な日本語の声。近い距離感で、感情を少し抑えて読み上げる。",
      modelId: "openbmb/VoxCPM2",
      device: "cpu",
      noOptimize: true,
      cfgValue: 2,
      inferenceTimesteps: 10,
      normalize: true,
      denoise: false,
      promptText: ""
    },
    misottsAppDir: "vendor/MisoTTS",
    misottsDefaults: {
      mode: "Text",
      speaker: 0,
      promptSpeaker: 0,
      modelSource: "MisoLabs/MisoTTS",
      device: "auto",
      dtype: "bfloat16",
      maxAudioLengthMs: 10000,
      temperature: 0.9,
      topk: 50,
      promptText: ""
    },
    seedanceBaseUrl: "https://ark.ap-southeast.bytepluses.com/api/v3",
    seedanceModel: "dreamina-seedance-2-0-260128",
    seedanceResolution: "720p",
    comfy: {
      provider: "comfy",
      gpuMode: "local",
      localBaseUrl: "http://127.0.0.1:8188",
      cloudBaseUrl: "",
      forgeBaseUrl: "http://127.0.0.1:7860",
      forgeNeoBaseUrl: "http://127.0.0.1:7860",
      drawThingsBaseUrl: "http://127.0.0.1:7860",
      forgeNeoModules: [],
      forgeNeoDtype: "Automatic",
      forgeNeoDistilledCfg: "",
      forgeNeoRefinerCheckpoint: "",
      forgeNeoRefinerSwitchAt: "",
      forgeNeoOverrideSettingsJson: "",
      forgeNeoPayloadJson: "",
      workflowJson: "",
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
    },
    comfyPresets: [],
    modelLibrary: {
      provider: ""
    },
    moveImportedSourcesToTrash: false,
    importSourceRoot: ""
  },
  works: [],
  worldItems: [],
  characters: [],
  assets: [],
  videoMedia: [],
  videoJobs: [],
  imageJobs: [],
  audioItems: []
};

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(videoDir, { recursive: true });
await fs.mkdir(audioDir, { recursive: true });
await fs.mkdir(path.join(modelLibraryDir, "checkpoints"), { recursive: true });
await fs.mkdir(path.join(modelLibraryDir, "loras"), { recursive: true });
await fs.mkdir(path.join(modelLibraryDir, "vaes"), { recursive: true });
await fs.mkdir(rembgModelsDir, { recursive: true });
await fs.mkdir(path.join(backgroundRemoverHomeDir, ".u2net"), { recursive: true });

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
      ...(db.settings || {}),
      comfy: {
        ...emptyDb.settings.comfy,
        ...(db.settings?.comfy || {})
      },
      modelLibrary: {
        ...emptyDb.settings.modelLibrary,
        ...(db.settings?.modelLibrary || {})
      }
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

async function loadDotEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function envValue(...names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return value;
  }
  return "";
}

function apiKeyFromRequest(value, ...envNames) {
  return String(value || "").trim() || envValue(...envNames);
}

function normalizedRemoteAddress(req) {
  return String(req.socket?.remoteAddress || "")
    .replace(/^::ffff:/, "")
    .trim();
}

function isLoopbackAddress(address) {
  const value = String(address || "").trim();
  return value === "::1" || value === "localhost" || value === "0:0:0:0:0:0:0:1" || value.startsWith("127.");
}

function clientAccess(req) {
  const remoteAddress = normalizedRemoteAddress(req);
  const isLocal = isLoopbackAddress(remoteAddress);
  return {
    remoteAddress,
    mode: isLocal ? "desktop" : "lan",
    canUseSettings: isLocal,
    canRevealFiles: isLocal
  };
}

function networkUrls() {
  const urls = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces || []) {
      if (item.family === "IPv4" && !item.internal) {
        urls.push(`http://${item.address}:${port}`);
      }
    }
  }
  return [...new Set(urls)];
}

const lanAllowedApiRoutes = new Set([
  "GET /api/session",
  "GET /api/db",
  "PUT /api/db",
  "POST /api/upload",
  "POST /api/media-upload",
  "POST /api/move-upload",
  "POST /api/remove-bg",
  "POST /api/rembg/status",
  "POST /api/rembg/remove",
  "POST /api/backgroundremover/status",
  "POST /api/backgroundremover/image",
  "POST /api/openrouter/chat",
  "GET /api/openrouter/models",
  "POST /api/openrouter/video-models",
  "POST /api/openrouter/speech",
  "POST /api/elevenlabs/speech",
  "POST /api/voicebox/profiles",
  "POST /api/voicebox/speech",
  "POST /api/animadex/search",
  "POST /api/animadex/facets",
  "GET /api/animadex/media",
  "POST /api/irodori/status",
  "POST /api/irodori/speech",
  "POST /api/voxcpm/status",
  "POST /api/voxcpm/speech",
  "POST /api/misotts/status",
  "POST /api/misotts/speech",
  "GET /api/exchange-rate/usd-jpy",
  "GET /api/seedance/guide",
  "POST /api/seedance/create",
  "POST /api/seedance/status",
  "POST /api/comfy/check",
  "POST /api/comfy/models",
  "POST /api/comfy/validate",
  "POST /api/comfy/create",
  "POST /api/comfy/status",
  "POST /api/forge/check",
  "POST /api/forge/models",
  "POST /api/forge/create"
]);

function isLanAllowedApi(req, url) {
  return lanAllowedApiRoutes.has(`${req.method} ${url.pathname}`);
}

function blockLanApiIfNeeded(req, res, url) {
  const access = clientAccess(req);
  if (access.mode !== "lan" || !url.pathname.startsWith("/api/")) return false;
  if (isLanAllowedApi(req, url)) return false;
  sendJson(res, 403, {
    error: "スマホ接続ではこの操作は使えません。Mac本体のブラウザから操作してください。",
    mobileRestricted: true
  });
  return true;
}

function readableProviderError(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(readableProviderError).filter(Boolean).join(" / ");
  if (typeof value === "object") {
    if (String(value.error || "").trim() === "HTTPException" && value.detail) return readableProviderError(value.detail);
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
    if (clean === "wav" || clean === "x-wav" || clean === "wave") return ".wav";
    if (["ogg", "webm"].includes(clean)) return `.${clean}`;
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

function audioTargetDirFromBody(body = {}) {
  const workName = safeFolderName(body.workName || body.work || "", "_未指定作品");
  const characterName = safeFolderName(body.characterName || body.character || "", "_音声");
  return path.join(audioDir, workName, characterName);
}

async function ensureAudioTargetDir(body = {}) {
  const targetDir = audioTargetDirFromBody(body);
  await fs.mkdir(targetDir, { recursive: true });
  return targetDir;
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

function audioPathFromUrl(audioUrl) {
  const parsed = new URL(audioUrl, "http://localhost");
  if (!parsed.pathname.startsWith("/audios/")) throw new Error("audios 配下の音声URLではありません。");
  const relative = path.normalize(decodeURIComponent(parsed.pathname.slice("/audios/".length)));
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("音声パスが不正です。");
  const filePath = path.join(audioDir, relative);
  if (!filePath.startsWith(audioDir)) throw new Error("音声パスが不正です。");
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

function voxcpmPythonPath(appDir) {
  const venvDir = path.join(appDir, ".venv");
  return process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");
}

async function inspectVoxcpmPython(pythonPath) {
  if (!await isFile(pythonPath)) return null;
  const result = await runProcess([
    pythonPath,
    "-c",
    "import importlib.metadata as m; print(m.version('voxcpm'))"
  ], { timeoutMs: 30000 });
  return {
    ok: result.ok,
    version: result.ok ? result.stdout.trim() : "",
    result
  };
}

async function resolveVoxcpmWorkspace(configuredPath = "") {
  const candidates = [
    configuredPath,
    process.env.VOXCPM_DIR,
    voxcpmVendorDir
  ]
    .map(expandLocalPath)
    .filter(Boolean);
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const pythonPath = voxcpmPythonPath(candidate);
    const inspection = await inspectVoxcpmPython(pythonPath);
    if (inspection?.ok) {
      return {
        found: true,
        configuredPath: candidate,
        appDir: candidate,
        pythonPath,
        packageVersion: inspection.version,
        cacheDir: path.join(candidate, "hf-cache"),
        runnerScript: voxcpmRunScriptPath
      };
    }
  }
  return {
    found: false,
    configuredPath: expandLocalPath(configuredPath),
    candidates: [...seen],
    setupScript: voxcpmSetupScriptPath,
    suggestedPath: path.relative(__dirname, voxcpmVendorDir) || voxcpmVendorDir,
    runnerScript: voxcpmRunScriptPath
  };
}

function misottsPythonPath(appDir) {
  const venvDir = path.join(appDir, ".venv");
  return process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");
}

async function inspectMisoTtsPython(pythonPath, appDir) {
  if (!await isFile(pythonPath)) return null;
  const result = await runProcess([
    pythonPath,
    "-c",
    "import importlib.metadata as m; import generator; print(m.version('miso-tts'))"
  ], { cwd: appDir, timeoutMs: 30000 });
  return {
    ok: result.ok,
    version: result.ok ? result.stdout.trim() : "",
    result
  };
}

async function resolveMisoTtsWorkspace(configuredPath = "") {
  const candidates = [
    configuredPath,
    process.env.MISOTTS_DIR,
    process.env.MISO_TTS_DIR,
    misottsVendorDir
  ]
    .map(expandLocalPath)
    .filter(Boolean);
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const generatorPath = path.join(candidate, "generator.py");
    const pythonPath = misottsPythonPath(candidate);
    const inspection = await inspectMisoTtsPython(pythonPath, candidate);
    if (await isFile(generatorPath) && inspection?.ok) {
      return {
        found: true,
        configuredPath: candidate,
        appDir: candidate,
        pythonPath,
        packageVersion: inspection.version,
        cacheDir: path.join(candidate, "hf-cache"),
        hfHomeDir: path.join(candidate, "hf-home"),
        runnerScript: misottsRunScriptPath
      };
    }
  }
  return {
    found: false,
    configuredPath: expandLocalPath(configuredPath),
    candidates: [...seen],
    setupScript: misottsSetupScriptPath,
    suggestedPath: path.relative(__dirname, misottsVendorDir) || misottsVendorDir,
    runnerScript: misottsRunScriptPath
  };
}

function rembgVenvPythonPath() {
  return process.platform === "win32"
    ? path.join(rembgVenvDir, "Scripts", "python.exe")
    : path.join(rembgVenvDir, "bin", "python");
}

function rembgPythonCandidates(configuredPath = "") {
  const candidates = [
    configuredPath,
    process.env.REMBG_PYTHON,
    rembgVenvPythonPath(),
    "python3",
    "python"
  ]
    .map((candidate) => String(candidate || "").trim())
    .filter(Boolean);
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  });
}

async function checkRembgPython(candidate) {
  const result = await runProcess([
    candidate,
    "-c",
    "import sys, rembg, PIL; print(sys.version.split()[0])"
  ], {
    timeoutMs: 20000,
    env: { U2NET_HOME: rembgModelsDir }
  });
  if (!result.ok) {
    return {
      ok: false,
      pythonPath: candidate,
      error: result.stderr || result.stdout || result.error || "rembg を読み込めませんでした。",
      result
    };
  }
  return {
    ok: true,
    pythonPath: candidate,
    pythonVersion: result.stdout.trim(),
    result
  };
}

async function resolveRembgPython(configuredPath = "") {
  const attempts = [];
  for (const candidate of rembgPythonCandidates(configuredPath)) {
    const checked = await checkRembgPython(candidate);
    attempts.push(checked);
    if (checked.ok) {
      return {
        found: true,
        pythonPath: checked.pythonPath,
        pythonVersion: checked.pythonVersion,
        attempts,
        setupScript: rembgSetupScriptPath,
        venvDir: rembgVenvDir,
        modelsDir: rembgModelsDir
      };
    }
  }
  return {
    found: false,
    pythonPath: "",
    attempts,
    setupScript: rembgSetupScriptPath,
    venvDir: rembgVenvDir,
    modelsDir: rembgModelsDir,
    installHint: "画像編集画面の「rembgをセットアップ」を押すか、ターミナルで scripts/setup-rembg.sh を実行してください。"
  };
}

function backgroundRemoverVenvPythonPath() {
  return process.platform === "win32"
    ? path.join(backgroundRemoverVenvDir, "Scripts", "python.exe")
    : path.join(backgroundRemoverVenvDir, "bin", "python");
}

function backgroundRemoverVenvBinDir() {
  return process.platform === "win32"
    ? path.join(backgroundRemoverVenvDir, "Scripts")
    : path.join(backgroundRemoverVenvDir, "bin");
}

function backgroundRemoverPythonCandidates(configuredPath = "") {
  const candidates = [
    configuredPath,
    process.env.BACKGROUNDREMOVER_PYTHON,
    backgroundRemoverVenvPythonPath(),
    "python3",
    "python"
  ]
    .map((candidate) => String(candidate || "").trim())
    .filter(Boolean);
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) return false;
    seen.add(candidate);
    return true;
  });
}

function backgroundRemoverEnv(extra = {}) {
  const forceCpu = extra.CFS_BACKGROUNDREMOVER_FORCE_CPU === "1";
  const pythonPath = forceCpu
    ? [backgroundRemoverSitecustomizeDir, process.env.PYTHONPATH || ""].filter(Boolean).join(path.delimiter)
    : process.env.PYTHONPATH;
  return {
    HOME: backgroundRemoverHomeDir,
    PATH: `${backgroundRemoverVenvBinDir()}${path.delimiter}${process.env.PATH || ""}`,
    ...(pythonPath ? { PYTHONPATH: pythonPath } : {}),
    PYTHONUNBUFFERED: "1",
    ...extra
  };
}

async function checkFfmpeg() {
  const ffmpeg = await runProcess(["ffmpeg", "-version"], {
    timeoutMs: 10000,
    env: backgroundRemoverEnv()
  });
  const ffprobe = await runProcess(["ffprobe", "-version"], {
    timeoutMs: 10000,
    env: backgroundRemoverEnv()
  });
  return {
    found: ffmpeg.ok && ffprobe.ok,
    version: ffmpeg.ok ? (ffmpeg.stdout.split("\n")[0] || "").trim() : "",
    probeVersion: ffprobe.ok ? (ffprobe.stdout.split("\n")[0] || "").trim() : "",
    error: ffmpeg.ok && ffprobe.ok
      ? ""
      : [
        ffmpeg.ok ? "" : (ffmpeg.stderr || ffmpeg.stdout || ffmpeg.error || "ffmpeg が見つかりません。"),
        ffprobe.ok ? "" : (ffprobe.stderr || ffprobe.stdout || ffprobe.error || "ffprobe が見つかりません。")
      ].filter(Boolean).join(" / "),
    result: { ffmpeg, ffprobe }
  };
}

function videoGifFfmpegStatus(tools) {
  const ffmpeg = tools?.result?.ffmpeg || {};
  const ffprobe = tools?.result?.ffprobe || {};
  return {
    found: Boolean(ffmpeg.ok),
    version: ffmpeg.ok ? (ffmpeg.stdout?.split("\n")[0] || "").trim() : "",
    ffmpegFound: Boolean(ffmpeg.ok),
    ffprobeFound: Boolean(ffprobe.ok),
    ffprobeVersion: ffprobe.ok ? (ffprobe.stdout?.split("\n")[0] || "").trim() : "",
    error: ffmpeg.ok ? "" : (ffmpeg.stderr || ffmpeg.stdout || ffmpeg.error || "ffmpeg が見つかりません。"),
    installHint: "ffmpegをPATHに追加するか、画像編集画面のbackgroundremoverセットアップで同梱ffmpegを用意してください。",
    result: tools?.result || null
  };
}

function audioEditFfmpegStatus(tools) {
  const ffmpeg = tools?.result?.ffmpeg || {};
  const ffprobe = tools?.result?.ffprobe || {};
  const found = Boolean(ffmpeg.ok && ffprobe.ok);
  return {
    found,
    version: ffmpeg.ok ? (ffmpeg.stdout?.split("\n")[0] || "").trim() : "",
    ffmpegFound: Boolean(ffmpeg.ok),
    ffprobeFound: Boolean(ffprobe.ok),
    ffprobeVersion: ffprobe.ok ? (ffprobe.stdout?.split("\n")[0] || "").trim() : "",
    error: found
      ? ""
      : [
        ffmpeg.ok ? "" : (ffmpeg.stderr || ffmpeg.stdout || ffmpeg.error || "ffmpeg が見つかりません。"),
        ffprobe.ok ? "" : (ffprobe.stderr || ffprobe.stdout || ffprobe.error || "ffprobe が見つかりません。")
      ].filter(Boolean).join(" / "),
    installHint: "ffmpeg/ffprobeをPATHに追加するか、画像編集画面のbackgroundremoverセットアップで同梱ffmpegを用意してください。",
    result: tools?.result || null
  };
}

async function checkBackgroundRemoverPython(candidate) {
  const result = await runProcess([
    candidate,
    "-c",
    "import sys, backgroundremover, torch; print(sys.version.split()[0]); print(getattr(torch, '__version__', 'torch'))"
  ], {
    timeoutMs: 30000,
    env: backgroundRemoverEnv()
  });
  if (!result.ok) {
    return {
      ok: false,
      pythonPath: candidate,
      error: result.stderr || result.stdout || result.error || "backgroundremover を読み込めませんでした。",
      result
    };
  }
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  return {
    ok: true,
    pythonPath: candidate,
    pythonVersion: lines.at(-2) || lines[0] || "",
    torchVersion: lines.at(-1) || "",
    result
  };
}

async function resolveBackgroundRemoverPython(configuredPath = "") {
  const attempts = [];
  const ffmpeg = await checkFfmpeg();
  for (const candidate of backgroundRemoverPythonCandidates(configuredPath)) {
    const checked = await checkBackgroundRemoverPython(candidate);
    attempts.push(checked);
    if (checked.ok) {
      return {
        found: true,
        pythonPath: checked.pythonPath,
        pythonVersion: checked.pythonVersion,
        torchVersion: checked.torchVersion,
        ffmpegFound: ffmpeg.found,
        ffmpegVersion: ffmpeg.version,
        ffprobeVersion: ffmpeg.probeVersion,
        ffmpegError: ffmpeg.error,
        attempts,
        setupScript: backgroundRemoverSetupScriptPath,
        venvDir: backgroundRemoverVenvDir,
        homeDir: backgroundRemoverHomeDir,
        modelDir: path.join(backgroundRemoverHomeDir, ".u2net")
      };
    }
  }
  return {
    found: false,
    pythonPath: "",
    ffmpegFound: ffmpeg.found,
    ffmpegVersion: ffmpeg.version,
    ffprobeVersion: ffmpeg.probeVersion,
    ffmpegError: ffmpeg.error,
    attempts,
    setupScript: backgroundRemoverSetupScriptPath,
    venvDir: backgroundRemoverVenvDir,
    homeDir: backgroundRemoverHomeDir,
    modelDir: path.join(backgroundRemoverHomeDir, ".u2net"),
    installHint: "画像編集画面の「backgroundremoverをセットアップ」を押すか、ターミナルで scripts/setup-backgroundremover.sh を実行してください。動画処理にはffmpegも必要です。"
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

function isInsideDir(filePath, dir) {
  const relative = path.relative(path.resolve(dir), path.resolve(filePath));
  return relative === "" || (relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function safeRelativePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const relative = path.normalize(raw);
  if (!relative || path.isAbsolute(relative) || relative.startsWith("..")) return "";
  return relative;
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function moveFileToUserTrash(filePath) {
  const home = process.env.HOME || "";
  if (!home) throw new Error("ユーザーのホームフォルダが見つかりません。");
  const trashDir = path.join(home, ".Trash");
  await fs.mkdir(trashDir, { recursive: true });
  const target = await uniqueFilePath(trashDir, path.basename(filePath));
  await fs.rename(filePath, target);
  return { method: "home-trash", trashPath: target };
}

async function moveFileToSystemTrash(filePath) {
  const resolved = path.resolve(filePath);
  if (process.platform === "darwin") {
    const result = await runProcess([
      "osascript",
      "-e",
      "on run argv",
      "-e",
      "tell application \"Finder\" to delete POSIX file (item 1 of argv)",
      "-e",
      "end run",
      resolved
    ], { timeoutMs: 30000 });
    if (result.ok) return { method: "finder-trash" };
    try {
      return await moveFileToUserTrash(resolved);
    } catch (fallbackError) {
      throw new Error(`ゴミ箱への移動に失敗しました: ${result.stderr || result.stdout || result.error || fallbackError.message}`);
    }
  }
  if (process.platform === "win32") {
    const result = await runProcess([
      "powershell.exe",
      "-NoProfile",
      "-Command",
      "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($args[0], 'OnlyErrorDialogs', 'SendToRecycleBin')",
      resolved
    ], { timeoutMs: 30000 });
    if (result.ok) return { method: "recycle-bin" };
    throw new Error(`ごみ箱への移動に失敗しました: ${result.stderr || result.stdout || result.error}`);
  }
  const result = await runProcess(["gio", "trash", resolved], { timeoutMs: 30000 });
  if (result.ok) return { method: "gio-trash" };
  throw new Error("この環境では元ファイルをゴミ箱へ移動できません。");
}

async function resolveImportSourceCandidate({ sourcePath, sourceRoot, relativePath, name }) {
  const candidates = [];
  const directPath = expandLocalPath(sourcePath);
  if (directPath && path.isAbsolute(directPath)) {
    candidates.push(path.resolve(directPath));
  }
  const rootPath = expandLocalPath(sourceRoot);
  if (rootPath && path.isAbsolute(rootPath)) {
    const safeRelative = safeRelativePath(relativePath);
    if (safeRelative) candidates.push(path.resolve(rootPath, safeRelative));
    if (name) candidates.push(path.resolve(rootPath, path.basename(String(name))));
  }
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (await isFile(candidate)) return candidate;
  }
  return "";
}

async function trashImportedSource(payload) {
  const uploadedUrl = String(payload.uploadedUrl || "");
  const uploadedPath = localMediaPathFromUrl(uploadedUrl);
  if (!isInsideDir(uploadedPath, uploadDir)) {
    return { ok: true, trashed: false, skipped: true, reason: "取り込み画像URLではありません。" };
  }
  const source = await resolveImportSourceCandidate(payload);
  if (!source) {
    return { ok: true, trashed: false, skipped: true, reason: "元ファイルの場所を特定できませんでした。" };
  }
  const sourcePath = path.resolve(source);
  if (isInsideDir(sourcePath, dataDir)) {
    return { ok: true, trashed: false, skipped: true, reason: "アプリのdataフォルダ内のファイルはゴミ箱へ移動しません。", path: sourcePath };
  }
  if (path.resolve(uploadedPath) === sourcePath) {
    return { ok: true, trashed: false, skipped: true, reason: "取り込み後の保存先と同じファイルです。", path: sourcePath };
  }
  const [uploadedStat, sourceStat] = await Promise.all([fs.stat(uploadedPath), fs.stat(sourcePath)]);
  if (!uploadedStat.isFile() || !sourceStat.isFile()) {
    return { ok: true, trashed: false, skipped: true, reason: "対象がファイルではありません。", path: sourcePath };
  }
  const expectedSize = Number(payload.size);
  if (Number.isFinite(expectedSize) && expectedSize > 0 && sourceStat.size !== expectedSize) {
    return { ok: true, trashed: false, skipped: true, reason: "元ファイルのサイズが選択時と一致しません。", path: sourcePath };
  }
  if (sourceStat.size !== uploadedStat.size) {
    return { ok: true, trashed: false, skipped: true, reason: "元ファイルと保存済み画像のサイズが一致しません。", path: sourcePath };
  }
  const [uploadedHash, sourceHash] = await Promise.all([sha256File(uploadedPath), sha256File(sourcePath)]);
  if (uploadedHash !== sourceHash) {
    return { ok: true, trashed: false, skipped: true, reason: "元ファイルと保存済み画像の内容が一致しません。", path: sourcePath };
  }
  const trashed = await moveFileToSystemTrash(sourcePath);
  return { ok: true, trashed: true, skipped: false, path: sourcePath, ...trashed };
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

async function serveFile(req, res, filePath, options = {}) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return false;
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "content-length": stat.size
    };
    if (options.cacheControl) headers["cache-control"] = options.cacheControl;
    res.writeHead(200, headers);
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
  const { dataUrl, name, workName, folderName } = await readJson(req, 220 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(dataUrl, ["image", "video", "audio"]);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
  const fileName = safeOriginalFileName(name, parsed.ext, parsed.kind);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const customFolder = parsed.kind === "image" ? String(folderName || "").trim() : "";
  const kindFolder = customFolder ? safeFolderName(customFolder, "_参照画像") : parsed.kind === "image" ? "_動画生成_画像" : parsed.kind === "video" ? "_動画生成_動画" : "_動画生成_音声";
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

async function handleRemoveBackground(req, res) {
  const body = await readJson(req, 64 * 1024 * 1024);
  const { dataUrl, name, size = "auto" } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "REMOVEBG_API_KEY", "REMOVE_BG_API_KEY");
  if (!apiKey) return sendJson(res, 400, { error: "remove.bg API キーが未設定です。" });
  let parsed;
  try {
    parsed = parseDataUrl(dataUrl, ["image"]);
  } catch {
    return sendJson(res, 400, { error: "背景除去する画像の data URL が必要です。" });
  }

  try {
    const imageBuffer = Buffer.from(parsed.base64, "base64");
    const formData = new FormData();
    formData.append("size", String(size || "auto"));
    formData.append("format", "png");
    formData.append(
      "image_file",
      new Blob([imageBuffer], { type: `${parsed.kind}/${parsed.subtype}` }),
      safeOriginalFileName(name, parsed.ext)
    );
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { error: text };
      }
      const message = readableProviderError(payload.errors)
        || readableProviderError(payload.error)
        || readableProviderError(payload)
        || `remove.bg API が ${response.status} を返しました。`;
      return sendJson(res, response.status, {
        error: message,
        providerError: payload
      });
    }
    const outputBuffer = Buffer.from(await response.arrayBuffer());
    sendJson(res, 200, {
      dataUrl: `data:image/png;base64,${outputBuffer.toString("base64")}`,
      mimeType: "image/png",
      provider: "remove.bg",
      size: outputBuffer.length
    });
  } catch (error) {
    sendJson(res, 502, { error: `remove.bg への接続に失敗しました: ${error.message}` });
  }
}

async function handleRembgStatus(req, res) {
  const { pythonPath = "" } = await readJson(req, 256 * 1024).catch(() => ({}));
  sendJson(res, 200, await resolveRembgPython(pythonPath));
}

async function handleRembgSetup(req, res) {
  const before = await resolveRembgPython(rembgVenvPythonPath());
  if (before.found) {
    return sendJson(res, 200, {
      ok: true,
      skipped: true,
      status: before,
      result: null,
      message: "rembg はすでにセットアップ済みです。"
    });
  }
  const exists = await isFile(rembgSetupScriptPath);
  if (!exists) return sendJson(res, 404, { error: "rembg セットアップスクリプトが見つかりません。" });
  const result = await runProcess(["bash", rembgSetupScriptPath], {
    cwd: __dirname,
    timeoutMs: 45 * 60 * 1000,
    env: { U2NET_HOME: rembgModelsDir }
  });
  const status = await resolveRembgPython(rembgVenvPythonPath());
  const detail = result.stderr || result.stdout || result.error || status.attempts?.[0]?.error || "unknown error";
  sendJson(res, result.ok && status.found ? 200 : 500, {
    ok: result.ok && status.found,
    error: result.ok && status.found ? "" : `rembg セットアップに失敗しました: ${detail}`,
    status,
    result
  });
}

async function handleRembgRemove(req, res) {
  const body = await readJson(req, 64 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(body.dataUrl, ["image"]);
  } catch {
    return sendJson(res, 400, { error: "背景除去する画像の data URL が必要です。" });
  }
  const status = await resolveRembgPython(body.pythonPath || "");
  if (!status.found) {
    return sendJson(res, 400, {
      error: "rembg が見つかりません。先に「rembgをセットアップ」を実行してください。",
      status
    });
  }

  const model = String(body.model || "isnet-general-use").trim() || "isnet-general-use";
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "creative-file-studio-rembg-"));
  const inputPath = path.join(tempDir, safeOriginalFileName(body.name, parsed.ext, "input"));
  const outputPath = path.join(tempDir, "output.png");
  try {
    await fs.writeFile(inputPath, Buffer.from(parsed.base64, "base64"));
    const args = [
      status.pythonPath,
      rembgRemoveScriptPath,
      inputPath,
      outputPath,
      "--model",
      model
    ];
    if (body.alphaMatting) args.push("--alpha-matting");
    if (body.postProcessMask) args.push("--post-process-mask");
    const result = await runProcess(args, {
      cwd: __dirname,
      timeoutMs: 20 * 60 * 1000,
      env: {
        U2NET_HOME: rembgModelsDir,
        PYTHONUNBUFFERED: "1"
      }
    });
    if (!result.ok) {
      return sendJson(res, 500, {
        error: `rembg 背景除去に失敗しました: ${result.stderr || result.stdout || result.error}`,
        result,
        status
      });
    }
    if (!await isFile(outputPath)) {
      return sendJson(res, 500, { error: "rembg の出力PNGが見つかりません。", result, status });
    }
    const outputBuffer = await fs.readFile(outputPath);
    sendJson(res, 200, {
      dataUrl: `data:image/png;base64,${outputBuffer.toString("base64")}`,
      mimeType: "image/png",
      provider: "rembg",
      model,
      size: outputBuffer.length,
      result: {
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `rembg 背景除去に失敗しました: ${error.message}` });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function normalizedBackgroundRemoverModel(value) {
  const model = String(value || "").trim();
  return ["u2net", "u2netp", "u2net_human_seg"].includes(model) ? model : "u2net";
}

function normalizedBackgroundRemoverVideoMode(value) {
  const mode = String(value || "").trim();
  return ["transparent-mov", "transparent-gif", "matte"].includes(mode) ? mode : "transparent-gif";
}

function backgroundRemoverVideoOutput(mode) {
  if (mode === "transparent-mov") return { flag: "-tv", ext: ".mov", mimeType: "video/quicktime", suffix: "transparent" };
  if (mode === "matte") return { flag: "-mk", ext: ".mp4", mimeType: "video/mp4", suffix: "matte" };
  return { flag: "-tg", ext: ".gif", mimeType: "image/gif", suffix: "transparent" };
}

function backgroundRemoverOutputName(name, suffix, ext) {
  const parsed = path.parse(path.basename(String(name || "media")));
  const base = cleanFileNamePart(parsed.name, "media", 80);
  return `${Date.now()}-${crypto.randomUUID()}-${base}-${suffix}${ext}`;
}

function normalizedVideoGifFrameRate(value) {
  return boundedNumber(value, 12, 1, 30, true);
}

function normalizedVideoGifWidth(value) {
  return boundedNumber(value, 640, 160, 1920, true);
}

function normalizedVideoGifStartTime(value) {
  return boundedNumber(value, 0, 0, 36000, false);
}

function normalizedVideoGifDuration(value) {
  return boundedNumber(value, 6, 0, 600, false);
}

function videoGifOutputName(name) {
  const parsed = path.parse(path.basename(String(name || "video")));
  const base = cleanFileNamePart(parsed.name, "video", 80);
  return `${base}-gif.gif`;
}

async function handleBackgroundRemoverStatus(req, res) {
  const { pythonPath = "" } = await readJson(req, 256 * 1024).catch(() => ({}));
  sendJson(res, 200, await resolveBackgroundRemoverPython(pythonPath));
}

async function handleBackgroundRemoverSetup(req, res) {
  const before = await resolveBackgroundRemoverPython(backgroundRemoverVenvPythonPath());
  if (before.found) {
    return sendJson(res, 200, {
      ok: true,
      skipped: true,
      status: before,
      result: null,
      message: "backgroundremover はすでにセットアップ済みです。"
    });
  }
  const exists = await isFile(backgroundRemoverSetupScriptPath);
  if (!exists) return sendJson(res, 404, { error: "backgroundremover セットアップスクリプトが見つかりません。" });
  const result = await runProcess(["bash", backgroundRemoverSetupScriptPath], {
    cwd: __dirname,
    timeoutMs: 60 * 60 * 1000,
    env: backgroundRemoverEnv()
  });
  const status = await resolveBackgroundRemoverPython(backgroundRemoverVenvPythonPath());
  const detail = result.stderr || result.stdout || result.error || status.attempts?.[0]?.error || "unknown error";
  sendJson(res, result.ok && status.found ? 200 : 500, {
    ok: result.ok && status.found,
    error: result.ok && status.found ? "" : `backgroundremover セットアップに失敗しました: ${detail}`,
    status,
    result
  });
}

async function handleBackgroundRemoverImage(req, res) {
  const body = await readJson(req, 64 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(body.dataUrl, ["image"]);
  } catch {
    return sendJson(res, 400, { error: "背景除去する画像の data URL が必要です。" });
  }
  const status = await resolveBackgroundRemoverPython(body.pythonPath || "");
  if (!status.found) {
    return sendJson(res, 400, {
      error: "backgroundremover が見つかりません。先に「backgroundremoverをセットアップ」を実行してください。",
      status
    });
  }

  const model = normalizedBackgroundRemoverModel(body.model);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "creative-file-studio-backgroundremover-"));
  const inputPath = path.join(tempDir, safeOriginalFileName(body.name, parsed.ext, "input"));
  const outputPath = path.join(tempDir, "output.png");
  try {
    await fs.writeFile(inputPath, Buffer.from(parsed.base64, "base64"));
    const args = [
      status.pythonPath,
      backgroundRemoverRunScriptPath,
      "-i",
      inputPath,
      "-m",
      model
    ];
    if (body.alphaMatting) {
      args.push("-a", "-ae", String(boundedNumber(body.erodeSize, 10, 1, 25, true)));
    }
    args.push("-o", outputPath);
    const result = await runProcess(args, {
      cwd: __dirname,
      timeoutMs: 25 * 60 * 1000,
      env: backgroundRemoverEnv()
    });
    if (!result.ok) {
      return sendJson(res, 500, {
        error: `backgroundremover 画像背景除去に失敗しました: ${result.stderr || result.stdout || result.error}`,
        result,
        status
      });
    }
    if (!await isFile(outputPath)) {
      return sendJson(res, 500, { error: "backgroundremover の出力PNGが見つかりません。", result, status });
    }
    const outputBuffer = await fs.readFile(outputPath);
    sendJson(res, 200, {
      dataUrl: `data:image/png;base64,${outputBuffer.toString("base64")}`,
      mimeType: "image/png",
      provider: "backgroundremover",
      model,
      size: outputBuffer.length,
      result: {
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `backgroundremover 画像背景除去に失敗しました: ${error.message}` });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function handleBackgroundRemoverVideo(req, res) {
  const body = await readJson(req, 260 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(body.dataUrl, ["video", "image"]);
    if (parsed.kind === "image" && parsed.subtype !== "gif") throw new Error("動画またはGIFの data URL が必要です。");
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "動画またはGIFの data URL が必要です。" });
  }
  const status = await resolveBackgroundRemoverPython(body.pythonPath || "");
  if (!status.found) {
    return sendJson(res, 400, {
      error: "backgroundremover が見つかりません。先に「backgroundremoverをセットアップ」を実行してください。",
      status
    });
  }
  if (!status.ffmpegFound) {
    return sendJson(res, 400, {
      error: `動画処理にはffmpegが必要です。${status.ffmpegError || ""}`.trim(),
      status
    });
  }

  const model = normalizedBackgroundRemoverModel(body.model);
  const mode = normalizedBackgroundRemoverVideoMode(body.mode);
  const output = backgroundRemoverVideoOutput(mode);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "creative-file-studio-backgroundremover-video-"));
  const inputPath = path.join(tempDir, safeOriginalFileName(body.name, parsed.ext, "video"));
  const outputPath = path.join(tempDir, `output${output.ext}`);
  try {
    await fs.writeFile(inputPath, Buffer.from(parsed.base64, "base64"));
    const args = [
      status.pythonPath,
      backgroundRemoverRunScriptPath,
      "-i",
      inputPath,
      "-m",
      model
    ];
    const frameRate = boundedNumber(body.frameRate, 30, 1, 60, true);
    const frameLimit = boundedNumber(body.frameLimit, -1, -1, 20000, true);
    const gpuBatchSize = boundedNumber(body.gpuBatchSize, 1, 1, 8, true);
    const workerCount = boundedNumber(body.workerCount, 1, 1, 4, true);
    if (frameRate) args.push("-fr", String(frameRate));
    if (frameLimit > 0) args.push("-fl", String(frameLimit));
    args.push("-gb", String(gpuBatchSize), "-wn", String(workerCount), output.flag, "-o", outputPath);
    const result = await runProcess(args, {
      cwd: __dirname,
      timeoutMs: 90 * 60 * 1000,
      env: backgroundRemoverEnv({ CFS_BACKGROUNDREMOVER_FORCE_CPU: "1" })
    });
    if (!result.ok) {
      return sendJson(res, 500, {
        error: `backgroundremover 動画背景除去に失敗しました: ${result.stderr || result.stdout || result.error}`,
        result,
        status
      });
    }
    if (/Output file is empty|Conversion failed/i.test(`${result.stderr}\n${result.stdout}`)) {
      return sendJson(res, 500, {
        error: "backgroundremover の動画変換が空出力で終了しました。短すぎる動画、単純すぎる素材、またはGIF/MOV変換との相性で失敗する場合があります。マット動画MP4でも試してください。",
        result,
        status
      });
    }
    if (!await isFile(outputPath)) {
      return sendJson(res, 500, { error: "backgroundremover の出力ファイルが見つかりません。", result, status });
    }
    const outputStat = await fs.stat(outputPath);
    if (!outputStat.size) {
      return sendJson(res, 500, { error: "backgroundremover の出力ファイルが空です。短すぎる動画/GIFでは失敗する場合があります。", result, status });
    }
    const destination = await uniqueFilePath(videoDir, backgroundRemoverOutputName(body.name, output.suffix, output.ext));
    await fs.copyFile(outputPath, destination);
    sendJson(res, 200, {
      url: `/videos/${encodeURIComponent(path.basename(destination))}`,
      path: destination,
      name: path.basename(destination),
      mimeType: output.mimeType,
      provider: "backgroundremover",
      mode,
      model,
      size: outputStat.size,
      result: {
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `backgroundremover 動画背景除去に失敗しました: ${error.message}` });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function handleVideoGifStatus(req, res) {
  const tools = await checkFfmpeg();
  sendJson(res, 200, videoGifFfmpegStatus(tools));
}

async function handleVideoGifConvert(req, res) {
  const body = await readJson(req, 260 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(body.dataUrl, ["video", "image"]);
    if (parsed.kind === "image" && parsed.subtype !== "gif") throw new Error("動画またはGIFの data URL が必要です。");
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "動画またはGIFの data URL が必要です。" });
  }

  const tools = await checkFfmpeg();
  const ffmpegStatus = videoGifFfmpegStatus(tools);
  if (!ffmpegStatus.found) {
    return sendJson(res, 400, {
      error: `動画GIF化にはffmpegが必要です。${ffmpegStatus.error || ""}`.trim(),
      status: ffmpegStatus
    });
  }

  const frameRate = normalizedVideoGifFrameRate(body.frameRate);
  const width = normalizedVideoGifWidth(body.width);
  const startTime = normalizedVideoGifStartTime(body.startTime);
  const duration = normalizedVideoGifDuration(body.duration);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "creative-file-studio-video-gif-"));
  const inputPath = path.join(tempDir, safeOriginalFileName(body.name, parsed.ext, "video"));
  const outputPath = path.join(tempDir, "output.gif");
  try {
    await fs.writeFile(inputPath, Buffer.from(parsed.base64, "base64"));
    const filter = [
      `fps=${frameRate}`,
      `scale=${width}:-1:flags=lanczos`,
      "split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a"
    ].join(",");
    const args = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning"];
    if (startTime > 0) args.push("-ss", String(startTime));
    args.push("-i", inputPath);
    if (duration > 0) args.push("-t", String(duration));
    args.push("-filter_complex", filter, "-loop", "0", outputPath);
    const result = await runProcess(args, {
      cwd: __dirname,
      timeoutMs: 30 * 60 * 1000,
      env: backgroundRemoverEnv()
    });
    if (!result.ok) {
      return sendJson(res, 500, {
        error: `動画GIF化に失敗しました: ${result.stderr || result.stdout || result.error}`,
        result,
        status: ffmpegStatus
      });
    }
    if (/Output file is empty|Conversion failed/i.test(`${result.stderr}\n${result.stdout}`)) {
      return sendJson(res, 500, {
        error: "動画GIF化が空出力で終了しました。開始秒、長さ、FPSを下げて試してください。",
        result,
        status: ffmpegStatus
      });
    }
    if (!await isFile(outputPath)) {
      return sendJson(res, 500, { error: "GIFの出力ファイルが見つかりません。", result, status: ffmpegStatus });
    }
    const outputStat = await fs.stat(outputPath);
    if (!outputStat.size) {
      return sendJson(res, 500, { error: "GIFの出力ファイルが空です。開始秒、長さ、FPSを調整して試してください。", result, status: ffmpegStatus });
    }
    const workFolder = safeFolderName(body.workName, "_未分類作品");
    const folderName = String(body.characterName || "").trim()
      ? safeFolderName(body.characterName, "_未割当")
      : safeFolderName(body.folderName || "_画像編集", "_画像編集");
    const destinationDir = path.join(uploadDir, workFolder, folderName);
    await fs.mkdir(destinationDir, { recursive: true });
    const destination = await uniqueFilePath(destinationDir, videoGifOutputName(body.name));
    await fs.copyFile(outputPath, destination);
    const savedStat = await fs.stat(destination);
    sendJson(res, 200, {
      url: uploadUrlFor(destination),
      path: destination,
      name: path.basename(destination),
      mimeType: "image/gif",
      provider: "ffmpeg",
      size: savedStat.size,
      settings: { frameRate, width, startTime, duration },
      result: {
        stdout: result.stdout,
        stderr: result.stderr,
        command: result.command
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `動画GIF化に失敗しました: ${error.message}` });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function normalizedAudioEditMode(value) {
  if (value === "cut" || value === "volume" || value === "pitch") return value;
  return "split";
}

function audioEditInputExt(parsed, name) {
  const parsedExt = String(parsed?.ext || "").toLowerCase();
  const nameExt = path.extname(String(name || "")).toLowerCase();
  if ([".mp3", ".wav"].includes(parsedExt)) return parsedExt;
  if ([".mp3", ".wav"].includes(nameExt)) return nameExt;
  return "";
}

function normalizedAudioEditOutputFormat(value, inputExt) {
  const clean = String(value || "source").trim().toLowerCase();
  if (clean === "mp3" || clean === "wav") return clean;
  return inputExt === ".mp3" ? "mp3" : "wav";
}

function audioEditOutputExt(format) {
  return format === "mp3" ? ".mp3" : ".wav";
}

function audioEditOutputMime(format) {
  return format === "mp3" ? "audio/mpeg" : "audio/wav";
}

function audioEditCodecArgs(format) {
  return format === "mp3"
    ? ["-acodec", "libmp3lame", "-b:a", "192k"]
    : ["-acodec", "pcm_s16le", "-ar", "44100"];
}

function audioEditSecond(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.round(number * 1000) / 1000);
}

const audioEditMinSegmentSeconds = 0.05;
const audioEditTailSnapSeconds = 0.15;

function normalizedAudioEditVolumePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.min(400, Math.max(0, Math.round(number)));
}

function normalizedAudioEditPitchSemitones(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(12, Math.max(-12, Math.round(number * 10) / 10));
}

function audioEditSignedNumberLabel(value) {
  const rounded = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rounded) || rounded === 0) return "0";
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return rounded > 0 ? `+${label}` : label;
}

function audioEditTimeLabel(value) {
  if (!Number.isFinite(Number(value))) return "末尾";
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : String(rounded);
}

function normalizedAudioEditSplitPoints(points, duration) {
  const source = Array.isArray(points)
    ? points
    : String(points || "").split(/[,\s]+/g);
  const max = Number.isFinite(duration) && duration > 0 ? duration : null;
  const values = source
    .map(audioEditSecond)
    .filter((value) => value !== null && value > 0.01 && (max === null || value < max - 0.01))
    .map((value) => Math.round(value * 1000) / 1000);
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function normalizedAudioEditCutRanges(ranges, duration) {
  const max = Number.isFinite(duration) && duration > 0 ? duration : null;
  const source = Array.isArray(ranges) ? ranges : [];
  const sorted = source.map((range) => {
    const start = audioEditSecond(range?.start);
    const end = audioEditSecond(range?.end);
    if (start === null || end === null) return null;
    let boundedStart = max === null ? start : Math.min(start, max);
    let boundedEnd = max === null ? end : Math.min(end, max);
    if (boundedStart <= audioEditMinSegmentSeconds) boundedStart = 0;
    if (max !== null && max - boundedEnd <= audioEditTailSnapSeconds) boundedEnd = max;
    if (boundedEnd <= boundedStart + 0.01) return null;
    return { start: boundedStart, end: boundedEnd };
  }).filter(Boolean).sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end + 0.001) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

function audioEditSegmentsForSplit(points, duration) {
  const segments = [];
  let start = 0;
  for (const point of points) {
    if (point > start + 0.01) segments.push({ start, end: point });
    start = point;
  }
  if (Number.isFinite(duration) && duration > 0) {
    if (duration > start + 0.01) segments.push({ start, end: duration });
  } else {
    segments.push({ start, end: null });
  }
  return segments;
}

function audioEditSegmentsForCut(ranges, duration) {
  const segments = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor + audioEditMinSegmentSeconds) segments.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (Number.isFinite(duration) && duration > 0) {
    if (duration > cursor + audioEditMinSegmentSeconds) segments.push({ start: cursor, end: duration });
  } else {
    segments.push({ start: cursor, end: null });
  }
  return segments;
}

function audioEditSegmentDuration(segment) {
  return Number.isFinite(segment.end) ? Math.max(0, segment.end - segment.start) : null;
}

function audioEditOutputName(sourceName, suffix, ext) {
  const base = cleanFileNamePart(path.parse(path.basename(String(sourceName || "audio"))).name, "audio", 70);
  return safeUploadName(`${base}-${suffix}`, ext);
}

async function probeAudioDuration(inputPath) {
  const result = await runProcess([
    "ffprobe",
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath
  ], {
    cwd: __dirname,
    timeoutMs: 30000,
    env: backgroundRemoverEnv()
  });
  if (!result.ok) return null;
  const duration = Number(String(result.stdout || "").trim());
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration * 1000) / 1000 : null;
}

async function runAudioEditSegment(inputPath, outputPath, segment, format) {
  const args = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning", "-i", inputPath];
  if (segment.start > 0) args.push("-ss", String(segment.start));
  const duration = audioEditSegmentDuration(segment);
  if (duration !== null) args.push("-t", String(duration));
  args.push("-vn", ...audioEditCodecArgs(format), outputPath);
  return await runProcess(args, {
    cwd: __dirname,
    timeoutMs: 30 * 60 * 1000,
    env: backgroundRemoverEnv()
  });
}

async function runAudioEditConcat(segmentPaths, outputPath, format) {
  const args = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning"];
  for (const segmentPath of segmentPaths) args.push("-i", segmentPath);
  const inputs = segmentPaths.map((_, index) => `[${index}:a:0]`).join("");
  args.push(
    "-filter_complex",
    `${inputs}concat=n=${segmentPaths.length}:v=0:a=1[a]`,
    "-map",
    "[a]",
    "-vn",
    ...audioEditCodecArgs(format),
    outputPath
  );
  return await runProcess(args, {
    cwd: __dirname,
    timeoutMs: 30 * 60 * 1000,
    env: backgroundRemoverEnv()
  });
}

async function runAudioEditVolume(inputPath, outputPath, format, volumePercent) {
  const volume = Math.round((volumePercent / 100) * 1000) / 1000;
  const args = [
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-i",
    inputPath,
    "-vn",
    "-af",
    `volume=${volume}`,
    ...audioEditCodecArgs(format),
    outputPath
  ];
  return await runProcess(args, {
    cwd: __dirname,
    timeoutMs: 30 * 60 * 1000,
    env: backgroundRemoverEnv()
  });
}

async function runAudioEditPitch(inputPath, outputPath, format, pitchSemitones) {
  const sourceRate = 44100;
  const factor = Math.pow(2, pitchSemitones / 12);
  const shiftedRate = Math.max(1, Math.round(sourceRate * factor));
  const tempo = Math.round((1 / factor) * 1000) / 1000;
  const args = [
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-i",
    inputPath,
    "-vn",
    "-af",
    `aresample=${sourceRate},asetrate=${shiftedRate},aresample=${sourceRate},atempo=${tempo}`,
    ...audioEditCodecArgs(format),
    outputPath
  ];
  return await runProcess(args, {
    cwd: __dirname,
    timeoutMs: 30 * 60 * 1000,
    env: backgroundRemoverEnv()
  });
}

function isAudioEditMp3FrameEncodeError(output) {
  const text = String(output || "");
  return /libmp3lame/i.test(text) && (
    /inadequate AVFrame plane padding/i.test(text)
    || /Error submitting audio frame to the encoder/i.test(text)
    || /Error encoding a frame:\s*Invalid argument/i.test(text)
    || /Task finished with error code:\s*-22/i.test(text)
  );
}

function audioEditMp3FrameEncodeHint(label) {
  const splitMatch = String(label || "").match(/分割ファイル(\d+)/);
  const splitHint = splitMatch
    ? `出力形式をwavに変更して再実行するか、分割ファイル${splitMatch[1]}の前後の分割秒を0.1〜0.5秒ほどずらして試してください。`
    : "出力形式をwavに変更して再実行するか、該当区間の開始/終了秒を0.1〜0.5秒ほどずらして試してください。";
  return `${label}に失敗しました。MP3の一部フレームをエンコードできなかった可能性があります。${splitHint}`;
}

async function ensureAudioEditOutput(result, outputPath, label) {
  const processOutput = `${result.stderr || ""}\n${result.stdout || ""}\n${result.error || ""}`;
  if (!result.ok) {
    if (isAudioEditMp3FrameEncodeError(processOutput)) {
      throw new Error(audioEditMp3FrameEncodeHint(label));
    }
    throw new Error(`${label}に失敗しました: ${result.stderr || result.stdout || result.error || "unknown error"}`);
  }
  if (/Output file is empty|Conversion failed/i.test(processOutput)) {
    throw new Error(`${label}が空出力で終了しました。秒数指定を確認してください。`);
  }
  if (!await isFile(outputPath)) throw new Error(`${label}の出力ファイルが見つかりません。`);
  const stat = await fs.stat(outputPath);
  if (!stat.size) throw new Error(`${label}の出力ファイルが空です。秒数指定を確認してください。`);
  return stat;
}

async function audioEditOutputInfo(filePath, format, segment = {}, extra = {}) {
  const stat = await fs.stat(filePath);
  return {
    url: audioUrlFor(filePath),
    path: filePath,
    name: path.basename(filePath),
    mimeType: audioEditOutputMime(format),
    format,
    size: stat.size,
    start: Number.isFinite(segment.start) ? segment.start : null,
    end: Number.isFinite(segment.end) ? segment.end : null,
    duration: Number.isFinite(segment.end) ? Math.max(0, segment.end - segment.start) : null,
    ...extra
  };
}

async function handleAudioEditStatus(req, res) {
  const tools = await checkFfmpeg();
  sendJson(res, 200, audioEditFfmpegStatus(tools));
}

async function handleAudioEditProcess(req, res) {
  const body = await readJson(req, 260 * 1024 * 1024);
  let parsed;
  try {
    parsed = parseDataUrl(body.dataUrl, ["audio"]);
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "mp3またはwavの音声 data URL が必要です。" });
  }

  const inputExt = audioEditInputExt(parsed, body.name);
  if (!inputExt) {
    return sendJson(res, 400, { error: "音声編集はmp3またはwavファイルに対応しています。" });
  }

  const tools = await checkFfmpeg();
  const ffmpegStatus = audioEditFfmpegStatus(tools);
  if (!ffmpegStatus.found) {
    return sendJson(res, 400, {
      error: `音声編集にはffmpegとffprobeが必要です。${ffmpegStatus.error || ""}`.trim(),
      status: ffmpegStatus
    });
  }

  const mode = normalizedAudioEditMode(body.mode);
  const format = normalizedAudioEditOutputFormat(body.outputFormat, inputExt);
  const outputExt = audioEditOutputExt(format);
  const sourceName = body.name || `audio${inputExt}`;
  const targetDir = await ensureAudioTargetDir(body);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "creative-file-studio-audio-edit-"));
  const inputPath = path.join(tempDir, safeOriginalFileName(sourceName, inputExt, "audio"));
  const createdOutputPaths = [];

  try {
    await fs.writeFile(inputPath, Buffer.from(parsed.base64, "base64"));
    const duration = await probeAudioDuration(inputPath);
    const outputs = [];

    if (mode === "volume") {
      const volumePercent = normalizedAudioEditVolumePercent(body.volumePercent);
      const destination = await uniqueFilePath(targetDir, audioEditOutputName(sourceName, `volume-${volumePercent}pct`, outputExt));
      createdOutputPaths.push(destination);
      const result = await runAudioEditVolume(inputPath, destination, format, volumePercent);
      await ensureAudioEditOutput(result, destination, "音量変更");
      const output = await audioEditOutputInfo(destination, format, { start: 0, end: duration }, {
        kind: "volume",
        index: 1,
        label: `音量 ${volumePercent}%`,
        volumePercent,
        result: { stdout: result.stdout, stderr: result.stderr, command: result.command }
      });
      return sendJson(res, 200, {
        mode,
        source: { name: sourceName, duration, mimeType: `${parsed.kind}/${parsed.subtype}` },
        settings: { volumePercent, outputFormat: format },
        outputs: [output],
        status: ffmpegStatus
      });
    }

    if (mode === "pitch") {
      const pitchSemitones = normalizedAudioEditPitchSemitones(body.pitchSemitones);
      const pitchLabel = audioEditSignedNumberLabel(pitchSemitones);
      const pitchSuffix = pitchLabel.replace("+", "plus").replace("-", "minus").replace(".", "p");
      const destination = await uniqueFilePath(targetDir, audioEditOutputName(sourceName, `pitch-${pitchSuffix}st`, outputExt));
      createdOutputPaths.push(destination);
      const result = await runAudioEditPitch(inputPath, destination, format, pitchSemitones);
      await ensureAudioEditOutput(result, destination, "ピッチ変更");
      const output = await audioEditOutputInfo(destination, format, { start: 0, end: duration }, {
        kind: "pitch",
        index: 1,
        label: `ピッチ ${pitchLabel}半音`,
        pitchSemitones,
        result: { stdout: result.stdout, stderr: result.stderr, command: result.command }
      });
      return sendJson(res, 200, {
        mode,
        source: { name: sourceName, duration, mimeType: `${parsed.kind}/${parsed.subtype}` },
        settings: { pitchSemitones, outputFormat: format },
        outputs: [output],
        status: ffmpegStatus
      });
    }

    if (mode === "split") {
      const splitPoints = normalizedAudioEditSplitPoints(body.splitPoints, duration);
      if (!splitPoints.length) {
        return sendJson(res, 400, { error: "分割点を1つ以上指定してください。", duration, status: ffmpegStatus });
      }
      const segments = audioEditSegmentsForSplit(splitPoints, duration);
      for (const [index, segment] of segments.entries()) {
        const suffix = `split-${String(index + 1).padStart(2, "0")}`;
        const destination = await uniqueFilePath(targetDir, audioEditOutputName(sourceName, suffix, outputExt));
        createdOutputPaths.push(destination);
        const result = await runAudioEditSegment(inputPath, destination, segment, format);
        await ensureAudioEditOutput(result, destination, `分割ファイル${index + 1}の作成`);
        outputs.push(await audioEditOutputInfo(destination, format, segment, {
          kind: "split",
          index: index + 1,
          label: `${audioEditTimeLabel(segment.start)}秒 - ${audioEditTimeLabel(segment.end)}秒`,
          result: { stdout: result.stdout, stderr: result.stderr, command: result.command }
        }));
      }
      return sendJson(res, 200, {
        mode,
        source: { name: sourceName, duration, mimeType: `${parsed.kind}/${parsed.subtype}` },
        settings: { splitPoints, outputFormat: format },
        outputs,
        status: ffmpegStatus
      });
    }

    const cutRanges = normalizedAudioEditCutRanges(body.cutRanges, duration);
    if (!cutRanges.length) {
      return sendJson(res, 400, { error: "カットする範囲を1つ以上指定してください。", duration, status: ffmpegStatus });
    }
    const keepSegments = audioEditSegmentsForCut(cutRanges, duration);
    if (!keepSegments.length) {
      return sendJson(res, 400, { error: "指定範囲をカットすると残る音声がありません。", duration, status: ffmpegStatus });
    }

    const destination = await uniqueFilePath(targetDir, audioEditOutputName(sourceName, "cut", outputExt));
    createdOutputPaths.push(destination);
    let result;
    if (keepSegments.length === 1) {
      result = await runAudioEditSegment(inputPath, destination, keepSegments[0], format);
    } else {
      const segmentPaths = [];
      for (const [index, segment] of keepSegments.entries()) {
        const segmentPath = path.join(tempDir, `keep-${String(index + 1).padStart(2, "0")}${outputExt}`);
        const segmentResult = await runAudioEditSegment(inputPath, segmentPath, segment, format);
        await ensureAudioEditOutput(segmentResult, segmentPath, `残す範囲${index + 1}の準備`);
        segmentPaths.push(segmentPath);
      }
      result = await runAudioEditConcat(segmentPaths, destination, format);
    }
    await ensureAudioEditOutput(result, destination, "不要範囲カット");
    const output = await audioEditOutputInfo(destination, format, {}, {
      kind: "cut",
      index: 1,
      label: `${cutRanges.map((range) => `${audioEditTimeLabel(range.start)}-${audioEditTimeLabel(range.end)}秒`).join(" / ")} をカット`,
      cutRanges,
      keepSegments,
      result: { stdout: result.stdout, stderr: result.stderr, command: result.command }
    });
    sendJson(res, 200, {
      mode,
      source: { name: sourceName, duration, mimeType: `${parsed.kind}/${parsed.subtype}` },
      settings: { cutRanges, outputFormat: format },
      outputs: [output],
      status: ffmpegStatus
    });
  } catch (error) {
    await Promise.all(createdOutputPaths.map((filePath) => fs.rm(filePath, { force: true }).catch(() => {})));
    sendJson(res, 502, { error: `音声編集に失敗しました: ${error.message}`, status: ffmpegStatus });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function handleTrashImportSource(req, res) {
  const payload = await readJson(req, 1024 * 1024);
  try {
    sendJson(res, 200, await trashImportedSource(payload));
  } catch (error) {
    sendJson(res, 200, { ok: false, trashed: false, skipped: true, reason: error.message });
  }
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

async function handleRevealAudio(req, res) {
  const { url } = await readJson(req);
  if (!url) return sendJson(res, 400, { error: "音声URLが必要です。" });
  const filePath = audioPathFromUrl(url);
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendJson(res, 404, { error: "音声ファイルが見つかりません。", missing: true, path: filePath });
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
  const body = await readJson(req);
  const { model, messages, response_format, temperature = 0.2, max_tokens = 1800 } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "OPENROUTER_API_KEY");
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
  const body = await readJson(req).catch(() => ({}));
  const apiKey = apiKeyFromRequest(body.apiKey, "OPENROUTER_API_KEY");
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

function normalizeAnimaDexBaseUrl(value = "") {
  const input = String(value || animaDexLocalBaseUrl).trim() || animaDexLocalBaseUrl;
  const raw = (/^https?:\/\//i.test(input) ? input : `http://${input}`).replace(/\/+$/g, "");
  const parsed = new URL(raw);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("AnimaDex API URL は http または https で指定してください。");
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/g, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.href.replace(/\/+$/g, "");
}

async function animaDexBaseUrlFromDb() {
  const db = await readDb();
  return normalizeAnimaDexBaseUrl(db.settings?.animadexBaseUrl);
}

function normalizeAnimaDexMode(value) {
  if (value === "artists") return "artists";
  if (value === "copyrights" || value === "works") return "copyrights";
  return "characters";
}

function normalizeAnimaDexSort(value, mode) {
  if (value === "az" || value === "random") return value;
  if (mode === "artists" && value === "score") return "score";
  return "count";
}

const animaDexFilterKeysByMode = {
  characters: ["character", "copyright", "hair_color", "hair_length", "eye_color", "gender"],
  artists: ["artist", "score", "category"],
  copyrights: []
};

function normalizeAnimaDexFilterValue(value) {
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 120)))]
    .slice(0, 24);
}

function normalizeAnimaDexFilters(body = {}, mode = "characters") {
  const filters = {};
  const source = body.filters && typeof body.filters === "object" ? body.filters : {};
  for (const key of animaDexFilterKeysByMode[mode] || []) {
    const value = normalizeAnimaDexFilterValue(source[key] ?? body[key]);
    if (value.length) filters[key] = value;
  }
  if (mode === "characters" && (body.loras === true || body.loras === "1" || body.lorasOnly === true)) {
    filters.loras = true;
  }
  return filters;
}

function animaDexMediaPathAllowed(pathname = "") {
  return /^\/(thumb|img)\/(characters|artists|copyrights)\//.test(pathname);
}

function animaDexOfficialMediaUrlAllowed(parsed) {
  return parsed.origin === animaDexBlobOrigin
    && /^\/(Outputs|ArtistOutputs|CopyrightOutputs)\//.test(parsed.pathname)
    && /\.(png|jpe?g|webp|gif)$/i.test(parsed.pathname);
}

function animaDexProxyUrl(value = "", baseUrl = "") {
  if (!value) return "";
  try {
    const base = new URL(`${baseUrl}/`);
    const parsed = new URL(value, base);
    if (animaDexOfficialMediaUrlAllowed(parsed)) {
      return `/api/animadex/media?${new URLSearchParams({ url: parsed.href }).toString()}`;
    }
    if (parsed.origin !== base.origin || !animaDexMediaPathAllowed(parsed.pathname)) return "";
    const params = new URLSearchParams({ path: parsed.pathname });
    const version = parsed.searchParams.get("v");
    if (version && /^\d+$/.test(version)) params.set("v", version);
    return `/api/animadex/media?${params.toString()}`;
  } catch {
    return "";
  }
}

function normalizeAnimaDexItem(item = {}, mode = "characters", baseUrl = "") {
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : [];
  return {
    key: `${mode}:${String(item.slug || item.name || item.trigger || "").trim()}`,
    mode,
    slug: String(item.slug || "").trim(),
    name: String(item.name || item.trigger || item.slug || "").trim(),
    copyright: String(item.copyright || "").trim(),
    copyrightName: String(item.copyright_name || item.copyrightName || "").trim(),
    trigger: String(item.trigger || item.name || "").trim(),
    tags,
    count: Number(item.count || 0) || 0,
    score: item.score === null || item.score === undefined ? null : Number(item.score),
    sourceUrl: String(item.url || "").trim(),
    thumbUrl: animaDexProxyUrl(item.thumb_url || item.thumbUrl, baseUrl),
    imgUrl: animaDexProxyUrl(item.img_url || item.imgUrl, baseUrl),
    loras: Array.isArray(item.loras) ? item.loras : [],
    rating: item.rating && typeof item.rating === "object"
      ? {
          up: Number(item.rating.up || 0) || 0,
          down: Number(item.rating.down || 0) || 0
        }
      : null,
    favoriteCount: Number(item.fav_count ?? item.favoriteCount ?? 0) || 0
  };
}

function compactAnimaDexCache() {
  while (animaDexSearchCache.size > 120) {
    const oldestKey = animaDexSearchCache.keys().next().value;
    if (!oldestKey) break;
    animaDexSearchCache.delete(oldestKey);
  }
}

function animaDexFilterCacheKey(filters = {}) {
  return JSON.stringify(Object.keys(filters).sort().map((key) => [key, filters[key]]));
}

function animaDexSearchCacheKey({ baseUrl, mode, query, sort, page, seed, filters }) {
  return [baseUrl, mode, query, sort, page, seed || "", animaDexFilterCacheKey(filters)].join("\n");
}

function appendAnimaDexFilterParams(endpoint, filters = {}) {
  for (const [key, value] of Object.entries(filters)) {
    if (key === "loras" && value === true) {
      endpoint.searchParams.set("loras", "1");
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      const text = String(item || "").trim();
      if (text) endpoint.searchParams.append(key, text);
    }
  }
}

async function fetchAnimaDexSearchPayload({ baseUrl, mode, sort, page, query, seed, filters }) {
  const endpoint = new URL(`/api/${mode}/search`, `${baseUrl}/`);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("sort", sort);
  endpoint.searchParams.set("page", String(page));
  appendAnimaDexFilterParams(endpoint, filters);
  if (sort === "random" && seed) endpoint.searchParams.set("seed", String(seed).slice(0, 24));
  const cacheable = sort !== "random" || Boolean(seed);
  const cacheKey = animaDexSearchCacheKey({ baseUrl, mode, query, sort, page, seed, filters });
  const cached = cacheable ? animaDexSearchCache.get(cacheKey) : null;
  if (cached && Date.now() - cached.createdAt < animaDexSearchCacheTtlMs) {
    return { payload: cached.payload, status: 200, fromCache: true, endpoint };
  }
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": "CreativeFileStudio/0.1 AnimaDex integration"
    },
    signal: AbortSignal.timeout(20000)
  });
  const payload = await comfyJson(response);
  if (response.ok && cacheable) {
    animaDexSearchCache.set(cacheKey, { createdAt: Date.now(), payload });
    compactAnimaDexCache();
  }
  return { payload, status: response.status, fromCache: false, endpoint };
}

async function fetchAnimaDexFacetsPayload({ baseUrl, mode }) {
  const endpoint = new URL(`/api/${mode}/facets`, `${baseUrl}/`);
  const cacheKey = ["facets", baseUrl, mode].join("\n");
  const cached = animaDexSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < animaDexSearchCacheTtlMs) {
    return { payload: cached.payload, status: 200, fromCache: true, endpoint };
  }
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": "CreativeFileStudio/0.1 AnimaDex integration"
    },
    signal: AbortSignal.timeout(20000)
  });
  const payload = await comfyJson(response);
  if (response.ok) {
    animaDexSearchCache.set(cacheKey, { createdAt: Date.now(), payload });
    compactAnimaDexCache();
  }
  return { payload, status: response.status, fromCache: false, endpoint };
}

function normalizeAnimaDexFacetValue(value = {}) {
  return {
    value: String(value.value || "").trim(),
    label: String(value.label || value.value || "").trim(),
    count: Number(value.count || 0) || 0
  };
}

function normalizeAnimaDexFacets(payload = {}) {
  const facets = {};
  const source = payload.facets && typeof payload.facets === "object" ? payload.facets : {};
  for (const [key, facet] of Object.entries(source)) {
    facets[key] = {
      label: String(facet?.label || key).trim(),
      total: Number(facet?.total || 0) || 0,
      values: Array.isArray(facet?.values)
        ? facet.values.map(normalizeAnimaDexFacetValue).filter((item) => item.value)
        : []
    };
  }
  return facets;
}

function readableAnimaDexFetchError(error, baseUrl = "") {
  if (error?.name === "TimeoutError") {
    return `AnimaDex の応答が20秒以内に返りませんでした。設定URL: ${baseUrl}`;
  }
  const code = String(error?.cause?.code || error?.code || "").trim();
  if (code === "ECONNREFUSED" || /fetch failed/i.test(String(error?.message || ""))) {
    if (baseUrl === normalizeAnimaDexBaseUrl(animaDexOfficialBaseUrl)) {
      return `AnimaDex公式APIに接続できません。設定URL: ${baseUrl}`;
    }
    return `AnimaDexに接続できません。AnimaDex本体が起動しているか、設定画面のAnimaDex API URL（現在: ${baseUrl}）を確認してください。`;
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return `AnimaDex API URLのホスト名を解決できません。設定URL: ${baseUrl}`;
  }
  return `AnimaDexへの接続に失敗しました。設定URL: ${baseUrl} / ${error.message}`;
}

async function handleAnimaDexSearch(req, res) {
  const body = await readJson(req, 128 * 1024).catch(() => ({}));
  let baseUrl;
  try {
    baseUrl = await animaDexBaseUrlFromDb();
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
  const mode = normalizeAnimaDexMode(body.mode);
  const sort = normalizeAnimaDexSort(body.sort, mode);
  const page = Math.max(1, Math.min(999, Number.parseInt(body.page || "1", 10) || 1));
  const query = String(body.q || body.query || "").trim().slice(0, 240);
  const filters = normalizeAnimaDexFilters(body, mode);
  const officialBaseUrl = normalizeAnimaDexBaseUrl(animaDexOfficialBaseUrl);
  const targets = baseUrl === officialBaseUrl ? [baseUrl] : [baseUrl, officialBaseUrl];
  const failures = [];
  for (const targetBaseUrl of targets) {
    try {
      const { payload, status, fromCache } = await fetchAnimaDexSearchPayload({
        baseUrl: targetBaseUrl,
        mode,
        sort,
        page,
        query,
        seed: body.seed,
        filters
      });
      if (status < 200 || status >= 300) {
        const message = readableProviderError(payload) || `AnimaDex が ${status} を返しました。`;
        failures.push(`${targetBaseUrl}: ${message}`);
        if (targetBaseUrl !== targets.at(-1)) continue;
        return sendJson(res, status, {
          error: `AnimaDex検索に失敗しました: ${failures.join(" / ")}`,
          providerPayload: payload,
          fallbackErrors: failures
        });
      }
      const results = (Array.isArray(payload.results) ? payload.results : [])
        .map((item) => normalizeAnimaDexItem(item, mode, targetBaseUrl));
      return sendJson(res, 200, {
        ok: true,
        source: "animadex",
        baseUrl: targetBaseUrl,
        preferredBaseUrl: baseUrl,
        fallback: targetBaseUrl !== baseUrl,
        fromCache,
        mode,
        q: query,
        sort,
        filters,
        page: Number(payload.page || page) || page,
        pageSize: Number(payload.page_size || payload.pageSize || results.length) || results.length,
        total: Number(payload.total || results.length) || 0,
        pages: Number(payload.pages || 1) || 1,
        results,
        fallbackErrors: targetBaseUrl !== baseUrl ? failures : [],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      failures.push(`${targetBaseUrl}: ${readableAnimaDexFetchError(error, targetBaseUrl)}`);
    }
  }
  sendJson(res, 502, { error: `AnimaDex検索に失敗しました: ${failures.join(" / ")}` });
}

async function handleAnimaDexFacets(req, res) {
  const body = await readJson(req, 128 * 1024).catch(() => ({}));
  let baseUrl;
  try {
    baseUrl = await animaDexBaseUrlFromDb();
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
  const mode = normalizeAnimaDexMode(body.mode);
  const officialBaseUrl = normalizeAnimaDexBaseUrl(animaDexOfficialBaseUrl);
  const targets = baseUrl === officialBaseUrl ? [baseUrl] : [baseUrl, officialBaseUrl];
  const failures = [];
  for (const targetBaseUrl of targets) {
    try {
      const { payload, status, fromCache } = await fetchAnimaDexFacetsPayload({ baseUrl: targetBaseUrl, mode });
      if (status < 200 || status >= 300) {
        const message = readableProviderError(payload) || `AnimaDex が ${status} を返しました。`;
        failures.push(`${targetBaseUrl}: ${message}`);
        if (targetBaseUrl !== targets.at(-1)) continue;
        return sendJson(res, status, {
          error: `AnimaDex検索条件の取得に失敗しました: ${failures.join(" / ")}`,
          providerPayload: payload,
          fallbackErrors: failures
        });
      }
      return sendJson(res, 200, {
        ok: true,
        source: "animadex",
        baseUrl: targetBaseUrl,
        preferredBaseUrl: baseUrl,
        fallback: targetBaseUrl !== baseUrl,
        fromCache,
        mode,
        total: Number(payload.total || 0) || 0,
        facets: normalizeAnimaDexFacets(payload),
        fallbackErrors: targetBaseUrl !== baseUrl ? failures : [],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      failures.push(`${targetBaseUrl}: ${readableAnimaDexFetchError(error, targetBaseUrl)}`);
    }
  }
  sendJson(res, 502, { error: `AnimaDex検索条件の取得に失敗しました: ${failures.join(" / ")}` });
}

async function handleAnimaDexMedia(req, res, url) {
  let baseUrl;
  try {
    baseUrl = await animaDexBaseUrlFromDb();
  } catch (error) {
    return sendText(res, 400, error.message);
  }
  let remoteUrl;
  const directUrl = String(url.searchParams.get("url") || "");
  if (directUrl) {
    try {
      const parsed = new URL(directUrl);
      if (!animaDexOfficialMediaUrlAllowed(parsed)) return sendText(res, 403, "Forbidden");
      remoteUrl = parsed;
    } catch {
      return sendText(res, 400, "Invalid media URL");
    }
  }
  const pathname = String(url.searchParams.get("path") || "");
  if (!remoteUrl) {
    if (!animaDexMediaPathAllowed(pathname)) return sendText(res, 403, "Forbidden");
    remoteUrl = new URL(pathname, `${baseUrl}/`);
    const version = url.searchParams.get("v");
    if (version && /^\d+$/.test(version)) remoteUrl.searchParams.set("v", version);
  }
  try {
    const response = await fetch(remoteUrl, {
      headers: { accept: "image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) return sendText(res, response.status, "AnimaDex media not found");
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) return sendText(res, 415, "Unsupported media type");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.writeHead(200, {
      "content-type": contentType,
      "content-length": buffer.length,
      "cache-control": "public, max-age=300"
    });
    res.end(buffer);
  } catch (error) {
    sendText(res, 502, readableAnimaDexFetchError(error, baseUrl));
  }
}

function normalizeSeedanceBaseUrl(value) {
  const raw = String(value || "https://ark.ap-southeast.bytepluses.com/api/v3").trim().replace(/\/+$/g, "");
  if (raw.includes("replicate.com")) {
    try {
      const parsed = new URL(raw);
      const versionIndex = parsed.pathname.split("/").findIndex((part) => part === "v1");
      parsed.pathname = versionIndex >= 0 ? "/v1" : "/v1";
      parsed.search = "";
      parsed.hash = "";
      return parsed.href.replace(/\/+$/g, "");
    } catch {
      return "https://api.replicate.com/v1";
    }
  }
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
  const text = String(value || "");
  if (text.includes("replicate.com")) return "replicate";
  return text.includes("openrouter.ai") ? "openrouter" : "official";
}

function seedanceApiKeyFromRequest(value, baseUrl) {
  const provider = seedanceProviderFromBaseUrl(baseUrl);
  if (provider === "openrouter") return apiKeyFromRequest(value, "OPENROUTER_API_KEY", "SEEDANCE_API_KEY");
  if (provider === "replicate") return apiKeyFromRequest(value, "REPLICATE_API_TOKEN", "REPLICATE_API_KEY", "SEEDANCE_API_KEY");
  return apiKeyFromRequest(value, "SEEDANCE_API_KEY", "BYTEPLUS_API_KEY");
}

function normalizeSeedanceStatus(status) {
  if (status === "starting") return "pending";
  if (status === "processing") return "running";
  if (status === "completed") return "succeeded";
  if (status === "canceled") return "cancelled";
  return status || "";
}

function normalizeProgressValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    value = Number(match[0]);
  }
  if (typeof value === "object") {
    return normalizeProgressValue(value.progress ?? value.percent ?? value.percentage ?? value.value);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const percent = number > 0 && number <= 1 ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function extractSeedanceProgress(payload) {
  const candidates = [
    payload?.progress,
    payload?.percent,
    payload?.percentage,
    payload?.data?.progress,
    payload?.data?.percent,
    payload?.data?.percentage,
    payload?.task?.progress,
    payload?.task?.percent,
    payload?.output?.progress,
    payload?.result?.progress
  ];
  for (const candidate of candidates) {
    const progress = normalizeProgressValue(candidate);
    if (progress !== null) return progress;
  }
  return null;
}

function extractSeedanceProgressMessage(payload) {
  return payload?.progress_message
    || payload?.progressMessage
    || payload?.message
    || payload?.data?.progress_message
    || payload?.data?.progressMessage
    || payload?.data?.message
    || "";
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

async function resolveSeedanceReferenceUrl(reference) {
  const url = String(reference.url || "");
  return url.startsWith("/") ? await localUploadAsDataUrl(url) : url;
}

async function buildReplicateVideoPayload(options) {
  const {
    prompt,
    ratio,
    duration,
    resolution,
    generateAudio,
    seed,
    references = []
  } = options;
  const input = {
    prompt,
    duration: Number(duration),
    resolution,
    aspect_ratio: ratio,
    generate_audio: Boolean(generateAudio)
  };
  if (Number(seed) >= 0) input.seed = Number(seed);

  const referenceImages = [];
  const referenceVideos = [];
  const referenceAudios = [];
  for (const reference of references) {
    const resolvedUrl = await resolveSeedanceReferenceUrl(reference);
    if (reference.role === "first_frame") {
      input.image = resolvedUrl;
    } else if (reference.role === "last_frame") {
      input.last_frame_image = resolvedUrl;
    } else if (reference.kind === "image") {
      referenceImages.push(resolvedUrl);
    } else if (reference.kind === "video") {
      referenceVideos.push(resolvedUrl);
    } else if (reference.kind === "audio") {
      referenceAudios.push(resolvedUrl);
    }
  }
  if ((input.image || input.last_frame_image) && (referenceImages.length || referenceVideos.length || referenceAudios.length)) {
    throw new Error("Replicateでは開始/終了フレーム指定と参照素材モードを同時に送れません。モードを切り替えてください。");
  }
  if (referenceAudios.length && !referenceImages.length && !referenceVideos.length) {
    throw new Error("Replicateで参照音声を使う場合は、参照画像または参照動画も一緒に選択してください。");
  }
  if (referenceImages.length) input.reference_images = referenceImages;
  if (referenceVideos.length) input.reference_videos = referenceVideos;
  if (referenceAudios.length) input.reference_audios = referenceAudios;
  return { input };
}

function replicatePredictionEndpoint(baseUrl, model) {
  const base = normalizeSeedanceBaseUrl(baseUrl);
  const modelPath = String(model || "").trim().replace(/^\/?models\//, "").replace(/\/+$/g, "");
  const parts = modelPath.split("/").filter(Boolean).map(encodeURIComponent);
  if (parts.length < 2) throw new Error("Replicate model は owner/model 形式で指定してください。");
  return `${base}/models/${parts.join("/")}/predictions`;
}

function replicatePredictionStatusEndpoint(baseUrl, taskId) {
  return `${normalizeSeedanceBaseUrl(baseUrl)}/predictions/${encodeURIComponent(taskId)}`;
}

function scrubMediaValue(value) {
  if (typeof value === "string") return value.startsWith("data:") ? "[local data url]" : value;
  if (Array.isArray(value)) return value.map(scrubMediaValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, scrubMediaValue(child)]));
  }
  return value;
}

function scrubSeedanceRequestPayload(payload) {
  return scrubMediaValue(payload);
}

function extractTaskId(payload) {
  return payload?.id || payload?.task_id || payload?.taskId || payload?.data?.id || payload?.data?.task_id || "";
}

function firstVideoOutput(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstVideoOutput(item);
      if (url) return url;
    }
    return "";
  }
  if (typeof value === "object") {
    return value.url || value.video_url || value.videoUrl || value.file || value.src || "";
  }
  return "";
}

function extractVideoUrl(payload) {
  const candidates = [
    firstVideoOutput(payload?.output),
    payload?.unsigned_urls?.[0],
    payload?.content?.video_url,
    payload?.content?.videoUrl,
    payload?.content?.url,
    payload?.video_url,
    payload?.videoUrl,
    payload?.url,
    firstVideoOutput(payload?.data?.output),
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
  if (responseFormat === "wav") return ".wav";
  if (responseFormat === "ogg") return ".ogg";
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
  const body = await readJson(req, 2 * 1024 * 1024);
  const {
    model = "google/gemini-3.1-flash-tts-preview",
    input,
    voice = "Kore",
    responseFormat = "mp3",
    speed,
    title = "generated-audio"
  } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "OPENROUTER_API_KEY");
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
    const targetDir = await ensureAudioTargetDir(body);
    const filePath = path.join(targetDir, fileName);
    if (saveAsWav) {
      const pcmBuffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, pcmToWavBuffer(pcmBuffer));
    } else {
      await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
    }
    const stat = await fs.stat(filePath);
    sendJson(res, 200, {
      url: audioUrlFor(filePath),
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
  const body = await readJson(req, 256 * 1024);
  const apiKey = apiKeyFromRequest(body.apiKey, "ELEVENLABS_API_KEY");
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
  const body = await readJson(req, 256 * 1024);
  const apiKey = apiKeyFromRequest(body.apiKey, "ELEVENLABS_API_KEY");
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
  const body = await readJson(req, 2 * 1024 * 1024);
  const {
    voiceId,
    modelId = "eleven_multilingual_v2",
    input,
    outputFormat = "mp3_44100_128",
    title = "elevenlabs-audio",
    languageCode = "",
    seed,
    voiceSettings = {}
  } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "ELEVENLABS_API_KEY");
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
    const targetDir = await ensureAudioTargetDir(body);
    const filePath = path.join(targetDir, fileName);
    if (savePcmAsWav) {
      const pcmBuffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, pcmToWavBuffer(pcmBuffer, { sampleRate: sampleRateFromElevenLabsFormat(cleanOutputFormat) }));
    } else {
      await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
    }
    const stat = await fs.stat(filePath);
    sendJson(res, 200, {
      url: audioUrlFor(filePath),
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

const defaultVoiceboxBaseUrl = "http://127.0.0.1:17493";

function normalizeVoiceboxBaseUrl(value) {
  const fallback = defaultVoiceboxBaseUrl;
  const raw = String(value || fallback).trim() || fallback;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  const parsed = new URL(withProtocol);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/g, "");
  return parsed.href.replace(/\/$/g, "");
}

function voiceboxEndpoint(baseUrl, pathname) {
  return `${normalizeVoiceboxBaseUrl(baseUrl)}${pathname}`;
}

async function jsonFromProviderResponse(response, fallbackMessage) {
  const text = await response.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || fallbackMessage };
  }
}

function normalizeVoiceboxProfile(profile = {}) {
  const id = profile.id || profile.profile_id || profile.profileId || "";
  return {
    id,
    name: profile.name || id,
    description: profile.description || "",
    language: profile.language || "",
    voiceType: profile.voice_type || profile.voiceType || "",
    defaultEngine: profile.default_engine || profile.defaultEngine || "",
    presetEngine: profile.preset_engine || profile.presetEngine || "",
    presetVoiceId: profile.preset_voice_id || profile.presetVoiceId || "",
    createdAt: profile.created_at || profile.createdAt || "",
    updatedAt: profile.updated_at || profile.updatedAt || ""
  };
}

async function handleVoiceboxProfiles(req, res) {
  const { baseUrl } = await readJson(req, 256 * 1024);
  let endpoint;
  try {
    endpoint = voiceboxEndpoint(baseUrl, "/profiles");
  } catch (error) {
    return sendJson(res, 400, { error: `Voicebox URL が不正です: ${error.message}` });
  }

  try {
    const response = await fetch(endpoint, {
      headers: { "accept": "application/json" },
      signal: AbortSignal.timeout(30000)
    });
    const payload = await jsonFromProviderResponse(response, `Voicebox profiles API が ${response.status} を返しました。`);
    if (!response.ok) {
      return sendJson(res, response.status, {
        ...payload,
        error: readableProviderError(payload.error) || readableProviderError(payload) || `Voicebox profiles API が ${response.status} を返しました。`,
        providerError: payload.error || payload
      });
    }
    const source = Array.isArray(payload) ? payload : Array.isArray(payload.profiles) ? payload.profiles : Array.isArray(payload.items) ? payload.items : [];
    const profiles = source.map(normalizeVoiceboxProfile).filter((profile) => profile.id);
    sendJson(res, 200, {
      baseUrl: normalizeVoiceboxBaseUrl(baseUrl),
      profiles,
      raw: payload
    });
  } catch (error) {
    sendJson(res, 502, {
      error: `Voicebox に接続できません: ${error.message}`,
      hint: "Voiceboxアプリを起動し、API URL（通常 http://127.0.0.1:17493）を確認してください。"
    });
  }
}

async function saveVoiceboxAudioResponse(response, title, fallbackFormat = "wav", target = {}) {
  const contentType = response.headers.get("content-type") || "";
  const ext = extensionFromAudioResponse(contentType, fallbackFormat === "pcm" ? "pcm" : "wav");
  const saveAsWav = ext === ".pcm";
  const fileName = safeUploadName(title, saveAsWav ? ".wav" : ext);
  const targetDir = await ensureAudioTargetDir(target);
  const filePath = path.join(targetDir, fileName);
  if (saveAsWav) {
    const pcmBuffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, pcmToWavBuffer(pcmBuffer));
  } else {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
  }
  const stat = await fs.stat(filePath);
  return {
    url: audioUrlFor(filePath),
    path: filePath,
    mimeType: saveAsWav ? "audio/wav" : contentType || mimeForExtension(ext),
    format: saveAsWav ? "wav" : ext.replace(".", "") || fallbackFormat,
    size: stat.size
  };
}

async function saveVoiceboxLocalAudio(audioPath, title, target = {}) {
  const resolved = path.resolve(String(audioPath || ""));
  if (!await isFile(resolved)) throw new Error("Voiceboxの出力ファイルを読み込めませんでした。");
  const ext = [".mp3", ".m4a", ".wav", ".ogg", ".webm", ".flac"].includes(path.extname(resolved).toLowerCase())
    ? path.extname(resolved).toLowerCase()
    : ".wav";
  const fileName = safeUploadName(title, ext);
  const targetDir = await ensureAudioTargetDir(target);
  const filePath = path.join(targetDir, fileName);
  await pipeline(createReadStream(resolved), createWriteStream(filePath));
  const stat = await fs.stat(filePath);
  return {
    url: audioUrlFor(filePath),
    path: filePath,
    mimeType: mimeForExtension(ext),
    format: ext.replace(".", "") || "wav",
    size: stat.size
  };
}

function voiceboxAudioUrlFromPayload(payload, baseUrl) {
  const raw = payload?.audio_url || payload?.audioUrl || payload?.url || payload?.file || payload?.src || "";
  if (!raw) return "";
  try {
    return new URL(raw, `${normalizeVoiceboxBaseUrl(baseUrl)}/`).href;
  } catch {
    return "";
  }
}

async function handleVoiceboxSpeech(req, res) {
  const body = await readJson(req, 2 * 1024 * 1024);
  const {
    baseUrl,
    profileId,
    input,
    language = "ja",
    seed,
    modelSize = "1.7B",
    instruct = "",
    title = "voicebox-audio"
  } = body;
  const cleanInput = String(input || "").trim();
  const cleanProfileId = String(profileId || "").trim();
  const cleanLanguage = String(language || "ja").trim() || "ja";
  const cleanModelSize = String(modelSize || "").trim();
  const cleanInstruct = String(instruct || "").trim();
  if (!cleanProfileId) return sendJson(res, 400, { error: "Voicebox profile ID が未設定です。" });
  if (!cleanInput) return sendJson(res, 400, { error: "読み上げテキストが必要です。" });

  let normalizedBaseUrl;
  try {
    normalizedBaseUrl = normalizeVoiceboxBaseUrl(baseUrl);
  } catch (error) {
    return sendJson(res, 400, { error: `Voicebox URL が不正です: ${error.message}` });
  }

  const requestPayload = {
    profile_id: cleanProfileId,
    text: cleanInput,
    language: cleanLanguage
  };
  const seedText = String(seed || "").trim();
  if (/^-?\d+$/.test(seedText)) requestPayload.seed = Number(seedText);
  if (cleanModelSize) requestPayload.model_size = cleanModelSize;
  if (cleanInstruct) requestPayload.instruct = cleanInstruct;

  try {
    const response = await fetch(voiceboxEndpoint(normalizedBaseUrl, "/generate"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json,audio/*,*/*"
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(45 * 60 * 1000)
    });
    const contentType = response.headers.get("content-type") || "";
    if (contentType.toLowerCase().startsWith("audio/")) {
      if (!response.ok) {
        return sendJson(res, response.status, { error: `Voicebox generate API が ${response.status} を返しました。` });
      }
      const saved = await saveVoiceboxAudioResponse(response, title, "wav", body);
      return sendJson(res, 200, {
        ...saved,
        generationId: response.headers.get("x-generation-id") || "",
        providerPayload: null,
        request: {
          ...requestPayload,
          text: cleanInput.length > 1200 ? `${cleanInput.slice(0, 1200)}...` : cleanInput
        }
      });
    }

    const payload = await jsonFromProviderResponse(response, `Voicebox generate API が ${response.status} を返しました。`);
    if (!response.ok) {
      return sendJson(res, response.status, {
        ...payload,
        error: readableProviderError(payload.error) || readableProviderError(payload) || `Voicebox generate API が ${response.status} を返しました。`,
        providerError: payload.error || payload
      });
    }

    const generationId = payload.id || payload.generation_id || payload.generationId || "";
    let saved;
    const audioUrl = voiceboxAudioUrlFromPayload(payload, normalizedBaseUrl);
    if (audioUrl) {
      const audioResponse = await fetch(audioUrl, {
        headers: { "accept": "audio/*,*/*" },
        signal: AbortSignal.timeout(120000)
      });
      if (!audioResponse.ok) {
        const audioPayload = await jsonFromProviderResponse(audioResponse, `Voicebox audio API が ${audioResponse.status} を返しました。`);
        throw new Error(readableProviderError(audioPayload.error) || readableProviderError(audioPayload) || `Voicebox audio API が ${audioResponse.status} を返しました。`);
      }
      saved = await saveVoiceboxAudioResponse(audioResponse, title, "wav", body);
    } else if (generationId) {
      const audioResponse = await fetch(voiceboxEndpoint(normalizedBaseUrl, `/audio/${encodeURIComponent(generationId)}`), {
        headers: { "accept": "audio/*,*/*" },
        signal: AbortSignal.timeout(120000)
      });
      if (!audioResponse.ok) {
        const audioPayload = await jsonFromProviderResponse(audioResponse, `Voicebox audio API が ${audioResponse.status} を返しました。`);
        throw new Error(readableProviderError(audioPayload.error) || readableProviderError(audioPayload) || `Voicebox audio API が ${audioResponse.status} を返しました。`);
      }
      saved = await saveVoiceboxAudioResponse(audioResponse, title, "wav", body);
    } else if (payload.audio_path || payload.audioPath) {
      saved = await saveVoiceboxLocalAudio(payload.audio_path || payload.audioPath, title, body);
    } else {
      throw new Error("Voiceboxの生成結果に音声IDまたは音声ファイル情報がありません。");
    }

    sendJson(res, 200, {
      ...saved,
      generationId,
      duration: payload.duration ?? null,
      providerPayload: payload,
      request: {
        ...requestPayload,
        text: cleanInput.length > 1200 ? `${cleanInput.slice(0, 1200)}...` : cleanInput
      }
    });
  } catch (error) {
    sendJson(res, 502, { error: `Voicebox 音声生成に失敗しました: ${error.message}` });
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
  const targetDir = await ensureAudioTargetDir(body);
  const outputName = safeUploadName(title, ".wav");
  const outputPath = path.join(targetDir, outputName);
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

function voxcpmMode(value) {
  const clean = String(value || "").trim();
  return ["VoiceDesign", "Reference", "HiFi"].includes(clean) ? clean : "VoiceDesign";
}

function voxcpmDevice(value) {
  const clean = String(value || "cpu").trim().toLowerCase();
  if (/^cuda(?::\d+)?$/.test(clean)) return clean;
  return ["auto", "cpu", "mps"].includes(clean) ? clean : "cpu";
}

function voxcpmFailureMessage(result = {}) {
  const text = `${result.stderr || ""}\n${result.stdout || ""}\n${result.error || ""}`;
  if (/MPS backend out of memory/i.test(text)) {
    return "VoxCPM 音声生成に失敗しました: MacのMPS/GPUメモリ不足です。VoxCPMのデバイスを cpu に変更して再試行してください。";
  }
  if (/No space left on device/i.test(text)) {
    return "VoxCPM 音声生成に失敗しました: ディスク空き容量が不足しています。vendor/VoxCPM/hf-cache と空き容量を確認してください。";
  }
  if (/Connection|Read timed out|NameResolution|Temporary failure|Failed to establish/i.test(text)) {
    return "VoxCPM 音声生成に失敗しました: モデル取得中のネットワーク接続に失敗しました。通信が安定した状態で再試行してください。";
  }
  return `VoxCPM 音声生成に失敗しました: ${result.error || result.stderr || "unknown error"}`;
}

async function handleVoxcpmStatus(req, res) {
  const { appDir } = await readJson(req, 256 * 1024);
  const workspace = await resolveVoxcpmWorkspace(appDir);
  const uv = await findUvCommand();
  const pythonCandidates = [];
  for (const command of [process.env.VOXCPM_PYTHON, "python3.12", "python3.11", "python3.10", "python3"].filter(Boolean)) {
    const result = await runProcess([command, "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"], { timeoutMs: 10000 });
    if (result.ok) pythonCandidates.push({ command, version: result.stdout.trim() });
  }
  return sendJson(res, 200, {
    ...workspace,
    uvFound: Boolean(uv),
    uvCommand: uv ? commandLabel(uv.command) : "",
    uvVersion: uv?.version || "",
    pythonCandidates,
    setupScript: voxcpmSetupScriptPath,
    suggestedPath: path.relative(__dirname, voxcpmVendorDir) || voxcpmVendorDir
  });
}

async function handleVoxcpmSetup(req, res) {
  const exists = await isFile(voxcpmSetupScriptPath);
  if (!exists) return sendJson(res, 404, { error: "VoxCPM セットアップスクリプトが見つかりません。" });
  const result = await runProcess(["bash", voxcpmSetupScriptPath], { cwd: __dirname, timeoutMs: 45 * 60 * 1000 });
  const workspace = await resolveVoxcpmWorkspace(voxcpmVendorDir);
  return sendJson(res, result.ok ? 200 : 500, {
    ok: result.ok,
    error: result.ok ? "" : `VoxCPM セットアップに失敗しました: ${result.error || result.stderr || "unknown error"}`,
    workspace,
    result
  });
}

async function handleVoxcpmSpeech(req, res) {
  const body = await readJson(req, 4 * 1024 * 1024);
  const cleanInput = String(body.input || "").trim();
  const title = String(body.title || "voxcpm-audio").trim() || "voxcpm-audio";
  if (!cleanInput) return sendJson(res, 400, { error: "読み上げテキストが必要です。" });

  const workspace = await resolveVoxcpmWorkspace(body.appDir);
  if (!workspace.found) {
    return sendJson(res, 400, {
      error: "VoxCPM が見つかりません。設定画面でパスを指定するか、VoxCPM をセットアップしてください。",
      workspace
    });
  }
  if (!await isFile(voxcpmRunScriptPath)) {
    return sendJson(res, 500, { error: "VoxCPM 実行スクリプトが見つかりません。" });
  }

  const mode = voxcpmMode(body.mode);
  const voicePrompt = String(body.voicePrompt || body.control || "").trim();
  const promptText = String(body.promptText || "").trim();
  let referencePath = "";
  if (body.referenceAudioUrl) {
    try {
      referencePath = localMediaPathFromUrl(body.referenceAudioUrl);
      await fs.access(referencePath);
    } catch (error) {
      return sendJson(res, 400, { error: `参照音声を読み込めません: ${error.message}` });
    }
  }
  if (mode === "Reference" && !referencePath) {
    return sendJson(res, 400, { error: "VoxCPMの参照音声クローンには参照音声が必要です。" });
  }
  if (mode === "HiFi" && (!referencePath || !promptText)) {
    return sendJson(res, 400, { error: "VoxCPMの高精度クローンには参照音声と参照音声の文字起こしが必要です。" });
  }

  const cfgValue = boundedNumber(body.cfgValue, 2, 1, 3);
  const inferenceTimesteps = boundedNumber(body.inferenceTimesteps, 10, 4, 30, true);
  const device = voxcpmDevice(body.device);
  const modelId = String(body.modelId || "openbmb/VoxCPM2").trim() || "openbmb/VoxCPM2";
  const targetDir = await ensureAudioTargetDir(body);
  const outputPath = path.join(targetDir, safeUploadName(title, ".wav"));
  await fs.mkdir(workspace.cacheDir, { recursive: true });

  const args = [
    workspace.pythonPath,
    voxcpmRunScriptPath,
    "--model-id",
    modelId,
    "--text",
    cleanInput,
    "--output-wav",
    outputPath,
    "--mode",
    mode,
    "--cfg-value",
    String(cfgValue),
    "--inference-timesteps",
    String(inferenceTimesteps),
    "--device",
    device,
    "--cache-dir",
    workspace.cacheDir
  ];
  if (voicePrompt) args.push("--voice-prompt", voicePrompt);
  if (referencePath) args.push("--reference-wav", referencePath);
  if (mode === "HiFi") args.push("--prompt-wav", referencePath, "--prompt-text", promptText);
  if (body.normalize !== false) args.push("--normalize");
  if (body.denoise === true) args.push("--denoise");
  if (body.noOptimize !== false) args.push("--no-optimize");

  const result = await runProcess(args, {
    cwd: workspace.appDir,
    timeoutMs: 45 * 60 * 1000,
    env: {
      HF_HOME: path.join(workspace.appDir, "hf-home"),
      HF_HUB_CACHE: workspace.cacheDir
    }
  });
  if (!result.ok) {
    return sendJson(res, 500, {
      error: voxcpmFailureMessage(result),
      result
    });
  }
  if (!await isFile(outputPath)) {
    return sendJson(res, 500, {
      error: "VoxCPM は完了しましたが、出力 WAV が見つかりませんでした。",
      result
    });
  }

  const stat = await fs.stat(outputPath);
  sendJson(res, 200, {
    url: audioUrlFor(outputPath),
    path: outputPath,
    mimeType: "audio/wav",
    format: "wav",
    size: stat.size,
    request: {
      provider: "voxcpm",
      mode,
      voicePrompt,
      promptText: mode === "HiFi" ? promptText.slice(0, 1200) : "",
      modelId,
      device,
      noOptimize: body.noOptimize !== false,
      normalize: body.normalize !== false,
      denoise: body.denoise === true,
      cfgValue,
      inferenceTimesteps,
      referenceAudio: Boolean(referencePath),
      input: cleanInput.length > 1200 ? `${cleanInput.slice(0, 1200)}...` : cleanInput
    },
    result
  });
}

function misottsMode(value) {
  return String(value || "").trim() === "Prompted" ? "Prompted" : "Text";
}

function misottsDevice(value) {
  const clean = String(value || "auto").trim().toLowerCase();
  return ["auto", "cpu", "cuda"].includes(clean) ? clean : "auto";
}

function misottsDtype(value) {
  const clean = String(value || "bfloat16").trim().toLowerCase();
  return ["bfloat16", "float16", "float32"].includes(clean) ? clean : "bfloat16";
}

function misottsFailureMessage(result = {}) {
  const text = `${result.stderr || ""}\n${result.stdout || ""}\n${result.error || ""}`;
  if (/CUDA is not available/i.test(text)) {
    return "MisoTTS 音声生成に失敗しました: CUDA GPU が見つかりません。デバイスを cpu または auto に変更してください。";
  }
  if (/out of memory|CUDA out of memory/i.test(text)) {
    return "MisoTTS 音声生成に失敗しました: GPU/メモリが不足しています。最大音声長を短くするか、cpu で再試行してください。";
  }
  if (/No space left on device/i.test(text)) {
    return "MisoTTS 音声生成に失敗しました: ディスク空き容量が不足しています。vendor/MisoTTS/hf-cache と空き容量を確認してください。";
  }
  if (/401|403|gated|token|authentication|Unauthorized/i.test(text)) {
    return "MisoTTS 音声生成に失敗しました: Hugging Face のモデル取得に認証または利用許諾が必要な可能性があります。HF_TOKEN を設定し、モデルページの利用条件を確認してください。";
  }
  if (/Connection|Read timed out|NameResolution|Temporary failure|Failed to establish|timed out/i.test(text)) {
    return "MisoTTS 音声生成に失敗しました: モデル取得中のネットワーク接続に失敗しました。通信が安定した状態で再試行してください。";
  }
  return `MisoTTS 音声生成に失敗しました: ${result.error || result.stderr || "unknown error"}`;
}

async function handleMisoTtsStatus(req, res) {
  const { appDir } = await readJson(req, 256 * 1024);
  const workspace = await resolveMisoTtsWorkspace(appDir);
  const uv = await findUvCommand();
  const pythonCandidates = [];
  for (const command of [process.env.MISOTTS_PYTHON, "python3.10", "python3.11", "python3.12", "python3"].filter(Boolean)) {
    const result = await runProcess([command, "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"], { timeoutMs: 10000 });
    if (result.ok) pythonCandidates.push({ command, version: result.stdout.trim() });
  }
  return sendJson(res, 200, {
    ...workspace,
    uvFound: Boolean(uv),
    uvCommand: uv ? commandLabel(uv.command) : "",
    uvVersion: uv?.version || "",
    pythonCandidates,
    setupScript: misottsSetupScriptPath,
    suggestedPath: path.relative(__dirname, misottsVendorDir) || misottsVendorDir
  });
}

async function handleMisoTtsSetup(req, res) {
  const exists = await isFile(misottsSetupScriptPath);
  if (!exists) return sendJson(res, 404, { error: "MisoTTS セットアップスクリプトが見つかりません。" });
  const result = await runProcess(["bash", misottsSetupScriptPath], { cwd: __dirname, timeoutMs: 60 * 60 * 1000 });
  const workspace = await resolveMisoTtsWorkspace(misottsVendorDir);
  return sendJson(res, result.ok ? 200 : 500, {
    ok: result.ok,
    error: result.ok ? "" : `MisoTTS セットアップに失敗しました: ${result.error || result.stderr || "unknown error"}`,
    workspace,
    result
  });
}

async function handleMisoTtsSpeech(req, res) {
  const body = await readJson(req, 4 * 1024 * 1024);
  const cleanInput = String(body.input || "").trim();
  const title = String(body.title || "misotts-audio").trim() || "misotts-audio";
  if (!cleanInput) return sendJson(res, 400, { error: "読み上げテキストが必要です。" });

  const workspace = await resolveMisoTtsWorkspace(body.appDir);
  if (!workspace.found) {
    return sendJson(res, 400, {
      error: "MisoTTS が見つかりません。設定画面でパスを指定するか、MisoTTS をセットアップしてください。",
      workspace
    });
  }
  if (!await isFile(misottsRunScriptPath)) {
    return sendJson(res, 500, { error: "MisoTTS 実行スクリプトが見つかりません。" });
  }

  const mode = misottsMode(body.mode);
  const promptText = String(body.promptText || "").trim();
  let referencePath = "";
  if (body.referenceAudioUrl) {
    try {
      referencePath = localMediaPathFromUrl(body.referenceAudioUrl);
      await fs.access(referencePath);
    } catch (error) {
      return sendJson(res, 400, { error: `参照音声を読み込めません: ${error.message}` });
    }
  }
  if (mode === "Prompted" && (!referencePath || !promptText)) {
    return sendJson(res, 400, { error: "MisoTTSのPrompted生成には参照音声と、その参照音声の英語文字起こしが必要です。" });
  }

  const speaker = boundedNumber(body.speaker, 0, 0, 999, true);
  const promptSpeaker = boundedNumber(body.promptSpeaker, 0, 0, 999, true);
  const maxAudioLengthMs = boundedNumber(body.maxAudioLengthMs, 10000, 1000, 90000, true);
  const temperature = boundedNumber(body.temperature, 0.9, 0.1, 2);
  const topk = boundedNumber(body.topk, 50, 1, 200, true);
  const modelSource = String(body.modelSource || "MisoLabs/MisoTTS").trim() || "MisoLabs/MisoTTS";
  const device = misottsDevice(body.device);
  const dtype = misottsDtype(body.dtype);
  const targetDir = await ensureAudioTargetDir(body);
  const outputPath = path.join(targetDir, safeUploadName(title, ".wav"));
  await fs.mkdir(workspace.cacheDir, { recursive: true });
  await fs.mkdir(workspace.hfHomeDir, { recursive: true });

  const args = [
    workspace.pythonPath,
    misottsRunScriptPath,
    "--app-dir",
    workspace.appDir,
    "--model-source",
    modelSource,
    "--text",
    cleanInput,
    "--output-wav",
    outputPath,
    "--mode",
    mode,
    "--speaker",
    String(speaker),
    "--prompt-speaker",
    String(promptSpeaker),
    "--max-audio-length-ms",
    String(maxAudioLengthMs),
    "--temperature",
    String(temperature),
    "--topk",
    String(topk),
    "--device",
    device,
    "--dtype",
    dtype
  ];
  if (referencePath) args.push("--prompt-wav", referencePath);
  if (mode === "Prompted") args.push("--prompt-text", promptText);

  const result = await runProcess(args, {
    cwd: workspace.appDir,
    timeoutMs: 60 * 60 * 1000,
    env: {
      HF_HOME: workspace.hfHomeDir,
      HF_HUB_CACHE: workspace.cacheDir,
      PYTHONUNBUFFERED: "1",
      NO_TORCH_COMPILE: "1"
    }
  });
  if (!result.ok) {
    return sendJson(res, 500, {
      error: misottsFailureMessage(result),
      result
    });
  }
  if (!await isFile(outputPath)) {
    return sendJson(res, 500, {
      error: "MisoTTS は完了しましたが、出力 WAV が見つかりませんでした。",
      result
    });
  }

  const stat = await fs.stat(outputPath);
  sendJson(res, 200, {
    url: audioUrlFor(outputPath),
    path: outputPath,
    mimeType: "audio/wav",
    format: "wav",
    size: stat.size,
    request: {
      provider: "misotts",
      mode,
      speaker,
      promptSpeaker,
      promptText: mode === "Prompted" ? promptText.slice(0, 1200) : "",
      modelSource,
      device,
      dtype,
      maxAudioLengthMs,
      temperature,
      topk,
      referenceAudio: Boolean(referencePath),
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

const modelDownloadJobs = new Map();
const modelLibraryExtensions = new Set([".safetensors", ".ckpt", ".pt", ".pth", ".bin"]);
const modelLibraryBaseModels = new Map([
  ["flux", "Flux"],
  ["flux.1", "Flux"],
  ["flux1", "Flux"],
  ["flux.1 d", "Flux"],
  ["flux.1 dev", "Flux"],
  ["flux1 dev", "Flux"],
  ["flux dev", "Flux"],
  ["flux.1 s", "Flux"],
  ["flux.1 schnell", "Flux"],
  ["flux1 schnell", "Flux"],
  ["flux schnell", "Flux"],
  ["qwen", "Qwen"],
  ["qwen image", "Qwen"],
  ["qwen-image", "Qwen"],
  ["qwen image edit", "Qwen"],
  ["qwen-image-edit", "Qwen"],
  ["qwen img", "Qwen"],
  ["ltx", "LTX"],
  ["ltxv", "LTX"],
  ["ltx video", "LTX"],
  ["ltx-video", "LTX"],
  ["illustrious", "Illustrious"],
  ["illustius", "Illustrious"],
  ["ilxl", "Illustrious"],
  ["pony", "Pony"],
  ["ponyxl", "Pony"],
  ["anima", "Anima"],
  ["noobai", "NoobAI"],
  ["noob ai", "NoobAI"],
  ["noob-ai", "NoobAI"],
  ["noob_ai", "NoobAI"],
  ["sdxl", "SDXL 1.0"],
  ["sdxl 1.0", "SDXL 1.0"],
  ["stable diffusion xl", "SDXL 1.0"],
  ["sd 1.5", "SD 1.5"],
  ["sd1.5", "SD 1.5"],
  ["sd15", "SD 1.5"],
  ["1.5", "SD 1.5"],
  ["stable diffusion 1.5", "SD 1.5"],
  ["other", "Other"],
  ["others", "Other"],
  ["その他", "Other"]
]);

function modelLibraryTypeFromValue(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (["lora", "lo-ra"].includes(text)) return "LORA";
  if (["vae", "vaes", "autoencoder"].includes(text)) return "VAE";
  if (["checkpoint", "checkpoints", "model", "models", "ckpt"].includes(text)) return "Checkpoint";
  if (["controlnet", "control-net"].includes(text)) return "Controlnet";
  if (["textualinversion", "textual-inversion", "embedding"].includes(text)) return "TextualInversion";
  return "";
}

function modelLibraryKindFromType(value = "") {
  const type = modelLibraryTypeFromValue(value);
  if (type === "LORA") return "lora";
  if (type === "VAE") return "vae";
  return "checkpoint";
}

function normalizeModelLibraryBaseModel(value = "") {
  const text = String(value || "").trim();
  if (!text || ["all", "any", "すべて"].includes(text.toLowerCase())) return "";
  return modelLibraryBaseModels.get(text.toLowerCase()) || text;
}

function modelLibraryBaseModelQueryValues(value = "") {
  const baseModel = normalizeModelLibraryBaseModel(value);
  if (!baseModel) return [];
  if (baseModel === "Flux") return ["Flux.1 D", "Flux.1 S", "Flux"];
  if (baseModel === "Qwen") return ["Qwen Image", "Qwen Image Edit", "Qwen"];
  if (baseModel === "LTX") return ["LTXV", "LTX Video", "LTX"];
  return [baseModel];
}

function normalizeModelLibraryLoraCategory(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (!text || ["all", "any", "すべて"].includes(text)) return "";
  if (["style", "styles"].includes(text)) return "style";
  if (["character", "characters", "char", "chars", "chaacter"].includes(text)) return "character";
  if (["effects", "effect", "effexcts", "fx", "vfx"].includes(text)) return "effects";
  if (["pose", "poses", "posture"].includes(text)) return "pose";
  if (["quality", "qulity", "enhance", "enhancer"].includes(text)) return "quality";
  if (["i2i", "img2img", "image2image", "image-to-image", "image to image"].includes(text)) return "i2i";
  return "";
}

function inferModelLibraryLoraCategoryFromText(...values) {
  const text = values.map((value) => String(value || "")).join(" ").toLowerCase();
  if (/(^|[\s_.-])styles?(?=$|[\s_.-])|画風/.test(text)) return "style";
  if (/(^|[\s_.-])(characters?|chars?)(?=$|[\s_.-])|キャラ/.test(text)) return "character";
  if (/(^|[\s_.-])(effects?|effexcts|fx|vfx)(?=$|[\s_.-])|エフェクト/.test(text)) return "effects";
  if (/(^|[\s_.-])(poses?|posture)(?=$|[\s_.-])|ポーズ/.test(text)) return "pose";
  if (/(^|[\s_.-])(quality|qulity|enhance|enhancer|detailer)(?=$|[\s_.-])|品質/.test(text)) return "quality";
  if (/(^|[\s_.-])(i2i|img2img|image2image|image[\s_.-]*to[\s_.-]*image)(?=$|[\s_.-])/.test(text)) return "i2i";
  return "";
}

function modelLibraryProviderFromValue(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (["comfy", "comfyui", "comfy-ui"].includes(text)) return "comfy";
  if (text === "forge") return "forge";
  if (["forge-neo", "forge_neo", "forgeneo", "neo"].includes(text)) return "forge-neo";
  if (["drawthings", "draw-things", "draw_things", "draw things"].includes(text)) return "drawthings";
  return "";
}

function inferModelLibraryBaseModelFromText(...values) {
  const text = values.map((value) => String(value || "")).join(" ").toLowerCase();
  if (/(^|[\s_.-])(flux(?:[\s_.-]*1)?|flux1)(?=$|[\s_.-])/.test(text)) return "Flux";
  if (/(^|[\s_.-])qwen(?:[\s_.-]*(image|img|edit))?(?=$|[\s_.-])/.test(text)) return "Qwen";
  if (/(^|[\s_.-])(ltxv?|ltx[\s_.-]*video)(?=$|[\s_.-])/.test(text)) return "LTX";
  if (/illustrious|illustius|(^|[\s_.-])ilxl(?=$|[\s_.-])/.test(text)) return "Illustrious";
  if (/pony/.test(text)) return "Pony";
  if (/(^|[\s_.-])anima(?=$|[\s_.-])/.test(text)) return "Anima";
  if (/(^|[\s_.-])noob[\s_.-]*ai(?=$|[\s_.-])|noobai/.test(text)) return "NoobAI";
  if (/(^|[\s_.-])(sdxl|stable[\s_.-]*diffusion[\s_.-]*xl)(?=$|[\s_.-])/.test(text)) return "SDXL 1.0";
  if (/(^|[\s_.-])(sd[\s_.-]*1[\s_.-]*5|sd15|stable[\s_.-]*diffusion[\s_.-]*1[\s_.-]*5)(?=$|[\s_.-])/.test(text)) return "SD 1.5";
  if (/(^|[\s_.-])others?(?=$|[\s_.-])|その他/.test(text)) return "Other";
  return "";
}

async function pathIsDirectory(value = "") {
  try {
    return (await fs.stat(value)).isDirectory();
  } catch {
    return false;
  }
}

async function firstExistingDirectory(candidates = []) {
  for (const candidate of candidates) {
    if (candidate && await pathIsDirectory(candidate)) return candidate;
  }
  return "";
}

function modelLibraryStandardSubdir(kind = "checkpoint", provider = "") {
  const target = modelLibraryProviderFromValue(provider);
  if (target === "comfy") {
    if (kind === "lora") return ["models", "loras"];
    if (kind === "vae") return ["models", "vae"];
    return ["models", "checkpoints"];
  }
  if (target === "forge" || target === "forge-neo") {
    if (kind === "lora") return ["models", "Lora"];
    if (kind === "vae") return ["models", "VAE"];
    return ["models", "Stable-diffusion"];
  }
  if (target === "drawthings") return ["Models"];
  return [];
}

async function modelLibraryStandardRoot(provider = "") {
  const target = modelLibraryProviderFromValue(provider);
  const home = os.homedir();
  if (target === "comfy") {
    return await firstExistingDirectory([
      path.join(home, "Documents", "ComfyUI"),
      path.join(home, "ComfyUI"),
      path.join(home, "Library", "Application Support", "ComfyUI")
    ]);
  }
  if (target === "forge") {
    return await firstExistingDirectory([
      path.join(home, "stable-diffusion-webui-forge"),
      path.join(home, "sd-webui-forge"),
      path.join(home, "Documents", "stable-diffusion-webui-forge"),
      path.join(home, "Documents", "sd-webui-forge")
    ]);
  }
  if (target === "forge-neo") {
    return await firstExistingDirectory([
      path.join(home, "sd-webui-forge-neo"),
      path.join(home, "stable-diffusion-webui-forge-neo"),
      path.join(home, "Documents", "sd-webui-forge-neo"),
      path.join(home, "Documents", "stable-diffusion-webui-forge-neo")
    ]);
  }
  if (target === "drawthings") return drawThingsDocumentsDir();
  return "";
}

function modelLibraryProviderLabelForError(provider = "") {
  const target = modelLibraryProviderFromValue(provider);
  if (target === "comfy") return "ComfyUI";
  if (target === "forge") return "Forge";
  if (target === "forge-neo") return "Forge Neo";
  if (target === "drawthings") return "Draw Things";
  return "保存先プラットフォーム";
}

async function defaultModelLibraryDir(kind = "checkpoint", provider = "") {
  const target = modelLibraryProviderFromValue(provider);
  if (!target) throw new Error("保存先プラットフォームを選択してください。");
  if (target === "drawthings") {
    const documentsDir = drawThingsDocumentsDir();
    if (documentsDir && await pathIsDirectory(documentsDir)) return path.join(documentsDir, "Models");
  }
  const root = await modelLibraryStandardRoot(target);
  const subdir = modelLibraryStandardSubdir(kind, target);
  if (!root || !subdir.length) {
    throw new Error(`${modelLibraryProviderLabelForError(target)} の標準フォルダが見つかりません。アプリ本体の配置を確認してください。`);
  }
  return path.join(root, ...subdir);
}

function expandUserPath(value = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text === "~") return os.homedir();
  if (text.startsWith("~/")) return path.join(os.homedir(), text.slice(2));
  return text;
}

async function resolveModelLibraryDir(kind, requested = "", provider = "") {
  const expanded = expandUserPath(requested);
  if (!expanded) return await defaultModelLibraryDir(kind, provider);
  return path.resolve(expanded);
}

function safeModelFileName(value = "", fallback = "model.safetensors") {
  const parsed = path.parse(path.basename(String(value || fallback).split("?")[0]));
  const base = cleanFileNamePart(parsed.name, "model", 140);
  const ext = String(parsed.ext || "").toLowerCase();
  return `${base}${modelLibraryExtensions.has(ext) ? ext : ".safetensors"}`;
}

function fileNameFromContentDisposition(value = "") {
  const text = String(value || "");
  const encoded = text.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      return encoded.replace(/^"|"$/g, "");
    }
  }
  return text.match(/filename="?([^";]+)"?/i)?.[1] || "";
}

function lastUrlPathSegment(value = "") {
  const text = String(value || "").split(/[?#]/)[0].replace(/\\/g, "/");
  const segment = text.split("/").filter(Boolean).pop() || "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function modelLibraryHeaders(apiKey = "", extra = {}) {
  const headers = { ...extra };
  const key = String(apiKey || "").trim();
  if (key) headers.authorization = `Bearer ${key}`;
  return headers;
}

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function civitaiSearchUrl(body = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(boundedNumber(body.limit, 24, 1, 80, true)));
  const query = String(body.query || "").trim();
  const tag = String(body.tag || "").trim();
  const cursor = String(body.cursor || "").trim();
  const type = modelLibraryTypeFromValue(body.type);
  const baseModels = modelLibraryBaseModelQueryValues(body.baseModel);
  const sort = String(body.sort || "Most Downloaded").trim();
  const period = String(body.period || "Month").trim();
  if (cursor) {
    params.set("cursor", cursor);
  } else if (!query && !tag) {
    params.set("page", String(boundedNumber(body.page, 1, 1, 1000, true)));
  }
  if (query) params.set("query", query);
  if (tag) params.set("tag", normalizeModelLibraryLoraCategory(tag) || tag);
  if (type) params.set("types", type);
  baseModels.forEach((baseModel) => params.append("baseModels", baseModel));
  if (["Highest Rated", "Most Downloaded", "Newest"].includes(sort)) params.set("sort", sort);
  if (["AllTime", "Year", "Month", "Week", "Day"].includes(period)) params.set("period", period);
  params.set("primaryFileOnly", "true");
  return `https://civitai.com/api/v1/models?${params.toString()}`;
}

function civitaiPrimaryVersion(model = {}, preferredBaseModel = "") {
  const versions = Array.isArray(model.modelVersions) ? model.modelVersions : [];
  const baseModel = normalizeModelLibraryBaseModel(preferredBaseModel);
  if (baseModel) {
    const matched = versions.find((version) => {
      const file = civitaiPrimaryFile(version);
      return normalizeModelLibraryBaseModel(version.baseModel || file.metadata?.baseModel) === baseModel;
    });
    if (matched) return matched;
  }
  return versions[0] || {};
}

function civitaiPrimaryFile(version = {}) {
  const files = Array.isArray(version.files) ? version.files : [];
  return files.find((file) => file.primary)
    || files.find((file) => String(file.format || "").toLowerCase().includes("safe"))
    || files[0]
    || {};
}

function civitaiFileSizeKb(file = {}) {
  const size = Number(file.sizeKb ?? file.sizeKB ?? file.size_kb ?? 0);
  return Number.isFinite(size) ? size : 0;
}

function normalizeCivitaiImage(image = {}) {
  return {
    url: String(image.url || "").trim(),
    width: Number(image.width || 0) || 0,
    height: Number(image.height || 0) || 0,
    type: String(image.type || "").trim(),
    nsfw: image.nsfw === true || String(image.nsfw || "").toLowerCase() === "true",
    meta: image.meta || null
  };
}

function civitaiModelImages(model = {}, primaryVersion = {}) {
  const versions = Array.isArray(model.modelVersions) ? model.modelVersions : [];
  const primaryId = String(primaryVersion.id || "");
  const ordered = [
    primaryVersion,
    ...versions.filter((version) => String(version.id || "") !== primaryId)
  ].filter((version) => version && Object.keys(version).length);
  const seen = new Set();
  const images = [];
  for (const version of ordered) {
    for (const image of (Array.isArray(version.images) ? version.images : [])) {
      const normalized = normalizeCivitaiImage(image);
      if (!normalized.url || /^video/i.test(normalized.type) || seen.has(normalized.url)) continue;
      seen.add(normalized.url);
      images.push(normalized);
      if (images.length >= 8) return images;
    }
  }
  return images;
}

function normalizeCivitaiModel(model = {}, { preferredBaseModel = "", preferredCategory = "" } = {}) {
  const version = civitaiPrimaryVersion(model, preferredBaseModel);
  const file = civitaiPrimaryFile(version);
  const type = modelLibraryTypeFromValue(model.type) || String(model.type || "Checkpoint");
  const versionId = String(version.id || "");
  const modelId = String(model.id || "");
  const images = civitaiModelImages(model, version);
  const trainedWords = Array.isArray(version.trainedWords) ? version.trainedWords.map(String).filter(Boolean) : [];
  return {
    key: `civitai:${modelId}:${versionId || "latest"}`,
    source: "civitai",
    sourceLabel: "Civitai",
    modelId,
    versionId,
    name: String(model.name || "").trim(),
    type,
    creator: String(model.creator?.username || "").trim(),
    tags: Array.isArray(model.tags) ? model.tags.map(String).filter(Boolean).slice(0, 14) : [],
    nsfw: model.nsfw === true,
    mode: model.mode || "",
    versionName: String(version.name || "").trim(),
    baseModel: normalizeModelLibraryBaseModel(version.baseModel || file.metadata?.baseModel || preferredBaseModel),
    category: type === "LORA"
      ? (normalizeModelLibraryLoraCategory(preferredCategory)
        || inferModelLibraryLoraCategoryFromText(model.name, version.name, model.creator?.username, ...(model.tags || []), ...(trainedWords || [])))
      : "",
    description: stripHtml(model.description || version.description || ""),
    versionDescription: stripHtml(version.description || ""),
    trainedWords,
    downloadUrl: String(version.downloadUrl || file.downloadUrl || "").trim(),
    fileName: String(file.name || "").trim(),
    fileSizeKb: civitaiFileSizeKb(file),
    fileFormat: String(file.format || "").trim(),
    pickleScanResult: String(file.pickleScanResult || "").trim(),
    virusScanResult: String(file.virusScanResult || "").trim(),
    stats: {
      downloads: Number(model.stats?.downloadCount || version.stats?.downloadCount || 0) || 0,
      favorites: Number(model.stats?.favoriteCount || 0) || 0,
      rating: Number(model.stats?.rating || version.stats?.rating || 0) || 0,
      ratingCount: Number(model.stats?.ratingCount || version.stats?.ratingCount || 0) || 0
    },
    allowNoCredit: model.allowNoCredit,
    allowDerivatives: model.allowDerivatives,
    allowDifferentLicenses: model.allowDifferentLicenses,
    allowCommercialUse: model.allowCommercialUse || "",
    images,
    pageUrl: modelId ? `https://civitai.com/models/${encodeURIComponent(modelId)}` : ""
  };
}

function modelLibraryMatureItem(item = {}) {
  if (item.nsfw === true) return true;
  const text = [item.name, ...(item.tags || [])].join(" ").toLowerCase();
  return /(^|[\s_\-])(nsfw|nude|naked|porn|xxx|sex|vagina|boobs)([\s_\-]|$)/i.test(text);
}

async function listModelLibraryFiles(dir, type, maxDepth = 4) {
  const root = path.resolve(dir);
  const items = [];
  async function visit(current, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const filePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(filePath, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!modelLibraryExtensions.has(ext)) continue;
      const stat = await fs.stat(filePath).catch(() => null);
      const relativePath = path.relative(root, filePath);
      items.push({
        key: `local:${type}:${relativePath}`,
        source: "local",
        sourceLabel: "Local",
        type,
        name: entry.name,
        versionName: "local",
        fileName: entry.name,
        localPath: filePath,
        relativePath,
        baseModel: inferModelLibraryBaseModelFromText(entry.name, relativePath),
        category: modelLibraryTypeFromValue(type) === "LORA" ? inferModelLibraryLoraCategoryFromText(entry.name, relativePath) : "",
        fileSizeKb: stat ? Math.round(stat.size / 1024) : 0,
        updatedAt: stat ? stat.mtime.toISOString() : "",
        installed: true
      });
    }
  }
  await visit(root, 0);
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

function modelLibraryFileNameLooksVae(value = "") {
  return /(^|[_\-.])vae([_\-.]|$)/i.test(String(value || ""));
}

async function listDrawThingsModelLibraryFileGroups() {
  const documentsDir = drawThingsDocumentsDir();
  if (!documentsDir) return { checkpoints: [], loras: [], vaes: [] };
  const modelsDir = path.join(documentsDir, "Models");
  const [items, loras] = await Promise.all([
    listModelLibraryFiles(modelsDir, "Checkpoint", 1),
    localDrawThingsLoras().catch(() => [])
  ]);
  const loraNames = new Set(loras.map((name) => String(name || "").trim()));
  const groups = { checkpoints: [], loras: [], vaes: [] };
  items.forEach((item) => {
    const name = item.fileName || item.name || "";
    const knownLora = loraNames.has(name);
    const nameLooksLora = /(^|[_\-.])lora([_\-.]|$)/i.test(name);
    const nameLooksVae = modelLibraryFileNameLooksVae(name) || modelLibraryFileNameLooksVae(item.relativePath);
    if (knownLora || nameLooksLora) {
      groups.loras.push({
        ...item,
        key: `local:LORA:${item.relativePath}`,
        type: "LORA",
        category: inferModelLibraryLoraCategoryFromText(item.name, item.relativePath)
      });
    } else if (nameLooksVae) {
      groups.vaes.push({
        ...item,
        key: `local:VAE:${item.relativePath}`,
        type: "VAE"
      });
    } else {
      groups.checkpoints.push(item);
    }
  });
  return groups;
}

async function listDrawThingsModelLibraryFiles(type) {
  const groups = await listDrawThingsModelLibraryFileGroups();
  const targetType = modelLibraryTypeFromValue(type);
  if (targetType === "LORA") return groups.loras;
  if (targetType === "VAE") return groups.vaes;
  return groups.checkpoints;
}

async function handleModelLibraryLocal(req, res) {
  const body = await readJson(req, 1024 * 1024).catch(() => ({}));
  const provider = modelLibraryProviderFromValue(body.provider);
  if (!provider) return sendJson(res, 400, { error: "保存先プラットフォームを選択してください。" });
  try {
    const checkpointDir = await resolveModelLibraryDir("checkpoint", "", provider);
    const loraDir = await resolveModelLibraryDir("lora", "", provider);
    const vaeDir = await resolveModelLibraryDir("vae", "", provider);
    const useDrawThingsDefault = provider === "drawthings";
    let checkpoints = [];
    let loras = [];
    let vaes = [];
    if (useDrawThingsDefault) {
      ({ checkpoints, loras, vaes } = await listDrawThingsModelLibraryFileGroups());
    } else {
      [checkpoints, loras, vaes] = await Promise.all([
        listModelLibraryFiles(checkpointDir, "Checkpoint"),
        listModelLibraryFiles(loraDir, "LORA"),
        listModelLibraryFiles(vaeDir, "VAE")
      ]);
    }
    sendJson(res, 200, {
      ok: true,
      provider,
      dirs: { checkpointDir, loraDir, vaeDir },
      checkpoints,
      loras,
      vaes,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function handleModelLibrarySearch(req, res) {
  const body = await readJson(req, 1024 * 1024).catch(() => ({}));
  const apiKey = apiKeyFromRequest(body.apiKey, "CIVITAI_API_KEY");
  const preferredBaseModel = normalizeModelLibraryBaseModel(body.baseModel);
  const preferredCategory = normalizeModelLibraryLoraCategory(body.tag);
  try {
    const response = await fetch(civitaiSearchUrl(body), {
      headers: modelLibraryHeaders(apiKey, { accept: "application/json" }),
      signal: AbortSignal.timeout(30000)
    });
    const payload = await comfyJson(response);
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: readableProviderError(payload) || `Civitai API が ${response.status} を返しました。`,
        providerPayload: payload
      });
    }
    const includeNsfw = body.includeNsfw === true;
    const items = (Array.isArray(payload.items) ? payload.items : [])
      .map((model) => normalizeCivitaiModel(model, { preferredBaseModel, preferredCategory }))
      .filter((item) => includeNsfw || !modelLibraryMatureItem(item));
    sendJson(res, 200, {
      ok: true,
      source: "civitai",
      items,
      metadata: payload.metadata || {},
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 502, { error: `モデルカタログ検索に失敗しました: ${error.message}` });
  }
}

function modelLibraryDownloadUrlAllowed(value = "") {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:"
      && parsed.hostname.endsWith("civitai.com")
      && parsed.pathname.startsWith("/api/download/models/");
  } catch {
    return false;
  }
}

function modelDownloadSnapshot(job = {}) {
  return {
    id: job.id,
    status: job.status,
    type: job.type,
    provider: job.provider || "",
    name: job.name,
    fileName: job.fileName,
    targetPath: job.targetPath,
    receivedBytes: job.receivedBytes || 0,
    totalBytes: job.totalBytes || 0,
    error: job.error || "",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

function modelLibraryExpectedBytes(body = {}) {
  const directBytes = Number(body.expectedBytes || 0);
  if (Number.isFinite(directBytes) && directBytes > 0) return Math.round(directBytes);
  const sizeKb = Number(body.expectedSizeKb || body.fileSizeKb || 0);
  if (Number.isFinite(sizeKb) && sizeKb > 0) return Math.round(sizeKb * 1024);
  return 0;
}

async function runModelLibraryDownload(job, request) {
  try {
    job.status = "downloading";
    job.updatedAt = new Date().toISOString();
    const apiKey = apiKeyFromRequest(request.apiKey, "CIVITAI_API_KEY");
    const response = await fetch(request.downloadUrl, {
      headers: modelLibraryHeaders(apiKey),
      signal: AbortSignal.timeout(60 * 60 * 1000)
    });
    if (!response.ok) {
      const payload = await comfyJson(response).catch(() => ({}));
      throw new Error(readableProviderError(payload) || `ダウンロード元が ${response.status} を返しました。`);
    }
    const type = modelLibraryTypeFromValue(request.type) || "Checkpoint";
    const kind = modelLibraryKindFromType(type);
    const provider = modelLibraryProviderFromValue(request.provider);
    if (!provider) throw new Error("保存先プラットフォームを選択してください。");
    const targetDir = await resolveModelLibraryDir(kind, "", provider);
    await fs.mkdir(targetDir, { recursive: true });
    const dispositionName = fileNameFromContentDisposition(response.headers.get("content-disposition") || "");
    const requestedName = request.fileName || dispositionName || lastUrlPathSegment(request.downloadUrl) || `${request.name || "model"}.safetensors`;
    const fileName = safeModelFileName(dispositionName || requestedName);
    const targetPath = await uniqueFilePath(targetDir, fileName);
    job.type = type;
    job.fileName = path.basename(targetPath);
    job.targetPath = targetPath;
    const contentLength = Number(response.headers.get("content-length") || 0) || 0;
    if (contentLength > 0) job.totalBytes = contentLength;
    if (!response.body) {
      const buffer = Buffer.from(await response.arrayBuffer());
      job.receivedBytes = buffer.length;
      if (!job.totalBytes || job.receivedBytes > job.totalBytes) job.totalBytes = job.receivedBytes;
      await fs.writeFile(targetPath, buffer);
    } else {
      const stream = Readable.fromWeb(response.body);
      stream.on("data", (chunk) => {
        job.receivedBytes += chunk.length;
        job.updatedAt = new Date().toISOString();
      });
      await pipeline(stream, createWriteStream(targetPath));
      if (!job.totalBytes || job.receivedBytes > job.totalBytes) job.totalBytes = job.receivedBytes;
    }
    job.status = "completed";
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
  }
}

async function handleModelLibraryDownload(req, res) {
  const body = await readJson(req, 1024 * 1024);
  if (!modelLibraryDownloadUrlAllowed(body.downloadUrl)) {
    return sendJson(res, 400, { error: "対応していないダウンロードURLです。CivitaiのモデルダウンロードURLを指定してください。" });
  }
  const provider = modelLibraryProviderFromValue(body.provider);
  if (!provider) return sendJson(res, 400, { error: "保存先プラットフォームを選択してください。" });
  const id = crypto.randomUUID();
  const job = {
    id,
    status: "queued",
    type: modelLibraryTypeFromValue(body.type) || "Checkpoint",
    provider,
    name: String(body.name || "").trim(),
    fileName: safeModelFileName(body.fileName || body.name || "model.safetensors"),
    targetPath: "",
    receivedBytes: 0,
    totalBytes: modelLibraryExpectedBytes(body),
    error: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  modelDownloadJobs.set(id, job);
  runModelLibraryDownload(job, body);
  sendJson(res, 200, { ok: true, job: modelDownloadSnapshot(job) });
}

async function handleModelLibraryDownloadStatus(req, res) {
  const body = await readJson(req, 256 * 1024).catch(() => ({}));
  const jobId = String(body.jobId || "").trim();
  if (!jobId) {
    return sendJson(res, 200, {
      jobs: Array.from(modelDownloadJobs.values()).map(modelDownloadSnapshot)
    });
  }
  const job = modelDownloadJobs.get(jobId);
  if (!job) return sendJson(res, 404, { error: "ダウンロードジョブが見つかりません。" });
  sendJson(res, 200, { job: modelDownloadSnapshot(job) });
}

async function resolveModelLibraryUninstallTarget(body = {}) {
  const provider = modelLibraryProviderFromValue(body.provider);
  if (!provider) throw new Error("保存先プラットフォームを選択してください。");
  const type = modelLibraryTypeFromValue(body.type) || "Checkpoint";
  const kind = modelLibraryKindFromType(type);
  const rootDir = await resolveModelLibraryDir(kind, "", provider);
  const relativePath = safeRelativePath(body.relativePath || body.fileName || body.name);
  if (!relativePath) throw new Error("削除対象のモデルファイルが不明です。ローカル一覧を再読み込みしてください。");

  const targetPath = path.resolve(rootDir, relativePath);
  if (!isInsideDir(targetPath, rootDir) || path.resolve(targetPath) === path.resolve(rootDir)) {
    throw new Error("保存先フォルダ外のファイルは削除できません。");
  }
  const ext = path.extname(targetPath).toLowerCase();
  if (!modelLibraryExtensions.has(ext)) {
    throw new Error("対応していないモデルファイル形式です。");
  }

  let stat;
  try {
    stat = await fs.stat(targetPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      const missing = new Error("モデルファイルが見つかりません。ローカル一覧を再読み込みしてください。");
      missing.statusCode = 404;
      throw missing;
    }
    throw error;
  }
  if (!stat.isFile()) throw new Error("削除対象がファイルではありません。");

  return {
    provider,
    type,
    rootDir,
    path: targetPath,
    relativePath: path.relative(rootDir, targetPath),
    fileName: path.basename(targetPath),
    size: stat.size
  };
}

async function handleModelLibraryUninstall(req, res) {
  const body = await readJson(req, 1024 * 1024).catch(() => ({}));
  try {
    const target = await resolveModelLibraryUninstallTarget(body);
    const trashed = await moveFileToSystemTrash(target.path);
    sendJson(res, 200, {
      ok: true,
      uninstalled: true,
      provider: target.provider,
      type: target.type,
      fileName: target.fileName,
      relativePath: target.relativePath,
      path: target.path,
      size: target.size,
      ...trashed,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message });
  }
}

function normalizeComfyBaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/g, "");
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    return parsed.href.replace(/\/+$/g, "");
  } catch {
    return raw;
  }
}

function comfyEndpoint(baseUrl, pathname = "") {
  const base = normalizeComfyBaseUrl(baseUrl);
  if (!base) throw new Error("ComfyUI のURLが未設定です。");
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const parsed = new URL(base);
  const basePath = parsed.pathname.replace(/\/+$/g, "");
  parsed.pathname = `${basePath}${cleanPath}`;
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

function comfyHeaders(apiKey = "", extra = {}) {
  const headers = { ...extra };
  const key = String(apiKey || "").trim();
  if (key) {
    headers.authorization = `Bearer ${key}`;
    headers["x-api-key"] = key;
  }
  return headers;
}

async function comfyJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function comfyObjectInfoEntry(payload = {}, className) {
  return payload?.[className] || payload?.data?.[className] || payload?.object_info?.[className] || null;
}

function comfyInputChoiceList(payload = {}, classNames = [], inputName = "") {
  const values = [];
  for (const className of classNames) {
    const entry = comfyObjectInfoEntry(payload, className);
    const input = entry?.input || entry?.inputs || {};
    const candidates = [
      input?.required?.[inputName],
      input?.optional?.[inputName],
      entry?.input_types?.required?.[inputName],
      entry?.input_types?.optional?.[inputName]
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (Array.isArray(candidate?.[0])) values.push(...candidate[0]);
      else if (Array.isArray(candidate) && candidate.every((item) => typeof item === "string")) values.push(...candidate);
    }
  }
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function fetchComfyObjectInfo(baseUrl, apiKey) {
  let response;
  try {
    response = await fetch(comfyEndpoint(baseUrl, "/object_info"), {
      headers: comfyHeaders(apiKey, { accept: "application/json" }),
      signal: AbortSignal.timeout(20000)
    });
  } catch (error) {
    throw new Error(comfyConnectionErrorMessage(baseUrl, error));
  }
  const payload = await comfyJson(response);
  if (!response.ok) {
    throw new Error(readableProviderError(payload) || `ComfyUI object_info が ${response.status} を返しました。`);
  }
  return payload;
}

function comfyConnectionErrorMessage(baseUrl, error) {
  const urlText = String(baseUrl || "").trim() || "未設定のURL";
  const detail = error?.cause?.code
    ? ` (${error.cause.code})`
    : error?.message && error.message !== "fetch failed"
      ? ` (${error.message})`
      : "";
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return `ComfyUIへの接続がタイムアウトしました。設定URL ${urlText} でComfyUIが起動しているか、ポート番号が正しいか確認してください${detail}。`;
  }
  return `ComfyUIに接続できませんでした。設定URL ${urlText} でComfyUIが起動しているか、ポート番号が正しいか確認してください。ローカル利用の場合はComfyUIを起動してから再度お試しください${detail}。`;
}

function extractComfyModels(payload = {}) {
  const checkpointModels = comfyInputChoiceList(payload, ["CheckpointLoaderSimple", "CheckpointLoader", "unCLIPCheckpointLoader"], "ckpt_name");
  const diffusionModels = comfyInputChoiceList(payload, ["UNETLoader"], "unet_name");
  return {
    checkpoints: [...new Set([...checkpointModels, ...diffusionModels])].sort((a, b) => a.localeCompare(b)),
    checkpointModels,
    diffusionModels,
    loras: comfyInputChoiceList(payload, ["LoraLoader", "LoraLoaderModelOnly"], "lora_name"),
    textEncoders: comfyInputChoiceList(payload, ["CLIPLoader", "DualCLIPLoader", "TripleCLIPLoader"], "clip_name")
      .concat(comfyInputChoiceList(payload, ["DualCLIPLoader", "TripleCLIPLoader"], "clip_name1"))
      .concat(comfyInputChoiceList(payload, ["DualCLIPLoader", "TripleCLIPLoader"], "clip_name2"))
      .concat(comfyInputChoiceList(payload, ["TripleCLIPLoader"], "clip_name3"))
      .filter((name, index, all) => name && all.indexOf(name) === index)
      .sort((a, b) => a.localeCompare(b)),
    vaes: comfyInputChoiceList(payload, ["VAELoader"], "vae_name"),
    samplers: comfyInputChoiceList(payload, ["KSampler", "KSamplerAdvanced"], "sampler_name"),
    schedulers: comfyInputChoiceList(payload, ["KSampler", "KSamplerAdvanced"], "scheduler")
  };
}

function localComfyBaseUrl(value = "") {
  try {
    const parsed = new URL(String(value || ""));
    return ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function inspectSafetensorsHeader(filePath) {
  const handle = await fs.open(filePath, "r");
  try {
    const lengthBuffer = Buffer.alloc(8);
    await handle.read(lengthBuffer, 0, 8, 0);
    const headerLength = Number(lengthBuffer.readBigUInt64LE());
    if (!Number.isFinite(headerLength) || headerLength <= 0 || headerLength > 50 * 1024 * 1024) return null;
    const headerBuffer = Buffer.alloc(headerLength);
    await handle.read(headerBuffer, 0, headerLength, 8);
    return JSON.parse(headerBuffer.toString("utf8"));
  } finally {
    await handle.close();
  }
}

function classifySafetensorsHeader(header = {}) {
  const keys = Object.keys(header || {}).filter((key) => key !== "__metadata__");
  const metadata = header.__metadata__ && typeof header.__metadata__ === "object" ? header.__metadata__ : {};
  const hasTrainingMetadata = Object.keys(metadata).some((key) => key.startsWith("ss_"));
  const hasAnimaKeys = keys.some((key) => /^net\.(llm_adapter|blocks|final_layer|pos_embed|x_embedder)\./i.test(key));
  const hasAdapterKeys = keys.some((key) => /^(lora_|lycoris_|net\.|bundle_emb\.)/i.test(key));
  const hasCheckpointKeys = keys.some((key) => /^(model\.diffusion_model\.|diffusion_model\.|cond_stage_model\.|conditioner\.|first_stage_model\.|vae\.)/i.test(key));
  if (hasAnimaKeys) return "animaDiffusion";
  if ((hasTrainingMetadata || hasAdapterKeys) && !hasCheckpointKeys) return "adapter";
  if (hasCheckpointKeys) return "checkpoint";
  return "unknown";
}

async function inspectLocalComfyCheckpoint(baseUrl, checkpointName) {
  const name = String(checkpointName || "").trim();
  if (!name || !localComfyBaseUrl(baseUrl)) return null;
  try {
    const checkpointDir = await resolveModelLibraryDir("checkpoint", "", "comfy");
    const filePath = path.resolve(checkpointDir, name);
    const root = path.resolve(checkpointDir);
    if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root) return null;
    const header = await inspectSafetensorsHeader(filePath);
    if (!header) return null;
    return { kind: classifySafetensorsHeader(header), path: filePath };
  } catch {
    return null;
  }
}

function readableComfyNodeErrors(nodeErrors = {}) {
  if (!nodeErrors || typeof nodeErrors !== "object") return "";
  const messages = [];
  for (const [nodeId, nodeError] of Object.entries(nodeErrors)) {
    const className = nodeError?.class_type ? ` ${nodeError.class_type}` : "";
    const errors = Array.isArray(nodeError?.errors) ? nodeError.errors : [nodeError];
    for (const error of errors) {
      const rawDetail = String(error?.details || error?.message || readableProviderError(error) || "").trim();
      if (!rawDetail) continue;
      const inputName = String(error?.extra_info?.input_name || "").trim();
      const prefix = inputName && !rawDetail.includes(`${inputName}:`) ? `${inputName}: ` : "";
      messages.push(`Node ${nodeId}${className}: ${prefix}${rawDetail}`);
    }
  }
  return messages.join(" / ");
}

function parseComfyWorkflow(value) {
  let source = value;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) throw new Error("ComfyUI workflow JSON が未設定です。");
    source = JSON.parse(text);
  }
  const prompt = source?.prompt && typeof source.prompt === "object" ? source.prompt : source;
  if (!prompt || typeof prompt !== "object" || Array.isArray(prompt)) {
    throw new Error("ComfyUI の API Format workflow JSON が必要です。");
  }
  return structuredClone(prompt);
}

function patchComfyNodeInput(workflow, nodeId, keys, value) {
  const id = String(nodeId || "").trim();
  if (!id || value === undefined || value === null || value === "") return false;
  const node = workflow[id];
  if (!node || typeof node !== "object") return false;
  node.inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};
  const key = keys.find((candidate) => Object.prototype.hasOwnProperty.call(node.inputs, candidate)) || keys[0];
  node.inputs[key] = value;
  return true;
}

function normalizedComfyLoras(value = []) {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((item) => ({
      name: String(item?.name || item?.loraName || "").trim(),
      strengthModel: boundedNumber(item?.strengthModel ?? item?.strength_model ?? 1, 1, -2, 2),
      strengthClip: boundedNumber(item?.strengthClip ?? item?.strength_clip ?? 1, 1, -2, 2)
    }))
    .filter((item) => item.name);
}

function normalizedComfyReferenceSlots(value = []) {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((item, index) => ({
      key: String(item?.key || item?.referenceKey || "").trim(),
      name: String(item?.name || item?.label || `Reference ${index + 1}`).trim() || `Reference ${index + 1}`,
      url: String(item?.url || "").trim(),
      nodeId: String(item?.nodeId || item?.node_id || "").trim(),
      inputName: String(item?.inputName || item?.input_name || "image").trim() || "image",
      comfyFileName: String(item?.comfyFileName || item?.filename || item?.comfyImage?.filename || "").trim()
    }))
    .filter((item) => item.nodeId || item.url);
}

function isComfyLink(value) {
  return Array.isArray(value) && value.length >= 2 && (typeof value[0] === "string" || typeof value[0] === "number");
}

function comfyLinkEquals(a, b) {
  return isComfyLink(a) && isComfyLink(b) && String(a[0]) === String(b[0]) && Number(a[1]) === Number(b[1]);
}

function firstComfyInputLink(workflow, nodeIds, keys) {
  for (const nodeId of nodeIds) {
    const node = workflow[String(nodeId || "")];
    const inputs = node?.inputs || {};
    for (const key of keys) {
      if (isComfyLink(inputs[key])) return inputs[key];
    }
  }
  return null;
}

function nextComfyNodeId(workflow) {
  const numericIds = Object.keys(workflow || {})
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id >= 0);
  let next = numericIds.length ? Math.max(...numericIds) + 1 : 1000;
  while (workflow[String(next)]) next += 1;
  return String(next);
}

function replaceComfyInputLinks(workflow, fromLink, toLink, inputKeys, excludedNodeIds = new Set()) {
  if (!isComfyLink(fromLink) || !isComfyLink(toLink)) return;
  for (const [nodeId, node] of Object.entries(workflow || {})) {
    if (excludedNodeIds.has(String(nodeId))) continue;
    const inputs = node?.inputs || {};
    for (const key of inputKeys) {
      if (comfyLinkEquals(inputs[key], fromLink)) inputs[key] = [...toLink];
    }
  }
}

function countComfyWorkflowEdges(workflow = {}) {
  let count = 0;
  for (const node of Object.values(workflow || {})) {
    for (const value of Object.values(node?.inputs || {})) {
      if (isComfyLink(value)) count += 1;
    }
  }
  return count;
}

function injectComfyLoras(workflow, options = {}) {
  const loras = normalizedComfyLoras(options.loras);
  if (!loras.length) return [];
  const checkpointId = String(options.checkpointNodeId || "").trim();
  const modelSource = firstComfyInputLink(workflow, [options.seedNodeId, options.samplerNodeId], ["model"])
    || (checkpointId && workflow[checkpointId] ? [checkpointId, 0] : null);
  const clipSource = firstComfyInputLink(workflow, [options.positiveNodeId, options.negativeNodeId], ["clip"])
    || (checkpointId && workflow[checkpointId] ? [checkpointId, 1] : null);
  if (!modelSource || !clipSource) {
    throw new Error("LoRAを挿入するための model/clip 接続がworkflowから見つかりません。KSampler、Positive/Negative、CheckpointのNode IDを確認してください。");
  }

  let currentModel = [...modelSource];
  let currentClip = [...clipSource];
  const insertedIds = [];
  for (const lora of loras) {
    const nodeId = nextComfyNodeId(workflow);
    workflow[nodeId] = {
      class_type: "LoraLoader",
      _meta: { title: `LoRA: ${lora.name}` },
      inputs: {
        lora_name: lora.name,
        strength_model: lora.strengthModel,
        strength_clip: lora.strengthClip,
        model: currentModel,
        clip: currentClip
      }
    };
    insertedIds.push(nodeId);
    currentModel = [nodeId, 0];
    currentClip = [nodeId, 1];
  }

  const excluded = new Set(insertedIds);
  replaceComfyInputLinks(workflow, modelSource, currentModel, ["model"], excluded);
  replaceComfyInputLinks(workflow, clipSource, currentClip, ["clip"], excluded);
  return insertedIds;
}

function patchComfyReferenceImages(workflow, references = [], { requireUrl = false } = {}) {
  const slots = normalizedComfyReferenceSlots(references);
  const patched = [];
  for (const slot of slots) {
    if (requireUrl && !slot.url) continue;
    if (!slot.nodeId) throw new Error(`参照画像「${slot.name}」のNode IDが未設定です。`);
    const node = workflow[slot.nodeId];
    if (!node) throw new Error(`参照画像Node ID ${slot.nodeId} がworkflow内にありません。`);
    node.inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};
    const imageName = slot.comfyFileName || slot.filename || slot.comfyImage?.filename || "__reference_image__.png";
    node.inputs[slot.inputName || "image"] = imageName;
    if (Object.prototype.hasOwnProperty.call(node.inputs, "upload")) node.inputs.upload = "image";
    patched.push({
      name: slot.name,
      nodeId: slot.nodeId,
      inputName: slot.inputName || "image",
      filename: imageName
    });
  }
  return patched;
}

function safeComfyUploadName(reference = {}, index = 0) {
  const ext = path.extname(String(reference.url || reference.name || "")).toLowerCase();
  const cleanExt = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext) ? ext : ".png";
  const base = cleanFileNamePart(path.parse(String(reference.name || reference.url || "reference")).name, "reference", 60);
  const hash = crypto.createHash("sha1").update(`${reference.url || ""}:${reference.key || ""}:${index}`).digest("hex").slice(0, 10);
  return `cfs_ref_${hash}_${base}${cleanExt}`;
}

async function uploadComfyReferenceImage(baseUrl, apiKey, reference, index) {
  const filePath = localMediaPathFromUrl(reference.url);
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) throw new Error(`参照画像ファイルが見つかりません: ${reference.name || reference.url}`);
  const ext = path.extname(filePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
    throw new Error(`ComfyUIへ送れる参照画像形式ではありません: ${reference.name || reference.url}`);
  }
  const data = await fs.readFile(filePath);
  const fileName = safeComfyUploadName({ ...reference, url: reference.url || filePath }, index);
  const form = new FormData();
  form.append("image", new Blob([data], { type: mimeForExtension(ext) }), fileName);
  form.append("overwrite", "true");
  form.append("type", "input");
  const response = await fetch(comfyEndpoint(baseUrl, "/upload/image"), {
    method: "POST",
    headers: comfyHeaders(apiKey, { accept: "application/json" }),
    body: form,
    signal: AbortSignal.timeout(120000)
  });
  const payload = await comfyJson(response);
  if (!response.ok) {
    throw new Error(readableProviderError(payload) || `ComfyUI 参照画像アップロードが ${response.status} を返しました。`);
  }
  return {
    ...reference,
    comfyFileName: payload.name || payload.filename || fileName,
    comfySubfolder: payload.subfolder || "",
    comfyType: payload.type || "input",
    uploadPayload: payload
  };
}

async function uploadComfyReferenceImages(baseUrl, apiKey, references = []) {
  const slots = normalizedComfyReferenceSlots(references).filter((slot) => slot.url);
  const uploaded = [];
  for (let index = 0; index < slots.length; index += 1) {
    uploaded.push(await uploadComfyReferenceImage(baseUrl, apiKey, slots[index], index));
  }
  return uploaded;
}

function validateComfyWorkflowRequest(body = {}, modelInfo = {}) {
  const errors = [];
  const warnings = [];
  let prompt = null;
  let patched = null;
  let insertedLoraNodeIds = [];
  const loras = normalizedComfyLoras(body.loras);
  const references = normalizedComfyReferenceSlots(body.references);
  try {
    prompt = parseComfyWorkflow(body.workflowJson || body.workflow);
  } catch (error) {
    return {
      ok: false,
      errors: [`ComfyUI workflow JSON を読み取れません: ${error.message}`],
      warnings,
      summary: {}
    };
  }

  const nodeChecks = [
    ["Positive", body.positiveNodeId],
    ["Negative", body.negativeNodeId],
    ["Seed", body.seedNodeId],
    ["Size", body.sizeNodeId],
    ["Steps", body.stepsNodeId],
    ["CFG", body.cfgNodeId],
    ["Sampler", body.samplerNodeId],
    ["Checkpoint", body.checkpointNodeId]
  ];
  for (const [label, nodeId] of nodeChecks) {
    const id = String(nodeId || "").trim();
    if (!id) {
      errors.push(`${label} Node ID が未設定です。`);
    } else if (!prompt[id]) {
      errors.push(`${label} Node ID ${id} がworkflow内にありません。`);
    }
  }

  const checkpointName = String(body.checkpoint || "").trim();
  const checkpointNode = prompt[String(body.checkpointNodeId || "")];
  const checkpointClass = String(checkpointNode?.class_type || "");
  const checkpointNames = checkpointClass === "UNETLoader"
    ? (Array.isArray(modelInfo.diffusionModels) ? modelInfo.diffusionModels : [])
    : (Array.isArray(modelInfo.checkpointModels) && modelInfo.checkpointModels.length ? modelInfo.checkpointModels : (Array.isArray(modelInfo.checkpoints) ? modelInfo.checkpoints : []));
  if (checkpointName && checkpointClass === "UNETLoader" && !checkpointNames.length) {
    errors.push("ComfyUIのdiffusion_models一覧が空です。Anima本体を ComfyUI/models/diffusion_models に配置して、ComfyUIを再起動またはモデル一覧を更新してください。");
  } else if (checkpointName && checkpointNames.length && !checkpointNames.includes(checkpointName)) {
    const location = checkpointClass === "UNETLoader" ? "diffusion_models" : "checkpoints";
    errors.push(`Checkpoint「${checkpointName}」がComfyUIの${location}一覧にありません。`);
  }
  if (checkpointName && modelInfo.checkpointInspection?.kind === "animaDiffusion" && checkpointClass !== "UNETLoader") {
    errors.push(`Checkpoint「${checkpointName}」はAnima diffusion model形式です。ComfyUIのmodels/diffusion_modelsへ置き、アプリの「Anima workflowを適用」を使ってください。`);
  } else if (checkpointName && modelInfo.checkpointInspection?.kind === "adapter") {
    errors.push(`Checkpoint「${checkpointName}」はLoRA/adapter形式の可能性があります。ComfyUIのmodels/lorasへ保存し、ベースCheckpointを選んでLoRA欄に指定してください。`);
  }
  const textEncoderNames = Array.isArray(modelInfo.textEncoders) ? modelInfo.textEncoders : [];
  const vaeNames = Array.isArray(modelInfo.vaes) ? modelInfo.vaes : [];
  for (const [nodeId, node] of Object.entries(prompt || {})) {
    const classType = String(node?.class_type || "");
    const inputs = node?.inputs || {};
    if (["CLIPLoader", "DualCLIPLoader", "TripleCLIPLoader"].includes(classType) && !textEncoderNames.length) {
      errors.push("ComfyUIのtext_encoders一覧が空です。Anima用の qwen_3_06b_base.safetensors を ComfyUI/models/text_encoders に配置してください。");
    } else if (["CLIPLoader", "DualCLIPLoader", "TripleCLIPLoader"].includes(classType) && textEncoderNames.length) {
      ["clip_name", "clip_name1", "clip_name2", "clip_name3"].forEach((key) => {
        const name = String(inputs[key] || "").trim();
        if (name && !textEncoderNames.includes(name)) errors.push(`Text Encoder「${name}」がComfyUIの一覧にありません（Node ${nodeId}）。`);
      });
    }
    if (classType === "VAELoader" && vaeNames.length) {
      const name = String(inputs.vae_name || "").trim();
      if (name && !vaeNames.includes(name)) errors.push(`VAE「${name}」がComfyUIの一覧にありません（Node ${nodeId}）。`);
    }
  }
  const loraNames = Array.isArray(modelInfo.loras) ? modelInfo.loras : [];
  if (loras.length && loraNames.length) {
    loras.forEach((lora) => {
      if (!loraNames.includes(lora.name)) errors.push(`LoRA「${lora.name}」がComfyUIの一覧にありません。`);
    });
  }
  const samplerName = String(body.samplerName || "").trim();
  const samplerNames = Array.isArray(modelInfo.samplers) ? modelInfo.samplers : [];
  if (samplerName && samplerNames.length && !samplerNames.includes(samplerName)) {
    errors.push(`Sampler「${samplerName}」がComfyUIの一覧にありません。ComfyUIでは例: ${samplerNames.slice(0, 6).join(", ")} のような内部名を指定してください。`);
  }
  const schedulerName = String(body.scheduler || "").trim();
  const schedulerNames = Array.isArray(modelInfo.schedulers) ? modelInfo.schedulers : [];
  if (schedulerName && schedulerNames.length && !schedulerNames.includes(schedulerName)) {
    errors.push(`Scheduler「${schedulerName}」がComfyUIの一覧にありません。ComfyUIでは例: ${schedulerNames.slice(0, 6).join(", ")} のような内部名を指定してください。`);
  }

  try {
    patched = patchComfyWorkflow(body.workflowJson || body.workflow, {
      ...body,
      prompt: body.prompt || "__validation_prompt__",
      negativePrompt: body.negativePrompt || ""
    });
    insertedLoraNodeIds = Object.entries(patched)
      .filter(([, node]) => node?.class_type === "LoraLoader")
      .map(([nodeId]) => nodeId)
      .filter((nodeId) => !prompt[nodeId]);
  } catch (error) {
    errors.push(error.message);
  }

  if (!body.baseUrl) warnings.push("ComfyUI URLが未設定のため、接続とモデル存在は確認していません。");
  if (loras.length && !loraNames.length) warnings.push("LoRA一覧を取得できていないため、LoRAファイル名の存在確認は未実施です。");
  if (checkpointName && !checkpointNames.length && checkpointClass !== "UNETLoader") warnings.push("Checkpoint一覧を取得できていないため、Checkpoint名の存在確認は未実施です。");
  if (samplerName && !samplerNames.length) warnings.push("Sampler一覧を取得できていないため、Sampler名の存在確認は未実施です。");
  if (schedulerName && !schedulerNames.length) warnings.push("Scheduler一覧を取得できていないため、Scheduler名の存在確認は未実施です。");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      nodeCount: Object.keys(prompt || {}).length,
      edgeCount: countComfyWorkflowEdges(prompt),
      loraCount: loras.length,
      referenceCount: references.filter((item) => item.url).length,
      insertedLoraNodeIds,
      checkpoint: checkpointName || "workflow既定",
      patchedWorkflow: patched ? scrubComfyWorkflow(patched) : null
    }
  };
}

function patchComfyWorkflow(workflow, options = {}) {
  const prompt = parseComfyWorkflow(workflow);
  patchComfyNodeInput(prompt, options.positiveNodeId, ["text", "prompt"], String(options.prompt || ""));
  patchComfyNodeInput(prompt, options.negativeNodeId, ["text", "negative", "negative_prompt"], String(options.negativePrompt || ""));
  const seedText = String(options.seed ?? "").trim();
  const seed = seedText === "" ? NaN : Number(seedText);
  if (Number.isFinite(seed) && seed >= 0) {
    patchComfyNodeInput(prompt, options.seedNodeId, ["seed", "noise_seed"], Math.floor(seed));
  } else {
    patchComfyNodeInput(prompt, options.seedNodeId, ["seed", "noise_seed"], Math.floor(Math.random() * 1000000000000000));
  }
  patchComfyNodeInput(prompt, options.sizeNodeId, ["width"], boundedNumber(options.width, 1024, 64, 4096, true));
  patchComfyNodeInput(prompt, options.sizeNodeId, ["height"], boundedNumber(options.height, 1024, 64, 4096, true));
  patchComfyNodeInput(prompt, options.stepsNodeId, ["steps"], boundedNumber(options.steps, 28, 1, 150, true));
  patchComfyNodeInput(prompt, options.cfgNodeId, ["cfg"], boundedNumber(options.cfg, 7, 0, 30));
  patchComfyNodeInput(prompt, options.samplerNodeId, ["sampler_name"], String(options.samplerName || "euler").trim());
  patchComfyNodeInput(prompt, options.samplerNodeId, ["scheduler"], String(options.scheduler || "normal").trim());
  patchComfyNodeInput(prompt, options.sizeNodeId, ["batch_size"], boundedNumber(options.batchSize, 1, 1, 8, true));
  patchComfyNodeInput(prompt, options.checkpointNodeId, ["ckpt_name", "unet_name"], String(options.checkpoint || "").trim());
  injectComfyLoras(prompt, options);
  patchComfyReferenceImages(prompt, options.references, { requireUrl: true });
  return prompt;
}

function scrubComfyWorkflow(workflow) {
  const text = JSON.stringify(workflow || {});
  return text.length > 24000 ? { clipped: true, preview: `${text.slice(0, 8000)}...` } : workflow;
}

function extractComfyPromptId(payload = {}) {
  return payload.prompt_id || payload.promptId || payload.id || payload?.data?.prompt_id || "";
}

function normalizeComfyStatus(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return "";
  if (["success", "succeeded", "complete", "completed"].includes(text)) return "succeeded";
  if (["error", "failed", "failure"].includes(text)) return "failed";
  if (["running", "processing", "executing"].includes(text)) return "running";
  if (["queued", "pending"].includes(text)) return "queued";
  return text;
}

function findComfyHistoryItem(payload, promptId) {
  if (!payload || typeof payload !== "object") return null;
  if (payload[promptId]) return payload[promptId];
  if (payload.prompt_id === promptId || payload.promptId === promptId) return payload;
  if (payload.data?.[promptId]) return payload.data[promptId];
  return null;
}

function extractComfyImages(historyItem = {}) {
  const source = historyItem && typeof historyItem === "object" ? historyItem : {};
  const outputs = source.outputs || source.output || source.data?.outputs || {};
  const images = [];
  for (const [nodeId, output] of Object.entries(outputs || {})) {
    const nodeImages = Array.isArray(output?.images) ? output.images : [];
    nodeImages.forEach((image, index) => {
      if (image?.filename) images.push({ ...image, nodeId, index });
    });
  }
  return images;
}

function extractComfyExecutionError(historyItem = {}) {
  const messages = Array.isArray(historyItem?.status?.messages) ? historyItem.status.messages : [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    const eventName = Array.isArray(item) ? item[0] : item?.type || item?.event;
    const detail = Array.isArray(item) ? item[1] : item?.data || item;
    if (eventName !== "execution_error" || !detail) continue;
    const nodeText = [detail.node_id ? `Node ${detail.node_id}` : "", detail.node_type || ""].filter(Boolean).join(" ");
    const message = String(detail.exception_message || detail.message || "").trim().split(/\n{2,}/)[0];
    return [nodeText, message].filter(Boolean).join(": ");
  }
  return "";
}

function comfyQueueStatus(payload = {}, promptId) {
  const inRunning = (payload.queue_running || []).some((item) => JSON.stringify(item).includes(promptId));
  if (inRunning) return "running";
  const inPending = (payload.queue_pending || []).some((item) => JSON.stringify(item).includes(promptId));
  if (inPending) return "queued";
  return "pending";
}

function extensionFromComfyImage(image = {}, contentType = "") {
  const fromName = path.extname(String(image.filename || "")).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(fromName)) return fromName === ".jpeg" ? ".jpg" : fromName;
  const clean = String(contentType || "").toLowerCase();
  if (clean.includes("jpeg") || clean.includes("jpg")) return ".jpg";
  if (clean.includes("webp")) return ".webp";
  if (clean.includes("gif")) return ".gif";
  return ".png";
}

async function fetchComfyImage(baseUrl, apiKey, image) {
  const endpoint = comfyEndpoint(baseUrl, "/view");
  endpoint.searchParams.set("filename", image.filename);
  endpoint.searchParams.set("subfolder", image.subfolder || "");
  endpoint.searchParams.set("type", image.type || "output");
  const response = await fetch(endpoint, {
    headers: comfyHeaders(apiKey, { accept: "image/*,*/*" }),
    signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`ComfyUI 画像取得に失敗しました: ${response.status}${detail ? ` ${detail.slice(0, 220)}` : ""}`);
  }
  return response;
}

async function saveComfyImage({ baseUrl, apiKey, image, promptId, workName, title, index }) {
  const response = await fetchComfyImage(baseUrl, apiKey, image);
  const ext = extensionFromComfyImage(image, response.headers.get("content-type") || "");
  const workFolder = safeFolderName(workName, "_未分類作品");
  const destinationDir = path.join(uploadDir, workFolder, "_画像生成");
  await fs.mkdir(destinationDir, { recursive: true });
  const safeTitle = cleanFileNamePart(title || "comfy-image", "comfy-image", 70);
  const safePromptId = cleanFileNamePart(promptId, "prompt", 80);
  const fileName = `${safeTitle}-${safePromptId}-${index + 1}${ext}`;
  const filePath = path.join(destinationDir, fileName);
  try {
    await fs.access(filePath);
  } catch {
    const data = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, data);
  }
  return {
    url: uploadUrlFor(filePath),
    path: filePath,
    filename: image.filename,
    nodeId: image.nodeId,
    mimeType: mimeForExtension(ext)
  };
}

function normalizeForgeBaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/g, "") || "http://127.0.0.1:7860";
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    return parsed.href.replace(/\/+$/g, "");
  } catch {
    return raw;
  }
}

function forgeProviderLabel(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (["drawthings", "draw-things", "draw_things", "draw things"].includes(text)) return "Draw Things";
  return text.includes("neo") ? "Forge Neo" : "Forge";
}

function forgeProductName(label = "Forge") {
  if (label === "Draw Things") return "Draw Things";
  return label === "Forge Neo" ? "Stable Diffusion WebUI Forge Neo" : "Stable Diffusion WebUI Forge";
}

function isDrawThingsProviderLabel(label = "") {
  return label === "Draw Things";
}

function forgeEndpoint(baseUrl, pathname = "") {
  const base = normalizeForgeBaseUrl(baseUrl);
  if (!base) throw new Error("Forge のURLが未設定です。");
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const parsed = new URL(base);
  const basePath = parsed.pathname.replace(/\/+$/g, "");
  parsed.pathname = `${basePath}${cleanPath}`;
  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

function forgeHeaders(apiKey = "", extra = {}) {
  const headers = { ...extra };
  const key = String(apiKey || "").trim();
  if (key) {
    headers.authorization = `Bearer ${key}`;
    headers["x-api-key"] = key;
  }
  return headers;
}

function forgeApiKeyFromRequest(value, provider) {
  const label = forgeProviderLabel(provider);
  if (label === "Draw Things") return apiKeyFromRequest(value, "DRAWTHINGS_API_KEY", "DRAW_THINGS_API_KEY");
  if (label === "Forge Neo") return apiKeyFromRequest(value, "FORGE_NEO_API_KEY", "FORGE_API_KEY");
  return apiKeyFromRequest(value, "FORGE_API_KEY");
}

async function forgeJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function forgeConnectionErrorMessage(baseUrl, error, label = "Forge") {
  const urlText = String(baseUrl || "").trim() || "未設定のURL";
  const productName = forgeProductName(label);
  const detail = error?.cause?.code
    ? ` (${error.cause.code})`
    : error?.message && error.message !== "fetch failed"
      ? ` (${error.message})`
      : "";
  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    if (isDrawThingsProviderLabel(label)) {
      return `${label}への接続がタイムアウトしました。設定URL ${urlText} でDraw ThingsのHTTP Serverが有効になっているか確認してください${detail}。`;
    }
    return `${label}への接続がタイムアウトしました。設定URL ${urlText} で${productName}がAPI有効で起動しているか確認してください${detail}。`;
  }
  if (isDrawThingsProviderLabel(label)) {
    return `${label}に接続できませんでした。設定URL ${urlText} でDraw Thingsを起動し、HTTP Serverを有効にしているか確認してください${detail}。`;
  }
  return `${label}に接続できませんでした。設定URL ${urlText} で${productName}が起動しているか、--api付きで起動しているか確認してください${detail}。`;
}

function extractForgeModels(payload = []) {
  const source = Array.isArray(payload) ? payload : payload?.models || payload?.data || [];
  return [...new Set(source
    .map((item) => item?.title || item?.model_name || item?.name || "")
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function extractForgeSamplers(payload = []) {
  const source = Array.isArray(payload) ? payload : payload?.samplers || payload?.data || [];
  return [...new Set(source
    .map((item) => item?.name || "")
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function extractForgeLoras(payload = []) {
  const source = Array.isArray(payload) ? payload : payload?.loras || payload?.data || [];
  return [...new Set(source
    .map((item) => typeof item === "string" ? item : item?.alias || item?.name || item?.model_name || item?.filename || item?.file || item?.path || "")
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function extractForgeVaes(payload = []) {
  const source = Array.isArray(payload) ? payload : payload?.vaes || payload?.data || [];
  return [...new Set(source
    .map((item) => typeof item === "string" ? item : item?.model_name || item?.filename || item?.name || item?.file || item?.path || "")
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function extractDrawThingsLoras(payload = []) {
  const source = Array.isArray(payload) ? payload : payload?.loras || payload?.data || [];
  return [...new Set(source
    .map((item) => typeof item === "string" ? item : item?.file || item?.filename || item?.model || item?.model_name || item?.name || item?.alias || item?.path || "")
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function extractForgeModules(payload = []) {
  const source = Array.isArray(payload) ? payload : payload?.modules || payload?.data || [];
  return [...new Set(source
    .map((item) => item?.filename || item?.model_name || item?.name || "")
    .map((item) => String(item || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function extractDrawThingsOptionHints(payload = {}, patterns = []) {
  const matches = [];
  const visit = (value, key = "") => {
    if (matches.length >= 60 || value === null || value === undefined) return;
    if (typeof value === "string") {
      const text = value.trim();
      if (text && text.length <= 260 && patterns.some((pattern) => pattern.test(key))) matches.push(text);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
    }
  };
  visit(payload);
  return [...new Set(matches)].sort((a, b) => a.localeCompare(b));
}

async function readJsonFileIfExists(filePath, fallback = []) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function drawThingsDocumentsDir() {
  const home = os.homedir();
  return home ? path.join(home, "Library", "Containers", "com.liuliu.draw-things", "Data", "Documents") : "";
}

async function localDrawThingsLoras() {
  const documentsDir = drawThingsDocumentsDir();
  if (!documentsDir) return [];
  const modelsDir = path.join(documentsDir, "Models");
  const cacheDir = path.join(path.dirname(documentsDir), "Library", "Caches", "net");
  const [customLoras, communityLoras, modelFiles] = await Promise.all([
    readJsonFileIfExists(path.join(modelsDir, "custom_lora.json"), []),
    readJsonFileIfExists(path.join(cacheDir, "loras.json"), []),
    fs.readdir(modelsDir).catch(() => [])
  ]);
  const modelFileSet = new Set(modelFiles);
  return [...new Set([
    ...extractDrawThingsLoras(customLoras),
    ...extractDrawThingsLoras((Array.isArray(communityLoras) ? communityLoras : []).filter((item) => modelFileSet.has(item?.file))),
    ...modelFiles.filter((name) => /(^|[_\-.])lora([_\-.]|$)/i.test(name) && /\.(ckpt|safetensors|pt|bin)$/i.test(name))
  ])].sort((a, b) => a.localeCompare(b));
}

function parseOptionalJsonObject(value, label) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  const text = String(value || "").trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch (error) {
    throw new Error(`${label} のJSONを読み取れませんでした: ${error.message}`);
  }
  throw new Error(`${label} はJSONオブジェクトで指定してください。`);
}

function activeForgeNeoModules(value = []) {
  return (Array.isArray(value) ? value : String(value || "").split(/\r?\n|,/g))
    .map((item) => String(item?.filename || item?.model_name || item?.name || item || "").trim())
    .filter(Boolean);
}

function drawThingsSamplerName(value) {
  const text = String(value || "").trim();
  if (!text) return "Euler a";
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  if (normalized === "euler" || normalized === "euler a" || normalized === "euler-a") return "Euler a";
  if (normalized === "dpm++ 2m") return "DPM++ 2M AYS";
  if (normalized === "dpm++ 2m ays") return "DPM++ 2M AYS";
  if (normalized === "dpm++ 2m karras") return "DPM++ 2M Karras";
  if (normalized === "dpm++ sde") return "DPM++ SDE AYS";
  if (normalized === "dpm++ sde karras") return "DPM++ SDE Karras";
  if (normalized === "unipc") return "UniPC";
  if (normalized === "lcm") return "LCM";
  return text;
}

function forgeLoraTokenName(value) {
  const parsed = path.parse(String(value || "").trim());
  return parsed.ext ? parsed.name : String(value || "").trim();
}

function forgePromptWithLoras(prompt, loras = []) {
  const tokens = normalizedComfyLoras(loras)
    .map((item) => {
      const name = forgeLoraTokenName(item.name);
      return name ? `<lora:${name}:${item.strengthModel}>` : "";
    })
    .filter(Boolean);
  return [String(prompt || "").trim(), ...tokens].filter(Boolean).join(", ");
}

function drawThingsLoraPayload(loras = []) {
  return normalizedComfyLoras(loras)
    .map((item) => {
      const file = String(item.name || "").trim();
      if (!file) return null;
      return {
        mode: "base",
        file,
        weight: boundedNumber(item.strengthModel, 1, -10, 10)
      };
    })
    .filter(Boolean);
}

function parseForgeImagePayload(value) {
  const text = String(value || "").trim();
  const match = text.match(/^data:(image\/[\w.+-]+);base64,(.+)$/i);
  const mimeType = match ? match[1].toLowerCase() : "image/png";
  const base64 = match ? match[2] : text;
  const subtype = mimeType.split("/")[1] || "png";
  return {
    buffer: Buffer.from(base64, "base64"),
    ext: extensionForMedia("image", subtype),
    mimeType
  };
}

function scrubForgePayload(payload = {}) {
  if (!payload || typeof payload !== "object") return payload;
  return {
    ...payload,
    images: Array.isArray(payload.images) ? [`${payload.images.length} base64 image(s) omitted`] : payload.images
  };
}

async function saveForgeImage({ image, workName, title, generationId, index, label = "Forge" }) {
  const parsed = parseForgeImagePayload(image);
  if (!parsed.buffer.length) throw new Error(`${label}の画像データが空でした。`);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const destinationDir = path.join(uploadDir, workFolder, "_画像生成");
  await fs.mkdir(destinationDir, { recursive: true });
  const safeTitle = cleanFileNamePart(title || "forge-image", "forge-image", 70);
  const safeGenerationId = cleanFileNamePart(generationId, "forge", 80);
  const fileName = `${safeTitle}-${safeGenerationId}-${index + 1}${parsed.ext}`;
  const filePath = path.join(destinationDir, fileName);
  await fs.writeFile(filePath, parsed.buffer);
  return {
    url: uploadUrlFor(filePath),
    path: filePath,
    filename: fileName,
    nodeId: "",
    mimeType: parsed.mimeType
  };
}

async function handleForgeCheck(req, res) {
  const body = await readJson(req, 1024 * 1024);
  const { baseUrl, provider } = body;
  const apiKey = forgeApiKeyFromRequest(body.apiKey, provider);
  const label = forgeProviderLabel(provider);
  try {
    let response;
    try {
      response = await fetch(forgeEndpoint(baseUrl, "/sdapi/v1/options"), {
        headers: forgeHeaders(apiKey, { accept: "application/json" }),
        signal: AbortSignal.timeout(15000)
      });
    } catch (error) {
      throw new Error(forgeConnectionErrorMessage(baseUrl, error, label));
    }
    const payload = await forgeJson(response);
    if (!response.ok) return sendJson(res, response.status, payload);
    sendJson(res, 200, {
      ok: true,
      options: payload,
      sdModelCheckpoint: payload.sd_model_checkpoint || payload.model || payload.model_name || ""
    });
  } catch (error) {
    sendJson(res, 502, { error: `${label} 接続確認に失敗しました: ${error.message}` });
  }
}

async function fetchForgeJson(baseUrl, apiKey, pathname, timeoutMs = 20000, label = "Forge") {
  const response = await fetch(forgeEndpoint(baseUrl, pathname), {
    headers: forgeHeaders(apiKey, { accept: "application/json" }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const payload = await forgeJson(response);
  if (!response.ok) {
    throw new Error(readableProviderError(payload) || `${label} ${pathname} が ${response.status} を返しました。`);
  }
  return payload;
}

async function handleForgeModels(req, res) {
  const body = await readJson(req, 1024 * 1024);
  const { baseUrl, provider } = body;
  const apiKey = forgeApiKeyFromRequest(body.apiKey, provider);
  const label = forgeProviderLabel(provider);
  if (!baseUrl) return sendJson(res, 400, { error: `${label} のURLが未設定です。` });
  try {
    if (isDrawThingsProviderLabel(label)) {
      const [options, apiLoras, fileLoras, localModelGroups] = await Promise.all([
        fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/options", 20000, label),
        fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/loras", 20000, label).catch(() => []),
        localDrawThingsLoras().catch(() => []),
        listDrawThingsModelLibraryFileGroups().catch(() => ({ vaes: [] }))
      ]);
      const loras = [...new Set([...extractDrawThingsLoras(apiLoras), ...fileLoras])].sort((a, b) => a.localeCompare(b));
      return sendJson(res, 200, {
        ok: true,
        checkpoints: extractDrawThingsOptionHints(options, [/model/i, /checkpoint/i]),
        samplers: extractDrawThingsOptionHints(options, [/sampler/i]),
        loras,
        vaes: [
          ...new Set([
            ...extractDrawThingsOptionHints(options, [/vae/i]),
            ...(Array.isArray(localModelGroups.vaes) ? localModelGroups.vaes.map((item) => item.fileName || item.name || "") : [])
          ].map((item) => String(item || "").trim()).filter(Boolean))
        ].sort((a, b) => a.localeCompare(b)),
        modules: [],
        providerPayload: { options, loras: apiLoras, localLoras: fileLoras },
        updatedAt: new Date().toISOString()
      });
    }
    const [models, samplers, loras, vaes, modules] = await Promise.all([
      fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/sd-models", 20000, label),
      fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/samplers", 20000, label).catch(() => []),
      fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/loras", 20000, label).catch(() => []),
      fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/sd-vae", 20000, label).catch(() => []),
      label === "Forge Neo" ? fetchForgeJson(baseUrl, apiKey, "/sdapi/v1/sd-modules", 20000, label).catch(() => []) : []
    ]);
    sendJson(res, 200, {
      ok: true,
      checkpoints: extractForgeModels(models),
      samplers: extractForgeSamplers(samplers),
      loras: extractForgeLoras(loras),
      vaes: extractForgeVaes(vaes),
      modules: extractForgeModules(modules),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 502, { error: `${label} モデル一覧の取得に失敗しました: ${error.message}` });
  }
}

async function handleForgeCreate(req, res) {
  const body = await readJson(req, 12 * 1024 * 1024);
  const { baseUrl, prompt, negativePrompt, checkpoint, workName, title } = body;
  const apiKey = forgeApiKeyFromRequest(body.apiKey, body.provider);
  const label = forgeProviderLabel(body.provider);
  if (!baseUrl) return sendJson(res, 400, { error: `${label} のURLが未設定です。` });
  if (!prompt) return sendJson(res, 400, { error: "画像生成プロンプトが必要です。" });
  const seedText = String(body.seed ?? "").trim();
  const seed = Number(seedText);
  const isForgeNeo = label === "Forge Neo";
  const isDrawThings = isDrawThingsProviderLabel(label);
  const requestPayload = {
    prompt: isDrawThings ? String(prompt || "").trim() : forgePromptWithLoras(prompt, body.loras),
    negative_prompt: String(negativePrompt || ""),
    width: boundedNumber(body.width, 1024, 64, 4096, true),
    height: boundedNumber(body.height, 1024, 64, 4096, true),
    steps: boundedNumber(body.steps, 28, 1, 150, true),
    cfg_scale: boundedNumber(body.cfg, 7, 0, 30),
    sampler_name: String(body.samplerName || "Euler").trim() || "Euler",
    scheduler: String(body.scheduler || "").trim() || undefined,
    batch_size: boundedNumber(body.batchSize, 1, 1, 8, true),
    n_iter: 1,
    seed: seedText && Number.isFinite(seed) && seed >= 0 ? Math.floor(seed) : -1,
    override_settings_restore_afterwards: true
  };
  if (isDrawThings) {
    delete requestPayload.scheduler;
    delete requestPayload.override_settings_restore_afterwards;
    requestPayload.sampler_name = drawThingsSamplerName(requestPayload.sampler_name);
    if (checkpoint) requestPayload.model = String(checkpoint).trim();
    const loras = drawThingsLoraPayload(body.loras);
    if (loras.length) requestPayload.loras = loras;
  } else if (checkpoint) {
    requestPayload.override_settings = { sd_model_checkpoint: String(checkpoint).trim() };
  }
  if (isForgeNeo) {
    try {
      const overrideSettings = {
        ...(requestPayload.override_settings || {}),
        ...parseOptionalJsonObject(body.forgeNeoOverrideSettingsJson, "Forge Neo override_settings")
      };
      const modules = activeForgeNeoModules(body.forgeNeoModules);
      if (modules.length) overrideSettings.forge_additional_modules = modules;
      const dtype = String(body.forgeNeoDtype || "").trim();
      if (dtype && dtype !== "Automatic") overrideSettings.forge_unet_storage_dtype = dtype;
      if (Object.keys(overrideSettings).length) requestPayload.override_settings = overrideSettings;
      const distilledCfgText = String(body.forgeNeoDistilledCfg ?? "").trim();
      if (distilledCfgText) requestPayload.distilled_cfg_scale = boundedNumber(distilledCfgText, 3.5, 0, 30);
      const refinerCheckpoint = String(body.forgeNeoRefinerCheckpoint || "").trim();
      if (refinerCheckpoint) requestPayload.refiner_checkpoint = refinerCheckpoint;
      const refinerSwitchText = String(body.forgeNeoRefinerSwitchAt ?? "").trim();
      if (refinerSwitchText) requestPayload.refiner_switch_at = boundedNumber(refinerSwitchText, 0.8, 0, 1);
      Object.assign(requestPayload, parseOptionalJsonObject(body.forgeNeoPayloadJson, "Forge Neo txt2img追加JSON"));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }
  if (!requestPayload.scheduler) delete requestPayload.scheduler;
  try {
    const response = await fetch(forgeEndpoint(baseUrl, "/sdapi/v1/txt2img"), {
      method: "POST",
      headers: forgeHeaders(apiKey, {
        accept: "application/json",
        "content-type": "application/json"
      }),
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(12 * 60 * 1000)
    });
    const payload = await forgeJson(response);
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: readableProviderError(payload) || `${label} が ${response.status} を返しました。`,
        providerPayload: scrubForgePayload(payload),
        request: requestPayload
      });
    }
    const sourceImages = Array.isArray(payload.images) ? payload.images : [];
    if (!sourceImages.length) {
      return sendJson(res, 502, {
        error: `${label}の生成結果に画像がありませんでした。`,
        providerPayload: scrubForgePayload(payload),
        request: requestPayload
      });
    }
    const generationId = crypto.randomUUID();
    const images = [];
    for (let index = 0; index < sourceImages.length; index += 1) {
      images.push(await saveForgeImage({
        image: sourceImages[index],
        workName,
        title,
        generationId,
        index,
        label
      }));
    }
    sendJson(res, 200, {
      id: generationId,
      status: "succeeded",
      progress: 100,
      images,
      providerPayload: scrubForgePayload(payload),
      request: requestPayload
    });
  } catch (error) {
    sendJson(res, 502, { error: `${label} への生成投入に失敗しました: ${error.message}` });
  }
}

async function handleComfyCheck(req, res) {
  const body = await readJson(req, 1024 * 1024);
  const { baseUrl } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "COMFY_API_KEY", "COMFY_CLOUD_API_KEY");
  try {
    let response;
    try {
      response = await fetch(comfyEndpoint(baseUrl, "/system_stats"), {
        headers: comfyHeaders(apiKey, { accept: "application/json" }),
        signal: AbortSignal.timeout(15000)
      });
    } catch (error) {
      throw new Error(comfyConnectionErrorMessage(baseUrl, error));
    }
    const payload = await comfyJson(response);
    if (!response.ok) return sendJson(res, response.status, payload);
    sendJson(res, 200, {
      ok: true,
      system: payload.system || payload,
      devices: payload.devices || []
    });
  } catch (error) {
    sendJson(res, 502, { error: `ComfyUI 接続確認に失敗しました: ${error.message}` });
  }
}

async function handleComfyModels(req, res) {
  const body = await readJson(req, 1024 * 1024);
  const { baseUrl } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "COMFY_API_KEY", "COMFY_CLOUD_API_KEY");
  if (!baseUrl) return sendJson(res, 400, { error: "ComfyUI のURLが未設定です。" });
  try {
    const objectInfo = await fetchComfyObjectInfo(baseUrl, apiKey);
    const models = extractComfyModels(objectInfo);
    sendJson(res, 200, {
      ok: true,
      ...models,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    sendJson(res, 502, { error: `ComfyUI モデル一覧の取得に失敗しました: ${error.message}` });
  }
}

async function handleComfyValidate(req, res) {
  const body = await readJson(req, 12 * 1024 * 1024);
  const modelInfo = { checkpoints: [], checkpointModels: [], diffusionModels: [], loras: [], textEncoders: [], vaes: [], samplers: [], schedulers: [] };
  const modelWarnings = [];
  const apiKey = apiKeyFromRequest(body.apiKey, "COMFY_API_KEY", "COMFY_CLOUD_API_KEY");
  if (body.baseUrl) {
    try {
      Object.assign(modelInfo, extractComfyModels(await fetchComfyObjectInfo(body.baseUrl, apiKey)));
    } catch (error) {
      modelWarnings.push(`ComfyUIモデル一覧を取得できませんでした: ${error.message}`);
    }
    modelInfo.checkpointInspection = await inspectLocalComfyCheckpoint(body.baseUrl, body.checkpoint);
  }
  const result = validateComfyWorkflowRequest(body, modelInfo);
  result.warnings = [...(result.warnings || []), ...modelWarnings];
  result.models = {
    checkpointCount: modelInfo.checkpoints.length,
    diffusionModelCount: modelInfo.diffusionModels.length,
    loraCount: modelInfo.loras.length,
    textEncoderCount: modelInfo.textEncoders.length,
    vaeCount: modelInfo.vaes.length,
    samplerCount: modelInfo.samplers.length,
    schedulerCount: modelInfo.schedulers.length
  };
  sendJson(res, result.ok ? 200 : 400, result);
}

async function handleComfyCreate(req, res) {
  const body = await readJson(req, 12 * 1024 * 1024);
  const { baseUrl } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "COMFY_API_KEY", "COMFY_CLOUD_API_KEY");
  if (!baseUrl) return sendJson(res, 400, { error: "ComfyUI のURLが未設定です。" });
  if (!body.prompt) return sendJson(res, 400, { error: "画像生成プロンプトが必要です。" });
  try {
    let modelInfo = { checkpoints: [], checkpointModels: [], diffusionModels: [], loras: [], textEncoders: [], vaes: [], samplers: [], schedulers: [] };
    try {
      modelInfo = extractComfyModels(await fetchComfyObjectInfo(baseUrl, apiKey));
    } catch {
      modelInfo = { checkpoints: [], checkpointModels: [], diffusionModels: [], loras: [], textEncoders: [], vaes: [], samplers: [], schedulers: [] };
    }
    modelInfo.checkpointInspection = await inspectLocalComfyCheckpoint(baseUrl, body.checkpoint);
    const validation = validateComfyWorkflowRequest(body, modelInfo);
    if (!validation.ok) {
      return sendJson(res, 400, {
        error: validation.errors.join(" / "),
        validation
      });
    }
    const uploadedReferences = await uploadComfyReferenceImages(baseUrl, apiKey, body.references);
    const workflow = patchComfyWorkflow(body.workflowJson || body.workflow, {
      ...body,
      references: uploadedReferences
    });
    const clientId = crypto.randomUUID();
    const requestPayload = {
      client_id: clientId,
      prompt: workflow
    };
    const response = await fetch(comfyEndpoint(baseUrl, "/prompt"), {
      method: "POST",
      headers: comfyHeaders(apiKey, {
        accept: "application/json",
        "content-type": "application/json"
      }),
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(30000)
    });
    const payload = await comfyJson(response);
    const nodeErrors = payload.node_errors || payload.nodeErrors || {};
    const hasNodeErrors = nodeErrors && typeof nodeErrors === "object" && Object.keys(nodeErrors).length > 0;
    if (!response.ok || hasNodeErrors) {
      return sendJson(res, response.ok ? 400 : response.status, {
        error: readableComfyNodeErrors(nodeErrors) || readableProviderError(payload.error) || readableProviderError(payload) || `ComfyUI が ${response.status} を返しました。`,
        providerPayload: payload,
        request: { ...requestPayload, prompt: scrubComfyWorkflow(workflow) }
      });
    }
    const promptId = extractComfyPromptId(payload);
    if (!promptId) {
      return sendJson(res, 502, {
        error: "ComfyUI の prompt_id を取得できませんでした。",
        providerPayload: payload,
        request: { ...requestPayload, prompt: scrubComfyWorkflow(workflow) }
      });
    }
    sendJson(res, 200, {
      ...payload,
      id: promptId,
      status: "submitted",
      referenceUploads: uploadedReferences.map((item) => ({
        key: item.key,
        name: item.name,
        nodeId: item.nodeId,
        inputName: item.inputName,
        url: item.url,
        comfyFileName: item.comfyFileName,
        comfySubfolder: item.comfySubfolder,
        comfyType: item.comfyType
      })),
      request: { ...requestPayload, prompt: scrubComfyWorkflow(workflow) }
    });
  } catch (error) {
    const message = error instanceof SyntaxError ? `ComfyUI workflow JSON を読み取れません: ${error.message}` : error.message;
    sendJson(res, 502, { error: `ComfyUI への生成投入に失敗しました: ${message}` });
  }
}

async function handleComfyStatus(req, res) {
  const body = await readJson(req, 1024 * 1024);
  const { baseUrl, promptId, workName, title } = body;
  const apiKey = apiKeyFromRequest(body.apiKey, "COMFY_API_KEY", "COMFY_CLOUD_API_KEY");
  if (!baseUrl) return sendJson(res, 400, { error: "ComfyUI のURLが未設定です。" });
  if (!promptId) return sendJson(res, 400, { error: "promptId が必要です。" });
  try {
    const historyResponse = await fetch(comfyEndpoint(baseUrl, `/history/${encodeURIComponent(promptId)}`), {
      headers: comfyHeaders(apiKey, { accept: "application/json" }),
      signal: AbortSignal.timeout(30000)
    });
    const historyPayload = await comfyJson(historyResponse);
    if (!historyResponse.ok) return sendJson(res, historyResponse.status, historyPayload);
    const historyItem = findComfyHistoryItem(historyPayload, promptId);
    const statusFromHistory = normalizeComfyStatus(historyItem?.status?.status_str || historyItem?.status?.status || historyItem?.status);
    const sourceImages = extractComfyImages(historyItem);
    if (sourceImages.length) {
      const images = [];
      for (let index = 0; index < sourceImages.length; index += 1) {
        images.push(await saveComfyImage({
          baseUrl,
          apiKey,
          image: sourceImages[index],
          promptId,
          workName,
          title,
          index
        }));
      }
      return sendJson(res, 200, {
        status: "succeeded",
        progress: 100,
        images,
        providerPayload: historyPayload
      });
    }
    if (statusFromHistory === "failed") {
      return sendJson(res, 200, {
        status: "failed",
        progress: null,
        error: extractComfyExecutionError(historyItem) || readableProviderError(historyItem?.status?.messages) || "ComfyUI 生成が失敗しました。",
        providerPayload: historyPayload
      });
    }
    let queueStatus = statusFromHistory || "pending";
    try {
      const queueResponse = await fetch(comfyEndpoint(baseUrl, "/queue"), {
        headers: comfyHeaders(apiKey, { accept: "application/json" }),
        signal: AbortSignal.timeout(15000)
      });
      if (queueResponse.ok) {
        queueStatus = comfyQueueStatus(await comfyJson(queueResponse), promptId);
      }
    } catch {
      // History is enough for the UI to keep polling.
    }
    sendJson(res, 200, {
      status: queueStatus,
      progress: null,
      images: [],
      providerPayload: historyPayload
    });
  } catch (error) {
    sendJson(res, 502, { error: `ComfyUI タスク確認に失敗しました: ${error.message}` });
  }
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
  const apiKey = seedanceApiKeyFromRequest(body.apiKey, baseUrl);
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
    } else if (provider === "replicate") {
      requestPayload = await buildReplicateVideoPayload({
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
    const scrubbedRequest = scrubSeedanceRequestPayload(requestPayload);
    const endpoint = provider === "replicate" ? replicatePredictionEndpoint(baseUrl, model) : normalizeSeedanceBaseUrl(baseUrl);

    const response = await fetch(endpoint, {
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
    const providerError = readableProviderError(payload?.error);
    if (!response.ok || providerError) {
      return sendJson(res, response.ok ? 400 : response.status, {
        error: providerError || readableProviderError(payload) || `Seedance が ${response.status} を返しました。`,
        providerPayload: payload,
        request: scrubbedRequest
      });
    }
    const taskId = extractTaskId(payload);
    if (!taskId) {
      return sendJson(res, 502, {
        error: "Seedance の task id を取得できませんでした。",
        providerPayload: payload,
        request: scrubbedRequest
      });
    }
    sendJson(res, 200, {
      ...payload,
      id: taskId,
      status: normalizeSeedanceStatus(payload.status || payload?.data?.status),
      progress: extractSeedanceProgress(payload),
      progressMessage: extractSeedanceProgressMessage(payload),
      request: scrubbedRequest
    });
  } catch (error) {
    sendJson(res, 502, { error: `Seedance への接続に失敗しました: ${error.message}` });
  }
}

async function handleSeedanceStatus(req, res) {
  const body = await readJson(req);
  const { baseUrl, taskId } = body;
  const apiKey = seedanceApiKeyFromRequest(body.apiKey, baseUrl);
  if (!apiKey) return sendJson(res, 400, { error: "Seedance API キーが未設定です。" });
  if (!taskId) return sendJson(res, 400, { error: "taskId が必要です。" });
  try {
    const provider = seedanceProviderFromBaseUrl(baseUrl);
    const endpoint = provider === "replicate"
      ? replicatePredictionStatusEndpoint(baseUrl, taskId)
      : `${normalizeSeedanceBaseUrl(baseUrl)}/${encodeURIComponent(taskId)}`;
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
      progress: status === "succeeded" ? 100 : extractSeedanceProgress(payload),
      progressMessage: extractSeedanceProgressMessage(payload),
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
    const access = clientAccess(req);

    if (req.method === "GET" && url.pathname === "/api/session") {
      return sendJson(res, 200, {
        mode: access.mode,
        remoteAddress: access.remoteAddress,
        canUseSettings: access.canUseSettings,
        canRevealFiles: access.canRevealFiles,
        allowedViews: access.mode === "lan" ? ["studio", "import", "gallery", "image", "audio", "video", "edit", "edit-aspect"] : null,
        networkUrls: networkUrls()
      });
    }

    if (blockLanApiIfNeeded(req, res, url)) return;

    if (req.method === "GET" && url.pathname === "/api/db") {
      return sendJson(res, 200, await readDb());
    }

    if (req.method === "PUT" && url.pathname === "/api/db") {
      const db = await readJson(req);
      const currentDb = await readDb();
      const nextDb = access.mode === "lan"
        ? { ...emptyDb, ...db, settings: currentDb.settings, schemaVersion: 1 }
        : { ...emptyDb, ...db, schemaVersion: 1 };
      await writeDb(nextDb);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/upload") {
      return await handleUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/media-upload") {
      return await handleMediaUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/remove-bg") {
      return await handleRemoveBackground(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/rembg/status") {
      return await handleRembgStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/rembg/setup") {
      return await handleRembgSetup(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/rembg/remove") {
      return await handleRembgRemove(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/backgroundremover/status") {
      return await handleBackgroundRemoverStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/backgroundremover/setup") {
      return await handleBackgroundRemoverSetup(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/backgroundremover/image") {
      return await handleBackgroundRemoverImage(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/backgroundremover/video") {
      return await handleBackgroundRemoverVideo(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/image-edit/video-gif/status") {
      return await handleVideoGifStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/image-edit/video-gif") {
      return await handleVideoGifConvert(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/audio-edit/status") {
      return await handleAudioEditStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/audio-edit/process") {
      return await handleAudioEditProcess(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/trash-import-source") {
      return await handleTrashImportSource(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/move-upload") {
      return await handleMoveUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/reveal-upload") {
      return await handleRevealUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/reveal-audio") {
      return await handleRevealAudio(req, res);
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

    if (req.method === "POST" && url.pathname === "/api/voicebox/profiles") {
      return await handleVoiceboxProfiles(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/voicebox/speech") {
      return await handleVoiceboxSpeech(req, res);
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

    if (req.method === "POST" && url.pathname === "/api/voxcpm/status") {
      return await handleVoxcpmStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/voxcpm/setup") {
      return await handleVoxcpmSetup(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/voxcpm/speech") {
      return await handleVoxcpmSpeech(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/misotts/status") {
      return await handleMisoTtsStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/misotts/setup") {
      return await handleMisoTtsSetup(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/misotts/speech") {
      return await handleMisoTtsSpeech(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/exchange-rate/usd-jpy") {
      return await handleUsdJpyRate(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/animadex/search") {
      return await handleAnimaDexSearch(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/animadex/facets") {
      return await handleAnimaDexFacets(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/animadex/media") {
      return await handleAnimaDexMedia(req, res, url);
    }

    if (req.method === "GET" && url.pathname === "/api/seedance/guide") {
      return await handleSeedanceGuide(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/model-library/local") {
      return await handleModelLibraryLocal(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/model-library/search") {
      return await handleModelLibrarySearch(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/model-library/download") {
      return await handleModelLibraryDownload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/model-library/download-status") {
      return await handleModelLibraryDownloadStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/model-library/uninstall") {
      return await handleModelLibraryUninstall(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/comfy/check") {
      return await handleComfyCheck(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/comfy/models") {
      return await handleComfyModels(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/comfy/validate") {
      return await handleComfyValidate(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/comfy/create") {
      return await handleComfyCreate(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/comfy/status") {
      return await handleComfyStatus(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/forge/check") {
      return await handleForgeCheck(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/forge/models") {
      return await handleForgeModels(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/forge/create") {
      return await handleForgeCreate(req, res);
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
      const served = await serveFile(req, res, filePath, { cacheControl: "no-store" });
      if (!served) return sendText(res, 404, "Not found");
      return;
    }

    sendText(res, 405, "Method not allowed");
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Creative File Studio: http://localhost:${port}`);
  if (host === "0.0.0.0" || host === "::") {
    const urls = networkUrls();
    if (urls.length) {
      console.log("Smartphone access on the same network:");
      urls.forEach((url) => console.log(`  ${url}`));
    }
  }
});
