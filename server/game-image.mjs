import { isKnownActivityName } from "./discord-streak.mjs";

// Icono de SteamGridDB para las actividades de Discord que no traen imagen.
// Antes buscaba cualquier nombre que llegara en la URL, gastando la cuota de
// la API key en texto arbitrario, y lo guardaba en un Map que crecia sin fin.
const MAX_NAME_LENGTH = 100;
const MAX_CACHED = 200;
const HIT_TTL_MS = 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 60 * 60 * 1000;
const ERROR_TTL_MS = 5 * 60 * 1000;

const cache = new Map();
const inFlight = new Map();

function sendJson(response, status, payload, cacheControl = "no-store") {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cacheControl });
  response.end(JSON.stringify(payload));
}

function cached(key, now) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return undefined;
  }
  // Orden de uso reciente: al llenarse se descartan los primeros.
  cache.delete(key);
  cache.set(key, entry);
  return entry.url;
}

function remember(key, url, ttl, now) {
  cache.delete(key);
  cache.set(key, { url, expiresAt: now + ttl });
  while (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value);
}

async function searchSteamGrid(name, apiKey, fetchImpl) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  const search = await fetchImpl(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(name)}`, { headers });
  if (!search.ok) throw new Error(`SteamGrid search returned ${search.status}`);
  const gameId = (await search.json())?.data?.[0]?.id;
  if (!gameId) return null;
  const icons = await fetchImpl(`https://www.steamgriddb.com/api/v2/icons/game/${gameId}`, { headers });
  if (!icons.ok) throw new Error(`SteamGrid icons returned ${icons.status}`);
  const url = (await icons.json())?.data?.[0]?.url;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

export function normalizeGameName(value) {
  const name = String(value ?? "").replace(/\s+/g, " ").trim();
  return name && name.length <= MAX_NAME_LENGTH && !/[\u0000-\u001f]/.test(name) ? name : "";
}

export async function lookupGameImage(value, {
  apiKey = process.env.STEAMGRID_API_KEY || "",
  isAllowed = isKnownActivityName,
  fetchImpl = fetch,
  now = Date.now()
} = {}) {
  const name = normalizeGameName(value);
  if (!name) return { status: 400, error: "Send a game name of up to 100 characters." };
  if (!apiKey) return { status: 200, url: null };
  const key = name.toLowerCase();
  const hit = cached(key, now);
  if (hit !== undefined) return { status: 200, url: hit };
  if (!(await isAllowed(name, now))) return { status: 404, url: null, error: "That game is not part of the current Discord activity." };

  // Varias pestanas pidiendo el mismo juego comparten una sola busqueda.
  if (!inFlight.has(key)) {
    inFlight.set(key, searchSteamGrid(name, apiKey, fetchImpl)
      .then((url) => {
        remember(key, url, url ? HIT_TTL_MS : MISS_TTL_MS, Date.now());
        return url;
      })
      .catch((error) => {
        console.error("SteamGridDB error", error.message || error);
        remember(key, null, ERROR_TTL_MS, Date.now());
        return null;
      })
      .finally(() => inFlight.delete(key)));
  }
  return { status: 200, url: await inFlight.get(key) };
}

export function resetGameImageCacheForTests() {
  cache.clear();
  inFlight.clear();
}

export function gameImageCacheSize() {
  return cache.size;
}

export async function handleGameImageRequest(request, response) {
  if (request.method !== "GET") return sendJson(response, 405, { error: "Game image method not allowed." });
  const name = new URL(request.url || "/", "http://localhost").searchParams.get("name");
  const result = await lookupGameImage(name);
  const payload = result.error ? { url: null, error: result.error } : { url: result.url };
  sendJson(response, result.status, payload, result.url ? "public, max-age=3600" : "no-store");
}
