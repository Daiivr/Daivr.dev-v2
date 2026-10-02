import { createLeaderboard } from "./leaderboard.mjs";

export const handleCrossRoadRequest = createLeaderboard({
  game: "cross-road",
  label: "Cross Road",
  runNoun: "road runs",
  filename: "cross-road-leaderboard.json",
  dataEnvs: ["CROSS_ROAD_DATA_DIR", "GAME_DATA_DIR"],
  maxScore: 100_000,
  // Cada fila avanzada lleva al menos 150 ms de salto.
  isTooFast: (score, durationMs) => durationMs < score * 150,
  tooFastMessage: "Road progress was faster than the validation floor.",
  defaultUsername: "Road runner"
});
