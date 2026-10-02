import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { DEFAULT_AVATAR_URL, refreshLeaderboardProfiles } from "./discord-avatar.mjs";
import { getSessionUser } from "./comments.mjs";
import { ensureDataFile, getDataFile } from "./storage.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { recordDailyRun } from "./player-store.mjs";
import { checkRunDuration, sendRunToken } from "./run-tokens.mjs";

// Piezas comunes de los rankings de los juegos. Tower Block, Cross Road y
// Space Cadet eran tres copias del mismo archivo con otros numeros; Madrace
// comparte el almacen, el limite de envios y el orden, y conserva su propia
// logica de niveles.

const MAX_TRACKED_PLAYERS = 5000;

export function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

export function createScoreStore(filename, dataEnvs) {
  return {
    read() {
      try {
        const data = JSON.parse(readFileSync(ensureDataFile(filename, { scores: [] }, dataEnvs), "utf8"));
        return Array.isArray(data?.scores) ? data.scores : [];
      } catch (error) {
        console.error(`[leaderboard] ${filename} read error`, error.message || error);
        return [];
      }
    },
    // Escritura atomica: un corte a mitad nunca deja el JSON a medias.
    write(scores) {
      const file = getDataFile(filename, dataEnvs);
      const temporary = `${file}.tmp`;
      writeFileSync(temporary, JSON.stringify({ scores }, null, 2), "utf8");
      renameSync(temporary, file);
    }
  };
}

// Ventana deslizante por jugador. Se olvida de quien lleva tiempo sin enviar
// para que el Map no crezca con cada cuenta que alguna vez jugo.
export function createRateLimiter(windowMs, max) {
  const windows = new Map();
  return function isRateLimited(key, now = Date.now()) {
    const recent = (windows.get(key) || []).filter((time) => now - time < windowMs);
    recent.push(now);
    windows.delete(key);
    windows.set(key, recent);
    if (windows.size > MAX_TRACKED_PLAYERS) {
      for (const [player, times] of windows) {
        if (windows.size <= MAX_TRACKED_PLAYERS) break;
        if (!times.some((time) => now - time < windowMs)) windows.delete(player);
      }
    }
    return recent.length > max;
  };
}

export function createRanking({ compare, toPublic }) {
  const sorted = (scores) => [...scores].sort(compare);
  return {
    leaderboard(scores, limit = 10) {
      return sorted(scores).slice(0, Math.min(50, Math.max(1, Number(limit) || 10))).map((score, index) => toPublic(score, index + 1));
    },
    forUser(scores, userId) {
      const list = sorted(scores);
      const index = list.findIndex((score) => String(score.discordId) === String(userId));
      return index < 0 ? null : toPublic(list[index], index + 1);
    }
  };
}

export function apiPath(request, prefixes) {
  const url = new URL(request.url || `/api/${prefixes[0]}`, "http://localhost");
  return { url, path: url.pathname.replace(new RegExp(`^/api/(?:${prefixes.join("|")})/?`), "") };
}

// Rankings de "mejor puntuacion en una partida": mas puntos gana y, a igualdad,
// la partida mas corta. Cada partida trae su ficha (server/run-tokens.mjs) y no
// puede durar mas de lo que el servidor ha visto pasar.
export function createLeaderboard({
  game,
  label,
  runNoun,
  filename,
  dataEnvs,
  maxScore,
  maxDurationMs = 24 * 60 * 60 * 1000,
  isTooFast,
  tooFastMessage,
  defaultUsername
}) {
  const store = createScoreStore(filename, dataEnvs);
  const isRateLimited = createRateLimiter(60_000, 8);
  const ranking = createRanking({
    compare: (a, b) => (b.bestScore || 0) - (a.bestScore || 0)
      || (a.bestDurationMs ?? Infinity) - (b.bestDurationMs ?? Infinity)
      || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
    toPublic: (score, rank) => ({
      rank,
      discordId: String(score.discordId),
      username: score.username || defaultUsername,
      avatarUrl: score.avatarUrl || DEFAULT_AVATAR_URL,
      bestScore: Number(score.bestScore) || 0,
      bestDurationMs: Number.isFinite(score.bestDurationMs) ? score.bestDurationMs : null,
      updatedAt: score.updatedAt || null
    })
  });

  async function submit(request, response, user, path) {
    if (!user) return sendJson(response, 401, { error: `Connect Discord to save ${label} scores.` });
    if (isRateLimited(user.id)) return sendJson(response, 429, { error: `Too many ${runNoun} submitted.` });
    let body;
    try {
      body = await readJsonBody(request, 8192);
    } catch (error) {
      return sendJson(response, error.status || 400, { error: "Invalid score payload." });
    }
    const score = Math.floor(Number(body.score));
    const durationMs = Math.round(Number(body.durationMs));
    if (!Number.isFinite(score) || score < 0 || score > maxScore || !Number.isFinite(durationMs) || durationMs < 0 || durationMs > maxDurationMs) {
      return sendJson(response, 400, { error: `${label} score failed validation.` });
    }
    if (score > 0 && isTooFast(score, durationMs)) return sendJson(response, 422, { error: tooFastMessage });
    const run = checkRunDuration(body.runToken, game, durationMs);
    if (!run.ok) return sendJson(response, run.status, { error: run.error });
    // El aviso del reto diario envia la marca a mitad de partida: cuenta para el
    // reto, pero el ranking solo guarda partidas terminadas.
    if (path === "challenge") return sendJson(response, 200, { daily: recordDailyRun(user, game, score) || null });

    const scores = store.read();
    const index = scores.findIndex((entry) => String(entry.discordId) === String(user.id));
    const current = index >= 0 ? scores[index] : null;
    const improves = score > Number(current?.bestScore || 0)
      || (score === Number(current?.bestScore || 0) && durationMs < Number(current?.bestDurationMs ?? Infinity));
    const now = new Date().toISOString();
    const next = {
      ...(current || { discordId: String(user.id), createdAt: now }),
      discordId: String(user.id),
      username: user.username,
      avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
      bestScore: improves ? score : current?.bestScore || 0,
      bestDurationMs: improves ? durationMs : current?.bestDurationMs,
      lastScore: score,
      lastDurationMs: durationMs,
      lastSeenAt: now,
      updatedAt: improves ? now : current?.updatedAt || now,
      submissions: (Number(current?.submissions) || 0) + 1
    };
    if (index >= 0) scores[index] = next; else scores.push(next);
    store.write(scores);
    recordDailyRun(user, game, score);
    return sendJson(response, 200, { score: ranking.forUser(scores, user.id), leaderboard: ranking.leaderboard(scores) });
  }

  return async function handleLeaderboardRequest(request, response) {
    const { url, path } = apiPath(request, [game]);
    const method = request.method || "GET";
    if (["POST", "DELETE"].includes(method) && !sameOrigin(request)) return sendJson(response, 403, { error: "Cross-origin score mutation rejected." });
    const user = getSessionUser(request);

    if (method === "GET" && path === "leaderboard") {
      const rankings = ranking.leaderboard(store.read(), url.searchParams.get("limit"));
      return sendJson(response, 200, { leaderboard: await refreshLeaderboardProfiles(rankings) });
    }
    if (method === "POST" && path === "run") return sendRunToken(response, game);
    if (method === "GET" && path === "me") return sendJson(response, 200, { authenticated: !!user, user, score: user ? ranking.forUser(store.read(), user.id) : null });
    if (method === "DELETE" && path === "me") {
      if (!user) return sendJson(response, 401, { error: "Connect Discord to reset your record." });
      const scores = store.read().filter((entry) => String(entry.discordId) !== String(user.id));
      store.write(scores);
      return sendJson(response, 200, { score: null, leaderboard: ranking.leaderboard(scores) });
    }
    if (method === "POST" && ["score", "challenge"].includes(path)) return submit(request, response, user, path);
    return sendJson(response, 404, { error: `${label} endpoint not found.` });
  };
}
