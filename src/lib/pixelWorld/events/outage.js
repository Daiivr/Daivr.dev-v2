import { gridSprite, halo, lazy, outlinedSprite, px, rect } from "../core.js";
import { FEET } from "../layout.js";

// El apagon (useBuddyOutage) en pixel art: se va la luz del mundo (las
// farolas se apagan; la hoguera sigue), Pip saca la linterna y barre el
// sendero con el haz, encuentra la caja de fusibles, la arregla entre
// chispas y la luz vuelve. Fases del hook: flicker 1,2 s, search, fix,
// restore, stow.
const SPRITES = lazy(() => ({
  torch: outlinedSprite(["GGGGy", "GgggY", "GGGGy"], { G: "#537d88", g: "#b5e3e1", y: "#d5a448", Y: "#fffce3" }, "#06171c"),
  box: outlinedSprite([
    "BBBBBBBBBB", "BmmmmmmmmB", "BmYmmwwwmB", "BmmmmmmmmB", "BkkkBdddBB", "BkRkBdddBB", "BkkkBdddBB", "BkkkBBBBBB",
    "BkkkBrBrBB", "BBBBBBBBBB", "...pp..pp.", "...pp..pp.", "...pp..pp."
  ], { B: "#30535d", m: "#102b35", Y: "#ffd166", w: "#7da5a6", k: "#050f17", R: "#ee697a", d: "#bdd6c1", r: "#ff726d", p: "#527580" }, "#07151d"),
  boxOn: gridSprite(["..........", "..........", "..........", "..........", "..........", "..R.......", "..........", "..........", ".....g.g.."], { R: "#3fff97", g: "#57efbf" })
}));
const DARK = [0.1, 0.11, 0.16];

const phaseOf = (actor) => (actor.mood === "outage" ? actor.outage || "" : "");

export function outageUpdate(actor, a, env) {
  const phase = phaseOf(actor);
  if (!phase) { a.outage = null; return; }
  const O = (a.outage ??= { phase: "", since: 0 });
  if (O.phase !== phase) {
    O.phase = phase; O.since = env.t;
    if (phase === "restore") for (let i = 0; i < 10; i++) env.spawn({ k: "star", x: O.boxX ?? actor.x, y: FEET - 14, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 20, g: 60, life: 0.6 });
  }
  O.boxX = actor.x + actor.dir * 30;
  if (phase === "fix" && Math.random() < env.dt * 10) env.spawn({ k: "spark", x: O.boxX - actor.dir * 3, y: FEET - 12, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, g: 60, life: 0.35 + Math.random() * 0.2 });
}

export function outagePose(actor, a, t) {
  const O = a.outage;
  if (!O) return null;
  const e = t - O.since;
  if (O.phase === "flicker") return { pose: "crouch", expr: "surprised", handsBusy: true };
  if (O.phase === "search") return { pose: "ready", handsBusy: true, lookX: Math.sin(e * 1.6) > 0 ? 1 : 0 };
  if (O.phase === "fix") return { pose: "reel", frame: Math.floor(t * 6) % 2, expr: "focus", handsBusy: true };
  if (O.phase === "restore") return { pose: e < 0.5 ? "jump" : "idle", expr: "happy", hop: e < 0.5 ? Math.sin(e / 0.5 * Math.PI) * 4 : 0 };
  return null;
}

// Cuanto se apaga el mundo y que luz queda (la de la linterna).
export function outageLight(actor, a, env) {
  const O = a.outage;
  if (!O) return null;
  const e = env.t - O.since;
  const dim = O.phase === "flicker" ? (Math.floor(e * 7) % 2 ? 0.9 : 0.3) : O.phase === "search" || O.phase === "fix" ? 1 : O.phase === "restore" ? Math.max(0, 1 - e / 1.7) : 0;
  const lights = [];
  if (O.beam && dim > 0.3) lights.push({ x: O.beam[2], y: O.beam[3], r: 14, c: [1, 0.95, 0.75], s: 0.8 });
  return { dim, dark: DARK, lights };
}

// La caja de fusibles aparece al buscarla y se queda hasta recoger.
export function outageDrawGround(g, actor, a, env) {
  const O = a.outage;
  if (!O || !["search", "fix", "restore", "stow"].includes(O.phase)) return;
  const e = env.t - O.since, S = SPRITES(), x = Math.round(O.boxX) - 6, y = FEET - S.box.height + 1;
  if (O.phase === "search" && e < 0.8) return;
  if (O.phase === "stow") { const k = Math.max(0, 1 - e / 0.8); if (k <= 0) return; g.globalAlpha = k; }
  g.drawImage(S.box, x, y + (O.phase === "fix" && Math.floor(env.t * 12) % 2 ? 1 : 0));
  if (O.phase === "restore" || O.phase === "stow") g.drawImage(S.boxOn, x + 1, y + 1);
  g.globalAlpha = 1;
}

// La linterna en la mano (y el haz encima de la luz, en overlay).
export function outageDrawFront(g, actor, a, fr, env) {
  const O = a.outage;
  if (!O || !["flicker", "search", "fix"].includes(O.phase)) { if (O) O.beam = null; return; }
  const hand = env.toWorld(fr, fr.rig.a.hand), f = actor.dir, S = SPRITES(), e = env.t - O.since;
  const img = S.torch;
  g.save();
  if (f < 0) { g.translate(hand[0] * 2, 0); g.scale(-1, 1); }
  g.drawImage(img, hand[0] - 1, hand[1] - 2);
  g.restore();
  // El haz barre el sendero buscando; al arreglar, apunta a la caja.
  const ang = O.phase === "fix" ? 0.25 : O.phase === "search" ? 0.15 + Math.sin(e * 1.6) * 0.35 : 0.1;
  const len = 34, ex = hand[0] + f * Math.cos(ang) * len, ey = hand[1] + Math.sin(ang) * len;
  O.beam = [hand[0] + f * 5, hand[1], ex, Math.min(FEET, ey)];
}
export function outageDrawOverlay(g, actor, a, fr, env) {
  const O = a.outage;
  if (!O?.beam || O.phase === "flicker" && Math.floor((env.t - O.since) * 7) % 2) return;
  const [x0, y0, x1, y1] = O.beam, steps = 18;
  g.globalCompositeOperation = "lighter";
  for (let i = 1; i <= steps; i++) {
    const p = i / steps, x = Math.round(x0 + (x1 - x0) * p), y = Math.round(y0 + (y1 - y0) * p), w = Math.round(1 + p * 6);
    g.fillStyle = `rgba(255,236,170,${0.16 * (1 - p * 0.6)})`;
    g.fillRect(x, y - w, 2, w * 2 + 1);
  }
  g.globalCompositeOperation = "source-over";
  halo(g, x1, y1, 4, "255,240,190", 0.15);
  px(g, Math.round(x0), Math.round(y0), "#fffce3");
  rect(g, Math.round(x0) - 1, Math.round(y0) - 1, 1, 1, "#fff6cf");
}
