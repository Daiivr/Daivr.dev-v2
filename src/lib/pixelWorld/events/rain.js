import { Buf, line, px } from "../core.js";
import { paintLeaf } from "../leaf.js";

// El chaparron de Buddy (useBuddyWeather): saca el paraguas mientras llueve en
// todo el valle (FooterSky lo pasa como lluvia; las gotas las tira world.js)
// y pasea con el. Lo lleva en la mano: la copa se inclina hacia delante al
// andar y gira cuando esta quieto, y escurre por los bordes. Las gotas que
// caen en la copa rebotan (world.js mira `a.rain.um`).
const umbrellas = new Map();
// El paraguas de hoja (del mercado): una hoja grande de verdad, arqueada y
// asimetrica, con la punta caida hacia donde mira Pip, el nervio por arriba,
// venas en diagonal hacia la punta, el envés oscuro curvado por debajo y el
// borde lobulado. Del mismo tamaño que la copa a rayas (33x15).
const LEAF = { out: "#14320f", h: "#b8ec88", l: "#7ac85a", m: "#4f9e3c", d: "#2f6e2a", under: "#1e4a1a", rib: "#d8f4a8", vein: "#94d064", stem: "#5a7a2e" };
function leafCanvas(tilt, face) {
  const key = "leaf" + tilt + "," + face;
  let cnv = umbrellas.get(key);
  if (cnv) return cnv;
  const w = 33, cx = 16, b = new Buf(w, 15);
  // (dibujada con la punta a la derecha; `face` -1 la voltea)
  // (la hoja va de x = 2 a 30; el tilt baja el borde de delante, como la copa)
  const set = (x, y, key) => { const cxl = x + 2; if (cxl < 0 || cxl >= w) return; const xc = face < 0 ? w - 1 - cxl : cxl; b.set(xc, y + Math.round(tilt * (xc - cx) / 16), LEAF[key]); };
  paintLeaf(set, { len: 29, peakY: 6, rise: 3, droop: 3, H: 7 });
  cnv = b.canvas(); umbrellas.set(key, cnv);
  return cnv;
}

// Copa a rayas: `tilt` baja el borde de delante, `twirl` gira las rayas.
function umbrellaCanvas(tilt, twirl) {
  const key = tilt + "," + (twirl % 8);
  let cnv = umbrellas.get(key);
  if (cnv) return cnv;
  const w = 33, cx = 16, b = new Buf(w, 15);
  const red = "#d9434a", redD = "#9e2a36", redL = "#f27a74", cream = "#f4e6c6", creamD = "#cdb991", creamL = "#fffaf0", out = "#4a1520";
  for (let r = 0; r < 9; r++) {
    const hw = Math.round(16 * Math.pow(Math.sin((r + 0.5) / 9 * Math.PI / 2), 0.75));
    for (let x = cx - hw; x <= cx + hw; x++) {
      const dy = Math.round(tilt * (x - cx) / 16), panel = Math.floor((x - cx + 64 + (twirl % 8)) / 4) % 2;
      const lit = x < cx - 3 && r < 5, shade = x > cx + 6 || r >= 7;
      let c = panel ? (lit ? creamL : shade ? creamD : cream) : (lit ? redL : shade ? redD : red);
      if (x === cx - hw || x === cx + hw || r === 0) c = out;
      b.set(x, r + dy + 3, c);
    }
  }
  for (let x = 0; x < w; x++) {
    const dy = Math.round(tilt * (x - cx) / 16), m = (x - cx + 64 + (twirl % 8)) % 4;
    if (m === 1 || m === 2) b.set(x, 12 + dy, out);
    if (m === 0 && x > 0 && x < w - 1) b.set(x, 12 + dy, "#2a0a10");
  }
  b.set(cx, 2, out); b.set(cx, 1, "#5a3a1e"); b.set(cx, 0, "#8a5a2e");
  cnv = b.canvas(); umbrellas.set(key, cnv);
  return cnv;
}

const raining = (actor) => actor.weather === "rain" && !actor.ghost;

// Donde va el paraguas segun la mano y la cabeza de Pip en este fotograma.
function geom(actor, fr, env) {
  const hand = env.toWorld(fr, fr.rig.a.hand), skull = env.toWorld(fr, fr.rig.a.skull);
  const walking = actor.moving, f = actor.dir;
  return {
    hx: hand[0], hy: hand[1], top: skull[1] - 17,
    cx: hand[0] - 4 * f - (walking && Math.floor(env.t * 8) % 3 === 0 ? f : 0),
    tilt: (walking ? 2 : Math.round(Math.sin(env.t * 1.3) * 0.8)) * f,
    twirl: walking ? 0 : Math.floor(env.t * 6)
  };
}

export function rainUpdate(actor, a, env) {
  if (!raining(actor)) { a.rain = null; return; }
  const S = (a.rain ??= { um: null });
  if (S.um && Math.random() < env.dt * 4) {
    const side = Math.random() < 0.5 ? -1 : 1;
    env.spawn({ k: "drop", x: S.um.cx + side * 15, y: S.um.top + 12 + Math.round(S.um.tilt * side), vx: 0, vy: 8, g: 140, life: 0.45, c: "#c4d3e6" });
  }
}

// Lo mas alto sobre Pip: la copa del paraguas.
export function rainTop(actor, a) {
  return raining(actor) && a.rain?.um ? a.rain.um.top : null;
}

// El mango, detras de Pip; la copa y el gancho, delante.
export function rainDrawBehind(g, actor, a, fr, env) {
  if (!raining(actor) || !a.rain) return;
  const um = a.rain.um = geom(actor, fr, env);
  // (el de hoja cuelga de su tallo verde)
  line(g, um.cx, um.top + 12, um.hx, um.hy, actor.outfit?.umbrella === "leaf" ? "#5a7a2e" : "#5a3a1e");
}
export function rainDrawFront(g, actor, a, fr, env) {
  if (!raining(actor) || !a.rain?.um) return;
  const um = a.rain.um, f = actor.dir, hk = actor.outfit?.umbrella === "leaf" ? "#5a7a2e" : "#5a3a1e";
  const leaf = actor.outfit?.umbrella === "leaf";
  g.drawImage(leaf ? leafCanvas(um.tilt, f < 0 ? -1 : 1) : umbrellaCanvas(um.tilt, um.twirl), um.cx - 16, um.top);
  px(g, um.hx, um.hy + 2, hk); px(g, um.hx, um.hy + 3, hk); px(g, um.hx - f, um.hy + 4, hk); px(g, um.hx - 2 * f, um.hy + 3, hk);
}
