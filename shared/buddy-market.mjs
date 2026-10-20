import { ALL_CATCHES } from "./buddy-catches.mjs";
import { catchPrice, fishermanVisit } from "./buddy-fisherman.mjs";
import {
  CLOCK_GRACE_MS, CROPS, FRUITS, GARDEN_PLOTS, HONEY, MARKET_TIME_ZONE, SEED_BAG_MAX, SMOKER_HOOKS,
  cleanFruit, cleanHoney, cleanOrders, cleanSmoked, cleanYard, cropById, farmDay, fruitById, fruitReady, giantGroups, giantIdsOf,
  helpWanted, honeyReadyAt, isTime, nextFruitAt, ownedOn, ripeAt, seedValue, settleFarm, smokable, smokedPrice, smokedReadyAt,
  treeStage, yardById, yardTree
} from "./buddy-farm.mjs";
// (el huerto y la granja viven en buddy-farm.mjs; se exportan tambien desde aqui)
export {
  CROPS, FRUITS, FRUIT_MAX, GARDEN_PLOTS, GIANT_CHANCE, HONEY, MARKET_TIME_ZONE, SEED_BAG_MAX, SMOKE_HOURS, SMOKER_HOOKS, TREE_GROW_DAYS, YARD_ITEMS,
  cropById, farmDay, fruitById, giantGroups, growth, helpWanted, plantedAt, ripeAt, smokable, smokedPrice, smokedReadyAt, treeStage, yardById, yardTree
} from "./buddy-farm.mjs";

export const CHEST_MIN_COINS = 1;
export const CHEST_MAX_COINS = 10;
// El cofre gigante: si Buddy saluda al Leviatan o al Kraken, a veces
// (GIANT_CHEST_CHANCE) le dejan uno. Va en fishCollection como cualquier
// hallazgo y se abre en el mercado por mas oro.
export const GIANT_CHEST_ID = "giant-token-chest";
export const GIANT_CHEST_MIN_COINS = 20;
export const GIANT_CHEST_MAX_COINS = 50;
export const GIANT_CHEST_CHANCE = 0.15;
const giantRewardsOf = (value, fishCollection) => (Array.isArray(value) ? value : []).slice(0, Math.min(99, count(fishCollection?.[GIANT_CHEST_ID]))).map((reward) => Math.max(GIANT_CHEST_MIN_COINS, Math.min(GIANT_CHEST_MAX_COINS, count(reward))));
const sumOf = (list) => list.reduce((total, reward) => total + reward, 0);
// Monedas que se ganan fuera de los cofres: cada pez asado en la hoguera y
// cada deseo a una estrella fugaz.
export const CAMPFIRE_MEAL_COINS = 2;
export const STAR_WISH_COINS = 1;
// Cada cosa de forraje que Pip recoge en el borde del prado (tres al dia).
export const FORAGE_COINS = 1;
// En una noche de lluvia de estrellas cada deseo da monedas de mas (contador
// `showerWishes` del adventure: cada unidad, una moneda).
export const SHOWER_WISH_COINS = 1;
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
// Los aparejos para los peces del valle: los vende el pescador ambulante
// cuando pasa por el footer (shared/buddy-fisherman.mjs), no el puesto. (Van
// despues de los anfitriones, como todo lo nuevo, para que los recibos viejos
// conserven su prioridad de pago.)
// Las cañas se compran una vez y son para siempre.
export const MARKET_RODS = [
  { id: "rod-fiberglass", label: "Fiberglass rod", category: "tackle", slot: "rod", price: 120, perk: "more of your bites are valley fish", description: "Light and springy, made for valley water. More of Buddy's bites come from the valley." },
  { id: "rod-iridium", label: "Iridium rod", category: "tackle", slot: "rod", price: 260, perk: "rare and legendary fish bite more", description: "A shimmering purple rod for the big ones. Rare and legendary fish bite more often." }
];
// Los señuelos se gastan, todos: cada compra es un señuelo y un uso, y se
// gasta al sacar una captura del agua (si se escapa, no). Sin señuelo tambien
// se pesca, pero los raros pican mucho menos; cuanto mejor el señuelo (`tier`),
// mas raros. Los basicos los vende el puesto del bosque (`stock` por dia de
// mercado); los buenos y los mejores, el pescador (`stock` por viaje: si se
// los compras todos, se va a reponer y vuelve a los RESTOCK_MS con todo nuevo).
export const LURES = [
  { id: "lure-crab-pot", label: "Crab pot", tier: "basic", seller: "market", price: 4, stock: 10, perk: "crab-pot catches turn up far more", description: "A little slatted trap that sinks beside the line. Lobsters, crabs, shells and other sea critters turn up far more often." },
  { id: "lure-magnet", label: "Magnet lure", tier: "basic", seller: "market", price: 4, stock: 10, perk: "junk upgrades to uncommon", description: "A pink horseshoe magnet. Whatever was going to be junk comes up as a proper fish instead." },
  { id: "lure-swift", label: "Swift lure", tier: "basic", seller: "market", price: 5, stock: 10, perk: "bites come way faster", description: "A flashy cyan spinner. Fish bite much sooner, and Buddy heads out to fish again sooner too." },
  { id: "lure-anchor", label: "Anchor lure", tier: "good", seller: "fisherman", price: 9, stock: 6, perk: "rares almost never escape", description: "A heavy little anchor jig. Rare fish stay on the line instead of slipping away, and rares bite a bit more." },
  { id: "lure-magic-bait", label: "Magic bait", tier: "good", seller: "fisherman", price: 10, stock: 6, perk: "any season, any hour, any weather", description: "A glowing ball of bait. Every valley fish bites as if it were its season, its hour and its weather, and rares bite a bit more." },
  { id: "lure", label: "Lucky lure", tier: "best", seller: "fisherman", price: 16, stock: 3, perk: "rare fish bite much more", description: "A golden spoon with a blue gem. Rare and legendary fish bite much more often, and fewer of them escape." },
  { id: "lure-curiosity", label: "Curiosity lure", tier: "best", seller: "fisherman", price: 18, stock: 3, perk: "fish you haven't caught bite much more", description: "A shiny little fish that shy species can't resist. Missing fish bite much more often, and rares bite much more." }
].map((lure) => ({ ...lure, category: "lure", slot: "lure" }));
// Los que antes se ganaban pescando traen unos usos gratis al ganarlos.
export const LURE_GRANTS = [
  { id: "lure-swift", uses: 5, label: "10 catches", when: (adventure) => count(adventure?.totalCatches) >= 10 },
  { id: "lure-anchor", uses: 5, label: "20 catches", when: (adventure) => count(adventure?.totalCatches) >= 20 },
  { id: "lure-magnet", uses: 5, label: "6 rare catches", when: (adventure) => count(adventure?.rareCatches) >= 6 },
  { id: "lure", uses: 5, label: "quest reward", when: (adventure) => Array.isArray(adventure?.inventory) && adventure.inventory.includes("lure") }
];
const MAX_GRANT = Math.max(...LURE_GRANTS.map((grant) => grant.uses));
export const lureGrants = (adventure) => Object.fromEntries(LURE_GRANTS.filter((grant) => grant.when(adventure)).map((grant) => [grant.id, grant.uses]));
export const RESTOCK_MS = 40 * 60000;
// Lo que el pescador compra al dia (capturas, en total).
export const FISH_SELL_DAILY = 20;
// (todo lo que vende el pescador, para su tienda)
export const MARKET_TACKLE = [...MARKET_RODS, ...LURES.filter((lure) => lure.seller === "fisherman")];
// Lo nuevo del puesto: se turna con lo de siempre (STALL_ROTATION).
export const MARKET_GOODS = [
  { id: "market-straw-hat", label: "Straw sun hat", category: "wear", price: 60, description: "Woven straw with a red ribbon and a daisy. Shade for long days by the water." },
  { id: "market-overalls", label: "Denim overalls", category: "wear", price: 90, description: "Sturdy blue denim with brass buttons and a bib pocket for bait." },
  { id: "market-specs", label: "Round specs", category: "wear", price: 45, description: "Little round wire glasses, for reading the catch journal up close." },
  { id: "market-leaf-umbrella", label: "Leaf umbrella", category: "gear", price: 70, description: "One very big leaf. When it rains, Buddy holds it up instead of his striped umbrella." },
  { id: "market-trophy-fish", label: "Trophy bass", category: "decor", price: 80, description: "A prize largemouth bass, mounted on a carved wooden plaque." },
  { id: "market-ship-bottle", label: "Ship in a bottle", category: "decor", price: 70, description: "A tiny ship on a tiny sea. Nobody knows how it got in there." },
  { id: "market-bonsai", label: "Pocket bonsai", category: "decor", price: 60, description: "A twisted little tree in a blue glazed pot. Very patient." },
  { id: "market-lava-lamp", label: "Lava lamp", category: "decor", price: 90, description: "Warm wax blobs drift up and down all night, glowing on the shelf." },
  { id: "market-frog-hat", label: "Frog rain hat", category: "wear", price: 65, description: "A green rain hat with two googly frog eyes on top. Ribbit." },
  { id: "market-hoodie", label: "Cozy hoodie", category: "wear", price: 85, description: "Soft mustard fleece with a hood, drawstrings and a pocket for snacks." },
  { id: "market-sprout", label: "Antenna sprout", category: "wear", price: 40, description: "A tiny two-leaf seedling that grows right out of Buddy's antenna bulb." },
  { id: "market-mushroom-lamp", label: "Mushroom lamp", category: "decor", price: 75, description: "A red-capped toadstool with a little lit window. Glows warm at night." },
  { id: "market-snow-globe", label: "Snow globe", category: "decor", price: 65, description: "A cabin and a pine in a glass dome. Give it a shake." },
  { id: "market-radio", label: "Cassette radio", category: "decor", price: 95, description: "A teal boombox with a mixtape inside and a dial that glows." },
  // (lo de pescar del puesto)
  { id: "market-raincoat", label: "Yellow rain slicker", category: "wear", price: 80, description: "A shiny yellow slicker with a hood. The rain just rolls right off." },
  { id: "market-bucket-hat", label: "Angler's bucket hat", category: "wear", price: 55, description: "Khaki canvas with a little fly lure hooked into the band." },
  { id: "market-tackle-box", label: "Tackle box", category: "decor", price: 70, description: "A red tackle box with its trays open: lures, hooks and floats in every slot." },
  { id: "market-lighthouse", label: "Pocket lighthouse", category: "decor", price: 100, description: "A striped little lighthouse. Its lamp sweeps across the shelf all night." }
];
MARKET_ITEMS.push(...MARKET_RODS, ...MARKET_GOODS);
// El puesto saca STALL_SIZE piezas por apertura, por turnos, en un orden que
// alterna lo de vestir con lo del cuarto.
export const STALL_SIZE = 3;
const TACKLE_IDS = new Set(MARKET_RODS.map((item) => item.id));
const PACKS = new Map(LURES.map((lure) => [lure.id, lure]));
const FISHER_LURES = LURES.filter((lure) => lure.seller === "fisherman");
const soldOut = (sold) => FISHER_LURES.every((lure) => (sold[lure.id] || 0) >= lure.stock);
const marketDayKey = (at) => marketCalendarDay(new Date(at)).toISOString().slice(0, 10);
// El dia de una venta (UTC, como las visitas del pescador).
export const saleDay = (date = new Date()) => new Date(date).toISOString().slice(0, 10);
const CATCHES = new Map(ALL_CATCHES.map((item) => [item.id, item]));
const FRUITS_IDS = FRUITS.map((fruit) => fruit.id);
export const STALL_ROTATION = ["market-beanie", "market-terrarium", "market-straw-hat", "market-trophy-fish", "market-lantern", "market-moon", "market-overalls", "market-ship-bottle", "market-specs", "market-arcade", "market-vest", "market-bonsai", "market-leaf-umbrella", "market-lava-lamp", "market-frog-hat", "market-mushroom-lamp", "market-hoodie", "market-snow-globe", "market-sprout", "market-radio", "market-bucket-hat", "market-tackle-box", "market-raincoat", "market-lighthouse"];
// Antes cada dia tenia sus tres de siempre: los recibos de entonces valen.
const LEGACY_STALL = { 3: ["market-beanie", "market-lantern", "market-terrarium"], 6: ["market-vest", "market-moon", "market-arcade"] };
// El huerto del prado (CROPS, parcelas, crecimiento: buddy-farm.mjs). La cesta
// solo se vende los viernes (hora de Nueva York, como el mercado), y se vende
// por mas de lo que costaron las semillas.
// Unas cuantas semillas a la semana como mucho: esto da para años.
const MAX_SEEDS = 1200;
// En que punto va una semilla: 0 en la bolsa, 1 plantada, 2 en la cesta, 3 vendida o entregada.
const seedStage = (seed) => (seed.sold || seed.given ? 3 : seed.harvested ? 2 : seed.planted ? 1 : 0);

// Cada semilla es un recibo con su vida: comprada (at), plantada (plot y
// planted), cosechada (harvested) y vendida (sold) o entregada en el tablon
// (given), siempre en ese orden. Lo que no cuadra se cae (y con ello lo que
// venia despues): plantar antes de comprar, cosechar antes de madurar, vender
// fuera de un viernes o en el futuro. Luego dos reglas que se comprueban en
// orden de tiempo: en la bolsa caben SEED_BAG_MAX de cada una, y en cada
// parcela una planta hasta que se cosecha (la que choca vuelve a la bolsa).
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
        else if (isTime(raw.given) && Date.parse(raw.given) >= Date.parse(raw.harvested) && Date.parse(raw.given) <= now + CLOCK_GRACE_MS) seed.given = raw.given;
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
    if (busyUntil[seed.plot] > Date.parse(seed.planted)) { delete seed.plot; delete seed.planted; delete seed.harvested; delete seed.sold; delete seed.given; continue; }
    busyUntil[seed.plot] = seed.harvested ? Date.parse(seed.harvested) : Infinity;
  }
  return kept;
}

export const MARKET_GEAR = MARKET_ITEMS.filter((item) => item.category === "wear" || item.category === "gear" || item.category === "tackle").map((item) => ({ ...item, source: item.category === "tackle" ? "Sold by the traveling fisherman" : "Footer market" }));
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
// Count openings, not days: Wed -> Sat -> Wed advances exactly one slot.
function openingIndex(day) {
  const weeks = Math.floor((day.getTime() - Date.UTC(2026, 9, 14)) / (7 * 86400000));
  return weeks * 2 + (day.getUTCDay() === 6 ? 1 : 0);
}
const wrap = (index, length) => ((index % length) + length) % length;
export function marketStock(date = new Date()) {
  const opening = openingIndex(marketStockDay(date));
  return Array.from({ length: STALL_SIZE }, (_, slot) => STALL_ROTATION[wrap(opening * STALL_SIZE + slot, STALL_ROTATION.length)])
    .map((id) => MARKET_ITEMS.find((item) => item.id === id));
}

export function marketHostStock(date = new Date()) {
  // Oct 14: Komoe, Oct 17: NH-02, Oct 21: Kiyosa, then repeat.
  return [MARKET_ROTATING_HOSTS[wrap(openingIndex(marketStockDay(date)), MARKET_ROTATING_HOSTS.length)]];
}

// Keep paid receipts from before the shared rotation. New purchases always
// use current stock, while old ownership keeps its original eligibility.
const HOST_ROTATION_CUTOVER = Date.parse("2026-10-17T21:58:24Z");
const LEGACY_HOST_DAYS = { "host-komoe": [3, 6], "host-nh02": [6], "host-kiyosa": [3] };
function receiptWasInStock(id, date) {
  if (date.getTime() < HOST_ROTATION_CUTOVER && LEGACY_HOST_DAYS[id]?.includes(marketCalendarDay(date).getUTCDay())) return true;
  if (LEGACY_STALL[marketCalendarDay(date).getUTCDay()]?.includes(id)) return true;
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
  // (lo de mas de las lluvias de estrellas nunca pasa de cuatro por deseo)
  const shower = Math.min(count(adventure.showerWishes), count(adventure.starWishes) * 4);
  return meals * CAMPFIRE_MEAL_COINS + count(adventure.starWishes) * STAR_WISH_COINS + shower * SHOWER_WISH_COINS + count(adventure.forageFound) * FORAGE_COINS;
}

// Save a monotonic chest count and dated, unique purchases, never a mutable
// coin balance. Replaying an old save cannot refund coins or reopen a chest.
// `bonus`: monedas de bonusCoins(), que tambien pagan compras.
// Las semillas se pagan despues de las compras de siempre (asi un recibo viejo
// nunca deja de valer), y lo vendido de la cesta entra en el presupuesto desde
// el principio: con lo de un viernes se puede comprar otra cosa. Se repite
// hasta que el resultado no cambia: solo cuentan las ventas de semillas que si
// se pagaron.
// Lo vendido al pescador: cuantas de cada captura (nunca mas de las pescadas;
// el diario no cambia: una captura vendida sigue descubierta).
function cleanSold(value, fishCollection = {}) {
  const sold = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return sold;
  for (const [id, raw] of Object.entries(value)) {
    if (!CATCHES.has(id) || !catchPrice(CATCHES.get(id))) continue;
    const amount = Math.min(count(raw), count(fishCollection[id]));
    if (amount) sold[id] = amount;
  }
  return sold;
}
const saleCoins = (sold) => Object.entries(sold).reduce((sum, [id, amount]) => sum + amount * catchPrice(CATCHES.get(id)), 0);
// Lo vendido cada dia (para el tope diario): solo la ultima semana.
function cleanSoldDays(value, now) {
  const out = {}, oldest = saleDay(new Date(now - 7 * 86400000)), newest = saleDay(new Date(now + CLOCK_GRACE_MS));
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [day, raw] of Object.entries(value)) if (/^\d{4}-\d{2}-\d{2}$/.test(day) && day >= oldest && day <= newest && count(raw)) out[day] = Math.min(FISH_SELL_DAILY, count(raw));
  return out;
}
// Los señuelos comprados ({id, at}: uno cada uno), en orden de compra.
function cleanLureBuys(value, now) {
  const seen = new Set(), out = [];
  for (const raw of Array.isArray(value) ? value.slice(0, 2000) : []) {
    if (!raw || !PACKS.has(raw.id) || !isTime(raw.at) || Date.parse(raw.at) > now + CLOCK_GRACE_MS) continue;
    const key = raw.id + "@" + raw.at;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: raw.id, at: raw.at });
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
// Se pagan si se compraron cuando tocaba y quedaban: los del puesto, un dia de
// mercado y sin pasar de su `stock` de ese dia; los del pescador, en su visita
// (no mientras reponia) y sin pasar de lo que llevaba en el carro. Y si llegaba
// el dinero.
function payLures(candidates, budget) {
  const trips = new Map(), days = new Map(), lures = [];
  for (const buy of candidates) {
    const at = Date.parse(buy.at), lure = PACKS.get(buy.id);
    if (budget < lure.price) continue;
    if (lure.seller === "market") {
      if (!marketIsOpen(new Date(at))) continue;
      const key = marketDayKey(at) + buy.id, n = days.get(key) || 0;
      if (n >= lure.stock) continue;
      days.set(key, n + 1);
    } else {
      const visit = fishermanVisit(at, CLOCK_GRACE_MS);
      if (!visit) continue;
      const trip = trips.get(visit.from) || { from: -Infinity, sold: {} };
      if (at < trip.from || (trip.sold[buy.id] || 0) >= lure.stock) continue;
      trip.sold[buy.id] = (trip.sold[buy.id] || 0) + 1;
      trips.set(visit.from, soldOut(trip.sold) ? { from: at + RESTOCK_MS, sold: {} } : trip);
    }
    budget -= lure.price;
    lures.push(buy);
  }
  return { lures, budget };
}
// Lo que le queda al puesto de cada señuelo basico ese dia de mercado.
export function marketBaitStock(wallet, date = new Date()) {
  const key = marketDayKey(marketIsOpen(date) ? +date : +nextMarketOpening(date));
  const sold = {};
  for (const buy of wallet?.lures || []) if (PACKS.get(buy.id)?.seller === "market" && marketDayKey(Date.parse(buy.at)) === key) sold[buy.id] = (sold[buy.id] || 0) + 1;
  return Object.fromEntries(LURES.filter((lure) => lure.seller === "market").map((lure) => [lure.id, Math.max(0, lure.stock - (sold[lure.id] || 0))]));
}
const lureSpend = (lures) => lures.reduce((sum, buy) => sum + PACKS.get(buy.id).price, 0);
// Los ratos en que el pescador se fue a reponer: desde que se vende el ultimo
// paquete hasta que vuelve (o hasta el final de su visita, si ya no vuelve).
export function fishermanGaps(lures = []) {
  const gaps = [], trips = new Map();
  for (const buy of lures) {
    if (PACKS.get(buy.id)?.seller !== "fisherman") continue;
    const at = Date.parse(buy.at), visit = fishermanVisit(at, CLOCK_GRACE_MS);
    if (!visit) continue;
    const trip = trips.get(visit.from) || { from: -Infinity, sold: {} };
    if (at < trip.from) continue;
    trip.sold[buy.id] = (trip.sold[buy.id] || 0) + 1;
    if (soldOut(trip.sold)) {
      const back = at + RESTOCK_MS;
      gaps.push({ from: at, to: Math.min(back, visit.to), returns: back < visit.to });
      trips.set(visit.from, { from: back, sold: {} });
    } else trips.set(visit.from, trip);
  }
  return gaps;
}
// El pescador ahora mismo para este jugador: su visita, si esta (o se fue a
// reponer), y lo que le queda en el carro de cada señuelo.
export function fishermanTrip(wallet, date = new Date()) {
  const t = +date, visit = fishermanVisit(t);
  if (!visit) return { visit: null, here: false, gap: null, stock: {} };
  const gaps = fishermanGaps(wallet?.lures || []).filter((gap) => gap.from >= visit.from - CLOCK_GRACE_MS && gap.from < visit.to + CLOCK_GRACE_MS);
  const gap = gaps.find((entry) => t >= entry.from && t < entry.to) || null;
  const tripFrom = Math.max(visit.from - CLOCK_GRACE_MS, ...gaps.filter((entry) => entry.returns && entry.to <= t).map((entry) => entry.to));
  const sold = {};
  for (const buy of wallet?.lures || []) {
    const at = Date.parse(buy.at);
    if (PACKS.get(buy.id)?.seller === "fisherman" && at >= tripFrom && at <= t && fishermanVisit(at, CLOCK_GRACE_MS)?.from === visit.from) sold[buy.id] = (sold[buy.id] || 0) + 1;
  }
  return { visit, here: !gap, gap, stock: Object.fromEntries(FISHER_LURES.map((lure) => [lure.id, Math.max(0, lure.stock - (sold[lure.id] || 0))])) };
}
// Un recibo vale si se compro cuando tocaba: lo del puesto, un dia de mercado
// con la pieza en el puesto; los aparejos, mientras estaba el pescador.
function receiptValid(id, timestamp) {
  if (typeof timestamp !== "string" || timestamp.length > 32) return false;
  const date = new Date(timestamp);
  if (TACKLE_IDS.has(id)) return Boolean(fishermanVisit(date, CLOCK_GRACE_MS));
  return marketIsOpen(date) && receiptWasInStock(id, date);
}

// Lo que entra con la granja: lo vendido de la cesta (cosechas, la gigante al
// doble, miel y fruta), los ahumados vendidos al pescador y los encargos del
// tablon (su premio sale del encargo de ese dia).
function orderReward(order, yard) {
  return helpWanted(order.day, ownedOn(order.day, yard)).reward;
}
function farmIncome({ seeds, giantIds, honey, fruit, smoked, orders, yard }) {
  return seeds.filter((seed) => seed.sold).reduce((sum, seed) => sum + seedValue(seed, giantIds), 0)
    + honey.filter((jar) => jar.sold).length * HONEY.value
    + fruit.filter((entry) => entry.sold).reduce((sum, entry) => sum + (fruitById(entry.fruit)?.value || 0), 0)
    + smoked.filter((entry) => entry.sold).reduce((sum, entry) => sum + smokedPrice(CATCHES.get(entry.id)), 0)
    + orders.reduce((sum, order) => sum + orderReward(order, yard), 0);
}
const yardSpend = (yard) => Object.keys(yard).reduce((sum, id) => sum + (yardById(id)?.price || 0), 0);

export function normalizeMarket(value, fishCollection = {}, bonus = 0, now = Date.now()) {
  const rewards = (Array.isArray(value?.rewards) ? value.rewards : []).slice(0, Math.min(999, count(fishCollection["token-chest"]))).map((reward) => Math.max(CHEST_MIN_COINS, Math.min(CHEST_MAX_COINS, count(reward))));
  const opened = rewards.length;
  const receipts = value?.purchases && typeof value.purchases === "object" ? value.purchases : {};
  const candidates = cleanSeeds(value?.seeds, now);
  const sold = cleanSold(value?.sold, fishCollection);
  const lureCandidates = cleanLureBuys(value?.lures, now);
  const soldDays = cleanSoldDays(value?.soldDays, now);
  const yardCandidates = cleanYard(value?.yard, now);
  const smokedCandidates = cleanSmoked(value?.smoked, now);
  const orderCandidates = cleanOrders(value?.orders, now);
  const giantRewards = giantRewardsOf(value?.giantRewards, fishCollection);
  let paidSeeds = candidates, paidYard = yardCandidates, result = null;
  for (let pass = 0; pass < 8; pass++) {
    // Con lo que se supone pagado (semillas y patio): la miel de la casita, la
    // fruta del arbol, la calabaza gigante, los ahumados y los encargos.
    const assumed = Object.fromEntries(paidYard.map((entry) => [entry.id, entry.at]));
    const bee = assumed["yard-bee-house"] ? Date.parse(assumed["yard-bee-house"]) : NaN;
    const honey = cleanHoney(value?.honey, bee, now);
    const fruit = cleanFruit(value?.fruit, yardTree(assumed), now);
    const giantIds = giantIdsOf(giantGroups(paidSeeds));
    const farm = settleFarm({ fishCollection, sold, smoked: smokedCandidates, orders: orderCandidates, seeds: paidSeeds, honey, fruit, yard: assumed });
    const purchases = {};
    let budget = rewards.reduce((sum, reward) => sum + reward, 0) + sumOf(giantRewards) + count(bonus) + saleCoins(sold) + farmIncome({ seeds: paidSeeds, giantIds, honey, fruit, smoked: farm.smoked, orders: farm.orders, yard: assumed });
    for (const item of MARKET_ITEMS) {
      const timestamp = receipts[item.id];
      if (!receiptValid(item.id, timestamp) || budget < item.price) continue;
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
    // (los señuelos, despues de todo lo de antes)
    const paid = payLures(lureCandidates, budget);
    budget = paid.budget;
    // (y lo del patio, lo ultimo)
    const yard = [];
    for (const entry of yardCandidates) {
      const price = yardById(entry.id).price;
      if (budget < price) continue;
      yard.push(entry);
      budget -= price;
    }
    // (los usos gastados nunca pasan de los comprados mas los regalados)
    const bought = {};
    for (const buy of paid.lures) bought[buy.id] = (bought[buy.id] || 0) + 1;
    const rawUses = value?.lureUses && typeof value.lureUses === "object" ? value.lureUses : {};
    const lureUses = Object.fromEntries(LURES.map((lure) => [lure.id, Math.min((bought[lure.id] || 0) + MAX_GRANT, count(rawUses[lure.id]))]).filter(([, n]) => n));
    result = {
      opened, rewards, giantRewards, purchases, seeds, sold, lures: paid.lures, lureUses, soldDays,
      yard: Object.fromEntries(yard.map((entry) => [entry.id, entry.at])), honey, fruit, smoked: farm.smoked, orders: farm.orders
    };
    const sameSeeds = seeds.length === paidSeeds.length && seeds.every((seed, index) => seed === paidSeeds[index]);
    const sameYard = yard.length === paidYard.length && yard.every((entry, index) => entry === paidYard[index]);
    if (sameSeeds && sameYard) break;
    paidSeeds = seeds;
    paidYard = yard;
  }
  return result;
}
// Monedas de un mercado ya normalizado.
function marketCoins(market, bonus) {
  const giantIds = giantIdsOf(giantGroups(market.seeds));
  const income = market.rewards.reduce((sum, reward) => sum + reward, 0) + sumOf(market.giantRewards || []) + count(bonus) + saleCoins(market.sold)
    + farmIncome({ seeds: market.seeds, giantIds, honey: market.honey, fruit: market.fruit, smoked: market.smoked, orders: market.orders, yard: market.yard });
  const spend = market.seeds.reduce((sum, seed) => sum + cropById(seed.crop).price, 0) + lureSpend(market.lures) + yardSpend(market.yard)
    + MARKET_ITEMS.filter((item) => Object.hasOwn(market.purchases, item.id)).reduce((sum, item) => sum + item.price, 0);
  return income - spend;
}
// De dos listas, una entrada por clave: la que ya esta vendida, comida o
// entregada gana a la que no.
function unionBy(left, right, key) {
  const done = (entry) => Boolean(entry.sold || entry.given || entry.eaten);
  const byKey = new Map();
  for (const entry of [...left, ...right]) {
    const other = byKey.get(key(entry));
    if (!other || (done(entry) && !done(other))) byKey.set(key(entry), entry);
  }
  return [...byKey.values()];
}
export function mergeMarket(left, right, fishCollection, bonus = 0) {
  const a = normalizeMarket(left, fishCollection, bonus);
  const b = normalizeMarket(right, fishCollection, bonus);
  const rewards = [...a.rewards, ...b.rewards.slice(a.rewards.length)];
  const giantRewards = [...a.giantRewards, ...b.giantRewards.slice(a.giantRewards.length)];
  // Semillas de los dos lados: de cada una, la que va mas avanzada.
  const byId = new Map();
  for (const seed of [...a.seeds, ...b.seeds]) {
    const other = byId.get(seed.id);
    if (!other || seedStage(seed) > seedStage(other)) byId.set(seed.id, seed);
  }
  const seeds = [...byId.values()];
  // Lo vendido solo sube: de cada captura, lo de quien haya vendido mas.
  const sold = { ...a.sold };
  for (const [id, amount] of Object.entries(b.sold)) sold[id] = Math.max(sold[id] || 0, amount);
  // Los señuelos de los dos lados; los usos y lo vendido cada dia, lo mayor.
  const lures = [...a.lures, ...b.lures];
  const lureUses = { ...a.lureUses };
  for (const [id, n] of Object.entries(b.lureUses)) lureUses[id] = Math.max(lureUses[id] || 0, n);
  const soldDays = { ...a.soldDays };
  for (const [day, n] of Object.entries(b.soldDays)) soldDays[day] = Math.max(soldDays[day] || 0, n);
  // La granja de los dos lados (el patio de `a` manda).
  const yard = { ...b.yard, ...a.yard };
  const honey = unionBy(a.honey, b.honey, (jar) => jar.at);
  const fruit = unionBy(a.fruit, b.fruit, (entry) => entry.at + "#" + entry.i);
  const smoked = unionBy(a.smoked, b.smoked, (entry) => entry.id + "@" + entry.at);
  const orders = unionBy(a.orders, b.orders, (order) => order.day);
  const purchases = { ...a.purchases };
  // Lo de `a` tambien cuenta: una compra del otro equipo no puede dejar sin
  // pagar (y hacer desaparecer) una semilla de este.
  // (con los cofres abiertos de los dos lados)
  const sum = (list) => list.reduce((total, reward) => total + reward, 0);
  let balance = marketCoins(a, bonus) + sum(rewards) - sum(a.rewards) + sum(giantRewards) - sum(a.giantRewards);
  // Preserve confirmed purchases when two devices spend the same balance.
  // Accept only affordable additions; never replace an already-owned piece.
  for (const item of MARKET_ITEMS) {
    if (Object.hasOwn(purchases, item.id) || !Object.hasOwn(b.purchases, item.id) || item.price > balance) continue;
    purchases[item.id] = b.purchases[item.id];
    balance -= item.price;
  }
  return normalizeMarket({ rewards, giantRewards, purchases, seeds, sold, lures, lureUses, soldDays, yard, honey, fruit, smoked, orders }, fishCollection, bonus);
}
export function marketWallet(adventure, now = Date.now()) {
  const bonus = bonusCoins(adventure);
  const market = normalizeMarket(adventure.market, adventure.fishCollection, bonus, now);
  const owned = Object.keys(market.purchases);
  const giants = giantGroups(market.seeds), giantIds = giantIdsOf(giants);
  const soldCoins = market.seeds.filter((seed) => seed.sold).reduce((sum, seed) => sum + seedValue(seed, giantIds), 0);
  // Lo plantado ahora (sin cosechar), por parcela; la bolsa (sin plantar) y la
  // cesta (cosechado, sin vender ni entregar), por cultivo.
  const garden = market.seeds.filter((seed) => seed.planted && !seed.harvested);
  const tally = (pick) => Object.fromEntries(CROPS.map((crop) => [crop.id, market.seeds.filter((seed) => seed.crop === crop.id && pick(seed)).length]));
  const bag = tally((seed) => !seed.planted), basket = tally((seed) => seed.harvested && !seed.sold && !seed.given);
  const harvestedCount = market.seeds.filter((seed) => seed.harvested).length;
  const fishCoins = saleCoins(market.sold);
  // Usos que quedan de cada señuelo comprado.
  const lureLeft = { ...lureGrants(adventure) };
  for (const buy of market.lures) lureLeft[buy.id] = (lureLeft[buy.id] || 0) + 1;
  for (const id of Object.keys(lureLeft)) lureLeft[id] = Math.max(0, lureLeft[id] - (market.lureUses[id] || 0));
  const soldToday = market.soldDays[saleDay(now)] || 0;
  // La granja: la casita de abejas, el arbol, la miel y la fruta de la cesta,
  // el ahumadero y los peces que quedan sin vender, ahumar ni entregar.
  const keep = (entry) => !entry.sold && !entry.given;
  const lastAt = (list) => (list.length ? Date.parse(list[list.length - 1].at) : null);
  const beeAt = market.yard["yard-bee-house"] ? Date.parse(market.yard["yard-bee-house"]) : null;
  const bees = beeAt == null ? null : { at: beeAt, readyAt: honeyReadyAt(beeAt, lastAt(market.honey)) };
  if (bees) bees.ready = bees.readyAt <= now;
  const treeBase = yardTree(market.yard), lastPick = lastAt(market.fruit);
  const tree = treeBase ? { ...treeBase, stage: treeStage(treeBase, now), ready: fruitReady(treeBase, lastPick, now), nextAt: nextFruitAt(treeBase, lastPick, now) } : null;
  const basketHoney = market.honey.filter(keep).length;
  const basketFruit = Object.fromEntries(FRUITS_IDS.map((id) => [id, market.fruit.filter((entry) => entry.fruit === id && keep(entry)).length]));
  const farm = settleFarm({ fishCollection: adventure.fishCollection || {}, sold: market.sold, smoked: market.smoked, orders: market.orders, seeds: market.seeds, honey: market.honey, fruit: market.fruit, yard: market.yard });
  const hanging = market.smoked.filter((entry) => smokedReadyAt(entry) > now).map((entry) => ({ ...entry, readyAt: smokedReadyAt(entry) }));
  const smokedReady = {};
  for (const entry of market.smoked) if (smokedReadyAt(entry) <= now && !entry.sold && !entry.eaten && !entry.given) smokedReady[entry.id] = (smokedReady[entry.id] || 0) + 1;
  // El encargo de hoy en el tablon: lo que pide, si ya esta hecho y cuanto hay.
  const day = farmDay(now), request = helpWanted(day, ownedOn(day, market.yard));
  const have = request.kind === "fish" ? farm.fishLeft[request.id] || 0
    : request.kind === "crop" ? basket[request.id] || 0
      : request.kind === "honey" ? basketHoney
        : request.kind === "fruit" ? basketFruit[request.id] || 0
          : Object.values(smokedReady).reduce((sum, n) => sum + n, 0);
  const order = { ...request, done: market.orders.some((entry) => entry.day === day), have };
  return {
    ...market, owned, bonus, soldCoins, fishCoins, lureLeft, soldToday, garden, bag, basket, harvestedCount,
    giants, bees, tree, scarecrow: Boolean(market.yard["yard-scarecrow"]), basketHoney, basketFruit,
    smoker: { hanging, ready: smokedReady, free: Math.max(0, SMOKER_HOOKS - hanging.length) }, fishLeft: farm.fishLeft, order,
    coins: marketCoins(market, bonus), unopened: Math.min(999, count(adventure.fishCollection?.["token-chest"])) - market.opened,
    giantUnopened: Math.min(99, count(adventure.fishCollection?.[GIANT_CHEST_ID])) - market.giantRewards.length
  };
}
const marketRecord = (wallet, changes = {}) => ({
  opened: wallet.opened, rewards: wallet.rewards, giantRewards: wallet.giantRewards, purchases: wallet.purchases, seeds: wallet.seeds, sold: wallet.sold, lures: wallet.lures, lureUses: wallet.lureUses, soldDays: wallet.soldDays,
  yard: wallet.yard, honey: wallet.honey, fruit: wallet.fruit, smoked: wallet.smoked, orders: wallet.orders.map(({ day, at }) => ({ day, at })), ...changes
});
export function openMarketChest(adventure, random = Math.random) {
  const wallet = marketWallet(adventure);
  if (!wallet.unopened) return { adventure, message: "No unopened chests. Let Buddy fish for more." };
  const reward = Math.min(CHEST_MAX_COINS, Math.max(CHEST_MIN_COINS, Math.floor(random() * CHEST_MAX_COINS) + CHEST_MIN_COINS));
  return { reward, adventure: { ...adventure, market: marketRecord(wallet, { opened: wallet.opened + 1, rewards: [...wallet.rewards, reward] }) }, message: `Chest opened! +${reward} ${reward === 1 ? "coin" : "coins"}.` };
}
// El cofre gigante: de GIANT_CHEST_MIN_COINS a GIANT_CHEST_MAX_COINS de oro.
export function openGiantChest(adventure, random = Math.random) {
  const wallet = marketWallet(adventure);
  if (!wallet.giantUnopened) return { adventure, message: "No giant chests. Say hello to the Leviathan or the Kraken..." };
  const reward = Math.min(GIANT_CHEST_MAX_COINS, GIANT_CHEST_MIN_COINS + Math.floor(random() * (GIANT_CHEST_MAX_COINS - GIANT_CHEST_MIN_COINS + 1)));
  return { reward, giant: true, adventure: { ...adventure, market: marketRecord(wallet, { giantRewards: [...wallet.giantRewards, reward] }) }, message: `Giant chest opened! +${reward} coins from the deep.` };
}
export function purchaseMarketItem(adventure, id, date = new Date()) {
  const item = MARKET_ITEMS.find((entry) => entry.id === id);
  const wallet = marketWallet(adventure);
  if (!item) return { adventure, message: "That item is not in stock." };
  if (wallet.owned.includes(id)) return { adventure, message: "You already own this item." };
  if (TACKLE_IDS.has(id)) {
    const trip = fishermanTrip(wallet, date);
    if (!trip.visit) return { adventure, message: "The fisherman has moved on. He comes by the footer a few days a week." };
    if (!trip.here) return { adventure, message: "Marlin went to restock. He'll be back soon." };
  } else {
    if (!marketIsOpen(date)) return { adventure, message: "The stand opens on Wednesdays and Saturdays." };
    if (!marketCarries(id, date)) return { adventure, message: "That item is not in today's stock. Check the next market day." };
  }
  if (wallet.coins < item.price) return { adventure, message: `You need ${item.price - wallet.coins} more coins. Open a chest here in the shop.` };
  return { adventure: { ...adventure, market: marketRecord(wallet, { purchases: { ...wallet.purchases, [id]: date.toISOString() } }) }, message: item.category === "host" ? `${item.label} is yours! Pick her from the HOST switch in the top bar.` : `${item.label} is yours! Find it in ${item.category === "decor" ? "Room → Collection, on either shelf" : item.slot ? `Inventory, in the ${item.slot} slot` : "Inventory"}.` };
}

// Lo que Buddy le puede vender al pescador: cada captura con lo pescado, lo
// ya vendido, lo que queda y lo que paga por cada una.
export function sellableCatches(adventure) {
  const wallet = marketWallet(adventure);
  return ALL_CATCHES.filter((item) => catchPrice(item) && count(adventure.fishCollection?.[item.id]) > 0).map((item) => {
    const caught = count(adventure.fishCollection[item.id]), gone = wallet.sold[item.id] || 0;
    return { item, caught, sold: gone, left: Math.max(0, wallet.fishLeft[item.id] || 0), price: catchPrice(item) };
  });
}
// Vender `amount` de una captura (o "all") mientras esta el pescador, sin
// pasar de lo que compra al dia (FISH_SELL_DAILY).
export function sellCatch(adventure, id, amount = 1, date = new Date()) {
  const item = CATCHES.get(id), price = catchPrice(item);
  if (!price) return { adventure, value: 0, message: "The fisherman doesn't buy that." };
  const wallet = marketWallet(adventure, date.getTime());
  if (!fishermanTrip(wallet, date).here) return { adventure, value: 0, message: "The fisherman isn't here right now. Sell your catch when his cart is back." };
  const day = saleDay(date), today = wallet.soldDays[day] || 0, room = FISH_SELL_DAILY - today;
  if (room <= 0) return { adventure, value: 0, message: "Marlin has bought all the fish he can carry today. Try again tomorrow." };
  const gone = wallet.sold[id] || 0;
  const n = Math.min(amount === "all" ? Infinity : Math.max(1, count(amount)), wallet.fishLeft[id] || 0, room);
  if (n <= 0) return { adventure, value: 0, message: `No ${item.name} left to sell.` };
  const value = n * price;
  return { adventure: { ...adventure, market: marketRecord(wallet, { sold: { ...wallet.sold, [id]: gone + n }, soldDays: { ...wallet.soldDays, [day]: today + n } }) }, value, message: `Sold ${n} ${item.name} for ${value} ${value === 1 ? "coin" : "coins"}.` };
}

// Comprar señuelos (`qty`, uno a uno): los basicos al puesto un dia de
// mercado, los buenos al pescador. Si el ultimo era lo ultimo de su carro, el
// pescador se va a reponer.
export function purchaseLure(adventure, id, date = new Date(), qty = 1) {
  const lure = PACKS.get(id);
  if (!lure) return { adventure, bought: 0, message: "Nobody sells that." };
  let state = adventure, bought = 0, stop = "";
  for (let i = 0; i < Math.max(1, Math.min(50, count(qty) || 1)); i++) {
    const wallet = marketWallet(state);
    if (lure.seller === "market") {
      if (!marketIsOpen(date)) { stop = "The stand opens on Wednesdays and Saturdays."; break; }
      if (!marketBaitStock(wallet, date)[id]) { stop = `The stand is out of ${lure.label.toLowerCase()}s until the next market day.`; break; }
    } else {
      const trip = fishermanTrip(wallet, date);
      if (!trip.visit) { stop = "The fisherman has moved on. He comes by the footer a few days a week."; break; }
      if (!trip.here) { stop = "Marlin went to restock. He'll be back soon."; break; }
      if (!trip.stock[id]) { stop = `He's out of ${lure.label.toLowerCase()}s until he restocks.`; break; }
    }
    if (wallet.coins < lure.price) { stop = bought ? "That's all your coins cover." : `You need ${lure.price - wallet.coins} more coins.`; break; }
    state = { ...state, market: marketRecord(wallet, { lures: [...wallet.lures, { id, at: new Date(+date + i).toISOString() }] }) };
    bought += 1;
  }
  if (!bought) return { adventure, bought: 0, message: stop };
  const left = marketWallet(state).lureLeft[id] || 0;
  let message = `Bought ${bought} ${lure.label.toLowerCase()}${bought === 1 ? "" : "s"}: ${left} ${left === 1 ? "use" : "uses"} now. Equip it in the Fishing tab.`;
  if (lure.seller === "fisherman") {
    const after = fishermanTrip(marketWallet(state), new Date(+date + bought));
    if (!after.here) message += after.gap?.returns ? ` That cleaned out his cart: Marlin's off to restock, back in about ${Math.round(RESTOCK_MS / 60000)} minutes.` : " That cleaned out his cart. Marlin's heading home for today.";
  }
  return { adventure: state, bought, message };
}
// Un uso del señuelo puesto (lo llama la pesca). Devuelve los que quedan.
export function spendLure(adventure, id) {
  const wallet = marketWallet(adventure);
  if (!PACKS.has(id) || !(wallet.lureLeft[id] > 0)) return { adventure, left: wallet.lureLeft[id] || 0 };
  // (un uso: el señuelo se gasta al sacar la captura)
  return { adventure: { ...adventure, market: marketRecord(wallet, { lureUses: { ...wallet.lureUses, [id]: (wallet.lureUses[id] || 0) + 1 } }) }, left: wallet.lureLeft[id] - 1 };
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
  return { seed: planted, adventure: { ...adventure, market: marketRecord(wallet, { seeds: wallet.seeds.map((entry) => (entry.id === seed.id ? planted : entry)) }) }, message: `${crop.label} planted in plot ${target + 1}! Ready in about ${crop.hours} ${crop.hours === 1 ? "hour" : "hours"}.` };
}

// Cosechar una planta madura: a la cesta (se vende el viernes).
export function harvestCrop(adventure, seedId, date = new Date()) {
  const wallet = marketWallet(adventure, date.getTime());
  const seed = wallet.garden.find((entry) => entry.id === seedId);
  if (!seed) return { adventure, message: "Nothing to harvest there." };
  // (la gigante sale entera, cuando ha madurado la ultima de las tres)
  const group = wallet.giants.find((entry) => entry.ids.includes(seedId));
  if (group) {
    if (group.ripeAt > date.getTime()) return { adventure, message: "Something big is growing in there. Give it a little longer." };
    const at = date.toISOString(), ids = new Set(group.ids), crop = cropById(seed.crop);
    const value = group.ids.length * crop.value * 2;
    return { value, crop, giant: true, adventure: { ...adventure, market: marketRecord(wallet, { seeds: wallet.seeds.map((entry) => (ids.has(entry.id) ? { ...entry, harvested: at } : entry)) }) }, message: `A GIANT pumpkin! It's in the basket, worth ${value} gold on Friday.` };
  }
  if (ripeAt(seed) > date.getTime()) return { adventure, message: "Not ripe yet." };
  const crop = cropById(seed.crop);
  return { value: crop.value, crop, adventure: { ...adventure, market: marketRecord(wallet, { seeds: wallet.seeds.map((entry) => (entry.id === seed.id ? { ...entry, harvested: date.toISOString() } : entry)) }) }, message: `Harvested a ${crop.label.toLowerCase()}! It's in the basket for Friday's market.` };
}

// Vender la cesta (toda, o solo un cultivo): solo los viernes.
export function sellCrops(adventure, cropId = null, date = new Date()) {
  const wallet = marketWallet(adventure, date.getTime());
  if (!cropSaleDay(date)) return { adventure, message: "Crops sell at the Friday market. Keep them in the basket until then." };
  const open = (entry) => !entry.sold && !entry.given;
  const selling = wallet.seeds.filter((seed) => seed.harvested && open(seed) && (!cropId || seed.crop === cropId));
  const jars = !cropId || cropId === HONEY.id ? wallet.honey.filter(open) : [];
  const fruits = wallet.fruit.filter((entry) => open(entry) && (!cropId || entry.fruit === cropId));
  const n = selling.length + jars.length + fruits.length;
  if (!n) return { adventure, message: "Nothing in the basket to sell." };
  const at = date.toISOString(), ids = new Set(selling.map((seed) => seed.id)), giantIds = giantIdsOf(wallet.giants);
  const total = selling.reduce((sum, seed) => sum + seedValue(seed, giantIds), 0) + jars.length * HONEY.value + fruits.reduce((sum, entry) => sum + fruitById(entry.fruit).value, 0);
  const jarKeys = new Set(jars.map((jar) => jar.at)), fruitKeys = new Set(fruits.map((entry) => entry.at + "#" + entry.i));
  return {
    value: total,
    adventure: { ...adventure, market: marketRecord(wallet, {
      seeds: wallet.seeds.map((entry) => (ids.has(entry.id) ? { ...entry, sold: at } : entry)),
      honey: wallet.honey.map((jar) => (jarKeys.has(jar.at) ? { ...jar, sold: at } : jar)),
      fruit: wallet.fruit.map((entry) => (fruitKeys.has(entry.at + "#" + entry.i) ? { ...entry, sold: at } : entry))
    }) },
    message: `Sold ${n} from the basket for ${total} gold!`
  };
}

// --- La granja: patio, miel, fruta, ahumadero y el tablon --------------------
// Comprar algo del patio (cualquier dia, en el cobertizo del huerto).
export function purchaseYard(adventure, id, date = new Date()) {
  const item = yardById(id);
  const wallet = marketWallet(adventure, date.getTime());
  if (!item) return { adventure, message: "The shed doesn't sell that." };
  if (wallet.yard[id]) return { adventure, message: `You already have the ${item.label.toLowerCase()}.` };
  if (item.kind === "tree" && wallet.tree) return { adventure, message: "There's only room for one fruit tree by the garden." };
  if (wallet.coins < item.price) return { adventure, message: `You need ${item.price - wallet.coins} more coins for the ${item.label.toLowerCase()}.` };
  const after = { ...adventure, market: marketRecord(wallet, { yard: { ...wallet.yard, [id]: date.toISOString() } }) };
  const where = item.kind === "tree" ? "It's planted behind the garden." : item.kind === "bees" ? "The bees are moving in by the garden." : "He's standing guard in the garden.";
  return { adventure: after, message: `${item.label} bought! ${where}` };
}
// Pip recoge el tarro de miel (si esta lleno).
export function collectHoney(adventure, date = new Date()) {
  const wallet = marketWallet(adventure, date.getTime());
  if (!wallet.bees) return { adventure, message: "No bee house yet." };
  if (!wallet.bees.ready) return { adventure, message: "The bees are still busy." };
  return { adventure: { ...adventure, market: marketRecord(wallet, { honey: [...wallet.honey, { at: date.toISOString() }] }) }, message: "A jar of wildflower honey for the basket!" };
}
// Pip recoge la fruta que cuelga del arbol.
export function pickFruit(adventure, date = new Date()) {
  const wallet = marketWallet(adventure, date.getTime());
  if (!wallet.tree?.ready) return { adventure, picked: 0, message: "No fruit on the tree yet." };
  const at = date.toISOString(), n = wallet.tree.ready, fruit = fruitById(wallet.tree.fruit);
  const picked = Array.from({ length: n }, (_, i) => ({ at, i, fruit: fruit.id }));
  return { picked: n, fruit, adventure: { ...adventure, market: marketRecord(wallet, { fruit: [...wallet.fruit, ...picked] }) }, message: `Picked ${n} ${fruit.label.toLowerCase()} for the basket!` };
}
// Colgar un pez en el ahumadero.
export function smokeFish(adventure, id, date = new Date()) {
  const item = CATCHES.get(id);
  if (!smokable(item)) return { adventure, message: "Only fish go in the smoker." };
  const wallet = marketWallet(adventure, date.getTime());
  if (!(wallet.fishLeft[id] > 0)) return { adventure, message: `No ${item.name} left to smoke.` };
  if (!wallet.smoker.free) return { adventure, message: `The smoker holds ${SMOKER_HOOKS} fish at a time. Wait for one to finish.` };
  return { adventure: { ...adventure, market: marketRecord(wallet, { smoked: [...wallet.smoked, { id, at: date.toISOString() }] }) }, message: `${item.name} is hanging over the coals. Smoked in about an hour.` };
}
// Vender pescado ahumado al pescador (cuenta para su tope del dia).
export function sellSmoked(adventure, id, amount = 1, date = new Date()) {
  const item = CATCHES.get(id), price = smokedPrice(item);
  const wallet = marketWallet(adventure, date.getTime());
  if (!price || !wallet.smoker.ready[id]) return { adventure, value: 0, message: "No smoked fish like that ready." };
  if (!fishermanTrip(wallet, date).here) return { adventure, value: 0, message: "The fisherman isn't here right now. Sell your smoked fish when his cart is back." };
  const day = saleDay(date), today = wallet.soldDays[day] || 0, room = FISH_SELL_DAILY - today;
  if (room <= 0) return { adventure, value: 0, message: "Marlin has bought all the fish he can carry today. Try again tomorrow." };
  const n = Math.min(amount === "all" ? Infinity : Math.max(1, count(amount)), wallet.smoker.ready[id], room);
  const at = date.toISOString(), now = date.getTime();
  let left = n;
  const smoked = wallet.smoked.map((entry) => {
    if (!left || entry.id !== id || entry.sold || entry.eaten || entry.given || smokedReadyAt(entry) > now) return entry;
    left -= 1;
    return { ...entry, sold: at };
  });
  const value = n * price;
  return { adventure: { ...adventure, market: marketRecord(wallet, { smoked, soldDays: { ...wallet.soldDays, [day]: today + n } }) }, value, message: `Sold ${n} smoked ${item.name} for ${value} ${value === 1 ? "coin" : "coins"}.` };
}
// Pip se come un ahumado en la hoguera (el que menos vale de los listos).
export function eatSmoked(adventure, date = new Date()) {
  const wallet = marketWallet(adventure, date.getTime()), now = date.getTime();
  const ready = wallet.smoked.filter((entry) => !entry.sold && !entry.eaten && !entry.given && smokedReadyAt(entry) <= now)
    .sort((a, b) => smokedPrice(CATCHES.get(a.id)) - smokedPrice(CATCHES.get(b.id)));
  if (!ready.length) return { adventure, id: null };
  const pick = ready[0], at = date.toISOString();
  return { id: pick.id, adventure: { ...adventure, market: marketRecord(wallet, { smoked: wallet.smoked.map((entry) => (entry === pick ? { ...entry, eaten: at } : entry)) }) } };
}
// Entregar el encargo de hoy del tablon.
export function deliverOrder(adventure, date = new Date()) {
  const wallet = marketWallet(adventure, date.getTime()), order = wallet.order, now = date.getTime();
  if (order.done) return { adventure, reward: 0, message: "Today's request is done. A new one goes up tomorrow." };
  if (order.have < order.n) return { adventure, reward: 0, message: `You need ${order.n - order.have} more ${order.label.toLowerCase()} for this one.` };
  const at = date.toISOString(), changes = { orders: [...wallet.orders.map(({ day, at: when }) => ({ day, at: when })), { day: order.day, at }] };
  const giveFirst = (list, test) => {
    let left = order.n;
    return list.map((entry) => { if (!left || !test(entry)) return entry; left -= 1; return { ...entry, given: at }; });
  };
  const open = (entry) => !entry.sold && !entry.given;
  if (order.kind === "crop") changes.seeds = giveFirst(wallet.seeds, (seed) => seed.crop === order.id && seed.harvested && open(seed));
  if (order.kind === "honey") changes.honey = giveFirst(wallet.honey, open);
  if (order.kind === "fruit") changes.fruit = giveFirst(wallet.fruit, (entry) => entry.fruit === order.id && open(entry));
  if (order.kind === "smoked") changes.smoked = giveFirst(wallet.smoked, (entry) => open(entry) && !entry.eaten && smokedReadyAt(entry) <= now);
  return { reward: order.reward, adventure: { ...adventure, market: marketRecord(wallet, changes) }, message: `Delivered! +${order.reward} gold. A new request goes up tomorrow.` };
}
