import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyXp, playerProgression } from "../shared/player-progression.mjs";
import { challengeBadges } from "../shared/player-achievements.mjs";
import { reconcileProgression, secretBadges } from "../server/player-progression.mjs";
import { FISH_CATALOG } from "../shared/buddy-catches.mjs";

const now = Date.parse("2026-10-01T12:00:00Z");

test("Miku outfit badge follows the full journal unlock, stays secret, and pays once", () => {
  const id = "digital-diva";
  assert.ok(!secretBadges({ inventory: ["miku-costume"], adminUnlock: true }).some(b => b.id === id));
  const fishCollection = Object.fromEntries(FISH_CATALOG.map(item => [item.id, 1]));
  const missing = { ...fishCollection, "token-chest": 0 };
  assert.ok(!secretBadges({ fishCollection: missing }).some(b => b.id === id));
  const badge = secretBadges({ fishCollection }).find(b => b.id === id);
  assert.ok(badge.secret && badge.earned);
  assert.equal(badge.icon, "music");
  const first = reconcileProgression({}, [badge], now);
  assert.equal(first.progression.totalXp, 1500);
  const again = reconcileProgression(first.saved, [badge], now);
  assert.equal(again.progression.totalXp, 1500);
  assert.equal(again.newBadges.length, 0);
  assert.ok(reconcileProgression(first.saved, [], now).badges.some(b => b.id === id));
});
test("Leviathan milestones remain secret until their exact count and pay only once", () => {
  let saved = {};
  for (const [count, expected, xp] of [[0, 0, 0], [1, 1, 500], [2, 1, 500], [3, 2, 1250], [9, 2, 1250], [10, 3, 2650], [24, 3, 2650], [25, 4, 5150], [100, 4, 5150]]) {
    const badges = secretBadges({ leviathanSightings: count });
    assert.equal(badges.length, expected);
    assert.ok(badges.every((badge) => badge.secret && badge.earned));
    const result = reconcileProgression(saved, badges, now);
    assert.equal(result.progression.totalXp, xp);
    assert.equal(reconcileProgression(result.saved, badges, now).newBadges.length, 0);
    saved = result.saved;
  }
});
test("player levels have exact boundaries and progressively higher costs", () => {
  assert.equal(playerProgression(0).level, 1);
  assert.equal(playerProgression(199).remainingXp, 1);
  assert.deepEqual(playerProgression(200), { level: 2, totalXp: 200, levelXp: 0, levelGoal: 300, remainingXp: 300 });
  assert.equal(playerProgression(499).level, 2);
  assert.equal(playerProgression(500).level, 3);
  assert.equal(playerProgression(1000000).level, 140);
  assert.equal(dailyXp(1).total, 100);
  assert.equal(dailyXp(7).total, 160);
  assert.equal(dailyXp(365).total, 3740);
});

test("daily XP backfills unique dates, resets after gaps, and never pays twice", () => {
  const saved = { challengeCount: 5, completedDates: ["2026-09-27", "2026-09-28", "2026-09-28", "2026-09-30", "2026-10-01"] };
  const first = reconcileProgression(saved, [], now);
  assert.equal(first.progression.totalXp, 520); // 420 known + 100 legacy win
  assert.equal(first.saved.xpAwards["daily:2026-10-01"], 110);
  assert.deepEqual(reconcileProgression(first.saved, [], now).saved, first.saved);
  const tomorrow = reconcileProgression({ ...first.saved, completedDates: [...saved.completedDates, "2026-10-02"] }, [], now + 86400000);
  assert.equal(tomorrow.progression.totalXp, 640);
  assert.equal(reconcileProgression(tomorrow.saved, [], now + 5 * 86400000).progression.totalXp, 640);
});

test("badges award difficulty-based XP once and remain unlocked when evidence disappears", () => {
  const badges = challengeBadges(7, 7).filter((badge) => badge.earned);
  const first = reconcileProgression({}, badges, now);
  assert.equal(first.progression.totalXp, 425);
  assert.equal(first.newBadges.length, 4);
  assert.equal(reconcileProgression(first.saved, badges, now).newBadges.length, 0);
  const later = reconcileProgression(first.saved, [], now);
  assert.equal(later.badges.length, 4);
  assert.equal(later.progression.totalXp, 425);
});

test("secrets are absent until earned and fish completion requires every fish, not junk", () => {
  assert.deepEqual(secretBadges(), []);
  assert.deepEqual(secretBadges({ fishCollection: { fake: 999 } }), []);
  const fishCollection = Object.fromEntries(FISH_CATALOG.filter((fish) => fish.kind === "fish").map((fish) => [fish.id, 1]));
  const badges = secretBadges({ fishCollection, daiBooted: true, leviathanSightings: 1, midnightWakeups: 1, bugsDefeated: 25 });
  assert.equal(badges.length, 5);
  assert.ok(badges.every((badge) => badge.secret && badge.earned && !badge.test));
  const first = reconcileProgression({}, badges, now);
  assert.equal(first.progression.totalXp, 3125);
  assert.equal(reconcileProgression(first.saved, badges, now).progression.totalXp, 3125);
  delete fishCollection["byte-minnow"];
  assert.deepEqual(secretBadges({ fishCollection }), []);
});
