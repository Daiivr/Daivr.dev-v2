export const PLAYER_GAMES = [
  { id: "tower-block", name: "Tower Block" },
  { id: "cross-road", name: "Cross Road" },
  { id: "space-cadet-pinball", name: "Space Cadet" },
  { id: "madrace", name: "Drive Mad" },
  { id: "rubiks-cube", name: "Rubik's Cube" }
];
export const DAILY_CHALLENGES = [
  { game: "tower-block", name: "Skyline builder", goal: 20, unit: "blocks", reward: "Skyline" },
  { game: "cross-road", name: "Road trip", goal: 75, unit: "points", reward: "Roadrunner" },
  { game: "space-cadet-pinball", name: "Orbit patrol", goal: 500000, unit: "points", reward: "Orbital" }
];
export function dailyChallenge(now = Date.now()) {
  const day = Math.floor(now / 86_400_000);
  const count = DAILY_CHALLENGES.length;
  return { ...DAILY_CHALLENGES[((day % count) + count) % count], date: new Date(now).toISOString().slice(0, 10), resetsAt: new Date((day + 1) * 86_400_000).toISOString() };
}
