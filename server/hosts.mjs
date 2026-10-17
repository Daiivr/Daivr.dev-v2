import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { hostAssets } from "../shared/host-assets.mjs";
import { decryptHost, hostKey, HOST_HEADER_BYTES, MAX_HOST_BYTES } from "./host-crypto.mjs";

const ids = new Set(hostAssets.map(({ id }) => id));

export function createHostHandler({
  directory = fileURLToPath(new URL("../private/hosts-encrypted/", import.meta.url)),
  getKey = () => process.env.HOST_ENCRYPTION_KEY
} = {}) {
  const cache = new Map(), pending = new Map();
  let cacheBytes = 0, key;
  async function load(id) {
    key ??= hostKey(getKey());
    const file = join(directory, `${id}.enc`);
    const info = await stat(file);
    if (!info.isFile() || info.size > MAX_HOST_BYTES + HOST_HEADER_BYTES) throw new Error("Invalid host asset.");
    const signature = `${info.mtimeMs}:${info.size}`;
    const cached = cache.get(id);
    if (cached?.signature === signature) {
      cache.delete(id); cache.set(id, cached);
      return cached.data;
    }
    if (pending.has(id)) return pending.get(id);
    if (pending.size >= 4) throw new Error("Host server busy.");
    const job = (async () => {
      const data = decryptHost(await readFile(file), key, id);
      if (cache.has(id)) { cacheBytes -= cache.get(id).data.length; cache.delete(id); }
      while (cacheBytes + data.length > MAX_HOST_BYTES && cache.size) {
        const oldest = cache.keys().next().value;
        cacheBytes -= cache.get(oldest).data.length; cache.delete(oldest);
      }
      cache.set(id, { signature, data }); cacheBytes += data.length;
      return data;
    })();
    pending.set(id, job);
    try { return await job; } finally { pending.delete(id); }
  }
  return async function handleHostRequest(request, response) {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    const fail = (status, message, headers = {}) => {
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", ...headers });
      response.end(request.method === "HEAD" ? undefined : message);
    };
    const path = new URL(request.url || "/", "http://localhost").pathname;
    const id = path.match(/^\/api\/hosts\/([a-z0-9-]+)$/)?.[1];
    if (!ids.has(id)) return fail(404, "Host asset not found.");
    if (!["GET", "HEAD"].includes(request.method)) return fail(405, "Method not allowed.", { Allow: "GET, HEAD" });
    let data;
    try { data = await load(id); }
    catch { return fail(503, "Host is temporarily unavailable.", { "Retry-After": "30" }); }
    response.writeHead(200, { "Content-Type": "model/gltf-binary", "Content-Length": data.length });
    response.end(request.method === "HEAD" ? undefined : data);
  };
}

export const handleHostRequest = createHostHandler();
