import { FEET } from "../layout.js";

// Huellas de Pip: en la nieve (azuladas) y en el barro del sendero despues de
// llover (marrones), alternando pie izquierdo y derecho, y se borran despacio.
// Las visitas son hologramas y no dejan huella; volando con las botas cohete,
// tampoco.
const STEP = 4, MAX = 140;

export function createFootprints() {
  let prints = [], last = new Map();

  function update(ctx) {
    const snowy = ctx.snowGround > 0.35, muddy = !snowy && ctx.wet > 0.3;
    const life = snowy ? 45 : 28;
    if (snowy || muddy) for (const a of ctx.actors) {
      if (a.ghost || a.aloft || (a.y || 0) < -1 || (a.outfit?.feet === "rocket-boots" && a.moving)) { last.delete(a.id); continue; }
      const prev = last.get(a.id);
      if (!prev) { last.set(a.id, { x: a.x, side: 0 }); continue; }
      if (Math.abs(a.x - prev.x) >= STEP) {
        prev.side ^= 1;
        prev.x = a.x;
        prints.push({ x: Math.round(a.x) + (prev.side ? 1 : -2), y: FEET + prev.side, born: ctx.t, life, snow: snowy, dir: a.dir || 1 });
        if (prints.length > MAX) prints.shift();
      }
    }
    else last.clear();
    prints = prints.filter((p) => ctx.t - p.born < p.life);
  }

  function ground(g, ctx) {
    for (const p of prints) {
      const age = (ctx.t - p.born) / p.life;
      g.globalAlpha = Math.min(1, (1 - age) * 1.6) * (p.snow ? 1 : 0.8);
      // la suela: dos filas, el talon mas hundido (oscuro) y la punta hacia
      // donde iba; en la nieve con el borde apisonado mas claro
      const toe = p.dir > 0 ? 1 : 0, heel = 1 - toe;
      g.fillStyle = p.snow ? "#8ea6c2" : "#3a2814";
      g.fillRect(p.x, p.y, 2, 2);
      g.fillStyle = p.snow ? "#6a84a6" : "#2a1a0a";
      g.fillRect(p.x + heel, p.y + 1, 1, 1);
      g.fillStyle = p.snow ? "#f4f8fc" : "#6a4a28";
      g.fillRect(p.x + (toe ? 2 : -1), p.y, 1, 1);
    }
    g.globalAlpha = 1;
  }

  return { setup() { prints = []; last = new Map(); }, update, ground, get count() { return prints.length; } };
}
