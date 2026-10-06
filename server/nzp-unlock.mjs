import { isBuddyJournalComplete } from "../shared/buddy-journal.mjs";
import { readBuddyAdventure } from "./buddy.mjs";
import { readJsonStore } from "./json-store.mjs";

export const NZP_LEADERBOARD_FILE = "nzp-leaderboard.json";
export const NZP_DATA_ENVS = ["NZP_DATA_DIR", "GAME_DATA_DIR"];

// NZ:P es la recompensa del diario completo de Buddy. Decide si el reto diario
// de NZ:P le toca a este jugador (shared/player-catalog.mjs dailyChallenge): con
// el diario guardado en el servidor completo, o si ya ha guardado partidas de
// NZ:P (lo juega aunque su progreso de Buddy aun no se haya sincronizado).
export function hasNzpUnlocked(userId) {
  if (!userId) return false;
  try {
    if (isBuddyJournalComplete(readBuddyAdventure(String(userId)))) return true;
  } catch { /* sin progreso guardado */ }
  const data = readJsonStore(NZP_LEADERBOARD_FILE, { scores: [] }, NZP_DATA_ENVS, (value) => Array.isArray(value?.scores));
  return data.scores.some((entry) => String(entry.discordId) === String(userId) && Number(entry.games) > 0);
}
