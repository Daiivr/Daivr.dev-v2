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

// Ancho en CSS a partir del cual cabe la farola a la izquierda del puesto
// (como antes: por debajo de 1100 px desaparecia).
const MARKET_LAMP_MIN_CSS = 1100;
const PHONE_CSS = 768;

export function layoutFor(W, { cssWidth = W * 2 } = {}) {
  const X = (p) => Math.round(p * W / 100);
  const phone = cssWidth < PHONE_CSS;
  const standX = phone ? 6 : Math.max(7, Math.min(44, X(4)));
  const fireX = standX + STAND_W + 14;
  const lamps = [X(37), X(76)];
  if (cssWidth > MARKET_LAMP_MIN_CSS) lamps.unshift(standX - 8);
  const trees = [
    { k: "pine", d: "back", x: X(9), seed: 11 }, { k: "oak", d: "back", x: X(27), seed: 14, phone: false },
    { k: "oak", d: "back", x: X(47), seed: 12 }, { k: "pine", d: "back", x: X(83), seed: 13, phone: false },
    { k: "pine", d: "far", x: X(4), seed: 21 }, { k: "oak", d: "far", x: X(55), seed: 22 }, { k: "pine", d: "far", x: X(64), seed: 23, flip: true, phone: false },
    { k: "oak", d: "near", x: fireX - 4, seed: 31 }, { k: "pine", d: "near", x: X(31), seed: 32 },
    { k: "oak", d: "near", x: X(43), seed: 33, flip: true, blossom: true, phone: false }, { k: "pine", d: "near", x: X(70), seed: 34 }, { k: "oak", d: "near", x: X(88), seed: 35 }
  ].filter((tree) => !phone || tree.phone !== false);
  const bushes = [
    { k: "shrub", x: X(26), seed: 41 }, { k: "berry", x: X(37) + 12, seed: 42, phone: false }, { k: "bush", x: X(58), seed: 43 },
    { k: "shrub", x: X(78) + 8, seed: 44, phone: false }, { k: "berry", x: X(95), seed: 45 }
  ].filter((bush) => !phone || bush.phone !== false);
  return {
    W, X, phone, standX, fireX, lamps, trees, bushes,
    stones: [X(8), X(39), X(74)],
    // Donde no crece hierba ni flores: el puesto y la hoguera.
    clear: [[standX - 6, standX + STAND_W + 4], [fireX - 16, fireX + 16]],
    // Donde no se abre agua (ni la poza de pescar ni los agujeros de los peces
    // saltarines): desde el borde, con la farola y el puesto, hasta la hoguera.
    noWater: [0, fireX + 20]
  };
}

// Variables CSS que ponen los botones (puesto, ancla de la hoguera) justo
// encima de lo que dibuja el lienzo.
export function layoutCssVars(L) {
  return {
    "--world-stand-left": `${L.standX * 2}px`,
    "--world-stand-width": `${STAND_W * 2}px`,
    "--world-stand-height": `${STAND_H * 2}px`,
    "--world-fire-left": `${(L.fireX - 12) * 2}px`
  };
}
