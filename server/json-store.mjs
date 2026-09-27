import { closeSync, existsSync, fsyncSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

// Single-process transactions: callers read and write without an intervening await.
// Keep the previous valid revision plus seven rotating daily recovery snapshots.
export function readJsonStore(name, fallback, envs = [], validate = () => true) {
  const file = getDataFile(name, envs);
  const paths = [file, `${file}.bak`, ...Array.from({ length: 7 }, (_, i) => `${file}.day-${(new Date().getUTCDay() - i + 7) % 7}.bak`)];
  if (!paths.some(existsSync)) ensureDataFile(name, fallback, envs);
  for (const path of paths) {
    if (!existsSync(path)) continue;
    try {
      const data = JSON.parse(readFileSync(path, "utf8"));
      if (!validate(data)) continue;
      if (path !== file) {
        console.error(`[storage] Recovering ${name} from ${path}`);
        atomicWrite(file, data);
      }
      return data;
    } catch { /* Try another recovery copy; never silently replace corrupt data. */ }
  }
  throw new Error(`Cannot read ${name}; restore a valid backup before writing.`);
}

function atomicWrite(file, value) {
  const temp = `${file}.${process.pid}.tmp`;
  try {
    const fd = openSync(temp, "w", 0o600);
    try { writeFileSync(fd, JSON.stringify(value, null, 2), "utf8"); fsyncSync(fd); }
    finally { closeSync(fd); }
    renameSync(temp, file);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}

export function writeJsonStore(name, value, fallback, envs = [], validate = () => true) {
  if (!validate(value)) throw new Error(`Invalid ${name} data.`);
  const previous = readJsonStore(name, fallback, envs, validate);
  const file = ensureDataFile(name, fallback, envs);
  atomicWrite(`${file}.bak`, previous);
  const day = `${file}.day-${new Date().getUTCDay()}.bak`;
  // The day's last healthy revision is retained independently of the main file.
  atomicWrite(day, previous);
  atomicWrite(file, value);
}
