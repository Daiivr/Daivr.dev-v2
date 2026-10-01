// Explicit public fields only: never include private saves or secret badges.
export function buildPlayerRankings(cards) {
  const entries = cards.map((card) => ({
    user: { id: card.user.id, username: card.user.username, avatarUrl: card.user.avatarUrl },
    level: card.progression.level, totalXp: card.progression.totalXp,
    bestStreak: card.bestStreak, currentStreak: card.currentStreak,
    challengeCount: card.challengeCount
  }));
  const stableTie = (a, b) => String(a.user.id).localeCompare(String(b.user.id));
  const top = (metric, tie) => entries.filter((entry) => entry[metric] > 0)
    .sort((a, b) => b[metric] - a[metric] || tie(a, b) || stableTie(a, b))
    .slice(0, 5).map((entry, index) => ({ ...entry, rank: index + 1 }));
  return {
    level: top("totalXp", () => 0),
    streak: top("bestStreak", (a, b) => b.currentStreak - a.currentStreak || b.totalXp - a.totalXp),
    completions: top("challengeCount", (a, b) => b.bestStreak - a.bestStreak || b.totalXp - a.totalXp)
  };
}
