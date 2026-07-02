const STEAM_OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
const STEAM_VANITY_URL = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/";

let cachedSteamId = "";
const playtimeCache = new Map();

function sendJson(response, status, payload, cacheControl = "no-store") {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl
  });
  response.end(JSON.stringify(payload));
}

function getSteamApiKey() {
  return process.env.STEAM_WEB_API_KEY || process.env.STEAM_API_KEY || "";
}

function getConfiguredSteamId() {
  return process.env.STEAM_ID64 || process.env.STEAM_USER_ID || "";
}

function getConfiguredVanity() {
  return process.env.STEAM_VANITY || process.env.STEAM_PROFILE_SLUG || "Daivr";
}

function normalizeAppIds(values) {
  return [...new Set(values
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value)))];
}

async function resolveSteamId(apiKey) {
  const configuredId = getConfiguredSteamId();
  if (configuredId) return configuredId;
  if (cachedSteamId) return cachedSteamId;

  const vanity = getConfiguredVanity();
  if (!vanity) return "";

  const url = new URL(STEAM_VANITY_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", vanity);
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Steam vanity lookup returned ${response.status}`);

  const payload = await response.json();
  const steamId = payload?.response?.steamid || "";
  if (steamId) cachedSteamId = steamId;
  return steamId;
}

function formatHours(minutes) {
  const hours = Math.round((Number(minutes) || 0) / 60);
  return `${hours.toLocaleString("en-US")}h played`;
}

export async function handleSteamPlaytimeRequest(request, response) {
  const apiKey = getSteamApiKey();
  const requestUrl = new URL(request.url || "/api/steam-playtime", "http://localhost");
  const appIds = normalizeAppIds(requestUrl.searchParams.getAll("appids"));

  if (!appIds.length) {
    sendJson(response, 400, { error: "Missing appids query parameter", games: {} });
    return;
  }

  if (!apiKey) {
    sendJson(response, 200, { source: "fallback", error: "Steam API key is not configured", games: {} });
    return;
  }

  try {
    const steamId = await resolveSteamId(apiKey);
    if (!steamId) {
      sendJson(response, 200, { source: "fallback", error: "Steam profile id is not configured", games: {} });
      return;
    }

    const cacheKey = `${steamId}:${appIds.join(",")}`;
    const cached = playtimeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      sendJson(response, 200, cached.payload, "public, max-age=300");
      return;
    }

    const url = new URL(STEAM_OWNED_GAMES_URL);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("steamid", steamId);
    url.searchParams.set("include_appinfo", "true");
    url.searchParams.set("include_played_free_games", "true");
    url.searchParams.set("format", "json");
    appIds.forEach((appId, index) => url.searchParams.set(`appids_filter[${index}]`, appId));

    const steamResponse = await fetch(url);
    if (!steamResponse.ok) throw new Error(`Steam owned games returned ${steamResponse.status}`);

    const steamPayload = await steamResponse.json();
    const games = {};

    for (const game of steamPayload?.response?.games || []) {
      const appId = String(game.appid);
      const minutes = Number(game.playtime_forever) || 0;
      games[appId] = {
        appId,
        name: game.name,
        minutes,
        hours: Math.round(minutes / 60),
        label: formatHours(minutes)
      };
    }

    const payload = {
      source: "steam",
      steamId,
      updatedAt: new Date().toISOString(),
      games
    };

    playtimeCache.set(cacheKey, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      payload
    });

    sendJson(response, 200, payload, "public, max-age=300");
  } catch (error) {
    console.error("Steam playtime error", error.message || error);
    sendJson(response, 200, { source: "fallback", error: "Steam playtime is unavailable", games: {} });
  }
}
