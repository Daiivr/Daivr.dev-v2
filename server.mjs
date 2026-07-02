import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readFile } from "node:fs/promises";
import { handleCommentsRequest } from "./server/comments.mjs";
import { handleDiscordStreakRequest } from "./server/discord-streak.mjs";
import { loadLocalEnv } from "./server/env.mjs";
import { handleSteamPlaytimeRequest } from "./server/steam-playtime.mjs";
import { handleTradeDexVirusTotalRequest } from "./server/virustotal.mjs";
import { handleVisitsRequest } from "./server/visits.mjs";

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
  ".svg": "image/svg+xml; charset=utf-8"
};

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

createServer(async (request, response) => {
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
    let contentType = types[extname(filePath)] || "application/octet-stream";

    try {
      data = await readFile(filePath);
    } catch (error) {
      if (extname(requestUrl.pathname)) {
        throw error;
      }

      data = await readFile(join(staticRoot, "index.html"));
      contentType = types[".html"];
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, () => {
  console.log(`daivr.dev preview running at http://localhost:${port}`);
});
