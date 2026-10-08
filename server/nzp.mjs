import { DEFAULT_AVATAR_URL, refreshLeaderboardProfiles } from "./discord-avatar.mjs";
import { getSessionUser } from "./comments.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { apiPath, createRateLimiter, createScoreStore, sendJson } from "./leaderboard.mjs";
import { NZP_DATA_ENVS, NZP_LEADERBOARD_FILE } from "./nzp-unlock.mjs";
import { recordDailyRun } from "./player-store.mjs";
import { checkRunDuration, sendRunToken } from "./run-tokens.mjs";

// Rankings de NZ:P: la ronda mas alta en una partida, y en total los zombis
// matados y los puntos ganados. El cartucho manda una ficha por partida con lo
// que conto el propio cliente del juego (tools/nzp-qc, Daivr_ReportStats), y la
// misma ficha cuenta para el reto diario cuando ese dia toca NZ:P.
const GAME = "nzp";
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
// Mapas de prueba de los desarrolladores que vienen en game.pk3. El menu ya no
// los ofrece (daivr.patch), pero una partida en ellos no cuenta.
const UNRANKED_MAPS = new Set(["weapon_test"]);
const mapId = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(value) ? value.toLowerCase() : "";

// Older stores kept only the overall best and the last game. Recover those
// known results without inventing a history for maps that were never retained.
function roundsByMap(entry) {
  const rounds = Object.create(null);
  const add = (id, round, at) => {
    id = mapId(id);
    round = Number(round);
    if (!id || UNRANKED_MAPS.has(id) || !Number.isInteger(round) || round < 1 || round > MAX_ROUND) return;
    const previous = rounds[id];
    if (!previous || round > previous.round || (round === previous.round && at && (!previous.at || new Date(at) < new Date(previous.at)))) rounds[id] = { round, at };
  };
  for (const [id, result] of Object.entries(entry.roundsByMap || {})) add(id, result?.round, result?.at);
  add(entry.bestRoundMap, entry.bestRound, entry.bestRoundAt);
  if (!entry.lastGame?.custom) add(entry.lastGame?.map, entry.lastGame?.round, entry.lastPlayedAt);
  return rounds;
}

export const NZP_BOARDS = {
  round: { field: "bestRound", since: "bestRoundAt" },
  kills: { field: "totalKills", since: "killsAt" },
  score: { field: "totalScore", since: "scoreAt" }
};

export function validateNzpGame(body) {
  const round = Number(body?.round), kills = Number(body?.kills), headshots = Number(body?.headshots), score = Number(body?.score), durationMs = Math.round(Number(body?.durationMs));
  const map = mapId(body?.map);
  if (![round, kills, headshots, score].every(Number.isInteger) || round < 1 || round > MAX_ROUND || kills < 0 || kills > MAX_KILLS || headshots < 0 || headshots > kills || score < 0 || score > MAX_SCORE
    || typeof body.custom !== "boolean" || !Number.isFinite(durationMs) || durationMs < 0 || durationMs > MAX_DURATION_MS || !map) {
    return { error: "NZ:P game failed validation." };
  }
  if (UNRANKED_MAPS.has(map.toLowerCase())) return { error: "Test maps aren't ranked.", status: 422 };
  // Ajustes de partida cambiados en el menu (ronda inicial, dificultad, modo,
  // magia, tamano de horda...): empezar en la ronda 30 o jugar en facil no se
  // puede comparar, asi que esas partidas no cuentan ni para el reto diario.
  if (body.custom) return { error: "Games with changed game settings aren't ranked.", status: 422 };
  if (round > 1 + durationMs / MIN_MS_PER_ROUND || kills > 10 + (durationMs / 1000) * MAX_KILLS_PER_SECOND || score > kills * 300 + round * 5000 + 5000) {
    return { error: "NZ:P game was faster than the validation floor.", status: 422 };
  }
  return { game: { round, kills, headshots, score, map, durationMs } };
}

export function createNzpRankings(store) {
  // Una ronda maxima guardada en un mapa de prueba (de antes de que se
  // rechazaran) no cuenta: sale del ranking de ronda y la siguiente partida
  // marca una nueva. Los totales de bajas y puntos se quedan como estan.
  const read = () => store.read().map((entry) => (UNRANKED_MAPS.has(String(entry.bestRoundMap || "").toLowerCase())
    ? { ...entry, bestRound: 0, bestRoundMap: "", bestRoundAt: undefined }
    : entry));
  const scoped = (map) => read().map((entry) => {
    if (!map) return entry;
    const result = roundsByMap(entry)[mapId(map)];
    return { ...entry, bestRound: result?.round || 0, bestRoundMap: result ? mapId(map) : "", bestRoundAt: result?.at };
  });
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
    maps() {
      return [...new Set(read().flatMap((entry) => Object.keys(roundsByMap(entry))))].sort();
    },
    leaderboard(board, limit = 10, map = "") {
      const size = Math.min(50, Math.max(1, Number(limit) || 10));
      return sorted(scoped(board === "round" ? map : ""), board).slice(0, size).map((entry, index) => toPublic(entry, index + 1, board));
    },
    forUser(userId, map = "") {
      const entries = scoped(map);
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
      const entries = read();
      const index = entries.findIndex((entry) => String(entry.discordId) === String(user.id));
      const current = index >= 0 ? entries[index] : { discordId: String(user.id), createdAt: now };
      const best = game.round > (Number(current.bestRound) || 0);
      const perMap = roundsByMap(current);
      const id = mapId(game.map);
      if (id && !UNRANKED_MAPS.has(id) && game.round > (perMap[id]?.round || 0)) perMap[id] = { round: game.round, at: now };
      const next = {
        ...current,
        roundsByMap: perMap,
        username: user.username,
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
        bestRound: best ? game.round : Number(current.bestRound) || 0,
        bestRoundMap: best ? game.map : current.bestRoundMap || "",
        bestRoundAt: best ? now : current.bestRoundAt || now,
        totalKills: (Number(current.totalKills) || 0) + game.kills,
        killsAt: game.kills ? now : current.killsAt || now,
        totalScore: (Number(current.totalScore) || 0) + game.score,
        totalHeadshots: (Number(current.totalHeadshots) || 0) + (game.headshots || 0),
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

const rankings = createNzpRankings(createScoreStore(NZP_LEADERBOARD_FILE, NZP_DATA_ENVS));
const isRateLimited = createRateLimiter(60_000, 20);

export async function handleNzpRequest(request, response) {
  const { url, path } = apiPath(request, [GAME]);
  const method = request.method || "GET";
  if (method === "POST" && !sameOrigin(request)) return sendJson(response, 403, { error: "Cross-origin score mutation rejected." });
  const user = getSessionUser(request);

  if (method === "GET" && path === "leaderboard") {
    const board = url.searchParams.get("board") || "round";
    if (!Object.hasOwn(NZP_BOARDS, board)) return sendJson(response, 400, { error: "Unknown NZ:P ranking." });
    const requestedMap = url.searchParams.get("map") || "";
    const map = mapId(requestedMap);
    if (requestedMap && (board !== "round" || !map || UNRANKED_MAPS.has(map))) return sendJson(response, 400, { error: "Invalid NZ:P map filter." });
    const leaderboard = await refreshLeaderboardProfiles(rankings.leaderboard(board, url.searchParams.get("limit"), map));
    return sendJson(response, 200, { board, map, leaderboard, maps: rankings.maps(), stats: user ? rankings.forUser(user.id, map) : null });
  }
  if (method === "GET" && path === "me") return sendJson(response, 200, { authenticated: !!user, user, stats: user ? rankings.forUser(user.id) : null });
  if (method === "POST" && path === "run") return sendRunToken(response, GAME);
  // "game" saves a finished (or abandoned) game to the rankings and the daily
  // challenge; "challenge" only checks the daily goal mid-game, so the notice
  // can say it is done while the game is still running.
  if (method === "POST" && (path === "game" || path === "challenge")) {
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
    if (path === "challenge") return sendJson(response, 200, { daily: recordDailyRun(user, GAME, game) || null });
    rankings.record(user, game);
    const daily = recordDailyRun(user, GAME, game) || null;
    return sendJson(response, 200, { stats: rankings.forUser(user.id), daily });
  }
  return sendJson(response, 404, { error: "NZ:P endpoint not found." });
}
