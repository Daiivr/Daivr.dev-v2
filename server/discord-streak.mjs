import { readFileSync, writeFileSync } from "node:fs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

const FILENAME = "discord-streak.json";
// Mismo convenio que el resto de modulos. Antes este archivo resolvia la ruta a
// mano y se saltaba RENDER_DATA_DIR, asi que en Render caia en el data/ del
// repo (efimero) y la racha se perdia en cada despliegue.
const DATA_ENVS = ["STREAK_DATA_DIR", "GAME_DATA_DIR", "COMMENTS_DATA_DIR"];

const POLL_INTERVAL_MS = 60_000;
const POLL_CACHE_MS = 15_000;
// Tope defensivo: una marca de inicio corrupta no debe inflar el total.
const MAX_SESSION_MS = 24 * 60 * 60 * 1000;

let lastPollAt = 0;
let lastPollState = null;
let pollTimer = null;

function getLanyardUrl() {
  const discordId = process.env.DISCORD_USER_ID || "271701484922601472";
  return `https://api.lanyard.rest/v1/users/${discordId}`;
}

function emptyState() {
  return { currentGame: null, games: {} };
}

function ensureStorage() {
  return ensureDataFile(FILENAME, emptyState(), DATA_ENVS);
}

function normalizeSession(session) {
  if (!session || typeof session !== "object") return null;

  const start = Number(session.start);
  const countedMs = Number(session.countedMs);
  if (!Number.isFinite(start) || start <= 0) return null;

  return {
    countedMs: Number.isFinite(countedMs) && countedMs > 0 ? countedMs : 0,
    start
  };
}

function normalizeGameRecord(record) {
  if (!record || typeof record !== "object") {
    return { bestStreak: 0, days: 0, firstDay: null, lastDay: null, session: null, streak: 0, totalMs: 0 };
  }

  const streak = Number.isFinite(record.streak) ? record.streak : 0;

  return {
    bestStreak: Number.isFinite(record.bestStreak) ? Math.max(record.bestStreak, streak) : streak,
    days: Number.isFinite(record.days) ? record.days : (record.lastDay ? 1 : 0),
    firstDay: typeof record.firstDay === "string" ? record.firstDay : (typeof record.lastDay === "string" ? record.lastDay : null),
    lastDay: typeof record.lastDay === "string" ? record.lastDay : null,
    session: normalizeSession(record.session),
    streak,
    totalMs: Number.isFinite(record.totalMs) && record.totalMs > 0 ? record.totalMs : 0
  };
}

function normalizeState(data) {
  if (!data || typeof data !== "object") return emptyState();

  if (data.games && typeof data.games === "object" && !Array.isArray(data.games)) {
    const games = Object.entries(data.games).reduce((acc, [gameName, record]) => {
      if (typeof gameName === "string" && gameName.trim()) {
        acc[gameName] = normalizeGameRecord(record);
      }

      return acc;
    }, {});

    return {
      currentGame: typeof data.currentGame === "string" && data.currentGame.trim() ? data.currentGame : null,
      games
    };
  }

  // Formato antiguo de un solo juego.
  if (typeof data.game === "string" && data.game.trim()) {
    return {
      currentGame: data.game,
      games: { [data.game]: normalizeGameRecord(data) }
    };
  }

  return emptyState();
}

function readState() {
  ensureStorage();

  try {
    const raw = readFileSync(getDataFile(FILENAME, DATA_ENVS), "utf8");
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.error("Discord streak read error:", error.message || error);
    return emptyState();
  }
}

function writeState(state) {
  ensureStorage();

  try {
    writeFileSync(getDataFile(FILENAME, DATA_ENVS), JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    console.error("Discord streak write error:", error.message || error);
  }
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(a, b) {
  if (!a || !b) return Infinity;
  const start = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  return Math.round((end - start) / 86_400_000);
}

function getGameRecord(state, gameName) {
  return normalizeGameRecord(state.games?.[gameName]);
}

function applyGameDay(record, today) {
  const gap = daysBetween(record.lastDay, today);
  if (gap === 0) return record;

  const streak = gap === 1 ? record.streak + 1 : 1;

  return {
    ...record,
    bestStreak: Math.max(record.bestStreak, streak),
    days: record.days + 1,
    firstDay: record.firstDay || today,
    lastDay: today,
    streak
  };
}

// El acumulado solo suma lo que aun no se habia contado de esta sesion, asi que
// da igual cuantas veces se consulte: pollear mas a menudo no infla las horas.
function applySessionTime(record, activity, now) {
  const start = Number(activity?.timestamps?.start);
  if (!Number.isFinite(start) || start <= 0) return record;

  const elapsed = Math.min(Math.max(0, now - start), MAX_SESSION_MS);
  const session = record.session?.start === start ? record.session : { countedMs: 0, start };
  const delta = Math.max(0, elapsed - session.countedMs);

  if (!delta && record.session?.start === start) return record;

  return {
    ...record,
    session: { countedMs: session.countedMs + delta, start },
    totalMs: record.totalMs + delta
  };
}

async function pollLanyardOnce(force = false) {
  const now = Date.now();

  if (!force && lastPollState && now - lastPollAt < POLL_CACHE_MS) return lastPollState;

  try {
    const response = await fetch(getLanyardUrl(), { cache: "no-store" });
    if (!response.ok) throw new Error(`Lanyard returned ${response.status}`);

    const payload = await response.json();
    const activities = Array.isArray(payload?.data?.activities) ? payload.data.activities : [];
    const mainGame = activities.find((activity) => activity?.type === 0 && activity.name);

    const state = readState();

    if (!mainGame) {
      lastPollAt = now;
      lastPollState = state;
      return state;
    }

    const previous = getGameRecord(state, mainGame.name);
    const withDay = applyGameDay(previous, todayKey());
    const nextRecord = applySessionTime(withDay, mainGame, now);
    const next = {
      ...state,
      currentGame: mainGame.name,
      games: { ...state.games, [mainGame.name]: nextRecord }
    };

    if (
      state.currentGame !== next.currentGame ||
      previous.lastDay !== nextRecord.lastDay ||
      previous.streak !== nextRecord.streak ||
      previous.totalMs !== nextRecord.totalMs
    ) {
      writeState(next);
    }

    lastPollAt = now;
    lastPollState = next;
    return next;
  } catch (error) {
    if (!String(error.message || error).includes("404")) {
      console.error("Discord streak poll error:", error.message || error);
    }

    const state = readState();
    lastPollState = state;
    return state;
  }
}

function isStreakAlive(record, today = todayKey()) {
  if (!record?.lastDay) return false;
  return daysBetween(record.lastDay, today) <= 1;
}

function buildLibrary(state) {
  return Object.entries(state.games || {})
    .map(([name, record]) => {
      const normalized = normalizeGameRecord(record);
      return {
        bestStreak: normalized.bestStreak,
        days: normalized.days,
        firstDay: normalized.firstDay,
        lastDay: normalized.lastDay,
        name,
        streak: normalized.streak,
        totalMs: normalized.totalMs
      };
    })
    .sort((a, b) => b.totalMs - a.totalMs || b.bestStreak - a.bestStreak)
    .slice(0, 6);
}

export async function getDiscordStreak() {
  const state = await pollLanyardOnce();
  const today = todayKey();
  const game = state.currentGame;
  const current = game ? getGameRecord(state, game) : normalizeGameRecord();
  const alive = isStreakAlive(current, today);

  return {
    alive,
    bestStreak: current.bestStreak,
    days: current.days,
    firstDay: current.firstDay,
    game,
    lastDay: current.lastDay,
    library: buildLibrary(state),
    sessionMs: current.session ? current.session.countedMs : 0,
    streak: alive ? current.streak : 0,
    totalMs: current.totalMs
  };
}

export async function handleDiscordStreakRequest(_request, response) {
  const payload = await getDiscordStreak();

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

// Sin sondeo de fondo las horas solo avanzaban mientras alguien miraba la web.
export function startDiscordStreakPolling() {
  if (pollTimer) return pollTimer;

  pollTimer = setInterval(() => {
    pollLanyardOnce(true).catch(() => {});
  }, POLL_INTERVAL_MS);
  pollTimer.unref?.();
  pollLanyardOnce(true).catch(() => {});

  return pollTimer;
}

startDiscordStreakPolling();
