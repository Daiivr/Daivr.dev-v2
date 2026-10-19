import { lazy, outlinedSprite, px, rng } from "../core.js";
import { seasonGroundSpots } from "../layout.js";
import { dayNumber, natureSeason } from "./util.js";

// Forraje: cada dia salen tres cosas de temporada en el borde del prado
// (cebolletas y dientes de leon en primavera, fresas y guisantes en verano,
// setas y avellanas en otoño, raices y acebo en invierno). Pip las recoge
// (useBuddyForage) y dan una moneda. Lo recogido hoy lo guarda FooterWorld.
export const FORAGE = {
  "spring-onion": { name: "Spring Onion", rows: [".g.g.", ".g.g.", "..gG.", "..G..", ".wWw.", ".www.", "..r.."], pal: { g: "#5ac84a", G: "#3a8a3a", w: "#f4f4e8", W: "#d8e8c8", r: "#c8b890" }, out: "#2a4a1a" },
  dandelion: { name: "Dandelion", rows: [".y.y.", "yYyYy", ".yYy.", "..g..", ".lg..", "..gl."], pal: { y: "#ffd84a", Y: "#ffaa2a", g: "#4a9a3a", l: "#7ac85a" }, out: "#3a4a1a" },
  "wild-leek": { name: "Wild Leek", rows: ["g...g", ".g.g.", "..g..", "..G..", ".wpw.", ".www.", "..r.."], pal: { g: "#6ad85a", G: "#3a8a3a", w: "#f4f0f4", p: "#c88ad8", r: "#c8b890" }, out: "#2a3a2a" },
  "wild-strawberry": { name: "Wild Strawberry", rows: [".g.g.", "..g..", ".rRr.", "rRwRr", ".rRr.", "..r.."], pal: { g: "#4aa83a", r: "#e83a4a", R: "#ff6a7a", w: "#fff0a0" }, out: "#4a1018" },
  "sweet-pea": { name: "Sweet Pea", rows: ["p.p..", ".pPp.", "..g.p", ".g.Pp", "..g..", "..g.."], pal: { p: "#e88ad8", P: "#ffc0f0", g: "#4aa83a" }, out: "#3a1a3a" },
  blueberries: { name: "Blueberries", rows: ["..g..", ".gBg.", "bBbBb", ".bBb.", "..b.."], pal: { g: "#4aa83a", b: "#3a5ac8", B: "#8aa8f8" }, out: "#141a3a" },
  "common-mushroom": { name: "Common Mushroom", rows: [".mMMm.", "mMwMMm", "mmmmmm", ".ssss.", "..sS..", "..sS.."], pal: { m: "#a8743e", M: "#c8955a", w: "#f0d8b0", s: "#f0e8d8", S: "#c8bca8" }, out: "#3a2414" },
  chanterelle: { name: "Chanterelle", rows: ["oOOOo", "oOOOo", ".oOo.", "..o..", "..o.."], pal: { o: "#e89a2a", O: "#ffc04a" }, out: "#5a3010" },
  hazelnut: { name: "Hazelnut", rows: ["..g..", ".gGg.", ".hHh.", "hHHwh", "hHHHh", ".hhh."], pal: { g: "#7a9a3a", G: "#9ab84a", h: "#8a5a2e", H: "#b07a3e", w: "#e0b070" }, out: "#2a1a0e" },
  "winter-root": { name: "Winter Root", rows: [".g.g.", "..g..", ".rRr.", "rRRwr", ".rRr.", "..r..", "..r.."], pal: { g: "#5a8a4a", r: "#8a4a8a", R: "#b06ab0", w: "#e0c0e8" }, out: "#2a1430" },
  holly: { name: "Holly", rows: [".g.G.", "gGgGg", ".grg.", "..rR.", "...r."], pal: { g: "#2a7a3a", G: "#4aa85a", r: "#e8343a", R: "#ff7a7a" }, out: "#0e2a14" },
  pinecone: { name: "Pinecone", rows: ["..g..", ".bBb.", "bBbBb", ".bBb.", "bBbBb", ".bbb."], pal: { g: "#3a6a3a", b: "#7a4a22", B: "#a8743e" }, out: "#2a1a0e" }
};
const BY_SEASON = { spring: ["spring-onion", "dandelion", "wild-leek"], summer: ["wild-strawberry", "sweet-pea", "blueberries"], autumn: ["common-mushroom", "chanterelle", "hazelnut"], winter: ["winter-root", "holly", "pinecone"] };
const sprites = lazy(() => Object.fromEntries(Object.entries(FORAGE).map(([id, f]) => [id, outlinedSprite(f.rows, f.pal, f.out)])));

// Las de hoy: tres sitios en el borde del prado, lejos del mercado, las
// farolas, la tienda, el buzon, el huerto, el barril de las cañas, el sitio
// del pescador y lo que pone la fiesta en el suelo (el mismo dia, el mismo
// sitio).
export function forageFor(L, W, season, day = dayNumber()) {
  const kinds = BY_SEASON[natureSeason(season)] || BY_SEASON.spring, R = rng(day * 7919 + 13), out = [];
  const lo = (L.noWater?.[1] ?? 0) + 12, hi = W - 10, festive = seasonGroundSpots(season, L);
  const inside = (x, a, b, pad) => x > a - pad && x < b + pad;
  const blocked = (x) => L.lamps.some((lx) => Math.abs(lx - x) < 7) || Math.abs(x - L.tentX) < 22 || Math.abs(x - L.mailX) < 9 || (L.garden && inside(x, L.garden.x, L.garden.end, 6))
    || (L.rack && inside(x, L.rack.x, L.rack.x + L.rack.w, 6)) || (L.fisher && inside(x, L.fisher.left, L.fisher.right, 4))
    || festive.some((fx) => Math.abs(fx - x) < 10) || out.some((o) => Math.abs(o.x - x) < 26);
  for (let slot = 0, tries = 0; slot < 3 && tries < 60 && hi > lo; tries++) {
    const x = Math.round(lo + R() * (hi - lo));
    if (blocked(x)) continue;
    out.push({ slot, x, kind: kinds[Math.floor(R() * kinds.length)] });
    slot++;
  }
  return out.map((o) => ({ ...o, name: FORAGE[o.kind].name, day }));
}

export function createForage() {
  let items = [], popped = [];
  return {
    setup(ctx) { items = []; popped = []; },
    // FooterWorld pone las de hoy que quedan por recoger.
    set(list) { items = list.slice(); },
    pick(slot, ctx) {
      const item = items.find((i) => i.slot === slot);
      if (!item) return null;
      items = items.filter((i) => i !== item);
      popped.push({ ...item, t0: ctx.t });
      for (let k = 0; k < 6; k++) ctx.spawn({ k: "star", x: item.x, y: 66, vx: (Math.random() - 0.5) * 30, vy: -14 - Math.random() * 14, g: 40, life: 0.5 });
      ctx.spawn({ k: "coin", x: item.x, y: 64, vx: 0, vy: -24, g: 50, life: 0.8 });
      return item;
    },
    update(ctx) { popped = popped.filter((p) => ctx.t - p.t0 < 0.6); },
    ground(g, ctx) {
      const S = sprites();
      for (const it of items) { const img = S[it.kind]; g.drawImage(img, it.x - Math.floor(img.width / 2), 72 - img.height); }
      // recogida: salta y se desvanece
      for (const p of popped) {
        const e = (ctx.t - p.t0) / 0.6, img = S[p.kind];
        g.globalAlpha = 1 - e;
        g.drawImage(img, p.x - Math.floor(img.width / 2), Math.round(72 - img.height - Math.sin(e * Math.PI) * 8));
        g.globalAlpha = 1;
      }
    },
    // un brillo de vez en cuando, para que se vean
    glow(g, ctx) {
      for (const it of items) {
        const c = ((ctx.t + it.slot * 1.3) % 3.4) / 3.4;
        if (c > 0.1) continue;
        const x = it.x + 2, y = 72 - 7;
        px(g, x, y, "#ffffff");
        if (c > 0.025 && c < 0.075) { px(g, x - 1, y, "#fff6cf"); px(g, x + 1, y, "#fff6cf"); px(g, x, y - 1, "#fff6cf"); px(g, x, y + 1, "#fff6cf"); }
      }
    },
    get items() { return items; }
  };
}
