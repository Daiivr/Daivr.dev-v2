// The pool stays inside the footer; its surface meets the rod's hook.
export const FISHING_POOL_WIDTH = 128;
export const FISHING_POOL_HEIGHT = 18;
// The shallow surface sits on the walking rail, above the music ticker.
export const FISHING_WATER_OFFSET = 2;
// `avoid`: tramos [desde, hasta] (en px del escenario) donde no puede caer
// ninguna parte de la poza (el mercado y la hoguera).
export function fishingSpot(width, { miku = false, buddyX = null, random = Math.random, avoid = [] } = {}) {
  const bodyWidth = 64;
  const padding = 4;
  const hookInBody = (miku ? -12 : -26) + 5;
  const portalMargin = FISHING_POOL_WIDTH / 2 + 4;
  const choices = [true, false].map((castLeft) => {
    const hookOffset = padding + (castLeft ? hookInBody : bodyWidth - hookInBody);
    let min = Math.max(portalMargin, 12 + hookOffset);
    let max = Math.min(width - portalMargin, width - bodyWidth - padding * 2 - 12 + hookOffset);
    // Keep the approach and casting position on the same bank. buddyX is
    // Buddy's current left edge, not the destination of an unfinished walk.
    if (Number.isFinite(buddyX)) {
      const center = buddyX + bodyWidth / 2;
      if (castLeft) max = Math.min(max, center);
      else min = Math.max(min, center);
    }
    // Lo que queda libre al quitar cada tramo prohibido (ensanchado media poza).
    let segments = max >= min ? [[min, max]] : [];
    for (const [a, b] of avoid) {
      const cutLo = a - portalMargin, cutHi = b + portalMargin;
      segments = segments.flatMap(([lo, hi]) => (cutHi < lo || cutLo > hi ? [[lo, hi]] : [[lo, Math.min(hi, cutLo)], [Math.max(lo, cutHi), hi]].filter(([x, y]) => y >= x)));
    }
    return { castLeft, hookOffset, segments };
  }).filter(({ segments }) => segments.length);
  if (!choices.length) return null;
  const choice = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  const total = choice.segments.reduce((sum, [lo, hi]) => sum + hi - lo, 0);
  let left = random() * total, portalX = choice.segments[0][0];
  for (const [lo, hi] of choice.segments) {
    if (left <= hi - lo) { portalX = lo + left; break; }
    left -= hi - lo;
    portalX = hi;
  }
  return { portalX, target: portalX - choice.hookOffset, castLeft: choice.castLeft };
}
