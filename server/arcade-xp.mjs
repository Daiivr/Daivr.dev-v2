import { readFileSync, writeFileSync } from "node:fs";
import { ensureDataFile, getDataFile } from "./storage.mjs";

const ARCADE_XP_FILENAME = "arcade-xp.json";
const DEFAULT_XP_STATE = { level: 1, xp: 0, total: 0, updatedAt: null };

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function ensureArcadeXpFile() {
  return ensureDataFile(ARCADE_XP_FILENAME, DEFAULT_XP_STATE);
}

function normalizeXpState(value = {}) {
  return {
    level: Math.max(1, Math.floor(Number(value.level) || 1)),
    xp: Math.max(0, Math.floor(Number(value.xp) || 0)),
    total: Math.max(0, Math.floor(Number(value.total) || 0)),
    updatedAt: value.updatedAt || null
  };
}

function readArcadeXp() {
  ensureArcadeXpFile();
  try {
    return normalizeXpState(JSON.parse(readFileSync(getDataFile(ARCADE_XP_FILENAME), "utf8")));
  } catch (error) {
    console.error("Arcade XP read error", error.message || error);
    return DEFAULT_XP_STATE;
  }
}

function writeArcadeXp(state) {
  ensureArcadeXpFile();
  const current = readArcadeXp();
  const next = normalizeXpState(state);
  const winner = next.total >= current.total ? next : current;
  const payload = {
    ...winner,
    updatedAt: new Date().toISOString()
  };

  writeFileSync(getDataFile(ARCADE_XP_FILENAME), JSON.stringify(payload, null, 2), "utf8");
  return payload;
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

export async function handleArcadeXpRequest(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, readArcadeXp());
    return;
  }

  if (request.method === "POST") {
    const body = await readBody(request);
    sendJson(response, 200, writeArcadeXp(body));
    return;
  }

  sendJson(response, 405, { error: "Arcade XP method not allowed." });
}
