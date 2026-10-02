import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { canProxyGif } from "../shared/comment-gifs.mjs";
import { readCommentGif } from "./comment-gif-download.mjs";
import { getDataDir } from "./storage.mjs";

// Vista previa de los GIF del libro de visitas: el primer fotograma, recortado
// del GIF original sin recodificar nada (cabecera + paleta + primera imagen +
// fin de archivo). Un GIF de 10,7 MB se queda en ~50 KB, y el GIF completo
// solo se descarga cuando alguien lo abre.

const PREVIEW_MAX_BYTES = 8 * 1024 * 1024;
const MEMORY_LIMIT = 40;
const memory = new Map();
const inFlight = new Map();

const failure = (message, status) => Object.assign(new Error(message), { status });

function skipSubBlocks(bytes, offset) {
  let cursor = offset;
  while (cursor < bytes.length) {
    const size = bytes[cursor];
    cursor += 1;
    if (size === 0) return cursor;
    cursor += size;
  }
  return -1;
}

// Devuelve el GIF de un solo fotograma, o null si aun faltan bytes para
// completar el primero. Lanza si no es un GIF.
export function firstGifFrame(bytes) {
  if (bytes.length < 6 || !["GIF87a", "GIF89a"].includes(bytes.toString("latin1", 0, 6))) throw failure("Not a GIF.", 415);
  if (bytes.length < 13) return null;
  let cursor = 13;
  const screenFlags = bytes[10];
  if (screenFlags & 0x80) cursor += 3 * (1 << ((screenFlags & 7) + 1));
  if (cursor > bytes.length) return null;
  const header = bytes.subarray(0, cursor);
  let graphicControl = null;
  while (cursor < bytes.length) {
    const marker = bytes[cursor];
    if (marker === 0x21) {
      if (cursor + 2 > bytes.length) return null;
      const end = skipSubBlocks(bytes, cursor + 2);
      if (end < 0) return null;
      // Solo se conserva el control grafico (transparencia); las extensiones de
      // aplicacion (bucle NETSCAPE) o comentarios sobran en una imagen fija.
      if (bytes[cursor + 1] === 0xf9) graphicControl = bytes.subarray(cursor, end);
      cursor = end;
    } else if (marker === 0x2c) {
      if (cursor + 11 > bytes.length) return null;
      let data = cursor + 10;
      const imageFlags = bytes[cursor + 9];
      if (imageFlags & 0x80) data += 3 * (1 << ((imageFlags & 7) + 1));
      const end = skipSubBlocks(bytes, data + 1);
      if (end < 0) return null;
      return Buffer.concat([header, ...(graphicControl ? [graphicControl] : []), bytes.subarray(cursor, end), Buffer.from([0x3b])]);
    } else if (marker === 0x3b) {
      throw failure("The GIF has no frames.", 415);
    } else {
      throw failure("The GIF is malformed.", 415);
    }
  }
  return null;
}

function cachePath(url) {
  const name = createHash("sha256").update(url).digest("hex").slice(0, 40);
  return join(getDataDir(["COMMENTS_DATA_DIR"]), "gif-previews", `${name}.gif`);
}

function remember(url, bytes) {
  memory.delete(url);
  memory.set(url, bytes);
  while (memory.size > MEMORY_LIMIT) memory.delete(memory.keys().next().value);
}

async function buildPreview(url, fetcher) {
  const file = cachePath(url);
  if (existsSync(file)) return readFileSync(file);
  const { early } = await readCommentGif(url, fetcher, { maxBytes: PREVIEW_MAX_BYTES, until: firstGifFrame });
  if (!early) throw failure("The GIF has no complete first frame.", 415);
  try {
    mkdirSync(join(file, ".."), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, early);
    renameSync(temporary, file);
  } catch (error) {
    console.error("[gif-preview] cache write failed", error.message);
  }
  return early;
}

// `isAttached` limita el endpoint a los GIF que estan en el libro de visitas:
// sin eso cualquiera podria hacer que el servidor descargase GIF ajenos.
export async function commentGifPreview(url, { isAttached, fetcher = fetch }) {
  if (!canProxyGif(url)) throw failure("This GIF host does not support previews.", 400);
  const key = new URL(url).href;
  if (memory.has(key)) {
    const bytes = memory.get(key);
    remember(key, bytes);
    return bytes;
  }
  if (!isAttached(key)) throw failure("This GIF is not attached to the guestbook.", 404);
  if (!inFlight.has(key)) {
    inFlight.set(key, buildPreview(key, fetcher)
      .then((bytes) => {
        remember(key, bytes);
        return bytes;
      })
      .finally(() => inFlight.delete(key)));
  }
  return inFlight.get(key);
}

export function resetGifPreviewsForTests() {
  memory.clear();
  inFlight.clear();
}
