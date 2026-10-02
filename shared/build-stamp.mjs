// Huella de cada build, para avisar a las pestañas que se quedaron en una
// version vieja (hay quien deja a Buddy pescando horas sin recargar).
//
// - El build (vite.config.js) calcula un id a partir de los nombres de los
//   archivos que genera. Vite les pone el hash del contenido, asi que el id
//   cambia si y solo si cambia algo que el navegador descarga: un deploy que
//   solo toca el servidor no molesta a nadie.
// - Ese id y la ultima nota de parche van en dos <meta> del index.html (lo que
//   la pestaña tiene) y en dist/version.json (lo que el servidor sirve ahora,
//   via /api/version).
// - La pestaña compara las dos y, si no coinciden, avisa.
//
// Sin dependencias de Node ni del navegador: lo importan los tres lados.

export const BUILD_META = "daivr-build";
export const RELEASE_META = "daivr-release";
export const BUILD_STAMP_FILE = "version.json";
export const VERSION_ENDPOINT = "/api/version";
// Sin build (servidor de desarrollo): no hay nada que comparar.
export const DEV_BUILD = "dev";

// Lo que no cuenta para el id: el propio index.html (lleva el id dentro), el
// manifiesto de Vite, este archivo y los mapas de codigo.
function countsForBuild(fileName) {
  return !/\.html$/i.test(fileName)
    && !fileName.startsWith(".vite/")
    && fileName !== BUILD_STAMP_FILE
    && !/\.map$/i.test(fileName);
}

// FNV-1a de 64 bits sobre la lista ordenada: estable entre maquinas y sin
// depender de node:crypto (este modulo tambien viaja al navegador).
export function buildIdFromFiles(fileNames) {
  const text = [...fileNames].filter(countsForBuild).sort().join("\n");
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(36).padStart(13, "0");
}

// La ultima nota de parche (la primera de la lista) como "release".
export function releaseFrom(patchNotes) {
  const latest = Array.isArray(patchNotes) ? patchNotes[0] : null;
  if (!latest?.version) return { version: "", codename: "", summary: "" };
  return {
    version: String(latest.version),
    codename: String(latest.codename || ""),
    summary: String(latest.summary || "")
  };
}

// "v2.59.0|OPEN HOUSE" en el <meta>, para no meter JSON en un atributo.
export function encodeRelease({ version = "", codename = "" } = {}) {
  return `${version}|${codename}`;
}

export function decodeRelease(value) {
  const [version = "", codename = ""] = String(value || "").split("|");
  return { version: version.trim(), codename: codename.trim() };
}

// ¿Hay una version mas nueva que la de esta pestaña? Devuelve null si no (o si
// no se puede saber), o lo que hay que contar de la nueva.
export function compareBuilds(current, latest) {
  if (!current?.build || current.build === DEV_BUILD) return null;
  if (!latest?.build || latest.build === DEV_BUILD || latest.build === current.build) return null;
  const version = String(latest.version || "");
  return {
    build: String(latest.build),
    version,
    codename: String(latest.codename || ""),
    summary: String(latest.summary || ""),
    // Hay nota de parche nueva, o solo arreglos sin version propia.
    newRelease: Boolean(version) && version !== current.version
  };
}
