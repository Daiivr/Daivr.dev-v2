import assert from "node:assert/strict";
import { test } from "node:test";
import { packetRexGeometry, packetRexJump } from "../shared/packet-rex-motion.mjs";

test("Rex clears full obstacle widths without leaving compact or full-height monitors", () => {
  for (const [width, height] of [[280, 150], [300, 230], [450, 280], [800, 280]]) {
    const geometry = packetRexGeometry(width, height);
    const bodyWidth = 44 * geometry.dinoScale * 0.52;
    const headroom = geometry.groundY - 47 * geometry.dinoScale - 6;
    for (const acceleration of [1, 1.52]) {
      const speed = Math.max(82, width * 0.33) * acceleration;
      for (const [obstacleWidth, clearance] of [
        [19 * geometry.obstacleScale, 37 * geometry.obstacleScale + 6],
        [29 * geometry.obstacleScale, 45 * geometry.obstacleScale + 6],
        [22, 43] // Highest low drone, including its safety margin.
      ]) {
        const plan = packetRexJump({ clearance, headroom, obstacleWidth, bodyWidth, speed });
        assert.ok(plan);
        assert.ok(plan.peak <= headroom);
        const traversal = (obstacleWidth + bodyWidth) / speed;
        // Include the earliest takeoff allowed at 30 FPS plus integration of that frame.
        for (const frameLead of [0, 1 / 60, 2 / 30]) {
          for (let portion = 0; portion <= 1; portion += 0.025) {
            const time = plan.riseTime + frameLead + traversal * portion;
            const lift = plan.velocity * time - 0.5 * plan.gravity * time ** 2;
            assert.ok(lift >= clearance - 1e-6, `${width}x${height}: lands before clearing obstacle`);
          }
        }
      }
    }
  }
});

test("desktop takeoff waits until the obstacle is nearby", () => {
  const { groundY, dinoScale } = packetRexGeometry(450, 280);
  const speed = 450 * .33;
  const plan = packetRexJump({ clearance: 51, headroom: groundY - 47 * dinoScale - 6, obstacleWidth: 29, bodyWidth: 44 * dinoScale * .52, speed });
  assert.ok((plan.riseTime + 1 / 30) * speed < 45);
  assert.equal(dinoScale, 1.9);
});

test("impossible clearances are rejected instead of clamped into an invalid jump", () => {
  assert.equal(packetRexJump({ clearance: 54, headroom: 40, obstacleWidth: 29, bodyWidth: 44, speed: 150 }), null);
});
