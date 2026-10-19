// Moisture belongs to the planted seed, so reusing a plot never transfers it.
export const WATER_RETENTION_MS = 15 * 60_000;

export function isCropWatered(watered, seedId, now = Date.now()) {
  const at = watered.get(seedId);
  return Number.isFinite(at) && at <= now && now - at < WATER_RETENTION_MS;
}

export function wetGardenPlots(planted, watered, now = Date.now()) {
  return new Set(planted.filter((entry) => entry && isCropWatered(watered, entry.seedId, now)).map((entry) => entry.plot));
}

export function normalizeWatered(saved, now = Date.now()) {
  const watered = new Map();
  // Old daily plot flags have no seed or time; let those plants be watered again.
  if (saved?.version !== 2 || !Array.isArray(saved.watered)) return watered;
  for (const pair of saved.watered.slice(0, 3)) {
    if (!Array.isArray(pair) || typeof pair[0] !== "string" || !pair[0] || pair[0].length > 128) continue;
    const [seedId, at] = pair;
    if (Number.isFinite(at) && at <= now && now - at < WATER_RETENTION_MS) watered.set(seedId, at);
  }
  return watered;
}
