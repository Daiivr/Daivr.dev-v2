import { Buf, gridSprite, lazy, outlinedSprite } from "./core.js";
import { P } from "./palette.js";

// Sprites dibujados a mano. Se construyen la primera vez que el mundo los
// pide (no al importar), para no gastar nada antes de que el footer se vea.

const LAMP_ROWS = [
  "....OOO....", "...OMLMO...", "..OMLLLMO..", ".OOOOOOOOO.",
  "..OgGGGgO..", "..OgGWGgO..", "..OgGWGgO..", "..OgGGGgO..",
  ".OOOOOOOOO.", "...OOMOO...",
  "....OLO....", "....OLO....", "....OLO....", "....OLO....", "...OMLMO...",
  "....OLO....", "....OLO....", "....OLO....", "....OLO....", "....OLO....",
  "....OLO....", "....OLO....", "....OLO....", "...OMLMO...", "...OMLMO...",
  "..OMMLMMO..", "..OOOOOOO.."
];
export const LAMP_H = LAMP_ROWS.length;

const FLAME_ROWS = [
  [".....o.....", ".....o.....", "....oO.....", "....oO..o..", "...oOO..o..", "...oOyO.oo.", "..oOyyOoOo.", "..oOywyOOo.", ".oOyywwyOo.", ".oOywWwyOo.", ".oOywWWwyo.", "oOyywWWwyOo", ".oOyywwyOo.", "..ooOOOOoo."],
  ["......o....", ".....oo....", ".....oO....", "..o..oO....", "..o..OOo...", ".oo.oOyOo..", ".oOooOyyOo.", ".oOOyywyOo.", ".oOyywwyyOo", ".oOyywWwyOo", ".oyywWWwyOo", "oOyywWWwyOo", ".oOyywwyOo.", "..ooOOOOoo."],
  [".....o.....", "....oo.....", "....oOo....", "...oOOo..o.", "...oOyOo.o.", "..oOyyOooO.", "..oOywyOOo.", ".oOyywyyOo.", ".oOywwwyOo.", ".oOywWwyyo.", "oOyywWWwyOo", "oOyywWWwyOo", ".oOyywwyOo.", "..ooOOOOoo."],
  ["...........", "......o....", ".o....oo...", ".o...oOo...", ".oo..oOOo..", "..oOoOyOo..", "..oOyyyOOo.", ".oOyywwyOo.", ".oOywwwyyOo", "oOyywWwwyOo", "oOyywWWwyOo", "oOyywWWwyOo", ".oOyywwyOo.", "..ooOOOOoo."]
];

export const FONT = {
  M: ["1.1", "111", "1.1", "1.1", "1.1"], A: [".1.", "1.1", "111", "1.1", "1.1"], R: ["11.", "1.1", "11.", "1.1", "1.1"],
  K: ["1.1", "1.1", "11.", "1.1", "1.1"], E: ["111", "1..", "11.", "1..", "111"], T: ["111", ".1.", ".1.", ".1.", ".1."],
  D: ["11.", "1.1", "1.1", "1.1", "11."], I: ["111", ".1.", ".1.", ".1.", "111"], V: ["1.1", "1.1", "1.1", "1.1", ".1."],
  C: [".11", "1..", "1..", "1..", ".11"], L: ["1..", "1..", "1..", "1..", "111"], O: [".1.", "1.1", "1.1", "1.1", ".1."], S: [".11", "1..", ".1.", "..1", "11."]
};
function letters(b, text, x, y, col, shadow) {
  let tx = x;
  for (const ch of text) {
    FONT[ch].forEach((row, j) => {
      for (let i = 0; i < 3; i++) if (row[i] === "1") { if (shadow) b.set(tx + i + 1, y + j + 1, shadow); b.set(tx + i, y + j, col); }
    });
    tx += 4;
  }
}

// El puesto del mercado: toldo a rayas, cartel, mostrador con genero. Cerrado,
// las contraventanas bajan sobre el genero y cuelga un cartel de CLOSED.
function makeStand(open) {
  const w = 66, h = 58, b = new Buf(w, h), Wd = P.wood, A = P.awning;
  for (const px0 of [4, 59]) for (let y = 14; y < h; y++) { b.set(px0, y, Wd[0]); b.set(px0 + 1, y, Wd[3]); b.set(px0 + 2, y, Wd[0]); }
  for (let y = 26; y <= 44; y++) for (let x = 7; x <= 58; x++) {
    const m = (x - 7) % 7;
    b.set(x, y, y <= 27 ? Wd[0] : m === 0 ? Wd[0] : m === 1 ? Wd[2] : Wd[1]);
  }
  for (let x = 8; x <= 57; x++) { b.set(x, 33, Wd[3]); b.set(x, 34, Wd[0]); }
  const jars = [[12, "#f0a830", "#ffd27a"], [17, "#b82a45", "#e8607a"], [22, "#4258c0", "#8aa0ff"], [40, "#f0a830", "#ffd27a"], [45, "#5aa83a", "#a2da5e"], [50, "#b82a45", "#e8607a"]];
  for (const [x, c, hl] of jars) { b.rect(x, 28, 3, 1, "#c9c9c9"); b.rect(x, 29, 3, 4, c); b.set(x, 29, hl); b.set(x, 30, hl); }
  for (let y = 0; y <= 9; y++) for (let x = 18; x <= 47; x++) {
    const edge = y === 0 || y === 9 || x === 18 || x === 47;
    b.set(x, y, edge ? Wd[0] : y === 1 ? Wd[4] : y === 8 ? Wd[2] : Wd[3]);
  }
  b.clear(18, 0); b.clear(47, 0);
  letters(b, "MARKET", 22, 3, "#fff1cf", Wd[1]);
  b.rect(21, 10, 1, 1, Wd[0]); b.rect(44, 10, 1, 1, Wd[0]);
  for (let x = 0; x < w; x++) { b.set(x, 11, Wd[0]); b.set(x, 12, x === 0 || x === w - 1 ? Wd[0] : Wd[3]); b.set(x, 13, x === 0 || x === w - 1 ? Wd[0] : Wd[2]); }
  for (let r = 0; r < 12; r++) for (let x = 0; x < w; x++) {
    const y = 14 + r, s = Math.floor(x / 6) % 2, o = x % 6, right = x > 50;
    let c = s ? (right ? "#d6c39a" : A[3]) : (right ? A[1] : A[2]);
    if (r === 1) c = s ? A[4] : "#ec6a6a";
    if (r === 0 || ((x === 0 || x === w - 1) && r < 9)) c = A[0];
    if (r === 9 && (o === 0 || o === 5)) c = A[0];
    if (r === 10) { if (o === 0 || o === 5) c = null; else if (o === 1 || o === 4) c = A[0]; }
    if (r === 11) c = (o === 2 || o === 3) ? A[0] : null;
    if (c) b.set(x, y, c);
  }
  for (let x = 0; x < w; x++) { b.set(x, 43, x === 0 || x === w - 1 ? Wd[0] : Wd[4]); b.set(x, 44, x === 0 || x === w - 1 ? Wd[0] : Wd[3]); }
  for (let y = 45; y < h; y++) for (let x = 1; x < w - 1; x++) {
    let c = Wd[2];
    if (y === 45) c = Wd[0];
    else if (x === 1 || x === w - 2 || y === h - 1) c = Wd[0];
    else if (x === 2) c = Wd[3];
    else if (y === 50 || y === 54) c = Wd[1];
    else if ((x === 6 || x === 59) && (y === 48 || y === 52 || y === 56)) c = Wd[0];
    b.set(x, y, c);
  }
  if (open) {
    for (let y = 38; y <= 42; y++) for (let x = 6; x <= 17; x++) b.set(x, y, (x === 6 || x === 17 || y === 42) ? Wd[0] : y === 38 ? Wd[4] : ((x + y) % 2 ? Wd[3] : Wd[2]));
    for (const ax of [7, 10, 13]) { b.rect(ax, 35, 3, 3, "#d8333a"); b.set(ax, 35, "#ff8a7a"); b.set(ax + 2, 37, "#8a1a24"); b.set(ax + 1, 34, "#4a9236"); }
    for (const pxx of [22, 29]) {
      for (let y = 38; y <= 42; y++) for (let x = pxx; x < pxx + 7; x++) {
        const edge = x === pxx || x === pxx + 6 || y === 42 || (y === 38 && (x === pxx + 1 || x === pxx + 5));
        if (y === 38 && (x === pxx || x === pxx + 6)) continue;
        b.set(x, y, edge ? "#6a2a0e" : (x === pxx + 2 || x === pxx + 4) ? "#b4561a" : y === 39 && x < pxx + 3 ? "#ffb45a" : "#e8822a");
      }
      b.set(pxx + 3, 37, "#5a7a2a"); b.set(pxx + 3, 36, "#5a7a2a");
    }
    for (let y = 39; y <= 42; y++) for (let x = 40; x <= 51; x++) b.set(x, y, (x === 40 || x === 51 || y === 42) ? Wd[0] : y === 40 ? Wd[1] : Wd[2]);
    for (const [x, y, c] of [[41, 38, "#3d8432"], [42, 37, "#71bb48"], [43, 37, "#a2da5e"], [44, 38, "#71bb48"], [45, 36, "#3d8432"], [46, 36, "#71bb48"], [47, 37, "#a2da5e"], [48, 38, "#71bb48"], [49, 37, "#3d8432"], [50, 38, "#71bb48"], [42, 38, "#53a03c"], [43, 38, "#53a03c"], [45, 37, "#53a03c"], [46, 37, "#53a03c"], [47, 38, "#53a03c"], [49, 38, "#53a03c"], [46, 38, "#53a03c"], [45, 38, "#53a03c"]]) b.set(x, y, c);
    b.rect(55, 39, 4, 4, "#fff6dc"); b.rect(55, 39, 4, 1, "#8a5a2e"); b.set(57, 41, "#d8333a");
  } else {
    // contraventanas de tablas sobre todo el hueco
    for (let y = 28; y <= 42; y++) for (let x = 7; x <= 58; x++) {
      const plank = (y - 28) % 3;
      b.set(x, y, x === 7 || x === 58 || x === 32 ? Wd[0] : plank === 0 ? Wd[3] : plank === 2 ? Wd[0] : Wd[2]);
    }
    for (const kx of [12, 27, 37, 53]) for (const ky of [30, 36, 41]) b.set(kx, ky, "#2a2622");
    // cartel colgado del mostrador
    for (let y = 46; y <= 53; y++) for (let x = 18; x <= 46; x++) {
      const edge = y === 46 || y === 53 || x === 18 || x === 46;
      b.set(x, y, edge ? Wd[0] : y === 47 ? "#f2e3c0" : "#e2cfa0");
    }
    letters(b, "CLOSED", 21, 48, "#8a2a2a");
  }
  for (let y = 26; y <= 28; y++) b.set(54, y, "#2a2622");
  b.rect(52, 29, 5, 1, "#2a2622"); b.rect(52, 30, 1, 4, "#2a2622"); b.rect(56, 30, 1, 4, "#2a2622"); b.rect(52, 34, 5, 1, "#2a2622");
  b.rect(53, 30, 3, 4, "#b8a988"); b.set(53, 30, "#e6dcc2");
  return b.canvas();
}

// Silueta clara alrededor del puesto, para el hover del boton.
function outlineOf(img, col) {
  const w = img.width + 2, h = img.height + 2, b = new Buf(w, h);
  const d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
  const A = (x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height) ? 0 : d[(y * img.width + x) * 4 + 3];
  for (let y = -1; y <= img.height; y++) for (let x = -1; x <= img.width; x++) {
    if (A(x, y)) continue;
    if (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1)) b.set(x + 1, y + 1, col);
  }
  return b.canvas();
}

function makeCampBase() {
  const b = new Buf(24, 8), Wd = P.wood, S = P.stone;
  for (let x = 5; x <= 18; x++) { b.set(x, 0, Wd[0]); b.set(x, 1, Wd[3]); b.set(x, 2, Wd[2]); b.set(x, 3, Wd[0]); }
  b.set(5, 1, "#d9b27a"); b.set(5, 2, "#a87a46"); b.set(18, 1, "#d9b27a"); b.set(18, 2, "#a87a46");
  for (let x = 3; x <= 20; x++) { b.set(x, 2, Wd[0]); b.set(x, 3, Wd[4]); b.set(x, 4, Wd[2]); b.set(x, 5, Wd[0]); }
  b.set(3, 3, "#d9b27a"); b.set(3, 4, "#a87a46"); b.set(20, 3, "#d9b27a"); b.set(20, 4, "#a87a46");
  for (let i = 0; i < 6; i++) {
    const sx = i * 4, top = i % 2 ? 5 : 4;
    for (let y = top; y <= 7; y++) for (let x = sx; x < sx + 4; x++) {
      if (y === top && (x === sx || x === sx + 3)) continue;
      let c = S[2];
      if (x === sx || x === sx + 3 || y === 7) c = S[0];
      else if (y === top) c = S[3];
      else if (y === 6) c = S[1];
      b.set(x, y, c);
    }
    b.set(sx + 1, top, S[4]);
  }
  return b.canvas();
}

const FROG_PAL = { O: "#1d3a1c", G: "#5aa83a", L: "#9ad35a", g: "#3b7a28", w: "#ffffff", k: "#141414" };

export const sprites = lazy(() => {
  const stand = makeStand(true), standClosed = makeStand(false);
  return {
    lamp: gridSprite(LAMP_ROWS, { O: "#1b1f2a", M: "#3d4456", L: "#6b7690", g: "#6f8aa0", G: "#a8c6d8", W: "#e2f2fb" }),
    lampLit: gridSprite(LAMP_ROWS, { g: "#ffb347", G: "#ffd873", W: "#fffbe0" }),
    flames: FLAME_ROWS.map((r) => gridSprite(r, { o: P.fire[0], O: P.fire[1], y: P.fire[2], w: P.fire[3], W: P.fire[4] })),
    camp: makeCampBase(),
    stand, standClosed,
    standHover: outlineOf(stand, "#fff3c4"),
    standGlass: (() => { const b = new Buf(3, 4); b.rect(0, 0, 3, 4, "#ffd36b"); b.set(1, 1, "#fff3c4"); b.set(1, 2, "#fff3c4"); return b.canvas(); })(),
    frog: gridSprite(["...OOOOO.", "..OwkOwkO", ".OGLLGGGO", "OGLGGGGgO", "OgGGGGggO", ".OO.OO.OO"], FROG_PAL),
    frogBlink: gridSprite(["...OOOOO.", "..OGGOGGO", ".OGLLGGGO", "OGLGGGGgO", "OgGGGGggO", ".OO.OO.OO"], FROG_PAL),
    frogHop: gridSprite(["...OOOOO.", "..OwkOwkO", ".OGLLGGGO", "OGLGGGGgO", ".OgGGGgO.", "OO.....OO"], FROG_PAL),
    butterflies: ["#fff6e0", "#ffd84a", "#ff9a3c"].map((c) => [gridSprite(["w.w", "wbw"], { w: c, b: "#5a3a2a" }), gridSprite([".w.", ".b."], { w: c, b: "#5a3a2a" })]),
    leaves: [gridSprite(["oy"], { o: "#d9702a", y: "#ffbf4a" }), gridSprite(["o", "y"], { o: "#d9702a", y: "#ffbf4a" }), gridSprite(["ry"], { r: "#b8402a", y: "#e88a2a" })],
    zed: gridSprite(["ZZZ", "..Z", ".Z.", "Z..", "ZZZ"], { Z: "#dce6ff" }),
    mushroom: gridSprite([".OOO.", "OrWrO", "OrrrO", ".OsO.", ".OsO."], { O: "#5a1a1a", r: "#d83a3a", W: "#fff4e0", s: "#efe2c4" }),
    flowers: [
      gridSprite(["r.r", "rRr", ".r."], { r: "#d8405a", R: "#ff8aa0" }),
      gridSprite([".w.", "wyw", ".w."], { w: "#fbfaf0", y: "#f2b632" }),
      gridSprite(["b.b", "bBb", ".b."], { b: "#5a8de0", B: "#b3d1ff" }),
      gridSprite([".y.", "yoy", ".y."], { y: "#f7d046", o: "#c27428" }),
      gridSprite([".p.", "pPp", ".p."], { p: "#e46cb0", P: "#ffc6e6" })
    ]
  };
});

// Decorado de temporada (eventos de src/lib/seasons.js).
const PUMPKIN_ROWS = ["...s...", ".ppppp.", "pFpppFp", "ppppppp", "pFFFFFp", ".ppppp."];
export const FEST = ["#f454a7", "#ffd166", "#45d8ff", "#3fff97", "#ff8a3c"];
export const seasonSprites = lazy(() => ({
  snowman: outlinedSprite(["..hhhhh..", "..hhhhh..", ".HHHHHHH.", "..wwwws..", ".wwkwkws.", ".wwwwnns.", "..wwwws..", "rrrrrrrr.", ".wwwwwws.", "wwwwbwwss", "wwwwwwwss", "wwwwbwwss", ".wwwwwss."], { h: "#2a2a3a", H: "#3a3a4e", w: "#f4f9ff", s: "#cfe0ee", k: "#1a1a2a", n: "#ff8a2a", r: "#d9434a", b: "#3a3a4e" }, "#5f7590"),
  pumpkin: outlinedSprite(PUMPKIN_ROWS, { s: "#4a7a2a", p: "#e8822a", F: "#ffd36b" }, "#6a2a0e"),
  pumpkinGlow: gridSprite(PUMPKIN_ROWS, { F: "#ffe48a" }),
  bats: [gridSprite(["O.....O", "OO.O.OO", "..OOO.."], { O: "#1a1426" }), gridSprite(["..O.O..", "OOOOOOO", "O.....O"], { O: "#1a1426" })],
  wisp: gridSprite(["..ww.", ".wwww", "wkwkw", "wwwww", "wwwww", "w.w.w"], { w: "#eef0ff", k: "#3d4185" }),
  gifts: ["#e84a5f", "#45d8ff", "#3fff97"].map((c) => outlinedSprite(["..y..", "ccycc", "ccycc", "ccycc"], { c, y: "#ffd166" }, "#2a1a2a")),
  cake: outlinedSprite(["..c.c.c..", ".WWWWWWW.", ".PPPPPPP.", ".WWWWWWW."], { c: "#f4f4f4", W: "#fff1e4", P: "#f454a7" }, "#5a2a3a"),
  duck: outlinedSprite(["...yy.", "..yyko", "y.yyy.", "yyyyyy", ".yyyy."], { y: "#ffd84a", k: "#1a1a1a", o: "#ff8a2a" }, "#8a6a10"),
  balloons: new Map()
}));
export function balloonSprite(c) {
  const cache = seasonSprites().balloons;
  let img = cache.get(c);
  if (!img) { img = outlinedSprite([".cc.", "cHcc", "cccc", ".cc."], { c, H: "#ffffff" }, "#2a1a2a"); cache.set(c, img); }
  return img;
}
