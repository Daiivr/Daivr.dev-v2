// Hand-drawn on the same 56 × 42 pixel canvas as the journal's two mythic fish.
// Anatomy is species-specific; only the rendering and animation hooks are shared.
const fish = {
  "byte-minnow": {
    ink: "#234956", shade: "#287f9c", light: "#cff9ed", finColor: "#5eacc3", eye: [44, 19],
    tail: "M16 21h-4l-3-3-4-7H2l2 9 4 3-4 4-2 6h3l5-7 6-2z",
    rays: "M4 14l5 7 5 2M4 30l6-5 5-2",
    fins: "M23 18l3-7h3l5 7zM25 26l4 6h3l2-6z",
    body: "M12 21h4v-2h7v-2h12v1h7v1h5v2h4v3h-4v2h-6v2H25v-1h-7v-2h-6z",
    back: "M16 20h8v-2h11v1h7v1h-8v1H22v1h-6z",
    belly: "M16 24h8v1h17v-1h7v1h-7v2H25v-1h-7z",
    detail: [["M21 22h4v1h-4m7-1h4v1h-4m3-3h2v1h-2", "#d6fff4"], ["M21 24h2v1h-2m6 0h2v1h-2", "#28657f"]],
    fin: "M33 24h5l-3 5h-3z",
  },
  "cache-carp": {
    ink: "#285247", shade: "#328369", light: "#d9f6be", finColor: "#75bb88", eye: [44, 17],
    tail: "M15 21l-6-3-5-7H2v7l5 5-5 6v5h3l6-8 5-1z",
    rays: "M4 15l7 7M4 31l7-7",
    fins: "M17 17l3-6 6-4h7l5 7-11 5zM19 28l3 6 5 2 3-7z",
    body: "M12 21h3v-4h4v-3h5v-2h10v1h6v2h5v3h5v3h3v4h-4v3h-5v3h-7v2H25v-2h-6v-3h-4v-3h-3z",
    back: "M16 20h4v-4h5v-2h9v1h6v2h-9v1h-7v2h-8z",
    belly: "M18 26h5v3h12v-1h9v-2h5v2h-5v2h-7v2H26v-2h-6z",
    detail: [["M23 19h3v2h-3m5-4h3v2h-3m0 6h3v2h-3m5-6h3v2h-3m-12 3h3v2h-3m11 5h3v2h-3", "#23896d"], ["M24 19h2v1h-2m5-2h2v1h-2m0 6h2v1h-2m5-6h2v1h-2", "#b5f3be"], ["M49 24h4v4h-1v2h-1v-4h-2", "#a8dab5"]],
    fin: "M35 24h6l-2 6-5 3h-2v-3z",
  },
  "pixel-perch": {
    ink: "#76502d", shade: "#c1833c", light: "#fff0af", finColor: "#eb9460", eye: [43, 18],
    tail: "M15 22l-6-3-5-5H2v6l5 3-5 4v5h3l5-6 6-1z",
    rays: "M4 17l7 5M4 29l7-4",
    fins: "M18 17l2-8 3 5 3-9 3 7 3-8 3 8 3-4 2 10zM25 29l3 6h4l3-7z",
    body: "M12 21h4v-3h4v-3h6v-1h9v1h6v2h5v3h5v5h-4v3h-7v2H25v-1h-6v-2h-4v-2h-3z",
    back: "M17 20h4v-3h6v-1h8v1h5v2H28v1z",
    belly: "M18 25h7v2h14v-1h7v2h-7v1H26v-1h-6z",
    detail: [["M22 17h3v3h-1v4h-2zm7-2h3v4h-1v6h-2zm7 1h3v4h-1v5h-2z", "#a47138"], ["M23 17h1v3h-1m7-4h1v3h-1m7-2h1v3h-1", "#e6a354"]],
    fin: "M35 25h6l-4 6h-3z",
  },
  "buffer-bass": {
    ink: "#254853", shade: "#398096", light: "#dbf2d4", finColor: "#609ca2", eye: [43, 17],
    tail: "M14 21l-5-3-6-5v8l3 2-3 2v7l7-6 5-2z",
    rays: "M5 17l6 5M5 28l6-4",
    fins: "M18 17l3-7 3 3 2-4 4 5 3-5 5 2 3 7zM19 27l4 6h7l3-5z",
    body: "M11 21h5v-3h5v-2h9v-2h12v2h6v3h6v3h-5v2h5v3h-7v3H30v-1h-9v-2h-6v-2h-4z",
    back: "M17 20h5v-2h9v-2h10v1h6v2H33v1z",
    belly: "M18 25h8v2h14v-1h8v-1h4v1h-6v3H31v-1H22z",
    detail: [["M16 22h7v-1h9v1h7v2H25v1h-7z", "#286579"], ["M21 22h3v1h-3m6-1h4v1h-4m6 0h3v1h-3", "#99cdc6"], ["M43 23h7v1h-7", "#183e4d"]],
    fin: "M35 24h7l-3 6h-3l-3-2z",
  },
  "cursor-guppy": {
    ink: "#426277", shade: "#8aaac0", light: "#f4fff8", finColor: "#a5a2da", eye: [44, 19],
    tail: "M26 21l-6-4-4-6-5-5H6v4H3v6H1v12h3v6h4v3h5l5-5 3-6 5-2z",
    rays: "M5 12l17 10M3 20l18 3M5 29l16-5M10 34l12-10",
    fins: "M29 18l-4-6V8h5l5 7 4 4zM29 26l-3 5 3 2 7-6z",
    body: "M21 21h5v-2h6v-2h8v1h6v2h5v5h-4v2h-7v1H30v-1h-5v-2h-4z",
    back: "M26 21h7v-2h7v1h5v1H34v1h-8z",
    belly: "M27 25h7v1h11v-1h4v1h-3v1H31z",
    detail: [["M6 13h3v3H6m5 2h3v3h-3m-7 7h3v3H4m6 3h3v3h-3m5-5h3v3h-3", "#6cbcca"], ["M31 20h2v5h-2m2-2h3v2h-3", "#6d709a"]],
    fin: "M36 24h5l-4 5h-2z",
  },
  "ping-sardine": {
    ink: "#295b5c", shade: "#5a9b92", light: "#e3ffdc", finColor: "#78bba7", eye: [45, 19],
    tail: "M15 21l-7-3-5-7H1l3 9 4 3-4 3-3 7h3l5-6 7-3z",
    rays: "M4 15l6 7M4 30l6-5",
    fins: "M25 19l2-7h3l5 7zM31 26l4 5h3l-1-5z",
    body: "M12 21h7v-2h9v-1h13v1h6v2h7v3h-7v2H29v1h-7v-1h-6v-2h-4z",
    back: "M19 20h10v-1h12v1h5v1H30v1H19z",
    belly: "M18 24h13v-1h17v1h-3v1H30v1h-7v-1h-5z",
    detail: [["M21 22h20v1H21", "#c4f9ef"], ["M22 20h2v1h-2m3-1h2v1h-2m3-1h2v1h-2", "#3e8c88"], ["M29 7h6v1h-6m-3 2h3v1h-3m9-1h3v1h-3", "#80dce0"]],
    fin: "M38 24h4l-3 4h-2z",
  },
  "syntax-salmon": {
    ink: "#724957", shade: "#b96766", light: "#ffe2b3", finColor: "#ce8876", eye: [45, 18],
    tail: "M15 21l-6-2-6-7H1v6l5 5-5 6v4h3l6-7 6-1z",
    rays: "M3 16l8 6M3 30l8-5",
    fins: "M24 17l3-8h4l5 8zM17 27l3 5h5l2-5zM37 16l2-4h3l2 5z",
    body: "M11 21h6v-3h8v-2h13v1h7v2h6v2h3v3h-4v3h-6v2H28v-1h-8v-2h-5v-2h-4z",
    back: "M18 20h8v-2h12v1h6v1H30v1H18z",
    belly: "M19 24h10v2h14v-1h7v1h-6v2H29v-1h-9z",
    detail: [["M23 20h2v1h-2m5-2h2v1h-2m5 0h2v1h-2m-8 3h2v1h-2m5-2h2v1h-2m6-1h2v1h-2", "#85516c"], ["M23 23h3v1h-3m6-1h3v1h-3m6-1h3v1h-3", "#ffd9a2"], ["M48 24h5v1h-5", "#754958"]],
    fin: "M36 25h6l-3 6h-3l-2-2z",
  },
  "neon-tetra": {
    ink: "#613656", shade: "#bb447e", light: "#f4dbe9", finColor: "#a382b5", eye: [43, 18],
    tail: "M18 22l-7-4-5-6H4v7l4 4-4 4v6h3l5-6 6-2z",
    rays: "M6 16l8 6M6 30l8-5",
    fins: "M26 18l2-7h3l5 8zM25 27l7 6h4l1-7z",
    body: "M15 21h4v-2h5v-2h13v1h6v2h6v2h3v3h-5v2h-7v2H27v-1h-6v-2h-6z",
    back: "M20 21h6v-2h11v1h6v1H30v1z",
    belly: "M20 24h10v2h15v1h-6v1H28v-1h-6z",
    detail: [["M18 22h8v-1h16v1h5v2H29v1H18z", "#3fe0ef"], ["M22 22h18v1H22", "#c9fff6"], ["M29 25h13v2H29z", "#f35899"]],
    fin: "M34 25h5l-2 4h-3z",
  },
  "circuit-catfish": {
    ink: "#285747", shade: "#4c9772", light: "#d5eaba", finColor: "#81b68c", eye: [43, 20],
    tail: "M15 23l-6-3-6-5H1v6l5 3-4 3v5h3l6-6 5-1z",
    rays: "M3 19l8 4M4 30l7-4",
    fins: "M24 19l2-10h3l7 11zM18 28l3 5h7l4-5z",
    body: "M11 22h6v-2h9v-2h10v1h8v2h6v2h4v4h-5v2h-9v2H25v-1h-7v-2h-7z",
    back: "M18 22h9v-2h9v1h8v1H32v1z",
    belly: "M17 27h10v2h12v-1h10v1h-10v1H26v-1h-8z",
    detail: [["M25 22h4v3h6v2h-2v-1h-5v-3h-3z", "#addeb6"], ["M49 26h5v5h-1v2h-1v-6h-3M46 28v7h-3v-1h2v-6M51 24h4v-4h-1v3h-3", "#d3e8c1"], ["M24 22h2v2h-2m10 3h2v2h-2", "#f1e2a0"]],
    fin: "M36 27h7l-3 7h-4l-2-3z",
  },
  "cobalt-cod": {
    ink: "#2c416c", shade: "#385a9e", light: "#b9dce5", finColor: "#729fc7", eye: [43, 18],
    tail: "M15 22l-6-3-5-5H2v17h3l5-5 6-1z",
    rays: "M4 18l8 5M4 27l8-3",
    fins: "M15 20l2-6h3l4 5M24 17l2-7h5l3 7M35 17l2-8h4l4 10M20 28l2 5h7l3-5M35 28l3 5h5l1-6",
    body: "M11 21h6v-2h7v-2h13v1h7v2h6v3h3v4h-6v2h-7v2H28v-1h-8v-3h-5v-2h-4z",
    back: "M18 21h7v-2h12v1h6v1H28v1z",
    belly: "M20 26h8v2h11v-1h9v1h-8v2H29v-1h-7z",
    detail: [["M23 21h2v2h-2m5-4h2v2h-2m6 1h2v2h-2m-8 3h2v2h-2m5 0h2v2h-2m-12 0h2v1h-2", "#294c8c"], ["M24 24h13v1H24M48 28v5h-2v-1h1v-4", "#93bfce"]],
    fin: "M36 25h6l-3 6h-4l-1-3z",
  },
  "packet-puffer": {
    ink: "#886138", shade: "#c3904d", light: "#fff0b7", finColor: "#d9ae6b", eye: [41, 17],
    tail: "M16 22l-7-3-5-4H2v15h3l5-5 6-1z",
    rays: "M4 19l7 3M4 26l7-2",
    fins: "M21 12l-2-5 3 1 2 4M31 9V4l2 1 1 5M42 12l3-4 1 3-2 3M47 23h6l-1 2h-5M41 32l3 5-3-1-2-3M28 34l-1 5-2-2 1-4M17 29l-5 3 1-3 4-2",
    body: "M13 18h2v-4h4v-3h6V9h9v1h6v3h5v4h3v4h2v5h-3v4h-4v3h-6v2H26v-1h-6v-3h-4v-4h-3z",
    back: "M16 18h3v-3h6v-3h9v1h5v2h-8v1h-8v3h-7z",
    belly: "M17 25h5v3h7v1h8v-2h7v-2h3v4h-4v3h-6v2H27v-1h-6v-3h-4z",
    detail: [["M22 18h2v2h-2m7-5h2v2h-2m4 6h2v2h-2m-8 2h2v2h-2m-7-1h2v2h-2m18 3h2v2h-2", "#ac793f"], ["M23 18h1v1h-1m7-5h1v1h-1m4 6h1v1h-1M47 23h3v1h-3", "#ffe5a5"]],
    fin: "M32 25h6v3l-3 4h-3l-2-4z",
  },
  "void-eel": {
    ink: "#423b67", shade: "#6c579c", light: "#e0d1f3", finColor: "#8472ae", eye: [47, 14],
    tail: "M12 28H8v-3H5v-5H3v9h3v4h6z",
    rays: "M4 24v5h3v2h4",
    fins: "M10 26v-4h5l6 9h7l5-7v-7h3V9h8l4 5-8 6-5 13-9 4-10-3z",
    body: "M9 25h5v3h3v3h8v-2h4v-4h3V15h3v-3h5v-1h7v2h5v3h2v5h-5v2h-8v3h-3v6h-4v4h-6v2H17v-2h-5v-4H9z",
    back: "M11 26h2v4h4v3h9v-2h5v-6h3V16h3v-2h6v1h-5v3h-2v10h-3v5h-6v2H16v-3h-3z",
    belly: "M12 31h3v3h11v-1h6v-4h3v-7h6v-2h10v2h-10v3h-4v6h-4v4h-6v2H18v-2h-5z",
    detail: [["M19 33h3v1h-3m5-1h2v1h-2m10-9h2v1h-2m4-7h3v1h-3M49 21h4v1h-4", "#c6ace6"]],
    fin: "M40 22h4l-4 6h-2z",
  },
  "glitch-koi": {
    ink: "#65405f", shade: "#b06499", light: "#ffe1e8", finColor: "#d398be", eye: [44, 18],
    tail: "M19 22l-5-4-3-7-4-5H4l3 9 4 8-5 5-4 7h4l6-4 7-6z",
    rays: "M6 10l7 11 4 2M5 32l9-8",
    fins: "M23 17l1-7h4l5 5 5 3M24 29l-2 6h4l6-6z",
    body: "M15 21h4v-3h6v-2h11v1h7v2h6v2h4v4h-5v3h-6v3H29v-1h-6v-2h-5v-3h-3z",
    back: "M20 20h6v-2h10v1h6v1H30v1z",
    belly: "M22 26h7v2h11v-1h7v1h-6v2H30v-1h-6z",
    detail: [["M23 18h7v2h2v4h-6v-2h-3zM36 25h6v3h-6v1h-5v-3h5z", "#f9ecdf"], ["M32 18h5v3h-3v3h-4v-3h2zM21 24h5v3h-5z", "#5cd9d4"], ["M9 10h4v1H9m8 23h4v1h-4m24-7h4v1h-4", "#ff8cc3"]],
    fin: "M36 25h6l-1 4-4 5h-3v-3z",
  },
  "recursion-ray": {
    ink: "#245a77", shade: "#2b88ac", light: "#b5f3e8", finColor: "#4daac2", eye: [43, 18],
    tail: "M26 21H15l-4 3H5l-2 4H1v-3l3-3h7l4-3h11z",
    rays: "M2 26l3-3h7l4-3h8",
    fins: "M27 20l-5-6-2-7V3h4l7 7 8 5 7 4-3 7-10 8-7 5h-5l2-8z",
    body: "M21 18h5v-4h5v-2h5v2h4v2h6v2h4v3h3v4h-4v3h-7v2h-5v3h-5v-2h-5v-4h-4v-3h-2z",
    back: "M24 7h2v4h3v4h4v3h7v2h-9v-2h-4v-4h-2z",
    belly: "M24 25h5v3h7v-1h8v-2h6v2h-7v2h-6v3h-5v2h-5v3h-3v-2h2v-5h-2z",
    detail: [["M30 17h7v2h4v3h-3v4h-7v-3h-4v-3h3z", "#216f96"], ["M32 19h4v2h3v2h-4v2h-2v-3h-3v-1h2z", "#a6ede2"], ["M43 25h3v2h-3", "#183f5e"], ["M25 12h2v1h-2m2 19h2v1h-2m10-15h2v1h-2", "#c4f3e5"]],
    fin: "M47 19h3v2h-1v3h-2z",
  },
  "firewall-fangfish": {
    ink: "#713e4a", shade: "#bb4e56", light: "#ffd3a2", finColor: "#ec865e", eye: [44, 17],
    tail: "M15 22l-5-4-6-7H2l2 9 4 3-5 4-1 7h3l6-7 5-2z",
    rays: "M4 15l8 7M4 31l8-6",
    fins: "M17 18l2-8 3 5 3-11 4 9 3-8 4 9 4-6 2 10M19 27l3 7h4l3-6z",
    body: "M12 21h5v-3h6v-2h11v-1h7v2h6v3h6v2h-8v2h9v4h-7v3H32v-1h-9v-2h-7v-3h-4z",
    back: "M18 20h6v-2h10v-1h6v1h5v2H29v1z",
    belly: "M20 25h10v3h14v-2h8v1h-6v3H33v-1h-9z",
    detail: [["M23 19h2v3h-2m5-4h2v4h-2m5-4h2v4h-2", "#dc8a65"], ["M45 22h2v3h-1v1h-1m4-4h2v2h-1v1h-1M46 26h2v-2h1v3h-3", "#fff3d3"], ["M42 16h5v1h-5", "#703f49"]],
    fin: "M34 25h7l-3 8h-3l-2-4z",
  },
  "prism-piranha": {
    ink: "#673e70", shade: "#b45d9e", light: "#fce3ed", finColor: "#c088c3", eye: [43, 17],
    tail: "M15 21l-6-3-5-6H2v8l5 3-5 4v6h3l5-6 6-2z",
    rays: "M4 16l7 6M4 30l7-5",
    fins: "M24 14l2-8h4l6 8M23 28l4 8h6l5-7z",
    body: "M12 20h5v-4h5v-3h7v-1h8v2h6v3h5v3h5v3h-5v2h5v3h-7v3h-6v2H28v-2h-6v-3h-6v-3h-4z",
    back: "M18 19h5v-3h7v-2h7v2h5v2H31v1z",
    belly: "M21 26h7v3h10v-1h8v-2h5v1h-6v3h-6v2H29v-2h-6z",
    detail: [["M26 18h3v-2h3v5h-2v4h-5v-3h-2v-2h3z", "#68d8e0"], ["M33 17h3v3h3v4h-3v3h-4v-5h1z", "#c5b3f5"], ["M38 20h3v3h2v2h-4v2h-2v-4h1z", "#ffe19c"], ["M46 23h2v3h-1v-1h-1m3-2h2v2h-1v1h-1", "#fff4df"]],
    fin: "M33 26h6l-3 6h-3z",
  },
  "starfin": {
    ink: "#80604a", shade: "#c39150", light: "#fff3c3", finColor: "#e6bd73", eye: [43, 18],
    tail: "M17 22l-6-4-4-8H4l1 8-4 4 4 3-2 8h3l6-7 6-1z",
    rays: "M6 14l7 8M5 29l8-5",
    fins: "M24 17l3-7V3h3l3 7 6 7zM24 27l4 6 2 7h3v-7l5-6z",
    body: "M14 21h5v-3h6v-2h11v1h6v2h6v2h5v4h-5v3h-8v2H28v-1h-7v-2h-5v-2h-2z",
    back: "M20 20h6v-2h10v1h5v1H30v1z",
    belly: "M21 25h8v2h10v-1h9v1h-8v2H29v-1h-6z",
    detail: [["M29 16h2v3h3v2h-2v3h-2v-2h-3v-2h2z", "#fffce0"], ["M22 22h1v1h-1m13-3h1v1h-1m2 4h1v1h-1m-10 3h1v1h-1M45 7h1v2h2v1h-2v2h-1v-2h-2V9h2", "#fff3c6"]],
    fin: "M35 25h6l-3 7h-2l-1-4z",
  },
  "crown-coelacanth": {
    ink: "#695033", shade: "#a48143", light: "#f7dc9b", finColor: "#c3a05b", eye: [44, 18],
    tail: "M17 21h-4l-2-6-4-4H4v8H1v8h3v7h4l4-5 2-4h4z",
    rays: "M6 15l5 7H3M6 30l5-6H3",
    fins: "M20 18l1-8h3l4 7M29 17l2-6h4l5 7M19 28l1 6h4l6-5M32 29l3 6h4l4-7",
    body: "M13 20h6v-3h8v-2h11v1h7v2h5v3h3v6h-6v3h-8v1H27v-1h-7v-2h-5v-3h-2z",
    back: "M20 20h8v-3h10v1h6v2H30v1z",
    belly: "M20 26h8v2h12v-1h8v1h-9v2H28v-1h-7z",
    detail: [["M23 21h3v2h-3m5-4h3v2h-3m5 1h3v2h-3m-8 2h3v2h-3m6-1h3v2h-3", "#7e653c"], ["M24 21h2v1h-2m5-4h2v1h-2m5 1h2v1h-2", "#f4d17e"], ["M25 10V3l4 3 4-5 4 5 4-3v7z", "#765535"], ["M27 8V5l3 3 3-4 3 4 3-3v3z", "#ffe08c"], ["M32 8h2v2h-2", "#75d6c1"]],
    fin: "M36 25h5v4l-4 5h-4v-4z",
  },
  "aurora-arowana": {
    ink: "#3d6179", shade: "#639dab", light: "#d9f3df", finColor: "#a299c8", eye: [46, 17],
    tail: "M15 21l-4-5-5-4H3v6H1v11h3v5h4l5-7 3-2z",
    rays: "M5 16l7 6M3 23h10M5 30l8-6",
    fins: "M13 20l3-7h6l6 5M14 27l3 7h8l6-6z",
    body: "M11 21h6v-2h10v-1h13v-1h8v-2h4v4h3v4h-4v3h-7v3H29v1H19v-2h-5v-3h-3z",
    back: "M17 21h11v-2h12v-1h8v1h-6v2H29v1H17z",
    belly: "M16 25h12v2h15v-1h7v1h-7v1H30v1H20v-2h-4z",
    detail: [["M20 22h3v2h-3m5-3h3v2h-3m5-3h3v2h-3m5-3h3v2h-3", "#66d4a7"], ["M22 25h3v2h-3m5-3h3v2h-3m5-3h3v2h-3m5-3h3v2h-3", "#b5a0e3"], ["M20 22h2v1h-2m5-3h2v1h-2m5-3h2v1h-2m5-3h2v1h-2", "#d2f4b7"], ["M50 16v-3h3v-2h1v3h-3v2M50 25h3v-1h2", "#d1e8d7"]],
    fin: "M38 25h6l-2 4-5 3h-2l2-4z",
  },
};

export function BuddyFishArt({ id, color }) {
  const art = fish[id];
  if (!art) return null;
  const [eyeX, eyeY] = art.eye;
  return <g shapeRendering="crispEdges" data-fish-art={id}>
    <g className="buddy-fish-tail">
      <path d={art.tail} fill={art.finColor} stroke={art.ink} strokeWidth="1" strokeLinejoin="round" />
      <path d={art.rays} fill="none" stroke={art.light} strokeWidth="1" opacity=".65" />
    </g>
    <path d={art.fins} fill={art.finColor} stroke={art.ink} strokeWidth="1" strokeLinejoin="round" />
    <path d={art.body} fill={color} stroke={art.ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d={art.belly} fill={art.light} />
    <path d={art.back} fill={art.light} opacity=".7" />
    {art.detail.map(([d, fill], index) => <path key={index} d={d} fill={fill} />)}
    <g className="buddy-fish-fin">
      <path d={art.fin} fill={art.shade} />
      <path d={art.fin} fill="none" stroke={art.light} strokeWidth=".65" opacity=".5" />
    </g>
    <path d={`M${eyeX - 4} ${eyeY + 2}v3h1v2`} fill="none" stroke={art.ink} strokeWidth="1" opacity=".6" />
    <path d={`M${eyeX} ${eyeY}h3v3h-3z`} fill={art.light} />
    <path d={`M${eyeX + 1} ${eyeY + 1}h2v2h-2z`} fill={art.ink} />
    <path d={`M${eyeX + 1} ${eyeY + 1}h1v1h-1z`} fill="#fffdf0" />
  </g>;
}

export const hasFishArt = (id) => Object.hasOwn(fish, id);
