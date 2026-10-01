import assert from 'node:assert/strict';
import { test } from 'node:test';
import { krakenPose } from '../shared/kraken-motion.mjs';

test('Kraken grips hold the edge while the mantle and free tentacles move', () => {
  const first = krakenPose('monster', 4, 4);
  const second = krakenPose('monster', 7, 7);
  assert.equal(first.arms.length, 8);
  assert.notEqual(first.arms[0].outline, second.arms[0].outline);
  assert.notDeepEqual(first.head, second.head);
  assert.deepEqual(first.arms[6].tip, second.arms[6].tip);
  assert.deepEqual(first.arms[7].tip, second.arms[7].tip);
  assert.deepEqual(second.arms[6].root, [159 + second.head.x, 108 + second.head.y]);
});

test('Arrival starts submerged, grips take hold, and retreat releases them', () => {
  const omen = krakenPose('omen', 0, 0);
  const attached = krakenPose('omen', 5.5, 5.5);
  const rising = krakenPose('monster', 0, 5.5);
  const leaving = krakenPose('retreat', 0, 12);
  assert.equal(omen.head.y, 112);
  assert.ok(omen.arms[6].tip[1] > attached.arms[6].tip[1]);
  assert.deepEqual(attached.arms[6].tip, rising.arms[6].tip);
  assert.equal(rising.head.y, attached.head.y);
  assert.ok(Math.abs(leaving.head.y) <= 2);
  assert.ok(krakenPose('retreat', 3.5, 15.5).arms[6].tip[1] > leaving.arms[6].tip[1]);
});

test('Reduced motion remains still and every phase produces finite artwork', () => {
  assert.deepEqual(krakenPose('monster', 0, 0, '', true), krakenPose('monster', 10, 10, '', true));
  for (const phase of ['omen', 'monster', 'retreat']) for (const t of [0, .5, 2, 4, 8]) {
    for (const arm of krakenPose(phase, t, t).arms) {
      assert.ok(!/NaN|Infinity/.test(arm.outline + arm.cups));
      assert.ok(arm.outline.endsWith('Z'));
    }
  }
});
