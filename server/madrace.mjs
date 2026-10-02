import { DEFAULT_AVATAR_URL, refreshLeaderboardProfiles } from "./discord-avatar.mjs";
import { getSessionUser } from "./comments.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { apiPath, createRanking, createRateLimiter, createScoreStore, sendJson } from "./leaderboard.mjs";
import { readRunToken, RUN_CLOCK_SLACK_MS, sendRunToken } from "./run-tokens.mjs";

const MAX_LEVEL = 10000;
const MAX_TIME_MS = 24 * 60 * 60 * 1000;
const MAX_LEVEL_CATCH_UP = 25;
const MIN_LEVEL_TIME_MS = 250;
// Network jitter between two consecutive level packets.
const LEVEL_PACING_SLACK_MS = 1000;

const store = createScoreStore("madrace-leaderboard.json", ["MADRACE_DATA_DIR", "GAME_DATA_DIR"]);
const isRateLimited = createRateLimiter(10_000, 6);
const ranking = createRanking({
  compare: (a, b) => (b.highestLevel || 0) - (a.highestLevel || 0)
    || (a.bestTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.bestTimeMs ?? Number.MAX_SAFE_INTEGER)
    || new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
  toPublic: (score, rank) => ({
    rank,
    discordId: String(score.discordId),
    username: score.username || "Discord player",
    avatarUrl: score.avatarUrl || DEFAULT_AVATAR_URL,
    highestLevel: Number(score.highestLevel) || 0,
    bestTimeMs: Number.isFinite(score.bestTimeMs) ? score.bestTimeMs : null,
    updatedAt: score.updatedAt || null
  })
});
const leaderboard = (scores, limit) => ranking.leaderboard(scores, limit);
const scoreForUser = (scores, userId) => ranking.forUser(scores, userId);
const readScores = () => store.read();
const writeScores = (scores) => store.write(scores);

function integer(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const result = Math.floor(number);
  return result >= min && result <= max ? result : null;
}

export async function handleMadraceRequest(request, response) {
  const { url, path } = apiPath(request, ["madrace", "drive-mad"]);
  const user = getSessionUser(request);
  let scores = readScores();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method || "") && !sameOrigin(request)) {
    sendJson(response, 403, { error: "Cross-origin score mutation rejected." });
    return;
  }

  if (request.method === "GET" && path === "leaderboard") {
    const rankings = leaderboard(scores, url.searchParams.get("limit"));
    sendJson(response, 200, { leaderboard: await refreshLeaderboardProfiles(rankings) });
    return;
  }

  if (request.method === "POST" && path === "run") return sendRunToken(response, "madrace");

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
      body = await readJsonBody(request, 16_384);
    } catch (error) {
      return sendJson(response, error.status || 400, { error: "Invalid progress payload." });
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
    const previousTime = Number(current?.bestTimeMs) || 0;
    if (levelMs !== null && levelMs < MIN_LEVEL_TIME_MS) {
      return sendJson(response, 422, { error: "Level completion was faster than the validation floor." });
    }

    // The game clock belongs to the browser, so pacing uses the server's clock:
    // the floor must have passed for every claimed level both since the last
    // accepted level and since this run's token was issued. Without it, a few
    // minutes of invented packets reached level 10,000. Only the token anchor
    // gets the startup slack; minting a fresh token per packet cannot reset the
    // time measured since the last accepted level.
    const now = Date.now();
    const runIssuedAt = readRunToken(body.runToken, "madrace", now);
    if (runIssuedAt === null) {
      return sendJson(response, 400, { error: "Run token missing or expired. Reopen Madrace and try again." });
    }
    if (levelAdvance > 0) {
      const lastAdvanceAt = Date.parse(current?.lastAdvanceAt || "");
      const sinceLastAdvance = Number.isFinite(lastAdvanceAt) ? now - lastAdvanceAt + LEVEL_PACING_SLACK_MS : Infinity;
      const watchedMs = Math.min(sinceLastAdvance, now - runIssuedAt + RUN_CLOCK_SLACK_MS);
      if (levelAdvance * MIN_LEVEL_TIME_MS > watchedMs) {
        return sendJson(response, 422, { error: "Levels arrived faster than the server has been watching." });
      }
    }

    // The embedded game owns a session-relative clock. Restarts, restores and
    // level retries can legitimately reset or recalculate that clock, so it
    // must not be compared as if it were a global monotonic timestamp. Keep
    // leaderboard time monotonic when advancing and retain raw time separately.
    const minimumAdvanceMs = Math.max(
      levelAdvance * MIN_LEVEL_TIME_MS,
      levelMs !== null ? levelMs : 0
    );
    const normalizedTimeMs = levelAdvance > 0
      ? Math.max(cumulativeMs, previousTime + minimumAdvanceMs)
      : cumulativeMs;

    const stamp = new Date(now).toISOString();
    const improves = level > currentLevel || (level === currentLevel && normalizedTimeMs < Number(current?.bestTimeMs ?? Infinity));
    const next = {
      ...(current || { discordId: String(user.id), createdAt: stamp }),
      discordId: String(user.id),
      username: user.username,
      avatarUrl: user.avatarUrl || DEFAULT_AVATAR_URL,
      highestLevel: improves ? level : currentLevel,
      bestTimeMs: improves ? normalizedTimeMs : current?.bestTimeMs,
      bestSessionId: improves ? sessionId : current?.bestSessionId,
      updatedAt: improves ? stamp : current?.updatedAt || stamp,
      lastAdvanceAt: levelAdvance > 0 ? stamp : current?.lastAdvanceAt,
      lastSeenAt: stamp,
      lastReportedTimeMs: cumulativeMs,
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
