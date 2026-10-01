// The pool stays inside the footer; its surface meets the rod's hook.
export const FISHING_POOL_WIDTH = 128;
export const FISHING_POOL_HEIGHT = 18;
// The shallow surface sits on the walking rail, above the music ticker.
export const FISHING_WATER_OFFSET = 2;
export function fishingSpot(width, { miku = false, random = Math.random } = {}) {
  const bodyWidth = 64;
  const padding = 4;
  const hookInBody = (miku ? -12 : -26) + 5;
  const portalMargin = FISHING_POOL_WIDTH / 2 + 4;
  const choices = [true, false].map((castLeft) => {
    const hookOffset = padding + (castLeft ? hookInBody : bodyWidth - hookInBody);
    const min = Math.max(portalMargin, 12 + hookOffset);
    const max = Math.min(width - portalMargin, width - bodyWidth - padding * 2 - 12 + hookOffset);
    return { castLeft, hookOffset, min, max };
  }).filter(({ min, max }) => max >= min);
  if (!choices.length) return null;
  const choice = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  const portalX = choice.min + random() * (choice.max - choice.min);
  return { portalX, target: portalX - choice.hookOffset, castLeft: choice.castLeft };
}
