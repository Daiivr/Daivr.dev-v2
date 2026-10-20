import { lazy, outlinedSprite } from "./core.js";

// Dos vecinos del valle, mirando a la derecha (el mundo los voltea):
// - La cartera (life/courier.js): gorra azul de visera con su insignia, chaqueta
//   azul de botones dorados, la cartera de cuero en bandolera con cartas
//   asomando, pantalon gris y zapatos. Anda, alarga la mano con la carta y
//   saluda.
// - El husky de Pip (life/husky.js): gris por arriba y blanco por abajo, con su
//   antifaz blanco, orejas de punta, ojos azules y la cola enroscada. Anda,
//   corre, se sienta meneando la cola, se tumba, duerme hecho una bola y se
//   sacude el agua.

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

// --- La cartera ---------------------------------------------------------------
const COURIER_PAL = {
  C: "#3a6ab8", c: "#5a8ad8", B: "#1e3a6a", V: "#16264a", y: "#ffd166",
  h: "#6a3a1e", s: "#f2caa2", S: "#d49e78", e: "#24160e", n: "#e88e78",
  J: "#5a8ad8", j: "#3a6ab8", D: "#284a88", o: "#ffd166",
  b: "#8a5a2e", a: "#b07a42", w: "#f8f4ea", W: "#d6d2c6", r: "#e84a4a",
  P: "#5a6478", p: "#3e4658", k: "#1e1a1a", K: "#3a3030"
};
// `stride` -1/0/1, `pose`: "stand" | "reach" (la carta por delante) | "wave".
function courierRows({ stride = 0, pose = "stand", blink = false } = {}) {
  const W = 23, H = 31, g = blank(W, H);
  // piernas y zapatos (la de atras mas oscura)
  for (const [s, back] of [[-stride, true], [stride, false]]) {
    const hipX = back ? 8 : 11, ankleX = hipX + s * 2;
    linePts(hipX, 21, ankleX, 26).forEach(([x, y]) => { put(g, x, y, back ? "p" : "P"); put(g, x + 1, y, "p"); });
    fill(g, ankleX - 1, 27, ankleX + 2, 28, (x) => (back ? "k" : x === ankleX - 1 ? "K" : "k"));
  }
  fill(g, 7, 20, 13, 21, (x) => (x < 9 ? "P" : "p"));
  // la chaqueta: cuello, botones y su sombra
  for (let y = 10; y <= 19; y++) {
    const x0 = y === 10 ? 8 : 6, x1 = y === 10 ? 12 : 13;
    for (let x = x0; x <= x1; x++) put(g, x, y, x < 8 ? "J" : x > 12 ? "D" : "j");
  }
  fill(g, 6, 19, 13, 19, "B");
  for (const y of [12, 15, 18]) put(g, 12, y, "o");
  put(g, 11, 10, "w"); put(g, 9, 10, "w");
  // la correa en bandolera y la cartera con cartas asomando
  linePts(8, 10, 13, 17).forEach(([x, y]) => put(g, x, y, "b"));
  fill(g, 13, 16, 17, 21, (x, y) => (y === 16 ? "b" : x === 17 || y === 21 ? "b" : "a"));
  put(g, 15, 18, "y");
  fill(g, 14, 14, 15, 15, "w"); put(g, 16, 15, "W"); put(g, 14, 14, "r");
  // el brazo de delante
  if (pose === "reach") {
    fill(g, 11, 12, 17, 13, (x, y) => (y === 13 ? "D" : x < 13 ? "J" : "j"));
    fill(g, 18, 12, 18, 13, "s");
    fill(g, 18, 9, 21, 12, (x, y) => (y === 9 || x === 21 ? "W" : "w")); put(g, 19, 10, "r");
  } else if (pose === "wave") {
    linePts(11, 12, 16, 6).forEach(([x, y]) => { put(g, x, y, "J"); put(g, x + 1, y, "j"); put(g, x + 1, y + 1, "D"); });
    fill(g, 17, 3, 18, 5, (x, y) => (x === 18 || y === 5 ? "S" : "s")); put(g, 19, 3, "s"); put(g, 17, 2, "s");
  } else {
    for (let y = 12; y <= 17; y++) { put(g, 10, y, "D"); put(g, 11, y, "J"); put(g, 12, y, "j"); }
    fill(g, 11, 18, 12, 18, "s");
  }
  // la cabeza: nuca con pelo, cara, oreja, ojo (o parpado) y nariz
  fill(g, 7, 4, 13, 9, (x, y) => (x < 9 ? "h" : x === 13 && y > 7 ? "S" : "s"));
  put(g, 7, 9, "."); put(g, 9, 6, "S");
  if (blink) { put(g, 11, 6, "e"); put(g, 12, 6, "e"); } else { put(g, 12, 5, "e"); put(g, 12, 6, "e"); }
  put(g, 14, 6, "n"); put(g, 14, 7, "n"); put(g, 13, 6, "s");
  put(g, 11, 8, "S"); put(g, 12, 8, "S");
  // la gorra: copa, cinta con insignia y la visera hacia delante
  fill(g, 7, 0, 12, 0, "C");
  fill(g, 6, 1, 13, 2, (x, y) => (x < 9 && y === 1 ? "c" : "C"));
  fill(g, 6, 3, 13, 3, "B"); put(g, 11, 2, "y");
  fill(g, 12, 4, 16, 4, (x) => (x === 16 ? "B" : "V"));
  return rowsOf(g);
}

// --- El husky ------------------------------------------------------------------
const HUSKY_PAL = {
  g: "#8a94a4", G: "#5a6272", d: "#3e4452", w: "#f4f6f8", W: "#c8ccd6",
  e: "#4aa8ff", n: "#1a1a22", p: "#ff8aa0", m: "#2a2a32"
};
// pose: "walk" (frame 0..3), "run" (0..1), "sit" (0..1: la cola), "lie",
// "sleep" (0..1: respira), "shake" (0..1).
// Hecho de piezas redondas: el cuerpo (lomo gris, tripa blanca), el pecho
// blanco mas hondo delante, la cabeza con su gorro gris y el antifaz blanco,
// el hocico largo con la nariz, las orejas de punta, las patas y la cola
// enroscada.
function huskyRows(pose = "walk", frame = 0) {
  const W = 23, H = 15, g = blank(W, H);
  const blob = (cx, cy, rx, ry, paint) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v <= 1) put(g, x, y, paint(u, v, x, y));
    }
  };
  // pelaje: gris por arriba (mas claro hacia la luz), blanco por abajo
  const fur = (split = -0.1) => (u, v) => (v < split ? (u < -0.2 || v < -0.6 ? "g" : "G") : v > 0.6 ? "W" : "w");
  const head = (hx, hy, { open = false, closed = false } = {}) => {
    blob(hx, hy, 2.9, 2.5, (u, v) => (v < -0.15 && u < 0.45 ? (u < -0.3 ? "g" : "G") : "w"));
    // hocico largo, nariz y boca
    fill(g, Math.round(hx + 2), Math.round(hy), Math.round(hx + 4), Math.round(hy + 1), (x, y) => (y === Math.round(hy + 1) ? "W" : "w"));
    put(g, Math.round(hx + 5), Math.round(hy), "n");
    if (open) { put(g, Math.round(hx + 3), Math.round(hy + 2), "p"); put(g, Math.round(hx + 2), Math.round(hy + 2), "p"); }
    // orejas de punta (la de atras mas oscura) y el ojo azul (o cerrado)
    put(g, Math.round(hx - 1), Math.round(hy - 3), "G"); put(g, Math.round(hx - 1), Math.round(hy - 2), "G");
    put(g, Math.round(hx + 1), Math.round(hy - 4), "g"); put(g, Math.round(hx + 1), Math.round(hy - 3), "g"); put(g, Math.round(hx), Math.round(hy - 3), "g"); put(g, Math.round(hx + 2), Math.round(hy - 3), "G");
    put(g, Math.round(hx + 1), Math.round(hy - 2), "p");
    put(g, Math.round(hx + 1), Math.round(hy - 1), closed ? "m" : "e");
  };
  const leg = (x, y0, y1, dx, back) => { for (let y = y0; y <= y1; y++) put(g, x + (y > y0 + 1 ? dx : 0), y, y === y1 ? (back ? "W" : "w") : back ? "G" : "g"); };
  const tail = (pts) => pts.forEach(([x, y], i) => put(g, x, y, i === pts.length - 1 ? "w" : i < 2 ? "G" : "g"));

  if (pose === "sleep") {
    // Dormido: tumbado como al echarse, pero con la cabeza apoyada en las patas
    // de delante, los ojos cerrados y las orejas plegadas hacia atras, y la cola
    // recogida junto al costado (con su punta blanca). El lomo sube y baja al
    // respirar.
    const breathe = frame ? 0.4 : 0;
    tail([[6, 13], [5, 13], [4, 13], [3, 12], [2, 12], [2, 11]]);
    blob(9, 10.9 - breathe * 0.5, 6.6, 2.8 + breathe, fur(-0.1));
    fill(14, 13, 20, 13, (x) => (x > 18 ? "w" : "W"));
    head(16, 10, { closed: true });
    // (el ojo cerrado: una rayita al lado de la de siempre)
    put(g, 16, 9, "m");
    return rowsOf(g);
  }
  if (pose === "sit") {
    // sentado: el anca en el suelo, el pecho alto, las patas de delante rectas
    tail(frame ? [[4, 13], [3, 13], [2, 12], [1, 12], [1, 11]] : [[4, 13], [3, 13], [2, 13], [1, 13], [0, 12]]);
    blob(8, 10, 4.2, 3.2, fur(-0.2));
    blob(13, 8, 2.8, 4.2, (u, v) => (u < -0.5 && v < 0 ? "G" : "w"));
    leg(12, 10, 13, 0, false); leg(14, 10, 13, 0, false);
    fill(g, 9, 13, 11, 13, "W");
    head(15, 4, { open: frame === 1 });
    return rowsOf(g);
  }
  if (pose === "lie") {
    // tumbado con la cabeza alta y las patas de delante estiradas
    tail([[3, 12], [2, 12], [1, 11], [0, 11]]);
    blob(9, 11, 6.5, 2.6, fur(-0.1));
    fill(g, 14, 13, 20, 13, (x) => (x > 18 ? "w" : "W"));
    head(16, 8, { open: true });
    return rowsOf(g);
  }
  if (pose === "dig") {
    // escarbando: el cuarto trasero alto, la cabeza en el hoyo y las patas de
    // delante echando tierra (una y otra)
    tail([[3, 3], [2, 2], [2, 1], [3, 0], [4, 1], [5, 1]]);
    leg(4, 8, 13, 0, true); leg(6, 8, 13, 0, true);
    blob(8, 6, 5.6, 2.7, fur(-0.1));
    blob(13, 8.2, 3.6, 2.6, (u, v) => (v < -0.4 ? "G" : "w"));
    const f = frame % 2;
    leg(13, 10, 13, f ? -2 : 1, false); leg(15, 10, 13, f ? 1 : -2, false);
    head(17, 9.5);
    return rowsOf(g);
  }
  // de pie: andando, corriendo, ladrando (la cabeza alta y la boca abierta) o
  // sacudiendose
  const run = pose === "run", bark = pose === "bark", bob = run && frame ? -1 : 0, cy = 6.8 + bob;
  const stepFrame = bark ? 1 : frame;
  const swings = run ? [[3, frame ? 2 : -2], [5, frame ? -2 : 2], [13, frame ? -2 : 2], [15, frame ? 2 : -2]]
    : [[4, 0], [6, 0], [13, 0], [15, 0]].map(([x], i) => [x, [[1, -1, -1, 1], [0, 0, 0, 0], [-1, 1, 1, -1], [0, 0, 0, 0]][stepFrame % 4][i]]);
  swings.forEach(([x, dx], i) => leg(x, Math.round(cy + 2), 13, dx, i % 2 === 0));
  const wag = !run && frame % 2 ? 1 : 0;
  tail([[3, Math.round(cy - 2)], [2, Math.round(cy - 3) - wag], [2, Math.round(cy - 4) - wag], [3, Math.round(cy - 5) - wag], [4, Math.round(cy - 4) - wag], [5, Math.round(cy - 4)]]);
  blob(9, cy, run ? 7.2 : 6.6, 2.9, fur(-0.1));
  blob(14, cy + 0.5, 2.6, 3, (u, v) => (v < -0.45 ? "G" : u > 0.6 && v > 0.3 ? "W" : "w"));
  head(17, Math.round(cy - 3 + (run ? 1 : 0) - (bark ? 1 : 0)), { open: run || (bark && frame === 0) });
  // sacudiendose: gotas a los lados
  if (pose === "shake") for (const [x, y] of frame ? [[1, 3], [21, 2], [10, 1]] : [[0, 5], [22, 4], [8, 2]]) put(g, x, y, "e");
  return rowsOf(g);
}

export const CRITTER_SPRITES = lazy(() => {
  const courier = (o) => outlinedSprite(courierRows(o), COURIER_PAL, "#1a1420");
  const dog = (pose, frame) => outlinedSprite(huskyRows(pose, frame), HUSKY_PAL, "#24262e");
  return {
    courier: {
      stand: courier(), blink: courier({ blink: true }), reach: courier({ pose: "reach" }), wave: courier({ pose: "wave" }),
      walk: [0, 1, 0, -1].map((stride) => courier({ stride }))
    },
    husky: {
      walk: [0, 1, 2, 3].map((f) => dog("walk", f)), run: [0, 1].map((f) => dog("run", f)), sit: [0, 1].map((f) => dog("sit", f)),
      lie: [dog("lie", 0)], sleep: [0, 1].map((f) => dog("sleep", f)), shake: [0, 1].map((f) => dog("shake", f)),
      bark: [0, 1].map((f) => dog("bark", f)), dig: [0, 1].map((f) => dog("dig", f))
    }
  };
});
