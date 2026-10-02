import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { startDiscordStreakPolling } from "./server/discord-streak.mjs";
import { loadLocalEnv } from "./server/env.mjs";
import { getCacheControl as assetCacheControl, loadHashedAssets } from "./server/asset-cache.mjs";
import { assertSessionConfiguration } from "./server/http-guards.mjs";
import { handleApiRequest } from "./server/routes.mjs";
import { applySecurityHeaders } from "./server/security-headers.mjs";

process.on("uncaughtException", (error) => {
  console.error("[server] uncaught exception", error?.stack || error);
});

process.on("unhandledRejection", (error) => {
  console.error("[server] unhandled rejection", error?.stack || error);
});

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const staticRoot = join(root, "dist");
const hashedAssets = loadHashedAssets(staticRoot);
const getCacheControl = (file) => assetCacheControl(file, hashedAssets);
loadLocalEnv(root);
assertSessionConfiguration(true);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml; charset=utf-8",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".vrm": "model/gltf-binary",
  ".vrma": "model/gltf-binary",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream"
};

// ETag debil por tamano + mtime: basta para contestar 304 sin releer ni reenviar
// el archivo completo cuando el navegador revalida.
async function getEntityTag(filePath) {
  if (getCacheControl(filePath) === "no-store") return "";

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) return "";
    return `W/"${stats.size.toString(16)}-${Math.trunc(stats.mtimeMs).toString(16)}"`;
  } catch {
    return "";
  }
}

function resolvePath(url) {
  const pathname = new URL(url, `http://localhost:${port}`).pathname;
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^[/\\]+/, "");
  const cleanPath = normalize(decodeURIComponent(relativePath)).replace(/^(\.\.[/\\])+/, "");
  return join(staticRoot, cleanPath);
}

const appServer = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://localhost:${port}`);

    applySecurityHeaders(request, response, requestUrl.pathname);

    if (await handleApiRequest(request, response)) return;

    const filePath = resolvePath(request.url || "/");
    let data;
    let contentType = types[extname(filePath).toLowerCase()] || "application/octet-stream";
    let spaFallback = false;

    const entityTag = await getEntityTag(filePath);
    if (entityTag && request.headers["if-none-match"] === entityTag) {
      response.writeHead(304, {
        "Cache-Control": getCacheControl(filePath),
        ETag: entityTag
      });
      response.end();
      return;
    }

    try {
      data = await readFile(filePath);
    } catch (error) {
      if (extname(requestUrl.pathname)) {
        throw error;
      }

      data = await readFile(join(staticRoot, "index.html"));
      contentType = types[".html"];
      spaFallback = true;
    }

    const normalizedPath = requestUrl.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const deniedRoute = ["/403", "/access-denied", "/forbidden"].includes(normalizedPath)
      || ["/admin", "/private", "/restricted", "/system"].some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
    const responseStatus = spaFallback ? (deniedRoute ? 403 : 404) : 200;

    response.writeHead(responseStatus, {
      "Content-Type": contentType,
      "Content-Length": data.byteLength,
      "Cache-Control": spaFallback ? "no-store" : getCacheControl(filePath),
      ...(entityTag && !spaFallback ? { ETag: entityTag } : {})
    });
    response.end(data);
  } catch (error) {
    const requestUrl = new URL(request.url || "/", `http://localhost:${port}`);
    const traceId = randomTraceId();
    console.error(`[server] ${traceId} ${request.method} ${request.url}`, error?.stack || error);

    if (requestUrl.pathname.startsWith("/api/")) {
      response.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Daivr-Trace": traceId
      });
      response.end(JSON.stringify({ error: "Server route failed.", traceId }));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Daivr-Trace": traceId });
    response.end("Not found");
  }
});

appServer.requestTimeout = 0;
appServer.headersTimeout = 65_000;
appServer.keepAliveTimeout = 65_000;

appServer.listen(port, () => {
  console.log(`daivr.dev preview running at http://localhost:${port}`);
  startDiscordStreakPolling();
});

function randomTraceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
