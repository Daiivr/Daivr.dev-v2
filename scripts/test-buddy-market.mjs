import assert from "node:assert/strict";
import { test } from "node:test";
import { MARKET_ITEMS, marketIsOpen, marketStock, normalizeMarket, mergeMarket, marketWallet, openMarketChest, purchaseMarketItem } from "../shared/buddy-market.mjs";
import { isRoomDisplayAllowed, normalizeRoom, ownedRoomDisplays } from "../shared/buddy-room.mjs";

const wednesday = new Date("2026-10-07T16:00:00Z");
const saturday = new Date("2026-10-10T16:00:00Z");
const rich = () => ({ fishCollection: { "token-chest": 100 }, market: { rewards: Array(100).fill(5), purchases: {} } });

test("market opens only Wednesday/Saturday in New York, including midnight and DST boundaries", () => {
  assert.equal(marketIsOpen(wednesday), true);
  assert.equal(marketIsOpen(saturday), true);
  assert.equal(marketIsOpen(new Date("2026-10-08T03:59:59Z")), true);
  assert.equal(marketIsOpen(new Date("2026-10-08T04:00:00Z")), false);
  assert.equal(marketIsOpen(new Date("2026-11-04T04:59:59Z")), false);
  assert.equal(marketIsOpen(new Date("2026-11-04T05:00:00Z")), true);
  assert.equal(marketIsOpen(new Date("invalid")), false);
});

test("three products per opening; closed days preview next stock and each opening rotates", () => {
  const wed = marketStock(wednesday).map((item) => item.id);
  const sat = marketStock(saturday).map((item) => item.id);
  assert.equal(wed.length, 3);
  assert.equal(sat.length, 3);
  assert.equal(new Set([...wed, ...sat]).size, 6);
  assert.deepEqual(marketStock(new Date("2026-10-09T16:00:00Z")).map((item) => item.id), sat);
  assert.deepEqual(marketStock(new Date("2026-10-14T16:00:00Z")).map((item) => item.id), wed);
});

test("chests roll 1–10 once, persist the result and preserve lifetime discoveries", () => {
  let state = { fishCollection: { "token-chest": 10 } };
  for (let i = 0; i < 10; i++) {
    const result = openMarketChest(state, () => i / 10);
    state = result.adventure;
    assert.equal(state.market.rewards[i], i + 1);
    assert.match(result.message, new RegExp(`\\+${i + 1} coin`));
  }
  state = JSON.parse(JSON.stringify(state));
  assert.equal(marketWallet(state).coins, 55);
  assert.equal(marketWallet(state).unopened, 0);
  assert.equal(state.fishCollection["token-chest"], 10);
  assert.equal(openMarketChest(state).adventure, state);
});

test("purchases debit once and reject insufficient gold, closed days and out-of-stock items", () => {
  const original = rich();
  const product = marketStock(wednesday)[0];
  const bought = purchaseMarketItem(original, product.id, wednesday).adventure;
  assert.equal(marketWallet(bought).coins, 500 - product.price);
  assert.ok(marketWallet(bought).owned.includes(product.id));
  assert.equal(purchaseMarketItem(bought, product.id, wednesday).adventure, bought);
  const poor = { fishCollection: { "token-chest": 1 }, market: { rewards: [1] } };
  assert.equal(purchaseMarketItem(poor, product.id, wednesday).adventure, poor);
  assert.equal(purchaseMarketItem(original, product.id, new Date("2026-10-08T12:00:00Z")).adventure, original);
  assert.equal(purchaseMarketItem(original, marketStock(saturday)[0].id, wednesday).adventure, original);
});

test("stale saves cannot refund purchases, reopen chests or reroll saved rewards", () => {
  const before = rich();
  const bought = purchaseMarketItem(before, marketStock(wednesday)[0].id, wednesday).adventure;
  const merged = mergeMarket(bought.market, before.market, before.fishCollection);
  assert.deepEqual(merged, normalizeMarket(bought.market, before.fishCollection));
  const reroll = mergeMarket({ rewards: [1] }, { rewards: [10, 7] }, { "token-chest": 2 });
  assert.deepEqual(reroll.rewards, [1, 7]);
  assert.deepEqual(normalizeMarket({ rewards: [99, -8, 6] }, { "token-chest": 2 }).rewards, [10, 1]);
});

test("market decor enters owned shelf choices, persists and never enters aquariums", () => {
  const decor = MARKET_ITEMS.filter((item) => item.category === "decor");
  const displays = ownedRoomDisplays({ market: { owned: decor.map((item) => item.id) } });
  assert.equal(displays.length, 3);
  for (const item of displays) {
    assert.equal(isRoomDisplayAllowed("shelfLeft", item.key), true);
    assert.equal(isRoomDisplayAllowed("aquarium", item.key), false);
    assert.equal(normalizeRoom({ shelfLeft: item.key }).shelfLeft, item.key);
  }
  assert.equal(isRoomDisplayAllowed("shelfLeft", "shop:market-beanie"), false);
  assert.equal(isRoomDisplayAllowed("shelfLeft", "shop:invented"), false);
});

test("conflicting device purchases retain confirmed ownership without overspending", () => {
  const base = { fishCollection: { "token-chest": 10 }, market: { rewards: Array(10).fill(5) } };
  const first = purchaseMarketItem(base, "market-terrarium", wednesday).adventure;
  const second = purchaseMarketItem(base, "market-beanie", wednesday).adventure;
  const merged = { ...base, market: mergeMarket(first.market, second.market, base.fishCollection) };
  assert.deepEqual(marketWallet(merged).owned, ["market-terrarium"]);
  assert.equal(marketWallet(merged).coins, 0);
});
