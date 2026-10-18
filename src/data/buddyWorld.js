import { ALL_CATCHES, FISH_CATALOG, VALLEY_CATALOG, catchById } from "../../shared/buddy-catches.mjs";
export { ALL_CATCHES, FISH_CATALOG, VALLEY_CATALOG, catchById };
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
  return catchById(id);
}

// Los del valle pican mas en su estacion, a sus horas y con su tiempo (como en
// Stardew), y mucho mas mientras no se han pescado nunca: asi el juego del
// valle se completa sin esperar un año a que vuelva el invierno.
const VALLEY_SHARE = { common: 0.55, uncommon: 0.55, rare: 0.6, legendary: 0.7, mythic: 0 };
// Los aparejos del mercado: el cebo magico hace que todo pique como en su
// mejor momento, el señuelo curioso tira de lo que falta en los diarios y la
// nasa, de lo que sale en las nasas (y del mar).
export function valleyWeight(item, { season = "", hour = 12, raining = false, known = null, lure = "" } = {}) {
  let weight = 1;
  const magic = lure === "lure-magic-bait";
  if (magic || item.seasons?.includes(season)) weight *= 3;
  if (item.hours) {
    const [from, to] = item.hours, h = hour < from && to > 24 ? hour + 24 : hour;
    if (magic || (h >= from && h < to)) weight *= 2;
  } else if (magic) weight *= 2;
  if (magic || (item.weather === "rain" ? raining : item.weather === "sun" ? !raining : false)) weight *= 2;
  if (known && !known.has(item.id)) weight *= lure === "lure-curiosity" ? 12 : 4;
  if (lure === "lure-crab-pot" && item.kind === "critter") weight *= 6;
  return weight;
}
function pickWeighted(pool, weightOf, random) {
  const weights = pool.map(weightOf), total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < pool.length; i++) { roll -= weights[i]; if (roll <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

// Con luna llena hay menos chatarra y mas raros (y algun mitico mas).
// `season` (spring/summer/fall/winter), `hour`, `raining` y `known` (ids ya
// pescados) eligen entre los peces del valle; los del diario original salen
// igual que siempre en el resto de tiradas. `rod`: la caña de fibra de
// vidrio trae mas peces del valle; la de iridio, mas raros y legendarios.
export function weightedCatch(lure = "", { fullMoon = false, season = "", hour = new Date().getHours(), raining = false, known = null, random = Math.random, rod = "" } = {}) {
  const roll = random();
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
  if (rod === "rod-iridium") {
    if ((rarity === "common" || rarity === "uncommon") && random() < 0.2) rarity = "rare";
    else if (rarity === "rare" && random() < 0.18) rarity = "legendary";
  }
  const valley = VALLEY_CATALOG.filter((item) => item.rarity === rarity);
  const share = VALLEY_SHARE[rarity] ? Math.min(0.9, VALLEY_SHARE[rarity] + (rod === "rod-fiberglass" ? 0.25 : 0) + (lure === "lure-crab-pot" && rarity !== "legendary" ? 0.1 : 0)) : 0;
  if (valley.length && random() < share) return pickWeighted(valley, (item) => valleyWeight(item, { season, hour, raining, known, lure }), random);
  const pool = FISH_CATALOG.filter((item) => item.rarity === rarity);
  if (lure === "lure-curiosity" && known && pool.length) return pickWeighted(pool, (item) => (known.has(item.id) ? 1 : 6), random);
  return pool[Math.floor(random() * pool.length)] || FISH_CATALOG[0];
}
