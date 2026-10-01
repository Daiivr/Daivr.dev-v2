import { FISH_CATALOG } from "../shared/buddy-catches.mjs";
import { dailyXp, playerProgression } from "../shared/player-progression.mjs";

// These definitions stay server-side: locked secrets never enter a response.
const SECRET_BADGES = [
  { id: "first-boot", label: "Hello, world", tier: "bronze", xp: 75, description: "Booted Dai.exe for the first time.", icon: "boot", test: (a) => a.daiBooted },
  { id: "fish-archivist", label: "Deep-sea archivist", tier: "diamond", xp: 2000, description: "Caught every fish species in the Buddy journal.", icon: "fish", test: (a) => FISH_CATALOG.filter((fish) => fish.kind === "fish").every((fish) => a.fishCollection?.[fish.id] > 0) },
  { id: "abyss-witness", label: "Abyss witness", tier: "gold", xp: 500, description: "Witnessed the Void Leviathan at the surface.", icon: "sighting", test: (a) => a.leviathanSightings > 0 },
  { id: "night-owl", label: "Night owl", tier: "silver", xp: 150, description: "Woke Buddy during the late shift.", icon: "night", test: (a) => a.midnightWakeups > 0 },
  { id: "bug-hunter", label: "Bug exterminator", tier: "gold", xp: 400, description: "Helped Buddy defeat 25 bugs.", icon: "bug", test: (a) => a.bugsDefeated >= 25 }
];

export function secretBadges(adventure = {}) {
  return SECRET_BADGES.filter((badge) => badge.test(adventure)).map(({ test, ...badge }) => ({ ...badge, secret: true, earned: true }));
}

// One ledger entry per UTC win and badge. Re-reading, syncing, and replaying
// cannot award XP twice. Backfill known history without inventing old streaks.
export function reconcileProgression(saved, eligibleBadges, now = Date.now()) {
  const awards = { ...(saved.xpAwards || {}) };
  const unlocked = { ...(saved.unlockedBadges || {}) };
  const newBadges = [];
  const today = new Date(now).toISOString().slice(0, 10);
  const dates = [...new Set([...(saved.completedDates || []), ...(saved.daily?.complete ? [saved.daily.date] : [])])]
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && date <= today).sort();
  let previous = -Infinity;
  let streak = 0;
  for (const date of dates) {
    const day = Date.parse(`${date}T00:00:00Z`) / 86400000;
    streak = day === previous + 1 ? streak + 1 : 1;
    previous = day;
    awards[`daily:${date}`] ??= dailyXp(streak).total;
  }
  if (!saved.xpAwards) awards.legacy = Math.max(0, (saved.challengeCount || 0) - dates.length) * dailyXp().base;
  for (const badge of eligibleBadges) {
    if (!unlocked[badge.id]) {
      unlocked[badge.id] = { ...badge, earned: true, unlockedAt: new Date(now).toISOString() };
      newBadges.push(unlocked[badge.id]);
    }
    awards[`badge:${badge.id}`] ??= badge.xp;
  }
  const totalXp = Object.values(awards).reduce((sum, xp) => sum + xp, 0);
  return { saved: { ...saved, xpAwards: awards, unlockedBadges: unlocked }, badges: Object.values(unlocked), newBadges, progression: playerProgression(totalXp) };
}
