import { halo, px } from "../core.js";

// El haz de una linterna (la del apagon y la que Pip lleva de noche): un
// abanico que se apaga hacia el final, un nucleo mas claro, motas de polvo
// flotando dentro, el charco de luz donde da y el cristal encendido. Va
// encima de la luz del mundo (overlay). `k` lo atenua al encenderse.
const WARM = { start: "255,240,190", middle: "255,236,170", end: "255,230,160", dust: "255,250,220", pool: "255,236,180", lens: "#fffce3" };
const GHOST = { start: "170,210,255", middle: "180,185,255", end: "155,165,255", dust: "215,230,255", pool: "180,185,255", lens: "#e6eeff" };

export function drawBeam(g, [x0, y0, x1, y1], t, k = 1, spread = 11, ghost = false) {
  const colors = ghost ? GHOST : WARM;
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const cone = (width, alpha) => {
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, `rgba(${colors.start},${alpha})`); grad.addColorStop(0.7, `rgba(${colors.middle},${alpha * 0.45})`); grad.addColorStop(1, `rgba(${colors.end},0)`);
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx * width, y1 + ny * width); g.lineTo(x1 - nx * width, y1 - ny * width); g.lineTo(x0 - nx, y0 - ny); g.closePath(); g.fill();
  };
  g.globalCompositeOperation = "lighter";
  cone(spread, 0.16 * k); cone(spread * 0.45, 0.14 * k);
  // Polvo en el haz.
  for (let i = 0; i < 6; i++) {
    const p = ((t * 0.18 + i * 0.17) % 1), s = Math.sin(t * 1.3 + i * 2.1) * (2 + p * 7);
    const mx = Math.round(x0 + ux * len * p + nx * s), my = Math.round(y0 + uy * len * p + ny * s);
    g.fillStyle = `rgba(${colors.dust},${0.5 * (1 - p) * k})`; g.fillRect(mx, my, 1, 1);
  }
  // El charco de luz en el suelo, en escalones.
  for (const [r, al] of [[9, 0.07], [6, 0.08], [3, 0.1]]) { g.fillStyle = `rgba(${colors.pool},${al * k})`; g.fillRect(Math.round(x1 - r), Math.round(y1) - 1, r * 2 + 1, 2); g.fillRect(Math.round(x1 - r * 0.6), Math.round(y1) - 2, Math.round(r * 1.2) + 1, 1); }
  g.globalCompositeOperation = "source-over";
  halo(g, x1, y1, 4, colors.start, 0.12 * k);
  // El cristal encendido.
  g.globalAlpha = Math.min(1, k * 1.5);
  px(g, Math.round(x0), Math.round(y0), colors.lens);
  g.globalAlpha = 1;
}
