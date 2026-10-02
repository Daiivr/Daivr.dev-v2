// Aviso de version nueva (UpdateNotice, comando `version`): esta pestaña sabe
// que build tiene por los <meta> que puso el build, y /api/version dice cual
// sirve ahora el servidor. Ver shared/build-stamp.mjs.
//
// Sin acceso a document/window al importarse: los tests de la consola lo cargan
// en Node.

import { BUILD_META, compareBuilds, decodeRelease, DEV_BUILD, RELEASE_META, VERSION_ENDPOINT } from "../../shared/build-stamp.mjs";
import { recordGateReturn } from "./gateReturn.js";

// Cada cuanto se mira con la pestaña a la vista, y el minimo entre dos miradas
// (volver a la pestaña o reconectarse no repite la pregunta en bucle).
export const UPDATE_CHECK_MS = 10 * 60_000;
export const UPDATE_MIN_GAP_MS = 45_000;
// La primera, cuando ya se ha asentado la carga.
export const UPDATE_FIRST_CHECK_MS = 20_000;
// "Later" esconde el aviso en una pastilla; pasado esto vuelve a abrirse.
export const UPDATE_SNOOZE_MS = 30 * 60_000;

const RELOAD_SPOT_KEY = "daivr.updateSpot.v1";
const RELOAD_SPOT_TTL_MS = 10 * 60_000;
// Tan cerca del final cuenta como "estaba abajo del todo" (el footer, pescando).
const BOTTOM_SLACK_PX = 160;

// La build de esta pestaña.
export function currentBuild(doc = globalThis.document) {
  const read = (name) => doc?.querySelector?.(`meta[name="${name}"]`)?.getAttribute("content") || "";
  return { build: read(BUILD_META), ...decodeRelease(read(RELEASE_META)) };
}

export async function fetchLatestBuild(fetcher = globalThis.fetch) {
  const response = await fetcher(VERSION_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// null si esta al dia o no se puede saber; si no, lo que trae la version nueva.
export async function checkForUpdate({ fetcher, doc } = {}) {
  const current = currentBuild(doc);
  // En desarrollo (o un index.html sin sello) no hay con que comparar.
  if (!current.build || current.build === DEV_BUILD) return null;
  return compareBuilds(current, await fetchLatestBuild(fetcher));
}

// Donde estaba: abajo del todo, o la ultima seccion que ya habia pasado.
function readSpot(shell) {
  if (!shell) return null;
  if (shell.scrollTop + shell.clientHeight >= shell.scrollHeight - BOTTOM_SLACK_PX) return { at: "bottom" };
  const top = shell.getBoundingClientRect().top;
  const passed = [...shell.querySelectorAll("main section[id]")].filter((section) => section.getBoundingClientRect().top - top <= 120);
  const section = passed.at(-1);
  return section ? { at: "section", id: section.id } : null;
}

// Recarga para coger la version nueva. La puerta saluda en consecuencia (nota
// "updated" de gateReturn) y, al entrar, el armario vuelve a donde estaba.
export function reloadIntoUpdate({ shell = null } = {}) {
  recordGateReturn("updated", "/", { from: currentBuild().version });
  try {
    const spot = readSpot(shell);
    if (spot) window.sessionStorage.setItem(RELOAD_SPOT_KEY, JSON.stringify({ ...spot, savedAt: Date.now() }));
  } catch {
    // Sin sessionStorage se vuelve arriba del todo, como en cualquier recarga.
  }
  window.location.reload();
}

export function consumeReloadSpot() {
  try {
    const raw = window.sessionStorage.getItem(RELOAD_SPOT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(RELOAD_SPOT_KEY);
    const spot = JSON.parse(raw);
    if (!spot || Date.now() - Number(spot.savedAt) > RELOAD_SPOT_TTL_MS) return null;
    if (spot.at === "bottom") return { at: "bottom" };
    return spot.at === "section" && typeof spot.id === "string" ? { at: "section", id: spot.id } : null;
  } catch {
    return null;
  }
}

export function restoreReloadSpot(shell, spot) {
  if (!shell || !spot) return;
  if (spot.at === "bottom") shell.scrollTo({ top: shell.scrollHeight, behavior: "instant" });
  else document.getElementById(spot.id)?.scrollIntoView({ block: "start", behavior: "instant" });
}
