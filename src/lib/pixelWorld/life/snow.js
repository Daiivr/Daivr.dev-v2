import { bayer, makeCanvas } from "../core.js";
import { MEADOW } from "../layout.js";
import { snowCap } from "./util.js";

// Nieve que se acumula: mientras nieva (el evento de invierno, o nieve de
// verdad) la capa crece en unos minutos sobre las copas de los arboles, el
// tejado del puesto, las farolas, la tienda y el buzon; al dejar de nevar se
// derrite despacio. Con nieve de verdad fuera del invierno, el prado y el
// sendero tambien se van blanqueando.
const GROW_S = 200, MELT_S = 320;

export function createSnow() {
  let depth = 0, ground = null, groundLevel = -1, W = 0, H = 0;

  function setup(ctx) {
    W = ctx.W; H = ctx.H; ground = null; groundLevel = -1;
    // Al cargar ya nevado: la capa ya esta puesta (no crece desde cero).
    if (ctx.season === "winter") depth = Math.max(depth, 0.8);
    else if (ctx.sky.cover === "snow") depth = Math.max(depth, 0.5);
  }
  const snowing = (ctx) => ctx.season === "winter" || ctx.sky.cover === "snow";
  function update(ctx) {
    depth = Math.max(0, Math.min(1, depth + (snowing(ctx) ? ctx.dt / GROW_S : -ctx.dt / MELT_S)));
  }
  // De 0 a 3 filas de nieve.
  const level = () => (depth < 0.12 ? 0 : depth < 0.4 ? 1 : depth < 0.75 ? 2 : 3);

  // El suelo blanqueado en tramado (solo fuera del evento de invierno, que ya
  // pinta el valle nevado).
  function groundLayer(ctx) {
    const q = Math.round(depth * 8);
    if (q === groundLevel && ground) return ground;
    groundLevel = q;
    const [c, g] = makeCanvas(W, H), k = Math.min(0.85, depth * 0.95);
    for (let y = MEADOW; y < H; y++) for (let x = 0; x < W; x++) {
      const edge = y < MEADOW + 2 ? 0.7 : 1;
      if (bayer(x, y) < k * edge) { g.fillStyle = (x + y) % 5 === 0 ? "#e2ecf6" : "#f4f8fc"; g.fillRect(x, y, 1, 1); }
    }
    ground = c;
    return c;
  }

  return {
    setup, update,
    get depth() { return depth; },
    get level() { return level(); },
    // La capa de un sprite (o null): se dibuja encima, en el mismo sitio.
    cap(img) { return snowCap(img, level()); },
    groundCover(g, ctx) {
      if (ctx.season === "winter" || depth < 0.15) return;
      g.drawImage(groundLayer(ctx), 0, 0);
    },
    // (pruebas) poner la capa de golpe
    set(v) { depth = Math.max(0, Math.min(1, v)); }
  };
}
