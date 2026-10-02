import { createLeaderboard } from "./leaderboard.mjs";

export const handleTowerBlockRequest = createLeaderboard({
  game: "tower-block",
  label: "Tower Block",
  runNoun: "tower runs",
  filename: "tower-block-leaderboard.json",
  dataEnvs: ["TOWER_BLOCK_DATA_DIR", "GAME_DATA_DIR"],
  maxScore: 10_000,
  // Cada bloque tarda al menos 100 ms en colocarse.
  isTooFast: (score, durationMs) => durationMs < score * 100,
  tooFastMessage: "Tower was built faster than the validation floor.",
  defaultUsername: "Discord builder"
});
