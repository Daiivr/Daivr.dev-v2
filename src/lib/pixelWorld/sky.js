import { Buf, bayer, discRows, makeCanvas, mix, px, rect, rgb, rng } from "./core.js";
import { FEET, H } from "./layout.js";
import { currentSeason } from "./palette.js";
import { BIRD_ANCHOR, birdSprites } from "./birds.js";

// El cielo del footer en pixel art, como en el boceto: un degradado tramado
// que va con la altura del sol de verdad (dia, atardecer o amanecer, noche) y
// con el tiempo (el de fuera, o el chaparron de Buddy, que FooterSky pasa como
// lluvia), nubes de pixel que cruzan con el viento (cargadas y de tormenta
// cuando llueve), el sol (o la luna con su fase), estrellas, bandadas de dia
// y, de FooterSky, las estrellas fugaces y el arcoiris. Cuando cambia el
// tiempo, las nubes y el color del cielo se funden poco a poco. Va detras de
// todo el mundo y no lo toca la luz del mundo: ya trae sus colores.

// Del cenit al horizonte.
const SKIES = {
  day: ["#3f9ee6", "#5cb2ee", "#86c9f3", "#b6e1f7"],
  dusk: ["#40377e", "#7e4a8c", "#d4687e", "#f79a5c", "#ffcf86"],
  dawn: ["#3a4a8e", "#6f6aa8", "#c98aa6", "#f2ae94", "#ffdcae"],
  night: ["#060a1f", "#0b1231", "#131d46", "#1f2a60"]
};
// El tiempo de fuera tapa el cielo de la hora (k: cuanto).
const COVER_SKIES = {
  cloudy: { stops: ["#5f7590", "#7a8ea6", "#97a9bc", "#b5c3d0"], k: 0.45 },
  fog: { stops: ["#8f9caa", "#a5b0bc", "#bac3cc", "#ced5dc"], k: 0.8 },
  rain: { stops: ["#52627a", "#66778e", "#7d8da2", "#97a6b8"], k: 0.9 },
  storm: { stops: ["#2c3546", "#3c475a", "#4f5b6f", "#667287"], k: 0.95 },
  snow: { stops: ["#8fa6bf", "#a9bccf", "#c3d2e0", "#dce6ef"], k: 0.7 }
};
// De dia, las temporadas pintan su propio cielo.
const SEASON_SKIES = {
  winter: ["#7fb0d8", "#9cc4e4", "#bcd8ee", "#dfeef8"],
  halloween: ["#241c3c", "#4a2c5c", "#94485e", "#e07a44"],
  "april-fools": ["#a8e05a", "#c8f07a", "#e8f8a8", "#fff0c8"]
};
// Nubes: luz, medio, sombra.
const CLOUDS = {
  day: ["#ffffff", "#e0f0fb", "#b3d4ec"],
  golden: ["#ffe1bd", "#f6a08a", "#b86e8c"],
  night: ["#2c3668", "#232b56", "#1a2146"],
  rain: ["#b4bfcc", "#919dae", "#6f7b8e"],
  storm: ["#6f7b8e", "#56627a", "#414c62"]
};
// Cuantas nubes (por cada 400 px de arte de ancho) y si son de las cargadas.
const CLOUD_COUNT = { clear: [2, false], fair: [7, false], cloudy: [12, false], fog: [6, false], snow: [10, true], rain: [13, true], storm: [16, true] };
const STOPS = 5;
// Filas de arriba que se funden con la pagina (tramado).
const FADE = 10;
// Lo que tarda el cielo en cambiar de tiempo (nubes y color).
const WEATHER_FADE_S = 2.5;
const RAINBOW_MS = 7000;
// Las patas del arcoiris quedan detras del bosque y el arco asoma por encima.
const RAINBOW_BASE = 68;
const RAINBOW_COLORS = ["#ff5f6d", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => v * v * (3 - 2 * v);

function resample(stops) {
  return Array.from({ length: STOPS }, (_, i) => {
    const t = i / (STOPS - 1) * (stops.length - 1), j = Math.min(stops.length - 2, Math.floor(t));
    return mix(stops[j], stops[j + 1], t - j);
  });
}
const blend = (a, b, t) => (t <= 0 ? a : t >= 1 ? b : a.map((c, i) => mix(c, b[i], t)));
const R_SKIES = Object.fromEntries(Object.entries(SKIES).map(([k, v]) => [k, resample(v)]));
const R_COVERS = Object.fromEntries(Object.entries(COVER_SKIES).map(([k, v]) => [k, resample(v.stops)]));
const R_SEASONS = Object.fromEntries(Object.entries(SEASON_SKIES).map(([k, v]) => [k, resample(v)]));

// Cuanta noche hay: 0 de dia, 1 de noche cerrada (igual que lightingFor).
export const darkness = (altitude) => clamp01((0.3 - altitude) / 0.5);

// Colores del cielo para una altura del sol, una fase y un tiempo.
export function skyStops({ altitude = 1, phase = "day", cover = "fair", season = "" }) {
  const day = R_SEASONS[season] || R_SKIES.day, golden = phase === "dawn" ? R_SKIES.dawn : R_SKIES.dusk;
  let stops;
  if (altitude >= 0.3) stops = day;
  else if (altitude >= 0.05) stops = blend(golden, day, (altitude - 0.05) / 0.25);
  else if (altitude >= -0.2) stops = blend(R_SKIES.night, golden, (altitude + 0.2) / 0.25);
  else stops = R_SKIES.night;
  const dark = darkness(altitude);
  const covered = R_COVERS[cover];
  if (covered) stops = blend(stops, blend(covered, R_SKIES.night, dark * 0.8), COVER_SKIES[cover].k);
  return stops;
}

// Colores de las nubes con la misma regla.
export function cloudColors({ altitude = 1, cover = "fair" }) {
  let cols;
  if (altitude >= 0.3) cols = CLOUDS.day;
  else if (altitude >= 0.05) cols = blend(CLOUDS.golden, CLOUDS.day, (altitude - 0.05) / 0.25);
  else if (altitude >= -0.2) cols = blend(CLOUDS.night, CLOUDS.golden, (altitude + 0.2) / 0.25);
  else cols = CLOUDS.night;
  const dark = darkness(altitude);
  const heavy = cover === "storm" ? CLOUDS.storm : ["rain", "snow", "fog", "cloudy"].includes(cover) ? CLOUDS.rain : null;
  if (heavy) cols = blend(cols, blend(heavy, CLOUDS.night, dark * 0.75), cover === "cloudy" || cover === "fog" ? 0.55 : 0.85);
  return cols;
}

function buildSky(W, stops, fade) {
  const [c, g] = makeCanvas(W, H), img = g.createImageData(W, H), cols = stops.map(rgb), n = cols.length - 1;
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1) * n, i = Math.min(Math.floor(t), n - 1), f = t - i;
    for (let x = 0; x < W; x++) {
      const k = f < 0.35 ? i : f > 0.65 ? i + 1 : ((f - 0.35) / 0.3 > bayer(x, y) ? i + 1 : i), col = cols[k], o = (y * W + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2];
      img.data[o + 3] = y < fade && bayer(x, y) >= (y + 1) / (fade + 1) ? 0 : 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Nube de bolas: la luz arriba, la sombra en la panza (del boceto).
export function makeCloud(R, w, h, cols) {
  const b = new Buf(w, h), cl = [], n = 3 + Math.floor(w / 9);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, bulge = Math.sin(t * Math.PI);
    cl.push({ x: 1 + t * (w - 2), y: h - 1 - bulge * h * 0.42 + (R() - 0.5) * 1.5, r: (h * 0.36 + R() * h * 0.18) * (0.6 + 0.5 * bulge) });
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let own = null;
    for (let k = cl.length - 1; k >= 0; k--) { const c = cl[k]; if ((x + 0.5 - c.x) ** 2 + (y + 0.5 - c.y) ** 2 <= c.r * c.r) { own = c; break; } }
    if (!own) continue;
    const v = 0.6 - 0.45 * ((y + 0.5 - own.y) / own.r) - 0.3 * (y / h) + (bayer(x, y) - 0.5) * 0.16;
    b.set(x, y, y === h - 1 ? cols[2] : v > 0.6 ? cols[0] : v > 0.32 ? cols[1] : cols[2]);
  }
  return b.canvas();
}

// Sol alto, sol bajo (grande y naranja) y luna con su fase de verdad.
function ring(g, r1, r2, col, density) {
  g.fillStyle = col;
  for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
    const d = Math.hypot(x - 14, y - 14);
    if (d > r1 && d <= r2 && bayer(x, y) < density) g.fillRect(x, y, 1, 1);
  }
}
function sunSprite(low) {
  const [c, g] = makeCanvas(29, 29);
  if (!low) { ring(g, 5.5, 8.5, "#cdeefb", 0.5); ring(g, 8.5, 10.5, "#cdeefb", 0.2); g.fillStyle = "#ffe98a"; discRows(g, 14, 14, 5); g.fillStyle = "#fffbe3"; discRows(g, 14, 14, 4); }
  else { ring(g, 9, 12, "#ffc98f", 0.45); ring(g, 12, 14, "#ffc98f", 0.18); g.fillStyle = "#ffb565"; discRows(g, 14, 14, 9); g.fillStyle = "#ffe3a0"; discRows(g, 14, 14, 8); g.fillStyle = "#fff3cf"; discRows(g, 12, 12, 4); }
  return c;
}
// La luna con su fase de verdad (0 nueva, 0.25 cuarto creciente, 0.5 llena,
// 0.75 menguante): iluminada a la derecha creciendo y a la izquierda
// menguando. Pixeles [x, y, con luz] respecto al centro; sin DOM (tests).
export function moonPixels(phase, r = 6) {
  const k = Math.round(Math.cos(2 * Math.PI * phase) * 1e9) / 1e9, waxing = phase < 0.5, out = [];
  for (let y = -r; y <= r; y++) {
    const hw = Math.floor(Math.sqrt(r * r - y * y) + 0.3);
    // (half: hasta donde llega la fila, contando el pixel entero del borde)
    const half = hw + 0.5;
    for (let x = -hw; x <= hw; x++) out.push([x, y, waxing ? x > half * k : x < -half * k]);
  }
  return out;
}
const MOON_CRATERS = [[-2, -2], [-1, -2], [-2, -1], [-1, -1], [2, 1], [-1, 3], [3, -3]];
// Con su halo, la sombra con luz cenicienta y crateres solo donde da la luz.
function moonSprite(phase, full) {
  const [c, g] = makeCanvas(29, 29), halo = full ? "#3a4a8f" : "#27336f";
  ring(g, 6.5, 9.5, halo, 0.55); ring(g, 9.5, full ? 13 : 12, halo, 0.22);
  const lit = new Set();
  for (const [x, y, on] of moonPixels(phase)) {
    px(g, 14 + x, 14 + y, on ? "#f2efd8" : "#1e2852");
    if (on) lit.add(x + "," + y);
  }
  for (const [x, y] of MOON_CRATERS) if (lit.has(x + "," + y)) px(g, 14 + x, 14 + y, "#d3cfae");
  if (lit.has("-4,-3")) rect(g, 10, 11, 1, 2, "#ffffff");
  return c;
}

// Pajaros (los dibujos, en birds.js), con el vuelo de los de Stardew: los
// pequeños aletean rapido y van a saltitos (suben en cada aletazo y caen un
// poco entre uno y otro); el cuervo, mas pausado; la gaviota aletea despacio y
// planea. speed en px de arte por segundo, flap en aletazos por segundo, flaps
// cuantos da antes de planear y glide cuanto planea; bounce, el saltito de cada
// aletazo, y swoop/swoopHz, la curva larga del vuelo.
const SMALL = { speed: [28, 38], flap: 3.6, flaps: [3, 6], glide: [0.25, 0.55], bounce: 2.2, swoop: 2.5, swoopHz: 0.3, y: [12, 30], group: [2, 3], gap: 10 };
const FLIGHT = {
  sparrow: SMALL, bluebird: SMALL, cardinal: SMALL,
  crow: { speed: [19, 25], flap: 2.4, flaps: [3, 6], glide: [0.6, 1.3], bounce: 1.2, swoop: 1.6, swoopHz: 0.2, y: [8, 26], group: [1, 2], gap: 20 },
  gull: { speed: [12, 16], flap: 1.7, flaps: [2, 3], glide: [1.8, 3.4], bounce: 0.8, swoop: 1.6, swoopHz: 0.15, y: [6, 22], group: [1, 1], gap: 28 }
};
// Quien vuela segun la estacion del año (y el cuervo que vuelve a casa al atardecer).
const BIRD_MIX = {
  spring: [["sparrow", 0.4], ["bluebird", 0.3], ["crow", 0.15], ["gull", 0.15]],
  summer: [["sparrow", 0.3], ["bluebird", 0.3], ["gull", 0.3], ["crow", 0.1]],
  autumn: [["sparrow", 0.35], ["crow", 0.45], ["gull", 0.2]],
  winter: [["cardinal", 0.45], ["sparrow", 0.25], ["crow", 0.3]],
  golden: [["crow", 0.6], ["sparrow", 0.4]]
};
// Ritmo: una sola bandada en el cielo a la vez, una pausa (BIRD_PAUSE, en
// segundos) despues de que salga, y cada especie no vuelve hasta pasado su
// rato (BIRD_RETURN); si ninguna puede, el cielo se queda tranquilo.
const BIRD_PAUSE = [40, 75];
const BIRD_RETURN = { sparrow: 90, bluebird: 120, cardinal: 90, crow: 150, gull: 200 };
const WING = ["up", "mid", "down", "mid"];
const between = ([a, b]) => a + Math.random() * (b - a);
function natureSeason(event) {
  if (event === "winter") return "winter";
  const m = new Date().getMonth();
  return m === 11 || m < 2 ? "winter" : m < 5 ? "spring" : m < 8 ? "summer" : "autumn";
}
function pickBird(mix, ready) {
  const open = mix.filter(([kind]) => ready(kind)), total = open.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [kind, w] of open) { r -= w; if (r <= 0) return kind; }
  return open[0]?.[0] || null;
}

function rainbowSprite() {
  const r = 44, b = new Buf(r * 2, r);
  for (let y = 0; y < r; y++) for (let x = 0; x < r * 2; x++) {
    const i = Math.floor((r - Math.hypot(x + 0.5 - r, r - (y + 0.5))) / 2);
    if (i >= 0 && i < RAINBOW_COLORS.length) b.set(x, y, RAINBOW_COLORS[i]);
  }
  return b.canvas();
}

// Nube cargada (lluvia, tormenta, nieve): una fila de bolas grandes delante
// (base plana, panza oscura con hilachas de lluvia colgando) y unas torres
// detras, cada bola sombreada por su cuenta con la luz arriba a la izquierda y
// su borde marcado sobre las de detras. Se pinta en cuatro grados de tramado
// (para fundirse pixel a pixel); el cielo usa el ultimo.
function stormCloud(R, w, h, tones) {
  const front = [], back = [], n = 4 + Math.floor(w / 22);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, bulge = Math.sin(t * Math.PI), r = (h * 0.34 + R() * h * 0.16) * (0.62 + 0.5 * bulge);
    front.push({ x: 3 + t * (w - 6) + (R() - 0.5) * 4, y: h - 3 - r * 0.55 - bulge * 2 - R() * 2, r });
  }
  for (let i = 0; i < 4; i++) {
    const t = 0.18 + i * 0.21 + (R() - 0.5) * 0.08, r = h * (0.26 + R() * 0.12);
    back.push({ x: t * w, y: h * 0.42 + R() * 3 - Math.sin(t * Math.PI) * 4, r });
  }
  front.sort((a, b) => a.y - b.y);
  const layer = (puffs, belly) => {
    const b = new Buf(w, h + 4), own = (x, y) => { for (let k = puffs.length - 1; k >= 0; k--) { const p = puffs[k]; if ((x + 0.5 - p.x) ** 2 + (y + 0.5 - p.y) ** 2 <= p.r * p.r) return p; } return null; };
    const xs = puffs.map((p) => [p.x - p.r * 0.8, p.x + p.r * 0.8]), x0 = Math.min(...xs.map((v) => v[0])), x1 = Math.max(...xs.map((v) => v[1]));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = own(x, y), band = belly && y >= h - 4 && x >= x0 && x <= x1;
      if (!p && !band) continue;
      let tone;
      if (!p || y >= h - 2) tone = y >= h - 1 ? 4 : bayer(x, y) < 0.5 ? 4 : 3;
      else {
        const ly = (y + 0.5 - p.y) / p.r, lx = (x + 0.5 - p.x) / p.r;
        // Cada bola, redonda: mas clara cerca de su punto de luz (arriba a la izquierda).
        const d = Math.hypot(lx + 0.35, ly + 0.5), v = 1.02 - d * 0.62 - 0.3 * (y / h) + (bayer(x, y) - 0.5) * 0.14;
        tone = v > 0.8 ? 0 : v > 0.58 ? 1 : v > 0.38 ? 2 : v > 0.2 ? 3 : 4;
        // El borde de arriba de una bola delante de otra (o del cielo) brilla.
        const above = y > 0 ? own(x, y - 1) : null;
        if (above !== p && ly < 0 && lx < 0.5) tone = Math.max(0, Math.min(tone, 1) - (above ? 0 : 1));
      }
      b.set(x, y, tones[tone]);
    }
    // Hilachas de lluvia colgando de la panza.
    if (belly) for (let x = Math.ceil(x0) + 2; x < x1 - 2; x += 3 + Math.floor(R() * 3)) {
      const len = 1 + Math.floor(R() * 3);
      for (let k = 0; k < len; k++) b.set(x + (k > 1 ? -1 : 0), h + k, tones[4], 200 - k * 50);
    }
    return b;
  };
  const steps = (b) => [0.3, 0.55, 0.8, 1].map((k) => {
    const c = new Buf(b.w, b.h);
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const i = (y * b.w + x) * 4;
      if (b.d[i + 3] && bayer(x, y) < k) { c.d.set(b.d.subarray(i, i + 4), i); }
    }
    return c.canvas();
  });
  return { back: steps(layer(back, false)), front: steps(layer(front, true)), w, h };
}

export function createSky() {
  let W = 0, skyKey = "", skyImg = null, cloudKey = "", cover = "", season = "";
  let clouds = [], stars = [], birds = [], nextBird = 8, bolt = null;
  const lastFlock = {};
  const sprites = { sun: sunSprite(false), low: sunSprite(true), moon: null, moonKey: "", rainbow: rainbowSprite() };
  // Color del cielo: el que se ve (shown) va hacia el que toca (target).
  let shownStops = null, fromStops = null, targetStops = null, targetKey = "", mixK = 1;
  let fog = null;

  function build(width) {
    W = width; skyKey = ""; cloudKey = ""; cover = ""; birds = []; clouds = []; shownStops = null; targetKey = "";
    const R = rng(77);
    stars = Array.from({ length: Math.round(W / 5) }, () => ({ x: Math.floor(R() * W), y: 6 + Math.floor(R() * 48), big: R() < 0.12, p: R() * 6, k: 1 + R() * 2 }));
    // Bruma de la niebla: bandas tramadas que se mueven despacio.
    const b = new Buf(W, 30);
    for (let y = 0; y < 30; y++) for (let x = 0; x < W; x++) {
      const d = Math.sin(y / 29 * Math.PI) * (0.55 + 0.45 * Math.sin(x / 23 + Math.sin(x / 61) * 2));
      if (bayer(x, y) < d * 0.5) b.set(x, y, "#d6dde3");
    }
    fog = b.canvas();
  }

  // Nubes nuevas cuando cambia el tiempo: las de antes se desvanecen y las
  // nuevas aparecen (las cargadas, con su forma de tormenta). De color nuevo
  // cuando cambia la luz.
  function placeClouds(nextCover, instant) {
    const [base, heavy] = CLOUD_COUNT[nextCover] || CLOUD_COUNT.fair, R = rng(101 + nextCover.length * 31);
    const n = Math.max(2, Math.round(base * W / 400));
    for (const c of clouds) c.out = true;
    const fresh = Array.from({ length: n }, (_, i) => {
      const w = heavy ? 40 + Math.floor(R() * 44) : 22 + Math.floor(R() * 32), h = heavy ? 15 + Math.floor(R() * 8) : 8 + Math.floor(R() * 7);
      return { seed: 500 + i + nextCover.length * 40, w, h, heavy, x: R() * (W + 40) - 20, y: heavy ? -7 + Math.floor(R() * 16) : 2 + Math.floor(R() * 26), v: heavy ? 3 + R() * 2 : 1 + R() * 2.4, img: null, alpha: instant ? 1 : 0, out: false };
    });
    clouds = [...clouds, ...fresh].sort((a, b) => a.v - b.v);
    cloudKey = "";
  }
  function paintClouds(cols) {
    const key = cols.join();
    if (key === cloudKey) return;
    cloudKey = key;
    const tones = [cols[0], mix(cols[0], cols[1], 0.5), cols[1], cols[2], mix(cols[2], "#05070c", 0.3)];
    for (const c of clouds) {
      if (!c.heavy) { c.img = makeCloud(rng(c.seed), c.w, c.h, cols); continue; }
      const storm = stormCloud(rng(c.seed), c.w, c.h, tones), [cc, cg] = makeCanvas(c.w, c.h + 4);
      cg.drawImage(storm.back[3], 0, 0); cg.drawImage(storm.front[3], 0, 0);
      c.img = cc;
    }
  }

  // sky: { altitude, phase, cover, wind }; scene: lo que manda FooterSky.
  function update(dt, sky, scene, t) {
    if (!W) return;
    const nextSeason = currentSeason();
    if (sky.cover !== cover || nextSeason !== season) { const first = !cover; cover = sky.cover; season = nextSeason; placeClouds(cover, first); }
    // La altura en pasos de 0.05 para no repintar las nubes a cada minuto.
    paintClouds(cloudColors({ altitude: Math.round(sky.altitude * 20) / 20, cover }));
    // El color se funde hacia el nuevo en WEATHER_FADE_S (en pasos de 0.1).
    const target = skyStops({ ...sky, season }), key = target.join();
    if (key !== targetKey) { targetKey = key; fromStops = shownStops || target; targetStops = target; mixK = shownStops ? 0 : 1; }
    mixK = Math.min(1, mixK + dt / WEATHER_FADE_S);
    shownStops = blend(fromStops, targetStops, Math.round(mixK * 10) / 10);
    const shownKey = shownStops.join() + W;
    if (shownKey !== skyKey) { skyKey = shownKey; skyImg = buildSky(W, shownStops, FADE); }
    const dir = season === "april-fools" ? -1 : 1, gust = 0.5 + Math.min(2, sky.wind || 1) * 0.5;
    for (const c of clouds) {
      c.x -= c.v * gust * dt * dir;
      c.alpha = Math.min(1, Math.max(0, c.alpha + (c.out ? -1 : 1) * dt / WEATHER_FADE_S));
      if (dir > 0 && c.x + c.w < -4) c.x = W + 4 + Math.random() * 30;
      if (dir < 0 && c.x > W + 4) c.x = -c.w - 4 - Math.random() * 30;
    }
    clouds = clouds.filter((c) => !c.out || c.alpha > 0);
    const dark = darkness(sky.altitude);
    if (!birds.length && t > nextBird && dark < 0.55 && ["clear", "fair", "cloudy"].includes(cover)) {
      if (!spawnFlock(sky.altitude < 0.3, {}, t)) nextBird = t + 10;
    }
    for (const b of birds) flyBird(b, dt, t);
    const flying = birds.length;
    birds = birds.filter((b) => b.dir < 0 ? b.x > -30 : b.x < W + 30);
    // La bandada ha salido: pausa antes de la siguiente.
    if (flying && !birds.length) nextBird = t + between(BIRD_PAUSE);
    const moonKey = (scene.fullMoon ? 0.5 : Math.round((scene.moonPhase ?? 0.5) * 60) / 60) + (scene.fullMoon ? "f" : "");
    if (moonKey !== sprites.moonKey) { sprites.moonKey = moonKey; sprites.moon = moonSprite(scene.fullMoon ? 0.5 : scene.moonPhase ?? 0.5, scene.fullMoon); }
  }

  // Una bandada nueva: unos pajaritos juntos, un par de cuervos o alguna
  // gaviota, segun la estacion; al amanecer y al atardecer, cuervos volviendo.
  // (forced: { kind, dir } para probar una especie desde __daivrWorld)
  function spawnFlock(golden, forced = {}, t = 0) {
    const dir = forced.dir || (Math.random() < 0.72 ? -1 : 1);
    const kind = forced.kind || pickBird(BIRD_MIX[golden ? "golden" : natureSeason(season)], (k) => lastFlock[k] == null || t - lastFlock[k] > BIRD_RETURN[k]);
    if (!kind) return false;
    lastFlock[kind] = t;
    const F = FLIGHT[kind], y0 = between(F.y), speed = between(F.speed), start = dir < 0 ? W + 12 : -28;
    const n = Math.round(between(F.group)) + (golden && kind === "crow" ? 1 : 0);
    for (let i = 0; i < n; i++) {
      // sueltos: cada uno a su distancia y uno arriba, otro abajo, sin taparse
      const dx = i * F.gap + Math.random() * F.gap * 0.5, dy = (i % 2 ? -1 : 1) * (i ? 2 + Math.random() * 3 : 0);
      birds.push({
        kind, dir, x: start - dir * dx, base: y0 + dy, y: y0 + dy, v: speed * (0.92 + Math.random() * 0.16),
        p: Math.random(), sw: Math.random() * 6, gliding: false, left: between(F.flaps), lift: 0, bob: 0
      });
    }
    return true;
  }
  function flyBird(b, dt, t) {
    const F = FLIGHT[b.kind];
    b.x += b.dir * b.v * dt;
    // Aletea unas veces y planea un rato (cayendo un poco); al volver a
    // aletear recupera altura. Cada aletazo es un saltito hacia arriba.
    if (b.gliding) { b.left -= dt; b.lift = Math.min(3, b.lift + dt * 1.4); if (b.left <= 0) { b.gliding = false; b.left = between(F.flaps); } }
    else { b.left -= dt * F.flap; b.lift = Math.max(0, b.lift - dt * 2.6); if (b.left <= 0) { b.gliding = true; b.left = between(F.glide); } }
    const phase = (t * F.flap + b.p) % 1;
    b.bob = b.gliding ? 0 : -Math.sin((phase - 0.25) * Math.PI * 2) * F.bounce;
    b.y = b.base + Math.sin(t * F.swoopHz * Math.PI * 2 + b.sw) * F.swoop + b.lift + b.bob;
  }
  function drawBirds(g, t, dusk) {
    const sets = birdSprites();
    for (const b of birds) {
      const F = FLIGHT[b.kind], pose = b.gliding ? "glide" : WING[Math.floor(((t * F.flap + b.p) % 1) * 4)];
      const img = sets[b.kind][dusk ? "dusk" : "day"][b.dir < 0 ? "left" : "right"][pose];
      g.drawImage(img, Math.round(b.x), Math.round(b.y) - BIRD_ANCHOR[b.kind]);
    }
  }

  // Rayo de tormenta: un zigzag nuevo en cada relampago.
  function strike() {
    const pts = [[Math.round(W * (0.2 + Math.random() * 0.6)), 4]];
    while (pts[pts.length - 1][1] < 46) { const [x, y] = pts[pts.length - 1]; pts.push([x + Math.round((Math.random() - 0.5) * 8), y + 3 + Math.floor(Math.random() * 4)]); }
    bolt = pts;
  }

  // Una bola de fuego (lluvias de estrellas): cabeza de 3x3 con halo, estela
  // larga que pasa de verde a ambar y chispas que se quedan atras.
  function drawFireball(g, hx, hy, ux, uy, a, p, now) {
    for (let i = 26; i >= 1; i--) {
      g.globalAlpha = a * (1 - i / 27) * 0.95;
      const col = i < 3 ? "#f4fff0" : i < 8 ? "#a8ffd2" : i < 16 ? "#7ae0b8" : "#ffc878";
      px(g, Math.round(hx - ux * i), Math.round(hy - uy * i), col);
      if (i < 10) px(g, Math.round(hx - ux * i - uy), Math.round(hy - uy * i + ux), i < 5 ? "#c8ffe4" : "#5ac8a0");
    }
    for (let k = 0; k < 4; k++) {
      const back = 8 + ((now / 70 + k * 5) % 16), jit = Math.sin(now / 90 + k * 2.1) * 1.5;
      g.globalAlpha = a * 0.7 * (1 - back / 26);
      px(g, Math.round(hx - ux * back - uy * jit), Math.round(hy - uy * back + ux * jit), k % 2 ? "#ffe9a8" : "#ffffff");
    }
    const x = Math.round(hx), y = Math.round(hy);
    g.globalAlpha = a * 0.35;
    rect(g, x - 2, y - 2, 5, 5, "#c8ffe4");
    g.globalAlpha = a;
    rect(g, x - 1, y - 1, 3, 3, "#d8ffe8"); px(g, x, y, "#ffffff");
    g.globalAlpha = 1;
  }

  // Todo lo del cielo, en filas del mundo (0 = arriba del cielo).
  function draw(g, t, sky, scene, { flash = false, flashStart = false, cssWidth = W * 2 } = {}) {
    if (!skyImg) return;
    const now = performance.now(), dark = darkness(sky.altitude), wet = ["rain", "storm"].includes(cover);
    g.drawImage(skyImg, 0, 0);
    // Estrellas: de noche y con el cielo abierto.
    const starA = clamp01((dark - 0.55) / 0.35) * (cover === "clear" || cover === "fair" ? 1 : cover === "cloudy" ? 0.25 : 0);
    if (starA > 0.02) {
      g.globalAlpha = starA;
      for (const st of stars) {
        const v = 0.55 + 0.45 * Math.sin(t * st.k + st.p);
        px(g, st.x, st.y, v > 0.85 ? "#ffffff" : v > 0.5 ? "#c8d2ff" : "#6f7bbd");
        if (st.big && v > 0.8) { px(g, st.x - 1, st.y, "#8f9be0"); px(g, st.x + 1, st.y, "#8f9be0"); px(g, st.x, st.y - 1, "#8f9be0"); px(g, st.x, st.y + 1, "#8f9be0"); }
      }
      g.globalAlpha = 1;
    }
    // Sol o luna en su punto del arco (x en %, y en px CSS sobre el riel).
    const body = scene.body;
    if (body && !wet) {
      const moonUp = scene.sun == null || season === "halloween";
      const img = moonUp ? sprites.moon : sky.altitude < 0.3 ? sprites.low : sprites.sun;
      const veil = cover === "fog" ? 0.35 : cover === "cloudy" || cover === "snow" ? 0.6 : 1;
      if (img) {
        g.globalAlpha = veil;
        g.drawImage(img, Math.round(body.x / 100 * W) - 14, Math.round(FEET - body.y / 2) - 14);
        g.globalAlpha = 1;
      }
    }
    // Estrellas fugaces de FooterSky: el mismo recorrido que su boton.
    for (const s of scene.stars || []) {
      const p = (now - s.born) / s.ms;
      if (p < 0 || p > 1) continue;
      const a = p < 0.08 ? p / 0.08 : p > 0.8 ? (1 - p) / 0.2 : 1;
      const hx = (s.left / 100 * cssWidth + s.dx * p) / 2, hy = (s.top + s.dy * p) / 2, len = Math.hypot(s.dx, s.dy), ux = s.dx / len, uy = s.dy / len;
      if (s.fireball) { drawFireball(g, hx, hy, ux, uy, a, p, now); continue; }
      for (let i = 12; i >= 1; i--) {
        g.globalAlpha = a * (1 - i / 13);
        px(g, Math.round(hx - ux * i), Math.round(hy - uy * i), i < 4 ? "#fff6cf" : "#cfe0ff");
      }
      g.globalAlpha = a;
      const x = Math.round(hx), y = Math.round(hy);
      px(g, x - 1, y, "#ffe9a8"); px(g, x + 1, y, "#ffe9a8"); px(g, x, y - 1, "#ffe9a8"); px(g, x, y + 1, "#ffe9a8"); px(g, x, y, "#ffffff");
      g.globalAlpha = 1;
    }
    // Arcoiris al escampar: se abre desde el centro, se queda y se apaga.
    const rb = scene.rainbow;
    if (rb) {
      const p = (now - rb.born) / RAINBOW_MS;
      if (p >= 0 && p < 1) {
        const open = clamp01(p / 0.22), alpha = p < 0.22 ? 0.62 * open : p < 0.75 ? 0.62 - 0.07 * (p - 0.22) / 0.53 : 0.55 * (1 - (p - 0.75) / 0.25);
        const img = sprites.rainbow, sw = Math.max(2, Math.round(img.width * smooth(open))), sx = Math.round((img.width - sw) / 2);
        g.globalAlpha = alpha;
        g.drawImage(img, sx, 0, sw, img.height, Math.round(rb.x / 2) - img.width / 2 + sx, RAINBOW_BASE - img.height, sw, img.height);
        g.globalAlpha = 1;
      }
    }
    if (flash && flashStart) strike();
    if (flash && bolt) {
      for (let i = 1; i < bolt.length; i++) {
        const [x0, y0] = bolt[i - 1], [x1, y1] = bolt[i];
        for (let s = 0; s <= 4; s++) { const x = Math.round(x0 + (x1 - x0) * s / 4), y = Math.round(y0 + (y1 - y0) * s / 4); px(g, x + 1, y, "#9fb6ff"); px(g, x, y, "#f4f8ff"); }
      }
    }
    for (const c of clouds) {
      if (!c.img || c.alpha <= 0) continue;
      g.globalAlpha = c.alpha;
      g.drawImage(c.img, Math.round(c.x), c.y);
    }
    g.globalAlpha = 1;
    drawBirds(g, t, sky.altitude < 0.3);
  }

  // Niebla por encima del bosque (despues de la luz del mundo).
  function drawFog(g, t) {
    if (cover !== "fog" || !fog) return;
    const off = Math.floor(t * 2) % W;
    g.globalAlpha = 0.5;
    g.drawImage(fog, -off, 36); g.drawImage(fog, W - off, 36);
    g.globalAlpha = 1;
  }

  return { build, update, draw, drawFog, flock: (kind, dir) => spawnFlock(false, { kind, dir }) };
}
