import { BIRD_ANCHOR, PERCH_FEET, birdSprites } from "../birds.js";
import { SOIL_TOP } from "./garden.js";
import { YARD_SPOTS } from "./yard.js";
import { between } from "./util.js";

// Los cuervos del huerto: de dia, con algo plantado, de vez en cuando baja una
// banda de dos o tres a picotear los bancales (dan saltitos y picotean) hasta
// que Pip va a espantarlos o el cursor se les acerca; entonces salen en
// desbandada. Con el espantapajaros puesto no se atreven: se acercan, se
// asustan a medio camino y se van (y a veces uno se posa en su sombrero un
// momento). FooterWorld le dice a Buddy cuando hay cuervos en el huerto.
const WING = ["up", "mid", "down", "mid"];
const FIRST_S = [70, 140], GAP_S = [180, 360], STAY_S = [40, 60];

// `garden`: el modulo del huerto (life/garden.js), por lo que hay plantado.
export function createCrows(garden) {
  let G = null, crows = [], next = 0;
  const yard = (ctx) => ctx.state?.yard || {};
  const planted = () => (garden?.plots || []).filter((plot) => plot.growth > 0.1);

  function spawn(ctx) {
    const beds = planted();
    if (!beds.length) return;
    const guarded = Boolean(yard(ctx).scarecrow), side = Math.random() < 0.5 ? -1 : 1, n = guarded ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
    const hat = guarded && Math.random() < 0.35;
    for (let i = 0; i < n; i++) {
      const bed = beds[i % beds.length], x = G.plots[bed.plot] + between(-4, 4);
      const spot = hat && i === 0 ? { x: G.x + YARD_SPOTS.scarecrow, y: 41, perch: true } : { x, y: SOIL_TOP + 1 };
      const from = { x: spot.x - side * between(110, 170), y: between(-8, 10) };
      crows.push({ spot, from, x: from.x, y: from.y, mode: "in", t0: ctx.t + i * between(0.2, 0.5), dur: between(1.8, 2.5), dir: side, p: Math.random(), act: "", actUntil: 0, nextAct: 0, leaveAt: ctx.t + between(...STAY_S), hop: null, scared: guarded && !(hat && i === 0), fleeAt: 0 });
    }
  }
  function takeOff(c, ctx, away, calm) {
    if (!calm) for (let i = 0; i < 2; i++) ctx.spawn({ k: "feather", x: c.x, y: c.y - 2, vx: (Math.random() - 0.5) * 10, vy: -4, g: 8, life: 0.9, c: "#3a3a48" });
    c.mode = "out"; c.t0 = ctx.t; c.dir = away || (Math.random() < 0.5 ? -1 : 1);
    c.vx = c.dir * between(calm ? 32 : 50, calm ? 46 : 72); c.vy = -between(calm ? 24 : 40, calm ? 34 : 60);
  }

  return {
    setup(ctx) { G = ctx.L.garden; crows = []; next = ctx.t + between(...FIRST_S); },
    update(ctx) {
      if (!G) return;
      const { t, dt } = ctx, calm = ctx.light.dark < 0.45 && !ctx.rain;
      if (!crows.length && calm && t > next && !ctx.reduceMotion) { spawn(ctx); next = t + between(...GAP_S); }
      for (const c of crows) {
        if (c.mode === "in") {
          const p = Math.max(0, Math.min(1, (t - c.t0) / c.dur)), e = 1 - (1 - p) * (1 - p);
          const cx = (c.from.x + c.spot.x) / 2, cy = Math.min(c.from.y, c.spot.y) - 16;
          c.x = (1 - e) * (1 - e) * c.from.x + 2 * (1 - e) * e * cx + e * e * c.spot.x;
          c.y = (1 - e) * (1 - e) * c.from.y + 2 * (1 - e) * e * cy + e * e * (c.spot.y - 3);
          c.dir = c.spot.x >= c.from.x ? 1 : -1;
          // (con el espantapajaros, a medio camino se lo piensan mejor)
          if (c.scared && p > 0.62) { takeOff(c, ctx, -c.dir, false); continue; }
          if (p >= 1) { c.mode = c.spot.perch ? "perch" : "ground"; c.x = c.spot.x; c.y = c.spot.y; c.nextAct = t + between(0.3, 1); if (c.spot.perch) c.leaveAt = t + between(3, 6); }
          continue;
        }
        if (c.mode === "out") { c.x += c.vx * dt; c.y += c.vy * dt; c.vy *= 1 - dt * 0.4; continue; }
        // posados: Pip o el cursor cerca los espanta (a todos), o se van solos
        if (c.fleeAt && t >= c.fleeAt) { takeOff(c, ctx, c.fleeDir, false); continue; }
        if (!c.fleeAt) {
          const near = ctx.actors.find((a) => !a.ghost && !a.aloft && Math.abs(a.x - c.x) < 24);
          const pointer = ctx.pointer && Math.hypot(ctx.pointer.x - c.x, ctx.pointer.y - (c.y - 3)) < 14;
          if (near || pointer) {
            const away = near ? (c.x >= near.x ? 1 : -1) : c.x >= ctx.pointer.x ? 1 : -1;
            for (const o of crows) if (o.mode === "ground" || o.mode === "perch") { o.fleeAt = t + (o === c ? 0 : between(0.05, 0.3)); o.fleeDir = away; }
            continue;
          }
          if (!calm || t > c.leaveAt) { takeOff(c, ctx, 0, true); continue; }
        }
        if (c.hop) {
          const k = Math.min(1, (t - c.hop.t0) / 0.22);
          c.x = c.hop.x0 + (c.hop.x1 - c.hop.x0) * k; c.y = c.spot.y - Math.sin(k * Math.PI) * 2;
          if (k >= 1) { c.hop = null; c.spot = { ...c.spot, x: c.x }; c.y = c.spot.y; }
        } else if (t > c.nextAct) {
          const r = Math.random();
          c.act = ""; c.nextAct = t + between(0.5, 1.8);
          if (c.mode === "ground" && r < 0.5) { c.act = "peck"; c.actUntil = t + between(0.4, 0.9); }
          else if (c.mode === "ground" && r < 0.75) {
            const x1 = Math.max(G.x + 4, Math.min(G.x + 52, c.x + between(3, 5) * (Math.random() < 0.5 ? -1 : 1)));
            c.dir = x1 > c.x ? 1 : -1; c.hop = { t0: t, x0: c.x, x1 };
          } else if (r < 0.9) c.dir = -c.dir;
        }
      }
      crows = crows.filter((c) => c.mode !== "out" || (c.x > -30 && c.x < ctx.W + 30 && c.y > -30));
    },
    // posados en los bancales o en el sombrero (con el huerto), y volando
    // (por delante)
    ground(g, ctx) { for (const c of crows) if (c.mode === "ground" || c.mode === "perch") draw(g, c, ctx.t); },
    front(g, ctx) { for (const c of crows) if (c.mode === "in" || c.mode === "out") draw(g, c, ctx.t); },
    // ¿hay cuervos picoteando? (x en px de arte)
    get raid() {
      const down = crows.filter((c) => c.mode === "ground" && !c.fleeAt);
      return down.length ? { x: down.reduce((sum, c) => sum + c.x, 0) / down.length, n: down.length } : null;
    },
    // (pruebas) que bajen ya
    test(ctx) { crows = []; spawn(ctx); }
  };
}

function draw(g, c, t) {
  const set = birdSprites().crow.day[c.dir < 0 ? "left" : "right"];
  if (c.mode === "ground" || c.mode === "perch") {
    const img = set[c.act === "peck" && t < c.actUntil && Math.floor(t * 8) % 2 ? "peck" : "sit"];
    if (c.mode === "ground") { g.fillStyle = "rgba(20,28,12,.25)"; g.fillRect(Math.round(c.x) - 2, c.spot.y + 1, 5, 1); }
    g.drawImage(img, Math.round(c.x) - Math.floor(img.width / 2), Math.round(c.y) - PERCH_FEET.crow);
    return;
  }
  const late = c.mode === "in" && t - c.t0 > c.dur * 0.82;
  const img = set[late ? "up" : WING[Math.floor((t * 3.6 * (c.mode === "out" ? 1.6 : 1) + c.p) * 4) % 4]];
  g.drawImage(img, Math.round(c.x) - Math.floor(img.width / 2), Math.round(c.y) - BIRD_ANCHOR.crow);
}
