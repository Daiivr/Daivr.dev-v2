import { blit, gridSprite, halo, lazy, mix, outlinedSprite, px, rect, flipped } from "../core.js";
import { FEET } from "../layout.js";

// La caza de bugs (useBuddyEncounters) en pixel art: el bug entra correteando,
// Pip saca el martillo, la red o la pistola (la pesada con la llave inglesa),
// el primer intento falla (el bug esquiva el martillo, salta la red o se agacha
// ante el rayo) y el segundo acierta: aplastado, cazado o frito, y el bug se
// deshace en pixeles. Las fases las marca el hook: stalk 0,9 s, ready 0,9 s,
// attack 1,5 s y hit 1,4 s.
const ENEMY_COLORS = { "null-beetle": "#ff5f68", "stack-roach": "#ff3d9d", "memory-mite": "#a78bfa" };
const BUG_ROWS = {
  "null-beetle": ["..........aa..", "...........a..", "....SSSS..HH..", "..SSsssSSHHHH.", ".SsLLssskSHHeH", ".SsLssskssSHHH", ".SssskssssSHH.", "..SSSSSSSSS..."],
  "stack-roach": [".........aaaa.", "..........a...", "...SSSSSSS.HH.", "..SsTsTsTsSHHe", ".SsLTsTsTssHHH", ".SsTsTsTssSHH.", "..SSSSSSSSS...", ".............."],
  "memory-mite": ["...a......a...", "....a....a....", "....SSSSSS....", "...SsLssssSHH.", "..SsLsYYssSHHe", "..SssYYYssSHHH", "...SssssssSHH.", "....SSSSSS...."]
};
const BUG_LEGS = [["..l..l...l....", ".l..l...l....."], ["...l..l..l....", "...l..l...l..."], ["..l...l..l....", "..l...l...l..."]];
const bugCache = new Map();
function bugImg(id, frame, mode) {
  const key = id + frame + (mode || "");
  let img = bugCache.get(key);
  if (img) return img;
  const color = ENEMY_COLORS[id] || ENEMY_COLORS["null-beetle"];
  const pal = { a: mix(color, "#1a0a14", 0.7), S: mix(color, "#1a0a14", 0.55), s: color, L: mix(color, "#ffffff", 0.5), k: "#1a0a14", T: "#7e174c", Y: "#ffd166", H: "#2a1020", e: "#ffffff", l: "#2a1020" };
  if (mode === "flash") for (const k of Object.keys(pal)) pal[k] = k === "l" ? "#ffffff" : mix(pal[k], "#ffffff", 0.8);
  let rows = (BUG_ROWS[id] || BUG_ROWS["null-beetle"]).concat(BUG_LEGS[frame % 3]);
  if (mode === "squash") rows = [rows[3].replace(/H/g, "S"), rows[5], "SSSSSSSSSSSSSS", "l.l.l.l.l.l.l."];
  img = outlinedSprite(rows, pal, "#071b1c");
  bugCache.set(key, img);
  return img;
}
function bugPixels(img) {
  const d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data, out = [];
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) { const i = (y * img.width + x) * 4; if (d[i + 3]) out.push([x, y, "#" + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("")]); }
  return out;
}

const W_PAL = { M: "#8a98a6", h: "#e0e8ee", D: "#4a5662", w: "#b8844a", W: "#7a5a2a", r: "#b8f7ff", m: "#246c78", B: "#448ba3", L: "#9edbd6", p: "#ed79ae", u: "#d0f5df", G: "#485563" };
const ART = lazy(() => ({
  hammer: {
    diag: outlinedSprite(["......MMM.", ".....MhhMM", "....MhhMMD", "....MMMDD.", "....wD....", "...w......", "..W.......", ".w........", "w........."], W_PAL, "#1a2026"),
    flat: outlinedSprite(["........MMM", "........MhD", "wwWwwwWwMhD", "........MhD", "........MMM"], W_PAL, "#1a2026")
  },
  net: {
    diag: outlinedSprite(["....rrrr.", "...rm.m.r", "...r.m.mr", "...rm.m.r", "....rrrr.", "...w.....", "..W......", ".w.......", "w........"], W_PAL, "#123a40"),
    flat: outlinedSprite([".......rrrr", "......rm.mr", "wwWwwwr.m.r", "......rm.mr", ".......rrrr"], W_PAL, "#123a40")
  },
  gun: outlinedSprite(["..LLL.....", "BBBBBBBBBu", "BpppBBBBB.", "BBBBBBBBBu", ".GG.......", ".GG......."], W_PAL, "#172d39"),
  heavy: outlinedSprite(["..LLLL......", "BBBBBBBBBBBu", "BppppBBBBBBu", "BBBBBBBBBBBu", "BBBBBBBBBB..", ".GG.........", ".GG........."], W_PAL, "#172d39"),
  flash: gridSprite(["..y..", ".yWy.", "yWWWy", ".yWy.", "..y.."], { y: "#ffd166", W: "#fffbe6" }),
  alert: outlinedSprite(["W", "W", "W", ".", "W"], { W: "#ffffff" }, "#3a1a0a")
}));
const GRIP = { hammer: { diag: [1, 9], flat: [1, 3] }, net: { diag: [1, 9], flat: [1, 3] } };
const UP_HEADS = { hammer: [".MMMMMMM.", "MhhhhhhhM", "MMMMMMMMM", ".DDDDDDD."], net: [".rrrrr.", "rm.m.mr", "r.m.m.r", "rm.m.mr", "r.m.m.r", ".rrrrr."] };
const longCache = new Map();
// Martillo o red en alto: mango largo segun la altura de la cabeza, inclinado
// hacia atras para que la cabeza del arma asome detras del craneo de Pip.
function longUp(weapon, n) {
  const k = weapon + n;
  let c = longCache.get(k);
  if (!c) {
    const head = UP_HEADS[weapon], mid = (head[0].length - 1) / 2, lean = Math.round(n / 4), rows = head.map((r) => r + ".".repeat(lean));
    for (let i = 0; i < n; i++) { const o = mid + Math.round(i * lean / (n - 1)); rows.push(".".repeat(o) + (i % 5 === 3 ? "W" : "w") + ".".repeat(head[0].length + lean - o - 1)); }
    c = { img: outlinedSprite(rows, W_PAL, weapon === "hammer" ? "#1a2026" : "#123a40"), gx: mid + lean + 1, gy: head.length + n - 1, head: head.length, lean };
    longCache.set(k, c);
  }
  return c;
}
const flipCache = new Map();
const mirrored = (img) => { let c = flipCache.get(img); if (!c) { c = flipped(img); flipCache.set(img, c); } return c; };
// Sprite con el asa en la mano (hx, hy), espejado si Pip mira a la izquierda.
function blitGrip(g, img, hx, hy, gx, gy, f) { g.drawImage(f > 0 ? img : mirrored(img), f > 0 ? hx - gx : hx - (img.width - 1 - gx), hy - gy); }

const weaponOf = (enemy) => ({ wrench: "heavy", laser: "gun", flyswatter: "hammer" }[enemy.weapon] || enemy.weapon || "hammer");

// Coreografia de cada arma en su fase (e: segundos dentro de la fase).
function beat(weapon, phase, e) {
  if (phase === "stalk") return { pose: "ready", wpose: null };
  if (phase === "ready") return { pose: "ready", wpose: weapon === "gun" || weapon === "heavy" ? "gun" : "diag" };
  if (weapon === "gun" || weapon === "heavy") {
    if (phase === "attack") return { pose: e > 0.5 && e < 0.6 ? "windup" : "ready", wpose: "gun", charge: e < 0.5 ? e / 0.5 : e > 0.64 ? Math.min(1, (e - 0.64) / 0.86) : 0, beam: e >= 0.5 && e < 0.64 ? 1 : 0, duck: e > 0.44 && e < 0.72 };
    return { pose: e < 0.12 ? "windup" : "ready", wpose: "gun", beam: e < 0.16 ? 2 : 0, zap: true };
  }
  const net = weapon === "net";
  if (phase === "attack") {
    const step = e < 0.35 ? "wind" : e < 0.42 ? "swing" : e < 0.55 ? "smash" : e < 1.05 ? "rest" : e < 1.4 ? "wind" : "swing";
    const pose = step === "wind" ? (net ? "windup" : "holdup") : step === "swing" ? "cast" : step === "smash" ? (net ? "cast" : "land") : "ready";
    return { pose, wpose: step === "wind" ? "up" : step === "smash" ? "flat" : "diag", swing: step === "swing", dodge: e > 0.3 && e < 0.66 ? (e - 0.3) / 0.36 : 0, taunt: e > 0.66 && e < 1.05 };
  }
  if (net) return { pose: e < 0.2 ? "cast" : "holdup", wpose: e < 0.2 ? "flat" : "up", netted: true };
  return { pose: "land", wpose: "flat", squash: true };
}

function state(a) {
  return (a.hunt ??= { phase: "", since: 0, x: 0, side: 1, id: "", weapon: "hammer", alive: false, flags: {} });
}

export function huntUpdate(actor, a, env) {
  const enemy = actor.enemy, { t, dt } = env;
  if (!enemy) { if (a.hunt) a.hunt = null; return; }
  const H = state(a);
  if (H.phase !== enemy.phase) {
    if (!H.phase) { H.x = actor.x + enemy.side * 90; H.alive = true; H.flags = {}; }
    H.phase = enemy.phase; H.since = t; H.side = enemy.side; H.id = enemy.id; H.weapon = weaponOf(enemy);
    if (enemy.phase === "ready") H.flags.drawn = false;
  }
  const e = t - H.since, b = beat(H.weapon, H.phase, e), home = actor.x + H.side * 22;
  H.frame = Math.floor(t * (b.taunt ? 16 : 9)) % 3;
  if (H.phase === "stalk") { const d = home - H.x; H.x += Math.sign(d) * Math.min(Math.abs(d), 90 * dt); }
  else if (H.phase === "ready") H.x = home;
  // Martillo: el bug salta hacia atras al primer golpe y vuelve con descaro.
  if (H.phase === "attack" && H.weapon === "hammer") {
    if (e > 0.35 && e < 0.62) H.x += H.side * 9 * dt / 0.27;
    if (e > 0.8 && e < 1.05) H.x += Math.sign(home - H.x) * Math.min(Math.abs(home - H.x), 40 * dt);
  }
  H.hy = H.phase === "attack" && H.weapon === "hammer" && b.dodge ? Math.sin(b.dodge * Math.PI) * 5
    : H.phase === "attack" && H.weapon === "net" && b.dodge ? Math.sin(b.dodge * Math.PI) * 11 : 0;
  // Golpes, una sola vez cada uno.
  const once = (key, cond, fn) => { if (cond && !H.flags[key]) { H.flags[key] = true; fn(); } };
  // Donde cae el martillo o la red: la cabeza del arma, ~13 px por delante de Pip.
  const impactX = actor.x + H.side * 13;
  once("drawn", H.phase === "ready", () => { for (let i = 0; i < 4; i++) env.spawn({ k: "star", x: actor.x + H.side * 6, y: FEET - 20, vx: (Math.random() - 0.5) * 24, vy: -8 - Math.random() * 8, g: 30, life: 0.45 }); });
  if (H.weapon === "hammer") {
    once("miss", H.phase === "attack" && e >= 0.42, () => { dust(env, impactX, 10); env.shake(1, 0.12); });
    once("hit", H.phase === "hit", () => { H.x = impactX; dust(env, impactX, 14, 70); env.shake(2, 0.25); for (let i = 0; i < 6; i++) env.spawn({ k: "star", x: impactX, y: FEET - 7, vx: H.side * (6 + i * 5), vy: -18 - Math.random() * 12, g: 44, life: 0.5 }); });
  }
  if (H.weapon === "net") once("hit", H.phase === "hit", () => dust(env, impactX, 6));
  if (H.weapon === "gun" || H.weapon === "heavy") {
    once("hit", H.phase === "hit", () => env.shake(1, 0.15));
    if (H.phase === "hit" && H.alive && Math.random() < dt * 12) env.spawn({ k: "smoke", x: H.x + (Math.random() - 0.5) * 6, y: FEET - 7, vx: (Math.random() - 0.5) * 6, vy: -8, life: 1, max: 1 });
  }
  // El bug se deshace en pixeles.
  once("gone", H.phase === "hit" && e >= 0.9, () => {
    H.alive = false;
    if (H.weapon === "net") {
      const top = H.netAt || [actor.x, FEET - 40];
      for (let i = 0; i < 16; i++) env.spawn({ k: "pix1", x: top[0] + (Math.random() - 0.5) * 4, y: top[1] + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20, life: 0.7, c: Math.random() < 0.4 ? "#ffffff" : ENEMY_COLORS[H.id] });
      return;
    }
    const img = bugImg(H.id, H.frame, H.weapon === "hammer" ? "squash" : "flash"), x0 = Math.round(H.x) - Math.floor(img.width / 2), y0 = FEET - img.height + 1;
    for (const [x, y, c] of bugPixels(img)) if ((x + y) % 2 === 0) env.spawn({ k: "pix1", x: x0 + (H.side > 0 ? img.width - 1 - x : x), y: y0 + y, vx: (Math.random() - 0.5) * 14, vy: -14 - Math.random() * 26, life: 0.5 + Math.random() * 0.5, c });
  });
  H.beat = b;
}
function dust(env, x, n, spread) {
  for (let i = 0; i < n; i++) env.spawn({ k: "dust", x: x + (Math.random() - 0.5) * 4, y: FEET, vx: (Math.random() - 0.5) * (spread || 50), vy: -6 - Math.random() * 14, g: 40, life: 0.4 + Math.random() * 0.3, c: Math.random() < 0.5 ? "#cba062" : "#e4c389" });
}

export function huntPose(actor, a) {
  const H = a.hunt;
  if (!H?.beat) return null;
  return { pose: H.beat.pose, handsBusy: true };
}

// Martillo o red en alto: detras de Pip, para que su cabeza quede delante del mango.
export function huntDrawBehind(g, actor, a, fr, env) {
  const H = a.hunt;
  if (!H?.beat || H.beat.wpose !== "up" || !UP_HEADS[H.weapon]) return;
  const hnd = env.toWorld(fr, fr.rig.a.hand), sk = env.toWorld(fr, fr.rig.a.skull), f = actor.dir;
  const n = Math.max(6, Math.min(24, hnd[1] - sk[1] + 3)), L = longUp(H.weapon, n);
  blitGrip(g, L.img, hnd[0], hnd[1], L.gx, L.gy, f);
  if (H.beat.netted && H.alive) {
    const cx = hnd[0] - f * L.lean, cy = hnd[1] - (L.gy - L.head) - 4, j = Math.floor(env.t * 14) % 2;
    H.netAt = [cx, cy];
    rect(g, cx - 1 + j, cy - 1, 3, 2, ENEMY_COLORS[H.id]); px(g, cx + (j ? -1 : 2), cy, "#2a1020");
  }
}

// Lo mas alto sobre Pip: el martillo o la red en alto.
export function huntTop(actor, a, fr, env) {
  const H = a.hunt;
  if (!H?.beat || H.beat.wpose !== "up") return null;
  return env.toWorld(fr, fr.rig.a.skull)[1] - 8;
}

export function huntDrawFront(g, actor, a, fr, env) {
  const H = a.hunt;
  if (!H?.beat) return;
  const b = H.beat, f = actor.dir, t = env.t, A = ART();
  if (H.alive && !b.netted) {
    const mode = b.squash || b.duck ? "squash" : b.zap ? (Math.floor(t * 20) % 2 ? "flash" : "") : "";
    const img = bugImg(H.id, H.frame, mode);
    blit(g, img, Math.round(H.x) - Math.floor(img.width / 2), FEET - img.height + 1 - Math.round(H.hy || 0), H.side > 0);
    if (b.squash) for (let i = 0; i < 3; i++) { const ang = t * 6 + i * 2.1; px(g, Math.round(H.x + Math.cos(ang) * 6), Math.round(FEET - 6 + Math.sin(ang) * 2), "#ffd166"); }
  }
  if (!b.wpose || b.wpose === "up") return;
  const hnd = env.toWorld(fr, fr.rig.a.hand);
  if (b.wpose === "gun") {
    const heavy = H.weapon === "heavy", img = heavy ? A.heavy : A.gun;
    blitGrip(g, img, hnd[0], hnd[1], 2, heavy ? 6 : 5, f);
    H.muzzle = [hnd[0] + f * (heavy ? 10 : 8), hnd[1] - (heavy ? 4 : 3)];
    return;
  }
  const set = A[H.weapon] || A.hammer, img = set[b.wpose], gp = GRIP[H.weapon]?.[b.wpose] || GRIP.hammer[b.wpose];
  // el golpe: un arco de aire desde encima de la cabeza hasta delante
  if (b.swing) for (let i = 0; i < 7; i++) {
    const ang = 1.9 - i * 0.23, rr = 15;
    g.globalAlpha = 0.35 + i * 0.08;
    px(g, Math.round(hnd[0] + f * Math.cos(ang) * rr), Math.round(hnd[1] - Math.sin(ang) * rr), i > 4 ? "#ffffff" : "#d8e6f5");
    px(g, Math.round(hnd[0] + f * Math.cos(ang) * (rr - 2)), Math.round(hnd[1] - Math.sin(ang) * (rr - 2)), "#d8e6f5");
  }
  g.globalAlpha = 1;
  blitGrip(g, img, hnd[0], hnd[1], gp[0], gp[1], f);
  if (b.netted && H.alive) {
    const cx = hnd[0] + f * 8, cy = hnd[1], j = Math.floor(t * 14) % 2;
    rect(g, cx - 1 + j, cy - 1, 3, 2, ENEMY_COLORS[H.id]); px(g, cx + (j ? -1 : 2), cy, "#2a1020");
  }
}

export function huntDrawOverlay(g, actor, a, fr, env) {
  const H = a.hunt;
  if (!H?.beat) return;
  const b = H.beat, t = env.t, f = actor.dir;
  if (H.phase === "ready" && t - H.since < 0.5 && H.alive) g.drawImage(ART().alert, Math.round(H.x) - 1, FEET - 20);
  if (b.wpose !== "gun" || !H.muzzle) return;
  const [mx, my] = H.muzzle;
  if (b.charge > 0) { halo(g, mx, my, 1 + Math.round(b.charge * 4), "255,200,120", 0.22); if (Math.floor(t * 16) % 2) px(g, mx, my, "#fff6cf"); }
  if (b.beam) {
    const big = b.beam === 2, end = big ? Math.round(H.x) : mx + f * 120, x0 = Math.min(mx, end), x1 = Math.max(mx, end), th = big ? 1 : 0;
    rect(g, x0, my - 1 - th, x1 - x0, 1, "#ff79ae"); rect(g, x0, my + 1 + th, x1 - x0, 1, "#ff79ae");
    rect(g, x0, my - th, x1 - x0, 1 + th * 2, Math.floor(t * 24) % 2 ? "#fff6cf" : "#ffd166");
    g.drawImage(ART().flash, mx - 2 + f, my - 2);
    if (big) halo(g, end, my, 6, "255,160,200", 0.25);
  }
}
