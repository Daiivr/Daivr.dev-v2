import { lazy, outlinedSprite, px } from "../core.js";

// Cometas los dias de viento: una o dos se mecen en el cielo con su cola de
// lacitos ondeando a favor del viento (hacia la izquierda, como las nubes) y
// el hilo que baja combado hasta las colinas.
const KITES = lazy(() => [
  outlinedSprite(["...r...", "..rRy..", ".rRRyy.", "rRRwyyy", ".bBwgg.", "..bBg..", "...b..."], { r: "#e84a5a", R: "#ff7a8a", y: "#ffd166", w: "#f4f0e8", b: "#3a7ac8", B: "#6aa8f0", g: "#4ac87a" }, "#2a1a2a"),
  outlinedSprite(["...p...", "..pPo..", ".pPPoo.", "pPPwooo", ".tTwyy.", "..tTy..", "...t..."], { p: "#9a5ae0", P: "#c08af8", o: "#ff9a3a", w: "#f4f0e8", t: "#3ac8c0", T: "#7ae8e0", y: "#ffd166" }, "#1e1430")
]);
const BOWS = [["#ff7a8a", "#ffd166"], ["#ffd166", "#7ae8e0"]];

export function createKites() {
  let kites = [], k = 0;

  function setup(ctx) {
    const W = ctx.W;
    kites = [{ ax: Math.round(W * 0.34), ay: 56, h: 13, ph: 0 }, { ax: Math.round(W * 0.8), ay: 57, h: 20, ph: 2.1 }].filter((kt, i) => i === 0 || W > 260);
  }

  function update(ctx) {
    const windy = ctx.wind >= 1.4 && !ctx.rain && ctx.light.dark < 0.45 && !ctx.reduceMotion;
    k = Math.max(0, Math.min(1, k + (windy ? 1 : -1) * ctx.dt / 4));
  }

  function sky(g, ctx) {
    if (k <= 0) return;
    const t = ctx.t, S = KITES();
    kites.forEach((kt, i) => {
      // sube al aparecer, cae al irse
      const lift = (1 - k) * 30;
      const x = Math.round(kt.ax - 16 - ctx.wind * 6 + Math.sin(t * 0.7 + kt.ph) * 4);
      const y = Math.round(kt.h + Math.sin(t * 1.1 + kt.ph) * 3 + lift);
      const img = S[i % S.length], tilt = Math.round(Math.sin(t * 1.3 + kt.ph));
      // hilo: de la punta de abajo a la colina, combado
      g.globalAlpha = 0.5 * k;
      const x0 = x, y0 = y + 7, x1 = kt.ax, y1 = kt.ay, n = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0)));
      for (let s = 0; s <= n; s++) {
        const u = s / n, sag = Math.sin(u * Math.PI) * 5;
        px(g, Math.round(x0 + (x1 - x0) * u - sag * 0.4), Math.round(y0 + (y1 - y0) * u + sag), "#4a4038");
      }
      // cola de lacitos ondeando hacia la izquierda
      g.globalAlpha = k;
      for (let j = 1; j <= 6; j++) {
        const tx = x - j * 3, ty = y + 8 + Math.round(Math.sin(t * 5 - j * 0.9 + kt.ph) * 1.6) + Math.floor(j / 2);
        px(g, tx, ty, "#efe8d8");
        if (j % 2 === 0) { const [c1, c2] = BOWS[i % BOWS.length]; px(g, tx - 1, ty - 1, c1); px(g, tx + 1, ty - 1, c1); px(g, tx - 1, ty + 1, c2); px(g, tx + 1, ty + 1, c2); px(g, tx, ty, c1); }
      }
      g.drawImage(img, x - 4 + tilt, y - 1);
      g.globalAlpha = 1;
    });
  }

  return { setup, update, sky, get active() { return k > 0; } };
}
