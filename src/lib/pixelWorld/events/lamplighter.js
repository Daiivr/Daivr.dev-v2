import { halo, px } from "../core.js";
import { linePts } from "../pip/rig.js";
import { LAMP_H } from "../props.js";

// Pip farolero (useBuddyLife): va de farola en farola con una pertiga de
// madera con la punta de laton; al anochecer lleva la mecha encendida y la
// acerca al cristal (la farola parpadea y prende); al amanecer, el apagavelas.
// Y el forraje: se agacha a recogerlo y da un saltito.
const LAMP_TOP = 72 - LAMP_H + 1;
const WOOD = ["#8a5a2e", "#b07a3e"], BRASS = "#d8b048", BRASS_D = "#8a6a28";

function lampState(actor, a, t) {
  const phase = actor.mood === "lamps" ? actor.lamps || "" : "";
  if (!phase) { a.lamplighter = null; return null; }
  const L = (a.lamplighter ??= { phase: "", since: t });
  if (L.phase !== phase) { L.phase = phase; L.since = t; }
  return L;
}

export function lampsUpdate(actor, a, env) { lampState(actor, a, env.t); }

export function lampsPose(actor, a, t) {
  if (actor.mood === "forage") {
    const F = (a.forage ??= { phase: "", since: t });
    if (F.phase !== actor.forage) { F.phase = actor.forage; F.since = t; }
    if (F.phase !== "pick") return actor.moving ? null : { pose: "idle" };
    const e = t - F.since;
    return e < 0.6 ? { pose: "crouch", lookY: 1, handsBusy: true } : { pose: e < 0.85 ? "jump" : "idle", expr: "happy", hop: e < 0.85 ? Math.sin((e - 0.6) / 0.25 * Math.PI) * 3 : 0, handsBusy: true };
  }
  a.forage = null;
  const L = a.lamplighter;
  if (!L) return null;
  if (L.phase !== "reach") return { handsBusy: true };
  const e = t - L.since;
  // la pertiga en alto hacia el cristal; al prender, contento
  return { pose: "holdup", handsBusy: true, expr: e > 0.7 ? "happy" : "focus", lookY: -1 };
}

// La punta de la pertiga: al alcanzar la farola, en su cristal; si no, en alto.
function poleTip(actor, a, fr, env) {
  const L = a.lamplighter, hand = env.toWorld(fr, fr.rig.a.hand);
  if (L?.phase === "reach" && actor.lampX != null) {
    const lx = actor.lampX / 2, e = env.t - L.since, k = Math.min(1, e / 0.35);
    const tip = [lx - actor.dir * 2, LAMP_TOP + 5];
    return { hand, tip: [hand[0] + (tip[0] - hand[0]) * k, hand[1] - 16 + (tip[1] - hand[1] + 16) * k] };
  }
  return { hand, tip: [hand[0] + actor.dir, hand[1] - 18] };
}

export function lampsDrawFront(g, actor, a, fr, env) {
  if (!a.lamplighter) return;
  const { hand, tip } = poleTip(actor, a, fr, env);
  const pts = linePts(hand[0], hand[1] + 3, tip[0], tip[1]);
  pts.forEach(([x, y], i) => { px(g, x, y, WOOD[i % 3 === 0 ? 1 : 0]); });
  const [tx, ty] = [Math.round(tip[0]), Math.round(tip[1])];
  if (actor.lampOn) { px(g, tx, ty, BRASS); px(g, tx, ty + 1, BRASS_D); }
  else { px(g, tx - 1, ty, BRASS); px(g, tx, ty, BRASS); px(g, tx + 1, ty, BRASS); px(g, tx, ty - 1, BRASS); px(g, tx, ty + 1, BRASS_D); }
  a.lamplighter.tip = [tx, ty];
}

// La mecha encendida brilla por encima de la luz.
export function lampsDrawOverlay(g, actor, a, fr, env) {
  const L = a.lamplighter;
  if (!L?.tip || !actor.lampOn) return;
  // (en cuanto la farola prende, la mecha se apaga)
  if (L.phase === "reach" && env.t - L.since > 0.75) return;
  const [x, y] = L.tip, f = Math.floor(env.t * 12) % 2;
  px(g, x, y - 1, "#ffc247"); px(g, x + (f ? 1 : 0), y - 2, "#ff7a3a"); px(g, x, y - 2 - f, "#ffe08a");
  halo(g, x, y - 2, 3, "255,190,90", 0.12);
}
