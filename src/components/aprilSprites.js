import { fillSpriteTexture } from "./seasonalArtTextures";

const unit = n => Math.sin(n * 127.1 + 31.7) * 43758.5453 % 1 + 1;
const random = n => unit(n) % 1;
const line = (ctx, points) => { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };

// Irregular stress fractures avoid the concentric rings of a decorative web.
export function buildGlassFracture(seed) {
  const branches = Array.from({ length: 7 }, (_, i) => {
    const angle = i * Math.PI * 2 / 7 + random(seed + i * 11) * .48;
    const length = .45 + random(seed + i * 17) * .8;
    const points = [[0, 0]];
    for (let j = 1; j <= 4; j++) {
      const distance = length * j / 4;
      const bend = angle + (random(seed + i * 29 + j * 7) - .5) * .26;
      points.push([Math.cos(bend) * distance, Math.sin(bend) * distance * .7]);
    }
    return points;
  });
  return { branches, seed };
}

export function drawFracturedGlass(ctx, crack, surface, now, ox, oy, reduced) {
  const x = surface.left + crack.x01 * surface.width + ox;
  const y = surface.top + (surface.bottom - surface.top) * crack.y01 + oy;
  const r = crack.radius;
  const { branches } = crack.web;
  ctx.save();
  ctx.beginPath();
  ctx.rect(surface.rawLeft + ox, surface.top + oy, surface.rawRight - surface.rawLeft, surface.bottom - surface.top);
  ctx.clip(); ctx.translate(x, y);
  const p = ([px, py]) => [px * r, py * r];
  const fracture = (points, alpha = 1) => {
    ctx.save(); ctx.globalAlpha *= alpha;
    line(ctx, points);
    ctx.strokeStyle = "#02070980"; ctx.lineWidth = 1.35; ctx.stroke();
    ctx.translate(-.35, -.3);
    line(ctx, points);
    ctx.strokeStyle = "#acc7c46e"; ctx.lineWidth = .55; ctx.stroke();
    ctx.restore();
  };
  branches.forEach((branch, i) => {
    const points = branch.map(p);
    fracture(points.slice(0, 4), .9);
    fracture(points.slice(3), .38);
    if (i % 2 === 0) {
      const a = points[2], b = points[3];
      fracture([a, [b[0] * .76 - b[1] * .24, b[1] * .76 + b[0] * .24]], .45);
    }
  });
  ctx.restore();
}

export function drawDamagedCables(ctx, wires, surface, now, ox, oy, reduced) {
  const left = wires.corner === "tl";
  const x = (left ? surface.left + 12 : surface.right - 12) + ox;
  const y = surface.top + oy;
  const time = reduced ? 0 : now / 1000;
  ctx.save(); ctx.translate(x, y); ctx.scale(left ? 1 : -1, 1);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  // A routed cable lies on the frame. Two torn ends curl away from a gap.
  // No floating socket: clips and a contact shadow attach it to the ledge.
  const ends = [
    { path: new Path2D("M0-1L10-1Q16-1 19 3L23 8"), x: 23, y: 8, direction: 1 },
    { path: new Path2D("M72-1L57-1Q48-1 45 2L41 6"), x: 41, y: 6, direction: -1 }
  ];
  for (const end of ends) {
    ctx.save(); ctx.translate(0, 1.8);
    ctx.strokeStyle = "#0009"; ctx.lineWidth = 7; ctx.stroke(end.path); ctx.restore();
    ctx.strokeStyle = "#141e24"; ctx.lineWidth = 6.5; ctx.stroke(end.path);
    ctx.strokeStyle = "#36454d"; ctx.lineWidth = 4.7; ctx.stroke(end.path);
    ctx.save(); ctx.translate(0, -.8);
    ctx.strokeStyle = "#79908d66"; ctx.lineWidth = 1; ctx.stroke(end.path); ctx.restore();
    // Jagged insulation lips expose three distinct conductors.
    for (let i = 0; i < 3; i++) {
      const startX = end.x - end.direction * 1.5;
      const startY = end.y + (i - 1) * 1.6;
      const tipX = end.x + end.direction * (4 + (i % 2) * 1.5);
      const tipY = end.y + (i - 1) * 2.8 + 1;
      ctx.strokeStyle = ["#996b56", "#688896", "#a39564"][i]; ctx.lineWidth = 1.35;
      ctx.beginPath(); ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(end.x + end.direction * 2, startY, tipX, tipY); ctx.stroke();
      for (let strand = 0; strand < 3; strand++) {
        ctx.strokeStyle = strand === 1 ? "#d6ad79" : "#946543"; ctx.lineWidth = .45;
        ctx.beginPath(); ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + end.direction * (2 + strand * .7), tipY + (strand - 1) * 1.4); ctx.stroke();
      }
    }
    ctx.strokeStyle = "#111c23"; ctx.lineWidth = 1.1;
    line(ctx, [[end.x - 2, end.y - 3], [end.x + 1, end.y - 1], [end.x - 1, end.y + 1], [end.x + 1, end.y + 3]]); ctx.stroke();
  }
  for (const clipX of [5, 63]) {
    ctx.fillStyle = "#283b45"; ctx.fillRect(clipX - 2, -4.4, 4, 7);
    ctx.fillStyle = "#89a5a157"; ctx.fillRect(clipX - 1.5, -4.4, .7, 6);
    ctx.fillStyle = "#081316"; ctx.fillRect(clipX, -3.5, .75, .75);
  }
  const cycle = (time + wires.seed * .61) % 3.1;
  const spark = reduced ? 0 : Math.max(0, 1 - cycle / .65);
  if (spark > 0) {
    const tx = 32, ty = 8;
    const glow = ctx.createRadialGradient(tx, ty, 1, tx, ty, 24);
    glow.addColorStop(0, "#ffcf7973"); glow.addColorStop(.3, "#ffb65a21"); glow.addColorStop(1, "#ff990000");
    ctx.globalAlpha *= spark; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(tx, ty, 24, 0, Math.PI * 2); ctx.fill();
    const jitter = Math.sin(Math.floor(time * 20) * 7) * 2;
    line(ctx, [[29, 8], [31, 6 + jitter], [33, 10], [35, 7]]);
    ctx.strokeStyle = "#95cee666"; ctx.lineWidth = 2.8; ctx.stroke();
    ctx.strokeStyle = "#fff0be"; ctx.lineWidth = .8; ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = random(wires.seed + i * 23) * Math.PI * 2;
      const distance = (1 - spark) * (12 + random(i + wires.seed) * 20);
      const sx = tx + Math.cos(a) * distance;
      const sy = ty + Math.sin(a) * distance + (1 - spark) ** 2 * 12;
      line(ctx, [[sx, sy], [sx - Math.cos(a) * 3, sy - Math.sin(a) * 3]]);
      ctx.strokeStyle = i % 3 ? "#edb36b" : "#fff2d0"; ctx.lineWidth = .65; ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawRepairDialog(ctx, dialog, surface, now, ox, oy, reduced) {
  ctx.save(); ctx.translate(surface.left + dialog.x01 * surface.width + ox, surface.top + oy);
  ctx.rotate(dialog.tilt + (reduced ? 0 : Math.sin(now / 2300 + dialog.seed) * .014));
  const w = dialog.w, h = dialog.h;
  ctx.fillStyle = "#0007"; ctx.fillRect(-w / 2 + 3, -h + 4, w, h);
  const plastic = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
  plastic.addColorStop(0, "#cad0c5"); plastic.addColorStop(.3, "#929e9d"); plastic.addColorStop(1, "#626d7a");
  ctx.fillStyle = plastic; ctx.fillRect(-w / 2, -h, w, h);
  fillSpriteTexture(ctx, "plastic", -w / 2, -h, w, h, .6);
  ctx.strokeStyle = "#e6e9d9"; ctx.lineWidth = 1; line(ctx, [[-w / 2, 0], [-w / 2, -h], [w / 2, -h]]); ctx.stroke();
  ctx.strokeStyle = "#273544"; line(ctx, [[w / 2, -h], [w / 2, 0], [-w / 2, 0]]); ctx.stroke();
  const title = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); title.addColorStop(0, "#234d7e"); title.addColorStop(1, "#6988a4");
  ctx.fillStyle = title; ctx.fillRect(-w / 2 + 2, -h + 2, w - 4, 9);
  ctx.fillStyle = "#ecede0"; ctx.font = "bold 5px monospace"; ctx.fillText("DAIOS.EXE", -w / 2 + 5, -h + 8);
  ctx.fillStyle = "#c2c7bf"; ctx.fillRect(w / 2 - 10, -h + 3, 6, 6);
  ctx.strokeStyle = "#4b4443"; ctx.lineWidth = .65; line(ctx, [[w / 2 - 9, -h + 4], [w / 2 - 5, -h + 8]]); ctx.stroke(); line(ctx, [[w / 2 - 5, -h + 4], [w / 2 - 9, -h + 8]]); ctx.stroke();
  ctx.fillStyle = "#a65047"; ctx.beginPath(); ctx.arc(-w / 2 + 12, -h + 21, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#fff1d9"; ctx.lineWidth = 1; line(ctx, [[-w / 2 + 10, -h + 23], [-w / 2 + 14, -h + 19]]); ctx.stroke(); line(ctx, [[-w / 2 + 10, -h + 19], [-w / 2 + 14, -h + 23]]); ctx.stroke();
  ctx.fillStyle = "#3b4a56"; ctx.fillRect(-w / 2 + 22, -h + 17, w * .42, 1.2); ctx.fillRect(-w / 2 + 22, -h + 21, w * .32, 1.2); ctx.fillRect(-w / 2 + 22, -h + 25, w * .38, .7);
  ctx.fillStyle = "#b9c2bd"; ctx.fillRect(w / 2 - 24, -9, 18, 6); ctx.strokeStyle = "#e1e7da"; ctx.lineWidth = .7; ctx.strokeRect(w / 2 - 24, -9, 18, 6);
  ctx.fillStyle = "#354454"; ctx.font = "4px monospace"; ctx.fillText("OK?", w / 2 - 19, -4.5);
  ctx.restore();
}
