// Guardar algo en la mochila de Pip (capturas de pesca, hallazgos): el objeto
// vuela por encima del hombro hasta la mochila encogiendo, y al entrar salen
// chispas doradas. La mochila esta en PACK (px del rig).
export const PACK = [11, 27];

// p de 0 a 1: de `from` (centro del objeto en alto) a `to` (la mochila).
export function drawStash(g, img, from, to, p) {
  const s = p * p * (3 - 2 * p), k = 1 - 0.65 * s;
  const w = Math.max(2, Math.round(img.width * k)), h = Math.max(2, Math.round(img.height * k));
  const x = from[0] + (to[0] - from[0]) * s, y = from[1] + (to[1] - from[1]) * s - Math.sin(p * Math.PI) * 6;
  g.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
}

export function stashSparkles(env, [x, y]) {
  for (let i = 0; i < 3; i++) env.spawn({ k: "star", x, y: y - 2, vx: (i - 1) * 16, vy: -14 - Math.random() * 8, g: 40, life: 0.45 });
  for (let i = 0; i < 6; i++) env.spawn({ k: "pix1", x: x + (Math.random() - 0.5) * 4, y, vx: (Math.random() - 0.5) * 24, vy: -8 - Math.random() * 12, g: 30, life: 0.5 + Math.random() * 0.3, c: Math.random() < 0.5 ? "#ffd166" : "#fff3b0" });
}
