import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";
import { SLASHER_GUIDE } from "../src/fallout/data/guides.js";
import { GAME_MAP, worldToMap } from "../src/fallout/data/gameMap.js";
import { FALLOUT_PAGES, GUIDES_PATH, SLASHER_PATH, isGuidePath, normalizeFalloutPath } from "../src/fallout/data/pages.js";

const survey = JSON.parse(await readFile(new URL("../src/fallout/data/slasher-spawns.json", import.meta.url), "utf8"));

test("all world landmarks project inside the map and use available scalable game icons", async () => {
  const locations = JSON.parse(await readFile(new URL("../src/fallout/data/world-locations.json", import.meta.url), "utf8"));
  assert.equal(locations.length, 458);
  for (const area of survey.locations) {
    const landmark = locations.find(location => Math.abs(location.x - area.marker[0]) < .01 && Math.abs(location.y - area.marker[1]) < .01);
    assert.equal(area.icon, landmark?.icon, `Directory and map use the same icon: ${area.name}`);
  }
  for (const location of locations) {
    assert.ok(location.name.length > 0);
    assert.ok(worldToMap(location.x, location.y).every(value => Number.isFinite(value) && value >= 0 && value <= GAME_MAP.size));
    assert.match(location.icon, /^[A-Za-z0-9_]+$/);
  }
  for (const icon of new Set(locations.map(location => location.icon))) {
    const svg = await readFile(new URL(`../public/fallout/map-icons/${icon}.svg`, import.meta.url), "utf8");
    assert.match(svg, /viewBox="0 0 [\d.]+ [\d.]+"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|https?:\/\/(?!www\.w3\.org)/i);
  }
});

test("lossless tile pyramid covers the complete map at every native level", async () => {
  assert.equal(GAME_MAP.tileSize * 2 ** GAME_MAP.tileZoomOffset, GAME_MAP.size);
  for (let z = 0; z <= GAME_MAP.tileZoomOffset; z++) {
    for (let x = 0; x < 2 ** z; x++) for (let y = 0; y < 2 ** z; y++) {
      const path = GAME_MAP.tiles.replace("{z}", z).replace("{x}", x).replace("{y}", y);
      const tile = await readFile(new URL(`../public${path}`, import.meta.url));
      assert.equal(tile.toString("ascii", 8, 12), "WEBP");
      assert.equal(tile.toString("ascii", 12, 16), "VP8L");
    }
  }
});

test("every mask has a unique local location photo, including the Camden boat match", async () => {
  const photos = JSON.parse(await readFile(new URL("../src/fallout/data/slasher-photos.json", import.meta.url), "utf8"));
  const points = survey.locations.flatMap(location => location.spawns);
  assert.deepEqual(Object.keys(photos).sort(), points.map(point => point.id).sort());
  assert.equal(new Set(Object.values(photos).map(photo => photo.src)).size, points.length);
  await Promise.all(Object.values(photos).map(async photo => {
    assert.match(photo.src, /^\/fallout\/mask-locations\/[0-9a-f]{8}\.avif$/);
    assert.ok(photo.width > 0 && photo.height > 0);
    assert.ok((await stat(new URL(`../public${photo.src}`, import.meta.url))).size > 0);
  }));
  const provenance = JSON.parse(await readFile(new URL("./slasher-photo-provenance.json", import.meta.url), "utf8"));
  assert.ok(provenance.photos.find(photo => photo.id === "008F83BD").sourceImage.endsWith("ash-heap-camden-park-1-item.avif"));
});

test("game-map projection preserves world bounds, north, and landmark-relative offsets", () => {
  const { centerX, centerY, range, size } = GAME_MAP;
  assert.deepEqual(worldToMap(centerX, centerY), [size / 2, size / 2]);
  assert.deepEqual(worldToMap(centerX - range / 2, centerY - range / 2), [0, 0]);
  assert.deepEqual(worldToMap(centerX + range / 2, centerY + range / 2), [size, size]);
  for (const location of survey.locations) {
    const marker = worldToMap(...location.marker);
    for (const point of location.spawns) {
      const projected = worldToMap(point.x, point.y);
      assert.ok(projected.every(value => value >= 0 && value <= size));
      assert.equal(Math.sign(projected[0] - marker[0]), Math.sign(point.y - location.marker[1]));
      assert.equal(Math.sign(projected[1] - marker[1]), Math.sign(point.x - location.marker[0]));
    }
  }
});

test("all 108 unique game records remain accessible through the landmark directory", () => {
  const points = survey.locations.flatMap(location => location.spawns);
  assert.equal(points.length, 108);
  assert.equal(new Set(points.map(point => point.id)).size, 108);
  assert.equal(new Set(points.map(point => point.number)).size, 108);
  assert.equal(new Set(survey.locations.map(location => location.id)).size, survey.locations.length);
  assert.equal(survey.locations.length, SLASHER_GUIDE.locations);
  for (const point of points) {
    for (const coordinate of [point.x, point.y, point.z]) assert.ok(Number.isFinite(coordinate));
    assert.match(point.bearing, /^(north|northeast|east|southeast|south|southwest|west|northwest)$/);
  }
});

test("regional and lightweight card totals agree with the actual exported positions", () => {
  for (const region of SLASHER_GUIDE.regions) {
    const total = survey.locations.filter(location => location.region === region.name).reduce((sum, location) => sum + location.spawns.length, 0);
    assert.equal(total, region.spawns, region.name);
    assert.equal(survey.regions.find(item => item.name === region.name).spawns, total);
  }
  assert.equal(survey.regions.length, 8);
});

test("each challenge adds pickups rather than reusing the previous stage's count", () => {
  let total = 0;
  for (const reward of SLASHER_GUIDE.rewards) { total += reward.masks; assert.equal(reward.total, total); }
  assert.equal(total, 93);
});

test("guide routes match direct links and trailing slash variants without capturing unrelated pages", () => {
  for (const path of [GUIDES_PATH, SLASHER_PATH]) {
    assert.ok(isGuidePath(path));
    assert.ok(isGuidePath(`${path}/`));
    assert.ok(isGuidePath(path.toUpperCase()));
    assert.ok(FALLOUT_PAGES[normalizeFalloutPath(`${path}/`)]);
  }
  for (const path of ["/", "/fallout", "/fallout/guides-missing", "/fallout/guides/unknown"]) assert.equal(isGuidePath(path), false);
});
