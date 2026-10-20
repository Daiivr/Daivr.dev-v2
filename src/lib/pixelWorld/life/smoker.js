import { makeCanvas, mix, px, rect } from "../core.js";

// El ahumadero: un tripode de ramas atadas sobre la hoguera con un travesaño
// del que cuelgan (cabeza abajo) los peces que Buddy esta ahumando, hasta
// tres, que pasan de su color a un dorado tostado al ahumarse; los listos
// destellan. Solo esta mientras hay algo colgado o listo para recoger.
// FooterWorld pone `state.smoker` ([{ color, k: 0..1, ready }]) y
// `state.smokerHover`.
const HOVER = "#fff3c4";
const WOOD = { l: "#a8743e", m: "#7a4a22", d: "#4a2c12", rope: "#d8c8a0" };
const APEX = 46, BAR = 52, FEET = 74;
const SMOKED = "#b8742a";

function line(g, x0, y0, x1, y1, col) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) px(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col);
}

export function createSmoker() {
  let fx = 0, nextSmoke = 0, outline = null, outlineKey = "";
  const fish = (ctx) => (ctx.state?.smoker || []).slice(0, 3);
  // el tripode y los peces en un lienzo propio (para su contorno al pasar el raton)
  function paint(g, list, ox, oy, t) {
    // patas: la de atras mas oscura, y las dos de delante
    line(g, ox + 2, oy + APEX, ox + 4, oy + FEET - 3, WOOD.d);
    line(g, ox, oy + APEX, ox - 9, oy + FEET, WOOD.m);
    line(g, ox, oy + APEX, ox + 9, oy + FEET, WOOD.l);
    line(g, ox + 1, oy + APEX, ox + 10, oy + FEET, WOOD.m);
    // atadura y travesaño
    rect(g, ox - 1, oy + APEX + 1, 3, 2, WOOD.rope);
    line(g, ox - 6, oy + BAR, ox + 6, oy + BAR, WOOD.m);
    px(g, ox - 6, oy + BAR, WOOD.l);
    // los peces, cabeza abajo, colgando de un cordel
    list.forEach((entry, i) => {
      const x = ox - 4 + i * 4, col = mix(entry.color || "#7a9ab8", SMOKED, entry.ready ? 1 : entry.k * 0.85), dark = mix(col, "#2a1408", 0.45), light = mix(col, "#fff0c8", 0.35);
      const sway = Math.round(Math.sin(t * 1.3 + i * 2) * 0.6);
      px(g, x, oy + BAR + 1, WOOD.rope);
      // cola abierta arriba, cuerpo, cabeza con su ojo
      px(g, x - 1 + sway, oy + BAR + 2, dark); px(g, x + 1 + sway, oy + BAR + 2, dark);
      px(g, x + sway, oy + BAR + 3, col);
      for (let y = 4; y <= 8; y++) { px(g, x - 1 + sway, oy + BAR + y, y < 6 ? light : col); px(g, x + sway, oy + BAR + y, col); px(g, x + 1 + sway, oy + BAR + y, dark); }
      px(g, x + sway, oy + BAR + 9, dark);
      px(g, x - 1 + sway, oy + BAR + 8, "#1a1008");
    });
  }
  return {
    setup(ctx) { fx = ctx.L.fireX; },
    update(ctx) {
      const list = fish(ctx);
      // mientras ahuma, humo de mas subiendo entre los peces
      if (list.some((entry) => !entry.ready) && !ctx.rain && ctx.t > nextSmoke) {
        nextSmoke = ctx.t + 0.35 + Math.random() * 0.4;
        ctx.spawn({ k: "smoke", x: fx - 4 + Math.random() * 8, y: BAR + 4, vx: -1.5 - Math.random() * 2 * (ctx.wind || 1), vy: -4 - Math.random() * 2, life: 2.6, max: 2.6 });
      }
    },
    ground(g, ctx) {
      const list = fish(ctx);
      if (!list.length) return;
      paint(g, list, fx, 0, ctx.t);
    },
    glow(g, ctx) {
      const list = fish(ctx);
      if (!list.length) return;
      // los listos destellan de vez en cuando
      list.forEach((entry, i) => {
        if (!entry.ready) return;
        const c = ((ctx.t + i * 0.7) % 2.4) / 2.4;
        if (c < 0.1) px(g, fx - 5 + i * 4, BAR + 5, "#fff6cf");
      });
      if (!ctx.state?.smokerHover) return;
      const key = list.map((entry) => `${entry.ready}`).join(",");
      if (!outline || key !== outlineKey) {
        outlineKey = key;
        const [c, cg] = makeCanvas(26, FEET - APEX + 4);
        paint(cg, list, 13, -APEX + 1, 0);
        const d = cg.getImageData(0, 0, c.width, c.height).data;
        const A = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 40;
        const [o, og] = makeCanvas(c.width, c.height);
        og.fillStyle = HOVER;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (!A(x, y) && (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1))) og.fillRect(x, y, 1, 1);
        outline = o;
      }
      g.globalAlpha = 0.85; g.drawImage(outline, fx - 13, APEX - 1); g.globalAlpha = 1;
    }
  };
}
