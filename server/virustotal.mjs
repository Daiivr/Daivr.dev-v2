import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getDataFile } from "./storage.mjs";

const VT_BASE = "https://www.virustotal.com/api/v3";
const VT_DIRECT_UPLOAD_LIMIT = 32 * 1024 * 1024;
const VT_LARGE_UPLOAD_LIMIT = 650 * 1024 * 1024;
const GITHUB_REPO = process.env.TRADEDEX_REPO || "Daiivr/TradeDex";
const GITHUB_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CACHE_FILENAME = "tradedex-scan.json";
const RELEASE_CACHE_TTL_MS = 5 * 60 * 1000;
const DONE_STATE_TTL_MS = 10 * 60 * 1000;
const ERROR_STATE_TTL_MS = 15 * 1000;
const VT_POLL_INTERVAL_MS = 30 * 1000;

let releaseCache = { fetchedAt: 0, data: null };
const inflight = new Map();

function getVirusTotalApiKey() {
  return String(process.env.VIRUSTOTAL_API_KEY || process.env.VT_API_KEY || "").trim();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
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
      await wait(delay);
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
    const retryAfter = Number(response.headers.get("retry-after"));
    if (Number.isFinite(retryAfter) && retryAfter > 0) error.retryAfterMs = retryAfter * 1000;
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
  const CACHE_FILE = getDataFile(CACHE_FILENAME);
  await mkdir(dirname(CACHE_FILE), { recursive: true });
  if (!existsSync(CACHE_FILE)) {
    await writeFile(CACHE_FILE, JSON.stringify({ scans: {} }, null, 2), "utf8");
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

function snapshotState(state) {
  return {
    tag: state.tag,
    asset: state.asset,
    status: state.status,
    stage: state.stage,
    progress: state.progress,
    sha256: state.sha256,
    vt: state.vt,
    error: state.error,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    fromCache: Boolean(state.fromCache)
  };
}

async function downloadAndHash(url, state) {
  state.status = "scanning";
  state.stage = "downloading";
  state.progress = 0;

  const response = await withRetry(
    () => fetch(url, { headers: { "User-Agent": "daivr-arcade-station" } }).then((res) => {
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}`);
        error.status = res.status;
        throw error;
      }
      return res;
    }),
    { label: "asset download" }
  );

  const total = Number(response.headers.get("content-length")) || state.asset?.size || 0;
  const canBufferForUpload = total > 0 && total <= VT_LARGE_UPLOAD_LIMIT;
  const reader = response.body.getReader();
  const hash = createHash("sha256");
  const chunks = [];
  let received = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    hash.update(value);
    received += value.byteLength;
    if (canBufferForUpload) chunks.push(Buffer.from(value));
    if (total > 0) state.progress = Math.min(1, received / total);
  }

  state.stage = "hashing";
  const sha256 = hash.digest("hex");
  state.sha256 = sha256;
  state.progress = 1;

  return {
    sha256,
    buffer: canBufferForUpload ? Buffer.concat(chunks) : null,
    totalBytes: received
  };
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
    { label: "vt hash lookup" }
  );

  if (status === 404) return { found: false };
  const attrs = payload?.data?.attributes || {};
  const summary = summariseStats(attrs.last_analysis_stats);
  return {
    found: true,
    summary,
    scanDate: attrs.last_analysis_date || null,
    meaningfulName: attrs.meaningful_name || null,
    reputation: typeof attrs.reputation === "number" ? attrs.reputation : null,
    permalink: `https://www.virustotal.com/gui/file/${sha256}`
  };
}

async function getLargeUploadUrl() {
  const apiKey = getVirusTotalApiKey();
  const payload = await withRetry(
    () => fetchJson(`${VT_BASE}/files/upload_url`, {
      headers: {
        Accept: "application/json",
        "x-apikey": apiKey
      }
    }),
    { label: "vt upload-url" }
  );
  if (!payload?.data || typeof payload.data !== "string") throw new Error("vt-upload-url-missing");
  return payload.data;
}

async function submitFileToVirusTotal(buffer, filename) {
  const apiKey = getVirusTotalApiKey();
  const target = buffer.length > VT_DIRECT_UPLOAD_LIMIT ? await getLargeUploadUrl() : `${VT_BASE}/files`;
  const form = new FormData();
  form.append("file", new Blob([buffer]), filename);

  const payload = await withRetry(
    () => fetchJson(target, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "x-apikey": apiKey
      },
      body: form
    }),
    { label: "vt file upload", retries: 2 }
  );

  return payload?.data?.id || null;
}

async function pollAnalysis(analysisId, state, { maxMs = 10 * 60 * 1000 } = {}) {
  state.stage = "analyzing";
  const start = Date.now();

  while (Date.now() - start < maxMs) {
    const apiKey = getVirusTotalApiKey();
    let payload;
    try {
      payload = await withRetry(
        () => fetchJson(`${VT_BASE}/analyses/${encodeURIComponent(analysisId)}`, {
          headers: {
            Accept: "application/json",
            "x-apikey": apiKey
          }
        }),
        { label: "vt analysis poll", retries: 2 }
      );
    } catch (error) {
      if (error?.status !== 429) throw error;
      const delay = Math.max(VT_POLL_INTERVAL_MS, error.retryAfterMs || 60_000);
      state.rateLimitedUntil = Date.now() + delay;
      await wait(delay);
      continue;
    }
    const attrs = payload?.data?.attributes || {};
    if (attrs.status === "completed") return summariseStats(attrs.stats);
    await wait(VT_POLL_INTERVAL_MS);
  }

  return null;
}

async function checkAnalysisOnce(analysisId) {
  try {
    const apiKey = getVirusTotalApiKey();
    const payload = await withRetry(
      () => fetchJson(`${VT_BASE}/analyses/${encodeURIComponent(analysisId)}`, {
        headers: {
          Accept: "application/json",
          "x-apikey": apiKey
        }
      }),
      { label: "vt analysis resume", retries: 1 }
    );
    const attrs = payload?.data?.attributes || {};
    return attrs.status === "completed" ? summariseStats(attrs.stats) : null;
  } catch (error) {
    console.warn("[tradedex] resume check failed", error.message || error);
    return null;
  }
}

async function runScan(state, cache) {
  try {
    const { sha256, buffer } = await downloadAndHash(state.asset.downloadUrl, state);

    state.stage = "querying";
    const lookup = await queryVirusTotalByHash(sha256);

    if (lookup.found) {
      state.vt = {
        status: "scanned",
        stats: lookup.summary,
        verdict: lookup.summary?.verdict || "clean",
        scanDate: lookup.scanDate,
        permalink: lookup.permalink,
        submitted: false
      };
    } else if (buffer && buffer.length <= VT_LARGE_UPLOAD_LIMIT) {
      state.stage = "submitting";
      const analysisId = await submitFileToVirusTotal(buffer, state.asset.name);
      let summary = await pollAnalysis(analysisId, state);

      if (!summary) {
        const recheck = await queryVirusTotalByHash(sha256).catch(() => null);
        if (recheck?.found && recheck.summary) summary = recheck.summary;
      }

      if (summary) {
        state.vt = {
          status: "scanned",
          stats: summary,
          verdict: summary.verdict,
          scanDate: Math.floor(Date.now() / 1000),
          permalink: `https://www.virustotal.com/gui/file/${sha256}`,
          submitted: true
        };
      } else {
        state.vt = {
          status: "pending",
          analysisId,
          permalink: `https://www.virustotal.com/gui/file/${sha256}`,
          submitted: true,
          queuedAt: Math.floor(Date.now() / 1000)
        };
      }
    } else {
      state.vt = {
        status: "not-scanned",
        reason: "file-too-large",
        permalink: `https://www.virustotal.com/gui/file/${sha256}`,
        sizeLimitBytes: VT_LARGE_UPLOAD_LIMIT
      };
    }

    state.status = "done";
    state.stage = "done";
    state.finishedAt = Date.now();
    cache.scans[state.tag] = {
      tag: state.tag,
      asset: state.asset,
      sha256: state.sha256,
      vt: state.vt,
      scannedAt: state.finishedAt
    };
    await writeCache(cache);
  } catch (error) {
    console.error(`[tradedex] scan error at stage=${state.stage || "unknown"}`, error.message || error);
    state.status = "error";
    state.stage = "error";
    state.error = error.message || "scan failed";
    state.finishedAt = Date.now();
    // Persist failures for this exact release too. A modal reopen must never
    // create a retry storm; the next GitHub release gets a fresh cache key.
    if (state.sha256) {
      cache.scans[state.tag] = {
        tag: state.tag,
        asset: state.asset,
        sha256: state.sha256,
        vt: state.vt || {
          status: "error",
          error: state.error,
          rateLimited: error?.status === 429
        },
        error: state.error,
        scannedAt: state.finishedAt
      };
      await writeCache(cache);
    }
  }
}

async function startScan(release) {
  const tag = release.tag;
  if (inflight.has(tag)) return inflight.get(tag);

  const state = {
    tag,
    asset: release.asset,
    status: "pending",
    stage: "init",
    progress: 0,
    sha256: null,
    vt: null,
    error: null,
    startedAt: Date.now(),
    finishedAt: null
  };
  inflight.set(tag, state);

  const cache = await readCache();
  runScan(state, cache).finally(() => {
    const ttl = state.status === "error" ? ERROR_STATE_TTL_MS : DONE_STATE_TTL_MS;
    setTimeout(() => {
      if (inflight.get(tag) === state) inflight.delete(tag);
    }, ttl);
  });

  return state;
}

async function getCachedReleaseScan(release, cache) {
  const cached = cache.scans[release.tag];
  if (!cached?.sha256 || !cached?.vt) return null;

  // Disk reads are intentionally side-effect free. In particular, frontend
  // polling must never turn into a VirusTotal request.
  return cached;
}

function resumePendingAnalysis(release, cached, cache) {
  if (inflight.has(release.tag) || cached.vt?.status !== "pending" || !cached.vt.analysisId) return;

  const state = {
    tag: release.tag,
    asset: release.asset,
    status: "scanning",
    stage: "analyzing",
    progress: 1,
    sha256: cached.sha256,
    vt: cached.vt,
    error: null,
    startedAt: Date.now(),
    finishedAt: null
  };
  inflight.set(release.tag, state);

  (async () => {
    try {
      const summary = await pollAnalysis(cached.vt.analysisId, state);
      if (summary) {
        state.vt = {
          status: "scanned",
          stats: summary,
          verdict: summary.verdict,
          scanDate: Math.floor(Date.now() / 1000),
          permalink: cached.vt.permalink,
          submitted: true
        };
      }
      state.status = "done";
      state.stage = "done";
      state.finishedAt = Date.now();
      cache.scans[release.tag] = {
        ...cached,
        vt: state.vt,
        scannedAt: state.finishedAt
      };
      await writeCache(cache);
    } catch (error) {
      state.status = "error";
      state.stage = "error";
      state.error = error.message || "analysis resume failed";
      state.finishedAt = Date.now();
    } finally {
      windowlessCleanup(release.tag, state);
    }
  })();
}

function windowlessCleanup(tag, state) {
  const ttl = state.status === "error" ? ERROR_STATE_TTL_MS : DONE_STATE_TTL_MS;
  setTimeout(() => {
    if (inflight.get(tag) === state) inflight.delete(tag);
  }, ttl);
}

export async function getTradeDexScan() {
  if (!getVirusTotalApiKey()) {
    return {
      statusCode: 500,
      body: {
        error: "missing-vt-key",
        message: "Falta configurar VIRUSTOTAL_API_KEY en el servidor."
      }
    };
  }

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
  const cached = await getCachedReleaseScan(release, cache);
  if (cached) {
    if (cached.vt?.status === "pending") resumePendingAnalysis(release, cached, cache);
    const pendingState = inflight.get(release.tag);
    if (pendingState) {
      return {
        statusCode: 200,
        body: {
          tag: release.tag,
          releaseUrl: release.htmlUrl,
          publishedAt: release.publishedAt,
          asset: release.asset,
          ...snapshotState(pendingState),
          fromCache: true
        }
      };
    }
    return {
      statusCode: cached.vt?.status === "error" ? 502 : 200,
      body: {
        tag: release.tag,
        releaseUrl: release.htmlUrl,
        publishedAt: release.publishedAt,
        asset: release.asset,
        status: cached.vt?.status === "error" ? "error" : "done",
        stage: cached.vt?.status === "error" ? "error" : "done",
        progress: 1,
        sha256: cached.sha256,
        vt: cached.vt,
        error: cached.error || cached.vt?.error || null,
        scannedAt: cached.scannedAt,
        fromCache: true
      }
    };
  }

  const state = inflight.get(release.tag) || await startScan(release);
  return {
    statusCode: 200,
    body: {
      tag: release.tag,
      releaseUrl: release.htmlUrl,
      publishedAt: release.publishedAt,
      asset: release.asset,
      ...snapshotState(state)
    }
  };
}

export async function getTradeDexInfo() {
  const release = await resolveLatestRelease();
  const cache = await readCache();
  const cached = release ? await getCachedReleaseScan(release, cache) : null;

  let scan = null;
  if (cached?.vt) {
    const stats = cached.vt.stats || null;
    scan = {
      status: cached.vt.status || "scanned",
      verdict: cached.vt.verdict || null,
      stats: stats
        ? {
            total: stats.total,
            clean: (stats.harmless || 0) + (stats.undetected || 0),
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0
          }
        : null,
      scannedAt: cached.scannedAt || null
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
      sendJson(response, 200, await getTradeDexInfo());
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
