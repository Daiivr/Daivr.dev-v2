export const KRAKEN = { id: "abyss-kraken", name: "Abyss Kraken", kind: "sighting", rarity: "mythic", color: "#bd9cec" };

// Separate windows ensure a fishing session can produce only one sighting.
export function rareFishingEncounter(random = Math.random) {
  const roll = random();
  return roll < .025 ? "leviathan" : roll < .05 ? "kraken" : "";
}

export function encounterPlacement(stageWidth, buddyX) {
  const width = Math.max(0, stageWidth);
  const artWidth = Math.min(680, width * (width <= 760 ? .94 : .65));
  const left = buddyX + 36 < width / 2 ? Math.max(0, width - artWidth - 8) : Math.min(8, width - artWidth);
  return { left, width: artWidth, facesLeft: buddyX + 36 < left + artWidth / 2 };
}
