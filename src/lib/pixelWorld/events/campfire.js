import { FISH_CATALOG } from "../../../../shared/buddy-catches.mjs";
import { gridSprite, lazy, mix, outlinedSprite, px } from "../core.js";
import { FEET } from "../layout.js";

// La hoguera de Buddy (useBuddyCampfire) en pixel art: se sienta en un tronco
// mirando al fuego y asa una nube o uno de sus peces en una rama. La nube se
// dora poco a poco (o se quema y arde); el pez se dora con marcas de parrilla
// y humea al terminar. Fases del hook: sit, toast, done (pez), golden o burnt
// (nube), eaten. Y "light": la lluvia apago la hoguera y Buddy se agacha a su
// lado y la enciende con una cerilla (tres rascadas con chispas; a la tercera
// prende y la acerca a los troncos).
const SPRITES = lazy(() => ({
  log: gridSprite([".OOOOOOOOOO.", "OcLLLLLLLLLO", "OrllllllllLO", ".OOOOOOOOOO."], { O: "#3a2214", c: "#d9b27a", r: "#a87a46", L: "#a6723d", l: "#7f532c" })
}));

// La nube de azucar: un cilindro con la cara de arriba mas clara, que se va
// tostando por el lado del fuego (manchas) hasta quemarse.
const MALLOW_ROWS = [".hTT.", "TTTTT", "SSSSS", "SkSSS", "SSSkS", ".DDD."];
const MALLOW_STAGES = [
  { h: "#ffffff", T: "#ffffff", S: "#f6f1e8", D: "#ddd5c8", k: "#f6f1e8", out: "#8a8478" },
  { h: "#ffffff", T: "#fff6e0", S: "#f2dcae", D: "#d9b67a", k: "#e2c08a", out: "#7a5a30" },
  { h: "#fff6dc", T: "#ffe7b0", S: "#e6b86c", D: "#b98040", k: "#a8692a", out: "#5a3a14" },
  { h: "#ffe7b0", T: "#f6cf86", S: "#c98a3e", D: "#8f5a24", k: "#6e3e16", out: "#4a2a10" },
  { h: "#7a6a5a", T: "#5a4a40", S: "#3a2a24", D: "#241812", k: "#ff7a3a", out: "#120a06" }
];
const mallows = lazy(() => MALLOW_STAGES.map(({ out, ...pal }) => outlinedSprite(MALLOW_ROWS, pal, out)));

// El pez ensartado, de perfil y con el color de su especie; asado, dorado y
// con marcas de parrilla.
const FISH_ROWS = ["...bbbb...", "t.bbbbbbb.", "ttbBBBBbew", "t.bwwwwbb.", "...bbbb..."];
const fishes = new Map();
function fishOnStick(id, cooked) {
  const key = id + (cooked ? "c" : "r");
  let img = fishes.get(key);
  if (img) return img;
  const base = FISH_CATALOG.find((item) => item.id === id)?.color || "#9fc4dc";
  const body = cooked ? mix(base, "#b8732e", 0.7) : base;
  const rows = cooked ? FISH_ROWS.map((r, y) => (y === 2 ? r.replace("BBBB", "BgBg") : y === 1 ? r.replace("bbbbbbb", "bbgbbgb") : r)) : FISH_ROWS;
  img = outlinedSprite(rows, { b: body, B: mix(body, "#ffffff", 0.3), w: mix(body, "#fff4dc", 0.6), t: mix(body, "#000000", 0.25), e: "#0a0e18", g: "#5a2e12" }, mix(body, "#05070c", 0.65));
  fishes.set(key, img);
  return img;
}

const sitting = (actor) => actor.mood === "campfire" && actor.campfire && actor.campfire !== "walk" && actor.campfire !== "light";
const lighting = (actor) => actor.mood === "campfire" && actor.campfire === "light";
const STRIKES = [0.5, 1.15, 1.8];
const withStick = (phase) => ["toast", "done", "golden", "burnt"].includes(phase);

export function campfireUpdate(actor, a, env) {
  if (lighting(actor)) {
    const L = (a.lightFire ??= { since: env.t, struck: 0 }), e = env.t - L.since, fx = env.layout.fireX;
    while (L.struck < STRIKES.length && e > STRIKES[L.struck]) {
      L.struck++;
      const n = L.struck === STRIKES.length ? 8 : 4;
      for (let i = 0; i < n; i++) env.spawn({ k: "spark", x: fx + (actor.x > fx ? 4 : -4) + (Math.random() - 0.5) * 3, y: 70 - Math.random() * 3, vx: (Math.random() - 0.5) * 22, vy: -6 - Math.random() * 12, life: 0.3 + Math.random() * 0.3 });
    }
    a.campfire = null;
    return;
  }
  a.lightFire = null;
  if (!sitting(actor)) { a.campfire = null; return; }
  const C = (a.campfire ??= { phase: "", since: 0 });
  if (C.phase !== actor.campfire) { C.phase = actor.campfire; C.since = env.t; }
  if (C.phase === "done" && Math.random() < env.dt * 3) env.spawn({ k: "steam", x: C.tip?.[0] ?? actor.x, y: (C.tip?.[1] ?? FEET - 22) - 3, vx: (Math.random() - 0.5) * 3, vy: -6, life: 1.2, max: 1.2 });
  // La nube quemada suelta humo negro.
  if (C.phase === "burnt" && C.tip && Math.random() < env.dt * 4) env.spawn({ k: "smoke", x: C.tip[0], y: C.tip[1] - 5, vx: -1 - Math.random() * 2, vy: -6, life: 1.4, max: 1.4 });
}

export function campfirePose(actor, a, t) {
  const L = a.lightFire;
  if (L) {
    // Agachado junto al fuego; en cada rascada el brazo da el tiron. Cuando
    // prende, salta un poco hacia atras.
    if (L.struck >= STRIKES.length && actor.moving) return { pose: "jump", hop: 2, handsBusy: true, expr: "happy" };
    const e = t - L.since, striking = STRIKES.some((s) => e > s - 0.12 && e < s + 0.08);
    return { pose: striking ? "reel" : "crouch", frame: 0, handsBusy: true, expr: L.struck >= STRIKES.length ? "happy" : "focus" };
  }
  const C = a.campfire;
  if (!C) return null;
  return { pose: withStick(C.phase) ? "stick" : "sit", handsBusy: true, expr: C.phase === "eaten" || C.phase === "golden" || C.phase === "done" ? "happy" : C.phase === "burnt" ? "surprised" : undefined };
}

// El tronco, en el suelo y bajo Pip.
export function campfireDrawGround(g, actor, a) {
  if (!a.campfire) return;
  g.drawImage(SPRITES().log, Math.round(actor.x) - 6 - 2 * actor.dir, FEET - 4);
}

// Rama de asar: algo arqueada, corteza oscura con su brillo encima, un nudo
// con una hoja a medio camino y la punta pelada (mas clara) que atraviesa la
// golosina y asoma por el otro lado.
function drawStick(g, hand, tip, dir) {
  const [hx, hy] = hand, [tx, ty] = tip, n = Math.max(2, Math.round(Math.hypot(tx - hx, ty - hy)));
  const cx = (hx + tx) / 2, cy = Math.min(hy, ty) - 3;
  let last = null;
  for (let i = 0; i <= n + 3; i++) {
    const s = i / n, x = Math.round((1 - s) * (1 - s) * hx + 2 * (1 - s) * s * cx + s * s * tx), y = Math.round((1 - s) * (1 - s) * hy + 2 * (1 - s) * s * cy + s * s * ty);
    if (last && last[0] === x && last[1] === y) continue;
    last = [x, y];
    const peeled = s > 0.86;
    px(g, x, y, peeled ? "#c99a5e" : "#4a2c14");
    if (!peeled && s > 0.08) px(g, x, y - 1, s < 0.5 ? "#8a5a2e" : "#a8743e");
    if (peeled) px(g, x, y - 1, "#e8c48a");
  }
  // Nudo con una hoja.
  const s = 0.42, kx = Math.round((1 - s) * (1 - s) * hx + 2 * (1 - s) * s * cx + s * s * tx), ky = Math.round((1 - s) * (1 - s) * hy + 2 * (1 - s) * s * cy + s * s * ty);
  px(g, kx, ky - 2, "#6b4423"); px(g, kx - dir, ky - 3, "#5aa83a"); px(g, kx - 2 * dir, ky - 3, "#3f7a28"); px(g, kx - dir, ky - 4, "#8ad35a");
}

// La cerilla en la mano: palito, cabeza roja y, a la tercera rascada, llama.
function drawMatch(g, actor, L, fr, env) {
  const hand = env.toWorld(fr, fr.rig.a.hand), dir = hand[0] < env.layout.fireX ? 1 : -1, [hx, hy] = [Math.round(hand[0]), Math.round(hand[1])];
  for (let i = 0; i < 4; i++) px(g, hx + dir * i, hy - Math.floor(i / 2), "#c99a5e");
  const tx = hx + dir * 4, ty = hy - 2;
  px(g, tx, ty, "#d8405a");
  if (L.struck >= STRIKES.length) {
    const f = Math.floor(env.t * 12) % 2;
    px(g, tx, ty - 1, "#ffc247"); px(g, tx + dir * f, ty - 2, "#ff7a3a"); px(g, tx, ty - 3 + f, "#ffe08a");
  }
}

// La rama sale de la mano hacia el fuego, con la nube o el pez en la punta.
export function campfireDrawFront(g, actor, a, fr, env) {
  if (a.lightFire) { drawMatch(g, actor, a.lightFire, fr, env); return; }
  const C = a.campfire;
  if (!C || !withStick(C.phase)) return;
  const fire = env.layout.fireX, hand = env.toWorld(fr, fr.rig.a.hand), bob = Math.round(Math.sin(env.t * 1.4));
  const dir = hand[0] < fire ? 1 : -1, tip = [fire - dir, FEET - 24 + bob];
  C.tip = tip;
  drawStick(g, hand, tip, dir);
  const e = env.t - C.since;
  if (actor.snack === "fish") {
    const img = fishOnStick(actor.snackFish || "", !(C.phase === "toast" && e < 2));
    // La rama entra por la boca: el pez mira hacia Buddy.
    g.save();
    if (dir > 0) { g.translate(tip[0] + 5, 0); g.scale(-1, 1); g.drawImage(img, 0, tip[1] - 3); }
    else g.drawImage(img, tip[0] - 7, tip[1] - 3);
    g.restore();
    return;
  }
  // La nube: de blanca a dorada mientras se tuesta; quemada, negra con brasas.
  const stage = C.phase === "burnt" ? 4 : C.phase === "golden" ? 3 : Math.min(3, Math.floor(e / 1.2));
  const img = mallows()[stage];
  g.drawImage(img, tip[0] - 3, tip[1] - 4);
  // La punta de la rama asoma por el otro lado.
  px(g, tip[0] + (dir > 0 ? 4 : -4), tip[1], "#c99a5e");
}

// Lo que brilla: la nube que arde.
export function campfireDrawOverlay(g, actor, a, fr, env) {
  const C = a.campfire;
  if (!C?.tip || C.phase !== "burnt") return;
  const [x, y] = C.tip, f = Math.floor(env.t * 10) % 2;
  px(g, x, y - 6, "#ffc247"); px(g, x - 1 + f, y - 7, "#ff7a3a"); px(g, x + 1 - f, y - 8 - f, "#ff7a3a"); px(g, x, y - 9, "#ffe08a");
  if (f) px(g, x - 2, y - 2, "#ff7a3a");
}
