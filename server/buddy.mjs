import { readFileSync, writeFileSync } from "node:fs";
import { getSessionUser } from "./comments.mjs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

const BUDDY_FILENAME = "buddy-friendship.json";

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

function readStore() {
  ensureDataFile(BUDDY_FILENAME, {});
  try {
    const value = JSON.parse(readFileSync(getDataFile(BUDDY_FILENAME), "utf8"));
    return value && typeof value === "object" ? value : {};
  } catch (error) {
    console.error("Buddy store read error", error.message || error);
    return {};
  }
}

function writeStore(store) {
  writeFileSync(getDataFile(BUDDY_FILENAME), JSON.stringify(store, null, 2), "utf8");
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
    const pets = user ? Number(readStore()[user.id]?.pets) || 0 : 0;
    sendJson(response, 200, {
      user: user?.id || null,
      pets,
      level: levelForPets(pets)
    });
    return;
  }

  if (request.method === "POST") {
    if (!user) {
      sendJson(response, 401, { error: "Discord login required to sync buddy friendship.", guest: true });
      return;
    }

    const body = await readBody(request);
    const store = readStore();
    const stored = Number(store[user.id]?.pets) || 0;
    // merge: progreso local previo al login; nunca se pierde progreso.
    const merge = Math.max(0, Math.min(100000, Math.floor(Number(body.merge) || 0)));
    const pets = Math.max(stored, merge) + 1;

    store[user.id] = { pets, updatedAt: new Date().toISOString() };
    writeStore(store);

    sendJson(response, 200, { user: user.id, pets, level: levelForPets(pets) });
    return;
  }

  sendJson(response, 405, { error: "Buddy method not allowed." });
}
