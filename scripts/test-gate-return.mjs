import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { consumeGateReturn, recordGateReturn } from "../src/lib/gateReturn.js";

const storage = new Map();
beforeEach(() => {
  storage.clear();
  globalThis.window = { sessionStorage: {
    setItem: (key, value) => storage.set(key, value),
    getItem: (key) => storage.get(key) ?? null,
    removeItem: (key) => storage.delete(key),
  } };
});

test("Fallout return is consumed once and normal reloads have no return context", () => {
  recordGateReturn("fallout", "/fallout");
  assert.deepEqual(consumeGateReturn(), { variant: "fallout", path: "/fallout" });
  assert.equal(consumeGateReturn(), null);
});

test("existing missing and denied route greetings retain their context", () => {
  for (const variant of ["missing", "denied"]) {
    recordGateReturn(variant, "/some-route?discard=query");
    assert.deepEqual(consumeGateReturn(), { variant, path: "/some-route" });
  }
});

test("stale and unrecognized return notes cannot trigger the greeting", () => {
  for (const note of [
    { variant: "fallout", path: "/fallout", at: Date.now() - 11 * 60_000 },
    { variant: "unknown", path: "/fallout", at: Date.now() },
  ]) {
    storage.set("daivr.gateReturn.v1", JSON.stringify(note));
    assert.equal(consumeGateReturn(), null);
    assert.equal(storage.size, 0);
  }
});

test("restricted session storage preserves the normal splash", () => {
  window.sessionStorage = {
    setItem() { throw new Error("Blocked"); },
    getItem() { throw new Error("Blocked"); },
  };
  assert.doesNotThrow(() => recordGateReturn("fallout", "/fallout"));
  assert.equal(consumeGateReturn(), null);
});
