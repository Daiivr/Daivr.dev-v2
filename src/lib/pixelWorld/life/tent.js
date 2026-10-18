import { halo, lazy, outlinedSprite, px, rect } from "../core.js";
import { behindTent } from "../events/tent.js";

// La tienda de Pip: lona naranja con la puerta abierta y las solapas
// recogidas, un remiendo azul, el ribete rojo abajo, cuerdas y estacas y un
// banderin que ondea en el palo. Pip duerme dentro (ScreenBuddy lo lleva
// hasta la puerta, tambien antes del modo attract): al entrar y salir la
// puerta se abre de par en par y las solapas aletean (events/tent.js anima a
// Pip); dentro, la entrada se ilumina calida, asoman sus botas y salen las
// Zzz por arriba.
const TW = 28, TH = 18;
function tentRows(doorW = 5.5) {
  const rows = [];
  for (let y = 0; y < TH; y++) {
    let r = "";
    const hw = (y + 1) / TH * (TW / 2);
    for (let x = 0; x < TW; x++) {
      const dx = x + 0.5 - TW / 2;
      if (Math.abs(dx) > hw) { r += "."; continue; }
      const door = y >= 6 ? (y - 6) / (TH - 6) * doorW : -1;
      let c = dx < 0 ? "c" : "d";
      if (Math.abs(dx) < door) c = "k";
      else if (Math.abs(dx) < door + 1.2 && y >= 6) c = "f";
      else if (y < 6 && Math.abs(dx) < 0.6) c = "r";
      if (dx < 0 && Math.abs(dx) > hw - 1.3) c = "C";
      if (y === TH - 1 && c !== "k") c = "T";
      if (y >= 9 && y <= 11 && dx >= 6 && dx <= 9) c = (x + y) % 3 === 0 ? "s" : "p";
      r += c;
    }
    rows.push(r);
  }
  return rows;
}
const PAL = { c: "#d8a25a", C: "#f0c27a", d: "#a8743e", r: "#7a4a22", k: "#2a1a10", f: "#e8b878", T: "#a83a2a", p: "#5a8ac8", s: "#f4e8d0" };
// (la lona sin la entrada: va por delante de Pip mientras cruza la puerta)
const lona = (door) => outlinedSprite(tentRows(door).map((r) => r.replace(/k/g, ".")), PAL, "#3a2210");
const SPRITES = lazy(() => ({
  tent: outlinedSprite(tentRows(), PAL, "#3a2210"),
  open: outlinedSprite(tentRows(7.8), PAL, "#3a2210"),
  ajar: outlinedSprite(tentRows(6.6), PAL, "#3a2210"),
  front: { tent: lona(5.5), open: lona(7.8), ajar: lona(6.6) },
  inside: outlinedSprite(tentRows().map((r) => r.replace(/[^k]/g, ".")), { k: "#ffcf7a" }, null)
}));

export function createTent() {
  let x = 0, base = 71, occupied = false, k = 0, nextZ = 0;
  // la puerta: "enter"/"exit" de quien entra o sale, y desde cuando
  const door = { phase: "", since: 0 };
  const left = () => x - (TW + 2) / 2;
  const top = () => base - TH - 1;

  // (al entrar, abierta y al final aleteando; al salir, abierta y luego entornada)
  function doorState(t) {
    const e = t - door.since;
    if (door.phase === "enter") return e < 0.9 ? "open" : e < 1.3 ? (Math.floor(e * 14) % 2 ? "ajar" : "tent") : "tent";
    if (door.phase === "exit") return e < 0.65 ? "open" : e < 0.95 ? "ajar" : "tent";
    return "tent";
  }

  return {
    setup(ctx) { x = ctx.L.tentX; },
    // Por delante de Pip mientras cruza la puerta: la lona le tapa, la entrada no.
    front(g, ctx) {
      if (!door.phase || !behindTent(door.phase, ctx.t - door.since)) return;
      g.drawImage(SPRITES().front[doorState(ctx.t)], Math.round(left()), top());
    },
    update(ctx) {
      occupied = ctx.actors.some((a) => !a.ghost && a.tent === "in" && a.mood === "sleep");
      const moving = ctx.actors.find((a) => !a.ghost && (a.tent === "enter" || a.tent === "exit"))?.tent || "";
      if (moving !== door.phase) { door.phase = moving; door.since = ctx.t; }
      k = Math.max(0, Math.min(1, k + (occupied ? 1 : -1) * ctx.dt / 1.2));
      if (occupied && ctx.t > nextZ) { nextZ = ctx.t + 1.4; ctx.spawn({ k: "z", x: x + 2, y: top() - 2, vx: -2.5, vy: -4, life: 2.6, max: 2.6, wob: Math.random() * 6 }); }
    },
    ground(g, ctx) {
      const S = SPRITES(), lx = Math.round(left()), ty = top();
      // cuerdas y estacas a los lados
      for (const [sx, ex] of [[lx + 5, lx - 4], [lx + TW - 3, lx + TW + 6]]) {
        const sy = ty + 8, ey = base;
        for (let s = 0; s <= 8; s++) px(g, Math.round(sx + (ex - sx) * s / 8), Math.round(sy + (ey - sy) * s / 8), "#d8c8a0");
        rect(g, ex, ey - 1, 1, 2, "#5c3a1e");
      }
      g.drawImage(S[doorState(ctx.t)], lx, ty);
      const cap = ctx.snowCap?.(S.tent);
      if (cap) g.drawImage(cap, lx, ty);
      // palo con banderin
      const px0 = Math.round(x), flag = Math.floor(ctx.t * (2 + ctx.wind * 2)) % 2;
      rect(g, px0, ty - 3, 1, 4, "#5c3a1e");
      g.fillStyle = "#e84a5a"; g.fillRect(px0 + 1, ty - 3, 3, 1); g.fillRect(px0 + 1, ty - 2, flag ? 2 : 3, 1);
      if (!flag) px(g, px0 + 4, ty - 2, "#e84a5a");
    },
    // la entrada encendida y las botas de Pip asomando
    glow(g, ctx) {
      if (k <= 0) return;
      const S = SPRITES(), lx = Math.round(left()), ty = top();
      g.globalAlpha = k * (0.85 + Math.sin(ctx.t * 3) * 0.05);
      g.drawImage(S.inside, lx, ty);
      g.globalAlpha = k;
      rect(g, Math.round(x) - 3, base - 2, 2, 1, "#6fc4ad"); rect(g, Math.round(x) + 1, base - 2, 2, 1, "#6fc4ad");
      px(g, Math.round(x) - 3, base - 2, "#d6f5e6"); px(g, Math.round(x) + 1, base - 2, "#d6f5e6");
      g.globalAlpha = 1;
      if (ctx.light.dark > 0.3) halo(g, x, base - 5, 6, "255,200,120", 0.08 * k);
    },
    lights(list, ctx) { if (k > 0 && ctx.light.dark > 0.2) list.push({ x, y: base - 5, r: 18, c: [1, 0.8, 0.5], s: 0.55 * k }); },
    get occupied() { return occupied; },
    get x() { return x; }
  };
}
