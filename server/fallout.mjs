import { SOURCES } from "../src/fallout/data/sources.js";
import { parseAxolotl, parseCodes, parseHomeEvents, parseMinerva } from "./fallout-source.mjs";

const CACHE_MS = 15 * 60_000;
const RETRY_MS = 60_000;
const MAX_STALE_MS = 24 * 60 * 60_000;

export function createFalloutService({ fetcher = fetch, clock = Date.now } = {}) {
  const cache = new Map();
  let retryAt = 0;
  let inFlight = null;

  async function readPage(url) {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/html", "User-Agent": "DaivrWastelandTerminal/1.0 (+https://daivr.dev/fallout)" }
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) throw new Error("Source unavailable");
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1_500_000) throw new Error("Source response too large");
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  function save(key, parse) {
    try {
      cache.set(key, { data: parse(), fetchedAt: new Date(clock()).toISOString(), failed: false });
      return true;
    } catch {
      const previous = cache.get(key);
      if (previous) cache.set(key, { ...previous, failed: true });
      return false;
    }
  }

  async function sync() {
    const [codes, home, minerva] = await Promise.allSettled([
      readPage(SOURCES.codes.url), readPage(SOURCES.events.url), readPage(SOURCES.minerva.url)
    ]);
    const get = (result) => {
      if (result.status !== "fulfilled") throw new Error("Source unavailable");
      return result.value;
    };
    const results = [
      save("codes", () => parseCodes(get(codes))),
      save("events", () => parseHomeEvents(get(home)).map(({ inventory, ...event }) => event)),
      save("axolotl", () => parseAxolotl(get(home))),
      save("minerva", () => parseMinerva(get(minerva), home.status === "fulfilled" ? safeEvents(home.value) : []))
    ];
    retryAt = clock() + (results.every(Boolean) ? CACHE_MS : RETRY_MS);
  }

  function safeEvents(html) {
    try { return parseHomeEvents(html); } catch { return []; }
  }

  function snapshot() {
    const now = clock();
    return Object.fromEntries(["codes", "minerva", "axolotl", "events"].map((key) => {
      const entry = cache.get(key);
      if (!entry || now - Date.parse(entry.fetchedAt) > MAX_STALE_MS) {
        return [key, { status: "unavailable", data: null, fetchedAt: entry?.fetchedAt || null, source: SOURCES[key] }];
      }
      const expired = key === "codes" || key === "axolotl"
        ? now >= Date.parse(entry.data.endsAt) || now < Date.parse(entry.data.startsAt)
        : key === "minerva" && !entry.data.visits.some((visit) => Date.parse(visit.endsAt) > now);
      return [key, {
        status: entry.failed || expired || now - Date.parse(entry.fetchedAt) > CACHE_MS * 2 ? "stale" : "current",
        data: entry.data, fetchedAt: entry.fetchedAt, source: SOURCES[key]
      }];
    }));
  }

  return async function getIntelligence() {
    if (clock() >= retryAt) {
      if (!inFlight) inFlight = sync().finally(() => { inFlight = null; });
      await inFlight;
    }
    return snapshot();
  };
}

const getIntelligence = createFalloutService();

export async function handleFalloutRequest(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  const intelligence = await getIntelligence();
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(request.method === "HEAD" ? undefined : JSON.stringify(intelligence));
}
