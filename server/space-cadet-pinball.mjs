import { createLeaderboard } from "./leaderboard.mjs";

// La mesa marca de a 250 puntos y el skill shot solo ya da 75.000, asi que el
// techo se pone en el orden del record mundial y no en el de Cross Road.
const MAX_SCORE = 100_000_000;
const MAX_DURATION_MS = 6 * 60 * 60 * 1000;

// Suelo de validacion: la bola no puede estar en juego menos de tres segundos, y
// mas de 40.000 puntos por segundo no sale ni encadenando jackpots.
const MIN_RUN_MS = 3000;
const MAX_POINTS_PER_SECOND = 40_000;

export const handleSpaceCadetPinballRequest = createLeaderboard({
  game: "space-cadet-pinball",
  label: "Space Cadet",
  runNoun: "table runs",
  filename: "space-cadet-pinball-leaderboard.json",
  dataEnvs: ["SPACE_CADET_PINBALL_DATA_DIR", "GAME_DATA_DIR"],
  maxScore: MAX_SCORE,
  maxDurationMs: MAX_DURATION_MS,
  isTooFast: (score, durationMs) => durationMs < MIN_RUN_MS || score / (durationMs / 1000) > MAX_POINTS_PER_SECOND,
  tooFastMessage: "Table run was faster than the validation floor.",
  defaultUsername: "Cadet"
});
