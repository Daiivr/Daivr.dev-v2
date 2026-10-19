import { lazy, outlinedSprite } from "./core.js";

// Como se ve cada caña y cada señuelo, en un solo sitio: en la mano de Pip
// (events/fishing.js), en el soporte de cañas del prado (life/tackleRack.js)
// y en su icono del inventario y las tiendas (marketGoods.js), con los mismos
// colores en todos. Cada caña: vara (luz, sombra), puntera, mango (claro,
// oscuro, borde) y carrete (claro, medio, oscuro); `nodes`, nudos del bambu.
export const ROD_LOOK = {
  "": { blank: ["#c9965a", "#8a6a3a"], tip: ["#45d8ff", "#1f6f93"], grip: ["#7a5232", "#5a3a1e", "#3a2414"], reel: ["#ffd166", "#b8862a", "#6a4a10"], bob: "#e84a3a" },
  "rod-driftwood": { blank: ["#b8865a", "#7a5232"], tip: ["#45d8ff", "#1f6f93"], grip: ["#e0c49a", "#b0905e", "#6a4a2a"], reel: ["#c8d0d8", "#8a94a0", "#3a4048"], bob: "#e84a3a", knots: true },
  "rod-bamboo": { blank: ["#a8e070", "#5aa83a"], tip: ["#45d8ff", "#1f6f93"], grip: ["#f0dca8", "#c0a068", "#7a6238"], reel: ["#c8d0d8", "#8a94a0", "#3a4048"], bob: "#3fff97", nodes: true },
  "rod-neon": { blank: ["#ff6ab8", "#b0206a"], tip: ["#ffd166", "#b8862a"], grip: ["#3a3a4e", "#24243a", "#101018"], reel: ["#7ae8ff", "#2a9ac0", "#0e3a4a"], bob: "#ff3d9d" },
  "rod-golden": { blank: ["#ffe08a", "#c8962e"], tip: ["#f4fff8", "#a8c0c8"], grip: ["#d8503e", "#9a2a20", "#5a1410"], reel: ["#fff4c0", "#e0b048", "#8a6420"], bob: "#ffd166" },
  "rod-fiberglass": { blank: ["#f4e6b8", "#b8a070"], tip: ["#ff5a4a", "#a82a20"], grip: ["#e8c890", "#c8a060", "#8a6a3a"], reel: ["#eef2f6", "#a8b4c0", "#4a5460"], bob: "#e84a3a" },
  "rod-iridium": { blank: ["#c49af4", "#6a3ab0"], tip: ["#ffe0ff", "#c88af0"], grip: ["#4a3a5a", "#2e2238", "#1a1222"], reel: ["#ffe08a", "#d8a840", "#8a6420"], bob: "#c88af0" }
};
export const rodLook = (id) => ROD_LOOK[id] || ROD_LOOK[""];

// Los señuelos en la punta del sedal: pequeños, pero con la misma forma y los
// mismos colores que su icono (marketGoods.js los dibuja en grande).
export const LURE_LOOK = {
  "": [["rr", "ww"], { r: "#e84a4a", w: "#ffffff" }, "#3a1a1a"],
  lure: [[".y.", "yby", "yYy", ".y.", ".h."], { y: "#ffd166", Y: "#b8862a", b: "#45d8ff", h: "#c8d0d8" }, "#4a3a10"],
  "lure-swift": [["..c", ".cw", "cc.", "c.."], { c: "#45d8ff", w: "#f4fff8" }, "#123a4a"],
  "lure-anchor": [[".o.", ".c.", "ccc", ".c.", "gcg"], { c: "#45d8ff", g: "#3fff97", o: "#c8d0d8" }, "#123a4a"],
  "lure-magnet": [["w.w", "p.p", "ppp"], { w: "#f4fff8", p: "#ff3d9d" }, "#4a1030"],
  "lure-magic-bait": [[".s.", "pPp", "ppp", ".h."], { s: "#fff6ff", p: "#b04ad8", P: "#ff7ad8", h: "#c8d0d8" }, "#2a1036"],
  "lure-curiosity": [["r.mm.", "rmmmk", "r.mm."], { r: "#ff5a4a", m: "#a8e0e8", k: "#0a1418" }, "#142630"],
  "lure-crab-pot": [["wwww", "weew", "wcew", "wwww"], { w: "#a8743e", e: "#d8c898", c: "#e8503a" }, "#24160a"]
};
export const lureSprites = lazy(() => Object.fromEntries(Object.entries(LURE_LOOK).map(([id, [rows, pal, out]]) => [id, outlinedSprite(rows, pal, out)])));
export const lureSprite = (id) => lureSprites()[id] || lureSprites()[""];
