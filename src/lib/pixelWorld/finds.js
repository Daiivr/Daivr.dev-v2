import { outlinedSprite } from "./core.js";

// Los hallazgos de la patrulla (FIELD_FINDS) en grande y con detalle, a juego
// con los iconos de las capturas (catches.js): contorno de su propio tono
// oscuro, luz arriba a la izquierda, brillos. Los usan el diario (tarjeta y
// pecera) y las baldas del cuarto; en el sendero siguen los pequeños de
// events/creatures.js (FINDS), medio enterrados.

// La moneda: canto, ranura, cara con degradado, un "1" en relieve y un brillo.
function coinRows() {
  const g = [];
  for (let y = 0; y < 14; y++) {
    const row = [];
    for (let x = 0; x < 14; x++) {
      const d = Math.hypot(x + 0.5 - 7, y + 0.5 - 7);
      row.push(d > 7 ? "." : d > 5.7 ? (x + y < 13 ? "H" : "d") : d > 4.9 ? "Y" : x + y < 10 ? "H" : x + y > 16 ? "Y" : "y");
    }
    g.push(row);
  }
  // (grabado: trazo oscuro con el borde de abajo a la derecha claro)
  for (let y = 3; y <= 9; y++) { g[y][7] = "n"; g[y][8] = "N"; }
  g[4][6] = "n"; g[5][5] = "n"; g[5][6] = "N"; g[6][5] = "N";
  for (let x = 5; x <= 9; x++) { g[10][x] = "n"; g[11][x] = "N"; }
  g[3][3] = "h"; g[3][4] = "h"; g[4][3] = "h"; g[2][5] = "h";
  return g.map((r) => r.join(""));
}

const ART = {
  "arcade-coin": [coinRows(), { H: "#ffe28a", y: "#ffd166", Y: "#e0a830", d: "#b07a1e", h: "#fffbe0", N: "#fff0b0", n: "#a8701e" }, "#6a4410"],
  // Disquete de 3,5": cuerpo azul con canto claro y sombra, chapa metalica con
  // su ventana, etiqueta con raya rosa y renglones, y el agujero de proteccion.
  "floppy-disk": [[
    "bbbbbbbbbbbb..",
    "bBSSSSSSSkSBb.",
    "bBShhhhhhkSBBb",
    "bBSSSSSSSkSBBD",
    "bBssssssssSBBD",
    "bBBBBBBBBBBBBD",
    "bBRRRRRRRRRRBD",
    "bBWWWWWWWWWWBD",
    "bBWlllllllWWBD",
    "bBWWWWWWWWWWBD",
    "bBWllllWWWWWBD",
    "bBWWWWWWWWWwBD",
    "bqBBBBBBBBBBBD",
    "DDDDDDDDDDDDDD"
  ], { b: "#5ab4d8", B: "#2a86b0", D: "#1a5a7a", S: "#c8d4dc", h: "#eef4f8", s: "#8a9aa8", k: "#2a3a4a", R: "#ff6a9e", W: "#f4fff8", l: "#9aaab8", w: "#d8e4e8", q: "#123a4a" }, "#0f3448"],
  // Pila: borne y tapa metalicos, cuerpo verde con reflejo, rayo y la base.
  battery: [[
    "...tTTt...",
    "..tTTTTt..",
    "cCCCCCCCCc",
    "hgGGGGGGGd",
    "hgGGGGYGGd",
    "hgGGGYYGGd",
    "hgGGYYGGGd",
    "hgGYyYYYGd",
    "hgGGGYYGGd",
    "hgGGYYGGGd",
    "hgGGYGGGGd",
    "hgGGGGGGGd",
    "kKKKKKKKKk",
    ".kkkkkkkk."
  ], { t: "#8a9490", T: "#d8e0dc", c: "#8a9490", C: "#c8d0cc", h: "#9af0b8", g: "#c8ffd8", G: "#3fcf7a", d: "#1f8a4a", Y: "#ffd166", y: "#fffbe0", k: "#1a4a2a", K: "#2a6a3a" }, "#0f3a24"],
  // El bicho amigo, visto desde arriba: antenas, cara verde con ojos grandes y
  // sonrisa, caparazon rosa partido con lunares y seis patitas.
  "lost-bug": [[
    "...A......A...",
    "....a....a....",
    "....gGGGGG....",
    "...gwwGGwwG...",
    "...GweGGewG...",
    "...GGGmmGGG...",
    "..pppppkPPPP..",
    "lpppPPPkPPPPQl",
    ".ppPsPPkPPsPQ.",
    "lpPPPPPkPPPPQl",
    ".pPPPsPkPsPPQ.",
    "lPPPPPPkPPPQQl",
    "..QPPPPkPPQQ..",
    "....QQQkQQ...."
  ], { A: "#8fe0a0", a: "#2a4a3a", g: "#8fd89a", G: "#4a9a5a", w: "#ffffff", e: "#1a1a2a", m: "#1f3a2a", p: "#ffb8dc", P: "#ff6fb0", Q: "#c8407a", k: "#7a2a4a", s: "#7a2a4a", l: "#5a2a3a" }, "#3a0f28"],
  // Cartucho: estrias para agarrarlo, etiqueta con un paisajito y contactos dorados.
  "mini-cartridge": [[
    "llllllllllld",
    "lPPPPPPPPPPd",
    "lPrPrPrPrPPd",
    "lPPPPPPPPPPd",
    "lPKKKKKKKKPd",
    "lPKbbbbbbKPd",
    "lPKbbyybbKPd",
    "lPKbgggbbKPd",
    "lPKggggggKPd",
    "lPKKKKKKKKPd",
    "lPPPPPPPPPPd",
    "ldPPPPPPPPdd",
    ".dYdYdYdYdd.",
    "..YdYdYdYd.."
  ], { l: "#c8b8ff", P: "#8b6fe0", d: "#5a3fa8", r: "#6a50c0", K: "#2a1a4a", b: "#7ad0f0", y: "#ffd166", g: "#5ac87a", Y: "#ffd166" }, "#24123f"]
};

export const isFindArt = (id) => Boolean(ART[id]);
const cache = new Map();
export function findSprite(id) {
  let img = cache.get(id);
  if (!img && ART[id]) { img = outlinedSprite(...ART[id]); cache.set(id, img); }
  return img || null;
}
