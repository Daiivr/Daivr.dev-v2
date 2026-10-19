import { halo, px } from "../core.js";
import { drawBeam } from "./beam.js";

// La linterna de Pip (el objeto de la mano, id "wrench"): de dia es solo una
// linterna amarilla; al anochecer se enciende y alumbra el sendero delante de
// el mientras pasea (world.js calcula el haz, \`a.torch\`, y suma sus charcos de
// luz al mapa de luz; aqui se dibuja el haz por encima). Al pararse el haz
// baja un poco hacia sus pies; al andar, se balancea con el paso.
export function flashlightDrawOverlay(g, actor, a, fr, env) {
  const T = a.torch;
  if (!T) return;
  drawBeam(g, [T.x0, T.y0, T.x1, T.y1], env.t, T.k, 12, actor.ghost);
  // (un destello en el cristal de vez en cuando)
  if (Math.sin(env.t * 2.3) > 0.97) { px(g, Math.round(T.x0), Math.round(T.y0) - 1, actor.ghost ? "#e6eeff" : "#ffffff"); halo(g, T.x0, T.y0, 3, actor.ghost ? "215,230,255" : "255,250,220", 0.1 * T.k); }
}
