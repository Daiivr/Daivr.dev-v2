const DAY = 86_400_000;

export const CHALLENGE_BADGES = [
  { id: "challenger", label: "Daily challenger", metric: "completions", target: 1, tier: "bronze" },
  { id: "regular", label: "Cabinet regular", metric: "completions", target: 7, tier: "bronze" },
  { id: "daily-25", label: "Challenge hunter", metric: "completions", target: 25, tier: "silver" },
  { id: "daily-50", label: "Arcade veteran", metric: "completions", target: 50, tier: "silver" },
  { id: "daily-100", label: "Century club", metric: "completions", target: 100, tier: "gold" },
  { id: "daily-250", label: "Cabinet elite", metric: "completions", target: 250, tier: "platinum" },
  { id: "daily-365", label: "Arcade legend", metric: "completions", target: 365, tier: "diamond" },
  { id: "streak-3", label: "On a roll", metric: "streak", target: 3, tier: "bronze" },
  { id: "streak-7", label: "Week of fire", metric: "streak", target: 7, tier: "silver" },
  { id: "streak-14", label: "Unstoppable", metric: "streak", target: 14, tier: "silver" },
  { id: "streak-30", label: "Full throttle", metric: "streak", target: 30, tier: "gold" },
  { id: "streak-60", label: "Never miss", metric: "streak", target: 60, tier: "platinum" },
  { id: "streak-100", label: "Eternal flame", metric: "streak", target: 100, tier: "diamond" }
];

// UTC calendar days, not elapsed 24-hour periods. Yesterday's streak remains
// active until today's challenge closes. Existing saved dates backfill awards.
export function challengeStats(saved, now = Date.now()) {
  const today = Math.floor(now / DAY);
  const days = [...new Set([
    ...(saved.completedDates || []),
    ...(saved.daily?.complete ? [saved.daily.date] : [])
  ].map((date) => Date.parse(`${date}T00:00:00Z`) / DAY)
    .filter((day) => Number.isInteger(day) && day <= today))].sort((a, b) => a - b);
  let run = 0;
  let bestStreak = 0;
  let previous;
  for (const day of days) {
    run = day === previous + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }
  return { currentStreak: previous >= today - 1 ? run : 0, bestStreak };
}

export function challengeBadges(count, bestStreak) {
  const rewards = [50, 100, 250, 400, 750, 1500, 2500, 75, 200, 350, 700, 1400, 2500];
  return CHALLENGE_BADGES.map((badge, index) => {
    const value = badge.metric === "completions" ? count : bestStreak;
    return { ...badge, xp: rewards[index], earned: value >= badge.target, progress: Math.min(value, badge.target),
      description: badge.metric === "completions"
        ? `Complete ${badge.target} daily challenge${badge.target === 1 ? "" : "s"}.`
        : `Complete daily challenges ${badge.target} UTC days in a row.` };
  });
}
