import { dailyChallenge } from "../shared/player-catalog.mjs";
import { readJsonStore, writeJsonStore } from "./json-store.mjs";
import { challengeStats, challengeBadges } from "../shared/player-achievements.mjs";
import { reconcileProgression } from "./player-progression.mjs";

const FILE = "player-passports.json";
const ENVS = ["COMMENTS_DATA_DIR"];
const valid = (data) => !!data && typeof data === "object" && !Array.isArray(data);
export const readPlayers = () => readJsonStore(FILE, {}, ENVS, valid);
export const writePlayers = (value) => writeJsonStore(FILE, value, {}, ENVS, valid);

// Called only after a score passes its game's existing validation.
export function recordDailyRun(user, game, score, now = Date.now()) {
  const challenge = dailyChallenge(now);
  if (!user || game !== challenge.game) return;
  const players = readPlayers();
  const player = players[user.id] || {};
  const progress = player.daily?.date === challenge.date ? player.daily : { date: challenge.date, best: 0, complete: false };
  const best = Math.max(progress.best, score);
  // A target rebalance must not revoke a reward already earned today.
  const complete = progress.complete || (player.completedDates || []).includes(challenge.date) || best >= challenge.goal;
  const firstCompletion = complete && !progress.complete && !(player.completedDates || []).includes(challenge.date);
  players[user.id] = {
    ...player, daily: { date: challenge.date, best, complete },
    challengeCount: (player.challengeCount || 0) + (firstCompletion ? 1 : 0),
    cosmetics: [...new Set([...(player.cosmetics || []), ...(complete ? [challenge.reward] : [])])],
    // Retain the completion calendar so long streaks and earned badges survive.
    completedDates: firstCompletion ? [...(player.completedDates || []), challenge.date].sort() : player.completedDates || []
  };
  const next = players[user.id];
  players[user.id] = reconcileProgression(next, challengeBadges(next.challengeCount, challengeStats(next, now).bestStreak).filter((badge) => badge.earned), now).saved;
  writePlayers(players);
}
