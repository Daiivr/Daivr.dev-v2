import { Buf, N4, bayer, mix, rgb } from "../core.js";

// Pip, el Buddy en pixel art: un robot redondo de perfil con visor, dial en la
// oreja y bateria a la espalda. Es un muñeco de piezas: brazos, piernas y cada
// prenda cuelgan de anclas con nombre, asi que una prenda nueva es un dibujo
// pequeño y un hueco (slot), y el rig la lleva en todas las poses y en las dos
// direcciones. Se dibuja mirando a la derecha; mirando a la izquierda se espeja.
export const RIG_W = 36;
export const RIG_H = 40;
export const RIG_OY = 2;
// Columna de los pies dentro del sprite (mirando a la derecha) y alto de Pip
// desde la suela hasta lo alto de la antena.
export const RIG_FOOT_X = 17;
export const RIG_TALL = 39;

const PIP = {
  out: "#0f2f33", dark: "#24605a", mid: "#3f8f84", light: "#6fc4ad", hl: "#b8f0d8",
  visor: "#0a1f1c", visor2: "#0d2824", visorRim: "#173f39", glint: "#4f8f7f",
  eye: "#3fff97", eyeHl: "#eafff4", eyeDim: "#22a866", blush: "#ff83b7",
  led: "#45d8ff", ledHl: "#d6f8ff", ledOut: "#14465a", stem: "#24605a",
  limb: "#347a70", limbL: "#5fb39e", limbD: "#1f4f49",
  boot: "#1f4f49", bootL: "#6fc4ad", bootHl: "#d6f5e6", bootD: "#143633",
  pack: "#e8a33a", packD: "#a8691a", packL: "#ffd27a", power: "#3fff97", dial: "#45d8ff", dialD: "#1f6f93", dialL: "#c8f4ff"
};
const tones = (P) => [P.out, P.dark, P.mid, P.light, P.hl];
const D = {
  hip: { f: [18, 31], b: [16, 31] }, shoulder: { f: [18, 27], b: [16, 27] }, reach: 1,
  hat: [16, 11], top: 4, skull: 10, ears: [12, 18], scarf: { x0: 12, x1: 22, y: 24 },
  eyes: { n: [20, 16], f: [23, 16], m: [21, 20] }, ant: [[14, 10], [10, 15]]
};

// Gorros: filas de pixeles, paleta, contorno, cuanto se hunden en la cabeza.
export const HATS = {
  "party-hat": { rows: ["....w....", "...www...", "....P....", "...PPY...", "...PYP...", "..PPYPP..", "..PYPPY..", ".PPYPPYP.", ".PYPPYPP.", "PPYPPYPPY", "BBBBBBBBB"], pal: { w: "#f1fff6", P: "#f454a7", Y: "#ffe39b", B: "#4fd5e3" }, out: "#201624", sink: 0, dx: 0 },
  "star-cap": { rows: ["....CCCCC.......", "..CCcCCCCCC.....", ".CcCCCCSCCCC....", ".CCCCCSSSCCC....", "CCCCCCCSCCCCBBBB", "...........bbbbb"], pal: { C: "#278fa7", c: "#7de9ed", S: "#ffe397", B: "#45d8ff", b: "#17506e" }, out: "#0b2937", sink: 2, dx: 2 },
  "pixel-crown": { rows: ["Y....Y....Y", "YY..YYY..YY", "YlYYYYYYYlY", "YYpYYcYYpYY", "yyyyyyyyyyy"], pal: { Y: "#ffd166", l: "#fff0af", y: "#b58032", p: "#ff548b", c: "#45d8ff" }, out: "#573921", sink: 1, dx: 0 },
  "market-beanie": { rows: ["......oo.......", ".....oOOo......", "....GGGGGGG....", "..GGgGGgGGgGG..", ".GgGGgGGgGGgGG.", "GGGGGGGGGGGGGGG", "CcCcCcCcCcCcCcC"], pal: { o: "#f2ead2", O: "#ffffff", G: "#5f8f3a", g: "#8ab85a", C: "#3f6a2a", c: "#5a8a3a" }, out: "#1f3316", sink: 3, dx: 1 },
  "witch-hat": { rows: ["......pp.", ".....pp..", "....ppp..", "...pPpp..", "...ppPp..", "..ppppp..", "..ooooo..", "ppppppppp"], pal: { p: "#4a2a6a", P: "#6a3a8a", o: "#ff9a3c" }, out: "#1a0a2a", sink: 0, dx: 0 }
};
// Lo que se lleva en la mano, a tamaño de mano para que se lea a 2x: la mano
// agarra el asa y la cosa va delante del cuerpo (`front`) o detras de los dedos.
// `em`: pixeles que brillan solos (de noche no se apagan).
export const HAND_ITEMS = {
  "market-lantern": { rows: ["..k..", ".kkk.", "kgGgk", "kGWGk", "kgGgk", ".kkk."], pal: { k: "#2a2622", g: "#ffb347", G: "#ffd873", W: "#fffbe0" }, em: new Set(["g", "G", "W"]), at: [-1, 2], out: null, front: true },
  coffee: { rows: [".wwwww", "hwcccw", "hwwwwW", ".wwwwW", ".wwwwW"], pal: { w: "#f4fff8", W: "#c9dcd4", c: "#6b3f24", h: "#45d8ff" }, at: [1, -2], out: "#1f3a3a", front: true, steam: [[[3, -2], [4, -3], [3, -4]], [[4, -2], [3, -3], [4, -4]]] },
  // (id "wrench": es el pixel blaster, como su icono del inventario; la mano
  // agarra la culata y el cañon apunta hacia delante, con la boca encendida)
  wrench: { rows: ["bLLLLLL.", "bPPPPbbW", "bbbbbbbW", "..gG....", "..gG...."], pal: { b: "#388fa8", L: "#8eeaf1", P: "#ff5c9e", W: "#ecfff6", g: "#8eeaf1", G: "#275365" }, em: new Set(["W"]), at: [-1, -3], out: "#112b38", front: false },
  cartridge: { rows: ["GGGGGG", "GllllG", "GlddlG", "GllllG", "GGGGGG", "Y.YY.Y"], pal: { G: "#23764e", l: "#3fff97", d: "#102b21", Y: "#ffd166" }, em: new Set(["l"]), at: [1, -5], out: "#0f2a1c", front: true },
  "pumpkin-pail": { rows: ["k...k", ".k.k.", "ppppp", "pFpFp", "ppppp", ".ppp."], pal: { k: "#2a2622", p: "#e8822a", F: "#ffd36b" }, em: new Set(["F"]), at: [-1, 1], out: "#6a2a0e", front: true },
  sparkler: { rows: ["Y", "s", "s", "s", "s"], pal: { Y: "#fff6cf", s: "#9aa0a8" }, em: new Set(["Y"]), at: [1, -6], out: "#3a3a44", front: true }
};

// Las visitas son hologramas: cada color pasa a la gama azul-lavanda.
const ghostCache = new Map();
export function ghostColor(c) {
  let v = ghostCache.get(c);
  if (!v) {
    const [r, g, b] = rgb(c), lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
    v = mix("#3d4185", "#f2f3ff", Math.min(1, lum * 1.5 + 0.12));
    ghostCache.set(c, v);
  }
  return v;
}

export function linePts(x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const pts = [], dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 300; n++) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return pts;
}
// Como blob/stampRows de core.js, pero cada pixel dice si brilla (emisivo).
function blob(put, pts, out, em) {
  const filled = new Set(pts.map((q) => q[0] + "," + q[1]));
  if (out) for (const [x, y] of pts) for (const [dx, dy] of N4) if (!filled.has((x + dx) + "," + (y + dy))) put(x + dx, y + dy, out, em);
  for (const [x, y, c, e] of pts) put(x, y, c, e);
}
function stampRows(put, rows, pal, x0, y0, out, emSet) {
  const pts = [];
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) pts.push([x0 + x, y0 + y, c, emSet ? emSet.has(r[x]) : false]); } });
  blob(put, pts, out);
}
// Superelipse sombreada y con contorno (n = 2 elipse; mas, mas cuadrada).
function paintRound(put, cx, cy, rx, ry, tone, opt) {
  const n = opt.n || 2, lean = opt.lean || 0, pts = new Map();
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    const sh = lean ? Math.round(lean * (cy + ry - y) / (2 * ry)) : 0;
    for (let x = Math.floor(cx - rx - 3); x <= Math.ceil(cx + rx + 3); x++) {
      const nx = (x + 0.5 - sh - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (opt.maxY !== undefined && y > opt.maxY) continue;
      if (Math.pow(Math.abs(nx), n) + Math.pow(Math.abs(ny), n) <= 1) pts.set(x + "," + y, [nx, ny]);
    }
  }
  for (const [k, v] of pts) {
    const [x, y] = k.split(",").map(Number), edge = N4.some(([dx, dy]) => !pts.has((x + dx) + "," + (y + dy)));
    v.push(edge);
    let c = tone[0];
    if (!edge) { const s = 0.52 + 0.32 * (-0.55 * v[0] - 0.83 * v[1]) + (bayer(x, y) - 0.5) * 0.1; c = s > 0.82 ? tone[4] : s > 0.62 ? tone[3] : s > 0.38 ? tone[2] : tone[1]; }
    put(x, y, c);
  }
  return pts;
}

// Donde van pies, manos, cuerpo y antena en cada pose.
export const POSES = ["idle", "walk", "sit", "stick", "ready", "windup", "cast", "reel", "crouch", "jump", "land", "wave", "hang", "hover", "holdup"];
export function rigPose(o) {
  const p = { bob: 0, lean: 0, lead: 0, ff: { dx: 1, lift: 0 }, bf: { dx: -1, lift: 0 }, fh: { dx: 0, dy: 4 }, bh: { dx: 0, dy: 4 }, sit: false, antDx: 0, antDy: 0 };
  const f = o.frame | 0;
  switch (o.pose) {
    case "walk": {
      const ph = (f % 6) / 6 * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph);
      p.ff = { dx: Math.round(3 * c), lift: Math.round(Math.max(0, -sn) * 2) };
      p.bf = { dx: Math.round(-3 * c), lift: Math.round(Math.max(0, sn) * 2) };
      p.bob = f % 3 === 0 ? 0 : -1;
      p.lean = 1; p.lead = f % 3 === 0 ? 0 : 1;
      p.fh = { dx: Math.round(-2 * c), dy: 4 }; p.bh = { dx: Math.round(2 * c), dy: 4 };
      p.antDx = -1; p.antDy = p.bob ? 1 : 0;
      break;
    }
    case "idle": p.antDy = f % 2; break;
    case "sit": p.sit = true; p.bob = 3; p.fh = { dx: 3, dy: 3 }; p.bh = { dx: 2, dy: 3 }; break;
    case "stick": p.sit = true; p.bob = 3; p.fh = { dx: 4, dy: 0 }; p.bh = { dx: 2, dy: 3 }; break;
    case "ready": p.fh = { dx: 3, dy: 2 }; break;
    case "windup": p.lean = -1; p.fh = { dx: -1, dy: -1 }; p.ff = { dx: 2, lift: 0 }; p.bf = { dx: -2, lift: 0 }; p.antDx = 1; break;
    case "cast": p.lean = 1; p.lead = 1; p.fh = { dx: 5, dy: 1 }; p.ff = { dx: 3, lift: 0 }; p.bf = { dx: -2, lift: 0 }; p.antDx = -1; break;
    case "reel": p.lean = f % 2 ? -1 : 0; p.fh = { dx: 2, dy: 2 }; p.bh = { dx: 2, dy: 3 }; p.ff = { dx: 3, lift: 0 }; p.bf = { dx: -2, lift: 0 }; p.antDx = f % 2; break;
    case "crouch": p.bob = 2; p.fh = { dx: -2, dy: 3 }; p.bh = { dx: -3, dy: 3 }; p.ff = { dx: 2, lift: 0 }; p.bf = { dx: -2, lift: 0 }; p.antDy = 1; break;
    case "jump": p.bob = -1; p.fh = { dx: 2, dy: -3 }; p.bh = { dx: -1, dy: -3 }; p.ff = { dx: 1, lift: 2 }; p.bf = { dx: -1, lift: 1 }; p.antDy = 2; break;
    case "land": p.bob = 2; p.fh = { dx: 3, dy: 2 }; p.bh = { dx: -2, dy: 2 }; p.ff = { dx: 2, lift: 0 }; p.bf = { dx: -2, lift: 0 }; p.antDy = 2; break;
    case "wave": p.fh = { dx: f % 2 ? 4 : 2, dy: -6 }; break;
    case "hang": p.fh = { dx: 1, dy: -5 }; p.bh = { dx: -1, dy: -5 }; p.ff = { dx: f % 2 ? 1 : 0, lift: 1 }; p.bf = { dx: f % 2 ? -1 : 0, lift: 0 }; p.antDx = -1; break;
    case "hover": p.fh = { dx: 4, dy: 1 }; p.bh = { dx: -3, dy: 1 }; p.ff = { dx: 1, lift: 0 }; p.bf = { dx: -1, lift: 0 }; p.antDy = 1; break;
    case "holdup": p.bob = -1; p.fh = { dx: 2, dy: -3 }; p.bh = { dx: -2, dy: -3 }; p.antDy = 1; break;
    default: break;
  }
  if (o.moving) { p.lean = 1; p.fh = { dx: -2, dy: 3 }; p.bh = { dx: -3, dy: 2 }; p.antDx = -1; }
  if (o.handUp) { p.fh = { dx: 4, dy: 0 }; p.antDx = -2; p.antDy = 1; }
  return p;
}

// Un fotograma de Pip: { c: lienzo RIG_W x RIG_H, a: anclas (mano, pies, cabeza…) }.
// Opciones: pose, frame, expr, lookX, lookY, ghost, glow (solo lo emisivo),
// outfit { head, hair, face, ears, antenna, neck, body, hand, handB, feet },
// handUp (paraguas), moving (volando con las botas cohete).
const rigCache = new Map();
export function rigImg(o) {
  const key = JSON.stringify(o);
  let r = rigCache.get(key);
  if (!r) {
    r = buildRig(o);
    if (rigCache.size > 600) rigCache.delete(rigCache.keys().next().value);
    rigCache.set(key, r);
  }
  return r;
}

// Miku: el pelo turquesa (con su anillo de brillo), el traje (top gris con
// cuello y corbata turquesa, mangas sueltas oscuras con puño turquesa, falda
// tableada con el bajo turquesa) y la piel de la cara y las manos.
const HAIR = { out: "#0c3540", main: "#2cc2bd", light: "#78ecdf", shine: "#c6fff4", shade: "#1a8e98", deep: "#147482", deeper: "#0e5866" };
const MIKU = {
  top: "#cfd8de", topL: "#eef3f5", topD: "#9ba8b1", topDD: "#6f7c86",
  teal: "#3fd0c8", tealD: "#1f8f94", tealL: "#a6f3ea",
  skirt: "#2c3442", skirtL: "#465265", skirtD: "#1b212b", out: "#0a0d12",
  tie: "#1f2536", tieL: "#3a4560", pink: "#f163a5", pinkL: "#ff9ac8",
  cup: "#2b3444", cupL: "#46546a", ring: "#40e8dc"
};
const SKIN = { out: "#4a2e2a", skinD: "#efbd9c", skin: "#ffe1ca", skinL: "#fff1e4" };

function buildRig(o) {
  const glow = !!o.glow, ghost = !!o.ghost, fit = o.outfit || {};
  const miku = fit.body === "miku-costume";
  const P = miku ? { ...PIP, limb: "#2b3444", limbL: "#46546a", limbD: "#1b2430", boot: "#20262e", bootL: "#40c9c1", bootHl: "#9ff0e8", bootD: "#151a20", eye: "#3fe8d8", eyeHl: "#e8fffd", eyeDim: "#2a9a94" } : PIP;
  const b = new Buf(RIG_W, RIG_H);
  const put = (x, y, col, em) => { if (!col || (glow && !em)) return; b.set(x, y + RIG_OY, ghost ? ghostColor(col) : col); };
  const p = rigPose(o), U = { x: p.lean, y: p.bob };
  if (HAND_ITEMS[fit.hand] && (o.pose === "idle" || o.pose === "walk") && !o.handUp) p.fh = { dx: 3, dy: o.pose === "walk" && (o.frame | 0) % 3 ? 3 : 2 };
  const X = (x) => x + U.x, Y = (y) => y + U.y, HX = (x) => x + U.x + p.lead, HY = (y) => y + U.y;
  const boots = fit.feet === "rocket-boots";
  const BP = boots ? { boot: "#9a3974", bootL: "#ff4c9f", bootHl: "#ff9ec5", bootD: "#6a2754" } : P;
  const wave = o.pose === "walk" ? ((o.frame | 0) % 3) - 1 : 0;
  const c = {
    round(cx, cy, rx, ry, tone, opt = {}) { return paintRound(put, opt.head ? HX(cx) : X(cx), opt.head ? HY(cy) : Y(cy), rx, ry, tone, opt); },
    fill(cx, cy, rx, ry, col) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(X(x), Y(y), col);
      }
    },
    // placa de cristal que envuelve el frente de la cabeza
    visor(m, cx, cy, rx, ry, n) {
      const inside = (x, y) => Math.pow(Math.abs((x + 0.5 - cx) / rx), n) + Math.pow(Math.abs((y + 0.5 - cy) / ry), n) <= 1;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const v = m.get(HX(x) + "," + HY(y));
        if (!v || v[2] || !inside(x, y)) continue;
        const edge = N4.some(([dx, dy]) => { const w = m.get(HX(x + dx) + "," + HY(y + dy)); return !inside(x + dx, y + dy) || !w || w[2]; });
        put(HX(x), HY(y), edge ? P.visorRim : (y % 2 ? P.visor : P.visor2));
      }
      const gx = Math.round(cx - rx * 0.55), gy = Math.round(cy - ry * 0.55);
      put(HX(gx), HY(gy), P.glint); put(HX(gx + 1), HY(gy), P.glint); put(HX(gx), HY(gy + 1), P.glint);
    }
  };

  function body() {
    c.round(11, 27.5, 2.6, 3.6, [P.out, P.packD, P.pack, P.pack, P.packL], { n: 4 });
    put(X(10), Y(26), P.packL); put(X(11), Y(26), P.packL); put(X(10), Y(29), P.power, true);
    c.bodyMask = c.round(17, 28, 5.6, 4.1, tones(P), { n: 2.4 });
    c.fill(19.6, 29.3, 2.2, 1.7, P.light); put(X(19), Y(28), P.hl);
  }
  function head() {
    c.headMask = c.round(17, 17, 8.5, 7, tones(P), { n: 3, head: true });
    c.visor(c.headMask, 21.8, 17.5, 4.2, 4.3, 3);
    c.round(12.5, 18.5, 2.2, 2.2, [P.out, P.dialD, P.dial, P.dial, P.dialL], { n: 2, head: true });
  }
  function arm(sh, h, back) {
    const sx = sh[0] + U.x, sy = sh[1] + U.y, hx = sx + h.dx, hy = sy + Math.round(h.dy * D.reach), pts = [];
    const line = linePts(sx, sy, hx, hy);
    line.forEach(([x, y], i) => {
      // Con el traje de Miku, la manga acaba en un puño turquesa.
      const cuff = miku && i >= line.length - 3 && i < line.length - 1;
      pts.push([x, y, cuff ? (back ? MIKU.tealD : MIKU.tealL) : back ? P.limbD : P.limbL], [x + 1, y, cuff ? (back ? MIKU.tealD : MIKU.teal) : back ? P.limbD : P.limb]);
    });
    const skin = miku ? (back ? [SKIN.skinD, SKIN.skinD] : [SKIN.skinL, SKIN.skin]) : null;
    for (const [dx, dy] of [[0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [1, 1]]) {
      const lit = dy < 0 || dx < 0;
      pts.push([hx + dx, hy + dy, skin ? skin[lit ? 0 : 1] : back ? P.limbD : (lit ? P.limbL : P.limb)]);
    }
    blob(put, pts, P.out);
    return [hx, hy];
  }
  function leg(hip, f, back) {
    const hx = hip[0] + U.x, hy = hip[1] + U.y, ax = hip[0] + f.dx + (p.sit ? (back ? 2 : 4) : 0), ay = 35 - f.lift, pts = [];
    for (const [x, y] of linePts(hx, Math.min(hy, ay - 1), ax, ay - 1)) pts.push([x, y, back ? P.limbD : P.limbL], [x + 1, y, back ? P.limbD : P.limb]);
    const B = back ? { l: BP.boot, h: BP.bootL, t: BP.boot, b: BP.bootD } : { l: BP.bootL, h: BP.bootHl, t: BP.bootL, b: BP.boot };
    pts.push([ax - 1, ay, B.l], [ax, ay, B.h], [ax + 1, ay, B.l], [ax + 2, ay, B.t]);
    for (let x = ax - 1; x <= ax + 3; x++) pts.push([x, ay + 1, boots ? (x === ax + 3 ? "#ffd166" : "#388caa") : B.b]);
    blob(put, pts, P.out);
    if (boots && f.lift > 0) { put(ax, ay + 2, "#ffd36b", true); put(ax + 1, ay + 2, "#ff8a2a", true); put(ax, ay + 3, "#ff8a2a", true); }
    return [ax, ay + 2];
  }
  // La antena de chispas chisporrotea: seis fases (`o.spark`, la pone quien
  // anima a Pip) con estrellitas que se encienden alrededor de la bola, arcos
  // electricos en zigzag y la bola que parpadea. Todo brilla solo de noche.
  function sparks(tx, ty, ph) {
    const S = (x, y, col) => put(HX(tx + x), HY(ty + y), col, true);
    const W = "#fffbe6", Y = "#ffd166", D = "#c8902a", A = "#9fe8ff";
    const star = (x, y, big) => { S(x, y, W); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) S(x + dx, y + dy, Y); if (big) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) S(x + dx, y + dy, D); };
    const arc = (pts) => pts.forEach(([x, y], i) => S(x, y, i % 2 ? A : W));
    switch (ph % 6) {
      case 0: star(3, -3, false); break;
      case 1: arc([[3, 0], [4, -1], [5, 0], [6, -1]]); S(3, -3, Y); S(0, 0, W); break;
      case 2: star(-4, -2, true); break;
      case 3: arc([[-3, 1], [-4, 2], [-3, 3], [-4, 4]]); S(-4, -2, Y); break;
      case 4: S(2, -4, W); S(-2, -4, Y); S(0, 0, W); S(-1, 0, W); break;
      default: arc([[0, -3], [1, -4], [0, -5], [1, -6]]); star(4, 1, false); break;
    }
  }
  // Donde se posa un pajaro: lo mas alto de la bola de la antena.
  let perch = null;
  function antenna() {
    if (wig) return;
    const gold = fit.antenna === "gold-antenna", hat = HATS[fit.head];
    const [bx, by] = hat ? D.ant[1] : D.ant[0], tx = bx - 3 + p.antDx, ty = by - 4 + p.antDy;
    perch = [HX(tx), HY(ty - 2)];
    for (const [x, y] of linePts(bx, by - 1, tx, ty + 2)) put(HX(x), HY(y), gold ? "#b58032" : P.stem);
    for (const [x, y] of [[-1, -2], [0, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-2, 1], [2, 1], [-1, 2], [0, 2], [1, 2]]) put(HX(tx + x), HY(ty + y), gold ? "#7a5a14" : P.ledOut);
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) put(HX(tx + x), HY(ty + y), gold ? "#ffd166" : P.led, true);
    put(HX(tx - 1), HY(ty - 1), gold ? "#fff6cf" : P.ledHl, true);
    if (gold) sparks(tx, ty, o.spark ?? ((o.frame | 0) % 2) * 3);
  }
  function face() {
    const e = D.eyes, lx = Math.max(-1, Math.min(1, o.lookX | 0)), ly = o.lookY | 0;
    const E = (x, y, col) => put(HX(x + lx), HY(y + ly), col || P.eye, true);
    const [nx, ny] = e.n, [fx, fy] = e.f, [mx, my] = e.m, ex = o.expr || "idle";
    if (ex === "blink") { E(nx, ny + 2); E(nx + 1, ny + 2); E(fx, fy + 2); }
    else if (ex === "happy") { E(nx, ny + 1); E(nx + 1, ny + 1); E(nx - 1, ny + 2); E(fx, fy + 1); }
    else if (ex === "sleep") { E(nx, ny + 2, P.eyeDim); E(nx + 1, ny + 2, P.eyeDim); E(fx, fy + 2, P.eyeDim); }
    else if (ex === "focus") { for (let y = ny + 1; y < ny + 3; y++) { E(nx, y); E(nx + 1, y); } E(fx, fy + 1); E(fx, fy + 2); }
    else { for (let y = ny; y < ny + 3; y++) { E(nx, y); E(nx + 1, y); E(fx, y); } E(nx, ny, P.eyeHl); }
    if (ex === "happy") { E(mx - 1, my - 1); E(mx, my); E(mx + 1, my); E(mx + 2, my - 1); put(HX(nx - 2), HY(my - 1), P.blush); }
    else if (ex === "surprised" || ex === "talk") { E(mx, my - 1); E(mx + 1, my - 1); E(mx, my); E(mx + 1, my); }
    else if (ex === "sleep") E(mx, my, P.eyeDim);
    else { E(mx, my); E(mx + 1, my); }
  }
  function sunglasses() {
    const fr = "#11222e", ln = "#24627b", gl = "#92e9ed";
    for (let y = 16; y <= 18; y++) for (let x = 19; x <= 24; x++) { if (y === 18 && (x === 19 || x === 24)) continue; put(HX(x), HY(y), ln, true); }
    for (let x = 19; x <= 24; x++) put(HX(x), HY(15), fr, true);
    for (let x = 14; x <= 18; x++) put(HX(x), HY(16), fr, true);
    put(HX(20), HY(16), gl, true); put(HX(21), HY(16), gl, true); put(HX(14), HY(17), "#ff659d", true);
  }
  function greenVisor() {
    for (let y = 15; y <= 18; y++) for (let x = 18; x <= 25; x++) put(HX(x), HY(y), y === 15 ? "#9effc1" : y === 18 ? "#409781" : "#0e5b3a");
    for (let x = 12; x <= 17; x++) put(HX(x), HY(16), "#4ed5df");
    put(HX(25), HY(15), "#e9fff3", true);
  }
  function headset() {
    const [ex, ey] = D.ears, [hx, hy] = D.hat, band = [];
    for (const [x, y] of linePts(ex, ey - 3, hx - 1, hy - 1).concat(linePts(hx - 1, hy - 1, hx + 5, hy))) band.push([HX(x), HY(y), "#83d8e5"]);
    blob(put, band, "#162b3d");
    const cup = [];
    for (let y = -2; y <= 2; y++) for (let x = -1; x <= 2; x++) cup.push([HX(ex + x), HY(ey + y), x === 0 && Math.abs(y) < 2 ? "#54d9ef" : x === -1 && y === -2 ? "#d0f7ed" : "#132536"]);
    blob(put, cup, "#0e1a26");
    put(HX(ex), HY(ey + 2), "#ef80b6");
    const mic = linePts(ex + 2, ey + 2, D.eyes.m[0] - 2, D.eyes.m[1] + 2);
    mic.forEach(([x, y]) => put(HX(x), HY(y), "#162b3d"));
    const [lx, ly] = mic[mic.length - 1];
    put(HX(lx), HY(ly), "#ef80b6"); put(HX(lx + 1), HY(ly), "#ef80b6");
  }
  function scarf() {
    const s = D.scarf, pts = [];
    for (let x = s.x0; x <= s.x1; x++) { pts.push([X(x), Y(s.y), (x - s.x0) % 4 === 1 ? "#ff9dc9" : "#ed559a"]); pts.push([X(x), Y(s.y + 1), "#be3473"]); }
    pts.push([X(s.x1 - 1), Y(s.y + 2), "#ed559a"], [X(s.x1), Y(s.y + 2), "#be3473"], [X(s.x1 - 1), Y(s.y + 3), "#be3473"], [X(s.x1 - 1), Y(s.y + 4), "#ffd166"]);
    pts.push([X(s.x0 - 1), Y(s.y + 1), "#ed559a"], [X(s.x0 - 2), Y(s.y + 1 + Math.max(0, wave)), "#ed559a"], [X(s.x0 - 3), Y(s.y + 2), "#be3473"], [X(s.x0 - 4), Y(s.y + 2 + Math.max(0, wave)), "#ffd166"]);
    blob(put, pts, "#472334");
  }
  function vest() {
    let maxX = -99;
    for (const k of c.bodyMask.keys()) maxX = Math.max(maxX, +k.split(",")[0]);
    for (const [k, v] of c.bodyMask) {
      const [x, y] = k.split(",").map(Number);
      if (v[2] || x > maxX - 3 || v[1] < -0.75) continue;
      put(x, y, v[1] > 0.55 ? "#7a5a2a" : v[0] < -0.5 ? "#d0aa6a" : "#a8844a");
    }
    put(X(15), Y(29), "#5a3f1a"); put(X(16), Y(29), "#5a3f1a"); put(X(15), Y(28), "#7a5a2a");
  }
  // Miku: el traje convierte a Pip en una Miku chibi (cara, pelo, top, falda,
  // mangas, botas); la peluca sola pone las coletas, el flequillo y los lazos a Pip.
  function mikuTop() {
    let maxX = -99, minY = 99;
    for (const k of c.bodyMask.keys()) { const [x, y] = k.split(",").map(Number); maxX = Math.max(maxX, x); minY = Math.min(minY, y); }
    for (const [k, v] of c.bodyMask) {
      const [x, y] = k.split(",").map(Number);
      if (v[2]) continue;
      const lit = -0.55 * v[0] - 0.83 * v[1] + (bayer(x, y) - 0.5) * 0.12;
      put(x, y, y <= minY + 1 ? MIKU.teal : lit > 0.55 ? MIKU.topL : lit > -0.05 ? MIKU.top : lit > -0.45 ? MIKU.topD : MIKU.topDD);
    }
    c.tieAt = [maxX - 1, minY + 1];
  }
  // La corbata turquesa por delante del pecho: nudo y pala. Va despues del
  // brazo de delante cuando este cuelga a un lado (si va hacia delante, la tapa).
  function mikuNecktie() {
    const [tx, ty] = c.tieAt;
    const pts = [[tx - 1, ty, MIKU.tealD], [tx, ty, MIKU.teal], [tx - 1, ty + 1, MIKU.tealL], [tx, ty + 1, MIKU.teal]];
    for (let y = ty + 2; y <= ty + 4; y++) pts.push([tx - 1, y, MIKU.teal], [tx, y, MIKU.tealD]);
    pts.push([tx - 1, ty + 5, MIKU.tealD]);
    for (const [x, y, col] of pts) put(x, y, col);
    put(tx - 2, ty, MIKU.topL); put(tx + 1, ty, MIKU.topL);
  }
  function mikuSkirt() {
    const pts = [], sway = o.pose === "walk" ? wave : 0;
    for (let r = 0; r < 4; r++) {
      const y = 29 + r, x0 = 13 - Math.floor(r * 0.8) - (r === 3 ? 1 : 0), x1 = 21 + Math.ceil(r * 0.8);
      for (let x = x0; x <= x1; x++) {
        const pleat = (((x + (r > 1 ? sway : 0)) % 3) + 3) % 3;
        const col = r === 3 ? (pleat === 0 ? MIKU.tealD : MIKU.teal) : r === 0 ? (x === x0 ? MIKU.skirtL : MIKU.skirtD) : pleat === 0 ? MIKU.skirtD : pleat === 1 ? MIKU.skirtL : MIKU.skirt;
        pts.push([X(x + (r === 3 ? sway : 0)), Y(y), col]);
      }
    }
    blob(put, pts, MIKU.out);
  }
  // Una coleta: gruesa arriba, se afina hasta la punta y se mece al andar (o
  // vuela hacia arriba al saltar o colgar). La de lejos, mas oscura y adelantada.
  function mikuTails(layer) {
    const f = o.frame | 0, walk = o.pose === "walk";
    const phase = walk ? f / 6 * Math.PI * 2 : (f % 2) * 0.6;
    const lag = walk ? 2.4 : ["hang", "hover", "jump"].includes(o.pose) ? -2.2 : 0;
    const far = layer === "far", len = 25, pts = [];
    for (let i = 0; i < len; i++) {
      const t = i / (len - 1), y = 12 + i;
      const w = t < 0.14 ? 3 + Math.round(t / 0.14 * 2) : Math.max(1, Math.round(5 - (t - 0.14) / 0.86 * 4.4));
      const cx = 9.4 - t * 3.8 - lag * t * t + Math.sin(phase - i * 0.35) * 1.4 * t + (far ? 3.5 : 0), x0 = Math.round(cx - w / 2);
      for (let k = 0; k < w; k++) {
        let col = far ? (k === 0 ? HAIR.shade : k === w - 1 ? HAIR.deeper : HAIR.deep) : k === 0 ? HAIR.light : k === w - 1 && w > 2 ? HAIR.shade : HAIR.main;
        // un mechon mas oscuro por dentro y el brillo cerca del lazo
        if (!far && w >= 4 && k === 2 && i % 7 > 2) col = HAIR.shade;
        if (!far && i >= 2 && i <= 4 && k === 1) col = HAIR.shine;
        pts.push([HX(x0 + k), HY(y), col]);
      }
    }
    blob(put, pts, HAIR.out);
    // El lazo de la coleta de lejos asoma por encima de la cabeza.
    if (far) mikuTie(12, 9, true);
  }
  // Los lazos: un cuadrado oscuro con una franja rosa.
  function mikuTie(x0, y0, far) {
    const rows = far ? ["kp", "kk"] : ["kpk", "KPk", "kpk"];
    const pal = { k: MIKU.tie, K: MIKU.tieL, p: far ? "#b8487e" : MIKU.pink, P: MIKU.pinkL };
    const pts = [];
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) pts.push([HX(x0 + x), HY(y0 + y), pal[r[x]]]); });
    blob(put, pts, "#0b0e18");
  }
  // El anillo de brillo del pelo: una franja clara sobre la coronilla.
  function hairShine(mask) {
    for (const [k, v] of mask) {
      if (v[2] || v[0] < -0.8 || v[0] > 0.45) continue;
      // un arco de un pixel de grueso que sigue la curva de la cabeza
      const [x, y] = k.split(",").map(Number), arc = -0.5 - 0.22 * v[0] * v[0];
      if (Math.abs(v[1] - arc) > 0.09) continue;
      put(x, y, v[0] < -0.45 || v[0] > 0.2 ? HAIR.light : HAIR.shine);
    }
  }
  function wigOnPip() {
    const cap = c.round(16.8, 14.4, 9.3, 6.2, [HAIR.out, HAIR.shade, HAIR.main, HAIR.light, HAIR.light], { n: 3, head: true, maxY: 12 });
    hairShine(cap);
    // Pelo por detras, hasta el dial de la oreja.
    for (let y = 12; y <= 15; y++) for (let x = 9; x <= 13; x++) if (c.headMask.has(HX(x) + "," + HY(y))) put(HX(x), HY(y), x === 9 ? HAIR.light : (x + y) % 3 ? HAIR.main : HAIR.shade);
  }
  function mikuHead() {
    c.headMask = c.round(18.4, 18.6, 6.4, 6, [SKIN.out, SKIN.skinD, SKIN.skin, SKIN.skin, SKIN.skinL], { n: 2.2, head: true });
    // Pelo por detras de la oreja (cae hasta la nuca) y la coronilla.
    const back = [];
    for (let y = 14; y <= 23; y++) for (let x = 9; x <= 14 - Math.max(0, y - 19); x++) back.push([HX(x), HY(y), x === 9 ? HAIR.light : y > 20 || (x + y) % 4 === 0 ? HAIR.shade : HAIR.main]);
    blob(put, back, HAIR.out);
    const crown = c.round(16.6, 15, 8.8, 6.8, [HAIR.out, HAIR.shade, HAIR.main, HAIR.light, HAIR.light], { n: 2.6, head: true, maxY: 14 });
    hairShine(crown);
    // Los cascos: oscuros, con el aro de luz turquesa.
    for (const [x, y, col, em] of [[13, 18, MIKU.cupL], [14, 18, MIKU.cup], [15, 18, MIKU.cup], [13, 19, MIKU.cup], [14, 19, MIKU.ring, true], [15, 19, MIKU.cup], [13, 20, MIKU.cup], [14, 20, MIKU.cup], [15, 20, MIKU.cup]]) put(HX(x), HY(y), col, em);
    const lx = Math.max(-1, Math.min(1, o.lookX | 0)), ex = o.expr || "idle", E = (x, y, col) => put(HX(x + lx), HY(y), col);
    const eye = "#2abbb6", eyeD = "#0f6f78", eyeL = "#8ff0e4", lash = "#1b2430", lip = "#c0506a";
    if (ex === "blink" || ex === "sleep") { for (const x of [19, 20, 21, 23]) E(x, 18, lash); }
    else if (ex === "happy") { E(19, 18, lash); E(20, 17, lash); E(21, 18, lash); E(23, 17, lash); E(23, 18, lash); }
    else {
      for (const x of [19, 20, 21, 23]) E(x, 16, lash);
      // ojo de cerca: 3x3 con brillo; el de lejos, una columna
      E(19, 17, eyeD); E(20, 17, "#ffffff"); E(21, 17, eyeD);
      E(19, 18, eye); E(20, 18, eyeD); E(21, 18, eye);
      E(19, 19, eyeL); E(20, 19, eye); E(21, 19, eye);
      E(23, 17, eyeD); E(23, 18, eye); E(23, 19, eyeL);
    }
    if (ex === "surprised" || ex === "talk") { E(22, 21, lip); E(22, 22, lip); }
    else if (ex === "happy") { E(21, 21, lip); E(22, 22, lip); E(23, 21, lip); }
    else E(22, 21, lip);
    put(HX(19), HY(20), "#ffb0bc"); put(HX(20), HY(20), "#ffc6cc");
  }
  // Flequillo en picos sobre la frente (o sobre el visor de Pip) y, con el
  // traje, el mechon largo que cae por delante de la oreja.
  function mikuBangs(costume) {
    const pts = [];
    const cols = costume ? [[17, 3], [18, 2], [19, 1], [20, 2], [21, 1], [22, 2], [23, 1], [24, 1]] : [[18, 2], [19, 1], [20, 1], [21, 2], [22, 1], [23, 1], [24, 2], [25, 1]];
    const y0 = costume ? 14 : 12;
    for (const [x, len] of cols) for (let i = 0; i < len; i++) pts.push([HX(x), HY(y0 + i), i === len - 1 && len > 1 ? HAIR.shade : x % 2 ? HAIR.main : HAIR.light]);
    blob(put, pts, HAIR.out);
    if (!costume) return;
    // (sin contorno: con el, el mechon partiria la cara en dos)
    for (let y = 15; y <= 22; y++) {
      put(HX(16), HY(y), y > 20 ? HAIR.shade : y < 17 ? HAIR.light : HAIR.main);
      if (y < 21) put(HX(17), HY(y), y > 18 ? HAIR.deep : HAIR.shade);
    }
  }
  function mikuFront(costume) {
    mikuBangs(costume);
    mikuTie(8, 11, false);
  }
  function drawItem(item, hx, hy) {
    stampRows(put, item.rows, item.pal, hx + item.at[0], hy + item.at[1], item.out, item.em);
    if (item.steam) for (const [dx, dy] of item.steam[Math.abs(o.frame | 0) % 2] || item.steam[0]) put(hx + item.at[0] + dx, hy + item.at[1] + dy, "#d8f2ff");
  }

  const a = {};
  const wig = fit.hair === "miku-wig" || fit.head === "miku-wig" || miku;
  if (wig) mikuTails("far");
  // la mano de atras puede llevar otra cosa (el farol, el cafe)
  const itemB = HAND_ITEMS[fit.handB];
  const bhx = D.shoulder.b[0] + U.x + p.bh.dx, bhy = D.shoulder.b[1] + U.y + Math.round(p.bh.dy * D.reach);
  if (itemB) drawItem(itemB, bhx - 1, bhy);
  a.handB = arm(D.shoulder.b, p.bh, true);
  a.feetB = leg(D.hip.b, p.bf, true);
  if (miku) { c.bodyMask = c.round(17, 28, 5.6, 4.1, tones(P), { n: 2.4 }); mikuTop(); }
  else { body(); if (fit.body === "market-vest") vest(); }
  a.feet = leg(D.hip.f, p.ff, false);
  if (miku) { mikuSkirt(); mikuHead(); }
  else {
    head();
    if (fit.face === "green-visor") greenVisor();
    face();
    if (fit.face === "sunglasses") sunglasses();
    if (fit.ears === "headset") headset();
    if (wig) wigOnPip();
  }
  if (wig) { mikuTails("near"); mikuFront(miku); }
  if (HATS[fit.head]) {
    const h = HATS[fit.head], w = Math.max(...h.rows.map((r) => r.length));
    stampRows(put, h.rows, h.pal, HX(D.hat[0] - Math.floor(w / 2) + h.dx), HY(D.hat[1] - h.rows.length + 1 + h.sink), h.out);
  }
  antenna();
  if (fit.neck === "scarf") scarf();
  const hx = D.shoulder.f[0] + U.x + p.fh.dx, hy = D.shoulder.f[1] + U.y + Math.round(p.fh.dy * D.reach), item = HAND_ITEMS[fit.hand];
  if (item && !item.front) drawItem(item, hx, hy);
  if (miku && p.fh.dx > 1) mikuNecktie();
  a.hand = arm(D.shoulder.f, p.fh, false);
  if (miku && p.fh.dx <= 1) mikuNecktie();
  if (item && item.front) drawItem(item, hx, hy);
  a.head = [D.hat[0] + U.x + p.lead, D.top + U.y];
  a.skull = [17 + U.x + p.lead, D.skull + U.y];
  a.mouth = [D.eyes.m[0] + 2 + U.x + p.lead, D.eyes.m[1] + U.y];
  // Primera fila con pixeles (lo mas alto de Pip, gorro incluido).
  let top = RIG_H;
  for (let i = 3; i < b.d.length; i += 4) if (b.d[i]) { top = Math.floor(i / 4 / RIG_W); break; }
  // Sin antena (la peluca de Miku), el pajaro se posa en lo alto del pelo.
  if (!perch) {
    const x = Math.max(0, Math.min(RIG_W - 1, a.head[0]));
    let y = 0;
    while (y < RIG_H - 1 && !b.alpha(x, y)) y++;
    perch = [x, y];
  }
  a.perch = perch;
  return { c: b.canvas(), a, top };
}
