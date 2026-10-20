import { blit } from "../core.js";
import { CRITTER_SPRITES } from "../critters.js";
import { FEET } from "../layout.js";

// La cartera: cuando hay carta nueva en el buzon (FooterWorld pone
// `state.courier` con la clave de esa carta), al rato entra andando por la
// izquierda del sendero, se para junto al buzon, mete la carta (en ese momento
// sube la banderita: `delivered`), saluda y se va por donde vino. Con
// movimiento reducido la carta llega sin paseo.
const SPEED = 22;          // px de arte por segundo
const WAIT_S = 5, DROP_S = 1.4, DROP_AT = 0.7, WAVE_S = 1.6;

export function createCourier() {
  let L = null, phase = "idle", key = "", done = "", since = 0, x = -16, dir = 1, walked = 0, delivered = "";
  const to = (next, t) => { phase = next; since = t; };
  return {
    setup(ctx) { L = ctx.L; if (phase !== "idle") { phase = "idle"; x = -16; } },
    update(ctx) {
      if (!L) return;
      const { t, dt } = ctx, want = ctx.state?.courier || "";
      if (phase === "idle") {
        if (!want || want === done) return;
        key = want;
        if (ctx.reduceMotion) { delivered = key; done = key; return; }
        to("wait", t);
        return;
      }
      if (phase === "wait" && t - since > WAIT_S) { x = -16; dir = 1; to("in", t); }
      const stop = L.mailX - 11;
      if (phase === "in") {
        x = Math.min(stop, x + SPEED * dt); walked += SPEED * dt;
        if (x >= stop) to("drop", t);
      } else if (phase === "drop") {
        if (!delivered && t - since > DROP_AT && done !== key) { delivered = key; done = key; }
        if (t - since > DROP_S) to("wave", t);
      } else if (phase === "wave") {
        if (t - since > WAVE_S) { dir = -1; to("out", t); }
      } else if (phase === "out") {
        x -= SPEED * dt; walked += SPEED * dt;
        if (x < -18) { phase = "idle"; dir = 1; }
      }
    },
    // en el sendero, detras de Pip
    under(g, ctx) {
      if (!L || phase === "idle" || phase === "wait") return;
      const S = CRITTER_SPRITES().courier;
      const img = phase === "drop" ? S.reach : phase === "wave" ? (Math.floor((ctx.t - since) * 5) % 2 ? S.wave : S.stand) : S.walk[Math.floor(walked / 3) % 4];
      blit(g, img, Math.round(x) - 11, FEET - img.height + 1, dir < 0);
    },
    // FooterWorld lo recoge: la carta que acaba de llegar al buzon
    takeDelivered() { const out = delivered; delivered = ""; return out; },
    get phase() { return phase; },
    get x() { return x; }
  };
}
