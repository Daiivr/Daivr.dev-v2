import { mix, outlinedSprite } from "./core.js";

// Iconos de las 27 capturas (shared/buddy-catches.mjs) al estilo Stardew: cada
// pez en diagonal (cola abajo a la izquierda, morro arriba a la derecha),
// generado desde un perfil de cuerpo con sombreado lomo-vientre, franja de
// brillo, aletas con radios, agalla, ojo con brillo y contorno oscuro.
const FISH = {
  "byte-minnow": { W: 2.3, len: 0.78, tail: "fork", fin: 0.6, c: ["#1d6fa0", "#45d8ff", "#8eeaff", "#e6fbff", "#7fd8f0"], pat: "line", p: "#1d6fa0" },
  "cache-carp": { W: 3.5, len: 0.92, tail: "round", fin: 0.8, c: ["#1f7a4a", "#3fcf7f", "#7ce8a8", "#e6f8d8", "#ffd166"], pat: "scales", whisk: 1, p: "#1f7a4a" },
  "pixel-perch": { W: 3.4, len: 0.84, tail: "fork", fin: 1.2, spiky: true, c: ["#a8761a", "#ffd166", "#ffe7a0", "#fff6dc", "#ff8a3c"], pat: "bars", p: "#6a4a14" },
  "buffer-bass": { W: 3.3, len: 0.96, tail: "fork", fin: 1, c: ["#2a6a7a", "#67e8f9", "#a8f2fb", "#effdff", "#3fa8b8"], pat: "band", p: "#1f4a5a", bigMouth: true },
  "cursor-guppy": { W: 2.1, len: 0.62, tail: "fan", tailW: 2.1, fin: 0.5, c: ["#a8b8b0", "#f4fff8", "#ffffff", "#ffffff", "#45d8ff"], pat: "tailspots", p: "#ff7ac8" },
  "ping-sardine": { W: 2.2, len: 0.96, tail: "fork", fin: 0.5, c: ["#2a7a6a", "#73ffad", "#c8ffe0", "#f4fff8", "#a8f0c8"], pat: "dots", p: "#1f5a4a" },
  "syntax-salmon": { W: 3.1, len: 1, tail: "fork", fin: 0.7, c: ["#b8404a", "#ff8c69", "#ffb8a0", "#fff0e8", "#e86a5a"], pat: "spots", p: "#6a2028", hook: true },
  "neon-tetra": { W: 2.5, len: 0.76, tail: "fork", fin: 0.6, c: ["#22285a", "#3a4a8a", "#8a9ad8", "#f0e8ff", "#c8d0f0"], pat: "neon", p: "#45d8ff", p2: "#ff3d9d" },
  "circuit-catfish": { W: 3.2, len: 1, tail: "round", fin: 0.5, c: ["#1a4a3a", "#2f8a62", "#5ab88a", "#d8f0e0", "#2a6a50"], pat: "circuit", p: "#3fff97", whisk: 2, nose: 1.6 },
  "cobalt-cod": { W: 3.6, len: 1, tail: "round", fin: 0.9, fin2: true, c: ["#22408a", "#4f8cff", "#8ab4ff", "#eef4ff", "#3a6ad8"], whisk: 1, p: "#16306a" },
  "packet-puffer": { puffer: true, c: ["#b8802a", "#ffd166", "#ffe7a0", "#fff6d8", "#ffb04a"], p: "#7a5014" },
  "void-eel": { W: 1.6, len: 1.18, tail: "none", fin: 0.35, eel: true, c: ["#3a2a6a", "#a78bfa", "#c8b8ff", "#ece6ff", "#7a5ad8"], pat: "glowline", p: "#f0e8ff" },
  "glitch-koi": { W: 3.2, len: 0.95, tail: "fan", fin: 0.6, c: ["#c8b8c0", "#ffffff", "#ffffff", "#fff4f8", "#ffd8ec"], pat: "koi", p: "#ff3d9d", p2: "#ff8a3c", glitch: true },
  "recursion-ray": { ray: true, W: 6.4, len: 0.9, c: ["#1f6fa0", "#45d8ff", "#8eeaff", "#e6fbff", "#2a8ab0"], p: "#e6fbff" },
  "firewall-fangfish": { W: 3.6, len: 0.92, tail: "fork", fin: 1.3, spiky: true, c: ["#8a1a2a", "#ff5f68", "#ff9a8a", "#ffe0d8", "#ff9a3c"], pat: "flame", p: "#ff9a3c", p2: "#ffd166", fangs: true, nose: 1.5 },
  "prism-piranha": { W: 4.3, len: 0.8, tail: "fork", fin: 0.7, c: ["#8a2a7a", "#f472d0", "#ffb0e8", "#ffe8f6", "#c84aa8"], pat: "prism", fangs: true, nose: 1.7 },
  starfin: { W: 3.4, len: 1, tail: "fan", tailW: 1.7, fin: 1.5, c: ["#b8862a", "#ffd166", "#ffe7a0", "#fff6dc", "#fff0af"], pat: "stars", p: "#ffffff" },
  "crown-coelacanth": { W: 3.7, len: 1.05, tail: "fan", fin: 0.9, lobes: true, c: ["#7a5a1a", "#f6c453", "#ffe08a", "#fff3d0", "#c8902a"], pat: "scales", crown: true, p: "#ffd166" },
  "aurora-arowana": { W: 2.6, len: 1.15, tail: "fan", tailW: 1.4, fin: 0.7, c: ["#1f6a5a", "#67e8f9", "#a8f2fb", "#f0fdff", "#9ff0e8"], pat: "aurora", whisk: 1, p: "#1f6a5a" },
  "chrono-manta": { ray: true, manta: true, W: 7, len: 0.8, c: ["#5a2a8a", "#c084fc", "#e0c0ff", "#f4e8ff", "#8a5ad8"], p: "#ffffff" },
  "moonkernel-sturgeon": { W: 2.8, len: 1.15, tail: "fork", fin: 0.5, c: ["#5a6a7a", "#c8d4dc", "#e8eef2", "#ffffff", "#9aa8b4"], pat: "scutes", moon: true, snout: true, whisk: 1, p: "#ffffff" }
};
const N = 18;
const hash2 = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
const grid = () => Array.from({ length: N }, () => Array(N).fill("."));

function diagFish(S) {
  const g = grid();
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2, nx = -Math.SQRT1_2, ny = -Math.SQRT1_2;
  const L = 15.2 * (S.len || 1), tl = S.tail === "none" ? 0 : 0.3, start = -L * (1 + tl) / 2;
  const wAt = (u) => {
    if (u < 0 || u > 1) return 0;
    const front = u > 0.5 ? Math.pow(Math.max(0, 1 - Math.pow((u - 0.5) / 0.5, 2)), 0.5 / (S.nose || 1) * 1.2) : 1;
    const back = u < 0.5 ? 0.3 + 0.7 * Math.pow(u / 0.5, 0.75) : 1;
    return S.W * Math.min(front, back);
  };
  const info = new Map();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const rx = x + 0.5 - N / 2, ry = y + 0.5 - N / 2, s = rx * dx + ry * dy;
    let v = rx * nx + ry * ny;
    const u = (s - start - L * tl) / L;
    if (S.eel) v += Math.sin(u * Math.PI * 3) * 1.1;
    let ch = null;
    const w = wAt(u) * (v < 0 ? 1.12 : 1);
    if (u >= 0 && u <= 1 && Math.abs(v) <= w) {
      const q = v / Math.max(0.5, w);
      ch = q > 0.55 ? "B" : q > 0.1 ? "b" : q > -0.35 ? "s" : "w";
      if (q > 0.25 && q < 0.48 && u > 0.22 && u < 0.84) ch = "h";
      if (u > 0.64 && u < 0.7 && Math.abs(q) < 0.6) ch = "d";
      info.set(x + "," + y, { u, q, v });
    } else if (u < 0 && u >= -tl && S.tail !== "none") {
      const t = -u / tl, ws = S.W * (0.35 + t * (S.tailW || 1.25));
      const inside = S.tail === "fork" ? Math.abs(v) <= ws && !(t > 0.5 && Math.abs(v) < (t - 0.5) * S.W * 1.7) : Math.abs(v) <= ws * (S.tail === "round" ? Math.sqrt(1 - t * t * 0.3) : 1);
      if (inside) ch = Math.round(v * 1.4) % 2 ? "r" : "f";
    } else if (S.fin && v > 0 && u > 0.28 && u < 0.72) {
      const q2 = (u - 0.28) / 0.44, h = S.fin * S.W * Math.pow(Math.sin(Math.PI * q2), 0.8) * (1 - 0.35 * q2);
      if (v <= wAt(u) + h) ch = S.spiky && (Math.round(s * 1.4) % 2) ? "r" : "f";
    } else if (v < 0 && u > 0.42 && u < 0.62) {
      const h = 0.5 * S.W * Math.sin(Math.PI * (u - 0.42) / 0.2);
      if (-v <= wAt(u) * 1.12 + h) ch = "f";
    }
    if (S.fin2 && v > 0 && u > 0.72 && u < 0.9 && !ch) { const h = 0.6 * S.W * Math.sin(Math.PI * (u - 0.72) / 0.18); if (v <= wAt(u) + h) ch = "f"; }
    if (S.snout && u > 1 && u < 1.14 && Math.abs(v) < 0.7) ch = "b";
    if (ch) g[y][x] = ch;
  }
  const set = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = ch; };
  const at = (u, q) => { const s = start + L * tl + u * L, v = q * wAt(u); return [N / 2 + s * dx + v * nx - 0.5, N / 2 + s * dy + v * ny - 0.5]; };
  for (const [k, I] of info) {
    const [x, y] = k.split(",").map(Number), c = g[y][x];
    if (c === "d" || c === "w") { if (S.pat !== "koi" || c === "d") continue; }
    switch (S.pat) {
      case "line": if (Math.abs(I.q) < 0.14) g[y][x] = "p"; break;
      case "band": if (I.q > -0.15 && I.q < 0.2) g[y][x] = "p"; break;
      case "bars": if (Math.floor(I.u * 7) % 2 && I.q > -0.35) g[y][x] = "p"; break;
      case "spots": if (I.q > 0.05 && hash2(x, y) % 5 === 0) g[y][x] = "p"; break;
      case "dots": if (Math.abs(I.q) < 0.14 && (x + y) % 2 === 0) g[y][x] = "p"; break;
      case "neon": if (I.q > -0.08 && I.q < 0.3) g[y][x] = "p"; else if (I.u < 0.55 && I.q <= -0.08) g[y][x] = "o"; break;
      case "scales": if ((x + y) % 2 === 0 && I.q > -0.35 && I.q < 0.55 && I.u < 0.64) g[y][x] = "l"; break;
      case "circuit": if ((I.q > 0.3 && I.q < 0.42) || (I.q > -0.22 && I.q < -0.1) || (Math.floor(I.u * 9) % 3 === 1 && I.q > -0.1 && I.q < 0.3)) g[y][x] = "p"; break;
      case "koi": { const n = hash2(Math.floor(x / 2), Math.floor(y / 2)) % 7; if (n < 2) g[y][x] = "p"; else if (n === 3) g[y][x] = "o"; break; }
      case "flame": if (I.q > 0.15) g[y][x] = (x + y) % 3 ? "p" : "o"; break;
      case "prism": if (I.q > -0.35) g[y][x] = "1234567"[Math.floor(I.u * 6) % 6]; break;
      case "aurora": if (I.q > -0.35 && c !== "h") g[y][x] = I.u < 0.36 ? "A" : I.u < 0.68 ? "C" : "V"; break;
      case "stars": if (hash2(x, y) % 9 === 0) g[y][x] = "p"; break;
      case "scutes": if ((I.q > 0.55 || Math.abs(I.q) < 0.08) && (x + y) % 3 === 0) g[y][x] = "p"; break;
      case "glowline": if (Math.abs(I.q) < 0.2) g[y][x] = "p"; break;
      default: break;
    }
  }
  if (S.pat === "tailspots" || S.pat === "stars") for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((g[y][x] === "f" || g[y][x] === "r") && hash2(x, y) % 3 === 0) g[y][x] = "p";
  if (S.lobes) for (const [u, q] of [[0.45, 1.25], [0.6, -1.3], [0.75, 1.15], [0.3, -1.2]]) { const [x, y] = at(u, q); set(x, y, "f"); set(x + 1, y, "f"); set(x, y + 1, "f"); set(x + 1, y + 1, "r"); }
  const [ex, ey] = at(0.81, 0.3);
  set(ex, ey, "e"); set(ex - 1, ey, "k");
  const [mx, my] = at(0.99, -0.25);
  set(mx, my, "e");
  if (S.bigMouth) set(mx - 1, my + 1, "e");
  if (S.hook) set(mx + 1, my + 1, "B");
  if (S.fangs) { set(mx - 1, my, "k"); set(mx, my + 1, "k"); }
  if (S.whisk) { set(mx + 1, my + 1, "p"); set(mx + 2, my + 2, "p"); if (S.whisk > 1) { set(mx, my + 2, "p"); set(mx, my + 3, "p"); } }
  if (S.crown) { const [cx, cy] = at(0.74, 1.05); for (const [ox, oy] of [[0, 0], [-1, -1], [1, -2], [2, -1], [0, -3], [-2, -2]]) set(cx + ox, cy + oy, oy <= -2 ? "y" : "Y"); }
  if (S.moon) { const [cx, cy] = at(0.48, 0.05); set(cx, cy, "m"); set(cx + 1, cy, "m"); set(cx, cy + 1, "m"); set(cx + 1, cy - 1, "m"); }
  if (S.glitch) {
    const rows = g.map((r) => r.slice());
    for (let y = 6; y < 9; y++) for (let x = N - 1; x > 0; x--) g[y][x] = rows[y][x - 1];
    for (let y = 6; y < 9; y++) { const fx = g[y].findIndex((c) => c !== "."); if (fx > 0) g[y][fx - 1] = "c"; }
  }
  return g.map((r) => r.join(""));
}

function rayIcon(S) {
  const g = grid();
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2, nx = -Math.SQRT1_2, ny = -Math.SQRT1_2, L = 15 * S.len;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const rx = x + 0.5 - N / 2, ry = y + 0.5 - N / 2, s = rx * dx + ry * dy + 2, v = rx * nx + ry * ny, u = (s + L / 2) / L;
    if (u >= 0 && u <= 1) {
      const w = S.W * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
      if (Math.abs(v) <= w) { const q = Math.abs(v) / Math.max(0.5, w); g[y][x] = u > 0.78 && Math.abs(v) < 1.6 ? "b" : q > 0.75 ? "B" : q > 0.45 ? "b" : u > 0.5 ? "s" : "h"; }
    } else if (u < 0 && u > -0.5 && Math.abs(v) < 0.6) g[y][x] = u > -0.1 ? "B" : "r";
  }
  const at = (u, v) => { const s = u * L - L / 2 - 2; return [Math.round(N / 2 + s * dx + v * nx - 0.5), Math.round(N / 2 + s * dy + v * ny - 0.5)]; };
  for (const v of [1.4, -1.4]) { const [x, y] = at(0.86, v); if (g[y] && g[y][x] !== ".") g[y][x] = "e"; }
  if (S.manta) {
    for (const v of [1.6, -1.6]) { const [x, y] = at(1.06, v); g[y][x] = "B"; const [x2, y2] = at(1.12, v * 1.1); if (g[y2]) g[y2][x2] = "B"; }
    const [cx, cy] = at(0.45, 0);
    for (const [ox, oy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, -2], [2, 0], [0, 2], [-2, 0]]) g[cy + oy][cx + ox] = Math.abs(ox) + Math.abs(oy) === 2 && (ox === 0 || oy === 0) ? "w" : "k";
    g[cy][cx] = "e"; g[cy - 1][cx] = "e"; g[cy][cx + 1] = "e";
  } else {
    for (const k of [0.55, 0.28]) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const rx = x + 0.5 - N / 2, ry = y + 0.5 - N / 2, s = rx * dx + ry * dy + 2, v = rx * nx + ry * ny, u = (s + L * k / 2 - L * 0.05) / (L * k);
      if (u < 0 || u > 1 || g[y][x] === ".") continue;
      const w = S.W * k * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
      if (Math.abs(Math.abs(v) - w) < 0.55) g[y][x] = "p";
    }
  }
  return g.map((r) => r.join(""));
}

function pufferIcon() {
  const g = grid(), cx = 9.6, cy = 8.4, R = 5.4;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const vx = x + 0.5 - cx, vy = y + 0.5 - cy, d = Math.hypot(vx, vy);
    if (d <= R) { const l = (-vx * 0.55 - vy * 0.83) / R; g[y][x] = vy > R * 0.45 ? "w" : l > 0.45 ? "h" : l > -0.1 ? "b" : "B"; }
  }
  for (let a = 0; a < 12; a++) {
    const ang = a / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(ang) * (R + 1) - 0.5), y = Math.round(cy + Math.sin(ang) * (R + 1) - 0.5);
    if (g[y] && g[y][x] === ".") g[y][x] = "p";
  }
  for (const [x, y] of [[3, 13], [2, 14], [3, 14], [2, 15], [1, 15], [4, 14]]) g[y][x] = "f";
  g[7][12] = "e"; g[7][13] = "e"; g[6][12] = "k"; g[9][14] = "e"; g[10][14] = "p";
  for (const [x, y] of [[9, 10], [10, 11], [11, 11]]) g[y][x] = "f";
  return g.map((r) => r.join(""));
}

const JUNK = {
  "old-boot": [["....BBBBB.....", "....BhBBB.....", "....BhBwB.....", "....BhBBB.....", "....BhBwB.....", "....BhBBB.....", "...BBhBwB.....", "...BBBBBBBBB..", "..BBhhhBBBBBB.", ".BBBBBBBBBBBBB", ".BhBBBBBBBBBBB", ".SSSSSSSSSSSSS", "..g.......d...", "..gg.........."], { B: "#6a7a70", h: "#9aaca2", w: "#e8e4d0", S: "#3a443e", g: "#3fa86a", d: "#9fd8f0" }],
  "soggy-disk": [["DDDDDDDDDDDD", "DMMMMMMSSkDD", "DMMMMMMSSkDD", "DMMMMMMSSSDD", "DDDDDDDDDDDD", "DwwwwwwwwwwD", "DwkkkkkkwwwD", "DwwwwwwwwwwD", "DwkkkkwwwwwD", "DwwwwwwwwwwD", "DDDDDDDDDDDD", "..d.....d...", "..d........."], { D: "#3d6a58", M: "#2a4a3e", S: "#c0c8c4", k: "#9ab4a8", w: "#e8f4ee", d: "#9fd8f0" }],
  "cracked-controller": [["..hhhhhhhhhh..", ".GGGGGGGGGGGG.", "GGkGGGGGGGGrGG", "GkkkGGcGGrGrGG", "GGkGGGGcGGrGGG", "GGGGGGGGcGGGGG", "GGGGG....GGGGG", ".GGG......GGG."], { G: "#8b9a91", h: "#b8c8be", k: "#3a443e", r: "#e85a6a", c: "#2a2f2c" }],
  "rusty-can": [[".ssssss.", "sSSSSSSs", "RRRRRRRR", "RRyyyRRR", "RRRyRRrR", "RRyyyRrR", "RRRRyRRR", "RrRyyRRR", "RRRRRRrR", "RRrRRRRR", "sSSSSSSs", ".ssssss."], { s: "#c0c8c4", S: "#8a9490", R: "#9b7556", r: "#6a4a30", y: "#ffd166" }],
  "tangled-cable": [["..ccc....ccc.", ".c...c..c...c", ".c..ccc.c...c", "..cc.c.cc..c.", "....c.c.c.cc.", "...c..cc..c..", "..c..c..c..c.", "..c.c....cc..", "...cc..ccc...", ".....cc......", "....pp.......", "....pP......."], { c: "#58756a", p: "#ffd166", P: "#b88a2a" }],
  "wet-keyboard": [["KKKKKKKKKKKKKK", "KkKkKkKkKkKkKK", "KKkKkKkKkKkKkK", "KkKkKkKkKkKkKK", "KKkkkkkkkkkKKK", "KKKKKKKKKKKKKK", "..d......d....", "..d..........."], { K: "#70877b", k: "#d8e4dc", d: "#9fd8f0" }],
  "token-chest": [["..LLLLLLLLLL..", ".LlllllllllLL.", "LLllllllllllLL", "LLLLLLYYLLLLLL", "YYYYYYYYYYYYYY", "BbbbbbYYbbbbbB", "BbbbbbYkbbbbbB", "BbbbbbYYbbbbbB", "BbbbbbbbbbbbbB", "YbbbbbbbbbbbbY", "BBBBBBBBBBBBBB", ".D..........D."], { L: "#a56b39", l: "#c99550", Y: "#ffd166", k: "#3a2414", B: "#5a3a20", b: "#8d5831", D: "#3a2414" }]
};

export const isCatchArt = (id) => Boolean(FISH[id] || JUNK[id]);

function fishPal(S) {
  const [B, b, s, w, f] = S.c;
  return {
    B, b, s, w, h: mix(s, "#ffffff", 0.55), d: mix(B, b, 0.4), f, r: mix(f, B, 0.45), p: S.p || B, o: S.p2 || mix(b, "#ff8a3c", 0.5),
    e: "#0a0e18", k: "#ffffff", l: mix(s, "#ffffff", 0.5), m: "#fff8d8", y: "#fff0af", Y: "#ffd166", c: "#45d8ff",
    A: "#3fff97", C: "#67e8f9", V: "#c084fc", 1: "#ff5f68", 2: "#ff9a3c", 3: "#ffd166", 4: "#3fff97", 5: "#45d8ff", 6: "#a78bfa", 7: "#f472d0"
  };
}

const cache = new Map();
export function catchSprite(id) {
  let img = cache.get(id);
  if (img) return img;
  if (JUNK[id]) img = outlinedSprite(JUNK[id][0], JUNK[id][1], "#1d2a2a");
  else {
    const S = FISH[id] || FISH["byte-minnow"];
    const rows = S.puffer ? pufferIcon() : S.ray ? rayIcon(S) : diagFish(S);
    img = outlinedSprite(rows, fishPal(S), mix(S.c[0], "#05070c", 0.6));
  }
  cache.set(id, img);
  return img;
}

// Los mismos peces vistos de perfil (morro a la derecha) para el acuario del
// cuarto: el mismo perfil, aletas, dibujo y detalles que el icono, pero en
// horizontal, con dos fotogramas de nado (coletazo, o la ondulacion de la
// anguila; la raya, vista desde arriba, bate las alas; el globo agita la cola).
function sideFishGrid(S, ph) {
  const Wd = 28, Ht = 22, cx = 14, cy = 12, g = Array.from({ length: Ht }, () => Array(Wd).fill("."));
  const L = 13 * (S.len || 1), tl = S.tail === "none" ? 0 : S.tail === "fan" && (S.tailW || 0) > 2 ? 0.5 : 0.3, start = -L * (1 + tl) / 2;
  const wAt = (u) => {
    if (u < 0 || u > 1) return 0;
    const front = u > 0.5 ? Math.pow(Math.max(0, 1 - Math.pow((u - 0.5) / 0.5, 2)), 0.5 / (S.nose || 1) * 1.2) : 1;
    const back = u < 0.5 ? 0.3 + 0.7 * Math.pow(u / 0.5, 0.75) : 1;
    return S.W * Math.min(front, back);
  };
  const info = new Map();
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const s = x + 0.5 - cx;
    let v = cy - (y + 0.5);
    const u = (s - start - L * tl) / L;
    if (S.eel) v += Math.sin(u * Math.PI * 3 + ph) * 1.1;
    let ch = null;
    const w = wAt(u) * (v < 0 ? 1.12 : 1);
    if (u >= 0 && u <= 1 && Math.abs(v) <= w) {
      const q = v / Math.max(0.5, w);
      ch = q > 0.55 ? "B" : q > 0.1 ? "b" : q > -0.35 ? "s" : "w";
      if (q > 0.25 && q < 0.48 && u > 0.22 && u < 0.84) ch = "h";
      if (u > 0.64 && u < 0.7 && Math.abs(q) < 0.6) ch = "d";
      info.set(x + "," + y, { u, q });
    } else if (u < 0 && u >= -tl && S.tail !== "none") {
      const t = -u / tl, ws = S.W * (0.35 + t * (S.tailW || 1.25));
      const inside = S.tail === "fork" ? Math.abs(v) <= ws && !(t > 0.5 && Math.abs(v) < (t - 0.5) * S.W * 1.7) : Math.abs(v) <= ws * (S.tail === "round" ? Math.sqrt(1 - t * t * 0.3) : 1);
      if (inside) ch = Math.round(v * 1.4) % 2 ? "r" : "f";
    } else if (S.fin && v > 0 && u > 0.28 && u < 0.72) {
      const q2 = (u - 0.28) / 0.44, h = S.fin * S.W * Math.pow(Math.sin(Math.PI * q2), 0.8) * (1 - 0.35 * q2);
      if (v <= wAt(u) + h) ch = S.spiky && (Math.round(s * 1.4) % 2) ? "r" : "f";
    } else if (v < 0 && u > 0.42 && u < 0.62) {
      const h = 0.5 * S.W * Math.sin(Math.PI * (u - 0.42) / 0.2);
      if (-v <= wAt(u) * 1.12 + h) ch = "f";
    }
    if (S.fin2 && v > 0 && u > 0.72 && u < 0.9 && !ch) { const h = 0.6 * S.W * Math.sin(Math.PI * (u - 0.72) / 0.18); if (v <= wAt(u) + h) ch = "f"; }
    if (S.snout && u > 1 && u < 1.14 && Math.abs(v) < 0.7) ch = "b";
    if (ch) g[y][x] = ch;
  }
  const set = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < Wd && y < Ht) g[y][x] = ch; };
  const at = (u, q) => { const s = start + L * tl + u * L, v = q * wAt(u); return [cx + s - 0.5, cy - v - 0.5]; };
  for (const [k, I] of info) {
    const [x, y] = k.split(",").map(Number), c = g[y][x];
    if (c === "d" || c === "w") { if (S.pat !== "koi" || c === "d") continue; }
    switch (S.pat) {
      case "line": if (Math.abs(I.q) < 0.14) g[y][x] = "p"; break;
      case "band": if (I.q > -0.15 && I.q < 0.2) g[y][x] = "p"; break;
      case "bars": if (Math.floor(I.u * 7) % 2 && I.q > -0.35) g[y][x] = "p"; break;
      case "spots": if (I.q > 0.05 && hash2(x, y) % 5 === 0) g[y][x] = "p"; break;
      case "dots": if (Math.abs(I.q) < 0.14 && (x + y) % 2 === 0) g[y][x] = "p"; break;
      case "neon": if (I.q > -0.08 && I.q < 0.3) g[y][x] = "p"; else if (I.u < 0.55 && I.q <= -0.08) g[y][x] = "o"; break;
      case "scales": if ((x + y) % 2 === 0 && I.q > -0.35 && I.q < 0.55 && I.u < 0.64) g[y][x] = "l"; break;
      case "circuit": if ((I.q > 0.3 && I.q < 0.42) || (I.q > -0.22 && I.q < -0.1) || (Math.floor(I.u * 9) % 3 === 1 && I.q > -0.1 && I.q < 0.3)) g[y][x] = "p"; break;
      case "koi": { const n = hash2(Math.floor(x / 2), Math.floor(y / 2)) % 7; if (n < 2) g[y][x] = "p"; else if (n === 3) g[y][x] = "o"; break; }
      case "flame": if (I.q > 0.15) g[y][x] = (x + y) % 3 ? "p" : "o"; break;
      case "prism": if (I.q > -0.35) g[y][x] = "1234567"[Math.floor(I.u * 6) % 6]; break;
      case "aurora": if (I.q > -0.35 && c !== "h") g[y][x] = I.u < 0.36 ? "A" : I.u < 0.68 ? "C" : "V"; break;
      case "stars": if (hash2(x, y) % 9 === 0) g[y][x] = "p"; break;
      case "scutes": if ((I.q > 0.55 || Math.abs(I.q) < 0.08) && (x + y) % 3 === 0) g[y][x] = "p"; break;
      case "glowline": if (Math.abs(I.q) < 0.2) g[y][x] = "p"; break;
      default: break;
    }
  }
  if (S.pat === "tailspots" || S.pat === "stars") for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if ((g[y][x] === "f" || g[y][x] === "r") && hash2(x, y) % 3 === 0) g[y][x] = "p";
  if (S.lobes) for (const [u, q] of [[0.45, 1.25], [0.6, -1.3], [0.75, 1.15], [0.3, -1.2]]) { const [x, y] = at(u, q); set(x, y, "f"); set(x + 1, y, "f"); set(x, y + 1, "f"); set(x + 1, y + 1, "r"); }
  const [ex, ey] = at(0.81, 0.3);
  set(ex, ey, "e"); set(ex - 1, ey - 1, "k");
  const [mx, my] = at(0.99, -0.25);
  set(mx, my, "e");
  if (S.bigMouth) set(mx - 1, my + 1, "e");
  if (S.hook) set(mx + 1, my - 1, "B");
  if (S.fangs) { set(mx - 1, my + 1, "k"); set(mx, my + 1, "k"); }
  if (S.whisk) { set(mx + 1, my + 1, "p"); set(mx + 2, my + 2, "p"); if (S.whisk > 1) { set(mx - 1, my + 2, "p"); set(mx - 1, my + 3, "p"); } }
  if (S.crown) { const [kx, ky] = at(0.74, 1.05); for (const [ox, oy] of [[0, 0], [-1, -1], [1, -1], [0, -2], [-2, -2], [2, -2]]) set(kx + ox, ky + oy, oy <= -2 ? "y" : "Y"); }
  if (S.moon) { const [kx, ky] = at(0.48, 0.05); set(kx, ky, "m"); set(kx + 1, ky, "m"); set(kx, ky + 1, "m"); set(kx + 1, ky - 1, "m"); }
  if (S.glitch) {
    const rows = g.map((r) => r.slice());
    for (let y = cy - 3; y < cy; y++) {
      for (let x = Wd - 1; x > 0; x--) g[y][x] = rows[y][x - 1];
      const fx = g[y].findIndex((c) => c !== ".");
      if (fx > 0) g[y][fx - 1] = "c";
    }
  }
  return { g, tailEnd: Math.floor(cx + start + L * tl) };
}
function sideRayGrid(S, ph) {
  const Wd = 26, Ht = 20, cx = 14, cy = 10, g = Array.from({ length: Ht }, () => Array(Wd).fill(".")), L = 15 * S.len, W = S.W * (ph ? 0.84 : 1);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const s = x + 0.5 - cx + 2, v = cy - (y + 0.5), u = (s + L / 2) / L;
    if (u >= 0 && u <= 1) {
      const w = W * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
      if (Math.abs(v) <= w) { const q = Math.abs(v) / Math.max(0.5, w); g[y][x] = u > 0.78 && Math.abs(v) < 1.6 ? "b" : q > 0.75 ? "B" : q > 0.45 ? "b" : v > 0 ? "s" : "h"; }
    } else if (u < 0 && u > -0.5 && Math.abs(v + (ph && u < -0.25 ? 1 : 0)) < 0.6) g[y][x] = u > -0.1 ? "B" : "r";
  }
  for (const k of [0.55, 0.28]) for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const s = x + 0.5 - cx + 2, v = cy - (y + 0.5), u = (s + L * k / 2 - L * 0.05) / (L * k);
    if (u < 0 || u > 1 || g[y][x] === ".") continue;
    const w = W * k * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
    if (Math.abs(Math.abs(v) - w) < 0.55) g[y][x] = "p";
  }
  const at = (u, v) => { const s = u * L - L / 2 - 2; return [Math.round(cx + s - 0.5), Math.round(cy - v - 0.5)]; };
  for (const v of [1.4, -1.4]) { const [x, y] = at(0.86, v); if (g[y] && g[y][x] !== ".") g[y][x] = "e"; }
  return { g, tailEnd: 0 };
}
function sidePufferGrid(ph) {
  const Wd = 17, Ht = 15, cx = 9.4, cy = 7.5, R = 5.2, g = Array.from({ length: Ht }, () => Array(Wd).fill("."));
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const vx = x + 0.5 - cx, vy = y + 0.5 - cy, d = Math.hypot(vx, vy);
    if (d <= R) { const l = (-vx * 0.55 - vy * 0.83) / R; g[y][x] = vy > R * 0.45 ? "w" : l > 0.45 ? "h" : l > -0.1 ? "b" : "B"; }
  }
  for (let a = 0; a < 12; a++) {
    const ang = a / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(ang) * (R + 1) - 0.5), y = Math.round(cy + Math.sin(ang) * (R + 1) - 0.5);
    if (g[y] && g[y][x] === ".") g[y][x] = "p";
  }
  for (const [x, y] of ph ? [[2, 6], [1, 6], [1, 7], [0, 7], [2, 7], [1, 8]] : [[2, 7], [1, 7], [1, 8], [0, 8], [2, 8], [1, 6]]) g[y][x] = "f";
  for (const [x, y] of [[9, 9], [10, 10], [11, 10]]) g[y][x] = "f";
  g[5][12] = "e"; g[5][13] = "e"; g[4][12] = "k"; g[8][14] = "e"; g[9][14] = "p";
  return { g, tailEnd: 0 };
}

const sideCache = new Map();
export function sideFishFrames(id) {
  let f = sideCache.get(id);
  if (f) return f;
  const S = FISH[id] || FISH["byte-minnow"];
  let grids;
  if (S.puffer) grids = [sidePufferGrid(0), sidePufferGrid(1)];
  else if (S.ray) grids = [sideRayGrid(S, 0), sideRayGrid(S, 1)];
  else if (S.eel) grids = [sideFishGrid(S, 0), sideFishGrid(S, Math.PI)];
  else {
    // El segundo fotograma da el coletazo: la mitad de la cola baja una fila.
    const a = sideFishGrid(S, 0), b = { g: a.g.map((r) => r.slice()), tailEnd: a.tailEnd };
    for (let x = 0; x < a.tailEnd - 1; x++) for (let y = b.g.length - 1; y >= 0; y--) b.g[y][x] = y > 0 ? a.g[y - 1][x] : ".";
    grids = [a, b];
  }
  // Todos los fotogramas con el mismo recorte, para que el pez no tiemble.
  let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
  for (const { g } of grids) g.forEach((r, y) => r.forEach((c, x) => { if (c !== ".") { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  const pal = fishPal(S), out = mix(S.c[0], "#05070c", 0.6);
  const right = grids.map(({ g }) => outlinedSprite(g.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1).join("")), pal, out));
  f = { right, w: right[0].width, h: right[0].height, eel: Boolean(S.eel), ray: Boolean(S.ray), puffer: Boolean(S.puffer) };
  sideCache.set(id, f);
  return f;
}

export const CHEST_OPEN_ROWS = [".LLLLLLLLLLLL.", "LllllllllllllL", ".LLLLLLLLLLLL.", ".cCcCcCcCcCcc.", "BcCcCcCcCcCcCB", "YYYYYYYYYYYYYY", "BbbbbbYYbbbbbB", "BbbbbbYkbbbbbB", "BbbbbbYYbbbbbB", "BbbbbbbbbbbbbB", "YbbbbbbbbbbbbY", "BBBBBBBBBBBBBB", ".D..........D."];
let chestOpen;
export function chestOpenSprite() {
  return (chestOpen ??= outlinedSprite(CHEST_OPEN_ROWS, { L: "#a56b39", l: "#c99550", Y: "#ffd166", c: "#ffd166", C: "#fff0af", k: "#3a2414", B: "#5a3a20", b: "#8d5831", D: "#3a2414" }, "#2a1a0a"));
}
