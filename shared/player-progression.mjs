export const DAILY_BASE_XP = 100;
export const DAILY_STREAK_XP = 10;

export function dailyXp(streak = 1) {
  const bonus = Math.max(0, streak - 1) * DAILY_STREAK_XP;
  return { base: DAILY_BASE_XP, bonus, total: DAILY_BASE_XP + bonus, streak };
}

// Level 1 starts at zero. Each next level costs 100 XP more than the last.
export function playerProgression(xp = 0) {
  const totalXp = Math.max(0, Math.floor(Number(xp) || 0));
  const level = Math.floor((Math.sqrt(9 + totalXp * 0.08) - 3) / 2) + 1;
  const levelStart = 50 * (level - 1) * (level + 2);
  const levelXp = totalXp - levelStart;
  const levelGoal = 100 * (level + 1);
  return { level, totalXp, levelXp, levelGoal, remainingXp: levelGoal - levelXp };
}
