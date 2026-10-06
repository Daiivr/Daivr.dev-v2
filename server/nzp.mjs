import { randomBytes } from "node:crypto";
import { getSessionUser } from "./comments.mjs";
import { readBuddyAdventure } from "./buddy.mjs";
import { readJsonBody, sameOrigin } from "./http-guards.mjs";
import { isBuddyJournalComplete } from "../shared/buddy-journal.mjs";
import { normalizeNzpAddress, NZP_MAX_PLAYERS } from "../shared/nzp.mjs";

const MEMBER_TTL = 180_000;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

// One live process, like the site's existing presence service. Restarting clears lobbies.
export function createNzpLobbyService({ now = Date.now } = {}) {
  const rooms = new Map();
  function prune() {
    for (const [id, room] of rooms) {
      for (const [userId, member] of room.members) {
        if (now() - member.seenAt >= MEMBER_TTL) room.members.delete(userId);
      }
      if (!room.members.has(room.hostId)) rooms.delete(id);
    }
  }
  function current(userId) {
    return [...rooms.values()].find((room) => room.members.has(userId));
  }
  function snapshot(user) {
    prune();
    const room = current(user.id);
    return {
      rooms: [...rooms.values()].map((entry) => ({ id: entry.id, host: entry.members.get(entry.hostId).username, players: entry.members.size, ready: Boolean(entry.address) })),
      room: room ? { id: room.id, hostId: room.hostId, address: room.address, members: [...room.members.values()].map(({ id, username }) => ({ id, username })) } : null
    };
  }
  function act(user, body) {
    prune();
    let room = current(user.id);
    const member = { id: user.id, username: user.username, seenAt: now() };
    if (body.action === "create") {
      if (room) fail(409, "Leave your current lobby first.");
      if (rooms.size >= 500) fail(503, "All lobby slots are busy. Try again later.");
      const id = randomBytes(12).toString("hex");
      rooms.set(id, { id, hostId: user.id, address: "", members: new Map([[user.id, member]]) });
    } else if (body.action === "join") {
      if (room && room.id !== body.roomId) fail(409, "Leave your current lobby first.");
      room = rooms.get(body.roomId);
      if (!room) fail(404, "That lobby has closed.");
      if (!room.members.has(user.id) && room.members.size >= NZP_MAX_PLAYERS) fail(409, "This lobby is full.");
      room.members.set(user.id, member);
    } else if (body.action === "leave") {
      // A delayed tab-close request must not remove a newer lobby membership.
      if (room?.id === body.roomId) {
        if (room.hostId === user.id) rooms.delete(room.id);
        else room.members.delete(user.id);
      }
    } else if (body.action === "heartbeat" || body.action === "publish") {
      if (!room || room.id !== body.roomId) fail(404, "Your lobby has closed. Join or create another.");
      if (body.action === "publish") {
        if (room.hostId !== user.id) fail(403, "Only the host can publish the game room.");
        const address = normalizeNzpAddress(body.address);
        if (!address) fail(400, "Enter the NZ:P relay room number, such as /12345.");
        room.address = address;
      }
      room.members.set(user.id, member);
    } else fail(400, "Unknown lobby action.");
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
      return send(403, { error: "Complete every catch and patrol find in Buddy's journal to unlock NZ:P." });
    }
    const result = request.method === "GET" ? lobbies.snapshot(user) : lobbies.act(user, await readJsonBody(request, 2048));
    return send(200, { user: { id: user.id, username: user.username }, ...result });
  } catch (error) {
    if (!error.status) console.error("NZ:P lobby failed", error);
    return send(error.status || 500, { error: error.status ? error.message : "The lobby is unavailable. Try again." });
  }
}
