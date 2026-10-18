export const CHEST_MIN_COINS = 1;
export const CHEST_MAX_COINS = 10;
// Monedas que se ganan fuera de los cofres: cada pez asado en la hoguera y
// cada deseo a una estrella fugaz.
export const CAMPFIRE_MEAL_COINS = 2;
export const STAR_WISH_COINS = 1;
// Cada cosa de forraje que Pip recoge en el borde del prado (tres al dia).
export const FORAGE_COINS = 1;
export const MARKET_TIME_ZONE = "America/New_York";
export const MARKET_SCHEDULE = "Wednesdays & Saturdays · New York time";
export const MARKET_ITEMS = [
  { id: "market-beanie", label: "Moss knit beanie", category: "wear", price: 50, description: "A ribbed wool hat for chilly fishing nights." },
  { id: "market-vest", label: "Trail vest", category: "wear", price: 75, description: "Waxed canvas, tiny pockets, big adventures." },
  { id: "market-lantern", label: "Firefly lantern", category: "gear", price: 50, description: "A little amber light to carry on patrol." },
  { id: "market-terrarium", label: "Forest in a jar", category: "decor", price: 50, description: "Moss, mushrooms, and a whole tiny world." },
  { id: "market-moon", label: "Moon nightlight", category: "decor", price: 75, description: "A crescent of warm light for your shelf." },
  { id: "market-arcade", label: "Pocket arcade", category: "decor", price: 100, description: "A miniature cabinet. The high score is yours." }
];
// All hosts now take turns; none remain permanently displayed as a special order.
export const MARKET_SPECIALS = [];
// One visiting host per opening alongside the three regular goods.
// Keep them after existing items so old purchase receipts retain their priority.
export const MARKET_ROTATING_HOSTS = [
  { id: "host-komoe", label: "Komoe", category: "host", price: 5000, description: "A new host for the entry gate. Once she's yours, pick her from the HOST switch in the top bar.", availability: "HOST ROTATION" },
  { id: "host-nh02", label: "NH-02", category: "host", price: 5000, description: "A cheerful new face for your gate. Once unlocked, choose her from the HOST switch.", availability: "HOST ROTATION" },
  { id: "host-kiyosa", label: "Kiyosa", category: "host", price: 5000, description: "A warm welcome from Kiyosa. Once unlocked, choose her from the HOST switch.", availability: "HOST ROTATION" }
];
MARKET_ITEMS.push(...MARKET_ROTATING_HOSTS);
// El huerto del prado. Las semillas se compran cuando sea y van a la bolsa
// (como mucho SEED_BAG_MAX de cada una a la vez); se plantan en una de las
// GARDEN_PLOTS parcelas libres, crecen unos dias de verdad (cada "dia" son
// GROW_HOURS horas desde que se plantan) y Pip cosecha lo maduro en la cesta.
// La cesta solo se vende los viernes (hora de Nueva York, como el mercado), y
// se vende por mas de lo que costaron las semillas.
export const GARDEN_PLOTS = 3;
export const GROW_HOURS = 20;
export const SEED_BAG_MAX = 5;
export const CROPS = [
  { id: "radish", label: "Radish", price: 4, value: 8, days: 1, description: "Quick and peppery. Ready tomorrow." },
  { id: "carrot", label: "Carrot", price: 6, value: 12, days: 2, description: "Sweet, crunchy and very orange." },
  { id: "strawberry", label: "Strawberry", price: 8, value: 17, days: 3, description: "A little bush of red berries." },
  { id: "pumpkin", label: "Pumpkin", price: 12, value: 28, days: 4, description: "Slow to grow, worth the wait." }
];
const CROP_BY_ID = Object.fromEntries(CROPS.map((crop) => [crop.id, crop]));
export const cropById = (id) => CROP_BY_ID[id] || null;
// Unas cuantas semillas a la semana como mucho: esto da para años.
const MAX_SEEDS = 1200;
// Margen para relojes un poco adelantados o atrasados entre equipo y servidor.
const CLOCK_GRACE_MS = 10 * 60000;
const growMs = (crop) => (cropById(crop)?.days || 1) * GROW_HOURS * 3600000;
const isTime = (value) => typeof value === "string" && value.length <= 32 && Number.isFinite(Date.parse(value));
// Cuando se planto, cuando estara lista y cuanto le falta (0..1).
export const plantedAt = (seed) => Date.parse(seed.planted ?? seed.at);
export const ripeAt = (seed) => plantedAt(seed) + growMs(seed.crop);
export const growth = (seed, now = Date.now()) => Math.max(0, Math.min(1, (now - plantedAt(seed)) / growMs(seed.crop)));
// En que punto va una semilla: 0 en la bolsa, 1 plantada, 2 en la cesta, 3 vendida.
const seedStage = (seed) => (seed.sold ? 3 : seed.harvested ? 2 : seed.planted ? 1 : 0);

// Cada semilla es un recibo con su vida: comprada (at), plantada (plot y
// planted), cosechada (harvested) y vendida (sold), siempre en ese orden. Lo
// que no cuadra se cae (y con ello lo que venia despues): plantar antes de
// comprar, cosechar antes de madurar, vender fuera de un viernes o en el
// futuro. Luego dos reglas que se comprueban en orden de tiempo: en la bolsa
// caben SEED_BAG_MAX de cada una, y en cada parcela una planta hasta que se
// cosecha (la que choca vuelve a la bolsa).
function cleanSeeds(value, now) {
  const seen = new Set(), out = [];
  for (const raw of Array.isArray(value) ? value : []) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !/^[a-z0-9]{2,24}$/.test(raw.id) || seen.has(raw.id)) continue;
    if (!cropById(raw.crop) || !isTime(raw.at) || Date.parse(raw.at) > now + CLOCK_GRACE_MS) continue;
    seen.add(raw.id);
    const seed = { id: raw.id, crop: raw.crop, at: raw.at };
    const planted = raw.planted ?? (Number.isInteger(raw.plot) ? raw.at : null);
    if (Number.isInteger(raw.plot) && raw.plot >= 0 && raw.plot < GARDEN_PLOTS && isTime(planted) && Date.parse(planted) >= Date.parse(raw.at) && Date.parse(planted) <= now + CLOCK_GRACE_MS) {
      seed.plot = raw.plot; seed.planted = planted;
      if (isTime(raw.harvested) && Date.parse(raw.harvested) + CLOCK_GRACE_MS >= ripeAt(seed) && Date.parse(raw.harvested) <= now + CLOCK_GRACE_MS) {
        seed.harvested = raw.harvested;
        if (isTime(raw.sold) && Date.parse(raw.sold) >= Date.parse(raw.harvested) && Date.parse(raw.sold) <= now + CLOCK_GRACE_MS && cropSaleDay(new Date(raw.sold))) seed.sold = raw.sold;
      }
    }
    out.push(seed);
  }
  out.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  const kept = [];
  for (const seed of out.slice(-MAX_SEEDS)) {
    const t = Date.parse(seed.at);
    if (kept.filter((other) => other.crop === seed.crop && (!other.planted || Date.parse(other.planted) > t)).length >= SEED_BAG_MAX) continue;
    kept.push(seed);
  }
  const busyUntil = Array(GARDEN_PLOTS).fill(-Infinity);
  for (const seed of kept.filter((entry) => entry.planted).sort((x, y) => Date.parse(x.planted) - Date.parse(y.planted))) {
    if (busyUntil[seed.plot] > Date.parse(seed.planted)) { delete seed.plot; delete seed.planted; delete seed.harvested; delete seed.sold; continue; }
    busyUntil[seed.plot] = seed.harvested ? Date.parse(seed.harvested) : Infinity;
  }
  return kept;
}

export const MARKET_GEAR = MARKET_ITEMS.filter((item) => item.category === "wear" || item.category === "gear").map((item) => ({ ...item, source: "Footer market" }));
const count = (value) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(999999, Math.floor(Number(value)))) : 0;
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: MARKET_TIME_ZONE });
const calendarFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: MARKET_TIME_ZONE });
const hourFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: MARKET_TIME_ZONE });
function marketCalendarDay(date) {
  const parts = calendarFormat.formatToParts(date);
  const part = (name) => Number(parts.find((entry) => entry.type === name).value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}
export function marketIsOpen(date = new Date()) {
  return Number.isFinite(date.getTime()) && ["Wed", "Sat"].includes(dayFormat.format(date));
}

// La cesta del huerto se vende los viernes (hora de Nueva York).
export function cropSaleDay(date = new Date()) {
  return Number.isFinite(date.getTime()) && dayFormat.format(date) === "Fri";
}
export function nextCropSale(date = new Date()) {
  const day = marketCalendarDay(date);
  do { day.setUTCDate(day.getUTCDate() + 1); } while (day.getUTCDay() !== 5);
  const noon = new Date(day.getTime() + 12 * 3600000);
  return new Date(day.getTime() + (12 - Number(hourFormat.format(noon))) * 3600000);
}
export function nextMarketOpening(date = new Date()) {
  const day = marketCalendarDay(date);
  do { day.setUTCDate(day.getUTCDate() + 1); } while (![3, 6].includes(day.getUTCDay()));
  // Wednesday/Saturday never contain New York's Sunday DST transition. Using
  // the target day's offset keeps midnight correct across either clock change.
  const noon = new Date(day.getTime() + 12 * 3600000);
  return new Date(day.getTime() + (12 - Number(hourFormat.format(noon))) * 3600000);
}

// Closed days preview the next opening's stock. Calendar math uses a New York
// date rather than elapsed hours, so daylight-saving changes do not shift it.
function marketStockDay(date) {
  const day = marketCalendarDay(date);
  while (![3, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
  return day;
}
export function marketStock(date = new Date()) {
  const day = marketStockDay(date);
  const second = day.getUTCDay() === 6;
  const ids = second ? ["market-vest", "market-moon", "market-arcade"] : ["market-beanie", "market-lantern", "market-terrarium"];
  return MARKET_ITEMS.filter((item) => ids.includes(item.id));
}

export function marketHostStock(date = new Date()) {
  const day = marketStockDay(date);
  // Count openings, not days: Wed -> Sat -> Wed advances exactly one slot.
  // Oct 14: Komoe, Oct 17: NH-02, Oct 21: Kiyosa, then repeat.
  const weeks = Math.floor((day.getTime() - Date.UTC(2026, 9, 14)) / (7 * 86400000));
  const opening = weeks * 2 + (day.getUTCDay() === 6 ? 1 : 0);
  const index = ((opening % MARKET_ROTATING_HOSTS.length) + MARKET_ROTATING_HOSTS.length) % MARKET_ROTATING_HOSTS.length;
  return [MARKET_ROTATING_HOSTS[index]];
}

// Keep paid receipts from before the shared rotation. New purchases always
// use current stock, while old ownership keeps its original eligibility.
const HOST_ROTATION_CUTOVER = Date.parse("2026-10-17T21:58:24Z");
const LEGACY_HOST_DAYS = { "host-komoe": [3, 6], "host-nh02": [6], "host-kiyosa": [3] };
function receiptWasInStock(id, date) {
  if (date.getTime() < HOST_ROTATION_CUTOVER && LEGACY_HOST_DAYS[id]?.includes(marketCalendarDay(date).getUTCDay())) return true;
  return marketCarries(id, date);
}

// La rotacion del dia o un pedido especial.
export function marketCarries(id, date = new Date()) {
  return MARKET_SPECIALS.some((item) => item.id === id) || marketStock(date).some((item) => item.id === id) || marketHostStock(date).some((item) => item.id === id);
}

// Lo ganado en la hoguera y con las estrellas. Nunca se asan mas peces de los
// pescados; los contadores solo suben, igual que los cofres.
export function bonusCoins(adventure = {}) {
  const meals = Math.min(count(adventure.campfireMeals), count(adventure.totalCatches));
  return meals * CAMPFIRE_MEAL_COINS + count(adventure.starWishes) * STAR_WISH_COINS + count(adventure.forageFound) * FORAGE_COINS;
}

// Save a monotonic chest count and dated, unique purchases, never a mutable
// coin balance. Replaying an old save cannot refund coins or reopen a chest.
// `bonus`: monedas de bonusCoins(), que tambien pagan compras.
// Las semillas se pagan despues de las compras de siempre (asi un recibo viejo
// nunca deja de valer), y lo vendido de la cesta entra en el presupuesto desde
// el principio: con lo de un viernes se puede comprar otra cosa. Se repite
// hasta que el resultado no cambia: solo cuentan las ventas de semillas que si
// se pagaron.
export function normalizeMarket(value, fishCollection = {}, bonus = 0, now = Date.now()) {
  const rewards = (Array.isArray(value?.rewards) ? value.rewards : []).slice(0, Math.min(999, count(fishCollection["token-chest"]))).map((reward) => Math.max(CHEST_MIN_COINS, Math.min(CHEST_MAX_COINS, count(reward))));
  const opened = rewards.length;
  const receipts = value?.purchases && typeof value.purchases === "object" ? value.purchases : {};
  const candidates = cleanSeeds(value?.seeds, now);
  let paidSeeds = candidates, result = null;
  for (let pass = 0; pass < 6; pass++) {
    const harvest = paidSeeds.filter((seed) => seed.sold).reduce((sum, seed) => sum + cropById(seed.crop).value, 0);
    const purchases = {};
    let budget = rewards.reduce((sum, reward) => sum + reward, 0) + count(bonus) + harvest;
    for (const item of MARKET_ITEMS) {
      const timestamp = receipts[item.id];
      if (typeof timestamp !== "string" || timestamp.length > 32 || !marketIsOpen(new Date(timestamp)) || !receiptWasInStock(item.id, new Date(timestamp)) || budget < item.price) continue;
      purchases[item.id] = timestamp;
      budget -= item.price;
    }
    const seeds = [];
    for (const seed of candidates) {
      const price = cropById(seed.crop).price;
      if (budget < price) continue;
      seeds.push(seed);
      budget -= price;
    }
    result = { opened, rewards, purchases, seeds };
    if (seeds.length === paidSeeds.length && seeds.every((seed, index) => seed === paidSeeds[index])) break;
    paidSeeds = seeds;
  }
  return result;
}
export function mergeMarket(left, right, fishCollection, bonus = 0) {
  const a = normalizeMarket(left, fishCollection, bonus);
  const b = normalizeMarket(right, fishCollection, bonus);
  const rewards = [...a.rewards, ...b.rewards.slice(a.rewards.length)];
  // Semillas de los dos lados: de cada una, la que va mas avanzada.
  const byId = new Map();
  for (const seed of [...a.seeds, ...b.seeds]) {
    const other = byId.get(seed.id);
    if (!other || seedStage(seed) > seedStage(other)) byId.set(seed.id, seed);
  }
  const seeds = [...byId.values()];
  const purchases = { ...a.purchases };
  // Lo de `a` tambien cuenta: una compra del otro equipo no puede dejar sin
  // pagar (y hacer desaparecer) una semilla de este.
  const garden = a.seeds.reduce((sum, seed) => sum + (seed.sold ? cropById(seed.crop).value : 0) - cropById(seed.crop).price, 0);
  let balance = rewards.reduce((sum, reward) => sum + reward, 0) + count(bonus) + garden - MARKET_ITEMS.filter((item) => Object.hasOwn(purchases, item.id)).reduce((sum, item) => sum + item.price, 0);
  // Preserve confirmed purchases when two devices spend the same balance.
  // Accept only affordable additions; never replace an already-owned piece.
  for (const item of MARKET_ITEMS) {
    if (Object.hasOwn(purchases, item.id) || !Object.hasOwn(b.purchases, item.id) || item.price > balance) continue;
    purchases[item.id] = b.purchases[item.id];
    balance -= item.price;
  }
  return normalizeMarket({ rewards, purchases, seeds }, fishCollection, bonus);
}
export function marketWallet(adventure) {
  const bonus = bonusCoins(adventure);
  const market = normalizeMarket(adventure.market, adventure.fishCollection, bonus);
  const owned = Object.keys(market.purchases);
  const soldCoins = market.seeds.filter((seed) => seed.sold).reduce((sum, seed) => sum + cropById(seed.crop).value, 0);
  const seedSpend = market.seeds.reduce((sum, seed) => sum + cropById(seed.crop).price, 0);
  // Lo plantado ahora (sin cosechar), por parcela; la bolsa (sin plantar) y la
  // cesta (cosechado, sin vender), por cultivo.
  const garden = market.seeds.filter((seed) => seed.planted && !seed.harvested);
  const tally = (pick) => Object.fromEntries(CROPS.map((crop) => [crop.id, market.seeds.filter((seed) => seed.crop === crop.id && pick(seed)).length]));
  const bag = tally((seed) => !seed.planted), basket = tally((seed) => seed.harvested && !seed.sold);
  const harvestedCount = market.seeds.filter((seed) => seed.harvested).length;
  return { ...market, owned, bonus, soldCoins, garden, bag, basket, harvestedCount, coins: market.rewards.reduce((sum, reward) => sum + reward, 0) + bonus + soldCoins - seedSpend - MARKET_ITEMS.filter((item) => owned.includes(item.id)).reduce((sum, item) => sum + item.price, 0), unopened: Math.min(999, count(adventure.fishCollection?.["token-chest"])) - market.opened };
}
const marketRecord = (wallet, changes = {}) => ({ opened: wallet.opened, rewards: wallet.rewards, purchases: wallet.purchases, seeds: wallet.seeds, ...changes });
export function openMarketChest(adventure, random = Math.random) {
  const wallet = marketWallet(adventure);
  if (!wallet.unopened) return { adventure, message: "No unopened chests. Let Buddy fish for more." };
  const reward = Math.min(CHEST_MAX_COINS, Math.max(CHEST_MIN_COINS, Math.floor(random() * CHEST_MAX_COINS) + CHEST_MIN_COINS));
  return { reward, adventure: { ...adventure, market: marketRecord(wallet, { opened: wallet.opened + 1, rewards: [...wallet.rewards, reward] }) }, message: `Chest opened! +${reward} ${reward === 1 ? "coin" : "coins"}.` };
}
export function purchaseMarketItem(adventure, id, date = new Date()) {
  const item = MARKET_ITEMS.find((entry) => entry.id === id);
  const wallet = marketWallet(adventure);
  if (!item) return { adventure, message: "That item is not in stock." };
  if (wallet.owned.includes(id)) return { adventure, message: "You already own this item." };
  if (!marketIsOpen(date)) return { adventure, message: "The stand opens on Wednesdays and Saturdays." };
  if (!marketCarries(id, date)) return { adventure, message: "That item is not in today's stock. Check the next market day." };
  if (wallet.coins < item.price) return { adventure, message: `You need ${item.price - wallet.coins} more coins. Open a chest here in the shop.` };
  return { adventure: { ...adventure, market: marketRecord(wallet, { purchases: { ...wallet.purchases, [id]: date.toISOString() } }) }, message: item.category === "host" ? `${item.label} is yours! Pick her from the HOST switch in the top bar.` : `${item.label} is yours! Find it in ${item.category === "decor" ? "Room → Collection, on either shelf" : "Inventory"}.` };
}

// Que hay en cada parcela ahora. Si dos equipos plantaron a la vez en la misma,
// la segunda semilla se muda a una libre (o espera a que se libere una).
export function gardenPlots(wallet) {
  const plots = Array(GARDEN_PLOTS).fill(null);
  const waiting = [];
  for (const seed of wallet.garden || []) {
    if (!plots[seed.plot]) plots[seed.plot] = seed;
    else waiting.push(seed);
  }
  for (const seed of waiting) {
    const free = plots.indexOf(null);
    if (free >= 0) plots[free] = seed;
  }
  return plots;
}

// Comprar una semilla (cuando sea): a la bolsa, si cabe.
export function purchaseSeed(adventure, cropId, date = new Date()) {
  const crop = cropById(cropId);
  const wallet = marketWallet(adventure);
  if (!crop) return { adventure, message: "That seed isn't sold here." };
  if (wallet.bag[crop.id] >= SEED_BAG_MAX) return { adventure, message: `Your seed bag holds ${SEED_BAG_MAX} ${crop.label.toLowerCase()} seeds at most. Plant some first.` };
  if (wallet.coins < crop.price) return { adventure, message: `You need ${crop.price - wallet.coins} more coins for ${crop.label.toLowerCase()} seeds.` };
  const seed = { id: "s" + date.getTime().toString(36) + (wallet.seeds.length % 36).toString(36), crop: crop.id, at: date.toISOString() };
  return { seed, adventure: { ...adventure, market: marketRecord(wallet, { seeds: [...wallet.seeds, seed] }) }, message: `${crop.label} seeds in the bag (${wallet.bag[crop.id] + 1}/${SEED_BAG_MAX}). Plant them in a free plot.` };
}

// Plantar una de la bolsa en una parcela libre (la primera, si no se dice).
export function plantSeed(adventure, cropId, date = new Date(), plot = null) {
  const crop = cropById(cropId);
  const wallet = marketWallet(adventure);
  if (!crop) return { adventure, message: "That seed isn't sold here." };
  const seed = wallet.seeds.find((entry) => entry.crop === crop.id && !entry.planted);
  if (!seed) return { adventure, message: `No ${crop.label.toLowerCase()} seeds in the bag. Buy some first.` };
  const plots = gardenPlots(wallet), target = plot ?? plots.indexOf(null);
  if (!Number.isInteger(target) || target < 0 || target >= GARDEN_PLOTS || plots[target]) return { adventure, message: "Every plot is growing something. Let Buddy harvest first." };
  const planted = { ...seed, plot: target, planted: date.toISOString() };
  return { seed: planted, adventure: { ...adventure, market: marketRecord(wallet, { seeds: wallet.seeds.map((entry) => (entry.id === seed.id ? planted : entry)) }) }, message: `${crop.label} planted in plot ${target + 1}! Ready in about ${crop.days} ${crop.days === 1 ? "day" : "days"}.` };
}

// Cosechar una planta madura: a la cesta (se vende el viernes).
export function harvestCrop(adventure, seedId, date = new Date()) {
  const wallet = marketWallet(adventure);
  const seed = wallet.garden.find((entry) => entry.id === seedId);
  if (!seed) return { adventure, message: "Nothing to harvest there." };
  if (ripeAt(seed) > date.getTime()) return { adventure, message: "Not ripe yet." };
  const crop = cropById(seed.crop);
  return { value: crop.value, crop, adventure: { ...adventure, market: marketRecord(wallet, { seeds: wallet.seeds.map((entry) => (entry.id === seed.id ? { ...entry, harvested: date.toISOString() } : entry)) }) }, message: `Harvested a ${crop.label.toLowerCase()}! It's in the basket for Friday's market.` };
}

// Vender la cesta (toda, o solo un cultivo): solo los viernes.
export function sellCrops(adventure, cropId = null, date = new Date()) {
  const wallet = marketWallet(adventure);
  if (!cropSaleDay(date)) return { adventure, message: "Crops sell at the Friday market. Keep them in the basket until then." };
  const selling = wallet.seeds.filter((seed) => seed.harvested && !seed.sold && (!cropId || seed.crop === cropId));
  if (!selling.length) return { adventure, message: "Nothing in the basket to sell." };
  const at = date.toISOString(), ids = new Set(selling.map((seed) => seed.id));
  const total = selling.reduce((sum, seed) => sum + cropById(seed.crop).value, 0);
  return { value: total, adventure: { ...adventure, market: marketRecord(wallet, { seeds: wallet.seeds.map((entry) => (ids.has(entry.id) ? { ...entry, sold: at } : entry)) }) }, message: `Sold ${selling.length} ${selling.length === 1 ? "crop" : "crops"} for ${total} gold!` };
}
