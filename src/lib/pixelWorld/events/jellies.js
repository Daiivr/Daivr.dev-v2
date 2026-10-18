import { ellipseRows, halo, lazy, px, rect } from "../core.js";

// Medusas de luna (useBuddyJellies): una noche rara de verano el sendero se
// abre en una poza quieta con la luna reflejada, aparece un embarcadero de
// tablas y Pip se sienta en la punta. De la poza empiezan a brillar luces bajo
// el agua y salen, una a una, medusas que laten (la campana se encoge y da un
// impulso), con los tentaculos ondeando detras, y suben despacio hacia las
// estrellas, a la deriva, hasta perderse por arriba. Brillan por encima de la
// luz de la noche, con su halo y un charco de luz cuando van bajas, y el valle
// se tiñe de azul luna mientras dura.
const POND_RX = 22;
const POND_Y = 75;
const OPEN_S = 1.6;
const CLOSE_S = 1.4;
const FIRST_S = 1.6; // primera medusa, desde que Pip llega al embarcadero
const SIT_S = 1.3;
const COUNT = 15;
const TINT = [0.42, 0.58, 0.9];
// Se desvanecen al llegar arriba del cielo del footer (no salen por encima).
const FADE_FROM = 14, FADE_TO = -2;
// El embarcadero: de la orilla (DOCK_NEAR pasada la poza) a la punta, sobre el agua.
const DOCK_NEAR = 18, DOCK_TIP = 9;

const PALETTES = [
  { b: "#2fd8c8", B: "#7ff5e6", W: "#e8fffb", f: "#1fa8a0", glow: "90,255,230", light: [0.4, 1, 0.92] },
  { b: "#4ab8ff", B: "#9ad8ff", W: "#f0faff", f: "#2a88d8", glow: "110,200,255", light: [0.45, 0.8, 1] },
  { b: "#ff7ac8", B: "#ffb0e0", W: "#fff0f8", f: "#d84aa0", glow: "255,140,210", light: [1, 0.6, 0.88] },
  { b: "#b48aff", B: "#d8c0ff", W: "#f8f0ff", f: "#8a5ad8", glow: "190,150,255", light: [0.75, 0.6, 1] }
];
// Campana relajada y encogida (al latir), de tres tamaños.
const BELLS = {
  s: [[".bbb.", "bBWBb", "bbbbb", "f.f.f"], [".bbb.", ".bWb.", ".bBb.", ".fff."]],
  m: [["..bbb..", ".bBWBb.", "bbBBBbb", "bbbbbbb", "f.f.f.f"], ["..bbb..", ".bBWBb.", ".bBBBb.", ".bbbbb.", "..f.f.."]],
  l: [["...bbb...", ".bbBBBbb.", "bbBBWBBbb", "bBBBBBBBb", "bbbbbbbbb", "f.f.f.f.f"], ["...bbb...", "..bBWBb..", ".bBBBBBb.", ".bBBBBBb.", ".bbbbbbb.", "..f.f.f.."]]
};
const TENTACLES = { s: 2, m: 3, l: 4 };
const BELL_IMG = lazy(() => {
  const out = {};
  PALETTES.forEach((pal, ci) => {
    for (const [size, frames] of Object.entries(BELLS)) {
      out[`${ci}${size}`] = frames.map((rows) => {
        const c = document.createElement("canvas");
        c.width = rows[0].length; c.height = rows.length;
        const g = c.getContext("2d");
        rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
        return c;
      });
    }
  });
  return out;
});

function state(a, t) {
  return (a.jellies ??= { phase: "", since: t, pond: null, open: 0, list: [], next: 0, spawned: 0, motes: [] });
}

export function jelliesUpdate(actor, a, env) {
  const live = actor.mood === "jellies" && !actor.ghost;
  if (!live && !a.jellies) return;
  const J = state(a, env.t), { t, dt } = env;
  const phase = live ? actor.jellies || "" : "";
  if (J.phase !== phase) { J.phase = phase; J.since = t; if (phase === "watch") { J.next = t + FIRST_S; J.spawned = 0; } }
  if (live && actor.jellyX != null) J.pond = { x: actor.jellyX / 2, side: actor.jellySide || -1 };
  // la poza se abre al empezar y se cierra al irse (o si se corta el evento)
  const opening = phase === "walk" || phase === "watch";
  J.open = Math.max(0, Math.min(1, J.open + dt * (opening ? 1 / OPEN_S : -1 / CLOSE_S)));
  // salen las medusas, una a una
  if (phase === "watch" && J.pond && J.spawned < COUNT && t >= J.next) {
    J.spawned += 1;
    J.next = t + 0.45 + Math.random() * 0.55;
    const size = Math.random() < 0.28 ? "l" : Math.random() < 0.55 ? "m" : "s";
    J.list.push({
      x: J.pond.x - J.pond.side * (Math.random() * (POND_RX - 8) + 1), y: POND_Y + 4, born: t, size,
      c: Math.random() < 0.7 ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2),
      rise: 5 + Math.random() * 3 + (size === "s" ? 1.5 : 0), drift: (Math.random() < 0.75 ? -J.pond.side : J.pond.side) * (1.2 + Math.random() * 3),
      beat: 1.1 + Math.random() * 0.6, ph: Math.random() * 6, sway: 2 + Math.random() * 3, alpha: 0
    });
  }
  for (const j of J.list) {
    const age = t - j.born, cycle = ((age + j.ph) % j.beat) / j.beat;
    // el impulso: justo despues de encogerse sube mas deprisa
    const push = cycle < 0.3 ? 2.2 : cycle < 0.55 ? 1.2 : 0.55;
    j.squeeze = cycle < 0.3;
    j.y -= j.rise * push * dt;
    j.x += (j.drift * Math.min(1, age / 4) + Math.sin(age * 0.7 + j.ph) * j.sway * 0.4) * dt;
    j.alpha = Math.min(1, age / 0.8) * Math.max(0, Math.min(1, (j.y - FADE_TO) / (FADE_FROM - FADE_TO)));
    // (al salir del agua, un anillo en la superficie)
    if (!j.surfaced && j.y < POND_Y - 1) { j.surfaced = true; j.ring = t; }
  }
  J.list = J.list.filter((j) => j.alpha > 0 || t - j.born < 1);
  // motas de luz que suben de la poza
  if (J.open > 0.8 && (phase === "watch" || phase === "walk") && J.pond && Math.random() < dt * 5) {
    env.spawn({ k: "pix1", x: J.pond.x + (Math.random() * 2 - 1) * (POND_RX - 4), y: POND_Y - 1, vx: (Math.random() - 0.5) * 3, vy: -5 - Math.random() * 6, life: 1.4 + Math.random(), c: Math.random() < 0.5 ? "#9ff8ec" : "#d8c0ff" });
  }
  if (!live && J.open <= 0 && !J.list.length) a.jellies = null;
}

export function jelliesPose(actor, a, t) {
  const J = a.jellies;
  if (!J || actor.mood !== "jellies") return null;
  const e = t - J.since;
  if (J.phase === "watch") {
    if (e < SIT_S) return { pose: "idle", lookY: -1, expr: "surprised" };
    // sentado en la punta del embarcadero, mirando arriba
    return { pose: "sit", lookY: -1, expr: Math.sin(t * 0.7) > 0.96 ? "blink" : "happy" };
  }
  // se despide con la mano
  if (J.phase === "leave") return e < 1.6 ? { pose: "wave", frame: Math.floor(t * 4) % 2, lookY: -1, expr: "happy" } : { pose: "idle", expr: "happy" };
  return actor.moving ? null : { lookY: -1 };
}

// La poza: agua oscura con la luna temblando y luces bajo la superficie; y el
// embarcadero, del lado de Pip.
export function jelliesDrawGround(g, actor, a, env) {
  const J = a.jellies;
  if (!J?.pond || J.open <= 0) return;
  const { t } = env, o = J.open, hx = Math.round(J.pond.x), side = J.pond.side;
  const rx = Math.max(1, Math.round(POND_RX * o)), ry = Math.max(1, Math.round(3.5 * o));
  ellipseRows(g, hx, POND_Y, rx + 2, ry + 1, "#3a2a1c");
  ellipseRows(g, hx, POND_Y, rx + 1, ry, "#1a1410");
  ellipseRows(g, hx, POND_Y, rx, ry, "#0c2238");
  ellipseRows(g, hx, POND_Y + 1, Math.max(1, rx - 3), Math.max(0, ry - 1), "#123050");
  rect(g, hx - rx + 2, POND_Y - ry, Math.max(1, rx * 2 - 3), 1, "#06121e");
  if (o < 0.5) return;
  // la luna reflejada, rota en franjas que tiemblan
  for (let i = 0; i < 3; i++) {
    const w = 5 - i * 1.5, dx = Math.round(Math.sin(t * 1.3 + i * 1.7) * 1.5);
    rect(g, hx - 6 + dx - Math.round(w / 2), POND_Y - 1 + i, Math.max(1, Math.round(w)), 1, i === 0 ? "#e8f0ff" : "#a8c0e0");
  }
  // brillos bajo el agua: las medusas que van a salir
  const S = Math.min(1, o);
  for (let i = 0; i < 5; i++) {
    const u = t * 0.4 + i * 1.9, x = hx + Math.round(Math.sin(u) * (rx - 5)), pal = PALETTES[i % PALETTES.length];
    g.globalAlpha = (0.35 + 0.25 * Math.sin(t * 2 + i)) * S * (J.phase === "watch" && J.spawned >= COUNT ? 0.4 : 1);
    rect(g, x - 1, POND_Y + (i % 2), 3, 1, pal.b); px(g, x, POND_Y + (i % 2), pal.B);
    g.globalAlpha = 1;
  }
  // reflejos de las medusas que van bajas
  for (const j of J.list) {
    if (j.y > POND_Y - 2 || j.y < POND_Y - 30 || Math.abs(j.x - hx) > rx - 2) continue;
    g.globalAlpha = 0.5 * j.alpha * (1 - (POND_Y - j.y) / 30);
    px(g, Math.round(j.x), POND_Y + 1, PALETTES[j.c].B);
    g.globalAlpha = 1;
  }
  // anillos donde sale cada una
  for (const j of J.list) {
    if (!j.ring) continue;
    const e = t - j.ring;
    if (e > 0.9) continue;
    const r = 1 + Math.round(e * 7), x = Math.round(j.x);
    g.globalAlpha = 1 - e / 0.9;
    for (const [dx, dy] of [[-r, 0], [r, 0], [-r + 1, -1], [r - 1, -1], [-r + 1, 1], [r - 1, 1]]) px(g, x + dx, POND_Y + dy, "#9fd8f0");
    g.globalAlpha = 1;
  }
  // el embarcadero: tablas sobre dos postes, de la orilla a encima del agua
  const near = hx + side * (rx + DOCK_NEAR), far = hx + side * DOCK_TIP, lo = Math.min(near, far), hi = Math.max(near, far);
  g.globalAlpha = Math.min(1, (o - 0.5) * 2);
  for (const postX of [far + side * 1, Math.round((near + far) / 2)]) { rect(g, postX, 77, 2, 4, "#3a2414"); px(g, postX, 77, "#6a4626"); }
  // el poste de la orilla, mas alto, con su farolillo
  const lp = near - side * 2;
  rect(g, lp, 66, 1, 10, "#5c3a1e"); px(g, lp, 66, "#8a5a2e");
  rect(g, lp - 1 + (side > 0 ? 0 : 0), 64, 3, 1, "#3a2414");
  J.lantern = [lp, 65];
  rect(g, lo, 75, hi - lo + 1, 1, "#c8955a");
  rect(g, lo, 76, hi - lo + 1, 1, "#8a5a2e");
  rect(g, lo, 77, hi - lo + 1, 1, "#5c3a1e");
  for (let x = lo + 3; x < hi; x += 4) px(g, x, 75, "#6a4626");
  px(g, lo, 75, "#5c3a1e"); px(g, hi, 75, "#5c3a1e");
  g.globalAlpha = 1;
}

// Una medusa: campana (relajada o encogida) y tentaculos que ondean detras.
function drawJelly(g, j, t) {
  const imgs = BELL_IMG()[`${j.c}${j.size}`], img = imgs[j.squeeze ? 1 : 0], pal = PALETTES[j.c];
  const x = Math.round(j.x - img.width / 2), y = Math.round(j.y - img.height);
  // (lo que sigue bajo el agua no se ve)
  const visible = Math.min(img.height, POND_Y - y);
  if (visible <= 0) return;
  g.globalAlpha = j.alpha * 0.92;
  g.drawImage(img, 0, 0, img.width, visible, x, y, img.width, visible);
  const n = TENTACLES[j.size], len = j.size === "l" ? 9 : j.size === "m" ? 7 : 5, stretch = j.squeeze ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const tx = x + Math.round((i + 0.5) * img.width / n);
    for (let k = 0; k < len + stretch * 2; k++) {
      const ty = y + img.height + k;
      if (ty >= POND_Y) break;
      const wave = Math.round(Math.sin(t * 3 + i * 1.3 + k * 0.6 + j.ph) * Math.min(1.5, k * 0.25));
      g.globalAlpha = j.alpha * (1 - k / (len + 3)) * 0.85;
      px(g, tx + wave, ty, k % 3 === 2 ? pal.B : pal.f);
    }
  }
  g.globalAlpha = 1;
}

// Por encima de la luz de la noche: brillan de verdad, con su halo.
export function jelliesDrawOverlay(g, actor, a, fr, env) {
  const J = a.jellies;
  if (!J) return;
  // el farolillo del embarcadero
  if (J.lantern && J.open > 0.5) {
    const [x, y] = J.lantern, f = Math.floor(env.t * 5) % 3;
    g.globalAlpha = Math.min(1, (J.open - 0.5) * 2);
    rect(g, x - 1, y, 3, 3, "#3a2414"); px(g, x, y + 1, f ? "#ffd27a" : "#ffe9a8"); px(g, x, y + 2, "#ffb04a");
    halo(g, x, y + 1, 5, "255,200,120", 0.1 * J.open);
    g.globalAlpha = 1;
  }
  if (!J.list.length) return;
  for (const j of J.list) {
    if (j.alpha <= 0) continue;
    const pal = PALETTES[j.c], r = j.size === "l" ? 9 : j.size === "m" ? 7 : 5;
    if (j.y < POND_Y + 2) { halo(g, j.x, j.y - r / 2, r + 3, pal.glow, 0.07 * j.alpha); halo(g, j.x, j.y - r / 2, Math.ceil(r * 0.6), pal.glow, 0.09 * j.alpha); }
    drawJelly(g, j, env.t);
  }
}

// El valle, azul luna; cada medusa baja es un charquito de luz.
export function jelliesLight(actor, a, env) {
  const J = a.jellies;
  if (!J || (J.open <= 0 && !J.list.length)) return null;
  const k = Math.max(J.open, Math.min(1, J.list.length / 4)) * 0.3;
  const lights = [];
  for (const j of J.list) if (j.y > 20 && j.alpha > 0.1) lights.push({ x: j.x, y: j.y - 3, r: j.size === "l" ? 16 : 12, c: PALETTES[j.c].light, s: 0.32 * j.alpha });
  if (J.pond && J.open > 0.5) lights.push({ x: J.pond.x, y: POND_Y, r: 26, c: [0.45, 0.85, 1], s: 0.22 * J.open });
  if (J.lantern && J.open > 0.5) lights.push({ x: J.lantern[0], y: J.lantern[1] + 2, r: 14, c: [1, 0.8, 0.5], s: 0.45 * J.open });
  // (las farolas, como esten: ni se encienden ni se apagan por esto)
  return { dim: k, dark: TINT, lamps: env.light?.lamps ?? 0, wind: 0.6, lights };
}

