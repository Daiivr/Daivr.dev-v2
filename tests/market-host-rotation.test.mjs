import { readHostAsset, hostAssetsAvailable } from "./host-asset-fixture.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MARKET_GEAR, MARKET_ITEMS, MARKET_SPECIALS, marketCarries, marketHostStock, marketStock, marketWallet, mergeMarket, normalizeMarket, purchaseMarketItem } from "../shared/buddy-market.mjs";
import { KIYOSA_HOST_AVATAR, NH02_HOST_AVATAR, getHostAvatar, hostById, resolveHostId, unlockedHostIds } from "../src/lib/hostAvatar.js";

const saturday = new Date("2026-10-17T16:00:00Z");
const wednesday = new Date("2026-10-21T16:00:00Z");
const saver = () => ({ fishCollection: { "token-chest": 600 }, market: { rewards: Array(600).fill(10), purchases: {} } });

test("exactly one host rotates per opening and closed days preview the next host", () => {
  const ids = (date) => marketHostStock(new Date(date)).map((item) => item.id);
  assert.deepEqual(ids(saturday), ["host-nh02"]);
  assert.deepEqual(ids(wednesday), ["host-kiyosa"]);
  assert.deepEqual(ids("2026-10-16T16:00:00Z"), ["host-nh02"]);
  assert.deepEqual(ids("2026-10-18T04:00:00Z"), ["host-kiyosa"]);
  assert.deepEqual(ids("2026-10-24T16:00:00Z"), ["host-komoe"]);
  assert.deepEqual(ids("2026-10-28T16:00:00Z"), ["host-nh02"]);
  assert.deepEqual(ids("2026-10-31T16:00:00Z"), ["host-kiyosa"]);
  // New York calendar boundaries stay correct after daylight saving ends.
  assert.deepEqual(ids("2026-11-08T04:59:59Z"), ["host-nh02"]);
  assert.deepEqual(ids("2026-11-08T05:00:00Z"), ["host-kiyosa"]);
  assert.equal(marketStock(saturday).length, 3);
  assert.equal(marketStock(wednesday).length, 3);
  assert.equal(marketCarries("host-nh02", wednesday), false);
  assert.equal(marketCarries("host-komoe", wednesday), false);
  assert.equal(marketCarries("host-komoe", saturday), false);
  assert.deepEqual(MARKET_SPECIALS, []);
  assert.equal(MARKET_GEAR.some((item) => item.id === "host-nh02"), false);
});

test("buying NH-02 debits once, persists, and unlocks her host rather than Buddy gear", () => {
  const before = saver();
  const item = MARKET_ITEMS.find((item) => item.id === "host-nh02");
  assert.equal(item.price, 5000);
  const result = purchaseMarketItem(before, item.id, saturday);
  assert.match(result.message, /HOST switch/);
  const bought = JSON.parse(JSON.stringify(result.adventure));
  const wallet = marketWallet(bought);
  assert.equal(wallet.coins, 1000);
  assert.deepEqual(wallet.owned, [item.id]);
  assert.deepEqual(unlockedHostIds({ ownedItems: wallet.owned }), ["original", "nh02"]);
  assert.equal(getHostAvatar({ choice: "nh02", ownedItems: wallet.owned }), NH02_HOST_AVATAR);
  assert.equal(resolveHostId({ choice: "nh02" }), "original");
  assert.equal(purchaseMarketItem(bought, item.id, saturday).adventure, bought);
  assert.deepEqual(mergeMarket(bought.market, before.market, before.fishCollection), bought.market);
});

test("NH-02 cannot be purchased out of rotation, on closed days, or without enough gold", () => {
  const before = saver();
  for (const date of [wednesday, new Date("2026-10-16T16:00:00Z")]) {
    assert.equal(purchaseMarketItem(before, "host-nh02", date).adventure, before);
    const forged = { ...before.market, purchases: { "host-nh02": date.toISOString() } };
    assert.deepEqual(normalizeMarket(forged, before.fishCollection).purchases, {});
  }
  const poor = { fishCollection: { "token-chest": 499 }, market: { rewards: Array(499).fill(10), purchases: {} } };
  assert.equal(purchaseMarketItem(poor, "host-nh02", saturday).adventure, poor);
});

test("NH-02's shipped model contains a bound Joy expression and a portrait", { skip: !hostAssetsAvailable }, () => {
  const host = hostById("nh02");
  const model = readHostAsset(host.id);
  assert.equal(model.readUInt32LE(0), 0x46546c67);
  const data = JSON.parse(model.subarray(20, 20 + model.readUInt32LE(12)).toString());
  const joy = data.extensions.VRM.blendShapeMaster.blendShapeGroups.find((group) => group.presetName === "joy");
  assert.ok(joy.binds.length > 0);
  assert.ok(readFileSync(new URL(`../public${host.portrait}`, import.meta.url)).length > 0);
});

test("Kiyosa purchases persist and owning her unlocks only her host", () => {
  const before = saver();
  assert.equal(marketCarries("host-kiyosa", wednesday), true);
  assert.equal(marketCarries("host-kiyosa", saturday), false);
  assert.equal(MARKET_GEAR.some((item) => item.id === "host-kiyosa"), false);
  assert.equal(MARKET_ITEMS.find((item) => item.id === "host-kiyosa").price, 5000);
  const bought = JSON.parse(JSON.stringify(purchaseMarketItem(before, "host-kiyosa", wednesday).adventure));
  const wallet = marketWallet(bought);
  assert.equal(wallet.coins, 1000);
  assert.deepEqual(wallet.owned, ["host-kiyosa"]);
  assert.deepEqual(unlockedHostIds({ ownedItems: wallet.owned }), ["original", "kiyosa"]);
  assert.equal(getHostAvatar({ choice: "kiyosa", ownedItems: wallet.owned }), KIYOSA_HOST_AVATAR);
  assert.equal(resolveHostId({ choice: "kiyosa" }), "original");
  assert.equal(purchaseMarketItem(bought, "host-kiyosa", wednesday).adventure, bought);
  assert.deepEqual(mergeMarket(bought.market, before.market, before.fishCollection), bought.market);
  for (const date of [saturday, new Date("2026-10-13T16:00:00Z")]) {
    assert.equal(purchaseMarketItem(before, "host-kiyosa", date).adventure, before);
    assert.deepEqual(normalizeMarket({ ...before.market, purchases: { "host-kiyosa": date.toISOString() } }, before.fishCollection).purchases, {});
  }
  assert.equal(purchaseMarketItem({ ...before, market: { rewards: [], purchases: {} } }, "host-kiyosa", wednesday).message.startsWith("You need"), true);
});

test("Kiyosa ships her happy preset, valid expression bindings, and a portrait", { skip: !hostAssetsAvailable }, () => {
  const host = hostById("kiyosa");
  assert.equal(host.id, "kiyosa");
  const model = readHostAsset(host.id);
  assert.ok(model.length < 19 * 1048576, "Kiyosa stays close to the other hosts' download sizes");
  const data = JSON.parse(model.subarray(20, 20 + model.readUInt32LE(12)).toString());
  const groups = data.extensions.VRM.blendShapeMaster.blendShapeGroups;
  assert.deepEqual(groups.filter((group) => group.presetName !== "unknown").map((group) => group.presetName).sort(), ["joy", "neutral"]);
  assert.deepEqual(groups.filter((group) => group.presetName === "unknown").map((group) => group.name), ["Swimsuit&Ring"]);
  const summer = groups.find((group) => group.name === "Swimsuit&Ring");
  for (const [name, alpha] of [["KiyosaSwimsuit", 1], ["KiyosaSwimsuitRing", 1], ["KiyosaBodyHideArm", 1], ["KiyosaTop", 0], ["KiyosaBottom", 0]]) {
    assert.equal(summer.materialValues.find((bind) => bind.materialName === name)?.targetValue[3], alpha);
  }
  assert.equal(data.meshes.some((mesh) => /^LongSleeves[LR]/.test(mesh.name)), false);
  assert.ok(data.meshes.some((mesh) => mesh.name === "HandL.baked"));
  assert.ok(data.meshes.some((mesh) => mesh.name === "HandR.baked"));
  for (const [name, alpha] of [
    ["KiyosaBodyHandL", 1], ["KiyosaBodyHandR", 1],
    ["KiyosaBodyHandPoseL", 0], ["KiyosaBodyHandPoseR", 0]
  ]) {
    assert.equal(data.materials.find((material) => material.name === name)?.pbrMetallicRoughness?.baseColorFactor[3], alpha, `${name} glTF visibility`);
    assert.equal(data.extensions.VRM.materialProperties.find((material) => material.name === name)?.vectorProperties?._Color[3], alpha, `${name} MToon visibility`);
  }
  assert.ok(groups.find((group) => group.presetName === "joy")?.binds.length > 0);
  for (const group of groups) for (const bind of group.binds || []) {
    assert.ok(data.meshes[bind.mesh].primitives.every((primitive) => primitive.targets[bind.index]), `${group.name} retains its morph target`);
  }
  assert.ok(readFileSync(new URL(`../public${host.portrait}`, import.meta.url)).length > 0);
});

test("legacy host receipts survive rotation changes but new out-of-stock receipts are rejected", () => {
  const before = saver();
  for (const [id, timestamp] of [
    ["host-komoe", "2026-10-17T16:00:00Z"],
    ["host-nh02", "2026-10-10T16:00:00Z"],
    ["host-kiyosa", "2026-10-14T16:00:00Z"]
  ]) {
    const receipts = { ...before.market, purchases: { [id]: timestamp } };
    assert.deepEqual(normalizeMarket(receipts, before.fishCollection).purchases, receipts.purchases);
    assert.deepEqual(mergeMarket(receipts, before.market, before.fishCollection).purchases, receipts.purchases);
  }
  for (const id of ["host-komoe", "host-nh02"]) {
    const receipts = { ...before.market, purchases: { [id]: wednesday.toISOString() } };
    assert.deepEqual(normalizeMarket(receipts, before.fishCollection).purchases, {});
    assert.equal(purchaseMarketItem(before, id, wednesday).adventure, before);
  }
});
