import assert from "node:assert/strict";
import { test } from "node:test";
import { createFalloutService } from "../server/fallout.mjs";
import { easternDate, parseAxolotl, parseCodes, parseHomeEvents, parseMinerva, plainText } from "../server/fallout-source.mjs";
import { countdown, effectiveFeed, isInWindow, selectVisits } from "../src/fallout/data/time.js";
import { SOURCES } from "../src/fallout/data/sources.js";

// Synthetic fixtures model the source's observed HTML shapes. These test codes
// never enter the application or its fallback states.
const codeFixture = (range = "10th Sep -17th Sep 2026 (20:00)") => `<div class="nukecodes-current text-center mb-5"><h1>Nuke Codes</h1><p>${range}</p>${["Alpha", "Bravo", "Charlie"].map((name) => `<div>${name}</div><div class="nukecodes-current-code">01 23 45 67</div>`).join("")}</div><div class="nukecodes-archive">`;
const eventPath = "/events/123/minerva-list-1/";
const eventFixture = `<div class="mb-4 mod_fallout76dates_event col-12"><h4 class="mod_fallout76dates_event_title"><a href="${eventPath}">Minerva (List 1)</a></h4><p>Mo, 14th Sep 2026 (12:00) - We, 16th Sep 2026 (12:00)</p><div class="col-7 col-md-8">Plan: Chemist&#39;s backpack</div><div class="col-5 col-md-4 text-right">263 Gold</div>`;
const axolotlFixture = `<div class="container bg-light mb-3 mod_axolotl_widget"><h5>September 2026</h5><p><b> Shadow Axolotl</b></p><small>Start: 1st Sep 2026 12:00<br />End: 6th Oct 2026 11:59<br />America/New_York</small><p>Only in September in Toxic Valley <br />& Ash Heap <br /> Small Fish</p><div class="d-lg-none col-12">`;
const minervaFixture = `<div data-minerva-index="0"><a href="${eventPath}">visit</a><div class="mb-3 minerva-event-detail-meta"><h3>Minerva (List 1)<span>Starts soon</span></h3><p>Location: Foundation</p><b>Mo, 14th Sep 2026 (12:00) - We, 16th Sep 2026 (12:00)</b></div><div class="mod_fallout76rewards_minerva">`;
const initialTime = Date.parse("2026-09-13T20:00:00Z");

test("codes preserve leading zeroes and use the published validity interval", () => {
  const data = parseCodes(codeFixture());
  assert.equal(data.codes.alpha, "01234567");
  assert.equal(data.endsAt, "2026-09-18T00:00:00.000Z");
  assert.equal(isInWindow(data, initialTime), true);
  assert.equal(isInWindow(data, Date.parse(data.endsAt)), false);
  assert.equal(parseCodes(codeFixture("28th Dec -4th Jan 2027 (19:00)")).startsAt, "2026-12-29T00:00:00.000Z");
});

test("missing, malformed, ambiguous and impossible source data fails closed", () => {
  assert.throws(() => parseCodes("<h1>Connection failure</h1>"));
  assert.throws(() => parseCodes(codeFixture().replace("01 23 45 67", "1234567")));
  assert.throws(() => parseCodes(codeFixture("Next Thursday")));
  assert.throws(() => easternDate({ day: "31", month: "Feb", year: "2026", hour: "12", minute: "00" }));
  assert.throws(() => parseMinerva("No schedule"));
  assert.throws(() => parseAxolotl(axolotlFixture.replace("America/New_York", "")));
});

test("Eastern time follows DST rather than the server timezone", () => {
  assert.equal(easternDate({ day: "1", month: "Jul", year: "2026", hour: "12", minute: "00" }), "2026-07-01T16:00:00.000Z");
  assert.equal(easternDate({ day: "1", month: "Dec", year: "2026", hour: "12", minute: "00" }), "2026-12-01T17:00:00.000Z");
});

test("Minerva inventory joins only to the exact visit, with arrival and departure boundaries", () => {
  const events = parseHomeEvents(eventFixture);
  const { visits } = parseMinerva(minervaFixture, events);
  assert.deepEqual(visits[0].inventory, [{ name: "Chemist's backpack", gold: 263 }]);
  assert.equal(selectVisits(visits, initialTime).current, null);
  assert.equal(selectVisits(visits, initialTime).next.location, "Foundation");
  assert.equal(selectVisits(visits, Date.parse(visits[0].startsAt)).current.location, "Foundation");
  assert.equal(selectVisits(visits, Date.parse(visits[0].endsAt)).current, null);
  assert.equal(parseMinerva(minervaFixture, [{ ...events[0], url: "https://nukaknights.com/other" }]).visits[0].inventory, null);
});

test("monthly catch uses actual regions and an exclusive reset boundary", () => {
  const catchData = parseAxolotl(axolotlFixture);
  assert.deepEqual(catchData.regions, ["Toxic Valley", "Ash Heap"]);
  assert.equal(catchData.endsAt, "2026-10-06T16:00:00.000Z");
  assert.equal(countdown(catchData.endsAt, Date.parse(catchData.endsAt)), "Awaiting update");
  assert.equal(plainText('<script>bad()</script>A &amp; B <b>report</b>'), "A & B report");
});

test("monthly specimen image follows the report and only uses the fixed public image directory", () => {
  const photo = '<img src="/img/axolotl/tn_3_axolotl-shadow.png" />';
  const fixture = axolotlFixture.replace("<h5>", `${photo}<h5>`);
  assert.equal(parseAxolotl(fixture).imageUrl, "https://nukaknights.com/img/axolotl/tn_3_axolotl-shadow.png");
  assert.equal(parseAxolotl(fixture.replace("/img/axolotl/tn_3_axolotl-shadow.png", "https://unknown.test/photo.png")).imageUrl, null);
  assert.equal(parseAxolotl(fixture.replace("/img/axolotl/tn_3_axolotl-shadow.png", "/img/axolotl/../../private.png")).imageUrl, null);
});

function serviceHarness() {
  let now = initialTime;
  let calls = 0;
  let failure = false;
  let brokenCodes = false;
  const get = createFalloutService({ clock: () => now, fetcher: async (url) => {
    calls++;
    if (failure) throw new Error("Offline");
    const html = url === SOURCES.codes.url ? (brokenCodes ? "changed markup" : codeFixture()) : url === SOURCES.minerva.url ? minervaFixture : eventFixture + axolotlFixture;
    return new Response(html, { headers: { "content-type": "text/html" } });
  } });
  return { get, calls: () => calls, advance: (ms) => { now += ms; }, fail: () => { failure = true; }, breakCodes: () => { brokenCodes = true; } };
}

test("concurrent requests coalesce; repeat reads preserve real fetch timestamps", async () => {
  const harness = serviceHarness();
  const [first, second] = await Promise.all([harness.get(), harness.get()]);
  assert.equal(harness.calls(), 3);
  assert.deepEqual(first, second);
  harness.advance(10 * 60000);
  const cached = await harness.get();
  assert.equal(harness.calls(), 3);
  assert.equal(cached.codes.fetchedAt, first.codes.fetchedAt);
});

test("source outage preserves a labeled stale copy, throttles retries, then expires it", async () => {
  const harness = serviceHarness();
  const first = await harness.get();
  harness.advance(16 * 60000);
  harness.fail();
  const stale = await harness.get();
  assert.equal(stale.codes.status, "stale");
  assert.equal(stale.codes.fetchedAt, first.codes.fetchedAt);
  await harness.get();
  assert.equal(harness.calls(), 6);
  harness.advance(25 * 60 * 60000);
  const expired = await harness.get();
  assert.equal(expired.codes.status, "unavailable");
  assert.equal(expired.codes.data, null);
});

test("cold outage cannot create pretend timestamps or codes; independent panels survive parser failures", async () => {
  const cold = serviceHarness(); cold.fail();
  const unavailable = await cold.get();
  assert.ok(Object.values(unavailable).every((feed) => feed.data === null && feed.fetchedAt === null && feed.status === "unavailable"));
  const partial = serviceHarness(); partial.breakCodes();
  const result = await partial.get();
  assert.equal(result.codes.status, "unavailable");
  assert.equal(result.minerva.status, "current");
  assert.equal(result.axolotl.status, "current");
});

test("client hides expired and old codes even if a page remains open across reset", () => {
  const data = parseCodes(codeFixture());
  const feed = { data, status: "current", fetchedAt: new Date(initialTime).toISOString() };
  assert.equal(effectiveFeed(feed, initialTime, true).status, "current");
  assert.equal(effectiveFeed(feed, initialTime + 31 * 60000, true).status, "stale");
  assert.equal(effectiveFeed({ ...feed, fetchedAt: data.endsAt }, Date.parse(data.endsAt), true).status, "stale");
});
