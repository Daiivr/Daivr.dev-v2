import { fishermanVisit } from "../../../../shared/buddy-fisherman.mjs";
import { flipped, halo, lazy, px } from "../core.js";
import { FISHER_ANCHORS, FISHER_SPRITES } from "../fisherman.js";

// El pescador ambulante en el prado: llega por la derecha tirando de su
// carretilla, se planta en su sitio (layout.fisher) mirando al valle, fuma en
// pipa, parpadea y saluda si le pasas el raton por encima; al acabar su visita
// recoge y se va por donde vino. Todo sale del reloj (fishermanVisit), asi
// que si la pagina se abre a media visita ya esta alli. De noche se enciende
// el farol de la carretilla.
const SPEED = 14;          // px de arte por segundo
const GROUND = 74;         // fila de los pies (por detras del sendero de Pip)
const CART_DX = 7;         // la carretilla, a su espalda (a la derecha)
const HOVER = "#fff3c4";

// El contorno para el raton (como el del huerto y el puesto).
function outline(img) {
  const c = document.createElement("canvas");
  c.width = img.width + 2; c.height = img.height + 2;
  const g = c.getContext("2d"), d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
  const A = (x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : d[(y * img.width + x) * 4 + 3]);
  g.fillStyle = HOVER;
  for (let y = -1; y <= img.height; y++) for (let x = -1; x <= img.width; x++) {
    if (!A(x, y) && (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1))) g.fillRect(x + 1, y + 1, 1, 1);
  }
  return c;
}
// Mirando a la izquierda (al valle) cuando esta, y hacia donde anda.
const LEFT = lazy(() => {
  const S = FISHER_SPRITES();
  const stand = flipped(S.stand), cart = S.cart;
  return { stand, blink: flipped(S.blink), wave: flipped(S.wave), walk: S.walk.map((img) => flipped(img)), cartBack: flipped(cart), standOutline: outline(stand), waveOutline: outline(flipped(S.wave)), cartOutline: outline(cart) };
});

// La carretilla va a su espalda con los varales hacia el: detras al llegar
// (tira de ella hacia la izquierda) y, al irse, dada la vuelta y tambien detras.
function cartAt(x, dir) {
  const S = FISHER_SPRITES(), img = dir < 0 ? S.cart : LEFT().cartBack;
  const left = dir < 0 ? x + CART_DX : x - CART_DX - img.width;
  return { img, left, top: GROUND - img.height + 1, lantern: [dir < 0 ? FISHER_ANCHORS.lantern[0] : img.width - 1 - FISHER_ANCHORS.lantern[0], FISHER_ANCHORS.lantern[1]] };
}

export function createFisherman() {
  let L = null, at = null, now = 0, puff = 0;
  // Donde esta y que hace en el instante `t` (ms del reloj).
  function where(t) {
    const spot = L?.fisher?.x;
    if (spot == null) return { phase: "away" };
    const exitX = L.W + 16, walkMs = (exitX - spot) / SPEED * 1000;
    const visit = fishermanVisit(t);
    if (visit) {
      const e = t - visit.from;
      if (e < walkMs) return { phase: "arriving", x: exitX - (exitX - spot) * e / walkMs, dir: -1 };
      return { phase: "here", x: spot, dir: -1, until: visit.to };
    }
    const past = fishermanVisit(t - walkMs);
    if (past && t >= past.to) return { phase: "leaving", x: spot + (exitX - spot) * (t - past.to) / walkMs, dir: 1 };
    return { phase: "away" };
  }
  const manTop = (img) => GROUND - img.height + 1;
  return {
    setup(ctx) { L = ctx.L; },
    update(ctx) {
      now = Date.now();
      at = where(now);
      // humo de la pipa mientras esta plantado
      if (at.phase === "here" && !ctx.reduceMotion && (puff -= ctx.dt) <= 0) {
        puff = 0.5 + Math.random() * 0.7;
        const img = LEFT().stand, mx = Math.round(at.x) - Math.floor(img.width / 2);
        ctx.spawn({ k: "steam", x: mx + img.width - 1 - FISHER_ANCHORS.pipe[0], y: manTop(img) + FISHER_ANCHORS.pipe[1] - 1, vx: -1.5 - Math.random() * 2, vy: -5 - Math.random() * 3, life: 1.6, max: 1.6 });
      }
    },
    // Con Pip y las visitas (delante de ellos pasa Pip, por el sendero).
    under(g, ctx) {
      if (!at || at.phase === "away") return;
      const S = FISHER_SPRITES(), V = LEFT(), x = Math.round(at.x), moving = at.phase !== "here";
      const frame = Math.floor(ctx.t * 6) % 4;
      const man = moving ? (at.dir < 0 ? V.walk[frame] : S.walk[frame]) : ctx.state?.fisherHover ? V.wave : (ctx.t % 3.7) < 0.14 ? V.blink : V.stand;
      const mx = x - Math.floor(man.width / 2);
      const cart = cartAt(x, at.dir), bob = moving && frame % 2 ? 1 : 0;
      g.drawImage(cart.img, cart.left, cart.top - bob);
      const cap = ctx.snowCap?.(cart.img);
      if (cap) g.drawImage(cap, cart.left, cart.top - bob);
      g.drawImage(man, mx, manTop(man) - (moving && frame % 2 ? 1 : 0));
    },
    // El farol de la carretilla de noche: va encima de la capa de Buddy (ahi
    // esta la carretilla), salvo si Buddy o una visita pasa justo por delante.
    after(g, ctx) {
      const dark = ctx.light?.dark || 0;
      if (!at || at.phase === "away" || dark <= 0.2) return;
      const cart = cartAt(Math.round(at.x), at.dir), cx = cart.left, cy = cart.top;
      const [lx, ly] = cart.lantern, fl = 0.85 + Math.sin(ctx.t * 9) * 0.08;
      if (ctx.actors.some((a) => Math.abs(a.x - (cx + lx)) < 9 && (a.y || 0) > -30)) return;
      halo(g, cx + lx, cy + ly, 6, "255,200,120", 0.12 * dark * fl);
      halo(g, cx + lx, cy + ly, 3, "255,230,170", 0.1 * dark * fl);
      for (const [dx, dy, c] of [[-1, -1, "#ffd873"], [0, -1, "#fff4c0"], [1, -1, "#ffd873"], [-1, 0, "#ffb347"], [0, 0, "#fffbe0"], [1, 0, "#ffd873"], [-1, 1, "#ffb347"], [0, 1, "#ffd873"], [1, 1, "#ffb347"]]) px(g, cx + lx + dx, cy + ly + dy, c);
    },
    // El contorno al pasar el raton (por fuera del sprite: no lo tapa nada).
    glow(g, ctx) {
      if (!at || at.phase !== "here" || !ctx.state?.fisherHover) return;
      const S = FISHER_SPRITES(), V = LEFT(), x = Math.round(at.x);
      const cx = x + CART_DX, cy = GROUND - S.cart.height + 1;
      g.globalAlpha = 0.85;
      g.drawImage(V.waveOutline, x - Math.floor(V.wave.width / 2) - 1, manTop(V.wave) - 1);
      g.drawImage(V.cartOutline, cx - 1, cy - 1);
      g.globalAlpha = 1;
    },
    lights(list, ctx) {
      if (!at || at.phase === "away" || (ctx.light?.dark || 0) <= 0.2) return;
      const cart = cartAt(Math.round(at.x), at.dir);
      list.push({ x: cart.left + cart.lantern[0], y: cart.top + cart.lantern[1], r: 16, c: [1, 0.8, 0.5], s: 0.5 * ctx.light.dark });
    },
    get phase() { return at?.phase || "away"; },
    get until() { return at?.until || 0; }
  };
}
