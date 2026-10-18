// El pescador ambulante: pasa por el footer unos dias a la semana y vende
// cañas y señuelos (MARKET_TACKLE) y compra lo que Buddy pesca. Viene los
// mismos dias y a las mismas horas para todo el mundo, sin servidor: cada
// semana (de lunes a domingo, en UTC) se sortean FISHERMAN_DAYS_PER_WEEK dias
// con un sorteo fijo por numero de semana, y cada uno de esos dias llega a una
// hora al azar de la tarde y se queda unas horas. Asi el servidor puede
// comprobar que una compra de aparejos se hizo mientras estaba.
export const FISHERMAN_DAYS_PER_WEEK = 3;
const DAY_MS = 86400000;
// Llega entre las 13:00 y las 21:00 UTC (de mañana a media tarde en America,
// por la tarde en Europa) y se queda de dos a cuatro horas.
const ARRIVE_FROM = 13 * 60, ARRIVE_TO = 21 * 60;
export const FISHERMAN_STAY_MIN_MS = 2 * 3600000;
export const FISHERMAN_STAY_MAX_MS = 4 * 3600000;

// Un numero en [0, 1) fijo para cada entero.
function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
// Los dias de esa semana en los que viene (0 = lunes).
function weekDays(week) {
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (let i = 6; i > 0; i--) {
    const j = Math.floor(hash(week * 16 + i) * (i + 1));
    [days[i], days[j]] = [days[j], days[i]];
  }
  return days.slice(0, FISHERMAN_DAYS_PER_WEEK);
}
// La visita de un dia (numero de dia desde 1970, en UTC), o null.
function dayVisit(day) {
  const shifted = day + 3, week = Math.floor(shifted / 7), weekday = shifted - week * 7;
  if (!weekDays(week).includes(weekday)) return null;
  const arrive = ARRIVE_FROM + Math.floor(hash(day * 3 + 1) * (ARRIVE_TO - ARRIVE_FROM));
  const stay = FISHERMAN_STAY_MIN_MS + Math.floor(hash(day * 3 + 2) * (FISHERMAN_STAY_MAX_MS - FISHERMAN_STAY_MIN_MS) / 60000) * 60000;
  const from = day * DAY_MS + arrive * 60000;
  return { from, to: from + stay };
}

// La visita en curso (o null). `grace`: margen para relojes desfasados.
export function fishermanVisit(date = new Date(), grace = 0) {
  const t = +date;
  if (!Number.isFinite(t)) return null;
  const day = Math.floor(t / DAY_MS);
  for (const d of [day - 1, day, day + 1]) {
    const visit = dayVisit(d);
    if (visit && t >= visit.from - grace && t < visit.to + grace) return visit;
  }
  return null;
}

// La proxima visita que aun no ha terminado (la de ahora, si esta).
export function nextFishermanVisit(date = new Date()) {
  const t = +date;
  if (!Number.isFinite(t)) return null;
  const day = Math.floor(t / DAY_MS);
  for (let d = day - 1; d < day + 30; d++) {
    const visit = dayVisit(d);
    if (visit && visit.to > t) return visit;
  }
  return null;
}

// Lo que paga por cada captura, segun su rareza. El cofre de fichas no lo
// compra (se abre en el mercado).
export const FISH_PRICES = { junk: 1, common: 2, uncommon: 4, treasure: 6, rare: 8, legendary: 20, mythic: 40 };
export function catchPrice(item) {
  if (!item || item.id === "token-chest") return 0;
  return FISH_PRICES[item.rarity] || 0;
}
