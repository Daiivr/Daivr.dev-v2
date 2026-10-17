import { bayer, gridSprite, lazy, makeCanvas, px, rect, rng } from "./core.js";

// El cofre del mercado al abrirse (BuddyChestOpening), en pixel art: un muelle
// de noche junto al agua, el cofre recien pescado cae con un chapoteo (gotea y
// lleva un alga enganchada), tiembla, salta el candado, se abre la tapa con un
// fogonazo y rayos dorados, y las monedas saltan en abanico y caen tintineando
// en las tablas. Luego se queda brillando. Todo en un lienzo de CHEST_W x
// CHEST_H a 2x; `step(dt)` avanza la escena y `draw()` la pinta.
export const CHEST_W = 176;
export const CHEST_H = 104;

const C = { o: "#2a1206", w: "#8a4f22", wm: "#a8622c", wl: "#c97a3a", wd: "#5c2e10", g: "#6a3a18", inner: "#2a1004", b: "#c89a3a", bl: "#f2d27a", bd: "#7a5418" };
const GOLD = { y: "#ffd166", Y: "#c8902a", W: "#fff3b0", D: "#8a5a14" };
// El cofre: 48 de ancho, caja de 20 de alto y tapa de 12; BY es su ultima fila.
const CX = 88, BY = 76, CW = 48, X0 = CX - CW / 2, DECK = 73;
const DROP = 0.32, POP = 1.3, AJAR = 1.34, OPEN = 1.4, BURST = 1.45;

const COIN_PAL = { O: "#6a3a10", W: GOLD.W, y: GOLD.y, Y: GOLD.Y, C: "#e0a83a" };
const sprites = lazy(() => ({
  coin: [
    [".OOOO.", "OWyyyO", "OyyCyO", "OyCyyO", "OyyyYO", ".OOOO."],
    [".OOO.", "OWyyO", "OyCyO", "OyyYO", "OyyYO", ".OOO."],
    [".O.", "OyO", "OYO", "OyO", "OYO", ".O."],
    [".OOO.", "OyyWO", "OyCyO", "OYyyO", "OYyyO", ".OOO."]
  ].map((rows) => gridSprite(rows, COIN_PAL)),
  // Tumbada en las tablas: una elipse fina.
  flat: gridSprite([".OOOO.", "OWyyYO", ".OYYO."], COIN_PAL),
  lock: gridSprite([".ooooo.", "oo...oo", "o.....o", "obbbbbo", "oBllbbo", "obbkbbo", "obbkbbo", "obbbbbo", ".ooooo."], { o: "#3a2408", b: C.b, B: C.bl, l: C.bl, k: C.o })
}));

// El fondo quieto: cielo de noche tramado, luna, colinas con pinos, el agua y
// el muelle de tablas con sus postes.
// Luz suave que se apaga sola antes del borde (sin discos con canto).
function glow(g, x, y, r, rgb, a) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${rgb},${a})`); grad.addColorStop(0.55, `rgba(${rgb},${a * 0.35})`); grad.addColorStop(1, `rgba(${rgb},0)`);
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grad; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.globalCompositeOperation = "source-over";
}

function paintBackdrop() {
  const [cv, g] = makeCanvas(CHEST_W, CHEST_H), R = rng(41);
  const SKY = ["#0a1628", "#12243c", "#1c3654"];
  for (let y = 0; y < 62; y++) for (let x = 0; x < CHEST_W; x++) {
    const f = y / 61 * 2, i = Math.min(1, Math.floor(f)), k = f - i;
    px(g, x, y, SKY[bayer(x, y) < k ? i + 1 : i]);
  }
  // Luna creciente con su halo.
  glow(g, 146, 14, 18, "150,180,210", 0.16);
  g.fillStyle = "#f2ead2"; for (let dy = -6; dy <= 6; dy++) { const hw = Math.round(Math.sqrt(36 - dy * dy)); g.fillRect(146 - hw, 14 + dy, hw * 2 + 1, 1); }
  g.fillStyle = "#0a1628"; for (let dy = -6; dy <= 6; dy++) { const hw = Math.round(Math.sqrt(36 - dy * dy)); g.fillRect(149 - hw, 12 + dy, hw * 2 + 1, 1); }
  px(g, 141, 12, "#fffbea"); px(g, 140, 15, "#d8ccb0");
  // Colinas y pinos.
  for (let x = 0; x < CHEST_W; x++) {
    const top = Math.round(52 + 4 * Math.sin(x * 0.05 + 1) + 2 * Math.sin(x * 0.13));
    rect(g, x, top, 1, 62 - top, "#0e2230"); px(g, x, top, "#1d3a48");
  }
  for (const [x, h] of [[8, 14], [18, 10], [30, 16], [44, 11], [124, 12], [136, 17], [150, 10], [166, 14]]) {
    const base = Math.round(52 + 4 * Math.sin(x * 0.05 + 1) + 2 * Math.sin(x * 0.13)) + 2;
    for (let i = 0; i < h; i++) { const hw = Math.floor(i / 2.6); rect(g, x - hw, base - h + i, hw * 2 + 1, 1, "#0a1a24"); }
  }
  // Agua: lisa y oscura, mas clara hacia el horizonte.
  for (let y = 62; y < CHEST_H; y++) for (let x = 0; x < CHEST_W; x++) px(g, x, y, y < 66 && bayer(x, y) < (66 - y) / 5 ? "#16344a" : "#0c2434");
  // Postes del muelle (detras del tablero y metidos en el agua).
  for (const x of [24, 58, 116, 150]) {
    rect(g, x, 82, 4, CHEST_H - 82, "#2a1206"); rect(g, x + 1, 82, 2, CHEST_H - 82, "#4a2810"); rect(g, x + 1, 82, 1, CHEST_H - 82, "#6a3a18");
    rect(g, x - 1, 88, 6, 1, "#2a5a6e");
  }
  // El tablero: cara de arriba con juntas y clavos, y el larguero de delante.
  rect(g, 12, 70, 152, 13, C.o);
  rect(g, 13, 71, 150, 6, "#8a5428"); rect(g, 13, 71, 150, 1, "#b0703a"); rect(g, 13, 76, 150, 1, "#6a3a18");
  for (let x = 13; x < 163; x++) { const v = R(); if (v < 0.12) px(g, x, 72 + Math.floor(R() * 4), "#7a4a20"); else if (v > 0.93) px(g, x, 73, "#a0643a"); }
  for (let x = 22; x < 163; x += 11) { rect(g, x, 71, 1, 6, "#5c2e10"); px(g, x + 2, 72, "#c8b8a0"); px(g, x - 2, 75, "#c8b8a0"); }
  rect(g, 13, 77, 150, 5, "#5c2e10"); rect(g, 13, 77, 150, 1, "#7a4a20"); rect(g, 13, 81, 150, 1, "#3a1a08");
  return cv;
}

export function createChestScene(canvas, { coins = 6 } = {}) {
  const g = canvas.getContext("2d");
  const backdrop = paintBackdrop();
  const R = rng(7 + coins);
  const stars = Array.from({ length: 26 }, () => ({ x: Math.floor(R() * CHEST_W), y: 2 + Math.floor(R() * 42), p: R() * 6, big: R() < 0.2 }));
  const flies = Array.from({ length: 3 }, (_, i) => ({ ax: 20 + i * 18 + R() * 8, ay: 46 + R() * 8, p: R() * 6 }));
  // (una moneda por cada una del premio)
  const count = Math.max(1, Math.min(12, coins));
  let t = 0, nextCoin = BURST, launched = 0, lockOff = null, nextSparkle = 2.2;
  const parts = [], money = [];

  function spawnCoin() {
    const side = launched % 2 ? 1 : -1, spread = 0.35 + R() * 0.65;
    money.push({ x: CX - 3 + (R() - 0.5) * 14, y: BY - 26, vx: side * (16 + spread * 44), vy: -(84 + R() * 40), rest: DECK + Math.floor(R() * 4), bounced: false, landed: false, p: R() * 4 });
    launched++;
  }
  function sparkle(x, y) { parts.push({ k: "spark", x, y, life: 0.5, max: 0.5 }); }

  function step(dt) {
    const before = t;
    t += dt;
    // Cae al muelle con un chapoteo.
    if (before < DROP && t >= DROP) for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      parts.push({ k: "drop", x: CX + side * (CW / 2 - 2 + R() * 6), y: BY - 1, vx: side * (16 + R() * 50), vy: -(30 + R() * 50), g: 240, life: 0.7, max: 0.7, c: R() < 0.4 ? "#e8f8ff" : "#7fc8e8" });
    }
    // Salta el candado.
    if (before < POP && t >= POP) {
      lockOff = { x: CX - 3, y: BY - 22, vx: 40, vy: -80, landed: false };
      for (let i = 0; i < 6; i++) sparkle(CX + (R() - 0.5) * 8, BY - 18 + (R() - 0.5) * 5);
    }
    // Fogonazo al abrirse: chispas doradas.
    if (before < OPEN && t >= OPEN) for (let i = 0; i < 18; i++) {
      const a = -Math.PI / 2 + (R() - 0.5) * 2.4, v = 40 + R() * 70;
      parts.push({ k: "ember", x: CX + (R() - 0.5) * 28, y: BY - 22, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 90, life: 0.6 + R() * 0.5, max: 1.1 });
    }
    while (launched < count && t >= nextCoin) { spawnCoin(); nextCoin += 0.05; }
    for (const m of money) {
      if (m.landed) continue;
      m.vy += 300 * dt; m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.y >= m.rest && m.vy > 0) {
        m.y = m.rest;
        if (!m.bounced) { m.bounced = true; m.vy = -m.vy * 0.32; m.vx *= 0.5; sparkle(m.x + 3, m.y); }
        else { m.landed = true; m.vx = 0; m.vy = 0; }
      }
    }
    if (lockOff && !lockOff.landed) {
      lockOff.vy += 300 * dt; lockOff.x += lockOff.vx * dt; lockOff.y += lockOff.vy * dt;
      if (lockOff.y >= DECK - 7 && lockOff.vy > 0) { lockOff.y = DECK - 7; lockOff.landed = true; }
    }
    for (const p of parts) { p.life -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.g) p.vy += p.g * dt; }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    // Ya abierto: destellos sueltos en las monedas y en el monton.
    if (t > nextSparkle && t > 2) {
      nextSparkle = t + 0.25 + R() * 0.35;
      const resting = money.filter((m) => m.landed);
      if (resting.length && R() < 0.6) { const m = resting[Math.floor(R() * resting.length)]; sparkle(m.x + 1 + R() * 4, m.y + R() * 3); }
      else sparkle(X0 + 6 + R() * (CW - 12), BY - 25 + R() * 4);
    }
  }

  // Avanza de golpe (saltar la animacion o movimiento reducido).
  function skipTo(target) {
    if (t >= target - 0.6) return;
    while (t < target) step(1 / 60);
  }

  // La tapa cerrada, abombada, con flejes de laton, percebes y el cierre.
  function drawLid(lift, glowSeam) {
    const top = BY - 31 - lift, insets = [7, 4, 2, 1];
    for (let r = 0; r < 12; r++) {
      const inset = insets[r] ?? 0, y = top + r;
      rect(g, X0 + inset, y, CW - inset * 2, 1, C.o);
      if (r === 0 || r === 11) continue;
      const col = r === 1 ? C.wl : r === 2 ? C.wm : r === 6 ? C.wd : r === 7 ? C.wm : r >= 9 ? C.b : C.w;
      rect(g, X0 + inset + 1, y, CW - 2 - inset * 2, 1, col);
    }
    rect(g, X0 + 1, top + 9, CW - 2, 1, C.bl);
    for (const bx of [X0 + 7, X0 + CW - 11]) {
      rect(g, bx, top + 1, 4, 8, C.b); rect(g, bx, top + 1, 1, 8, C.bl); rect(g, bx + 3, top + 1, 1, 8, C.bd);
      px(g, bx + 1, top + 4, C.bd); px(g, bx + 2, top + 4, C.bd);
    }
    for (const [x, y] of [[29, 3], [30, 3], [31, 4], [16, 5], [36, 5]]) px(g, X0 + x, top + y, (x + y) % 2 ? "#c8d0c8" : "#9aa4a0");
    rect(g, CX - 2, top + 8, 4, 5, C.o); rect(g, CX - 1, top + 8, 2, 4, C.b); px(g, CX - 1, top + 8, C.bl);
    // La rendija entre tapa y caja, con la luz del oro.
    if (glowSeam) rect(g, X0 + 2, BY - 19 - lift, CW - 4, lift, glowSeam > 1 ? GOLD.W : GOLD.y);
  }
  // La tapa abierta hacia atras: se ve su cara de dentro, con el fleje arriba.
  function drawOpenLid() {
    for (let r = 0; r < 23; r++) {
      const y = BY - 42 + r, inset = r < 1 ? 3 : r < 3 ? 2 : r < 6 ? 1 : 0;
      rect(g, X0 + inset, y, CW - inset * 2, 1, C.o);
      if (r === 0) continue;
      rect(g, X0 + inset + 1, y, CW - 2 - inset * 2, 1, r < 4 ? (r === 1 ? C.bl : C.b) : r % 6 === 0 ? C.inner : r % 6 === 1 ? C.g : C.wd);
    }
    for (const bx of [X0 + 7, X0 + CW - 11]) rect(g, bx, BY - 38, 4, 18, "#4a2410");
  }
  // El monton de oro que asoma por la boca del cofre.
  function drawPile() {
    rect(g, X0 + 1, BY - 22, CW - 2, 3, C.inner);
    for (let x = X0 + 2; x < X0 + CW - 2; x++) {
      const h = 3 + Math.round(1.8 * Math.sin(x * 0.7) + 1.3 * Math.sin(x * 0.31 + 1));
      px(g, x, BY - 20 - h, "#6a3a10");
      for (let k = 0; k < h; k++) px(g, x, BY - 20 - k, k === h - 1 ? GOLD.W : (x + k) % 3 === 0 ? GOLD.Y : GOLD.y);
    }
    for (const x of [X0 + 9, X0 + 20, X0 + 33]) { px(g, x, BY - 24, GOLD.W); px(g, x + 1, BY - 23, GOLD.W); }
  }
  function drawBody(dx) {
    const x0 = X0 + dx, top = BY - 19;
    rect(g, x0, top, CW, 20, C.o);
    rect(g, x0 + 1, top + 1, CW - 2, 18, C.w);
    rect(g, x0 + 1, top + 1, CW - 2, 1, C.wm);
    for (const y of [top + 7, top + 13]) { rect(g, x0 + 1, y, CW - 2, 1, C.wd); rect(g, x0 + 1, y + 1, CW - 2, 1, C.wm); }
    rect(g, x0 + 1, BY - 1, CW - 2, 1, C.wd);
    for (const [gx, gy] of [[13, 3], [19, 10], [26, 4], [32, 16], [15, 16], [42, 9], [23, 10], [4, 5]]) px(g, x0 + gx, top + gy, C.g);
    for (const bx of [x0 + 7, x0 + CW - 11]) {
      rect(g, bx, top + 1, 4, 18, C.b); rect(g, bx, top + 1, 1, 18, C.bl); rect(g, bx + 3, top + 1, 1, 18, C.bd);
      for (const ry of [3, 10, 16]) { px(g, bx + 1, top + ry, C.bd); px(g, bx + 2, top + ry, C.bd); }
    }
    // Esquinas de laton abajo y las asas de hierro a los lados.
    for (const [cx0, sx] of [[x0 + 1, 1], [x0 + CW - 2, -1]]) { rect(g, Math.min(cx0, cx0 + sx * 3), BY - 3, 4, 3, C.b); px(g, cx0, BY - 3, C.bl); }
    for (const hx of [x0 - 2, x0 + CW]) { rect(g, hx, top + 7, 2, 4, "#1a1410"); px(g, hx + (hx < x0 ? 0 : 1), top + 8, "#6a6460"); }
    // Placa de la cerradura.
    rect(g, CX - 4 + dx, top + 1, 8, 8, C.o); rect(g, CX - 3 + dx, top + 2, 6, 6, C.b); rect(g, CX - 3 + dx, top + 2, 6, 1, C.bl);
    px(g, CX + dx, top + 4, C.o); px(g, CX - 1 + dx, top + 4, C.o); px(g, CX + dx, top + 5, C.o); px(g, CX + dx, top + 6, C.o);
    // El alga que se trajo del agua, y las gotas que resbalan.
    const sway = Math.round(Math.sin(t * 2.2));
    for (const [sx, sy, col] of [[2, 0, "#3f8a3a"], [2, 1, "#3f8a3a"], [3, 2, "#2a5a2a"], [3, 3, "#3f8a3a"], [2, 4, "#5aa84a"], [1, 5, "#3f8a3a"], [1, 6, "#2a5a2a"], [2, 7, "#3f8a3a"], [2, 8, "#5aa84a"], [1 + sway, 9, "#3f8a3a"], [1 + sway, 10, "#2a5a2a"], [sway, 11, "#3f8a3a"], [3, 1, "#5aa84a"], [4, 1, "#2a5a2a"]]) px(g, x0 + sx, top + sy, col);
    for (const [ox, period, ph] of [[16, 1.6, 0], [33, 1.9, 0.7], [44, 2.3, 1.3]]) {
      const k = ((t + ph) % period) / period;
      if (k < 0.75) px(g, x0 + ox, top + 1 + Math.floor(k / 0.75 * 17), "#9fd8f0");
    }
  }
  function drawCoin(m) {
    if (m.landed) { g.drawImage(sprites().flat, Math.round(m.x), Math.round(m.y - 2)); return; }
    const img = sprites().coin[Math.floor(t * 14 + m.p) % 4];
    g.drawImage(img, Math.round(m.x + (6 - img.width) / 2), Math.round(m.y - 5));
  }
  function drawRays(k) {
    if (k <= 0) return;
    g.globalCompositeOperation = "lighter";
    const ox = CX, oy = BY - 22, n = 11, len = 86;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + (i + 0.5) / n * Math.PI + Math.sin(t * 0.5) * 0.07, w = i % 2 ? 0.035 : 0.06;
      const grad = g.createRadialGradient(ox, oy, 4, ox, oy, len);
      const peak = (i % 2 ? 0.16 : 0.26) * k;
      grad.addColorStop(0, `rgba(255,196,84,${peak})`); grad.addColorStop(0.5, `rgba(255,180,70,${peak * 0.4})`); grad.addColorStop(1, "rgba(255,170,60,0)");
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(a - w) * len, oy + Math.sin(a - w) * len); g.lineTo(ox + Math.cos(a + w) * len, oy + Math.sin(a + w) * len); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = "source-over";
  }

  function draw() {
    g.clearRect(0, 0, CHEST_W, CHEST_H);
    g.drawImage(backdrop, 0, 0);
    // Estrellas que titilan, luciernagas y el agua que se mueve.
    for (const s of stars) {
      const b = Math.sin(t * 1.6 + s.p);
      if (b < -0.6) continue;
      px(g, s.x, s.y, b > 0.6 ? "#fff6d8" : "#8aa0c0");
      if (s.big && b > 0.7) { px(g, s.x - 1, s.y, "#5a7090"); px(g, s.x + 1, s.y, "#5a7090"); px(g, s.x, s.y - 1, "#5a7090"); px(g, s.x, s.y + 1, "#5a7090"); }
    }
    for (const f of flies) {
      const x = f.ax + Math.sin(t * 0.7 + f.p) * 8, y = f.ay + Math.sin(t * 1.1 + f.p * 2) * 3, on = Math.sin(t * 2 + f.p * 3) > 0.1;
      if (on) { glow(g, x, y, 5, "200,255,140", 0.3); px(g, Math.round(x), Math.round(y), "#e8ffb0"); }
    }
    for (const [y, sp, dir] of [[63, 3, 1], [65, 4, -1], [80, 5, 1], [84, 6, -1], [89, 7, 1], [94, 8, -1], [99, 9, 1]]) {
      for (let i = 0; i < 5; i++) {
        const x = Math.round(((i * 41 + y * 13 + dir * t * sp) % (CHEST_W + 12) + CHEST_W + 12) % (CHEST_W + 12)) - 6;
        rect(g, x, y, 3 + (i % 3), 1, "#1d4a5e");
      }
    }
    // El reflejo de la luna, roto por las ondas.
    for (let y = 63; y < CHEST_H; y += 2) {
      if (y > 66 && y < 79) continue;
      const w = 2 + Math.round(1.5 + Math.sin(t * 2 + y * 0.8) * 1.5), x = 146 - Math.floor(w / 2) + Math.round(Math.sin(t * 1.3 + y) * 1);
      rect(g, x, y, w, 1, y < 70 ? "#c8d4dc" : "#6f8ea4");
    }

    // La caida y el temblor.
    const e = t;
    const fall = e < DROP ? -70 * (1 - (e / DROP) ** 2) : e < DROP + 0.12 ? -2 * Math.sin((e - DROP) / 0.12 * Math.PI) : 0;
    const shaking = (e > 0.62 && e < 0.84) || (e > 0.98 && e < POP);
    const dx = shaking ? (Math.floor(e * 30) % 2 ? 1 : -1) : 0;
    const open = e >= OPEN, k = open ? Math.min(1, (e - OPEN) / 0.4) : 0;

    // Charco bajo el cofre y la luz del oro en las tablas y el agua.
    if (e >= DROP) { g.globalAlpha = 0.5; rect(g, X0 - 3, BY, CW + 6, 1, "#3a2210"); rect(g, X0 - 7, BY + 1, CW + 14, 1, "#3a2210"); g.globalAlpha = 1; }
    if (open) {
      glow(g, CX, BY - 14, 46, "255,190,90", 0.32 * k);
      glow(g, CX, 92, 26, "255,180,90", 0.16 * k);
    }
    drawRays(k * (0.85 + Math.sin(t * 1.7) * 0.15));

    g.save();
    g.translate(0, Math.round(fall));
    const back = money.filter((m) => m.landed && m.y < BY - 1 && Math.abs(m.x + 3 - CX) < CW / 2 + 3);
    for (const m of back) drawCoin(m);
    if (open) { drawOpenLid(); drawPile(); }
    drawBody(dx);
    if (!open) {
      const ajar = e >= AJAR, hop = e > 0.98 && e < POP && Math.floor(e * 15) % 2 ? 1 : 0;
      drawLid(ajar ? 3 : hop, ajar ? 2 : hop ? 1 : 0);
      if (!lockOff) g.drawImage(sprites().lock, CX - 3 + dx, BY - 22 - (ajar ? 3 : hop));
    }
    g.restore();
    if (lockOff) g.drawImage(sprites().lock, Math.round(lockOff.x), Math.round(lockOff.y));
    for (const m of money) if (!back.includes(m)) drawCoin(m);

    for (const p of parts) {
      const a = p.life / p.max;
      if (p.k === "drop") px(g, Math.round(p.x), Math.round(p.y), p.c);
      else if (p.k === "ember") px(g, Math.round(p.x), Math.round(p.y), a > 0.5 ? GOLD.W : GOLD.y);
      else if (p.k === "spark") {
        const x = Math.round(p.x), y = Math.round(p.y), big = a > 0.3 && a < 0.8;
        px(g, x, y, "#fffbe0");
        if (big) { px(g, x - 1, y, GOLD.y); px(g, x + 1, y, GOLD.y); px(g, x, y - 1, GOLD.y); px(g, x, y + 1, GOLD.y); }
        if (a > 0.45 && a < 0.65) { px(g, x - 2, y, "#c8902a"); px(g, x + 2, y, "#c8902a"); px(g, x, y - 2, "#c8902a"); px(g, x, y + 2, "#c8902a"); }
      }
    }
    // El fogonazo.
    if (e >= OPEN && e < OPEN + 0.28) {
      g.globalCompositeOperation = "lighter";
      g.fillStyle = `rgba(255,220,140,${0.32 * (1 - (e - OPEN) / 0.28)})`;
      g.fillRect(0, 0, CHEST_W, CHEST_H);
      g.globalCompositeOperation = "source-over";
    }
  }

  return { step, draw, skipTo, get t() { return t; } };
}
