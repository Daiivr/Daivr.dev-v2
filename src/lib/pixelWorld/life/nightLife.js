import { gridSprite, halo, lazy, outlinedSprite, px } from "../core.js";
import { between } from "./util.js";

// La noche del valle: un buho en lo alto de la farola de la derecha (parpadea,
// gira la cabeza a un lado y a veces del todo, con los ojos que brillan) y, al
// anochecer, murcielagos que revolotean por encima de los arboles.
const OWL = { b: "#6a4a30", B: "#8a6440", l: "#b88a5a", f: "#d8b888", F: "#c8a070", y: "#ffd84a", k: "#1a1008", e: "#3a2a1a", w: "#e8d8b8", t: "#c89a3a" };
const OWL_ROWS = {
  open: [".b...b.", "bBBBBBb", "BfffffB", "FyfkfyF", "BffeffB", "BlwwwlB", "BwlwlwB", "BlwlwlB", ".BBBBB.", ".t.t.t."],
  blink: [".b...b.", "bBBBBBb", "BfffffB", "FFfkfFF", "BffeffB", "BlwwwlB", "BwlwlwB", "BlwlwlB", ".BBBBB.", ".t.t.t."],
  side: [".b..b..", "bBBBBb.", "BBffffB", "BFfyfkB", "BBffefB", "BlwwwlB", "BwlwlwB", "BlwlwlB", ".BBBBB.", ".t.t.t."],
  back: [".b...b.", "bBBBBBb", "BBlBlBB", "BlBBBlB", "BBlBlBB", "BlBlBlB", "BBlBlBB", "BlBlBlB", ".BBBBB.", ".t.t.t."],
  // (esponjado: las plumas del borde se erizan)
  puff: [".b...b.", "bBBBBBb", "BfffffB", "FyfkfyF", "BffeffB", "lBwwwBl", "BwlwlwB", "lBlwlBl", ".BBBBB.", ".t.t.t."]
};
const owlSprites = lazy(() => Object.fromEntries(Object.entries(OWL_ROWS).map(([k, rows]) => [k, outlinedSprite(rows, OWL, "#2a1a0e")])));
// Donde estan los ojos en cada pose (para que brillen por encima de la luz).
const OWL_EYES = { open: [[1, 3], [5, 3]], puff: [[1, 3], [5, 3]], side: [[3, 3]] };
const BAT = { b: "#1a1424", w: "#2e2440" };
const batSprites = lazy(() => [
  gridSprite(["w.....w", "ww.b.ww", "..wbw..", "...w..."], BAT),
  gridSprite([".......", "..wbw..", "wwwbwww", "w.....w"], BAT)
]);

export function createNightLife() {
  let owl = null, bats = [], nextBats = 6;

  function setup(ctx) {
    const lamps = ctx.L.lamps;
    owl = lamps.length ? { x: lamps[lamps.length - 1], alpha: 0, pose: "open", until: 0, next: ctx.t + 3 } : null;
    bats = []; nextBats = ctx.t + 6;
  }

  function update(ctx) {
    const { t, dt } = ctx, night = ctx.light.dark > 0.62 && !ctx.rain;
    if (owl) {
      owl.alpha = Math.max(0, Math.min(1, owl.alpha + (night ? 1 : -1) * dt / 2.5));
      if (t > owl.until) owl.pose = "open";
      if (owl.alpha > 0 && t > owl.next) {
        const r = Math.random();
        if (r < 0.55) { owl.pose = "blink"; owl.until = t + 0.16; owl.next = t + between(2.5, 5); }
        else if (r < 0.82) { owl.pose = "side"; owl.until = t + between(1, 2.2); owl.next = owl.until + between(1.5, 4); }
        else if (r < 0.94) { owl.pose = "back"; owl.until = t + between(0.8, 1.4); owl.next = owl.until + between(2, 5); }
        else { owl.pose = "puff"; owl.until = t + 0.6; owl.next = t + between(3, 6); }
      }
    }
    // Murcielagos: al anochecer a menudo, de noche de vez en cuando.
    const dusk = ctx.sky.phase === "dusk" || (ctx.sky.phase === "night" && ctx.light.dark < 0.9);
    if ((dusk || ctx.sky.phase === "night") && !ctx.rain && !ctx.reduceMotion && t > nextBats && bats.length < 4) {
      nextBats = t + (dusk ? between(9, 18) : between(25, 45));
      const n = 1 + Math.floor(Math.random() * 3), dir = Math.random() < 0.5 ? -1 : 1, y0 = between(14, 38);
      for (let i = 0; i < n; i++) bats.push({ x: dir > 0 ? -10 - i * between(8, 16) : ctx.W + 10 + i * between(8, 16), y: y0 + between(-6, 6), dir, v: between(30, 44), ph: Math.random() * 6, jx: 0, jy: 0, nj: 0 });
    }
    for (const b of bats) {
      // vuelo nervioso: cambia de rumbo a tirones
      if (t > b.nj) { b.nj = t + between(0.15, 0.4); b.jx = between(-12, 12); b.jy = between(-14, 14); }
      b.x += (b.dir * b.v + b.jx) * dt;
      b.y += (b.jy + Math.sin(t * 7 + b.ph) * 8) * dt;
      b.y = Math.max(6, Math.min(46, b.y));
    }
    bats = bats.filter((b) => b.x > -30 && b.x < ctx.W + 30);
  }

  const owlY = (ctx) => ctx.lampTop - 11;
  return {
    setup, update,
    // en el cielo, detras de los arboles
    sky(g, ctx) {
      const S = batSprites();
      for (const b of bats) { const img = S[Math.floor(ctx.t * 12 + b.ph) % 2]; g.drawImage(img, Math.round(b.x) - 3, Math.round(b.y) - 2); }
    },
    // el buho, con el fondo (le da la luz de la noche)
    ground(g, ctx) {
      if (!owl || owl.alpha <= 0) return;
      g.globalAlpha = owl.alpha;
      g.drawImage(owlSprites()[owl.pose], owl.x - 4, owlY(ctx));
      g.globalAlpha = 1;
    },
    // sus ojos brillan
    glow(g, ctx) {
      if (!owl || owl.alpha < 0.3) return;
      const eyes = OWL_EYES[owl.pose];
      if (!eyes) return;
      for (const [ex, ey] of eyes) { const x = owl.x - 4 + 1 + ex, y = owlY(ctx) + 1 + ey; px(g, x, y, "#ffe878"); halo(g, x, y, 2, "255,220,90", 0.12 * owl.alpha); }
    },
    get owlLamp() { return owl && owl.alpha > 0.2 ? owl.x : null; },
    // (pruebas)
    testBats(ctx) { nextBats = 0; }
  };
}
