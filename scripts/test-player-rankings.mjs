import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPlayerRankings } from "../server/player-rankings.mjs";

test("three independent top fives rank XP, best streak and total wins with deterministic ties", () => {
  const cards = Array.from({ length: 8 }, (_, i) => ({ user: { id: String(i), username: `Player ${i}`, avatarUrl: "/avatar.png", private: "hidden" }, progression: { level: 3, totalXp: i * 100 }, bestStreak: 8 - i, currentStreak: 0, challengeCount: i === 0 ? 50 : i, badges: [{ id: "secret" }] }));
  const result = buildPlayerRankings(cards);
  assert.deepEqual(result.level.map((entry) => entry.user.id), ["7", "6", "5", "4", "3"]);
  assert.deepEqual(result.streak.map((entry) => entry.user.id), ["0", "1", "2", "3", "4"]);
  assert.deepEqual(result.completions.map((entry) => entry.user.id), ["0", "7", "6", "5", "4"]);
  assert.deepEqual(result.level.map((entry) => entry.rank), [1, 2, 3, 4, 5]);
  assert.ok(!JSON.stringify(result).includes("secret"));
  assert.ok(!JSON.stringify(result).includes("private"));
  const tie = cards.slice(0, 2).map((card) => ({ ...card, progression: { level: 2, totalXp: 200 }, bestStreak: 1, challengeCount: 1 }));
  assert.deepEqual(buildPlayerRankings(tie.reverse()).level.map((entry) => entry.user.id), ["0", "1"]);
  assert.deepEqual(buildPlayerRankings([]), { level: [], streak: [], completions: [] });
});
