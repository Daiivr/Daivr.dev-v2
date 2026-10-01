import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { patchNotes } from "../src/data/site.js";
import { patchStories } from "../src/data/patchStories.js";
import { patchDeskObjects } from "../src/data/patchDesk.js";
import { filterReleases, releaseFromUrl, releaseMonth } from "../shared/patch-map.mjs";

const releases = patchNotes.map((patch) => ({ ...patch, story: patchStories[patch.version] }));

test("release map combines month, all search terms, and developer-note filters", () => {
  const results = filterReleases(releases, { month: "2026-10", query: "FISH aquarium", annotated: true });
  assert.deepEqual(results.map((patch) => patch.version), ["v2.53.0", "v2.51.0", "v2.49.0"]);
  assert.equal(filterReleases(releases, { query: "v2.49.0" })[0].codename, "A ROOM OF YOUR OWN");
  assert.equal(filterReleases(releases, { query: "no-such-release-xyz" }).length, 0);
  assert.equal(filterReleases(releases, { month: "legacy", annotated: true }).length, 0);
  assert.equal(filterReleases(releases, { query: "\t  " }).length, releases.length);
});

test("oldest-first preserves the source order and includes the undated legacy release", () => {
  const first = releases[0].version;
  const oldest = filterReleases(releases, { oldestFirst: true });
  assert.equal(oldest[0].version, "v1.x");
  assert.equal(releases[0].version, first);
  assert.equal(releaseMonth(oldest[0]), "legacy");
  assert.deepEqual(filterReleases(releases, { month: "2026-07", oldestFirst: true }).map((patch) => patch.version), filterReleases(releases, { month: "2026-07" }).map((patch) => patch.version).reverse());
});

test("release links resolve exact versions and safely fall back for unknown values", () => {
  assert.equal(releaseFromUrl(releases, "?theme=glitch&release=v2.49.0"), "v2.49.0");
  assert.equal(releaseFromUrl(releases, "?release=v1.x"), "v1.x");
  assert.equal(releaseFromUrl(releases, "?release=missing"), releases[0].version);
  assert.equal(releaseFromUrl(releases, ""), releases[0].version);
});

test("curated release stories reference real releases and local images with captions", () => {
  for (const [version, story] of Object.entries(patchStories)) {
    assert.ok(releases.some((patch) => patch.version === version), version);
    assert.ok(story.note.trim());
    for (const image of story.images || []) {
      assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)), image.src);
      assert.ok(image.alt && image.caption && image.kind && image.label);
    }
  }
});

test("desk discoveries have distinct objects and short paths through real releases", () => {
  assert.equal(patchDeskObjects.length, 6);
  assert.equal(new Set(patchDeskObjects.map((object) => object.id)).size, 6);
  for (const object of patchDeskObjects) {
    assert.ok(object.label && object.hint && object.title && object.context);
    assert.ok(object.versions.length >= 2 && object.versions.length <= 4);
    assert.equal(new Set(object.versions).size, object.versions.length);
    for (const version of object.versions) assert.ok(releases.some((release) => release.version === version), version);
  }
});
