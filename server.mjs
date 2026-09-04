import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { handleArcadeXpRequest } from "./server/arcade-xp.mjs";
import { handleBuddyRequest } from "./server/buddy.mjs";
import { handleCommentsRequest } from "./server/comments.mjs";
import { handleCrossRoadRequest } from "./server/cross-road.mjs";
import { handleDiscordProfileFrameRequest } from "./server/discord-profile-frame.mjs";
import { handleDiscordStreakRequest, startDiscordStreakPolling } from "./server/discord-streak.mjs";
import { handleMadraceRequest } from "./server/madrace.mjs";
import { loadLocalEnv } from "./server/env.mjs";
import { handleSteamPlaytimeRequest } from "./server/steam-playtime.mjs";
import { handleTradeDexVirusTotalRequest } from "./server/virustotal.mjs";
import { handleTowerBlockRequest } from "./server/tower-block.mjs";
import { handleVisitsRequest } from "./server/visits.mjs";

process.on("uncaughtException", (error) => {
  console.error("[server] uncaught exception", error?.stack || error);
});

process.on("unhandledRejection", (error) => {
  console.error("[server] unhandled rejection", error?.stack || error);
});

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const staticRoot = join(root, "dist");
loadLocalEnv(root);
const steamGridApiKey = process.env.STEAMGRID_API_KEY || "";
const steamGridCache = new Map();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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
  ".webm": "video/webm"
};

// Los bundles de Vite llevan hash en el nombre, asi que pueden marcarse inmutables.
const HASHED_TYPES = new Set([".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".ico", ".svg"]);

// Binarios pesados que conservan su nombre entre builds (el VRM del avatar del
// splash pesa 13 MB): se cachean y se revalidan por ETag en vez de descargarse
// enteros en cada visita, que es lo que hacia el "no-store" por defecto.
const REVALIDATED_TYPES = new Set([
  ".avif", ".gif", ".woff", ".woff2", ".ttf", ".otf",
  ".glb", ".gltf", ".vrm", ".vrma",
  ".mp3", ".ogg", ".wav", ".mp4", ".webm"
]);

function getCacheControl(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".html") return "no-store";
  if (HASHED_TYPES.has(extension)) return "public, max-age=31536000, immutable";
  if (REVALIDATED_TYPES.has(extension)) return "public, max-age=86400, stale-while-revalidate=604800";
  return "no-store";
}

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

async function getGameImageFromSteamGrid(gameName) {
  if (!steamGridApiKey || !gameName) return null;

  const key = gameName.trim().toLowerCase();
  if (!key) return null;
  if (steamGridCache.has(key)) return steamGridCache.get(key);

  try {
    const searchResponse = await fetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`,
      {
        headers: {
          Authorization: `Bearer ${steamGridApiKey}`
        }
      }
    );

    if (!searchResponse.ok) throw new Error(`SteamGrid search returned ${searchResponse.status}`);

    const searchPayload = await searchResponse.json();
    const gameId = searchPayload?.data?.[0]?.id;
    if (!gameId) {
      steamGridCache.set(key, null);
      return null;
    }

    const iconResponse = await fetch(`https://www.steamgriddb.com/api/v2/icons/game/${gameId}`, {
      headers: {
        Authorization: `Bearer ${steamGridApiKey}`
      }
    });

    if (!iconResponse.ok) throw new Error(`SteamGrid icons returned ${iconResponse.status}`);

    const iconPayload = await iconResponse.json();
    const url = iconPayload?.data?.[0]?.url || null;
    steamGridCache.set(key, url);
    return url;
  } catch (error) {
    console.error("SteamGridDB error", error.message || error);
    steamGridCache.set(key, null);
    return null;
  }
}

const appServer = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://localhost:${port}`);

    if (requestUrl.pathname.startsWith("/api/tradedex/")) {
      await handleTradeDexVirusTotalRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/discord-streak") {
      await handleDiscordStreakRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/discord-profile-frame") {
      await handleDiscordProfileFrameRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/steam-playtime") {
      await handleSteamPlaytimeRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/comments" || requestUrl.pathname.startsWith("/api/comments/")) {
      await handleCommentsRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/visits" || requestUrl.pathname.startsWith("/api/visits/")) {
      await handleVisitsRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/arcade-xp") {
      await handleArcadeXpRequest(request, response);
      return;
    }

    if (requestUrl.pathname.startsWith("/api/madrace/") || requestUrl.pathname.startsWith("/api/drive-mad/")) {
      await handleMadraceRequest(request, response);
      return;
    }

    if (requestUrl.pathname.startsWith("/api/tower-block/")) {
      await handleTowerBlockRequest(request, response);
      return;
    }

    if (requestUrl.pathname.startsWith("/api/cross-road/")) {
      await handleCrossRoadRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/buddy" || requestUrl.pathname.startsWith("/api/buddy/")) {
      await handleBuddyRequest(request, response);
      return;
    }

    if (requestUrl.pathname === "/api/game-image") {
      const name = requestUrl.searchParams.get("name");
      if (!name) {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Missing name parameter" }));
        return;
      }

      const url = await getGameImageFromSteamGrid(name);
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify({ url }));
      return;
    }

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
