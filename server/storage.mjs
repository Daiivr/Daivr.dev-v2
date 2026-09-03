import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LOCAL_DATA_DIR = join(process.cwd(), "data");
const RENDER_DATA_DIR = "/var/data";

// Se anuncia una vez por ruta para que en los logs de Render se vea si los datos
// van al disco persistente o al data/ del repo, que se borra en cada despliegue.
const announcedDirs = new Set();

function getRenderDataDir() {
  try {
    return existsSync(RENDER_DATA_DIR) ? RENDER_DATA_DIR : null;
  } catch {
    return null;
  }
}

export function getDataDir(envNames = []) {
  const envOverride = envNames.map((name) => process.env[name]).find(Boolean);
  const dir =
    envOverride ||
    process.env.DATA_DIR ||
    process.env.RENDER_DATA_DIR ||
    getRenderDataDir() ||
    LOCAL_DATA_DIR;

  if (!announcedDirs.has(dir)) {
    announcedDirs.add(dir);
    const ephemeral = resolve(dir) === resolve(LOCAL_DATA_DIR);
    console.log(
      `[storage] data dir: ${dir}${ephemeral ? " (EPHEMERAL - wiped on every deploy; mount a disk or set DATA_DIR/RENDER_DATA_DIR)" : ""}`
    );
  }

  return dir;
}

export function getDataFile(filename, envNames = []) {
  return join(getDataDir(envNames), filename);
}

export function ensureDataFile(filename, defaultValue, envNames = []) {
  const file = getDataFile(filename, envNames);
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
