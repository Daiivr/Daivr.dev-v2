import { bayer, rgb } from "./core.js";
import { PORTAL_CLOSE_MS, PORTAL_OPEN_MS } from "../../../shared/buddy-arrival.mjs";

// El portal de Pip (la entrada rara de la puerta): una chispa, una raja de
// luz que crece hacia arriba y hacia abajo, y un ovalo de canto con el borde
// de energia y un remolino dentro. Pip se mete por un lado (lo que pasa del
// plano del portal desaparece y lo que esta dentro del ovalo se ve como una
// silueta tramada) y sale por el otro en el sendero del footer. Lo pintan
// igual el lienzo de la puerta (BuddyPortalTravel) y el mundo del footer
// (events/portal.js). Px de arte; sin React.

export const PORTAL_RX = 10;
export const PORTAL_RY = 23;
export const OPEN_S = PORTAL_OPEN_MS / 1000;
export const CLOSE_S = PORTAL_CLOSE_MS / 1000;
// Mitad del ancho del cuerpo de Pip (con la mochila) desde su centro.
export const PIP_HALF = 10;

const PAD = 6;
const BW = (PORTAL_RX + PAD) * 2 + 1;
const BH = (PORTAL_RY + PAD) * 2 + 1;
const OX = PORTAL_RX + PAD, OY = PORTAL_RY + PAD;

const C = Object.fromEntries(Object.entries({
  white: "#ffffff", ice: "#c8f8ff", cyan: "#5fe1ff", cyanD: "#2f9ad8",
  lilac: "#e4dbff", violetL: "#c4adff", violet: "#9a7dff", violetD: "#6a4fd8",
  aura1: "#7d5cff", aura2: "#5a3fd0", aura3: "#3f2c9e", sep: "#120c3c"
}).map(([k, v]) => [k, rgb(v)]));
// Del fondo del tunel (oscuro) hacia el borde.
const RAMP = ["#0a0824", "#161046", "#261b78", "#3c2aac", "#5d42dc", "#8c6dff"].map(rgb);
const SILHOUETTE = rgb("#d9ceff");

const smooth = (k) => k * k * (3 - 2 * k);
const outCubic = (k) => 1 - (1 - k) ** 3;
const inCubic = (k) => k * k * k;
function outBack(k) { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; }
const clamp01 = (k) => Math.max(0, Math.min(1, k));
// Numero fijo por indice: las chispas salen siempre igual sin guardar estado.
const hash = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

// Forma en cada instante. `phase`: "open" | "steady" | "close" (e = segundos
// desde que empezo). rx/seam van de 0 a 1 (rx puede pasarse al rebotar).
export function portalShape(phase, e = 0, t = 0) {
  if (phase === "open") {
    if (e < 0.12) return { rx: 0, seam: 0, spark: e / 0.12, flash: 0, spin: 9, live: 0 };
    if (e < 0.42) return { rx: 0, seam: outCubic((e - 0.12) / 0.3), flash: 0, spin: 9, live: 0 };
    const k = clamp01((e - 0.42) / (OPEN_S - 0.42));
    return { rx: outBack(k), seam: 1, flash: clamp01(1 - (e - 0.42) / 0.16), spin: 9 - 4.5 * k, live: k, burst: e - 0.42 };
  }
  if (phase === "close") {
    if (e < 0.12) return { rx: 1, seam: 1, flash: 0, spin: 7, live: 1, implode: 0 };
    if (e < 0.45) { const k = inCubic((e - 0.12) / 0.33); return { rx: 1 - k, seam: 1, flash: 0, spin: 7 + 8 * k, live: 1 - k, implode: e - 0.12 }; }
    if (e < 0.62) return { rx: 0, seam: 1 - smooth((e - 0.45) / 0.17), flash: 0, spin: 9, live: 0, implode: e - 0.12 };
    if (e < CLOSE_S) return { rx: 0, seam: 0, pop: (e - 0.62) / (CLOSE_S - 0.62), flash: 0, spin: 0, live: 0, popAge: e - 0.62 };
    return null;
  }
  return { rx: 1 + Math.sin(t * 3.1) * 0.04, seam: 1, flash: 0, spin: 4.5, live: 1 };
}

const inside = (dx, dy, a, b) => a >= 0 && b >= 0 && (dx * dx) / ((a + 0.5) ** 2) + (dy * dy) / ((b + 0.5) ** 2) <= 1;

export function createPortalPainter() {
  let body = null, sil = null;
  const mask = new Uint8Array(BW * BH);
  function canvases() {
    if (body) return;
    const make = () => { const c = document.createElement("canvas"); c.width = BW; c.height = BH; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return { c, g, img: g.createImageData(BW, BH) }; };
    body = make(); sil = make();
  }

  // El cuerpo del portal (aura, borde, remolino) en un buffer de BW x BH con
  // el centro en (OX, OY). `near`: lado por donde entra o sale Pip (+1 derecha).
  function paintBody(shape, t, near, ripples) {
    const d = body.img.data;
    d.fill(0); mask.fill(0);
    const put = (x, y, col) => { const i = (y * BW + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
    const rx = Math.round(PORTAL_RX * shape.rx), ry = PORTAL_RY;
    if (rx < 1) {
      // La raja: una linea de luz con un halo tramado a los lados.
      const L = Math.round(ry * shape.seam);
      if (L > 0) for (let dy = -L; dy <= L; dy++) {
        const y = OY + dy, f = 1 - Math.abs(dy) / (L + 1);
        put(OX, y, Math.abs(dy) < L - 1 ? C.white : C.ice);
        for (const s of [-1, 1]) {
          if (bayer(OX + s, y) < 0.7 * f) put(OX + s, y, f > 0.5 ? C.cyan : C.violet);
          if (bayer(OX + 2 * s, y) < 0.3 * f) put(OX + 2 * s, y, C.aura1);
        }
      }
      return 0;
    }
    const swirl = t * shape.spin, flash = shape.flash || 0;
    const irx = Math.max(0.5, rx - 2.5), iry = ry - 2.5;
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const dx = x - OX, dy = y - OY;
      if (!inside(dx, dy, rx + 3, ry + 3)) continue;
      const theta = Math.atan2(dy / (ry + 0.5), dx / (rx + 0.5));
      const band = Math.sin(theta * 3 - t * 7);
      const lightDot = (-dx / (rx + 0.5)) * 0.55 + (-dy / (ry + 0.5)) * 0.85;
      if (!inside(dx, dy, rx, ry)) {
        // Aura: tres anillos tramados cada vez mas ralos.
        const ring = inside(dx, dy, rx + 1, ry + 1) ? 1 : inside(dx, dy, rx + 2, ry + 2) ? 2 : 3;
        const k = [0, 0.55, 0.3, 0.12][ring] * (0.7 + 0.3 * shape.live) + (band > 0.7 ? 0.15 : 0);
        if (bayer(x, y) < k) put(x, y, ring === 1 ? (band > 0.4 ? C.violetL : C.aura1) : ring === 2 ? C.aura2 : C.aura3);
        continue;
      }
      mask[y * BW + x] = 1;
      if (!inside(dx, dy, rx - 1, ry - 1)) {
        // Borde de fuera: cian, con brillo arriba a la izquierda y bandas de energia que corren.
        put(x, y, flash > 0.3 || band > 0.78 ? C.white : lightDot > 0.35 ? C.ice : lightDot < -0.45 ? C.cyanD : C.cyan);
        continue;
      }
      if (!inside(dx, dy, rx - 2, ry - 2)) {
        put(x, y, flash > 0.3 || band > 0.82 ? C.lilac : lightDot > 0.35 ? C.violetL : lightDot < -0.45 ? C.violetD : C.violet);
        continue;
      }
      if (!inside(dx, dy, rx - 3, ry - 3)) { put(x, y, flash > 0.5 ? C.violet : C.sep); continue; }
      // Remolino: dos brazos en espiral sobre un tunel que se oscurece hacia
      // el centro, con un punto de luz al fondo (el otro lado).
      const nu = dx / irx, nv = dy / iry, r = Math.min(1, Math.hypot(nu, nv)), a = Math.atan2(nv, nu);
      const s = Math.sin(2 * a + r * 8.5 - swirl);
      let level = 0.55 * r * r + (s > 0.55 ? 0.42 : s > 0.05 ? 0.2 : 0) * (0.35 + 0.65 * r) + (bayer(x, y) - 0.5) * 0.22 + flash * 0.6;
      for (const rp of ripples) {
        const rr = rp.age * 26, dist = Math.hypot(dx - near * rx * 0.5, (dy - rp.dy) * 0.7);
        if (rp.age < 0.6 && Math.abs(dist - rr) < 1) level += 0.45 * (1 - rp.age / 0.6);
      }
      const core = Math.hypot(dx / (irx * 0.9 + 0.6), dy / (iry * 0.9)) * (1 + 0.12 * Math.sin(t * 5));
      if (core < 0.11) { put(x, y, C.white); continue; }
      if (core < 0.2) { put(x, y, bayer(x, y) < 0.6 ? C.ice : C.violetL); continue; }
      if (s > 0.9 && r > 0.3 && r < 0.95) { put(x, y, C.cyan); continue; }
      put(x, y, RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(level * RAMP.length)))]);
    }
    return rx;
  }

  // Chispa suelta (abriendo) o estrella que estalla (al cerrarse).
  function star(g, x, y, arm, core = "#ffffff", tip = "#9ef0ff") {
    g.fillStyle = tip;
    for (let i = 1; i <= arm; i++) { g.fillRect(x - i, y, 1, 1); g.fillRect(x + i, y, 1, 1); g.fillRect(x, y - i, 1, 1); g.fillRect(x, y + i, 1, 1); }
    if (arm >= 3) { g.fillStyle = "#c4adff"; g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + 1, y - 1, 1, 1); g.fillRect(x - 1, y + 1, 1, 1); g.fillRect(x + 1, y + 1, 1, 1); }
    g.fillStyle = core; g.fillRect(x, y, 1, 1);
  }
  const dot = (g, x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const MOTE = ["#ffffff", "#9ef0ff", "#c4adff", "#5fe1ff"];

  // Lo que vuela alrededor: motas en orbita, motas absorbidas (o soltadas al
  // llegar), el estallido al abrirse, rafagas hacia dentro al cerrarse y la
  // estrella final con sus chispas.
  function particles(g, cx, cy, shape, t, o) {
    const rx = PORTAL_RX * Math.max(shape.rx, 0), ry = PORTAL_RY;
    if (shape.spark != null) {
      if (Math.floor(t * 30) % 2 === 0 || shape.spark > 0.5) star(g, cx, cy, shape.spark > 0.5 ? 2 : 1);
    }
    if (shape.live > 0.4) {
      for (let i = 0; i < 6; i++) {
        const a = t * 1.7 + i * Math.PI / 3;
        if (Math.floor(t * 12 + i) % 5 === 0) continue;
        dot(g, cx + Math.cos(a) * (rx + 2.5), cy + Math.sin(a) * (ry + 2), MOTE[i % 3]);
      }
      // (out: al llegar las motas salen; si no, el portal las traga)
      for (let i = 0; i < 12; i++) {
        let p = (t * 0.65 + i / 12) % 1;
        if (o.flow === "out") p = 1 - p;
        const rf = 0.35 + 1.7 * (1 - p), a = i * 2.39996 + p * 2.6 * (o.near || 1);
        if (rf < 0.55) continue;
        const x = cx + Math.cos(a) * (rx + 3) * rf * 1.5, y = cy + Math.sin(a) * ry * rf * 0.85;
        dot(g, x, y, p > 0.7 ? "#ffffff" : MOTE[1 + (i % 3)]);
      }
    }
    if (shape.burst != null && shape.burst < 0.75) {
      const e = shape.burst;
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2 + hash(i) * 0.4, sp = 18 + hash(i, 1) * 22;
        const x0 = cx + Math.cos(a) * (rx + 1), y0 = cy + Math.sin(a) * (ry + 1);
        if (e > 0.35 + hash(i, 2) * 0.4) continue;
        dot(g, x0 + Math.cos(a) * sp * e, y0 + Math.sin(a) * sp * e * 0.6 + 30 * e * e, MOTE[i % 4]);
      }
    }
    if (o.gulp != null && o.gulp < 0.6) {
      const e = o.gulp;
      for (let i = 0; i < 10; i++) {
        const a = (hash(i, 4) - 0.5) * 2.2, sp = 16 + hash(i, 5) * 20;
        if (e > 0.3 + hash(i, 6) * 0.3) continue;
        dot(g, cx + o.near * (rx * 0.6 + Math.cos(a) * sp * e), cy + (hash(i, 7) - 0.5) * 24 + Math.sin(a) * sp * e + 26 * e * e, MOTE[i % 4]);
      }
    }
    if (o.emerge != null && o.emerge < 0.7) {
      const e = o.emerge;
      for (let i = 0; i < 12; i++) {
        const a = (hash(i, 8) - 0.5) * 2.4, sp = 14 + hash(i, 9) * 22;
        if (e > 0.35 + hash(i, 10) * 0.35) continue;
        dot(g, cx + o.near * (rx + Math.cos(a) * sp * e), cy + (hash(i, 11) - 0.3) * 30 + Math.sin(a) * sp * e + 30 * e * e, MOTE[(i + 1) % 4]);
      }
    }
    if (shape.implode != null && shape.implode < 0.5) {
      const e = shape.implode;
      for (let i = 0; i < 10; i++) {
        const k = clamp01(e / 0.5 - hash(i, 12) * 0.3), a = i / 10 * Math.PI * 2 + 0.3;
        if (k <= 0 || k >= 1) continue;
        const rf = 2.4 * (1 - k);
        const x = cx + Math.cos(a) * (PORTAL_RX + 3) * rf, y = cy + Math.sin(a) * ry * rf * 0.7;
        dot(g, x, y, "#ffffff");
        dot(g, x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.2, "#9a7dff");
      }
    }
    if (shape.pop != null) {
      const arm = Math.round(5 * Math.sin(Math.min(1, shape.pop * 1.15) * Math.PI));
      if (arm > 0) star(g, cx, cy, arm);
      const e = shape.popAge;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.45, sp = 14 + hash(i, 13) * 10;
        dot(g, cx + Math.cos(a) * sp * e, cy + Math.sin(a) * sp * e + 40 * e * e, MOTE[i % 4]);
      }
    }
  }

  // Charco de luz en el suelo bajo el portal (fila `y`), tramado.
  function groundGlow(g, cx, y, shape) {
    const k = shape.rx > 0 ? Math.min(1, shape.rx) : shape.seam * 0.4;
    if (k <= 0.02) return;
    const w = Math.round((PORTAL_RX * 1.7 + 6) * k);
    for (let dx = -w; dx <= w; dx++) {
      const f = 1 - Math.abs(dx) / (w + 1);
      for (let row = 0; row < 2; row++) {
        const x = cx + dx, yy = y + row;
        if (bayer(x, yy) < f * (row ? 0.35 : 0.7) * k) dot(g, x, yy, f > 0.65 ? "#c8f8ff" : f > 0.35 ? "#8c6dff" : "#5a3fd0");
      }
    }
  }

  // Pinta el portal con su centro en (cx, cy) (px de arte, enteros).
  // o: { phase, e, t, near (+1: Pip en la derecha), ripples [{dy, age}],
  //      traveler { img, left, top, flip } (Pip ya recortado), ground (fila del
  //      suelo o null), flow "in"|"out", gulp/emerge (s desde el tramo),
  //      pulse 0..1 (se hincha), additive (el brillo del suelo suma luz) }
  function draw(g, cx, cy, o) {
    let shape = portalShape(o.phase, o.e, o.t);
    if (!shape) return null;
    // (el "trago" al cerrarse tras Pip: se hincha un poco y destella)
    if (o.pulse > 0) shape = { ...shape, rx: shape.rx * (1 + 0.14 * o.pulse), flash: Math.max(shape.flash || 0, 0.4 * o.pulse) };
    canvases();
    if (o.ground != null) {
      if (o.additive) g.globalCompositeOperation = "lighter";
      groundGlow(g, cx, o.ground, shape);
      g.globalCompositeOperation = "source-over";
    }
    const rx = paintBody(shape, o.t, o.near || 1, o.ripples || []);
    body.g.putImageData(body.img, 0, 0);
    g.drawImage(body.c, cx - OX, cy - OY);
    // Pip dentro del ovalo: silueta lila tramada, encima del remolino.
    if (o.traveler && rx > 0) {
      const { img, left, top, flip } = o.traveler;
      const x0 = left - (cx - OX), y0 = top - (cy - OY);
      sil.g.clearRect(0, 0, BW, BH);
      if (flip) { sil.g.save(); sil.g.translate(x0 + img.width, y0); sil.g.scale(-1, 1); sil.g.drawImage(img, 0, 0); sil.g.restore(); }
      else sil.g.drawImage(img, x0, y0);
      const px = sil.g.getImageData(0, 0, BW, BH), pd = px.data;
      for (let i = 0, n = BW * BH; i < n; i++) {
        const j = i * 4;
        if (!pd[j + 3]) continue;
        const x = i % BW, y = (i / BW) | 0;
        if (!mask[i] || bayer(x, y) >= 0.55) { pd[j + 3] = 0; continue; }
        pd[j] = SILHOUETTE[0]; pd[j + 1] = SILHOUETTE[1]; pd[j + 2] = SILHOUETTE[2]; pd[j + 3] = 255;
      }
      sil.g.putImageData(px, 0, 0);
      g.drawImage(sil.c, cx - OX, cy - OY);
    }
    particles(g, cx, cy, shape, o.t, o);
    return shape;
  }

  return { draw, shape: portalShape };
}

// Donde se abre el portal de llegada en el sendero (px de arte). El ovalo
// no tapa el puesto, la hoguera, el buzon, el huerto, el barril de cañas,
// la tienda ni una farola; Pip puede pasar por delante de todo, pero no se
// queda parado delante de una farola (la cabeza parece un sombrero). Mejor
// a la izquierda: abajo a la derecha suele estar el reproductor DAI FM.
// `emerge`: px de arte que anda al salir; `side` +1: sale hacia la derecha.
export function portalSpot(L, emerge = 26) {
  if (!L) return null;
  const lamps = L.lamps || [];
  const blocked = [...(L.clear || []), ...lamps.map((x) => [x - 5, x + 5])];
  if (L.mailX != null) blocked.push([L.mailX - 9, L.mailX + 9]);
  if (L.tentX != null) blocked.push([L.tentX - 20, L.tentX + 20]);
  const half = PORTAL_RX + 3;
  const ok = (x, side) => {
    if (x - half < 4 || x + half > L.W - 4) return false;
    if (blocked.some(([lo, hi]) => x - half < hi && x + half > lo)) return false;
    const end = x + side * emerge;
    return end - PIP_HALF > 2 && end + PIP_HALF < L.W - 2 && !lamps.some((lx) => Math.abs(lx - end) < 9);
  };
  const from = (L.fireX ?? 40) + 20, split = Math.round(L.W * 0.62);
  for (const [lo, hi] of [[from, split], [from, L.W], [8, from]]) {
    for (let x = lo; x < hi; x += 2) for (const side of [1, -1]) if (ok(x, side)) return { x, side };
  }
  return { x: Math.round(Math.min(L.W - 60, Math.max(30, L.W * 0.3))), side: 1 };
}

// Quita las columnas de un sprite de Pip que han pasado el plano del portal.
// `img` sin espejar; `left`/`flip` como se va a dibujar; se queda con lo que
// esta del lado `keep` (+1 derecha) de la x `plane` del mundo.
export function cutAtPlane(img, left, flip, plane, keep) {
  const w = img.width, h = img.height;
  // columna local -> x del mundo: left + (flip ? w - 1 - col : col)
  let from = 0, to = w;
  if (!flip) { if (keep > 0) from = plane - left; else to = plane - left; }
  else if (keep > 0) to = w - (plane - left); else from = w - (plane - left);
  from = Math.max(0, Math.min(w, from)); to = Math.max(from, Math.min(w, to));
  if (from === 0 && to === w) return img;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  if (to > from) c.getContext("2d").drawImage(img, from, 0, to - from, h, from, 0, to - from, h);
  return c;
}
