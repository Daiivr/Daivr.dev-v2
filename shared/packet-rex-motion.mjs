export function packetRexGeometry(width, height) {
  const groundY = height - Math.max(27, height * 0.14);
  return {
    groundY,
    dinoScale: Math.min(1.9, width / 155, groundY * 0.44 / 47),
    obstacleScale: Math.min(1, height / 250)
  };
}

// Choose an arc that clears the whole obstacle, not just its leading edge.
// A smaller canvas lowers gravity when necessary instead of clipping the jump.
export function packetRexJump({ clearance, headroom, obstacleWidth, bodyWidth, speed, gravity = 980 }) {
  if (headroom <= clearance || speed <= 0) return null;
  const traversal = (obstacleWidth + bodyWidth) / speed;
  const peak = Math.min(headroom, clearance + Math.max(12, clearance * 0.4));
  const jumpGravity = Math.min(gravity, 8 * (peak - clearance) / (traversal + 0.1) ** 2);
  const velocity = Math.sqrt(2 * jumpGravity * peak);
  const riseTime = (velocity - Math.sqrt(velocity ** 2 - 2 * jumpGravity * clearance)) / jumpGravity;
  return { gravity: jumpGravity, velocity, riseTime, peak };
}
