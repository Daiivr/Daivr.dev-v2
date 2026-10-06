import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSessionUser } from "./comments.mjs";
import { readBuddyAdventure } from "./buddy.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { isBuddyJournalComplete } from "../shared/buddy-journal.mjs";
import { isNzpPassword, normalizeNzpAddress, normalizeNzpSessionName, NZP_MAPS, NZP_MAX_PLAYERS } from "../shared/nzp.mjs";

const MEMBER_TTL = 180_000;
const PASSWORD_WINDOW = 600_000;
const PASSWORD_TRIES = 5;
const fail = (status, message, code) => { throw Object.assign(new Error(message), { status, code }); };

// Session passwords only gate the room number on this site; the host's game
// enforces the same password itself. Lobbies are in memory, so a keyed hash
// is enough to keep the plain text out of process state.
function sealPassword(password) {
  if (!password) return null;
  const salt = randomBytes(16);
  return { salt, hash: createHmac("sha256", salt).update(password).digest() };
}

const passwordMatches = (secret, password) => typeof password === "string"
  && timingSafeEqual(createHmac("sha256", secret.salt).update(password).digest(), secret.hash);

// One live process, like the site's existing presence service. Restarting clears lobbies.
export function createNzpLobbyService({ now = Date.now } = {}) {
  const rooms = new Map();
  const misses = new Map();
  function prune() {
    for (const [id, room] of rooms) {
      for (const [userId, member] of room.members) {
        if (now() - member.seenAt >= MEMBER_TTL) room.members.delete(userId);
      }
      if (!room.members.has(room.hostId)) rooms.delete(id);
    }
    for (const [key, miss] of misses) {
      if (now() - miss.since >= PASSWORD_WINDOW || !rooms.has(miss.roomId)) misses.delete(key);
    }
  }
  function current(userId) {
    return [...rooms.values()].find((room) => room.members.has(userId));
  }
  function snapshot(user) {
    prune();
    const room = current(user.id);
    return {
      // Room numbers are only handed to members, after any password check.
      rooms: [...rooms.values()]
        .sort((a, b) => Number(Boolean(b.address)) - Number(Boolean(a.address)) || b.createdAt - a.createdAt)
        .map((entry) => ({ id: entry.id, name: entry.name, map: entry.map, host: entry.members.get(entry.hostId).username, players: entry.members.size, locked: Boolean(entry.secret), ready: Boolean(entry.address) })),
      room: room ? {
        id: room.id, hostId: room.hostId, name: room.name, map: room.map, locked: Boolean(room.secret), address: room.address,
        members: [...room.members.values()].map(({ id, username }) => ({ id, username }))
      } : null
    };
  }
  function checkPassword(user, room, password) {
    const key = `${user.id}:${room.id}`;
    const miss = misses.get(key);
    if (miss && miss.count >= PASSWORD_TRIES) fail(429, "Too many wrong passwords. Try again in a few minutes.", "password");
    if (!password) fail(403, "This session needs a password.", "password");
    if (passwordMatches(room.secret, password)) {
      misses.delete(key);
      return;
    }
    misses.set(key, { roomId: room.id, since: miss?.since ?? now(), count: (miss?.count ?? 0) + 1 });
    fail(403, "Wrong session password.", "password");
  }
  function act(user, body) {
    prune();
    let room = current(user.id);
    const member = { id: user.id, username: user.username, seenAt: now() };
    if (body.action === "create") {
      if (room) fail(409, "Leave your current session first.");
      if (rooms.size >= 500) fail(503, "All session slots are busy. Try again later.");
      const map = body.map ?? NZP_MAPS[0].id;
      if (!NZP_MAPS.some(({ id }) => id === map)) fail(400, "Choose one of NZ:P's maps.");
      const password = body.password ?? "";
      if (password && !isNzpPassword(password)) fail(400, "Passwords can use letters, numbers, - _ and . (up to 24).");
      const name = normalizeNzpSessionName(body.name) || normalizeNzpSessionName(`${user.username} co-op`) || "NZP co-op";
      const id = randomBytes(12).toString("hex");
      rooms.set(id, { id, hostId: user.id, name, map, secret: sealPassword(password), address: "", createdAt: now(), members: new Map([[user.id, member]]) });
    } else if (body.action === "join") {
      if (room && room.id !== body.roomId) fail(409, "Leave your current session first.");
      room = rooms.get(body.roomId);
      if (!room) fail(404, "That session has ended.");
      if (!room.members.has(user.id)) {
        if (room.members.size >= NZP_MAX_PLAYERS) fail(409, "This session is full.");
        if (room.secret) checkPassword(user, room, body.password);
      }
      room.members.set(user.id, member);
    } else if (body.action === "leave") {
      // A delayed tab-close request must not remove a newer session membership.
      if (room?.id === body.roomId) {
        if (room.hostId === user.id) rooms.delete(room.id);
        else room.members.delete(user.id);
      }
    } else if (body.action === "heartbeat" || body.action === "publish") {
      if (!room || room.id !== body.roomId) fail(404, "Your session has ended. Join or host another.");
      if (body.action === "publish") {
        if (room.hostId !== user.id) fail(403, "Only the host's game can publish the session.");
        const address = normalizeNzpAddress(body.address);
        if (!address) fail(400, "NZ:P reported an invalid room number.");
        room.address = address;
      }
      room.members.set(user.id, member);
    } else fail(400, "Unknown session action.");
    return snapshot(user);
  }
  return { snapshot, act };
}

const lobbies = createNzpLobbyService();

export async function handleNzpRequest(request, response) {
  const send = (status, payload) => {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(payload));
  };
  try {
    if (!["GET", "POST"].includes(request.method)) {
      response.setHeader("Allow", "GET, POST");
      return send(405, { error: "Method not allowed." });
    }
    if (!sameOrigin(request)) return send(403, { error: "Use this site's lobby." });
    const user = getSessionUser(request);
    if (!user) return send(401, { error: "Connect Discord to play together." });
    if (!isBuddyJournalComplete(readBuddyAdventure(user.id))) {
      return send(403, { error: "Complete every catch and patrol find in Buddy's journal to unlock NZ:P.", code: "journal" });
    }
    const result = request.method === "GET" ? lobbies.snapshot(user) : lobbies.act(user, await readJsonBody(request, 2048));
    return send(200, { user: { id: user.id, username: user.username }, ...result });
  } catch (error) {
    if (!error.status) console.error("NZ:P lobby failed", error);
    return send(error.status || 500, { error: error.status ? error.message : "The lobby is unavailable. Try again.", ...(error.code ? { code: error.code } : {}) });
  }
}
