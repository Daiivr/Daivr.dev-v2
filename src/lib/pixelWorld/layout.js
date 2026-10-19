// Medidas y reparto del mundo del footer, en pixeles de arte (1 = 2 px CSS).
// Sin DOM: los tests de Node lo importan tal cual.

export const H = 80;        // alto del lienzo: cubre el cielo del footer (156 px)
export const MEADOW = 60;   // empieza el prado
export const PATH = 70;     // empieza el sendero
export const FEET = 77;     // fila donde pisan Buddy y las visitas
export const WATER_Y = 75;  // superficie del agua en el sendero (charcos, peces)
// El lienzo baja 6 px por debajo del riel (borde superior del footer), asi
// que la fila de los pies queda 2 px por debajo del riel, como el sprite.
export const BELOW_RAIL_PX = 6;
// Margen transparente encima del mundo, solo para lo que vuela: Buddy bajando
// en paracaidas (empieza hasta 320 px por encima del riel) o arrastrado en alto.
export const WORLD_TOP = 90;

export const STAND_W = 66;
export const STAND_H = 58;
export const STAND_TOP = 75 - 57;
export const LAMP_ROWS_H = 27;
// El huerto: GARDEN_PLOTS bancales (shared/buddy-market.mjs) en el centro del
// prado, con su cartel a la izquierda y la regadera a la derecha, y una valla
// detras. Solo en escritorio (en el movil no hay).
const PLOTS = 3;
const PLOT = { w: 13, gap: 3, sign: 6, can: 13 };
const BEDS_W = PLOTS * PLOT.w + (PLOTS - 1) * PLOT.gap;
const GARDEN_W = PLOT.sign + BEDS_W + PLOT.can;

// Ancho en CSS a partir del cual cabe la farola a la izquierda del puesto
// (como antes: por debajo de 1100 px desaparecia).
const MARKET_LAMP_MIN_CSS = 1100;
const PHONE_CSS = 768;

export function layoutFor(W, { cssWidth = W * 2 } = {}) {
  const X = (p) => Math.round(p * W / 100);
  const phone = cssWidth < PHONE_CSS;
  const standX = phone ? 6 : Math.max(7, Math.min(44, X(4)));
  const fireX = standX + STAND_W + 14;
  // El buzon, a la derecha de la hoguera; la tienda de Pip, hacia la derecha.
  const mailX = fireX + 22;
  const tentX = phone ? W - 24 : X(85);
  // El huerto, centrado en el prado (las farolas X(37) y X(76) quedan a los lados).
  let garden = null;
  if (!phone) {
    const gardenX = Math.round(W / 2 - GARDEN_W / 2), plotsX = gardenX + PLOT.sign;
    garden = {
      x: gardenX, end: gardenX + GARDEN_W, w: PLOT.w, can: plotsX + BEDS_W + 1, fenceEnd: gardenX + GARDEN_W - 2,
      plots: Array.from({ length: PLOTS }, (_, i) => plotsX + i * (PLOT.w + PLOT.gap) + Math.floor(PLOT.w / 2))
    };
  }
  const clearOfGarden = (x, pad) => !garden || x < garden.x - pad || x > garden.end + pad;
  const lamps = [X(37), X(76)];
  if (cssWidth > MARKET_LAMP_MIN_CSS) lamps.unshift(standX - 8);
  const trees = [
    { k: "pine", d: "back", x: X(9), seed: 11 }, { k: "oak", d: "back", x: X(27), seed: 14, phone: false },
    { k: "oak", d: "back", x: X(47), seed: 12 }, { k: "pine", d: "back", x: X(83), seed: 13, phone: false },
    { k: "pine", d: "far", x: X(4), seed: 21 }, { k: "oak", d: "far", x: X(55), seed: 22 }, { k: "pine", d: "far", x: X(64), seed: 23, flip: true, phone: false },
    { k: "oak", d: "near", x: fireX - 4, seed: 31 }, { k: "pine", d: "near", x: X(31), seed: 32 },
    { k: "oak", d: "near", x: X(43), seed: 33, flip: true, blossom: true, phone: false }, { k: "pine", d: "near", x: X(70), seed: 34 }, { k: "oak", d: "near", x: X(88), seed: 35 }
  ].filter((tree) => (!phone || tree.phone !== false) && (tree.d !== "near" || clearOfGarden(tree.x, 10)));
  const bushes = [
    { k: "shrub", x: X(26), seed: 41 }, { k: "berry", x: X(37) + 12, seed: 42, phone: false }, { k: "bush", x: X(58), seed: 43 },
    { k: "shrub", x: X(78) + 8, seed: 44, phone: false }, { k: "berry", x: X(95), seed: 45 }
  ].filter((bush) => (!phone || bush.phone !== false) && clearOfGarden(bush.x, 14));
  // El sitio del pescador ambulante (con su carretilla a la espalda): entre el
  // huerto y la farola siguiente. Como el huerto, solo fuera del movil.
  const fisherX = garden ? Math.round((garden.end + (lamps.find((lx) => lx > garden.end) ?? X(76))) / 2) - 18 : null;
  const fisher = fisherX == null ? null : { x: fisherX, left: fisherX - 12, right: fisherX + 48 };
  // El barril de las cañas, pegado a la izquierda de la farola que hay antes
  // del huerto (abre el modal de pesca). Como el huerto, solo fuera del movil,
  // y solo si cabe sin pisar el buzon (por debajo de ~880 px no cabe; el modal
  // sigue en la pestaña "Fishing").
  const rackLamp = garden ? lamps.filter((lx) => lx < garden.x).pop() : null;
  const rack = rackLamp != null && rackLamp - 35 >= mailX + 8 ? { x: rackLamp - 35, w: 33 } : null;
  return {
    W, X, phone, standX, fireX, lamps, trees, bushes, mailX, tentX, garden, fisher, rack,
    stones: [X(8), X(39), X(74)],
    // Donde no crece hierba ni flores: el puesto y la hoguera.
    clear: [[standX - 6, standX + STAND_W + 4], [fireX - 16, fireX + 16], ...(garden ? [[garden.x - 2, garden.end + 2]] : []), ...(fisher ? [[fisher.left - 2, fisher.right + 2]] : []), ...(rack ? [[rack.x - 2, rack.x + rack.w + 2]] : [])],
    // Donde no se abre agua (ni la poza de pescar ni los agujeros de los peces
    // saltarines): desde el borde, con la farola y el puesto, hasta la hoguera;
    // y delante del huerto.
    noWater: [0, fireX + 20],
    dryGarden: garden ? [garden.x - 6, garden.end + 6] : null
  };
}

// Donde van en el suelo las calabazas, los regalos y el muñeco de nieve de
// cada fiesta (seasons.js); lo que caeria encima del barril de las cañas pasa
// al otro lado de su farola. El forraje del dia (life/forage.js) los esquiva.
export function seasonGroundSpots(season, L) {
  const offRack = (x, half) => (L.rack && x + half >= L.rack.x - 2 && x - half <= L.rack.x + L.rack.w + 1 ? L.rack.x + L.rack.w + 9 + half : x);
  if (season === "halloween") return [L.X(29), L.X(51), L.X(90)].map((x) => offRack(x, 4));
  if (season === "birthday") return [L.X(33), L.X(67)].map((x) => offRack(x, 3));
  if (season === "winter") return [L.X(84)];
  return [];
}

// Variables CSS que ponen los botones (puesto, ancla de la hoguera) justo
// encima de lo que dibuja el lienzo.
export function layoutCssVars(L) {
  return {
    "--world-stand-left": `${L.standX * 2}px`,
    "--world-stand-width": `${STAND_W * 2}px`,
    "--world-stand-height": `${STAND_H * 2}px`,
    "--world-fire-left": `${(L.fireX - 12) * 2}px`,
    "--world-mail-left": `${(L.mailX - 7) * 2}px`,
    "--world-tent-left": `${(L.tentX - 15) * 2}px`,
    "--world-garden-left": `${(L.garden?.x ?? -40) * 2}px`,
    "--world-garden-width": `${L.garden ? (L.garden.end - L.garden.x) * 2 : 0}px`,
    "--world-fisher-left": `${(L.fisher?.left ?? -80) * 2}px`,
    "--world-fisher-width": `${L.fisher ? (L.fisher.right - L.fisher.left) * 2 : 0}px`,
    "--world-rack-left": `${(L.rack?.x ?? -80) * 2}px`,
    "--world-rack-width": `${L.rack ? L.rack.w * 2 : 0}px`
  };
}
