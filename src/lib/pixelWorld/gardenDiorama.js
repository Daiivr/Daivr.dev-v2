import { bayer, lazy, outlinedSprite, px, rect, rng } from "./core.js";
import { GARDEN_SPRITES, PLANT_BASE, SOIL_TOP, cropStage, drawBed } from "./life/garden.js";

// El huerto en pequeño para el cobertizo de semillas del mercado: un trozo
// del valle (cielo con nubes, colinas, la valla de madera, el cartel y la
// regadera) con las tres parcelas y lo que crece de verdad en cada una. Las
// hojas se mecen, lo maduro destella, pasa una mariposa y, al pasar por un
// sobre, la siguiente parcela libre enseña la planta en fantasma con una
// flechita encima. Mismo arte que life/garden.js, a escala entera.
export const DIORAMA = { w: 168, h: 46 };
// Centros de las parcelas (en % del ancho los usan las etiquetas de debajo).
export const DIORAMA_PLOTS = [52, 92, 132];
// En pantallas estrechas se ve solo lo que quepa a escala 2 (en vez de todo a
// escala 1), centrado en la parcela del medio.
export function dioramaView(room) {
  const full = Math.floor(room / DIORAMA.w);
  if (full >= 2 || room < 200) return { x: 0, w: DIORAMA.w, scale: Math.max(1, Math.min(5, full)) };
  const w = Math.min(DIORAMA.w, Math.floor(room / 2));
  return { x: Math.max(0, Math.min(DIORAMA.w - w, Math.round(DIORAMA_PLOTS[1] - w / 2))), w, scale: 2 };
}
const SOIL_Y = 31; // fila de arriba del caballon en el diorama
const GROUND = 30;

// Cielo plano en franjas (con una fila de trama entre una y otra), como el
// de Stardew; colinas con pinos al fondo.
const SKY = [[0, "#8cc4ea"], [7, "#9fcfee"], [12, "#b4daef"], [16, "#c8e4ee"]];
const HILLS = [{ c: "#a8cc96", d: "#94bc82", base: 20, amp: 2.5, f: 0.06, p: 1, pines: "#6f9c72" }, { c: "#86b86a", d: "#76a85c", base: 24, amp: 2, f: 0.1, p: 4, pines: "#4f8a54" }];
const CLOUD = lazy(() => outlinedSprite(["..ww....", ".wwWww..", "wwWWWwww", ".wwwwww."], { w: "#ffffff", W: "#ffffff" }, "#d6e6f0"));
const FENCE = { post: "#a8743e", postL: "#d0a066", rail: "#8a5a2e", out: "#3a2414" };
const FLOWERS = ["#ffd84a", "#ff8ab8", "#ffffff", "#b48aff"];

// La parte quieta (cielo, colinas, prado, valla y sendero), una vez.
const backdrop = lazy(() => {
  const c = document.createElement("canvas");
  c.width = DIORAMA.w; c.height = DIORAMA.h;
  const g = c.getContext("2d"), R = rng(17), W = DIORAMA.w;
  SKY.forEach(([from, c], i) => {
    const to = SKY[i + 1]?.[0] ?? GROUND;
    rect(g, 0, from, W, to - from, c);
    if (i > 0) for (let x = 0; x < W; x += 2) px(g, x + (from % 2), from, SKY[i - 1][1]);
  });
  // el sol, arriba a la derecha
  const sun = [W - 24, 7];
  for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
    const d = x * x + y * y;
    if (d <= 10) px(g, sun[0] + x, sun[1] + y, d <= 4 ? "#fff8d0" : "#ffe9a0");
    else if (d <= 18 && bayer(x + 8, y + 8) > 0.45) px(g, sun[0] + x, sun[1] + y, "#f8f0c8");
  }
  for (const hill of HILLS) {
    const tops = [];
    for (let x = 0; x < W; x++) {
      const top = Math.round(hill.base - hill.amp * (Math.sin(x * hill.f + hill.p) * 0.6 + Math.sin(x * hill.f * 2.3 + hill.p) * 0.4));
      tops.push(top);
      rect(g, x, top, 1, GROUND - top + 1, hill.c);
      if (bayer(x, top + 2) > 0.7) px(g, x, top + 2, hill.d);
    }
    // pinos pequeños sobre la cresta
    for (let x = 4 + hill.p * 3; x < W - 3; x += 9 + ((x * 7) % 5)) {
      const base = tops[x], h = 4 + ((x * 3) % 3);
      for (let k = 0; k < h; k++) { const half = Math.floor(k / 2); rect(g, x - half, base - h + k, half * 2 + 1, 1, hill.pines); }
      px(g, x, base, hill.d);
    }
  }
  // matas redondas a los lados, detras de la valla
  for (const [cx, r] of [[8, 7], [W - 10, 8], [W - 22, 5]]) for (let y = -r; y <= 0; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r) continue;
    const light = x + y < -r * 0.7;
    px(g, cx + x, GROUND + 1 + y, light ? "#6ab84a" : bayer(cx + x, y) < 0.3 ? "#3a8a32" : "#4a9a3a");
  }
  // prado con matojos y flores
  rect(g, 0, GROUND, W, DIORAMA.h - GROUND, "#5a9a3a");
  for (let y = GROUND; y < DIORAMA.h - 6; y++) for (let x = 0; x < W; x++) if (bayer(x * 3, y) > 0.82) px(g, x, y, "#4a8a30");
  rect(g, 0, GROUND, W, 1, "#7ac05a");
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(R() * W), y = GROUND + 2 + Math.floor(R() * 8);
    px(g, x, y, "#7ac05a"); px(g, x, y - 1, "#7ac05a");
    if (i % 3 === 0) px(g, x, y - 2, FLOWERS[i % FLOWERS.length]);
  }
  // la valla: postes cada 12 px y dos travesaños
  for (let x = 2; x < W; x += 12) {
    rect(g, x - 1, 21, 4, 12, FENCE.out);
    rect(g, x, 22, 2, 10, FENCE.post); px(g, x, 22, FENCE.postL); px(g, x, 23, FENCE.postL);
  }
  for (const y of [24, 28]) { rect(g, 0, y, W, 2, FENCE.out); rect(g, 0, y, W, 1, FENCE.rail); }
  for (let x = 2; x < W; x += 12) rect(g, x, 22, 2, 10, FENCE.post);
  // el sendero de abajo, con piedras
  const pathY = DIORAMA.h - 5;
  rect(g, 0, pathY, W, 5, "#b08a5a");
  rect(g, 0, pathY, W, 1, "#8a6a42");
  for (let i = 0; i < 14; i++) { const x = Math.floor(R() * W), y = pathY + 1 + Math.floor(R() * 3); px(g, x, y, i % 2 ? "#9a7a50" : "#c8a070"); }
  return c;
});

export function createGardenDiorama(view) {
  // (se pinta entero aqui y se copia al lienzo visible, entero o recortado)
  const canvas = document.createElement("canvas");
  canvas.width = DIORAMA.w; canvas.height = DIORAMA.h;
  const g = canvas.getContext("2d"), vg = view.getContext("2d");
  g.imageSmoothingEnabled = false;
  let crop = null;
  const present = () => {
    const x = crop?.x ?? 0, w = crop?.w ?? DIORAMA.w;
    if (view.width !== w || view.height !== DIORAMA.h) { view.width = w; view.height = DIORAMA.h; }
    vg.imageSmoothingEnabled = false;
    vg.clearRect(0, 0, w, DIORAMA.h);
    vg.drawImage(canvas, x, 0, w, DIORAMA.h, 0, 0, w, DIORAMA.h);
  };
  const fly = { x: 20, y: 18, p: 0 };
  // `plots`: [{ plot, seedId, crop, growth } | null] x3; `ghost`: la planta
  // que se veria en la siguiente parcela libre; `wet`: parcelas humedas.
  // `view`: { x, w } de dioramaView (lo que se ve)
  function draw({ plots = [], ghost = null, wet = false, t = 0, view: shown = null }) {
    crop = shown;
    const S = GARDEN_SPRITES();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, DIORAMA.w, DIORAMA.h);
    g.drawImage(backdrop(), 0, 0);
    // nubes que pasan despacio
    const cloud = CLOUD();
    for (const [speed, y, off] of [[1.6, 3, 0], [1, 9, 90]]) {
      const x = ((t * speed + off) % (DIORAMA.w + 20)) - 12;
      g.drawImage(cloud, Math.round(x), y);
    }
    // el cartel y la regadera, a la izquierda
    g.drawImage(S.sign, 20, GROUND + 7 - S.sign.height);
    g.drawImage(S.can, 27, GROUND + 9 - S.can.height);
    // las parcelas (dibujadas con el arte del mundo, subido a su fila)
    g.setTransform(1, 0, 0, 1, 0, SOIL_Y - SOIL_TOP);
    const ghostAt = ghost ? plots.findIndex((p) => !p) : -1;
    DIORAMA_PLOTS.forEach((cx, i) => {
      const entry = plots[i];
      const moisture = wet instanceof Set ? Number(wet.has(i)) : Number(Boolean(wet));
      drawBed(g, S, cx, entry, { wet: moisture, t, wind: 1 });
      if (!entry && i === ghostAt) {
        g.globalAlpha = 0.55;
        drawBed(g, S, cx, { crop: ghost, growth: 1 }, { wet: 0, t, wind: 1 });
        g.globalAlpha = 1;
      }
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
    // destellos en lo maduro y la flechita sobre la parcela del fantasma
    plots.forEach((entry, i) => {
      if (!entry || cropStage(entry.growth) < 4) return;
      const c = ((t + i * 0.9) % 2.4) / 2.4;
      if (c > 0.16) return;
      const x = DIORAMA_PLOTS[i] + 3, y = SOIL_Y + PLANT_BASE - SOIL_TOP - 10;
      px(g, x, y, "#ffffff");
      if (c > 0.04 && c < 0.12) { px(g, x - 1, y, "#fff6cf"); px(g, x + 1, y, "#fff6cf"); px(g, x, y - 1, "#fff6cf"); px(g, x, y + 1, "#fff6cf"); }
    });
    if (ghostAt >= 0) {
      const x = DIORAMA_PLOTS[ghostAt], y = 9 + Math.round(Math.sin(t * 5) * 1.2);
      rect(g, x - 2, y, 5, 1, "#3a2414"); rect(g, x - 1, y + 1, 3, 1, "#3a2414"); px(g, x, y + 2, "#3a2414");
      rect(g, x - 1, y, 3, 1, "#ffd166"); px(g, x, y + 1, "#ffd166");
    }
    // una mariposa de parcela en parcela
    fly.p = t;
    fly.x = DIORAMA.w / 2 + Math.sin(t * 0.35) * 62;
    fly.y = 17 + Math.sin(t * 1.3) * 5;
    const wing = Math.floor(t * 8) % 2, bx = Math.round(fly.x), by = Math.round(fly.y);
    px(g, bx, by, "#3a2414");
    if (wing) { px(g, bx - 1, by - 1, "#ffb84a"); px(g, bx + 1, by - 1, "#ffb84a"); }
    else { px(g, bx - 1, by, "#ffd27a"); px(g, bx + 1, by, "#ffd27a"); }
    present();
  }
  return draw;
}
