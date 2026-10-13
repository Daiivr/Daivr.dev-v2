import { FISH_CATALOG } from "../shared/buddy-catches.mjs";
import { dailyXp, playerProgression } from "../shared/player-progression.mjs";

// These definitions stay server-side: locked secrets never enter a response.
const SECRET_BADGES = [
  { id: "kraken-witness", label: "Eight arms below", tier: "gold", xp: 600, description: "Met the Abyss Kraken while fishing with Buddy.", icon: "sighting", test: (a) => a.krakenSightings > 0 },
  { id: "first-boot", label: "Hello, world", tier: "bronze", xp: 75, description: "Booted Dai.exe for the first time.", icon: "boot", test: (a) => a.daiBooted },
  { id: "fish-archivist", label: "Deep-sea archivist", tier: "diamond", xp: 2000, description: "Caught every fish species in the Buddy journal.", icon: "fish", test: (a) => FISH_CATALOG.filter((fish) => fish.kind === "fish").every((fish) => a.fishCollection?.[fish.id] > 0) },
  { id: "digital-diva", label: "Digital diva", tier: "platinum", xp: 1500, description: "Unlocked Buddy's Miku outfit by completing the catch journal.", icon: "music", test: (a) => FISH_CATALOG.every((item) => a.fishCollection?.[item.id] > 0) },
  { id: "abyss-witness", label: "Abyss witness", tier: "gold", xp: 500, description: "Witnessed the Void Leviathan at the surface.", icon: "sighting", test: (a) => a.leviathanSightings > 0 },
  { id: "abyss-familiar", label: "A familiar shadow", tier: "gold", target: 3, xp: 750, description: "Shared 3 sightings of the Void Leviathan with Buddy.", icon: "sighting", test: (a) => a.leviathanSightings >= 3 },
  { id: "abyss-keeper", label: "Keeper of the deep", tier: "platinum", target: 10, xp: 1400, description: "Witnessed the Void Leviathan 10 times. The deep remembers you.", icon: "sighting", test: (a) => a.leviathanSightings >= 10 },
  { id: "abyss-kindred", label: "Kindred of the abyss", tier: "diamond", target: 25, xp: 2500, description: "Shared 25 encounters with the Void Leviathan.", icon: "sighting", test: (a) => a.leviathanSightings >= 25 },
  { id: "night-owl", label: "Night owl", tier: "silver", xp: 150, description: "Woke Buddy during the late shift.", icon: "night", test: (a) => a.midnightWakeups > 0 },
  { id: "bug-hunter", label: "Bug exterminator", tier: "gold", xp: 400, description: "Helped Buddy defeat 25 bugs.", icon: "bug", test: (a) => a.bugsDefeated >= 25 }
];

export function secretBadges(adventure = {}) {
  return SECRET_BADGES.filter((badge) => badge.test(adventure)).map(({ test, ...badge }) => ({ ...badge, secret: true, earned: true }));
}

// PokéSurvivor (cartucho 06), tambien secretas. `dex`, `shinies` y `legends`
// son los que tiene la partida guardada; `bestTime`, los segundos de la mejor
// partida sola o en grupo (las dos validadas con ficha de partida).
// server/pokesurvivor.mjs passportStats.
export const POKESURVIVOR_DEX_SIZE = 966;
const DEX_MEDALS = [[10, "Pokédex rookie", "bronze", 150], [30, "Field researcher", "silver", 400], [50, "Halfway there", "gold", 800], [75, "Pokémon professor", "platinum", 1500], [100, "Gotta catch 'em all", "diamond", 3000]];
const SURVIVAL_MEDALS = [[5, "Still standing", "bronze", 100], [10, "Ten-minute trainer", "silver", 300], [15, "Horde breaker", "gold", 600], [20, "Unbreakable", "platinum", 1200], [30, "Last one standing", "diamond", 2500]];
const POKESURVIVOR_BADGES = [
  ...DEX_MEDALS.map(([percent, label, tier, xp]) => {
    const caught = Math.ceil(POKESURVIVOR_DEX_SIZE * percent / 100);
    return { id: `pokesurvivor-dex-${percent}`, label, tier, xp, target: `${percent}%`, icon: "dex", description: `Registered ${percent}% of PokéSurvivor's Pokédex: ${caught} of ${POKESURVIVOR_DEX_SIZE} Pokémon.`, test: (p) => p.dex >= caught };
  }),
  ...SURVIVAL_MEDALS.map(([minutes, label, tier, xp]) => ({ id: `pokesurvivor-survive-${minutes}`, label, tier, xp, target: `${minutes}m`, icon: "survive", description: `Survived ${minutes} minutes in one PokéSurvivor run, solo or with a squad.`, test: (p) => p.bestTime >= minutes * 60 })),
  { id: "pokesurvivor-shiny", label: "Something sparkly", tier: "gold", xp: 500, icon: "shiny", description: "Caught a shiny Pokémon in PokéSurvivor.", test: (p) => p.shinies > 0 },
  { id: "pokesurvivor-legend", label: "Rift breaker", tier: "gold", xp: 600, icon: "legend", description: "Defeated a legendary Pokémon in a PokéSurvivor rift.", test: (p) => p.legends > 0 },
  { id: "pokesurvivor-squad", label: "Squad up", tier: "silver", xp: 250, icon: "squad", description: "Put a co-op team on PokéSurvivor's squad board.", test: (p) => p.squadRuns > 0 }
];

export function pokesurvivorBadges(stats = {}) {
  const p = { dex: 0, shinies: 0, legends: 0, bestTime: 0, squadRuns: 0, ...stats };
  return POKESURVIVOR_BADGES.filter((badge) => badge.test(p)).map(({ test, ...badge }) => ({ ...badge, secret: true, earned: true }));
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
