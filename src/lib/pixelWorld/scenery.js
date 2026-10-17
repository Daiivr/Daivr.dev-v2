import { Buf, bayer, flipped, makeCanvas, px, rect, rng } from "./core.js";
import { makeBush, makeOak, makePine } from "./foliage.js";
import { H, MEADOW, PATH } from "./layout.js";
import { P, currentSeason, hazed, hillColors } from "./palette.js";

// Arboles en tres filas: los de atras pequeños y velados por el aire.
const TREE_DIM = { oak: { back: [24, 28], far: [30, 36], near: [40, 46] }, pine: { back: [17, 32], far: [21, 40], near: [27, 50] } };
export const TREE_BASE = { back: 62, far: 65, near: 69 };
const TREE_HAZE = { back: 0.42, far: 0.18, near: 0 };
const BUSH_DIM = { shrub: [18, 9], bush: [24, 12], berry: [26, 13] };

const artCache = new Map();
export function clearArtCache() { artCache.clear(); capsCache.clear(); }

export function treeArt(tree) {
  const season = currentSeason();
  const key = [tree.k, tree.d, tree.seed, tree.flip ? 1 : 0, tree.blossom ? 1 : 0, season].join("-");
  let art = artCache.get(key);
  if (art) return art;
  const [w, h] = TREE_DIM[tree.k][tree.d], hz = TREE_HAZE[tree.d];
  art = tree.k === "oak"
    ? makeOak(tree.seed, w, h, hazed(P.leaf, hz), hazed(P.bark, hz), tree.blossom && season !== "winter")
    : makePine(tree.seed, w, h, hazed(P.pine, hz), hazed(P.bark, hz));
  if (tree.flip) art = { ...art, c: flipped(art.c) };
  if (season === "winter") art = { ...art, c: snowify(art.c) };
  artCache.set(key, art);
  return art;
}

export function bushArt(bush) {
  const key = "bush-" + bush.k + "-" + bush.seed + "-" + currentSeason();
  let c = artCache.get(key);
  if (!c) {
    const [w, h] = BUSH_DIM[bush.k];
    c = makeBush(bush.seed, w, h, P.leaf, bush.k === "berry");
    if (currentSeason() === "winter") c = snowify(c);
    artCache.set(key, c);
  }
  return c;
}

// Colinas lejanas en dos capas, tras el bosque: opacas, para que el sol y la
// luna de FooterSky se escondan detras al salir y al ponerse.
export function buildHills(W, seed) {
  const R = rng(seed), b = new Buf(W, H);
  function layer(base, rMin, rMax, fill, edge, shade) {
    const top = new Float32Array(W).fill(H);
    for (let x = -rMax; x < W + rMax;) {
      const r = rMin + R() * (rMax - rMin), cy = base - R() * 4;
      for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        if (xx < 0 || xx >= W) continue;
        top[xx] = Math.min(top[xx], cy - Math.sqrt(Math.max(0, r * r - (xx - x) ** 2)) * 0.8);
      }
      x += r * 1.15;
    }
    for (let x = 0; x < W; x++) {
      const ty = Math.round(top[x]), rising = x > 0 && Math.round(top[x - 1]) > ty, falling = x < W - 1 && Math.round(top[x + 1]) > ty;
      for (let y = ty; y < H; y++) {
        let c = fill;
        if (y === ty) c = rising || !falling ? edge : fill;
        else if (falling && y < ty + 3) c = shade;
        else if (y > ty + 4 && bayer(x, y) < 0.3) c = shade;
        b.set(x, y, c);
      }
    }
  }
  const [far, mid] = hillColors();
  layer(50, 5, 10, far[0], far[1], far[2]);
  layer(56, 4, 8, mid[0], mid[1], mid[2]);
  return b.canvas();
}

// Prado y sendero: hierba con matas, borde de cesped sobre la tierra,
// piedrecitas y tres losas en el camino.
export function buildGround(W, L, trees, seed) {
  const R = rng(seed), b = new Buf(W, H), G = P.grass, D = P.dirt, S = P.stone;
  for (let y = MEADOW; y < H; y++) for (let x = 0; x < W; x++) {
    let c = D[2];
    if (y < PATH) c = y === MEADOW ? G[3] : y <= MEADOW + 2 ? (bayer(x, y) < 0.5 ? G[1] : G[2]) : G[2];
    b.set(x, y, c);
  }
  for (const tree of trees) {
    if (tree.d === "back") continue;
    const rx = Math.round(tree.art.w * 0.38), by = TREE_BASE[tree.d];
    for (let dx = -rx; dx <= rx; dx++) { b.set(tree.x + dx, by, G[1]); if (Math.abs(dx) < rx - 2) b.set(tree.x + dx, by + 1, G[1]); }
  }
  for (let i = 0; i < W * 0.5; i++) {
    const x = Math.floor(R() * W), y = MEADOW + 3 + Math.floor(R() * (PATH - MEADOW - 4));
    if (R() < 0.5) { b.set(x, y, G[1]); b.set(x + 2, y, G[1]); b.set(x + 1, y + 1, G[1]); b.set(x, y - 1, G[3]); b.set(x + 2, y - 1, G[3]); }
    else b.set(x, y, R() < 0.5 ? G[3] : G[4]);
  }
  for (let x = 0; x < W; x++) {
    const lip = 1 + (R() < 0.35 ? 1 : 0) + (R() < 0.1 ? 1 : 0);
    for (let k = 0; k < lip; k++) b.set(x, PATH + k, k === lip - 1 ? G[1] : G[2]);
    b.set(x, PATH + lip, D[1]);
  }
  for (let i = 0; i < W * 0.35; i++) {
    const x = Math.floor(R() * W), y = PATH + 4 + Math.floor(R() * (H - PATH - 6));
    b.set(x, y, R() < 0.55 ? D[3] : D[1]);
    if (R() < 0.3) b.set(x + 1, y, D[3]);
  }
  for (let i = 0; i < W / 18; i++) {
    const x = Math.floor(R() * W), y = PATH + 4 + Math.floor(R() * (H - PATH - 7));
    b.set(x, y, S[3]); b.set(x + 1, y, S[4]); b.set(x + 2, y, S[2]); b.set(x, y + 1, S[1]); b.set(x + 1, y + 1, S[1]); b.set(x + 2, y + 1, S[0]);
  }
  for (let x = 0; x < W; x++) { b.set(x, H - 1, D[1]); if (bayer(x, H - 2) < 0.5) b.set(x, H - 2, D[1]); }
  for (const sx of L.stones) {
    const w = 7, h = 4, y0 = PATH + 2;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (j === 0 && (i === 0 || i === w - 1)) continue;
      let c = S[2];
      if (i === 0 || i === w - 1 || j === h - 1) c = S[0];
      else if (j === 0) c = S[3];
      else if (j === h - 2) c = S[1];
      b.set(sx + i, y0 + j, c);
    }
    b.set(sx + 1, y0, S[4]); b.set(sx + 2, y0, S[4]);
  }
  return b.canvas();
}

const blockedAt = (L, x, pad = 0) => L.clear.some(([a, z]) => x > a - pad && x < z + pad);

export function makeFlowers(W, L, R, count) {
  const out = [], n = Math.round(W / 11);
  for (let i = 0; i < n; i++) {
    const x = 4 + Math.floor(R() * (W - 8));
    if (blockedAt(L, x, 2)) continue;
    out.push({ x, y: PATH - 1 - Math.floor(R() * 6), type: Math.floor(R() * count), stem: 2 + Math.floor(R() * 2) });
  }
  return out.sort((a, b) => a.y - b.y);
}

// Matas de hierba: una fila al borde del prado (detras de todo) y otra en el
// sendero, delante, que se aplasta cuando alguien la pisa.
export function makeTufts(W, L, R) {
  const out = [];
  for (let x = 3; x < W; x += 7 + Math.floor(R() * 7)) out.push({ x, y: PATH + 1, lane: false, p: R() * 6 });
  for (let x = 10; x < W; x += 16 + Math.floor(R() * 14)) if (!blockedAt(L, x)) out.push({ x, y: H - 1, lane: true, p: R() * 6 });
  return out;
}

// Rafagas de viento que pasan de derecha a izquierda.
export function swayAt(t, x, wind) {
  const v = Math.sin(t * 0.85 + x * 0.02) * 0.6 + Math.sin(t * 0.37 + x * 0.007) * 0.4;
  if (v > 1 - wind * 0.55) return v > 1 - wind * 0.25 ? -2 : -1;
  if (v < -0.93) return 1;
  return 0;
}
// La copa se dobla por tramos: arriba mas, el tronco nada.
export function drawSway(g, img, x, y, ch, s) {
  const a = Math.round(ch * 0.35), b = Math.round(ch * 0.7), w = img.width;
  g.drawImage(img, 0, 0, w, a, x + s, y, w, a);
  g.drawImage(img, 0, a, w, b - a, x + (s <= -2 ? -1 : 0), y + a, w, b - a);
  g.drawImage(img, 0, b, w, img.height - b, x, y + b, w, img.height - b);
}
export function drawTuft(g, tuft, lean, flat) {
  const G = P.grass, x = tuft.x, y = tuft.y;
  if (flat) { rect(g, x - 2, y - 1, 5, 1, G[1]); px(g, x - 1, y - 2, G[2]); px(g, x + 1, y - 2, G[3]); return; }
  px(g, x, y - 1, G[1]); px(g, x, y - 2, G[2]); px(g, x + lean, y - 3, G[3]); px(g, x + lean, y - 4, G[4]);
  px(g, x - 1, y - 1, G[1]); px(g, x - 2 + lean, y - 2, G[3]);
  px(g, x + 1, y - 1, G[1]); px(g, x + 2 + lean, y - 2, G[3]);
}

// La nieve se posa en cada borde que mira al cielo.
export function snowify(src, capsOnly) {
  const w = src.width, h = src.height, d = src.getContext("2d").getImageData(0, 0, w, h).data;
  const [c, g] = makeCanvas(w, h);
  if (!capsOnly) g.drawImage(src, 0, 0);
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!A(x, y) || A(x, y - 1)) continue;
    px(g, x, y, "#f4f9ff");
    if (A(x, y + 1) && (A(x - 1, y) || A(x + 1, y))) px(g, x, y + 1, "#d6e6f3");
  }
  return c;
}
const capsCache = new Map();
export const snowCaps = (src) => {
  let c = capsCache.get(src);
  if (!c) { c = snowify(src, true); capsCache.set(src, c); }
  return c;
};
