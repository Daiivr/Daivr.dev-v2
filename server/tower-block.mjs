import { renameSync, readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_AVATAR_URL } from "./discord-avatar.mjs";
import { getSessionUser } from "./comments.mjs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

const FILENAME = "tower-block-leaderboard.json";
const DATA_ENVS = ["TOWER_BLOCK_DATA_DIR", "GAME_DATA_DIR"];
const submissionWindows = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.reduce((size, chunk) => size + chunk.length, 0) > 8192) throw new Error("payload-too-large");
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function readScores() {
  try {
    const file = ensureDataFile(FILENAME, { scores: [] }, DATA_ENVS);
    const data = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(data?.scores) ? data.scores : [];
  } catch {
    return [];
  }
}

function writeScores(scores) {
  const file = getDataFile(FILENAME, DATA_ENVS);
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, JSON.stringify({ scores }, null, 2), "utf8");
  renameSync(temporary, file);
}

function sorted(scores) {
  return [...scores].sort((a, b) =>
    (b.bestScore || 0) - (a.bestScore || 0)
    || (a.bestDurationMs ?? Number.MAX_SAFE_INTEGER) - (b.bestDurationMs ?? Number.MAX_SAFE_INTEGER)
    || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)
  );
}

function publicScore(score, rank) {
  return {
    rank,
    discordId: String(score.discordId),
    username: score.username || "Discord builder",
    avatarUrl: score.avatarUrl || DEFAULT_AVATAR_URL,
    bestScore: Number(score.bestScore) || 0,
    bestDurationMs: Number.isFinite(score.bestDurationMs) ? score.bestDurationMs : null,
    updatedAt: score.updatedAt || null
  };
}

function leaderboard(scores, limit = 10) {
  return sorted(scores).slice(0, Math.min(50, Math.max(1, Number(limit) || 10))).map((score, index) => publicScore(score, index + 1));
}

function mine(scores, userId) {
  const ordered = sorted(scores);
  const index = ordered.findIndex((score) => String(score.discordId) === String(userId));
  return index < 0 ? null : publicScore(ordered[index], index + 1);
}

function rateLimited(userId) {
  const now = Date.now();
  const recent = (submissionWindows.get(userId) || []).filter((time) => now - time < 60_000);
  recent.push(now);
  submissionWindows.set(userId, recent);
  return recent.length > 8;
}

function sameOrigin(request) {
  const origin = String(request.headers?.origin || "");
  if (!origin) return true;
  try {
    const host = String(request.headers?.["x-forwarded-host"] || request.headers?.host || "").split(",")[0].trim();
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleTowerBlockRequest(request, response) {
  const url = new URL(request.url || "/api/tower-block", "http://localhost");
  const path = url.pathname.replace(/^\/api\/tower-block\/?/, "");
  const user = getSessionUser(request);
  let scores = readScores();

  if (["POST", "DELETE"].includes(request.method || "") && !sameOrigin(request)) return sendJson(response, 403, { error: "Cross-origin score mutation rejected." });
  if (request.method === "GET" && path === "leaderboard") return sendJson(response, 200, { leaderboard: leaderboard(scores, url.searchParams.get("limit")) });
  if (request.method === "GET" && path === "me") return sendJson(response, 200, { authenticated: !!user, user, score: user ? mine(scores, user.id) : null });

  if (request.method === "DELETE" && path === "me") {
    if (!user) return sendJson(response, 401, { error: "Connect Discord to reset your record." });
    scores = scores.filter((entry) => String(entry.discordId) !== String(user.id));
    writeScores(scores);
    return sendJson(response, 200, { score: null, leaderboard: leaderboard(scores) });
  }

  if (request.method === "POST" && path === "score") {
    if (!user) return sendJson(response, 401, { error: "Connect Discord to save Tower Block scores." });
    if (rateLimited(user.id)) return sendJson(response, 429, { error: "Too many tower runs submitted." });
    let body;
    try { body = await readBody(request); } catch { return sendJson(response, 400, { error: "Invalid score payload." }); }
    const score = Math.floor(Number(body.score));
    const durationMs = Math.round(Number(body.durationMs));
    if (!Number.isFinite(score) || score < 0 || score > 10000 || !Number.isFinite(durationMs) || durationMs < 0 || durationMs > 24 * 60 * 60 * 1000) {
      return sendJson(response, 400, { error: "Tower score failed validation." });
    }
    if (score > 0 && durationMs < score * 100) return sendJson(response, 422, { error: "Tower was built faster than the validation floor." });

    scores = readScores();
    const index = scores.findIndex((entry) => String(entry.discordId) === String(user.id));
    const current = index >= 0 ? scores[index] : null;
    const improves = score > Number(current?.bestScore || 0) || (score === Number(current?.bestScore || 0) && durationMs < Number(current?.bestDurationMs ?? Infinity));
    const now = new Date().toISOString();
    const next = {
      ...(current || { discordId: String(user.id), createdAt: now }),
      discordId: String(user.id), username: user.username, avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
      bestScore: improves ? score : current?.bestScore || 0,
      bestDurationMs: improves ? durationMs : current?.bestDurationMs,
      lastScore: score, lastDurationMs: durationMs, lastSeenAt: now,
      updatedAt: improves ? now : current?.updatedAt || now,
      submissions: (Number(current?.submissions) || 0) + 1
    };
    if (index >= 0) scores[index] = next; else scores.push(next);
    writeScores(scores);
    return sendJson(response, 200, { score: mine(scores, user.id), leaderboard: leaderboard(scores) });
  }

  sendJson(response, 404, { error: "Tower Block endpoint not found." });
}
