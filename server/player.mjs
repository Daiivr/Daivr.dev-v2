import { existsSync, readFileSync } from "node:fs";
import { getSessionUser, readComments } from "./comments.mjs";
import { getDataFile } from "./storage.mjs";
import { readPlayers, writePlayers } from "./player-store.mjs";
import { buildInbox } from "./community-inbox.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { dailyChallenge, PLAYER_GAMES } from "../shared/player-catalog.mjs";
import { challengeStats, challengeBadges } from "../shared/player-achievements.mjs";

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
  const badges = [{ id: "visitor", label: "Cabinet visitor", tier: "base", description: "Your place in the arcade." }];
  if (messages) badges.push({ id: "signal", label: "Signal sender", tier: "base", description: "Posted to the message board." });
  if (level >= 2) badges.push({ id: "buddy", label: "Buddy companion", tier: "base", description: "Reached buddy level 2." });
  if (records.some((record) => record.best > 0)) badges.push({ id: "player", label: "Arcade player", tier: "base", description: "Set a minigame record." });
  badges.push(...milestones.filter((badge) => badge.earned));
  const cosmetics = saved.cosmetics || [];
  const titles = ["Visitor", ...(messages ? ["Signal sender"] : []), ...cosmetics];
  return { user, level, quests: buddy.adventure?.completed?.length || 0, records, messages,
    challengeCount: saved.challengeCount || 0, ...stats, milestones, badges, cosmetics, titles,
    title: titles.includes(saved.title) ? saved.title : "Visitor",
    favoriteGame: PLAYER_GAMES.some((game) => game.id === saved.favoriteGame) ? saved.favoriteGame : "",
    featuredBadges: (saved.featuredBadges || ["visitor"]).filter((id) => badges.some((badge) => badge.id === id)).slice(0, 3),
    accent: ["default", ...cosmetics].includes(saved.accent) ? saved.accent || "default" : "default" };
}

export async function handlePlayerRequest(request, response) {
  const send = (status, body) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(JSON.stringify(body)); };
  try {
    const user = getSessionUser(request);
    const challenge = dailyChallenge();
    if (!user) return send(request.method === "GET" ? 200 : 401, { user: null, challenge, error: request.method === "GET" ? undefined : "Connect Discord to save your passport." });
    if (!["GET", "POST"].includes(request.method)) return send(405, { error: "Method not allowed." });
    const comments = readComments();
    let players = readPlayers();
    let saved = players[user.id] || {};
    let card = passport(user, saved, comments);
    if (request.method === "POST") {
      if (!sameOrigin(request)) return send(403, { error: "Cross-origin changes are not allowed." });
      const body = await readJsonBody(request, 4096);
      // Re-read after awaiting input so simultaneous game completions aren't overwritten.
      players = readPlayers(); saved = players[user.id] || {}; card = passport(user, saved, comments);
      if (!Array.isArray(body.featuredBadges) || body.featuredBadges.length > 3 || new Set(body.featuredBadges).size !== body.featuredBadges.length || body.featuredBadges.some((id) => !card.badges.some((badge) => badge.id === id)) || !card.titles.includes(body.title) || !["default", ...card.cosmetics].includes(body.accent) || (body.favoriteGame !== "" && !PLAYER_GAMES.some((game) => game.id === body.favoriteGame))) {
        return send(400, { error: "Choose an available title, game, accent, and up to three earned badges." });
      }
      saved = { ...saved, title: body.title, favoriteGame: body.favoriteGame, featuredBadges: body.featuredBadges, accent: body.accent };
      players[user.id] = saved; writePlayers(players); card = passport(user, saved, comments);
    }
    const progress = saved.daily?.date === challenge.date ? saved.daily : { best: 0, complete: false };
    send(200, { user, passport: card, challenge: { ...challenge, ...progress, complete: progress.complete || (saved.completedDates || []).includes(challenge.date) }, inbox: buildInbox(comments, user) });
  } catch (error) {
    console.error("[player]", error.message);
    send(error.status || 503, { error: error.status ? error.message : "Player data is temporarily unavailable. Please try again." });
  }
}
