import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HOST_AVATAR, MIKU_HOST_AVATAR, getHostAvatar } from "../src/lib/hostAvatar.js";

test("the original host is used before the full Miku costume is unlocked", () => {
  assert.equal(getHostAvatar(), DEFAULT_HOST_AVATAR);
  assert.equal(getHostAvatar({ unlockedGear: ["miku-wig"] }), DEFAULT_HOST_AVATAR);
  assert.equal(getHostAvatar({ hiddenGear: ["miku-costume"] }), DEFAULT_HOST_AVATAR);
});

test("equipping and unequipping the unlocked costume switches the host both ways", () => {
  const unlockedGear = ["miku-wig", "miku-costume"];
  assert.equal(getHostAvatar({ unlockedGear }), MIKU_HOST_AVATAR);
  assert.equal(getHostAvatar({ unlockedGear, hiddenGear: ["miku-costume"] }), DEFAULT_HOST_AVATAR);
  assert.equal(getHostAvatar({ unlockedGear, hiddenGear: ["miku-wig"] }), MIKU_HOST_AVATAR);
});

test("removing the unlock restores the original host", () => {
  assert.equal(getHostAvatar({ unlockedGear: ["miku-costume"] }), MIKU_HOST_AVATAR);
  assert.equal(getHostAvatar({ unlockedGear: [] }), DEFAULT_HOST_AVATAR);
});
