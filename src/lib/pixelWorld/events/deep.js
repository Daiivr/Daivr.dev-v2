import { ellipseRows, gridSprite, lazy, makeCanvas, px, rect, rgb } from "../core.js";
import { P } from "../palette.js";
import { LAMP_H } from "../props.js";
import { createSculpt, material } from "../sculpt.js";

// Los encuentros raros de la pesca (useBuddyFishing: omen, monster, retreat),
// dentro del valle. Las criaturas se modelan en volumen (sculpt.js): tubos y
// elipsoides con luz de verdad, contorno y costuras, no sprites planos.
// - El valle contiene el aliento: el viento se para, las farolas parpadean y
//   luego se encienden, la luz se va a un verde azulado profundo, una bruma
//   baja sobre el sendero, la poza se ensancha y hierve, y algo enorme ronda
//   bajo el suelo (bultos que avanzan por el camino; con el kraken, grietas).
// - Leviatan: sale de la poza en un estallido de agua, con el cuello en S, la
//   panza de escamas, una vela de espinas, dos lazos del cuerpo que asoman del
//   sendero y la cola que golpea; ruge con la mandibula abierta (onda, rafaga,
//   temblor) y luego respira, parpadea y resopla. Steady: baja la cabeza hasta
//   Buddy. Signal: sus manchas se encienden en cascada, ladea la cabeza.
// - Kraken: el manto sale de la poza con el ojo enorme siguiendo a Buddy, ocho
//   brazos con ventosas: uno agarra la caña, otro se enrosca en una farola
//   (que parpadea), otro golpea el sendero, otro amenaza a Buddy. Steady:
//   suelta la caña y le da palmaditas. Signal: cambia de color en oleadas y
//   saluda con un brazo. Se va en una nube de tinta.
// Todo se calcula con Buddy a la izquierda del agujero y se refleja si esta a
// la derecha.
const PHASES = new Set(["omen", "monster", "retreat"]);
const DEEP_TINT = [0.3, 0.5, 0.68];
const WATER = 76;
const LAMP_TOP = 72 - LAMP_H + 1;
const BUF = { x: -150, y: -70, w: 330, h: 160 };
const sm = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 997 / 997;
const lerpAng = (a, b, k) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;
const HEART = lazy(() => gridSprite([".r.r.", "rrrrr", ".rrr.", "..r.."], { r: "#ff7aa8" }));

// ---- materiales ----
const tone = (b, L, n) => Math.max(0, Math.min(n - 1, Math.floor(Math.max(0, Math.min(0.999, L * 1.12 - 0.06 + (b - 0.5) * 0.35)) * n)));
// (con menos tramado, para pieles con dibujo)
const tone2 = (b, L, n) => Math.max(0, Math.min(n - 1, Math.floor(Math.max(0, Math.min(0.999, L * 1.15 - 0.1 + (b - 0.5) * 0.12)) * n)));
const LEV = { skin: ["#030c12", "#082230", "#0f3b4a", "#195a68", "#2e8088", "#62b6b0"], belly: ["#2a5450", "#4a8476", "#7cb8a0", "#bfe4cc"], line: "#3a6e62" };
const LEV_SKIN = LEV.skin.map(rgb), LEV_BELLY = LEV.belly.map(rgb), LEV_LINE = rgb(LEV.line);
const KRK_SKIN = ["#18040f", "#360c2a", "#5a1848", "#84286a", "#b04a8e", "#de86ba"].map(rgb);
const KRK_UNDER = ["#4a1a36", "#7e3a5c", "#b86a8c", "#eaa8c2"].map(rgb);
const KRK_FLASH = ["#3a0a1a", "#7a1a34", "#c03a4a", "#ee6a5a", "#ffa078", "#ffd8b8"].map(rgb);
const MATS = (flash) => [
  null,
  // 1 piel del leviatan: escamas en rombo sobre los tonos medios, panza de escudos claros
  material(LEV.skin, "#02070b", ({ lam, aux, u, b }) => {
    const L = lam * 0.5 + 0.5;
    if (aux > 0.48) return ((u * 40) % 1) < 0.1 && aux > 0.55 ? LEV_LINE : LEV_BELLY[tone2(b, L, 4)];
    let k = tone2(b, L, 6);
    // escamas al tresbolillo: una marca oscura en cada una, solo en lo iluminado
    const su = u * 44, sv = (aux + 1) * 4.2;
    if (k >= 2 && ((Math.floor(su) + Math.floor(sv)) & 1) === 0 && su % 1 < 0.34 && sv % 1 < 0.6) k -= 1;
    return LEV_SKIN[Math.min(5, k)];
  }),
  // 2 membrana de aletas y vela (traslucida, con radios)
  material(["#0c3a48", "#17606e", "#2a8a96", "#5ac0c0"], "#03090e", ({ aux, b, u }) => ((u * 30) % 1 < 0.2 ? 0 : aux > 0.6 ? 3 : aux > 0.3 ? 2 : b > 0.5 ? 1 : 2)),
  // 3 hueso de cuernos y espinas
  material(["#3a3428", "#7a6e54", "#bcae86", "#ece2c0"], "#140f08"),
  // 4 interior de la boca
  material(["#1a0408", "#3a0a14", "#6a1a28", "#a83a4a"], "#0a0204", ({ lam, b }) => tone(b, lam * 0.5 + 0.3, 4)),
  // 5 cuenca del ojo y ceja (mas oscuras)
  material(["#030a0e", "#08202a", "#123a46", "#205a66"], "#020608"),
  // 6 piel del kraken: manchas oscuras, verrugas claras; en Signal, oleadas de color
  material(["#2a0820"], "#16030f", ({ lam, aux, b, x, y }) => {
    const L = lam * 0.5 + 0.5;
    if (flash > 0) {
      const band = Math.sin((y * 0.45 - flash * 12) + x * 0.1);
      if (band > 0.45 && flash < 2.6) return KRK_FLASH[tone2(b, L, 6)];
    }
    let k = tone2(b, L, 6);
    if (aux > 0.6) return KRK_UNDER[tone2(b, L, 4)];
    // manchas grandes y suaves, y alguna verruga clara en lo iluminado
    if (k >= 2 && k <= 4 && hash(Math.floor(x / 4), Math.floor(y / 4)) > 0.7 && b < 0.75) k -= 1;
    if (k >= 4 && hash(x, y) > 0.985) k = 5;
    return KRK_SKIN[k];
  }),
  // 7 brazo del kraken: lomo oscuro, cara de ventosas palida
  material(["#2a0820"], "#16030f", ({ lam, aux, b }) => {
    const L = lam * 0.5 + 0.5;
    if (aux > 0.35) return KRK_UNDER[tone2(b, L, 4)];
    return KRK_SKIN[Math.min(5, tone2(b, L, 6))];
  }),
  // 8 poste de farola (el que abraza el brazo)
  material(["#1b1f2a", "#3d4456", "#6b7690"], "#0c0e14"),
  // 9 cuenca del ojo del kraken
  material(["#18040f", "#3a0c2c", "#64205a", "#94387e"], "#0e0209")
];
const MATS_PLAIN = MATS(0);

// ---- estado ----
const live = (actor) => actor.mood === "fishing" && PHASES.has(actor.fishing);
const local = (D, x) => (D.dir > 0 ? x : 2 * D.hx - x);
function state(a) {
  return (a.deep ??= {
    phase: "", since: 0, creature: "leviathan", dir: 1, hx: 0, dim: 0, pool: 0, rise: 0, resp: "", respAt: 0, surfaceT: -99,
    tents: [], cracks: [], parts: [], spots: [], glow: [], eyeAt: null, mouth: null, lineTo: null, head: null, blinkUntil: 0, nextBlink: 0,
    nextRumble: 0, nextHuff: 0, bumps: [], tail: 0, tailSlap: 0, slam: 0, slamAt: 0, slammed: false, lamp: null, roared: false, flash: 0, wave: null,
    coils: 0, mist: 0, inkAt: -99, wind: 1, back: null, front: null
  });
}
function spawnLocal(env, D, p) { env.spawn({ ...p, x: local(D, p.x), vx: (p.vx || 0) * D.dir }); }

export function deepUpdate(actor, a, env) {
  const phase = live(actor) ? actor.fishing : "";
  if (!phase && !a.deep) return;
  const D = state(a), F = a.fishing, { t, dt } = env;
  if (F?.hole) D.hx = F.hole.x;
  if (phase && !D.phase) {
    D.dir = F?.hole ? (F.hole.x >= actor.x ? 1 : -1) : actor.dir || 1;
    D.creature = actor.sea === "kraken" ? "kraken" : "leviathan";
  }
  const hx = D.hx, bx = local(D, actor.x);
  if (phase !== D.phase) {
    D.phase = phase; D.since = t;
    if (phase === "omen") {
      D.resp = ""; D.parts = []; D.rise = 0; D.tents = []; D.roared = false; D.lamp = null; D.surfaceT = -99;
      D.cracks = D.creature === "kraken" ? [{ x: bx - 26, open: 0 }, { x: hx + 46, open: 0 }] : [];
      D.bumps = [0, 1, 2].map((i) => ({ x: hx + (i % 2 ? -1 : 1) * (70 + i * 30), v: (i % 2 ? 1 : -1) * (16 + i * 4), life: 2.2 + i * 1.1, at: t + i * 0.9 }));
      env.shake(1, 0.3);
    }
    if (phase === "monster") surface(D, actor, env, bx);
    if (phase === "retreat") {
      env.splash(hx, 70, 34, "#d6efff"); env.shake(2, 0.5);
      if (D.creature === "kraken") {
        D.inkAt = t;
        for (let i = 0; i < 22; i++) D.parts.push({ k: "ink", x: hx + (Math.random() - 0.5) * 30, y: 74 - Math.random() * 6, vx: (Math.random() - 0.5) * 34, vy: -6 - Math.random() * 16, g: -2, life: 1.4 + Math.random() * 1.2, r: 2 + Math.random() * 3 });
      }
    }
  }
  const resp = phase === "monster" ? actor.seaResponse || "" : D.resp;
  if (resp !== D.resp) {
    D.resp = resp; D.respAt = t;
    if (resp === "signal") for (let i = 0; i < 5; i++) D.parts.push({ k: "heart", x: (D.creature === "kraken" ? hx + 6 : hx - 14) + (Math.random() - 0.5) * 12, y: D.creature === "kraken" ? 30 : 0, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 6, life: 1.8, delay: i * 0.25 });
    if (resp === "steady" && D.creature === "kraken") env.splash(local(D, hx - 14), 72, 6, "#d6efff");
  }
  const e = t - D.since, m = t - D.surfaceT;
  const dimTo = phase === "omen" ? Math.min(0.62, e / 2.6 * 0.62) : phase === "monster" ? 0.84 : 0;
  D.dim += (dimTo - D.dim) * Math.min(1, dt * (dimTo > D.dim ? 1.6 : 0.7));
  D.pool += ((phase === "omen" || phase === "monster" ? 1 : 0) - D.pool) * Math.min(1, dt * (phase === "retreat" ? 0.8 : 1.2));
  D.mist += ((phase ? 1 : 0) - D.mist) * Math.min(1, dt * (phase ? 0.6 : 0.5));
  if (phase && F) F.holeOpen = Math.max(F.holeOpen, phase === "retreat" ? F.holeOpen : 1) * (1 + 0.7 * D.pool);
  for (const c of D.cracks) c.open += (phase === "omen" && e > 1.5) || phase === "monster" ? Math.min(1, dt * 1.5) : -Math.min(c.open, dt * 0.8);
  D.rise = phase === "monster" ? sm(m / 1.3) : phase === "retreat" ? 1 - sm(e / 1.25) : 0;
  D.coils = phase === "monster" ? sm((m - 0.9) / 1.2) : phase === "retreat" ? 1 - sm(e / 1.5) : 0;
  D.flash = Math.max(0, D.flash - dt * 2.2);
  // El viento se para; el rugido trae una rafaga
  const roarK = D.creature === "leviathan" && phase === "monster" ? sm((m - 1.5) / 0.35) * (1 - sm((m - 2.95) / 0.45)) : 0;
  D.wind = phase === "omen" ? 0.06 : phase === "monster" ? (roarK > 0.2 ? 3.4 : 0.35) : phase === "retreat" ? 0.6 : 1;
  if (phase === "omen") {
    if (t > D.nextRumble) { D.nextRumble = t + 1.1 + Math.random() * 0.8; env.shake(1, 0.25); }
    for (const c of D.cracks) if (c.open > 0.2 && Math.random() < dt * 6) spawnLocal(env, D, { k: "drop", x: c.x + (Math.random() - 0.5) * 8, y: 74, vx: (Math.random() - 0.5) * 24, vy: -10 - Math.random() * 10, g: 90, life: 0.4, c: Math.random() < 0.5 ? "#86592f" : "#5b3a20" });
    // Bultos bajo el sendero que avanzan hacia la poza, soltando tierra
    for (const B of D.bumps) {
      if (t < B.at || t > B.at + B.life) continue;
      B.x += B.v * dt * (Math.abs(B.x - hx) > 18 ? 1 : 0);
      if (Math.random() < dt * 9) spawnLocal(env, D, { k: "drop", x: B.x + (Math.random() - 0.5) * 6, y: 75, vx: (Math.random() - 0.5) * 20, vy: -12 - Math.random() * 12, g: 90, life: 0.45, c: Math.random() < 0.5 ? "#86592f" : "#ab7944" });
    }
  }
  if ((phase === "omen" || phase === "monster") && Math.random() < dt * (phase === "omen" ? 14 : 6)) {
    const rx = 15 * (F?.holeOpen || 1) - 3;
    D.parts.push({ k: "bub", x: hx + (Math.random() - 0.5) * rx * 2, y: 75, vx: 0, vy: -5 - Math.random() * 7, life: 0.5 + Math.random() * 0.6 });
  }
  if (phase === "monster") {
    if (t > D.nextBlink) { D.blinkUntil = t + 0.14; D.nextBlink = t + 2.4 + Math.random() * 2.2; }
    if (D.creature === "leviathan") {
      if (!D.roared && m > 1.55) {
        D.roared = true; env.shake(3, 1.2); D.wave = { at: t };
        for (let i = 0; i < 14; i++) spawnLocal(env, D, { k: "drop", x: hx - 10 + (Math.random() - 0.5) * 30, y: 6 + Math.random() * 10, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, g: 120, life: 1, c: "#bff2f8" });
      }
      // Agua que chorrea del cuello, la cola que golpea, un resoplido de vez en cuando
      if (D.spots.length && Math.random() < dt * 26) { const p = D.spots[Math.floor(Math.random() * D.spots.length)]; spawnLocal(env, D, { k: "drop", x: p[0] + 3, y: p[1], vx: (Math.random() - 0.5) * 6, vy: 0, g: 130, life: 0.7, c: "#bff2f8" }); }
      const prevTail = D.tail;
      D.tail = Math.max(0, Math.sin(t * 1.25 + 1)) * D.coils;
      if (prevTail > 0.9 && D.tail <= 0.9 && Math.sin(t * 1.25 + 1) < prevTail) { env.splash(local(D, hx + 96), 72, 12, "#d6efff"); env.shake(0.8, 0.2); }
      if (t > D.nextHuff && D.mouth && m > 3.4) { D.nextHuff = t + 3 + Math.random() * 2; for (let i = 0; i < 6; i++) D.parts.push({ k: "mist", x: D.mouth.nostril[0], y: D.mouth.nostril[1], vx: -6 - Math.random() * 8, vy: -2 - Math.random() * 4, life: 1.1, r: 1 + Math.random() }); }
    } else {
      // El brazo que golpea el sendero: se alza, cae, polvo y temblor
      const cyc = (m - 2) % 3.6;
      D.slam = m < 2 ? 0 : cyc < 2.2 ? -0.15 * sm(cyc / 2.2) : cyc < 2.5 ? sm((cyc - 2.2) / 0.3) : 1 - sm((cyc - 2.5) / 1.1);
      if (m > 2 && cyc >= 2.48 && !D.slammed) { D.slammed = true; env.shake(1.6, 0.3); for (let i = 0; i < 10; i++) spawnLocal(env, D, { k: "drop", x: hx + 70 + (Math.random() - 0.5) * 16, y: 75, vx: (Math.random() - 0.5) * 40, vy: -16 - Math.random() * 20, g: 100, life: 0.5, c: Math.random() < 0.5 ? "#86592f" : "#cb9e62" }); }
      if (cyc < 2.4) D.slammed = false;
    }
  }
  for (const p of D.parts) {
    if (p.delay > 0) { p.delay -= dt; continue; }
    p.life -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.g) p.vy += p.g * dt;
    if (p.k === "ink" || p.k === "mist") { p.vx *= 1 - dt * 1.2; p.r += dt * (p.k === "ink" ? 3 : 1.5); }
  }
  D.parts = D.parts.filter((p) => p.life > 0);
  if (!phase && D.dim < 0.01 && D.mist < 0.02 && !D.parts.length) a.deep = null;
}

// Sale: estallido de agua, destello, lluvia de gotas y, con el kraken, los brazos.
function surface(D, actor, env, bx) {
  const hx = D.hx, t = env.t;
  D.surfaceT = t; D.flash = 1;
  env.splash(hx, 72, 34, "#d6efff"); env.splash(local(D, hx + 8), 70, 18, "#bff2f8");
  env.shake(3, 0.6);
  for (let i = 0; i < 46; i++) spawnLocal(env, D, { k: "drop", x: hx + (Math.random() - 0.5) * 70, y: -30 + Math.random() * 40, vx: (Math.random() - 0.5) * 12, vy: 10 + Math.random() * 30, g: 140, life: 1.1 + Math.random() * 0.5, c: Math.random() < 0.5 ? "#d6efff" : "#bff2f8" });
  for (let i = 0; i < 18; i++) spawnLocal(env, D, { k: "drop", x: hx + (Math.random() - 0.5) * 14, y: 72, vx: (Math.random() - 0.5) * 50, vy: -70 - Math.random() * 60, g: 150, life: 1.1, c: "#e6f6fb" });
  if (D.creature !== "kraken") return;
  const [cl, cr] = D.cracks;
  // La farola mas cercana (ni encima de la poza ni lejisimos) se lleva un brazo
  const lamps = (env.layout?.lamps || []).map((x) => local(D, x)).filter((x) => Math.abs(x - hx) > 30 && Math.abs(x - hx) < 120 && Math.abs(x - bx) > 18);
  lamps.sort((p, q) => Math.abs(p - hx) - Math.abs(q - hx));
  D.lamp = lamps.length ? lamps[0] : null;
  D.tents = [
    { x: hx - 13, len: 42, r0: 4.4, amp: 0.2, w: 2.1, ph: 0, lean: -0.55, role: "grab", dz: 6 },
    { x: hx - 21, len: 32, r0: 3.8, amp: 0.25, w: 1.8, ph: 2.2, lean: -0.75, role: "pat", front: true, dz: 8 },
    { x: hx + 17, len: 50, r0: 4.8, amp: 0.28, w: 1.5, ph: 1.3, lean: 0.12, dz: -6 },
    { x: hx + 26, len: 38, r0: 4.2, amp: 0.34, w: 2.4, ph: 2.6, lean: 0.5, role: "wave", dz: 2 },
    { x: hx + 4, len: 30, r0: 3.8, amp: 0.3, w: 2.2, ph: 0.4, lean: -0.2, dz: -10 },
    { x: cr.x, len: 34, r0: 4, amp: 0.4, w: 2, ph: 0.7, lean: 0.35, dz: 0 },
    { x: cl.x, len: 32, r0: 3.8, amp: 0.32, w: 2.3, ph: 2, lean: 0.25, dz: 0 },
    { x: hx + 62, len: 46, r0: 4.4, amp: 0.15, w: 1.4, ph: 1.1, lean: 0.1, role: "slam", dz: 0 }
  ];
  if (D.lamp != null) D.tents.push({ x: D.lamp + 7, len: 34, r0: 3.4, role: "lamp", dz: 0 });
  for (const T of D.tents) if (T.role !== "pat" && T.role !== "grab" && T.x !== hx + 16 && T.x !== hx + 24 && T.x !== hx + 4) { env.splash(local(D, T.x), 73, 8, "#cb9e62"); D.cracks.push({ x: T.x, open: 1, small: true }); }
}

// Pose de Buddy: mira al agua, se sobresalta al salir, se agacha con el rugido,
// aguanta la caña, planta los pies o saluda.
export function deepPose(actor, a, t) {
  const D = a.deep;
  if (!D || !live(actor)) return null;
  const respT = t - D.respAt, m = t - D.surfaceT;
  if (D.phase === "omen") return { pose: "ready", lookX: 1, lookY: 1, handsBusy: true };
  if (D.phase === "retreat") return { pose: "ready", handsBusy: true };
  if (m < 0.35) return { pose: "jump", hop: Math.sin(m / 0.35 * Math.PI) * 4, expr: "surprised", handsBusy: true };
  if (D.creature === "leviathan" && m > 1.5 && m < 3) return { pose: "crouch", expr: "surprised", lookY: -1, handsBusy: true };
  if (D.resp === "steady" && respT < 2.8) return { pose: "land", handsBusy: true };
  if (D.resp === "signal" && respT < 1.9) return { pose: "wave", frame: Math.floor(t * 6) % 2, expr: "happy", handsBusy: true };
  return { pose: "reel", frame: Math.floor(t * 12) % 2, lookY: -1, handsBusy: true };
}

// ---- el leviatan ----
function bezier(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
}
const HS = 1.35; // escala de la cabeza
const JOINT = [7 * HS, 3 * HS];
function leviathanPose(D, bx, t) {
  const m = t - D.surfaceT, respT = t - D.respAt, hx = D.hx;
  let cx = hx - 9 + Math.sin(t * 0.8) * 2.5, cy = 15 + Math.sin(t * 1.2) * 1.5, ang = 0.05 + Math.sin(t * 0.7) * 0.04;
  let jaw = (Math.sin(t * 1.3) * 0.5 + 0.5) * 0.08;
  const roar = D.phase === "monster" ? sm((m - 1.5) / 0.35) * (1 - sm((m - 2.95) / 0.45)) : 0;
  cy -= 30 * roar; cx += 4 * roar; ang += 0.5 * roar; jaw += 0.62 * roar;
  if (D.phase === "monster" && D.resp === "steady") { const k = sm(respT / 1.1) * (1 - sm((respT - 2.6) / 0.9)); cx += (bx + 14 - cx) * k * 0.8; cy += (34 - cy) * k; ang -= 0.4 * k; jaw *= 1 - k; }
  if (D.phase === "monster" && D.resp === "signal") { const k = sm(respT / 0.4) * (1 - sm((respT - 2) / 0.6)); ang += Math.sin(respT * 7) * 0.12 * k; cy -= 4 * k; }
  if (D.phase === "retreat") { const e = t - D.since; ang -= 1.2 * sm(e / 0.7); }
  return { cx, cy, ang, jaw, roar };
}
function drawLeviathan(S, D, bx, t) {
  const hx = D.hx, pose = leviathanPose(D, bx, t);
  const c = Math.cos(pose.ang), s = Math.sin(pose.ang);
  const hp = (x, y) => [pose.cx + x * c - y * s, pose.cy + x * s + y * c];
  // El cuello: de la poza a la nuca, en S; sale hasta donde llega `rise`.
  const J = hp(...JOINT), B = [hx + 4, 86], C1 = [hx + 28, 58], C2 = [J[0] + 24, J[1] + 26];
  const N = 52, upto = Math.max(2, Math.round(N * D.rise)), pts = [], sides = [];
  for (let i = 0; i <= upto; i++) {
    const u = i / N, p = bezier(B, C1, C2, J, u), q = bezier(B, C1, C2, J, Math.min(1, u + 0.02));
    const tx = q[0] - p[0], ty = q[1] - p[1], l = Math.hypot(tx, ty) || 1;
    pts.push([p[0], p[1], 9 - 3.6 * u]); sides.push([ty / l, -tx / l]);
  }
  // Mientras sale, la cabeza va en la punta y mira hacia donde sube el cuello
  const tip = pts[pts.length - 1], tside = sides[sides.length - 1];
  let headAt = [pose.cx, pose.cy], ang = pose.ang;
  if (D.rise < 0.999) {
    const k = sm((D.rise - 0.55) / 0.45), tangAng = Math.atan2(-tside[0], tside[1]);
    ang = lerpAng(tangAng, pose.ang, k);
    const cc = Math.cos(ang), ss = Math.sin(ang);
    headAt = [tip[0] - (JOINT[0] * cc - JOINT[1] * ss), tip[1] - (JOINT[0] * ss + JOINT[1] * cc)];
  }
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const H = (x, y) => { x *= HS; y *= HS; return [headAt[0] + x * ca - y * sa, headAt[1] + x * sa + y * ca]; };
  // Vela de espinas por el lomo (detras del cuerpo), con membrana
  const spines = [];
  for (let u = 0.08; u < Math.min(0.9, D.rise - 0.04); u += 0.06) {
    const i = Math.round(u * N), p = pts[i], sd = sides[i], q = pts[Math.max(0, i - 2)];
    const tx = p[0] - q[0], ty = p[1] - q[1], tl = Math.hypot(tx, ty) || 1;
    let dx = -sd[0] * 0.85 - (tx / tl) * 0.55, dy = -sd[1] * 0.85 - (ty / tl) * 0.55; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
    const base = [p[0] - sd[0] * (p[2] - 1.5), p[1] - sd[1] * (p[2] - 1.5)], len = 8.5 - 5 * u + Math.sin(t * 3 + u * 9) * 0.6;
    spines.push({ base, tip: [base[0] + dx * len, base[1] + dy * len] });
  }
  for (let i = 1; i < spines.length; i++) {
    const A = spines[i - 1], Bs = spines[i];
    S.tri(A.base, A.tip, Bs.tip, 0.5, [0.2, -0.3, 0.93], 2, 2, i * 0.13);
    S.tri(A.base, Bs.tip, Bs.base, 0.5, [0.2, -0.3, 0.93], 2, 2, i * 0.13);
  }
  for (const sp of spines) S.tube([[sp.base[0], sp.base[1], 1.3, 1], [(sp.base[0] + sp.tip[0]) / 2, (sp.base[1] + sp.tip[1]) / 2, 0.9, 1], [sp.tip[0], sp.tip[1], 0.5, 1]], 3, 3);
  S.tube(pts, 1, 1, sides);
  // Agallas justo detras de la mandibula
  D.gills = D.rise > 0.95 ? [0, 1, 2].map((k) => H(9 + k * 2.2, 2 + k * 0.6)) : [];
  // Manchas que brillan, en fila por el costado
  D.spots = [];
  for (let u = 0.1; u < D.rise - 0.05; u += 0.045) { const i = Math.round(u * N), p = pts[i], sd = sides[i]; D.spots.push([Math.round(p[0] - sd[0] * p[2] * 0.3 + 1), Math.round(p[1] - sd[1] * p[2] * 0.3 - 1), u]); }
  if (D.rise < 0.12) return;
  // La cabeza: gola, cuernos, craneo, ceja, hocico, mejilla, mandibula y boca
  const frill = [[5, -5, 12, -13], [7, -3, 16, -9], [8, 0, 17, -3], [7, 3, 15, 4]];
  for (let i = 1; i < frill.length; i++) {
    const [ax, ay, atx, aty] = frill[i - 1], [bx2, by2, btx, bty] = frill[i];
    S.tri(H(ax, ay), H(atx, aty), H(btx, bty), 1, [0.3, -0.2, 0.93], 2, 4, i * 0.2);
    S.tri(H(ax, ay), H(btx, bty), H(bx2, by2), 1, [0.3, -0.2, 0.93], 2, 4, i * 0.2);
  }
  for (const [x0, y0, x1, y1] of frill) { const a0 = H(x0, y0), a1 = H(x1, y1); S.tube([[a0[0], a0[1], 1.2, 2], [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, 0.9, 2], [a1[0], a1[1], 0.5, 2]], 3, 5); }
  const horn = (ox, oy, dz) => { const h = [[1, -5.5, 2.2], [4, -9, 1.7], [8, -12, 1.2], [12, -13.5, 0.7]]; S.tube(h.map(([x, y, r]) => { const q = H(x + ox, y + oy); return [q[0], q[1], r * HS, dz + 3]; }), 3, 6); };
  horn(1.5, -0.5, -3); horn(0, 0, 2);
  const lower = (x, y) => { const jx = x, jy = y, jc = Math.cos(-pose.jaw), js = Math.sin(-pose.jaw), px0 = 0, py0 = 4.5; return H(px0 + (jx - px0) * jc - (jy - py0) * js, py0 + (jx - px0) * js + (jy - py0) * jc); };
  const mouthC = H(-8, 5.5);
  const E = (cx, cy, rx, ry, rz, rot, m, uu, dz, p) => S.ellipsoid(cx, cy, rx * HS, ry * HS, rz * HS, rot, m, uu, dz * HS, p);
  E(mouthC[0], mouthC[1], 9, 2.5 + pose.jaw * 7, 2, ang, 4, 0, -1, 7);
  const lj = lower(-9, 6.6);
  E(lj[0], lj[1], 9.2, 2.7, 4.6, ang - pose.jaw, 1, 0.5, 0, 8);
  const sk = H(1, 0); E(sk[0], sk[1], 9.5, 6.8, 7.4, ang, 1, 0.6, 0, 9);
  const ck = H(3, 4); E(ck[0], ck[1], 6, 4, 5.5, ang, 1, 0.65, 0.5, 9);
  const sn = H(-11, 1.4); E(sn[0], sn[1], 10.5, 4.2, 5.6, ang, 1, 0.55, 0.3, 10);
  const br = H(-4, -4.2); E(br[0], br[1], 6, 2.2, 5, ang - 0.15, 5, 0, 2.6, 11);
  const ey = H(-5, -1.4); S.sphere(ey[0], ey[1], 2.4 * HS, 5, 0, 4.6 * HS, 12);
  // Detalles para despues de pintar (dientes, orificio, bigotes, ojo)
  const open = pose.jaw;
  D.mouth = {
    open, nostril: H(-19.5, -0.8), eye: ey, ang,
    upper: open > 0.12 ? [-18, -15.5, -13, -10.5, -8, -5.5].map((x) => H(x, 4.6)) : [],
    lower: open > 0.12 ? [-17, -14.5, -12, -9.5, -7].map((x) => lower(x, 4.4)) : [],
    whiskers: [0, 1].map((k) => Array.from({ length: 7 }, (_, j) => H(-17.5 + k * 2 + j * 1.6, 3.5 + k * 0.4 + j * 1.5 + Math.sin(t * 2.2 + j * 0.7 + k) * j * 0.25)))
  };
  D.headTop = Math.min(H(12, -14)[1], H(-4, -7)[1]);
  D.lineTo = H(-15, 4.5);
}
// Los dos lazos del cuerpo y la cola, al otro lado de la poza
function drawCoils(S, D, t) {
  if (D.coils <= 0) return;
  const hx = D.hx;
  D.coilBases = [];
  [[hx + 40, 12, 5.6], [hx + 70, 10, 4.6]].forEach(([cx, R, r], k) => {
    const h = D.coils * (0.72 + 0.28 * Math.sin(t * 0.9 + k * 2.1));
    const pts = [], sides = [];
    for (let i = 0; i <= 26; i++) {
      const th = Math.PI - (i / 26) * Math.PI, x = cx + R * Math.cos(th), y = 80 - R * 1.25 * Math.sin(th) * h;
      pts.push([x, y, r * (0.85 + 0.15 * Math.sin(th))]); const sx = cx - x, sy = 80 - y, sl = Math.hypot(sx, sy) || 1; sides.push([sx / sl, sy / sl]);
    }
    // Espinas pequeñas por arriba
    for (let i = 6; i <= 20; i += 3) { const p = pts[i], sd = sides[i]; const b0 = [p[0] - sd[0] * (p[2] - 1), p[1] - sd[1] * (p[2] - 1)], l = 4 - Math.abs(i - 13) * 0.25; S.tube([[b0[0], b0[1], 1, 0], [b0[0] - sd[0] * l, b0[1] - sd[1] * l - 0.5, 0.5, 0]], 3, 20 + k); }
    S.tube(pts.map((p) => [p[0], p[1], p[2], -2]), 1, 22 + k, sides);
    D.coilBases.push(cx - R, cx + R);
  });
  // La cola: una aleta en abanico que se alza y golpea
  if (D.tail > 0.05) {
    const tx = hx + 96, base = 80 - 16 * D.tail, lean = (1 - D.tail) * 0.9;
    const tip = (x, y) => [tx + x * Math.cos(lean) - y * Math.sin(lean), base + x * Math.sin(lean) + y * Math.cos(lean)];
    S.tube([[tx - 2, 82, 3.2, 0], [tx - 1, (82 + base) / 2, 2.6, 0], [...tip(0, 0), 2, 0]], 1, 30);
    const l = tip(-8, -9), r2 = tip(8, -8), mid = tip(0, -4);
    S.tri(tip(0, 0), l, mid, 1, [0.2, -0.4, 0.9], 2, 31, 0.4); S.tri(tip(0, 0), mid, r2, 1, [0.2, -0.4, 0.9], 2, 31, 0.7);
    D.coilBases.push(tx - 3);
  }
}

// ---- el kraken ----
function tentPts(D, T, t, targets) {
  const respT = t - D.respAt, rise = D.rise;
  const pts = [], sides = [], n = Math.max(2, Math.round(T.len * rise / 2));
  if (T.role === "lamp") {
    // Sube por el poste dando vueltas y se enrosca bajo el farol
    for (let i = 0; i < n; i++) {
      const k = i / (T.len / 2), y = 79 - i * 1.4, wob = i * 0.75 + t * 1.2, around = T.x - 7 + Math.sin(wob) * 3.6;
      if (y < LAMP_TOP + 9) break;
      pts.push([i < 4 ? T.x + (around - T.x) * (i / 4) : around, y, 3 - 2.2 * k, Math.cos(wob) * 3.2 * Math.min(1, i / 4)]);
      sides.push([-Math.sin(wob), 0]);
    }
    return { pts, sides };
  }
  let x = T.x, y = 79, a = -Math.PI / 2 + (T.role === "slam" ? D.slam * 1.45 : 0), target = null;
  if (T.role === "grab" && D.resp !== "steady" && targets.rod) target = [targets.rod[0] + 2, targets.rod[1] + 5];
  if (T.role === "pat" && targets.head) target = D.resp === "steady" && respT < 3.2 ? [targets.head[0], targets.head[1] - 5 + Math.round(Math.sin(t * 8))] : [targets.head[0] + 8, targets.head[1] - 12 + Math.sin(t * 1.7) * 3];
  const curl = T.role === "grab" || T.role === "pat" ? 0 : 1;
  for (let i = 0; i < n; i++) {
    const u = i / (T.len / 2);
    let amp = T.amp, w = T.w;
    if (T.role === "wave" && D.resp === "signal" && respT < 2.6) { amp = 0.95; w = 7; }
    a += T.lean * 0.07 * (u > 0.5 ? 1.6 : 1) + Math.sin(t * w - u * 5 + T.ph) * amp * 0.22;
    if (u > 0.68 && curl) a += Math.sign(T.lean || 1) * (u - 0.68) * 1.6;
    if (target && i > 2) { const ta = Math.atan2(target[1] - y, target[0] - x); let d = ta - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; a += d * 0.32; }
    x += Math.cos(a) * 2; y += Math.sin(a) * 2;
    const side = Math.sign(T.lean || 1);
    pts.push([x, y, Math.max(0.7, T.r0 * Math.pow(1 - u, 0.85) + 0.5), T.dz]);
    sides.push([-Math.sin(a) * side, Math.cos(a) * side]);
  }
  return { pts, sides };
}
function drawKraken(S, D, bx, t, targets, front) {
  const hx = D.hx, rise = D.rise, bob = Math.sin(t * 1.1) * 1.2 * rise;
  D.tentLines = D.tentLines || {};
  let partId = 40;
  for (const T of D.tents) {
    partId++;
    if (Boolean(T.front) !== front) continue;
    const { pts, sides } = tentPts(D, T, t, targets);
    if (pts.length < 2) continue;
    S.tube(pts, 7, partId, sides);
    T.tip = pts[pts.length - 1]; T.pts = pts; T.sides = sides; T.part = partId;
  }
  if (front) return;
  if (D.lamp != null && rise > 0.2) S.tube([[D.lamp, 72, 1.5, -1], [D.lamp, 64, 1.5, -1], [D.lamp, LAMP_TOP + 10, 1.5, -1]], 8, 60);
  // El manto, la cabeza con los ojos y el sifon
  const my = 77 - 27 * rise + bob;
  // manto (bulboso, echado hacia atras), cabeza mas ancha abajo, ceja sobre el ojo
  S.ellipsoid(hx + 8, my, 16, 20, 14, 0.3, 6, 0, -2, 70);
  S.ellipsoid(hx + 1, 77 - 10 * rise + bob, 15, 10, 13, 0.06, 6, 0.4, 1, 71);
  const eye = [hx - 9, 77 - 13 * rise + bob];
  S.sphere(eye[0], eye[1], 7, 9, 0, 9.5, 72);
  S.ellipsoid(eye[0] + 1, eye[1] - 6, 7, 2.4, 6, -0.12, 6, 0, 11, 75);
  S.sphere(hx + 11, 77 - 13.5 * rise + bob, 4.2, 9, 0, 5, 73);
  S.tube([[hx + 13, 77 - 7 * rise + bob, 2.4, 3], [hx + 17, 77 - 8.5 * rise + bob, 2, 3], [hx + 20, 77 - 9 * rise + bob, 1.8, 3]], 6, 74);
  D.eye = rise > 0.45 ? eye : null; D.farEye = rise > 0.45 ? [hx + 10, 77 - 13 * rise + bob] : null;
  // Manchas que brillan alrededor del manto
  D.glowSpots = [];
  for (let k = 0; k < 9; k++) { const th = -1.2 + k * 0.3; D.glowSpots.push([Math.round(hx + 7 + Math.cos(th) * 11), Math.round(my + Math.sin(th) * 13), k / 9]); }
  const grab = D.tents.find((T) => T.role === "grab");
  D.lineTo = grab?.tip ? [grab.tip[0], grab.tip[1]] : null;
}
// Ventosas: anillos claros con el centro oscuro por la cara de dentro
function drawSuckers(S, g, D, front, tint) {
  D.glow = D.glow || [];
  if (!front) D.glow = [];
  const ring = tinted("#ffd6e6", tint), mid = tinted("#c4688e", tint), dot = tinted("#5a1a3a", tint);
  for (const T of D.tents) {
    if (Boolean(T.front) !== front || !T.pts) continue;
    for (let i = 2; i < T.pts.length - 1; i += 2) {
      const [x, y, r] = T.pts[i], sd = T.sides[i], sx = x + sd[0] * (r - 0.4), sy = y + sd[1] * (r - 0.4);
      if (S.partAt(sx, sy) !== T.part || sy >= WATER) continue;
      const X = Math.floor(sx) - S.ox, Y = Math.floor(sy) - S.oy;
      if (r > 2.2) { g.fillStyle = ring; g.fillRect(X, Y, 2, 2); g.fillStyle = dot; g.fillRect(X, Y, 1, 1); }
      else { g.fillStyle = i % 4 ? mid : ring; g.fillRect(X, Y, 1, 1); }
      if (i % 6 === 0) D.glow.push([Math.floor(sx), Math.floor(sy), i / T.pts.length]);
    }
  }
}

// ---- pintar ----
let sculptBack = null, sculptFront = null;
const tinted = (hex, tint) => { const c = rgb(hex); return `rgb(${Math.round(c[0] * tint[0])},${Math.round(c[1] * tint[1])},${Math.round(c[2] * tint[2])})`; };
function creatureTint(env) {
  const L = env.light || { tint: [1, 1, 1], desat: 0 };
  return { tint: L.tint.map((v) => v + (1 - v) * 0.45), desat: (L.desat || 0) * 0.5 };
}
function mirrored(g, D, draw) {
  g.save();
  if (D.dir < 0) { g.translate(2 * D.hx + 1, 0); g.scale(-1, 1); }
  draw();
  g.restore();
}

// En el suelo (capa de fondo, iluminada): poza ensanchada, sombra que ronda,
// ondas, bultos y grietas, y las pozas de los lazos.
export function deepDrawGround(g, actor, a, env) {
  const D = a.deep;
  if (!D || !D.phase) return;
  const { t } = env, hx = Math.round(D.hx);
  mirrored(g, D, () => {
    if (D.phase === "omen" && D.pool > 0.25) {
      // Una silueta larga que culebrea bajo el agua de la poza
      g.save(); g.beginPath(); g.ellipse(hx, 75.5, 15 * (1 + 0.7 * D.pool), 3 * (1 + 0.5 * D.pool), 0, 0, Math.PI * 2); g.clip();
      for (let k = 0; k < 26; k++) { const x = hx - 30 + k * 2 + Math.sin(t * 1.6) * 10, y = 76 + Math.sin(k * 0.45 + t * 3) * 1.2; rect(g, Math.round(x), Math.round(y), 2, 1 + (k > 6 && k < 20 ? 1 : 0), "#06222a"); }
      g.restore();
    }
    if (D.phase === "omen") for (let k = 0; k < 2; k++) {
      const e = (t * 0.6 + k * 0.5) % 1, rr = Math.round(16 + e * 46);
      g.globalAlpha = 0.45 * (1 - e);
      for (const sx of [-1, 1]) { px(g, hx + sx * rr, 75, "#bff2f8"); px(g, hx + sx * (rr - 1), 74, "#bff2f8"); px(g, hx + sx * (rr - 1), 76, "#bff2f8"); }
      g.globalAlpha = 1;
    }
    if (D.phase === "omen") for (const B of D.bumps) {
      if (t < B.at || t > B.at + B.life) continue;
      const k = Math.min(1, (t - B.at) / 0.3, (B.at + B.life - t) / 0.4), bxx = Math.round(B.x);
      ellipseRows(g, bxx, 75, Math.round(5 * k), 1, P.dirt[1]); rect(g, bxx - Math.round(4 * k), 74, Math.round(8 * k), 1, P.dirt[3]);
    }
    for (const c of D.cracks) {
      if (c.open <= 0) continue;
      const rx = Math.max(1, Math.round((c.small ? 3.5 : 5) * c.open));
      ellipseRows(g, Math.round(c.x), 76, rx + 1, 2, P.dirt[0]); ellipseRows(g, Math.round(c.x), 76, rx, 1, "#130a10");
      if (!c.small) { px(g, Math.round(c.x) - rx - 3, 75, "#3a2414"); px(g, Math.round(c.x) + rx + 2, 77, "#3a2414"); }
    }
    if (D.creature === "leviathan" && D.coils > 0.05) for (const x of D.coilBases || []) {
      ellipseRows(g, Math.round(x), 76, 7, 2, P.dirt[0]); ellipseRows(g, Math.round(x), 76, 6, 1, "#164c59"); rect(g, Math.round(x) - 4, 75, 8, 1, "#0b2a33");
    }
  });
}

// Detras de Buddy, por encima del fondo y de las farolas: la criatura.
export function deepDrawBackdrop(g, actor, a, env) {
  const D = a.deep;
  if (!D || !D.phase || D.rise <= 0) { if (D) D.lineTo = null; return; }
  const { t } = env, bx = local(D, actor.x), { tint, desat } = creatureTint(env);
  sculptBack ??= createSculpt(BUF.w, BUF.h);
  const S = sculptBack;
  S.reset(D.hx + BUF.x, BUF.y);
  const flash = D.creature === "kraken" && D.resp === "signal" && t - D.respAt < 3 ? t - D.respAt : 0;
  const targets = {
    rod: a.fishing?.rodTip ? [local(D, a.fishing.rodTip[0]), a.fishing.rodTip[1]] : null,
    head: D.head ? [local(D, D.head[0]), D.head[1]] : null
  };
  if (D.creature === "leviathan") { drawCoils(S, D, t); drawLeviathan(S, D, bx, t); }
  else drawKraken(S, D, bx, t, targets, false);
  const cv = S.render(flash ? MATS(flash) : MATS_PLAIN, { cut: WATER, tint, desat });
  const cg = S.ctx;
  if (D.creature === "leviathan" && D.mouth) leviathanDetails(cg, S, D, t, tint);
  if (D.creature === "kraken") { drawSuckers(S, cg, D, false, tint); krakenEye(cg, S, D, bx, t, tint, targets); }
  mirrored(g, D, () => g.drawImage(cv, S.ox, S.oy));
  if (D.lineTo) D.lineTo = [local(D, D.lineTo[0]), D.lineTo[1]];
}
function leviathanDetails(cg, S, D, t, tint) {
  const M = D.mouth, put = (p, c, w = 1, h = 1) => { cg.fillStyle = c; cg.fillRect(Math.floor(p[0]) - S.ox, Math.floor(p[1]) - S.oy, w, h); };
  const tooth = tinted("#f2ecd2", tint), whisk = tinted("#7fd0c8", tint), dark = tinted("#03090e", tint), gill = tinted("#06161e", tint);
  for (const p of M.upper) { put(p, tooth); put([p[0], p[1] + 1], tooth); }
  for (const p of M.lower) { put(p, tooth); put([p[0], p[1] - 1], tooth); }
  put(M.nostril, dark, 2, 1);
  for (const w of M.whiskers) for (let j = 1; j < w.length; j++) put(w[j], whisk);
  for (const p of D.gills || []) { put(p, gill); put([p[0] + 1, p[1] + 1], gill); put([p[0] + 1, p[1] + 2], gill); }
}
function krakenEye(cg, S, D, bx, t, tint, targets) {
  if (!D.eye) return;
  const [ex, ey] = D.eye, X = Math.round(ex) - S.ox, Y = Math.round(ey) - S.oy;
  const respT = t - D.respAt, blink = t < D.blinkUntil || (D.resp === "signal" && respT > 0.3 && respT < 1);
  const calm = D.resp === "steady" && respT < 4;
  const fill = (c, x, y, w, h) => { cg.fillStyle = tinted(c, tint); cg.fillRect(X + x, Y + y, w, h); };
  // ojo: blanco, iris dorado, pupila horizontal que mira a Buddy, parpado
  for (const [y, w] of [[-3, 5], [-2, 9], [-1, 11], [0, 11], [1, 11], [2, 9], [3, 5]]) fill("#f2e6c8", -Math.floor(w / 2), y, w, 1);
  fill("#c8b48a", -5, 2, 11, 1); fill("#d8c8a0", -4, 3, 9, 1);
  const look = targets.head ? Math.max(-1, Math.min(1, (targets.head[0] - ex) / 30)) : -1;
  const ix = Math.round(look * 2);
  for (const [y, w] of [[-3, 3], [-2, 5], [-1, 7], [0, 7], [1, 7], [2, 5], [3, 3]]) fill(y < 0 ? "#e8a02a" : "#c8701a", ix - Math.floor(w / 2), y, w, 1);
  fill("#ffd166", ix - 2, -2, 3, 1); fill("#1a0810", ix - 3, -1, 7, 2); fill("#1a0810", ix - 2, 1, 5, 1);
  fill("#ffffff", ix + 1, -3, 2, 1); fill("#ffffff", ix + 2, -2, 1, 1);
  const lid = blink ? 8 : calm ? 4 : 1;
  for (let r = 0; r < lid; r++) fill(r === lid - 1 ? "#18040f" : "#84286a", -6, -4 + r, 13, 1);
  if (D.farEye) { const fx = Math.round(D.farEye[0]) - S.ox, fy = Math.round(D.farEye[1]) - S.oy; cg.fillStyle = tinted("#1a0810", tint); cg.fillRect(fx - 1, fy, 3, 1); }
}

// Delante de Buddy y por encima de todo: el brazo que le ronda (y le da
// palmaditas), lo que brilla, la bruma, la onda del rugido, el destello y
// las particulas.
export function deepDrawFront(g, actor, a, fr, env) {
  const D = a.deep;
  if (!D) return;
  D.head = env.toWorld(fr, fr.rig.a.head);
}
export function deepDrawOverlay(g, actor, a, fr, env) {
  const D = a.deep;
  if (!D) return;
  const { t } = env, { tint, desat } = creatureTint(env), bx = local(D, actor.x);
  if (D.creature === "kraken" && D.rise > 0 && D.tents.some((T) => T.front)) {
    sculptFront ??= createSculpt(BUF.w, BUF.h);
    const S = sculptFront;
    S.reset(D.hx + BUF.x, BUF.y);
    const targets = { rod: null, head: D.head ? [local(D, D.head[0]), D.head[1]] : null };
    drawKraken(S, D, bx, t, targets, true);
    const cv = S.render(MATS_PLAIN, { cut: WATER, tint, desat });
    drawSuckers(S, S.ctx, D, true, tint);
    mirrored(g, D, () => g.drawImage(cv, S.ox, S.oy));
  }
  mirrored(g, D, () => {
    // Bruma baja sobre el sendero (se repinta a 6 fps; se dibuja cada fotograma)
    if (D.mist > 0.02) {
      const step = Math.floor(t * 6);
      if (mistStep !== step) { mistStep = step; paintMist(t); }
      g.globalAlpha = 0.45 * D.mist;
      g.drawImage(mistCanvas(), Math.round(D.hx) - 170, 60);
      g.globalAlpha = 1;
    }
    if (D.rise > 0 && D.creature === "leviathan") {
      const signal = D.resp === "signal" && t - D.respAt < 2.6, respT = t - D.respAt;
      for (const [x, y, u] of D.spots) {
        const v = signal ? Math.sin(respT * 10 - u * 14) : Math.sin(t * 3 - u * 9);
        if (v < -0.2) continue;
        px(g, x, y, v > 0.6 ? "#e8fff8" : "#7ff0d8");
        if (v > 0.7) { g.globalAlpha = 0.45; px(g, x - 1, y, "#7ff0d8"); px(g, x + 1, y, "#7ff0d8"); px(g, x, y - 1, "#7ff0d8"); g.globalAlpha = 1; }
      }
      const M = D.mouth, blink = t < D.blinkUntil || (signal && respT > 0.3 && respT < 1.1);
      if (M && D.rise > 0.85) {
        const [ex, ey] = M.eye, X = Math.round(ex), Y = Math.round(ey), sleepy = D.resp === "steady" && respT < 3.6;
        if (blink || sleepy) rect(g, X - 1, Y, 3, 1, "#ffd166");
        else { rect(g, X - 1, Y - 1, 3, 2, "#ffd166"); px(g, X, Y - 1, "#2a1a08"); px(g, X, Y, "#2a1a08"); px(g, X - 1, Y - 1, "#fff3b0"); }
        g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.18 + (M.open > 0.3 ? 0.2 : 0);
        g.fillStyle = "#ffcf6a"; g.fillRect(X - 3, Y - 2, 7, 5); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
        // El fondo de la boca brilla un poco al rugir
        if (M.open > 0.25) { g.globalAlpha = 0.5 * M.open; const mc = M.upper[3] || M.nostril; rect(g, Math.round(mc[0]) - 3, Math.round(mc[1]) + 2, 6, 2, "#ff8a5a"); g.globalAlpha = 1; }
      }
      // La onda del rugido
      if (D.wave && t - D.wave.at < 1) {
        const k = (t - D.wave.at) / 1, r = 6 + k * 70, c = M ? M.upper[0] || M.nostril : [D.hx, 20];
        g.globalAlpha = 0.6 * (1 - k);
        for (let i = 0; i < 90; i++) { const th = (i / 90) * Math.PI * 2; px(g, Math.round(c[0] + Math.cos(th) * r), Math.round(c[1] + Math.sin(th) * r * 0.6), "#e8fff8"); }
        g.globalAlpha = 1;
      }
    } else if (D.rise > 0) {
      for (const [x, y, u] of D.glow || []) { const v = Math.sin(t * 4 - u * 7); if (v > 0) px(g, x, y, v > 0.7 ? "#fff0f6" : "#ff9ccc"); }
      for (const [x, y, u] of D.glowSpots || []) { const v = Math.sin(t * 2.4 - u * 6); if (v > 0.1) { px(g, x, y, v > 0.7 ? "#fff0f6" : "#ff7ab8"); if (v > 0.8) { g.globalAlpha = 0.4; px(g, x + 1, y, "#ff7ab8"); px(g, x, y + 1, "#ff7ab8"); g.globalAlpha = 1; } } }
      if (D.eye && D.rise > 0.6) { g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.16; g.fillStyle = "#ffc84a"; g.fillRect(Math.round(D.eye[0]) - 5, Math.round(D.eye[1]) - 4, 10, 8); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; }
    }
    for (const p of D.parts) {
      if (p.delay > 0) continue;
      const x = Math.round(p.x), y = Math.round(p.y);
      if (p.k === "bub") { px(g, x, y, "#bff2f8"); if (p.life < 0.15) { px(g, x - 1, y, "#bff2f8"); px(g, x + 1, y, "#bff2f8"); } }
      else if (p.k === "heart") { g.globalAlpha = Math.min(1, p.life * 1.5); g.drawImage(HEART(), x - 2, y); g.globalAlpha = 1; }
      else if (p.k === "ink") { g.globalAlpha = Math.min(0.85, p.life * 0.7); g.fillStyle = "#1a0618"; const r = Math.round(p.r); for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); for (let dx = -hw; dx <= hw; dx++) if (bayer4(x + dx, y + dy) < 0.75 - (dx * dx + dy * dy) / (r * r + 1) * 0.5) g.fillRect(x + dx, y + dy, 1, 1); } g.globalAlpha = 1; }
      else if (p.k === "mist") { g.globalAlpha = Math.min(0.6, p.life * 0.6); g.fillStyle = "#dff4f0"; const r = Math.round(p.r); g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x - r + 1, y - 1, r * 2 - 1, 1); g.globalAlpha = 1; }
    }
  });
  // El destello al salir
  if (D.flash > 0.01) { g.globalAlpha = 0.32 * D.flash; rect(g, 0, -20, env.layout ? env.layout.X(100) + 2 : 2000, 100, "#e8fff8"); g.globalAlpha = 1; }
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const MIST_W = 360, MIST_H = 20;
const mistCanvas = lazy(() => makeCanvas(MIST_W, MIST_H)[0]);
let mistStep = -1;
function paintMist(t) {
  const c = mistCanvas(), g = c.getContext("2d"), drift = Math.round(t * 6);
  g.clearRect(0, 0, MIST_W, MIST_H);
  g.fillStyle = "#d8f4f0";
  for (let x = 0; x < MIST_W; x++) {
    const col = (0.5 + 0.5 * Math.sin(x * 0.045 + t * 0.5)) * Math.min(1, x / 90, (MIST_W - 1 - x) / 90);
    for (let y = 0; y < MIST_H; y++) { const k = (1 - Math.abs(y - 13) / 13) * col; if (bayer4(x + drift, y) < k * 0.34) g.fillRect(x, y, 1, 1); }
  }
}
const bayer4 = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

// Luz: verde azulado profundo, farolas que parpadean y luego se encienden (o
// tiemblan con el brazo enroscado), cielo oscurecido, viento quieto o rafaga,
// y las luces de la criatura.
export function deepLight(actor, a, env) {
  const D = a.deep;
  if (!D || D.dim <= 0.005) return null;
  const lights = [], at = (x) => local(D, x), t = env.t;
  if (D.rise > 0) {
    if (D.creature === "leviathan") {
      for (let i = 0; i < D.spots.length; i += 4) lights.push({ x: at(D.spots[i][0]), y: D.spots[i][1], r: 16, c: [0.45, 1, 0.9], s: 0.32 * D.rise });
      if (D.mouth) lights.push({ x: at(D.mouth.eye[0]), y: D.mouth.eye[1], r: 14, c: [1, 0.85, 0.5], s: 0.3 * D.rise });
    } else {
      if (D.eye) lights.push({ x: at(D.eye[0]), y: D.eye[1], r: 18, c: [1, 0.8, 0.5], s: 0.34 * D.rise });
      for (let i = 0; i < (D.glow || []).length; i += 3) lights.push({ x: at(D.glow[i][0]), y: D.glow[i][1], r: 11, c: [1, 0.55, 0.8], s: 0.26 * D.rise });
    }
  }
  const flicker = (Math.floor(t * 9) * 7919 % 13) / 13;
  const lamps = D.phase === "omen" ? (flicker > 0.45 ? Math.min(1, D.dim * 1.6) : 0.1) : D.lamp != null && D.rise > 0.5 ? (flicker > 0.3 ? 1 : 0.25) : Math.min(1, D.dim * 1.4);
  return { dim: D.dim, dark: DEEP_TINT, desat: 0.3 * D.dim, lamps, sky: { c: "#06202c", a: D.dim * 0.72 }, wind: D.wind, lights };
}

// Lo mas alto sobre Buddy: con el leviatan bajando la cabeza, su cabeza.
export function deepTop(actor, a) {
  const D = a.deep;
  if (!D || D.creature !== "leviathan" || D.rise <= 0 || D.resp !== "steady" || D.headTop == null || !D.mouth) return null;
  return Math.abs(local(D, D.mouth.eye[0]) - actor.x) < 26 ? D.headTop : null;
}
