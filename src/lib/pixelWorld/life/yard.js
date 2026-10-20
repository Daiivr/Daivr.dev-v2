import { makeCanvas, px } from "../core.js";
import { FARM_SPRITES, FRUIT_SPOTS, scarecrowSprite, treeSprite } from "../farmArt.js";
import { natureSeason } from "./util.js";

// El patio del huerto (se compra en su cobertizo: shared/buddy-farm.mjs), detras
// de la valla: la casita de abejas a la izquierda (con sus abejas zumbando de
// dia y un tarro asomando cuando hay miel), el espantapajaros entre los
// bancales (de calabaza en Halloween, con bufanda en invierno) y el arbol
// frutal a la derecha (planton, arbusto, arbolito o arbol, con sus flores, su
// fruta colgando o pelado en invierno). FooterWorld pone `state.yard`.
const HOVER = "#fff3c4";
const BASE = 67;                // la fila de abajo de lo que va tras la valla
export const YARD_SPOTS = { bees: 4, scarecrow: 36, tree: 56 };

function outline(img) {
  const [c, g] = makeCanvas(img.width + 2, img.height + 2);
  const d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
  const A = (x, y) => x >= 0 && y >= 0 && x < img.width && y < img.height && d[(y * img.width + x) * 4 + 3] > 40;
  g.fillStyle = HOVER;
  for (let y = -1; y <= img.height; y++) for (let x = -1; x <= img.width; x++) if (!A(x, y) && (A(x + 1, y) || A(x - 1, y) || A(x, y + 1) || A(x, y - 1))) g.fillRect(x + 1, y + 1, 1, 1);
  return c;
}
const outlines = new WeakMap();
const outlineOf = (img) => { if (!outlines.has(img)) outlines.set(img, outline(img)); return outlines.get(img); };

export function createYard() {
  let G = null, bees = [];
  // (lo que hay, de FooterWorld: { scarecrow, bees: {ready}, tree: {fruit, stage, ready} })
  const yard = (ctx) => ctx.state?.yard || {};
  const at = (key) => G.x + YARD_SPOTS[key];
  function pieces(ctx) {
    const Y = yard(ctx), S = FARM_SPRITES(), season = ctx.season === "halloween" || ctx.season === "winter" ? ctx.season : "";
    const list = [];
    if (Y.bees) list.push({ key: "bees", img: S.beeHouse, x: at("bees") - 6 });
    if (Y.scarecrow) { const img = scarecrowSprite(season); list.push({ key: "scarecrow", img, x: at("scarecrow") - 8 }); }
    if (Y.tree) {
      const nature = natureSeason(ctx.season), img = treeSprite(Y.tree.stage, nature === "autumn" ? "autumn" : nature, Y.tree.fruit);
      list.push({ key: "tree", img, x: at("tree") - Math.floor(img.width / 2) });
    }
    return list.map((piece) => ({ ...piece, y: BASE - piece.img.height + 1 }));
  }
  return {
    setup(ctx) {
      G = ctx.L.garden;
      bees = Array.from({ length: 4 }, (_, i) => ({ p: i * 1.7, r: 4 + i * 1.3, s: 1.6 + i * 0.35, x: 0, y: 0 }));
    },
    update(ctx) {
      if (!G || !yard(ctx).bees) return;
      const hx = at("bees"), hy = BASE - 15;
      for (const b of bees) {
        const t = ctx.t * b.s + b.p;
        b.x = hx + Math.cos(t) * b.r + Math.sin(t * 2.3) * 2;
        b.y = hy + Math.sin(t * 1.4) * 3 - 1;
      }
    },
    // detras de la valla del huerto (va antes que el huerto)
    ground(g, ctx) {
      if (!G) return;
      for (const piece of pieces(ctx)) {
        g.drawImage(piece.img, piece.x, piece.y);
        const cap = ctx.snowCap?.(piece.img);
        if (cap) g.drawImage(cap, piece.x, piece.y);
        // la fruta colgando del arbol
        if (piece.key === "tree" && yard(ctx).tree.stage === 3 && yard(ctx).tree.ready) {
          const fruit = FARM_SPRITES().fruit[yard(ctx).tree.fruit];
          FRUIT_SPOTS.slice(0, yard(ctx).tree.ready).forEach(([fx, fy]) => g.drawImage(fruit, piece.x + 1 + fx - Math.floor(fruit.width / 2), piece.y + 1 + fy - 1));
        }
      }
    },
    // las abejas (por delante de la valla), de dia y sin lluvia
    front(g, ctx) {
      if (!G || !yard(ctx).bees || ctx.light.dark > 0.45 || ctx.rain || natureSeason(ctx.season) === "winter") return;
      const blink = Math.floor(ctx.t * 12) % 2;
      for (const [i, b] of bees.entries()) px(g, Math.round(b.x), Math.round(b.y), (i + blink) % 2 ? "#ffd84a" : "#2a1a08");
    },
    // el tarro asomando sobre la casita cuando hay miel, y el contorno al
    // pasar el raton por el huerto
    glow(g, ctx) {
      if (!G) return;
      const Y = yard(ctx);
      if (Y.bees?.ready && !ctx.reduceMotion) {
        const jar = FARM_SPRITES().honey, bob = Math.round(Math.sin(ctx.t * 2.4) * 1.2);
        g.drawImage(jar, at("bees") - Math.floor(jar.width / 2), BASE - 15 - 11 + bob);
      }
      if (!ctx.state?.gardenHover) return;
      g.globalAlpha = 0.85;
      for (const piece of pieces(ctx)) g.drawImage(outlineOf(piece.img), piece.x - 1, piece.y - 1);
      g.globalAlpha = 1;
    },
    // Donde esta cada cosa (px de arte), para que Pip vaya a por ella.
    spot(key) { return G ? at(key) : null; },
    get layout() { return G; }
  };
}
