import { px, rng } from "../core.js";

// Rocio de la mañana: al salir el sol (y la primera hora), las puntas de la
// hierba y las flores centellean con destellos diminutos que se encienden y
// se apagan cada uno a su ritmo. En invierno es escarcha (mas azulada).
export function createDew() {
  let points = [], k = 0;

  function setup(ctx) {
    const R = rng(808), out = [];
    for (const tuft of ctx.tufts) if (R() < 0.35) out.push({ x: tuft.x + Math.round(R() * 2 - 1), y: tuft.y - 2 - Math.floor(R() * 2) });
    for (const f of ctx.flowers) if (R() < 0.4) out.push({ x: f.x, y: f.y - f.stem - 2 });
    points = out.map((p) => ({ ...p, per: 1.6 + R() * 3, ph: R() * 10 }));
  }

  function update(ctx) {
    const morning = ctx.sky.phase === "dawn" && !ctx.rain && ctx.light.dark < 0.5;
    k = Math.max(0, Math.min(1, k + (morning ? 1 : -1) * ctx.dt / 3));
  }

  function glow(g, ctx) {
    if (k <= 0) return;
    const frost = ctx.season === "winter";
    const hi = frost ? "#e8f6ff" : "#ffffff", mid = frost ? "#a8d4f0" : "#c8f0ff";
    for (const p of points) {
      // un destello corto en cada vuelta
      const c = ((ctx.t + p.ph) % p.per) / p.per;
      if (c > 0.22) { if (c > 0.6 && c < 0.64) { g.globalAlpha = 0.5 * k; px(g, p.x, p.y, mid); g.globalAlpha = 1; } continue; }
      const s = Math.sin(c / 0.22 * Math.PI);
      g.globalAlpha = k * Math.min(1, s * 1.4);
      px(g, p.x, p.y, hi);
      if (s > 0.55) { px(g, p.x - 1, p.y, mid); px(g, p.x + 1, p.y, mid); px(g, p.x, p.y - 1, mid); px(g, p.x, p.y + 1, mid); }
      g.globalAlpha = 1;
    }
  }

  return { setup, update, glow, get active() { return k > 0; } };
}
