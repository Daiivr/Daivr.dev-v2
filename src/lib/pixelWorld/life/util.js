import { bayer, makeCanvas } from "../core.js";

// Lo que comparten los bichos y detalles del valle (life/*).

// La estacion de la naturaleza por el mes (el evento "winter" del sitio cuenta
// como invierno): hojas en otoño, cardenales en invierno, forraje de cada epoca.
export function natureSeason(event = "") {
  if (event === "winter") return "winter";
  const m = new Date().getMonth();
  return m === 11 || m < 2 ? "winter" : m < 5 ? "spring" : m < 8 ? "summer" : "autumn";
}

// El dia de hoy como numero (para lo que cambia cada dia: forraje, la carta).
export const dayNumber = (date = new Date()) => Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);

// Nieve acumulada sobre un sprite: en cada pixel con hueco encima se posa
// nieve, `level` filas hacia abajo (0..3) mientras siga habiendo dibujo, con
// el borde de arriba blanco, el resto azulado y algun copo suelto en el borde.
const snowCache = new WeakMap();
export function snowCap(img, level) {
  if (!img || level <= 0) return null;
  let byLevel = snowCache.get(img);
  if (!byLevel) { byLevel = new Map(); snowCache.set(img, byLevel); }
  let out = byLevel.get(level);
  if (out) return out;
  const w = img.width, h = img.height;
  const [src, sg] = makeCanvas(w, h);
  sg.drawImage(img, 0, 0);
  const data = sg.getImageData(0, 0, w, h).data, solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 120;
  const [c, g] = makeCanvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!solid(x, y) || solid(x, y - 1)) continue;
    // (las paredes casi verticales cogen menos: solo si el vecino tambien tiene techo)
    const ledge = !solid(x - 1, y - 1) && !solid(x + 1, y - 1) && (solid(x - 1, y) || solid(x + 1, y));
    const depth = ledge ? level : Math.max(1, level - 1);
    for (let k = 0; k < depth && solid(x, y + k); k++) {
      g.fillStyle = k === 0 ? "#ffffff" : k === depth - 1 ? "#cfdced" : "#e8f0f8";
      g.fillRect(x, y + k, 1, 1);
    }
    if (level >= 2 && bayer(x, y) > 0.86) { g.fillStyle = "#ffffff"; g.fillRect(x, y - 1, 1, 1); }
  }
  byLevel.set(level, c);
  return c;
}

// La fila de arriba de un sprite en cada columna (para posarse encima).
export function topContour(img) {
  const w = img.width, h = img.height, [cv, g] = makeCanvas(w, h);
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, w, h).data, top = [];
  for (let x = 0; x < w; x++) { let y = 0; while (y < h && data[(y * w + x) * 4 + 3] < 120) y++; top.push(y < h ? y : null); }
  cv.width = 0;
  return top;
}

export const between = (a, b) => a + Math.random() * (b - a);
