import { handleArcadeXpRequest } from "./arcade-xp.mjs";
import { handleBuddyRequest } from "./buddy.mjs";
import { handleCommentsRequest } from "./comments.mjs";
import { handleCrossRoadRequest } from "./cross-road.mjs";
import { handleDiscordProfileFrameRequest } from "./discord-profile-frame.mjs";
import { handleDiscordStreakRequest } from "./discord-streak.mjs";
import { handleGameImageRequest } from "./game-image.mjs";
import { handleMadraceRequest } from "./madrace.mjs";
import { handlePlayerRequest } from "./player.mjs";
import { handleSpaceCadetPinballRequest } from "./space-cadet-pinball.mjs";
import { handleSteamPlaytimeRequest } from "./steam-playtime.mjs";
import { handleTowerBlockRequest } from "./tower-block.mjs";
import { handleVersionRequest } from "./version.mjs";
import { handleVisitsRequest } from "./visits.mjs";
import { handleTradeDexVirusTotalRequest } from "./virustotal.mjs";
import { handleWeatherRequest } from "./weather.mjs";

// Tabla unica de la API. La usan server.mjs (produccion) y el middleware de
// vite.config.js (desarrollo): antes cada uno tenia su propia lista y se
// desincronizaban; /api/arcade-xp y /api/game-image solo existian en
// produccion, asi que en dev devolvian el index.html.
//
// Los handlers reciben siempre la URL completa (/api/...), igual en los dos
// servidores. Este modulo no puede tener efectos al importarse: vite.config.js
// lo carga tambien durante el build.
const exact = (path) => (pathname) => pathname === path;
const under = (path) => (pathname) => pathname === path || pathname.startsWith(`${path}/`);
const below = (path) => (pathname) => pathname.startsWith(`${path}/`);

export const API_ROUTES = [
  { match: exact("/api/player"), handle: handlePlayerRequest },
  { match: below("/api/tradedex"), handle: handleTradeDexVirusTotalRequest },
  { match: exact("/api/discord-streak"), handle: handleDiscordStreakRequest },
  { match: exact("/api/discord-profile-frame"), handle: handleDiscordProfileFrameRequest },
  { match: exact("/api/steam-playtime"), handle: handleSteamPlaytimeRequest },
  { match: under("/api/comments"), handle: handleCommentsRequest },
  { match: under("/api/visits"), handle: handleVisitsRequest },
  { match: exact("/api/arcade-xp"), handle: handleArcadeXpRequest },
  { match: below("/api/madrace"), handle: handleMadraceRequest },
  { match: below("/api/drive-mad"), handle: handleMadraceRequest },
  { match: below("/api/tower-block"), handle: handleTowerBlockRequest },
  { match: below("/api/cross-road"), handle: handleCrossRoadRequest },
  { match: below("/api/space-cadet-pinball"), handle: handleSpaceCadetPinballRequest },
  { match: under("/api/buddy"), handle: handleBuddyRequest },
  { match: exact("/api/game-image"), handle: handleGameImageRequest },
  { match: exact("/api/weather"), handle: (request, response) => handleWeatherRequest(request, response) },
  { match: exact("/api/version"), handle: (request, response) => handleVersionRequest(request, response) }
];

export function findApiRoute(pathname) {
  return API_ROUTES.find((route) => route.match(pathname)) || null;
}

// Devuelve false si la ruta no es de la API, para que el llamante siga con
// los estaticos. Una ruta /api desconocida contesta 404 en JSON en vez de caer
// en el index.html.
export async function handleApiRequest(request, response) {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  if (pathname !== "/api" && !pathname.startsWith("/api/")) return false;
  const route = findApiRoute(pathname);
  if (route) {
    await route.handle(request, response);
    return true;
  }
  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ error: "API route not found." }));
  return true;
}
