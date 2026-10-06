export const PLAYER_GAMES = [
  { id: "tower-block", name: "Tower Block" },
  { id: "cross-road", name: "Cross Road" },
  { id: "space-cadet-pinball", name: "Space Cadet" },
  { id: "madrace", name: "Drive Mad" },
  { id: "rubiks-cube", name: "Rubik's Cube" }
];
// NZ:P stays out of PLAYER_GAMES (the passport's favorite-game list) because
// it is a secret reward; it only needs a name for its daily challenge.
export const gameTitle = (id) => (id === "nzp" ? "NZ:P" : PLAYER_GAMES.find((game) => game.id === id)?.name || "");
export const DAILY_CHALLENGES = [
  { game: "tower-block", name: "Skyline builder", goal: 20, unit: "blocks", reward: "Skyline" },
  { game: "cross-road", name: "Road trip", goal: 75, unit: "points", reward: "Roadrunner" },
  { game: "space-cadet-pinball", name: "Orbit patrol", goal: 500000, unit: "points", reward: "Orbital" },
  // NZ:P's day changes goal every time it comes round. `metric` is the stat of
  // one game that counts (server/nzp.mjs).
  { game: "nzp", variants: [
    { metric: "round", name: "Last stand", task: "Survive to round 10", goal: 10, unit: "rounds", reward: "Survivor" },
    { metric: "headshots", name: "Steady aim", task: "Land 40 headshots", goal: 40, unit: "headshots", reward: "Marksman" },
    { metric: "kills", name: "Horde control", task: "Kill 150 zombies", goal: 150, unit: "kills", reward: "Exterminator" },
    { metric: "score", name: "Big spender", task: "Earn 15,000 points", goal: 15000, unit: "points", reward: "Tycoon" }
  ] }
];
const REGULAR_CHALLENGES = DAILY_CHALLENGES.filter((challenge) => !challenge.variants);
const pick = (list, index) => list[((index % list.length) + list.length) % list.length];

// One challenge a day for everyone, at 00:00 UTC. NZ:P is a hidden reward
// (Buddy's full journal), so a player who hasn't unlocked it (`nzp: false`)
// gets one of the regular challenges on NZ:P's day instead and keeps their streak.
export function dailyChallenge(now = Date.now(), { nzp = false } = {}) {
  const day = Math.floor(now / 86_400_000);
  const lap = Math.floor(day / DAILY_CHALLENGES.length);
  let challenge = pick(DAILY_CHALLENGES, day);
  if (challenge.variants) challenge = nzp ? { game: challenge.game, ...pick(challenge.variants, lap) } : { ...pick(REGULAR_CHALLENGES, lap), fallback: true };
  return { ...challenge, date: new Date(now).toISOString().slice(0, 10), resetsAt: new Date((day + 1) * 86_400_000).toISOString() };
}

// Which record a day's progress belongs to: the regular game and the NZ:P goal
// of one date are different challenges.
export const dailyChallengeKey = (challenge) => `${challenge.game}:${challenge.metric || "score"}`;

// The value of a result that counts for a challenge: a plain score, or for
// NZ:P the stat the day's goal is about.
export const dailyChallengeValue = (challenge, result) => Math.max(0, Number(typeof result === "object" && result ? result[challenge.metric || "score"] : result) || 0);
