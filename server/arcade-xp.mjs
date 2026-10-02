import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { ensureDataFile, getDataFile } from "./storage.mjs";
import { clientKey, readJsonBody, sameOrigin } from "./http-guards.mjs";
import { addXpToState, normalizeXpState, xpRateCeiling } from "../shared/arcade-xp.mjs";

const ARCADE_XP_FILENAME = "arcade-xp.json";
const DEFAULT_XP_STATE = { level: 1, xp: 0, total: 0, updatedAt: null };

// Antes el POST aceptaba el estado entero y se quedaba con el total mas alto,
// asi que un solo {"total": 999999999} reescribia el nucleo de todo el mundo.
// Ahora solo se suman incrementos, y cada visitante tiene un cubo de fichas que
// se llena al ritmo maximo al que el canvas puede generar XP: lo que pida por
// encima de lo que ha podido ganar desde su ultima visita se recorta.
const MAX_DELTA = 10_000_000;
// El canvas guarda como mucho cada 15 s, asi que basta con unos minutos de
// margen para reintentos; lo que se acumula estando inactivo no pasa de aqui.
const BURST_SECONDS = 5 * 60;
// Tope global, por si alguien rota claves: nunca entra mas XP que la de este
// numero de visitantes jugando a la vez al maximo.
const GLOBAL_VISITOR_CEILING = 10;
const MAX_TRACKED_VISITORS = 5000;
const IDLE_VISITOR_MS = 60 * 60 * 1000;
const WRITE_DELAY_MS = 1500;

const visitors = new Map();
const globalBucket = { tokens: 0, at: Date.now() };
let state = null;
let writeTimer = null;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readArcadeXp() {
  if (state) return state;
  try {
    const file = ensureDataFile(ARCADE_XP_FILENAME, DEFAULT_XP_STATE);
    const saved = JSON.parse(readFileSync(file, "utf8"));
    state = { ...normalizeXpState(saved), updatedAt: saved?.updatedAt || null };
  } catch (error) {
    console.error("Arcade XP read error", error.message || error);
    state = { ...DEFAULT_XP_STATE };
  }
  return state;
}

// Se escribe en diferido y de forma atomica: con varios visitantes guardando a
// la vez seria una escritura por paquete, y un corte a mitad dejaria el JSON roto.
function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      const file = getDataFile(ARCADE_XP_FILENAME);
      const temporary = `${file}.${process.pid}.tmp`;
      writeFileSync(temporary, JSON.stringify(state, null, 2), "utf8");
      renameSync(temporary, file);
    } catch (error) {
      console.error("Arcade XP write error", error.message || error);
    }
  }, WRITE_DELAY_MS);
  writeTimer.unref?.();
}

function refill(bucket, rate, capacity, now) {
  bucket.tokens = Math.min(capacity, bucket.tokens + Math.max(0, now - bucket.at) / 1000 * rate);
  bucket.at = now;
}

function pruneVisitors(now) {
  if (visitors.size <= MAX_TRACKED_VISITORS) return;
  for (const [key, bucket] of visitors) {
    if (now - bucket.at > IDLE_VISITOR_MS || visitors.size > MAX_TRACKED_VISITORS) visitors.delete(key);
    if (visitors.size <= MAX_TRACKED_VISITORS * 0.9) break;
  }
}

// El cubo arranca vacio en el primer GET (el canvas siempre lee el nucleo al
// montar) y se va llenando con el tiempo real que el visitante pasa en la web.
function visitorBucket(key, now) {
  let bucket = visitors.get(key);
  if (bucket) visitors.delete(key);
  else bucket = { tokens: 0, at: now };
  visitors.set(key, bucket);
  pruneVisitors(now);
  return bucket;
}

export function creditArcadeXp(key, delta, now = Date.now()) {
  const current = readArcadeXp();
  const rate = xpRateCeiling(current.level);
  const bucket = visitorBucket(key, now);
  refill(bucket, rate, rate * BURST_SECONDS, now);
  refill(globalBucket, rate * GLOBAL_VISITOR_CEILING, rate * GLOBAL_VISITOR_CEILING * BURST_SECONDS, now);
  const accepted = Math.floor(Math.min(delta, bucket.tokens, globalBucket.tokens));
  if (accepted > 0) {
    bucket.tokens -= accepted;
    globalBucket.tokens -= accepted;
    state = { ...addXpToState(current, accepted), updatedAt: new Date(now).toISOString() };
    scheduleWrite();
  }
  return { ...state, accepted };
}

export function resetArcadeXpForTests(next = DEFAULT_XP_STATE, now = Date.now()) {
  state = { ...normalizeXpState(next), updatedAt: next.updatedAt || null };
  visitors.clear();
  globalBucket.tokens = 0;
  globalBucket.at = now;
}

export function registerArcadeXpVisitor(key, now = Date.now()) {
  visitorBucket(key, now);
}

export async function handleArcadeXpRequest(request, response) {
  if (request.method === "GET") {
    registerArcadeXpVisitor(clientKey(request));
    sendJson(response, 200, readArcadeXp());
    return;
  }

  if (request.method === "POST") {
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: "Cross-origin XP update rejected." });
      return;
    }
    let body;
    try {
      body = await readJsonBody(request, 1024);
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message });
      return;
    }
    const delta = Number(body.delta);
    if (!Number.isInteger(delta) || delta < 1 || delta > MAX_DELTA) {
      sendJson(response, 400, { error: "Send the XP gained since the last save as a positive whole number." });
      return;
    }
    sendJson(response, 200, creditArcadeXp(clientKey(request), delta));
    return;
  }

  sendJson(response, 405, { error: "Arcade XP method not allowed." });
}
