// Simulation helpers shared by rendering, collision checks, and gameplay tests.
export const TILE = 42;
export const TRAIN_HALF_LENGTH = 170;
const choose = (values) => values[Math.floor(Math.random() * values.length)];
const colors = ["#ef6950", "#f2c94b", "#68b6cf", "#b58aca", "#e7eee1"];
const route = ["forest", "forest", "car", "truck", "forest", "forest", "rail", "forest", "car", "forest", "river", "river", "forest", "forest", "truck", "car", "forest", "rail", "forest", "river", "river", "river", "forest", "car"];

export function generateRows(amount, offset = 0) {
  return Array.from({ length: amount }, (_, index) => {
    const row = offset + index + 1;
    const slot = row % route.length;
    const type = route[slot];
    const biome = ["woodland", "meadow", "autumn"][Math.floor((row - 1) / 24) % 3];
    const common = { type, biome };
    if (type === "rail") return { ...common, direction: choose([-1, 1]), speed: 620, cycle: 11 + Math.random() * 2, offset: Math.random() * 4, warningTime: 2, waitTime: 5 };
    if (type === "river") return { ...common, direction: row % 2 ? 1 : -1, speed: choose([25, 32, 38]), logLength: choose([140, 168, 190]), spacing: 238, phase: Math.random() * 238 };
    if (type === "forest") {
      const occupied = new Set();
      const trees = [];
      const rocks = [];
      const bank = [9, 12, 18, 22].includes(slot);
      while (trees.length < (biome === "meadow" ? 2 : 4)) {
        const tileIndex = Math.floor(Math.random() * 17) - 8;
        if (occupied.has(tileIndex) || (row === 1 && Math.abs(tileIndex) < 2) || (bank && Math.abs(tileIndex) < 3)) continue;
        occupied.add(tileIndex);
        trees.push({ tileIndex, height: choose([42, 55, 68]) });
      }
      if (!bank && row > 1) {
        for (let attempt = 0; attempt < 12 && rocks.length < 2; attempt++) {
          const tileIndex = Math.floor(Math.random() * 17) - 8;
          if (!occupied.has(tileIndex) && tileIndex !== 0) { occupied.add(tileIndex); rocks.push({ tileIndex }); }
        }
      }
      return { ...common, trees, rocks };
    }
    const occupied = new Set();
    const vehicles = [];
    const radius = type === "truck" ? 2 : 1;
    while (vehicles.length < (type === "truck" ? 2 : 3)) {
      const initialTileIndex = Math.floor(Math.random() * 17) - 8;
      if (occupied.has(initialTileIndex)) continue;
      for (let tile = initialTileIndex - radius; tile <= initialTileIndex + radius; tile++) occupied.add(tile);
      vehicles.push({ initialTileIndex, color: choose(colors) });
    }
    return { ...common, direction: Math.random() > 0.5, speed: choose([125, 156, 188]), vehicles };
  });
}

export function logPositions(row, time) {
  const span = row.spacing * 6;
  const travel = row.direction * row.speed * time + row.phase;
  return Array.from({ length: 6 }, (_, index) => ((index * row.spacing + travel) % span + span) % span - span / 2);
}

export function onLog(row, x, time) {
  return logPositions(row, time).some((center) => Math.abs(x - center) <= row.logLength / 2 - 7);
}

export function trainMotion(row, time) {
  const phase = ((time + row.offset) % row.cycle + row.cycle) % row.cycle;
  const travel = phase - row.waitTime - row.warningTime;
  const active = travel >= 0 && travel <= 1900 / row.speed;
  return { active, warning: phase >= row.waitTime && (travel < 0 || active), x: row.direction * (-950 + Math.max(0, travel) * row.speed) };
}

export function trainHits(row, x, y, time, delta) {
  if (Math.abs(y) >= 21) return false;
  const now = trainMotion(row, time);
  if (!now.active) return false;
  const before = trainMotion(row, time - delta);
  const start = before.active ? before.x : now.x;
  return x >= Math.min(start, now.x) - TRAIN_HALF_LENGTH - 7 && x <= Math.max(start, now.x) + TRAIN_HALF_LENGTH + 7;
}
