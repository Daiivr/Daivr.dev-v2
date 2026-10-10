import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { musicCatalog } from "../shared/music-catalog.mjs";
import { decryptMusic, MAX_MUSIC_BYTES, MUSIC_HEADER_BYTES, musicKey } from "./music-crypto.mjs";

const trackIds = new Set(musicCatalog.map(({ id }) => id));

export function createMusicHandler({
  directory = fileURLToPath(new URL("../private/music-encrypted/", import.meta.url)),
  getKey = () => process.env.MUSIC_ENCRYPTION_KEY,
} = {}) {
  // Bounded memory cache avoids repeated decryption on seeks. Never write plaintext.
  const cache = new Map();
  const pending = new Map();
  let cacheBytes = 0;
  let key;

  async function load(id) {
    key ??= musicKey(getKey());
    const file = join(directory, `${id}.enc`);
    const info = await stat(file);
    if (!info.isFile() || info.size > MAX_MUSIC_BYTES + MUSIC_HEADER_BYTES) throw new Error("Invalid music file.");
    const signature = `${info.mtimeMs}:${info.size}`;
    const cached = cache.get(id);
    if (cached?.signature === signature) {
      cache.delete(id);
      cache.set(id, cached);
      return cached.data;
    }
    if (pending.has(id)) return pending.get(id);
    if (pending.size >= 4) throw new Error("Music server busy.");
    const job = (async () => {
      const data = decryptMusic(await readFile(file), key, id);
      if (cache.has(id)) {
        cacheBytes -= cache.get(id).data.length;
        cache.delete(id);
      }
      while (cacheBytes + data.length > MAX_MUSIC_BYTES && cache.size) {
        const oldest = cache.keys().next().value;
        cacheBytes -= cache.get(oldest).data.length;
        cache.delete(oldest);
      }
      cache.set(id, { signature, data });
      cacheBytes += data.length;
      return data;
    })();
    pending.set(id, job);
    try { return await job; } finally { pending.delete(id); }
  }

  return async function handleMusicRequest(request, response) {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    const fail = (status, message, headers = {}) => {
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", ...headers });
      response.end(request.method === "HEAD" ? undefined : message);
    };
    const path = new URL(request.url || "/", "http://localhost").pathname;
    const id = path.match(/^\/api\/music\/([a-z0-9-]+)$/)?.[1];
    if (!trackIds.has(id)) return fail(404, "Track not found.");
    if (!["GET", "HEAD"].includes(request.method)) return fail(405, "Method not allowed.", { Allow: "GET, HEAD" });
    let data;
    try { data = await load(id); }
    catch {
      // Fail closed, with no public MP3 fallback or secret/path details in errors.
      return fail(503, "Music is temporarily unavailable.", { "Retry-After": "30" });
    }
    response.setHeader("Accept-Ranges", "bytes");
    let start = 0;
    let end = data.length - 1;
    // Range applies to GET. Ignore it on HEAD or if If-Range cannot be validated.
    const range = request.method === "GET" && !request.headers["if-range"] ? request.headers.range : null;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return fail(416, "Invalid byte range.", { "Content-Range": `bytes */${data.length}` });
      start = match[1] ? Number(match[1]) : Math.max(0, data.length - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= data.length) {
        return fail(416, "Invalid byte range.", { "Content-Range": `bytes */${data.length}` });
      }
    }
    response.writeHead(range ? 206 : 200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": end - start + 1,
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${data.length}` } : {}),
    });
    response.end(request.method === "HEAD" ? undefined : data.subarray(start, end + 1));
  };
}

export const handleMusicRequest = createMusicHandler();
