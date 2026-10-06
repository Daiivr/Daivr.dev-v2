import { DEFAULT_AVATAR_URL, refreshLeaderboardProfiles } from "./discord-avatar.mjs";
import { getSessionUser } from "./comments.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { apiPath, createRateLimiter, createScoreStore, sendJson } from "./leaderboard.mjs";
import { checkRunDuration, sendRunToken } from "./run-tokens.mjs";

// Rankings de NZ:P: la ronda mas alta en una partida, y en total los zombis
// matados y los puntos ganados. El cartucho manda una ficha por partida con lo
// que conto el propio cliente del juego (tools/nzp-qc, Daivr_ReportStats).
const GAME = "nzp";
const DATA_ENVS = ["NZP_DATA_DIR", "GAME_DATA_DIR"];
// El cliente recibe la ronda como byte y las bajas como short.
const MAX_ROUND = 255;
const MAX_KILLS = 65_535;
const MAX_SCORE = 50_000_000;
const MAX_DURATION_MS = 12 * 60 * 60 * 1000;
// Suelos de validacion holgados: nadie pasa de ronda en menos de 8 s, ni mata
// mas de 10 zombis por segundo, ni gana mas de 300 puntos por baja (con doble
// puntos) mas los extras de ronda y potenciadores.
const MIN_MS_PER_ROUND = 8_000;
const MAX_KILLS_PER_SECOND = 10;

export const NZP_BOARDS = {
  round: { field: "bestRound", since: "bestRoundAt" },
  kills: { field: "totalKills", since: "killsAt" },
  score: { field: "totalScore", since: "scoreAt" }
};

export function validateNzpGame(body) {
  const round = Number(body?.round), kills = Number(body?.kills), score = Number(body?.score), durationMs = Math.round(Number(body?.durationMs));
  const map = typeof body?.map === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(body.map) ? body.map : "";
  if (![round, kills, score].every(Number.isInteger) || round < 1 || round > MAX_ROUND || kills < 0 || kills > MAX_KILLS || score < 0 || score > MAX_SCORE
    || !Number.isFinite(durationMs) || durationMs < 0 || durationMs > MAX_DURATION_MS || !map) {
    return { error: "NZ:P game failed validation." };
  }
  if (round > 1 + durationMs / MIN_MS_PER_ROUND || kills > 10 + (durationMs / 1000) * MAX_KILLS_PER_SECOND || score > kills * 300 + round * 5000 + 5000) {
    return { error: "NZ:P game was faster than the validation floor.", status: 422 };
  }
  return { game: { round, kills, score, map, durationMs } };
}

export function createNzpRankings(store) {
  const sorted = (entries, board) => {
    const { field, since } = NZP_BOARDS[board];
    return entries
      .filter((entry) => Number(entry[field]) > 0)
      .sort((a, b) => Number(b[field]) - Number(a[field]) || new Date(a[since] || 0) - new Date(b[since] || 0));
  };
  const toPublic = (entry, rank, board) => ({
    rank,
    discordId: String(entry.discordId),
    username: entry.username || "Survivor",
    avatarUrl: entry.avatarUrl || DEFAULT_AVATAR_URL,
    value: Number(entry[NZP_BOARDS[board].field]) || 0,
    ...(board === "round" ? { map: entry.bestRoundMap || "" } : {})
  });
  return {
    leaderboard(board, limit = 10) {
      const size = Math.min(50, Math.max(1, Number(limit) || 10));
      return sorted(store.read(), board).slice(0, size).map((entry, index) => toPublic(entry, index + 1, board));
    },
    forUser(userId) {
      const entries = store.read();
      const entry = entries.find((item) => String(item.discordId) === String(userId));
      if (!entry) return null;
      const ranks = Object.fromEntries(Object.keys(NZP_BOARDS).map((board) => {
        const index = sorted(entries, board).findIndex((item) => String(item.discordId) === String(userId));
        return [board, index < 0 ? null : index + 1];
      }));
      return {
        bestRound: Number(entry.bestRound) || 0, bestRoundMap: entry.bestRoundMap || "",
        totalKills: Number(entry.totalKills) || 0, totalScore: Number(entry.totalScore) || 0,
        games: Number(entry.games) || 0, ranks
      };
    },
    record(user, game, now = new Date().toISOString()) {
      const entries = store.read();
      const index = entries.findIndex((entry) => String(entry.discordId) === String(user.id));
      const current = index >= 0 ? entries[index] : { discordId: String(user.id), createdAt: now };
      const best = game.round > (Number(current.bestRound) || 0);
      const next = {
        ...current,
        username: user.username,
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
        bestRound: best ? game.round : Number(current.bestRound) || 0,
        bestRoundMap: best ? game.map : current.bestRoundMap || "",
        bestRoundAt: best ? now : current.bestRoundAt || now,
        totalKills: (Number(current.totalKills) || 0) + game.kills,
        killsAt: game.kills ? now : current.killsAt || now,
        totalScore: (Number(current.totalScore) || 0) + game.score,
        scoreAt: game.score ? now : current.scoreAt || now,
        games: (Number(current.games) || 0) + 1,
        lastGame: game,
        lastPlayedAt: now
      };
      if (index >= 0) entries[index] = next; else entries.push(next);
      store.write(entries);
    }
  };
}

const rankings = createNzpRankings(createScoreStore("nzp-leaderboard.json", DATA_ENVS));
const isRateLimited = createRateLimiter(60_000, 20);

export async function handleNzpRequest(request, response) {
  const { url, path } = apiPath(request, [GAME]);
  const method = request.method || "GET";
  if (method === "POST" && !sameOrigin(request)) return sendJson(response, 403, { error: "Cross-origin score mutation rejected." });
  const user = getSessionUser(request);

  if (method === "GET" && path === "leaderboard") {
    const board = url.searchParams.get("board") || "round";
    if (!NZP_BOARDS[board]) return sendJson(response, 400, { error: "Unknown NZ:P ranking." });
    const leaderboard = await refreshLeaderboardProfiles(rankings.leaderboard(board, url.searchParams.get("limit")));
    return sendJson(response, 200, { board, leaderboard });
  }
  if (method === "GET" && path === "me") return sendJson(response, 200, { authenticated: !!user, user, stats: user ? rankings.forUser(user.id) : null });
  if (method === "POST" && path === "run") return sendRunToken(response, GAME);
  if (method === "POST" && path === "game") {
    if (!user) return sendJson(response, 401, { error: "Connect Discord to save NZ:P games." });
    if (isRateLimited(user.id)) return sendJson(response, 429, { error: "Too many NZ:P games submitted." });
    let body;
    try {
      body = await readJsonBody(request, 4096);
    } catch (error) {
      return sendJson(response, error.status || 400, { error: "Invalid NZ:P game." });
    }
    const { game, error, status } = validateNzpGame(body);
    if (!game) return sendJson(response, status || 400, { error });
    const run = checkRunDuration(body.runToken, GAME, game.durationMs);
    if (!run.ok) return sendJson(response, run.status, { error: run.error });
    rankings.record(user, game);
    return sendJson(response, 200, { stats: rankings.forUser(user.id) });
  }
  return sendJson(response, 404, { error: "NZ:P endpoint not found." });
}
