import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { test } from "node:test";
import { NZP_CUSTOM_MAPS } from "../public/nzp/custom-maps.mjs";

// Inspect the actual shipped PK3s, not just their catalogue: a missing waypoint
// can boot successfully but leave every zombie stuck outside the playable map.
function zipEntries(bytes) {
  const end = bytes.length - 22; // Our deterministic importer writes no ZIP comment.
  assert.equal(bytes.readUInt32LE(end), 0x06054b50);
  let offset = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < bytes.readUInt16LE(end + 10); i++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString();
    const local = bytes.readUInt32LE(offset + 42);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + bytes.readUInt32LE(offset + 20));
    assert.equal(bytes.readUInt16LE(offset + 10), 8, `${name}: DEFLATE`);
    assert(!entries.has(name), `${name}: duplicate path`);
    entries.set(name, inflateRawSync(data));
    offset += 46 + nameLength + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }
  return entries;
}

test("the five requested maps ship with intact BSPs, navigation and native menu metadata", () => {
  assert.deepEqual(NZP_CUSTOM_MAPS.map(({ discussion }) => discussion), [470, 882, 166, 340, 898]);
  const paths = new Set();
  for (const map of NZP_CUSTOM_MAPS) {
    const bytes = readFileSync(new URL(`../public/nzp/custom-maps/${map.archive}`, import.meta.url));
    assert.equal(bytes.length, map.bytes, map.name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), map.sha256, map.name);
    const entries = zipEntries(bytes);
    const bsp = entries.get(`maps/${map.id}.bsp`);
    assert(bsp?.length > 1000, `${map.name}: missing map`);
    assert([29, 30].includes(bsp.readUInt32LE(0)), `${map.name}: unsupported BSP`);
    assert(entries.get(`maps/${map.id}.way`)?.length > 100, `${map.name}: missing navigation`);
    const menu = entries.get(`maps/${map.id}.txt`)?.toString().split(/\r?\n/);
    assert(menu?.length >= 12 && menu[0] && menu[9], `${map.name}: missing title or credit`);
    if (menu[10] === "1") assert(entries.has(`gfx/menu/custom/${map.id}.png`), `${map.name}: missing thumbnail`);
    for (const name of entries.keys()) {
      assert(!name.startsWith("/") && !name.includes("..") && !name.includes("\\"), name);
      assert(!/\.(cfg|dat|exe|dll|js)$/i.test(name), `${name}: overrides game code/config`);
      assert(!paths.has(name.toLowerCase()), `${name}: maps override each other's assets`);
      paths.add(name.toLowerCase());
    }
  }
});
