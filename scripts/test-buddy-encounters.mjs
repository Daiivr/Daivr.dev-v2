import assert from "node:assert/strict";
import { test } from "node:test";
import { encounterPlacement, rareFishingEncounter } from "../shared/buddy-encounters.mjs";
import { reconcileProgression, secretBadges } from "../server/player-progression.mjs";

test("sea creatures stay inside the stage and turn toward Buddy on either side", () => {
  for (const width of [160, 320, 390, 768, 1400, 2000]) for (const buddy of [12, width / 2, width - 80]) {
    const scene = encounterPlacement(width, buddy);
    assert.ok(scene.left >= 0);
    assert.ok(scene.left + scene.width <= width);
    assert.equal(scene.facesLeft, buddy + 36 < scene.left + scene.width / 2);
  }
});
test("rare fishing separates the two sightings from normal catches", () => {
  assert.equal(rareFishingEncounter(() => 0), "leviathan");
  assert.equal(rareFishingEncounter(() => .02499), "leviathan");
  assert.equal(rareFishingEncounter(() => .025), "kraken");
  assert.equal(rareFishingEncounter(() => .04999), "kraken");
  assert.equal(rareFishingEncounter(() => .05), "");
  assert.equal(rareFishingEncounter(() => .99), "");
});
test("Kraken badge stays hidden until sighted and awards XP once independently of Leviathan", () => {
  assert.ok(!secretBadges({ leviathanSightings: 25 }).some(b => b.id === "kraken-witness"));
  const badges = secretBadges({ krakenSightings: 1 });
  assert.deepEqual(badges.map(b => b.id), ["kraken-witness"]);
  assert.ok(badges[0].secret && badges[0].earned);
  const first = reconcileProgression({}, badges);
  assert.equal(first.progression.totalXp, 600);
  const again = reconcileProgression(first.saved, secretBadges({ krakenSightings: 10 }));
  assert.equal(again.progression.totalXp, 600);
  assert.equal(again.newBadges.length, 0);
});
