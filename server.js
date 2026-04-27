import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(dataDir, "uploads");
const dbPath = path.join(dataDir, "db.json");
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
  ".svg": "image/svg+xml"
};

const emptyDb = {
  schemaVersion: 1,
  settings: {
    defaultModel: "google/gemini-2.5-flash",
    textModel: "google/gemini-2.5-flash"
  },
  works: [],
  characters: [],
  assets: []
};

await fs.mkdir(uploadDir, { recursive: true });

async function readDb() {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return { ...emptyDb, ...JSON.parse(raw) };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeDb(emptyDb);
    return structuredClone(emptyDb);
  }
}

async function writeDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
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

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 28 * 1024 * 1024) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readJson(req) {
  const body = await readBody(req);
  return body ? JSON.parse(body) : {};
}

function safeUploadName(originalName, ext) {
  const parsed = path.parse(path.basename(originalName || "image"));
  const base = (parsed.name || "image").replace(/[^\w.-]+/g, "_").slice(0, 80);
  return `${Date.now()}-${crypto.randomUUID()}-${base || "image"}${ext}`;
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
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(dataUrl || "")) {
    return sendJson(res, 400, { error: "画像の data URL が必要です。" });
  }
  const [, type, base64] = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
  const ext = type.toLowerCase() === "jpeg" ? ".jpg" : `.${type.toLowerCase()}`;
  const fileName = safeUploadName(name, ext);
  const workFolder = safeFolderName(workName, "_未分類作品");
  const characterFolder = safeFolderName(characterName, "_未割当");
  const destinationDir = path.join(uploadDir, workFolder, characterFolder);
  await fs.mkdir(destinationDir, { recursive: true });
  const filePath = path.join(destinationDir, fileName);
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));
  sendJson(res, 200, { url: uploadUrlFor(filePath), path: filePath });
}

async function handleMoveUpload(req, res) {
  const { url, workName, characterName } = await readJson(req);
  if (!url) return sendJson(res, 400, { error: "画像URLが必要です。" });
  const moved = await moveUploadToFolders(url, workName, characterName);
  sendJson(res, 200, moved);
}

async function handleRevealUpload(req, res) {
  const { url } = await readJson(req);
  if (!url) return sendJson(res, 400, { error: "画像URLが必要です。" });
  const filePath = uploadPathFromUrl(url);
  await fs.access(filePath);
  if (process.platform === "darwin") {
    spawn("open", ["-R", filePath], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "win32") {
    spawn("explorer.exe", ["/select,", filePath], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [path.dirname(filePath)], { detached: true, stdio: "ignore" }).unref();
  }
  sendJson(res, 200, { ok: true, path: filePath });
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
      return handleUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/move-upload") {
      return handleMoveUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/reveal-upload") {
      return handleRevealUpload(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/openrouter/chat") {
      return handleOpenRouter(req, res);
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
