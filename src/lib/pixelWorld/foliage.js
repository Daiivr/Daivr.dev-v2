import { Buf, bayer, rng } from "./core.js";

// Copas hechas de bolas de hojas: cada bola se sombrea por su cuenta (luz
// arriba a la izquierda) y oscurece el borde de la que tiene detras.
function paintClumps(b, w, h, clumps, pal, R) {
  const own = new Int16Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    for (let k = clumps.length - 1; k >= 0; k--) {
      const c = clumps[k], dx = x + 0.5 - c.x, dy = y + 0.5 - c.y;
      if (dx * dx + dy * dy <= c.r * c.r) { own[y * w + x] = k; break; }
    }
  }
  const tone = new Int8Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = own[y * w + x]; if (k < 0) continue;
    const c = clumps[k], nx = (x + 0.5 - c.x) / c.r, ny = (y + 0.5 - c.y) / c.r;
    let v = 0.5 + 0.3 * (-0.6 * nx - 0.8 * ny) + 0.2 * (0.5 - y / h) + (bayer(x, y) - 0.5) * 0.14 + (R() - 0.5) * 0.05;
    for (let j = k + 1; j < clumps.length; j++) {
      const o = clumps[j], d = Math.hypot(x + 0.5 - o.x, y + 0.5 - o.y) - o.r;
      if (d > 0 && d < 1.6) { v -= 0.26; break; }
    }
    tone[y * w + x] = v > 0.8 ? 4 : v > 0.6 ? 3 : v > 0.41 ? 2 : v > 0.25 ? 1 : 0;
  }
  const T = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : tone[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let t = tone[y * w + x]; if (t < 0) continue;
    if (T(x, y + 1) < 0 || T(x + 1, y) < 0) t = 0;
    else if (T(x, y - 1) < 0 || T(x - 1, y) < 0) t = 1;
    else if (t === 3 && R() < 0.06) t = 4;
    else if (t === 2 && R() < 0.05) t = 1;
    tone[y * w + x] = t;
    b.set(x, y, pal[t]);
  }
  return tone;
}

export function makeOak(seed, w, h, pal, bark, blossom) {
  const R = rng(seed), b = new Buf(w, h);
  const ch = Math.round(h * 0.74), tw = w >= 36 ? 6 : w >= 28 ? 5 : 4, tx = Math.round(w / 2 - tw / 2);
  for (let y = ch - 8; y < h; y++) {
    const flare = y === h - 1 ? 2 : y === h - 2 ? 1 : 0, x0 = tx - flare, x1 = tx + tw - 1 + flare;
    for (let x = x0; x <= x1; x++) {
      let c = bark[2];
      if (x === x0 || x === x1 || y === h - 1) c = bark[0];
      else if (y <= ch + 1) c = bark[1];
      else if (x === x0 + 1) c = bark[3];
      else if (x === x1 - 1) c = bark[1];
      b.set(x, y, c);
    }
  }
  for (let i = 0; i < 3; i++) {
    const y = ch + 3 + Math.floor(R() * Math.max(1, h - ch - 6)), x = tx + 2 + Math.floor(R() * Math.max(1, tw - 3));
    b.set(x, y, bark[1]); b.set(x, y + 1, bark[1]);
  }
  const cl = [], cx = w / 2;
  cl.push({ x: cx + (R() - 0.5) * 2, y: ch * 0.3, r: ch * 0.3 });
  const n = 6 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + R() * 0.6;
    cl.push({ x: cx + Math.cos(a) * w * 0.24, y: ch * 0.5 + Math.sin(a) * ch * 0.18, r: ch * (0.2 + R() * 0.08) });
  }
  cl.push({ x: cx - w * 0.27, y: ch * 0.64, r: ch * 0.22 }, { x: cx + w * 0.27, y: ch * 0.64, r: ch * 0.22 }, { x: cx + (R() - 0.5) * 3, y: ch * 0.7, r: ch * 0.25 });
  cl.forEach((c) => { c.x = Math.max(c.r + 0.5, Math.min(w - c.r - 0.5, c.x)); c.y = Math.max(c.r + 0.5, Math.min(ch - c.r - 0.5, c.y)); });
  cl.sort((a, b2) => a.y - b2.y);
  const tone = paintClumps(b, w, ch, cl, pal, R);
  if (blossom) {
    for (let i = 0; i < w * ch * 0.05; i++) {
      const x = Math.floor(R() * w), y = Math.floor(R() * ch), t = tone[y * w + x];
      if (t >= 2) { b.set(x, y, "#f6a6c6"); if (t >= 3) b.set(x, y - 1, "#ffe6f1"); }
    }
  }
  return { c: b.canvas(), w, h, ch };
}

export function makePine(seed, w, h, pal, bark) {
  const R = rng(seed), b = new Buf(w, h);
  const trunkH = Math.max(4, Math.round(h * 0.13)), crownH = h - trunkH + 1;
  const tw = w >= 24 ? 4 : 3, tx = Math.round(w / 2 - tw / 2);
  for (let y = crownH - 3; y < h; y++) for (let x = tx; x < tx + tw; x++) {
    let c = (x === tx || x === tx + tw - 1 || y === h - 1) ? bark[0] : x === tx + 1 ? bark[3] : bark[2];
    if (y < crownH + 1 && c !== bark[0]) c = bark[1];
    b.set(x, y, c);
  }
  const tiers = h >= 40 ? 5 : 4, cx = (w - 1) / 2;
  const bots = [], tops = [], hwB = [];
  for (let i = 0; i < tiers; i++) bots.push(Math.round(crownH * (i + 1) / tiers) - 1);
  for (let i = 0; i < tiers; i++) {
    tops.push(i === 0 ? 0 : bots[i - 1] - Math.round((bots[i] - bots[i - 1]) * 0.6));
    hwB.push((w / 2 - 0.5) * (0.42 + 0.58 * (i + 1) / tiers));
  }
  const tone = new Int8Array(w * crownH).fill(-1);
  for (let i = tiers - 1; i >= 0; i--) {
    for (let y = tops[i]; y <= bots[i]; y++) {
      const p = (y - tops[i]) / Math.max(1, bots[i] - tops[i]);
      let hw = i === 0 ? hwB[i] * p * 1.05 : hwB[i] * (0.3 + 0.7 * p);
      if (y === bots[i]) hw += 0.6;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        if (Math.abs(dx) > hw) continue;
        if (y === bots[i] && (x + i) % 3 === 0 && Math.abs(dx) > 1) continue;
        const nx = dx / Math.max(1, hw);
        let v = 0.5 - 0.3 * nx - 0.2 * p + 0.12 * (1 - i / tiers) + (bayer(x, y) - 0.5) * 0.14;
        if (i > 0 && y > bots[i - 1] && y <= bots[i - 1] + 2) v -= 0.26;
        tone[y * w + x] = v > 0.8 ? 4 : v > 0.6 ? 3 : v > 0.41 ? 2 : v > 0.25 ? 1 : 0;
      }
    }
  }
  const T = (x, y) => (x < 0 || y < 0 || x >= w || y >= crownH) ? -1 : tone[y * w + x];
  for (let y = 0; y < crownH; y++) for (let x = 0; x < w; x++) {
    let t = tone[y * w + x]; if (t < 0) continue;
    if (T(x, y + 1) < 0 || T(x + 1, y) < 0) t = 0;
    else if (T(x, y - 1) < 0 || T(x - 1, y) < 0) t = 1;
    else if (t === 3 && R() < 0.05) t = 4;
    b.set(x, y, pal[t]);
  }
  return { c: b.canvas(), w, h, ch: crownH };
}

export function makeBush(seed, w, h, pal, berries) {
  const R = rng(seed), b = new Buf(w, h), cl = [], n = 3 + Math.floor(w / 8);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    cl.push({ x: 2 + t * (w - 4) + (R() - 0.5) * 2, y: h * 0.66 + (R() - 0.5) * h * 0.2, r: h * (0.36 + R() * 0.16) * (0.75 + 0.4 * Math.sin(t * Math.PI)) });
  }
  cl.push({ x: w / 2 + (R() - 0.5) * 4, y: h * 0.48, r: h * 0.46 });
  cl.forEach((c) => { c.x = Math.max(c.r + 0.5, Math.min(w - c.r - 0.5, c.x)); c.y = Math.max(c.r + 0.5, c.y); });
  cl.sort((a, b2) => a.y - b2.y);
  const tone = paintClumps(b, w, h, cl, pal, R);
  if (berries) {
    for (let i = 0; i < w * 0.5; i++) {
      const x = 1 + Math.floor(R() * (w - 2)), y = 1 + Math.floor(R() * (h - 3));
      if (tone[y * w + x] >= 2) { b.set(x, y, "#c92f45"); b.set(x, y - 1, "#ff8a9a"); }
    }
  }
  return b.canvas();
}
