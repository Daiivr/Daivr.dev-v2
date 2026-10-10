import { randomBytes } from "node:crypto";
import { appendFile, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { loadLocalEnv } from "../server/env.mjs";
import { decryptMusic, encryptMusic, MAX_MUSIC_BYTES, musicKey } from "../server/music-crypto.mjs";
import { musicCatalog } from "../shared/music-catalog.mjs";

const root = resolve(import.meta.dirname, "..");
const source = join(root, "private/music-source");
const destination = join(root, "private/music-encrypted");
loadLocalEnv(root);
await mkdir(destination, { recursive: true });
if (!process.env.MUSIC_ENCRYPTION_KEY) {
  if ((await readdir(destination)).some((name) => name.endsWith(".enc"))) {
    throw new Error("Encrypted files already exist. Restore their MUSIC_ENCRYPTION_KEY before continuing.");
  }
  const localEnv = await readFile(join(root, ".env.local"), "utf8").catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return "";
  });
  if (/^\s*MUSIC_ENCRYPTION_KEY\s*=/m.test(localEnv) || process.env.MUSIC_ENCRYPTION_KEY !== undefined) {
    throw new Error("Remove the empty MUSIC_ENCRYPTION_KEY declaration before generating a key.");
  }
  const generated = randomBytes(32).toString("hex");
  await appendFile(join(root, ".env.local"), `\n# Server-only music key; back up privately.\nMUSIC_ENCRYPTION_KEY=${generated}\n`, { mode: 0o600 });
  process.env.MUSIC_ENCRYPTION_KEY = generated;
  console.log("Created a server-only key in ignored .env.local (value not printed).");
}
const key = musicKey(process.env.MUSIC_ENCRYPTION_KEY);
for (const { id, file } of musicCatalog) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Invalid music ID.");
  const input = join(source, file);
  const info = await stat(input);
  if (!info.isFile() || info.size > MAX_MUSIC_BYTES) throw new Error(`Invalid or oversized source: ${id}`);
  const original = await readFile(input);
  const target = join(destination, `${id}.enc`);
  const existing = await readFile(target).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (existing && decryptMusic(existing, key, id).equals(original)) {
    console.log(`${id}: already encrypted and verified`);
    continue;
  }
  const encrypted = encryptMusic(original, key, id);
  if (!decryptMusic(encrypted, key, id).equals(original)) throw new Error(`Verification failed: ${id}`);
  await writeFile(`${target}.tmp`, encrypted);
  await rename(`${target}.tmp`, target);
  console.log(`${id}: encrypted and verified (${original.length} bytes)`);
}
