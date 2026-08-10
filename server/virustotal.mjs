import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getDataFile } from "./storage.mjs";

const VT_BASE = "https://www.virustotal.com/api/v3";
const GITHUB_REPO = process.env.TRADEDEX_REPO || "Daiivr/TradeDex";
const GITHUB_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CACHE_FILENAME = "tradedex-scan.json";
const RELEASE_CACHE_TTL_MS = 5 * 60 * 1000;
// A file can be submitted to VirusTotal after our first hash lookup. Keep a
// short negative cache so the public API is not hammered, but do not preserve
// a stale 404 for hours after a report becomes available.
const VT_MISS_CACHE_TTL_MS = 60 * 1000;
const VT_REPORT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

let releaseCache = { fetchedAt: 0, data: null };
const lookupInflight = new Map();

function getVirusTotalApiKey() {
  return String(process.env.VIRUSTOTAL_API_KEY || process.env.VT_API_KEY || "").trim();
}

function sendJson(response, status, payload, cacheControl = "no-store") {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl
  });
  response.end(JSON.stringify(payload));
}

async function withRetry(fn, { retries = 3, baseDelayMs = 800, label = "request" } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.response?.status;
      const transient = status >= 500 || ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND"].includes(error?.code);
      if (!transient || attempt === retries) throw lastError;
      const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 250);
      console.warn(`[tradedex] ${label} failed (${status || error?.code || error.message}), retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function fetchJsonAllowing(url, okStatuses, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJson(response);
  if (!okStatuses.includes(response.status)) {
    const error = new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return { status: response.status, payload };
}

async function ensureCache() {
  const cacheFile = getDataFile(CACHE_FILENAME);
  await mkdir(dirname(cacheFile), { recursive: true });
  if (!existsSync(cacheFile)) {
    await writeFile(cacheFile, JSON.stringify({ scans: {} }, null, 2), "utf8");
  }
}

async function readCache() {
  try {
    await ensureCache();
    const raw = await readFile(getDataFile(CACHE_FILENAME), "utf8");
    const data = raw ? JSON.parse(raw) : null;
    return data?.scans ? data : { scans: {} };
  } catch (error) {
    console.error("[tradedex] cache read failed", error.message || error);
    return { scans: {} };
  }
}

async function writeCache(cache) {
  try {
    await ensureCache();
    await writeFile(getDataFile(CACHE_FILENAME), JSON.stringify(cache, null, 2), "utf8");
  } catch (error) {
    console.error("[tradedex] cache write failed", error.message || error);
  }
}

async function resolveLatestRelease() {
  const now = Date.now();
  if (releaseCache.data && now - releaseCache.fetchedAt < RELEASE_CACHE_TTL_MS) return releaseCache.data;

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "daivr-arcade-station"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const release = await withRetry(
    () => fetchJson(GITHUB_RELEASE_API, { headers }),
    { label: "github release lookup" }
  );
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const preferred =
    assets.find((asset) => /\.(exe|msi)$/i.test(asset?.name || "")) ||
    assets.find((asset) => /\.(zip|7z|rar|tar\.gz|appimage|dmg)$/i.test(asset?.name || "")) ||
    assets[0] ||
    null;
  const digest = String(preferred?.digest || "");

  const resolved = {
    tag: release?.tag_name || release?.name || "latest",
    name: release?.name || release?.tag_name || "latest",
    htmlUrl: release?.html_url || null,
    publishedAt: release?.published_at || null,
    asset: preferred
      ? {
          name: preferred.name,
          size: Number(preferred.size || 0),
          contentType: preferred.content_type,
          downloadUrl: preferred.browser_download_url,
          sha256: digest.startsWith("sha256:") ? digest.slice("sha256:".length) : null
        }
      : null
  };

  releaseCache = { fetchedAt: now, data: resolved };
  return resolved;
}

function summariseStats(stats) {
  if (!stats) return null;
  const malicious = Number(stats.malicious || 0);
  const suspicious = Number(stats.suspicious || 0);
  const undetected = Number(stats.undetected || 0);
  const harmless = Number(stats.harmless || 0);
  const timeout = Number(stats.timeout || 0);
  const failure = Number(stats.failure || 0);
  const total = malicious + suspicious + undetected + harmless + timeout + failure;
  let verdict = "clean";
  if (malicious > 0) verdict = "malicious";
  else if (suspicious > 0) verdict = "suspicious";
  return { malicious, suspicious, undetected, harmless, timeout, failure, total, verdict };
}

async function queryVirusTotalByHash(sha256) {
  const apiKey = getVirusTotalApiKey();
  const { status, payload } = await withRetry(
    () => fetchJsonAllowing(`${VT_BASE}/files/${sha256}`, [200, 404], {
      headers: {
        Accept: "application/json",
        "x-apikey": apiKey
      }
    }),
    { label: "vt digest lookup", retries: 2 }
  );

  if (status === 404) return { found: false };
  const attrs = payload?.data?.attributes || {};
  return {
    found: true,
    summary: summariseStats(attrs.last_analysis_stats),
    scanDate: attrs.last_analysis_date || null,
    permalink: `https://www.virustotal.com/gui/file/${sha256}`
  };
}

function getCachedReleaseScan(release, cache) {
  const cached = cache.scans[release.tag];
  const releaseSha = release.asset?.sha256 || null;
  if (!cached?.sha256 || !cached?.vt || cached.sha256 !== releaseSha) return null;

  // Migrate any pending record created by the retired upload/polling flow into
  // a fresh, single hash lookup instead of resuming background analysis.
  if (["pending", "error"].includes(cached.vt.status)) return null;
  if (cached.vt.status === "scanned" && !cached.vt.stats) return null;

  if (cached.vt.status === "not-scanned") {
    const checkedAt = Number(cached.checkedAt || cached.scannedAt || 0);
    if (!checkedAt || Date.now() - checkedAt > VT_MISS_CACHE_TTL_MS) return null;
  }

  if (cached.vt.status === "scanned") {
    const checkedAt = Number(cached.checkedAt || cached.scannedAt || 0);
    if (!checkedAt || Date.now() - checkedAt > VT_REPORT_CACHE_TTL_MS) return null;
  }

  return cached;
}

function buildResponse(release, record, fromCache) {
  const checkedAt = Number(record.checkedAt || record.scannedAt || 0);
  const retryAfterMs = record.vt?.status === "not-scanned"
    ? Math.max(0, VT_MISS_CACHE_TTL_MS - (Date.now() - checkedAt))
    : null;

  return {
    tag: release.tag,
    releaseUrl: release.htmlUrl,
    publishedAt: release.publishedAt,
    asset: release.asset,
    status: "done",
    stage: "digest-lookup",
    progress: 1,
    sha256: record.sha256 || release.asset?.sha256 || null,
    vt: record.vt,
    scannedAt: record.scannedAt || record.checkedAt || null,
    retryAfterMs,
    fromCache
  };
}

async function lookupReleaseByDigest(release, cache) {
  if (lookupInflight.has(release.tag)) return lookupInflight.get(release.tag);

  const lookup = (async () => {
    const sha256 = release.asset?.sha256 || null;
    if (!sha256) {
      return {
        tag: release.tag,
        asset: release.asset,
        sha256: null,
        vt: {
          status: "unavailable",
          reason: "missing-github-digest"
        },
        checkedAt: Date.now()
      };
    }

    const result = await queryVirusTotalByHash(sha256);
    const record = {
      tag: release.tag,
      asset: release.asset,
      sha256,
      vt: result.found && result.summary
        ? {
            status: "scanned",
            stats: result.summary,
            verdict: result.summary?.verdict || "clean",
            scanDate: result.scanDate,
            permalink: result.permalink,
            submitted: false
          }
        : {
            status: "not-scanned",
            reason: result.found ? "analysis-missing" : "hash-not-indexed",
            permalink: `https://www.virustotal.com/gui/file/${sha256}`,
            submitted: false
          },
      checkedAt: Date.now(),
      scannedAt: result.found ? Date.now() : null
    };

    cache.scans[release.tag] = record;
    await writeCache(cache);
    return record;
  })();

  lookupInflight.set(release.tag, lookup);
  try {
    return await lookup;
  } finally {
    if (lookupInflight.get(release.tag) === lookup) lookupInflight.delete(release.tag);
  }
}

export async function getTradeDexScan() {
  const release = await resolveLatestRelease();
  if (!release?.asset?.downloadUrl) {
    return {
      statusCode: 502,
      body: {
        error: "no-release-asset",
        message: "El ultimo release no tiene assets descargables.",
        release
      }
    };
  }

  const cache = await readCache();
  const cached = getCachedReleaseScan(release, cache);
  if (cached) return { statusCode: 200, body: buildResponse(release, cached, true) };

  if (!release.asset.sha256) {
    const record = await lookupReleaseByDigest(release, cache);
    return { statusCode: 200, body: buildResponse(release, record, false) };
  }

  if (!getVirusTotalApiKey()) {
    const record = {
      sha256: release.asset.sha256,
      vt: { status: "unavailable", reason: "missing-vt-key" },
      checkedAt: Date.now()
    };
    return {
      statusCode: 200,
      body: buildResponse(release, record, false)
    };
  }

  try {
    const record = await lookupReleaseByDigest(release, cache);
    return { statusCode: 200, body: buildResponse(release, record, false) };
  } catch (error) {
    console.error("[tradedex] digest lookup failed", error.message || error);
    const record = {
      sha256: release.asset.sha256,
      vt: { status: "unavailable", reason: "lookup-failed" },
      checkedAt: Date.now()
    };
    return { statusCode: 200, body: buildResponse(release, record, false) };
  }
}

export async function getTradeDexInfo() {
  const release = await resolveLatestRelease();
  const cache = await readCache();
  const cached = release ? getCachedReleaseScan(release, cache) : null;

  let scan = null;
  if (cached?.vt) {
    const stats = cached.vt.stats || null;
    scan = {
      status: cached.vt.status || "scanned",
      verdict: cached.vt.verdict || null,
      reason: cached.vt.reason || null,
      stats: stats
        ? {
            total: stats.total,
            clean: (stats.harmless || 0) + (stats.undetected || 0),
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0
          }
        : null,
      scannedAt: cached.scannedAt || cached.checkedAt || null
    };
  }

  return {
    tag: release?.tag || null,
    releaseUrl: release?.htmlUrl || null,
    publishedAt: release?.publishedAt || null,
    asset: release?.asset || null,
    scan
  };
}

export async function handleTradeDexVirusTotalRequest(request, response) {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    if (url.pathname === "/api/tradedex/info") {
      sendJson(response, 200, await getTradeDexInfo(), "public, max-age=30, stale-while-revalidate=30");
      return;
    }

    const result = await getTradeDexScan();
    sendJson(response, result.statusCode, result.body);
  } catch (error) {
    console.error("[tradedex] route error", error.message || error);
    sendJson(response, 500, {
      error: "scan-route-error",
      message: error.message || "Unknown error"
    });
  }
}
