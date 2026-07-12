import { renameSync, readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_AVATAR_URL } from "./discord-avatar.mjs";
import { getSessionUser } from "./comments.mjs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

const FILENAME = "madrace-leaderboard.json";
const DATA_ENVS = ["MADRACE_DATA_DIR", "GAME_DATA_DIR"];
const MAX_LEVEL = 10000;
const MAX_TIME_MS = 24 * 60 * 60 * 1000;
const MAX_LEVEL_CATCH_UP = 25;
const MIN_LEVEL_TIME_MS = 250;
const submissionWindows = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.reduce((size, chunk) => size + chunk.length, 0) > 16_384) throw new Error("payload-too-large");
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function dataFile() {
  return ensureDataFile(FILENAME, { scores: [] }, DATA_ENVS);
}

function readScores() {
  try {
    const value = JSON.parse(readFileSync(dataFile(), "utf8"));
    return Array.isArray(value?.scores) ? value.scores : [];
  } catch (error) {
    console.error("Madrace leaderboard read error", error.message || error);
    return [];
  }
}

function writeScores(scores) {
  const file = getDataFile(FILENAME, DATA_ENVS);
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, JSON.stringify({ scores }, null, 2), "utf8");
  renameSync(temporary, file);
}

function integer(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const result = Math.floor(number);
  return result >= min && result <= max ? result : null;
}

function sorted(scores) {
  return [...scores].sort((a, b) =>
    (b.highestLevel || 0) - (a.highestLevel || 0)
    || (a.bestTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.bestTimeMs ?? Number.MAX_SAFE_INTEGER)
    || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)
  );
}

function publicScore(score, rank) {
  return {
    rank,
    discordId: String(score.discordId),
    username: score.username || "Discord player",
    avatarUrl: score.avatarUrl || DEFAULT_AVATAR_URL,
    highestLevel: Number(score.highestLevel) || 0,
    bestTimeMs: Number.isFinite(score.bestTimeMs) ? score.bestTimeMs : null,
    updatedAt: score.updatedAt || null
  };
}

function leaderboard(scores, limit = 10) {
  return sorted(scores).slice(0, Math.min(50, Math.max(1, Number(limit) || 10)))
    .map((score, index) => publicScore(score, index + 1));
}

function scoreForUser(scores, userId) {
  const ordered = sorted(scores);
  const index = ordered.findIndex((score) => String(score.discordId) === String(userId));
  return index < 0 ? null : publicScore(ordered[index], index + 1);
}

function isRateLimited(userId) {
  const now = Date.now();
  const recent = (submissionWindows.get(userId) || []).filter((time) => now - time < 10_000);
  recent.push(now);
  submissionWindows.set(userId, recent);
  return recent.length > 6;
}

function isSameOrigin(request) {
  const origin = String(request.headers?.origin || "");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = String(request.headers?.["x-forwarded-host"] || request.headers?.host || "").split(",")[0].trim();
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export async function handleMadraceRequest(request, response) {
  const url = new URL(request.url || "/api/madrace", "http://localhost");
  const path = url.pathname.replace(/^\/api\/(?:madrace|drive-mad)\/?/, "");
  const user = getSessionUser(request);
  let scores = readScores();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method || "") && !isSameOrigin(request)) {
    sendJson(response, 403, { error: "Cross-origin score mutation rejected." });
    return;
  }

  if (request.method === "GET" && path === "leaderboard") {
    sendJson(response, 200, { leaderboard: leaderboard(scores, url.searchParams.get("limit")) });
    return;
  }

  if (request.method === "GET" && path === "me") {
    sendJson(response, 200, { authenticated: !!user, user, score: user ? scoreForUser(scores, user.id) : null });
    return;
  }

  if (request.method === "DELETE" && path === "me") {
    if (!user) return sendJson(response, 401, { error: "Connect Discord to reset your score." });
    const next = scores.filter((score) => String(score.discordId) !== String(user.id));
    if (next.length !== scores.length) writeScores(next);
    sendJson(response, 200, { score: null, leaderboard: leaderboard(next) });
    return;
  }

  if (request.method === "POST" && path === "progress") {
    if (!user) return sendJson(response, 401, { error: "Connect Discord to save Madrace progress." });
    if (isRateLimited(user.id)) return sendJson(response, 429, { error: "Progress packets arrived too quickly." });

    let body;
    try {
      body = await readBody(request);
    } catch {
      return sendJson(response, 400, { error: "Invalid progress payload." });
    }

    // Re-read after the async request body. Level packets can arrive close
    // together; this keeps each mutation based on the score written by the
    // packet immediately before it instead of a stale pre-body snapshot.
    scores = readScores();

    if (body.discordId && String(body.discordId) !== String(user.id)) {
      return sendJson(response, 403, { error: "Discord identity does not match the signed session." });
    }
    if (body.event !== "level-complete" || body.completed !== true) {
      return sendJson(response, 202, { ignored: true, reason: "completion-required", score: scoreForUser(scores, user.id) });
    }

    const level = integer(body.level ?? Number(body.levelIndex) + 1, 1, MAX_LEVEL);
    const cumulativeMs = integer(
      body.cumulativeLevelTimeMs ?? body.reachedAtMs ?? body.timeMs ?? body.elapsedMs,
      0,
      MAX_TIME_MS
    );
    const levelMs = integer(body.levelElapsedMs, 0, MAX_TIME_MS);
    const sessionId = String(body.sessionId || "");
    if (!level || cumulativeMs === null || !/^[a-z0-9-]{8,80}$/i.test(sessionId)) {
      return sendJson(response, 400, { error: "Progress packet failed validation." });
    }

    const index = scores.findIndex((score) => String(score.discordId) === String(user.id));
    const current = index >= 0 ? scores[index] : null;
    const currentLevel = Number(current?.highestLevel) || 0;
    const levelAdvance = level - currentLevel;
    if (levelAdvance > MAX_LEVEL_CATCH_UP) {
      return sendJson(response, 409, {
        error: "Level jump exceeded the catch-up window.",
        maximumLevel: currentLevel + MAX_LEVEL_CATCH_UP
      });
    }
    if (level < currentLevel) {
      return sendJson(response, 202, { ignored: true, reason: "older-level", score: scoreForUser(scores, user.id) });
    }
    if (levelAdvance > 0 && currentLevel > 0 && cumulativeMs < Number(current.bestTimeMs || 0)) {
      return sendJson(response, 409, { error: "Cumulative time moved backwards." });
    }
    const previousTime = Number(current?.bestTimeMs) || 0;
    if (levelAdvance > 0 && cumulativeMs - previousTime < levelAdvance * MIN_LEVEL_TIME_MS) {
      return sendJson(response, 422, { error: "Catch-up progress was faster than the validation floor." });
    }
    if (levelMs !== null && levelMs < MIN_LEVEL_TIME_MS) {
      return sendJson(response, 422, { error: "Level completion was faster than the validation floor." });
    }

    const now = new Date().toISOString();
    const improves = level > currentLevel || (level === currentLevel && cumulativeMs < Number(current?.bestTimeMs ?? Infinity));
    const next = {
      ...(current || { discordId: String(user.id), createdAt: now }),
      discordId: String(user.id),
      username: user.username,
      avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
      highestLevel: improves ? level : currentLevel,
      bestTimeMs: improves ? cumulativeMs : current?.bestTimeMs,
      bestSessionId: improves ? sessionId : current?.bestSessionId,
      updatedAt: improves ? now : current?.updatedAt || now,
      lastSeenAt: now,
      submissions: (Number(current?.submissions) || 0) + 1
    };
    if (index >= 0) scores[index] = next;
    else scores.push(next);
    writeScores(scores);
    sendJson(response, 200, { score: scoreForUser(scores, user.id), leaderboard: leaderboard(scores) });
    return;
  }

  sendJson(response, 404, { error: "Madrace endpoint not found." });
}
