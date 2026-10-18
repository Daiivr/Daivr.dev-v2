import { lazy, outlinedSprite } from "./core.js";

// El pescador ambulante (shared/buddy-fisherman.mjs) en pixel: un viejo
// pescador con sombrero de pesca, barba blanca, pipa, jersey rojo y botas, y
// su carretilla de aparejos (caja de pescado con hielo, cubo de cebo, cañas de
// pie, farol y un cartel con un pez). Mirando a la derecha; el mundo lo voltea.
// Luz arriba a la izquierda, contornos de su propio tono, como todo el valle.

const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill("."));
const put = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
const fill = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(g, x, y, typeof c === "function" ? c(x, y) : c); };
function linePts(x0, y0, x1, y1) {
  const pts = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) return pts;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
const rowsOf = (g) => g.map((r) => r.join(""));

const MAN_PAL = {
  k: "#4a3418", H: "#8a6a3a", h: "#b8945a", B: "#2e2214",
  s: "#f2caa2", S: "#d49e78", n: "#e88e78", e: "#24160e",
  w: "#f8f4ea", W: "#d6d2c6", v: "#a4a096",
  R: "#ec7c5c", r: "#c8503a", q: "#86301e",
  D: "#5e80b8", d: "#3c5c8e", j: "#283f62",
  b: "#5e4432", c: "#2e2016",
  p: "#8a5a30", P: "#3a2414", o: "#ffa04a"
};

// Un fotograma: `stride` -1/0/1 (el paso al andar), `wave` (saluda con la
// mano), `blink`, `rod` (la caña al hombro mientras camina).
function manRows({ stride = 0, wave = false, blink = false, rod = false } = {}) {
  const W = 22, H = 36, g = blank(W, H);
  // la caña al hombro, por detras de todo
  if (rod) { linePts(14, 19, 2, 1).forEach(([x, y], i) => put(g, x, y, i < 4 ? "P" : "p")); put(g, 2, 1, "o"); put(g, 1, 0, "o"); }
  // piernas y botas: la de atras mas oscura
  const legs = [[-stride, true], [stride, false]];
  for (const [s, back] of legs) {
    const hipX = back ? 9 : 12, ankleX = hipX + s * 2;
    linePts(hipX, 25, ankleX, 31).forEach(([x, y]) => { put(g, x - 1, y, back ? "j" : "D"); put(g, x, y, back ? "j" : "d"); put(g, x + 1, y, back ? "j" : "d"); });
    fill(g, ankleX - 1, 32, ankleX + 1, 33, back ? "c" : "b");
    fill(g, ankleX - 1, 34, ankleX + 3, 35, (x) => (back ? "c" : x === ankleX + 3 ? "c" : "b"));
    put(g, ankleX - 1, 32, back ? "c" : "h");
  }
  fill(g, 8, 23, 14, 25, (x) => (x < 10 ? "D" : x > 12 ? "j" : "d"));
  // el jersey, con su canale abajo
  for (let y = 12; y <= 23; y++) {
    const x0 = y === 12 ? 9 : y === 13 ? 7 : 6, x1 = y === 12 ? 13 : 15;
    for (let x = x0; x <= x1; x++) put(g, x, y, y === 23 ? (x % 2 ? "q" : "r") : x < 9 ? "R" : x > 13 ? "q" : (x + y) % 5 === 0 ? "R" : "r");
  }
  // el brazo de delante (o saludando)
  if (wave) {
    linePts(12, 15, 18, 9).forEach(([x, y]) => { put(g, x, y, "R"); put(g, x + 1, y, "r"); put(g, x + 1, y + 1, "q"); });
    fill(g, 19, 5, 20, 8, (x, y) => (x === 20 || y === 8 ? "S" : "s")); put(g, 21, 5, "s"); put(g, 21, 6, "S"); put(g, 19, 4, "s"); put(g, 20, 4, "s");
  } else {
    for (let y = 14; y <= 20; y++) { put(g, 11, y, "q"); put(g, 12, y, "R"); put(g, 13, y, "r"); }
    fill(g, 12, 21, 13, 22, (x, y) => (y === 22 || x === 13 ? "S" : "s"));
  }
  // la cabeza: nuca con pelo canoso, cara, ojo (o parpado), nariz
  fill(g, 8, 5, 15, 10, (x, y) => (x < 10 ? "W" : x === 15 && y > 8 ? "S" : "s"));
  put(g, 8, 5, "."); put(g, 15, 5, "s");
  if (blink) { put(g, 13, 7, "e"); put(g, 14, 7, "e"); } else { put(g, 14, 6, "e"); put(g, 14, 7, "e"); put(g, 13, 6, "W"); }
  put(g, 16, 7, "n"); put(g, 16, 8, "n"); put(g, 15, 7, "n"); put(g, 13, 8, "n");
  // la barba, de la oreja al pecho, y el bigote
  const beard = [[9, 9, 15], [10, 8, 15], [11, 8, 15], [12, 9, 14], [13, 10, 14], [14, 11, 13], [15, 12, 12]];
  for (const [y, x0, x1] of beard) for (let x = x0; x <= x1; x++) put(g, x, y, x < x0 + 2 ? "w" : x > x1 - 1 ? "v" : (x + y) % 3 ? "W" : "w");
  fill(g, 13, 9, 16, 9, "w"); put(g, 16, 10, "W");
  // la pipa: boquilla oscura, cazoleta con su brasa
  put(g, 16, 10, "P"); put(g, 17, 10, "P"); fill(g, 18, 8, 19, 10, "p"); put(g, 18, 8, "o"); put(g, 19, 8, "P"); put(g, 19, 10, "P");
  // el sombrero: copa, cinta y ala ancha (mas larga por delante)
  fill(g, 9, 0, 14, 0, "k");
  fill(g, 8, 1, 15, 2, (x, y) => (x === 8 || x === 15 ? "k" : x < 11 && y === 1 ? "h" : "H"));
  fill(g, 8, 3, 15, 3, "B");
  fill(g, 5, 4, 18, 4, (x) => (x < 8 ? "h" : x > 15 ? "k" : "H"));
  put(g, 4, 4, "k"); put(g, 19, 4, "k");
  return rowsOf(g);
}

// La carretilla: lecho de tablas con un cartel con un pez, caja con hielo y
// colas de pescado, cubo de cebo, tres cañas de pie (con las puntas de colores
// de las del mercado), farol colgado de su palo, varales y la rueda.
function cartRows() {
  const W = 38, H = 34, g = blank(W, H);
  // cañas de pie, por detras
  for (const [x0, x1, y1, tip, blankC] of [[27, 31, 2, "t", "y"], [29, 35, 5, "u", "U"], [25, 27, 1, "g", "G"]]) {
    linePts(x0, 18, x1, y1).forEach(([x, y]) => put(g, x, y, blankC));
    put(g, x1, y1, tip);
  }
  // palo del farol y el farol
  for (let y = 3; y <= 18; y++) put(g, 4, y, y < 5 ? "K" : "w");
  fill(g, 4, 3, 8, 3, "K");
  put(g, 8, 4, "K");
  fill(g, 7, 5, 9, 5, "K"); fill(g, 7, 6, 9, 8, (x) => (x === 8 ? "L" : "l")); fill(g, 7, 9, 9, 9, "K");
  // la caja de pescado: tablillas, hielo y colas
  fill(g, 7, 12, 18, 17, (x, y) => (y === 12 ? "W" : y === 17 ? "w" : x === 7 || x === 18 ? "w" : (y === 14 ? "x" : "W")));
  fill(g, 8, 11, 17, 11, (x) => (x % 3 ? "i" : "I"));
  for (const [x, c1, c2] of [[9, "f", "F"], [12, "a", "A"], [15, "m", "M"]]) { put(g, x, 9, c1); put(g, x + 1, 9, c1); put(g, x, 10, c2); put(g, x + 1, 10, c1); put(g, x - 1, 8, c1); put(g, x + 2, 8, c1); }
  // el cubo de cebo con su asa
  fill(g, 20, 13, 25, 17, (x, y) => (x === 20 ? "Z" : x === 25 ? "z" : y === 13 ? "Z" : "z"));
  fill(g, 21, 12, 24, 12, "E"); put(g, 22, 11, "E");
  put(g, 20, 11, "z"); put(g, 21, 10, "z"); put(g, 22, 10, "z"); put(g, 23, 10, "z"); put(g, 24, 10, "z"); put(g, 25, 11, "z");
  // el lecho: tablas con sus juntas y el cartel con el pez
  fill(g, 3, 18, 31, 26, (x, y) => (y === 18 ? "W" : y === 21 || y === 24 ? "x" : x === 3 ? "W" : x === 31 ? "x" : y % 3 === 2 ? "W" : "w"));
  fill(g, 11, 19, 22, 25, (x, y) => (y === 19 || y === 25 || x === 11 || x === 22 ? "K" : "c"));
  for (const [x, y] of [[14, 22], [15, 21], [16, 21], [17, 21], [18, 22], [19, 22], [15, 23], [16, 23], [17, 23], [13, 21], [13, 23], [20, 21], [20, 23], [16, 22], [17, 22], [15, 22]]) put(g, x, y, "a");
  put(g, 18, 21, "A"); put(g, 19, 21, "A"); put(g, 18, 23, "A");
  put(g, 17, 22, "e");
  // varales hacia la izquierda y la pata
  for (let x = 0; x < 4; x++) { put(g, x, 22, "W"); put(g, x, 23, "x"); }
  for (let y = 27; y <= 33; y++) put(g, 6, y, y === 33 ? "x" : "w");
  // la rueda: llanta, radios y buje
  for (let y = 24; y < H; y++) for (let x = 19; x < 31; x++) {
    const d = Math.hypot(x + 0.5 - 25, y + 0.5 - 28.6);
    if (d > 5.2) continue;
    if (d > 4.1) put(g, x, y, x + y < 52 ? "R" : "r");
    else if (d < 1.2) put(g, x, y, "K");
    else if (x === 25 || y === 28 || x - 25 === y - 28 || x - 25 === 28 - y) put(g, x, y, "w");
  }
  return rowsOf(g);
}
const CART_PAL = {
  W: "#c89058", w: "#9a6a3a", x: "#6a4422", K: "#3a2414",
  i: "#d8f0f8", I: "#a8d4e8", f: "#5a9ad0", F: "#2e6aa0", a: "#e8a040", A: "#b0702a", m: "#8ac060", M: "#4a8a3a",
  Z: "#b8c4cc", z: "#7a8892", E: "#8a5a3a",
  c: "#f0e2c0", e: "#1a1a1a",
  y: "#f0e2b0", t: "#ff5a4a", U: "#9a6ae0", u: "#ffd8ff", G: "#7ab85a", g: "#45d8ff",
  l: "#8a7a5a", L: "#b0a070", R: "#7a5232", r: "#4a3018"
};

export const FISHER_SPRITES = lazy(() => ({
  stand: outlinedSprite(manRows(), MAN_PAL, "#1e140c"),
  blink: outlinedSprite(manRows({ blink: true }), MAN_PAL, "#1e140c"),
  wave: outlinedSprite(manRows({ wave: true }), MAN_PAL, "#1e140c"),
  walk: [0, 1, 0, -1].map((stride) => outlinedSprite(manRows({ stride, rod: true }), MAN_PAL, "#1e140c")),
  cart: outlinedSprite(cartRows(), CART_PAL, "#1e140c")
}));
// Donde esta cada cosa dentro de los sprites (con su contorno; el pescador sin
// voltear): la brasa de la pipa y el cristal del farol.
export const FISHER_ANCHORS = { pipe: [19, 9], lantern: [9, 8] };
