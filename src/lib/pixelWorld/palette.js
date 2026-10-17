import { mix } from "./core.js";

// Una sola paleta para todo el mundo: cinco tonos por material (contorno,
// sombra, base, luz, brillo) con la luz llegando desde arriba a la izquierda.
const BASE = {
  leaf: ["#1d4426", "#2d6a2e", "#47913a", "#6db646", "#a2da5e"],
  pine: ["#12342b", "#1d523f", "#2a6e4f", "#41905d", "#6ab673"],
  bark: ["#3a2214", "#5a371f", "#7f532c", "#a6723d", "#c99558"],
  grass: ["#2c6428", "#3d8432", "#53a03c", "#71bb48", "#9ad45c"],
  dirt: ["#5b3a20", "#86592f", "#ab7944", "#cb9e62", "#e4c389"],
  stone: ["#363b48", "#596070", "#80889a", "#acb3c1", "#dde1e8"],
  wood: ["#3d2010", "#6a3d1d", "#94592b", "#bd7f40", "#e0a861"],
  awning: ["#5c1a1d", "#a8323a", "#d9504a", "#f2e3c0", "#fff7e2"],
  fire: ["#e8492a", "#ff8a2a", "#ffc73a", "#ffeb8a", "#fffbe6"]
};
const BASE_HILLS = [["#7fb39f", "#9fcdb9", "#71a48f"], ["#538f6c", "#71ae86", "#467f5f"]];

// Los eventos de temporada de la pagina (src/lib/seasons.js) cambian colores.
export const SEASON_PALETTES = {
  winter: {
    pal: { leaf: ["#22303a", "#3a4f5c", "#5a7480", "#7f98a2", "#a8bcc4"], grass: ["#7f95b0", "#a9bdd2", "#d2e0ee", "#eaf2f9", "#ffffff"], dirt: ["#6f7f95", "#93a4b8", "#bccadb", "#d8e2ed", "#f0f5fa"] },
    hills: [["#cfdcea", "#eef5fb", "#b8c8da"], ["#a9bdd2", "#d6e4f0", "#93a8bf"]]
  },
  halloween: {
    pal: { leaf: ["#3a1a10", "#7a3214", "#c05a1a", "#e8902a", "#ffc04a"], pine: ["#141e1e", "#1f3330", "#2a4a40", "#3a6050", "#507a62"], grass: ["#3a3a1e", "#5a5a28", "#7a7432", "#9a8f40", "#bcae58"], dirt: ["#4a2e1a", "#6e4a2a", "#8e6438", "#ad824e", "#c8a06a"] },
    hills: [["#5a4a72", "#7a6a92", "#4e4066"], ["#3a2e50", "#52446a", "#302644"]]
  },
  "april-fools": {
    pal: { leaf: ["#3a1240", "#7a2a7a", "#c04aa8", "#f07ad0", "#ffb8f0"], pine: ["#101a40", "#1a3070", "#2a52a8", "#4a86d8", "#7ab8ff"], grass: ["#3a2058", "#583080", "#7a46a8", "#9a66c8", "#c090e8"], dirt: ["#24503f", "#357560", "#4f9c7e", "#74c09c", "#a2dcbc"] },
    hills: [["#f0b0d8", "#ffd0ec", "#e098c8"], ["#c878c0", "#e8a0dc", "#b060a8"]]
  }
};

// Paleta viva (la cambia applySeason); el resto de modulos la leen.
export const P = { ...BASE };
let hills = BASE_HILLS;
let season = "";

export function applySeason(name) {
  season = name || "";
  const custom = SEASON_PALETTES[season]?.pal || {};
  for (const key of Object.keys(BASE)) P[key] = custom[key] || BASE[key];
  hills = SEASON_PALETTES[season]?.hills || BASE_HILLS;
}
export const currentSeason = () => season;
export const hillColors = () => hills;

// La lejania tira hacia el azul del aire.
const HAZE = "#5f8f98";
export const hazed = (pal, t) => (t ? pal.map((c) => mix(c, HAZE, t)) : pal);
