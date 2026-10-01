// Match the rod's hook to a stationary footer portal, including the Miku grip.
export function fishingSpot(width, { miku = false, random = Math.random } = {}) {
  const bodyWidth = 64;
  const padding = 4;
  const hookInBody = (miku ? -12 : -26) + 5;
  const portalMargin = 38;
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
