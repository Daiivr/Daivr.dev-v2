import { blit, px } from "../core.js";
import { cropItem, GARDEN_SPRITES, PLANT_BASE, SOIL_TOP } from "../life/garden.js";

// Pip en el huerto (useBuddyLife). Para regar coge la regadera de cobre del
// cartel y va de parcela en parcela: al llegar la inclina y cae un chorrito
// de gotas sobre la tierra, que se oscurece. Para cosechar se agacha, arranca
// la planta y la levanta por encima de la cabeza (como en Stardew), con
// destellos alrededor, y al guardarla salta la moneda. En la granja: espanta
// cuervos (saltos y brazos arriba), clava la nota del tablon, coge el tarro de
// miel (se inclina) o la fruta del arbol (de un saltito) y los levanta igual,
// y la calabaza gigante sale a tirones (agachado / echado atras) y la sube
// como puede.
const PULL_S = 0.5;
const RISE_S = 0.3;
const SHOW_S = 1.6;
// El asa de la regadera (donde la agarra la mano) en cada sprite, con su
// contorno, y la alcachofa al regar (de donde salen las gotas).
// (al regar la levanta un poco: el caño queda por encima de la tierra)
const HANDLE = { rest: [5, 1], pour: [4, 5] };
const SPOUT = [11, 8];
// donde caen las gotas: la cara del caballon de tierra
const SOIL_Y = SOIL_TOP + 2;
// Las fases en que levanta algo por encima de la cabeza (y desde donde sale).
const LIFTS = new Set(["pull", "pick", "reach"]);
const FROM_Y = { pull: PLANT_BASE, pick: 50, reach: 58 };
const TUG_STEP = 0.45;

function gardenState(actor, a, t) {
  if (actor.mood !== "garden" || actor.ghost) { a.garden = null; return null; }
  const G = (a.garden ??= { phase: "", since: t });
  if (G.phase !== actor.garden) { G.phase = actor.garden; G.since = t; G.coin = false; }
  return G;
}

export function gardenUpdate(actor, a, env) {
  const G = gardenState(actor, a, env.t);
  if (!G) return;
  const e = env.t - G.since;
  // el chorrito: gotas desde la boca del caño hasta la tierra
  // (cada gota vive lo justo para llegar a la tierra)
  if (G.phase === "pour" && G.spout && e > 0.25 && Math.random() < env.dt * 42) {
    const vy = 6 + Math.random() * 6, fall = Math.max(1, SOIL_Y + Math.random() * 1.5 - G.spout[1] - 1);
    env.spawn({ k: "drop", x: G.spout[0] + (Math.random() - 0.5) * 1.5, y: G.spout[1] + 1, vx: actor.dir * (2 + Math.random() * 3), vy, g: 120, life: (-vy + Math.sqrt(vy * vy + 240 * fall)) / 120, c: Math.random() < 0.5 ? "#9ad8ff" : "#d6efff" });
  }
  // al guardar la cosecha, la moneda
  if (LIFTS.has(G.phase) && !G.coin && G.head && e > PULL_S + RISE_S + SHOW_S) {
    G.coin = true;
    env.spawn({ k: "coin", x: G.head[0], y: G.head[1] - 8, vx: 0, vy: -22, g: 50, life: 0.8 });
    for (let i = 0; i < 5; i++) env.spawn({ k: "star", x: G.head[0], y: G.head[1] - 6, vx: (Math.random() - 0.5) * 28, vy: -10 - Math.random() * 12, g: 40, life: 0.45 });
  }
}

export function gardenPose(actor, a, t) {
  const G = a.garden;
  if (!G) return null;
  const e = t - G.since;
  if (G.phase === "pour") return { pose: "pour", lookY: 1, handsBusy: true, expr: e > 0.9 ? "happy" : "focus" };
  if (G.phase === "shoo") {
    const f = Math.floor(e * 8) % 2;
    return { pose: f ? "wave" : "jump", frame: Math.floor(e * 8), hop: f ? 0 : 2, expr: "surprised" };
  }
  if (G.phase === "pin") return e < 0.7 ? { pose: "pour", expr: "focus", handsBusy: true } : { pose: "idle", expr: "happy" };
  if (G.phase === "tug") {
    const pull = Math.floor(e / TUG_STEP) % 2;
    return { pose: pull ? "windup" : "crouch", lookY: 1, handsBusy: true, expr: "focus", hop: 0 };
  }
  if (LIFTS.has(G.phase)) {
    if (e < PULL_S) {
      if (G.phase === "pick") return { pose: "jump", handsBusy: true, expr: "focus", hop: Math.sin(e / PULL_S * Math.PI) * 4 };
      if (G.phase === "reach") return { pose: "pour", handsBusy: true, expr: "focus" };
      return { pose: "crouch", lookY: 1, handsBusy: true, expr: "focus" };
    }
    if (e < PULL_S + RISE_S + SHOW_S) return { pose: "holdup", expr: "happy", handsBusy: true, hop: e < PULL_S + 0.3 ? Math.sin((e - PULL_S) / 0.3 * Math.PI) * 3 : 0 };
    return { pose: "idle", expr: "happy", handsBusy: true };
  }
  // de camino (con la regadera en la mano si va a regar)
  return actor.gardenTask === "water" ? { handsBusy: true } : null;
}

// La cosecha en alto: de donde estaba la planta hasta encima de la cabeza.
function heldCrop(actor, G, fr, env) {
  const img = cropItem(actor.gardenCrop), e = env.t - G.since;
  if (!img || !LIFTS.has(G.phase) || e < PULL_S || e > PULL_S + RISE_S + SHOW_S) return null;
  const hd = env.toWorld(fr, fr.rig.a.head), p = Math.min(1, (e - PULL_S) / RISE_S);
  G.head = hd;
  const x0 = actor.gardenX != null ? actor.gardenX / 2 : hd[0], y0 = (FROM_Y[G.phase] ?? PLANT_BASE) - img.height;
  const x = x0 + (hd[0] - x0) * p, y = y0 + ((hd[1] - img.height - 1) - y0) * p - Math.sin(p * Math.PI) * 8;
  return { img, x: Math.round(x - img.width / 2), y: Math.round(y + (p >= 1 && Math.sin(env.t * 6) > 0 ? -1 : 0)), up: p >= 1 };
}

export function gardenTop(actor, a, fr, env) {
  const G = a.garden;
  const held = G && actor.gardenCrop ? heldCrop(actor, G, fr, env) : null;
  return held ? held.y - 2 : null;
}

export function gardenDrawFront(g, actor, a, fr, env) {
  const G = a.garden;
  if (!G) return;
  if (actor.gardenTask === "water") {
    const S = GARDEN_SPRITES(), hand = env.toWorld(fr, fr.rig.a.hand), pour = G.phase === "pour" && env.t - G.since > 0.15;
    const img = pour ? S.canPour : S.can, flip = actor.dir < 0;
    const [hx, hy] = pour ? HANDLE.pour : HANDLE.rest;
    const left = Math.round(hand[0] - (flip ? img.width - 1 - hx : hx)), top = Math.round(hand[1] - hy);
    blit(g, img, left, top, flip);
    G.spout = [flip ? left + img.width - 1 - SPOUT[0] : left + SPOUT[0], top + SPOUT[1]];
  }
  if (actor.gardenCrop) {
    const held = heldCrop(actor, G, fr, env);
    if (held) g.drawImage(held.img, held.x, held.y);
  }
}

// Destellos alrededor de la cosecha en alto (por encima de la luz).
export function gardenDrawOverlay(g, actor, a, fr, env) {
  const G = a.garden;
  const held = G && actor.gardenCrop ? heldCrop(actor, G, fr, env) : null;
  if (!held?.up) return;
  const f = Math.floor(env.t * 6) % 4, cx = held.x + held.img.width / 2, cy = held.y + held.img.height / 2;
  const spots = [[-held.img.width / 2 - 3, -3], [held.img.width / 2 + 2, 0], [-held.img.width / 2 - 2, 3], [held.img.width / 2 + 3, -4]];
  spots.forEach(([dx, dy], i) => {
    if ((i + f) % 4 > 1) return;
    const x = Math.round(cx + dx), y = Math.round(cy + dy), big = (i + f) % 4 === 0;
    px(g, x, y, "#ffffff");
    if (big) { px(g, x - 1, y, "#fff0af"); px(g, x + 1, y, "#fff0af"); px(g, x, y - 1, "#fff0af"); px(g, x, y + 1, "#fff0af"); }
  });
}
