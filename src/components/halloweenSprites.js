import { fillSpriteTexture } from "./seasonalArtTextures";

// Render in local coordinates so grain, highlights and anatomy travel with
// the object. Each painter restores its state for the other seasonal props.
export function drawHalloweenBat(ctx, bat, now) {
  const phase = now / 1000 * bat.flapW * Math.PI * 2 + bat.phase;
  const flap = Math.sin(phase);
  ctx.save();
  ctx.translate(bat.x, bat.y);
  ctx.rotate(Math.sin(phase * .5) * .075);
  ctx.scale(bat.scale, bat.scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    const wristY = -5 - flap * 7;
    const tipY = -3 - flap * 13;
    const outerY = 6 - flap * 9;
    const innerY = 8 - flap * 5;
    const wing = new Path2D();
    wing.moveTo(2, -2);
    wing.quadraticCurveTo(6, -6 - flap * 4, 11, wristY);
    wing.quadraticCurveTo(18, wristY - 4, 25, tipY);
    wing.quadraticCurveTo(21, tipY + 6, 17, outerY);
    wing.quadraticCurveTo(13.5, outerY - 5, 9, innerY);
    wing.quadraticCurveTo(6, innerY - 4, 2, 5);
    wing.closePath();
    const membrane = ctx.createLinearGradient(8, wristY - 2, 13, innerY + 3);
    membrane.addColorStop(0, "#96828a");
    membrane.addColorStop(.16, "#705567");
    membrane.addColorStop(.46, "#493449");
    membrane.addColorStop(.8, "#302439");
    membrane.addColorStop(1, "#16131f");
    ctx.fillStyle = membrane;
    ctx.fill(wing);
    ctx.save();
    ctx.clip(wing);
    fillSpriteTexture(ctx, "membrane", 0, -24, 28, 40, .48);
    // Translucent finger panels, veins, and the thick leading arm.
    ctx.fillStyle = "#c4999224";
    ctx.beginPath();
    ctx.moveTo(11, wristY);
    ctx.quadraticCurveTo(12, 1, 17, outerY);
    ctx.quadraticCurveTo(13, outerY - 4, 9, innerY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#d5a9ae75";
    ctx.lineWidth = .6;
    for (const [fx, fy] of [[25, tipY], [17, outerY], [9, innerY]]) {
      ctx.beginPath();
      ctx.moveTo(11, wristY);
      ctx.quadraticCurveTo((11 + fx) / 2 - 1, (wristY + fy) / 2, fx, fy);
      ctx.stroke();
    }
    ctx.strokeStyle = "#c093a02b";
    ctx.lineWidth = .35;
    ctx.beginPath();
    ctx.moveTo(14, wristY + 4); ctx.lineTo(17, wristY + 2); ctx.lineTo(20, tipY + 3);
    ctx.moveTo(11, wristY + 5); ctx.lineTo(8, wristY + 7); ctx.lineTo(6, 4);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "#231a2bbf";
    ctx.lineWidth = .65;
    ctx.stroke(wing);
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.quadraticCurveTo(6, -6 - flap * 4, 11, wristY);
    ctx.quadraticCurveTo(18, wristY - 4, 25, tipY);
    ctx.strokeStyle = "#b79caaad";
    ctx.lineWidth = .85;
    ctx.stroke();
    // Thumb claw extends from the wrist.
    ctx.strokeStyle = "#d6bca2b3";
    ctx.lineWidth = .6;
    ctx.beginPath();
    ctx.moveTo(11, wristY); ctx.quadraticCurveTo(10, wristY - 3, 12, wristY - 2.5);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = "#52394c";
  ctx.beginPath();
  ctx.moveTo(-3, 4); ctx.lineTo(-4, 9); ctx.lineTo(0, 6.5); ctx.lineTo(4, 9); ctx.lineTo(3, 4);
  ctx.fill();
  const fur = ctx.createLinearGradient(-3, -3, 3, 6);
  fur.addColorStop(0, "#aa9785"); fur.addColorStop(.35, "#6b5762"); fur.addColorStop(1, "#211c2c");
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, 1.6, 3.3, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c1aba075";
  ctx.lineWidth = .45;
  for (let hair = 0; hair < 9; hair += 1) {
    const a = hair * .72;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 2.7, 2 + Math.sin(a) * 4);
    ctx.lineTo(Math.cos(a) * 3.6, 2 + Math.sin(a) * 4.7);
    ctx.stroke();
  }
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(-2.8, -2); ctx.lineTo(-3.5, -8); ctx.quadraticCurveTo(-.8, -7, -.6, -3.8);
  ctx.lineTo(.6, -3.8); ctx.quadraticCurveTo(.8, -7, 3.5, -8); ctx.lineTo(2.8, -2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#a37883";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 2.4, -3.8); ctx.lineTo(side * 2.9, -6.6); ctx.lineTo(side * 1.3, -3.6); ctx.fill();
  }
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(0, -2.4, 2.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#efc98c";
  ctx.beginPath();
  ctx.ellipse(-1.1, -2.9, .55, .45, -.2, 0, Math.PI * 2);
  ctx.ellipse(1.1, -2.9, .55, .45, .2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#251a27";
  ctx.beginPath(); ctx.ellipse(0, -1.8, .8, .55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawHalloweenHat(ctx, hat, cornerX, edgeY, inward) {
  ctx.save();
  ctx.translate(cornerX + inward * hat.size * .55, edgeY);
  ctx.rotate(hat.tilt);
  ctx.scale(hat.size / 40, hat.size / 40);
  ctx.lineJoin = "round";
  // A curved underside and contact shadow give the brim thickness.
  ctx.fillStyle = "#09070eb3";
  ctx.beginPath(); ctx.ellipse(2, 1.5, 36, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  const brim = new Path2D("M-41-4Q-29-16-14-12L19-12Q31-7 40-8Q45-1 32 3Q7 10-24 3Q-35 1-41-4Z");
  const brimFill = ctx.createLinearGradient(0, -14, 5, 8);
  brimFill.addColorStop(0, "#8b718b"); brimFill.addColorStop(.4, "#503b5b"); brimFill.addColorStop(.72, "#35283e"); brimFill.addColorStop(1, "#13101d");
  ctx.fillStyle = brimFill; ctx.fill(brim);
  ctx.save(); ctx.clip(brim);
  fillSpriteTexture(ctx, "linen", -43, -16, 88, 26, .85);
  ctx.restore();
  ctx.strokeStyle = "#b096ae8c"; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.moveTo(-40, -4); ctx.quadraticCurveTo(-25, 3, -3, 3.5); ctx.quadraticCurveTo(23, 6, 40, -6); ctx.stroke();
  // The crown collapses into an asymmetric hooked tip.
  const crown = new Path2D("M-20-8Q-16-29-5-48Q-1-59 6-64Q15-68 24-54Q29-45 37-45Q36-38 28-39Q19-40 13-48Q12-33 17-25Q22-16 23-8Q6 1-20-8Z");
  const felt = ctx.createLinearGradient(-21, -48, 27, -19);
  felt.addColorStop(0, "#a18a9d"); felt.addColorStop(.17, "#74607d"); felt.addColorStop(.4, "#4a3758"); felt.addColorStop(.72, "#30223e"); felt.addColorStop(1, "#181423");
  ctx.fillStyle = felt; ctx.fill(crown);
  ctx.save(); ctx.clip(crown);
  fillSpriteTexture(ctx, "linen", -25, -70, 65, 74, .9);
  ctx.fillStyle = "#170e2e70";
  ctx.beginPath(); ctx.moveTo(4, -58); ctx.quadraticCurveTo(5, -34, -10, -22); ctx.quadraticCurveTo(5, -29, 9, -40); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-18, -13); ctx.quadraticCurveTo(1, -20, 19, -16); ctx.lineTo(22, -10); ctx.fill();
  ctx.strokeStyle = "#c5aeb37a"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-16, -20); ctx.quadraticCurveTo(-8, -39, 1, -53); ctx.stroke();
  ctx.strokeStyle = "#dec8be6b"; ctx.lineWidth = .7; ctx.setLineDash([1.5, 2.2]);
  ctx.beginPath(); ctx.moveTo(-11, -13); ctx.bezierCurveTo(1, -28, 4, -42, 6, -59); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = "#b9a1b35c"; ctx.lineWidth = .7; ctx.stroke(crown);
  // A worn patch is sewn onto the felt, above the wraparound leather band.
  ctx.fillStyle = "#76647d";
  ctx.beginPath(); ctx.moveTo(6, -35); ctx.lineTo(14, -31); ctx.lineTo(15, -23); ctx.lineTo(7, -26); ctx.fill();
  ctx.strokeStyle = "#d3bda7aa"; ctx.lineWidth = .7;
  for (let stitch = 0; stitch < 3; stitch += 1) {
    ctx.beginPath(); ctx.moveTo(5.5 + stitch * 3, -35 + stitch * 1.5); ctx.lineTo(6 + stitch * 3, -31.7 + stitch * 1.5); ctx.stroke();
  }
  const band = new Path2D("M-18-18Q0-11 19-18L23-9Q2 1-20-8Z");
  const leather = ctx.createLinearGradient(-20, -12, 23, -8);
  leather.addColorStop(0, "#a16b50"); leather.addColorStop(.4, "#754338"); leather.addColorStop(1, "#38252f");
  ctx.fillStyle = leather; ctx.fill(band);
  ctx.strokeStyle = "#d4a67b8c"; ctx.lineWidth = .7; ctx.stroke(band);
  ctx.save(); ctx.clip(band); fillSpriteTexture(ctx, "leather", -21, -20, 46, 24, .8); ctx.restore();
  // Hammered brass frame, dark recess, pin and a tiny reflected highlight.
  ctx.save(); ctx.translate(1, -10); ctx.rotate(.08);
  const brass = ctx.createLinearGradient(-6, -7, 6, 4);
  brass.addColorStop(0, "#f1d393"); brass.addColorStop(.3, "#ba8b4d"); brass.addColorStop(.52, "#efcf91"); brass.addColorStop(1, "#705033");
  ctx.fillStyle = "#170e1d99"; ctx.fillRect(-5, -5, 13, 11);
  ctx.fillStyle = brass; ctx.fillRect(-6, -6, 12, 10);
  ctx.fillStyle = "#3d2730"; ctx.fillRect(-3.5, -3.5, 7, 5);
  ctx.strokeStyle = "#d9b577"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -1); ctx.lineTo(2, -1); ctx.stroke();
  ctx.fillStyle = "#fff0c5"; ctx.fillRect(-5, -5, 3, .8);
  ctx.restore();
  ctx.restore();
}
