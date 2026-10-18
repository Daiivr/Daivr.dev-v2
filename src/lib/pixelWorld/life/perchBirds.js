import { BIRD_ANCHOR, PERCH_FEET, birdSprites } from "../birds.js";
import { FEET } from "../layout.js";
import { between, natureSeason, topContour } from "./util.js";

// Pajaritos que bajan al valle, como los de Stardew: llegan volando en grupo
// pequeño, se posan en el sendero (dan saltitos, picotean y miran a los
// lados), en lo alto de una farola o en el tejado del puesto, y salen en
// desbandada cuando Pip pasa cerca o el cursor se les acerca. Al rato, o si
// llueve u oscurece, se van solos.
const KINDS = { spring: [["sparrow", 0.65], ["bluebird", 0.35]], summer: [["sparrow", 0.55], ["bluebird", 0.45]], autumn: [["sparrow", 1]], winter: [["cardinal", 0.55], ["sparrow", 0.45]] };
const WING = ["up", "mid", "down", "mid"];
const FLAP = 3.6;

function pick(list) {
  let r = Math.random();
  for (const [kind, w] of list) { r -= w; if (r <= 0) return kind; }
  return list[0][0];
}

export function createPerchBirds() {
  let birds = [], next = 14, roof = [], group = 0;

  function setup(ctx) {
    birds = []; next = ctx.t + 14;
    // Sitios del tejado del puesto donde cabe un pajaro (tramos llanos).
    const top = ctx.standImg ? topContour(ctx.standImg) : [];
    roof = [];
    for (let x = 6; x < top.length - 6; x += 7) if (top[x] != null && Math.abs(top[x] - (top[x - 2] ?? 99)) <= 1 && Math.abs(top[x] - (top[x + 2] ?? 99)) <= 1) roof.push({ type: "roof", x: ctx.L.standX + x, y: ctx.standTop + top[x] - 1 });
  }

  const taken = (spot) => birds.some((b) => b.spot.type === spot.type && Math.abs(b.spot.x - spot.x) < 4);
  function clearOf(ctx, x) {
    if (Math.abs(x - ctx.L.fireX) < 16) return false;
    if (ctx.holes.some((hx) => Math.abs(hx - x) < 22)) return false;
    return !ctx.actors.some((a) => !a.ghost && Math.abs(a.x - x) < 50);
  }

  function spawn(ctx) {
    const kind = pick(KINDS[natureSeason(ctx.season)] || KINDS.spring), r = Math.random(), spots = [];
    group += 1;
    if (r < 0.55) {
      let base = 0;
      for (let i = 0; i < 12 && !base; i++) { const x = between(20, ctx.W - 20); if (clearOf(ctx, x)) base = x; }
      if (!base) return;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) spots.push({ type: "ground", x: base + i * between(6, 11) * (Math.random() < 0.5 ? -1 : 1), y: FEET - Math.floor(Math.random() * 2) });
    } else if (r < 0.8) {
      const free = ctx.L.lamps.map((x) => ({ type: "lamp", x, y: ctx.lampTop - 1 })).filter((s) => !taken(s) && !(ctx.owlLamp === s.x && ctx.light.dark > 0.5));
      if (!free.length) return;
      spots.push(free[Math.floor(Math.random() * free.length)]);
    } else {
      const free = roof.filter((s) => !taken(s));
      for (let i = 0; i < Math.min(free.length, 1 + Math.floor(Math.random() * 2)); i++) spots.push(free.splice(Math.floor(Math.random() * free.length), 1)[0]);
    }
    const side = Math.random() < 0.5 ? -1 : 1;
    spots.forEach((spot, i) => {
      const from = { x: spot.x - side * between(90, 150), y: between(-6, 14) };
      birds.push({ kind, spot, group, mode: "in", t0: ctx.t + i * between(0.15, 0.4), dur: between(1.7, 2.4), from, x: from.x, y: from.y, dir: side, act: "", actUntil: 0, nextAct: 0, leaveAt: ctx.t + between(35, 75), p: Math.random(), fleeAt: 0, hop: null });
    });
  }

  // Salen volando, lejos de lo que los asusto (o hacia arriba si es calma).
  function takeOff(b, ctx, away, calm) {
    if (!calm) for (let i = 0; i < 2; i++) ctx.spawn({ k: "feather", x: b.x, y: b.y - 2, vx: (Math.random() - 0.5) * 10, vy: -4, g: 8, life: 0.9, c: "#c8a878" });
    b.mode = "out"; b.t0 = ctx.t;
    b.dir = away || (Math.random() < 0.5 ? -1 : 1);
    b.vx = b.dir * between(calm ? 30 : 48, calm ? 45 : 70); b.vy = -between(calm ? 22 : 40, calm ? 32 : 58);
  }
  function scare(ctx, b, away) {
    for (const o of birds) if (o.group === b.group && (o.mode === "ground" || o.mode === "perch") && !o.fleeAt) { o.fleeAt = ctx.t + (o === b ? 0 : between(0.05, 0.25)); o.fleeDir = away; }
  }

  function update(ctx) {
    const { t, dt } = ctx, calmDay = ctx.light.dark < 0.45 && !ctx.rain;
    if (!birds.length && calmDay && t > next && !ctx.reduceMotion) spawn(ctx);
    for (const b of birds) {
      if (b.mode === "in") {
        const p = Math.max(0, Math.min(1, (t - b.t0) / b.dur)), e = 1 - (1 - p) * (1 - p);
        const cx = (b.from.x + b.spot.x) / 2, cy = Math.min(b.from.y, b.spot.y) - 18;
        b.x = (1 - e) * (1 - e) * b.from.x + 2 * (1 - e) * e * cx + e * e * b.spot.x;
        b.y = (1 - e) * (1 - e) * b.from.y + 2 * (1 - e) * e * cy + e * e * (b.spot.y - 3);
        b.dir = b.spot.x >= b.from.x ? 1 : -1;
        if (p >= 1) { b.mode = b.spot.type === "ground" ? "ground" : "perch"; b.x = b.spot.x; b.y = b.spot.y; b.nextAct = t + between(0.3, 1); }
        continue;
      }
      if (b.mode === "out") {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy *= 1 - dt * 0.4;
        continue;
      }
      // Posados: miedo (Pip cerca, el cursor encima), o se van solos.
      if (b.fleeAt && t >= b.fleeAt) { takeOff(b, ctx, b.fleeDir, false); continue; }
      if (!b.fleeAt) {
        const reach = b.mode === "ground" ? 22 : 9;
        const near = ctx.actors.find((a) => !a.ghost && !a.aloft && (a.y || 0) > -20 && Math.abs(a.x - b.x) < reach && (b.mode === "ground" || a.moving || Math.abs(a.x - b.x) < 5));
        if (near) scare(ctx, b, b.x >= near.x ? 1 : -1);
        else if (ctx.pointer && Math.hypot(ctx.pointer.x - b.x, ctx.pointer.y - (b.y - 3)) < 16) scare(ctx, b, b.x >= ctx.pointer.x ? 1 : -1);
        else if (!calmDay || t > b.leaveAt) { takeOff(b, ctx, 0, true); continue; }
      }
      if (b.hop) {
        const k = Math.min(1, (t - b.hop.t0) / 0.22);
        b.x = b.hop.x0 + (b.hop.x1 - b.hop.x0) * k; b.y = b.spot.y - Math.sin(k * Math.PI) * 2;
        if (k >= 1) { b.hop = null; b.spot = { ...b.spot, x: b.x }; b.y = b.spot.y; }
      } else if (t > b.nextAct) {
        const r = Math.random();
        b.act = ""; b.nextAct = t + between(0.6, 2.2);
        if (b.mode === "ground" && r < 0.4) { b.act = "peck"; b.actUntil = t + between(0.4, 0.8); }
        else if (b.mode === "ground" && r < 0.72) {
          const step = between(3, 6) * (Math.random() < 0.7 ? b.dir : -b.dir), x1 = Math.max(8, Math.min(ctx.W - 8, b.x + step));
          if (Math.abs(x1 - ctx.L.fireX) > 14) { b.dir = x1 > b.x ? 1 : -1; b.hop = { t0: t, x0: b.x, x1 }; }
        } else if (r < 0.88) b.dir = -b.dir;
        else { b.act = "peck"; b.actUntil = t + 0.3; }
      }
    }
    const before = birds.length;
    birds = birds.filter((b) => b.mode !== "out" || (b.x > -30 && b.x < ctx.W + 30 && b.y > -30));
    if (before && !birds.length) next = t + between(40, 80);
  }

  function sprite(b, t) {
    const set = birdSprites()[b.kind].day[b.dir < 0 ? "left" : "right"];
    if (b.mode === "ground" || b.mode === "perch") {
      const pose = b.act === "peck" && t < b.actUntil && Math.floor(t * 8) % 2 ? "peck" : b.hop ? "mid" : "sit";
      return { img: set[pose === "mid" ? "sit" : pose], perched: true };
    }
    const late = b.mode === "in" && t - b.t0 > b.dur * 0.82;
    return { img: set[late ? "up" : WING[Math.floor((t * FLAP * (b.mode === "out" ? 1.6 : 1) + b.p) * 4) % 4]], perched: false };
  }
  function drawBird(g, b, t) {
    const { img, perched } = sprite(b, t);
    const x = Math.round(b.x) - Math.floor(img.width / 2);
    if (perched) {
      if (b.mode === "ground") { g.fillStyle = "rgba(20,28,12,.25)"; g.fillRect(Math.round(b.x) - 2, b.spot.y + 1, 5, 1); }
      g.drawImage(img, x, Math.round(b.y) - PERCH_FEET[b.kind]);
    } else g.drawImage(img, x, Math.round(b.y) - BIRD_ANCHOR[b.kind]);
  }

  return {
    setup, update,
    // farolas y tejado (con el fondo, despues de las farolas y el puesto)
    ground(g, ctx) { for (const b of birds) if (b.mode === "perch") drawBird(g, b, ctx.t); },
    // en el sendero, detras de Pip
    under(g, ctx) { for (const b of birds) if (b.mode === "ground") drawBird(g, b, ctx.t); },
    // volando, por delante
    front(g, ctx) { for (const b of birds) if (b.mode === "in" || b.mode === "out") drawBird(g, b, ctx.t); },
    get count() { return birds.length; },
    get list() { return birds; },
    // (pruebas) que bajen ya
    test(ctx) { birds = []; spawn(ctx); }
  };
}
