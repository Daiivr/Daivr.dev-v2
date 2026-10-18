import { lazy, outlinedSprite, px, rect } from "../core.js";

// El huerto junto al mercado (las semillas se compran en el puesto: ver
// shared/buddy-market.mjs). Tres caballones de tierra labrada con su cartel y
// la regadera de cobre apoyada al lado. Cada planta pasa por sus fases segun
// lo que lleva creciendo de verdad (semilla, brote, mata, casi lista y
// madura, que destella). La tierra se oscurece mojada cuando llueve o cuando
// Pip la riega (FooterWorld guarda que parcelas se han regado hoy), y Pip
// cosecha lo maduro (events/garden.js lo lleva en alto).
const LEAF = { l: "#8ad85a", g: "#5ab04a", G: "#3a7a32" };
const OUT = "#1a3410";
const CROP_ART = {
  radish: {
    pal: { ...LEAF, r: "#d8345a", R: "#ff6a8a", W: "#ffd0dc" },
    pair: true,
    stages: [
      [".l.l.", "lglgl", "..g.."],
      ["l...l", "gl.lg", ".glg.", "lgglg", "..g.."],
      { rows: ["l...l", "gl.lg", ".glg.", "..g..", ".rRr.", "rRWRr", "rrrrr", ".rrr."], sink: 3 }
    ],
    item: [".l.l.", "lglgl", "..g..", ".rRr.", "rRWRr", "rrrrr", ".rrr.", "..r.."]
  },
  carrot: {
    pal: { ...LEAF, o: "#e8822a", O: "#ffb04a" },
    pair: true,
    stages: [
      ["l.l", ".g.", ".g."],
      ["l.l.l", "glglg", ".lgl.", "l.g.l", "..g.."],
      { rows: ["l.l.l", "glglg", "lglgl", ".lgl.", "..g..", ".oOo.", ".oOo.", "..o.."], sink: 3 }
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
      { rows: ["....s.ll..", "....sllgl.", ".oOoOoOo..", "oOWoOoOoo.", "oOoOoOoOo.", "oOoOoOoOo.", ".ooOoOoo..", "..oooooo.."], sink: 2 }
    ],
    item: ["...s...", ".oOoOo.", "oWoOoOo", "oOoOoOo", "oOoOoOo", ".ooooo."]
  }
};
const SPROUT = ["l.l", ".g."];
const SOIL = {
  dry: { t: "#b07a4a", b: "#8a5a34", f: "#6e4428", s: "#a06a3e", d: "#5e3a20" },
  wet: { t: "#7a5236", b: "#5a3a24", f: "#46301c", s: "#6e4a30", d: "#3e2818" }
};
function soilRows(w) {
  const row = (fn) => Array.from({ length: w }, (_, x) => fn(x)).join("");
  return [
    row((x) => (x === 0 || x === w - 1 ? "." : "t")),
    row((x) => (x === 0 || x === w - 1 ? "t" : x % 3 === 2 ? "f" : "b")),
    row((x) => (x % 4 === 1 ? "s" : "b")),
    row(() => "d")
  ];
}
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
  for (const w of [8, 13]) soil[w] = { dry: outlinedSprite(soilRows(w), SOIL.dry, "#3a2414"), wet: outlinedSprite(soilRows(w), SOIL.wet, "#2a180c") };
  return {
    crops, soil, sprout: outlinedSprite(SPROUT, LEAF, OUT),
    sign: outlinedSprite(SIGN.rows, SIGN.pal, SIGN.out),
    can: outlinedSprite(pad(CAN.rest), CAN.pal, "#3a2010"), canPour: outlinedSprite(pad(CAN.pour), CAN.pal, "#3a2010")
  };
});
// Lo cosechado, para llevarlo en alto (events/garden.js).
export const cropItem = (crop) => GARDEN_SPRITES().crops[crop]?.item || null;

// Las parcelas que ya se han regado hoy (Pip, o la lluvia): FooterWorld las
// guarda y el cobertizo de semillas pinta la tierra mojada.
const GARDEN_KEY = "daivr.garden.v1";
export function readWatered(day) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GARDEN_KEY) || "null");
    return new Set(saved?.day === day && Array.isArray(saved.watered) ? saved.watered.filter(Number.isInteger) : []);
  } catch {
    return new Set();
  }
}
export function saveWatered(day, watered) {
  try {
    window.localStorage.setItem(GARDEN_KEY, JSON.stringify({ day, watered: [...watered] }));
  } catch {
    // Sin almacenamiento: lo regado vale para esta visita.
  }
}

// Fase de una planta por lo que lleva crecido (0..1): 0 semilla, 1 brote,
// 2 mata, 3 casi lista, 4 madura.
export const cropStage = (growth) => (growth >= 1 ? 4 : growth >= 0.65 ? 3 : growth >= 0.35 ? 2 : growth >= 0.12 ? 1 : 0);

// En el borde del prado, pegado al sendero (el agua de la regadera de Pip
// cae justo en la cara del caballon).
export const SOIL_TOP = 68; // fila de arriba del caballon (con su contorno)
export const PLANT_BASE = 70; // donde arraigan las plantas

export function createGarden() {
  let L = null, plots = [], watered = new Set(), pulled = new Map();
  // humedad de cada parcela (0 seca .. 1 mojada), para fundir el color
  const wet = [0, 0, 0];
  return {
    setup(ctx) { L = ctx.L.garden; pulled = new Map(); },
    // FooterWorld: lo plantado ([{ plot, seedId, crop, growth }]) y lo regado hoy.
    set(list, wateredToday) {
      plots = list.slice();
      watered = new Set(wateredToday || []);
      for (const id of [...pulled.keys()]) if (!plots.some((p) => p.seedId === id)) pulled.delete(id);
    },
    // Pip arranca la planta: desaparece entre tierra que salta.
    pull(plot, ctx) {
      const entry = plots.find((p) => p.plot === plot);
      if (!L || !entry || pulled.has(entry.seedId)) return null;
      pulled.set(entry.seedId, ctx.t);
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
      const S = GARDEN_SPRITES(), soil = S.soil[L.w] || S.soil[13], wind = ctx.wind || 1;
      // el cartel con su brote pintado y la regadera apoyada (si no la lleva Pip)
      g.drawImage(S.sign, L.x - 1, 72 - S.sign.height + 1);
      const signCap = ctx.snowCap?.(S.sign);
      if (signCap) g.drawImage(signCap, L.x - 1, 72 - S.sign.height + 1);
      const carried = ctx.actors.some((a) => !a.ghost && a.mood === "garden" && a.gardenTask === "water");
      if (!carried) g.drawImage(S.can, L.x + 3, 73 - S.can.height + 1);
      for (let i = 0; i < L.plots.length; i++) {
        const cx = L.plots[i], left = cx - Math.floor(L.w / 2) - 1;
        g.drawImage(soil.dry, left, SOIL_TOP);
        if (wet[i] > 0.02) { g.globalAlpha = Math.min(1, wet[i]); g.drawImage(soil.wet, left, SOIL_TOP); g.globalAlpha = 1; }
        // gotitas que brillan en la tierra recien regada
        if (wet[i] > 0.6 && !ctx.rain) { px(g, left + 3, SOIL_TOP + 2, "#9ab8d0"); px(g, left + L.w - 2, SOIL_TOP + 3, "#9ab8d0"); }
        const cap = ctx.snowCap?.(soil.dry);
        const entry = plots.find((p) => p.plot === i);
        if (!entry) { if (cap) g.drawImage(cap, left, SOIL_TOP); continue; }
        if (pulled.has(entry.seedId)) continue;
        drawPlant(g, S, entry, cx, ctx.t, wind, L.w >= 12);
      }
    },
    // lo maduro destella de vez en cuando (como el forraje)
    glow(g, ctx) {
      if (!L) return;
      for (const entry of plots) {
        if (entry.growth < 1 || pulled.has(entry.seedId)) continue;
        const c = ((ctx.t + entry.plot * 0.9) % 2.8) / 2.8;
        if (c > 0.12) continue;
        const x = L.plots[entry.plot] + 2, y = PLANT_BASE - 8;
        px(g, x, y, "#ffffff");
        if (c > 0.03 && c < 0.09) { px(g, x - 1, y, "#fff6cf"); px(g, x + 1, y, "#fff6cf"); px(g, x, y - 1, "#fff6cf"); px(g, x, y + 1, "#fff6cf"); }
      }
    },
    // Pip riega: la parcela se moja poco a poco mientras cae el agua.
    soak(plot, amount) { if (wet[plot] != null) wet[plot] = Math.min(1, Math.max(wet[plot], amount)); },
    get plots() { return plots; },
    get layout() { return L; }
  };
}

export function drawPlant(g, S, entry, cx, t, wind, wide) {
  const stage = cropStage(entry.growth);
  if (stage === 0) {
    // semillas recien enterradas: hoyitos con una semilla asomando
    for (const dx of wide ? [-3, 0, 3] : [-2, 1]) { px(g, cx + dx, SOIL_TOP + 1, "#4a2e18"); px(g, cx + dx, SOIL_TOP, "#e8d8a0"); }
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
    // las hojas de arriba se mecen con el viento; lo de abajo queda quieto
    const sway = Math.sin(t * 1.7 + x * 0.9) * wind > 0.75 ? 1 : 0, half = Math.ceil(img.height / 2);
    g.drawImage(img, 0, 0, img.width, half, left + sway, top, img.width, half);
    g.drawImage(img, 0, half, img.width, img.height - half, left, top + half, img.width, img.height - half);
  }
}

// Una parcela suelta (el cobertizo de semillas del mercado la pinta en su
// lienzo): el caballon y lo que crece en el, `entry` como en set() o null.
export const PLOT_PREVIEW = { w: 17, h: 24 };
export function drawPlotPreview(canvas, entry, wet = false) {
  const g = canvas.getContext("2d"), S = GARDEN_SPRITES(), soil = S.soil[13];
  canvas.width = PLOT_PREVIEW.w; canvas.height = PLOT_PREVIEW.h;
  g.imageSmoothingEnabled = false;
  g.setTransform(1, 0, 0, 1, 0, PLOT_PREVIEW.h - 6 - SOIL_TOP);
  g.drawImage(wet ? soil.wet : soil.dry, 1, SOIL_TOP);
  if (entry) drawPlant(g, S, entry, 8, 0, 0, true);
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
