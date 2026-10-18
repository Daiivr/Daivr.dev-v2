import { FISH_CATALOG } from "../../../../shared/buddy-catches.mjs";
import { gridSprite, lazy, mix, outlinedSprite, px } from "../core.js";
import { FEET } from "../layout.js";
import { PACK } from "./stash.js";

// La hoguera de Buddy (useBuddyCampfire) en pixel art: se sienta en un tronco
// mirando al fuego y asa una nube o uno de sus peces en una rama. La nube se
// dora poco a poco (o se quema y arde); el pez se dora con marcas de parrilla
// y humea al terminar. Fases del hook: sit, prep (la saca de la mochila, la
// enseña en alto sentado y la ensarta en la rama), toast, done (pez), golden o
// burnt (nube), eat (se la acerca y se la come en tres bocados, con migas; del
// pez queda la raspa) y eaten (tira la rama al fuego, que chisporrotea). Y "light": la lluvia apago la hoguera y Buddy se agacha a su
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

// La raspa que queda en la rama cuando se come el pez.
const BONES = lazy(() => outlinedSprite(["t..w.w.w...", "ttwwwwwwwSS", "t..w.w.w.SE"], { t: "#d8d0bc", w: "#f4f0e0", S: "#e8e0cc", E: "#3a3428" }, "#6a604c"));

const sitting = (actor) => actor.mood === "campfire" && actor.campfire && actor.campfire !== "walk" && actor.campfire !== "light";
const lighting = (actor) => actor.mood === "campfire" && actor.campfire === "light";
const STRIKES = [0.5, 1.15, 1.8];
const withStick = (phase) => ["toast", "done", "golden", "burnt", "eat"].includes(phase);
// Preparar: busca en la mochila, la saca, la enseña y la ensarta. Comer: se
// la acerca, tres bocados y fin. Tirar la rama al fuego.
const PREP = { reach: 0.35, pull: 0.75, show: 1.25, skewer: 1.75 };
const EAT = { lift: 0.5, bites: [0.75, 1.2, 1.65] };
const TOSS_S = 0.5;
const ease = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const bitesAt = (e) => EAT.bites.filter((b) => e >= b).length;

// La golosina mordida: le faltan columnas por el lado de Pip, con el borde
// ondulado de los dientes. A los tres bocados no queda nada.
const bittenCache = new Map();
function bitten(img, n, fromLeft) {
  if (!n) return img;
  let byImg = bittenCache.get(img);
  if (!byImg) { byImg = new Map(); bittenCache.set(img, byImg); }
  const key = n + (fromLeft ? "l" : "r");
  let out = byImg.get(key);
  if (!out) {
    out = document.createElement("canvas");
    out.width = img.width; out.height = img.height;
    const g = out.getContext("2d");
    g.drawImage(img, 0, 0);
    const depth = n >= 3 ? img.width : Math.round(n * img.width / 3.2);
    for (let y = 0; y < img.height; y++) {
      const cut = depth + [0, 1, 1, 0][y % 4];
      if (fromLeft) g.clearRect(0, y, cut, 1); else g.clearRect(img.width - cut, y, cut, 1);
    }
    byImg.set(key, out);
  }
  return out;
}

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
  if (C.phase !== actor.campfire) { C.phase = actor.campfire; C.since = env.t; C.marks = 0; }
  const e = env.t - C.since;
  if (C.phase === "prep" && !C.marks && e > PREP.skewer && C.tip) {
    C.marks = 1;
    for (let i = 0; i < 3; i++) env.spawn({ k: "star", x: C.tip[0], y: C.tip[1] - 3, vx: (i - 1) * 14, vy: -10 - Math.random() * 6, g: 40, life: 0.4 });
  }
  if (C.phase === "eat" && C.mouth) {
    // (la quemada: antes de morder, la sopla)
    if (actor.snack !== "fish" && C.wasBurnt && C.marks === 0 && e > EAT.lift - 0.1) {
      C.marks = 0.5;
      for (let i = 0; i < 3; i++) env.spawn({ k: "smoke", x: C.mouth[0] + C.dir * (4 + i), y: C.mouth[1] - 2, vx: C.dir * (8 + i * 3), vy: -4, life: 0.8, max: 0.8 });
    }
    const n = bitesAt(e);
    if (n > Math.floor(C.marks)) {
      C.marks = n;
      const crumbs = actor.snack === "fish" ? ["#c98a4a", "#8a5a2e"] : C.wasBurnt ? ["#3a2a24", "#5a4a40"] : ["#f2dcae", "#e6b86c"];
      for (let i = 0; i < 5; i++) env.spawn({ k: "pix1", x: C.mouth[0] + C.dir * 3, y: C.mouth[1] + 1, vx: (Math.random() - 0.5) * 18, vy: -6 - Math.random() * 8, g: 60, life: 0.5 + Math.random() * 0.3, c: crumbs[i % 2] });
    }
  }
  if (C.phase === "golden" || C.phase === "done") C.wasBurnt = false;
  if (C.phase === "burnt") C.wasBurnt = true;
  if (C.phase === "eaten" && !C.marks && e > TOSS_S) {
    C.marks = 1;
    const fx = env.layout.fireX;
    for (let i = 0; i < 10; i++) env.spawn({ k: "spark", x: fx + (Math.random() - 0.5) * 6, y: 68, vx: (Math.random() - 0.5) * 26, vy: -12 - Math.random() * 16, life: 0.5 + Math.random() * 0.5 });
    env.spawn({ k: "smoke", x: fx, y: 64, vx: 0, vy: -6, life: 1.6, max: 1.6 });
  }
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
  const e = t - C.since;
  if (C.phase === "prep") {
    if (e < PREP.reach) return { pose: "sitback", lookX: -1, handsBusy: true };
    if (e < PREP.pull) return { pose: "sitback", handsBusy: true, expr: "happy" };
    if (e < PREP.show) return { pose: "situp", handsBusy: true, expr: "happy", hop: e < PREP.pull + 0.2 ? Math.sin((e - PREP.pull) / 0.2 * Math.PI) * 2 : 0 };
    return { pose: "stick", handsBusy: true, expr: "focus" };
  }
  if (C.phase === "eat") {
    // masca: la boca abierta justo despues de cada bocado
    const chewing = EAT.bites.some((b) => e > b && e < b + 0.25) && Math.floor(t * 10) % 2;
    return { pose: "stick", handsBusy: true, expr: chewing ? "talk" : e > EAT.bites[2] + 0.2 ? "happy" : C.wasBurnt && e < EAT.lift ? "surprised" : "focus" };
  }
  if (C.phase === "eaten") return e < TOSS_S ? { pose: "stick", handsBusy: true, expr: "happy" } : { pose: "sit", handsBusy: true, expr: "happy", hop: e < TOSS_S + 0.25 ? Math.sin((e - TOSS_S) / 0.25 * Math.PI) * 2 : 0 };
  return { pose: withStick(C.phase) ? "stick" : "sit", handsBusy: true, expr: C.phase === "golden" || C.phase === "done" ? "happy" : C.phase === "burnt" ? "surprised" : undefined };
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
// La golosina (cruda, asada o mordida) con su centro en `at`.
function snackImg(actor, C, e) {
  if (actor.snack === "fish") return fishOnStick(actor.snackFish || "", !(C.phase === "prep" || (C.phase === "toast" && e < 2)));
  const stage = C.phase === "prep" ? 0 : C.phase === "burnt" || (C.phase === "eat" && C.wasBurnt) ? 4 : C.phase === "golden" || C.phase === "eat" ? 3 : Math.min(3, Math.floor(e / 1.2));
  return mallows()[stage];
}
function drawSnack(g, actor, img, at, dir) {
  const x = Math.round(at[0]), y = Math.round(at[1]);
  if (actor.snack === "fish") {
    // La rama entra por la boca: el pez mira hacia Buddy.
    if (dir > 0) { g.save(); g.translate(x + 5, 0); g.scale(-1, 1); g.drawImage(img, 0, y - 3); g.restore(); }
    else g.drawImage(img, x - 7, y - 3);
    return;
  }
  g.drawImage(img, x - 3, y - 4);
}

export function campfireDrawFront(g, actor, a, fr, env) {
  if (a.lightFire) { drawMatch(g, actor, a.lightFire, fr, env); return; }
  const C = a.campfire;
  if (!C) return;
  const fire = env.layout.fireX, hand = env.toWorld(fr, fr.rig.a.hand), bob = Math.round(Math.sin(env.t * 1.4));
  const dir = hand[0] < fire ? 1 : -1, fireTip = [fire - dir, FEET - 24 + bob], e = env.t - C.since;
  const mouth = env.toWorld(fr, fr.rig.a.mouth), atMouth = [mouth[0] + dir * 5, mouth[1] + 1];
  C.dir = dir; C.mouth = mouth;

  // Preparar: de la mochila a la mano, en alto, y a la punta de la rama.
  if (C.phase === "prep") {
    if (e < PREP.reach) return;
    // (en alto: encima de la cabeza, entre las dos manos)
    const img = snackImg(actor, C, e), pack = env.toWorld(fr, PACK), head = env.toWorld(fr, fr.rig.a.head), up = [head[0] + dir, head[1] - 4];
    if (e < PREP.pull) {
      const k = ease((e - PREP.reach) / (PREP.pull - PREP.reach)), p = lerp(pack, up, k);
      drawSnack(g, actor, img, [p[0], p[1] - Math.sin(k * Math.PI) * 6], dir);
      return;
    }
    if (e < PREP.show) { drawSnack(g, actor, img, [up[0], up[1] + (Math.sin(env.t * 8) > 0 ? -1 : 0)], dir); return; }
    const k = ease(Math.min(1, (e - PREP.show) / (PREP.skewer - PREP.show)));
    const tip = lerp(hand, fireTip, k);
    C.tip = fireTip;
    if (k > 0.15) drawStick(g, hand, tip, dir);
    drawSnack(g, actor, img, lerp(up, tip, k), dir);
    return;
  }

  // Tirar la rama al fuego: vuela en arco y desaparece entre las llamas.
  if (C.phase === "eaten") {
    if (e >= TOSS_S) return;
    const k = e / TOSS_S, from = hand, to = [fire, FEET - 8];
    const x = from[0] + (to[0] - from[0]) * k, y = from[1] + (to[1] - from[1]) * k - Math.sin(k * Math.PI) * 10;
    const ang = k * Math.PI * 2;
    for (let i = -3; i <= 3; i++) px(g, Math.round(x + Math.cos(ang) * i), Math.round(y + Math.sin(ang) * i), i > 1 ? "#c99a5e" : "#4a2c14");
    return;
  }

  if (!withStick(C.phase)) return;
  // Comer: la punta vuelve del fuego a la boca.
  const tip = C.phase === "eat" ? lerp(fireTip, atMouth, ease(Math.min(1, e / EAT.lift))) : fireTip;
  C.tip = tip;
  drawStick(g, hand, tip, dir);
  const img = snackImg(actor, C, e), n = C.phase === "eat" ? bitesAt(e) : 0;
  if (actor.snack === "fish" && n >= 3) {
    const bones = BONES();
    const bx = Math.round(tip[0]), by = Math.round(tip[1]) - 2;
    if (dir > 0) { g.save(); g.translate(bx + 5, 0); g.scale(-1, 1); g.drawImage(bones, 0, by); g.restore(); }
    else g.drawImage(bones, bx - 8, by);
    return;
  }
  // (los bocados, por el lado de Pip; el pez va dado la vuelta si dir > 0)
  drawSnack(g, actor, bitten(img, n, actor.snack === "fish" ? false : dir > 0), tip, dir);
  // La punta de la rama asoma por el otro lado.
  if (actor.snack !== "fish" && n < 3) px(g, Math.round(tip[0]) + (dir > 0 ? 4 : -4), Math.round(tip[1]), "#c99a5e");
}

// Lo que brilla: la nube que arde.
export function campfireDrawOverlay(g, actor, a, fr, env) {
  const C = a.campfire;
  if (!C?.tip || C.phase !== "burnt") return;
  const [x, y] = C.tip, f = Math.floor(env.t * 10) % 2;
  px(g, x, y - 6, "#ffc247"); px(g, x - 1 + f, y - 7, "#ff7a3a"); px(g, x + 1 - f, y - 8 - f, "#ff7a3a"); px(g, x, y - 9, "#ffe08a");
  if (f) px(g, x - 2, y - 2, "#ff7a3a");
}
