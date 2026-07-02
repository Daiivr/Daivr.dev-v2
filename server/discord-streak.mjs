import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_DATA_DIR = join(__dirname, "..", "data");
const RENDER_DATA_DIR = "/var/data";
function getLanyardUrl() {
  const discordId = process.env.DISCORD_USER_ID || "271701484922601472";
  return `https://api.lanyard.rest/v1/users/${discordId}`;
}

function getRenderDataDir() {
  try {
    return existsSync(RENDER_DATA_DIR) ? RENDER_DATA_DIR : null;
  } catch {
    return null;
  }
}

function getDataDir() {
  return (
    process.env.STREAK_DATA_DIR ||
    process.env.GAME_DATA_DIR ||
    process.env.DATA_DIR ||
    process.env.COMMENTS_DATA_DIR ||
    getRenderDataDir() ||
    LOCAL_DATA_DIR
  );
}

function getStorageFile() {
  return join(getDataDir(), "discord-streak.json");
}

function ensureStorage() {
  const dataDir = getDataDir();
  const file = getStorageFile();
  const legacyFile = join(LOCAL_DATA_DIR, "discord-streak.json");

  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (existsSync(file)) return;

  if (resolve(file) !== resolve(legacyFile) && existsSync(legacyFile)) {
    writeFileSync(file, readFileSync(legacyFile, "utf8"), "utf8");
    return;
  }

  writeFileSync(file, JSON.stringify({ currentGame: null, games: {} }, null, 2), "utf8");
}

function emptyState() {
  return { currentGame: null, games: {} };
}

function normalizeGameRecord(record) {
  if (!record || typeof record !== "object") {
    return { streak: 0, lastDay: null };
  }

  return {
    lastDay: typeof record.lastDay === "string" ? record.lastDay : null,
    streak: Number.isFinite(record.streak) ? record.streak : 0
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

  if (typeof data.game === "string" && data.game.trim()) {
    return {
      currentGame: data.game,
      games: {
        [data.game]: normalizeGameRecord(data)
      }
    };
  }

  return emptyState();
}

function readState() {
  ensureStorage();

  try {
    const raw = readFileSync(getStorageFile(), "utf8");
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.error("Discord streak read error:", error.message || error);
    return emptyState();
  }
}

function writeState(state) {
  ensureStorage();

  try {
    writeFileSync(getStorageFile(), JSON.stringify(state, null, 2), "utf8");
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

function applyGameDay(state, gameName, today) {
  const current = getGameRecord(state, gameName);
  const gap = daysBetween(current.lastDay, today);
  const nextRecord =
    gap === 0
      ? current
      : {
          lastDay: today,
          streak: gap === 1 ? current.streak + 1 : 1
        };

  return {
    ...state,
    currentGame: gameName,
    games: {
      ...state.games,
      [gameName]: nextRecord
    }
  };
}

function isStreakAlive(record, today = todayKey()) {
  if (!record?.lastDay) return false;
  return daysBetween(record.lastDay, today) <= 1;
}

async function pollLanyardOnce() {
  try {
    const response = await fetch(getLanyardUrl(), { cache: "no-store" });
    if (!response.ok) throw new Error(`Lanyard returned ${response.status}`);

    const payload = await response.json();
    const activities = Array.isArray(payload?.data?.activities) ? payload.data.activities : [];
    const mainGame = activities.find((activity) => activity?.type === 0 && activity.name);
    if (!mainGame) return readState();

    const today = todayKey();
    const state = readState();
    const next = applyGameDay(state, mainGame.name, today);
    const previousRecord = getGameRecord(state, mainGame.name);
    const nextRecord = getGameRecord(next, mainGame.name);

    if (
      state.currentGame !== next.currentGame ||
      previousRecord.lastDay !== nextRecord.lastDay ||
      previousRecord.streak !== nextRecord.streak
    ) {
      writeState(next);
    }

    return next;
  } catch (error) {
    if (!String(error.message || error).includes("404")) {
      console.error("Discord streak poll error:", error.message || error);
    }

    return readState();
  }
}

export async function getDiscordStreak() {
  const state = await pollLanyardOnce();
  const today = todayKey();
  const game = state.currentGame;
  const current = game ? getGameRecord(state, game) : normalizeGameRecord();
  const alive = isStreakAlive(current, today);

  return {
    alive,
    game,
    lastDay: current.lastDay,
    streak: alive ? current.streak : 0
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
