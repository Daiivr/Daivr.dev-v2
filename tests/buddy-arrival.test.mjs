import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { chooseBuddyArrival, PORTAL_WALK_MS, startPortalJourney } from "../shared/buddy-arrival.mjs";

function harness(reducedMotion = false) {
  const pending = new Map(), phases = [], delays = [];
  let id = 0, done = 0, departed = 0;
  const journey = startPortalJourney({
    reducedMotion, onPhase: (phase) => phases.push(phase), onDone: () => done++,
    onDeparted: () => { assert.equal(phases.at(-1), "waiting"); departed++; },
    schedule(fn, delay) { delays.push(delay); pending.set(++id, fn); return id; },
    cancel(timer) { pending.delete(timer); }
  });
  return { journey, phases, delays, pending, get done() { return done; }, get departed() { return departed; },
    next() { const [key, fn] = pending.entries().next().value || []; assert.ok(fn, "a transition is scheduled"); pending.delete(key); fn(); }
  };
}

test("portal selection is exactly 5%, with one roll per launch", () => {
  let count = 0;
  for (let i = 0; i < 10000; i++) if (chooseBuddyArrival(() => i / 10000) === "portal") count++;
  assert.equal(count, 500);
  assert.equal(chooseBuddyArrival(() => 0.05), "parachute");
  let rolls = 0;
  chooseBuddyArrival(() => { rolls++; return 0; });
  assert.equal(rolls, 1);
});

test("departure completes only after Buddy enters and the first portal closes", () => {
  for (const reducedMotion of [false, true]) {
    const h = harness(reducedMotion);
    assert.equal(h.departed, 0);
    h.next();
    assert.equal(h.departed, 0, "opening the portal does not open the splash");
    h.next();
    assert.equal(h.departed, 0, "the portal is still closing");
    h.next();
    assert.equal(h.departed, 1);
    assert.equal(h.phases.at(-1), "waiting");
    h.journey.setPageReady(true);
    h.journey.setFooterVisible(true);
    h.next(); h.next(); h.next();
    assert.equal(h.departed, 1, "the footer exit cannot reopen the splash");
  }
});

// Exercise the actual splash click handler with its browser/React boundaries
// stubbed, so a regression that opens the doors at launch is caught too.
const splashSource = readFileSync(new URL("../src/components/EntrySplash.jsx", import.meta.url), "utf8");
const enterHandler = splashSource.slice(splashSource.indexOf("  const requestEnter = useCallback("), splashSource.indexOf("\n  useEffect(() => {\n    function enterOnKey"));
function splashHarness(mode, compact = true, reducedMotion = false) {
  const timers = new Map(), events = [], launches = [], state = {};
  let id = 0, entered = 0;
  const context = {
    canEnter: true, enteringRef: { current: false }, typeTimerRef: { current: 0 }, openTimerRef: { current: 0 }, portalDepartedRef: { current: null },
    compact, reducedMotion, GATE_OPEN_MS: 1200, GATE_UNLOCK_MS: 500,
    chooseBuddyArrival: () => mode, useCallback: (fn) => fn,
    setUnlocking: (value) => { state.unlocking = value; }, setOpening: (value) => { state.opening = value; }, setBuddyLaunched: (value) => { state.launched = value; },
    onBuddyLaunch: (value) => launches.push(value), onEnter: () => entered++,
    perchRef: { current: { getBoundingClientRect: () => ({ width: 72, height: 80, left: 250, top: 200 }) } }, hostRef: { current: null },
    CustomEvent: class { constructor(type) { this.type = type; } },
    window: { clearInterval() {}, clearTimeout: (key) => timers.delete(key), setTimeout: (fn) => { timers.set(++id, fn); return id; }, dispatchEvent: (event) => events.push(event.type) }
  };
  const enter = vm.runInNewContext(`${enterHandler}\nrequestEnter;`, context);
  return { enter, context, state, events, launches, timers, get entered() { return entered; }, next() { const [key, fn] = timers.entries().next().value; timers.delete(key); fn(); } };
}

test("the splash stays closed until portal completion on desktop, compact and reduced motion", () => {
  for (const [compact, reducedMotion] of [[false, false], [true, false], [false, true]]) {
    const h = splashHarness("portal", compact, reducedMotion);
    h.enter(); h.enter();
    if (!compact && !reducedMotion) h.next();
    assert.equal(h.launches.length, 1);
    assert.equal(h.state.launched, true, "perched Buddy is replaced while the gate remains closed");
    assert.ok(!h.state.opening);
    assert.equal(h.events.length, 0);
    assert.equal(h.timers.size, 0, "no independent splash timer can cut off the entrance");
    h.launches[0].onDeparted();
    assert.equal(h.state.opening, true);
    assert.deepEqual(h.events, ["daivr-splash-enter"]);
    h.launches[0].onDeparted();
    assert.equal(h.timers.size, 1, "completion is consumed once");
    h.next();
    assert.equal(h.entered, 1);
  }
});

test("parachute entry still opens immediately, and unmounted splash ignores portal completion", () => {
  const normal = splashHarness("parachute");
  normal.enter();
  assert.equal(normal.state.opening, true);
  normal.next();
  assert.equal(normal.entered, 1);
  const portal = splashHarness("portal");
  portal.enter();
  portal.context.portalDepartedRef.current = null;
  portal.launches[0].onDeparted();
  assert.equal(portal.events.length, 0);
  assert.equal(portal.timers.size, 0);
});

test("Buddy waits for the visible footer, even after a long absence", () => {
  const h = harness();
  h.journey.setPageReady(true);
  h.next(); h.next(); h.next();
  assert.equal(h.phases.at(-1), "waiting");
  assert.equal(h.pending.size, 0, "waiting has no timeout that could reveal Buddy early");
  h.journey.setFooterVisible(true);
  assert.equal(h.phases.at(-1), "arrive-open");
  h.journey.setFooterVisible(true);
  h.next(); h.next(); h.next();
  assert.equal(h.done, 1);
  h.journey.setFooterVisible(false);
  h.journey.setFooterVisible(true);
  assert.equal(h.pending.size, 0, "scrolling back does not replay the exit");
});

test("early scrolling cannot skip the entrance or reveal the exit behind the splash", () => {
  const h = harness();
  h.journey.setFooterVisible(true);
  assert.equal(h.phases.at(-1), "depart-open");
  h.next(); h.next(); h.next();
  assert.equal(h.phases.at(-1), "waiting");
  h.journey.setPageReady(true);
  assert.equal(h.phases.at(-1), "arrive-open");
  assert.equal(84 / (PORTAL_WALK_MS / 1000), 36);
});

test("leaving the footer before departure finishes keeps the exit pending", () => {
  const h = harness();
  h.journey.setPageReady(true);
  h.journey.setFooterVisible(true);
  h.journey.setFooterVisible(false);
  h.next(); h.next(); h.next();
  assert.equal(h.phases.at(-1), "waiting");
});

test("unmount cancels every stage and a fresh mount can finish once", () => {
  for (let stopAt = 0; stopAt < 6; stopAt++) {
    const h = harness();
    h.journey.setPageReady(true);
    h.journey.setFooterVisible(true);
    for (let i = 0; i < stopAt; i++) h.next();
    h.journey.dispose();
    h.journey.setFooterVisible(true);
    assert.equal(h.pending.size, 0);
    assert.equal(h.done, 0);
  }
  const h = harness();
  h.journey.setPageReady(true);
  h.journey.setFooterVisible(true);
  for (let i = 0; i < 6; i++) h.next();
  assert.equal(h.done, 1);
});

test("reduced motion keeps the visibility gate and uses short transitions", () => {
  const h = harness(true);
  h.journey.setPageReady(true);
  h.next(); h.next(); h.next();
  assert.equal(h.phases.at(-1), "waiting");
  h.journey.setFooterVisible(true);
  h.next(); h.next(); h.next();
  assert.equal(h.done, 1);
  assert.ok(h.delays.every((delay) => delay === 120));
});
