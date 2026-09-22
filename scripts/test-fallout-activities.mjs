import assert from "node:assert/strict";
import { test } from "node:test";
import { opsFixture, challengeFixture } from "./fixtures/fallout-activities.mjs";
import { parseDailyOps, parseChallenges } from "../server/fallout-activities.mjs";
import { createWikiService, validateItemTitle } from "../server/fallout-wiki.mjs";
import { effectiveFeed } from "../src/fallout/data/time.js";
import { ACTIVITY_PAGES, FALLOUT_PAGES, isActivityPath, isGuidePath } from "../src/fallout/data/pages.js";

test("each activity has its own direct route and cannot be mistaken for a guide", () => {
  for (const path of Object.keys(ACTIVITY_PAGES)) {
    assert.equal(isActivityPath(path), true);
    assert.equal(isActivityPath(path.toUpperCase() + "/"), true);
    assert.equal(isGuidePath(path), false);
    assert.ok(FALLOUT_PAGES[path].title);
  }
  assert.equal(isActivityPath("/fallout/unknown"), false);
  assert.equal(isActivityPath("/fallout"), false);
});

test("Daily Ops includes both mutations and expires at the next Eastern reset across DST", () => {
  const ops = parseDailyOps(opsFixture.replaceAll("13.09.2026", "31.10.2026"));
  assert.equal(ops.location, "Test Vault"); assert.equal(ops.enemies, "Test Faction");
  assert.equal(ops.mutations.length, 2);
  assert.equal(ops.startsAt, "2026-10-31T16:00:00.000Z");
  assert.equal(ops.endsAt, "2026-11-01T17:00:00.000Z");
  assert.throws(() => parseDailyOps(opsFixture.replace("America/New_York", "")));
  assert.throws(() => parseDailyOps(opsFixture.replace("Decryption", "Unknown")));
});

test("challenge periods stay isolated despite omitted ul tags and tips markup", () => {
  const now = Date.parse("2026-09-13T20:00:00Z");
  const daily = parseChallenges(challengeFixture, "daily", now);
  const weekly = parseChallenges(challengeFixture, "weekly", now);
  assert.equal(daily.items.length, 1); assert.equal(weekly.items.length, 1);
  assert.equal(daily.items[0].falloutFirst, true);
  assert.equal(weekly.items[0].falloutFirst, false);
  assert.ok(!daily.items[0].name.includes("Tips"));
  assert.equal(daily.items[0].score, 250);
  assert.equal(Date.parse(daily.endsAt) - now, 20 * 3600000);
  assert.equal(Date.parse(weekly.endsAt) - now, 68 * 3600000);
  assert.throws(() => parseChallenges(challengeFixture.replace("20 hours", "unknown"), "daily", now));
  assert.throws(() => parseChallenges(challengeFixture.replace("250", ""), "daily", now));
  assert.equal(effectiveFeed({ status: "current", data: daily, fetchedAt: daily.startsAt }, Date.parse(daily.endsAt), true).status, "stale");
});

test("wiki lookup uses a fixed host, follows title redirects, coalesces and attributes extracts", async () => {
  let calls = 0;
  const get = createWikiService({ fetcher: async url => {
    calls++;
    assert.equal(url.origin, "https://fallout.fandom.com");
    assert.equal(url.searchParams.get("redirects"), "1");
    return Response.json({ query: { pages: { 1: { title: "Plan: Test plan", extract: "A test crafting unlock.", fullurl: "https://fallout.fandom.com/wiki/Plan:_Test_plan", lastrevid: 12, thumbnail: { source: "https://static.wikia.nocookie.net/fallout/images/a/ab/Test.png" } } } } });
  } });
  const [a, b] = await Promise.all([get("Plan: Test plan"), get("Plan: Test plan")]);
  assert.deepEqual(a, b); assert.equal(calls, 1);
  assert.ok(a.source.includes("Wiki")); assert.ok(a.licenseUrl);
  assert.ok(a.imageUrl.endsWith("Test.png"));
  await get("Plan: Test plan"); assert.equal(calls, 1);
  for (const input of ["https://evil.test", "Plan: Test|Other", "Plan: <script>", "Plan: " + "a".repeat(200)]) assert.throws(() => validateItemTitle(input));
});

test("plans without pictures use the linked crafting unlock, never an arbitrary image host", async () => {
  const titles = [];
  const get = createWikiService({ fetcher: async url => {
    if (url.searchParams.get("action") === "parse") return Response.json({ parse: { text: { '*': '<h2><span id="Unlocks">Unlocks</span></h2><p>Craft a <a href="/wiki/Test_weapon_(Fallout_76)">test weapon</a>.</p>' } } });
    titles.push(url.searchParams.get("titles"));
    return titles.length === 1 ? Response.json({ query: { pages: { 1: { title: "Plan: Test weapon", extract: "Unlocks a test weapon.", fullurl: "https://fallout.fandom.com/wiki/Plan:_Test_weapon" } } } }) : Response.json({ query: { pages: { 2: { title: "Test weapon (Fallout 76)", thumbnail: { source: "https://evil.test/picture.png" } } } } });
  } });
  const result = await get("Plan: Test weapon");
  assert.deepEqual(titles, ["Plan: Test weapon", "Test weapon (Fallout 76)"]);
  assert.equal(result.imageUrl, null);
  assert.equal(result.excerpt, "Unlocks a test weapon.");
});

test("missing wiki articles and failed requests never produce invented item descriptions", async () => {
  const missing = createWikiService({ fetcher: async () => Response.json({ query: { pages: { '-1': { missing: "" } } } }) });
  assert.equal(await missing("Plan: Unknown item"), null);
  const offline = createWikiService({ fetcher: async () => { throw new Error("Offline"); } });
  await assert.rejects(offline("Plan: Test plan"));
  const badLink = createWikiService({ fetcher: async () => Response.json({ query: { pages: { 1: { extract: "Text", fullurl: "https://evil.test/" } } } }) });
  await assert.rejects(badLink("Plan: Test plan"));
});

test("crafting images preserve source link order across redirects and numeric page IDs", async () => {
  const get = createWikiService({ fetcher: async url => {
    if (url.searchParams.get("action") === "parse") return Response.json({ parse: { text: { '*': '<h2><span id="Unlocks">Unlocks</span></h2><p>Craft <a href="/wiki/Test_weapon">the weapon</a> and earn it from <a href="/wiki/Public_event">events</a>.</p>' } } });
    if (url.searchParams.get("prop") === "pageimages") return Response.json({ query: { redirects: [{ from: "Test weapon", to: "Test weapon (Fallout 76)" }], pages: {
      1: { title: "Public event", thumbnail: { source: "https://static.wikia.nocookie.net/fallout/images/a/ab/Event.png" } },
      2: { title: "Test weapon (Fallout 76)", thumbnail: { source: "https://static.wikia.nocookie.net/fallout/images/a/ab/Weapon.png" } },
    } } });
    return Response.json({ query: { pages: { 3: { title: "Plan: Test weapon", extract: "A weapon plan.", fullurl: "https://fallout.fandom.com/wiki/Plan:_Test_weapon" } } } });
  } });
  assert.ok((await get("Plan: Test weapon")).imageUrl.endsWith("Weapon.png"));
});
