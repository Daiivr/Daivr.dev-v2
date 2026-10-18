import { halo, lazy, outlinedSprite, px, rect } from "../core.js";
import { FEET } from "../layout.js";

// El apagon (useBuddyOutage) en pixel art: las farolas chisporrotean y se
// apagan (la hoguera sigue), Pip saca la linterna y barre el sendero con un
// cono de luz con polvo flotando, encuentra el cuadro electrico en su poste
// (con la luz roja parpadeando), abre la puerta, sube el diferencial que
// salto entre chispas y arcos, y la luz vuelve: el piloto se pone verde y las
// farolas se encienden una a una. Fases del hook: flicker 1,2 s, search,
// fix, restore, stow.

// Cuadro electrico cerrado (14 de ancho): tapa con bisel, puerta con su
// junta, pegatina de peligro con "!", picaporte y rejilla. Abajo, el poste de
// madera con su abrazadera y el tubo del cable que baja al suelo.
const DOOR = ["mmmymmm", "mmykymm", "mmykymm", "myykyym", "myyyyym", "yyykyyy", "mmmmmmm", "msssssm", "mmmmmmm"];
const BOX_ROWS = [
  "..LLLLLLLLLL..",
  ".LMMMMMMMMMMD.",
  "LMMMMMMMMMMMMD",
  "LMdddddddddMMD",
  ...DOOR.map((r, i) => "LMd" + r + "d" + (i === 2 || i === 3 ? "hMD" : "MMD")),
  "LMdddddddddMMD",
  "LMMMMMMMMMMMMD",
  ".DDDDDDDDDDDD.",
  "....vWWv..cc..",
  "....bbbb..cc..",
  "....vWWv..cc..",
  "....vWWv..cc..",
  "....vWwv..CC..",
  "....vWWv..cc..",
  "....vWWv..cc..",
  "...gvWWvg.cc.g"
];
// Abierto: dentro, tres diferenciales y los cables de colores (el estado de
// cada palanca se pinta encima).
const OPEN_INSIDE = ["kkkkkkk", "kBkBkBk", "kBkBkBk", "kBkBkBk", "kkkkkkk", "knnnnnk", "krkykGk", "krkykGk", "kkkkkkk"];
const OPEN_ROWS = BOX_ROWS.map((r, i) => (i >= 4 && i <= 12 ? "LMd" + OPEN_INSIDE[i - 4] + "d" + r.slice(11) : r));
const PAL = {
  L: "#b8ccd4", M: "#7d94a0", D: "#3a4a54", d: "#4a5c66", m: "#6a808c", y: "#ffd166", k: "#141c22", h: "#d8e4ea", s: "#26323a",
  v: "#5c3a1e", W: "#8a5a2e", w: "#a8743e", b: "#8a9aa4", c: "#5a6a74", C: "#8a9aa4", g: "#4a8a3a", B: "#c8d4dc",
  r: "#e85a6a", n: "#5a6a74", G: "#3fcf7a"
};
const SPRITES = lazy(() => ({
  box: outlinedSprite(BOX_ROWS, PAL, "#0a1418"),
  open: outlinedSprite(OPEN_ROWS, { ...PAL, k: "#0e1418" }, "#0a1418"),
  // La puerta abierta, vista de canto a la izquierda (con el borde de la pegatina).
  door: outlinedSprite(["Lm", "Lm", "Lm", "Ly", "Ly", "Ly", "Lm", "Ls", "Lm", "Lm", "Lm"], PAL, "#0a1418"),
  // Linterna: mango de goma con su interruptor amarillo, cabeza cromada y cristal.
  torch: outlinedSprite([".....SSS.", "bbbbbSHHL", "bgbybSHHL", "bbbbbSHHL", ".....SSS."], { b: "#2a3036", g: "#4a525a", y: "#ffd166", S: "#8a9aa4", H: "#c8d4dc", L: "#fffce3" }, "#06171c")
}));
const BOX_H = BOX_ROWS.length;
const DARK = [0.1, 0.11, 0.16];
// Cuando sube la palanca dentro de la fase fix (s) y cada cuanto vuelve una farola.
const FLIP_S = 1.7, LAMP_STEP_S = 0.2;

const phaseOf = (actor) => (actor.mood === "outage" ? actor.outage || "" : "");

// Chispas que saltan de un punto (farola o cuadro).
function burst(env, x, y, n, spread = 30) {
  for (let i = 0; i < n; i++) env.spawn({ k: "spark", x: x + (Math.random() - 0.5) * 3, y, vx: (Math.random() - 0.5) * spread, vy: -8 - Math.random() * 22, g: 70, life: 0.3 + Math.random() * 0.35 });
}

export function outageUpdate(actor, a, env) {
  const phase = phaseOf(actor);
  if (!phase) { a.outage = null; return; }
  const O = (a.outage ??= { phase: "", since: 0, lit: 0, flipped: false });
  const lamps = env.layout?.lamps || [];
  if (O.phase !== phase) {
    const was = O.phase;
    O.phase = phase; O.since = env.t;
    // Al irse la luz, cada farola suelta su chispazo.
    if (phase === "search" || (phase === "fix" && was === "")) for (const lx of lamps) burst(env, lx, env.lampY - 2, 6, 26);
    if (phase === "restore") {
      O.lit = 0;
      for (let i = 0; i < 12; i++) env.spawn({ k: "star", x: (O.boxX ?? actor.x), y: FEET - 20, vx: (Math.random() - 0.5) * 44, vy: -20 - Math.random() * 24, g: 60, life: 0.7 });
    }
  }
  O.boxX = actor.x + actor.dir * 30;
  const e = env.t - O.since;
  // Parpadeo: las farolas chisporrotean de vez en cuando.
  if (phase === "flicker" && lamps.length && Math.random() < env.dt * 5) burst(env, lamps[Math.floor(Math.random() * lamps.length)], env.lampY - 2, 2, 18);
  if (phase === "fix") {
    if (Math.random() < env.dt * (O.flipped ? 4 : 12)) burst(env, O.boxX + (Math.random() - 0.5) * 6, FEET - BOX_H + 8, 1, 34);
    if (!O.flipped && e > FLIP_S) { O.flipped = true; burst(env, O.boxX, FEET - BOX_H + 7, 10, 50); }
  } else if (phase !== "restore" && phase !== "stow") O.flipped = false;
  // Al volver: las farolas se encienden una a una con un destello.
  if (phase === "restore") while (O.lit < lamps.length && e > 0.25 + O.lit * LAMP_STEP_S) {
    const lx = lamps[O.lit++];
    for (let i = 0; i < 4; i++) env.spawn({ k: "star", x: lx, y: env.lampY - 1, vx: (Math.random() - 0.5) * 20, vy: -6 - Math.random() * 10, g: 30, life: 0.5 });
  }
}

export function outagePose(actor, a, t) {
  const O = a.outage;
  if (!O) return null;
  const e = t - O.since;
  if (O.phase === "flicker") return { pose: "crouch", expr: "surprised", handsBusy: true };
  if (O.phase === "search") return { pose: "ready", handsBusy: true, lookX: Math.sin(e * 1.6) > 0 ? 1 : 0 };
  // Tira de la palanca: tirones y, al subirla, un saltito hacia atras.
  if (O.phase === "fix") return e > FLIP_S && e < FLIP_S + 0.35 ? { pose: "jump", expr: "surprised", handsBusy: true, hop: 2 } : { pose: "reel", frame: Math.floor(t * 6) % 2, expr: "focus", handsBusy: true };
  if (O.phase === "restore") return { pose: e < 0.5 ? "jump" : "idle", expr: "happy", hop: e < 0.5 ? Math.sin(e / 0.5 * Math.PI) * 4 : 0 };
  return null;
}

// Cuanto se apaga el mundo y que luz queda (la de la linterna y el piloto).
export function outageLight(actor, a, env) {
  const O = a.outage;
  if (!O) return null;
  const e = env.t - O.since;
  const dim = O.phase === "flicker" ? (Math.floor(e * 7) % 2 ? 0.9 : 0.3) : O.phase === "search" || O.phase === "fix" ? 1 : O.phase === "restore" ? Math.max(0, 1 - e / 1.7) : 0;
  const lights = [];
  if (O.beam && dim > 0.3) lights.push({ x: O.beam[2], y: O.beam[3], r: 16, c: [1, 0.95, 0.75], s: 0.85 });
  if (O.boxTop && dim > 0.3) lights.push({ x: O.boxTop[0], y: O.boxTop[1], r: 6, c: O.phase === "restore" ? [0.4, 1, 0.6] : [1, 0.3, 0.3], s: 0.5 });
  return { dim, dark: DARK, lights };
}

// El cuadro aparece al buscarlo y se queda hasta recoger.
export function outageDrawGround(g, actor, a, env) {
  const O = a.outage;
  if (!O || !["search", "fix", "restore", "stow"].includes(O.phase)) { if (O) O.boxTop = null; return; }
  // (los sprites llevan 1 px de contorno alrededor: la fila de abajo pisa el sendero)
  const e = env.t - O.since, S = SPRITES(), x = Math.round(O.boxX) - 8, y = FEET - BOX_H - 1;
  if (O.phase === "search" && e < 0.8) return;
  if (O.phase === "stow") { const k = Math.max(0, 1 - e / 0.8); if (k <= 0) return; g.globalAlpha = k; }
  const open = O.phase === "fix" || O.phase === "restore";
  const shake = O.phase === "fix" && !O.flipped && Math.floor(env.t * 12) % 2 ? 1 : 0;
  g.drawImage(open ? S.open : S.box, x + shake, y);
  if (open) {
    g.drawImage(S.door, x - 3 + shake, y + 4);
    // Las tres palancas: dos arriba (verdes); la del medio saltada (roja,
    // abajo) hasta que Pip la sube.
    const up = O.flipped || O.phase === "restore";
    for (const [i, bx] of [[0, 5], [1, 7], [2, 9]]) {
      const on = i !== 1 || up, lx = x + bx + shake;
      px(g, lx, y + (on ? 6 : 8), "#e8eef0");
      px(g, lx, y + 7, on ? "#3fcf7a" : Math.floor(env.t * 6) % 2 ? "#ff4a5a" : "#7a1a22");
    }
  }
  // El piloto de arriba: rojo que parpadea sin luz, verde fijo al volver.
  const lampX = x + 7, lampY = y - 1, green = O.phase === "restore" || O.phase === "stow";
  rect(g, lampX - 1, lampY, 4, 1, "#3a4a54");
  const lit = green || Math.floor(env.t * 3) % 2 === 0;
  rect(g, lampX, lampY - 1, 2, 1, green ? "#3fff97" : lit ? "#ff4a5a" : "#5a1a22");
  if (lit) px(g, lampX, lampY - 1, green ? "#c8ffd8" : "#ffb0b8");
  O.boxTop = [lampX + 1, lampY - 1];
  g.globalAlpha = 1;
}

// La linterna en la mano (el cono, encima de la luz, en overlay).
export function outageDrawFront(g, actor, a, fr, env) {
  const O = a.outage;
  if (!O || !["flicker", "search", "fix"].includes(O.phase)) { if (O) O.beam = null; return; }
  const hand = env.toWorld(fr, fr.rig.a.hand), f = actor.dir, S = SPRITES(), e = env.t - O.since;
  g.save();
  if (f < 0) { g.translate(hand[0] * 2, 0); g.scale(-1, 1); }
  g.drawImage(S.torch, hand[0] - 2, hand[1] - 3);
  g.restore();
  // El haz barre arriba y abajo hasta la altura del cuadro buscandolo; al
  // arreglar, alumbra la puerta abierta.
  const lx = hand[0] + f * 7, ly = hand[1] - 1, reach = Math.max(18, Math.abs((O.boxX ?? lx + f * 30) - lx) + 4);
  if (O.phase === "fix") { O.beam = [lx, ly, O.boxX - f * 3, FEET - BOX_H / 2 - 4]; return; }
  const ang = O.phase === "search" ? 0.1 + Math.sin(e * 1.6) * 0.38 : 0.08;
  O.beam = [lx, ly, lx + f * reach, Math.min(FEET, ly + Math.tan(ang) * reach)];
}

// El cono de luz: un abanico que se apaga hacia el final, un nucleo mas
// claro, motas de polvo flotando dentro y el charco de luz donde da.
export function outageDrawOverlay(g, actor, a, fr, env) {
  const O = a.outage;
  if (!O?.beam || (O.phase === "flicker" && Math.floor((env.t - O.since) * 7) % 2)) return;
  const [x0, y0, x1, y1] = O.beam, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const cone = (spread, alpha) => {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, `rgba(255,240,190,${alpha})`); grad.addColorStop(0.7, `rgba(255,236,170,${alpha * 0.45})`); grad.addColorStop(1, "rgba(255,230,160,0)");
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx * spread, y1 + ny * spread); g.lineTo(x1 - nx * spread, y1 - ny * spread); g.lineTo(x0 - nx, y0 - ny); g.closePath(); g.fill();
  };
  g.globalCompositeOperation = "lighter";
  cone(11, 0.16); cone(5, 0.14);
  // Polvo en el haz.
  for (let i = 0; i < 6; i++) {
    const p = ((env.t * 0.18 + i * 0.17) % 1), s = Math.sin(env.t * 1.3 + i * 2.1) * (2 + p * 7);
    const mx = Math.round(x0 + ux * len * p + nx * s), my = Math.round(y0 + uy * len * p + ny * s);
    g.fillStyle = `rgba(255,250,220,${0.5 * (1 - p)})`; g.fillRect(mx, my, 1, 1);
  }
  // El charco de luz en el suelo, en escalones.
  for (const [r, al] of [[9, 0.07], [6, 0.08], [3, 0.1]]) { g.fillStyle = `rgba(255,236,180,${al})`; g.fillRect(Math.round(x1 - r), Math.round(y1) - 1, r * 2 + 1, 2); g.fillRect(Math.round(x1 - r * 0.6), Math.round(y1) - 2, Math.round(r * 1.2) + 1, 1); }
  g.globalCompositeOperation = "source-over";
  halo(g, x1, y1, 4, "255,240,190", 0.12);
  // El cristal encendido.
  px(g, Math.round(x0), Math.round(y0), "#fffce3");
}
