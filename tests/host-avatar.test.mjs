import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HOST_AVATAR, HOSTS, KOMOE_HOST_AVATAR, MIKU_HOST_AVATAR, getHostAvatar, hostById, resolveHostId, unlockedHostIds } from "../src/lib/hostAvatar.js";

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
