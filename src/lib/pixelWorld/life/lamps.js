// Las farolas, una a una. Al cargar la pagina estan como toca segun la hora;
// cuando anochece (o amanece) mientras se mira, las que hay que cambiar se
// quedan "pendientes" y Pip va a encenderlas (o apagarlas) con su pertiga
// (useBuddyLamps). Si en 90 s no ha llegado (dormido, ocupado, el footer sin
// mirar), cada una cambia sola. Al encenderse parpadean con un chispazo; al
// apagarse sueltan una bocanada de humo.
const SELF_SWITCH_S = 90;
const FLICKER = [0.55, 0.1, 0.85, 0.25, 0.7, 1];

export function createLamps() {
  let lamps = [], want = null;

  function setup(ctx) {
    lamps = ctx.L.lamps.map((x) => ({ x, on: false, at: -99, pendingAt: 0 }));
    want = null;
  }

  function sw(ctx, i, value) {
    const lamp = lamps[i];
    if (!lamp || lamp.on === value) return;
    lamp.on = value; lamp.at = ctx.t;
    if (value) for (let k = 0; k < 6; k++) ctx.spawn({ k: "spark", x: lamp.x + (Math.random() - 0.5) * 3, y: ctx.lampTop + 5, vx: (Math.random() - 0.5) * 20, vy: -8 - Math.random() * 12, g: 50, life: 0.35 + Math.random() * 0.3 });
    else for (let k = 0; k < 3; k++) ctx.spawn({ k: "smoke", x: lamp.x + (Math.random() - 0.5) * 2, y: ctx.lampTop + 2, vx: -1 - Math.random() * 2, vy: -5, life: 1.6, max: 1.6 });
  }

  function update(ctx, rawWant) {
    if (want === null) { want = rawWant; for (const lamp of lamps) { lamp.on = rawWant; lamp.at = -99; } return; }
    if (rawWant !== want) { want = rawWant; for (const lamp of lamps) lamp.pendingAt = ctx.t; }
    lamps.forEach((lamp, i) => { if (lamp.on !== want && ctx.t - lamp.pendingAt > SELF_SWITCH_S) sw(ctx, i, want); });
  }

  // Cuanto luce cada farola (0..1), con el parpadeo al encenderse.
  function level(i, t) {
    const lamp = lamps[i];
    if (!lamp) return 1;
    const e = t - lamp.at;
    if (lamp.on) return e >= 0.6 ? 1 : FLICKER[Math.min(FLICKER.length - 1, Math.floor(e / 0.1))];
    return e >= 0.5 ? 0 : 1 - e / 0.5;
  }

  return {
    setup, update, level,
    switch: sw,
    get want() { return want; },
    // Las que faltan por cambiar: [{ i, x }]
    pending() { return want === null ? [] : lamps.map((lamp, i) => ({ i, x: lamp.x, on: lamp.on })).filter((lamp) => lamp.on !== want); }
  };
}
