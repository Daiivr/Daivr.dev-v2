import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { CROPS, growth, ripeAt, harvestCrop, marketWallet, plantSeed, purchaseSeed, sellCrops } from "../shared/buddy-market.mjs";
import { WATER_RETENTION_MS, isCropWatered, normalizeWatered, wetGardenPlots } from "../shared/buddy-garden-water.mjs";

const HOUR = 3600000;
const planted = "2026-10-01T12:00:00Z";
const start = Date.parse(planted);

test("new and existing crops mature in 6, 12, 18 and 24 hours", () => {
  assert.deepEqual(CROPS.map((crop) => crop.hours), [6, 12, 18, 24]);
  for (const crop of CROPS) {
    const seed = { id: `seed-${crop.id}`, crop: crop.id, planted, at: planted, plot: 0 };
    assert.equal(ripeAt(seed), start + crop.hours * HOUR);
    assert.equal(growth(seed, start + crop.hours * HOUR / 2), 0.5);
    assert.equal(growth(seed, start + crop.hours * HOUR), 1);
    assert.equal(growth(seed, start + 80 * HOUR), 1, "old plants become harvestable without resetting their clock");
  }
});

test("Friday can contain multiple radish batches without changing sale prices or sale days", () => {
  let adventure = { forageFound: 60, fishCollection: {}, market: {} };
  const friday = Date.parse("2026-10-09T04:05:00Z"); // 00:05 New York
  for (let batch = 0; batch < 3; batch++) {
    const at = new Date(friday + batch * 6 * HOUR);
    adventure = purchaseSeed(adventure, "radish", at).adventure;
    const result = plantSeed(adventure, "radish", at);
    assert.match(result.message, /6 hours/);
    adventure = harvestCrop(result.adventure, result.seed.id, new Date(at.getTime() + 6 * HOUR)).adventure;
  }
  assert.equal(marketWallet(adventure).basket.radish, 3);
  const sold = sellCrops(adventure, null, new Date(friday + 19 * HOUR));
  assert.equal(sold.value, 24);
  assert.match(sellCrops(adventure, null, new Date("2026-10-10T16:00:00Z")).message, /Friday/);
});

test("soil dries after 15 minutes and can be watered repeatedly across midnight", () => {
  const midnight = Date.parse("2026-10-02T00:00:00Z");
  const watered = new Map([["plant", midnight - 5 * 60000]]);
  assert.equal(WATER_RETENTION_MS, 15 * 60000);
  assert.equal(isCropWatered(watered, "plant", midnight), true);
  assert.equal(isCropWatered(watered, "plant", midnight + 10 * 60000), false);
  for (let round = 0; round < 10; round++) {
    const at = midnight + round * WATER_RETENTION_MS;
    watered.set("plant", at);
    assert.equal(isCropWatered(watered, "plant", at + WATER_RETENTION_MS - 1), true);
    assert.equal(isCropWatered(watered, "plant", at + WATER_RETENTION_MS), false);
  }
});

test("replanted and neighboring crops do not inherit another plant's moisture", () => {
  const watered = new Map([["old-seed", start]]);
  assert.deepEqual([...wetGardenPlots([{ plot: 0, seedId: "old-seed" }, { plot: 1, seedId: "new-seed" }, null], watered, start)], [0]);
  assert.equal(wetGardenPlots([{ plot: 0, seedId: "new-seed" }], watered, start).size, 0);
});

test("reload preserves fresh moisture and rejects expired, legacy and invalid records", () => {
  const saved = { version: 2, watered: [["fresh", start], ["expired", start - WATER_RETENTION_MS], ["future", start + 1]] };
  assert.deepEqual([...normalizeWatered(JSON.parse(JSON.stringify(saved)), start)], [["fresh", start]]);
  assert.equal(normalizeWatered({ day: 123, watered: [0, 1, 2] }, start).size, 0);
  assert.equal(normalizeWatered({ version: 2, watered: [null, ["bad", "123"], ["", start]] }, start).size, 0);
});

// Run FooterWorld's actual watering handlers without mounting its canvas.
const source = readFileSync(new URL("../src/components/FooterWorld.jsx", import.meta.url), "utf8");
const handlers = source.slice(source.indexOf("    let watered = readWatered()"), source.indexOf("    const onGardenPick ="));
test("footer rain, dry-out and watering events update the correct planted seed", () => {
  let now = start, raining = false, stored = new Map(), latestWet;
  const announcements = [], seeds = [{ id: "plant-a", crop: "radish", planted, at: planted }];
  const context = {
    propsRef: { current: { garden: seeds } }, gardenDirtyRef: { current: true }, ART: 2,
    Date: { now: () => now }, growth, isCropWatered, wetGardenPlots,
    readWatered: () => new Map(stored), saveWatered: (value) => { stored = new Map(value); },
    world: { raining: () => raining, setGarden: (_plants, wet) => { latestWet = wet; }, layout: { garden: { plots: [10, 20, 30] } } },
    window: { dispatchEvent: (event) => announcements.push(event.detail) },
    CustomEvent: class { constructor(_name, options) { this.detail = options.detail; } }
  };
  const api = vm.runInNewContext(`${handlers}\n({refreshGarden, announceGarden, onGardenWater});`, context);
  const announce = () => { context.gardenDirtyRef.current = true; api.announceGarden(now); return announcements.at(-1).plots[0]; };
  assert.equal(announce().thirsty, true);
  api.onGardenWater({ detail: { plot: 0, seedId: "plant-a" } });
  assert.equal(announce().thirsty, false);
  now += WATER_RETENTION_MS;
  assert.equal(announce().thirsty, true);
  raining = true;
  assert.equal(announce().thirsty, false);
  assert.equal(latestWet.length, 1);
  raining = false;
  seeds[0] = { ...seeds[0], id: "plant-b", planted: new Date(now).toISOString() };
  assert.equal(announce().thirsty, true);
  api.onGardenWater({ detail: { plot: 0, seedId: "plant-a" } });
  assert.equal(announce().thirsty, true, "a stale pour cannot water a replacement crop");
  api.onGardenWater({ detail: { plot: 0, seedId: "plant-b" } });
  assert.equal(announce().thirsty, false);
  now += 6 * HOUR;
  assert.equal(announce().ripe, true);
  assert.equal(announce().thirsty, false, "ripe plants need harvesting rather than water");
});
