import test from "node:test";
import assert from "node:assert/strict";
import { getHostAvailability, observeAvatarVisibility } from "../src/lib/gateHost.js";

const desktop = { compact: false, buddyAwake: false, cabinetReady: true, hostStage: "loading", hostOverdue: false };

test("slow or failed hosts unlock the gate without starting their speech", () => {
  for (const hostStage of ["loading", "arriving", "error"]) {
    assert.deepEqual(getHostAvailability({ ...desktop, hostOverdue: true, hostStage }), { present: false, canProceed: true });
  }
  assert.deepEqual(getHostAvailability({ ...desktop, hostStage: "error" }), { present: false, canProceed: true });
  assert.deepEqual(getHostAvailability(desktop), { present: false, canProceed: false });
});

test("visible greetings and the compact Buddy still allow speech and entry", () => {
  for (const hostStage of ["greeting", "waving"]) {
    assert.deepEqual(getHostAvailability({ ...desktop, hostStage }), { present: true, canProceed: true });
  }
  assert.deepEqual(getHostAvailability({ ...desktop, compact: true, hostOverdue: true }), { present: false, canProceed: false });
  assert.deepEqual(getHostAvailability({ ...desktop, compact: true, buddyAwake: true }), { present: true, canProceed: true });
});

function preview({ hidden = false, opacity = "0" } = {}) {
  const frames = new Map();
  const events = new Map();
  const changes = [];
  let nextId = 0;
  const style = { opacity, display: "block", visibility: "visible" };
  const bounds = { width: 600, height: 700 };
  const canvas = { getBoundingClientRect: () => bounds };
  const doc = {
    visibilityState: hidden ? "hidden" : "visible",
    defaultView: {
      getComputedStyle: () => style,
      requestAnimationFrame: callback => { frames.set(++nextId, callback); return nextId; },
      cancelAnimationFrame: id => frames.delete(id)
    },
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: name => events.delete(name)
  };
  const stop = observeAvatarVisibility({ ownerDocument: doc, querySelector: () => canvas }, value => changes.push(value));
  return {
    changes, style, bounds, frames, events, stop,
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    hide(hidden) { doc.visibilityState = hidden ? "hidden" : "visible"; events.get("visibilitychange")?.(); }
  };
}

test("a minimized page cannot report a visible avatar, even with completed loading", () => {
  const page = preview({ hidden: true, opacity: "1" });
  assert.equal(page.frames.size, 0);
  page.frame();
  assert.deepEqual(page.changes, [false]);
  page.hide(false);
  page.frame();
  assert.equal(page.changes.at(-1), false);
  page.frame();
  assert.equal(page.changes.at(-1), true);
  page.stop();
});

test("speech waits through the avatar fade and an intervening paint", () => {
  const page = preview();
  page.frame();
  page.style.opacity = ".6";
  page.frame();
  assert.deepEqual(page.changes, [false]);
  page.style.opacity = "1";
  page.frame();
  assert.equal(page.changes.at(-1), false);
  page.frame();
  assert.equal(page.changes.at(-1), true);
  assert.equal(page.frames.size, 0);
  page.stop();
});

test("restoring a previously visible host requires fresh foreground frames", () => {
  const page = preview({ opacity: "1" });
  page.frame(); page.frame();
  page.hide(true);
  assert.equal(page.changes.at(-1), false);
  assert.equal(page.frames.size, 0);
  page.hide(false);
  page.frame();
  page.hide(true); // Minimized again before the next paint.
  page.hide(false);
  page.frame();
  assert.equal(page.changes.at(-1), false);
  page.frame();
  assert.equal(page.changes.at(-1), true);
  page.stop();
});

test("a collapsed canvas and an unmounted scene cannot trigger speech", () => {
  const page = preview({ opacity: "1" });
  page.bounds.width = 0;
  page.frame(); page.frame();
  assert.deepEqual(page.changes, [false]);
  const queued = [...page.frames.values()];
  page.stop();
  queued.forEach(callback => callback());
  assert.deepEqual(page.changes, [false]);
  assert.equal(page.frames.size, 0);
  assert.equal(page.events.size, 0);
});
