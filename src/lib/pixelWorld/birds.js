import { Buf, N4, bayer, flipped, lazy, mix } from "./core.js";

// Los pajaros del cielo del footer, al estilo de los bichitos de Stardew
// Valley: bola de cuerpo con la cabeza redonda pegada, pico pequeño, ojo de un
// pixel, colita, y un ala grande y redonda que sube y baja por encima y por
// debajo del cuerpo. El contorno es un tono oscuro de su propio color (nada de
// negro) y la luz viene de arriba a la izquierda. Miran a la izquierda y se
// espejan para volar a la derecha. Poses: up, mid, down y glide.
// - gorrion, azulejo y cardenal (este en invierno): pequeños, en grupitos;
// - cuervo: mas grande, solo o en pareja, y de vuelta a casa al atardecer;
// - gaviota: la mas grande, aletea despacio y planea.
const SPECIES = {
  sparrow: {
    size: 0.58, out: "#4a2814", body: ["#7a4a28", "#a8683a", "#c8884a", "#e0a868"], belly: ["#d8b888", "#f2dcb0"],
    wing: ["#5a3418", "#8a5430", "#c08850"], beak: "#e8a040", eye: "#1a1010", cap: "#6a3a1a"
  },
  bluebird: {
    size: 0.58, out: "#1a2a5a", body: ["#24489a", "#3a6ac8", "#5a8ae0", "#8ab4f0"], belly: ["#c8784a", "#e89a5a"],
    wing: ["#1a3478", "#2a50a8", "#5a8ae0"], beak: "#3a3a40", eye: "#0a0a14"
  },
  cardinal: {
    size: 0.58, out: "#5a1410", body: ["#9a2418", "#c8322a", "#e8503a", "#f8806a"], belly: ["#c8322a", "#e85a40"],
    wing: ["#7a1a12", "#a82a1e", "#d84a36"], beak: "#f0a040", eye: "#0a0a0a", mask: "#2a0a0a", crest: true
  },
  crow: {
    size: 0.78, out: "#14141c", body: ["#24242e", "#34343f", "#4a4a5a", "#6a6a82"], belly: ["#2a2a36", "#3a3a48"],
    wing: ["#1a1a24", "#2a2a36", "#4a4a62"], beak: "#5a5a6a", eye: "#d8d8e8", tail: 3
  },
  gull: {
    size: 0.82, out: "#5a6470", body: ["#c8d0d6", "#e6eaee", "#f6f8f8", "#ffffff"], belly: ["#e6eaee", "#ffffff"],
    wing: ["#8a96a2", "#a8b4c0", "#d0d8e0"], tip: "#2a2c34", beak: "#f0b030", eye: "#1a1a22", long: true
  }
};

const POSES = ["up", "mid", "down", "glide"];
// Fila del centro del cuerpo dentro del dibujo (para que no salte al cambiar de pose).
export const BIRD_ANCHOR = {};

function paintBird(sp, pose) {
  const s = sp.size, W = Math.round(16 * s) + 2, H = Math.round(16 * s) + 2;
  const b = new Buf(W, H), pix = new Map();
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) pix.set(x + "," + y, c); };
  const cx = 8.2 * s, cy = H / 2 + 0.5;
  BIRD_ANCHOR[sp.key] = Math.round(cy);
  // Cuerpo (elipse) y cabeza (circulo) delante, abajo la tripa clara.
  const brx = 4.3 * s, bry = 3.2 * s, hx = cx - 4.1 * s, hy = cy - 1.2 * s, hr = 2.7 * s;
  const inBody = (x, y) => ((x + 0.5 - cx) / brx) ** 2 + ((y + 0.5 - cy) / bry) ** 2 <= 1;
  const inHead = (x, y) => (x + 0.5 - hx) ** 2 + (y + 0.5 - hy) ** 2 <= hr * hr;
  const shape = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inBody(x, y) || inHead(x, y)) shape.push([x, y]);
  // Cola: un abanico corto detras, hacia arriba (mas larga en el cuervo).
  const tl = sp.tail || 2, tx = Math.round(cx + brx - 0.5), ty = Math.round(cy - 0.5);
  for (let i = 1; i <= tl + 1; i++) { shape.push([tx + i, ty - Math.floor(i / 2)]); shape.push([tx + i, ty + 1 - Math.floor(i / 2)]); }
  const set = new Set(shape.map(([x, y]) => x + "," + y));
  for (const [x, y] of shape) for (const [dx, dy] of N4) if (!set.has((x + dx) + "," + (y + dy))) put(x + dx, y + dy, sp.out);
  for (const [x, y] of shape) {
    const ny = (y + 0.5 - cy) / bry, nx = (x + 0.5 - cx) / brx, head = inHead(x, y) && !inBody(x, y);
    const lit = -0.55 * nx - 0.8 * ny + (bayer(x, y) - 0.5) * 0.2 + (head ? 0.2 : 0);
    let c = lit > 0.75 ? sp.body[3] : lit > 0.2 ? sp.body[2] : lit > -0.45 ? sp.body[1] : sp.body[0];
    // tripa clara (abajo y hacia la cabeza)
    if (ny > 0.15 && x < cx + brx * 0.5 && !head) c = ny > 0.6 ? sp.belly[0] : sp.belly[1];
    if (head && y + 0.5 > hy + hr * 0.35) c = sp.belly[1];
    put(x, y, c);
  }
  // Cardenal: antifaz negro y cresta.
  if (sp.mask) for (const [x, y] of [[Math.floor(hx - hr + 1), Math.round(hy)], [Math.floor(hx - hr + 1), Math.round(hy) + 1], [Math.floor(hx - hr + 2), Math.round(hy) + 1]]) put(x, y, sp.mask);
  if (sp.crest) { const top = Math.round(hy - hr), cx0 = Math.round(hx) + 1; put(cx0, top, sp.body[2]); put(cx0, top - 1, sp.out); put(cx0 - 1, top, sp.out); put(cx0 + 1, top, sp.out); }
  if (sp.cap) for (let x = Math.round(hx - 1); x <= Math.round(hx + 1); x++) put(x, Math.round(hy - hr + 1), sp.cap);
  // Ojo y pico.
  const ex = Math.round(hx - hr * 0.25), ey = Math.round(hy - hr * 0.2);
  put(ex, ey, sp.eye);
  const bx = Math.floor(hx - hr), by = Math.round(hy + 0.3);
  put(bx, by, sp.beak); put(bx - 1, by, sp.beak); if (s > 0.9) put(bx - 2, by, sp.beak);
  put(bx - (s > 0.9 ? 3 : 2), by, sp.out); put(bx - 1, by + 1, sp.out); put(bx - 1, by - 1, sp.out);

  // El ala: una elipse grande pegada al lomo; arriba, al costado o abajo.
  const long = sp.long ? 1.35 : 1;
  const wings = {
    up: { x: cx + 0.6 * s, y: cy - 4.4 * s, rx: 2.3 * s, ry: 3.6 * s * long, rot: 0.35 },
    mid: { x: cx + 1.9 * s, y: cy - 1.5 * s, rx: 3.3 * s * long, ry: 1.5 * s, rot: -0.22 },
    down: { x: cx + 0.8 * s, y: cy + 3.6 * s, rx: 2.2 * s, ry: 3.4 * s * long, rot: -0.4 },
    glide: { x: cx + 2.2 * s, y: cy - 2 * s, rx: 4.3 * s * long, ry: 1.3 * s, rot: -0.34 }
  }[pose];
  const wpts = [], c = Math.cos(wings.rot), sn = Math.sin(wings.rot);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - wings.x, dy = y + 0.5 - wings.y, lx = dx * c + dy * sn, ly = -dx * sn + dy * c;
    if ((lx / wings.rx) ** 2 + (ly / wings.ry) ** 2 <= 1) wpts.push([x, y, lx / wings.rx, ly / wings.ry]);
  }
  const wset = new Set(wpts.map(([x, y]) => x + "," + y));
  for (const [x, y] of wpts) for (const [dx, dy] of N4) if (!wset.has((x + dx) + "," + (y + dy))) put(x + dx, y + dy, sp.out);
  const far = pose === "up" ? -1 : pose === "down" ? 1 : 0;
  for (const [x, y, u, v] of wpts) {
    // borde de ataque claro, plumas de la punta oscuras (con rayitas)
    const edge = far < 0 ? u < -0.45 : far > 0 ? u < -0.45 : v < -0.35;
    const tipZone = far < 0 ? v < -0.45 : far > 0 ? v > 0.45 : u > 0.5;
    let col = edge ? sp.wing[2] : sp.wing[1];
    if (tipZone) col = sp.tip || ((x + y) % 2 ? sp.wing[0] : sp.wing[1]);
    put(x, y, col);
  }
  for (const [k, col] of pix) { const [x, y] = k.split(",").map(Number); b.set(x, y, col); }
  return b.canvas();
}

// Al atardecer y al amanecer, un poco apagados hacia el violeta del cielo.
function duskOf(sp) {
  const d = (c) => mix(c, "#3a2a44", 0.38);
  return { ...sp, out: d(sp.out), body: sp.body.map(d), belly: sp.belly.map(d), wing: sp.wing.map(d), beak: d(sp.beak), cap: sp.cap && d(sp.cap), mask: sp.mask && d(sp.mask), tip: sp.tip && d(sp.tip) };
}

// { sparrow: { day: { left: { up, mid, down, glide }, right: {...} }, dusk: ... }, ... }
export const birdSprites = lazy(() => Object.fromEntries(Object.entries(SPECIES).map(([key, base]) => {
  const tones = {};
  for (const [tone, sp] of [["day", { ...base, key }], ["dusk", { ...duskOf(base), key }]]) {
    const left = Object.fromEntries(POSES.map((pose) => [pose, paintBird(sp, pose)]));
    const right = Object.fromEntries(POSES.map((pose) => [pose, flipped(left[pose])]));
    tones[tone] = { left, right };
  }
  return [key, tones];
})));

export const BIRD_KINDS = Object.keys(SPECIES);
