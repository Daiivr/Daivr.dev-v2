import { extname, join, resolve } from "node:path";
import { readFileSync } from "node:fs";

export function loadHashedAssets(staticRoot) {
  try {
    const manifest = JSON.parse(readFileSync(join(staticRoot, ".vite", "manifest.json"), "utf8"));
    return new Set(Object.values(manifest).flatMap((entry) => [entry.file, ...(entry.css || []), ...(entry.assets || [])]).filter(Boolean).map((file) => resolve(staticRoot, file)));
  } catch { return new Set(); } // Safe fallback for older builds: revalidate everything.
}

export function getCacheControl(filePath, hashedAssets = new Set()) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".html") return "no-cache";
  // Vite emits content hashes; public/ files retain their names and must revalidate.
  if (hashedAssets.has(resolve(filePath))) return "public, max-age=31536000, immutable";
  return "public, max-age=0, must-revalidate";
}
