import { TREE_BASE } from "../scenery.js";
import { between, natureSeason } from "./util.js";

// Hojas de otoño: los robles sueltan hojas naranjas, rojas y amarillas que
// caen meciendose, se quedan un rato en el prado y el sendero y se apagan. Con
// viento caen mas, llegan rodando desde un lado y las del suelo se arrastran.
const COLORS = [["#e8823a", "#f4a85a", "#a8532a"], ["#d0502a", "#e87a4a", "#8a2e1a"], ["#f2b440", "#ffd27a", "#b87a1a"], ["#c86a2a", "#e08a4a", "#7a3e18"]];
const MAX = 90;

export function createLeaves() {
  let leaves = [], oaks = [];

  function setup(ctx) {
    leaves = [];
    oaks = ctx.trees.filter((tree) => tree.k === "oak" && tree.d !== "back").map((tree) => {
      const a = tree.art, top = TREE_BASE[tree.d] - a.h + 1;
      return { x: tree.x, w: a.w * 0.7, top, h: a.h * 0.5, near: tree.d === "near", acc: Math.random() };
    });
  }

  function add(ctx, x, y, near, blow) {
    if (leaves.length >= MAX) return;
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    leaves.push({ x, y, vx: blow ? -between(22, 42) : 0, vy: between(5, 9), ph: Math.random() * 6, c, big: near || Math.random() < 0.4, rest: 0, land: between(61, 79), life: between(18, 34), age: 0, flip: Math.random() * 6, blow });
  }

  function update(ctx) {
    const { dt } = ctx;
    const on = natureSeason(ctx.season) === "autumn" && !ctx.reduceMotion;
    const windy = ctx.wind >= 1.3;
    if (on) {
      for (const oak of oaks) {
        oak.acc += dt * (oak.near ? 0.8 : 0.3) * (windy ? 2.2 : 1);
        while (oak.acc >= 1) { oak.acc -= 1; add(ctx, oak.x + between(-oak.w / 2, oak.w / 2), oak.top + between(4, oak.h), oak.near, false); }
      }
      // Con viento llegan rodando desde la derecha.
      if (windy && Math.random() < dt * 1.2) add(ctx, ctx.W + 4, between(56, 76), true, true);
    }
    for (const l of leaves) {
      l.age += dt;
      if (l.rest) {
        l.rest -= dt;
        // en el suelo: con viento se arrastran a saltitos
        if (windy && Math.random() < dt * 0.6) { l.slide = between(0.3, 0.7); }
        if (l.slide > 0) { l.slide -= dt; l.x -= (14 + ctx.wind * 8) * dt; l.y = l.land - (l.slide > 0.15 ? 1 : 0); }
        continue;
      }
      const gust = -ctx.wind * 9 + Math.sin(ctx.t * 1.7 + l.ph) * 7;
      l.x += (l.vx + gust) * dt;
      l.y += l.vy * dt * (0.8 + 0.4 * Math.sin(ctx.t * 3 + l.ph));
      if (l.blow) l.y += Math.sin(ctx.t * 6 + l.ph) * 0.4;
      if (l.y >= l.land) { l.y = l.land; l.rest = l.life; l.vx = 0; }
    }
    leaves = leaves.filter((l) => (l.rest === 0 || l.rest > 0) && l.x > -6 && l.x < ctx.W + 8 && !(l.rest < 0));
  }

  function drawLeaf(g, l, t, alpha) {
    const x = Math.round(l.x), y = Math.round(l.y), [base, light, dark] = l.c;
    g.globalAlpha = alpha;
    if (l.rest) {
      // tumbada: una mancha de dos o tres pixeles
      g.fillStyle = base; g.fillRect(x, y, l.big ? 3 : 2, 1);
      g.fillStyle = dark; g.fillRect(x + (l.big ? 2 : 1), y, 1, 1);
    } else {
      // cayendo: gira (de cara, de canto, del reves)
      const f = Math.floor(t * 5 + l.flip) % 4;
      if (f === 1 || f === 3) { g.fillStyle = f === 1 ? base : dark; g.fillRect(x, y, l.big ? 3 : 2, 1); }
      else if (l.big) { g.fillStyle = base; g.fillRect(x, y, 2, 2); g.fillStyle = light; g.fillRect(x + (f ? 1 : 0), y, 1, 1); g.fillStyle = dark; g.fillRect(x + 1 - (f ? 1 : 0), y + 1, 1, 1); g.fillStyle = dark; g.fillRect(x + 2, y + 1, 1, 1); }
      else { g.fillStyle = base; g.fillRect(x, y, 2, 1); g.fillStyle = light; g.fillRect(x + (f ? 1 : 0), y - 1, 1, 1); }
    }
    g.globalAlpha = 1;
  }

  return {
    setup, update,
    // en el suelo, con el fondo
    ground(g, ctx) { for (const l of leaves) if (l.rest) drawLeaf(g, l, ctx.t, Math.min(1, l.rest / 3)); },
    // cayendo, por delante de todo
    front(g, ctx) { for (const l of leaves) if (!l.rest) drawLeaf(g, l, ctx.t, 1); },
    get count() { return leaves.length; }
  };
}
