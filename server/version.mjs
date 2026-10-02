import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { BUILD_STAMP_FILE } from "../shared/build-stamp.mjs";

// /api/version: que build esta sirviendo ahora este servidor (dist/version.json,
// que escribe el build). Las pestañas abiertas lo comparan con el suyo para
// saber si se quedaron en una version vieja.
//
// Sin cache en ningun sitio (ni navegador ni Cloudflare): una respuesta vieja
// es justo lo que no puede pasar aqui. En el servidor se relee el archivo solo
// si cambio, y como mucho se mira cada pocos segundos aunque llegue una
// avalancha de pestañas a la vez (todas se reconectan juntas tras un deploy).

const RECHECK_MS = 5000;
let cache = { file: "", checkedAt: 0, mtimeMs: -1, stamp: null };

export async function readBuildStamp(root = process.cwd(), now = Date.now()) {
  const file = join(root, "dist", BUILD_STAMP_FILE);
  if (cache.file === file && now - cache.checkedAt < RECHECK_MS) return cache.stamp;
  try {
    const { mtimeMs } = await stat(file);
    if (cache.file !== file || mtimeMs !== cache.mtimeMs) {
      const parsed = JSON.parse(await readFile(file, "utf8"));
      const stamp = parsed && typeof parsed.build === "string" ? {
        build: parsed.build,
        version: String(parsed.version || ""),
        codename: String(parsed.codename || ""),
        summary: String(parsed.summary || ""),
        builtAt: String(parsed.builtAt || "")
      } : null;
      cache = { file, checkedAt: now, mtimeMs, stamp };
    } else {
      cache.checkedAt = now;
    }
  } catch {
    // Sin build (desarrollo) o archivo roto: nadie recibe avisos.
    cache = { file, checkedAt: now, mtimeMs: -1, stamp: null };
  }
  return cache.stamp;
}

export function resetBuildStampForTests() {
  cache = { file: "", checkedAt: 0, mtimeMs: -1, stamp: null };
}

export async function handleVersionRequest(request, response, { root } = {}) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Allow: "GET, HEAD" });
    response.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }
  const stamp = await readBuildStamp(root);
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(request.method === "HEAD" ? undefined : JSON.stringify(stamp || { build: null }));
}
