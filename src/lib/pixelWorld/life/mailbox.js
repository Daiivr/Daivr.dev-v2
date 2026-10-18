import { lazy, outlinedSprite, px, rect } from "../core.js";

// El buzon junto al mercado: caja de chapa azul con la tapa redonda en un
// poste de madera. Con carta nueva (FooterMailbox), la banderita roja sube, la
// esquina de un sobre asoma por la puerta y destella de vez en cuando.
const SPRITES = lazy(() => ({
  box: outlinedSprite([
    "..LLLLLL..",
    ".LbbbbbbD.",
    "dLbbbbbbbD",
    "dbbbbbbbbD",
    "dbbbbbbbbD",
    "dDDDDDDDDD",
    "....wW....",
    "....wW....",
    "....wW....",
    "....wW....",
    "....wW....",
    "...gwWg..."
  ], { L: "#8ab8d0", b: "#5a8aa8", D: "#3a5a78", d: "#2a4058", w: "#a8743e", W: "#7a4a22", g: "#4a8a3a" }, "#18283a"),
  letter: outlinedSprite(["ww", "wr"], { w: "#f4f0e0", r: "#e84a5a" }, null)
}));

export function createMailbox() {
  let x = 0, flag = false, raise = 0;
  const left = () => Math.round(x) - 6, top = 71 - 13;
  return {
    setup(ctx) { x = ctx.L.mailX; },
    update(ctx) {
      flag = Boolean(ctx.state.mail?.flag);
      raise = Math.max(0, Math.min(1, raise + (flag ? 1 : -1) * ctx.dt / 0.35));
    },
    ground(g, ctx) {
      const S = SPRITES(), lx = left();
      g.drawImage(S.box, lx, top);
      const cap = ctx.snowCap?.(S.box);
      if (cap) g.drawImage(cap, lx, top);
      // la banderita: tumbada a lo largo de la caja o de pie
      const fx = lx + 10;
      if (raise < 0.5) { rect(g, fx - 3, top + 4, 4, 1, "#a83a3a"); rect(g, fx, top + 3, 1, 2, "#5a2a2a"); }
      else { rect(g, fx, top - 1, 1, 6, "#5a2a2a"); rect(g, fx + 1, top - 1, 3, 2, "#e84a4a"); px(g, fx + 1, top - 1, "#ff8a8a"); }
      if (flag) g.drawImage(S.letter, lx - 1, top + 2);
    },
    glow(g, ctx) {
      if (!flag || ctx.reduceMotion) return;
      // un destello en la esquina del sobre de vez en cuando
      const c = (ctx.t % 2.6) / 2.6;
      if (c < 0.12) { const lx = left(); px(g, lx - 1, top + 1, "#ffffff"); if (c > 0.03 && c < 0.09) { px(g, lx - 2, top + 1, "#fff6cf"); px(g, lx - 1, top, "#fff6cf"); px(g, lx, top + 1, "#fff6cf"); } }
    },
    get x() { return x; }
  };
}
