import { existsSync, readFileSync } from "node:fs";
import { getSessionUser, readComments } from "./comments.mjs";
import { getDataFile } from "./storage.mjs";
import { readPlayers, writePlayers } from "./player-store.mjs";
import { buildInbox } from "./community-inbox.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { dailyChallenge, PLAYER_GAMES } from "../shared/player-catalog.mjs";
import { challengeStats, challengeBadges } from "../shared/player-achievements.mjs";
import { dailyXp } from "../shared/player-progression.mjs";
import { reconcileProgression, secretBadges } from "./player-progression.mjs";

function readExisting(name, envs = []) {
  const path = getDataFile(name, envs);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8"));
}

function passport(user, saved, comments) {
  const buddy = readExisting("buddy-friendship.json", ["COMMENTS_DATA_DIR"])[user.id] || {};
  const level = [0, 10, 25, 60, 120].filter((threshold) => (buddy.pets || 0) >= threshold).length;
  const records = ["tower-block", "cross-road", "space-cadet-pinball", "madrace"].map((game) => {
    const env = `${game.replaceAll("-", "_").toUpperCase()}_DATA_DIR`;
    const score = (readExisting(`${game}-leaderboard.json`, [env, "GAME_DATA_DIR"]).scores || []).find((entry) => String(entry.discordId) === String(user.id));
    return { game, best: game === "madrace" ? score?.highestLevel ?? null : score?.bestScore ?? null };
  });
  const messages = comments.flatMap((entry) => [entry, ...(entry.replies || [])]).filter((entry) => String(entry.author?.id) === String(user.id)).length;
  const stats = challengeStats(saved);
  const milestones = challengeBadges(saved.challengeCount || 0, stats.bestStreak);
  const badges = [{ id: "visitor", label: "Cabinet visitor", tier: "base", xp: 25, description: "Your place in the arcade." }];
  if (messages) badges.push({ id: "signal", label: "Signal sender", tier: "base", xp: 50, description: "Posted to the message board." });
  if (level >= 2) badges.push({ id: "buddy", label: "Buddy companion", tier: "base", xp: 100, description: "Reached buddy level 2." });
  if (records.some((record) => record.best > 0)) badges.push({ id: "player", label: "Arcade player", tier: "base", xp: 50, description: "Set a minigame record." });
  badges.push(...milestones.filter((badge) => badge.earned));
  badges.push(...secretBadges(buddy.adventure));
  const reconciled = reconcileProgression(saved, badges);
  const earnedBadges = reconciled.badges;
  const cosmetics = saved.cosmetics || [];
  const titles = ["Visitor", ...(messages ? ["Signal sender"] : []), ...cosmetics];
  return { saved: reconciled.saved, card: { user, level, progression: reconciled.progression, quests: buddy.adventure?.completed?.length || 0, records, messages,
    challengeCount: saved.challengeCount || 0, ...stats, milestones, badges: earnedBadges, cosmetics, titles,
    title: titles.includes(saved.title) ? saved.title : "Visitor",
    favoriteGame: PLAYER_GAMES.some((game) => game.id === saved.favoriteGame) ? saved.favoriteGame : "",
    featuredBadges: (saved.featuredBadges || ["visitor"]).filter((id) => earnedBadges.some((badge) => badge.id === id)).slice(0, 3),
    accent: ["default", ...cosmetics].includes(saved.accent) ? saved.accent || "default" : "default" } };
}

export async function handlePlayerRequest(request, response) {
  const send = (status, body) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(body)); };
  try {
    const user = getSessionUser(request);
    const challenge = { ...dailyChallenge(), xp: dailyXp() };
    if (!user) return send(request.method === "GET" ? 200 : 401, { user: null, challenge, error: request.method === "GET" ? undefined : "Connect Discord to save your passport." });
    if (!["GET", "POST"].includes(request.method)) return send(405, { error: "Method not allowed." });
    let body;
    if (request.method === "POST") {
      if (!sameOrigin(request)) return send(403, { error: "Cross-origin changes are not allowed." });
      body = await readJsonBody(request, 4096);
    }
    const comments = readComments();
    const players = readPlayers();
    let saved = players[user.id] || {};
    const original = JSON.stringify(saved);
    let result = passport(user, saved, comments);
    saved = result.saved;
    let card = result.card;
    if (request.method === "POST") {
      if (!Array.isArray(body.featuredBadges) || body.featuredBadges.length > 3 || new Set(body.featuredBadges).size !== body.featuredBadges.length || body.featuredBadges.some((id) => !card.badges.some((badge) => badge.id === id)) || !card.titles.includes(body.title) || !["default", ...card.cosmetics].includes(body.accent) || (body.favoriteGame !== "" && !PLAYER_GAMES.some((game) => game.id === body.favoriteGame))) {
        return send(400, { error: "Choose an available title, game, accent, and up to three earned badges." });
      }
      saved = { ...saved, title: body.title, favoriteGame: body.favoriteGame, featuredBadges: body.featuredBadges, accent: body.accent };
      result = passport(user, saved, comments); saved = result.saved; card = result.card;
    }
    if (JSON.stringify(saved) !== original) { players[user.id] = saved; writePlayers(players); }
    const progress = saved.daily?.date === challenge.date ? saved.daily : { best: 0, complete: false };
    const complete = progress.complete || (saved.completedDates || []).includes(challenge.date);
    const xp = dailyXp(complete ? card.currentStreak : card.currentStreak + 1);
    if (complete) { xp.total = saved.xpAwards[`daily:${challenge.date}`] ?? xp.total; xp.bonus = xp.total - xp.base; }
    send(200, { user, passport: card, challenge: { ...challenge, ...progress, complete, xp }, inbox: buildInbox(comments, user) });
  } catch (error) {
    console.error("[player]", error.message);
    send(error.status || 503, { error: error.status ? error.message : "Player data is temporarily unavailable. Please try again." });
  }
}
