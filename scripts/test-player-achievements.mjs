import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dailyChallenge } from "../shared/player-catalog.mjs";
import { challengeStats, challengeBadges } from "../shared/player-achievements.mjs";
import { readPlayers, writePlayers, recordDailyRun } from "../server/player-store.mjs";

const DAY = 86_400_000;
const start = Date.parse("2026-01-01T00:00:00Z");
const date = (offset) => new Date(start + offset * DAY).toISOString().slice(0, 10);

test("streaks backfill from distinct UTC dates, allow today, and expire after a missed day", () => {
  const saved = { completedDates: [date(2), date(0), date(1), date(1)] };
  assert.deepEqual(challengeStats(saved, start + 3 * DAY), { currentStreak: 3, bestStreak: 3 });
  assert.deepEqual(challengeStats(saved, start + 4 * DAY), { currentStreak: 0, bestStreak: 3 });
  assert.deepEqual(challengeStats({}, start), { currentStreak: 0, bestStreak: 0 });
  assert.equal(challengeStats({ daily: { date: date(0), complete: true } }, start).currentStreak, 1);
  const earned = challengeBadges(25, 3).filter((badge) => badge.earned).map((badge) => badge.id);
  assert.deepEqual(earned, ["challenger", "regular", "daily-25", "streak-3"]);
  assert.equal(challengeBadges(25, 3).find((badge) => badge.id === "streak-7").progress, 3);
});

test("validated daily runs keep long streaks, prevent duplicate awards, and preserve old wins", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "daivr-achievements-"));
  const previous = process.env.COMMENTS_DATA_DIR;
  process.env.COMMENTS_DATA_DIR = dir;
  t.after(() => {
    if (previous === undefined) delete process.env.COMMENTS_DATA_DIR;
    else process.env.COMMENTS_DATA_DIR = previous;
    rmSync(dir, { recursive: true, force: true });
  });
  const user = { id: "streak-test" };
  let challenge = dailyChallenge(start);
  recordDailyRun(user, "wrong-game", challenge.goal, start);
  assert.equal(readPlayers()[user.id], undefined);
  recordDailyRun(user, challenge.game, challenge.goal - 1, start);
  assert.equal(readPlayers()[user.id].challengeCount, 0);
  for (let day = 0; day < 105; day++) {
    const now = start + day * DAY;
    challenge = dailyChallenge(now);
    recordDailyRun(user, challenge.game, challenge.goal, now);
    const awarded = readPlayers()[user.id].xpAwards;
    recordDailyRun(user, challenge.game, challenge.goal + 10, now);
    assert.deepEqual(readPlayers()[user.id].xpAwards, awarded);
  }
  let saved = readPlayers()[user.id];
  assert.equal(saved.challengeCount, 105);
  assert.equal(saved.completedDates.length, 105);
  assert.equal(saved.xpAwards[`daily:${date(104)}`], 1140);
  assert.deepEqual(challengeStats(saved, start + 105 * DAY), { currentStreak: 105, bestStreak: 105 });
  // Two missed days reset the current run, but never revoke earned streak medals.
  challenge = dailyChallenge(start + 107 * DAY);
  recordDailyRun(user, challenge.game, challenge.goal, start + 107 * DAY);
  saved = readPlayers()[user.id];
  assert.equal(saved.xpAwards[`daily:${date(107)}`], 100);
  assert.deepEqual(challengeStats(saved, start + 107 * DAY), { currentStreak: 1, bestStreak: 105 });
  assert.equal(challengeBadges(saved.challengeCount, 105).find((badge) => badge.id === "streak-100").earned, true);
  challenge = dailyChallenge(start);
  recordDailyRun(user, challenge.game, challenge.goal, start);
  assert.equal(readPlayers()[user.id].challengeCount, 106);
  // A completion at the pre-rebalance target stays completed after another run.
  writePlayers({ legacy: { challengeCount: 1, completedDates: [date(0)], daily: { date: date(0), best: 1, complete: true } } });
  recordDailyRun({ id: "legacy" }, challenge.game, 2, start);
  assert.equal(readPlayers().legacy.daily.complete, true);
  assert.equal(readPlayers().legacy.challengeCount, 1);
});
