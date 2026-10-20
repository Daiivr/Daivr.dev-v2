import { makeCanvas, px, rect } from "../core.js";
import { FARM_SPRITES } from "../farmArt.js";
import { STAND_TOP } from "../layout.js";

// El tablon de encargos (Help Wanted), clavado en el frente del mostrador del
// puesto, a la izquierda (el cartel de CLOSED va en el centro). Sin nota hasta
// que Pip clava la del dia por la mañana; con la nota, un "!" amarillo
// botando encima (como en Stardew); hecho, la nota lleva un sello verde.
// FooterWorld pone `state.board` ("empty" | "note" | "done") y
// `state.boardHover`.
const HOVER = "#fff3c4";
export const BOARD_DX = 3, BOARD_DY = 46;

let hover = null;
function hoverOutline(img) {
  if (hover) return hover;
  const [c, g] = makeCanvas(img.width + 2, img.height + 2);
  g.fillStyle = HOVER;
  g.fillRect(0, 0, c.width, 1); g.fillRect(0, c.height - 1, c.width, 1); g.fillRect(0, 0, 1, c.height); g.fillRect(c.width - 1, 0, 1, c.height);
  hover = c;
  return c;
}

export function createBoard() {
  let L = null;
  const left = () => L.standX + BOARD_DX, top = () => STAND_TOP + BOARD_DY;
  return {
    setup(ctx) { L = ctx.L; },
    ground(g, ctx) {
      if (!L) return;
      const S = FARM_SPRITES().board, state = ctx.state?.board || "empty";
      g.drawImage(S[state] || S.empty, left(), top());
    },
    glow(g, ctx) {
      if (!L) return;
      const S = FARM_SPRITES().board;
      if (ctx.state?.board === "note" && !ctx.reduceMotion) {
        // el "!" de encargo nuevo, botando
        const x = left() + 6, y = top() - 8 + Math.round(Math.sin(ctx.t * 3.2) * 1.2);
        rect(g, x - 1, y - 1, 3, 7, "#3a2410");
        rect(g, x, y, 1, 3, "#ffd84a"); px(g, x, y + 4, "#ffd84a");
        px(g, x - 1, y + 3, "#3a2410"); px(g, x + 1, y + 3, "#3a2410");
      }
      if (ctx.state?.boardHover) { g.globalAlpha = 0.9; g.drawImage(hoverOutline(S.empty), left() - 1, top() - 1); g.globalAlpha = 1; }
    },
    // (px de arte) donde se pone Pip para clavar la nota
    get x() { return L ? left() + 7 : null; }
  };
}
