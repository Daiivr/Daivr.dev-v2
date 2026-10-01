// Coordinates are pixels within the wildlife layer; time is in seconds.
export function fishArc({ startX, waterY, drift, height, duration }, time) {
  const p = Math.max(0, Math.min(1, time / duration));
  return { x: startX + drift * p, y: waterY - 4 * height * p * (1 - p), vx: drift / duration, vy: 4 * height * (2 * p - 1) / duration };
}

// Sweep relative to Buddy's movement so neither a quick fish nor a moving
// Buddy can tunnel through the other between animation frames.
export function fishContact(from, to, previousBody, body, radiusX = 12, radiusY = 7) {
  if (!body || !previousBody) return null;
  const center = (rect) => ({ x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 });
  const a = center(previousBody), b = center(body);
  const start = { x: from.x - a.x, y: from.y - a.y };
  const end = { x: to.x - b.x, y: to.y - b.y };
  const half = { x: (body.right - body.left) / 2 + radiusX, y: (body.bottom - body.top) / 2 + radiusY };
  let enter = 0, leave = 1;
  for (const axis of ["x", "y"]) {
    const delta = end[axis] - start[axis];
    if (Math.abs(delta) < 1e-8) {
      if (Math.abs(start[axis]) > half[axis]) return null;
      continue;
    }
    const t1 = (-half[axis] - start[axis]) / delta;
    const t2 = (half[axis] - start[axis]) / delta;
    enter = Math.max(enter, Math.min(t1, t2));
    leave = Math.min(leave, Math.max(t1, t2));
    if (enter > leave) return null;
  }
  return { progress: enter, x: from.x + (to.x - from.x) * enter, y: from.y + (to.y - from.y) * enter };
}

export function fishRebound(contact, velocity, waterY) {
  const gravity = 440;
  const vx = -velocity.vx * .55;
  const vy = -Math.max(48, Math.abs(velocity.vy) * .35);
  const duration = (-vy + Math.sqrt(vy * vy + 2 * gravity * Math.max(0, waterY - contact.y))) / gravity;
  return { x: contact.x, y: contact.y, vx, vy, gravity, duration };
}

export function reboundPoint(bounce, time) {
  return { x: bounce.x + bounce.vx * time, y: bounce.y + bounce.vy * time + .5 * bounce.gravity * time * time, vx: bounce.vx, vy: bounce.vy + bounce.gravity * time };
}
