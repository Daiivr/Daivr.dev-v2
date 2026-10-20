import { ALL_CATCHES } from "./buddy-catches.mjs";
import { catchPrice, fishermanVisit } from "./buddy-fisherman.mjs";

// La granja del prado: el huerto (semillas y parcelas), lo que se pone en el
// patio (el espantapajaros, la casita de abejas y un arbol frutal), la miel,
// la fruta, la calabaza gigante, el tablon de encargos del mercado y el
// ahumadero de la hoguera. Todo son recibos con fecha que se comprueban en
// orden de tiempo, sin saldo guardado: asi el servidor (server/buddy.mjs, via
// normalizeMarket en buddy-market.mjs) puede rehacer las cuentas y nada se
// puede inventar. Aqui solo hay datos y reglas; buddy-market.mjs los paga.

export const MARKET_TIME_ZONE = "America/New_York";
// Margen para relojes un poco adelantados o atrasados entre equipo y servidor.
export const CLOCK_GRACE_MS = 10 * 60000;
const HOUR = 3600000, DAY = 24 * HOUR;
export const isTime = (value) => typeof value === "string" && value.length <= 32 && Number.isFinite(Date.parse(value));
const count = (value) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(999999, Math.floor(Number(value)))) : 0;
const CATCHES = new Map(ALL_CATCHES.map((item) => [item.id, item]));

// Un numero en [0, 1) fijo para cada texto (FNV-1a).
export function hash01(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// --- Calendario (hora de Nueva York, como el mercado) -------------------------
const dayParts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", timeZone: MARKET_TIME_ZONE });
// "2026-10-19" (el dia en Nueva York de ese momento).
export function farmDay(ms) {
  const parts = dayParts.formatToParts(new Date(ms));
  const part = (name) => parts.find((entry) => entry.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export const isFriday = (ms) => Number.isFinite(ms) && dayParts.formatToParts(new Date(ms)).find((entry) => entry.type === "weekday").value === "Fri";
// La estacion de verdad (hemisferio norte, por meses): para la fruta.
export function seasonAt(ms) {
  const month = new Date(ms).getUTCMonth();
  return month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter";
}

// --- El huerto -------------------------------------------------------------------
// Las semillas se compran cuando sea y van a la bolsa (como mucho SEED_BAG_MAX
// de cada una a la vez); se plantan en una de las GARDEN_PLOTS parcelas libres,
// crecen en 6–24 horas y Pip cosecha lo maduro en la cesta.
export const GARDEN_PLOTS = 3;
export const SEED_BAG_MAX = 5;
export const CROPS = [
  { id: "radish", label: "Radish", price: 4, value: 8, hours: 6, description: "Quick and peppery. Ready in six hours." },
  { id: "carrot", label: "Carrot", price: 6, value: 12, hours: 12, description: "Sweet, crunchy and very orange." },
  { id: "strawberry", label: "Strawberry", price: 8, value: 17, hours: 18, description: "A little bush of red berries." },
  { id: "pumpkin", label: "Pumpkin", price: 12, value: 28, hours: 24, description: "A day of patience for a plump pumpkin. Plant three at once and they might grow into one giant." }
];
const CROP_BY_ID = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));
export const cropById = (id) => CROP_BY_ID[id] || null;
const growMs = (crop) => (cropById(crop)?.hours || 1) * HOUR;
// Cuando se planto, cuando estara lista y cuanto le falta (0..1).
export const plantedAt = (seed) => Date.parse(seed.planted ?? seed.at);
export const ripeAt = (seed) => plantedAt(seed) + growMs(seed.crop);
export const growth = (seed, now = Date.now()) => Math.max(0, Math.min(1, (now - plantedAt(seed)) / growMs(seed.crop)));

// La calabaza gigante: tres calabazas plantadas en las tres parcelas casi a la
// vez (GIANT_WINDOW_MS) pueden fundirse en una gigante al madurar la ultima (un
// sorteo fijo por semillas, GIANT_CHANCE). Hasta entonces no se cosecha
// ninguna; la gigante vale el doble que las tres sueltas.
export const GIANT_CROP = "pumpkin";
export const GIANT_CHANCE = 0.3;
export const GIANT_WINDOW_MS = 15 * 60000;
export const GIANT_MULT = 2;
export function giantGroups(seeds = []) {
  const pumpkins = seeds.filter((seed) => seed.crop === GIANT_CROP && seed.planted && Number.isInteger(seed.plot)).sort((a, b) => plantedAt(a) - plantedAt(b));
  const used = new Set(), groups = [];
  for (let i = 0; i < pumpkins.length; i++) {
    if (used.has(pumpkins[i].id)) continue;
    const group = [pumpkins[i]], t0 = plantedAt(pumpkins[i]);
    for (let j = i + 1; j < pumpkins.length && group.length < GARDEN_PLOTS; j++) {
      const seed = pumpkins[j];
      if (plantedAt(seed) - t0 > GIANT_WINDOW_MS) break;
      if (used.has(seed.id) || group.some((other) => other.plot === seed.plot)) continue;
      group.push(seed);
    }
    if (group.length < GARDEN_PLOTS) continue;
    group.forEach((seed) => used.add(seed.id));
    if (hash01(group.map((seed) => seed.id).sort().join("+")) >= GIANT_CHANCE) continue;
    const ripe = Math.max(...group.map(ripeAt));
    // (si se arranco una antes de tiempo, ya no hay gigante)
    if (group.some((seed) => seed.harvested && Date.parse(seed.harvested) + CLOCK_GRACE_MS < ripe)) continue;
    groups.push({ ids: group.map((seed) => seed.id), plots: group.map((seed) => seed.plot), ripeAt: ripe });
  }
  return groups;
}
export const giantIdsOf = (groups) => new Set(groups.flatMap((group) => group.ids));
export const seedValue = (seed, giantIds) => (cropById(seed.crop)?.value || 0) * (giantIds?.has(seed.id) ? GIANT_MULT : 1);

// --- El patio: espantapajaros, abejas y un arbol frutal ------------------------
// Se compran en el cobertizo del huerto cualquier dia y son para siempre (un
// solo arbol). Se pagan despues de todo lo demas (los recibos viejos no se
// mueven).
export const FRUITS = [
  { id: "cherry", label: "Cherries", season: "spring", value: 9 },
  { id: "peach", label: "Peach", season: "summer", value: 11 },
  { id: "apple", label: "Apple", season: "fall", value: 10 }
];
const FRUIT_BY_ID = Object.fromEntries(FRUITS.map((fruit) => [fruit.id, fruit]));
export const fruitById = (id) => FRUIT_BY_ID[id] || null;
export const YARD_ITEMS = [
  { id: "yard-scarecrow", label: "Scarecrow", kind: "scarecrow", price: 35, description: "A straw-stuffed guard for the garden. Crows keep their distance, and he dresses up for the holidays." },
  { id: "yard-bee-house", label: "Bee house", kind: "bees", price: 80, description: "A little hive by the garden. Every two days the bees fill a jar of wildflower honey, and Buddy collects it for the basket." },
  { id: "sapling-cherry", label: "Cherry sapling", kind: "tree", fruit: "cherry", price: 90, description: "Grows into a cherry tree over two weeks. In spring it blossoms, then bears cherries every day." },
  { id: "sapling-peach", label: "Peach sapling", kind: "tree", fruit: "peach", price: 110, description: "Grows into a peach tree over two weeks, then bears peaches every summer day." },
  { id: "sapling-apple", label: "Apple sapling", kind: "tree", fruit: "apple", price: 100, description: "Grows into an apple tree over two weeks, then bears apples every autumn day." }
];
const YARD_BY_ID = Object.fromEntries(YARD_ITEMS.map((item) => [item.id, item]));
export const yardById = (id) => YARD_BY_ID[id] || null;
// Los recibos del patio ({id: fecha}): validos y de uno en uno; de arboles, solo
// el primero.
export function cleanYard(value, now) {
  const out = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const item of YARD_ITEMS) {
    const at = value[item.id];
    if (!isTime(at) || Date.parse(at) > now + CLOCK_GRACE_MS) continue;
    out.push({ id: item.id, at });
  }
  const trees = out.filter((entry) => yardById(entry.id).kind === "tree").sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return out.filter((entry) => yardById(entry.id).kind !== "tree" || entry === trees[0]);
}
export const yardTree = (yard = {}) => {
  const id = Object.keys(yard).find((key) => yardById(key)?.kind === "tree");
  return id ? { id, fruit: yardById(id).fruit, at: Date.parse(yard[id]) } : null;
};

// El arbol: crece en TREE_GROW_DAYS dias (plantón, arbusto, arbolito, arbol) y
// luego, en la estacion de su fruta, da una al dia hasta FRUIT_MAX colgando.
export const TREE_GROW_DAYS = 14;
export const TREE_STAGE_DAYS = [0, 3, 7, TREE_GROW_DAYS];
export const FRUIT_MAX = 3;
export function treeStage(tree, now = Date.now()) {
  if (!tree) return -1;
  const days = (now - tree.at) / DAY;
  let stage = 0;
  TREE_STAGE_DAYS.forEach((from, index) => { if (days >= from) stage = index; });
  return stage;
}
export const treeMatureAt = (tree) => tree.at + TREE_GROW_DAYS * DAY;
// Cuanto tiempo de la estacion `season` hay entre dos momentos (hasta `cap`).
function seasonMs(season, from, to, cap = Infinity) {
  if (!(to > from)) return 0;
  let total = 0, t = Math.max(from, to - 800 * DAY);
  while (t < to && total < cap) {
    const next = Math.min(to, (Math.floor(t / DAY) + 1) * DAY);
    if (seasonAt(t) === season) total += next - t;
    t = next;
  }
  return total;
}
// Frutas colgando ahora (desde la ultima recogida, o desde que es arbol).
export function fruitReady(tree, lastPick, now = Date.now()) {
  const fruit = fruitById(tree?.fruit);
  if (!fruit) return 0;
  const from = Math.max(treeMatureAt(tree), Number.isFinite(lastPick) ? lastPick : -Infinity);
  return Math.min(FRUIT_MAX, Math.floor(seasonMs(fruit.season, from, now, FRUIT_MAX * DAY) / DAY));
}
// Cuando sale la siguiente (o null si ya hay FRUIT_MAX).
export function nextFruitAt(tree, lastPick, now = Date.now()) {
  const fruit = fruitById(tree?.fruit);
  const have = fruitReady(tree, lastPick, now);
  if (!fruit || have >= FRUIT_MAX) return null;
  const from = Math.max(treeMatureAt(tree), Number.isFinite(lastPick) ? lastPick : -Infinity);
  const need = (have + 1) * DAY;
  let total = seasonMs(fruit.season, from, now), t = Math.max(now, from);
  for (let i = 0; i < 800; i++) {
    const next = (Math.floor(t / DAY) + 1) * DAY;
    if (seasonAt(t) === fruit.season) { if (total + (next - t) >= need) return t + (need - total); total += next - t; }
    t = next;
  }
  return null;
}

// La miel: un tarro cada HONEY.hours desde la ultima recogida (o desde que se
// puso la casita). Cabe uno: hasta que Pip lo recoge no se llena otro.
export const HONEY = { id: "honey", label: "Wildflower honey", value: 22, hours: 48 };
export const honeyReadyAt = (beeAt, lastCollect) => (Number.isFinite(lastCollect) ? lastCollect : beeAt) + HONEY.hours * HOUR;

// --- El ahumadero (tripode sobre la hoguera) ----------------------------------
// Se cuelga un pez (de los pescados que quedan) y en SMOKE_HOURS esta ahumado:
// vale mas (smokedPrice), se vende al pescador, se entrega en el tablon, o Pip
// se lo come una noche de hoguera. Caben SMOKER_HOOKS a la vez.
export const SMOKE_HOURS = 1;
export const SMOKER_HOOKS = 3;
export const smokable = (item) => item?.kind === "fish" && catchPrice(item) > 0;
export const smokedPrice = (item) => (smokable(item) ? catchPrice(item) * 2 + 3 : 0);
export const smokedReadyAt = (entry) => Date.parse(entry.at) + SMOKE_HOURS * HOUR;

// --- El tablon de encargos (Help Wanted) --------------------------------------
// Un encargo al dia (dia de Nueva York), el mismo para todo el mundo salvo lo
// que depende de lo que tengas (miel o fruta solo si tienes abejas o arbol
// desde antes de ese dia). Se paga a 1.5 veces lo que vale, mas 5.
const ORDER_FISH = ALL_CATCHES.filter((item) => item.kind === "fish" && ["common", "uncommon"].includes(item.rarity) && catchPrice(item) > 0);
const orderReward = (unit, n) => Math.round(unit * n * 1.5) + 5;
// `owned`: { bees, fruit } (que tenia ese dia).
export function helpWanted(day, owned = {}) {
  const roll = (key) => hash01(`help:${day}:${key}`);
  const r = roll("kind");
  let kind = r < 0.4 ? "fish" : r < 0.75 ? "crop" : r < 0.85 ? "smoked" : r < 0.925 ? "honey" : "fruit";
  if (kind === "honey" && !owned.bees) kind = "crop";
  if (kind === "fruit" && !owned.fruit) kind = "fish";
  if (kind === "fish") {
    const item = ORDER_FISH[Math.floor(roll("pick") * ORDER_FISH.length)];
    const n = item.rarity === "common" ? 2 + Math.floor(roll("n") * 2) : 1 + Math.floor(roll("n") * 2);
    return { day, kind, id: item.id, label: item.name, n, reward: orderReward(catchPrice(item), n) };
  }
  if (kind === "crop") {
    const crop = CROPS[Math.floor(roll("pick") * CROPS.length)];
    const n = crop.id === "pumpkin" ? 1 + Math.floor(roll("n") * 2) : 1 + Math.floor(roll("n") * 3);
    return { day, kind, id: crop.id, label: crop.label, n, reward: orderReward(crop.value, n) };
  }
  if (kind === "honey") return { day, kind, id: HONEY.id, label: HONEY.label, n: 1, reward: orderReward(HONEY.value, 1) };
  if (kind === "fruit") {
    const fruit = fruitById(owned.fruit), n = 1 + Math.floor(roll("n") * 2);
    return { day, kind, id: fruit.id, label: fruit.label, n, reward: orderReward(fruit.value, n) };
  }
  return { day, kind: "smoked", id: "*", label: "Smoked fish", n: 1, reward: 20 };
}
// Lo que tenias un dia: abejas o arbol comprados antes de ese dia (el arbol,
// ya crecido y en su estacion).
export function ownedOn(day, yard = {}) {
  const before = (id) => isTime(yard[id]) && farmDay(Date.parse(yard[id])) < day;
  const tree = yardTree(yard), noon = Date.parse(`${day}T16:00:00Z`);
  const fruit = tree && before(tree.id) && treeMatureAt(tree) <= noon && seasonAt(noon) === fruitById(tree.fruit)?.season ? tree.fruit : null;
  return { bees: before("yard-bee-house"), fruit };
}

// --- Validar los recibos nuevos -----------------------------------------------
const markTime = (raw, from, now) => isTime(raw) && Date.parse(raw) >= from - CLOCK_GRACE_MS && Date.parse(raw) <= now + CLOCK_GRACE_MS;
// Cada tarro y cada fruta acaba vendido (un viernes) o entregado en el tablon,
// y nunca las dos cosas.
function cleanMarks(raw, entry, from, now) {
  if (markTime(raw.sold, from, now) && isFriday(Date.parse(raw.sold))) entry.sold = raw.sold;
  else if (markTime(raw.given, from, now)) entry.given = raw.given;
  return entry;
}
// Tarros recogidos: uno cada HONEY.hours desde la casita (o desde el anterior).
export function cleanHoney(value, beeAt, now) {
  if (!Number.isFinite(beeAt)) return [];
  const raws = (Array.isArray(value) ? value.slice(0, 2000) : []).filter((raw) => raw && isTime(raw.at) && Date.parse(raw.at) <= now + CLOCK_GRACE_MS).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const out = [];
  let last = null;
  for (const raw of raws) {
    const at = Date.parse(raw.at);
    if (at + CLOCK_GRACE_MS < honeyReadyAt(beeAt, last)) continue;
    last = at;
    out.push(cleanMarks(raw, { at: raw.at }, at, now));
  }
  return out;
}
// Frutas recogidas ({at, i}): de cada recogida, como mucho las que colgaban.
export function cleanFruit(value, tree, now) {
  if (!tree) return [];
  const raws = (Array.isArray(value) ? value.slice(0, 3000) : []).filter((raw) => raw && isTime(raw.at) && Number.isInteger(raw.i) && raw.i >= 0 && raw.i < FRUIT_MAX && Date.parse(raw.at) <= now + CLOCK_GRACE_MS);
  raws.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.i - b.i);
  const out = [];
  let last = null, pickAt = null, room = 0;
  const seen = new Set();
  for (const raw of raws) {
    const at = Date.parse(raw.at), key = raw.at + "#" + raw.i;
    if (seen.has(key)) continue;
    if (at !== pickAt) { room = fruitReady(tree, last, at + CLOCK_GRACE_MS); if (!room) continue; last = at; pickAt = at; }
    if (raw.i >= room) continue;
    seen.add(key);
    out.push(cleanMarks(raw, { at: raw.at, i: raw.i, fruit: tree.fruit }, at, now));
  }
  return out;
}
// Peces ahumados ({id, at}): solo peces, y no mas de SMOKER_HOOKS a la vez en
// el tripode. Cada uno acaba vendido al pescador (con el en el prado),
// comido en la hoguera o entregado, despues de estar listo.
export function cleanSmoked(value, now) {
  const raws = (Array.isArray(value) ? value.slice(0, 2000) : []).filter((raw) => raw && smokable(CATCHES.get(raw.id)) && isTime(raw.at) && Date.parse(raw.at) <= now + CLOCK_GRACE_MS);
  raws.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const out = [], seen = new Set();
  for (const raw of raws) {
    const key = raw.id + "@" + raw.at;
    if (seen.has(key)) continue;
    const at = Date.parse(raw.at);
    if (out.filter((entry) => smokedReadyAt(entry) > at && Date.parse(entry.at) <= at).length >= SMOKER_HOOKS) continue;
    seen.add(key);
    const entry = { id: raw.id, at: raw.at }, ready = smokedReadyAt(entry);
    if (markTime(raw.sold, ready, now) && fishermanVisit(Date.parse(raw.sold), CLOCK_GRACE_MS)) entry.sold = raw.sold;
    else if (markTime(raw.eaten, ready, now)) entry.eaten = raw.eaten;
    else if (markTime(raw.given, ready, now)) entry.given = raw.given;
    out.push(entry);
  }
  return out;
}
// Encargos entregados ({day, at}): uno por dia, entregado ese mismo dia.
export function cleanOrders(value, now) {
  const out = [], days = new Set();
  const raws = (Array.isArray(value) ? value.slice(0, 2000) : []).filter((raw) => raw && isTime(raw.at) && Date.parse(raw.at) <= now + CLOCK_GRACE_MS && typeof raw.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.day));
  raws.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  for (const raw of raws) {
    if (days.has(raw.day) || farmDay(Date.parse(raw.at)) !== raw.day) continue;
    days.add(raw.day);
    out.push({ day: raw.day, at: raw.at });
  }
  return out;
}
// Que encargos se cumplieron de verdad y que peces quedan: los peces se van
// gastando en orden de tiempo (lo vendido al pescador primero, luego lo que se
// cuelga en el ahumadero y lo que piden los encargos); lo demas que pide un
// encargo (cosechas, miel, fruta, ahumados) tiene que llevar su marca `given`
// con la hora del encargo.
export function settleFarm({ fishCollection = {}, sold = {}, smoked = [], orders = [], seeds = [], honey = [], fruit = [], yard = {} }) {
  const left = {};
  for (const [id, n] of Object.entries(fishCollection)) left[id] = Math.max(0, count(n) - (sold[id] || 0));
  const events = [
    ...smoked.map((entry) => ({ at: Date.parse(entry.at), smoked: entry })),
    ...orders.map((order) => ({ at: Date.parse(order.at), order }))
  ].sort((a, b) => a.at - b.at);
  const keptSmoked = [], keptOrders = [];
  for (const event of events) {
    if (event.smoked) {
      if ((left[event.smoked.id] || 0) < 1) continue;
      left[event.smoked.id] -= 1;
      keptSmoked.push(event.smoked);
      continue;
    }
    const order = event.order, request = helpWanted(order.day, ownedOn(order.day, yard));
    const given = (list, test) => list.filter((entry) => entry.given === order.at && test(entry)).length;
    let ok;
    if (request.kind === "fish") ok = (left[request.id] || 0) >= request.n;
    else if (request.kind === "crop") ok = given(seeds, (seed) => seed.crop === request.id && seed.harvested) >= request.n;
    else if (request.kind === "honey") ok = given(honey, () => true) >= request.n;
    else if (request.kind === "fruit") ok = given(fruit, (entry) => entry.fruit === request.id) >= request.n;
    else ok = given(keptSmoked, () => true) >= request.n;
    if (!ok) continue;
    if (request.kind === "fish") left[request.id] -= request.n;
    keptOrders.push({ ...order, reward: request.reward });
  }
  return { smoked: keptSmoked, orders: keptOrders, fishLeft: left };
}
