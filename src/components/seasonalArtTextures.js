// Small, deterministic material tiles for the decorative sprites only.
// Each context creates a pattern once; there is no noise generation per frame.
const textures = new WeakMap();

export function fillSpriteTexture(ctx, kind, x, y, width, height, opacity = 1) {
  let patterns = textures.get(ctx);
  if (!patterns) { patterns = new Map(); textures.set(ctx, patterns); }
  if (!patterns.has(kind)) {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 48;
    const paint = tile.getContext("2d");
    if (!paint) return;
    if (kind === "linen") {
      for (let line = 0; line < 48; line += 3) {
        paint.fillStyle = "#f3edff25";
        paint.fillRect(line, 0, .5, 48);
        paint.fillStyle = "#2b264c1e";
        paint.fillRect(0, line, 48, .6);
      }
    }
    for (let dot = 0; dot < 150; dot += 1) {
      const dx = (dot * 17.13 + dot * dot * .37) % 48;
      const dy = (dot * 11.79 + dot * dot * .19) % 48;
      paint.fillStyle = dot % 3 === 0 ? "#fff3" : "#100d1928";
      paint.fillRect(dx, dy, kind === "metal" ? 2.4 : .65, .45);
    }
    patterns.set(kind, ctx.createPattern(tile, "repeat"));
  }
  const pattern = patterns.get(kind);
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}
