import { blit, gridSprite, halo, lazy, outlinedSprite, px } from "../core.js";
import { FEET } from "../layout.js";
import { PACK, drawStash, stashSparkles } from "./stash.js";

// Encuentros de Buddy (useBuddyEncounters) en pixel art: el hallazgo que
// brilla en el sendero y salta a sus manos al recogerlo, el Signal Bird que se
// posa en la antena y la Phosphor Moth que le ronda la cabeza. Las fases y sus
// tiempos los marca el hook; aqui se dibujan.
export const FINDS = lazy(() => ({
  "arcade-coin": outlinedSprite(["..YYYYY..", ".YhhhhhY.", "YhhhyhhdY", "YhhyyydhY", "YhyyyyydY", "YhhyyyddY", "YhydhdydY", ".YdddddY.", "..YYYYY.."], { Y: "#c8902a", h: "#ffe28a", y: "#fff6cf", d: "#e0a830" }, "#6a4410"),
  "floppy-disk": outlinedSprite(["DDDDDDDDD", "DSSSSSkSD", "DSSSSSkSD", "DDDDDDDDD", "DwwwwwwwD", "DwkkkkkwD", "DwwwwwwwD", "DwkkkwwwD", "DDDDDDDDD"], { D: "#2a8ab0", S: "#c8d4dc", k: "#5a6a7a", w: "#f4fff8" }, "#123a4a"),
  battery: outlinedSprite([".tt..", "GGGGG", "GhGGG", "GhGkG", "GhkkG", "GkkkG", "GGkGG", "GGGGG", "ddddd"], { G: "#3fff97", h: "#b8ffd8", k: "#ffffff", d: "#1f8a4a", t: "#c0c8c4" }, "#0f3a24"),
  "lost-bug": outlinedSprite([".a.....a.", "..a...a..", "..PPPPP..", ".PwePweP.", "PPPPPPPPP", "PPPmmmPPP", "PpPPPPPpP", ".l.l.l.l."], { a: "#5a1a3a", P: "#ff5fae", p: "#ffb8dc", w: "#ffffff", e: "#1a1a2a", m: "#5a1a3a", l: "#5a1a3a" }, "#4a0a2a"),
  "mini-cartridge": outlinedSprite(["PPPPPPPP", "PLLLLLLP", "PLsssLLP", "PLsssLLP", "PLLLLLLP", "PPPPPPPP", "PPhPPPPP", ".YY.YY..", ".YY.YY.."], { P: "#a78bfa", L: "#e8dcff", s: "#6a4ac8", h: "#c8b8ff", Y: "#ffd166" }, "#2a1a4a")
}));
// El hallazgo queda a 76 px del centro de Buddy (como el boton para recogerlo).
export const FIND_OFFSET = 38;
// Recogido: salta a sus manos (POP_S), lo enseña en alto y lo guarda en la
// mochila (de STASH_S a STORED_S), como las capturas de pesca.
const POP_S = 0.35, STASH_S = 1.5, STORED_S = 2.05;

const BIRD_BODY = ["......g.....", "......s.....", "....bbbb....", "...bhhbbb...", "..bbbbbebb..", "..bbbbbbbyy.", "tbbbbbbll...", "ttbbbbbll...", ".tbbbbbll...", "..bbbbbb....", "............", "............"];
const BIRD_PAL = { g: "#3fff97", s: "#1f4a5a", b: "#45d8ff", h: "#b8f7ff", e: "#0a1420", y: "#ffb347", t: "#1f6f93", w: "#1f6f93", W: "#8ae4f8", l: "#e8fbff", f: "#ffb04a" };
const BIRD_WINGS = {
  fold: [[2, 6], [3, 6], [4, 6], [2, 7], [3, 7], [4, 7], [5, 7], [3, 8], [4, 8]],
  up: [[2, 1], [3, 1], [2, 2], [3, 2], [4, 2], [3, 3], [4, 3], [5, 3], [4, 4], [5, 4]],
  mid: [[0, 4], [1, 4], [1, 5], [2, 5], [3, 5], [2, 6], [3, 6], [4, 6]],
  down: [[3, 9], [4, 9], [3, 10], [4, 10], [5, 10], [4, 11], [5, 11]]
};
const birdCache = new Map();
function birdImg(wing, opts = {}) {
  const key = wing + JSON.stringify(opts);
  let img = birdCache.get(key);
  if (img) return img;
  const g = BIRD_BODY.map((r) => r.split(""));
  for (const [x, y] of BIRD_WINGS[wing]) g[y][x] = (x + y) % 3 === 0 ? "W" : "w";
  if (opts.blink) g[4][7] = "b";
  if (opts.chirp) { g[5][9] = "."; g[5][10] = "."; g[4][9] = "y"; g[4][10] = "y"; g[6][9] = "y"; }
  if (opts.feet) { g[10][4] = "f"; g[10][6] = "f"; }
  if (opts.puff) { g[2][3] = "b"; g[2][8] = "b"; g[9][2] = "b"; }
  img = outlinedSprite(g.map((r) => r.join("")), BIRD_PAL, "#0f2a40");
  birdCache.set(key, img);
  return img;
}
const MOTH = lazy(() => [
  gridSprite(["..a...a..", "...a.a...", "ww..g..ww", "wWw.g.wWw", "wwwwgwwww", ".wWwgwWw.", "..w.g.w.."], { w: "#c8ffe8", W: "#3fff97", g: "#2a6a5a", a: "#8adfc0" }),
  gridSprite(["..a...a..", "...a.a...", ".w..g..w.", ".wW.g.Ww.", ".wwwgwww.", "..wWgWw..", "...wgw..."], { w: "#c8ffe8", W: "#3fff97", g: "#2a6a5a", a: "#8adfc0" }),
  gridSprite(["..a...a..", "...a.a...", "....g....", "...wgw...", "...wgw...", "...wgw...", "....g...."], { w: "#c8ffe8", g: "#2a6a5a", a: "#8adfc0" })
]);
const ALERT = lazy(() => outlinedSprite(["W", "W", "W", ".", "W"], { W: "#ffffff" }, "#3a1a0a"));
// El pajaro se posa agarrado al punto de apoyo del rig (la bola de la antena,
// o el pelo con la peluca): el contorno bajo sus patas, fila 12 de su sprite,
// cae sobre la primera fila de la antena.
const BIRD_FEET = 12;

function state(a) {
  return (a.creatures ??= { find: null, held: null, bird: null, moth: null });
}

export function creaturesUpdate(actor, a, env) {
  const C = state(a), { t, dt } = env;
  // Hallazgo: queda en el suelo donde aparecio (Buddy puede ir a por el); al
  // recogerlo (pasa a fiesta) salta a las manos.
  const find = actor.find;
  if (find && (!C.find || C.find.id !== find.id)) C.find = { id: find.id, side: find.side || 1, since: t, x: actor.x + (find.side || 1) * FIND_OFFSET };
  if (C.find && find) C.find.picking = find.picking || "";
  if (C.find && !find) {
    if (actor.mood === "party") {
      C.held = { id: C.find.id, since: t, x0: C.find.x };
      for (let i = 0; i < 14; i++) env.spawn({ k: "conf", x: actor.x, y: FEET - 36, vx: (Math.random() - 0.5) * 50, vy: -25 - Math.random() * 30, g: 70, life: 1 + Math.random() * 0.5, c: ["#f454a7", "#ffd166", "#45d8ff", "#3fff97", "#ff8a3c"][i % 5] });
    } else env.spawn({ k: "star", x: C.find.x, y: FEET - 6, vx: 0, vy: -10, g: 0, life: 0.5 });
    C.find = null;
  }
  if (C.held && !C.held.stored && t - C.held.since > STORED_S) { C.held.stored = true; stashSparkles(env, C.held.pack || [actor.x - 6 * actor.dir, FEET - 13]); }
  if (C.held && (t - C.held.since > 2.8 || actor.mood !== "party")) C.held = null;

  // Pajaro: fly-in, landing, perched, fly-out (BIRD_*_MS en el hook).
  const cr = actor.creature;
  if (cr?.id === "bird") {
    if (!C.bird) C.bird = { phase: "", since: t, side: cr.side || 1, x: actor.x + (cr.side || 1) * 72, y: 4, dir: -(cr.side || 1), wing: "up", opts: {}, notesAt: 0 };
    if (C.bird.phase !== cr.phase) {
      C.bird.phase = cr.phase; C.bird.since = t;
      if (cr.phase === "fly-in") { C.bird.sx = actor.x + C.bird.side * 72; C.bird.sy = 4; }
      if (cr.phase === "fly-out") {
        C.bird.ox = C.bird.x; C.bird.oy = C.bird.y; C.bird.dir = C.bird.side;
        for (let i = 0; i < 4; i++) env.spawn({ k: "feather", x: C.bird.x + 5, y: C.bird.y + 5, vx: (Math.random() - 0.5) * 20, vy: -6 - Math.random() * 6, g: 14, life: 1.4, c: Math.random() < 0.5 ? "#45d8ff" : "#b8f7ff" });
      }
    }
  } else if (C.bird && cr?.id !== "bird") C.bird = null;
  if (C.bird?.phase === "perched" && C.bird.opts.chirp && Math.random() < dt * 6) env.spawn({ k: "note", x: C.bird.x + 5 * C.bird.dir, y: C.bird.y + 2, vx: 6 * C.bird.dir, vy: -9, life: 1, max: 1 });

  if (cr?.id === "moth") { if (!C.moth) C.moth = { since: t, side: cr.side || 1, x: actor.x, y: 40 }; }
  else C.moth = null;
  if (!C.find && !C.held && !C.bird && !C.moth) a.creatures = null;
}

// La cabeza de Pip mira al pajaro o a la polilla; mientras busca, apunta al hallazgo.
export function creaturesPose(actor, a, t) {
  const C = a.creatures;
  if (!C) return null;
  if (C.held) {
    const e = t - C.held.since;
    if (e < STASH_S) return { pose: "holdup", expr: "happy", handsBusy: true, hop: e < 0.3 ? Math.sin(e / 0.3 * Math.PI) * 3 : 0 };
    if (e < STORED_S) return { pose: "ready", expr: "happy", lookX: -1, handsBusy: true };
    return { pose: "idle", expr: "happy", hop: e < STORED_S + 0.25 ? Math.sin((e - STORED_S) / 0.25 * Math.PI) * 2 : 0 };
  }
  // (cuando va a por el, se agacha a cogerlo)
  if (C.find?.picking === "crouch") return { pose: "crouch", lookY: 1, handsBusy: true };
  if (C.find && actor.mood === "find") return { pose: t - C.find.since < 0.5 ? "crouch" : "ready", lookY: 1, handsBusy: true };
  if (C.bird?.phase === "perched") return { lookY: -1 };
  if (C.moth) {
    const flip = (C.moth.x > actor.x ? 1 : -1) !== actor.dir && Math.abs(C.moth.x - actor.x) > 8;
    return { lookY: C.moth.y < FEET - 30 ? -1 : 0, lookX: 1, flip };
  }
  return null;
}

// Posicion del pajaro y la polilla en este fotograma (dependen de la cabeza de Pip).
function place(actor, a, fr, env) {
  const C = a.creatures, { t } = env;
  if (C.bird) {
    const Bd = C.bird, perch = env.toWorld(fr, fr.rig.a.perch), py = perch[1] - BIRD_FEET, e = t - Bd.since;
    Bd.opts = {};
    if (Bd.phase === "fly-in") {
      const p = Math.min(1, e / 1.6), s = p * p * (3 - 2 * p);
      Bd.x = Bd.sx + (perch[0] - Bd.sx) * s; Bd.y = Bd.sy + (py - 4 - Bd.sy) * s - Math.sin(p * Math.PI) * 8;
      Bd.wing = ["up", "mid", "down", "mid"][Math.floor(t * 14) % 4];
    } else if (Bd.phase === "landing") {
      const p = Math.min(1, e / 0.42);
      Bd.x = perch[0]; Bd.y = py - 4 + 4 * p; Bd.wing = "up";
    } else if (Bd.phase === "perched") {
      Bd.x = perch[0]; Bd.y = py + (e < 0.12 ? 1 : 0) - (e > 2.8 && e < 3 ? 2 : 0); Bd.wing = "fold";
      Bd.opts = { feet: true, blink: (e % 1.3) < 0.12, chirp: (e > 0.8 && e < 1.1) || (e > 2.3 && e < 2.6) };
      Bd.dir = e > 1.6 && e < 2.8 ? Bd.side : -Bd.side;
    } else if (Bd.phase === "fly-out") {
      if (e < 0.35) { Bd.x = Bd.ox; Bd.y = Bd.oy - 1; Bd.wing = "up"; Bd.opts = { puff: true }; }
      else { const p = Math.min(1, (e - 0.35) / 1.1); Bd.x = Bd.ox + Bd.dir * 95 * p; Bd.y = Bd.oy - 55 * p * p - 6 * p; Bd.wing = ["up", "mid", "down", "mid"][Math.floor(t * 18) % 4]; }
    }
  }
  if (C.moth) {
    const M = C.moth, c = env.toWorld(fr, [16, 4]), e = t - M.since, k = Math.max(0, Math.min(1, e, 6.2 - e));
    M.x = c[0] + Math.cos(e * 2.3) * 13 * k + (1 - k) * M.side * 70;
    M.y = c[1] + (Math.sin(e * 3.1) * 5 - 4) * k - (1 - k) * 30;
  }
}

// Lo mas alto sobre Pip: el hallazgo en alto o el pajaro en la antena.
export function creaturesTop(actor, a, fr, env) {
  const C = a.creatures;
  if (!C) return null;
  let top = null;
  if (C.held && env.t - C.held.since < STASH_S) { const img = FINDS()[C.held.id]; if (img) top = env.toWorld(fr, fr.rig.a.head)[1] - img.height - 2; }
  if (C.bird && C.bird.phase !== "fly-in" && Math.abs(C.bird.x - actor.x) < 16) top = Math.min(top ?? 99, Math.round(C.bird.y) - (C.bird.phase === "fly-out" ? 9 : 1));
  return top;
}

export function creaturesDrawGround(g, actor, a, env) {
  const C = a.creatures;
  if (!C?.find) return;
  const img = FINDS()[C.find.id];
  if (img) g.drawImage(img, Math.round(C.find.x) - Math.floor(img.width / 2), FEET - img.height + 1);
}

export function creaturesDrawFront(g, actor, a, fr, env) {
  const C = a.creatures;
  if (!C) return;
  place(actor, a, fr, env);
  const { t } = env;
  if (C.held) {
    const img = FINDS()[C.held.id], hd = env.toWorld(fr, fr.rig.a.head), e = t - C.held.since, p = Math.min(1, e / POP_S);
    C.held.pack = env.toWorld(fr, PACK);
    if (img && e < STASH_S) {
      const x = C.held.x0 + (hd[0] - C.held.x0) * p, y = (FEET - img.height + 1) + ((hd[1] - img.height - 1) - (FEET - img.height + 1)) * p - Math.sin(p * Math.PI) * 10;
      g.drawImage(img, Math.round(x - img.width / 2), Math.round(y + (p >= 1 && Math.sin(t * 6) > 0 ? -1 : 0)));
    } else if (img && e < STORED_S) drawStash(g, img, [hd[0], hd[1] - img.height / 2 - 1], C.held.pack, (e - STASH_S) / (STORED_S - STASH_S));
  }
  if (C.bird) blit(g, birdImg(C.bird.wing, C.bird.opts), Math.round(C.bird.x) - 6, Math.round(C.bird.y), C.bird.dir < 0);
}

export function creaturesDrawOverlay(g, actor, a, fr, env) {
  const C = a.creatures;
  if (!C) return;
  const { t } = env;
  if (C.find) {
    const img = FINDS()[C.find.id], x = Math.round(C.find.x), y = FEET - (img?.height || 9) - 1, r = 2 + Math.floor(t * 4) % 3;
    if (Math.sin(t * 6) > 0) { px(g, x, y - 1, "#ffffff"); px(g, x - 1, y - 1, "#fff0af"); px(g, x + 1, y - 1, "#fff0af"); px(g, x, y - 2, "#fff0af"); px(g, x, y, "#fff0af"); }
    g.globalAlpha = 0.5; px(g, x - r - 2, y + 4, "#fff0af"); px(g, x + r + 2, y + 2, "#fff0af"); g.globalAlpha = 1;
  }
  if (C.bird?.phase === "fly-out" && t - C.bird.since < 0.35) g.drawImage(ALERT(), Math.round(C.bird.x) - 1, Math.round(C.bird.y) - 8);
  if (C.moth) {
    halo(g, C.moth.x, C.moth.y, 5, "160,255,200", 0.2);
    g.drawImage(MOTH()[[0, 1, 2, 1][Math.floor(t * 14) % 4]], Math.round(C.moth.x) - 4, Math.round(C.moth.y) - 3);
  }
}
