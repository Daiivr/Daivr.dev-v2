// Durations grow with distance so a long trip never turns into a sprint.
export const WALK_SPEED_PX_S = 36;

export function walkDuration(distance, speed = WALK_SPEED_PX_S) {
  return Math.abs(distance) / speed * 1000;
}
