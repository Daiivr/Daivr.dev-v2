import { lazy, outlinedSprite } from "./core.js";
import { paintLeaf } from "./leaf.js";
import { ROD_LOOK } from "./tackle.js";

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
// (los colores son los de ROD_LOOK: la misma caña que Pip saca en el footer)
function rod({ blank: [R, r], tip, grip, reel, bob, nodes, knots }) {
  const W = 20, H = 20, g = blank(W, H);
  linePts(5, 14, 17, 2).forEach(([x, y], i) => { put(g, x, y, (nodes && i % 3 === 1) || (knots && i % 5 === 3) ? "r" : "R"); put(g, x + 1, y + 1, "r"); if (i % 4 === 2 && i < 11) put(g, x + 1, y + 2, "i"); });
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
    "..s.......S...",
    ".sWs.....SWS..",
    "..s..pppp..S..",
    "....pPPPPp....",
    "...pPWPPPPp...",
    "...pPWPPPPd...",
    "...pPPPPPdd...",
    "...ppPPPddd...",
    "....pppddd....",
    "......hh......",
    ".....h..h.....",
    "....h....h....",
    "....hH..Hh...."
  ];
  return [g, { s: "#fff6cf", S: "#ffd6ff", W: "#ffffff", p: "#b04ad8", P: "#ff7ad8", d: "#7a2a9a", h: "#c8d0d8", H: "#6a7480" }, "#2a1036"];
}

// El lucky lure: una cucharilla dorada en forma de gota con su gema azul, la
// argolla arriba y el anzuelo triple abajo (como la de la punta del sedal).
function luckyLure() {
  const g = [
    ".....hh.......",
    "....h..h......",
    ".....hh.......",
    ".....yy.......",
    "....yHYy......",
    "...yHYYYy.....",
    "...yYbbYYy....",
    "..yYbBbYYy....",
    "..yYYbbYYy....",
    "..yYYYYYYd....",
    "...yYYYYdd....",
    "....yddd......",
    ".....hh.......",
    "....h.h.h.....",
    "...h..h..h....",
    "...hh.h.hh...."
  ];
  return [g, { y: "#b8862a", Y: "#ffd166", H: "#fff4c0", d: "#8a6418", b: "#1f6f93", B: "#45d8ff", h: "#c8d0d8" }, "#4a3a10"];
}

// El swift lure: una hoja de cuchara en rayo, cian con su brillo, el anzuelo
// abajo y unas rayas de velocidad.
function swiftLure() {
  const g = [
    "........cc....",
    ".......cWc....",
    "......cWc..s..",
    ".....cWcC.....",
    "....cWcC...s..",
    "...cWWWWWcC...",
    "....cCWWcC.s..",
    "......cWC.....",
    ".....cWC......",
    "....cWC.......",
    "...cWC........",
    "...cC.........",
    "..hh..........",
    ".h.h..........",
    ".hh..........."
  ];
  return [g, { c: "#45d8ff", C: "#1f8ab0", W: "#f4fff8", s: "#b8f0ff", h: "#c8d0d8" }, "#123a4a"];
}

// El anchor lure: un anclita cian con su argolla, el cepo, la caña y los
// brazos curvos con las uñas verdes.
function anchorLure() {
  const g = [
    "......oo......",
    ".....o..o.....",
    "......oo......",
    "....cWccCC....",
    "......cC......",
    "......cC......",
    "......cC......",
    "......cC......",
    "..G...cC...G..",
    "..gc..cC..cg..",
    "...cc.cC.cC...",
    "....cccCCC....",
    ".....cCC......"
  ];
  return [g, { c: "#45d8ff", C: "#1f8ab0", W: "#d6f8ff", g: "#3fff97", G: "#b8ffd8", o: "#c8d0d8" }, "#123a4a"];
}

// El magnet lure: un iman de herradura rosa con las puntas blancas y su
// argolla.
function magnetLure() {
  const g = [
    "..WW......Ww..",
    "..WW......Ww..",
    "..Lp......pP..",
    "..Lp......pP..",
    "..Lp......pP..",
    "..Lp......pP..",
    "..Lpp....pPP..",
    "...Lppppppp...",
    "....pppppP....",
    "......hh......",
    ".....h..h....."
  ];
  return [g, { p: "#ff3d9d", P: "#b01a60", L: "#ff8ac4", W: "#f4fff8", w: "#c8d0d8", h: "#c8d0d8" }, "#4a1030"];
}

// El traje de pescador: el sombrero de pesca con su señuelo sobre el chaleco
// oliva abierto, con los bolsillos (los colores del rig).
function fisherOutfit() {
  const g = [
    "......hhhhhh........",
    ".....hHHlHHHh.......",
    ".....hHHHHHHhRY.....",
    ".....bbbbbbbbR......",
    "...BBBBBBBBBBBBB....",
    "..BBBBBBBBBBBBBBB...",
    "....................",
    ".....llll..mmmm.....",
    "....lllll..mmmmd....",
    "...llllll..mmmmmd...",
    "..lllllll..mmmmmmd..",
    "..lllllll..mmmmmmd..",
    "..lkkklll..mkkkmmd..",
    "..lmmmlll..mmmmmmd..",
    "..lmymlll..mmymmmd..",
    "..lllllll..mmmmmmd..",
    "..ddddddd..ddddddd.."
  ];
  return [g, { h: "#6a6a3a", H: "#8a8a4a", l: "#a8a868", b: "#4a3a1a", B: "#7a7a42", R: "#e84a3a", Y: "#ffd166", m: "#6e6e38", d: "#4a4a22", k: "#34340e", y: "#ffd166" }, "#24240e"];
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

// Paraguas de hoja: una hoja grande arqueada y asimetrica (la punta cae a la
// derecha), con el nervio por arriba, venas en diagonal hacia la punta, el
// envés oscuro y lobulado por debajo, y el tallo de mango con su curva.
function leafUmbrella() {
  const W = 23, H = 19, g = blank(W, H);
  const keys = { out: "o", h: "h", l: "l", m: "m", d: "d", under: "u", rib: "v", vein: "w", stem: "t" };
  const leaf = paintLeaf((x, y, key) => put(g, x + 2, y, keys[key]), { len: 19, peakY: 5, rise: 3, droop: 2, H: 6 });
  // el tallo: baja de debajo de la hoja y se curva al final
  for (let y = leaf.bot(8) + 2; y <= 16; y++) put(g, 10, y, y % 3 ? "t" : "T");
  put(g, 9, 17, "t"); put(g, 8, 17, "t"); put(g, 7, 16, "t");
  return [rowsOf(g), { o: "#14320f", h: "#b8ec88", l: "#7ac85a", m: "#4f9e3c", d: "#2f6e2a", u: "#1e4a1a", v: "#d8f4a8", w: "#94d064", t: "#5a7a2e", T: "#7a9a40" }, "#14320f"];
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

// --- Mas cosas del puesto ----------------------------------------------------

// Gorro de rana para la lluvia: copa verde con los dos ojos saltones encima,
// mofletes rosas, una sonrisa y el ala de lluvia.
function frogHat() {
  const W = 18, H = 14, g = blank(W, H), green = ["d", "m", "l", "h"];
  for (let y = 3; y < 10; y++) for (let x = 2; x < 16; x++) {
    const u = (x + 0.5 - 9) / 6.6, v = (y + 0.5 - 10) / 6.6;
    if (u * u + v * v > 1) continue;
    g[y][x] = tone(u * 0.8 + (v + 0.6) * 0.9, green);
  }
  for (const cx of [5.2, 12.8]) for (let y = 0; y < 5; y++) for (let x = 2; x < 16; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 2.4);
    if (d > 2.5) continue;
    g[y][x] = d > 1.6 ? (x + 0.5 < cx ? "l" : "m") : y < 2 && x + 0.5 < cx ? "W" : "w";
  }
  put(g, 5, 2, "k"); put(g, 13, 2, "k"); put(g, 5, 3, "k"); put(g, 13, 3, "k");
  put(g, 4, 8, "p"); put(g, 14, 8, "p");
  for (const [x, y] of [[7, 8], [8, 9], [9, 9], [10, 9], [11, 8]]) put(g, x, y, "s");
  for (let y = 9; y < 13; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - 9) / 9, v = (y + 0.5 - 10.8) / 2.2;
    if (u * u + v * v > 1 || (y < 10 && Math.abs(x + 0.5 - 9) < 6)) continue;
    g[y][x] = y === 9 || (y === 10 && Math.abs(x + 0.5 - 9) >= 6) ? (x < 9 ? "l" : "m") : y === 12 ? "D" : "d";
  }
  return [rowsOf(g), { h: "#b8ec7a", l: "#7ac84a", m: "#4f9e34", d: "#2f6e24", D: "#1e4a18", w: "#f4f8ec", W: "#ffffff", k: "#101810", p: "#ff9ab8", s: "#1e4a18" }, "#123010"];
}

// Sudadera calentita: mostaza, con la capucha detras del cuello, cordones,
// bolsillo canguro, mangas y el puño y la cintura en canale.
function hoodie() {
  const g = [
    "......hhhhhh......",
    ".....hHHHHHHh.....",
    "....hHooooooHh....",
    "....hoooooooHh....",
    "..LLhoooooooohmm..",
    ".LLLLhwoooowhmmmm.",
    "LLLLDLwLMMMwMDmmmm",
    "LLLLDLLwMMMwMDmmmd",
    "cLLLDLLWMMMWMDmmdc",
    "cccDLLLMMMMMMMDccc",
    "...DLLLMMMMMMMD...",
    "...DLLppppppMMD...",
    "...DLpLLMMMMpMD...",
    "...DLpLMMMMMpMD...",
    "...DLLLMMMMMMMD...",
    "...DLLLMMMMMMMD...",
    "...cCcCcCcCcCcC..."
  ];
  return [g, { h: "#e0a83a", H: "#ffe08a", o: "#4a2e0c", L: "#f4c860", M: "#e0a83a", m: "#c88e2c", d: "#a8741e", D: "#7a5014", c: "#b07a20", C: "#d89a30", w: "#f4f0e0", W: "#c8c0a8", p: "#8a5e18" }, "#3a2408"];
}

// El brote de la antena: la bola azul de Pip con un tallito y dos hojas.
function sprout() {
  const g = [
    "......ll..",
    "...l..lLl.",
    "..lLl.lLLl",
    "..lLLlsLl.",
    "...lLs.l..",
    ".....s....",
    ".....s....",
    "...bBBBb..",
    "..bBhBBBb.",
    "..bBBBBBb.",
    "..bBBBBbb.",
    "...bbbbb.."
  ];
  return [g, { l: "#7ac84a", L: "#b8ec7a", s: "#4f9e34", b: "#1f6f93", B: "#45d8ff", h: "#d6f8ff" }, "#14465a"];
}

// Lampara seta: sombrero rojo con motas que brilla, pie crema con su
// ventanita encendida y un poco de musgo.
function mushroomLamp() {
  const W = 16, H = 18, g = blank(W, H), red = ["d", "m", "l", "h"];
  for (let y = 0; y < 8; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - 8) / 7.8, v = (y + 0.5 - 8) / 7.6;
    if (u * u + v * v > 1) continue;
    g[y][x] = y === 7 ? "u" : tone(u * 0.7 + (v + 0.5) * 0.8, red);
  }
  for (const [x, y] of [[4, 3], [5, 3], [9, 2], [10, 2], [12, 5], [7, 5], [2, 6]]) put(g, x, y, "w");
  for (let y = 8; y < 16; y++) for (let x = 5; x < 11; x++) g[y][x] = x === 5 ? "C" : x === 10 ? "e" : "c";
  for (let y = 10; y < 13; y++) for (let x = 7; x < 9; x++) put(g, x, y, y === 10 ? "Y" : "y");
  for (let x = 3; x < 13; x++) { put(g, x, 16, x % 3 ? "g" : "G"); put(g, x, 17, "G"); }
  put(g, 4, 15, "g"); put(g, 11, 15, "g");
  return [rowsOf(g), { h: "#ff9a80", l: "#f06a4a", m: "#d8402e", d: "#a02a20", u: "#f0d8b8", w: "#fff4e8", C: "#fff0d8", c: "#e8d4b0", e: "#b8a080", y: "#ffd166", Y: "#fff0a8", g: "#6aa83a", G: "#3a7a2a" }, "#3a1410"];
}

// Bola de nieve: cristal redondo con su brillo, una cabaña y un pino dentro,
// nieve en el suelo y copos flotando, sobre una peana de madera.
function snowGlobe() {
  const W = 16, H = 18, g = blank(W, H);
  for (let y = 0; y < 14; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 7);
    if (d > 7.2) continue;
    g[y][x] = d > 6.3 ? (x + y < 14 ? "w" : "v") : y > 9 ? "s" : y > 8 ? "S" : "a";
  }
  for (const [x, y] of [[10, 3], [9, 4], [10, 4], [11, 4], [9, 5], [10, 5], [11, 5], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [10, 8]]) put(g, x, y, y === 8 ? "t" : (x + y) % 3 ? "p" : "P");
  for (let y = 6; y < 9; y++) for (let x = 3; x < 7; x++) put(g, x, y, y === 6 ? "r" : x === 5 && y === 7 ? "y" : "c");
  put(g, 3, 5, "r"); put(g, 4, 5, "r"); put(g, 5, 5, "r"); put(g, 6, 5, "r"); put(g, 4, 4, "r"); put(g, 5, 4, "r");
  for (const [x, y] of [[3, 2], [7, 1], [12, 9], [2, 8], [6, 3], [13, 6]]) put(g, x, y, "f");
  put(g, 3, 3, "W"); put(g, 4, 2, "W"); put(g, 3, 4, "W");
  for (let x = 2; x < 14; x++) { put(g, x, 14, x < 4 ? "B" : "b"); put(g, x, 15, x < 4 ? "b" : "n"); }
  for (let x = 1; x < 15; x++) { put(g, x, 16, x < 3 ? "B" : "b"); put(g, x, 17, "n"); }
  return [rowsOf(g), { a: "#a8d8f0", w: "#e8f8ff", v: "#7ab0c8", W: "#ffffff", s: "#f4f8ff", S: "#d8e8f4", p: "#3a7a4a", P: "#2a5a38", t: "#6a4422", c: "#a8743e", r: "#c84a3a", y: "#ffd166", f: "#ffffff", B: "#c89058", b: "#8a5a2e", n: "#5a3a1e" }, "#1c3446"];
}

// Radio de casete: asa arriba, antena, dos altavoces redondos, la ventanita
// de la cinta con sus bobinas y el dial que brilla.
function radio() {
  const W = 20, H = 15, g = blank(W, H);
  for (let x = 6; x < 14; x++) put(g, x, 0, "k");
  put(g, 6, 1, "k"); put(g, 13, 1, "k");
  for (let y = 0; y < 3; y++) put(g, 17, y, "a");
  for (let y = 2; y < 14; y++) for (let x = 0; x < W; x++) g[y][x] = y === 2 ? (x < 10 ? "H" : "R") : y === 13 ? "D" : x === 0 ? "H" : x === W - 1 ? "D" : "R";
  for (const cx of [4, 15]) for (let y = 5; y < 13; y++) for (let x = cx - 4; x <= cx + 4; x++) {
    const d = Math.hypot(x + 0.5 - (cx + 0.5), y + 0.5 - 9);
    if (d > 3.4) continue;
    g[y][x] = d > 2.6 ? "k" : d < 1 ? "c" : (x + y) % 2 ? "s" : "S";
  }
  for (let y = 4; y < 9; y++) for (let x = 8; x < 12; x++) g[y][x] = y === 4 || y === 8 ? "k" : "t";
  put(g, 8, 6, "w"); put(g, 11, 6, "w"); put(g, 9, 6, "T"); put(g, 10, 6, "T");
  for (let x = 8; x < 12; x++) put(g, x, 10, x === 9 ? "y" : "k");
  for (let x = 8; x < 12; x++) put(g, x, 11, "b");
  put(g, 2, 3, "y"); put(g, 3, 3, "Y");
  return [rowsOf(g), { R: "#3a9aa0", H: "#7ad0c8", D: "#1e5a62", k: "#1a2a2e", s: "#4a5a5e", S: "#2e3a3e", c: "#8a9a9e", t: "#c8b090", T: "#3a2a1a", w: "#f4f0e0", y: "#ffd166", Y: "#ff8a4a", a: "#a8b4c0", b: "#e8e0c8" }, "#0e2024"];
}

// --- Lo de pescar del puesto --------------------------------------------------

// Chubasquero amarillo: capucha, botones oscuros por delante, bolsillos con
// solapa, mangas con su puño y brillos de hule.
function raincoat() {
  const g = [
    "......hhhhhh......",
    ".....hHHHHHHh.....",
    "....hHooooooHh....",
    "....hoooooooHh....",
    "..LLhoooooooohmm..",
    ".LWLLhLLMMMMhmmmm.",
    "LLLLDLWLbMMMMDmmmm",
    "LLLLDLLLMMMMMDmmmd",
    "cLLLDLLLbMMMMDmmdc",
    "cccDLWLLMMMMMMDccc",
    "...DLLLLbMMMMMD...",
    "...DLppLMMppMMD...",
    "...DLLLLbMMMMMD...",
    "...DLLLLMMMMMMD...",
    "...DLLLLbMMMMMD...",
    "...DLLLLMMMMMMD...",
    "...cccccccccccc..."
  ];
  return [g, { h: "#e0b020", H: "#fff080", o: "#5a4208", L: "#ffe060", W: "#fffbe0", M: "#f0c020", m: "#d8a818", D: "#9a7208", c: "#b8860a", b: "#3a2a10", p: "#b8860a" }, "#4a3608"];
}

// Gorro de pescador de lona caqui, con una mosca prendida en la cinta.
function bucketHat() {
  const g = [
    "....hhhhhhhhh.....",
    "...hHHHlHHHHHh....",
    "...hHlHHHHHHHh....",
    "...bbbbbbbbbbbRY..",
    "..hHHHHHHHHHHHHh..",
    ".BBBBBBBBBBBBBBBB.",
    "BBBBBBBBBBBBBBBBBB",
    ".dddddddddddddddd."
  ];
  return [g, { h: "#a89868", H: "#c8b888", l: "#e8dcb0", b: "#6a5a3a", B: "#b8a878", d: "#8a7a52", R: "#e84a3a", Y: "#ffd166" }, "#3a3018"];
}

// Caja de aparejos roja con las bandejas abiertas: en cada hueco, un señuelo.
function tackleBox() {
  const g = [
    ".......kkkk.......",
    "......k....k......",
    "..TTTTTTTTTTTTTT..",
    ".ToyoboToroboToT..",
    ".TTTTTTTTTTTTTTTT.",
    "LLLLLLLLLLLLLLLLLd",
    "LRRRRRRRRRRRRRRRRd",
    "LRRRRRRRsRRRRRRRRd",
    "LRRRRRRRRRRRRRRRRd",
    "LRRRRRRRRRRRRRRRRd",
    ".ddddddddddddddddd"
  ];
  return [g, { k: "#3a4048", T: "#c8d0d8", o: "#4a5460", y: "#ffd166", b: "#45d8ff", r: "#ff3d9d", L: "#f06a5a", R: "#c8382a", d: "#8a2018", s: "#ffd166" }, "#3a0e08"];
}

// Faro de bolsillo: torre a rayas blancas y rojas, la linterna que brilla, el
// balcon, la puerta y las rocas de la base.
function lighthouse() {
  const g = [
    ".....kk.....",
    "....kkkk....",
    "...gGWGg....",
    "...gGGGg....",
    "..kkkkkkkk..",
    "...wWwwr....",
    "...wWwwr....",
    "...rRrrd....",
    "...rRrrd....",
    "..wWwwwrr...",
    "..wWwwwrr...",
    "..rRrrrdd...",
    "..rRrrrdd...",
    "..wWwkkrr...",
    ".SsssssssSs.",
    "sSssSsssSsss"
  ];
  return [g, { w: "#f4f0e8", W: "#ffffff", r: "#d84a3a", R: "#f06a5a", d: "#8a2018", k: "#2a2a3a", g: "#ffd166", G: "#fff4b0", s: "#7a8088", S: "#a8b0b8" }, "#1a1a26"];
}

const ART = {
  "market-beanie": beanie,
  "market-vest": vest,
  "market-lantern": lantern,
  "market-terrarium": terrarium,
  "market-moon": moon,
  "market-arcade": arcade,
  ...Object.fromEntries(Object.keys(ROD_LOOK).filter(Boolean).map((id) => [id, () => rod(ROD_LOOK[id])])),
  lure: luckyLure,
  "lure-swift": swiftLure,
  "lure-anchor": anchorLure,
  "lure-magnet": magnetLure,
  "fisher-outfit": fisherOutfit,
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
  "market-lava-lamp": lavaLamp,
  "market-frog-hat": frogHat,
  "market-hoodie": hoodie,
  "market-sprout": sprout,
  "market-mushroom-lamp": mushroomLamp,
  "market-snow-globe": snowGlobe,
  "market-radio": radio,
  "market-raincoat": raincoat,
  "market-bucket-hat": bucketHat,
  "market-tackle-box": tackleBox,
  "market-lighthouse": lighthouse
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
  "market-lava-lamp": { pool: [6, 10, 8, [255, 120, 170], 0.26], light: [26, [255, 120, 170], 0.45], lit: true },
  "market-mushroom-lamp": { pool: [9, 5, 9, [255, 150, 100], 0.24], light: [26, [255, 160, 110], 0.45], lit: true },
  "market-radio": { pool: [10, 10, 5, [255, 210, 110], 0.14], light: [14, [255, 200, 110], 0.3], blink: [[3, 4], [4, 4]] },
  "market-snow-globe": { pool: [9, 8, 8, [190, 225, 255], 0.14], light: [16, [180, 220, 255], 0.3] },
  // (el faro: la linterna brilla y su haz barre la balda)
  "market-lighthouse": { pool: [6, 4, 7, [255, 230, 150], 0.26], light: [24, [255, 220, 140], 0.42], beam: [6, 4] }
};
export const MARKET_GOODS_ART = lazy(() => Object.fromEntries(Object.keys(ART).map((id) => [id, goodsSprite(id)])));
