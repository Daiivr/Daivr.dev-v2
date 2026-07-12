import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSessionUser } from "./comments.mjs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

const BUDDY_FILENAME = "buddy-friendship.json";
const BUDDY_DATA_ENVS = ["COMMENTS_DATA_DIR"];
const MAX_PROGRESS = 999999;
const MAX_COLLECTION_SIZE = 256;

const EMPTY_ADVENTURE = Object.freeze({
  seenCartridges: [],
  terminalClicks: 0,
  midnightWakeups: 0,
  spotifySignals: 0,
  guestbookPings: 0,
  voidCatches: 0,
  totalCatches: 0,
  fishCollection: {},
  foundObjects: {},
  leviathanSightings: 0,
  bugsDefeated: 0,
  completed: [],
  inventory: []
});

// Pets acumulados necesarios para cada nivel (nivel = indice + 1).
const LEVEL_THRESHOLDS = [0, 10, 25, 60, 120];

function levelForPets(pets) {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (pets >= threshold) level = index + 1;
  });
  return level;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function boundedCount(value) {
  return Math.max(0, Math.min(MAX_PROGRESS, Math.floor(Number(value) || 0)));
}

function safeId(value) {
  const id = String(value || "").trim().slice(0, 80);
  if (!id || /[\u0000-\u001f\u007f]/.test(id)) return "";
  if (["__proto__", "prototype", "constructor"].includes(id.toLowerCase())) return "";
  return id;
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(safeId).filter(Boolean))].slice(0, MAX_COLLECTION_SIZE);
}

function normalizeCounterMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).slice(0, MAX_COLLECTION_SIZE).reduce((result, [rawId, rawCount]) => {
    const id = safeId(rawId);
    const count = boundedCount(rawCount);
    if (id && count) result[id] = count;
    return result;
  }, {});
}

function normalizeAdventure(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const adventure = {
    ...EMPTY_ADVENTURE,
    seenCartridges: normalizeIdList(source.seenCartridges),
    terminalClicks: boundedCount(source.terminalClicks),
    midnightWakeups: boundedCount(source.midnightWakeups),
    spotifySignals: boundedCount(source.spotifySignals),
    guestbookPings: boundedCount(source.guestbookPings),
    voidCatches: boundedCount(source.voidCatches),
    totalCatches: boundedCount(source.totalCatches),
    fishCollection: normalizeCounterMap(source.fishCollection),
    foundObjects: normalizeCounterMap(source.foundObjects),
    leviathanSightings: boundedCount(source.leviathanSightings),
    bugsDefeated: boundedCount(source.bugsDefeated),
    completed: normalizeIdList(source.completed),
    inventory: normalizeIdList(source.inventory)
  };
  adventure.totalCatches = Math.max(adventure.totalCatches, adventure.voidCatches);
  return adventure;
}

function mergeCounterMaps(left, right) {
  const merged = { ...left };
  Object.entries(right).forEach(([id, count]) => {
    merged[id] = Math.max(merged[id] || 0, count);
  });
  return merged;
}

function mergeAdventure(storedValue, incomingValue) {
  const stored = normalizeAdventure(storedValue);
  const incoming = normalizeAdventure(incomingValue);
  return {
    seenCartridges: normalizeIdList([...stored.seenCartridges, ...incoming.seenCartridges]),
    terminalClicks: Math.max(stored.terminalClicks, incoming.terminalClicks),
    midnightWakeups: Math.max(stored.midnightWakeups, incoming.midnightWakeups),
    spotifySignals: Math.max(stored.spotifySignals, incoming.spotifySignals),
    guestbookPings: Math.max(stored.guestbookPings, incoming.guestbookPings),
    voidCatches: Math.max(stored.voidCatches, incoming.voidCatches),
    totalCatches: Math.max(stored.totalCatches, incoming.totalCatches),
    fishCollection: mergeCounterMaps(stored.fishCollection, incoming.fishCollection),
    foundObjects: mergeCounterMaps(stored.foundObjects, incoming.foundObjects),
    leviathanSightings: Math.max(stored.leviathanSightings, incoming.leviathanSightings),
    bugsDefeated: Math.max(stored.bugsDefeated, incoming.bugsDefeated),
    completed: normalizeIdList([...stored.completed, ...incoming.completed]),
    inventory: normalizeIdList([...stored.inventory, ...incoming.inventory])
  };
}

function buddyPayload(userId, entry = {}) {
  const pets = boundedCount(entry.pets);
  return {
    user: userId || null,
    pets,
    level: levelForPets(pets),
    adventure: normalizeAdventure(entry.adventure),
    hiddenGear: normalizeIdList(entry.hiddenGear),
    hasLoadout: entry.hasLoadout === true
  };
}

function ensureBuddyFile() {
  const targetFile = getDataFile(BUDDY_FILENAME, BUDDY_DATA_ENVS);
  const previousFile = getDataFile(BUDDY_FILENAME);
  const shouldMigrate = resolve(targetFile) !== resolve(previousFile) && !existsSync(targetFile) && existsSync(previousFile);
  ensureDataFile(BUDDY_FILENAME, {}, BUDDY_DATA_ENVS);
  if (shouldMigrate) writeFileSync(targetFile, readFileSync(previousFile, "utf8"), "utf8");
  return targetFile;
}

function readStore() {
  const file = ensureBuddyFile();
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    return value && typeof value === "object" ? value : {};
  } catch (error) {
    console.error("Buddy store read error", error.message || error);
    return {};
  }
}

function writeStore(store) {
  writeFileSync(ensureBuddyFile(), JSON.stringify(store, null, 2), "utf8");
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function handleBuddyRequest(request, response) {
  const user = getSessionUser(request);

  if (request.method === "GET") {
    const entry = user ? readStore()[user.id] || {} : {};
    sendJson(response, 200, buddyPayload(user?.id, entry));
    return;
  }

  if (request.method === "POST") {
    if (!user) {
      sendJson(response, 401, { error: "Discord login required to sync buddy friendship.", guest: true });
      return;
    }

    const body = await readBody(request);
    const store = readStore();
    const entry = store[user.id] && typeof store[user.id] === "object" ? store[user.id] : {};

    if (body.action === "sync-adventure") {
      const adventure = mergeAdventure(entry.adventure, body.adventure);
      store[user.id] = { ...entry, adventure, updatedAt: new Date().toISOString() };
      writeStore(store);
      sendJson(response, 200, buddyPayload(user.id, store[user.id]));
      return;
    }

    if (body.action === "save-loadout") {
      store[user.id] = {
        ...entry,
        hiddenGear: normalizeIdList(body.hiddenGear),
        hasLoadout: true,
        updatedAt: new Date().toISOString()
      };
      writeStore(store);
      sendJson(response, 200, buddyPayload(user.id, store[user.id]));
      return;
    }

    const stored = boundedCount(entry.pets);
    // merge: progreso local previo al login; nunca se pierde progreso.
    const merge = Math.max(0, Math.min(100000, Math.floor(Number(body.merge) || 0)));
    const pets = Math.max(stored, merge) + 1;

    store[user.id] = { ...entry, pets, updatedAt: new Date().toISOString() };
    writeStore(store);

    sendJson(response, 200, { user: user.id, pets, level: levelForPets(pets) });
    return;
  }

  sendJson(response, 405, { error: "Buddy method not allowed." });
}
