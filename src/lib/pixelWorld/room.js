import { Buf, bayer, discRows, ellipseRows, gridSprite, lazy, line, makeCanvas, mix, outlinedSprite, px, rect, rng } from "./core.js";
import { catchSprite, sideFishFrames } from "./catches.js";
import { findSprite } from "./finds.js";
import { FINDS } from "./events/creatures.js";
import { RIG_FOOT_X, RIG_TALL, rigImg } from "./pip/rig.js";

// El cuarto de Buddy (modal, pestaña Room) en pixel art, como el footer: un
// lienzo de 280x160 px de arte (1 px de arte = 2 px CSS en escritorio) con
// papel pintado, zocalo, tarima, la ventana de noche con el paisaje de la
// temporada, reloj de pared con la hora de verdad, el cuadro de la
// constelacion, dos baldas, la mesilla con la vela, la cama elegida, la
// alfombra, el perro dormido, el acuario con los peces del diario de perfil y
// Pip. Luz de noche como en el footer: tinte y charcos de luz escalonados
// multiplicados sobre el cuarto, y lo que brilla por si mismo despues.
// Sin React: BuddyRoom.jsx pone encima los botones (baldas, acuario, Pip).
export const ROOM_W = 280, ROOM_H = 160;
const FLOOR = 112;
const WIN = { x: 22, y: 16, w: 74, h: 46 };
const TANK = { x: 180, y: 58, w: 88, h: 44 };
const RUG = { x: 142, y: 146 };
const CLOCK = { x: 124, y: 24 };
const FRAME = { x: 142, y: 30, w: 30, h: 22 };
const STAND = { x: 106, top: 104 };
const SHELVES = [["shelfLeft", 176], ["shelfRight", 228]];
const SHELF_Y = 32, SHELF_W = 44;
const PIP_FEET = RUG.y + 6;

// Zonas para los botones del componente, en px de arte.
export const ROOM_SPOTS = {
  window: { x: WIN.x - 4, y: WIN.y - 4, w: WIN.w + 8, h: WIN.h + 8 },
  shelfLeft: { x: 174, y: SHELF_Y - 24, w: 48, h: 30 },
  shelfRight: { x: 226, y: SHELF_Y - 24, w: 48, h: 30 },
  aquarium: { x: TANK.x - 3, y: TANK.y - 6, w: TANK.w + 6, h: TANK.h + 9 },
  resident: { x: RUG.x - 15, y: PIP_FEET - 40, w: 30, h: 42 }
};

// Cinco tonos por material, luz desde arriba a la izquierda; `tint` es la luz
// de noche en la que queda el cuarto.
const ATMOS = {
  aurora: { wall: "#2e4f58", wallD: "#24414a", wallL: "#3a6270", dot: "#3e6672", wains: "#1f3a42", wainsHi: "#2f5662", wainsLo: "#142a30", trim: "#14282e", trimHi: "#2c4c56", floor: ["#3a3028", "#4a3c30", "#2a221c", "#5c4a3a"], curtain: ["#7ac0b0", "#4a8a80", "#a8e0d0"], rug: ["#3f8a7a", "#2a6458", "#9fd8c0", "#173a32"], tint: "rgb(150,162,208)" },
  plum: { wall: "#4a3758", wallD: "#3c2c48", wallL: "#5a4468", dot: "#5e4872", wains: "#33263f", wainsHi: "#4a3a5a", wainsLo: "#22182c", trim: "#22182c", trimHi: "#3e2e4c", floor: ["#4a3438", "#5a4246", "#36262a", "#6c5256"], curtain: ["#c08ac8", "#8a5a98", "#e0b8e8"], rug: ["#8a5a98", "#5e3a6a", "#e0b8e8", "#361f40"], tint: "rgb(160,150,204)" },
  amber: { wall: "#9a6a3a", wallD: "#82582e", wallL: "#ae7c48", dot: "#b07c46", wains: "#6a4220", wainsHi: "#86582c", wainsLo: "#4a2c14", trim: "#3a2210", trimHi: "#5c3a1e", floor: ["#6a4428", "#80542f", "#553620", "#966640"], curtain: ["#e8a85a", "#b0762e", "#f8d098"], rug: ["#c06040", "#8a4028", "#f0c890", "#4e2214"], tint: "rgb(178,150,140)" }
};
const WOOD = { o: "#2a1608", d: "#5a3a1e", m: "#8a5a2e", b: "#a8743e", l: "#c88e52", h: "#e0ae70" };
const dith = (x, y, k) => bayer(x, y) < k;

// La decoracion del mercado, en pixel: el bosque en un tarro, la luna de
// noche (brilla) y la recreativa de bolsillo (su pantalla brilla).
const DECOR = lazy(() => ({
  "market-terrarium": outlinedSprite(["...ccccc...", "...CCCCC...", "..gGGGGGg..", ".gwaaaaaag.", "gwaaaaaaaag", "gwaappaaaag", "gaapppppaag", "gaaaasaamag", "gamaasammag", "gmmmmmmmmmg", "gdddddddddg", ".gdddddddg.", "..ggggggg.."], { c: "#c8945a", C: "#8a5a2e", g: "#7ab8b0", G: "#a8d8d0", w: "#e8fff8", a: "#2a5a58", p: "#e05a5a", s: "#f4ead0", m: "#5aa83a", d: "#5a3a1e" }, "#163432"),
  "market-moon": outlinedSprite(["....YYYY...", "..YYhyyY.s.", ".YhyyY..sss", ".YyyY....s.", "YhyY.......", "YyyY.......", "YyyY.......", ".YyyY......", ".YyyyY.....", "..YYyyyY...", "....YYYY...", "..bbbbbbb..", ".bBBBBBBBb."], { Y: "#e0a83a", y: "#ffdc92", h: "#fff0c9", s: "#fff0c9", b: "#8a5a2e", B: "#5a3a1e" }, "#5a3a10"),
  "market-arcade": outlinedSprite([".MMMMMMMMM.", ".MmmmmmmmM.", ".KKKKKKKKK.", ".KsssssssK.", ".KsgsssgsK.", ".KssgggssK.", ".KsssssssK.", ".KKKKKKKKK.", "KPPPPPPPPPK", "KPrPPPyPPPK", "KKKKKKKKKKK", ".KkkkkkkkK.", ".KkkkkkkkK.", ".KKKKKKKKK."], { M: "#302e46", m: "#d991af", K: "#302e46", s: "#172e3d", g: "#9de0b4", P: "#766c94", r: "#ff5f68", y: "#ffd787", k: "#4a4668" }, "#141224")
}));
// Lo que hay en una balda (clave "fish:", "find:" o "shop:"), como sprite.
function displaySprite(key) {
  if (!key) return null;
  const [origin, id] = key.split(":");
  if (origin === "shop") return DECOR()[id] || null;
  if (origin === "find") return findSprite(id) || FINDS()[id] || null;
  return catchSprite(id);
}

// El perro dormido, de formas: lomo con silla oscura, pecho blanco, cabeza
// apoyada en las patas con el ojo cerrado, orejas de punta, collar y la cola
// enroscada (dos respiraciones y dos coletazos).
function dogSprite(breath, beat) {
  const Wd = 31, Ht = 14, g = Array.from({ length: Ht }, () => Array(Wd).fill("."));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < Wd && y < Ht) g[y][x] = c; };
  const ell = (cx, cy, rx, ry, fn) => { for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny); } };
  ell(13, 9, 10.5, 4.4 + breath * 0.5, (x, y, nx, ny) => put(x, y, ny > 0.4 ? "w" : ny < -0.35 && nx < 0.55 ? (nx < -0.3 && ny < -0.75 ? "l" : "G") : "g"));
  ell(23, 7, 4.3, 3.9, (x, y, nx, ny) => put(x, y, ny > 0.25 ? "w" : nx < -0.2 && ny < -0.3 ? "l" : "g"));
  ell(26.6, 9, 2.8, 1.7, (x, y) => put(x, y, "w"));
  ell(25.5, 12, 4, 1.2, (x, y) => put(x, y, "w"));
  for (const ex of [20, 24]) { put(ex + 1, 1, "G"); put(ex, 2, "G"); put(ex + 1, 2, "p"); put(ex, 3, "G"); put(ex + 1, 3, "p"); put(ex + 2, 3, "G"); }
  put(29, 8, "k"); put(29, 9, "k"); put(28, 8, "k"); put(27, 10, "m"); put(26, 10, "m");
  put(23, 7, "k"); put(24, 7, "k"); put(22, 6, "m"); put(25, 8, "m");
  put(27, 12, "m"); put(28, 12, "m");
  for (let y = 4; y < 12; y++) if (g[y][19] !== ".") put(19, y, "c");
  put(19, 11, "t"); put(20, 11, "t");
  const tail = beat
    ? [[2, 8, "g"], [1, 9, "g"], [1, 10, "g"], [2, 11, "g"], [3, 12, "g"], [4, 12, "w"], [5, 12, "w"], [2, 10, "g"], [3, 11, "w"]]
    : [[2, 10, "g"], [1, 11, "g"], [2, 12, "g"], [3, 12, "g"], [4, 13, "w"], [5, 13, "w"], [6, 13, "w"], [2, 11, "g"], [3, 13, "g"]];
  for (const [x, y, c] of tail) put(x, y, c);
  return outlinedSprite(g.map((r) => r.join("")), { g: "#9a9eaa", G: "#686c7a", l: "#c4c8d2", w: "#f4f4f6", k: "#1a1a24", p: "#e88a9a", m: "#a8acb8", c: "#d0504a", t: "#ffd166" }, "#262632");
}
const DOGS = lazy(() => [dogSprite(0, 0), dogSprite(1, 0), dogSprite(0, 1), dogSprite(1, 1)]);
const ZED = lazy(() => gridSprite(["ZZZ", "..Z", ".Z.", "Z..", "ZZZ"], { Z: "#dce6ff" }));
const PLUS = lazy(() => gridSprite(["..O..", "..O..", "OOOOO", "..O..", "..O.."], { O: "#a8d8c8" }));
const BAT = lazy(() => [gridSprite(["k...k", "kk.kk", ".kkk.", "..k.."], { k: "#1a0e22" }), gridSprite([".....", "kkkkk", ".kkk.", "..k.."], { k: "#1a0e22" })]);

// Charcos de luz escalonados (el aspecto del footer), guardados por tamaño y color.
const poolCache = new Map();
function lightPool(r, c, s) {
  const key = r + "|" + c + "|" + s;
  let img = poolCache.get(key);
  if (img) return img;
  const n = r * 2 + 1, b = new Buf(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x - r, (y - r) * 1.1);
    if (d >= r) continue;
    let f = 1 - d / r; f *= Math.sqrt(f);
    const q = Math.floor(f * 5 + bayer(x, y)) / 5;
    if (q <= 0) continue;
    const k = q * s;
    b.set(x, y, "#" + c.map((v) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0")).join(""));
  }
  img = b.canvas();
  poolCache.set(key, img);
  return img;
}

function paintWall(g, A) {
  rect(g, 0, 0, ROOM_W, FLOOR, A.wall);
  // Papel: un par de rayas finas cada 16 px con un rombo entre ellas, mas
  // oscuro arriba junto al techo y en las esquinas.
  for (let x = 0; x < ROOM_W; x += 16) { rect(g, x, 6, 1, 76, A.wallL); rect(g, x + 1, 6, 1, 76, A.wallD); }
  for (let y = 12, row = 0; y < 78; y += 12, row++) for (let x = row % 2 ? 0 : 8; x < ROOM_W; x += 16) { px(g, x + 8, y - 1, A.dot); rect(g, x + 7, y, 3, 1, A.dot); px(g, x + 8, y + 1, A.dot); px(g, x + 8, y, A.wallL); }
  for (let y = 6; y < 18; y++) for (let x = 0; x < ROOM_W; x++) if (dith(x, y, (18 - y) / 16)) px(g, x, y, A.wallD);
  for (let y = 6; y < 82; y++) for (let x = 0; x < 10; x++) if (dith(x, y, (10 - x) / 14)) { px(g, x, y, A.wallD); px(g, ROOM_W - 1 - x, y, A.wallD); }
  // Moldura del techo
  rect(g, 0, 0, ROOM_W, 2, A.trim); rect(g, 0, 2, ROOM_W, 1, A.trimHi); rect(g, 0, 3, ROOM_W, 2, A.trim); rect(g, 0, 5, ROOM_W, 1, A.wainsLo);
  for (let x = 0; x < ROOM_W; x += 4) px(g, x, 3, A.trimHi);
  // Cenefa, zocalo de paneles hundidos (sombra arriba a la izquierda, luz abajo a la derecha) y rodapie
  rect(g, 0, 82, ROOM_W, 1, A.trimHi); rect(g, 0, 83, ROOM_W, 2, A.trim); rect(g, 0, 85, ROOM_W, 1, A.wainsLo);
  rect(g, 0, 86, ROOM_W, 22, A.wains);
  for (let x = 3; x < ROOM_W; x += 34) {
    rect(g, x, 89, 30, 16, A.wainsLo); rect(g, x + 1, 90, 29, 15, A.wainsHi); rect(g, x + 1, 90, 28, 14, A.wains);
    rect(g, x + 3, 92, 24, 1, A.wainsLo); rect(g, x + 3, 93, 1, 9, A.wainsLo); rect(g, x + 4, 102, 23, 1, A.wainsHi); rect(g, x + 27, 92, 1, 11, A.wainsHi);
  }
  rect(g, 0, 107, ROOM_W, 1, A.trimHi); rect(g, 0, 108, ROOM_W, 4, A.trim); rect(g, 0, 108, ROOM_W, 1, mix(A.trimHi, A.trim, 0.5));
}
function paintFloor(g, A) {
  const F = A.floor, R = rng(77);
  rect(g, 0, FLOOR, ROOM_W, ROOM_H - FLOOR, F[0]);
  for (let y = FLOOR, row = 0; y < ROOM_H; y += 6, row++) {
    const body = row % 2 ? F[1] : F[0];
    rect(g, 0, y, ROOM_W, 1, F[2]); rect(g, 0, y + 1, ROOM_W, 1, F[3]); rect(g, 0, y + 2, ROOM_W, 4, body);
    // Vetas, algun nudo y juntas de tabla al tresbolillo con dos clavos
    for (let k = 0; k < 18; k++) rect(g, Math.floor(R() * ROOM_W), y + 2 + Math.floor(R() * 4), 3 + Math.floor(R() * 8), 1, mix(body, F[2], 0.55));
    if (R() < 0.7) { const kx = Math.floor(R() * ROOM_W); px(g, kx, y + 3, F[2]); px(g, kx + 1, y + 3, F[2]); px(g, kx, y + 4, mix(F[2], F[0], 0.5)); }
    for (let x = Math.floor(R() * 50); x < ROOM_W; x += 58 + Math.floor(R() * 30)) {
      rect(g, x, y + 1, 1, 5, F[2]); px(g, x + 1, y + 2, F[3]);
      px(g, x - 3, y + 3, F[2]); px(g, x + 3, y + 3, F[2]); px(g, x - 3, y + 2, F[3]); px(g, x + 3, y + 2, F[3]);
    }
  }
  for (let y = FLOOR; y < FLOOR + 6; y++) for (let x = 0; x < ROOM_W; x++) if (dith(x, y, (FLOOR + 6 - y) / 7)) px(g, x, y, F[2]);
  for (let y = ROOM_H - 6; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) if (dith(x, y, (y - ROOM_H + 7) / 9)) px(g, x, y, F[2]);
}
// Sombra de contacto bajo un mueble, y sombra arrojada en la pared.
function floorShadow(g, x, y, w, h, A) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const e = Math.min(i, w - 1 - i, j + 1) / 3; if (dith(x + i, y + j, Math.min(0.85, e))) px(g, x + i, y + j, mix(A.floor[2], "#000000", 0.35)); }
}
function wallShadow(g, x, y, w, h, A) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dith(x + i, y + j, 0.65 - j / (h + 1) * 0.5)) px(g, x + i, y + j, A.wallD);
}

function paintWindow(g, A, season) {
  const { x: wx, y: wy, w: ww, h: wh } = WIN, C = A.curtain;
  wallShadow(g, wx - 3, wy + wh + 9, ww + 10, 3, A);
  rect(g, wx - 4, wy - 4, ww + 8, wh + 8, WOOD.o);
  rect(g, wx - 3, wy - 3, ww + 6, wh + 6, WOOD.m);
  rect(g, wx - 3, wy - 3, ww + 6, 1, WOOD.h); rect(g, wx - 3, wy - 3, 1, wh + 6, WOOD.l);
  rect(g, wx - 3, wy + wh + 2, ww + 6, 1, WOOD.d); rect(g, wx + ww + 2, wy - 3, 1, wh + 6, WOOD.d);
  rect(g, wx - 1, wy - 1, ww + 2, wh + 2, WOOD.o);
  // El cristal queda transparente: el cielo se pinta debajo de esta capa.
  g.clearRect(wx, wy, ww, wh);
  const mx = wx + Math.floor(ww / 2) - 1, my = wy + Math.floor(wh / 2) - 1;
  rect(g, mx, wy, 3, wh, WOOD.m); rect(g, mx, wy, 1, wh, WOOD.l); rect(g, mx + 2, wy, 1, wh, WOOD.d);
  rect(g, wx, my, ww, 3, WOOD.m); rect(g, wx, my, ww, 1, WOOD.l); rect(g, wx, my + 2, ww, 1, WOOD.d);
  // Cristal: sombra bajo cada travesaño, dos reflejos y, en invierno, escarcha en las esquinas
  g.globalAlpha = 0.45;
  for (const [gx, gy, gw] of [[wx, wy, mx - wx], [mx + 3, wy, wx + ww - mx - 3], [wx, my + 3, mx - wx], [mx + 3, my + 3, wx + ww - mx - 3]]) rect(g, gx, gy, gw, 1, "#04060f");
  g.globalAlpha = 0.13;
  for (let k = 0; k < 9; k++) { px(g, wx + 4 + k, wy + 13 - k, "#ffffff"); px(g, wx + 5 + k, wy + 13 - k, "#ffffff"); px(g, wx + 9 + k, wy + 15 - k, "#ffffff"); }
  for (let k = 0; k < 7; k++) { px(g, mx + 10 + k, my + 16 - k, "#ffffff"); px(g, mx + 11 + k, my + 16 - k, "#ffffff"); }
  if (season === "winter") {
    g.globalAlpha = 0.5;
    for (const [cx, cy] of [[wx, wy], [wx + ww - 1, wy], [wx, wy + wh - 1], [wx + ww - 1, wy + wh - 1]]) for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (i + j < 7 && dith(i * 3 + cx, j * 3 + cy, (7 - i - j) / 8)) px(g, cx + (cx > wx ? -i : i), cy + (cy > wy ? -j : j), "#e8f4ff");
  }
  g.globalAlpha = 1;
  // El alfeizar con un cactus (una calabaza en Halloween) y el tarro de luciernagas
  const sy = wy + wh + 4;
  rect(g, wx - 7, sy, ww + 14, 1, WOOD.h); rect(g, wx - 7, sy + 1, ww + 14, 2, WOOD.b); rect(g, wx - 7, sy + 3, ww + 14, 1, WOOD.d); rect(g, wx - 7, sy + 4, ww + 14, 1, WOOD.o);
  if (season === "halloween") {
    ellipseRows(g, wx + 9, sy - 4, 6, 4, "#3a1a08"); ellipseRows(g, wx + 9, sy - 4, 5, 3, "#e8762a"); rect(g, wx + 6, sy - 7, 1, 6, "#c45a1a"); rect(g, wx + 11, sy - 7, 1, 6, "#c45a1a"); rect(g, wx + 8, sy - 10, 2, 3, "#4a7a2a");
    px(g, wx + 6, sy - 5, "#3a1a08"); px(g, wx + 11, sy - 5, "#3a1a08"); rect(g, wx + 7, sy - 3, 5, 1, "#3a1a08");
  } else {
    rect(g, wx + 6, sy - 6, 7, 6, "#c0603a"); rect(g, wx + 5, sy - 7, 9, 2, "#d87a4a"); rect(g, wx + 12, sy - 6, 1, 6, "#8a3e22"); px(g, wx + 6, sy - 5, "#e89a6a");
    rect(g, wx + 8, sy - 14, 3, 7, "#4a9a4a"); rect(g, wx + 8, sy - 14, 1, 7, "#7ac84a"); rect(g, wx + 6, sy - 11, 2, 2, "#4a9a4a"); rect(g, wx + 11, sy - 12, 2, 2, "#3f7a28"); px(g, wx + 9, sy - 15, "#f472d0");
    px(g, wx + 9, sy - 12, "#d8f0b0"); px(g, wx + 8, sy - 9, "#d8f0b0");
  }
  rect(g, wx + ww - 16, sy - 9, 7, 9, "#6a8a98"); rect(g, wx + ww - 15, sy - 8, 5, 7, "#24343c"); rect(g, wx + ww - 17, sy - 11, 9, 2, "#a8743e"); px(g, wx + ww - 15, sy - 8, "#c8e8f0");
  // Barra con remates, y dos cortinas recogidas con pliegues y alzapaños dorados
  rect(g, wx - 18, wy - 10, ww + 36, 2, "#3a2412"); rect(g, wx - 18, wy - 10, ww + 36, 1, "#8a5a2e");
  for (const fx of [wx - 21, wx + ww + 18]) { rect(g, fx, wy - 11, 3, 4, "#c8902a"); px(g, fx, wy - 11, "#ffe28a"); px(g, fx + 2, wy - 8, "#7a5414"); }
  const top = wy - 8, tie = wy + wh - 4, bot = wy + wh + 16;
  for (const side of [-1, 1]) {
    for (let y = top; y < bot; y++) {
      const w = y < tie ? Math.round(15 - 8 * Math.pow((y - top) / (tie - top), 1.6)) : Math.round(7 + 4 * Math.sqrt((y - tie) / (bot - tie)));
      const outer = side < 0 ? wx - 18 : wx + ww + 18, x0 = side < 0 ? outer : outer - w;
      for (let i = 0; i < w; i++) {
        const fold = Math.floor((i / w) * 5);
        let c = fold % 2 ? C[1] : C[0];
        if (fold === (side < 0 ? 1 : 3) && i % 2 === 0) c = C[2];
        px(g, x0 + i, y, c);
      }
      px(g, side < 0 ? x0 + w - 1 : x0, y, mix(C[1], "#000000", 0.35));
      if (y === bot - 1) rect(g, x0, y, w, 1, mix(C[1], "#000000", 0.35));
      if ((y - top) % 4 === 0 && y < tie) px(g, side < 0 ? x0 + 1 : x0 + w - 2, y, C[2]);
    }
    for (let i = 0; i < 5; i++) px(g, (side < 0 ? wx - 18 : wx + ww + 18) + (side < 0 ? 2 + i * 3 : -3 - i * 3), wy - 9, "#c8902a");
    const tx = side < 0 ? wx - 18 : wx + ww + 11;
    rect(g, tx, tie, 8, 2, "#e0b050"); rect(g, tx, tie + 1, 8, 1, "#a87a20"); rect(g, tx + 3, tie + 2, 2, 3, "#e0b050"); px(g, tx + 3, tie + 5, "#a87a20"); px(g, tx + 4, tie + 5, "#a87a20");
  }
}

// El paisaje de la ventana por temporada (fijo, guardado), y lo que se mueve encima.
const SKY_BANDS = {
  halloween: ["#1a0e2e", "#2a1440", "#3a1c4c", "#4a2450", "#5a2c4a"],
  default: ["#0c1236", "#121a46", "#1a2558", "#24336a", "#2e4078"]
};
const skyCache = new Map();
function windowSky(season) {
  let c = skyCache.get(season);
  if (c) return c;
  const { w: ww, h: wh } = WIN, bands = SKY_BANDS[season] || SKY_BANDS.default;
  let g;
  [c, g] = makeCanvas(ww, wh);
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const f = y / wh * (bands.length - 1), i = Math.floor(f); px(g, x, y, bands[Math.min(bands.length - 1, i + (bayer(x, y) < f - i ? 1 : 0))]); }
  // Halo de la luna en dos escalones tramados, y la luna con cráteres (naranja en Halloween)
  const mx = 54, my = 11, spooky = season === "halloween", moon = spooky ? ["#ffb04a", "#e0883a", "#c8702a"] : ["#f2efd8", "#d3cfae", "#c4c0a0"];
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const d = Math.hypot(x - mx, y - my); if (d < 13 && bayer(x, y) < (13 - d) / 10) px(g, x, y, spooky ? (d < 9 ? "#7a3a3a" : "#5a2a3a") : d < 9 ? "#3a4c88" : "#2a3a78"); }
  g.fillStyle = moon[0]; discRows(g, mx, my, 5);
  for (let dy = -5; dy <= 5; dy++) { const hw = Math.floor(Math.sqrt(25 - dy * dy) + 0.3); px(g, mx + hw, my + dy, moon[1]); if (dy > 1) px(g, mx + hw - 1, my + dy, moon[1]); }
  for (const [x, y] of [[-2, -2], [-1, -2], [1, 1], [2, -1], [-2, 2]]) px(g, mx + x, my + y, moon[2]);
  px(g, mx - 3, my - 3, "#ffffff");
  // Colinas lejanas con una cabaña encendida, colinas cerca, y la fila de árboles de la temporada
  const winter = season === "winter", hill = winter ? ["#8aa0c8", "#b8c8e8"] : spooky ? ["#2a1a3a", "#3a2a4c"] : ["#1c2a58", "#2c3e74"];
  for (let x = 0; x < ww; x++) { const h1 = Math.round(wh - 15 + Math.sin(x * 0.09 + 1) * 3 + Math.sin(x * 0.23) * 1.2); rect(g, x, h1, 1, wh - h1, hill[0]); px(g, x, h1, hill[1]); }
  rect(g, 12, wh - 20, 5, 4, "#121c40"); rect(g, 11, wh - 21, 7, 1, winter ? "#e8f0ff" : "#121c40"); rect(g, 13, wh - 22, 3, 1, winter ? "#e8f0ff" : "#121c40"); px(g, 14, wh - 18, "#ffd166"); px(g, 15, wh - 18, "#ffb04a");
  for (let x = 0; x < ww; x++) { const h2 = Math.round(wh - 8 + Math.sin(x * 0.13 + 3) * 2 + Math.sin(x * 0.31) * 1); rect(g, x, h2, 1, wh - h2, winter ? "#6a80a8" : "#12203e"); if (winter) px(g, x, h2, "#dce8fa"); }
  const R = rng(season.length * 7 + 3);
  for (const [x0, ht] of [[2, 11], [9, 8], [24, 13], [33, 9], [44, 12], [60, 10], [68, 14]]) {
    const round = (season === "spring" || season === "autumn") && x0 % 3 === 0;
    if (round) {
      // Un arbol de copa redonda: en flor (primavera) o rojizo (otoño)
      const cols = season === "spring" ? ["#3a1a3a", "#8a4a7a", "#c87aa8"] : ["#2a1210", "#6a2a1a", "#a8502a"];
      ellipseRows(g, x0, wh - 6 - Math.round(ht * 0.6), Math.round(ht * 0.45), Math.round(ht * 0.4), cols[0]);
      ellipseRows(g, x0 - 1, wh - 7 - Math.round(ht * 0.6), Math.round(ht * 0.35), Math.round(ht * 0.3), cols[1]);
      for (let k = 0; k < 5; k++) px(g, x0 - 3 + Math.floor(R() * 6), wh - 9 - Math.round(ht * 0.6) + Math.floor(R() * 4), cols[2]);
      rect(g, x0, wh - 6 - Math.round(ht * 0.25), 1, Math.round(ht * 0.25) + 1, "#2a1a10");
      continue;
    }
    for (let k = 0; k < ht; k++) {
      const hw = Math.floor((k + 2) / 3);
      rect(g, x0 - hw, wh - 6 - ht + k, hw * 2 + 1, 1, season === "autumn" && k % 3 === 2 ? "#2a2a1a" : "#0a1628");
      if (k > 1 && x0 + hw < ww) px(g, x0 + hw, wh - 6 - ht + k, "#1e3656");
      if (winter && k % 3 === 0) { px(g, x0 - hw, wh - 6 - ht + k, "#e8f0ff"); px(g, x0 - hw + 1, wh - 6 - ht + k, "#c8d8f0"); }
    }
    rect(g, x0, wh - 6, 1, 2, "#0a1628");
  }
  rect(g, 0, wh - 4, ww, 4, winter ? "#c8d8f0" : "#0a1628");
  if (winter) rect(g, 0, wh - 4, ww, 1, "#ffffff");
  skyCache.set(season, c);
  return c;
}
const STARS = [[5, 4], [14, 9], [22, 3], [31, 12], [38, 6], [46, 2], [66, 5], [70, 15], [8, 17], [27, 20], [41, 16], [62, 22], [18, 26], [50, 25]];
function drawSky(g, t, season) {
  const { x: wx, y: wy, w: ww, h: wh } = WIN;
  g.drawImage(windowSky(season), wx, wy);
  STARS.forEach(([x, y], i) => {
    const k = Math.sin(t * (1.3 + (i % 3) * 0.4) + i * 2.1);
    px(g, wx + x, wy + y, k > 0.55 ? "#ffffff" : k > -0.4 ? "#9aa8e0" : "#4a5a98");
    if (k > 0.9) { px(g, wx + x - 1, wy + y, "#6a78b8"); px(g, wx + x + 1, wy + y, "#6a78b8"); }
  });
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  // Una estrella fugaz cada once segundos y una nube fina que cruza la luna
  const ss = (t % 11) / 0.7;
  if (ss < 1) { const sx = wx + 8 + ss * 36, sy = wy + 4 + ss * 12; for (let k = 0; k < 5; k++) px(g, Math.round(sx - k * 2), Math.round(sy - k * 0.7), k ? (k < 3 ? "#c8d4ff" : "#6a78b8") : "#ffffff"); }
  const cx = Math.round(wx + ((t * 2.2) % (ww + 30)) - 20);
  g.globalAlpha = 0.55; rect(g, cx, wy + 13, 18, 1, "#4a5a98"); rect(g, cx + 4, wy + 12, 9, 1, "#4a5a98"); rect(g, cx + 2, wy + 14, 12, 1, "#2e3e78"); g.globalAlpha = 1;
  if (season === "winter") {
    for (let k = 0; k < 22; k++) { const fx = wx + ((k * 17 + t * (3 + (k % 3))) % ww), fy = wy + ((k * 11 + t * (6 + (k % 4) * 2)) % wh); px(g, Math.round(fx + Math.sin(t + k) * 1.5), Math.round(fy), k % 4 ? "#e8f0ff" : "#ffffff"); }
  } else if (season === "autumn" || season === "spring") {
    const cols = season === "autumn" ? ["#e88a3a", "#c8502a", "#ffd166"] : ["#f8c8e0", "#f0a8d0", "#ffffff"];
    for (let k = 0; k < 8; k++) { const e = ((t * 0.12 + k / 8) % 1), fx = wx + ((k * 23) % ww) + e * 18 + Math.sin(t * 2 + k) * 2, fy = wy + 4 + e * (wh - 6); px(g, Math.round(fx), Math.round(fy), cols[k % 3]); if (k % 2) px(g, Math.round(fx) + 1, Math.round(fy), cols[(k + 1) % 3]); }
  } else if (season === "halloween") {
    for (let k = 0; k < 3; k++) { const bx = wx + ((t * (9 + k * 3) + k * 30) % (ww + 10)) - 5, by = wy + 8 + k * 7 + Math.sin(t * 3 + k) * 3; g.drawImage(BAT()[Math.floor(t * 8 + k) % 2], Math.round(bx), Math.round(by)); }
  }
  if (season !== "winter") for (let k = 0; k < 6; k++) {
    const fx = Math.round(wx + 6 + ((k * 13 + t * (2 + (k % 3))) % (ww - 12))), fy = Math.round(wy + wh - 9 + Math.sin(t * 1.7 + k * 1.9) * 3);
    if (Math.sin(t * 3 + k * 2.3) > 0.1) { px(g, fx, fy, "#efff9a"); g.globalAlpha = 0.45; px(g, fx - 1, fy, "#9ad84a"); px(g, fx + 1, fy, "#9ad84a"); px(g, fx, fy - 1, "#9ad84a"); g.globalAlpha = 1; }
  }
  g.restore();
}

function paintClock(g, A) {
  const { x, y } = CLOCK;
  g.fillStyle = A.wallD; discRows(g, x + 1, y + 2, 9);
  g.fillStyle = WOOD.o; discRows(g, x, y, 9);
  g.fillStyle = WOOD.m; discRows(g, x, y, 8);
  for (let dy = -8; dy <= -3; dy++) { const hw = Math.floor(Math.sqrt(64 - dy * dy) + 0.3); px(g, x - hw, y + dy, WOOD.h); px(g, x - hw + 1, y + dy, WOOD.l); }
  g.fillStyle = WOOD.o; discRows(g, x, y, 6);
  g.fillStyle = "#f4ead0"; discRows(g, x, y, 5);
  for (let dy = 1; dy <= 5; dy++) { const hw = Math.floor(Math.sqrt(25 - dy * dy) + 0.3); px(g, x + hw, y + dy, "#d8ccb0"); }
  for (const [ox, oy] of [[0, -4], [4, 0], [0, 4], [-4, 0]]) px(g, x + ox, y + oy, "#5a3a1e");
  for (const [ox, oy] of [[2, -3], [3, -2], [3, 2], [2, 3], [-2, 3], [-3, 2], [-3, -2], [-2, -3]]) px(g, x + ox, y + oy, "#c8b898");
  // La caja del pendulo
  rect(g, x - 3, y + 10, 7, 13, WOOD.o); rect(g, x - 2, y + 10, 5, 12, "#2a1a10"); rect(g, x - 2, y + 22, 5, 1, WOOD.m);
}
// Las agujas marcan la hora de verdad; el pendulo oscila.
function drawClock(g, t, now) {
  const { x, y } = CLOCK, m = now.getMinutes() + now.getSeconds() / 60, h = (now.getHours() % 12) + m / 60;
  const hand = (ang, len, c) => line(g, x, y, x + Math.round(Math.sin(ang) * len), y - Math.round(Math.cos(ang) * len), c);
  hand(h / 12 * Math.PI * 2, 2.6, "#2a1206"); hand(m / 60 * Math.PI * 2, 4, "#2a1206"); hand(now.getSeconds() / 60 * Math.PI * 2, 4, "#c94a3a");
  px(g, x, y, "#c8902a");
  const swing = Math.round(Math.sin(t * Math.PI) * 1.6);
  line(g, x, y + 11, x + swing, y + 18, "#c8902a"); rect(g, x + swing - 1, y + 18, 3, 3, "#ffd166"); px(g, x + swing - 1, y + 18, "#fff0af");
}
const CONST = [[5, 16], [10, 9], [16, 12], [22, 5], [25, 14]];
function paintFrame(g, A) {
  const { x, y, w, h } = FRAME;
  line(g, x + 4, y, x + w / 2, y - 7, "#c8b898"); line(g, x + w - 4, y, x + w / 2, y - 7, "#c8b898"); px(g, x + w / 2, y - 8, "#c8902a");
  wallShadow(g, x + 2, y + h + 1, w, 2, A); rect(g, x + w, y + 2, 2, h, A.wallD);
  rect(g, x - 1, y - 1, w + 2, h + 2, WOOD.o); rect(g, x, y, w, h, "#c8902a"); rect(g, x, y, w, 1, "#ffe28a"); rect(g, x, y, 1, h, "#ffd166"); rect(g, x, y + h - 1, w, 1, "#7a5414"); rect(g, x + w - 1, y, 1, h, "#7a5414");
  rect(g, x + 2, y + 2, w - 4, h - 4, "#2a1a10");
  for (let j = 3; j < h - 3; j++) for (let i = 3; i < w - 3; i++) px(g, x + i, y + j, bayer(i, j) < j / h * 0.6 ? "#22305a" : "#1a2448");
  for (let i = 1; i < CONST.length; i++) line(g, x + CONST[i - 1][0], y + CONST[i - 1][1], x + CONST[i][0], y + CONST[i][1], "#3e4e8e");
}
function drawFrameStars(g, t) {
  const { x, y } = FRAME;
  CONST.forEach(([sx, sy], i) => { const k = Math.sin(t * 1.6 + i * 1.7); px(g, x + sx, y + sy, k > 0.2 ? "#fff3b0" : "#c8b870"); if (k > 0.85) { px(g, x + sx - 1, y + sy, "#8a8a6a"); px(g, x + sx + 1, y + sy, "#8a8a6a"); } });
}
const silCache = new Map();
function silhouette(img, c) {
  let byCol = silCache.get(c);
  if (!byCol) { byCol = new Map(); silCache.set(c, byCol); }
  let s = byCol.get(img);
  if (!s) { const [cv, g] = makeCanvas(img.width, img.height); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; rect(g, 0, 0, img.width, img.height, c); s = cv; byCol.set(img, s); }
  return s;
}
function paintShelves(g, A, shelves) {
  for (const [key, sx] of SHELVES) {
    const img = displaySprite(shelves[key]);
    // La sombra del objeto en la pared, la balda, las escuadras y el objeto
    if (img) { g.globalAlpha = 0.55; g.drawImage(silhouette(img, A.wallD), sx + 24 - Math.floor(img.width / 2), SHELF_Y - img.height + 2); g.globalAlpha = 1; }
    wallShadow(g, sx + 1, SHELF_Y + 5, SHELF_W, 3, A);
    rect(g, sx - 1, SHELF_Y - 1, SHELF_W + 2, 6, WOOD.o);
    rect(g, sx, SHELF_Y, SHELF_W, 1, WOOD.h); rect(g, sx, SHELF_Y + 1, SHELF_W, 2, WOOD.b); rect(g, sx, SHELF_Y + 3, SHELF_W, 1, WOOD.d);
    for (let i = 3; i < SHELF_W; i += 9) px(g, sx + i, SHELF_Y + 2, WOOD.m);
    for (const bx of [sx + 4, sx + SHELF_W - 7]) {
      const left = bx < sx + 20;
      rect(g, bx, SHELF_Y + 5, 3, 8, "#262632"); px(g, bx, SHELF_Y + 5, "#6a6a7c");
      line(g, bx + (left ? 3 : -1), SHELF_Y + 5, bx + (left ? 6 : -4), SHELF_Y + 5, "#262632");
      line(g, bx + 1, SHELF_Y + 12, bx + (left ? 6 : -4), SHELF_Y + 6, "#3a3a4a");
      px(g, bx + 1, SHELF_Y + 7, "#8a8a9a");
    }
    if (img) {
      const ix = sx + 22 - Math.floor(img.width / 2), iy = SHELF_Y - img.height + 1;
      g.globalAlpha = 0.5; rect(g, ix + 1, SHELF_Y, img.width - 2, 1, WOOD.d); g.globalAlpha = 1;
      g.drawImage(img, ix, iy);
    } else { g.globalAlpha = 0.6; g.drawImage(PLUS(), sx + 20, SHELF_Y - 8); g.globalAlpha = 1; }
  }
}
// Lo que brilla en las baldas: chispas en el tesoro y la moneda, la luna y la pantalla de la recreativa.
function drawShelfGlow(g, t, shelves) {
  SHELVES.forEach(([key, sx], i) => {
    const k = shelves[key], img = displaySprite(k);
    if (!img) return;
    const ix = sx + 22 - Math.floor(img.width / 2), iy = SHELF_Y - img.height + 1;
    if (k === "shop:market-moon") { g.globalCompositeOperation = "lighter"; g.drawImage(lightPool(9, [255, 210, 130], 0.22), ix - 3, iy - 3); g.globalCompositeOperation = "source-over"; g.drawImage(img, ix, iy); }
    if (k === "shop:market-arcade") { const on = Math.floor(t * 2) % 2; rect(g, ix + 3, iy + 5, 2, 1, on ? "#9de0b4" : "#3fff97"); px(g, ix + 7, iy + 5, on ? "#3fff97" : "#9de0b4"); }
    if (k === "fish:token-chest" || k === "find:arcade-coin") {
      const p = (t * 0.7 + i * 0.5) % 1;
      if (p > 0.35) return;
      const r = p < 0.12 || p > 0.23 ? 1 : 2, x = ix + (i ? 3 : img.width - 3), y = iy + 2;
      px(g, x, y, "#ffffff");
      for (let d = 1; d <= r; d++) { px(g, x - d, y, "#fff0af"); px(g, x + d, y, "#fff0af"); px(g, x, y - d, "#fff0af"); px(g, x, y + d, "#fff0af"); }
    }
  });
}
function paintTank(g, A) {
  const { x: ax, y: ay, w: aw, h: ah } = TANK;
  // El mueble: tablero, dos puertas con cuarterones, tiradores de laton, zocalo y su sombra
  floorShadow(g, ax - 6, ay + ah + 26, aw + 12, 5, A);
  const cy = ay + ah + 3;
  rect(g, ax - 5, cy - 1, aw + 10, 26, WOOD.o);
  rect(g, ax - 4, cy, aw + 8, 2, WOOD.h); rect(g, ax - 4, cy + 2, aw + 8, 1, WOOD.d);
  rect(g, ax - 3, cy + 3, aw + 6, 19, WOOD.m);
  for (const dx of [0, aw / 2 + 1]) {
    const x0 = ax + dx - 1, dw = aw / 2;
    rect(g, x0, cy + 5, dw, 15, WOOD.d); rect(g, x0 + 1, cy + 6, dw - 1, 14, WOOD.l); rect(g, x0 + 1, cy + 6, dw - 2, 13, WOOD.b);
    rect(g, x0 + 3, cy + 8, dw - 6, 1, WOOD.m); rect(g, x0 + 3, cy + 9, 1, 8, WOOD.m); rect(g, x0 + 4, cy + 17, dw - 7, 1, WOOD.l);
  }
  for (const kx of [ax + aw / 2 - 4, ax + aw / 2 + 3]) { rect(g, kx, cy + 11, 2, 3, "#c8902a"); px(g, kx, cy + 11, "#ffe28a"); }
  rect(g, ax - 3, cy + 22, aw + 6, 2, WOOD.o); rect(g, ax - 1, cy + 24, 4, 2, WOOD.o); rect(g, ax + aw - 3, cy + 24, 4, 2, WOOD.o);
  // La pecera: tapa oscura, agua por bandas, arena con grava, un castillo y rocas
  rect(g, ax - 3, ay - 6, aw + 6, ah + 9, "#141c24");
  rect(g, ax - 2, ay - 5, aw + 4, 3, "#2a3440"); rect(g, ax - 2, ay - 5, aw + 4, 1, "#5a6a78");
  rect(g, ax - 2, ay - 2, aw + 4, 2, "#0c1218");
  const water = ["#7ad8e8", "#3aa0b8", "#2a8aa2", "#227690", "#1a6280", "#14506c"];
  for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) { const f = y < 2 ? 0 : 1 + (y - 2) / (ah - 2) * (water.length - 2), i = Math.floor(f); px(g, ax + x, ay + y, water[Math.min(water.length - 1, i + (y >= 2 && bayer(x, y) < f - i ? 1 : 0))]); }
  for (const [bx, bh] of [[6, 18], [21, 12], [40, 22], [58, 14], [79, 19]]) for (let k = 0; k < bh; k++) px(g, ax + bx + Math.round(Math.sin(k * 0.5 + bx)), ay + ah - 6 - k, "#1e6a72");
  const sandY = ay + ah - 7;
  for (let y = sandY; y < ay + ah; y++) for (let x = 0; x < aw; x++) { const top = sandY + Math.round(Math.sin(x * 0.12) * 1.2 + 1); if (y < top) continue; px(g, ax + x, y, y === top ? "#e8d4a0" : bayer(x, y) < 0.3 ? "#b89a62" : "#d0b67e"); }
  const R = rng(9);
  for (let k = 0; k < 40; k++) px(g, ax + 1 + Math.floor(R() * (aw - 2)), ay + ah - 1 - Math.floor(R() * 4), ["#f472d0", "#45d8ff", "#ffd166", "#8a7a5a", "#5a4a3a"][k % 5]);
  const kx = ax + aw - 26, ky = ay + ah - 22;
  rect(g, kx, ky + 6, 16, 14, "#5a6a7a"); rect(g, kx + 1, ky + 7, 14, 12, "#8a9aa8"); rect(g, kx + 1, ky + 7, 2, 12, "#aab8c4");
  for (const tx of [kx - 1, kx + 11]) { rect(g, tx, ky, 6, 20, "#5a6a7a"); rect(g, tx + 1, ky + 1, 4, 19, "#8a9aa8"); rect(g, tx + 1, ky + 1, 1, 19, "#aab8c4"); for (let c = 0; c < 6; c += 2) rect(g, tx + c, ky - 2, 1, 2, "#5a6a7a"); }
  rect(g, kx + 6, ky + 12, 4, 8, "#1a2430"); rect(g, kx + 7, ky + 11, 2, 1, "#1a2430"); rect(g, kx + 1, ky + 4, 2, 3, "#1a2430"); rect(g, kx + 13, ky + 4, 2, 3, "#1a2430");
  rect(g, kx + 7, ky - 6, 1, 6, "#3a3a4a"); rect(g, kx + 8, ky - 6, 4, 3, "#ff5f68"); px(g, kx + 8, ky - 6, "#ff9a9a");
  for (let k = 0; k < 6; k++) { px(g, kx + 2 + k * 2, ky + 19 - (k % 2), "#3a8a5a"); px(g, kx + 2 + k * 2, ky + 18 - (k % 2), "#5ab87a"); }
  ellipseRows(g, ax + 12, ay + ah - 5, 9, 3, "#4a5560"); ellipseRows(g, ax + 10, ay + ah - 6, 6, 2, "#6a7884"); px(g, ax + 7, ay + ah - 8, "#9aa8b4");
  ellipseRows(g, ax + 24, ay + ah - 3, 4, 2, "#5a6570"); px(g, ax + 22, ay + ah - 4, "#8a98a4");
  rect(g, ax + 15, ay + ah - 4, 3, 2, "#2a3a48");
}
// La vida del acuario: cáusticas, algas que se mecen, los peces (los dos del
// fondo mas lentos y velados por el agua, el principal delante), burbujas.
function drawTankLife(g, t, fish) {
  const { x: ax, y: ay, w: aw, h: ah } = TANK;
  g.save(); g.beginPath(); g.rect(ax, ay, aw, ah); g.clip();
  g.globalAlpha = 0.22;
  for (let k = 0; k < 7; k++) { const cx = Math.round(ax + ((k * 17 + t * 6) % (aw + 10)) - 5), cy = Math.round(ay + 8 + ((k * 11) % (ah - 18)) + Math.sin(t + k) * 2); rect(g, cx, cy, 5, 1, "#bff8ff"); rect(g, cx + 2, cy + 1, 4, 1, "#bff8ff"); }
  for (let x = 0; x < aw; x += 2) if (Math.sin(x * 0.4 + t * 2.4) > 0.5) px(g, ax + x, ay + ah - 7 + Math.round(Math.sin(x * 0.12) * 1.2 + 1), "#ffffff");
  g.globalAlpha = 1;
  const weed = (bx, len, ph, dark, light) => { for (let k = 0; k < len; k++) { const x = ax + bx + Math.round(Math.sin(t * 1.4 + k * 0.45 + ph) * (k / len) * 2.2); px(g, x, ay + ah - 6 - k, k % 3 ? dark : light); if (k % 4 === 2) px(g, x + (k % 8 ? 1 : -1), ay + ah - 6 - k, light); } };
  const swim = (id, i, lane, speed, alpha) => {
    const f = sideFishFrames(id), span = aw - f.w - 6;
    const v = f.eel ? speed * 0.8 : f.puffer ? speed * 0.55 : f.ray ? speed * 0.7 : speed;
    const p = (t * v + i * 0.41) % 2, right = p < 1, k = right ? p : 2 - p, e = k * k * (3 - 2 * k);
    const y = ay + 4 + Math.round((f.ray ? 0.78 : lane) * (ah - 10 - f.h) + Math.sin(t * (f.puffer ? 0.9 : 1.4) + i * 2) * (f.puffer ? 3 : 1.5));
    const img = f.right[Math.floor(t * (f.eel ? 3 : f.ray ? 2 : 5) + i) % 2], x = ax + 3 + Math.round(e * span);
    g.globalAlpha = alpha;
    if (right) g.drawImage(img, x, y);
    else { g.save(); g.translate(x + img.width, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore(); }
    g.globalAlpha = 1;
  };
  const [main, ...back] = fish;
  back.forEach((id, i) => { if (id) swim(id, i + 1, i ? 0.32 : 0.12, 0.04 + i * 0.012, 0.62); });
  weed(4, 26, 0, "#2f8a3a", "#6ac84a"); weed(8, 18, 1.3, "#2f8a3a", "#6ac84a"); weed(32, 14, 2, "#2a7a4a", "#5ab87a"); weed(48, 24, 0.7, "#2f8a3a", "#7ad84a");
  if (main) swim(main, 0, 0.55, 0.06, 1);
  weed(70, 12, 2.6, "#3a9a3a", "#8ae05a"); weed(86, 16, 0.2, "#3a9a3a", "#8ae05a");
  for (let k = 0; k < 6; k++) {
    const e = (t * 0.45 + k / 6) % 1, bx = ax + 16 + Math.round(Math.sin(e * 9 + k) * 1.5), by = Math.round(ay + ah - 6 - e * (ah - 6));
    px(g, bx, by, "#dff8ff");
    if (k % 2) { px(g, bx + 1, by, "#9fe0f0"); px(g, bx, by - 1, "#9fe0f0"); px(g, bx + 1, by - 1, "#ffffff"); }
  }
  for (let x = 0; x < aw; x++) if (Math.sin(x * 0.7 - t * 3) > 0.6) px(g, ax + x, ay + 1, "#dffaff");
  g.restore();
  // El cristal de delante: reflejos y los postes de las esquinas por encima de todo
  g.globalAlpha = 0.16;
  for (let k = 0; k < 14; k++) { px(g, ax + 4 + k, ay + 18 - k, "#ffffff"); px(g, ax + 5 + k, ay + 18 - k, "#ffffff"); px(g, ax + 10 + k, ay + 22 - k, "#ffffff"); }
  g.globalAlpha = 1;
  rect(g, ax - 3, ay - 1, 3, ah + 2, "#1e2a32"); rect(g, ax + aw, ay - 1, 3, ah + 2, "#1e2a32"); rect(g, ax - 2, ay - 1, 1, ah + 2, "#5a7a88"); rect(g, ax + aw + 1, ay - 1, 1, ah + 2, "#3a4a58");
  rect(g, ax - 3, ay + ah, aw + 6, 3, "#1e2a32"); rect(g, ax - 2, ay + ah, aw + 4, 1, "#3a5a68");
}
function paintNightstand(g, A) {
  const { x, top } = STAND;
  floorShadow(g, x - 2, top + 22, 26, 4, A);
  rect(g, x - 1, top - 1, 24, 4, WOOD.o); rect(g, x, top, 22, 1, WOOD.h); rect(g, x, top + 1, 22, 1, WOOD.b);
  rect(g, x + 1, top + 3, 20, 13, WOOD.o); rect(g, x + 2, top + 3, 18, 12, WOOD.m);
  rect(g, x + 3, top + 5, 16, 8, WOOD.d); rect(g, x + 4, top + 6, 15, 7, WOOD.l); rect(g, x + 4, top + 6, 14, 6, WOOD.b);
  rect(g, x + 10, top + 8, 3, 2, "#c8902a"); px(g, x + 10, top + 8, "#ffe28a");
  rect(g, x + 2, top + 15, 2, 9, WOOD.o); rect(g, x + 18, top + 15, 2, 9, WOOD.o); px(g, x + 2, top + 15, WOOD.m);
  // La maceta con el brote y el platillo de laton de la vela
  rect(g, x + 2, top - 7, 8, 7, "#c0603a"); rect(g, x + 1, top - 8, 10, 2, "#d87a4a"); rect(g, x + 9, top - 6, 1, 6, "#8a3e22"); px(g, x + 3, top - 6, "#e89a6a");
  for (const [lx, ly, c] of [[5, -12, "#5aa83a"], [3, -14, "#7ac84a"], [7, -15, "#7ac84a"], [4, -10, "#3f7a28"], [6, -13, "#3f7a28"], [8, -11, "#5aa83a"]]) rect(g, x + lx, top + ly, 2, 2, c);
  rect(g, x + 13, top - 2, 8, 2, "#c8902a"); px(g, x + 13, top - 2, "#ffe28a"); rect(g, x + 15, top - 9, 4, 7, "#f4ead0"); rect(g, x + 18, top - 9, 1, 7, "#d8ccb0"); px(g, x + 15, top - 9, "#ffffff");
  px(g, x + 17, top - 10, "#2a1a10");
}
function paintProp(g, A, prop) {
  if (prop === "plant") {
    floorShadow(g, 151, 126, 22, 4, A);
    // Una costilla de Adan: hojas en punta con cortes, luz en la mitad de arriba y nervio oscuro
    const leaf = (x0, y0, ang, L, W) => {
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, R = Math.ceil(L + W);
      for (let y = Math.floor(y0 - R); y <= y0 + R; y++) for (let x = Math.floor(x0 - R); x <= x0 + R; x++) {
        const rx = x + 0.5 - x0, ry = y + 0.5 - y0, s = (rx * dx + ry * dy) / L, v = rx * nx + ry * ny;
        if (s < 0 || s > 1) continue;
        const hw = W * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.1)), 0.55) * (s < 0.15 ? 0.55 + s * 3 : 1);
        if (Math.abs(v) > hw) continue;
        const q = Math.abs(v) / Math.max(0.5, hw), up = v * ny < 0;
        if (q > 0.45 && s > 0.22 && s < 0.86 && Math.abs(((s * 6 + (up ? 0 : 0.5)) % 1) - 0.5) < 0.12) continue;
        px(g, x, y, Math.abs(v) < 0.55 && s < 0.92 ? "#2a6a22" : q > 0.8 ? "#2f7a2a" : up ? (q > 0.3 && q < 0.62 && s > 0.4 && s < 0.75 ? "#9ad86a" : "#6ac04a") : "#4a9a3a");
      }
    };
    const LEAVES = [[158, 92, -1.95, 14, 5], [166, 90, -1.15, 13, 5], [162, 86, -1.6, 12, 4], [157, 103, 2.9, 12, 4], [167, 103, 0.25, 11, 4]];
    for (const [x0, y0] of LEAVES) line(g, 162, 109, x0, y0, "#3f7a28");
    for (const [x0, y0, a, L, W] of LEAVES) leaf(x0, y0, a, L, W);
    rect(g, 154, 110, 16, 17, "#8a3e22"); rect(g, 155, 110, 14, 16, "#c0603a"); rect(g, 153, 108, 18, 3, "#d87a4a"); rect(g, 153, 108, 18, 1, "#f0a070"); rect(g, 166, 111, 3, 15, "#a04a2a"); rect(g, 156, 112, 1, 12, "#e08a5a");
    rect(g, 155, 117, 14, 1, "#a04a2a");
  } else if (prop === "lamp") {
    floorShadow(g, 152, 126, 20, 4, A);
    rect(g, 160, 68, 2, 58, "#262632"); px(g, 160, 68, "#6a6a7c"); for (let y = 72; y < 124; y += 6) px(g, 160, y, "#6a6a7c");
    ellipseRows(g, 161, 126, 8, 2, "#262632"); ellipseRows(g, 160, 125, 6, 1, "#4a4a5a");
    line(g, 167, 68, 167, 75, "#c8902a"); px(g, 167, 76, "#ffd166");
  } else {
    floorShadow(g, 144, 125, 38, 4, A);
    // Libros tumbados (lomos y cantos a la vez), dos de pie con otro apoyado y un cacao encima
    const BK = [["#c94a3a", 24, 4], ["#3a6ab0", 21, 3], ["#e0b040", 23, 4], ["#4a9a4a", 19, 3], ["#8a5ab8", 20, 3]];
    let by = 126;
    BK.forEach(([c, w, h], i) => {
      by -= h + 1;
      const bx = 146 + [0, 2, 0, 3, 1][i];
      rect(g, bx - 1, by - 1, w + 2, h + 2, "#2a1206");
      if (i % 2 === 0) { rect(g, bx, by, w, h, c); rect(g, bx, by, w, 1, mix(c, "#ffffff", 0.3)); rect(g, bx + 2, by, 1, h, mix(c, "#ffe28a", 0.5)); rect(g, bx + w - 3, by, 1, h, mix(c, "#ffe28a", 0.5)); rect(g, bx + 6, by + 1, w - 12, 1, mix(c, "#000000", 0.25)); }
      else { rect(g, bx, by, w, h, "#f4ead0"); rect(g, bx, by, w, 1, c); rect(g, bx, by + h - 1, w, 1, c); for (let x = bx + 1; x < bx + w - 1; x += 2) px(g, x, by + 1, "#d8ccb0"); }
    });
    rect(g, 152, by - 7, 7, 7, "#2a1206"); rect(g, 153, by - 6, 5, 6, "#f4ead0"); rect(g, 153, by - 6, 5, 1, "#6a3a1e"); rect(g, 157, by - 6, 1, 6, "#d8ccb0"); rect(g, 159, by - 5, 2, 3, "#2a1206"); px(g, 159, by - 4, "#f4ead0");
    px(g, 154, by - 9, "#c8c0b0"); px(g, 155, by - 10, "#c8c0b0"); px(g, 155, by - 12, "#a8a090");
    for (const [x, c, h] of [[172, "#c94a3a", 16], [176, "#2a7a8a", 18]]) { rect(g, x - 1, 126 - h - 1, 5, h + 1, "#2a1206"); rect(g, x, 126 - h, 3, h, c); rect(g, x, 126 - h + 2, 3, 1, mix(c, "#ffe28a", 0.5)); rect(g, x, 126 - 3, 3, 1, mix(c, "#ffe28a", 0.5)); px(g, x, 126 - h, mix(c, "#ffffff", 0.3)); }
    for (let k = 0; k < 14; k++) { const x = 168 - Math.floor(k / 3), y = 125 - k; rect(g, x - 1, y, 4, 1, k === 13 ? "#2a1206" : "#e0b040"); px(g, x - 1, y, "#2a1206"); px(g, x + 2, y, "#2a1206"); }
  }
}
function paintBed(g, A, bed) {
  const C = A.curtain;
  if (bed === "cot") {
    floorShadow(g, 6, 134, 88, 6, A);
    rect(g, 6, 92, 6, 46, WOOD.o); rect(g, 7, 93, 4, 44, WOOD.m); rect(g, 7, 93, 1, 44, WOOD.l); rect(g, 6, 90, 6, 3, WOOD.d); rect(g, 7, 90, 4, 1, WOOD.h);
    rect(g, 12, 98, 3, 26, WOOD.o); rect(g, 12, 99, 2, 24, WOOD.d);
    // Colchon, almohada y un edredon de retales que cuelga por delante
    rect(g, 12, 111, 74, 10, "#d8c8a8"); rect(g, 12, 111, 74, 2, "#f4e6c6");
    rect(g, 14, 105, 14, 7, "#c8c0b0"); rect(g, 14, 105, 13, 6, "#ffffff"); rect(g, 15, 106, 4, 1, "#e8e4dc"); px(g, 27, 110, "#a8a090");
    rect(g, 30, 106, 56, 22, mix(C[1], "#000000", 0.35));
    for (let y = 107; y < 127; y++) for (let x = 31; x < 86; x++) { const q = Math.floor((x - 31) / 6) + Math.floor((y - 107) / 5); px(g, x, y, (x - 31) % 6 === 0 || (y - 107) % 5 === 0 ? mix(C[1], "#000000", 0.2) : q % 3 === 0 ? C[0] : q % 3 === 1 ? C[1] : "#5aa87a"); }
    rect(g, 31, 107, 54, 1, C[2]); for (let x = 33; x < 85; x += 6) px(g, x, 109, "#f4ead0");
    rect(g, 12, 126, 78, 4, WOOD.o); rect(g, 13, 126, 76, 1, WOOD.l); rect(g, 13, 127, 76, 2, WOOD.m);
    rect(g, 86, 100, 6, 38, WOOD.o); rect(g, 87, 101, 4, 36, WOOD.m); rect(g, 87, 101, 1, 36, WOOD.l); rect(g, 86, 98, 6, 3, WOOD.d); rect(g, 87, 98, 4, 1, WOOD.h);
    rect(g, 13, 130, 3, 8, WOOD.o); rect(g, 82, 130, 3, 8, WOOD.o);
  } else if (bed === "cushion") {
    // Un cojin redondo de suelo: ribete, botones, una almohada detras y una manta por el borde
    const R = A.rug, cx = 46, cy = 128;
    floorShadow(g, 12, 136, 70, 6, A);
    ellipseRows(g, cx, cy + 4, 31, 8, R[3]); ellipseRows(g, cx, cy + 3, 30, 7, R[1]);
    ellipseRows(g, cx, cy, 31, 7, R[3]); ellipseRows(g, cx, cy, 30, 6, R[2]); ellipseRows(g, cx, cy, 28, 5, R[0]); ellipseRows(g, cx - 3, cy - 1, 18, 3, mix(R[0], R[2], 0.35));
    for (const [bx, by] of [[cx, cy], [cx - 16, cy - 1], [cx + 16, cy + 1], [cx - 8, cy + 3], [cx + 8, cy - 3], [cx - 7, cy - 3], [cx + 9, cy + 3]]) { px(g, bx, by, R[3]); px(g, bx - 1, by, R[1]); px(g, bx, by - 1, mix(R[0], R[2], 0.6)); }
    rect(g, 20, 115, 18, 10, "#8a8478"); rect(g, 21, 115, 16, 9, "#f4f0e8"); rect(g, 21, 115, 16, 1, "#ffffff"); rect(g, 21, 119, 16, 1, "#c94a3a"); rect(g, 36, 116, 1, 8, "#c8c0b0");
    rect(g, 60, 119, 20, 4, "#2a1a10"); rect(g, 61, 119, 18, 3, "#5aa87a"); rect(g, 61, 119, 18, 1, "#8ad8a8");
    rect(g, 74, 122, 7, 12, "#2a1a10"); rect(g, 75, 122, 5, 11, "#5aa87a"); rect(g, 75, 126, 5, 1, "#3a7a5a"); rect(g, 75, 130, 5, 1, "#3a7a5a"); for (let x = 75; x < 80; x += 2) px(g, x, 133, "#8ad8a8");
  } else {
    // La litera: cama en alto con escalera y, debajo, un escritorio con un terminal encendido
    floorShadow(g, 4, 134, 92, 6, A);
    rect(g, 6, 80, 74, 6, WOOD.o); rect(g, 7, 81, 72, 1, WOOD.l); rect(g, 7, 82, 72, 3, WOOD.m);
    rect(g, 8, 73, 70, 8, "#d8c8a8"); rect(g, 8, 73, 70, 1, "#f4e6c6"); rect(g, 10, 70, 13, 5, "#ffffff"); rect(g, 10, 74, 13, 1, "#c8c0b0");
    for (let y = 72; y < 80; y++) for (let x = 25; x < 78; x++) px(g, x, y, ((x >> 2) + (y >> 2)) % 2 ? C[0] : C[1]);
    rect(g, 25, 72, 53, 1, C[2]);
    rect(g, 6, 68, 3, 12, WOOD.o); rect(g, 77, 68, 3, 12, WOOD.o); rect(g, 6, 76, 74, 1, WOOD.d);
    for (const lx of [6, 77]) { rect(g, lx, 86, 3, 52, WOOD.o); rect(g, lx + 1, 86, 1, 52, WOOD.l); }
    for (const lx of [82, 92]) { rect(g, lx, 80, 2, 58, WOOD.o); rect(g, lx, 80, 1, 58, WOOD.b); }
    for (let y = 86; y < 136; y += 7) { rect(g, 82, y, 12, 2, WOOD.o); rect(g, 82, y, 12, 1, WOOD.b); }
    rect(g, 14, 112, 56, 3, WOOD.o); rect(g, 15, 112, 54, 1, WOOD.h); rect(g, 15, 113, 54, 1, WOOD.b);
    rect(g, 16, 115, 3, 21, WOOD.o); rect(g, 65, 115, 3, 21, WOOD.o); rect(g, 52, 115, 13, 12, WOOD.o); rect(g, 53, 116, 11, 4, WOOD.m); rect(g, 53, 121, 11, 5, WOOD.m); px(g, 58, 118, "#c8902a"); px(g, 58, 123, "#c8902a");
    rect(g, 22, 96, 20, 15, "#3a3a4a"); rect(g, 23, 97, 18, 13, "#5a5a6a"); rect(g, 25, 99, 14, 9, "#0c1a14"); rect(g, 29, 110, 6, 2, "#3a3a4a"); rect(g, 26, 111, 12, 1, "#5a5a6a");
    rect(g, 44, 108, 6, 4, "#f4ead0"); rect(g, 50, 109, 2, 2, "#f4ead0");
  }
}
function drawTerminal(g, t) {
  const k = Math.floor(t * 2);
  for (let r = 0; r < 4; r++) rect(g, 26, 100 + r * 2, 3 + ((r * 5 + k) % 8), 1, "#3fff97");
  if (k % 2) px(g, 27 + (k % 9), 106, "#b8ffd8");
}
function paintRug(g, A, rug) {
  const R = A.rug, cx = RUG.x, cy = RUG.y;
  if (rug === "checker") {
    const x0 = cx - 40, y0 = cy - 10, w = 80, h = 20;
    rect(g, x0, y0, w, h, R[3]); rect(g, x0 + 1, y0 + 1, w - 2, h - 2, R[1]); rect(g, x0 + 3, y0 + 3, w - 6, h - 6, R[0]);
    for (let y = 0; y < h - 6; y += 3) for (let x = 0; x < w - 6; x += 6) rect(g, x0 + 3 + x + ((y / 3) % 2 ? 3 : 0), y0 + 3 + y, 3, 3, R[2]);
    rect(g, x0 + 3, y0 + 3, w - 6, 1, mix(R[0], R[3], 0.5));
    for (let x = x0 + 2; x < x0 + w - 2; x += 3) { px(g, x, y0 + 2, R[2]); px(g, x + 1, y0 + h - 3, R[2]); }
    for (let y = y0 + 1; y < y0 + h - 1; y += 2) { px(g, x0 - 1, y, R[2]); px(g, x0 - 2, y, R[1]); px(g, x0 + w, y, R[2]); px(g, x0 + w + 1, y, R[1]); }
  } else if (rug === "moon") {
    ellipseRows(g, cx, cy, 41, 10, R[3]); ellipseRows(g, cx, cy, 40, 9, R[1]); ellipseRows(g, cx, cy, 37, 8, R[0]);
    for (let y = cy - 8; y <= cy + 8; y++) for (let x = cx - 37; x <= cx + 37; x++) { const k = ((x - cx) / 37) ** 2 + ((y - cy) / 8.5) ** 2; if (k < 1 && k > 0.78 && (x + y) % 3 === 0) px(g, x, y, R[2]); }
    g.fillStyle = R[2]; discRows(g, cx - 6, cy - 1, 5); g.fillStyle = R[0]; discRows(g, cx - 4, cy - 2, 4);
    for (const [x, y] of [[-24, -3], [16, 2], [-14, 5], [26, -4], [8, -5], [-30, 2]]) { px(g, cx + x, cy + y, R[2]); if (x % 2 === 0) { px(g, cx + x - 1, cy + y, R[1]); px(g, cx + x + 1, cy + y, R[1]); } }
  }
}
function paintDogBed(g, A) {
  floorShadow(g, 10, 154, 44, 4, A);
  ellipseRows(g, 32, 150, 22, 7, "#3a2412"); ellipseRows(g, 32, 149, 21, 6, "#8a5a2e");
  for (let x = 12; x < 53; x += 3) px(g, x, 148 + (x % 2), "#a8743e");
  ellipseRows(g, 32, 148, 17, 4, "#b8504a"); ellipseRows(g, 31, 147, 13, 2, "#d87068");
  for (let x = 18; x < 46; x += 4) px(g, x, 149, "#8a3a34");
}
function drawDog(g, t) {
  // Respira, y cada pocos segundos da dos coletazos soñando
  const breath = Math.sin(t * 1.4) > 0 ? 0 : 1, dream = (t % 5) < 1.1, img = DOGS()[(dream ? Math.floor(t * 5) % 2 : 0) * 2 + breath];
  g.drawImage(img, 32 - Math.floor(img.width / 2), 152 - img.height);
  if (Math.floor(t * 0.7) % 2 === 0) g.drawImage(ZED(), 46, 130 - Math.floor((t * 0.7 % 1) * 4));
}

// El mapa de luz: el tinte de noche mas los charcos (vela, lampara, pecera,
// luna por la ventana, terminal, lo que brilla en las baldas).
function paintLight(g, A, view) {
  rect(g, 0, 0, ROOM_W, ROOM_H, A.tint);
  g.globalCompositeOperation = "lighter";
  const pool = (x, y, r, col, s) => g.drawImage(lightPool(r, col, s), Math.round(x - r), Math.round(y - r));
  const { x: wx, y: wy, w: ww, h: wh } = WIN, { x: ax, y: ay, w: aw, h: ah } = TANK;
  rect(g, wx, wy, ww, wh, "#ffffff");
  pool(wx + ww / 2, wy + wh / 2, 56, [120, 140, 220], 0.38);
  // La luna dibuja los cuatro cristales en el suelo, con la cruz de la ventana
  for (let y = 118; y < 156; y++) {
    const k = (y - 118) / 38, gy = Math.floor(k * wh);
    if (Math.abs(gy - wh / 2) < 2) continue;
    for (let gx = 2; gx < ww - 2; gx++) {
      if (Math.abs(gx - ww / 2) < 2) continue;
      const x = Math.round(wx + 22 + gx * 0.9 + k * 30);
      if (bayer(x, y) < 0.12 + k * 0.5) continue;
      px(g, x, y, "rgb(70,82,124)");
    }
  }
  pool(ax + aw / 2, ay + ah / 2, 74, [70, 190, 230], 0.5);
  rect(g, ax, ay, aw, ah, "rgb(120,110,80)");
  pool(STAND.x + 17, STAND.top - 12, 50, [255, 170, 90], 0.5);
  pool(RUG.x, RUG.y - 14, 60, [255, 210, 170], 0.3);
  if (view.prop === "lamp") { pool(161, 72, 72, [255, 200, 130], 0.62); pool(161, 112, 40, [255, 220, 160], 0.3); }
  if (view.bed === "bunk") pool(32, 104, 30, [90, 230, 170], 0.5);
  pool(wx + ww - 12, wy + wh, 16, [160, 255, 120], 0.45);
  SHELVES.forEach(([key, sx]) => {
    if (view.shelves[key] === "shop:market-moon") pool(sx + 22, SHELF_Y - 6, 30, [255, 200, 120], 0.45);
    if (view.shelves[key] === "shop:market-arcade") pool(sx + 22, SHELF_Y - 8, 22, [120, 230, 180], 0.4);
  });
  if (view.season === "halloween") pool(wx + 9, wy + wh, 14, [255, 150, 60], 0.5);
  g.globalCompositeOperation = "source-over";
}

// Crea el pintor del cuarto sobre un canvas de ROOM_W x ROOM_H.
export function createRoomPainter(canvas) {
  const g = canvas.getContext("2d");
  g.imageSmoothingEnabled = false;
  const [bgC, bgG] = makeCanvas(ROOM_W, ROOM_H);
  const [lightC, lightG] = makeCanvas(ROOM_W, ROOM_H);
  const [mapC, mapG] = makeCanvas(ROOM_W, ROOM_H);
  let bgKey = "";

  // view: { palette, bed, rug, prop, season, fish: [main, back1, back2] (ids o ""),
  // shelves: { shelfLeft, shelfRight } (claves), napping, outfit }
  function draw(t, view) {
    const A = ATMOS[view.palette] || ATMOS.aurora;
    const key = [view.palette, view.bed, view.rug, view.prop, view.season, view.shelves.shelfLeft, view.shelves.shelfRight].join("|");
    if (key !== bgKey) {
      bgKey = key;
      bgG.clearRect(0, 0, ROOM_W, ROOM_H);
      paintWall(bgG, A); paintFloor(bgG, A);
      paintWindow(bgG, A, view.season);
      paintClock(bgG, A); paintFrame(bgG, A); paintShelves(bgG, A, view.shelves);
      paintBed(bgG, A, view.bed); paintNightstand(bgG, A); paintProp(bgG, A, view.prop); paintTank(bgG, A);
      paintRug(bgG, A, view.rug); paintDogBed(bgG, A);
      lightG.clearRect(0, 0, ROOM_W, ROOM_H);
      paintLight(lightG, A, view);
    }
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, ROOM_W, ROOM_H);
    drawSky(g, t, view.season);
    g.drawImage(bgC, 0, 0);
    drawClock(g, t, new Date()); drawFrameStars(g, t); drawTankLife(g, t, view.fish);
    if (view.bed === "bunk") drawTerminal(g, t);
    drawDog(g, t);
    // Pip en la alfombra: sentado y dormido en la siesta, o de pie parpadeando
    const blink = !view.napping && (t % 3.3) < 0.13;
    const rig = rigImg({ pose: view.napping ? "sit" : "idle", frame: Math.floor(t * 1.25) % 2, expr: view.napping ? "sleep" : blink ? "blink" : view.expression || "idle", lookX: 0, lookY: 0, ghost: false, glow: false, outfit: view.outfit || {}, handUp: false });
    g.drawImage(rig.c, RUG.x - RIG_FOOT_X, PIP_FEET - RIG_TALL);
    // Luz: el mapa (con la vela parpadeando) multiplicado sobre el cuarto
    const fl = Math.sin(t * 11) * 0.5 + Math.sin(t * 17.3) * 0.5;
    mapG.globalCompositeOperation = "source-over"; mapG.drawImage(lightC, 0, 0);
    mapG.globalCompositeOperation = "lighter";
    mapG.drawImage(lightPool(26, [255, 190, 110], Math.round((0.42 + fl * 0.06) * 50) / 50), STAND.x + 17 - 26, STAND.top - 14 - 26);
    g.globalCompositeOperation = "multiply"; g.drawImage(mapC, 0, 0); g.globalCompositeOperation = "source-over";
    // Lo que brilla: la llama, la pantalla de la lampara, la luz de la tapa, el tarro
    const fx = STAND.x + 17, fy = STAND.top - 11, tall = fl > 0.3 ? 1 : 0;
    g.globalCompositeOperation = "lighter"; g.drawImage(lightPool(7, [255, 170, 80], 0.45), fx - 7, fy - 8 - tall); g.globalCompositeOperation = "source-over";
    rect(g, fx - 1, fy - 3 - tall, 2, 3 + tall, "#ffb04a"); px(g, fx, fy - 4 - tall, "#ffd166"); px(g, fx - 1 + (fl > 0 ? 1 : 0), fy - 5 - tall, "#fff0af"); px(g, fx, fy - 1, "#fff6dc");
    if (view.prop === "lamp") {
      for (let y = 0; y < 11; y++) { const hw = 6 + Math.floor(y / 2); rect(g, 161 - hw, 57 + y, hw * 2, 1, y === 0 ? "#fff0c8" : y > 8 ? "#e8b860" : "#ffd88a"); px(g, 161 - hw, 57 + y, "#c88a3a"); px(g, 160 + hw, 57 + y, "#c88a3a"); }
      rect(g, 152, 68, 18, 1, "#a86a2a"); rect(g, 158, 69, 6, 2, "#fff6dc");
      g.globalCompositeOperation = "lighter"; g.drawImage(lightPool(12, [255, 200, 120], 0.35), 149, 60); g.globalCompositeOperation = "source-over";
    }
    rect(g, TANK.x + 2, TANK.y - 2, TANK.w - 4, 1, "#e8fbff"); rect(g, TANK.x + 8, TANK.y - 3, TANK.w - 16, 1, "#9fe0f0");
    const jar = 0.5 + Math.sin(t * 2.2) * 0.5, jx = WIN.x + WIN.w - 15, jy = WIN.y + WIN.h - 4;
    g.globalCompositeOperation = "lighter"; g.drawImage(lightPool(6, [170, 255, 120], Math.round((0.25 + jar * 0.3) * 20) / 20), jx - 4, jy - 7); g.globalCompositeOperation = "source-over";
    for (let k = 0; k < 3; k++) if (Math.sin(t * 3 + k * 2.1) > -0.2) px(g, jx + (k * 2) % 4, jy - 2 - k * 2 + Math.round(Math.sin(t * 2 + k)), "#efff9a");
    if (view.season === "halloween") { const on = Math.sin(t * 9) > -0.6; px(g, WIN.x + 6, WIN.y + WIN.h - 1, on ? "#ffd166" : "#ff9a3c"); px(g, WIN.x + 11, WIN.y + WIN.h - 1, on ? "#ffd166" : "#ff9a3c"); rect(g, WIN.x + 7, WIN.y + WIN.h + 1, 5, 1, on ? "#ffb04a" : "#e8762a"); }
    drawShelfGlow(g, t, view.shelves);
    if (view.napping && Math.floor(t * 1.2) % 2 === 0) g.drawImage(ZED(), RUG.x + 8, RUG.y - 40 - Math.floor((t * 1.2 % 1) * 5));
  }
  return { draw };
}

// Los iconos del estudio (atmosfera, cama, suelo, detalle), en pixel, 24x12.
export function roomOptionIcon(group, id) {
  const [c, g] = makeCanvas(24, 12);
  if (group === "palette") { const A = ATMOS[id]; rect(g, 0, 0, 24, 8, A.wall); rect(g, 0, 8, 24, 4, A.floor[0]); rect(g, 3, 2, 8, 5, "#1e2a5a"); rect(g, 2, 1, 1, 7, A.curtain[0]); rect(g, 11, 1, 1, 7, A.curtain[0]); rect(g, 15, 3, 7, 1, "#a8743e"); }
  if (group === "bed") {
    if (id === "cot") { rect(g, 2, 5, 20, 6, "#5a3a1e"); rect(g, 3, 5, 18, 3, "#f4e6c6"); rect(g, 8, 5, 13, 3, "#5aa87a"); }
    else if (id === "cushion") { ellipseRows(g, 12, 8, 9, 3, "#5a3a1e"); ellipseRows(g, 12, 8, 8, 2, "#c06040"); }
    else { rect(g, 2, 2, 16, 3, "#f4e6c6"); rect(g, 8, 2, 10, 3, "#5aa87a"); rect(g, 2, 5, 2, 7, "#7a4a24"); rect(g, 17, 5, 2, 7, "#7a4a24"); for (let y = 5; y < 12; y += 2) rect(g, 19, y, 4, 1, "#a8743e"); }
  }
  if (group === "rug") {
    if (id === "checker") { rect(g, 1, 3, 22, 7, "#2a6458"); for (let y = 3; y < 10; y += 2) for (let x = 1; x < 23; x += 4) rect(g, x + ((y - 3) / 2 % 2 ? 2 : 0), y, 2, 2, "#9fd8c0"); }
    else if (id === "moon") { ellipseRows(g, 12, 7, 10, 4, "#2a6458"); g.fillStyle = "#9fd8c0"; discRows(g, 12, 6, 2); }
    else { for (let y = 2; y < 12; y += 3) rect(g, 0, y, 24, 1, "#5a3a1e"); rect(g, 0, 3, 24, 2, "#80542f"); rect(g, 0, 6, 24, 2, "#80542f"); rect(g, 0, 9, 24, 2, "#80542f"); }
  }
  if (group === "prop") {
    if (id === "plant") { rect(g, 9, 7, 6, 5, "#c0603a"); rect(g, 10, 2, 2, 5, "#5aa83a"); rect(g, 13, 1, 2, 6, "#7ac84a"); rect(g, 8, 3, 2, 3, "#7ac84a"); }
    else if (id === "lamp") { rect(g, 11, 4, 2, 7, "#3a3a4a"); rect(g, 7, 1, 10, 4, "#f0d088"); rect(g, 9, 11, 6, 1, "#3a3a4a"); }
    else { for (const [y, col, w] of [[9, "#c94a3a", 14], [7, "#3a6ab0", 12], [5, "#e0b040", 13], [3, "#4a9a4a", 11]]) { rect(g, 5, y, w, 2, col); rect(g, 5, y, w, 1, mix(col, "#ffffff", 0.3)); } }
  }
  return c;
}
