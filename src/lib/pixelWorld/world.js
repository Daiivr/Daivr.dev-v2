import { ART, blit, dissolveSprite, ellipseRows, flipped, halo, makeCanvas, px, rect, rng, turned } from "./core.js";
import { catchSprite } from "./catches.js";
import { FEET, H, PATH, STAND_TOP, WATER_Y, WORLD_TOP, layoutFor } from "./layout.js";
import { createLightRig, lightingFor } from "./lighting.js";
import { P, applySeason, currentSeason } from "./palette.js";
import { LAMP_H, sprites } from "./props.js";
import { TREE_BASE, buildGround, buildHills, bushArt, clearArtCache, drawSway, drawTuft, makeFlowers, makeTufts, swayAt, treeArt } from "./scenery.js";
import { seasonLights, seasonOverlay, seasonSetup, seasonSkyLayer, seasonUpdate, seasonWorld } from "./seasons.js";
import { createSky } from "./sky.js";
import { SEASON_FITS, wornSlots } from "./pip/outfit.js";
import { pipPose } from "./pip/poses.js";
import { drawJet } from "./pip/jets.js";
import { RIG_FOOT_X, RIG_OY, RIG_TALL, RIG_W, rigImg } from "./pip/rig.js";
import { EVENTS } from "./events/index.js";
import { behindTent } from "./events/tent.js";
import { createLife } from "./life/index.js";

// El mundo del footer en un solo lienzo: el cielo (sky.js, con lo que manda
// FooterSky), colinas, bosque, prado, sendero, farolas, hoguera y puesto del
// mercado, con el tiempo de verdad (luz segun la hora, lluvia, charcos, nieve,
// viento), bichos (rana, mariposas, luciernagas), el pez que salta del agua y
// el decorado de temporada.
// Va en dos capas que se iluminan igual: el fondo, y Buddy con lo que pisa por
// delante. Entre las dos, lo que brilla por si mismo (farolas, llamas, el
// cristal del puesto): asi su brillo nunca tapa a Buddy.
const LAMP_TOP = 72 - LAMP_H + 1;
const PUDDLES = [[47, 14], [63, 17], [84, 20]];
// Radio del agujero de agua por donde salta un pez.
const SPOT_RX = 6;

export function createFooterWorld(canvas) {
  const g = canvas.getContext("2d");
  const state = {
    sky: { altitude: 1, phase: "day", cover: "fair", wind: 1 },
    market: { open: true, hover: false },
    // Buddy y las visitas (FooterWorld los saca del bus cada fotograma): x del
    // centro e y (negativa hacia arriba) en px de arte; dir 1 = mira a la derecha.
    actors: [],
    fish: null,
    // Lo que publica FooterSky (skyBus): sol o luna, estrellas fugaces y el arcoiris.
    scene: { stars: [], rainbow: null, body: null },
    // El cursor sobre el footer (px de arte; at = performance.now()), para que
    // los pajaritos se asusten; el buzon (bandera arriba si hay carta nueva).
    pointer: null,
    mail: { flag: false },
    reduceMotion: false
  };
  let W = 0, L = null, wc = null, wg = null, ac = null, ag = null, gc = null, gg = null, lightRig = null, base = null;
  const skyArt = createSky();
  // Agujeros de agua por donde saltan los peces.
  let spots = [], flashStart = false;
  // La luz que se ve: va hacia la que toca para que un cambio de tiempo (el
  // chaparron de Buddy) oscurezca el valle poco a poco.
  let shownTint = null, shownDesat = 0, shownLamps = 0;
  let trees = [], bushes = [], flowers = [], tufts = [], sea = null;
  let t = 0, parts = [], drops = [], flakes = [], flies = [], bflies = [], frogs = [], resident = null;
  let wet = 0, flash = 0, nextFlash = 9, light = lightingFor(state.sky);
  // Temblor del lienzo (golpes de martillo, rayos): cuanto y hasta cuando.
  let shakeAmt = 0, shakeUntil = 0;
  const fishCache = new Map();
  const anim = new Map();
  let eventLights = [], eventSky = null, eventWind = 1;
  // La hoguera: la lluvia la apaga (las llamas menguan entre vapor y
  // chisporroteo) y se queda apagada hasta que Buddy la vuelve a encender
  // (relightFire, desde useBuddyCampfire); entonces prende y crece.
  const fire = { level: 1, out: false, outAt: -99, relightAt: -99 };
  const bubbleLifts = new Map();
  // La vida del valle (life/): pajaros posados, hojas, buho, huellas, rocio,
  // cometas, nieve, farolas una a una, la tienda, el buzon y el forraje.
  const life = createLife();
  const lc = { t: 0, dt: 0, W: 0, H, L: null, light, sky: state.sky, wind: 0.5, rain: false, wet: 0, season: "", actors: [], pointer: null, trees: [], tufts: [], flowers: [], spawn: (p) => spawn(p), lampTop: LAMP_TOP, standTop: STAND_TOP, standImg: null, holes: [], snowGround: 0, reduceMotion: false, owlLamp: null, state, snowCap: (img) => life.snow.cap(img) };

  function build(cssWidth) {
    W = Math.max(60, Math.ceil(cssWidth / ART));
    L = layoutFor(W, { cssWidth });
    canvas.width = W; canvas.height = H + WORLD_TOP;
    g.imageSmoothingEnabled = false;
    [wc, wg] = makeCanvas(W, H);
    [ac, ag] = makeCanvas(W, H);
    // Ojos y LEDs de todos, con el margen de arriba (lo que vuela tambien brilla).
    [gc, gg] = makeCanvas(W, H + WORLD_TOP);
    lightRig = createLightRig(W, H);
    skyArt.build(W);
    trees = L.trees.map((tree) => ({ ...tree, art: treeArt(tree) }));
    bushes = L.bushes.map((bush) => ({ ...bush, art: bushArt(bush) }));
    flowers = currentSeason() === "winter" ? [] : makeFlowers(W, L, rng(5), sprites().flowers.length);
    tufts = makeTufts(W, L, rng(6));
    // Capa fija: colinas, prado y la fila de arboles del fondo (no se mecen).
    const [bc, bg] = makeCanvas(W, H);
    bg.drawImage(buildHills(W, 7), 0, 0);
    bg.drawImage(buildGround(W, L, trees, 99), 0, 0);
    for (const tree of trees) if (tree.d === "back") bg.drawImage(tree.art.c, tree.x - Math.floor(tree.art.w / 2), TREE_BASE.back - tree.art.h + 1);
    base = bc;
    sea = seasonSetup(currentSeason(), W, L, trees);
    const R = rng(404);
    resident = { x: L.X(63), hop: 0, hopT: -1, dir: 1, next: 4, croak: 0, croakAt: 3 };
    bflies = [0, 1, 2].map((i) => ({ hx: L.X(30 + i * 24), hy: 52 + i * 3, ax: 26 + i * 6, ay: 6, sx: 0.35 + i * 0.1, sy: 1.1 + i * 0.3, p: i * 2.1, c: i, x: 0, y: 0, f: 0, dir: 1 }));
    flies = Array.from({ length: 12 }, (_, i) => ({ ax: i % 3 === 0 ? L.lamps[i % L.lamps.length] : 20 + R() * (W - 40), ay: 46 + R() * 22, x: 0, y: 0, b: 0, p: R() * 6, rx: 6 + R() * 12, ry: 3 + R() * 5, sp: 0.3 + R() * 0.4 }));
    parts = []; drops = []; flakes = []; frogs = []; spots = [];
    Object.assign(lc, { t, W, L, trees, tufts, flowers, standImg: sprites().stand, season: currentSeason(), sky: state.sky, light });
    life.setup(lc);
    return L;
  }

  function setSeason(name) {
    if ((name || "") === currentSeason()) return false;
    applySeason(name || "");
    clearArtCache();
    return true;
  }

  // Charco del sendero bajo una x (salen cuando el camino esta mojado).
  function puddleAt(x) {
    return wet > 0.35 && PUDDLES.some(([p, w]) => Math.abs(x - L.X(p)) < w / 2 - 1);
  }
  // Una gota que cae en un charco hace ondas en vez de salpicar.
  const spawn = (p) => {
    if (p.k === "splash" && p.y >= 73 && p.y <= 76 && puddleAt(p.x)) { parts.push({ k: "ripple", x: Math.round(p.x), y: WATER_Y, life: 0.5, max: 0.5 }); return; }
    parts.push(p);
  };
  function splash(x, y, n, col) {
    for (let i = 0; i < n; i++) spawn({ k: "drop", x, y, vx: (Math.random() - 0.5) * 30, vy: -18 - Math.random() * 20, g: 90, life: 0.45 + Math.random() * 0.25, c: col || "#d6efff" });
  }
  function impact(x, y) {
    for (let i = 0; i < 4; i++) spawn({ k: "star", x, y, vx: (Math.random() - 0.5) * 26, vy: -12 - Math.random() * 10, g: 40, life: 0.45 });
  }
  // Deseo pedido a una estrella fugaz: chispas doradas donde estaba.
  function wish(x, y) {
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; spawn({ k: "star", x, y, vx: Math.cos(a) * 24, vy: Math.sin(a) * 18, life: 0.6 }); }
    for (let i = 0; i < 10; i++) spawn({ k: "pix1", x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 30, vy: -6 - Math.random() * 14, g: 30, life: 0.5 + Math.random() * 0.5, c: Math.random() < 0.5 ? "#ffe9a8" : "#ffd166" });
  }
  // Agujero de agua en el sendero por donde sale (o entra) un pez: se abre,
  // aguanta `hold` segundos y se cierra.
  function waterSpot(x, hold = 1) {
    const near = spots.find((spot) => Math.abs(spot.x - x) < SPOT_RX * 2);
    if (near) { near.until = Math.max(near.until, t + hold); return; }
    spots.push({ x, born: t, until: t + hold, ripples: [] });
  }
  // El pez entra o sale: salpica y deja ondas.
  function splashSpot(x) {
    splash(x, WATER_Y - 1, 6);
    const spot = spots.find((s) => Math.abs(s.x - x) < SPOT_RX * 2);
    if (spot) spot.ripples.push(t, t + 0.25);
  }
  // Dos ranas salen de la hierba junto a Buddy cuando empieza a llover y se
  // alejan saltando, una a cada lado.
  function rainFrogs(x) {
    [-1, 1].forEach((dir, i) => {
      const start = Math.max(14, Math.min(W - 24, x + dir * (17 + Math.random() * 19)));
      const room = dir > 0 ? W - start - 21 : start - 1;
      frogs.push({ x: start, dir, hop: 0, hopT: -1, hops: 3, step: Math.max(0, Math.min(room, 90 + Math.random() * 30)) / 3, next: t + i * 0.28, life: 6.5, alpha: 0 });
    });
  }

  // Llueve (de verdad, o el chaparron de Buddy, que FooterSky pasa como lluvia).
  const raining = () => state.sky.cover === "rain" || state.sky.cover === "storm";

  function update(dt) {
    t += dt;
    const sky = state.sky, rain = raining();
    light = lightingFor(sky);
    // (las farolas que tocan segun la hora, antes de suavizar: Pip las enciende)
    const lampsWanted = light.lamps > 0.4;
    // (sin bucle, con movimiento reducido, salta directo)
    const k = !shownTint || dt === 0 ? 1 : Math.min(1, dt * 0.8);
    shownTint = (shownTint || light.tint).map((v, i) => v + (light.tint[i] - v) * k);
    shownDesat += (light.desat - shownDesat) * k; shownLamps += (light.lamps - shownLamps) * k;
    light = { ...light, tint: shownTint, desat: shownDesat, lamps: shownLamps, plain: light.plain && shownTint.every((v) => v > 0.995) && shownDesat < 0.005 };
    skyArt.update(dt, sky, state.scene, t);
    spots = spots.filter((spot) => t < spot.until + 0.5);
    const wind = Math.min(0.9, Math.max(0.2, (sky.wind || 1) * 0.45));
    state.windNow = wind;
    for (const p of parts) { p.life -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.g) p.vy += p.g * dt; if (p.wob) p.x += Math.sin(t * 4 + p.wob) * 0.25; }
    parts = parts.filter((p) => p.life > 0 && p.x > -10 && p.x < W + 10);
    // Hoguera: con lluvia se apaga poco a poco entre vapor; apagada solo humea
    // un rato. Si nadie la enciende, sigue apagada.
    if (rain && !fire.out) {
      fire.level = Math.max(0, fire.level - dt / 2.4);
      if (Math.random() < dt * 16) spawn({ k: "steam", x: L.fireX + (Math.random() - 0.5) * 8, y: 70 - fire.level * 8, vx: (Math.random() - 0.5) * 6, vy: -9 - Math.random() * 8, life: 1.3, max: 1.3 });
      if (Math.random() < dt * 10) spawn({ k: "pix1", x: L.fireX + (Math.random() - 0.5) * 6, y: 71, vx: (Math.random() - 0.5) * 18, vy: -10 - Math.random() * 10, g: 60, life: 0.35, c: Math.random() < 0.5 ? "#ffb04a" : "#5a4a40" });
      if (fire.level <= 0) { fire.out = true; fire.outAt = t; }
    } else if (!fire.out && fire.level < 1) fire.level = Math.min(1, fire.level + dt / 1.6);
    if (fire.level > 0.25 && Math.random() < dt * 1.6) spawn({ k: "smoke", x: L.fireX + (Math.random() - 0.5) * 3, y: 57 + (1 - fire.level) * 10, vx: -2 - Math.random() * 3 * wind, vy: -5 - Math.random() * 2, life: 3.2, max: 3.2 });
    else if (fire.out && (rain || t - fire.outAt < 25) && Math.random() < dt * (rain ? 2.2 : 0.9)) spawn({ k: "smoke", x: L.fireX + (Math.random() - 0.5) * 3, y: 69, vx: -2 - Math.random() * 3 * wind, vy: -5 - Math.random() * 2, life: 3.2, max: 3.2 });
    if (fire.level > 0.5 && !rain && Math.random() < dt * 2.6 * fire.level) spawn({ k: "spark", x: L.fireX + (Math.random() - 0.5) * 6, y: 62, vx: (Math.random() - 0.5) * 4, vy: -10 - Math.random() * 8, life: 0.7 + Math.random() * 0.5 });
    // El camino se moja con la lluvia y tarda en secarse.
    wet += ((rain ? 1 : 0) - wet) * Math.min(1, dt * (rain ? 0.4 : 0.02));
    updateRain(dt, rain, wind);
    if (sky.cover === "snow" && currentSeason() !== "winter") updateSnow(dt);
    else flakes = [];
    if (sky.cover === "storm") {
      if (t > nextFlash) { nextFlash = t + 13 + Math.random() * 6; flash = 0.5; flashStart = true; }
      if (flash > 0) flash -= dt;
    } else flash = 0;
    updateFrog(resident, dt, rain);
    for (const frog of frogs) {
      frog.life -= dt;
      frog.alpha = Math.min(1, frog.life < 0.6 ? frog.life / 0.6 : frog.alpha + dt * 4);
      if (frog.hopT >= 0) {
        frog.hopT += dt;
        const p = Math.min(1, frog.hopT / 0.45);
        frog.hop = Math.sin(p * Math.PI) * 7; frog.x += frog.dir * frog.step / 0.45 * dt;
        if (p >= 1) { frog.hopT = -1; frog.hop = 0; frog.hops -= 1; frog.next = t + 0.45; }
      } else if (frog.hops > 0 && t > frog.next) frog.hopT = 0;
    }
    frogs = frogs.filter((frog) => frog.life > 0);
    if (light.fireflies > 0) for (const f of flies) {
      f.x = f.ax + Math.sin(t * f.sp + f.p) * f.rx + Math.sin(t * 1.7 + f.p * 2) * 2;
      f.y = f.ay + Math.sin(t * f.sp * 1.3 + f.p * 1.7) * f.ry;
      f.b = Math.max(0, Math.sin(t * 2.2 + f.p * 3));
    }
    for (const b of bflies) {
      const nx = b.hx + Math.sin(t * b.sx + b.p) * b.ax;
      b.dir = nx < (b.x || nx) ? -1 : 1;
      b.x = nx; b.y = b.hy + Math.sin(t * b.sy + b.p * 2) * b.ay + Math.sin(t * 9 + b.p) * 0.6;
      b.f = Math.floor(t * 9 + b.p * 3) % 2;
    }
    animateActors(dt);
    // Eventos que cambian la luz del mundo: el apagon (oscuro, farolas fuera,
    // con la linterna) o el leviatan y el kraken (verde azulado, farolas
    // encendidas, el cielo tambien), con sus luces propias.
    eventLights = []; eventSky = null; eventWind = 1;
    for (const actor of state.actors) for (const ev of EVENTS) {
      const out = ev.light ? ev.light(actor, anim.get(actor.id) || {}, env) : null;
      if (!out || out.dim <= 0) continue;
      const k = Math.min(1, out.dim);
      light = {
        ...light, tint: light.tint.map((v, i) => v + (out.dark[i] - v) * k),
        lamps: out.lamps != null ? Math.max(light.lamps, out.lamps) : light.lamps * (1 - k),
        desat: out.desat != null ? Math.max(light.desat, out.desat) : light.desat,
        dark: Math.max(light.dark, k), fireflies: Math.max(light.fireflies, k * 0.6), plain: false
      };
      if (out.sky) eventSky = out.sky;
      if (out.wind != null) eventWind = out.wind;
      eventLights.push(...out.lights);
    }
    // (el viento que ve el dibujo: quieto antes del leviatan, rafaga al rugir)
    if (eventWind !== 1) state.windNow = Math.max(0.02, Math.min(2.4, wind * eventWind));
    seasonUpdate(sea, dt, t);
    const pointer = state.pointer && performance.now() - state.pointer.at < 300 ? state.pointer : null;
    const holes = [];
    for (const a of anim.values()) if (a.fishing?.hole && a.fishing.holeOpen > 0) holes.push(a.fishing.hole.x);
    Object.assign(lc, { t, dt, light, sky, wind: sky.wind || 1, rain, wet, season: currentSeason(), actors: state.actors, pointer, holes, reduceMotion: state.reduceMotion, owlLamp: life.night.owlLamp });
    lc.snowGround = lc.season === "winter" ? 1 : life.snow.depth;
    life.lamps.update(lc, lampsWanted);
    life.update(lc);
  }

  // Lo que el lienzo recuerda de cada actor entre fotogramas: lo andado (para
  // el paso), cuando cambio de humor, el parpadeo, el vuelo con botas cohete y
  // el fundido de las visitas.
  // Lo que los eventos (src/lib/pixelWorld/events) reciben para trabajar.
  const env = {
    t: 0, dt: 0, spawn: (p) => spawn(p), splash: (x, y, n, col) => splash(x, y, n, col), toWorld: (fr, pt) => toWorld(fr, pt),
    shake: (amt, dur) => { shakeAmt = amt; shakeUntil = t + dur; },
    // (la cabeza de las farolas, para lo que pasa en ellas: chispas del apagon)
    lampY: 72 - LAMP_H + 6,
    get layout() { return L; }
  };
  function animateActors(dt) {
    env.t = t; env.dt = dt;
    const seen = new Set();
    for (const actor of state.actors) {
      seen.add(actor.id);
      let a = anim.get(actor.id);
      if (!a) {
        a = { dist: 0, lastX: actor.x, mood: actor.mood, since: t, blinkAt: t + 1 + Math.random() * 2, blinkUntil: 0, hoverH: 0, fade: "", fadeAt: t, nextZ: t + 0.6 };
        anim.set(actor.id, a);
      }
      a.dist += Math.abs(actor.x - a.lastX); a.lastX = actor.x;
      if (a.mood !== actor.mood) { a.mood = actor.mood; a.since = t; }
      if (t > a.blinkAt) { a.blinkUntil = t + 0.13; a.blinkAt = t + 2.2 + Math.random() * 3.2; }
      if ((actor.fade || "") !== a.fade) { a.fade = actor.fade || ""; a.fadeAt = t; }
      const flying = actorFit(actor).feet === "rocket-boots" && actor.moving && !["held", "chute", "rain"].includes(actor.mood);
      a.hoverH = Math.max(0, Math.min(4, a.hoverH + (flying ? 16 : -16) * dt));
      if (flying && a.hoverH > 2 && Math.random() < dt * 12) spawn({ k: "smoke", x: actor.x - actor.dir * 2, y: FEET + 1, vx: -actor.dir * 8, vy: 4, life: 0.9, max: 0.9 });
      for (const ev of EVENTS) if (ev.update) ev.update(actor, a, env);
      if (actor.mood === "sleep" && !actor.tent && t > a.nextZ) {
        a.nextZ = t + 1.3 + Math.random() * 0.4;
        spawn({ k: "z", x: actor.x - 4 * actor.dir, y: FEET - 30 + (actor.y || 0), vx: -2.5 * actor.dir, vy: -4, life: 2.6, max: 2.6, wob: Math.random() * 6 });
      }
    }
    for (const id of anim.keys()) if (!seen.has(id)) anim.delete(id);
  }
  // Lo que lleva puesto, con lo de temporada en los huecos libres.
  function actorFit(actor) {
    const fit = { ...(actor.outfit || {}) }, seasonal = SEASON_FITS[currentSeason()] || {};
    for (const [slot, id] of Object.entries(seasonal)) if (!fit[slot] && !(slot === "head" && fit.hair)) fit[slot] = id;
    return fit;
  }
  // Pose, sprite y sitio de un actor en este instante.
  function actorFrame(actor, glow) {
    const a = anim.get(actor.id);
    if (!a) return null;
    const pose = pipPose({
      mood: actor.mood, expression: actor.expression, moving: actor.moving, airborne: (actor.y || 0) < -2,
      blink: t < a.blinkUntil, now: t, since: a.since, walkFrame: Math.floor(a.dist / 2.2) % 6,
      fishing: actor.fishing, hunt: actor.hunt, outage: actor.outage, campfire: actor.campfire
    });
    for (const ev of EVENTS) {
      const extra = ev.pose ? ev.pose(actor, a, t) : null;
      if (extra) { pose.hop = 0; for (const [key, value] of Object.entries(extra)) if (value !== undefined) pose[key] = value; break; }
    }
    const hovering = a.hoverH > 0.5 && pose.pose === "walk";
    const opts = {
      pose: hovering ? "hover" : pose.pose, frame: hovering ? Math.floor(t * 10) % 2 : pose.frame, expr: pose.expr,
      lookX: pose.lookX ?? actor.lookX ?? 0, lookY: pose.lookY ?? actor.lookY ?? 0, ghost: Boolean(actor.ghost), glow: Boolean(glow),
      outfit: wornSlots(actorFit(actor), { handsBusy: pose.handsBusy }), handUp: pose.handUp, ...(hovering ? { moving: true } : {})
    };
    // La antena de chispas chisporrotea (fase de la chispa, solo si la lleva).
    if (opts.outfit.antenna === "gold-antenna") opts.spark = Math.floor(t * 9) % 6;
    const flip = (actor.dir < 0) !== pose.flip;
    const lift = Math.round(pose.hop + a.hoverH + (a.hoverH > 2 ? Math.round(Math.sin(t * 9)) : 0));
    const left = Math.round(actor.x) - (flip ? RIG_W - 1 - RIG_FOOT_X : RIG_FOOT_X);
    const top = FEET - RIG_TALL - lift + Math.round(actor.y || 0);
    const fade = a.fade === "in" ? Math.min(1, (t - a.fadeAt) / 0.65) : a.fade === "out" ? Math.max(0, 1 - (t - a.fadeAt) / 0.65) : 1;
    // (entrando o saliendo de la tienda: deshecho en trama)
    let rig = rigImg(opts);
    if (pose.dissolve != null && pose.dissolve < 1) rig = { ...rig, c: dissolveSprite(rig.c, pose.dissolve) };
    return { rig, left, top, flip, alpha: (actor.ghost ? 0.62 : 1) * fade * (pose.dissolve === 0 ? 0 : 1), hoverH: a.hoverH, pose, lift };
  }
  const toWorld = (fr, pt) => [fr.left + (fr.flip ? RIG_W - 1 - pt[0] : pt[0]), fr.top + pt[1] + RIG_OY];

  function drawPuddle(g, x, w, alpha) {
    const x0 = Math.round(x - w / 2), ice = currentSeason() === "winter", glint = Math.floor(t * 1.5) % 3;
    g.globalAlpha = alpha;
    rect(g, x0 + 2, 73, w - 4, 1, P.dirt[1]);
    rect(g, x0 + 1, 74, w - 2, 1, ice ? "#a9cbe4" : "#4d6684");
    rect(g, x0, 75, w, 1, ice ? "#c6e0f2" : "#5c7898");
    rect(g, x0 + 1, 76, w - 2, 1, ice ? "#a9cbe4" : "#4d6684");
    rect(g, x0 + 2 + glint, 75, 3, 1, ice ? "#ffffff" : "#9fbcd8"); rect(g, x0 + w - 6, 74, 2, 1, ice ? "#ffffff" : "#c5dcf0");
    g.globalAlpha = 1;
  }
  // Manantial del pez: como el agujero de pesca, pero pequeño y de paso.
  function drawSpot(g, spot) {
    const o = Math.min(1, (t - spot.born) / 0.25, Math.max(0, 1 - (t - spot.until) / 0.45));
    if (o <= 0) return;
    const hx = Math.round(spot.x), winter = currentSeason() === "winter";
    const rx = Math.max(1, Math.round(SPOT_RX * o)), ry = Math.max(1, Math.round(2 * o));
    ellipseRows(g, hx, WATER_Y, rx + 2, ry + 1, winter ? "#eef6fc" : P.dirt[0]);
    ellipseRows(g, hx, WATER_Y, rx + 1, ry, winter ? "#9fc0dc" : "#2c1d10");
    ellipseRows(g, hx, WATER_Y, rx, ry, "#164c59");
    if (rx > 3) { rect(g, hx - rx + 2, WATER_Y - ry, rx * 2 - 3, 1, "#0b2a33"); rect(g, hx - 2 + (Math.floor(t * 5) % 3), WATER_Y + 1, 2, 1, "#7fd3e0"); }
    for (const r0 of spot.ripples) {
      const e = t - r0, rr = 2 + Math.round(e * 8);
      if (e < 0 || e > 0.9 || rr > rx + 3) continue;
      g.globalAlpha = 1 - e / 0.9;
      for (const [dx, dy] of [[-rr, 0], [rr, 0], [-rr + 1, -1], [rr - 1, -1], [-rr + 1, 1], [rr - 1, 1]]) px(g, hx + dx, WATER_Y + dy, "#bff2f8");
      g.globalAlpha = 1;
    }
  }

  function newDrop(anywhere) {
    return { x: Math.random() * (W + 30), y: anywhere ? Math.random() * H : -Math.random() * 12, gy: PATH + 1 + Math.floor(Math.random() * (H - PATH - 2)), v: 120 + Math.random() * 50 };
  }
  // La lluvia cae en todo el valle; la que da en un paraguas rebota en la copa.
  function updateRain(dt, rain, wind) {
    const want = rain ? Math.round(W / (state.sky.cover === "storm" ? 3 : 5)) : 0;
    while (drops.length < want) drops.push(newDrop(drops.length === 0));
    const ums = [];
    for (const a of anim.values()) if (a.rain?.um) ums.push(a.rain.um);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.v * dt; d.x -= 34 * wind * dt;
      const um = ums.find((u) => Math.abs(d.x - u.cx) <= 15 && d.y >= u.top + 3 && d.y < u.top + 7);
      if (um) {
        if (Math.random() < 0.5) spawn({ k: "drop", x: d.x, y: um.top + 3, vx: (Math.random() - 0.5) * 24, vy: -10 - Math.random() * 10, g: 90, life: 0.3, c: "#e6eef8" });
        if (drops.length > want) { drops.splice(i, 1); continue; }
        Object.assign(d, newDrop(false));
        continue;
      }
      if (d.y >= d.gy) {
        spawn({ k: "splash", x: Math.round(d.x), y: d.gy, life: 0.18, max: 0.18 });
        if (drops.length > want) { drops.splice(i, 1); continue; }
        Object.assign(d, newDrop(false));
      }
      if (d.x < -4) d.x += W + 8;
    }
  }
  function updateSnow(dt) {
    const want = Math.round(W / 6);
    while (flakes.length < want) flakes.push({ x: Math.random() * W, y: Math.random() * H, v: 5 + Math.random() * 9, s: Math.random() < 0.18 ? 2 : 1, p: Math.random() * 6 });
    for (const f of flakes) { f.y += f.v * dt; f.x += (Math.sin(t * 1.3 + f.p) * 6 - 3) * dt; if (f.y > H) { f.y = -2; f.x = Math.random() * W; } if (f.x < -2) f.x += W + 4; }
  }
  function updateFrog(frog, dt, rainy) {
    if (!frog) return;
    if (frog.hopT >= 0) {
      frog.hopT += dt;
      const p = Math.min(1, frog.hopT / 0.45);
      frog.hop = Math.sin(p * Math.PI) * 6; frog.x += frog.dir * 26 * dt;
      if (p >= 1) { frog.hopT = -1; frog.hop = 0; }
    } else if (t > frog.next) {
      frog.next = t + (rainy ? 1.8 + Math.random() * 1.6 : 7 + Math.random() * 4);
      const lo = L.X(40), hi = W - 14;
      frog.dir = frog.x < lo + 10 ? 1 : frog.x > hi - 10 ? -1 : (Math.random() < 0.5 ? -1 : 1);
      frog.hopT = 0;
    }
    if (light.dark > 0.6 && t > frog.croakAt) { frog.croak = t + 0.7; frog.croakAt = t + 3 + Math.random() * 2.5; }
  }

  function lightsFor() {
    const lights = [], d = light.dark;
    if (d <= 0) return lights;
    const fl = 1 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.05, lampY = 72 - LAMP_H + 6;
    if (fire.level > 0.02) lights.push({ x: L.fireX, y: 66, r: (24 + 10 * d) * fl * (0.4 + 0.6 * fire.level), c: [1, 0.66, 0.36], s: (0.45 + 0.6 * d) * fire.level });
    if (light.lamps > 0) {
      L.lamps.forEach((lx, i) => { const k = life.lamps.level(i, t); if (k > 0.02) lights.push({ x: lx, y: lampY, r: 13 + 9 * d, c: [1, 0.8, 0.5], s: (0.3 + 0.55 * d) * light.lamps * k }); });
      if (state.market.open) lights.push({ x: L.standX + 54, y: STAND_TOP + 31, r: 10 + 2 * d, c: [1, 0.8, 0.5], s: (0.3 + 0.4 * d) * light.lamps });
    }
    // La linterna de Pip: un charco a medio haz y otro, grande, donde da.
    for (const w of state.actors) {
      const T = anim.get(w.id)?.torch;
      if (!T) continue;
      lights.push({ x: (T.x0 + T.x1) / 2, y: (T.y0 + T.y1) / 2, r: 11, c: [1, 0.95, 0.78], s: 0.4 * T.k });
      lights.push({ x: T.x1, y: T.y1 - 2, r: 20, c: [1, 0.93, 0.72], s: 0.75 * T.k });
    }
    // Pip es un robot: de noche su pantalla alumbra un poco a su alrededor y
    // hacia donde mira (las visitas, un brillo azulado mas tenue).
    if (d > 0.25) for (const w of state.actors) {
      if (w.aloft) continue;
      const k = Math.min(1, (d - 0.25) / 0.45), cy = FEET - 17 + (w.y || 0);
      lights.push({ x: w.x, y: cy, r: w.ghost ? 11 : 20, c: w.ghost ? [0.7, 0.72, 1] : [0.35, 1, 0.72], s: (w.ghost ? 0.22 : 0.34) * k });
      if (!w.ghost) lights.push({ x: w.x + (w.dir || 1) * 10, y: cy - 2, r: 13, c: [0.55, 1, 0.85], s: 0.26 * k });
    }
    const n = Math.round(flies.length * light.fireflies);
    for (let i = 0; i < n; i++) { const f = flies[i]; if (f.b > 0.3) lights.push({ x: f.x, y: f.y, r: 4, c: [0.75, 1, 0.35], s: 0.35 * f.b }); }
    if (d > 0.15) seasonLights(lights, sea);
    life.lights(lights, lc);
    lights.push(...eventLights);
    return lights;
  }

  // La linterna (objeto de la mano): al oscurecer se enciende y apunta al
  // sendero, unos pasos por delante; andando, el haz se balancea con el paso.
  // Solo Pip de casa (las visitas son hologramas) y con el cristal a la vista.
  function aimTorches(frames) {
    const on = Math.max(0, Math.min(1, (light.dark - 0.3) / 0.35));
    for (const { actor, fr } of frames) {
      const a = anim.get(actor.id);
      if (!a) continue;
      a.torchK = Math.max(0, Math.min(1, (a.torchK || 0) + (on > 0 && fr.rig.a.lens && !actor.ghost ? 1 : -1) * 0.12));
      if (!fr.rig.a.lens || actor.ghost || a.torchK <= 0 || on <= 0 || (actor.y || 0) < -4) { a.torch = null; continue; }
      const lens = toWorld(fr, fr.rig.a.lens), dir = fr.flip ? -1 : 1, sway = actor.moving ? Math.round(Math.sin(t * 7) * 1.5) : 0;
      a.torch = { x0: lens[0] + dir, y0: lens[1], x1: lens[0] + dir * (actor.moving ? 34 : 26), y1: FEET - 1 + sway, k: a.torchK * on };
    }
  }

  function fishSprite(species, rising, left) {
    const key = species + (rising ? "u" : "d") + (left ? "l" : "r");
    let img = fishCache.get(key);
    if (!img) {
      // El icono sube en diagonal (morro arriba a la derecha). Al caer se gira
      // un cuarto de vuelta para entrar de morro sin quedar boca abajo.
      img = catchSprite(species);
      if (!rising) img = turned(img);
      if (left) img = flipped(img);
      fishCache.set(key, img);
    }
    return img;
  }

  function draw() {
    if (!L) return;
    const S = sprites(), G = P.grass, wind = state.windNow || 0.5, rain = raining();
    // (un relampago lo deja todo a plena luz un instante)
    const flashing = flash > 0.38 || (flash > 0.2 && flash < 0.28);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H + WORLD_TOP);
    // Todo se dibuja con el mundo WORLD_TOP filas mas abajo (encima, el margen para volar).
    const sx = t < shakeUntil ? Math.round((Math.random() * 2 - 1) * shakeAmt) : 0, sy = t < shakeUntil ? Math.round((Math.random() * 2 - 1) * shakeAmt) : 0;
    g.setTransform(1, 0, 0, 1, sx, WORLD_TOP + sy);
    skyArt.draw(g, t, state.sky, state.scene, { flash: flashing, flashStart, cssWidth: W * ART });
    flashStart = false;
    seasonSkyLayer(g, sea, t, light.dark > 0.6);
    if (eventSky && eventSky.a > 0.01) { g.globalAlpha = Math.min(1, eventSky.a); rect(g, 0, 0, W, H, eventSky.c); g.globalAlpha = 1; }
    life.sky(g, lc);

    wg.clearRect(0, 0, W, H);
    wg.drawImage(base, 0, 0);
    life.snow.groundCover(wg, lc);
    if (wet > 0.35) for (const [p, w] of PUDDLES) drawPuddle(wg, L.X(p), w, Math.min(1, (wet - 0.35) * 3));
    for (const d of ["far", "near"]) for (const tree of trees) {
      if (tree.d !== d) continue;
      const a = tree.art, x = tree.x - Math.floor(a.w / 2), y = TREE_BASE[d] - a.h + 1, sw = swayAt(t, tree.x, wind);
      drawSway(wg, a.c, x, y, a.ch, sw);
      // la nieve acumulada en la copa se mece con ella
      const cap = life.snow.cap(a.c);
      if (cap) drawSway(wg, cap, x, y, a.ch, sw);
    }
    for (const f of flowers) {
      const sw = swayAt(t, f.x, wind) < 0 ? -1 : 0;
      for (let k = 0; k < f.stem; k++) px(wg, f.x, f.y - k, G[1]);
      px(wg, f.x + 1, f.y - 1, G[3]);
      wg.drawImage(S.flowers[f.type], f.x - 1 + sw, f.y - f.stem - 2);
    }
    for (const bush of bushes) {
      const img = bush.art, x = bush.x - Math.floor(img.width / 2), y = PATH - img.height + 1, half = Math.floor(img.height / 2);
      const sw = swayAt(t, bush.x, wind) < 0 ? -1 : 0;
      wg.drawImage(img, 0, 0, img.width, half, x + sw, y, img.width, half);
      wg.drawImage(img, 0, half, img.width, img.height - half, x, y + half, img.width, img.height - half);
    }
    // La hierba del borde va antes que farolas, puesto y hoguera: nunca los tapa.
    const tuftLean = (tuft) => (swayAt(t, tuft.x, wind) < 0 || Math.sin(t * 3 + tuft.p) > 0.9 ? -1 : 0);
    for (const tuft of tufts) if (!tuft.lane) drawTuft(wg, tuft, tuftLean(tuft), false);
    const lampCap = life.snow.cap(S.lamp), standImg = state.market.open ? S.stand : S.standClosed, standCap = life.snow.cap(standImg);
    for (const lx of L.lamps) { wg.drawImage(S.lamp, lx - 5, LAMP_TOP); if (lampCap) wg.drawImage(lampCap, lx - 5, LAMP_TOP); }
    wg.drawImage(standImg, L.standX, STAND_TOP);
    if (standCap) wg.drawImage(standCap, L.standX, STAND_TOP);
    wg.drawImage(S.camp, L.fireX - 12, 76 - 7);
    seasonWorld(wg, sea, t);
    lc.t = t;
    life.ground(wg, lc);
    for (const p of parts) if (p.k === "smoke") {
      wg.globalAlpha = Math.min(1, p.life / p.max) * 0.55;
      const sz = p.life > p.max * 0.5 ? 2 : 3;
      rect(wg, Math.round(p.x), Math.round(p.y), sz, sz, rain ? "#c9ced6" : "#d8d4cc");
      wg.globalAlpha = 1;
    }
    // Hierba del sendero: se aplasta bajo los pies de Buddy y las visitas.
    const underFoot = (tuft) => state.actors.some((w) => (w.y || 0) > -4 && Math.abs(w.x - tuft.x) < 10);
    for (const tuft of tufts) if (tuft.lane && underFoot(tuft)) drawTuft(wg, tuft, 0, true);
    // Buddy y las visitas: sombra en el suelo y el muñeco (las visitas, mas tenues).
    // (lo que esta tan alto que no cabe en el lienzo lo pinta el DOM de ScreenBuddy)
    const frames = state.actors.filter((actor) => !actor.aloft && actor.tent !== "in").map((actor) => ({ actor, fr: actorFrame(actor, false) })).filter((entry) => entry.fr && entry.fr.alpha > 0);
    aimTorches(frames);
    for (const { actor, fr } of frames) {
      const w = actor.ghost ? 7 : Math.max(3, 9 - Math.round(fr.lift * 0.6) - Math.round(-(actor.y || 0) / 6));
      const x = Math.round(actor.x) + (fr.pose.pose === "sit" || fr.pose.pose === "stick" ? -2 * actor.dir : 0);
      wg.globalAlpha = fr.alpha * (fr.pose.dissolve ?? 1);
      wg.fillStyle = actor.ghost ? "rgba(60,70,140,.18)" : "rgba(20,28,12,.28)";
      wg.fillRect(x - w, FEET + 1, w * 2 + 1, 1); wg.fillRect(x - w + 2, FEET + 2, w * 2 - 3, 1);
      wg.globalAlpha = 1;
    }
    env.t = t;
    for (const spot of spots) drawSpot(wg, spot);
    for (const { actor } of frames) for (const ev of EVENTS) if (ev.ground) ev.ground(wg, actor, anim.get(actor.id), env);
    // El bocadillo DOM va 68 px por encima de los pies: lo que pase de ahi
    // (gorro, captura en alto, pajaro, paraguas) lo empuja hacia arriba.
    bubbleLifts.clear();
    for (const { actor, fr } of frames) {
      let top = fr.top + RIG_OY + fr.rig.top;
      for (const ev of EVENTS) { const y = ev.top ? ev.top(actor, anim.get(actor.id), fr, env) : null; if (y != null) top = Math.min(top, y); }
      bubbleLifts.set(actor.id, Math.max(0, (FEET + 1 - top) * 2 - 68));
    }
    // Lo que asoma por encima del mundo (paracaidas, arrastrado en alto) va
    // despues, en el margen de arriba y sin la luz del mundo.
    const aloft = ({ fr }) => fr.top + fr.rig.top - 26 < 0;
    const drawActor = (target, { actor, fr }) => {
      for (const ev of EVENTS) if (ev.behind) ev.behind(target, actor, anim.get(actor.id), fr, env);
      blit(target, fr.rig.c, fr.left, fr.top, fr.flip, fr.alpha);
      for (const ev of EVENTS) if (ev.front) ev.front(target, actor, anim.get(actor.id), fr, env);
    };
    // Capa de delante: Buddy, las visitas, las ranas, la hierba que pisan y el pez.
    ag.clearRect(0, 0, W, H);
    life.under(ag, lc);
    for (const entry of frames) if (entry.actor.ghost && !aloft(entry)) blit(ag, entry.fr.rig.c, entry.fr.left, entry.fr.top, entry.fr.flip, entry.fr.alpha);
    for (const entry of frames) if (!entry.actor.ghost && !aloft(entry)) drawActor(ag, entry);
    if (resident) {
      const img = resident.hopT >= 0 ? S.frogHop : (Math.sin(t * 0.8 + 1) > 0.97 ? S.frogBlink : S.frog);
      blit(ag, img, Math.round(resident.x) - 4, 73 - Math.round(resident.hop), resident.dir < 0);
      if (resident.croak > t) { const cx = resident.dir < 0 ? Math.round(resident.x) - 6 : Math.round(resident.x) + 4; rect(ag, cx, 75, 3, 2, "#e6f2b0"); px(ag, cx + 1, 74, "#e6f2b0"); }
    }
    for (const frog of frogs) blit(ag, frog.hopT >= 0 ? S.frogHop : S.frog, Math.round(frog.x) - 4, 73 - Math.round(frog.hop), frog.dir < 0, frog.alpha);
    for (const tuft of tufts) if (tuft.lane && !underFoot(tuft)) drawTuft(ag, tuft, tuftLean(tuft), false);
    life.front(ag, lc);
    const fish = state.fish;
    if (fish && fish.alpha > 0) {
      // Por debajo de la superficie del agua no se ve: sale y entra del agujero.
      const img = fishSprite(fish.species, fish.vy < 0, fish.dir < 0);
      ag.save(); ag.beginPath(); ag.rect(0, 0, W, WATER_Y + 1); ag.clip();
      blit(ag, img, fish.x - img.width / 2, fish.y - img.height / 2, false, fish.alpha);
      ag.restore();
    }

    // Luz: tinte de la hora y el tiempo, mas los charcos de luz. El mismo mapa
    // ilumina las dos capas.
    const lights = lightsFor();
    const lit = !flashing && (!light.plain || lights.length);
    if (lit) { lightRig.map(light.tint, lights); g.drawImage(lightRig.apply(wc, light.desat), 0, 0); }
    else g.drawImage(wc, 0, 0);
    skyArt.drawFog(g, t);

    // Lo que brilla por si mismo, entre el fondo y Buddy: farolas, cristal del
    // puesto, llamas, chispas y halos.
    if (light.lamps > 0) {
      L.lamps.forEach((lx, i) => { const k = light.lamps * life.lamps.level(i, t); if (k > 0.01) { g.globalAlpha = k; g.drawImage(S.lampLit, lx - 5, LAMP_TOP); } });
      g.globalAlpha = light.lamps;
      if (state.market.open) g.drawImage(S.standGlass, L.standX + 53, STAND_TOP + 30);
      g.globalAlpha = 1;
    }
    if (fire.level > 0.02) {
      // (las llamas menguan o crecen desde abajo con la hoguera)
      const img = S.flames[Math.floor(t * 8) % 4], h = Math.max(2, Math.round(img.height * fire.level)), w = Math.max(3, Math.round(img.width * (0.55 + 0.45 * fire.level)));
      g.drawImage(img, 0, 0, img.width, img.height, L.fireX - Math.floor(w / 2), 72 - h, w, h);
      if (fire.level > 0.3) for (const ex of [-3, 0, 3]) px(g, L.fireX + ex, 73, Math.sin(t * 9 + ex) > 0 ? "#ffc04a" : "#ff6a2a");
    }
    if (fire.out && (rain || t - fire.outAt < 25)) for (const ex of [-2, 2]) px(g, L.fireX + ex, 72, Math.sin(t * 3 + ex) > 0.3 ? "#b84a2a" : "#6a3a2a");
    for (const p of parts) if (p.k === "spark") px(g, Math.round(p.x), Math.round(p.y), p.life > 0.5 ? "#fff3b0" : "#ffb347");
    if (light.dark > 0.5) {
      const fl = 1 + Math.sin(t * 13) * 0.06, k = (light.dark - 0.5) * 2;
      if (fire.level > 0.05) { halo(g, L.fireX, 64, 16 * fl * (0.5 + 0.5 * fire.level), "255,170,90", 0.07 * k * fire.level); halo(g, L.fireX, 64, 8 * fl, "255,200,120", 0.08 * k * fire.level); }
      L.lamps.forEach((lx, i) => { const on = light.lamps * life.lamps.level(i, t); if (on > 0.01) { halo(g, lx, LAMP_TOP + 5, 9, "255,210,140", 0.06 * k * on); halo(g, lx, LAMP_TOP + 5, 4, "255,230,170", 0.08 * k * on); } });
    }
    if (state.market.hover) { g.globalAlpha = 0.85; g.drawImage(S.standHover, L.standX - 1, STAND_TOP - 1); g.globalAlpha = 1; }
    life.glow(g, lc);
    // Lo que los eventos ponen entre el fondo y Buddy con su propia luz (el
    // leviatan y el kraken, que pueden salir por encima del cielo).
    env.light = light;
    for (const { actor } of frames) for (const ev of EVENTS) if (ev.backdrop) ev.backdrop(g, actor, anim.get(actor.id), env);

    g.drawImage(lit ? lightRig.apply(ac, light.desat) : ac, 0, 0);
    // (lo que brilla en la capa de Buddy: el farol del pescador)
    life.after(g, lc);
    for (const entry of frames) if (aloft(entry)) drawActor(g, entry);
    // Ojos, LEDs y farol: lo que brilla de Pip va por encima de la luz. En el
    // mismo orden que los cuerpos (visitas detras, Buddy delante): antes de
    // poner los ojos de uno se borra su silueta, asi no asoman por encima los
    // de quien pasa por detras.
    gg.setTransform(1, 0, 0, 1, 0, 0);
    gg.clearRect(0, 0, W, H + WORLD_TOP);
    gg.setTransform(1, 0, 0, 1, sx, WORLD_TOP + sy);
    const ordered = [...frames.filter((entry) => entry.actor.ghost), ...frames.filter((entry) => !entry.actor.ghost)];
    for (const { actor, fr } of ordered) {
      // (cruzando la puerta de la tienda, la lona le tapa tambien los ojos)
      const ta = anim.get(actor.id);
      if (ta?.tentPhase && behindTent(ta.tentPhase, t - ta.tentSince)) continue;
      const glow = actorFrame(actor, true);
      if (!glow) continue;
      gg.globalCompositeOperation = "destination-out";
      blit(gg, fr.rig.c, fr.left, fr.top, fr.flip, fr.alpha);
      gg.globalCompositeOperation = "source-over";
      blit(gg, glow.rig.c, glow.left, glow.top, glow.flip, glow.alpha);
      // Un halo suave alrededor de la pantalla de Pip cuando oscurece
      if (light.dark > 0.3 && !actor.ghost) { const fc = toWorld(glow, glow.rig.a.head), k = Math.min(1, (light.dark - 0.3) / 0.4); halo(gg, fc[0], fc[1] + 1, 7, "70,255,170", 0.05 * k); halo(gg, fc[0], fc[1] + 1, 4, "120,255,200", 0.06 * k); }
      const burn = glow.pose.rocketBurn || (glow.hoverH > 1 ? 1 : 0);
      if (burn) { const flick = Math.floor(t * 14) % 2; for (const ft of [glow.rig.a.feet, glow.rig.a.feetB]) drawJet(gg, toWorld(glow, ft), flick, burn === 2); }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(gc, 0, 0);
    g.setTransform(1, 0, 0, 1, sx, WORLD_TOP + sy);
    const nFlies = Math.round(flies.length * light.fireflies);
    for (let i = 0; i < nFlies; i++) {
      const f = flies[i];
      if (f.b < 0.15) continue;
      const x = Math.round(f.x), y = Math.round(f.y);
      if (f.b > 0.55) { g.globalAlpha = 0.35 * f.b; rect(g, x - 1, y - 1, 3, 3, "#d8ff7a"); g.globalAlpha = 1; }
      px(g, x, y, f.b > 0.5 ? "#f4ffb8" : "#b8e05a");
    }
    for (const p of parts) {
      if (p.k === "coin") { rect(g, Math.round(p.x), Math.round(p.y), 2, 2, "#ffd166"); px(g, Math.round(p.x), Math.round(p.y), "#fff0af"); }
      else if (p.k === "z") { g.globalAlpha = Math.min(1, p.life / p.max * 1.6); g.drawImage(S.zed, Math.round(p.x + Math.sin(t * 2 + p.wob) * 1.5), Math.round(p.y)); g.globalAlpha = 1; }
      else if (p.k === "drop") px(g, Math.round(p.x), Math.round(p.y), p.c);
      else if (p.k === "steam") { g.globalAlpha = Math.min(0.7, p.life / p.max); px(g, Math.round(p.x + Math.sin(t * 3 + p.y) * 0.8), Math.round(p.y), "#e6eef0"); g.globalAlpha = 1; }
      else if (p.k === "dust") { g.globalAlpha = Math.min(1, p.life * 2.5); rect(g, Math.round(p.x), Math.round(p.y), 2, 1, p.c); g.globalAlpha = 1; }
      else if (p.k === "pix1") { g.globalAlpha = Math.min(1, p.life * 2); px(g, Math.round(p.x), Math.round(p.y), p.c); g.globalAlpha = 1; }
      else if (p.k === "conf") { const fl = Math.floor(t * 8 + p.x) % 2; rect(g, Math.round(p.x), Math.round(p.y), fl ? 2 : 1, fl ? 1 : 2, p.c); }
      else if (p.k === "feather") { g.globalAlpha = Math.min(1, p.life); rect(g, Math.round(p.x + Math.sin(t * 6 + p.x) * 1.5), Math.round(p.y), 2, 1, p.c); g.globalAlpha = 1; }
      else if (p.k === "note") { const x = Math.round(p.x), y = Math.round(p.y); g.globalAlpha = Math.min(1, p.life * 2); rect(g, x, y - 3, 1, 3, "#1a2430"); rect(g, x - 1, y, 2, 1, "#1a2430"); px(g, x + 1, y - 3, "#1a2430"); g.globalAlpha = 1; }
      else if (p.k === "star") { const x = Math.round(p.x), y = Math.round(p.y); px(g, x, y, "#fff6cf"); px(g, x - 1, y, "#ffd166"); px(g, x + 1, y, "#ffd166"); px(g, x, y - 1, "#ffd166"); }
      else if (p.k === "splash") { const a = p.life > p.max / 2; px(g, p.x - (a ? 1 : 2), p.y - (a ? 1 : 2), "#d8e6f5"); px(g, p.x + (a ? 1 : 2), p.y - (a ? 1 : 2), "#d8e6f5"); }
      else if (p.k === "ripple") { const r = p.life > p.max / 2 ? 1 : 3; px(g, p.x - r, p.y, "#c5dcf0"); px(g, p.x + r, p.y, "#c5dcf0"); if (r > 1) { px(g, p.x - 1, p.y - 1, "#9fbcd8"); px(g, p.x + 1, p.y - 1, "#9fbcd8"); } }
    }
    if (drops.length) {
      g.globalAlpha = 0.7;
      for (const d of drops) { const x = Math.round(d.x), y = Math.round(d.y); if (y < 3) continue; rect(g, x, y - 1, 1, 2, "#c4d3e6"); px(g, x + 1, y - 2, "#c4d3e6"); }
      g.globalAlpha = 1;
    }
    for (const f of flakes) { const x = Math.round(f.x), y = Math.round(f.y); if (y < 1) continue; if (f.s > 1) rect(g, x, y, 2, 2, "#ffffff"); else px(g, x, y, "#f4f9ff"); }
    if (light.dark < 0.4 && !rain) for (const b of bflies) blit(g, S.butterflies[b.c][b.f], Math.round(b.x) - 1, Math.round(b.y), b.dir < 0);
    if (flash > 0.38 || (flash > 0.2 && flash < 0.28)) { g.globalAlpha = 0.25; rect(g, 0, 0, W, H, "#ffffff"); g.globalAlpha = 1; }
    for (const { actor, fr } of frames) for (const ev of EVENTS) if (ev.overlay) ev.overlay(g, actor, anim.get(actor.id), fr, env);
    seasonOverlay(g, sea, t, WORLD_TOP + sy);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Buddy enciende la hoguera: chispas, una bocanada de humo y la llama crece.
  function relightFire() {
    if (!fire.out || !L) return;
    fire.out = false; fire.level = 0.05; fire.relightAt = t;
    for (let i = 0; i < 12; i++) spawn({ k: "spark", x: L.fireX + (Math.random() - 0.5) * 8, y: 70, vx: (Math.random() - 0.5) * 24, vy: -14 - Math.random() * 16, life: 0.5 + Math.random() * 0.5 });
    for (let i = 0; i < 3; i++) spawn({ k: "smoke", x: L.fireX + (Math.random() - 0.5) * 4, y: 66, vx: (Math.random() - 0.5) * 4, vy: -6, life: 2, max: 2 });
  }

  return {
    state, build, setSeason, update, draw, splash, impact, wish, waterSpot, splashSpot, rainFrogs, bubbleLifts, relightFire, raining,
    flock: (kind, dir) => skyArt.flock(kind, dir),
    life,
    // (pruebas) el contexto que reciben los modulos de life/
    get lifeCtx() { return lc; },
    // El cursor sobre el lienzo, en px de arte (los pajaritos se asustan).
    pointer(x, y) { state.pointer = x == null ? null : { x, y, at: performance.now() }; },
    // Farolas: cuales faltan por cambiar ([{ i, x }]) y que Pip cambie una.
    lampsPending: () => life.lamps.pending(),
    get lampsWant() { return life.lamps.want; },
    switchLamp: (i, on) => life.lamps.switch(lc, i, on),
    // Forraje del dia: ponerlo y recogerlo.
    setForage: (list) => life.forage.set(list),
    pickForage: (slot) => life.forage.pick(slot, lc),
    // El huerto: lo plantado y lo regado hoy, Pip arranca una planta o riega.
    setGarden: (plots, watered) => life.garden.set(plots, watered),
    pullPlot: (plot) => life.garden.pull(plot, lc),
    soakPlot: (plot, amount) => life.garden.soak(plot, amount),
    get fireOut() { return fire.out; },
    get layout() { return L; },
    get width() { return W; }
  };
}
