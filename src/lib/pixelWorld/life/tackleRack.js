import { line, makeCanvas, outlinedSprite, px, rect } from "../core.js";
import { rodLook } from "../tackle.js";

// El barril de las cañas junto a la farola (layout.rack): un barril de duelas
// con aros de hierro, las cañas que tiene Buddy metidas de pie y abiertas en
// abanico (corcho y carrete asomando por la boca, con sus colores, como en su
// mano y en su icono), un salabre apoyado al lado y, en la punta de cada caña,
// un corcho colgando del sedal que se mece con el viento (y de noche brilla un
// poco, como los corchos de pesca nocturna). Al pasar el raton se ilumina el
// contorno (FooterWorld: state.rackHover) y al pulsar se abre el modal de pesca.
const BASE = 73;           // fila del suelo (en el prado, detras del sendero)
const W = 31, H = 36;
const MAX_RODS = 4;
const HOVER = "#fff3c4";
const LINE = "rgba(232, 240, 244, 0.7)";

// El barril, a mano: luz por la izquierda, duelas que se abren en la barriga,
// betas en la del centro, dos aros con su remache, y por arriba el borde de
// atras, la pared de dentro y el hueco oscuro donde entran las cañas.
const BARREL_X = 8, BARREL_TOP = H - 15, MOUTH = BARREL_TOP + 3, CX = BARREL_X + 8;
const BARREL = [
  "...oooooooooo...",
  "..ollllllllllo..",
  "..obbbbbbbbbbo..",
  ".okkkkkkkkkkkko.",
  ".ohhlllllllmmdo.",
  ".ohlmdmmmmdmdso.",
  "oIIIiirIiiiijjjo",
  "ohlmdmmlmmmdmdso",
  "ohlmdmlmmmmdmdso",
  "ohlmdmmmlmmdmdso",
  "ohlmdmmlmmmdmdso",
  "oIIIiirIiiiijjjo",
  ".ohlmdmmmmdmdso.",
  ".ohlmdmmmmdmdso.",
  "..oooooooooooo.."
];
const BARREL_PAL = {
  o: "#3a1e0c", h: "#e8b070", l: "#c88e52", m: "#9a6434", d: "#6a3e1e", s: "#4e2c14", k: "#1a0c04", b: "#5a3418",
  I: "#c8c4d0", i: "#7a7684", j: "#454150", r: "#f0ecf4"
};
const BACK_ROWS = 4;      // filas del barril que van detras de las cañas

// El salabre: aro de madera con su red, apoyado en el barril, y el mango
// bajando hasta el suelo.
const NET = { x: 1, y: H - 17, ring: ["..rrrr..", ".r....r.", "r......r", "r......r", "r......r", ".r....r.", "..rrrr.."] };
const NET_PAL = { lit: "#c88e52", wood: "#8a5a2e", dark: "#5a3a1e", out: "#3a1e0c", mesh: "rgba(236, 228, 204, 0.6)", wrap: "#2e4a5a" };

// Por numero de cañas: donde sale cada una (respecto al centro de la boca),
// cuanto se abre hasta la punta y cuanto sedal cuelga.
const FAN = {
  1: [[0, 1, 5]],
  2: [[-2, -5, 5], [2, 4, 6]],
  3: [[-3, -6, 5], [0, 0, 7], [3, 5, 4]],
  4: [[-4, -7, 5], [-1, -3, 7], [2, 1, 4], [5, 5, 6]]
};

function paintRows(g, rows, pal, x0, y0, from = 0, to = rows.length) {
  for (let y = from; y < to; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) if (row[x] !== ".") px(g, x0 + x, y0 + y, pal[row[x]]);
  }
}

// Contorno de 1 px alrededor de lo opaco (en el mismo lienzo, sin crecer).
function outline(g, w, h, color) {
  const d = g.getImageData(0, 0, w, h).data;
  const A = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 100;
  g.fillStyle = color;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!A(x, y) && (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1))) g.fillRect(x, y, 1, 1);
}

function drawNet(g) {
  const [c, n] = makeCanvas(W + 2, H + 2), o = 1;
  // el mango, del suelo hasta el aro, con la empuñadura forrada abajo
  for (let y = NET.y + 7; y <= H - 1; y++) {
    const x = Math.round(5 - 4 * (y - NET.y - 7) / (H - 1 - NET.y - 7));
    px(n, x + o, y + o, y >= H - 4 ? NET_PAL.wrap : y % 3 === 0 ? NET_PAL.lit : NET_PAL.wood);
  }
  NET.ring.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "r") px(n, NET.x + x + o, NET.y + y + o, y <= 2 && x <= 3 ? NET_PAL.lit : y >= 4 && x >= 4 ? NET_PAL.dark : NET_PAL.wood);
  }));
  outline(n, W + 2, H + 2, NET_PAL.out);
  // la red, a cuadros y medio transparente (sin contorno)
  NET.ring.forEach((row, y) => {
    const a = row.indexOf("r"), b = row.lastIndexOf("r");
    for (let x = a + 1; x < b; x++) if ((x + y) % 2 === 0) px(n, NET.x + x + o, NET.y + y + o, NET_PAL.mesh);
  });
  g.drawImage(c, 0, 0);
}

// Una caña en abanico: mango de corcho (2 px) en la boca, su anilla, el
// carrete hacia fuera, la vara (con sombra en el tramo grueso y los nudos del
// bambu o de la madera de deriva) y la puntera de color.
function rodX([base, open], y) {
  return CX + base + Math.round(open * (MOUTH - y) / (MOUTH - 1));
}
function drawRod(g, id, fan) {
  const look = rodLook(id), dot = (x, y, col) => px(g, x + 1, y + 1, col);
  const side = fan[1] < 0 ? -1 : 1;
  for (let y = 1; y <= MOUTH; y++) {
    const x = rodX(fan, y);
    if (y >= MOUTH - 3) { dot(x, y, look.grip[0]); dot(x + 1, y, look.grip[1]); }
    else if (y === MOUTH - 4) { dot(x, y, look.grip[2]); dot(x + 1, y, look.grip[2]); }
    else if (y <= 2) dot(x, y, look.tip[y - 1]);
    else {
      dot(x, y, (look.nodes && y % 4 === 0) || (look.knots && y % 5 === 2) ? look.blank[1] : look.blank[0]);
      if (y >= MOUTH - 12) dot(x + 1, y, look.blank[1]);
    }
  }
  // (el carrete pegado a la vara por fuera: dos por dos y la manivela)
  const ry = MOUTH - 6, rx = rodX(fan, ry), out = side < 0 ? rx - 1 : rx + 2;
  dot(out, ry, look.reel[0]); dot(out, ry + 1, look.reel[1]);
  dot(out + side, ry, look.reel[1]); dot(out + side, ry + 1, look.reel[2]);
  dot(out + side * 2, ry + 1, look.reel[0]);
}

export function buildRack(rods) {
  const [c, g] = makeCanvas(W + 2, H + 2);
  // la sombra en el suelo
  rect(g, BARREL_X - 1, H, 20, 1, "rgba(24, 14, 4, 0.3)");
  rect(g, BARREL_X + 1, H + 1, 16, 1, "rgba(24, 14, 4, 0.22)");
  rect(g, 0, H, 7, 1, "rgba(24, 14, 4, 0.2)");
  const list = rods.length ? rods.slice(-MAX_RODS) : [""];
  const fans = FAN[list.length];
  paintRows(g, BARREL, BARREL_PAL, BARREL_X + 1, BARREL_TOP + 1, 0, BACK_ROWS);
  list.forEach((id, i) => drawRod(g, id, fans[i]));
  paintRows(g, BARREL, BARREL_PAL, BARREL_X + 1, BARREL_TOP + 1, BACK_ROWS);
  drawNet(g);
  // y el contorno de pasar el raton, alrededor de todo (sin la sombra)
  const [hc, hg] = makeCanvas(W + 4, H + 4);
  const e = g.getImageData(0, 0, W + 2, H + 2).data;
  const B = (x, y) => x >= 0 && y >= 0 && x < W + 2 && y < H + 2 && e[(y * (W + 2) + x) * 4 + 3] > 100;
  hg.fillStyle = HOVER;
  for (let y = -1; y <= H + 2; y++) for (let x = -1; x <= W + 2; x++) if (!B(x, y) && (B(x + 1, y) || B(x - 1, y) || B(x, y + 1) || B(x, y - 1))) hg.fillRect(x + 1, y + 1, 1, 1);
  // los corchos de cada caña (se dibujan aparte: se mecen)
  const lines = list.map((id, i) => {
    const fan = fans[i], side = fan[1] < 0 ? -1 : 1, tx = rodX(fan, 1);
    return { from: [tx + side, 2], drop: fan[2], side, bob: bobber(rodLook(id).bob), phase: i * 1.9 };
  });
  return { img: c, hover: hc, lines };
}

const bobbers = new Map();
function bobber(color) {
  if (!bobbers.has(color)) bobbers.set(color, outlinedSprite([".a.", "rrr", "www"], { a: "#fff6c8", r: color, w: "#f4f4f0" }, "#2a1a1a"));
  return bobbers.get(color);
}

export function createTackleRack() {
  let L = null, key = "", art = null, floats = [];
  const left = () => L.rack.x, top = () => BASE - H;
  return {
    setup(ctx) { L = ctx.L; key = ""; },
    update(ctx) {
      if (!L?.rack) return;
      const rods = ctx.state?.rods || [], next = rods.join(",");
      if (next !== key || !art) { key = next; art = buildRack(rods); }
    },
    ground(g, ctx) {
      if (!L?.rack || !art) return;
      const x0 = left(), y0 = top();
      g.drawImage(art.img, x0, y0);
      const cap = ctx.snowCap?.(art.img);
      if (cap) g.drawImage(cap, x0, y0);
      // el sedal y el corcho, meciendose un pixel con el viento
      const amp = ctx.reduceMotion ? 0 : 0.55 + Math.min(1.2, (ctx.wind || 1) * 0.6);
      floats = art.lines.map((ln, i) => {
        const sway = Math.round(Math.sin(ctx.t * (1.15 + i * 0.17) + ln.phase) * amp);
        const fx = x0 + 1 + ln.from[0], fy = y0 + 1 + ln.from[1];
        const bx = fx + ln.side * 2 + sway, by = fy + ln.drop;
        line(g, fx, fy, bx, by - 1, LINE);
        g.drawImage(ln.bob, bx - 2, by - 1);
        return { x: bx, y: by };
      });
    },
    glow(g, ctx) {
      if (!L?.rack || !art) return;
      if (ctx.state?.rackHover) { g.globalAlpha = 0.85; g.drawImage(art.hover, left() - 1, top() - 1); g.globalAlpha = 1; }
      // de noche la punta de cada corcho brilla un poco
      const k = Math.max(0, Math.min(1, ((ctx.light?.dark || 0) - 0.3) / 0.4));
      if (!k) return;
      for (const f of floats) {
        g.globalAlpha = 0.22 * k; rect(g, f.x - 1, f.y - 1, 3, 3, "#fff2a8");
        g.globalAlpha = k; px(g, f.x, f.y, "#fffbe0");
      }
      g.globalAlpha = 1;
    }
  };
}
