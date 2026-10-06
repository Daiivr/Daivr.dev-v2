// The client program (tools/nzp-qc/daivr.patch, Daivr_ReportStats) prints
//   [daivr] nzp-stats <round|end> <round> <kills> <headshots> <total score> <map>
// on every round change and at game over. Anything else is ignored.
const STATS = /\[daivr\] nzp-stats (round|end) (\d{1,3}) (\d{1,6}) (\d{1,6}) (\d{1,9}) ([A-Za-z0-9_-]{1,32})\s*$/;

export function nzpStatsLine(text) {
  const match = STATS.exec(String(text));
  if (!match) return null;
  const [, phase, round, kills, headshots, score, map] = match;
  return { phase, round: Number(round), kills: Number(kills), headshots: Number(headshots), score: Number(score), map };
}
