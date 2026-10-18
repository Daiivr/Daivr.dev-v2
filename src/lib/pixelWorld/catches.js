import { mix, outlinedSprite } from "./core.js";

// Iconos de todas las capturas (shared/buddy-catches.mjs, las del diario y las
// del valle) al estilo Stardew: cada
// pez en diagonal (cola abajo a la izquierda, morro arriba a la derecha),
// generado desde un perfil de cuerpo con sombreado lomo-vientre, franja de
// brillo, aletas con radios, agalla, ojo con brillo y contorno oscuro.
const FISH = {
  "byte-minnow": { W: 2.3, len: 0.78, tail: "fork", fin: 0.6, c: ["#1d6fa0", "#45d8ff", "#8eeaff", "#e6fbff", "#7fd8f0"], pat: "line", p: "#1d6fa0" },
  "cache-carp": { W: 3.5, len: 0.92, tail: "round", fin: 0.8, c: ["#1f7a4a", "#3fcf7f", "#7ce8a8", "#e6f8d8", "#ffd166"], pat: "scales", whisk: 1, p: "#1f7a4a" },
  "pixel-perch": { W: 3.4, len: 0.84, tail: "fork", fin: 1.2, spiky: true, c: ["#a8761a", "#ffd166", "#ffe7a0", "#fff6dc", "#ff8a3c"], pat: "bars", p: "#6a4a14" },
  "buffer-bass": { W: 3.3, len: 0.96, tail: "fork", fin: 1, c: ["#2a6a7a", "#67e8f9", "#a8f2fb", "#effdff", "#3fa8b8"], pat: "band", p: "#1f4a5a", bigMouth: true },
  "cursor-guppy": { W: 2.1, len: 0.62, tail: "fan", tailW: 2.1, fin: 0.5, c: ["#a8b8b0", "#f4fff8", "#ffffff", "#ffffff", "#45d8ff"], pat: "tailspots", p: "#ff7ac8" },
  "ping-sardine": { W: 2.2, len: 0.96, tail: "fork", fin: 0.5, c: ["#2a7a6a", "#73ffad", "#c8ffe0", "#f4fff8", "#a8f0c8"], pat: "dots", p: "#1f5a4a" },
  "syntax-salmon": { W: 3.1, len: 1, tail: "fork", fin: 0.7, c: ["#b8404a", "#ff8c69", "#ffb8a0", "#fff0e8", "#e86a5a"], pat: "spots", p: "#6a2028", hook: true },
  "neon-tetra": { W: 2.5, len: 0.76, tail: "fork", fin: 0.6, c: ["#22285a", "#3a4a8a", "#8a9ad8", "#f0e8ff", "#c8d0f0"], pat: "neon", p: "#45d8ff", p2: "#ff3d9d" },
  "circuit-catfish": { W: 3.2, len: 1, tail: "round", fin: 0.5, c: ["#1a4a3a", "#2f8a62", "#5ab88a", "#d8f0e0", "#2a6a50"], pat: "circuit", p: "#3fff97", whisk: 2, nose: 1.6 },
  "cobalt-cod": { W: 3.6, len: 1, tail: "round", fin: 0.9, fin2: true, c: ["#22408a", "#4f8cff", "#8ab4ff", "#eef4ff", "#3a6ad8"], whisk: 1, p: "#16306a" },
  "packet-puffer": { puffer: true, c: ["#b8802a", "#ffd166", "#ffe7a0", "#fff6d8", "#ffb04a"], p: "#7a5014" },
  "void-eel": { W: 1.6, len: 1.18, tail: "none", fin: 0.35, eel: true, c: ["#3a2a6a", "#a78bfa", "#c8b8ff", "#ece6ff", "#7a5ad8"], pat: "glowline", p: "#f0e8ff" },
  "glitch-koi": { W: 3.2, len: 0.95, tail: "fan", fin: 0.6, c: ["#c8b8c0", "#ffffff", "#ffffff", "#fff4f8", "#ffd8ec"], pat: "koi", p: "#ff3d9d", p2: "#ff8a3c", glitch: true },
  "recursion-ray": { ray: true, W: 6.4, len: 0.9, c: ["#1f6fa0", "#45d8ff", "#8eeaff", "#e6fbff", "#2a8ab0"], p: "#e6fbff" },
  "firewall-fangfish": { W: 3.6, len: 0.92, tail: "fork", fin: 1.3, spiky: true, c: ["#8a1a2a", "#ff5f68", "#ff9a8a", "#ffe0d8", "#ff9a3c"], pat: "flame", p: "#ff9a3c", p2: "#ffd166", fangs: true, nose: 1.5 },
  "prism-piranha": { W: 4.3, len: 0.8, tail: "fork", fin: 0.7, c: ["#8a2a7a", "#f472d0", "#ffb0e8", "#ffe8f6", "#c84aa8"], pat: "prism", fangs: true, nose: 1.7 },
  starfin: { W: 3.4, len: 1, tail: "fan", tailW: 1.7, fin: 1.5, c: ["#b8862a", "#ffd166", "#ffe7a0", "#fff6dc", "#fff0af"], pat: "stars", p: "#ffffff" },
  "crown-coelacanth": { W: 3.7, len: 1.05, tail: "fan", fin: 0.9, lobes: true, c: ["#7a5a1a", "#f6c453", "#ffe08a", "#fff3d0", "#c8902a"], pat: "scales", crown: true, p: "#ffd166" },
  "aurora-arowana": { W: 2.6, len: 1.15, tail: "fan", tailW: 1.4, fin: 0.7, c: ["#1f6a5a", "#67e8f9", "#a8f2fb", "#f0fdff", "#9ff0e8"], pat: "aurora", whisk: 1, p: "#1f6a5a" },
  "chrono-manta": { ray: true, manta: true, W: 7, len: 0.8, c: ["#5a2a8a", "#c084fc", "#e0c0ff", "#f4e8ff", "#8a5ad8"], p: "#ffffff" },
  "moonkernel-sturgeon": { W: 2.8, len: 1.15, tail: "fork", fin: 0.5, c: ["#5a6a7a", "#c8d4dc", "#e8eef2", "#ffffff", "#9aa8b4"], pat: "scutes", moon: true, snout: true, whisk: 1, p: "#ffffff" },
  // --- El valle (shared/buddy-catches.mjs VALLEY_CATALOG) ---
  pufferfish: { puffer: true, c: ["#9a7a2a", "#e8c860", "#f8e8a0", "#fff8e0", "#c8a040"], p: "#5a3a14" },
  anchovy: { W: 1.9, len: 0.8, tail: "fork", fin: 0.5, c: ["#3a5a7a", "#9ab8d0", "#d0e0ec", "#f4f8fc", "#7a98b0"], pat: "line", p: "#3a5a7a" },
  tuna: { W: 3.6, len: 1.05, tail: "fork", fin: 0.8, fin2: true, c: ["#1a2a5a", "#3a5aa8", "#8aa0d0", "#e8eef8", "#ffd166"], p: "#1a2a5a" },
  sardine: { W: 2.2, len: 0.9, tail: "fork", fin: 0.5, c: ["#2a4a6a", "#8ab0c8", "#c8dcea", "#f4f8fc", "#6a8aa8"], pat: "dots", p: "#2a4a6a" },
  bream: { W: 3.8, len: 0.9, tail: "fork", fin: 0.9, c: ["#5a4420", "#a8844a", "#d0b07a", "#f0e4c8", "#8a6a3a"], pat: "scales" },
  "largemouth-bass": { W: 3.4, len: 1, tail: "fork", fin: 1.1, spiky: true, c: ["#2a4a1a", "#5a8a3a", "#9ac070", "#eef4d8", "#4a7a2a"], pat: "band", p: "#2a3a1a", bigMouth: true },
  "smallmouth-bass": { W: 3.2, len: 0.95, tail: "fork", fin: 1, spiky: true, c: ["#4a4a1a", "#8a9a4a", "#c0c880", "#f4f0d8", "#7a7a3a"], pat: "bars", p: "#4a4a1a" },
  "rainbow-trout": { W: 3, len: 1, tail: "fork", fin: 0.7, c: ["#3a5a4a", "#8aa890", "#c8dcc8", "#f4f8f0", "#ff8ab8"], pat: "rainbowband", p: "#ff6aa8", p2: "#2a3a30" },
  salmon: { W: 3.1, len: 1, tail: "fork", fin: 0.7, c: ["#8a3a3a", "#ff8c69", "#ffb8a0", "#fff0e8", "#d86a5a"], pat: "spots", p: "#5a2020", hook: true },
  walleye: { W: 2.8, len: 1.05, tail: "fork", fin: 1.1, spiky: true, c: ["#6a5a1a", "#c8b048", "#e8d888", "#f8f4e0", "#a89038"], pat: "bars", p: "#5a4a1a", bigEye: true },
  perch: { W: 3, len: 0.85, tail: "fork", fin: 1.2, spiky: true, c: ["#6a5a10", "#c8a830", "#e8d070", "#fff8e0", "#ff8a3c"], pat: "bars", p: "#4a3a10" },
  carp: { W: 3.5, len: 0.95, tail: "round", fin: 0.8, c: ["#5a5020", "#a89a5a", "#d0c890", "#f4f0d8", "#c8a040"], pat: "scales", whisk: 1, p: "#5a5020" },
  catfish: { W: 3, len: 1.05, tail: "round", fin: 0.5, c: ["#2a2a22", "#6a6a5a", "#9a9a88", "#d8d8c8", "#4a4a3a"], whisk: 2, nose: 1.6, p: "#2a2a22" },
  pike: { W: 2.3, len: 1.15, tail: "fork", fin: 0.5, c: ["#2a4a1a", "#6a8a4a", "#a8c080", "#eef4dc", "#5a7a3a"], pat: "speckle", p: "#c8d890", nose: 1.8 },
  sunfish: { W: 4.6, len: 0.75, tail: "round", fin: 1, c: ["#a85a1a", "#ffb84a", "#ffd890", "#fff4d0", "#ff8a3c"], pat: "dots", p: "#a85a1a" },
  "red-mullet": { W: 3, len: 0.95, tail: "fork", fin: 0.9, c: ["#8a2a1a", "#e8604a", "#ff9a80", "#fff0e8", "#ffd166"], pat: "line", p: "#ffd166", whisk: 2 },
  herring: { W: 2.4, len: 0.95, tail: "fork", fin: 0.5, c: ["#3a4a6a", "#b8c8d8", "#e0e8f0", "#ffffff", "#8a9ab8"], pat: "line", p: "#5a6a9a" },
  eel: { W: 1.6, len: 1.2, tail: "none", fin: 0.35, eel: true, c: ["#1a2a1a", "#4a5a3a", "#7a8a6a", "#c8d0b8", "#3a4a2a"], p: "#1a2a1a" },
  "red-snapper": { W: 3.4, len: 0.95, tail: "fork", fin: 1.2, spiky: true, c: ["#8a1a1a", "#e8504a", "#ff8a7a", "#ffe8e0", "#c83a3a"], pat: "scales", bigMouth: true },
  ghostfish: { W: 2.8, len: 0.9, tail: "fan", fin: 0.6, c: ["#a8b0b8", "#e8eef4", "#f8fbfd", "#ffffff", "#d0d8e0"], bigEye: true, p: "#a8b0b8" },
  stonefish: { W: 3.8, len: 0.85, tail: "round", fin: 1.3, spiky: true, c: ["#4a4a3a", "#8a8a7a", "#b0b0a0", "#d8d8c8", "#6a6a5a"], pat: "speckle", p: "#5a5a4a", bigMouth: true },
  "ice-pip": { W: 2, len: 0.7, tail: "fork", fin: 0.7, c: ["#3a8aa8", "#8ae8f8", "#c8f8ff", "#ffffff", "#5ac8e8"], pat: "stars", p: "#ffffff" },
  "lava-eel": { W: 1.7, len: 1.2, tail: "none", fin: 0.4, eel: true, c: ["#6a1a0a", "#ff5a2a", "#ff9a5a", "#ffe08a", "#c83a1a"], pat: "glowline", p: "#ffe08a" },
  sandfish: { W: 3, len: 0.9, tail: "fork", fin: 0.8, c: ["#8a6a3a", "#e8c890", "#f4e0b0", "#fff8e8", "#c8a060"], pat: "speckle", p: "#a8844a" },
  "scorpion-carp": { W: 3.3, len: 0.95, tail: "fork", fin: 1.2, spiky: true, c: ["#3a5a1a", "#8ab84a", "#b8e080", "#f0f8d8", "#6a9a3a"], pat: "bars", p: "#2a3a10", fangs: true },
  flounder: { W: 4.4, len: 0.85, tail: "round", fin: 1.4, c: ["#5a4a2a", "#a8946a", "#c8b890", "#e8dcc0", "#8a7a5a"], pat: "speckle", p: "#5a4a2a", bigEye: true },
  "midnight-carp": { W: 3.4, len: 0.95, tail: "round", fin: 0.8, c: ["#1a1a3a", "#3a3a6a", "#6a6aa8", "#a8a8d8", "#2a2a5a"], pat: "scales", whisk: 1, p: "#8a8ad8" },
  sturgeon: { W: 2.8, len: 1.15, tail: "fork", fin: 0.5, c: ["#3a4a4a", "#7a8a8a", "#a8b4b4", "#e0e8e8", "#5a6a6a"], pat: "scutes", snout: true, whisk: 1, p: "#e0e8e8" },
  "tiger-trout": { W: 3, len: 1, tail: "fork", fin: 0.7, c: ["#5a4a1a", "#c89a3a", "#e8c878", "#fff4dc", "#a87a2a"], pat: "tiger", p: "#4a3a10" },
  bullhead: { W: 3, len: 0.9, tail: "round", fin: 0.6, c: ["#2a2018", "#5a4a3a", "#8a7a68", "#c8b8a0", "#4a3a2a"], whisk: 2, p: "#2a2018" },
  tilapia: { W: 3.4, len: 0.9, tail: "round", fin: 1.1, spiky: true, c: ["#4a4a5a", "#a8a8b8", "#c8c8d8", "#eeeef4", "#ff8a8a"], pat: "bars", p: "#6a6a7a" },
  chub: { W: 3, len: 0.9, tail: "fork", fin: 0.7, c: ["#4a5a50", "#9aa8a0", "#c8d0c8", "#f0f4f0", "#d8a868"], p: "#4a5a50" },
  dorado: { W: 3.2, len: 1.05, tail: "fork", fin: 1, c: ["#8a6a1a", "#ffc84a", "#ffe08a", "#fff8d8", "#3ab8a8"], pat: "speckle", p: "#3a8a7a", nose: 1.4 },
  albacore: { W: 3.3, len: 1, tail: "fork", fin: 0.7, fin2: true, c: ["#2a3a5a", "#6a8ab8", "#a8c0e0", "#f0f4fc", "#4a6a98"], pat: "line", p: "#e0e8f8" },
  shad: { W: 2.6, len: 0.95, tail: "fork", fin: 0.5, c: ["#3a4a5a", "#b8c0c8", "#e0e4e8", "#ffffff", "#8a98a8"], pat: "dots", p: "#3a4a5a" },
  lingcod: { W: 2.8, len: 1.1, tail: "round", fin: 1.2, spiky: true, c: ["#2a4a2a", "#6a8a5a", "#9ab88a", "#e0ecd8", "#4a6a3a"], pat: "speckle", p: "#c8e0a8", bigMouth: true, fangs: true },
  halibut: { W: 4.2, len: 0.95, tail: "round", fin: 1.5, c: ["#5a5040", "#b0a080", "#d0c4a8", "#f0ece0", "#8a8068"], pat: "speckle", p: "#6a6050", bigEye: true },
  woodskip: { W: 3, len: 0.95, tail: "fork", fin: 0.8, c: ["#5a3a1a", "#9a6a3a", "#c8955a", "#f0dcc0", "#7a4a22"], pat: "wood", p: "#5a3a1a" },
  "void-salmon": { W: 3.1, len: 1, tail: "fork", fin: 0.8, c: ["#1a0a2a", "#5a2a7a", "#8a5ab0", "#d0b8e8", "#3a1a5a"], pat: "spots", p: "#c8a8ff", hook: true },
  slimejack: { W: 2.8, len: 1.05, tail: "fork", fin: 0.9, c: ["#1a5a1a", "#6ad84a", "#a8f088", "#e8ffd8", "#4ab83a"], pat: "speckle", p: "#c8ff9a" },
  stingray: { ray: true, W: 6.2, len: 0.9, c: ["#4a3a2a", "#8a7a6a", "#b0a090", "#e8e0d8", "#6a5a4a"], p: "#d8d0c0" },
  lionfish: { W: 3.2, len: 0.95, tail: "fan", tailW: 1.8, fin: 1.8, spiky: true, c: ["#7a1a0a", "#e86a4a", "#ffb8a0", "#fff4ec", "#f8e0d0"], pat: "tiger", p: "#fff0e8" },
  "blue-discus": { W: 5, len: 0.75, tail: "round", fin: 1.2, c: ["#1a3a8a", "#3a8ae8", "#8ac0ff", "#e8f4ff", "#ff8a3c"], pat: "tiger", p: "#ff8a3c" },
  "spook-fish": { W: 2.4, len: 1, tail: "fork", fin: 0.5, c: ["#1a2028", "#3a4a5a", "#6a7a8a", "#a8b8c8", "#2a3a48"], bigEye: true, pat: "glowline", p: "#8ae8ff" },
  goby: { W: 2.4, len: 0.8, tail: "round", fin: 1, c: ["#4a3a2a", "#a8946a", "#d0c090", "#f4ecd8", "#8a7a5a"], pat: "speckle", p: "#4a3a2a", bigEye: true },
  crimsonfish: { W: 3.4, len: 1.05, tail: "fan", tailW: 1.7, fin: 1.4, c: ["#7a0a1a", "#e8303a", "#ff7a80", "#ffe0e0", "#ff5a3a"], pat: "scales", p: "#ffd166" },
  angler: { W: 3.8, len: 0.9, tail: "round", fin: 0.9, c: ["#5a4a1a", "#c8a858", "#e8d090", "#f8f0d8", "#8a7a3a"], lure: true, bigMouth: true, fangs: true, pat: "speckle", p: "#7a6a2a" },
  legend: { W: 3.8, len: 1.1, tail: "fork", fin: 1.3, c: ["#1a4a2a", "#58b868", "#98e0a0", "#e8fff0", "#e8b03a"], pat: "spots", p: "#e8303a", bigMouth: true },
  glacierfish: { W: 3, len: 1.05, tail: "fan", tailW: 1.8, fin: 1.6, spiky: true, c: ["#3a7a9a", "#a8e8f8", "#e0faff", "#ffffff", "#78c8e0"], pat: "stars", p: "#ffffff" },
  "mutant-carp": { W: 3.6, len: 0.95, tail: "round", fin: 0.9, c: ["#2a5a1a", "#7ae84a", "#b8ff88", "#efffe0", "#4ab83a"], pat: "koi", p: "#a84ad8", p2: "#3a1a5a", whisk: 1, glitch: true },
  "son-of-crimsonfish": { W: 3, len: 0.9, tail: "fan", tailW: 1.6, fin: 1.3, c: ["#8a1a2a", "#ff5a6a", "#ff9aa0", "#fff0f0", "#ffd166"], pat: "scales", p: "#ffd166" },
  "ms-angler": { W: 3.6, len: 0.88, tail: "round", fin: 0.9, c: ["#8a4a6a", "#e8a8c8", "#f8d0e4", "#fff4fa", "#c87aa8"], lure: true, bigMouth: true, pat: "speckle", p: "#c87aa8" },
  "legend-ii": { W: 3.6, len: 1.1, tail: "fork", fin: 1.2, c: ["#0a3a1a", "#3a9a58", "#78d090", "#e0fff0", "#ffd166"], pat: "stars", p: "#ffd166", bigMouth: true },
  "glacierfish-jr": { W: 2.6, len: 0.85, tail: "fan", tailW: 1.8, fin: 1.5, spiky: true, c: ["#5a9ab8", "#d8f4ff", "#f0fcff", "#ffffff", "#9ad8f0"], pat: "stars", p: "#8ae8ff" },
  "radioactive-carp": { W: 3.5, len: 0.95, tail: "round", fin: 0.9, c: ["#4a6a0a", "#c8ff4a", "#e8ffa0", "#fbffe8", "#8ae82a"], pat: "glowline", p: "#ffffff", whisk: 1 }
};
const N = 18;
const hash2 = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
const grid = () => Array.from({ length: N }, () => Array(N).fill("."));

function diagFish(S) {
  const g = grid();
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2, nx = -Math.SQRT1_2, ny = -Math.SQRT1_2;
  const L = 15.2 * (S.len || 1), tl = S.tail === "none" ? 0 : 0.3, start = -L * (1 + tl) / 2;
  const wAt = (u) => {
    if (u < 0 || u > 1) return 0;
    const front = u > 0.5 ? Math.pow(Math.max(0, 1 - Math.pow((u - 0.5) / 0.5, 2)), 0.5 / (S.nose || 1) * 1.2) : 1;
    const back = u < 0.5 ? 0.3 + 0.7 * Math.pow(u / 0.5, 0.75) : 1;
    return S.W * Math.min(front, back);
  };
  const info = new Map();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const rx = x + 0.5 - N / 2, ry = y + 0.5 - N / 2, s = rx * dx + ry * dy;
    let v = rx * nx + ry * ny;
    const u = (s - start - L * tl) / L;
    if (S.eel) v += Math.sin(u * Math.PI * 3) * 1.1;
    let ch = null;
    const w = wAt(u) * (v < 0 ? 1.12 : 1);
    if (u >= 0 && u <= 1 && Math.abs(v) <= w) {
      const q = v / Math.max(0.5, w);
      ch = q > 0.55 ? "B" : q > 0.1 ? "b" : q > -0.35 ? "s" : "w";
      if (q > 0.25 && q < 0.48 && u > 0.22 && u < 0.84) ch = "h";
      if (u > 0.64 && u < 0.7 && Math.abs(q) < 0.6) ch = "d";
      info.set(x + "," + y, { u, q, v });
    } else if (u < 0 && u >= -tl && S.tail !== "none") {
      const t = -u / tl, ws = S.W * (0.35 + t * (S.tailW || 1.25));
      const inside = S.tail === "fork" ? Math.abs(v) <= ws && !(t > 0.5 && Math.abs(v) < (t - 0.5) * S.W * 1.7) : Math.abs(v) <= ws * (S.tail === "round" ? Math.sqrt(1 - t * t * 0.3) : 1);
      if (inside) ch = Math.round(v * 1.4) % 2 ? "r" : "f";
    } else if (S.fin && v > 0 && u > 0.28 && u < 0.72) {
      const q2 = (u - 0.28) / 0.44, h = S.fin * S.W * Math.pow(Math.sin(Math.PI * q2), 0.8) * (1 - 0.35 * q2);
      if (v <= wAt(u) + h) ch = S.spiky && (Math.round(s * 1.4) % 2) ? "r" : "f";
    } else if (v < 0 && u > 0.42 && u < 0.62) {
      const h = 0.5 * S.W * Math.sin(Math.PI * (u - 0.42) / 0.2);
      if (-v <= wAt(u) * 1.12 + h) ch = "f";
    }
    if (S.fin2 && v > 0 && u > 0.72 && u < 0.9 && !ch) { const h = 0.6 * S.W * Math.sin(Math.PI * (u - 0.72) / 0.18); if (v <= wAt(u) + h) ch = "f"; }
    if (S.snout && u > 1 && u < 1.14 && Math.abs(v) < 0.7) ch = "b";
    if (ch) g[y][x] = ch;
  }
  const set = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = ch; };
  const at = (u, q) => { const s = start + L * tl + u * L, v = q * wAt(u); return [N / 2 + s * dx + v * nx - 0.5, N / 2 + s * dy + v * ny - 0.5]; };
  for (const [k, I] of info) {
    const [x, y] = k.split(",").map(Number), c = g[y][x];
    if (c === "d" || c === "w") { if (S.pat !== "koi" || c === "d") continue; }
    switch (S.pat) {
      case "line": if (Math.abs(I.q) < 0.14) g[y][x] = "p"; break;
      case "band": if (I.q > -0.15 && I.q < 0.2) g[y][x] = "p"; break;
      case "bars": if (Math.floor(I.u * 7) % 2 && I.q > -0.35) g[y][x] = "p"; break;
      case "spots": if (I.q > 0.05 && hash2(x, y) % 5 === 0) g[y][x] = "p"; break;
      case "dots": if (Math.abs(I.q) < 0.14 && (x + y) % 2 === 0) g[y][x] = "p"; break;
      case "neon": if (I.q > -0.08 && I.q < 0.3) g[y][x] = "p"; else if (I.u < 0.55 && I.q <= -0.08) g[y][x] = "o"; break;
      case "scales": if ((x + y) % 2 === 0 && I.q > -0.35 && I.q < 0.55 && I.u < 0.64) g[y][x] = "l"; break;
      case "circuit": if ((I.q > 0.3 && I.q < 0.42) || (I.q > -0.22 && I.q < -0.1) || (Math.floor(I.u * 9) % 3 === 1 && I.q > -0.1 && I.q < 0.3)) g[y][x] = "p"; break;
      case "koi": { const n = hash2(Math.floor(x / 2), Math.floor(y / 2)) % 7; if (n < 2) g[y][x] = "p"; else if (n === 3) g[y][x] = "o"; break; }
      case "flame": if (I.q > 0.15) g[y][x] = (x + y) % 3 ? "p" : "o"; break;
      case "prism": if (I.q > -0.35) g[y][x] = "1234567"[Math.floor(I.u * 6) % 6]; break;
      case "aurora": if (I.q > -0.35 && c !== "h") g[y][x] = I.u < 0.36 ? "A" : I.u < 0.68 ? "C" : "V"; break;
      case "stars": if (hash2(x, y) % 9 === 0) g[y][x] = "p"; break;
      case "scutes": if ((I.q > 0.55 || Math.abs(I.q) < 0.08) && (x + y) % 3 === 0) g[y][x] = "p"; break;
      case "glowline": if (Math.abs(I.q) < 0.2) g[y][x] = "p"; break;
      case "speckle": if (I.q > -0.3 && hash2(x, y) % 4 === 0) g[y][x] = "p"; break;
      case "tiger": if (Math.floor(I.u * 8 + Math.sin(I.q * 3) * 0.6) % 2 && I.q > -0.4) g[y][x] = "p"; break;
      case "rainbowband": if (I.q > -0.12 && I.q < 0.18) g[y][x] = "p"; else if (I.q > 0.3 && hash2(x, y) % 6 === 0) g[y][x] = "o"; break;
      case "wood": if (Math.floor(I.u * 10 + I.q * 2) % 3 === 0 && I.q > -0.4) g[y][x] = "p"; break;
      default: break;
    }
  }
  if (S.pat === "tailspots" || S.pat === "stars") for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((g[y][x] === "f" || g[y][x] === "r") && hash2(x, y) % 3 === 0) g[y][x] = "p";
  if (S.lobes) for (const [u, q] of [[0.45, 1.25], [0.6, -1.3], [0.75, 1.15], [0.3, -1.2]]) { const [x, y] = at(u, q); set(x, y, "f"); set(x + 1, y, "f"); set(x, y + 1, "f"); set(x + 1, y + 1, "r"); }
  const [ex, ey] = at(0.81, 0.3);
  if (S.bigEye) { set(ex + 1, ey, "e"); set(ex, ey + 1, "e"); set(ex + 1, ey + 1, "e"); }
  set(ex, ey, "e"); set(ex - 1, ey, "k");
  // el farolillo del rape: una caña desde la frente con la bombilla en la punta
  if (S.lure) { const [lx, ly] = at(0.9, 1.15); set(lx, ly, "B"); set(lx + 1, ly - 1, "B"); set(lx + 1, ly - 2, "B"); set(lx + 2, ly - 3, "y"); set(lx + 3, ly - 3, "Y"); set(lx + 2, ly - 4, "Y"); }
  const [mx, my] = at(0.99, -0.25);
  set(mx, my, "e");
  if (S.bigMouth) set(mx - 1, my + 1, "e");
  if (S.hook) set(mx + 1, my + 1, "B");
  if (S.fangs) { set(mx - 1, my, "k"); set(mx, my + 1, "k"); }
  if (S.whisk) { set(mx + 1, my + 1, "p"); set(mx + 2, my + 2, "p"); if (S.whisk > 1) { set(mx, my + 2, "p"); set(mx, my + 3, "p"); } }
  if (S.crown) { const [cx, cy] = at(0.74, 1.05); for (const [ox, oy] of [[0, 0], [-1, -1], [1, -2], [2, -1], [0, -3], [-2, -2]]) set(cx + ox, cy + oy, oy <= -2 ? "y" : "Y"); }
  if (S.moon) { const [cx, cy] = at(0.48, 0.05); set(cx, cy, "m"); set(cx + 1, cy, "m"); set(cx, cy + 1, "m"); set(cx + 1, cy - 1, "m"); }
  if (S.glitch) {
    const rows = g.map((r) => r.slice());
    for (let y = 6; y < 9; y++) for (let x = N - 1; x > 0; x--) g[y][x] = rows[y][x - 1];
    for (let y = 6; y < 9; y++) { const fx = g[y].findIndex((c) => c !== "."); if (fx > 0) g[y][fx - 1] = "c"; }
  }
  return g.map((r) => r.join(""));
}

function rayIcon(S) {
  const g = grid();
  const dx = Math.SQRT1_2, dy = -Math.SQRT1_2, nx = -Math.SQRT1_2, ny = -Math.SQRT1_2, L = 15 * S.len;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const rx = x + 0.5 - N / 2, ry = y + 0.5 - N / 2, s = rx * dx + ry * dy + 2, v = rx * nx + ry * ny, u = (s + L / 2) / L;
    if (u >= 0 && u <= 1) {
      const w = S.W * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
      if (Math.abs(v) <= w) { const q = Math.abs(v) / Math.max(0.5, w); g[y][x] = u > 0.78 && Math.abs(v) < 1.6 ? "b" : q > 0.75 ? "B" : q > 0.45 ? "b" : u > 0.5 ? "s" : "h"; }
    } else if (u < 0 && u > -0.5 && Math.abs(v) < 0.6) g[y][x] = u > -0.1 ? "B" : "r";
  }
  const at = (u, v) => { const s = u * L - L / 2 - 2; return [Math.round(N / 2 + s * dx + v * nx - 0.5), Math.round(N / 2 + s * dy + v * ny - 0.5)]; };
  for (const v of [1.4, -1.4]) { const [x, y] = at(0.86, v); if (g[y] && g[y][x] !== ".") g[y][x] = "e"; }
  if (S.manta) {
    for (const v of [1.6, -1.6]) { const [x, y] = at(1.06, v); g[y][x] = "B"; const [x2, y2] = at(1.12, v * 1.1); if (g[y2]) g[y2][x2] = "B"; }
    const [cx, cy] = at(0.45, 0);
    for (const [ox, oy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, -2], [2, 0], [0, 2], [-2, 0]]) g[cy + oy][cx + ox] = Math.abs(ox) + Math.abs(oy) === 2 && (ox === 0 || oy === 0) ? "w" : "k";
    g[cy][cx] = "e"; g[cy - 1][cx] = "e"; g[cy][cx + 1] = "e";
  } else {
    for (const k of [0.55, 0.28]) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const rx = x + 0.5 - N / 2, ry = y + 0.5 - N / 2, s = rx * dx + ry * dy + 2, v = rx * nx + ry * ny, u = (s + L * k / 2 - L * 0.05) / (L * k);
      if (u < 0 || u > 1 || g[y][x] === ".") continue;
      const w = S.W * k * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
      if (Math.abs(Math.abs(v) - w) < 0.55) g[y][x] = "p";
    }
  }
  return g.map((r) => r.join(""));
}

function pufferIcon() {
  const g = grid(), cx = 9.6, cy = 8.4, R = 5.4;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const vx = x + 0.5 - cx, vy = y + 0.5 - cy, d = Math.hypot(vx, vy);
    if (d <= R) { const l = (-vx * 0.55 - vy * 0.83) / R; g[y][x] = vy > R * 0.45 ? "w" : l > 0.45 ? "h" : l > -0.1 ? "b" : "B"; }
  }
  for (let a = 0; a < 12; a++) {
    const ang = a / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(ang) * (R + 1) - 0.5), y = Math.round(cy + Math.sin(ang) * (R + 1) - 0.5);
    if (g[y] && g[y][x] === ".") g[y][x] = "p";
  }
  for (const [x, y] of [[3, 13], [2, 14], [3, 14], [2, 15], [1, 15], [4, 14]]) g[y][x] = "f";
  g[7][12] = "e"; g[7][13] = "e"; g[6][12] = "k"; g[9][14] = "e"; g[10][14] = "p";
  for (const [x, y] of [[9, 10], [10, 11], [11, 11]]) g[y][x] = "f";
  return g.map((r) => r.join(""));
}

const JUNK = {
  "old-boot": [["....BBBBB.....", "....BhBBB.....", "....BhBwB.....", "....BhBBB.....", "....BhBwB.....", "....BhBBB.....", "...BBhBwB.....", "...BBBBBBBBB..", "..BBhhhBBBBBB.", ".BBBBBBBBBBBBB", ".BhBBBBBBBBBBB", ".SSSSSSSSSSSSS", "..g.......d...", "..gg.........."], { B: "#6a7a70", h: "#9aaca2", w: "#e8e4d0", S: "#3a443e", g: "#3fa86a", d: "#9fd8f0" }],
  "soggy-disk": [["DDDDDDDDDDDD", "DMMMMMMSSkDD", "DMMMMMMSSkDD", "DMMMMMMSSSDD", "DDDDDDDDDDDD", "DwwwwwwwwwwD", "DwkkkkkkwwwD", "DwwwwwwwwwwD", "DwkkkkwwwwwD", "DwwwwwwwwwwD", "DDDDDDDDDDDD", "..d.....d...", "..d........."], { D: "#3d6a58", M: "#2a4a3e", S: "#c0c8c4", k: "#9ab4a8", w: "#e8f4ee", d: "#9fd8f0" }],
  "cracked-controller": [["..hhhhhhhhhh..", ".GGGGGGGGGGGG.", "GGkGGGGGGGGrGG", "GkkkGGcGGrGrGG", "GGkGGGGcGGrGGG", "GGGGGGGGcGGGGG", "GGGGG....GGGGG", ".GGG......GGG."], { G: "#8b9a91", h: "#b8c8be", k: "#3a443e", r: "#e85a6a", c: "#2a2f2c" }],
  "rusty-can": [[".ssssss.", "sSSSSSSs", "RRRRRRRR", "RRyyyRRR", "RRRyRRrR", "RRyyyRrR", "RRRRyRRR", "RrRyyRRR", "RRRRRRrR", "RRrRRRRR", "sSSSSSSs", ".ssssss."], { s: "#c0c8c4", S: "#8a9490", R: "#9b7556", r: "#6a4a30", y: "#ffd166" }],
  "tangled-cable": [["..ccc....ccc.", ".c...c..c...c", ".c..ccc.c...c", "..cc.c.cc..c.", "....c.c.c.cc.", "...c..cc..c..", "..c..c..c..c.", "..c.c....cc..", "...cc..ccc...", ".....cc......", "....pp.......", "....pP......."], { c: "#58756a", p: "#ffd166", P: "#b88a2a" }],
  "wet-keyboard": [["KKKKKKKKKKKKKK", "KkKkKkKkKkKkKK", "KKkKkKkKkKkKkK", "KkKkKkKkKkKkKK", "KKkkkkkkkkkKKK", "KKKKKKKKKKKKKK", "..d......d....", "..d..........."], { K: "#70877b", k: "#d8e4dc", d: "#9fd8f0" }],
  "token-chest": [["..LLLLLLLLLL..", ".LlllllllllLL.", "LLllllllllllLL", "LLLLLLYYLLLLLL", "YYYYYYYYYYYYYY", "BbbbbbYYbbbbbB", "BbbbbbYkbbbbbB", "BbbbbbYYbbbbbB", "BbbbbbbbbbbbbB", "YbbbbbbbbbbbbY", "BBBBBBBBBBBBBB", ".D..........D."], { L: "#a56b39", l: "#c99550", Y: "#ffd166", k: "#3a2414", B: "#5a3a20", b: "#8d5831", D: "#3a2414" }]
};

// Lo que no es un pez (pulpo, calamares, pepinos de mar, el pez borrón y lo de
// las nasas): dibujado a mano como los trastos, con su paleta y su contorno.
const CRITTERS = {
  octopus: [["...oooooo...", "..oOOOOOOo..", ".oOOhhOOOOo.", ".oOhhOOOOOo.", ".oOOOOOOOOo.", ".oOeOOOOeOo.", "..oOOOOOOo..", ".oOoOooOoOo.", "o.o.o..o.o.o", "o..o.oo.o..o", ".o..o..o..o.", "..o......o.."], { o: "#c84a3a", O: "#e8705a", h: "#ffa890", e: "#0a0e18" }, "#4a1410"],
  squid: [["....ss....", "...sSSs...", "..sSSSSs..", "..sShSSs..", ".ssSSSSss.", "s.sSSSSs.s", "..sSSSSs..", "..sSeSSs..", "..sSSSSs..", "...sSSs...", "..s.ss.s..", ".s..ss..s.", ".s.s..s.s.", "s..s..s..s"], { s: "#c8a8c8", S: "#f0e4f0", h: "#ffffff", e: "#2a1a3a" }, "#4a2a4a"],
  "midnight-squid": [["....ss....", "...sSSs...", "..sSgSSs..", "..sSSSgs..", ".ssSgSSss.", "s.sSSSSs.s", "..sgSSgs..", "..sSeSSs..", "..sSSSSs..", "...sSSs...", "..s.ss.s..", ".g..ss..g.", ".s.s..s.s.", "g..s..s..g"], { s: "#2a2a5a", S: "#4a3a8a", g: "#8ae8ff", e: "#e8f8ff" }, "#0a0a2a"],
  "sea-cucumber": [["........bbb.", "......bbBBBb", ".....bBkhBBb", "....bBBBBBb.", "...bBkBBkb..", "..bBBBBBb...", ".bBkBBBb....", "bBBBBkb.....", "bbBBBb......", ".bbbb......."], { b: "#6a3a2a", B: "#8a4a3a", h: "#b87a5a", k: "#c89a7a" }, "#2a140a"],
  "super-cucumber": [["........bbb.", "......bbBBBb", ".....bBkhBBb", "....bBBBBBb.", "...bBkBBkb..", "..bBBBBBb...", ".bBkBBBb....", "bBBBBkb.....", "bbBBBb......", ".bbbb......."], { b: "#4a2a7a", B: "#8a4ab8", h: "#c890f0", k: "#ffd166" }, "#1a0a3a"],
  blobfish: [["...ppppp...", "..pPPPPPp..", ".pPPhhPPPp.", "pPPPPPPPPPp", "pPePPPPePPp", "pPPPPPPPPPp", "pPPPnnnPPPp", ".pPPnnnPPp.", "..pPPnPPp..", "...ppppp..."], { p: "#c8707a", P: "#f0a0b0", h: "#ffd0d8", n: "#d8808a", e: "#2a1018" }, "#5a2028"],
  lobster: [["rr........rr", "rRr......rRr", ".rRr....rRr.", "..rRRrrRRr..", "...rRRRRr...", "...rReeRr...", "...rRhRRr...", "..r.rRRr.r..", "...rRRRRr...", "....rRRr....", "....rRRr....", "...rr..rr..."], { r: "#a8281a", R: "#e8503a", h: "#ff9a80", e: "#0a0e18" }, "#3a0a06"],
  crayfish: [["rr......rr", "rRr....rRr", ".rRr..rRr.", "..rRrrRr..", "...rRRr...", "...reer...", "..r.RR.r..", "...rRRr...", "....rr....", "...r..r..."], { r: "#8a3a2a", R: "#c8603a", e: "#0a0e18" }, "#2a0e08"],
  crab: [[".cc......cc.", "cCc......cCc", ".c........c.", "..cccccccc..", ".cCCCCCCCCc.", "cCChCeeCCCCc", "cCCCCCCCCCCc", ".cCCCCCCCCc.", "c.c.c..c.c.c", ".c.c....c.c."], { c: "#a83a1a", C: "#e8603a", h: "#ffa080", e: "#0a0e18" }, "#3a1006"],
  shrimp: [["....ssss....", "..ssSSSSs...", ".sSShhSSSs..", "sSSSSSSSSs..", "sSeSSSSSSs..", ".s.sSSSSSs..", "....sSSSs...", ".....sSSs...", "....sSSs....", "...ttt......", "..t..t......"], { s: "#e86a5a", S: "#ff9a8a", h: "#ffd0c8", t: "#ff7a6a", e: "#0a0e18" }, "#5a1a10"],
  cockle: [["...cccccc...", "..cCcCcCcc..", ".cCcCcCcCcc.", "cCcCcCcCcCcc", "cCcChCcCcCcc", "cCcCcCcCcCcc", ".cCcCcCcCcc.", "..cccccccc..", "....cccc...."], { c: "#c89870", C: "#f0d8b8", h: "#fff4e0" }, "#5a3a20"],
  mussel: [["......mmm.", "....mmMMm.", "...mMMhMm.", "..mMMMMMm.", ".mMMMMMm..", "mMMMMMm...", "mMMMMm....", ".mmmm....."], { m: "#1a1a3a", M: "#3a3a6a", h: "#7a7ab0" }, "#0a0a1a"],
  snail: [["......sss...", ".....sSSSs..", "....sShSSSs.", "....sSSssSs.", "....sSsSsSs.", "....sSSssSs.", "...b.sSSSs..", "..bBbbsss...", "bbBBBBBBBBb.", ".bbbbbbbbb.."], { s: "#7a4a2a", S: "#a87a4a", h: "#d8a878", b: "#8a8a6a", B: "#b8b890" }, "#2a1a0e"],
  periwinkle: [["....p....", "...pPp...", "...PpP...", "..pPhPp..", "..PpPpP..", ".pPpPpPp.", ".PpPpPpP.", "pPpPpPpPp", ".ppppppp."], { p: "#4a5a8a", P: "#7a8ab8", h: "#c0c8e8" }, "#1a2040"],
  oyster: [["...oooooo...", ".ooOOOOOOoo.", "oOOhOOOOOOOo", "oOOOOoOOOOOo", "oOoOOOOOoOOo", ".oOOOOOOOOo.", "..oooooooo.."], { o: "#7a7060", O: "#b8b0a0", h: "#e8e0d0" }, "#2a2620"],
  clam: [["...cccccc...", ".ccCCCCCCcc.", "cCChCCCCCCCc", "cCCCCCCCCCCc", "ckkkkkkkkkkc", "cCCCCCCCCCCc", ".cccccccccc."], { c: "#a89070", C: "#e0d0b0", h: "#fff4e0", k: "#8a7050" }, "#3a2a18"]
};

const pad = (rows) => { const w = Math.max(...rows.map((r) => r.length)); return rows.map((r) => r.padEnd(w, ".")); };
export const isCatchArt = (id) => Boolean(FISH[id] || JUNK[id] || CRITTERS[id]);

function fishPal(S) {
  const [B, b, s, w, f] = S.c;
  return {
    B, b, s, w, h: mix(s, "#ffffff", 0.55), d: mix(B, b, 0.4), f, r: mix(f, B, 0.45), p: S.p || B, o: S.p2 || mix(b, "#ff8a3c", 0.5),
    e: "#0a0e18", k: "#ffffff", l: mix(s, "#ffffff", 0.5), m: "#fff8d8", y: "#fff0af", Y: "#ffd166", c: "#45d8ff",
    A: "#3fff97", C: "#67e8f9", V: "#c084fc", 1: "#ff5f68", 2: "#ff9a3c", 3: "#ffd166", 4: "#3fff97", 5: "#45d8ff", 6: "#a78bfa", 7: "#f472d0"
  };
}

const cache = new Map();
export function catchSprite(id) {
  let img = cache.get(id);
  if (img) return img;
  if (JUNK[id]) img = outlinedSprite(JUNK[id][0], JUNK[id][1], "#1d2a2a");
  else if (CRITTERS[id]) img = outlinedSprite(pad(CRITTERS[id][0]), CRITTERS[id][1], CRITTERS[id][2]);
  else {
    const S = FISH[id] || FISH["byte-minnow"];
    const rows = S.puffer ? pufferIcon() : S.ray ? rayIcon(S) : diagFish(S);
    img = outlinedSprite(rows, fishPal(S), mix(S.c[0], "#05070c", 0.6));
  }
  cache.set(id, img);
  return img;
}

// Los mismos peces vistos de perfil (morro a la derecha) para el acuario del
// cuarto: el mismo perfil, aletas, dibujo y detalles que el icono, pero en
// horizontal, con dos fotogramas de nado (coletazo, o la ondulacion de la
// anguila; la raya, vista desde arriba, bate las alas; el globo agita la cola).
function sideFishGrid(S, ph) {
  const Wd = 28, Ht = 22, cx = 14, cy = 12, g = Array.from({ length: Ht }, () => Array(Wd).fill("."));
  const L = 13 * (S.len || 1), tl = S.tail === "none" ? 0 : S.tail === "fan" && (S.tailW || 0) > 2 ? 0.5 : 0.3, start = -L * (1 + tl) / 2;
  const wAt = (u) => {
    if (u < 0 || u > 1) return 0;
    const front = u > 0.5 ? Math.pow(Math.max(0, 1 - Math.pow((u - 0.5) / 0.5, 2)), 0.5 / (S.nose || 1) * 1.2) : 1;
    const back = u < 0.5 ? 0.3 + 0.7 * Math.pow(u / 0.5, 0.75) : 1;
    return S.W * Math.min(front, back);
  };
  const info = new Map();
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const s = x + 0.5 - cx;
    let v = cy - (y + 0.5);
    const u = (s - start - L * tl) / L;
    if (S.eel) v += Math.sin(u * Math.PI * 3 + ph) * 1.1;
    let ch = null;
    const w = wAt(u) * (v < 0 ? 1.12 : 1);
    if (u >= 0 && u <= 1 && Math.abs(v) <= w) {
      const q = v / Math.max(0.5, w);
      ch = q > 0.55 ? "B" : q > 0.1 ? "b" : q > -0.35 ? "s" : "w";
      if (q > 0.25 && q < 0.48 && u > 0.22 && u < 0.84) ch = "h";
      if (u > 0.64 && u < 0.7 && Math.abs(q) < 0.6) ch = "d";
      info.set(x + "," + y, { u, q });
    } else if (u < 0 && u >= -tl && S.tail !== "none") {
      const t = -u / tl, ws = S.W * (0.35 + t * (S.tailW || 1.25));
      const inside = S.tail === "fork" ? Math.abs(v) <= ws && !(t > 0.5 && Math.abs(v) < (t - 0.5) * S.W * 1.7) : Math.abs(v) <= ws * (S.tail === "round" ? Math.sqrt(1 - t * t * 0.3) : 1);
      if (inside) ch = Math.round(v * 1.4) % 2 ? "r" : "f";
    } else if (S.fin && v > 0 && u > 0.28 && u < 0.72) {
      const q2 = (u - 0.28) / 0.44, h = S.fin * S.W * Math.pow(Math.sin(Math.PI * q2), 0.8) * (1 - 0.35 * q2);
      if (v <= wAt(u) + h) ch = S.spiky && (Math.round(s * 1.4) % 2) ? "r" : "f";
    } else if (v < 0 && u > 0.42 && u < 0.62) {
      const h = 0.5 * S.W * Math.sin(Math.PI * (u - 0.42) / 0.2);
      if (-v <= wAt(u) * 1.12 + h) ch = "f";
    }
    if (S.fin2 && v > 0 && u > 0.72 && u < 0.9 && !ch) { const h = 0.6 * S.W * Math.sin(Math.PI * (u - 0.72) / 0.18); if (v <= wAt(u) + h) ch = "f"; }
    if (S.snout && u > 1 && u < 1.14 && Math.abs(v) < 0.7) ch = "b";
    if (ch) g[y][x] = ch;
  }
  const set = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < Wd && y < Ht) g[y][x] = ch; };
  const at = (u, q) => { const s = start + L * tl + u * L, v = q * wAt(u); return [cx + s - 0.5, cy - v - 0.5]; };
  for (const [k, I] of info) {
    const [x, y] = k.split(",").map(Number), c = g[y][x];
    if (c === "d" || c === "w") { if (S.pat !== "koi" || c === "d") continue; }
    switch (S.pat) {
      case "line": if (Math.abs(I.q) < 0.14) g[y][x] = "p"; break;
      case "band": if (I.q > -0.15 && I.q < 0.2) g[y][x] = "p"; break;
      case "bars": if (Math.floor(I.u * 7) % 2 && I.q > -0.35) g[y][x] = "p"; break;
      case "spots": if (I.q > 0.05 && hash2(x, y) % 5 === 0) g[y][x] = "p"; break;
      case "dots": if (Math.abs(I.q) < 0.14 && (x + y) % 2 === 0) g[y][x] = "p"; break;
      case "neon": if (I.q > -0.08 && I.q < 0.3) g[y][x] = "p"; else if (I.u < 0.55 && I.q <= -0.08) g[y][x] = "o"; break;
      case "scales": if ((x + y) % 2 === 0 && I.q > -0.35 && I.q < 0.55 && I.u < 0.64) g[y][x] = "l"; break;
      case "circuit": if ((I.q > 0.3 && I.q < 0.42) || (I.q > -0.22 && I.q < -0.1) || (Math.floor(I.u * 9) % 3 === 1 && I.q > -0.1 && I.q < 0.3)) g[y][x] = "p"; break;
      case "koi": { const n = hash2(Math.floor(x / 2), Math.floor(y / 2)) % 7; if (n < 2) g[y][x] = "p"; else if (n === 3) g[y][x] = "o"; break; }
      case "flame": if (I.q > 0.15) g[y][x] = (x + y) % 3 ? "p" : "o"; break;
      case "prism": if (I.q > -0.35) g[y][x] = "1234567"[Math.floor(I.u * 6) % 6]; break;
      case "aurora": if (I.q > -0.35 && c !== "h") g[y][x] = I.u < 0.36 ? "A" : I.u < 0.68 ? "C" : "V"; break;
      case "stars": if (hash2(x, y) % 9 === 0) g[y][x] = "p"; break;
      case "scutes": if ((I.q > 0.55 || Math.abs(I.q) < 0.08) && (x + y) % 3 === 0) g[y][x] = "p"; break;
      case "glowline": if (Math.abs(I.q) < 0.2) g[y][x] = "p"; break;
      case "speckle": if (I.q > -0.3 && hash2(x, y) % 4 === 0) g[y][x] = "p"; break;
      case "tiger": if (Math.floor(I.u * 8 + Math.sin(I.q * 3) * 0.6) % 2 && I.q > -0.4) g[y][x] = "p"; break;
      case "rainbowband": if (I.q > -0.12 && I.q < 0.18) g[y][x] = "p"; else if (I.q > 0.3 && hash2(x, y) % 6 === 0) g[y][x] = "o"; break;
      case "wood": if (Math.floor(I.u * 10 + I.q * 2) % 3 === 0 && I.q > -0.4) g[y][x] = "p"; break;
      default: break;
    }
  }
  if (S.pat === "tailspots" || S.pat === "stars") for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if ((g[y][x] === "f" || g[y][x] === "r") && hash2(x, y) % 3 === 0) g[y][x] = "p";
  if (S.lobes) for (const [u, q] of [[0.45, 1.25], [0.6, -1.3], [0.75, 1.15], [0.3, -1.2]]) { const [x, y] = at(u, q); set(x, y, "f"); set(x + 1, y, "f"); set(x, y + 1, "f"); set(x + 1, y + 1, "r"); }
  const [ex, ey] = at(0.81, 0.3);
  if (S.bigEye) { set(ex + 1, ey, "e"); set(ex, ey - 1, "e"); set(ex + 1, ey - 1, "e"); }
  set(ex, ey, "e"); set(ex - 1, ey - 1, "k");
  if (S.lure) { const [lx, ly] = at(0.88, 1.1); set(lx, ly, "B"); set(lx, ly - 1, "B"); set(lx + 1, ly - 2, "B"); set(lx + 2, ly - 3, "B"); set(lx + 3, ly - 3, "y"); set(lx + 3, ly - 4, "Y"); set(lx + 4, ly - 3, "Y"); }
  const [mx, my] = at(0.99, -0.25);
  set(mx, my, "e");
  if (S.bigMouth) set(mx - 1, my + 1, "e");
  if (S.hook) set(mx + 1, my - 1, "B");
  if (S.fangs) { set(mx - 1, my + 1, "k"); set(mx, my + 1, "k"); }
  if (S.whisk) { set(mx + 1, my + 1, "p"); set(mx + 2, my + 2, "p"); if (S.whisk > 1) { set(mx - 1, my + 2, "p"); set(mx - 1, my + 3, "p"); } }
  if (S.crown) { const [kx, ky] = at(0.74, 1.05); for (const [ox, oy] of [[0, 0], [-1, -1], [1, -1], [0, -2], [-2, -2], [2, -2]]) set(kx + ox, ky + oy, oy <= -2 ? "y" : "Y"); }
  if (S.moon) { const [kx, ky] = at(0.48, 0.05); set(kx, ky, "m"); set(kx + 1, ky, "m"); set(kx, ky + 1, "m"); set(kx + 1, ky - 1, "m"); }
  if (S.glitch) {
    const rows = g.map((r) => r.slice());
    for (let y = cy - 3; y < cy; y++) {
      for (let x = Wd - 1; x > 0; x--) g[y][x] = rows[y][x - 1];
      const fx = g[y].findIndex((c) => c !== ".");
      if (fx > 0) g[y][fx - 1] = "c";
    }
  }
  return { g, tailEnd: Math.floor(cx + start + L * tl) };
}
function sideRayGrid(S, ph) {
  const Wd = 26, Ht = 20, cx = 14, cy = 10, g = Array.from({ length: Ht }, () => Array(Wd).fill(".")), L = 15 * S.len, W = S.W * (ph ? 0.84 : 1);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const s = x + 0.5 - cx + 2, v = cy - (y + 0.5), u = (s + L / 2) / L;
    if (u >= 0 && u <= 1) {
      const w = W * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
      if (Math.abs(v) <= w) { const q = Math.abs(v) / Math.max(0.5, w); g[y][x] = u > 0.78 && Math.abs(v) < 1.6 ? "b" : q > 0.75 ? "B" : q > 0.45 ? "b" : v > 0 ? "s" : "h"; }
    } else if (u < 0 && u > -0.5 && Math.abs(v + (ph && u < -0.25 ? 1 : 0)) < 0.6) g[y][x] = u > -0.1 ? "B" : "r";
  }
  for (const k of [0.55, 0.28]) for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const s = x + 0.5 - cx + 2, v = cy - (y + 0.5), u = (s + L * k / 2 - L * 0.05) / (L * k);
    if (u < 0 || u > 1 || g[y][x] === ".") continue;
    const w = W * k * Math.pow(u < 0.45 ? u / 0.45 : (1 - u) / 0.55, 0.85);
    if (Math.abs(Math.abs(v) - w) < 0.55) g[y][x] = "p";
  }
  const at = (u, v) => { const s = u * L - L / 2 - 2; return [Math.round(cx + s - 0.5), Math.round(cy - v - 0.5)]; };
  for (const v of [1.4, -1.4]) { const [x, y] = at(0.86, v); if (g[y] && g[y][x] !== ".") g[y][x] = "e"; }
  return { g, tailEnd: 0 };
}
function sidePufferGrid(ph) {
  const Wd = 17, Ht = 15, cx = 9.4, cy = 7.5, R = 5.2, g = Array.from({ length: Ht }, () => Array(Wd).fill("."));
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const vx = x + 0.5 - cx, vy = y + 0.5 - cy, d = Math.hypot(vx, vy);
    if (d <= R) { const l = (-vx * 0.55 - vy * 0.83) / R; g[y][x] = vy > R * 0.45 ? "w" : l > 0.45 ? "h" : l > -0.1 ? "b" : "B"; }
  }
  for (let a = 0; a < 12; a++) {
    const ang = a / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(ang) * (R + 1) - 0.5), y = Math.round(cy + Math.sin(ang) * (R + 1) - 0.5);
    if (g[y] && g[y][x] === ".") g[y][x] = "p";
  }
  for (const [x, y] of ph ? [[2, 6], [1, 6], [1, 7], [0, 7], [2, 7], [1, 8]] : [[2, 7], [1, 7], [1, 8], [0, 8], [2, 8], [1, 6]]) g[y][x] = "f";
  for (const [x, y] of [[9, 9], [10, 10], [11, 10]]) g[y][x] = "f";
  g[5][12] = "e"; g[5][13] = "e"; g[4][12] = "k"; g[8][14] = "e"; g[9][14] = "p";
  return { g, tailEnd: 0 };
}

const sideCache = new Map();
export function sideFishFrames(id) {
  let f = sideCache.get(id);
  if (f) return f;
  const S = FISH[id] || FISH["byte-minnow"];
  let grids;
  if (S.puffer) grids = [sidePufferGrid(0), sidePufferGrid(1)];
  else if (S.ray) grids = [sideRayGrid(S, 0), sideRayGrid(S, 1)];
  else if (S.eel) grids = [sideFishGrid(S, 0), sideFishGrid(S, Math.PI)];
  else {
    // El segundo fotograma da el coletazo: la mitad de la cola baja una fila.
    const a = sideFishGrid(S, 0), b = { g: a.g.map((r) => r.slice()), tailEnd: a.tailEnd };
    for (let x = 0; x < a.tailEnd - 1; x++) for (let y = b.g.length - 1; y >= 0; y--) b.g[y][x] = y > 0 ? a.g[y - 1][x] : ".";
    grids = [a, b];
  }
  // Todos los fotogramas con el mismo recorte, para que el pez no tiemble.
  let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
  for (const { g } of grids) g.forEach((r, y) => r.forEach((c, x) => { if (c !== ".") { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  const pal = fishPal(S), out = mix(S.c[0], "#05070c", 0.6);
  const right = grids.map(({ g }) => outlinedSprite(g.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1).join("")), pal, out));
  f = { right, w: right[0].width, h: right[0].height, eel: Boolean(S.eel), ray: Boolean(S.ray), puffer: Boolean(S.puffer) };
  sideCache.set(id, f);
  return f;
}

export const CHEST_OPEN_ROWS = [".LLLLLLLLLLLL.", "LllllllllllllL", ".LLLLLLLLLLLL.", ".cCcCcCcCcCcc.", "BcCcCcCcCcCcCB", "YYYYYYYYYYYYYY", "BbbbbbYYbbbbbB", "BbbbbbYkbbbbbB", "BbbbbbYYbbbbbB", "BbbbbbbbbbbbbB", "YbbbbbbbbbbbbY", "BBBBBBBBBBBBBB", ".D..........D."];
let chestOpen;
export function chestOpenSprite() {
  return (chestOpen ??= outlinedSprite(CHEST_OPEN_ROWS, { L: "#a56b39", l: "#c99550", Y: "#ffd166", c: "#ffd166", C: "#fff0af", k: "#3a2414", B: "#5a3a20", b: "#8d5831", D: "#3a2414" }, "#2a1a0a"));
}
