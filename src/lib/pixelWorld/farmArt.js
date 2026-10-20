import { lazy, makeCanvas, outlinedSprite } from "./core.js";

// El arte de la granja del prado (life/yard.js, life/board.js, el huerto):
// el espantapajaros (con su disfraz de Halloween y su bufanda de invierno),
// la casita de abejas, el tarro de miel, la fruta, el arbol frutal en sus
// cuatro edades y sus estaciones, la calabaza gigante y el tablon de encargos
// del puesto. Luz arriba a la izquierda y contornos de su propio tono, como
// el resto del valle.

const pad = (rows) => { const w = Math.max(...rows.map((r) => r.length)); return rows.map((r) => r.padEnd(w, ".")); };
// Ruido fijo por pixel (0..1), para repartir flores sin que salgan en rayas.
function noise(x, y, seed) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed + 1, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// --- El espantapajaros (15 x 26; el palo de abajo queda tras la valla) -------
const SCARECROW = [
  "......hhh......",
  ".....hhhhh.....",
  ".....bbbbb.....",
  "...hhhhhhhhh...",
  "....HHHHHHH....",
  "....sssssss....",
  "....sessses....",
  "....sssssss....",
  "....smmmmms....",
  ".....SsssS.....",
  ".ycccccccccccy.",
  "yYckcCcccCckcYy",
  ".y.CckcccckC.y.",
  "....ckcCckc....",
  "....CckCkcC....",
  ".....CCwCC.....",
  "......ywy......",
  ...Array(9).fill("......Ww.......")
];
const SCARECROW_PAL = {
  h: "#e8c870", H: "#b8903e", b: "#c83a2a", s: "#d8b884", S: "#a88450", e: "#3a2414", m: "#6a3a1e",
  c: "#c8382a", C: "#8a2018", k: "#f08a5a", y: "#f0d070", Y: "#c8a040", W: "#b07a42", w: "#7a4a22",
  o: "#e07a22", O: "#ffa040", g: "#ffd84a", f: "#3a7ad0", F: "#d8e8ff"
};
// Halloween: cabeza de calabaza con la cara encendida; invierno: bufanda.
const SCARECROW_HEADS = {
  halloween: ["....ooooooo....", "....ogoOogo....", "....oOoOoOo....", "....oggggqo....".replace("q", "g"), ".....oOoOo....."],
  winter: null
};
function scarecrowRows(season) {
  const rows = SCARECROW.slice();
  if (season === "halloween") SCARECROW_HEADS.halloween.forEach((row, i) => { rows[5 + i] = row; });
  if (season === "winter") {
    // bufanda azul de rayas, con la punta colgando sobre la camisa
    rows[9] = "....fffFfff....";
    for (const [y, c] of [[10, "f"], [11, "F"], [12, "f"], [13, "F"]]) rows[y] = rows[y].slice(0, 9) + c + rows[y].slice(10);
  }
  return rows;
}
export const SCARECROW_BASE = SCARECROW.length - 1;

// --- La casita de abejas (11 x 15) -----------------------------------------------
const BEE_HOUSE = [
  ".....r.....",
  "....rrR....",
  "...rrrRR...",
  "..rrrrRRR..",
  ".rrrrrRRRR.",
  "QQQQQQQQQQQ",
  ".WWWWWWWWd.",
  ".Wwwwwwwwd.",
  ".Wwkkkkwwd.",
  ".Wdddddddd.",
  ".Wwwwwwwwd.",
  ".Wwwwwwwwd.",
  ".ddddddddd.",
  "..l.....l..",
  "..l.....l.."
];
const BEE_PAL = { r: "#c8603e", R: "#8a3a22", Q: "#5a2416", W: "#e8c088", w: "#c8955a", d: "#8a5a2e", k: "#2a1608", l: "#6a4226" };
// El tarro de miel (en la mano de Pip, en la cesta y encima de la casita).
const HONEY_JAR = [".kkkk.", "kKKKKk", ".yYyy.", "yYyyyy", "yylllY", "yyyyyY", ".yyyy."];
const HONEY_PAL = { k: "#8a5a2e", K: "#c8955a", y: "#ffb82a", Y: "#fff0a0", l: "#f4e8d0" };

// --- La fruta (en el arbol y en la mano) ---------------------------------------
const FRUIT_ART = {
  cherry: { rows: ["..g..", ".g.g.", "g...g", "rR.rR", "rr.rr"], pal: { g: "#3a7a32", r: "#c8203a", R: "#ff6a7a" }, out: "#4a0a14" },
  peach: { rows: [".gl.", "pPpp", "pPpo", "pppo", ".po."], pal: { g: "#3a7a32", l: "#7ac85a", p: "#ffa878", P: "#ffd8b8", o: "#e8784a" }, out: "#6a2a14" },
  apple: { rows: [".bl.", "rRrr", "rRrr", "rrrd", ".rd."], pal: { b: "#5a3418", l: "#7ac85a", r: "#d8302a", R: "#ff7a6a", d: "#a8201a" }, out: "#4a0a0a" }
};

// --- El arbol frutal: plantón, arbusto, arbolito y arbol ----------------------
// Copa de bolas que se tocan, sombreada hacia abajo a la derecha, con su borde
// mellado; en primavera con flores, en otoño mas dorada, en invierno pelada.
const TREE_SIZE = [{ w: 11, h: 15 }, { w: 15, h: 19 }, { w: 19, h: 26 }, { w: 25, h: 34 }];
const LEAVES = {
  spring: ["#a8e070", "#7ac850", "#4e9a3a", "#2e6a2a"],
  summer: ["#8ad85a", "#5ab04a", "#3a8a3a", "#245e26"],
  autumn: ["#e8d05a", "#b8b83e", "#7a9a32", "#4a6a24"],
  winter: null
};
const BLOSSOM = { cherry: ["#ffd0e0", "#ff9ab8"], peach: ["#ffd8e0", "#ff8aa8"], apple: ["#ffffff", "#ffd8e0"] };
const BARK = { l: "#a8743e", m: "#7a4a22", d: "#4a2c12" };
// Bolas de la copa de cada edad (centro x, centro y, radio), y donde cuelga la
// fruta en el arbol de verdad.
const CROWNS = [
  [[5, 3, 2.6], [3, 5, 2], [7, 5, 2]],
  [[7, 5, 4.2], [4, 7, 3.2], [10, 7, 3.2], [7, 9, 3]],
  [[9, 7, 5.5], [5, 10, 4.2], [13, 10, 4.4], [9, 12, 4.2], [7, 4, 3.4], [12, 5, 3]],
  [[12, 9, 7.2], [6, 13, 5.4], [18, 13, 5.6], [12, 16, 5.5], [8, 6, 4.6], [16, 6, 4.4], [3, 15, 3], [21, 15, 3]]
];
export const FRUIT_SPOTS = [[7, 13], [15, 11], [11, 17]];
function treeCanvas(stage, season, fruit) {
  const { w, h } = TREE_SIZE[stage], [c, g] = makeCanvas(w, h);
  const put = (x, y, col) => { if (x >= 0 && y >= 0 && x < w && y < h) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } };
  const cx = Math.floor(w / 2), trunkTop = stage === 0 ? 4 : stage === 1 ? 9 : stage === 2 ? 13 : 18;
  // el tronco (y en el plantón, la estaca de al lado con su atadura)
  const thick = stage < 2 ? 1 : stage === 2 ? 2 : 3;
  for (let y = trunkTop; y < h; y++) for (let k = 0; k < thick; k++) put(cx - Math.floor(thick / 2) + k, y, k === 0 ? BARK.l : k === thick - 1 ? BARK.d : BARK.m);
  if (stage === 3) { put(cx - 3, h - 1, BARK.m); put(cx - 2, h - 1, BARK.l); put(cx + 2, h - 1, BARK.m); put(cx + 3, h - 1, BARK.d); put(cx - 2, h - 2, BARK.m); put(cx + 2, h - 2, BARK.d); }
  if (stage === 0) { for (let y = 2; y < h; y++) put(cx + 2, y, "#c8a070"); put(cx + 1, 8, "#e8d8a0"); put(cx + 1, 11, "#e8d8a0"); }
  const leaves = LEAVES[season];
  if (!leaves) {
    // invierno: ramas peladas, de las gruesas a las ramitas (x, y desde la
    // base de la copa; [desde, hasta, grosor])
    const line = ([x0, y0], [x1, y1], wide) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        const x = cx + Math.round(x0 + (x1 - x0) * i / n), y = trunkTop + Math.round(y0 + (y1 - y0) * i / n);
        put(x, y, i < n / 2 ? BARK.m : BARK.d);
        if (wide && i < n * 0.7) put(x + 1, y, BARK.d);
      }
    };
    const SKELETON = [
      [[[0, 0], [0, -3], 0]],
      [[[0, 0], [-3, -5], 0], [[0, 0], [3, -6], 0], [[0, -1], [0, -7], 0]],
      [[[0, 0], [-5, -7], 1], [[0, 0], [5, -8], 1], [[0, -1], [0, -11], 0], [[-5, -7], [-7, -11], 0], [[5, -8], [7, -12], 0], [[-3, -4], [-7, -5], 0]],
      [[[0, 0], [-7, -9], 1], [[0, 0], [7, -10], 1], [[0, -1], [0, -16], 1], [[-7, -9], [-10, -14], 0], [[-7, -9], [-4, -15], 0], [[7, -10], [10, -15], 0], [[7, -10], [4, -16], 0], [[-4, -5], [-10, -7], 0], [[4, -6], [10, -8], 0], [[0, -16], [-2, -18], 0], [[0, -16], [2, -18], 0]]
    ][stage];
    for (const [from, to, wide] of SKELETON) line(from, to, wide);
    return c;
  }
  // la copa: dentro de alguna bola es hoja; el tono, de la luz de esa bola
  const balls = CROWNS[stage], [L0, L1, L2, L3] = leaves, leaf = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = null;
    for (const [bx, by, r] of balls) {
      const d = Math.hypot(x + 0.5 - bx, y + 0.5 - by) / r;
      if (d <= 1 && (!best || d < best.d)) best = { d, nx: (x + 0.5 - bx) / r, ny: (y + 0.5 - by) / r };
    }
    if (!best) continue;
    // (borde mellado: un hueco de vez en cuando)
    if (best.d > 0.88 && (x * 7 + y * 13) % 5 === 0) continue;
    const light = -best.nx * 0.55 - best.ny * 0.8;
    const dither = (x + y) % 2 === 0 ? 0.08 : -0.08;
    const col = light + dither > 0.45 ? L0 : light + dither > -0.05 ? L1 : light + dither > -0.5 ? L2 : L3;
    put(x, y, col);
    if (best.d < 0.86) leaf.add(x + "," + y);
  }
  // en primavera, flores por dentro de la copa (mas en el arbol de verdad)
  if (season === "spring" && stage >= 1) {
    const [p0, p1] = BLOSSOM[fruit] || BLOSSOM.apple;
    for (let y = 0; y < trunkTop; y++) for (let x = 0; x < w; x++) {
      if (!leaf.has(x + "," + y)) continue;
      const n = noise(x, y, stage);
      if (n < 0.07) { put(x, y, p0); if (leaf.has(x + 1 + "," + y)) put(x + 1, y, p1); }
      else if (stage === 3 && n > 0.95) put(x, y, p1);
    }
  }
  return c;
}
// (con su contorno, del verde mas oscuro o de la corteza en invierno)
function outlined(src, color) {
  const w = src.width, h = src.height, [c, g] = makeCanvas(w + 2, h + 2);
  const d = src.getContext("2d").getImageData(0, 0, w, h).data;
  const A = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 40;
  g.fillStyle = color;
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!A(x, y) && (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1))) g.fillRect(x + 1, y + 1, 1, 1);
  g.drawImage(src, 1, 1);
  return c;
}
const treeCache = new Map();
export function treeSprite(stage, season, fruit) {
  const key = `${stage}:${season}:${fruit}`;
  if (!treeCache.has(key)) treeCache.set(key, outlined(treeCanvas(stage, LEAVES[season] === undefined ? "summer" : season, fruit), season === "winter" ? "#2a1a0c" : "#1e3a14"));
  return treeCache.get(key);
}

// --- La calabaza gigante (37 x 22) -----------------------------------------------
// Siete gajos con sus surcos, brillo arriba a la izquierda, el rabo torcido y
// dos hojas con su zarcillo.
function giantPumpkin() {
  const W = 37, H = 22, [c, g] = makeCanvas(W, H);
  const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const cx = 18, cy = 13.5, rx = 18, ry = 8.4;
  for (let y = 4; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
    if (u * u + v * v > 1) continue;
    // gajos: por el angulo, con un surco oscuro entre uno y otro
    const lane = (Math.asin(Math.max(-1, Math.min(1, u / Math.sqrt(Math.max(0.0001, 1 - v * v))))) / (Math.PI / 2) + 1) * 3.5;
    const groove = Math.abs(lane - Math.round(lane)) < 0.13 && Math.round(lane) > 0 && Math.round(lane) < 7;
    const light = -u * 0.5 - v * 0.75;
    let col = light > 0.55 ? "#ffd890" : light > 0.15 ? "#ffa040" : light > -0.35 ? "#e07a22" : "#b85a18";
    if (groove) col = light > 0.2 ? "#c86a1e" : "#8a4010";
    if (u * u + v * v > 0.86 && v > 0.2) col = "#8a4010";
    put(x, y, col);
  }
  // el rabo y las hojas
  for (const [x, y, col] of [[18, 1, "#5a7a2a"], [18, 2, "#5a7a2a"], [19, 2, "#3a5a1a"], [18, 3, "#5a7a2a"], [19, 3, "#3a5a1a"], [18, 4, "#4a6a22"], [19, 4, "#3a5a1a"], [17, 0, "#6a8a32"]]) put(x, y, col);
  for (const [x, y] of [[12, 3], [13, 3], [14, 3], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [13, 2], [12, 5], [13, 5]]) put(x, y, (x + y) % 3 ? "#5ab04a" : "#8ad85a");
  for (const [x, y] of [[22, 4], [23, 4], [24, 4], [25, 4], [23, 3], [24, 3], [22, 5], [23, 5], [24, 5]]) put(x, y, (x + y) % 3 ? "#3a8a3a" : "#5ab04a");
  for (const [x, y] of [[26, 3], [27, 2], [28, 2], [29, 3], [28, 4]]) put(x, y, "#6aa83a");
  return outlined(c, "#4a1a08");
}

// --- El tablon de encargos (en el frente del mostrador del puesto) ------------
// Marco de madera oscura con el corcho moteado; la nota del dia (papel con
// sus lineas y una chincheta roja) o, si ya esta hecho, con un sello verde.
export const BOARD_W = 15, BOARD_H = 10;
function boardCanvas(note) {
  const [c, g] = makeCanvas(BOARD_W, BOARD_H);
  const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < BOARD_H; y++) for (let x = 0; x < BOARD_W; x++) {
    const edge = x === 0 || y === 0 || x === BOARD_W - 1 || y === BOARD_H - 1;
    put(x, y, edge ? (y === 0 || x === 0 ? "#8a5a2e" : "#4a2c12") : (x * 5 + y * 3) % 7 === 0 ? "#a8743e" : "#c89a5a");
  }
  // (una notita vieja en la esquina, siempre)
  for (let y = 2; y <= 4; y++) for (let x = 10; x <= 12; x++) put(x, y, "#d8c8a8");
  put(11, 3, "#a89878");
  if (note) {
    for (let y = 2; y <= 8; y++) for (let x = 3; x <= 8; x++) put(x, y, x === 8 || y === 8 ? "#d8ccb0" : "#f8f0dc");
    for (const y of [4, 5, 6]) for (let x = 4; x <= (y === 6 ? 6 : 7); x++) put(x, y, "#8a8070");
    put(5, 2, "#e84a4a"); put(6, 2, "#ff8a7a"); put(5, 1, "#a82a2a");
    if (note === "done") { put(5, 6, "#3a9a3a"); put(6, 7, "#3a9a3a"); put(7, 6, "#3a9a3a"); put(8, 5, "#3a9a3a"); put(8, 4, "#5ac85a"); }
  }
  return c;
}

export const FARM_SPRITES = lazy(() => ({
  scarecrow: Object.fromEntries(["", "halloween", "winter"].map((season) => [season, outlinedSprite(pad(scarecrowRows(season)), SCARECROW_PAL, "#3a2414")])),
  beeHouse: outlinedSprite(BEE_HOUSE, BEE_PAL, "#3a1a0c"),
  honey: outlinedSprite(HONEY_JAR, HONEY_PAL, "#5a3010"),
  fruit: Object.fromEntries(Object.entries(FRUIT_ART).map(([id, art]) => [id, outlinedSprite(art.rows, art.pal, art.out)])),
  giant: giantPumpkin(),
  board: { empty: boardCanvas(null), note: boardCanvas("note"), done: boardCanvas("done") }
}));
export const scarecrowSprite = (season) => FARM_SPRITES().scarecrow[season === "halloween" || season === "winter" ? season : ""];
