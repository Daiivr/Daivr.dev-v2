import assert from "node:assert/strict";
import { test } from "node:test";
import { FISHING_POOL_WIDTH, fishingSpot } from "../shared/buddy-fishing-spot.mjs";

test("portal and Buddy fit the footer and the hook lands at its center", () => {
  for (const width of [192, 280, 320, 390, 768, 1280, 2000]) {
    for (const miku of [false, true]) {
      for (const side of [0, .99]) for (const location of [0, .3, .7, 1]) {
        const values = [side, location];
        const spot = fishingSpot(width, { miku, random: () => values.shift() });
        assert.ok(spot);
        assert.ok(spot.portalX - FISHING_POOL_WIDTH / 2 >= 4);
        assert.ok(spot.portalX + FISHING_POOL_WIDTH / 2 <= width - 4);
        assert.ok(spot.target >= 12 && spot.target + 72 <= width - 12);
        const hook = (miku ? -12 : -26) + 5;
        assert.ok(Math.abs(spot.target + 4 + (spot.castLeft ? hook : 64 - hook) - spot.portalX) < 1e-8);
      }
    }
  }
});
test("a footer too narrow to contain the scene does not start fishing", () => {
  assert.equal(fishingSpot(80), null);
  assert.equal(fishingSpot(160), null);
});
