import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LOCAL_DATA_DIR = join(process.cwd(), "data");
const RENDER_DATA_DIR = "/var/data";

function getRenderDataDir() {
  try {
    return existsSync(RENDER_DATA_DIR) ? RENDER_DATA_DIR : null;
  } catch {
    return null;
  }
}

export function getDataDir() {
  return (
    process.env.COMMENTS_DATA_DIR ||
    process.env.DATA_DIR ||
    process.env.RENDER_DATA_DIR ||
    getRenderDataDir() ||
    LOCAL_DATA_DIR
  );
}

export function getDataFile(filename) {
  return join(getDataDir(), filename);
}

export function ensureDataFile(filename, defaultValue) {
  const file = getDataFile(filename);
  const legacyFile = join(LOCAL_DATA_DIR, filename);
  const dir = dirname(file);

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(file)) return file;

  if (resolve(file) !== resolve(legacyFile) && existsSync(legacyFile)) {
    writeFileSync(file, readFileSync(legacyFile, "utf8"), "utf8");
    return file;
  }

  writeFileSync(file, JSON.stringify(defaultValue, null, 2), "utf8");
  return file;
}
