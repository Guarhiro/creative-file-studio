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
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(dataDir, "uploads");
const videoDir = path.join(dataDir, "videos");
const audioDir = path.join(dataDir, "audios");
const dbPath = path.join(dataDir, "db.json");
const seedanceGuidePath = path.join(__dirname, "Seedance2.0_Prompt_Guide_v2.md");
const irodoriSetupScriptPath = path.join(__dirname, "scripts", "setup-irodori.sh");
const rembgSetupScriptPath = path.join(__dirname, "scripts", "setup-rembg.sh");
const rembgRemoveScriptPath = path.join(__dirname, "scripts", "rembg-remove.py");
const backgroundRemoverSetupScriptPath = path.join(__dirname, "scripts", "setup-backgroundremover.sh");
const backgroundRemoverRunScriptPath = path.join(__dirname, "scripts", "backgroundremover-run.py");
const backgroundRemoverSitecustomizeDir = path.join(__dirname, "scripts", "backgroundremover_sitecustomize");
const irodoriVendorDir = path.join(__dirname, "vendor", "Irodori-TTS");
const rembgVenvDir = path.join(__dirname, "vendor", "rembg-venv");
const rembgModelsDir = path.join(dataDir, "rembg-models");
const backgroundRemoverVenvDir = path.join(__dirname, "vendor", "backgroundremover-venv");
const backgroundRemoverHomeDir = path.join(dataDir, "backgroundremover-home");
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
    seedanceResolution: "720p",
    comfy: {
      gpuMode: "local",
      localBaseUrl: "http://127.0.0.1:8188",
      cloudBaseUrl: "",
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
  const { apiKey, dataUrl, name, size = "auto" } = await readJson(req, 64 * 1024 * 1024);
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
    const boundedStart = max === null ? start : Math.min(start, max);
    const boundedEnd = max === null ? end : Math.min(end, max);
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
    if (range.start > cursor + 0.01) segments.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (Number.isFinite(duration) && duration > 0) {
    if (duration > cursor + 0.01) segments.push({ start: cursor, end: duration });
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

async function ensureAudioEditOutput(result, outputPath, label) {
  if (!result.ok) {
    throw new Error(`${label}に失敗しました: ${result.stderr || result.stdout || result.error || "unknown error"}`);
  }
  if (/Output file is empty|Conversion failed/i.test(`${result.stderr}\n${result.stdout}`)) {
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
    apiKey,
    model = "google/gemini-3.1-flash-tts-preview",
    input,
    voice = "Kore",
    responseFormat = "mp3",
    speed,
    title = "generated-audio"
  } = body;
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
  const body = await readJson(req, 2 * 1024 * 1024);
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
  } = body;
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
  return {
    checkpoints: comfyInputChoiceList(payload, ["CheckpointLoaderSimple", "CheckpointLoader", "unCLIPCheckpointLoader"], "ckpt_name"),
    loras: comfyInputChoiceList(payload, ["LoraLoader", "LoraLoaderModelOnly"], "lora_name")
  };
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
  const checkpointNames = Array.isArray(modelInfo.checkpoints) ? modelInfo.checkpoints : [];
  if (checkpointName && checkpointNames.length && !checkpointNames.includes(checkpointName)) {
    errors.push(`Checkpoint「${checkpointName}」がComfyUIの一覧にありません。`);
  }
  const loraNames = Array.isArray(modelInfo.loras) ? modelInfo.loras : [];
  if (loras.length && loraNames.length) {
    loras.forEach((lora) => {
      if (!loraNames.includes(lora.name)) errors.push(`LoRA「${lora.name}」がComfyUIの一覧にありません。`);
    });
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
  if (checkpointName && !checkpointNames.length) warnings.push("Checkpoint一覧を取得できていないため、Checkpoint名の存在確認は未実施です。");

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
  patchComfyNodeInput(prompt, options.checkpointNodeId, ["ckpt_name"], String(options.checkpoint || "").trim());
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
  const outputs = historyItem.outputs || historyItem.output || historyItem.data?.outputs || {};
  const images = [];
  for (const [nodeId, output] of Object.entries(outputs || {})) {
    const nodeImages = Array.isArray(output?.images) ? output.images : [];
    nodeImages.forEach((image, index) => {
      if (image?.filename) images.push({ ...image, nodeId, index });
    });
  }
  return images;
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

async function handleComfyCheck(req, res) {
  const { baseUrl, apiKey } = await readJson(req, 1024 * 1024);
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
  const { baseUrl, apiKey } = await readJson(req, 1024 * 1024);
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
  const modelInfo = { checkpoints: [], loras: [] };
  const modelWarnings = [];
  if (body.baseUrl) {
    try {
      Object.assign(modelInfo, extractComfyModels(await fetchComfyObjectInfo(body.baseUrl, body.apiKey)));
    } catch (error) {
      modelWarnings.push(`ComfyUIモデル一覧を取得できませんでした: ${error.message}`);
    }
  }
  const result = validateComfyWorkflowRequest(body, modelInfo);
  result.warnings = [...(result.warnings || []), ...modelWarnings];
  result.models = {
    checkpointCount: modelInfo.checkpoints.length,
    loraCount: modelInfo.loras.length
  };
  sendJson(res, result.ok ? 200 : 400, result);
}

async function handleComfyCreate(req, res) {
  const body = await readJson(req, 12 * 1024 * 1024);
  const { baseUrl, apiKey } = body;
  if (!baseUrl) return sendJson(res, 400, { error: "ComfyUI のURLが未設定です。" });
  if (!body.prompt) return sendJson(res, 400, { error: "画像生成プロンプトが必要です。" });
  try {
    const validation = validateComfyWorkflowRequest(body);
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
        error: readableProviderError(payload.error) || readableProviderError(nodeErrors) || readableProviderError(payload) || `ComfyUI が ${response.status} を返しました。`,
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
  const { baseUrl, apiKey, promptId, workName, title } = await readJson(req, 1024 * 1024);
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
        error: readableProviderError(historyItem?.status?.messages) || "ComfyUI 生成が失敗しました。",
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
  const { apiKey, baseUrl, taskId } = await readJson(req);
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

    if (req.method === "GET" && url.pathname === "/api/exchange-rate/usd-jpy") {
      return await handleUsdJpyRate(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/seedance/guide") {
      return await handleSeedanceGuide(req, res);
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

server.listen(port, "127.0.0.1", () => {
  console.log(`Creative File Studio: http://localhost:${port}`);
});
