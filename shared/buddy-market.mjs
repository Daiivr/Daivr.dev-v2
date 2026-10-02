export const CHEST_MIN_COINS = 1;
export const CHEST_MAX_COINS = 10;
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
export const MARKET_GEAR = MARKET_ITEMS.filter((item) => item.category !== "decor").map((item) => ({ ...item, source: "Footer market" }));
const count = (value) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(999999, Math.floor(Number(value)))) : 0;
const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: MARKET_TIME_ZONE });
export function marketIsOpen(date = new Date()) {
  return Number.isFinite(date.getTime()) && ["Wed", "Sat"].includes(dayFormat.format(date));
}

// Closed days preview the next opening's stock. Calendar math uses a New York
// date rather than elapsed hours, so daylight-saving changes do not shift it.
export function marketStock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: MARKET_TIME_ZONE }).formatToParts(date);
  const part = (name) => Number(parts.find((entry) => entry.type === name).value);
  const day = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  while (![3, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
  const second = day.getUTCDay() === 6;
  const ids = second ? ["market-vest", "market-moon", "market-arcade"] : ["market-beanie", "market-lantern", "market-terrarium"];
  return MARKET_ITEMS.filter((item) => ids.includes(item.id));
}

// Save a monotonic chest count and dated, unique purchases, never a mutable
// coin balance. Replaying an old save cannot refund coins or reopen a chest.
export function normalizeMarket(value, fishCollection = {}) {
  const rewards = (Array.isArray(value?.rewards) ? value.rewards : []).slice(0, Math.min(999, count(fishCollection["token-chest"]))).map((reward) => Math.max(CHEST_MIN_COINS, Math.min(CHEST_MAX_COINS, count(reward))));
  const opened = rewards.length;
  const purchases = {};
  let budget = rewards.reduce((sum, reward) => sum + reward, 0);
  const receipts = value?.purchases && typeof value.purchases === "object" ? value.purchases : {};
  for (const item of MARKET_ITEMS) {
    const timestamp = receipts[item.id];
    if (typeof timestamp !== "string" || timestamp.length > 32 || !marketIsOpen(new Date(timestamp)) || !marketStock(new Date(timestamp)).some((entry) => entry.id === item.id) || budget < item.price) continue;
    purchases[item.id] = timestamp;
    budget -= item.price;
  }
  return { opened, rewards, purchases };
}
export function mergeMarket(left, right, fishCollection) {
  const a = normalizeMarket(left, fishCollection);
  const b = normalizeMarket(right, fishCollection);
  const rewards = [...a.rewards, ...b.rewards.slice(a.rewards.length)];
  const purchases = { ...a.purchases };
  let balance = rewards.reduce((sum, reward) => sum + reward, 0) - MARKET_ITEMS.filter((item) => Object.hasOwn(purchases, item.id)).reduce((sum, item) => sum + item.price, 0);
  // Preserve confirmed purchases when two devices spend the same balance.
  // Accept only affordable additions; never replace an already-owned piece.
  for (const item of MARKET_ITEMS) {
    if (Object.hasOwn(purchases, item.id) || !Object.hasOwn(b.purchases, item.id) || item.price > balance) continue;
    purchases[item.id] = b.purchases[item.id];
    balance -= item.price;
  }
  return normalizeMarket({ rewards, purchases }, fishCollection);
}
export function marketWallet(adventure) {
  const market = normalizeMarket(adventure.market, adventure.fishCollection);
  const owned = Object.keys(market.purchases);
  return { ...market, owned, coins: market.rewards.reduce((sum, reward) => sum + reward, 0) - MARKET_ITEMS.filter((item) => owned.includes(item.id)).reduce((sum, item) => sum + item.price, 0), unopened: Math.min(999, count(adventure.fishCollection?.["token-chest"])) - market.opened };
}
export function openMarketChest(adventure, random = Math.random) {
  const wallet = marketWallet(adventure);
  if (!wallet.unopened) return { adventure, message: "No unopened chests. Let Buddy fish for more." };
  const reward = Math.min(CHEST_MAX_COINS, Math.max(CHEST_MIN_COINS, Math.floor(random() * CHEST_MAX_COINS) + CHEST_MIN_COINS));
  return { adventure: { ...adventure, market: { opened: wallet.opened + 1, rewards: [...wallet.rewards, reward], purchases: wallet.purchases } }, message: `Chest opened! +${reward} ${reward === 1 ? "coin" : "coins"}.` };
}
export function purchaseMarketItem(adventure, id, date = new Date()) {
  const item = MARKET_ITEMS.find((entry) => entry.id === id);
  const wallet = marketWallet(adventure);
  if (!item) return { adventure, message: "That item is not in stock." };
  if (wallet.owned.includes(id)) return { adventure, message: "You already own this item." };
  if (!marketIsOpen(date)) return { adventure, message: "The stand opens on Wednesdays and Saturdays." };
  if (!marketStock(date).some((entry) => entry.id === id)) return { adventure, message: "That item is not in today's stock. Check the next market day." };
  if (wallet.coins < item.price) return { adventure, message: `You need ${item.price - wallet.coins} more coins. Open a chest in the journal.` };
  return { adventure: { ...adventure, market: { opened: wallet.opened, rewards: wallet.rewards, purchases: { ...wallet.purchases, [id]: date.toISOString() } } }, message: `${item.label} is yours! Find it in ${item.category === "decor" ? "Room → Collection, on either shelf" : "Inventory"}.` };
}
