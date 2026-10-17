import { FISH_CATALOG } from "../../../../shared/buddy-catches.mjs";
import { N4, blit, ellipseRows, lazy, makeCanvas, outlinedSprite, px, rect } from "../core.js";
import { catchSprite, chestOpenSprite } from "../catches.js";
import { P, currentSeason } from "../palette.js";
import { FEET } from "../layout.js";
import { linePts } from "../pip/rig.js";
import { PACK, drawStash, stashSparkles } from "./stash.js";

// La pesca de Buddy (useBuddyFishing) en pixel art, como el minijuego del
// boceto: el agujero se abre en el sendero, Buddy carga el lanzamiento (barra
// de fuerza), lanza, la boya flota mientras un pez ronda y mordisquea, "!" al
// picar, cada pez pelea en la barra de captura (zona verde que persigue al
// pez y progreso al lado) y la captura sale volando, la levanta en alto y la
// guarda en la mochila (el cofre cae al suelo y suelta monedas). Las fases y
// sus tiempos los marca el hook; aqui solo se dibujan.
const HOLE_RX = 15, HOLE_Y = 75;
const OPEN_S = 0.85, CLOSE_S = 1;
const ROD_ANGLE = { charge: 60, cast: 16, wait: 36, bite: 24, fight: 26, catch: 86, escape: 60, omen: 40, monster: 26, retreat: 50 };
const RODS = { "rod-driftwood": ["#9a6338", "#45d8ff"], "rod-bamboo": ["#3fff97", "#45d8ff"], "rod-neon": ["#ff3d9d", "#ffd166"], "rod-golden": ["#ffd166", "#f4fff8"] };
const FIGHT_BARS = { common: { zone: 12, speed: 0.7 }, uncommon: { zone: 10, speed: 0.9 }, rare: { zone: 8, speed: 1.2 }, legendary: { zone: 6, speed: 1.5 }, mythic: { zone: 5, speed: 1.8 } };
// Carga: primero se prepara, luego la barra de fuerza se llena.
const READY_S = 0.4, CHARGE_S = 0.9;
// Captura: en alto hasta STASH_S, vuela a la mochila y entra en STORED_S.
const SHOW_S = 0.95, STASH_S = 1.9, STORED_S = 2.45;
const catchInfo = (id) => FISH_CATALOG.find((item) => item.id === id) || null;

const bobbers = lazy(() => ({
  "": outlinedSprite(["rr", "ww"], { r: "#e84a4a", w: "#ffffff" }, "#3a1a1a"),
  lure: outlinedSprite(["yy", "ww"], { y: "#ffd166", w: "#f4fff8" }, "#4a3a10"),
  "lure-swift": outlinedSprite([".cc", "cw.", "c.."], { c: "#45d8ff", w: "#f4fff8" }, "#123a4a"),
  "lure-anchor": outlinedSprite([".c.", "ccc", ".c.", "g.g"], { c: "#45d8ff", g: "#3fff97" }, "#123a4a"),
  "lure-magnet": outlinedSprite(["w.w", "p.p", "ppp"], { w: "#f4fff8", p: "#ff3d9d" }, "#4a1030")
}));

// Estado de la pesca de un actor: cuando empezo cada fase, el agujero, ondas,
// el pez que ronda y la barra de captura.
function state(a) {
  return (a.fishing ??= { phase: "", since: 0, hole: null, holeOpen: 0, ripples: [], shadow: 0, nibbles: [], nibbleUntil: 0, nextRipple: 0, bar: null, coins: false });
}

export function fishingUpdate(actor, a, env) {
  const F = state(a), { t, dt } = env;
  const phase = actor.mood === "fishing" ? actor.fishing || "" : "";
  // El agujero: se abre, se queda y se cierra con el portal del hook.
  const portal = actor.portal;
  if (portal) {
    const x = portal.x / 2;
    if (!F.hole || F.hole.phase !== portal.phase) F.hole = { x, phase: portal.phase, since: t };
    F.hole.x = x;
  } else if (F.hole && F.hole.phase !== "gone") F.hole = { ...F.hole, phase: "gone", since: t };
  const H = F.hole;
  if (H) {
    const e = t - H.since;
    F.holeOpen = H.phase === "opening" ? Math.min(1, e / OPEN_S) : H.phase === "open" ? 1 : H.phase === "closing" ? Math.max(0, 1 - e / CLOSE_S) : Math.max(0, F.holeOpen - dt);
    if ((H.phase === "opening" && e < 0.6) || (H.phase === "closing" && e < 0.5)) if (Math.random() < dt * 12) dirt(env, H.x, 1);
  } else F.holeOpen = 0;

  if (phase !== F.phase) {
    const prev = F.phase;
    F.phase = phase; F.since = t;
    if (H && phase === "wait") { env.splash(H.x, 74, 6); F.ripples.push({ t: 0 }, { t: -0.25 }); F.shadow = H.x + (Math.random() < 0.5 ? -9 : 9); F.nibbles = [0.9 + Math.random() * 0.6, 2 + Math.random() * 0.8]; }
    if (H && phase === "bite") { env.splash(H.x, 74, 8); F.ripples.push({ t: 0 }, { t: -0.15 }); }
    if (phase === "fight") {
      const tier = FIGHT_BARS[actor.catchTier] || FIGHT_BARS.rare;
      F.bar = { zone: 0.35, fish: 0.5, aim: 0.5, next: 0, progress: 0.3, zh: tier.zone, speed: tier.speed, lose: Boolean(actor.fightEscape) };
    }
    if (H && phase === "catch") { env.splash(H.x, 74, 10); F.ripples.push({ t: 0 }); F.coins = false; F.stored = false; }
    if (H && phase === "escape") { env.splash(H.x, 74, 9); F.ripples.push({ t: 0 }, { t: -0.2 }); }
    if (!phase && prev) F.bar = null;
  }
  const e = t - F.since;
  if (H && F.phase === "wait") {
    F.shadow += Math.sign(H.x + Math.sin(t * 2.3) * 3 - F.shadow) * dt * 6;
    if (F.nibbles.length && e > F.nibbles[0]) { F.nibbles.shift(); F.nibbleUntil = t + 0.16; F.ripples.push({ t: 0 }); }
    if (t > F.nextRipple) { F.ripples.push({ t: 0 }); F.nextRipple = t + 1.1; }
  }
  if (H && F.phase === "fight" && F.bar) {
    const B = F.bar;
    if (t > B.next) { B.aim = 0.1 + Math.random() * 0.8; B.next = t + 0.35 + Math.random() * 0.4; }
    B.fish += (B.aim - B.fish) * Math.min(1, dt * 5 * B.speed);
    // Si el pez se va a escapar, la zona no le alcanza y el progreso se vacia.
    B.zone += (B.fish - B.zone) * Math.min(1, dt * (B.lose ? 1 : 3.2));
    const inZone = Math.abs(B.fish - B.zone) < B.zh / 56 + 0.04;
    B.progress = Math.max(0, Math.min(1, B.progress + (B.lose ? (inZone ? 0.2 : -0.38) : inZone ? 0.6 : -0.12) * dt));
    if (Math.random() < dt * 8) env.splash(H.x + Math.round(Math.sin(t * 6.3) * 4), 74, 2);
  }
  // La captura entra en la mochila: chispas y un saltito.
  if (F.phase === "catch" && !F.stored && e > STORED_S && catchInfo(actor.catchId)?.kind !== "treasure") {
    F.stored = true;
    stashSparkles(env, F.pack || [actor.x - 6 * actor.dir, FEET - 13]);
  }
  // El cofre del tesoro cae junto a Buddy y suelta monedas.
  if (F.phase === "catch" && catchInfo(actor.catchId)?.kind === "treasure" && e > 1.45 && !F.coins) {
    F.coins = true;
    const cx = actor.x + 14 * actor.dir;
    for (let i = 0; i < 12; i++) env.spawn({ k: "coin", x: cx, y: 70, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 30, g: 120, life: 1.1 + Math.random() * 0.4 });
  }
  for (const rp of F.ripples) rp.t += dt;
  F.ripples = F.ripples.filter((rp) => rp.t < 0.9);
  if (!F.phase && !F.hole) a.fishing = null;
}

function dirt(env, x, n) {
  for (let i = 0; i < n; i++) env.spawn({ k: "drop", x: x + (Math.random() - 0.5) * 26, y: 74, vx: (Math.random() - 0.5) * 36, vy: -14 - Math.random() * 18, g: 90, life: 0.5, c: Math.random() < 0.5 ? "#86592f" : "#5b3a20" });
}

// Pose de Pip durante la pesca (lo demas lo decide pipPose).
export function fishingPose(actor, a, t) {
  const F = a.fishing;
  if (!F || actor.mood !== "fishing") return null;
  const e = t - F.since;
  switch (F.phase) {
    case "charge": return { pose: e < READY_S ? "ready" : "windup", handsBusy: true };
    case "cast": return { pose: e < 0.06 ? "windup" : "cast", handsBusy: true };
    case "wait": return { pose: "ready", handsBusy: true };
    case "bite": return { pose: e < 0.3 ? "jump" : "ready", hop: e < 0.3 ? Math.sin(e / 0.3 * Math.PI) * 3 : 0, handsBusy: true };
    case "fight": return { pose: "reel", frame: Math.floor(t * 10) % 2, handsBusy: true };
    case "catch": {
      if (catchInfo(actor.catchId)?.kind === "treasure") return { pose: e < 0.95 ? "ready" : "jump", hop: e > 1.4 && e < 1.72 ? Math.sin((e - 1.4) / 0.32 * Math.PI) * 3 : 0, handsBusy: true };
      // En alto con un saltito; luego mira atras y la guarda en la mochila.
      if (e < SHOW_S) return { pose: "ready", handsBusy: true };
      if (e < STASH_S) return { pose: "holdup", hop: e < SHOW_S + 0.32 ? Math.sin((e - SHOW_S) / 0.32 * Math.PI) * 3 : 0, handsBusy: true };
      if (e < STORED_S) return { pose: "ready", lookX: -1, handsBusy: true };
      return { pose: "idle", expr: "happy", hop: e < STORED_S + 0.25 ? Math.sin((e - STORED_S) / 0.25 * Math.PI) * 2 : 0, handsBusy: true };
    }
    case "escape": return { pose: e < 0.3 ? "windup" : "crouch", handsBusy: true };
    case "omen": return { pose: "ready", handsBusy: true };
    case "monster": return { pose: "reel", frame: Math.floor(t * 12) % 2, handsBusy: true };
    case "retreat": return { pose: "land", handsBusy: true };
    default: return null;
  }
}

// En el suelo, antes que Buddy: el agujero con el agua, el pez que ronda y las ondas.
export function fishingDrawGround(g, actor, a, env) {
  const F = a.fishing, o = F?.holeOpen || 0;
  if (!F?.hole || o <= 0) return;
  const { t } = env, hx = Math.round(F.hole.x), winter = currentSeason() === "winter";
  const rx = Math.max(1, Math.round(HOLE_RX * o)), ry = Math.max(1, Math.round(3 * o));
  ellipseRows(g, hx, HOLE_Y, rx + 2, ry + 1, winter ? "#eef6fc" : P.dirt[0]);
  ellipseRows(g, hx, HOLE_Y, rx + 1, ry, winter ? "#9fc0dc" : "#2c1d10");
  ellipseRows(g, hx, HOLE_Y, rx, ry, "#164c59");
  ellipseRows(g, hx, HOLE_Y + 1, Math.max(1, rx - 2), Math.max(0, ry - 1), "#1d6474");
  rect(g, hx - rx + 2, HOLE_Y - ry, Math.max(1, rx * 2 - 3), 1, "#0b2a33");
  if (o < 0.6) return;
  for (let i = 0; i < 3; i++) { const sx = hx - rx + 3 + ((Math.floor(t * 6) + i * 9) % Math.max(1, rx * 2 - 6)); rect(g, sx, HOLE_Y + (i % 2), 2, 1, "#7fd3e0"); }
  if (F.phase === "wait" || (F.phase === "bite" && t - F.since < 0.45)) {
    const sx = Math.round(F.shadow || hx), dir = (F.shadow || hx) < hx ? 1 : -1;
    rect(g, sx - 2, HOLE_Y + 1, 5, 1, "#0d3440"); px(g, sx - 3 * dir, HOLE_Y + 1 + (Math.sin(t * 9) > 0 ? 0 : 1), "#0d3440");
  } else if (F.phase !== "fight") {
    for (let i = 0; i < 2; i++) { const fx = hx + Math.round(Math.sin(t * 0.9 + i * 2.4) * (rx - 4)); rect(g, fx - 1, HOLE_Y + 1 - i, 3, 1, "#0f3a45"); }
  }
  for (const rp of F.ripples) {
    if (rp.t < 0) continue;
    const rr = 2 + Math.round(rp.t * 8);
    if (rr > rx - 1) continue;
    g.globalAlpha = 1 - rp.t / 0.9;
    for (const [dx, dy] of [[-rr, 0], [rr, 0], [-rr + 1, -1], [rr - 1, -1], [-rr + 1, 1], [rr - 1, 1]]) px(g, hx + dx, HOLE_Y + dy, "#bff2f8");
    g.globalAlpha = 1;
  }
}

function rodGeom(actor, a, fr, env) {
  const F = a.fishing, ang = ROD_ANGLE[F?.phase];
  if (ang === undefined || actor.mood !== "fishing") return null;
  const { t } = env, e = t - F.since;
  const [hx, hy] = env.toWorld(fr, fr.rig.a.hand);
  let r = ang * Math.PI / 180;
  // Carga: atras del todo, temblando mas cuanto mas fuerza lleva.
  if (F.phase === "charge" && e >= READY_S) { const v = Math.min(1, (e - READY_S) / CHARGE_S); r = 140 * Math.PI / 180 + v * 0.25 + Math.sin(t * 30) * 0.03 * v; }
  if (F.phase === "cast") r = e < 0.06 ? 154 * Math.PI / 180 : r - Math.min(1, (e - 0.06) / 0.12) * 0.2;
  // Con la captura ya guardada, la caña descansa.
  if (F.phase === "catch" && e > STASH_S) r = 40 * Math.PI / 180;
  if (F.phase === "wait") r += Math.sin(t * 2) * 0.04 - (F.nibbleUntil > t ? 0.1 : 0);
  if (F.phase === "bite" && Math.sin(t * 22) > 0) r -= 0.16;
  const f = actor.dir;
  return { hx: hx + 0.5, hy, tx: hx + 0.5 + Math.cos(r) * 16 * f, ty: hy - Math.sin(r) * 16, f };
}
function bobberPos(F, rod, t) {
  const hx = F.hole?.x ?? rod.tx, e = t - F.since;
  if (F.phase === "cast") { if (e < 0.1) return null; const p = Math.min(1, (e - 0.1) / 0.4); return [rod.tx + (hx - rod.tx) * p, rod.ty + (74 - rod.ty) * p - Math.sin(p * Math.PI) * 16]; }
  if (F.phase === "wait") return [hx, 74 + (Math.sin(t * 3) > 0.6 ? 1 : 0) + (F.nibbleUntil > t ? 1 : 0)];
  // Antes del leviatan o el kraken la boya se queda quieta y luego se hunde.
  if (F.phase === "omen") return e > 2.6 ? null : [hx, 74 + (e > 1.6 ? Math.min(3, Math.round((e - 1.6) * 3)) : 0)];
  if (F.phase === "bite") return e < 0.45 ? null : [hx, 75];
  if (F.phase === "fight") return [hx + Math.round(Math.sin(t * 6.3) * 4), 74 + (Math.sin(t * 13) > 0.4 ? 1 : 0)];
  return null;
}
function drawLine(g, x0, y0, x1, y1, sag) {
  const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
  g.globalAlpha = 0.85;
  let lx = null, ly = null;
  for (let i = 0; i <= 28; i++) {
    const s = i / 28, x = (1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * mx + s * s * x1, y = (1 - s) * (1 - s) * y0 + 2 * (1 - s) * s * my + s * s * y1;
    const rx = Math.round(x), ry = Math.round(y);
    if (rx !== lx || ry !== ly) px(g, rx, ry, "#e3f4ef");
    lx = rx; ly = ry;
  }
  g.globalAlpha = 1;
}

// Delante de Buddy: caña, linea, boya, la captura volando o en alto y el cofre.
export function fishingDrawFront(g, actor, a, fr, env) {
  const F = a.fishing;
  if (!F || actor.mood !== "fishing") return;
  const { t } = env, e = t - F.since, rod = rodGeom(actor, a, fr, env);
  if (rod) {
    // Con el leviatan o el kraken fuera, el sedal va a su boca o al tentaculo
    // que agarra la caña, y la caña se dobla salvo cuando Buddy saluda.
    const deepLine = F.phase === "monster" ? a.deep?.lineTo : null;
    const fight = F.phase === "fight" || (F.phase === "monster" && a.deep?.resp !== "signal");
    const hole = F.hole ? [F.hole.x, 75] : [rod.tx, 75];
    const bob = deepLine ? null : bobberPos(F, rod, t), bt = bob || deepLine || hole;
    const bent = fight ? [rod.hx + Math.cos(0.95) * 9 * rod.f, rod.hy - Math.sin(0.95) * 9] : null;
    const tx = bent ? bent[0] + (bt[0] - bent[0]) * 0.3 : rod.tx, ty = bent ? bent[1] + (bt[1] - bent[1]) * 0.25 + (Math.sin(t * 20) > 0 ? 1 : 0) : rod.ty;
    const pts = bent ? linePts(rod.hx, rod.hy, bent[0], bent[1]).concat(linePts(bent[0], bent[1], tx, ty)) : linePts(rod.hx, rod.hy, tx, ty);
    F.rodTip = [tx, ty];
    const [rc, tc] = RODS[actor.rod] || ["#c9965a", "#45d8ff"];
    pts.forEach(([x, y], i) => px(g, x, y, i < 4 ? "#5a3a1e" : rc));
    px(g, Math.round(tx), Math.round(ty), tc);
    rect(g, Math.round(rod.hx) - (rod.f > 0 ? 1 : 0), Math.round(rod.hy) + 1, 2, 2, "#ffd166");
    if (fight) px(g, Math.round(rod.hx) - (rod.f > 0 ? 1 : 0) + Math.floor(t * 12) % 2, Math.round(rod.hy) + 1, "#fff3b0");
    const B = bobbers(), lure = B[actor.lure] || B[""];
    if (F.phase === "charge" || (F.phase === "cast" && e < 0.1)) {
      const sway = Math.round(Math.sin(t * 5) * 1.5), bx = tx - 2 * rod.f + sway, by = ty + 6;
      drawLine(g, tx, ty, bx, by, 0); g.drawImage(lure, Math.round(bx) - 2, Math.round(by) - 1);
    }
    if (bob) { drawLine(g, tx, ty, bob[0], bob[1], F.phase === "wait" ? 5 : 0); g.drawImage(lure, Math.round(bob[0]) - 2, Math.round(bob[1]) - 2); }
    else if (deepLine) drawLine(g, tx, ty, deepLine[0], deepLine[1], 0);
    else if (F.phase === "bite" || F.phase === "omen") drawLine(g, tx, ty, hole[0], 76, 0);
    // La captura sale del agua y vuela hasta Buddy (el cofre, al suelo).
    if (F.phase === "catch" && e > 0.2 && e < 0.95) {
      const info = catchInfo(actor.catchId), img = catchSprite(actor.catchId), chest = info?.kind === "treasure";
      const p = Math.min(1, (e - 0.2) / 0.75), hd = env.toWorld(fr, fr.rig.a.head);
      const gx = chest ? actor.x + 14 * actor.dir : hd[0], gy = chest ? 77 - img.height / 2 : hd[1] - 10;
      const fx = hole[0] + (gx - hole[0]) * p, fy = 74 + (gy - 74) * p - Math.sin(p * Math.PI) * 20;
      drawLine(g, tx, ty, fx, fy, 0);
      blit(g, img, fx - Math.floor(img.width / 2), fy - Math.floor(img.height / 2), info?.kind === "fish" && Math.floor(t * 10) % 2 === 0);
    }
    // Al escaparse, la linea queda floja y suelta.
    if (F.phase === "escape") drawLine(g, tx, ty, tx + rod.f * 4, ty + 10 + Math.min(8, e * 20), 0);
  }
  if (F.phase === "catch") {
    const info = catchInfo(actor.catchId), img = catchSprite(actor.catchId);
    if (info?.kind === "treasure" && e >= 0.95) {
      const cx = Math.round(actor.x + 14 * actor.dir), open = e > 1.45 ? chestOpenSprite() : img;
      g.drawImage(open, cx - Math.floor(open.width / 2), 77 - open.height + 1);
    } else if (e >= SHOW_S && e < STORED_S) {
      // En alto; luego vuela por encima del hombro hasta la mochila, encogiendo.
      const hd = env.toWorld(fr, fr.rig.a.head), back = F.pack = env.toWorld(fr, PACK);
      const hx = hd[0], hy = hd[1] - Math.floor(img.height / 2) - 1 + (Math.sin(t * 6) > 0 ? -1 : 0);
      if (e < STASH_S) g.drawImage(img, hx - Math.floor(img.width / 2), hy - Math.ceil(img.height / 2));
      else drawStash(g, img, [hx, hy], back, (e - STASH_S) / (STORED_S - STASH_S));
    }
  }
}

// Lo mas alto sobre Pip: la captura en alto.
export function fishingTop(actor, a, fr, env) {
  const F = a.fishing;
  if (!F || actor.mood !== "fishing" || F.phase !== "catch" || env.t - F.since < SHOW_S || env.t - F.since > STASH_S) return null;
  const info = catchInfo(actor.catchId);
  if (info?.kind === "treasure") return null;
  return env.toWorld(fr, fr.rig.a.head)[1] - catchSprite(actor.catchId).height - 2;
}

// Por encima de la luz: la barra de captura y los destellos de una buena pieza
// (el "!" de la picada ya lo dice Buddy en su bocadillo).
export function fishingDrawOverlay(g, actor, a, fr, env) {
  const F = a.fishing;
  if (!F || actor.mood !== "fishing") return;
  const { t } = env, e = t - F.since, hd = env.toWorld(fr, fr.rig.a.head);
  if (F.phase === "charge" && e >= READY_S) drawPowerMeter(g, Math.round(actor.x) - 16 * actor.dir - 1, hd[1] + 3, Math.min(1, (e - READY_S) / CHARGE_S), t);
  if (F.phase === "fight" && F.bar && F.hole) drawCatchBar(g, F, catchInfo(actor.catchId)?.color || "#45d8ff", actor.dir);
  const info = catchInfo(actor.catchId);
  if (F.phase === "catch" && e > SHOW_S && e < STASH_S && info && info.kind === "fish") {
    for (let i = 0; i < 4; i++) {
      if (Math.sin(t * 7 + i * 1.7) < 0.2) continue;
      const sx = hd[0] + [-9, 9, -6, 7][i], sy = hd[1] - [6, 8, 13, 13][i] - 8;
      px(g, sx, sy, "#fff3b0"); px(g, sx - 1, sy, "#ffd166"); px(g, sx + 1, sy, "#ffd166"); px(g, sx, sy - 1, "#ffd166"); px(g, sx, sy + 1, "#ffd166");
    }
  }
}

// Barra de fuerza del lanzamiento: se llena de verde a rojo y brilla al tope.
function drawPowerMeter(g, x, y, v, t) {
  const mh = 14, fh = Math.round(v * mh);
  rect(g, x - 1, y - 1, 5, mh + 2, "#3a2214"); rect(g, x, y, 3, mh, "#1b1410");
  rect(g, x, y + mh - fh, 3, fh, v < 0.5 ? "#6fd34a" : v < 0.85 ? "#ffd166" : "#ff6a4a");
  if (fh) rect(g, x, y + mh - fh, 1, fh, "#ffffff");
  if (v >= 1 && Math.floor(t * 12) % 2) { rect(g, x - 1, y - 2, 5, 1, "#fff3b0"); px(g, x + 1, y - 3, "#ffffff"); }
}

// La barra de pesca al estilo Stardew: zona verde, el pez que se escapa y el
// progreso al lado. La pelea la decide el hook; la barra la acompaña.
function drawCatchBar(g, F, color, dir) {
  const B = F.bar, x = Math.round(F.hole.x) + (dir > 0 ? 20 : -31), y = 38, h = 32, inner = h - 4, zh = B.zh;
  rect(g, x - 1, y - 1, 12, h + 2, "#3a2214");
  rect(g, x, y, 10, h, "#c98a4a"); rect(g, x, y, 10, 1, "#e8b070"); rect(g, x, y + h - 1, 10, 1, "#8a5a2e");
  rect(g, x + 2, y + 2, 4, inner, "#1b3a5a");
  for (let i = 1; i < inner; i += 5) px(g, x + 3, y + 2 + i, "#2a5a80");
  const zy = y + 2 + Math.round((1 - B.zone) * (inner - zh));
  rect(g, x + 2, zy, 4, zh, "#6fd34a"); rect(g, x + 2, zy, 4, 1, "#b8f08a"); rect(g, x + 2, zy + zh - 1, 4, 1, "#3f9a2a");
  const fy = y + 2 + Math.round((1 - B.fish) * (inner - 3));
  rect(g, x + 2, fy, 4, 3, "#14202a"); rect(g, x + 3, fy + 1, 2, 1, color); px(g, x + 2, fy + 1, color);
  rect(g, x + 7, y + 2, 2, inner, "#1b1410");
  const ph = Math.round(B.progress * inner);
  rect(g, x + 7, y + 2 + inner - ph, 2, ph, B.progress > 0.66 ? "#6fd34a" : B.progress > 0.33 ? "#ffd166" : "#ff6a4a");
}

// Caña de exhibicion del inventario: la misma caña y la misma boya que saca
// Buddy en el footer, en diagonal, con la linea recogida junto a la punta y
// un contorno oscuro para que se lea sobre la pantalla del modal.
const rodIcons = new Map();
export function rodIconSprite(rodId = "", lureId = "") {
  const key = rodId + "|" + lureId;
  let icon = rodIcons.get(key);
  if (icon) return icon;
  const W = 22, H = 30, [rc, tc] = RODS[rodId] || ["#c9965a", "#45d8ff"];
  const [c, g] = makeCanvas(W, H);
  linePts(17, 26, 4, 3).forEach(([x, y], i) => px(g, x, y, i < 5 ? "#5a3a1e" : rc));
  px(g, 4, 3, tc); px(g, 5, 4, tc);
  rect(g, 18, 22, 2, 2, "#ffd166"); px(g, 19, 23, "#fff3b0");
  rect(g, 16, 27, 2, 1, "#3a2414");
  for (let y = 5; y < 20; y++) px(g, 3, y, "#b8f7ff");
  const lure = bobbers()[lureId] || bobbers()[""];
  g.drawImage(lure, 3 - Math.floor(lure.width / 2), 19);
  // Contorno: la silueta en oscuro, un pixel hacia cada lado, por detras.
  const [oc, og] = makeCanvas(W, H);
  for (const [dx, dy] of N4) og.drawImage(c, dx, dy);
  og.globalCompositeOperation = "source-in";
  og.fillStyle = "#020604"; og.fillRect(0, 0, W, H);
  og.globalCompositeOperation = "source-over";
  og.drawImage(c, 0, 0);
  rodIcons.set(key, oc);
  return oc;
}
