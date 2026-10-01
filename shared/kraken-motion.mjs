const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const FREE_ARMS = [
  [[163, 102], [119, 96], [87, 58], [54, 42], [37, 61], [52, 73], [61, 61]],
  [[160, 112], [120, 122], [88, 114], [55, 129], [34, 119], [40, 107]],
  [[173, 118], [147, 135], [124, 129], [105, 138], [87, 129], [98, 120]],
  [[198, 101], [236, 92], [264, 52], [294, 37], [317, 52], [308, 71], [291, 64]],
  [[203, 113], [241, 125], [273, 115], [299, 133], [325, 120], [316, 108]],
  [[187, 119], [211, 135], [236, 127], [257, 140], [276, 129], [263, 118]]
];

// A continuous centerline becomes a tapered ribbon, rather than a rigid tube.
function sampleSpline(joints) {
  const points = [];
  for (let segment = 0; segment < joints.length - 1; segment++) {
    const p0 = joints[Math.max(0, segment - 1)], p1 = joints[segment];
    const p2 = joints[segment + 1], p3 = joints[Math.min(joints.length - 1, segment + 2)];
    for (let step = 0; step < 6; step++) {
      const t = step / 6, t2 = t * t, t3 = t2 * t;
      points.push([0, 1].map(axis => .5 * (2 * p1[axis] + (-p0[axis] + p2[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 + (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3)));
    }
  }
  points.push(joints.at(-1));
  return points;
}
const xy = p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
function ribbon(joints, grip) {
  const points = sampleSpline(joints), left = [], right = [], cups = [];
  points.forEach((p, i) => {
    const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
    const dx = after[0] - before[0], dy = after[1] - before[1], length = Math.hypot(dx, dy) || 1;
    const progress = i / (points.length - 1), radius = (grip ? 10 : 9) * (1 - progress * .84);
    left.push([p[0] - dy / length * radius, p[1] + dx / length * radius]);
    right.push([p[0] + dy / length * radius, p[1] - dx / length * radius]);
    if (i > 2 && i % 3 === 0) {
      const r = Math.max(.6, radius * .3), x = p[0], y = p[1] + radius * .18;
      cups.push(`M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(r * 2).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-r * 2).toFixed(2)} 0`);
    }
  });
  return { outline: `M${left.map(xy).join('L')}L${right.reverse().map(xy).join('L')}Z`, cups: cups.join(''), root: points[0], tip: points.at(-1) };
}

export function krakenPose(phase, elapsed = 0, time = 0, response = '', still = false) {
  const arrival = still || phase === 'retreat' ? 1 : smooth(elapsed / 3.8);
  const departing = phase === 'retreat' ? (still ? 1 : smooth(elapsed / 3.5)) : 0;
  const sway = still ? 0 : Math.sin(time * .8) * 3;
  const breath = still ? 0 : Math.sin(time * 1.3) * 2;
  const head = { x: sway * (phase === 'omen' ? 0 : arrival), y: phase === 'omen' ? 112 : mix(112, breath, arrival) + departing * 152 };
  const motion = still ? 0 : response === 'steady' ? .45 : 1;
  const arms = FREE_ARMS.map((joints, index) => ribbon(joints.map(([x, y], j) => {
    const weight = j / (joints.length - 1), wave = time * (1.15 + index * .06) - j * .85 + index * 1.7;
    const hello = response === 'signal' && index === 3 ? Math.sin(time * 3.6 - j * .5) * weight * 13 * motion : 0;
    return [x + head.x + Math.sin(wave) * weight * 9 * motion, y + head.y + Math.cos(wave * .9) * weight * 12 * motion + hello];
  }), false));
  for (let side = 0; side < 2; side++) {
    const reflect = x => side ? 360 - x : x;
    const reach = phase === 'omen' ? (still ? 1 : smooth((elapsed - side * .8) / 3.1)) : 1;
    const release = phase === 'retreat' ? smooth((elapsed - side * .5) / 1.6) : 0;
    const contactDrop = (1 - reach) * 65 + release * 65;
    const rootX = side ? 201 : 159;
    const bend = Math.sin(time * 1.2 + side * 2) * 2 * motion;
    const joints = [
      [rootX + head.x, 108 + head.y],
      [reflect(116), mix(164, 112 + bend, phase === 'omen' ? 0 : arrival) + departing * 65],
      [reflect(77), 123 + bend + contactDrop * .5],
      [reflect(48), 137 + contactDrop],
      [reflect(32), 138 + contactDrop],
      [reflect(25), 147 + contactDrop],
      [reflect(37), 152 + contactDrop],
      [reflect(45), 146 + contactDrop]
    ];
    arms.push(ribbon(joints, true));
  }
  return { head, arms };
}
