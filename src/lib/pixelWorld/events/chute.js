import { Buf, halo, line } from "../core.js";
import { FEET } from "../layout.js";

// La llegada al footer (ScreenBuddy, humor "chute"): Pip baja colgado del
// paracaidas balanceandose, toca el sendero levantando polvo, la tela se
// desinfla y se guarda en la mochila. Con las botas cohete no hay paracaidas:
// baja frenando con las llamas y al tocar suelta un fogonazo y vapor. Si lo
// agarran en pleno descenso, la tela se pliega y se guarda en la mochila ahi
// mismo (no baja al suelo); al soltarlo en alto se vuelve a abrir.
const LAND_S = 1.4, STOW_S = 0.4;
const chutes = new Map();
export function chuteCanvas(upgraded) {
  let cnv = chutes.get(upgraded);
  if (cnv) return cnv;
  const w = 31, cx = 15, b = new Buf(w, 12);
  const pal = upgraded ? { out: "#0b2a24", a: "#3fff97", b: "#45d8ff", hl: "#eafff4", d: "#1f9a70" } : { out: "#1b2430", a: "#d9e2ef", b: "#aeb9d1", hl: "#f5f8fb", d: "#8a97ad" };
  for (let r = 0; r < 10; r++) {
    const hw = Math.round(15 * Math.pow(Math.sin((r + 0.5) / 10 * Math.PI / 2), 0.7));
    for (let x = cx - hw; x <= cx + hw; x++) {
      const panel = Math.floor((x - cx + 64) / 5) % 2;
      let col = panel ? pal.a : pal.b;
      if (x < cx - 4 && r > 1 && r < 5) col = pal.hl;
      if (r >= 8 || x > cx + 8) col = panel ? pal.b : pal.d;
      if (x === cx - hw || x === cx + hw || r === 0) col = pal.out;
      b.set(x, r, col);
    }
  }
  for (let x = 0; x < w; x++) if ((x - cx + 64) % 5 !== 0) b.set(x, 10, pal.out);
  cnv = b.canvas(); chutes.set(upgraded, cnv);
  return cnv;
}

const rocket = (actor) => actor.outfit?.feet === "rocket-boots";

export function chuteUpdate(actor, a, env) {
  const falling = actor.mood === "chute";
  let C = a.chute;
  if (falling && (!C || C.state !== "fall")) C = a.chute = { state: "fall", since: env.t };
  if (!C) return;
  if (!falling && C.state === "fall" && (actor.mood === "held" || (actor.y || 0) < -6)) { C.state = "stow"; C.since = env.t; }
  if (C.state === "stow") { if (env.t - C.since > STOW_S) a.chute = null; return; }
  if (!falling && C.state === "fall") {
    C.state = "land"; C.since = env.t;
    const n = rocket(actor) ? 16 : 10;
    for (let i = 0; i < n; i++) env.spawn({ k: "dust", x: actor.x + (Math.random() - 0.5) * 6, y: FEET, vx: (Math.random() - 0.5) * 50, vy: -6 - Math.random() * 14, g: 40, life: 0.4 + Math.random() * 0.3, c: Math.random() < 0.5 ? "#cba062" : "#e4c389" });
  }
  if (C.state === "fall" && rocket(actor) && Math.random() < env.dt * 20) env.spawn({ k: "smoke", x: actor.x, y: FEET + (actor.y || 0) + 2, vx: (Math.random() - 0.5) * 10, vy: 14, life: 0.8, max: 0.8 });
  if (C.state === "land" && rocket(actor) && Math.random() < env.dt * 3) env.spawn({ k: "steam", x: actor.x + (Math.random() - 0.5) * 4, y: FEET - 1, vx: (Math.random() - 0.5) * 4, vy: -5, life: 1, max: 1 });
  if (C.state === "land" && env.t - C.since > LAND_S) a.chute = null;
}

export function chutePose(actor, a, t) {
  const C = a.chute;
  if (!C) return null;
  if (C.state === "stow") return null;
  if (C.state === "fall") return rocket(actor) ? { pose: "hover", frame: Math.floor(t * 10) % 2, handsBusy: true, rocketBurn: 1 } : { pose: "hang", frame: Math.floor(t * 3) % 2, handsBusy: true };
  const e = t - C.since;
  return e < 0.25 ? { pose: "land", expr: "happy", rocketBurn: rocket(actor) ? 2 : 0 } : null;
}

// La tela y sus cuerdas, detras de Pip (las cuerdas van a sus manos).
export function chuteDrawBehind(g, actor, a, fr, env) {
  const C = a.chute;
  if (!C || rocket(actor)) return;
  const e = env.t - C.since;
  const k = C.state === "land" ? Math.min(1, e / 1) : 0;
  const pack = C.state === "stow" ? Math.min(1, e / STOW_S) : C.state === "land" && e > 1 ? Math.min(1, (e - 1) / 0.4) : 0;
  if (pack >= 1) return;
  const hand = env.toWorld(fr, fr.rig.a.hand), handB = env.toWorld(fr, fr.rig.a.handB), skull = env.toWorld(fr, fr.rig.a.skull);
  const back = env.toWorld(fr, [11, 27]);
  const sway = C.state === "fall" ? Math.sin(env.t * 1.7) : 0;
  const img = chuteCanvas(actor.outfit?.chute === "parachute-upgrade");
  const cw = Math.max(4, Math.round(31 * (1 - 0.4 * k))), ch = Math.max(2, Math.round(11 * (1 - 0.8 * k)));
  let cx = Math.round(actor.x + sway * 2 - 8 * k * actor.dir), cy = Math.round(skull[1] - 22 + (FEET - 10 - (skull[1] - 22)) * k);
  if (pack > 0) { cx = Math.round(cx + (back[0] - cx) * pack); cy = Math.round(cy + (back[1] - cy) * pack); }
  const sw = Math.max(3, Math.round(cw * (1 - pack))), sh = Math.max(2, Math.round(ch * (1 - pack * 0.7)));
  if (actor.outfit?.chute === "parachute-upgrade" && k < 0.5) { halo(g, cx, cy + 5, 18, "69,216,255", 0.06); halo(g, cx, cy + 5, 12, "63,255,151", 0.06); }
  if (k < 0.7) {
    g.globalAlpha = 1 - k;
    for (const [dx, h] of [[-13, handB], [-6, handB], [6, hand], [13, hand]]) line(g, cx + Math.round(dx * cw / 31), cy + sh - 1, h[0], h[1] - 1, "#e8eef2");
    g.globalAlpha = 1;
  }
  g.drawImage(img, cx - Math.floor(sw / 2), cy, sw, sh);
}

// Lo mas alto sobre Pip mientras baja: la tela.
export function chuteTop(actor, a, fr, env) {
  const C = a.chute;
  if (!C || C.state !== "fall" || rocket(actor)) return null;
  return env.toWorld(fr, fr.rig.a.skull)[1] - 22;
}
