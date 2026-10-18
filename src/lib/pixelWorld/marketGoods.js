import { lazy, outlinedSprite } from "./core.js";

// Lo que vende el puesto del bosque, en pixel y a juego con el footer: cada
// pieza con su contorno de su propio tono oscuro, cinco tonos por material y
// la luz arriba a la izquierda (como las capturas y los hallazgos). Lo usan las
// fichas del mercado, el puesto en miniatura, el inventario y las baldas del
// cuarto, asi que lo que se compra es lo que Buddy recibe.

const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill("."));
const rowsOf = (g) => g.map((r) => r.join(""));
const put = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
// Tono por la luz: k < 0 mira a la luz (arriba a la izquierda), k > 0 a la sombra.
const tone = (k, [d, m, l, h]) => (k < -0.62 ? h : k < -0.18 ? l : k < 0.38 ? m : d);
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

// --- Para Buddy -------------------------------------------------------------

// Gorro de lana verde: pompon, punto en canalé con sus surcos, la vuelta
// acanalada y una etiqueta de cuero cosida.
function beanie() {
  const W = 18, H = 16, g = blank(W, H), knit = ["D", "G", "g", "L"];
  for (let y = 0; y < 5; y++) for (let x = 5; x < 13; x++) {
    const u = x + 0.5 - 9, v = y + 0.5 - 2.6;
    if (Math.hypot(u, v) > 2.7) continue;
    const k = (u + v) / 2.6;
    g[y][x] = k < -0.75 ? "W" : k < 0.05 ? "p" : k < 0.65 ? "q" : "Q";
  }
  for (let y = 4; y < 12; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - 9) / 8.4, v = (y + 0.5 - 12) / 8;
    if (u * u + v * v > 1) continue;
    let c = tone(u * 0.85 + (v + 0.55) * 0.9, knit);
    if ((x + 1) % 3 === 0) c = { L: "g", g: "G", G: "D", D: "K" }[c];
    else if ((x + y) % 3 === 0 && c !== "D") c = { L: "H", g: "L", G: "g" }[c];
    g[y][x] = c;
  }
  for (let y = 11; y < 15; y++) for (let x = 0; x < W; x++) {
    if (y === 14 && (x === 0 || x === W - 1)) continue;
    const k = (x - 7) / 9;
    g[y][x] = y === 11 ? (k < -0.4 ? "H" : k < 0.3 ? "L" : "g") : x % 2 ? (k < 0.4 ? "C" : "c") : (k < 0.4 ? "c" : "K");
  }
  for (const [x, y, c] of [[12, 12, "t"], [13, 12, "t"], [14, 12, "T"], [12, 13, "T"], [13, 13, "s"], [14, 13, "T"]]) put(g, x, y, c);
  return [rowsOf(g), { W: "#fffaf0", p: "#f2ead2", q: "#d8ccaa", Q: "#a8987a", H: "#c8e890", L: "#9ac868", g: "#6e9e48", G: "#4c7c34", D: "#33581f", K: "#223d14", C: "#5a8a3a", c: "#3f6a2a", t: "#e0aa6a", T: "#a8743e", s: "#fff0c8" }, "#162a10"];
}

// Chaleco de lona encerada: tirantes, cuello de pico con forro, cremallera,
// bolsillos de solapa con su boton y un bolsillito en el pecho.
function vest() {
  const W = 18, H = 18, g = blank(W, H), cx = 9, tan = ["d", "m", "l", "h"];
  // (el hombro arriba, la sisa que se mete y luego el cuerpo entero)
  const OUTER = [6.4, 6.6, 6.1, 5.7, 5.7, 6.2, 7.1, 8.1];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ax = Math.abs(x + 0.5 - cx), neck = Math.max(0.5, 3.4 - y * 0.42), outer = OUTER[y] ?? 8.9;
    if (ax < neck || ax > outer) continue;
    const left = x < cx, edgeIn = ax < neck + 1, edgeOut = ax > outer - 1;
    let c = tone((left ? -0.35 : 0.35) + (y / H - 0.4) * 0.8 + (edgeOut ? 0.45 : 0), tan);
    if (edgeIn && y < 9) c = "n";
    if (y === H - 1) c = left ? "d" : "D";
    g[y][x] = c;
  }
  for (let y = 9; y < H - 1; y++) { put(g, 8, y, y % 2 ? "z" : "Z"); put(g, 9, y, y % 2 ? "Z" : "z"); }
  for (const [x0, light] of [[2, true], [11, false]]) {
    for (let x = x0; x < x0 + 5; x++) { put(g, x, 11, "n"); put(g, x, 12, light ? "h" : "l"); put(g, x, 13, light ? "l" : "m"); put(g, x, 14, light ? "l" : "m"); }
    put(g, x0 + 2, 12, "b");
  }
  for (let x = 3; x < 6; x++) { put(g, x, 5, "n"); put(g, x, 6, "h"); }
  put(g, 4, 6, "b");
  return [rowsOf(g), { h: "#e8c88e", l: "#c9a066", m: "#a8804a", d: "#7a5a2e", D: "#5e4220", n: "#4a3418", z: "#e8e0c8", Z: "#8a8270", b: "#ffd166" }, "#2e1e0c"];
}

// Farol de luciernagas: asa, sombrerete de hierro, cristal con el brillo en
// el centro y tres luciernagas dentro, y la base con sus patitas.
function lantern() {
  const g = [
    "....kkkkkk....",
    "...k......k...",
    "...k......k...",
    "..kmMMMMMMnk..",
    ".kMmmMMMMMMnk.",
    "kMMMMMMMMMMMnk",
    ".k..........k.",
    ".k..........k.",
    ".k..........k.",
    ".k..........k.",
    ".k..........k.",
    ".k..........k.",
    ".k..........k.",
    ".k..........k.",
    "kmMMMMMMMMMMnk",
    ".knnnnnnnnnnk.",
    "..kk......kk.."
  ].map((r) => r.split(""));
  for (let y = 6; y < 14; y++) for (let x = 2; x < 12; x++) {
    const d = Math.hypot((x + 0.5 - 6.5) / 1.1, y + 0.5 - 10);
    g[y][x] = d < 1.4 ? "W" : d < 2.8 ? "G" : d < 4.2 ? "g" : "o";
  }
  for (let y = 6; y < 14; y++) { g[y][1] = y < 9 ? "m" : "k"; g[y][12] = "n"; }
  for (const [x, y] of [[3, 7], [9, 8], [4, 12]]) g[y][x] = "f";
  g[7][2] = "w"; g[8][2] = "w";
  return [rowsOf(g), { k: "#2a2622", n: "#3e3832", M: "#5e564c", m: "#8e8474", o: "#d0802e", g: "#ffb347", G: "#ffd873", W: "#fffbe0", f: "#e8ff8a", w: "#fff4d0" }, "#141210"];
}

// --- Para el cuarto ---------------------------------------------------------

// El bosque en un tarro: tapon de corcho, borde de cristal, musgo, setas
// rojas con motas, un helecho, guijarros y el reflejo del cristal.
function terrarium() {
  const W = 16, H = 19, g = blank(W, H);
  for (let y = 0; y < 3; y++) for (let x = 4; x < 12; x++) g[y][x] = y === 0 ? (x < 7 ? "C" : "c") : x === 4 ? "c" : x === 11 ? "x" : (x + y) % 4 ? "c" : "x";
  g[0][4] = "."; g[0][11] = ".";
  for (let x = 3; x < 13; x++) g[3][x] = x < 6 ? "R" : x > 10 ? "r" : "R";
  for (let y = 4; y < H; y++) for (let x = 1; x < 15; x++) {
    const cornerTop = y === 4 && (x < 3 || x > 12), cornerBot = (y === H - 1 && (x < 3 || x > 12)) || (y === H - 2 && (x === 1 || x === 14));
    if (cornerTop || cornerBot) continue;
    const edge = x === 1 || x === 14 || y === H - 1 || (y === 4 && (x === 3 || x === 12)) || (y === 5 && (x === 1 || x === 2 || x === 13 || x === 14));
    g[y][x] = edge ? (x < 8 ? "w" : "v") : y < 9 ? "a" : "A";
  }
  for (let x = 2; x < 14; x++) {
    put(g, x, 17, (x * 7) % 5 ? "s" : "S"); put(g, x, 16, x % 3 ? "S" : "s");
    put(g, x, 15, (x + 1) % 4 ? "m" : "M"); put(g, x, 14, x % 2 ? "M" : "n");
  }
  for (const x of [3, 6, 10, 12]) put(g, x, 13, "M");
  put(g, 4, 16, "o"); put(g, 11, 17, "o");
  for (let y = 10; y < 14; y++) put(g, 6, y, y === 10 ? "e" : "t");
  for (let x = 4; x < 9; x++) { put(g, x, 9, x === 4 || x === 8 ? "P" : "p"); if (x > 4 && x < 8) put(g, x, 8, "p"); }
  put(g, 5, 8, "d"); put(g, 7, 9, "d"); put(g, 5, 9, "P");
  put(g, 10, 12, "t"); put(g, 10, 13, "t"); put(g, 9, 11, "P"); put(g, 10, 11, "p"); put(g, 11, 11, "P"); put(g, 10, 10, "d");
  for (const [x, y] of [[12, 8], [12, 9], [11, 10], [12, 10], [13, 10], [12, 11], [11, 12], [12, 12], [13, 12], [12, 13]]) put(g, x, y, y % 2 ? "f" : "F");
  for (let y = 6; y < 12; y++) put(g, 3, y, "W");
  put(g, 4, 6, "W"); put(g, 12, 6, "W");
  return [rowsOf(g), { C: "#e0b47a", c: "#c08a50", x: "#8a5a2e", R: "#e8fff8", r: "#a8d8d0", w: "#b8e8e0", v: "#6aa8a0", W: "#f4fffc", a: "#2c5e5a", A: "#24524e", s: "#6a4426", S: "#4a2e18", o: "#b8b0a0", m: "#4a9a3a", M: "#7ac85a", n: "#a8e070", t: "#f4ead0", e: "#d8c8a8", p: "#e05a5a", P: "#a83838", d: "#fff4e8", f: "#5ab84a", F: "#2f7a2a" }, "#143230"];
}

// Luna de noche: un creciente que brilla mas hacia su borde iluminado, sobre
// un pie de madera, con dos estrellitas.
function moon() {
  const W = 16, H = 18, g = blank(W, H);
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
    const u = x + 0.5 - 7.2, v = y + 0.5 - 7.3, inner = Math.hypot(x + 0.5 - 10.6, y + 0.5 - 5.2);
    if (Math.hypot(u, v) > 7.1 || inner < 6) continue;
    const rim = 7.1 - Math.hypot(u, v), toInner = inner - 6;
    g[y][x] = toInner < 0.9 ? "Y" : rim < 0.9 ? (u + v < 0 ? "y" : "Y") : (u + v) < -4 ? "h" : (u + v) < 2 ? "y" : "o";
  }
  for (let x = 3; x < 13; x++) { put(g, x, 15, x < 5 ? "B" : "b"); put(g, x, 16, x < 5 ? "b" : x > 10 ? "n" : "B"); }
  for (let x = 2; x < 14; x++) put(g, x, 17, x < 4 ? "b" : "n");
  put(g, 6, 15, "B"); put(g, 7, 15, "B");
  for (const [x, y] of [[14, 3], [13, 3], [15, 3], [14, 2], [14, 4], [12, 9]]) put(g, x, y, x === 14 && y === 3 ? "s" : "S");
  return [rowsOf(g), { h: "#fff6d8", y: "#ffdc92", o: "#f4c060", Y: "#d89a38", B: "#c08a50", b: "#8a5a2e", n: "#5a3a1e", s: "#ffffff", S: "#fff0b0" }, "#4a2e0c"];
}

// La recreativa de bolsillo: marquesina rosa, pantalla con su jueguecito,
// mandos (palanca y botones), puerta de monedas y el lateral en sombra.
function arcade() {
  const g = [
    ".KKKKKKKKKKKK.",
    ".KmmmmmmmmmmKs",
    ".KmMMmMMmMMmKs",
    ".KKKKKKKKKKKKs",
    "..KbbbbbbbbKss",
    "..KbddddddbKss",
    "..KbdgddgdbKss",
    "..KbddggddbKss",
    "..KbdddddybKss",
    "..KbbbbbbbbKss",
    ".KPPPPPPPPPPKs",
    ".KprpPyPyPPKKs",
    "KKKKKKKKKKKKKs",
    ".KjkkkkkkkkkKs",
    ".KjkCCCCkkkkKs",
    ".KjkCoCCkkkkKs",
    ".KjkCCCCkkkkKs",
    ".KjkkkkkkkkkKs",
    ".KKKKKKKKKKKKs",
    "..ss......ss.."
  ];
  return [g, { K: "#2a2840", k: "#4a4668", j: "#6e6a96", s: "#1c1a2e", m: "#d991af", M: "#ffe0ee", b: "#7a7098", d: "#14283a", g: "#9de0b4", y: "#ffd787", P: "#8e84b6", p: "#6a6090", r: "#ff5f68", C: "#3a3656", o: "#ffd787" }, "#100e1c"];
}

// --- Aparejos ---------------------------------------------------------------

// Una caña en diagonal: mango de corcho moteado, carrete, la vara con sus
// anillas y la punta, y el sedal colgando con su corcho.
function rod({ blank: [R, r], tip, grip, reel, bob }) {
  const W = 20, H = 20, g = blank(W, H);
  linePts(5, 14, 17, 2).forEach(([x, y], i) => { put(g, x, y, "R"); put(g, x + 1, y + 1, "r"); if (i % 4 === 2 && i < 11) put(g, x + 1, y + 2, "i"); });
  put(g, 17, 2, "T"); put(g, 18, 1, "T"); put(g, 18, 2, "t");
  linePts(1, 18, 5, 14).forEach(([x, y], i) => { put(g, x, y, i % 2 ? "c" : "C"); put(g, x + 1, y, i % 3 ? "c" : "x"); put(g, x, y + 1, "x"); });
  for (const [x, y, c] of [[6, 15, "S"], [7, 15, "s"], [6, 16, "s"], [7, 16, "k"], [8, 16, "S"], [8, 17, "k"], [5, 16, "k"]]) put(g, x, y, c);
  for (let y = 3; y < 12; y++) put(g, 19, y, "l");
  for (const [x, y, c] of [[18, 12, "B"], [19, 12, "B"], [18, 13, "w"], [19, 13, "w"], [19, 11, "B"]]) put(g, x, y, c);
  return [rowsOf(g), { R, r, T: tip[0], t: tip[1], C: grip[0], c: grip[1], x: grip[2], S: reel[0], s: reel[1], k: reel[2], i: "#d8e0e8", l: "#d8ecf4", B: bob, w: "#fffaf0" }, "#141820"];
}

// Cebo magico: una latita abierta llena de bolitas que brillan, con su
// etiqueta de estrellas y chispas por encima.
function magicBait() {
  const g = [
    "......s.......",
    ".....sWs...S..",
    "......s...SWS.",
    "...........S..",
    "...pPPpPPp....",
    "..pPWPpPpPPp..",
    ".tTTTTTTTTTTt.",
    ".tMmmmmmmmmnt.",
    ".tMLLLLLLLLnt.",
    ".tMLyLLLLyLnt.",
    ".tMLLLyLLLLnt.",
    ".tMmmmmmmmmnt.",
    "..tttttttttt.."
  ];
  return [g, { s: "#fff6cf", S: "#ffd6ff", W: "#ffffff", p: "#b04ad8", P: "#ff7ad8", T: "#eef4f8", t: "#5a6470", M: "#d0d8e0", m: "#a8b4c0", n: "#7a8692", L: "#7a3ab8", y: "#ffd166" }, "#26202e"];
}

// El señuelo curioso: un pececillo de metal con su ojo grande, la aleta roja,
// la argolla en el morro y el anzuelo triple colgando.
function curiosityLure() {
  const W = 16, H = 13, g = blank(W, H), metal = ["d", "m", "l", "h"];
  for (let y = 1; y < 9; y++) for (let x = 3; x < 15; x++) {
    const u = (x + 0.5 - 9) / 5.6, v = (y + 0.5 - 4.8) / 3.1;
    if (u * u + v * v > 1) continue;
    g[y][x] = Math.abs(v) < 0.2 && x > 4 && x < 13 ? "o" : tone(u * 0.4 + v * 1.1, metal);
  }
  for (const [x, y] of [[6, 3], [8, 2], [10, 3], [7, 6], [9, 6]]) put(g, x, y, "h");
  for (const [x, y, c] of [[2, 3, "r"], [2, 4, "R"], [2, 5, "r"], [2, 6, "r"], [1, 2, "R"], [1, 3, "R"], [1, 6, "r"], [1, 7, "r"], [0, 1, "R"], [0, 2, "R"], [0, 7, "r"], [0, 8, "r"]]) put(g, x, y, c);
  put(g, 12, 3, "W"); put(g, 13, 3, "W"); put(g, 12, 4, "W"); put(g, 13, 4, "k");
  for (const [x, y] of [[15, 4], [15, 5], [14, 5]]) put(g, x, y, "y");
  for (const [x, y, c] of [[9, 9, "H"], [9, 10, "H"], [9, 11, "j"], [8, 11, "H"], [10, 11, "H"], [7, 10, "H"], [11, 10, "H"], [7, 12, "j"], [11, 12, "j"], [9, 12, "j"]]) put(g, x, y, c);
  return [rowsOf(g), { d: "#3a6a78", m: "#6ab0c0", l: "#a8e0e8", h: "#f0ffff", o: "#ff9a3a", R: "#ff5a4a", r: "#b02a2a", W: "#ffffff", k: "#0a1418", y: "#ffd166", H: "#c0c8d0", j: "#6a7480" }, "#142630"];
}

// Nasa para cangrejos: jaula de listones con su red, una cuerda enrollada
// encima y una pinza roja asomando.
function crabPot() {
  const W = 16, H = 16, g = blank(W, H);
  for (const [x, y] of [[6, 0], [7, 0], [8, 0], [5, 1], [9, 1], [6, 2], [7, 2], [8, 2], [7, 3]]) put(g, x, y, (x + y) % 2 ? "o" : "O");
  for (let y = 4; y < 15; y++) for (let x = 1; x < 15; x++) {
    if ((y === 4 && (x === 1 || x === 14))) continue;
    const rail = y === 4 || y === 5 || y === 14, post = x === 1 || x === 14 || x === 7 || x === 8;
    if (rail) g[y][x] = y === 4 ? (x < 9 ? "W" : "w") : y === 5 ? "w" : "n";
    else if (post) g[y][x] = x === 1 || x === 7 ? "w" : "n";
    else g[y][x] = (x + y) % 3 === 0 || (x - y + 30) % 3 === 0 ? "e" : "i";
  }
  for (const [x, y, c] of [[4, 11, "C"], [5, 11, "c"], [10, 12, "C"], [11, 12, "c"], [10, 11, "c"], [5, 12, "c"]]) put(g, x, y, c);
  for (const [x, y, c] of [[15, 9, "C"], [15, 10, "c"], [14, 9, "c"]]) put(g, x, y, c);
  return [rowsOf(g), { O: "#e8d0a0", o: "#b8955e", W: "#d8a868", w: "#a8743e", n: "#6a4422", e: "#d8c898", i: "#16282a", C: "#ff6a4a", c: "#c0382a" }, "#24160a"];
}

// --- Lo nuevo del puesto ----------------------------------------------------

// Sombrero de paja: copa tejida, cinta roja con una margarita y ala ancha.
function strawHat() {
  const W = 20, H = 11, g = blank(W, H), straw = ["d", "m", "l", "h"];
  for (let y = 0; y < 6; y++) for (let x = 4; x < 16; x++) {
    const u = (x + 0.5 - 10) / 5.6, v = (y + 0.5 - 6) / 6;
    if (u * u + v * v > 1) continue;
    g[y][x] = tone(u * 0.9 + (v + 0.5) * 0.7 + (y % 2 ? 0.25 : 0), straw);
  }
  for (let x = 4; x < 16; x++) { put(g, x, 4, x < 8 ? "R" : "r"); put(g, x, 5, "q"); }
  for (const [x, y, c] of [[13, 3, "f"], [12, 4, "f"], [14, 4, "f"], [13, 5, "f"], [13, 4, "c"]]) put(g, x, y, c);
  for (let y = 5; y < 11; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - 10) / 10, v = (y + 0.5 - 7.6) / 3;
    if (u * u + v * v > 1 || (y === 5 && Math.abs(x + 0.5 - 10) < 6)) continue;
    g[y][x] = tone(u * 0.8 + v * 0.9 + ((x + y) % 3 === 0 ? 0.3 : 0), straw);
  }
  for (let x = 6; x < 14; x++) if (g[6][x] !== ".") g[6][x] = "q";
  return [rowsOf(g), { h: "#fff2c0", l: "#f0d088", m: "#d8b060", d: "#a87c38", q: "#8a6428", R: "#f06a5a", r: "#c83a30", f: "#fffaf0", c: "#ffd166" }, "#4a3410"];
}

// Peto vaquero: tirantes con botones de laton, bolsillo en el peto con
// pespunte naranja, costura central, perneras y dobladillo vuelto.
function overalls() {
  const W = 16, H = 18, g = blank(W, H), denim = ["d", "m", "l", "h"];
  for (let y = 0; y < 3; y++) { put(g, 2 + Math.floor(y / 2), y, "m"); put(g, 13 - Math.floor(y / 2), y, "d"); }
  for (let y = 3; y < H; y++) for (let x = 0; x < W; x++) {
    const bib = y < 8, inBib = x >= 3 && x <= 12, legGap = y >= 12 && (x === 7 || x === 8);
    if ((bib && !inBib) || legGap || (y < 8 && false)) continue;
    if (!bib && (x === 0 || x === 15) && y < 9) continue;
    const k = (x - 7.5) / 8 + (y - 9) / 20;
    g[y][x] = y >= 16 ? (x < 8 ? (y === 16 ? "h" : "l") : (y === 16 ? "l" : "m")) : tone(k, denim);
  }
  put(g, 3, 3, "y"); put(g, 12, 3, "Y");
  for (let x = 5; x < 11; x++) { put(g, x, 5, "o"); put(g, x, 8 - 0, g[8][x]); }
  for (let y = 5; y < 8; y++) { put(g, 5, y, "o"); put(g, 10, y, "o"); }
  for (let y = 9; y < 12; y++) put(g, 7, y, "k");
  for (let y = 12; y < 16; y++) { put(g, 6, y, "k"); put(g, 9, y, "k"); }
  for (let x = 1; x < 15; x++) if (g[8][x] !== ".") g[8][x] = x < 8 ? "m" : "d";
  return [rowsOf(g), { h: "#9ab8ec", l: "#6a8ad0", m: "#4466a8", d: "#2e4a80", k: "#22385e", o: "#f0a040", y: "#ffe07a", Y: "#c89a30" }, "#121e36"];
}

// Gafas redondas de alambre dorado, con su brillo en cada cristal.
function specs() {
  const W = 18, H = 8, g = blank(W, H);
  for (const cx of [4, 13]) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 4);
    if (d > 3.7) continue;
    if (d > 2.7) g[y][x] = (x + 0.5 - cx) + (y + 0.5 - 4) < -1 ? "R" : (x + 0.5 - cx) + (y + 0.5 - 4) > 1.5 ? "q" : "r";
    else g[y][x] = (x + 0.5 - cx) + (y + 0.5 - 4) < -1.5 ? "W" : "l";
  }
  for (const x of [8, 9]) put(g, x, 3, "r");
  put(g, 0, 3, "q"); put(g, 17, 3, "q");
  return [rowsOf(g), { R: "#ffe08a", r: "#c8a040", q: "#8a6a20", l: "#b8dcf0", W: "#f4fcff" }, "#3a2a08"];
}

// Paraguas de hoja: una hoja enorme con su nervio y sus venas, el borde
// lobulado, la punta caida y un tallo de mango con la curva abajo.
function leafUmbrella() {
  const W = 19, H = 18, g = blank(W, H), leaf = ["d", "m", "l", "h"];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 18; x++) {
    const u = (x + 0.5 - 9) / 8.8, v = (y + 0.5 - 10) / 9.6;
    if (u * u + v * v > 1) continue;
    if (y === 9 && x % 4 === 1) continue;
    g[y][x] = tone(u * 0.8 + (v + 0.5) * 0.8, leaf);
  }
  for (let y = 1; y < 10; y++) put(g, 9, y, "v");
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) linePts(9, 2 + k * 2, 9 + s * (4 + k), 5 + k * 2).forEach(([x, y], i) => i && g[y]?.[x] && g[y][x] !== "." && put(g, x, y, "v"));
  put(g, 18, 9, "d"); put(g, 18, 10, "d"); put(g, 17, 10, "m");
  for (let y = 10; y < 17; y++) put(g, 9, y, y % 3 ? "t" : "T");
  put(g, 8, 17, "t"); put(g, 7, 17, "t"); put(g, 6, 16, "t");
  return [rowsOf(g), { h: "#c0f08a", l: "#7ac85a", m: "#4a9a3a", d: "#2c6a26", v: "#d8f8b0", t: "#7a5a2e", T: "#a8804a" }, "#122e10"];
}

// La lubina de trofeo: escudo de madera tallado con bisel, la placa de laton
// y el pez arqueado con la boca abierta.
function trophyFish() {
  const W = 20, H = 17, g = blank(W, H);
  const inShield = (x, y) => x >= 2 && x <= 17 && y >= 1 && y <= 16 && (y <= 10 || Math.abs(x + 0.5 - 10) <= 8 - (y - 10) * 1.35);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inShield(x, y)) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inShield(x + dx, y + dy));
    const ring = !edge && [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => !inShield(x + dx, y + dy));
    g[y][x] = edge ? (x + y < 16 ? "l" : "d") : ring ? (x + y < 16 ? "h" : "n") : y % 3 === 0 ? "g" : "m";
  }
  for (let x = 7; x < 13; x++) { put(g, x, 12, x === 7 ? "Y" : "y"); put(g, x, 13, "Y"); }
  const fish = [
    "........ff.......",
    "......fFFFf......",
    "T...bbbbbbbbbb...",
    "TT.bBBBBkBBBBeBb.",
    "TTbBBBBBkkBBBBBBO",
    "TTbsssssssssssbb.",
    "TT.bbsssssssbb...",
    "T....bb..fb......"
  ];
  fish.forEach((row, y) => row.split("").forEach((c, x) => { if (c !== ".") put(g, x + 1, y + 3, c); }));
  put(g, 15, 6, "W");
  return [rowsOf(g), { l: "#c8925a", h: "#a8743e", m: "#7a4a22", g: "#6a3e1c", n: "#5a3416", d: "#3a200c", y: "#ffd166", Y: "#b8862a", b: "#2e5a2a", B: "#5a9a40", k: "#24401e", s: "#e8e0a0", T: "#3e7a30", f: "#4a8a3a", F: "#7ac05a", e: "#ffffff", W: "#101810", O: "#c84a3a" }, "#1e1206"];
}

// Barco en una botella: cristal con reflejo, el corcho, un velero de velas
// blancas con su banderita sobre olas azules, y la peana de madera.
function shipBottle() {
  const W = 20, H = 12, g = blank(W, H);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) {
    const u = (x + 0.5 - 8) / 8, v = (y + 0.5 - 5) / 5;
    if (Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 2.4) > 1) continue;
    const edge = Math.pow(Math.abs((x + 1.5 - 8) / 8), 4) + Math.pow(Math.abs(v), 2.4) > 1 || Math.pow(Math.abs((x - 0.5 - 8) / 8), 4) + Math.pow(Math.abs(v), 2.4) > 1 || Math.pow(Math.abs(u), 4) + Math.pow(Math.abs((y + 1.5 - 5) / 5), 2.4) > 1 || Math.pow(Math.abs(u), 4) + Math.pow(Math.abs((y - 0.5 - 5) / 5), 2.4) > 1;
    g[y][x] = edge ? (y < 5 ? "w" : "v") : y < 6 ? "a" : "A";
  }
  for (let y = 3; y < 7; y++) { put(g, 16, y, y === 3 ? "w" : "v"); put(g, 17, y, y < 5 ? "C" : "c"); put(g, 18, y, y < 5 ? "C" : "c"); }
  for (let x = 1; x < 15; x++) { put(g, x, 7, (x + 1) % 4 ? "s" : "S"); if (g[8][x] !== "." && g[8][x] !== "v") put(g, x, 8, "s"); }
  for (let x = 4; x < 12; x++) put(g, x, 6, x === 4 || x === 11 ? "H" : "h");
  for (let x = 5; x < 11; x++) put(g, x, 7, "H");
  for (let y = 1; y < 6; y++) put(g, 8, y, "t");
  for (const [x, y] of [[7, 2], [7, 3], [6, 3], [7, 4], [6, 4], [5, 4]]) put(g, x, y, "W");
  for (const [x, y] of [[9, 3], [9, 4], [10, 4]]) put(g, x, y, "W");
  put(g, 9, 1, "r"); put(g, 10, 1, "r");
  for (let x = 3; x < 13; x++) if (x < 5 || x > 10) put(g, x, 10, "b");
  for (const x of [3, 4, 11, 12]) put(g, x, 11, "n");
  for (let x = 3; x < 11; x++) if (g[1][x] === "w" || g[1][x] === "a") put(g, x, 1, "L");
  return [rowsOf(g), { w: "#c8f0e8", v: "#7ab0a8", a: "#d8f4f0", A: "#b0dcd6", L: "#ffffff", C: "#e0b47a", c: "#a8743e", s: "#3a7ad0", S: "#c8e8ff", h: "#a8743e", H: "#6a4422", t: "#5a3a1e", W: "#fffaf0", r: "#e84a3a", b: "#a8743e", n: "#6a4422" }, "#1c3438"];
}

// Bonsai: maceta baja azul vidriada con sus patas, musgo, tronco retorcido
// y tres nubes de hojas con luz arriba.
function bonsai() {
  const W = 16, H = 16, g = blank(W, H), foliage = ["d", "m", "l", "h"];
  for (const [cx, cy, rx, ry] of [[5, 4.2, 4, 2.4], [11.2, 3, 4, 2.4], [9.5, 7.4, 3.4, 1.8]]) {
    for (let y = 0; y < 11; y++) for (let x = 0; x < W; x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v > 1) continue;
      g[y][x] = tone(u * 0.6 + v * 0.9 + ((x * 3 + y * 5) % 7 === 0 ? 0.4 : 0), foliage);
    }
  }
  for (const [x, y, c] of [[8, 11, "T"], [7, 10, "T"], [7, 9, "t"], [6, 8, "T"], [6, 7, "t"], [7, 6, "t"], [8, 6, "T"], [9, 5, "t"], [5, 6, "T"], [8, 10, "t"], [9, 9, "t"], [10, 8, "T"]]) put(g, x, y, c);
  for (let x = 2; x < 14; x++) put(g, x, 11, (x % 3) ? "M" : "N");
  for (let y = 12; y < 15; y++) for (let x = 1; x < 15; x++) {
    if (y === 14 && (x === 1 || x === 14)) continue;
    g[y][x] = y === 12 ? (x < 6 ? "P" : "p") : x < 4 ? "p" : x > 11 ? "o" : y === 13 ? "p" : "o";
  }
  put(g, 3, 13, "Q");
  for (const x of [2, 3, 12, 13]) put(g, x, 15, "o");
  return [rowsOf(g), { h: "#b8e880", l: "#7ac05a", m: "#4a8a3a", d: "#2c5a26", T: "#9a6a3a", t: "#6a4422", M: "#6aa83a", N: "#4a8a2a", P: "#8ab0e0", p: "#4a7ab8", o: "#2a5a8a", Q: "#e8f4ff" }, "#142236"];
}

// Lampara de lava: tapa y base de metal, cristal que se ensancha hacia abajo
// con el liquido morado y las burbujas de cera naranja y rosa. `phase` (0-3)
// mueve las burbujas: en el cuarto sube y baja una, y otra se despega.
const LAVA_BLOBS = [
  [[4, 4, "p"], [5, 4, "p"], [5, 6, "o"], [6, 6, "o"], [5, 7, "O"], [6, 7, "o"], [3, 9, "p"]],
  [[4, 5, "p"], [5, 5, "p"], [5, 5, "o"], [5, 6, "O"], [6, 6, "o"], [4, 9, "p"], [3, 10, "p"]],
  [[5, 6, "p"], [4, 6, "p"], [5, 4, "o"], [6, 4, "o"], [5, 5, "O"], [6, 5, "o"], [4, 8, "p"]],
  [[4, 5, "p"], [4, 4, "p"], [5, 5, "o"], [6, 5, "o"], [5, 6, "O"], [6, 6, "o"], [3, 9, "p"]]
];
function lavaLamp(phase = 0) {
  const W = 10, H = 20, g = blank(W, H);
  for (let y = 0; y < 3; y++) for (let x = 0; x < W; x++) {
    const hw = 1.5 + y * 0.8;
    if (Math.abs(x + 0.5 - 5) > hw) continue;
    g[y][x] = x < 4 ? "M" : x > 5 ? "n" : "m";
  }
  put(g, 4, 0, "W");
  for (let y = 3; y < 14; y++) for (let x = 0; x < W; x++) {
    const hw = 2.4 + (y - 3) * 0.17;
    if (Math.abs(x + 0.5 - 5) > hw) continue;
    g[y][x] = x + 0.5 - 5 < -hw + 1.2 ? "L" : "l";
  }
  for (const [x, y, c] of [...LAVA_BLOBS[phase % 4], [3, 10, "o"], [4, 10, "O"], [3, 11, "o"], [4, 11, "o"], [5, 11, "o"], [6, 11, "O"], [7, 11, "o"], [3, 12, "o"], [4, 12, "o"], [5, 12, "o"], [6, 12, "o"], [7, 12, "o"], [4, 13, "o"], [5, 13, "o"], [6, 13, "o"]]) put(g, x, y, c);
  for (let y = 14; y < H; y++) for (let x = 0; x < W; x++) {
    const hw = y < 15 ? 3.5 : y < 18 ? 3.5 + (y - 15) * 0.5 : 5;
    if (Math.abs(x + 0.5 - 5) > hw) continue;
    g[y][x] = y === 14 ? "n" : x < 3 ? "M" : x > 6 ? "n" : "m";
  }
  put(g, 2, 16, "W");
  return [rowsOf(g), { M: "#a8c8d4", m: "#6a8a98", n: "#3a4a58", W: "#f0fcff", l: "#5a2280", L: "#8a3ab0", o: "#ff8a3a", O: "#ffc070", p: "#ff5a8a" }, "#141826"];
}

const ART = {
  "market-beanie": beanie,
  "market-vest": vest,
  "market-lantern": lantern,
  "market-terrarium": terrarium,
  "market-moon": moon,
  "market-arcade": arcade,
  "rod-fiberglass": () => rod({ blank: ["#f0e2b0", "#b8a070"], tip: ["#ff5a4a", "#a82a20"], grip: ["#e8c890", "#c8a060", "#8a6a3a"], reel: ["#e8eef4", "#a8b4c0", "#4a5460"], bob: "#e84a3a" }),
  "rod-iridium": () => rod({ blank: ["#b88af0", "#6a3ab0"], tip: ["#ffe0ff", "#c88af0"], grip: ["#4a3a5a", "#2e2238", "#1a1222"], reel: ["#ffe08a", "#d8a840", "#8a6420"], bob: "#c88af0" }),
  "lure-magic-bait": magicBait,
  "lure-curiosity": curiosityLure,
  "lure-crab-pot": crabPot,
  "market-straw-hat": strawHat,
  "market-overalls": overalls,
  "market-specs": specs,
  "market-leaf-umbrella": leafUmbrella,
  "market-trophy-fish": trophyFish,
  "market-ship-bottle": shipBottle,
  "market-bonsai": bonsai,
  "market-lava-lamp": lavaLamp
};

export const isGoodsArt = (id) => Boolean(ART[id]);
const sprites = new Map(), urls = new Map();
export function goodsSprite(id) {
  if (!ART[id]) return null;
  let img = sprites.get(id);
  if (!img) { const [rows, pal, out] = ART[id](); img = outlinedSprite(rows, pal, out); sprites.set(id, img); }
  return img;
}
// Como imagen (para <img> y <image> del SVG), con su tamaño en pixeles de arte.
export function goodsImage(id) {
  const img = goodsSprite(id);
  if (!img) return null;
  let url = urls.get(id);
  if (!url) { url = img.toDataURL(); urls.set(id, url); }
  return { url, w: img.width, h: img.height };
}
// La lampara de lava en sus cuatro fotogramas (en el cuarto se mueve).
const lavaFrames = lazy(() => [0, 1, 2, 3].map((phase) => { const [rows, pal, out] = lavaLamp(phase); return outlinedSprite(rows, pal, out); }));
export function goodsFrame(id, t) {
  return id === "market-lava-lamp" ? lavaFrames()[Math.floor(t * 1.4) % 4] : goodsSprite(id);
}
// Lo que brilla de cada pieza en el cuarto (coordenadas dentro del sprite):
// el halo que se suma encima (`pool`: x, y, radio, color, fuerza) y la luz que
// echa al cuarto (`light`: radio, color, fuerza); `lit`: brilla entera (se
// vuelve a pintar sin la luz del cuarto encima); la recreativa parpadea en
// `blink` (los dos pixeles del bichito de su pantalla).
export const GOODS_GLOW = {
  "market-moon": { pool: [8, 8, 9, [255, 210, 130], 0.22], light: [30, [255, 200, 120], 0.45], lit: true },
  "market-arcade": { pool: [8, 8, 7, [140, 230, 190], 0.16], light: [22, [120, 230, 180], 0.4], blink: [[6, 7], [9, 7]] },
  "market-lava-lamp": { pool: [6, 10, 8, [255, 120, 170], 0.26], light: [26, [255, 120, 170], 0.45], lit: true }
};
export const MARKET_GOODS_ART = lazy(() => Object.fromEntries(Object.keys(ART).map((id) => [id, goodsSprite(id)])));
