import { FISH_CATALOG } from "../../shared/buddy-catches.mjs";
export { FISH_CATALOG };
export { KRAKEN } from "../../shared/buddy-encounters.mjs";

export { FIELD_FINDS } from "../../shared/buddy-journal.mjs";

export const AMBIENT_CREATURES = [
  { id: "moth", name: "Phosphor Moth" },
  { id: "bird", name: "Signal Bird" },
  { id: "frog", name: "Rain Frog" },
  { id: "leap-fish", name: "Jumping Bytefish" }
];

export const ENEMY_BUGS = [
  { id: "null-beetle", name: "Null Beetle" },
  { id: "stack-roach", name: "Stack Roach" },
  { id: "memory-mite", name: "Memory Mite" }
];

export const LEVIATHAN = {
  id: "void-leviathan",
  name: "Void Leviathan",
  rarity: "mythic",
  kind: "sighting",
  color: "#ff3d9d",
  lore: "Too large for the journal scanner. Too large for the footer."
};

export function fishById(id) {
  return FISH_CATALOG.find((item) => item.id === id);
}

// Con luna llena hay menos chatarra y mas raros (y algun mitico mas).
export function weightedCatch(lure = "", { fullMoon = false } = {}) {
  const roll = Math.random();
  const moon = fullMoon ? 0.06 : 0;
  let rarity;

  if (roll < 0.3) rarity = "common";
  else if (roll < 0.52) rarity = "uncommon";
  else if (roll < 0.68 - moon) rarity = "junk";
  else if (roll < (lure === "lure" ? 0.9 : 0.87)) rarity = "rare";
  else if (roll < 0.95) rarity = "treasure";
  else if (roll < 0.992 - moon / 6) rarity = "legendary";
  else rarity = "mythic";

  if (rarity === "junk" && lure === "lure-magnet") rarity = "uncommon";
  const pool = FISH_CATALOG.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)] || FISH_CATALOG[0];
}
