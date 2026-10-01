import { FISH_CATALOG } from "../../shared/buddy-catches.mjs";
export { FISH_CATALOG };

export const FIELD_FINDS = [
  { id: "arcade-coin", name: "Arcade Coin", color: "#ffd166", line: "a credit! shiny." },
  { id: "floppy-disk", name: "Floppy Disk", color: "#45d8ff", line: "ancient save technology." },
  { id: "battery", name: "Tiny Battery", color: "#3fff97", line: "portable zap acquired." },
  { id: "lost-bug", name: "Friendly Bug", color: "#ff3d9d", line: "this bug has a permit." },
  { id: "mini-cartridge", name: "Mini Cartridge", color: "#a78bfa", line: "bonus level located!" }
];

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

export function weightedCatch(lure = "") {
  const roll = Math.random();
  let rarity;

  if (roll < 0.3) rarity = "common";
  else if (roll < 0.52) rarity = "uncommon";
  else if (roll < 0.68) rarity = "junk";
  else if (roll < (lure === "lure" ? 0.9 : 0.87)) rarity = "rare";
  else if (roll < 0.95) rarity = "treasure";
  else if (roll < 0.992) rarity = "legendary";
  else rarity = "mythic";

  if (rarity === "junk" && lure === "lure-magnet") rarity = "uncommon";
  const pool = FISH_CATALOG.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)] || FISH_CATALOG[0];
}
