import { rect } from "../core.js";

// Llama de una bota cohete bajo el pie `ft` ([x, y] en px del lienzo): blanca
// en la tobera, amarilla, naranja y roja en la punta, que culebrea. `flick`
// alterna el largo en cada fotograma; `big` es el fogonazo al frenar del todo.
export function drawJet(g, ft, flick, big) {
  const len = big ? 7 : 4 + flick, cx = ft[0] + 1;
  for (let i = 0; i < len; i++) {
    const y = ft[1] + 1 + i, wide = i < 3 ? 1 : 0, j = i > 3 ? (flick ? 1 : -1) * (i % 2) : 0;
    rect(g, cx - wide + j, y, 1 + wide * 2, 1, i === 0 ? "#fff6cf" : i === 1 ? "#ffd36b" : i < 4 ? "#ff8a2a" : "#e8492a");
  }
}
