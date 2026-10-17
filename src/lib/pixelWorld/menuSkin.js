import { Buf, N4, bayer, gridSprite, lazy, makeCanvas, px, rect, rng } from "./core.js";
import { P, hillColors } from "./palette.js";
import { sprites } from "./props.js";
import { makeCloud } from "./sky.js";
import { catchSprite } from "./catches.js";

// La piel de pixel del modal de Buddy (Room, Inventory, Quests, Journal y el
// mercado), a juego con el footer: cada marco, papel, hueco y boton se dibuja
// aqui en un canvas y llega al CSS como variable (url de datos) para un
// border-image de 9 trozos. Ademas los adornos vivos: la franja del valle
// detras del titulo, las enredaderas de las esquinas y la hierba del borde.
const SK = { edge: "#2a1206", woodD: "#5c2e10", wood: "#8a4f22", woodM: "#a8622c", woodL: "#d27f36", grain: "#6a3a18", paper: "#c2a272", paperD: "#b39064", paperL: "#d0b486", fiber: "#ba9a6a", burn: "#956034", burnD: "#7a4620", slot: "#b28652", slotD: "#7e4e24", slotL: "#c4a070", brass: "#c89a3a", brassL: "#f2d27a", brassD: "#7a5418" };
const paintC = (w, h, fn) => { const [c, g] = makeCanvas(w, h); fn(g, w, h); return c; };

function grain(g, R, x0, y0, w, h, base, light, dark) {
  rect(g, x0, y0, w, h, base);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const v = Math.sin(x * 0.55 + Math.sin(y * 1.7) * 1.6) + (R() - 0.5) * 0.9;
    if (v > 1.05) px(g, x, y, light); else if (v < -1.15) px(g, x, y, dark);
  }
}
// Una escuadra de laton con su remache, repetida en cada esquina.
function bracket(g, w, h) {
  for (const [ox, oy, sx, sy] of [[1, 1, 1, 1], [w - 2, 1, -1, 1], [1, h - 2, 1, -1], [w - 2, h - 2, -1, -1]]) {
    const put = (x, y, c) => px(g, ox + sx * x, oy + sy * y, c);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { const c = j === 0 ? SK.brassL : j === 2 ? SK.brassD : SK.brass; put(i, j, c); put(j, i, c); }
    put(1, 1, SK.paperL);
    for (let k = 0; k < 3; k++) { put(8, k, SK.edge); put(k, 8, SK.edge); }
  }
}
function button(face, hi, sh) {
  return paintC(12, 14, (g, w, h) => {
    rect(g, 1, h - 2, w - 2, 2, "rgba(20,8,2,.35)");
    rect(g, 1, 0, w - 2, h - 2, SK.edge); rect(g, 0, 1, w, h - 4, SK.edge);
    rect(g, 1, 1, w - 2, h - 4, face); rect(g, 1, 1, w - 2, 1, hi); rect(g, 1, 1, 1, h - 5, hi);
    rect(g, 1, h - 5, w - 2, 2, sh);
  });
}
function tabImg(face, hi, active) {
  return paintC(14, 12, (g, w, h) => {
    rect(g, 2, 0, w - 4, h, SK.edge); rect(g, 1, 1, w - 2, h, SK.edge); rect(g, 0, 2, w, h, SK.edge);
    rect(g, 2, 1, w - 4, h, face); rect(g, 1, 2, w - 2, h, face); rect(g, 2, 1, w - 4, 1, hi); rect(g, 1, 2, 1, h, hi);
    if (!active) rect(g, 0, h - 1, w, 1, SK.edge);
  });
}

// Las variables CSS de la piel: { "--sk-frame": 'url("data:...")', ... }.
export const menuSkinVars = lazy(() => {
  const R = rng(23);
  const skin = {
    // El marco grande: tablones con veta, bisel, ranura interior y escuadras de laton
    frame: paintC(32, 32, (g, w, h) => {
      rect(g, 0, 0, w, h, SK.edge); grain(g, R, 1, 1, w - 2, h - 2, SK.wood, SK.woodM, SK.grain);
      rect(g, 1, 1, w - 2, 1, SK.woodL); rect(g, 1, 1, 1, h - 2, SK.woodL); rect(g, 1, h - 2, w - 2, 1, SK.woodD); rect(g, w - 2, 1, 1, h - 2, SK.woodD);
      rect(g, 9, 9, w - 18, 1, SK.edge); rect(g, 9, 9, 1, h - 18, SK.edge); rect(g, 9, h - 10, w - 18, 1, SK.woodL); rect(g, w - 10, 9, 1, h - 18, SK.woodL);
      g.clearRect(10, 10, w - 20, h - 20);
      bracket(g, w, h);
    }),
    // La madera entre el marco y la pagina
    wood: paintC(32, 16, (g, w, h) => { grain(g, R, 0, 0, w, h, SK.wood, SK.woodM, SK.grain); rect(g, 0, h - 1, w, 1, SK.woodD); rect(g, 0, 0, w, 1, "#9a5a28"); }),
    // Pergamino: motas, fibras y alguna peca clara
    paper: paintC(32, 32, (g, w, h) => {
      rect(g, 0, 0, w, h, SK.paper);
      for (let i = 0; i < 70; i++) px(g, Math.floor(R() * w), Math.floor(R() * h), R() < 0.75 ? SK.paperD : SK.paperL);
      for (let i = 0; i < 9; i++) rect(g, Math.floor(R() * (w - 4)), Math.floor(R() * h), 2 + Math.floor(R() * 3), 1, SK.fiber);
    }),
    // El borde de la pagina: tostado y tramado hacia el papel
    page: paintC(16, 16, (g, w, h) => {
      rect(g, 0, 0, w, h, SK.edge); rect(g, 1, 1, w - 2, h - 2, SK.burnD); rect(g, 2, 2, w - 4, h - 4, SK.burn);
      g.clearRect(3, 3, w - 6, h - 6);
      for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) { const d = Math.min(x - 3, y - 3, w - 4 - x, h - 4 - y); if (d < 3 && bayer(x, y) < (3 - d) / 4) px(g, x, y, d === 0 ? "#e2b571" : SK.paperD); }
      g.clearRect(6, 6, w - 12, h - 12);
    }),
    slot: paintC(12, 12, (g, w, h) => {
      rect(g, 1, 0, w - 2, h, "#8a4a1a"); rect(g, 0, 1, w, h - 2, "#8a4a1a");
      rect(g, 1, 1, w - 2, h - 2, SK.slotL); rect(g, 1, 1, w - 3, h - 3, SK.slotD); rect(g, 3, 3, w - 5, h - 5, SK.slotL); rect(g, 3, 3, w - 6, h - 6, SK.slot);
    }),
    slotOn: paintC(12, 12, (g, w, h) => {
      rect(g, 1, 0, w - 2, h, SK.edge); rect(g, 0, 1, w, h - 2, SK.edge);
      rect(g, 1, 1, w - 2, h - 2, "#8fd16a"); rect(g, 2, 2, w - 4, h - 4, "#4f9a3a"); rect(g, 3, 3, w - 6, h - 6, "#c4a66c"); px(g, 1, 1, "#d6f7b8");
    }),
    well: paintC(10, 10, (g, w, h) => { rect(g, 0, 0, w, h, SK.burnD); rect(g, 1, 1, w - 2, h - 2, "#c4a272"); rect(g, 1, 1, w - 3, h - 3, SK.burn); rect(g, 2, 2, w - 4, h - 4, "#b4905c"); }),
    // Un marco de cuadro (el cuarto, el retrato de Buddy, la pecera del diario)
    pframe: paintC(12, 12, (g, w, h) => {
      rect(g, 0, 0, w, h, SK.edge); grain(g, R, 1, 1, w - 2, h - 2, SK.woodM, SK.woodL, SK.wood);
      rect(g, 1, h - 2, w - 2, 1, SK.woodD); rect(g, w - 2, 1, 1, h - 2, SK.woodD);
      rect(g, 3, 3, w - 6, h - 6, SK.edge); g.clearRect(4, 4, w - 8, h - 8);
    }),
    // Un cartel de tablon con clavos en las esquinas (asi no se repiten al estirarlo)
    plank: paintC(16, 12, (g, w, h) => {
      rect(g, 1, 0, w - 2, h, SK.edge); rect(g, 0, 1, w, h - 2, SK.edge);
      grain(g, R, 1, 1, w - 2, h - 2, "#b0703a", "#c8884a", "#8a5428");
      rect(g, 1, 1, w - 2, 1, "#d8985a"); rect(g, 1, h - 2, w - 2, 1, "#6a3a18");
      for (const [x, y] of [[1, 1], [w - 3, 1], [1, h - 3], [w - 3, h - 3]]) { rect(g, x, y, 2, 2, "#d8dce0"); px(g, x + 1, y + 1, "#5a6068"); }
    }),
    chain: paintC(3, 6, (g) => { rect(g, 0, 0, 3, 3, "#7a828a"); g.clearRect(1, 1, 1, 1); rect(g, 1, 3, 1, 3, "#aab2ba"); }),
    bar: paintC(8, 8, (g, w, h) => { rect(g, 1, 0, w - 2, h, SK.edge); rect(g, 0, 1, w, h - 2, SK.edge); rect(g, 1, 1, w - 2, h - 2, "#4a2a12"); rect(g, 1, 1, w - 2, 1, "#2a1206"); })
  };
  const all = {
    "--sk-frame": skin.frame, "--sk-wood": skin.wood, "--sk-paper": skin.paper, "--sk-page": skin.page, "--sk-slot": skin.slot, "--sk-slot-on": skin.slotOn,
    "--sk-well": skin.well, "--sk-bar": skin.bar, "--sk-pframe": skin.pframe, "--sk-plank": skin.plank, "--sk-chain": skin.chain,
    "--sk-btn": button("#be965e", "#d4b682", "#8e5a2e"), "--sk-btn-on": button("#8fd16a", "#d6f7b8", "#4f9a3a"), "--sk-btn-go": button("#7fc95a", "#c8f2a8", "#3f8a2a"), "--sk-btn-x": button("#c94a3a", "#f07a5a", "#8a2a1e"),
    "--sk-tab": tabImg("#a87c46", "#be965e", false), "--sk-tab-on": tabImg(SK.paper, SK.paperL, true)
  };
  return Object.fromEntries(Object.entries(all).map(([k, c]) => [k, `url("${c.toDataURL()}")`]));
});

// Iconos de pixel del modal (pestañas, misiones, ticks, corazones...).
const PAL_UI = { O: "#2a1206", w: "#fff1cf", W: "#f2c46a", y: "#ffd166", Y: "#c8902a", b: "#8a4f22", B: "#5c2e10", r: "#e04a5a", R: "#ff8a9a", g: "#3f9a3a", G: "#8fd16a", c: "#45d8ff", p: "#c98a4a", P: "#f0c98a" };
export const PIXEL_ICONS = lazy(() => ({
  room: gridSprite(["....OO....", "...OWWO...", "..OWWWWO..", ".OWWWWWWO.", "OWWWWWWWWO", ".ObbOObbO.", ".ObbOccO..", ".ObbOccO..", ".OOOOOOOO."].map((r) => r.padEnd(10, ".")), PAL_UI),
  inventory: gridSprite(["...OOOO...", "..O....O..", ".OOOOOOOO.", "OppppppppO", "OpPPyyPPpO", "OppppppppO", "OpPPPPPPpO", "OppppppppO", ".OOOOOOOO."], PAL_UI),
  quests: gridSprite([".OOOOOOO..", "OwwwwwwwO.", ".OwrwwwwO.", ".OwwwwwwO.", ".OwrwwwwO.", ".OwwwwwwO.", ".OwrwwwwwO", "..OOOOOOOO"], PAL_UI),
  journal: gridSprite(["OOOOOOOOOO", "OGGGGOwwwO", "OGgGGOwbwO", "OGGGGOwwwO", "OGGgGObwwO", "OGGGGOwwwO", "OOOOOOOOOO"], PAL_UI),
  market: gridSprite(["OOOOOOOOOO", "OrwrwrwrwO", "OOOOOOOOOO", ".ObbbbbbO.", ".ObyyOccO.", ".ObyyOccO.", ".OOOOOOOO."], PAL_UI),
  tick: gridSprite(["......OO", ".....OGO", "OO..OGO.", "OGOOGO..", ".OGGO...", "..OO...."], PAL_UI),
  heart: gridSprite([".OO.OO.", "ORROrrO", "ORrrrrO", "OrrrrrO", ".OrrrO.", "..OrO..", "...O..."], PAL_UI),
  trophy: gridSprite(["OOOOOOOOO", "OWyyyyyWO", "OyWyyyyyO", ".OyyyyyO.", "..OyyyO..", "...OYO...", "..OOYOO..", ".OYYYYYO.", ".OOOOOOO."], PAL_UI),
  scroll: gridSprite(["OOOOOOOO.", "OWwwwwwO.", ".OwbbbwO.", ".OwwwwwO.", ".OwbbwwO.", ".OwwwwwO.", ".OwwwwwWO", "..OOOOOOO"], PAL_UI),
  plus: gridSprite(["..O..", "..O..", "OOOOO", "..O..", "..O.."], { O: "#a8662e" }),
  lock: gridSprite([".OOO.", "O...O", "OOOOO", "OyyyO", "OyOyO", "OOOOO"], PAL_UI),
  search: gridSprite([".OOO..", "OwwwO.", "OwwwO.", "OwwwO.", ".OOOO.", "....OO", ".....O"], PAL_UI),
  radar: gridSprite(["..OOO..", ".OcccO.", "OccOccO", "OcOwOcO", "OccOccO", ".OcccO.", "..OOO.."], PAL_UI),
  bug: gridSprite(["O.....O", ".O...O.", "..OOO..", ".OrrrO.", "OrROrrO", "OrrOrrO", ".OOOOO."], PAL_UI),
  fish: catchSprite("byte-minnow")
}));

// La enredadera de las esquinas de arriba: tallo, hojas y flores rosas.
const LEAF = { o: "#1d4426", d: "#2d6a2e", m: "#47913a", l: "#6db646", h: "#a2da5e", s: "#5a3a1e", p: "#e46cb0", P: "#ffc6e6", y: "#f7d046" };
export const vineSprite = lazy(() => {
  const W = 34, H = 22, b = new Buf(W, H), R = rng(41), stem = [];
  for (let x = 1; x < 30; x++) stem.push([x, 2 + Math.round(Math.sin(x * 0.35) * 1.2)]);
  for (let y = 3; y < 20; y++) stem.push([2 + Math.round(Math.sin(y * 0.5)), y]);
  for (const [x, y] of stem) b.set(x, y, LEAF.s);
  stem.forEach(([x, y], i) => {
    if (i % 4) return;
    const side = i % 8 ? 1 : -1, cx = x + (i < 29 ? 0 : side * 2), cy = y + (i < 29 ? side * 2 : 0);
    for (const [dx, dy, c] of [[0, 0, LEAF.m], [1, 0, LEAF.l], [-1, 0, LEAF.d], [0, -1, LEAF.l], [0, 1, LEAF.d], [1, -1, LEAF.h]]) b.set(cx + dx, cy + dy, c);
  });
  for (const [x, y] of [[12, 5], [24, 1], [5, 13]]) { b.set(x, y, LEAF.y); for (const [dx, dy] of N4) b.set(x + dx, y + dy, R() < 0.5 ? LEAF.p : LEAF.P); }
  const out = new Buf(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (b.d[i + 3]) out.d.set(b.d.subarray(i, i + 4), i);
    else if (N4.some(([dx, dy]) => b.alpha(x + dx, y + dy))) out.set(x, y, LEAF.o);
  }
  return out.canvas();
});

// La hierba con flores y alguna seta que crece sobre el borde de abajo.
const TUFTS = Array.from({ length: 90 }, (_, i) => ({ x: i * 7 + Math.floor(rng(i + 3)() * 5), h: 3 + (i % 3), f: i % 5 === 2 ? i % 5 : -1, m: i % 17 === 9 }));
const SHROOM = lazy(() => gridSprite([".rrr.", "rwrwr", "rrrrr", "..s..", ".sss."], { r: "#d8405a", w: "#fff1cf", s: "#f2e6c6" }));
export function drawTurf(canvas, t) {
  const w = Math.max(40, Math.ceil(canvas.clientWidth / 2)), h = 10;
  if (canvas.width !== w) { canvas.width = w; canvas.height = h; }
  const g = canvas.getContext("2d"), G = P.grass, flowers = sprites().flowers;
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  for (const tf of TUFTS) {
    if (tf.x > w - 2) break;
    const lean = Math.sin(t * 1.3 + tf.x * 0.2) > 0.6 ? 1 : 0, y = h - 1;
    for (let k = 0; k < tf.h; k++) px(g, tf.x + (k > 1 ? lean : 0), y - k, k === 0 ? G[1] : k === 1 ? G[2] : G[3]);
    px(g, tf.x - 1, y - 1, G[2]); px(g, tf.x + 1, y, G[1]); px(g, tf.x + 2, y - 1 - (tf.h > 4 ? 1 : 0), G[3]);
    if (tf.f >= 0) { px(g, tf.x + 3, y - 1, G[1]); px(g, tf.x + 3, y - 2, G[1]); g.drawImage(flowers[tf.f % flowers.length], tf.x + 2 + lean, y - 5); }
    if (tf.m) g.drawImage(SHROOM(), tf.x + 4, y - 4);
  }
}

// La franja del valle detras del titulo: cielo, nubes, dos filas de colinas,
// arboles, flores en la hierba y dos mariposas.
const OAK = lazy(() => gridSprite(["..lll..", ".llmll.", "lmlllml", "llmllll", ".lllml.", "...t...", "...t..."], { l: "#47913a", m: "#6db646", t: "#5a371f" }));
const PINE = lazy(() => gridSprite(["...p...", "..ppp..", "..pPp..", ".ppppp.", ".pPppp.", "ppppPpp", "...t..."], { p: "#2a6e4f", P: "#41905d", t: "#3a2214" }));
export function createSkyStrip() {
  let key = "", base = null, clouds = [], last = 0;
  function build(w, h) {
    base = paintC(w, h, (g) => {
      const cols = ["#3f9ee6", "#5cb2ee", "#86c9f3", "#b6e1f7"];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const tt = y / (h - 1) * 3, i = Math.min(2, Math.floor(tt)), f = tt - i; px(g, x, y, f > 0.35 && f < 0.65 ? (bayer(x, y) < (f - 0.35) / 0.3 ? cols[i + 1] : cols[i]) : f >= 0.65 ? cols[i + 1] : cols[i]); }
      const [far, near] = hillColors();
      for (let x = 0; x < w; x++) {
        const y1 = Math.round(h - 14 + Math.sin(x * 0.05) * 3 + Math.sin(x * 0.13 + 1) * 1.5), y2 = Math.round(h - 9 + Math.sin(x * 0.07 + 2) * 2.5);
        rect(g, x, y1, 1, h - y1, far[0]); px(g, x, y1, far[1]);
        rect(g, x, y2, 1, h - y2, near[0]); px(g, x, y2, near[1]);
      }
      for (let x = 2, i = 0; x < w - 6; x += 9 + (i * 7) % 6, i++) g.drawImage(i % 3 === 1 ? PINE() : OAK(), x, h - 12 - (i % 2));
      const G = P.grass, flowers = sprites().flowers;
      rect(g, 0, h - 4, w, 4, G[2]); rect(g, 0, h - 4, w, 1, G[3]); rect(g, 0, h - 1, w, 1, G[1]);
      for (let x = 1; x < w; x += 3) px(g, x, h - 5, G[3]);
      for (let x = 5, i = 0; x < w - 3; x += 13 + (i * 5) % 7, i++) g.drawImage(flowers[i % flowers.length], x, h - 6);
    });
    const R = rng(9);
    clouds = Array.from({ length: Math.max(2, Math.round(w / 70)) }, () => ({ img: makeCloud(R, 18 + Math.floor(R() * 14), 6 + Math.floor(R() * 3), ["#ffffff", "#e0f0fb", "#b3d4ec"]), x: R() * w, y: 1 + Math.floor(R() * 8), v: 0.8 + R() * 1.2 }));
  }
  return function draw(canvas, t) {
    const w = Math.max(40, Math.ceil(canvas.clientWidth / 2)), h = Math.max(20, Math.ceil(canvas.clientHeight / 2)), k = w + "x" + h;
    if (k !== key) { key = k; canvas.width = w; canvas.height = h; build(w, h); }
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    const g = canvas.getContext("2d"), bf = sprites().butterflies;
    g.imageSmoothingEnabled = false;
    g.drawImage(base, 0, 0);
    for (const c of clouds) { c.x -= c.v * dt; if (c.x + c.img.width < 0) c.x = w + 4; g.drawImage(c.img, Math.round(c.x), c.y); }
    const bx = (t * 9) % (w + 40) - 20;
    for (let i = 0; i < 2; i++) g.drawImage(bf[i][Math.floor(t * 8 + i) % 2], Math.round(w - bx - i * 30), Math.round(h - 14 + Math.sin(t * 2 + i * 2) * 3));
  };
}

