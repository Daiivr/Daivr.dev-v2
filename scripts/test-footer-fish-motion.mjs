import assert from "node:assert/strict";
import { test } from "node:test";
import { fishArc, fishContact, fishRebound, reboundPoint } from "../shared/footer-fish-motion.mjs";

const body = { left: 90, right: 130, top: 35, bottom: 95 };

test("fish follows a continuous arc, peaks halfway and returns to its waterline", () => {
  for (const drift of [-140, 140]) {
    const flight = { startX: 200, waterY: 130, height: 70, drift, duration: 1.5 };
    const launch = fishArc(flight, 0), apex = fishArc(flight, .75), landing = fishArc(flight, 1.5);
    assert.equal(launch.x, 200);
    assert.equal(launch.y, landing.y);
    assert.equal(apex.y, 60);
    assert.equal(apex.vy, 0);
    assert.ok(launch.vy < 0 && landing.vy > 0);
    assert.equal(landing.x, 200 + drift);
    assert.deepEqual(fishArc(flight, 5), landing);
  }
});

test("swept contacts catch fast crossings from either side without waiting for the center", () => {
  for (const [from, to, contactX] of [[{ x: 20, y: 60 }, { x: 180, y: 60 }, 78], [{ x: 180, y: 60 }, { x: 20, y: 60 }, 142]]) {
    const contact = fishContact(from, to, body, body);
    assert.ok(contact);
    assert.equal(contact.x, contactX);
    assert.ok(contact.progress > 0 && contact.progress < 1);
  }
});

test("vertical near misses and absent Buddy never produce phantom impacts", () => {
  for (const y of [10, 110]) assert.equal(fishContact({ x: 20, y }, { x: 180, y }, body, body), null);
  assert.equal(fishContact({ x: 20, y: 60 }, { x: 180, y: 60 }, body, null), null);
});

test("Buddy moving into or away from the trajectory changes contact in the current frame", () => {
  const movedAway = { ...body, left: 200, right: 240 };
  assert.equal(fishContact({ x: 60, y: 60 }, { x: 90, y: 60 }, body, movedAway), null);
  const movedAcross = { ...body, left: 30, right: 70 };
  assert.ok(fishContact({ x: 60, y: 60 }, { x: 65, y: 60 }, body, movedAcross));
});

test("rebound begins at contact, reverses horizontal travel and lands exactly at the waterline", () => {
  for (const vx of [-120, 120]) {
    const hit = { x: 100, y: 55 };
    const bounce = fishRebound(hit, { vx, vy: 90 }, 130);
    assert.equal(reboundPoint(bounce, 0).x, hit.x);
    assert.equal(reboundPoint(bounce, 0).y, hit.y);
    assert.ok(bounce.vx * vx < 0);
    assert.ok(bounce.vy < 0);
    const end = reboundPoint(bounce, bounce.duration);
    assert.ok(Math.abs(end.y - 130) < 1e-8);
    assert.ok(end.vy > 0);
  }
});
