import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HOST_AVATAR, HOSTS, KOMOE_HOST_AVATAR, MIKU_HOST_AVATAR, getHostAvatar, hostById, readHostChoice, resolveHostId, unlockedHostIds, writeHostChoice } from "../src/lib/hostAvatar.js";

test("a selected host is saved and resolved again on the next visit", () => {
  const previousWindow = globalThis.window;
  const saved = new Map();
  globalThis.window = { localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } };
  try {
    writeHostChoice("miku");
    assert.equal(getHostAvatar({ choice: readHostChoice(), unlockedGear: ["miku-costume"] }), MIKU_HOST_AVATAR);
    writeHostChoice("original");
    assert.equal(getHostAvatar({ choice: readHostChoice(), unlockedGear: ["miku-costume"] }), DEFAULT_HOST_AVATAR);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("the original host is the default, whatever Buddy is wearing", () => {
  assert.equal(getHostAvatar(), DEFAULT_HOST_AVATAR);
  assert.equal(getHostAvatar({ unlockedGear: ["miku-wig"] }), DEFAULT_HOST_AVATAR);
  // El traje Miku puesto ya no trae a Miku a la puerta: solo la desbloquea.
  assert.equal(getHostAvatar({ unlockedGear: ["miku-wig", "miku-costume"] }), DEFAULT_HOST_AVATAR);
  assert.equal(getHostAvatar({ unlockedGear: ["miku-costume"], hiddenGear: ["miku-costume"] }), DEFAULT_HOST_AVATAR);
});

test("Miku and Komoe unlock separately; the original host is always available", () => {
  assert.deepEqual(unlockedHostIds(), ["original"]);
  assert.deepEqual(unlockedHostIds({ unlockedGear: ["miku-costume"] }), ["original", "miku"]);
  assert.deepEqual(unlockedHostIds({ ownedItems: ["host-komoe"] }), ["original", "komoe"]);
  assert.deepEqual(unlockedHostIds({ adminUnlock: true }), HOSTS.map((host) => host.id));
});

test("a saved choice wins while it stays unlocked, then the original takes over again", () => {
  const unlockedGear = ["miku-costume"];
  assert.equal(resolveHostId({ choice: "miku", unlockedGear }), "miku");
  assert.equal(getHostAvatar({ choice: "miku", unlockedGear }), MIKU_HOST_AVATAR);
  assert.equal(resolveHostId({ choice: "original", unlockedGear }), "original");
  assert.equal(resolveHostId({ choice: "komoe", ownedItems: ["host-komoe"] }), "komoe");
  assert.equal(getHostAvatar({ choice: "komoe", ownedItems: ["host-komoe"] }), KOMOE_HOST_AVATAR);
  // Sin desbloquear, la eleccion no cuenta.
  assert.equal(resolveHostId({ choice: "komoe", unlockedGear }), "original");
  assert.equal(resolveHostId({ choice: "miku" }), "original");
  assert.equal(hostById("nobody").id, "original");
});
