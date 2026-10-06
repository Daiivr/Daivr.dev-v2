import { dailyChallenge, dailyChallengeKey, dailyChallengeValue } from "../shared/player-catalog.mjs";
import { hasNzpUnlocked } from "./nzp-unlock.mjs";
import { readJsonStore, writeJsonStore } from "./json-store.mjs";
import { challengeStats, challengeBadges } from "../shared/player-achievements.mjs";
import { reconcileProgression } from "./player-progression.mjs";

const FILE = "player-passports.json";
const ENVS = ["COMMENTS_DATA_DIR"];
const valid = (data) => !!data && typeof data === "object" && !Array.isArray(data);
export const readPlayers = () => readJsonStore(FILE, {}, ENVS, valid);
export const writePlayers = (value) => writeJsonStore(FILE, value, {}, ENVS, valid);

// Today's challenge for one player: NZ:P's day only goes to players who have it.
export const dailyChallengeFor = (userId, now = Date.now()) => dailyChallenge(now, { nzp: hasNzpUnlocked(userId) });

// Today's saved progress, if it belongs to today's challenge for this player
// (unlocking NZ:P mid-day swaps the challenge; older saves carry no key).
export function dailyProgress(player, challenge) {
  const saved = player.daily;
  return saved?.date === challenge.date && saved.key === dailyChallengeKey(challenge) ? saved : null;
}

// Called only after a result passes its game's existing validation. `result`
// is a score, or for NZ:P the game's stats ({ round, kills, headshots, score }).
export function recordDailyRun(user, game, result, now = Date.now()) {
  if (!user) return;
  const challenge = dailyChallengeFor(user.id, now);
  if (game !== challenge.game) return;
  const players = readPlayers();
  const player = players[user.id] || {};
  const progress = dailyProgress(player, challenge) || { best: 0, complete: false };
  const best = Math.max(progress.best, dailyChallengeValue(challenge, result));
  // A target rebalance must not revoke a reward already earned today.
  const complete = progress.complete || (player.completedDates || []).includes(challenge.date) || best >= challenge.goal;
  const firstCompletion = complete && !progress.complete && !(player.completedDates || []).includes(challenge.date);
  players[user.id] = {
    ...player, profile: { id: user.id, username: user.username, avatarUrl: user.avatarUrl }, daily: { date: challenge.date, key: dailyChallengeKey(challenge), best, complete },
    challengeCount: (player.challengeCount || 0) + (firstCompletion ? 1 : 0),
    cosmetics: [...new Set([...(player.cosmetics || []), ...(complete ? [challenge.reward] : [])])],
    // Retain the completion calendar so long streaks and earned badges survive.
    completedDates: firstCompletion ? [...(player.completedDates || []), challenge.date].sort() : player.completedDates || []
  };
  const next = players[user.id];
  players[user.id] = reconcileProgression(next, challengeBadges(next.challengeCount, challengeStats(next, now).bestStreak).filter((badge) => badge.earned), now).saved;
  writePlayers(players);
  return { ...challenge, complete, xp: players[user.id].xpAwards[`daily:${challenge.date}`] || 0, firstCompletion };
}
