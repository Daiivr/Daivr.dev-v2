import { lazy, outlinedSprite, px, rect } from "../core.js";
import { FARM_SPRITES } from "../farmArt.js";
import { normalizeWatered } from "../../../../shared/buddy-garden-water.mjs";

// El huerto del centro del prado (las semillas se compran en su cobertizo: ver
// shared/buddy-market.mjs). Tres bancales de madera con la tierra labrada, una
// valla de estacas detras, su cartel y la regadera apoyada al final. Cada planta pasa por sus fases segun
// lo que lleva creciendo de verdad (semilla, brote, mata, casi lista y
// madura, que destella). La tierra se oscurece mojada cuando llueve o cuando
// Pip la riega (FooterWorld guarda la humedad de cada planta), y Pip
// cosecha lo maduro (events/garden.js lo lleva en alto).
const LEAF = { l: "#8ad85a", g: "#5ab04a", G: "#3a7a32" };
const OUT = "#1a3410";
const CROP_ART = {
  radish: {
    pal: { ...LEAF, r: "#d8345a", R: "#ff6a8a", W: "#ffd0dc", D: "#a82040" },
    pair: true,
    stages: [
      ["l...l", "ll.ll", ".lgl.", "..g.."],
      ["l.l.l", "lglgl", "glGlg", ".gGg.", "..g.."],
      { rows: ["l.l.l", "lglgl", "glGlg", ".gGg.", ".rRr.", "rRWRr", "rrrrr", ".rDr."], sink: 1 }
    ],
    item: [".l.l.", "lglgl", "..g..", ".rRr.", "rRWRr", "rrrrr", ".rrr.", "..r.."]
  },
  carrot: {
    pal: { ...LEAF, o: "#e8822a", O: "#ffb04a" },
    pair: true,
    stages: [
      ["l.l.l", ".lgl.", "..g.."],
      ["l.l.l", "glglg", ".lgl.", "l.g.l", "..g.."],
      { rows: ["l.l.l", "glglg", "lglgl", ".lgl.", "..g..", ".oOo.", ".oOo.", "..o.."], sink: 1 }
    ],
    item: ["l.l.l", "glglg", ".lgl.", ".oOo.", ".oOo.", ".ooo.", "..o..", "..o.."]
  },
  strawberry: {
    pal: { ...LEAF, w: "#f8f4f0", y: "#ffd84a", r: "#e83a4a", R: "#ff8a8a", W: "#ffe0a0" },
    stages: [
      ["..l.l..", ".lglgl.", "lgggggl", "...g..."],
      ["..w...w..", ".wyw.wyw.", "lgwglgwgl", "gGgggGggg", ".gGgggGg.", "...ggg..."],
      [".l..l..l.", "lglgglglg", "gRrggRrgg", "grrgGrrgG", "gGgRrgggg", ".ggrrgGg.", "...ggg..."]
    ],
    item: [".glg.", "rRrRr", "rrWrr", "rRrrr", ".rrr.", "..r.."]
  },
  pumpkin: {
    pal: { ...LEAF, y: "#ffd84a", Y: "#ffaa2a", o: "#e07a22", O: "#ffa040", W: "#ffd890", s: "#5a7a2a" },
    stages: [
      ["l...l", "lg.gl", ".lgl.", "..g.."],
      ["ll.....ll", "lgl...lgl", ".glg.glg.", "..gyYg...", "...gg...."],
      { rows: ["....s.ll..", "....sllgl.", ".oOoOoOo..", "oOWoOoOoo.", "oOoOoOoOo.", "oOoOoOoOo.", ".ooOoOoo..", "..oooooo.."], sink: 1 }
    ],
    item: ["...s...", ".oOoOo.", "oWoOoOo", "oOoOoOo", "oOoOoOo", ".ooooo."]
  }
};
const SPROUT = ["l.l", "lgl", ".g."];
// Bancal de madera: tierra labrada arriba (con surcos) y tres tablas delante
// con clavos en las esquinas; los postes de las esquinas asoman un poco.
// Mojada, la tierra se oscurece; la madera no cambia.
const WOOD = { P: "#d8a868", W: "#c8955a", w: "#a8743e", d: "#7a4a22", n: "#4a2e18" };
const SOIL = {
  dry: { t: "#a8784a", s: "#8a5a34", f: "#6a4226", ...WOOD },
  wet: { t: "#6e4a30", s: "#553823", f: "#3e2818", ...WOOD }
};
function bedRows(w) {
  const row = (fn) => Array.from({ length: w }, (_, x) => fn(x)).join("");
  return [
    row((x) => (x === 0 || x === w - 1 ? "P" : "t")),
    row((x) => (x === 0 || x === w - 1 ? "P" : x % 3 === 1 ? "f" : "s")),
    row(() => "W"),
    row((x) => (x === 1 || x === w - 2 ? "n" : "w")),
    row(() => "d")
  ];
}
// La valla de detras: postes con la punta en pico cada FENCE_STEP y dos
// travesaños, de madera clara con su sombra.
const FENCE_H = 9, FENCE_STEP = 8;
function fenceRows(w) {
  const rows = [];
  for (let y = 0; y < FENCE_H; y++) {
    let r = "";
    for (let x = 0; x < w; x++) {
      const k = x % FENCE_STEP, post = k === 0 || k === 1;
      if (post) r += y === 0 ? (k === 0 ? "P" : ".") : k === 0 ? "P" : "p";
      else r += y === 2 ? "R" : y === 3 ? "r" : y === 5 ? "R" : y === 6 ? "r" : ".";
    }
    rows.push(r);
  }
  return rows;
}
const FENCE_PAL = { P: "#d8a868", p: "#a8743e", R: "#c8955a", r: "#8a5a2e" };
const SIGN = { rows: ["wwwww", "wlglw", "wwgww", "..p..", "..p..", "..p.."], pal: { w: "#c8955a", l: "#8ad85a", g: "#3a7a32", p: "#8a5a2e" }, out: "#3a2414" };
// La regadera de cinc: cuerpo redondo, asa en arco y el caño largo con la
// alcachofa en la punta; al regar, inclinada hacia delante.
const CAN = {
  rest: [
    "..hhhh.....",
    ".h....h...R",
    ".cCCCCc..sR",
    ".cCcccc.s..",
    ".cccccccs..",
    ".cccccd....",
    "..dddd....."
  ],
  pour: [
    "..hhh......",
    ".h...hh....",
    ".h.cCCc....",
    "..cCcccc...",
    "..cccccccs.",
    "...ccccd..s",
    "....ddd...R",
    "..........R"
  ],
  pal: { h: "#5a6a78", c: "#8aa0b0", C: "#c8d8e0", d: "#5a6a78", s: "#8aa0b0", R: "#c8d8e0" }
};
const pad = (rows) => { const w = Math.max(...rows.map((r) => r.length)); return rows.map((r) => r.padEnd(w, ".")); };
// El contorno de un sprite (para resaltarlo al pasar el raton, como el puesto).
function outlineSprite(img, col) {
  const c = document.createElement("canvas");
  c.width = img.width + 2; c.height = img.height + 2;
  const g = c.getContext("2d"), d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
  const A = (x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : d[(y * img.width + x) * 4 + 3]);
  g.fillStyle = col;
  for (let y = -1; y <= img.height; y++) for (let x = -1; x <= img.width; x++) {
    if (A(x, y)) continue;
    if (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1)) g.fillRect(x + 1, y + 1, 1, 1);
  }
  return c;
}
export const GARDEN_SPRITES = lazy(() => {
  const crops = {};
  for (const [id, c] of Object.entries(CROP_ART)) {
    crops[id] = {
      pair: Boolean(c.pair),
      stages: c.stages.map((stage) => { const rows = Array.isArray(stage) ? stage : stage.rows; return { img: outlinedSprite(pad(rows), c.pal, OUT), sink: stage.sink || 0 }; }),
      item: outlinedSprite(pad(c.item), c.pal, OUT)
    };
  }
  const soil = {};
  for (const w of [8, 13]) soil[w] = { dry: outlinedSprite(bedRows(w), SOIL.dry, "#3a2414"), wet: outlinedSprite(bedRows(w), SOIL.wet, "#2a180c") };
  const can = outlinedSprite(pad(CAN.rest), CAN.pal, "#3a2010");
  return {
    crops, soil, sprout: outlinedSprite(SPROUT, LEAF, OUT),
    sign: outlinedSprite(SIGN.rows, SIGN.pal, SIGN.out),
    can, canPour: outlinedSprite(pad(CAN.pour), CAN.pal, "#3a2010"), canHover: outlineSprite(can, HOVER),
    fence: (w) => outlinedSprite(fenceRows(w), FENCE_PAL, "#3a2414")
  };
});
const HOVER = "#fff3c4";
// Lo cosechado, para llevarlo en alto (events/garden.js): un cultivo, un
// tarro de miel, una fruta o la calabaza gigante entera.
export const cropItem = (crop) => {
  const art = GARDEN_SPRITES().crops[crop]?.item;
  if (art) return art;
  const F = FARM_SPRITES();
  return crop === "honey" ? F.honey : crop === "giant" ? F.giant : F.fruit[crop] || null;
};

// Las plantas con humedad reciente (Pip, o la lluvia): FooterWorld las
// guarda y el cobertizo de semillas pinta la tierra mojada.
const GARDEN_KEY = "daivr.garden.v2";
export function readWatered(now = Date.now()) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GARDEN_KEY) || "null");
    return normalizeWatered(saved, now);
  } catch {
    return new Map();
  }
}
export function saveWatered(watered) {
  try {
    window.localStorage.setItem(GARDEN_KEY, JSON.stringify({ version: 2, watered: [...watered] }));
  } catch {
    // Sin almacenamiento: lo regado vale para esta visita.
  }
}

// Fase de una planta por lo que lleva crecido (0..1): 0 semilla, 1 brote,
// 2 mata, 3 casi lista, 4 madura.
export const cropStage = (growth) => (growth >= 1 ? 4 : growth >= 0.65 ? 3 : growth >= 0.35 ? 2 : growth >= 0.12 ? 1 : 0);

// En el borde del prado, pegado al sendero (el agua de la regadera de Pip
// cae justo en la tierra del bancal). Filas del bancal desde SOIL_TOP: contorno,
// tierra de arriba, tierra (donde arraigan), tres tablas y contorno.
export const SOIL_TOP = 68; // fila de arriba del bancal (con su contorno)
export const PLANT_BASE = 70; // donde arraigan las plantas
const FENCE_TOP = SOIL_TOP - 9; // la valla asoma por detras de los bancales

// Un bancal con lo que crece en el: la tierra (seca o mojada, fundidas), la
// planta y, por delante, las tablas, que tapan lo que queda bajo tierra (el
// rabano y la zanahoria asoman de la tierra).
export function drawBed(g, S, cx, entry, { wet = 0, t = 0, wind = 0, wide = true, snow = null } = {}) {
  const soil = S.soil[13], left = cx - 7;
  g.drawImage(soil.dry, left, SOIL_TOP);
  if (wet > 0.02) { g.globalAlpha = Math.min(1, wet); g.drawImage(soil.wet, left, SOIL_TOP); g.globalAlpha = 1; }
  if (snow) g.drawImage(snow, left, SOIL_TOP);
  if (!entry) return;
  drawPlant(g, S, entry, cx, t, wind, wide);
  // las tablas de delante, otra vez encima
  g.drawImage(soil.dry, 0, 3, soil.dry.width, soil.dry.height - 3, left, SOIL_TOP + 3, soil.dry.width, soil.dry.height - 3);
}

export function createGarden() {
  let L = null, plots = [], watered = new Set(), pulled = new Map();
  // la calabaza gigante: { plots, ripe } (de FooterWorld), o null
  let giant = null;
  // el huerto quieto (valla y cartel), compuesto una vez, y su contorno
  let frame = null, frameOutline = null;
  // humedad de cada parcela (0 seca .. 1 mojada), para fundir el color
  const wet = [0, 0, 0];
  const frameX = () => L.x - 2;
  function buildFrame() {
    const S = GARDEN_SPRITES(), w = L.end - L.x + 4;
    const c = document.createElement("canvas");
    c.width = w; c.height = 72 - FENCE_TOP + 4;
    const g = c.getContext("2d");
    g.drawImage(S.fence(L.fenceEnd - L.x + 1), 1, 0);
    // (los bancales tambien, para el contorno; luego se pintan encima con su planta)
    for (const cx of L.plots) g.drawImage(S.soil[13].dry, cx - 7 - frameX(), SOIL_TOP - FENCE_TOP);
    g.drawImage(S.sign, L.x - 1 - frameX(), 72 - S.sign.height + 1 - FENCE_TOP);
    frame = c;
    frameOutline = outlineSprite(c, HOVER);
  }
  return {
    setup(ctx) { L = ctx.L.garden; pulled = new Map(); frame = null; },
    // FooterWorld: lo plantado y las parcelas que siguen humedas.
    set(list, wetPlots, giantInfo = null) {
      plots = list.slice();
      watered = new Set(wetPlots || []);
      giant = giantInfo && giantInfo.plots?.length ? giantInfo : null;
      for (const id of [...pulled.keys()]) if (!plots.some((p) => p.seedId === id)) pulled.delete(id);
    },
    // Pip arranca la planta: desaparece entre tierra que salta.
    pull(plot, ctx) {
      const entry = plots.find((p) => p.plot === plot);
      if (!L || !entry || pulled.has(entry.seedId)) return null;
      pulled.set(entry.seedId, ctx.t);
      // (la gigante sale entera: las tres, con un buen estallido de tierra)
      if (giant?.ripe && giant.plots.includes(plot)) {
        for (const other of plots) if (giant.plots.includes(other.plot)) pulled.set(other.seedId, ctx.t);
        const gx = L.plots[1];
        for (let i = 0; i < 18; i++) ctx.spawn({ k: "pix1", x: gx + (Math.random() - 0.5) * 34, y: PLANT_BASE, vx: (Math.random() - 0.5) * 40, vy: -12 - Math.random() * 20, g: 70, life: 0.5 + Math.random() * 0.3, c: Math.random() < 0.5 ? "#8a5a34" : "#b07a4a" });
        return entry;
      }
      const x = L.plots[plot];
      for (let i = 0; i < 7; i++) ctx.spawn({ k: "pix1", x: x + (Math.random() - 0.5) * 6, y: PLANT_BASE, vx: (Math.random() - 0.5) * 26, vy: -10 - Math.random() * 14, g: 70, life: 0.45 + Math.random() * 0.2, c: Math.random() < 0.5 ? "#8a5a34" : "#b07a4a" });
      for (let i = 0; i < 3; i++) ctx.spawn({ k: "pix1", x: x + (Math.random() - 0.5) * 4, y: PLANT_BASE - 4, vx: (Math.random() - 0.5) * 16, vy: -12 - Math.random() * 8, g: 50, life: 0.5, c: "#8ad85a" });
      return entry;
    },
    update(ctx) {
      if (!L) return;
      const rain = ctx.rain ? 1 : Math.min(1, Math.max(0, (ctx.wet - 0.2) * 2));
      for (let i = 0; i < L.plots.length; i++) {
        const want = Math.max(rain, watered.has(i) ? 1 : 0);
        wet[i] += (want - wet[i]) * Math.min(1, ctx.dt * (want > wet[i] ? 1.6 : 0.2));
      }
    },
    ground(g, ctx) {
      if (!L) return;
      if (!frame) buildFrame();
      const S = GARDEN_SPRITES(), wind = ctx.wind || 1;
      // la valla y el cartel (con su nieve si la hay)
      g.drawImage(frame, frameX(), FENCE_TOP);
      const cap = ctx.snowCap?.(frame);
      if (cap) g.drawImage(cap, frameX(), FENCE_TOP);
      // la regadera apoyada al final (si no la lleva Pip)
      const carried = ctx.actors.some((a) => !a.ghost && a.mood === "garden" && a.gardenTask === "water");
      if (!carried) g.drawImage(S.can, L.can, 73 - S.can.height + 1);
      const big = giant?.ripe ? giant : null;
      for (let i = 0; i < L.plots.length; i++) {
        const cx = L.plots[i], entry = plots.find((p) => p.plot === i);
        const shown = entry && !pulled.has(entry.seedId) && !(big && big.plots.includes(i)) ? entry : null;
        drawBed(g, S, cx, shown, { wet: wet[i], t: ctx.t, wind, wide: L.w >= 12, snow: entry ? null : ctx.snowCap?.(S.soil[13].dry) });
        // gotitas que brillan en la tierra recien regada
        if (wet[i] > 0.6 && !ctx.rain) { px(g, cx - 4, SOIL_TOP + 1, "#9ab8d0"); px(g, cx + 5, SOIL_TOP + 2, "#9ab8d0"); }
      }
      // la gigante, sentada sobre los tres bancales (tiembla mientras Pip tira)
      if (big && !plots.some((p) => big.plots.includes(p.plot) && pulled.has(p.seedId))) {
        const img = FARM_SPRITES().giant, tug = ctx.actors.some((a) => !a.ghost && a.mood === "garden" && a.gardenTask === "giant" && a.garden === "tug");
        const shake = tug ? Math.round(Math.sin(ctx.t * 30)) : 0;
        g.fillStyle = "rgba(40,22,10,.35)"; g.fillRect(L.plots[1] - 16, PLANT_BASE + 3, 32, 1);
        g.drawImage(img, L.plots[1] - Math.floor(img.width / 2) + shake, PLANT_BASE + 3 - img.height + 1);
        const cap = ctx.snowCap?.(img);
        if (cap) g.drawImage(cap, L.plots[1] - Math.floor(img.width / 2) + shake, PLANT_BASE + 3 - img.height + 1);
      }
    },
    // lo maduro destella de vez en cuando (como el forraje), y al pasar el
    // raton por el huerto (FooterWorld: state.gardenHover) se ilumina el contorno
    glow(g, ctx) {
      if (!L) return;
      for (const entry of plots) {
        if (entry.growth < 1 || pulled.has(entry.seedId)) continue;
        // (las de la gigante no destellan: hasta que se junten, esperan)
        if (giant && giant.plots.includes(entry.plot) && !(giant.ripe && entry.plot === giant.plots[1])) continue;
        const c = ((ctx.t + entry.plot * 0.9) % 2.8) / 2.8;
        if (c > 0.12) continue;
        const x = L.plots[entry.plot] + 2, y = PLANT_BASE - 8;
        px(g, x, y, "#ffffff");
        if (c > 0.03 && c < 0.09) { px(g, x - 1, y, "#fff6cf"); px(g, x + 1, y, "#fff6cf"); px(g, x, y - 1, "#fff6cf"); px(g, x, y + 1, "#fff6cf"); }
      }
      if (ctx.state?.gardenHover && frameOutline) {
        const S = GARDEN_SPRITES();
        g.globalAlpha = 0.85;
        g.drawImage(frameOutline, frameX() - 1, FENCE_TOP - 1);
        if (!ctx.actors.some((a) => !a.ghost && a.mood === "garden" && a.gardenTask === "water")) g.drawImage(S.canHover, L.can - 1, 73 - S.can.height);
        g.globalAlpha = 1;
      }
    },
    // Pip riega: la parcela se moja poco a poco mientras cae el agua.
    soak(plot, amount) { if (wet[plot] != null) wet[plot] = Math.min(1, Math.max(wet[plot], amount)); },
    get plots() { return plots; },
    get giant() { return giant; },
    get layout() { return L; }
  };
}

export function drawPlant(g, S, entry, cx, t, wind, wide) {
  const stage = cropStage(entry.growth);
  if (stage === 0) {
    // semillas recien enterradas: hoyitos con una semilla asomando
    for (const dx of wide ? [-3, 0, 3] : [-2, 1]) { px(g, cx + dx, SOIL_TOP + 2, "#4a2e18"); px(g, cx + dx, SOIL_TOP + 1, "#e8d8a0"); }
    return;
  }
  const art = S.crops[entry.crop];
  if (!art) return;
  const sprite = stage === 1 ? { img: S.sprout, sink: 0 } : art.stages[stage - 2];
  const img = sprite.img, top = PLANT_BASE - img.height + 1 + sprite.sink;
  // (dos matas por parcela en las anchas, para rabanos y zanahorias)
  const xs = art.pair && wide ? [cx - 3, cx + 3] : [cx];
  for (const x of xs) {
    const left = x - Math.floor(img.width / 2);
    // su sombrita en la tierra
    g.fillStyle = "rgba(40,22,10,.35)"; g.fillRect(left + 1, PLANT_BASE, Math.max(1, img.width - 2), 1);
    // las hojas de arriba se mecen con el viento; lo de abajo queda quieto
    const sway = Math.sin(t * 1.7 + x * 0.9) * wind > 0.75 ? 1 : 0, half = Math.ceil(img.height / 2);
    g.drawImage(img, 0, 0, img.width, half, left + sway, top, img.width, half);
    g.drawImage(img, 0, half, img.width, img.height - half, left, top + half, img.width, img.height - half);
  }
}

// Una parcela suelta (el cobertizo de semillas la pinta en su lienzo): el
// bancal y lo que crece en el, `entry` como en set() o null.
export const PLOT_PREVIEW = { w: 17, h: 25 };
export function drawPlotPreview(canvas, entry, wet = false) {
  const g = canvas.getContext("2d"), S = GARDEN_SPRITES();
  canvas.width = PLOT_PREVIEW.w; canvas.height = PLOT_PREVIEW.h;
  g.imageSmoothingEnabled = false;
  g.setTransform(1, 0, 0, 1, 0, PLOT_PREVIEW.h - 7 - SOIL_TOP);
  drawBed(g, S, 8, entry, { wet: wet ? 1 : 0 });
  g.setTransform(1, 0, 0, 1, 0, 0);
}
// La cosecha sola (el sobre de semillas la lleva dibujada).
export function drawCropItem(canvas, crop) {
  const img = cropItem(crop);
  if (!img) return;
  canvas.width = img.width; canvas.height = img.height;
  const g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0);
}
