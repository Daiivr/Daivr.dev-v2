// Cielo del footer (FooterSky): la hora del dia, el sol y la luna, las nubes y
// el tiempo de fuera. Solo calculos y pixel art generado: ni React ni DOM, los
// tests de Node lo importan tal cual.

const MINUTES_PER_DAY = 1440;

// Sin el tiempo de verdad (o sin sus horas de sol), un dia de entretiempo.
export const DEFAULT_DAYLIGHT = { sunrise: 6 * 60 + 30, sunset: 19 * 60 + 30 };

export function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

// Horas de sol reales (/api/weather, en minutos locales) si llegaron y tienen
// sentido; si no, las de por defecto.
export function daylightFrom(weather) {
  const sunrise = Number(weather?.sunrise);
  const sunset = Number(weather?.sunset);
  const valid = Number.isFinite(sunrise) && Number.isFinite(sunset)
    && sunrise >= 0 && sunset <= MINUTES_PER_DAY && sunset - sunrise >= 120;
  return valid ? { sunrise, sunset } : DEFAULT_DAYLIGHT;
}

// Por donde va el dia: `sun` 0..1 de la salida a la puesta (null de noche),
// `moon` 0..1 de la puesta a la salida (null de dia), y `altitude` de -1
// (medianoche) a 1 (mediodia), que es lo que decide los colores.
export function skyClock(minutes, daylight = DEFAULT_DAYLIGHT) {
  const { sunrise, sunset } = daylight;
  const dayLength = sunset - sunrise;
  if (minutes >= sunrise && minutes < sunset) {
    const sun = (minutes - sunrise) / dayLength;
    return { sun, moon: null, altitude: Math.sin(Math.PI * sun) };
  }
  const moon = ((minutes - sunset + MINUTES_PER_DAY) % MINUTES_PER_DAY) / (MINUTES_PER_DAY - dayLength);
  return { sun: null, moon, altitude: -Math.sin(Math.PI * moon) };
}

// night / dawn / day / dusk, para las clases del footer (luciernagas,
// estrellas, luz del bosque).
export function skyPhase(clock) {
  if (clock.altitude >= 0.15) return "day";
  if (clock.altitude <= -0.12) return "night";
  const morning = clock.sun != null ? clock.sun < 0.5 : clock.moon > 0.5;
  return morning ? "dawn" : "dusk";
}

// Recorrido del sol y la luna: de un lado al otro, asomando tras el bosque al
// salir y al ponerse. x en % del ancho, y en px sobre el riel.
export const SKY_ARC = { left: 4, right: 96, low: 8, high: 118 };

export function arcPosition(progress, arc = SKY_ARC) {
  const p = Math.min(1, Math.max(0, progress));
  return {
    x: arc.left + (arc.right - arc.left) * p,
    y: arc.low + (arc.high - arc.low) * Math.sin(Math.PI * p)
  };
}

// --- Luna -----------------------------------------------------------------------

const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

// 0 luna nueva, 0.25 cuarto creciente, 0.5 llena, 0.75 cuarto menguante.
export function moonPhase(date) {
  const cycles = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000 / SYNODIC_DAYS;
  return ((cycles % 1) + 1) % 1;
}

// Pixeles -> path con un rectangulo por tramo de fila (crispEdges).
function pathFrom(pixels) {
  const rows = new Map();
  pixels.forEach(([x, y]) => rows.set(y, [...(rows.get(y) || []), x]));
  let path = "";
  [...rows.keys()].sort((a, b) => a - b).forEach((y) => {
    const xs = rows.get(y).sort((a, b) => a - b);
    let start = xs[0];
    for (let index = 1; index <= xs.length; index += 1) {
      if (xs[index] === xs[index - 1] + 1) continue;
      path += `M${start} ${y}h${xs[index - 1] - start + 1}v1h-${xs[index - 1] - start + 1}z`;
      start = xs[index];
    }
  });
  return path;
}

function discPixels(radius) {
  const size = Math.ceil(radius * 2);
  const center = size / 2;
  const pixels = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      if (dx * dx + dy * dy <= radius * radius) pixels.push({ x, y, dx, dy });
    }
  }
  return { size, center, pixels };
}

const MOON_CRATERS = new Set(["3,4", "4,3", "6,6", "7,7", "7,3", "2,6"]);

// La luna con su fase de verdad: la parte iluminada (a la derecha creciendo, a
// la izquierda menguando), la sombra con un poco de luz cenicienta y crateres.
export function moonPixels(phase, radius = 5.5) {
  const { size, pixels } = discPixels(radius);
  const k = Math.cos(2 * Math.PI * phase);
  const waxing = phase < 0.5;
  const lit = [];
  const dark = [];
  pixels.forEach(({ x, y, dx, dy }) => {
    const halfWidth = Math.sqrt(Math.max(0, radius * radius - dy * dy));
    const isLit = waxing ? dx > halfWidth * k : dx < -halfWidth * k;
    (isLit ? lit : dark).push([x, y]);
  });
  const craters = lit.filter(([x, y]) => MOON_CRATERS.has(`${x},${y}`));
  return { size, lit: pathFrom(lit), dark: pathFrom(dark), craters: pathFrom(craters), litShare: lit.length / pixels.length };
}

// Sol: borde, nucleo y un brillo arriba a la izquierda.
export function sunPixels(radius = 6.5) {
  const { size, center, pixels } = discPixels(radius);
  const inside = new Set(pixels.map(({ x, y }) => `${x},${y}`));
  const edge = [];
  const core = [];
  const shine = [];
  pixels.forEach(({ x, y }) => {
    const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => !inside.has(`${x + ox},${y + oy}`));
    const shiny = Math.hypot(x + 0.5 - (center - 2), y + 0.5 - (center - 2)) < radius * 0.42;
    (rim ? edge : shiny ? shine : core).push([x, y]);
  });
  return { size, edge: pathFrom(edge), core: pathFrom(core), shine: pathFrom(shine) };
}

// --- Nubes ----------------------------------------------------------------------

// Cada nube es una union de bolas (circulos [cx, cy, r] o elipses [cx, cy, rx,
// ry]) en pixeles. Las de cumulo tienen la base plana (`flat`): por debajo de
// `base` no hay nube, y en su mitad baja se rellenan los huecos entre bolas.
// Se rasterizan una vez y se sombrean como pixel art bola a bola: cada una con
// su cima iluminada, su borde marcado sobre las de detras y su panza en sombra,
// y todo mas oscuro cuanto mas abajo en la nube. Cinco tonos y tramado en los
// cambios. La luz viene de la izquierda; FooterSky voltea las nubes cuando el
// sol (o la luna) esta a la derecha.

// Generador con semilla: el cielo tiene siempre las mismas nubes.
function seeded(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const between = (rng, min, max) => min + rng() * (max - min);

// Bolas a lo largo de la nube, mas grandes y altas en el centro (campana).
function puffRow(rng, { width, count, minR, maxR, lift, margin }) {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const bell = Math.sin(Math.PI * (0.15 + t * 0.7));
    return {
      cx: margin + t * (width - margin * 2) + between(rng, -1.5, 1.5),
      r: minR + (maxR - minR) * bell * between(rng, 0.78, 1.05),
      lift: between(rng, lift[0], lift[1]) * bell
    };
  });
}

// Asienta las bolas sobre la base: lift 0 = centro en la base, 1 = un radio
// por encima.
function settle(width, puffs) {
  const base = Math.ceil(Math.max(...puffs.map(({ r, lift }) => r * (1 + lift)))) + 1;
  return { width: Math.ceil(width), height: base + 1, base, flat: true, puffs: puffs.map(({ cx, r, lift }) => [cx, base - r * lift, r]) };
}

const CLOUD_KINDS = {
  // Bolita suelta.
  puff: (rng) => {
    const width = between(rng, 16, 26);
    return settle(width, puffRow(rng, { width, count: rng() < 0.5 ? 2 : 3, minR: 3, maxR: width * 0.25, lift: [0.25, 0.6], margin: width * 0.24 }));
  },
  // Cumulo de buen tiempo: ancho y redondo.
  cumulus: (rng) => {
    const width = between(rng, 34, 56);
    return settle(width, puffRow(rng, { width, count: 4 + Math.floor(rng() * 3), minR: 3.5, maxR: width * 0.17, lift: [0.3, 0.75], margin: width * 0.13 }));
  },
  // Cumulo que crece hacia arriba: una torre en el centro.
  tower: (rng) => {
    const width = between(rng, 42, 60);
    const row = puffRow(rng, { width, count: 5 + Math.floor(rng() * 2), minR: 4, maxR: width * 0.15, lift: [0.2, 0.55], margin: width * 0.11 });
    const peak = { cx: width * between(rng, 0.42, 0.58), r: width * between(rng, 0.15, 0.18), lift: between(rng, 1.1, 1.35) };
    const shoulder = { cx: peak.cx + (rng() < 0.5 ? -1 : 1) * width * between(rng, 0.12, 0.18), r: peak.r * 0.74, lift: peak.lift * 0.82 };
    return settle(width, [...row, shoulder, peak]);
  },
  // Banco largo y bajo de bolitas (estratocumulo).
  bank: (rng) => {
    const width = between(rng, 62, 92);
    return settle(width, puffRow(rng, { width, count: 8 + Math.floor(rng() * 4), minR: 2.6, maxR: 4.8, lift: [0.1, 0.45], margin: 4 }));
  },
  // Cirro: hebras finas muy altas, sin base.
  wisp: (rng) => {
    const width = Math.ceil(between(rng, 34, 64));
    const strands = Array.from({ length: 3 + Math.floor(rng() * 2) }, (_, index) => {
      const rx = between(rng, width * 0.18, width * 0.34);
      return [between(rng, rx, width - rx), 1.5 + index * 1.8 + between(rng, 0, 1), rx, between(rng, 0.75, 1.2)];
    });
    return { width, height: Math.ceil(Math.max(...strands.map(([, cy, , ry]) => cy + ry))) + 1, base: Infinity, flat: false, puffs: strands };
  }
};

export const CLOUD_KIND_NAMES = Object.keys(CLOUD_KINDS);
export const CLOUD_VARIANTS = 4;
const KIND_SEEDS = { puff: 101, cumulus: 202, tower: 303, bank: 404, wisp: 505 };

export const CLOUD_SHAPES = Object.fromEntries([
  ...Object.entries(CLOUD_KINDS).flatMap(([kind, make]) => {
    const rng = seeded(KIND_SEEDS[kind]);
    return Array.from({ length: CLOUD_VARIANTS }, (_, index) => [`${kind}-${index}`, make(rng)]);
  }),
  // La de la lluvia de Buddy: ancha, alta y con la panza cargada.
  ["storm", { width: 76, height: 24, base: 23, flat: true, puffs: [[9, 17, 7], [19, 12.5, 9], [31, 9, 10.5], [44, 9.5, 10.5], [56, 12.5, 9], [66, 17, 7], [38, 18, 9]] }]
]);

export const CLOUD_TONES = ["rim", "light", "mid", "shade", "shadow"];
const cloudCache = new Map();

export function cloudPixels(name) {
  if (cloudCache.has(name)) return cloudCache.get(name);
  const shape = CLOUD_SHAPES[name];
  if (!shape) return null;
  const { width, height, base, flat } = shape;
  // Las bolas de mas abajo van delante de las de arriba.
  const puffs = shape.puffs
    .map(([cx, cy, rx, ry = rx]) => ({ cx, cy, rx, ry }))
    .sort((a, b) => a.cy + a.ry - (b.cy + b.ry));
  const inPuff = (puff, x, y) => ((x + 0.5 - puff.cx) / puff.rx) ** 2 + ((y + 0.5 - puff.cy) / puff.ry) ** 2 <= 1;
  const frontAt = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height || y >= base) return -1;
    for (let index = puffs.length - 1; index >= 0; index -= 1) if (inPuff(puffs[index], x, y)) return index;
    return -1;
  };
  // Panza plana: en la mitad de abajo, los huecos entre bolas tambien son nube.
  const belly = new Map();
  if (flat) {
    for (let y = Math.ceil(base * 0.5); y < base; y += 1) {
      const xs = [];
      for (let x = 0; x < width; x += 1) if (frontAt(x, y) >= 0) xs.push(x);
      if (xs.length) belly.set(y, [xs[0], xs.at(-1)]);
    }
  }
  const BELLY = puffs.length;
  const owner = (x, y) => {
    const front = frontAt(x, y);
    if (front >= 0) return front;
    const span = belly.get(y);
    return span && x >= span[0] && x <= span[1] ? BELLY : -1;
  };

  const tones = Object.fromEntries(CLOUD_TONES.map((tone) => [tone, []]));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const own = owner(x, y);
      if (own < 0) continue;
      const puff = puffs[own];
      const above = owner(x, y - 1);
      const below = owner(x, y + 1);
      // Dentro de su bola: -1 arriba / izquierda, 1 abajo / derecha.
      const local = puff ? (y + 0.5 - puff.cy) / puff.ry : 1;
      const side = puff ? (x + 0.5 - puff.cx) / puff.rx : 0;
      const depth = flat ? y / base : 0.3;
      let level = 0.95 - 0.5 * local - 0.22 * side - 0.7 * depth;
      const dither = (x + y) % 2 === 0 ? 0.05 : -0.05;
      // Cirros: hebras claras, sin panza.
      if (!flat) {
        tones[above < 0 ? "rim" : level + dither > 0.45 ? "light" : "mid"].push([x, y]);
        continue;
      }
      // La base plana, siempre en sombra.
      if (below < 0) {
        tones.shadow.push([x, y]);
        continue;
      }
      // Cima contra el cielo (o costado izquierdo, que mira a la luz): borde
      // brillante. Contra una bola de detras, solo luz: se marca sin cortar.
      if (puff && local < 0.35 && above < 0) {
        tones.rim.push([x, y]);
        continue;
      }
      if (puff && local < 0.1 && owner(x - 1, y) < 0) {
        tones.rim.push([x, y]);
        continue;
      }
      if (puff && local < 0.35 && above < own) level = Math.max(level, 0.7);
      // Justo encima de una bola de delante: la sombra que le hace.
      if (below > own && below !== BELLY) level -= 0.45;
      if (owner(x + 1, y) < 0) level -= 0.25;
      level += dither;
      const tone = level > 0.55 ? "light" : level > 0.25 ? "mid" : level > -0.05 ? "shade" : "shadow";
      tones[tone].push([x, y]);
    }
  }
  const result = { width, height, ...Object.fromEntries(CLOUD_TONES.map((tone) => [tone, pathFrom(tones[tone])])) };
  cloudCache.set(name, result);
  return result;
}

// --- Tiempo de fuera ------------------------------------------------------------

export const SKY_COVERS = ["clear", "fair", "cloudy", "fog", "rain", "snow", "storm"];

// Codigo WMO (Open-Meteo) -> cielo. Sin dato, unas nubes sueltas.
export function skyCover(weather) {
  if (!weather?.available) return "fair";
  const code = Number(weather.code);
  if (!Number.isInteger(code)) return "fair";
  if (code === 0) return "clear";
  if (code <= 2) return "fair";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "fair";
}

// Fuerza del viento: con el dato de verdad (km/h) si lo hay; con lluvia o
// tormenta, mas.
export function windStrength(weather, cover = "fair") {
  const speed = Number(weather?.available ? weather.wind : NaN);
  let strength = !Number.isFinite(speed) ? 1 : speed < 8 ? 0.6 : speed < 25 ? 1 : speed < 45 ? 1.5 : 2;
  if (cover === "rain") strength = Math.max(strength, 1.25);
  if (cover === "storm") strength = Math.max(strength, 1.8);
  return strength;
}

// Capas del cielo, de lejos a cerca. Las lejanas van mas bajas (cerca del
// horizonte), mas despacio, mas transparentes y con pixel de 1px; las cercanas,
// con pixel de 2px. Todas con el viento, de derecha a izquierda, como la lluvia.
//   px: tamaño del pixel, alpha: opacidad, top: px desde arriba del cielo,
//   seconds: lo que tardan en cruzarlo.
export const CLOUD_LAYERS = {
  high: { px: 1, alpha: 0.5, top: [2, 22], seconds: [560, 720] },
  far: { px: 1, alpha: 0.62, top: [40, 70], seconds: [400, 520] },
  mid: { px: 1, alpha: 0.86, top: [14, 44], seconds: [270, 350] },
  near: { px: 2, alpha: 1, top: [-2, 26], seconds: [170, 240] }
};

// Cuantas nubes y de que tipos lleva cada capa en cada cielo (un tipo repetido
// sale mas a menudo).
const OVERCAST_FIELD = {
  far: [6, ["bank", "cumulus"]],
  mid: [6, ["cumulus", "tower", "bank"]],
  near: [6, ["bank", "cumulus", "tower"]]
};
const CLOUD_FIELDS = {
  clear: { high: [3, ["wisp"]], far: [2, ["puff", "bank"]], mid: [1, ["puff"]] },
  fair: { high: [2, ["wisp"]], far: [5, ["puff", "cumulus", "bank", "puff"]], mid: [4, ["cumulus", "cumulus", "puff", "tower"]], near: [3, ["cumulus", "cumulus", "puff", "tower"]] },
  cloudy: OVERCAST_FIELD,
  fog: { far: [8, ["bank"]], mid: [3, ["bank", "puff"]] },
  rain: OVERCAST_FIELD,
  snow: OVERCAST_FIELD,
  storm: OVERCAST_FIELD
};

const hashText = (text) => [...text].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261);

// Las nubes de un cielo: siempre las mismas para el mismo tiempo, repartidas a
// lo largo del recorrido para que no salgan en grupo. En movil se queda la
// mitad (`mobile`).
export function cloudLayout(cover) {
  const field = CLOUD_FIELDS[cover] || CLOUD_FIELDS.fair;
  const rng = seeded(hashText(cover));
  return Object.entries(CLOUD_LAYERS).flatMap(([layer, spec]) => {
    const [count, kinds] = field[layer] || [0, []];
    const used = new Set();
    // Se recorre la lista de tipos desde un punto al azar: sale la mezcla que pide.
    const offset = Math.floor(rng() * Math.max(1, kinds.length));
    return Array.from({ length: count }, (_, index) => {
      const kind = kinds[(offset + index) % kinds.length];
      // La misma forma dos veces en una capa se nota: se prueba la siguiente.
      let variant = Math.floor(rng() * CLOUD_VARIANTS);
      for (let tries = 0; tries < CLOUD_VARIANTS && used.has(`${kind}-${variant}`); tries += 1) variant = (variant + 1) % CLOUD_VARIANTS;
      used.add(`${kind}-${variant}`);
      return {
        id: `${cover}-${layer}-${index}`,
        shape: `${kind}-${variant}`,
        kind,
        layer,
        px: spec.px,
        alpha: spec.alpha,
        top: Math.round(between(rng, spec.top[0], spec.top[1])),
        seconds: Math.round(between(rng, spec.seconds[0], spec.seconds[1])),
        start: Number(((index + between(rng, 0.15, 0.85)) / count).toFixed(3)),
        mobile: layer === "near" ? index < 2 : index % 2 === 0,
        // Con lluvia de verdad, las cercanas grandes arrastran cortinas de agua.
        veil: (cover === "rain" || cover === "storm") && layer === "near" && kind !== "puff"
      };
    });
  });
}

// --- Colores --------------------------------------------------------------------

// Paletas por altura del sol, de medianoche a mediodia, con sus tonos
// apagados para que el cielo no se coma la estetica oscura del armario.
const SKY_STOPS = [
  {
    at: -1, horizon: "#0d2533", mid: "#071725", sky: 0.9, glow: "#1b2b4a", glowAlpha: 0, stars: 1,
    rim: "#5d7488", light: "#24384a", mid2: "#1a2a3a", shade: "#152331", shadow: "#111c28", cloud: 0.72,
    sunCore: "#ffd38a", sunEdge: "#ff8f4a", sunGlow: "#ff9a50"
  },
  {
    at: -0.18, horizon: "#232f49", mid: "#0c1a2c", sky: 0.9, glow: "#4a3a66", glowAlpha: 0.32, stars: 0.65,
    rim: "#8a87a8", light: "#3a4460", mid2: "#283350", shade: "#212b43", shadow: "#1a2236", cloud: 0.78,
    sunCore: "#ffd38a", sunEdge: "#ff8f4a", sunGlow: "#ff9a50"
  },
  {
    at: -0.04, horizon: "#6a4a62", mid: "#1c2a46", sky: 0.88, glow: "#d07a5a", glowAlpha: 0.5, stars: 0.2,
    rim: "#e6a088", light: "#7a6278", mid2: "#4c4462", shade: "#3a3552", shadow: "#2c2a44", cloud: 0.84,
    sunCore: "#ffc27a", sunEdge: "#ff7a3d", sunGlow: "#ff8a45"
  },
  {
    at: 0.06, horizon: "#b8714f", mid: "#38405c", sky: 0.86, glow: "#ffae6a", glowAlpha: 0.62, stars: 0,
    rim: "#ffd1a0", light: "#d29a86", mid2: "#87697c", shade: "#6a5068", shadow: "#4a3c56", cloud: 0.9,
    sunCore: "#ffd38a", sunEdge: "#ff8f4a", sunGlow: "#ff9a50"
  },
  {
    at: 0.3, horizon: "#4c8686", mid: "#22506a", sky: 0.8, glow: "#f5e3b0", glowAlpha: 0.22, stars: 0,
    rim: "#f4fbf2", light: "#b6d2cd", mid2: "#7d9fa2", shade: "#628489", shadow: "#4b6b73", cloud: 0.92,
    sunCore: "#fff6d6", sunEdge: "#ffd77a", sunGlow: "#ffe7a0"
  },
  {
    at: 1, horizon: "#579595", mid: "#285d74", sky: 0.78, glow: "#fff4d0", glowAlpha: 0.16, stars: 0,
    rim: "#ffffff", light: "#c6ddd9", mid2: "#8caeae", shade: "#6f9396", shadow: "#54777f", cloud: 0.94,
    sunCore: "#fffbe8", sunEdge: "#ffe08a", sunGlow: "#fff0b8"
  }
];

const COLOR_KEYS = ["horizon", "mid", "glow", "rim", "light", "mid2", "shade", "shadow", "sunCore", "sunEdge", "sunGlow"];
const NUMBER_KEYS = ["sky", "glowAlpha", "stars", "cloud"];
const CSS_NAMES = {
  horizon: "--sky-horizon", mid: "--sky-mid", glow: "--sky-glow", rim: "--cloud-rim", light: "--cloud-light",
  mid2: "--cloud-mid", shade: "--cloud-shade", shadow: "--cloud-shadow", sunCore: "--sun-core", sunEdge: "--sun-edge", sunGlow: "--sun-glow",
  sky: "--sky-alpha", glowAlpha: "--sky-glow-alpha", stars: "--star-alpha", cloud: "--cloud-alpha"
};

const hexToRgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

// Variables CSS del cielo para una altura del sol, mezclando las dos paletas
// vecinas.
export function skyPalette(altitude) {
  const a = Math.min(1, Math.max(-1, Number(altitude) || 0));
  let upper = SKY_STOPS.findIndex((stop) => stop.at >= a);
  if (upper <= 0) upper = Math.max(1, upper);
  const from = SKY_STOPS[upper - 1];
  const to = SKY_STOPS[upper];
  const t = (a - from.at) / (to.at - from.at || 1);
  const palette = {};
  COLOR_KEYS.forEach((key) => {
    const [r1, g1, b1] = hexToRgb(from[key]);
    const [r2, g2, b2] = hexToRgb(to[key]);
    const mix = (x, y) => Math.round(x + (y - x) * t);
    palette[CSS_NAMES[key]] = `rgb(${mix(r1, r2)} ${mix(g1, g2)} ${mix(b1, b2)})`;
  });
  NUMBER_KEYS.forEach((key) => {
    palette[CSS_NAMES[key]] = Number((from[key] + (to[key] - from[key]) * t).toFixed(3));
  });
  return palette;
}

// Estrellas fijas (siempre las mismas, como un cielo de verdad).
export const SKY_STARS = Array.from({ length: 28 }, (_, index) => {
  const seed = Math.sin(index * 91.7 + 13.1) * 10_000;
  const random = (offset) => {
    const value = Math.sin(seed + offset) * 10_000;
    return value - Math.floor(value);
  };
  return {
    id: index,
    left: Number((2 + random(1) * 96).toFixed(2)),
    top: Math.round(4 + random(2) * 86),
    big: random(3) > 0.82,
    delay: Number((-random(4) * 6).toFixed(2)),
    seconds: Number((3.5 + random(5) * 4).toFixed(2))
  };
});
