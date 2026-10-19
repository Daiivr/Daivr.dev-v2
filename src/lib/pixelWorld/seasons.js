import { bayer, blit, halo, line, N4, px, rect, rng } from "./core.js";
import { FONT, FEST, LAMP_H, balloonSprite, seasonSprites, sprites } from "./props.js";
import { H, STAND_TOP, seasonGroundSpots } from "./layout.js";
import { snowCaps, TREE_BASE } from "./scenery.js";

// Decorado de los eventos de temporada de la pagina (los mismos dias y la
// misma vista previa ?season= que src/lib/seasons.js): nieve y luces de
// navidad, calabazas y murcielagos, guirnaldas y globos, fuegos artificiales,
// patos y fallos de imagen el dia de los inocentes.
const LAMP_TOP = 72 - LAMP_H + 1;

function sag(x0, y0, x1, y1, drop, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * drop]); }
  return pts;
}

export function seasonSetup(season, W, L, trees) {
  if (!season) return null;
  const R = rng(77 + W), sea = { season, W, L, parts: [] };
  const lampA = L.lamps[L.lamps.length - 2], lampB = L.lamps[L.lamps.length - 1];
  const spots = seasonGroundSpots(season, L);
  if (season === "winter") {
    sea.flakes = Array.from({ length: Math.round(W / 5) }, () => ({ x: R() * W, y: R() * H, v: 5 + R() * 9, s: R() < 0.18 ? 2 : 1, p: R() * 6 }));
    sea.snowman = spots[0];
    const pine = trees.find((tree) => tree.k === "pine" && tree.d === "near");
    sea.bulbs = [];
    if (pine) {
      const img = pine.art.c, d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
      const ox = pine.x - Math.floor(pine.art.w / 2), oy = TREE_BASE.near - pine.art.h + 1;
      for (let k = 0; k < 600 && sea.bulbs.length < 11; k++) {
        const x = Math.floor(R() * img.width), y = 7 + Math.floor(R() * (pine.art.ch - 9));
        if (d[(y * img.width + x) * 4 + 3]) sea.bulbs.push({ x: ox + x, y: oy + y, c: FEST[sea.bulbs.length % 5], p: R() * 6 });
      }
      sea.star = [pine.x, oy];
    }
    sea.awning = [];
    for (let x = L.standX + 2; x < L.standX + 64; x += 4) sea.awning.push({ x, y: STAND_TOP + 26, c: FEST[(x / 4 | 0) % 4], p: x * 0.7 });
  }
  if (season === "halloween") {
    sea.pumpkins = spots.map((x) => ({ x, y: 71 })).concat([{ x: L.standX + 33, y: STAND_TOP + 42 }]);
    sea.bats = [0, 1, 2].map(() => ({ x: R() * W, y: 10 + R() * 22, v: 14 + R() * 10, p: R() * 6 }));
    sea.wisps = [{ x: L.X(46), y: 46, p: 0 }, { x: L.X(73), y: 50, p: 2.1 }];
  }
  if (season === "birthday") {
    sea.bunting = sag(L.standX + 47, STAND_TOP + 2, lampA, LAMP_TOP, 7, 12).concat(sag(lampA, LAMP_TOP, lampB, LAMP_TOP, 14, 38).slice(1));
    sea.balloons = [];
    for (const [bx, by] of [[lampA, LAMP_TOP], [lampB, LAMP_TOP], [L.standX + 63, STAND_TOP + 12]]) {
      for (let i = 0; i < 3; i++) sea.balloons.push({ bx, by, dx: (i - 1) * 4, dy: -11 - (i % 2) * 4, c: FEST[(i + Math.round(bx)) % 5], p: R() * 6 });
    }
    sea.gifts = spots;
    sea.cake = [L.standX + 43, STAND_TOP + 36];
    sea.confetti = Array.from({ length: Math.round(W / 8) }, () => ({ x: R() * W, y: R() * H, v: 8 + R() * 8, c: FEST[Math.floor(R() * 5)], p: R() * 6 }));
  }
  if (season === "anniversary") {
    sea.fw = []; sea.nextFw = 0.4;
    sea.lanterns = sag(L.standX + 47, STAND_TOP + 2, lampA, LAMP_TOP, 8, 6).slice(1, -1);
  }
  if (season === "april-fools") {
    sea.ducks = [0, 1, 2].map((i) => ({ x: L.X(42) + i * 9, dir: 1 }));
    sea.glitchAt = 2; sea.glitchUntil = 0;
  }
  return sea;
}

export function seasonUpdate(sea, dt, t) {
  if (!sea) return;
  const W = sea.W;
  for (const q of sea.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; }
  sea.parts = sea.parts.filter((q) => q.life > 0 && q.x > -12 && q.x < W + 12);
  if (sea.flakes) for (const f of sea.flakes) { f.y += f.v * dt; f.x += (Math.sin(t * 1.3 + f.p) * 6 - 3) * dt; if (f.y > H) { f.y = -2; f.x = Math.random() * W; } if (f.x < -2) f.x += W + 4; }
  if (sea.confetti) for (const f of sea.confetti) { f.y += f.v * dt; f.x += Math.sin(t * 2 + f.p) * 10 * dt; if (f.y > H) { f.y = -2; f.x = Math.random() * W; } }
  if (sea.bats) for (const b of sea.bats) { b.x -= b.v * dt; if (b.x < -10) { b.x = W + 10 + Math.random() * 40; b.y = 8 + Math.random() * 24; } }
  if (sea.season === "halloween" && Math.random() < dt * 1.6) sea.parts.push({ k: "leaf", x: W + 2, y: 14 + Math.random() * 44, vx: -16 - Math.random() * 10, vy: 3 + Math.random() * 3, life: 40, f: Math.floor(Math.random() * 3) });
  if (sea.fw) {
    if (t > sea.nextFw) {
      sea.nextFw = t + 1 + Math.random() * 1.6;
      sea.fw.push({ x: 20 + Math.random() * (W - 40), y: 62, vy: -60 - Math.random() * 20, apex: 8 + Math.random() * 22, c: FEST[Math.floor(Math.random() * 5)], boom: false, flash: 0 });
    }
    for (const r of sea.fw) {
      if (r.boom) { r.flash -= dt; continue; }
      r.y += r.vy * dt;
      if (r.y <= r.apex) {
        r.boom = true; r.flash = 0.18;
        for (let i = 0; i < 26; i++) {
          const a = i / 26 * Math.PI * 2, sp = 18 + Math.random() * 14;
          sea.parts.push({ k: "fw", x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 14, life: 0.9 + Math.random() * 0.5, c: Math.random() < 0.3 ? "#ffffff" : r.c });
        }
      }
    }
    sea.fw = sea.fw.filter((r) => !r.boom || r.flash > -1);
  }
  if (sea.ducks) for (const d of sea.ducks) { d.x += d.dir * 9 * dt; if (d.x > W - 10) d.dir = -1; if (d.x < sea.L.X(30)) d.dir = 1; }
  if (sea.glitchAt !== undefined && t > sea.glitchAt) {
    sea.glitchUntil = t + 0.18; sea.glitchAt = t + 3 + Math.random() * 3;
    sea.glitchBands = [0, 1, 2].map(() => ({ y: Math.floor(Math.random() * (H - 6)), h: 2 + Math.floor(Math.random() * 4), dx: (Math.random() < 0.5 ? -1 : 1) * (3 + Math.floor(Math.random() * 6)) }));
  }
}

// Lo que va en el cielo (murcielagos, fuegos), antes del mundo.
export function seasonSkyLayer(g, sea, t, night) {
  if (!sea) return;
  const S = seasonSprites();
  if (sea.bats) for (const b of sea.bats) g.drawImage(S.bats[Math.floor(t * 8 + b.p) % 2], Math.round(b.x), Math.round(b.y + Math.sin(t * 3 + b.p) * 3));
  if (sea.fw) {
    for (const r of sea.fw) if (!r.boom) { px(g, Math.round(r.x), Math.round(r.y), "#fff6cf"); px(g, Math.round(r.x), Math.round(r.y) + 1, "#ffb347"); }
    for (const q of sea.parts) if (q.k === "fw") {
      g.globalAlpha = Math.min(1, q.life * 1.6); px(g, Math.round(q.x), Math.round(q.y), q.c);
      g.globalAlpha = Math.min(0.5, q.life); px(g, Math.round(q.x - q.vx * 0.04), Math.round(q.y - q.vy * 0.04), q.c);
    }
    g.globalAlpha = 1;
    if (night) for (const r of sea.fw) if (r.boom && r.flash > 0) halo(g, r.x, r.apex, 10, "255,240,200", 0.12);
  }
}

// Atrezo sobre el mundo (antes de la luz).
export function seasonWorld(g, sea, t) {
  if (!sea) return;
  const L = sea.L, S = seasonSprites(), base = sprites();
  if (sea.season === "winter") {
    g.drawImage(snowCaps(base.stand), L.standX, STAND_TOP);
    for (const lx of L.lamps) g.drawImage(snowCaps(base.lamp), lx - 5, LAMP_TOP);
    g.drawImage(S.snowman, sea.snowman - 5, 72 - 15);
  }
  if (sea.pumpkins) for (const p of sea.pumpkins) g.drawImage(S.pumpkin, p.x - 4, p.y - 7);
  if (sea.season === "halloween") {
    g.globalAlpha = 0.75;
    for (const lx of L.lamps) {
      const cx = lx + 4, cy = LAMP_TOP + 3;
      line(g, cx, cy, cx + 5, cy, "#d8d8e8"); line(g, cx, cy, cx + 4, cy + 4, "#d8d8e8"); line(g, cx, cy, cx, cy + 5, "#d8d8e8");
      px(g, cx + 3, cy + 1, "#d8d8e8"); px(g, cx + 2, cy + 2, "#d8d8e8"); px(g, cx + 1, cy + 3, "#d8d8e8");
    }
    g.globalAlpha = 1;
  }
  if (sea.bunting) {
    for (let i = 1; i < sea.bunting.length; i++) line(g, sea.bunting[i - 1][0], sea.bunting[i - 1][1], sea.bunting[i][0], sea.bunting[i][1], "#5a3a2a");
    sea.bunting.forEach(([x, y], i) => {
      const c = FEST[i % 5], X0 = Math.round(x), Y0 = Math.round(y) + 1;
      rect(g, X0 - 1, Y0, 3, 1, c); rect(g, X0 - 1, Y0 + 1, 2, 1, c); px(g, X0 - 1, Y0 + 2, c);
    });
  }
  if (sea.balloons) for (const b of sea.balloons) {
    const x = Math.round(b.bx + b.dx + Math.sin(t * 1.4 + b.p)), y = Math.round(b.by + b.dy + Math.sin(t * 2 + b.p));
    line(g, b.bx, b.by, x, y + 4, "#e8e8e8");
    g.drawImage(balloonSprite(b.c), x - 3, y - 2);
  }
  if (sea.gifts) sea.gifts.forEach((x, i) => g.drawImage(S.gifts[i % 3], x - 3, 71 - 5));
  if (sea.cake) g.drawImage(S.cake, sea.cake[0], sea.cake[1]);
  if (sea.lanterns) for (let i = 1; i < sea.lanterns.length; i++) line(g, sea.lanterns[i - 1][0], sea.lanterns[i - 1][1], sea.lanterns[i][0], sea.lanterns[i][1], "#3a2a1a");
  if (sea.season === "anniversary") {
    const sx = L.standX + 18, sy = STAND_TOP;
    rect(g, sx, sy, 30, 10, "#8a5a14"); rect(g, sx + 1, sy + 1, 28, 8, "#ffd166"); rect(g, sx + 1, sy + 1, 28, 1, "#fff0af");
    let tx = sx + 6;
    for (const ch of "DAIVR") { FONT[ch].forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === "1") px(g, tx + i, sy + 3 + j, "#5a2a0a"); }); tx += 4; }
  }
  if (sea.ducks) for (const d of sea.ducks) blit(g, S.duck, Math.round(d.x) - 4, 78 - 7 - (Math.floor(t * 6 + d.x) % 2), d.dir < 0);
}

export function seasonLights(lights, sea) {
  if (!sea) return;
  if (sea.bulbs) for (const b of sea.bulbs) lights.push({ x: b.x, y: b.y, r: 4, c: [1, 0.85, 0.6], s: 0.45 });
  if (sea.awning) for (const b of sea.awning) lights.push({ x: b.x, y: b.y, r: 4, c: [1, 0.85, 0.6], s: 0.3 });
  if (sea.pumpkins) for (const p of sea.pumpkins) lights.push({ x: p.x, y: p.y - 4, r: 12, c: [1, 0.6, 0.25], s: 0.75 });
  if (sea.wisps) for (const w of sea.wisps) lights.push({ x: w.x, y: w.y, r: 7, c: [0.7, 0.75, 1], s: 0.3 });
  if (sea.lanterns) for (const [x, y] of sea.lanterns) lights.push({ x, y: y + 3, r: 9, c: [1, 0.55, 0.3], s: 0.6 });
  if (sea.cake) lights.push({ x: sea.cake[0] + 5, y: sea.cake[1], r: 8, c: [1, 0.8, 0.5], s: 0.5 });
  if (sea.fw) for (const r of sea.fw) if (r.boom && r.flash > 0) lights.push({ x: r.x, y: r.apex, r: 45, c: [1, 0.9, 0.8], s: 0.35 });
}

// Lo que brilla por encima de la luz (bombillas, velas, nieve, confeti).
export function seasonOverlay(g, sea, t, oy = 0) {
  if (!sea) return;
  const S = seasonSprites(), base = sprites();
  if (sea.bulbs) {
    for (const b of sea.bulbs) px(g, b.x, b.y, Math.sin(t * 3 + b.p) > -0.3 ? b.c : "#3a3a4a");
    if (sea.star) { const [x, y] = sea.star; px(g, x, y, "#fff6cf"); for (const [dx, dy] of N4) px(g, x + dx, y + dy, "#ffd166"); }
  }
  if (sea.awning) for (const b of sea.awning) { px(g, b.x, b.y - 1, "#3a3a2a"); px(g, b.x, b.y, Math.sin(t * 2.5 + b.p) > 0 ? b.c : "#5a5a6a"); }
  if (sea.pumpkins) for (const p of sea.pumpkins) { g.globalAlpha = 0.8 + Math.sin(t * 9 + p.x) * 0.2; g.drawImage(S.pumpkinGlow, p.x - 3, p.y - 6); g.globalAlpha = 1; }
  if (sea.wisps) for (const w of sea.wisps) { g.globalAlpha = 0.45 + Math.sin(t * 2 + w.p) * 0.1; g.drawImage(S.wisp, Math.round(w.x + Math.sin(t * 0.7 + w.p) * 8), Math.round(w.y + Math.sin(t * 1.9 + w.p) * 2)); g.globalAlpha = 1; }
  if (sea.season === "halloween") {
    g.globalAlpha = 0.22; g.fillStyle = "#9a7ac8";
    for (let y = 63; y < 75; y++) for (let x = (y + Math.floor(t * 6)) % 3; x < sea.W; x += 3) if (bayer(x, y) < (y - 62) / 14) g.fillRect(x, y, 1, 1);
    g.globalAlpha = 1;
  }
  if (sea.lanterns) for (const [x, y] of sea.lanterns) { const X0 = Math.round(x) - 1, Y0 = Math.round(y) + 1; px(g, X0 + 1, Y0 - 1, "#3a2a1a"); rect(g, X0, Y0, 3, 4, "#e8402a"); rect(g, X0 + 1, Y0 + 1, 1, 2, Math.sin(t * 7 + x) > 0 ? "#ffd36b" : "#ffb347"); }
  if (sea.cake) for (const dx of [3, 5, 7]) px(g, sea.cake[0] + dx, sea.cake[1], Math.sin(t * 11 + dx) > 0 ? "#ffd36b" : "#ff8a2a");
  for (const q of sea.parts) if (q.k === "leaf") g.drawImage(base.leaves[(q.f + Math.floor(t * 5)) % 2 === 0 ? q.f % 3 : 1], Math.round(q.x), Math.round(q.y));
  if (sea.flakes) for (const f of sea.flakes) { const x = Math.round(f.x), y = Math.round(f.y); if (f.s > 1) rect(g, x, y, 2, 2, "#ffffff"); else px(g, x, y, "#f4f9ff"); }
  if (sea.confetti) for (const f of sea.confetti) { const fl = Math.floor(t * 6 + f.p) % 2; rect(g, Math.round(f.x), Math.round(f.y), fl ? 2 : 1, fl ? 1 : 2, f.c); }
  if (sea.glitchBands && t < sea.glitchUntil) for (const b of sea.glitchBands) {
    g.drawImage(g.canvas, 0, b.y + oy, sea.W, b.h, b.dx, b.y, sea.W, b.h);
    g.globalCompositeOperation = "lighter"; g.fillStyle = "rgba(255,60,200,.25)"; g.fillRect(0, b.y, sea.W, b.h); g.globalCompositeOperation = "source-over";
  }
}
