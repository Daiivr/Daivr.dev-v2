// Sprites pixel-art del cursor. Cada fila es una linea de celdas de 2px:
//   X = contorno de tinta (se lee sobre cualquier fondo)
//   f = relleno del color del modo   h = brillo   s = sombra   . = vacio
// hot = punto activo en celdas (la punta del dedo, el centro de la I...).
// Para retocar un dibujo basta con editar las filas: los paths se generan solos.
const SPRITE_ROWS = {
  arrow: {
    hot: [0.5, 0.5],
    rows: [
      "X........",
      "XX.......",
      "XhX......",
      "XhfX.....",
      "XhffX....",
      "XhffsX...",
      "XhfffsX..",
      "XhffffsX.",
      "XhfffXXXX",
      "XhfXfsX..",
      "XhX.XfsX.",
      "XX..XfsX.",
      ".....XX.."
    ]
  },
  hand: {
    hot: [4, 0.5],
    rows: [
      "...XX......",
      "..XhfX.....",
      "..XhfX.....",
      "..XhfXXX...",
      "..XhfsffXX.",
      "..XhfsffsfX",
      "XXXhfsffsfX",
      "XhXhffffffX",
      "XhhffffffsX",
      ".XhffffffsX",
      ".XfffffffsX",
      "..XffffssX.",
      "..XsssssX..",
      "...XXXXX..."
    ]
  },
  ibeam: {
    hot: [3.5, 7],
    rows: [
      "XX...XX",
      "XhX.XhX",
      ".XXfXX.",
      "..XfX..",
      "..XfX..",
      "..XfX..",
      "..XfX..",
      "..XfX..",
      "..XfX..",
      "..XfX..",
      "..XfX..",
      ".XXfXX.",
      "XsX.XsX",
      "XX...XX"
    ]
  },
  grab: {
    hot: [6, 7],
    rows: [
      "......XX....",
      "...XXXhfX...",
      "..XhfXhfXXX.",
      "..XhfXhfXhfX",
      "..XhfXhfXhfX",
      "..XhfXhfXhfX",
      "XXXhfsffsffX",
      "XhXhfffffffX",
      "XhhfffffffsX",
      ".XhfffffffsX",
      ".XffffffffsX",
      "..XffffffsX.",
      "..XssssssX..",
      "...XXXXXX..."
    ]
  },
  grabbing: {
    hot: [6, 5],
    rows: [
      "...XX.XX.XX.",
      "..XhfXhfXhfX",
      "XXXhfsffsffX",
      "XhXhfffffffX",
      "XhhfffffffsX",
      ".XhfffffffsX",
      ".XffffffffsX",
      "..XffffffsX.",
      "..XssssssX..",
      "...XXXXXX..."
    ]
  }
};

export const CURSOR_CELL = 2;
export const CURSOR_TONES = ["X", "s", "f", "h"];

// Una corrida horizontal del mismo tono = un solo rectangulo en el path.
function tracePaths(rows) {
  const paths = {};
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const tone = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === tone) end += 1;
      if (tone !== ".") paths[tone] = `${paths[tone] || ""}M${x} ${y}h${end - x}v1h${x - end}z`;
      x = end;
    }
  });
  return paths;
}

export const CURSOR_SPRITES = Object.entries(SPRITE_ROWS).map(([name, { hot, rows }]) => ({
  name,
  hot,
  width: Math.max(...rows.map((row) => row.length)),
  height: rows.length,
  paths: tracePaths(rows)
}));

// Que dibujo lleva cada modo. Ocupado y bloqueado conservan la flecha y
// ponen una insignia al lado.
export const SPRITE_BY_MODE = {
  blocked: "arrow",
  busy: "arrow",
  default: "arrow",
  grab: "grab",
  grabbing: "grabbing",
  interactive: "hand",
  text: "ibeam"
};
