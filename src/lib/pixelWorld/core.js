// Herramientas de pixel art del mundo del footer: rejilla de 1 px de arte =
// 2 px de CSS, sprites escritos como texto, buffers de pixeles y trazos sin
// suavizado. Todo dibuja en canvas 2D; nada de React.

export const ART = 2;

const hexCache = new Map();
export function rgb(hex) {
  let value = hexCache.get(hex);
  if (!value) {
    const n = parseInt(hex.slice(1), 16);
    value = [n >> 16 & 255, n >> 8 & 255, n & 255];
    hexCache.set(hex, value);
  }
  return value;
}

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// Aleatorio con semilla (mulberry32): el mismo bosque en cada visita.
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Tramado ordenado 4x4 para degradados y sombras sin mezclar colores.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

export const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Un sprite a medio deshacer: solo quedan los pixeles cuya trama esta por
// debajo de `k` (0..1, en cuartos). Para aparecer y desaparecer en pasos de
// pixel, sin escalar ni volver transparente el dibujo. Se cachea por sprite.
const dissolveCache = new WeakMap();
export function dissolveSprite(img, k) {
  const step = Math.round(Math.max(0, Math.min(1, k)) * 4) / 4;
  if (step >= 1) return img;
  let byStep = dissolveCache.get(img);
  if (!byStep) { byStep = new Map(); dissolveCache.set(img, byStep); }
  let out = byStep.get(step);
  if (!out) {
    out = document.createElement("canvas");
    out.width = img.width; out.height = img.height;
    const g = out.getContext("2d");
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, out.width, out.height);
    for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) if (bayer(x, y) >= step) data.data[(y * out.width + x) * 4 + 3] = 0;
    g.putImageData(data, 0, 0);
    byStep.set(step, out);
  }
  return out;
}

export function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w); c.height = Math.max(1, h);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// Buffer de pixeles: se pinta pixel a pixel y se vuelca a un canvas al final.
export class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  set(x, y, col, a = 255) {
    x = Math.floor(x); y = Math.floor(y);
    if (!col || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, c = rgb(col);
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a;
  }
  clear(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[(y * this.w + x) * 4 + 3] = 0;
  }
  rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, col); }
  alpha(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0; return this.d[(y * this.w + x) * 4 + 3]; }
  canvas() {
    const [c, g] = makeCanvas(this.w, this.h);
    g.putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return c;
  }
}

// Cada caracter es un pixel del color de su letra en la paleta ("." vacio).
export function gridSprite(rows, pal) {
  const w = Math.max(...rows.map((r) => r.length)), b = new Buf(w, rows.length);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) b.set(x, y, c); } });
  return b.canvas();
}

// Igual, con contorno de color alrededor de la silueta.
export function blob(put, pts, out) {
  const filled = new Set(pts.map((q) => q[0] + "," + q[1]));
  if (out) for (const [x, y] of pts) for (const [dx, dy] of N4) if (!filled.has((x + dx) + "," + (y + dy))) put(x + dx, y + dy, out);
  for (const [x, y, c] of pts) put(x, y, c);
}
export function stampRows(put, rows, pal, x0, y0, out) {
  const pts = [];
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) pts.push([x0 + x, y0 + y, c]); } });
  blob(put, pts, out);
}
export function outlinedSprite(rows, pal, out) {
  const w = Math.max(...rows.map((r) => r.length)) + 2, h = rows.length + 2, b = new Buf(w, h);
  stampRows((x, y, c) => b.set(x, y, c), rows, pal, 1, 1, out);
  return b.canvas();
}

export function flipped(img, vertical) {
  const [c, g] = makeCanvas(img.width, img.height);
  if (vertical) { g.translate(0, img.height); g.scale(1, -1); } else { g.translate(img.width, 0); g.scale(-1, 1); }
  g.drawImage(img, 0, 0);
  return c;
}

// Un cuarto de vuelta en el sentido del reloj (sin espejar: lo de arriba sigue
// arriba en un sprite en diagonal que pasa de subir a bajar).
export function turned(img) {
  const [c, g] = makeCanvas(img.height, img.width);
  g.translate(img.height, 0); g.rotate(Math.PI / 2);
  g.drawImage(img, 0, 0);
  return c;
}

export function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
export function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
export function discRows(g, cx, cy, r) {
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3);
    g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}
export function ellipseRows(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let dy = -ry; dy <= ry; dy++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
    g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}

// Linea de Bresenham, un pixel de grosor.
export function line(g, x0, y0, x1, y1, c) {
  g.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let n = 0; n < 400; n++) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function blit(g, img, x, y, flip, alpha) {
  x = Math.round(x); y = Math.round(y);
  if (alpha !== undefined && alpha !== 1) g.globalAlpha = alpha;
  if (flip) { g.save(); g.translate(x + img.width, y); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore(); }
  else g.drawImage(img, x, y);
  g.globalAlpha = 1;
}

// Halo aditivo en escalones (luz emisiva sobre la escena ya iluminada).
export function halo(g, x, y, r, col, a) {
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "rgba(" + col + "," + a + ")";
  discRows(g, Math.round(x), Math.round(y), Math.max(1, Math.round(r)));
  g.globalCompositeOperation = "source-over";
}

// Construye algo la primera vez que se pide y lo guarda.
export function lazy(build) {
  let value;
  return () => (value ??= build());
}
