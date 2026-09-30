import assert from "node:assert/strict";
import { test } from "node:test";
import { BUDDY_ACTIVITIES, buddyActivityGate } from "../shared/buddy-activities.mjs";

test("activity requests preserve cooldowns and never interrupt an active event", () => {
  for (const activity of BUDDY_ACTIVITIES) {
    assert.equal(buddyActivityGate(activity.id), "");
    assert.match(buddyActivityGate(activity.id, { busy: "fishing" }), /finishing another/);
    assert.match(buddyActivityGate(activity.id, { remaining: 1001 }), /2s/);
    assert.equal(buddyActivityGate(activity.id, { remaining: 0 }), "");
    assert.equal(buddyActivityGate(activity.id, { remaining: -100 }), "");
    assert.ok(activity.cooldown > 0);
  }
  assert.match(buddyActivityGate("unknown"), /unavailable/);
});

test("reduced motion preserves a patrol option without launching animated activities", () => {
  assert.equal(buddyActivityGate("find", { reducedMotion: true }), "");
  for (const id of ["fish", "rain", "dance"]) assert.match(buddyActivityGate(id, { reducedMotion: true }), /reduced motion/);
});
