// Hand positions in NZ:P's player.mdl, one per animation frame, for the held
// weapons in client/main.qc (Player_DrawWeapon). player.mdl has no tags to
// attach a weapon to, so the table is read from the model's own vertices.
//
//   node tools/nzp-qc/hand-table.mjs [game.pk3 url]
//
// Prints the QuakeC array to paste over daivr_hand_pos in daivr.patch's
// client/main.qc. Only the model file is downloaded (HTTP range requests).
import { inflateRawSync } from "node:zlib";

const PK3 = process.argv[2] || "https://nzp.gay/nzp/game.pk3";
const MODEL = "models/player.mdl";
// Hands closer than this hold the weapon together; further apart (sprint,
// reload, going down) the weapon follows the right hand alone.
const TOGETHER = 8;

async function range(start, end) {
  const response = await fetch(PK3, { headers: { Range: `bytes=${start}-${end}` } });
  if (response.status !== 206) throw new Error(`${PK3}: range request answered ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// The zip's central directory sits at the end; find the model's entry there.
async function readModel() {
  const last = await fetch(PK3, { headers: { Range: `bytes=-${1 << 20}` } });
  const size = Number((last.headers.get("content-range") || "").split("/")[1]);
  if (last.status !== 206 || !size) throw new Error(`${PK3}: no range support`);
  const tail = Buffer.from(await last.arrayBuffer());
  const tailSize = tail.length;
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("zip directory not found");
  let p = tail.readUInt32LE(eocd + 16) - (size - tailSize);
  while (tail.readUInt32LE(p) === 0x02014b50) {
    const method = tail.readUInt16LE(p + 10), compressed = tail.readUInt32LE(p + 20);
    const nameLength = tail.readUInt16LE(p + 28), extraLength = tail.readUInt16LE(p + 30), commentLength = tail.readUInt16LE(p + 32);
    const offset = tail.readUInt32LE(p + 42);
    if (tail.toString("latin1", p + 46, p + 46 + nameLength) === MODEL) {
      const entry = await range(offset, offset + 30 + 1024 + compressed);
      const start = 30 + entry.readUInt16LE(26) + entry.readUInt16LE(28);
      const data = entry.subarray(start, start + compressed);
      return method === 8 ? inflateRawSync(data) : data;
    }
    p += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${MODEL} not in ${PK3}`);
}

// Quake MDL (IDPO 6): vertices per frame in model space (x forward, y left, z up).
function parseMdl(b) {
  let p = 4;
  const i32 = () => { const v = b.readInt32LE(p); p += 4; return v; };
  const f32 = () => { const v = b.readFloatLE(p); p += 4; return v; };
  if (b.toString("latin1", 0, 4) !== "IDPO" || i32() !== 6) throw new Error("not an MDL v6");
  const scale = [f32(), f32(), f32()], translate = [f32(), f32(), f32()];
  p += 16; // radius, eye position
  const skins = i32(), skinWidth = i32(), skinHeight = i32(), vertCount = i32(), triCount = i32(), frameCount = i32();
  p += 12; // synctype, flags, size
  for (let s = 0; s < skins; s++) {
    if (i32() === 0) p += skinWidth * skinHeight;
    else { const n = i32(); p += 4 * n + n * skinWidth * skinHeight; }
  }
  p += 12 * vertCount; // texture coordinates
  const tris = [];
  for (let t = 0; t < triCount; t++) { p += 4; tris.push([i32(), i32(), i32()]); }
  const readFrame = () => {
    p += 24; // bounds, name
    const verts = [];
    for (let v = 0; v < vertCount; v++, p += 4) verts.push([0, 1, 2].map((k) => b[p + k] * scale[k] + translate[k]));
    return verts;
  };
  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    if (i32() === 0) frames.push(readFrame());
    else { const n = i32(); p += 8 + 4 * n; const group = []; for (let g = 0; g < n; g++) group.push(readFrame()); frames.push(group[0]); }
  }
  return { tris, frames };
}

// The hands: the two largest connected pieces in front of the chest in the
// idle pose (frame 0), where both hold the weapon out front.
function findHands({ tris, frames }) {
  const idle = frames[0];
  const front = new Set(idle.flatMap((v, i) => (v[0] > 14 ? [i] : [])));
  const parent = new Map([...front].map((i) => [i, i]));
  const find = (i) => { while (parent.get(i) !== i) i = parent.get(i); return i; };
  const join = (a, b) => parent.set(find(a), find(b));
  for (const [a, b, c] of tris) for (const [x, y] of [[a, b], [b, c], [c, a]]) if (front.has(x) && front.has(y)) join(x, y);
  const seen = new Map();
  for (const i of front) { const key = idle[i].join(); if (seen.has(key)) join(i, seen.get(key)); else seen.set(key, i); }
  const pieces = new Map();
  for (const i of front) { const r = find(i); pieces.set(r, [...(pieces.get(r) || []), i]); }
  const [a, b] = [...pieces.values()].sort((x, y) => y.length - x.length);
  if (!b || a.length !== b.length) throw new Error("couldn't tell the two hands apart");
  // Right hand: further to the right (negative y) on average over all frames.
  const meanY = (ids) => frames.reduce((s, f) => s + ids.reduce((t, i) => t + f[i][1], 0) / ids.length, 0);
  return meanY(a) < meanY(b) ? { right: a, left: b } : { right: b, left: a };
}

const centroid = (ids, verts) => [0, 1, 2].map((k) => ids.reduce((s, i) => s + verts[i][k], 0) / ids.length);
const model = parseMdl(await readModel());
const { right, left } = findHands(model);
const rows = model.frames.map((verts) => {
  const r = centroid(right, verts), l = centroid(left, verts);
  const apart = Math.hypot(r[0] - l[0], r[1] - l[1], r[2] - l[2]) > TOGETHER;
  const hand = apart ? r : [0, 1, 2].map((k) => (r[k] + l[k]) / 2);
  return `'${hand.map((n) => n.toFixed(1)).join(" ")}'`;
});
const lines = [];
for (let i = 0; i < rows.length; i += 8) lines.push("\t" + rows.slice(i, i + 8).join(", ") + (i + 8 < rows.length ? "," : ""));
console.log(`vector daivr_hand_pos[${rows.length}] = {\n${lines.join("\n")}\n};`);
