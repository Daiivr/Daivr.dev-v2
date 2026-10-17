import { bayer, makeCanvas, rgb } from "./core.js";

// Volumenes de pixel con sombreado, para las criaturas grandes (el leviatan y
// el kraken): esferas, elipsoides girados y membranas planas se meten en un
// z-buffer, y despues cada pixel toma el tono de su material segun hacia donde
// mira (luz arriba a la izquierda), con tramado ordenado, contorno por fuera y
// una linea oscura donde una pieza pasa por delante de otra. Asi un cuello o
// un tentaculo es un tubo redondo de verdad y no un monton de discos planos.
const LIGHT = (() => { const v = [-0.5, -0.72, 0.48], l = Math.hypot(...v); return v.map((c) => c / l); })();
const EMPTY = -1e9;

// Un material: tonos de sombra a luz, contorno y, si quiere, su propio
// sombreado (devuelve un indice de tono o un color).
export function material(tones, outline, shade) {
  return { tones: tones.map(rgb), outline: rgb(outline), shade };
}

export function createSculpt(w, h) {
  const n = w * h;
  const z = new Float32Array(n), nx = new Float32Array(n), ny = new Float32Array(n), nz = new Float32Array(n);
  const u = new Float32Array(n), aux = new Float32Array(n), mat = new Uint8Array(n), part = new Uint8Array(n);
  const img = new ImageData(w, h);
  const [cv, cg] = makeCanvas(w, h);
  let ox = 0, oy = 0;

  function reset(x0, y0) { ox = Math.round(x0); oy = Math.round(y0); z.fill(EMPTY); mat.fill(0); part.fill(0); }
  function plot(x, y, zz, a, b, c, m, uu, p, ax) {
    x -= ox; y -= oy;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (zz <= z[i]) return;
    z[i] = zz; nx[i] = a; ny[i] = b; nz[i] = c; mat[i] = m; u[i] = uu; part[i] = p; aux[i] = ax;
  }
  // Esfera: `side` es una direccion 2D; aux guarda cuanto mira el pixel hacia ella.
  function sphere(cx, cy, r, m, uu = 0, dz = 0, p = 1, side = null) {
    if (r < 0.5) { plot(Math.floor(cx), Math.floor(cy), dz + r, 0, 0, 1, m, uu, p, 0); return; }
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r), r2 = r * r;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const zz = Math.sqrt(r2 - d2);
      plot(x, y, zz + dz, dx / r, dy / r, zz / r, m, uu, p, side ? (dx * side[0] + dy * side[1]) / r : 0);
    }
  }
  function ellipsoid(cx, cy, rx, ry, rz, rot, m, uu = 0, dz = 0, p = 1) {
    const c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, lx = dx * c + dy * s, ly = -dx * s + dy * c;
      const q = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry);
      if (q > 1) continue;
      const zl = rz * Math.sqrt(1 - q);
      let a = lx / (rx * rx), b = ly / (ry * ry), cc = zl / (rz * rz);
      const len = Math.hypot(a, b, cc) || 1;
      a /= len; b /= len; cc /= len;
      plot(x, y, zl + dz, a * c - b * s, a * s + b * c, cc, m, uu, p, ly / ry);
    }
  }
  // Un tubo: esferas a lo largo de [x, y, r(, dz)], con u de 0 a 1.
  function tube(pts, m, p = 1, sides = null) {
    const last = Math.max(1, pts.length - 1);
    pts.forEach((pt, i) => sphere(pt[0], pt[1], pt[2], m, i / last, pt[3] || 0, p, sides ? sides[i] : null));
  }
  // Un triangulo plano (membranas de aletas), con una normal fija.
  function tri(a, b, c, zz, norm, m, p = 1, uu = 0) {
    const x0 = Math.floor(Math.min(a[0], b[0], c[0])), x1 = Math.ceil(Math.max(a[0], b[0], c[0]));
    const y0 = Math.floor(Math.min(a[1], b[1], c[1])), y1 = Math.ceil(Math.max(a[1], b[1], c[1]));
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 0.01) return;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area;
      const w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
      plot(x, y, zz, norm[0], norm[1], norm[2], m, uu + w1 * 0.5, p, w2);
    }
  }
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && z[y * w + x] > EMPTY;
  // Lo que hay en un pixel (en coordenadas del mundo): para dibujar detalles
  // encima solo donde se ve esa pieza.
  function partAt(x, y) { x = Math.floor(x) - ox; y = Math.floor(y) - oy; return x >= 0 && y >= 0 && x < w && y < h ? part[y * w + x] : 0; }

  // Pinta el z-buffer: `mats[id]` es el material, `cut` la fila del mundo desde
  // la que no se pinta (la superficie del agua), `tint` la luz que le llega.
  function render(mats, { cut = 1e9, tint = [1, 1, 1], desat = 0, gap = 2.6 } = {}) {
    const d = img.data;
    d.fill(0);
    for (let y = 0; y < h; y++) {
      if (y + oy >= cut) break;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (z[i] <= EMPTY) continue;
        const M = mats[mat[i]];
        if (!M) continue;
        let col;
        const zi = z[i];
        const edge = !filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || (!filled(x, y + 1) && y + 1 + oy < cut);
        let seam = false;
        if (!edge) for (const j of [i - 1, i + 1, i - w, i + w]) if (z[j] - zi > gap && part[j] !== part[i]) { seam = true; break; }
        if (edge || seam) col = M.outline;
        else {
          const lam = nx[i] * LIGHT[0] + ny[i] * LIGHT[1] + nz[i] * LIGHT[2];
          const custom = M.shade ? M.shade({ lam, nx: nx[i], ny: ny[i], nz: nz[i], u: u[i], aux: aux[i], x: x + ox, y: y + oy, b: bayer(x + ox, y + oy) }) : null;
          if (Array.isArray(custom)) col = custom;
          else {
            const T = M.tones, k = custom ?? Math.floor(Math.max(0, Math.min(0.999, (lam * 0.5 + 0.5) * 1.1 - 0.05 + (bayer(x + ox, y + oy) - 0.5) * 0.35)) * T.length);
            col = T[Math.max(0, Math.min(T.length - 1, k))];
          }
        }
        let r = col[0] * tint[0], g = col[1] * tint[1], b = col[2] * tint[2];
        if (desat) { const l = r * 0.3 + g * 0.59 + b * 0.11; r += (l - r) * desat; g += (l - g) * desat; b += (l - b) * desat; }
        const k4 = i * 4;
        d[k4] = r; d[k4 + 1] = g; d[k4 + 2] = b; d[k4 + 3] = 255;
      }
    }
    cg.putImageData(img, 0, 0);
    return cv;
  }

  return { reset, sphere, ellipsoid, tube, tri, render, partAt, get ox() { return ox; }, get oy() { return oy; }, canvas: cv, ctx: cg };
}
