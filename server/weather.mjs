import { clientKey } from "./http-guards.mjs";
import { createRateLimiter, sendJson } from "./leaderboard.mjs";

// El tiempo que hace donde esta el visitante, para que Buddy pueda comentarlo.
// La ubicacion sale de las cabeceras de Cloudflare ("Add visitor location
// headers", cf-iplatitude / cf-iplongitude), redondeada a medio grado (~50 km)
// antes de preguntar a Open-Meteo. Al navegador solo vuelve el tiempo: ni
// coordenadas ni ciudad. Sin esas cabeceras (desarrollo, o el transform
// apagado) contesta { available: false } y Buddy habla del tiempo del armario.
// Sin efectos al importarse.

const CACHE_MS = 20 * 60_000;
const CACHE_LIMIT = 200;
const FETCH_TIMEOUT_MS = 4000;
const cache = new Map();
const isRateLimited = createRateLimiter(60_000, 20);

const roundCoordinate = (value) => Math.round(value * 2) / 2;

export function weatherLocation(request) {
  const latitude = Number(request.headers?.["cf-iplatitude"]);
  const longitude = Number(request.headers?.["cf-iplongitude"]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) };
}

export function readCurrentWeather(payload) {
  const current = payload?.current;
  const temperature = Number(current?.temperature_2m);
  const code = Number(current?.weather_code);
  if (!Number.isFinite(temperature) || !Number.isInteger(code)) return null;
  return {
    available: true,
    temperature: Math.round(temperature),
    code,
    isDay: Number(current.is_day) === 1,
    wind: Math.round(Number(current.wind_speed_10m) || 0)
  };
}

export async function currentWeather(location, fetcher = fetch, now = Date.now()) {
  const key = `${location.latitude},${location.longitude}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.weather;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,is_day,wind_speed_10m`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetcher(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
    const weather = readCurrentWeather(await response.json());
    if (!weather) throw new Error("Open-Meteo sent no current weather");
    cache.delete(key);
    cache.set(key, { at: now, weather });
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    return weather;
  } finally {
    clearTimeout(timer);
  }
}

export async function handleWeatherRequest(request, response, { fetcher = fetch } = {}) {
  if (request.method !== "GET") return sendJson(response, 405, { error: "Weather is read-only." });
  if (isRateLimited(clientKey(request, "weather"))) return sendJson(response, 429, { error: "Slow down." });
  const location = weatherLocation(request);
  if (!location) return sendJson(response, 200, { available: false });
  try {
    const weather = await currentWeather(location, fetcher);
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, max-age=600" });
    response.end(JSON.stringify(weather));
  } catch (error) {
    console.error("[weather]", error.message);
    sendJson(response, 200, { available: false });
  }
}

export function resetWeatherForTests() {
  cache.clear();
}
