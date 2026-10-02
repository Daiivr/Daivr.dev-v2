import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { ensureDataFile, getDataFile } from "./storage.mjs";
import { clientKey, sameOrigin } from "./http-guards.mjs";

const VISITS_FILENAME = "visits.json";
// Una visita es una sesion: recargar o volver dentro de este margen no suma.
// La ventana se desliza con cada peticion, como la sesion de cualquier analitica.
export const VISIT_WINDOW_MS = 30 * 60 * 1000;
const MAX_TRACKED_VISITORS = 20_000;
const WRITE_DELAY_MS = 1500;

const recentVisitors = new Map();
let count = null;
let writeTimer = null;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readCount() {
  if (count !== null) return count;
  try {
    const data = JSON.parse(readFileSync(ensureDataFile(VISITS_FILENAME, { count: 0 }), "utf8"));
    count = typeof data.count === "number" && data.count >= 0 ? Math.floor(data.count) : 0;
  } catch (error) {
    console.error("Visits read error", error.message || error);
    count = 0;
  }
  return count;
}

function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      const file = getDataFile(VISITS_FILENAME);
      const temporary = `${file}.${process.pid}.tmp`;
      writeFileSync(temporary, JSON.stringify({ count }, null, 2), "utf8");
      renameSync(temporary, file);
    } catch (error) {
      console.error("Visits write error", error.message || error);
    }
  }, WRITE_DELAY_MS);
  writeTimer.unref?.();
}

function forgetStaleVisitors(now) {
  if (recentVisitors.size <= MAX_TRACKED_VISITORS) return;
  // El Map va en orden de ultima actividad, asi que los primeros son los mas viejos.
  for (const [key, seenAt] of recentVisitors) {
    if (now - seenAt < VISIT_WINDOW_MS && recentVisitors.size <= MAX_TRACKED_VISITORS) break;
    recentVisitors.delete(key);
  }
}

export function registerVisit(key, now = Date.now()) {
  const total = readCount();
  const seenAt = recentVisitors.get(key);
  recentVisitors.delete(key);
  recentVisitors.set(key, now);
  forgetStaleVisitors(now);
  if (seenAt !== undefined && now - seenAt < VISIT_WINDOW_MS) return { count: total, counted: false };
  count = total + 1;
  scheduleWrite();
  return { count, counted: true };
}

export function resetVisitsForTests(value = 0) {
  count = value;
  recentVisitors.clear();
}

export async function handleVisitsRequest(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  const parts = url.pathname.replace(/^\/api\/visits\/?/, "").split("/").filter(Boolean);

  if (request.method === "GET" && parts.length === 0) {
    sendJson(response, 200, { count: readCount() });
    return;
  }

  if (request.method === "POST" && parts.length === 1 && parts[0] === "hit") {
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: "Cross-origin visit rejected." });
      return;
    }
    const userAgent = String(request.headers?.["user-agent"] || "").slice(0, 200);
    sendJson(response, 200, registerVisit(clientKey(request, userAgent)));
    return;
  }

  sendJson(response, 404, { error: "Visits route not found." });
}
