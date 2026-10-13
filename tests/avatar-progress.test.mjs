import test from "node:test";
import assert from "node:assert/strict";
import { advanceAvatarProgress, avatarDownloadProgress } from "../src/lib/avatarProgress.js";

test("download byte estimates cannot spill into GPU preparation", () => {
  assert.equal(avatarDownloadProgress({ lengthComputable: true, loaded: 50, total: 100 }), 41);
  assert.equal(avatarDownloadProgress({ lengthComputable: true, loaded: 160, total: 100 }), 82);
  for (const total of [0, NaN, Infinity]) {
    assert.equal(avatarDownloadProgress({ lengthComputable: true, loaded: 50, total }), null);
  }
  assert.equal(avatarDownloadProgress({ lengthComputable: false, loaded: 50, total: 100 }), null);
});

test("delayed and repeated reports cannot move a host's percentage backward", () => {
  let progress = 0;
  const values = [12, 70, 82, 85, 82, 90, 94, 89, 98, 99, 100, 98];
  assert.deepEqual(values.map(value => (progress = advanceAvatarProgress(progress, value))),
    [12, 70, 82, 85, 85, 90, 94, 94, 98, 99, 100, 100]);
});

test("progress ignores invalid reports and a new scene gets an independent counter", () => {
  for (const value of [NaN, Infinity, undefined, -20]) assert.equal(advanceAvatarProgress(82, value), 82);
  assert.equal(advanceAvatarProgress(82, 150), 100);
  assert.equal(advanceAvatarProgress(-1, 4.4), 4);
});
