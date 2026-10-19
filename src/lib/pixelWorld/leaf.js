// Una hoja grande vista un poco desde arriba, para el paraguas de hoja (en el
// mundo, events/rain.js, y en su icono del mercado, marketGoods.js). Arqueada:
// la base atras, la parte ancha subiendo y la punta afilada que cae delante.
// El nervio va por el medio de la hoja, las venas salen en diagonal hacia la
// punta (hacia arriba y hacia abajo), la mitad de arriba recibe la luz y la de
// abajo queda en sombra, con el envés curvado asomando por el borde.
// `set(x, y, key)` pinta con claves: out, h, l, m, d, under, rib, vein, stem.
// Dibujada con la punta a la derecha (x = 0 la base, len - 1 la punta).
export function paintLeaf(set, { len, peakY, rise, droop, H }) {
  const mid = (x) => {
    const p = x / (len - 1);
    const arch = p < 0.38 ? rise * ((0.38 - p) / 0.38) ** 2 : rise * ((p - 0.38) / 0.62) ** 2;
    return peakY + arch + droop * p ** 6;
  };
  const half = (x) => { const p = x / (len - 1); return H * Math.sin(Math.PI * Math.min(0.999, 0.04 + p * 0.96)) ** 0.55 * (1 - 0.3 * p); };
  const top = (x) => Math.round(mid(x) - half(x) * 0.62);
  const bot = (x) => Math.round(mid(x) + half(x) * 0.5);
  for (let x = 0; x < len; x++) {
    const p = x / (len - 1), m = mid(x), hf = Math.max(0.6, half(x)), t = top(x), b = bot(x);
    set(x, t - 1, "out");
    set(x, b + 1, "out");
    for (let y = t; y <= b; y++) {
      const rel = (y - m) / hf, k = rel * 0.95 + (p - 0.35) * 0.55;
      const curl = y === b && b > t + 1 && p > 0.12 && p < 0.88;
      set(x, y, curl ? "under" : k < -0.62 ? "h" : k < -0.2 ? "l" : k < 0.25 ? "m" : "d");
    }
  }
  // las venas, de cuatro en cuatro desde el nervio, hacia la punta
  for (let x0 = 3; x0 < len - 4; x0 += 4) {
    for (let i = 1; i < 5; i++) {
      const x = x0 + i, up = Math.round(mid(x0) - i * 0.7), down = Math.round(mid(x0) + i * 0.6);
      if (up > top(x)) set(x, up, "vein");
      if (down < bot(x)) set(x, down, "vein");
    }
  }
  // el nervio por el medio, de la base a casi la punta
  for (let x = 1; x < len - 2; x++) set(x, Math.round(mid(x)), "rib");
  // la punta afilada y el rabito de la base
  set(len, Math.round(mid(len - 1)) + 1, "out"); set(len - 1, Math.round(mid(len - 1)) + 1, "d");
  set(-1, Math.round(mid(0)), "stem"); set(-2, Math.round(mid(0)), "out");
  return { mid, top, bot };
}
