import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_ROOM, isRoomDisplayAllowed, normalizeRoom, ownedRoomDisplays, roomSeason } from "../shared/buddy-room.mjs";
import { FISH_CATALOG } from "../shared/buddy-catches.mjs";
import { handleBuddyRequest } from "../server/buddy.mjs";

test("room saves discard malformed options and unbounded display identifiers", () => {
  assert.deepEqual(normalizeRoom(null), DEFAULT_ROOM);
  assert.deepEqual(normalizeRoom({ palette: "javascript:bad", bed: [], aquarium: "fish:" + "a".repeat(100), shelfLeft: "__proto__", extra: true }), DEFAULT_ROOM);
  assert.equal(normalizeRoom({ palette: "plum", shelfLeft: "find:arcade-coin" }).shelfLeft, "find:arcade-coin");
});

test("only discoveries enter the room collection, with distinct catch and find identities", () => {
  const items = ownedRoomDisplays({ fishJournal: [{ id: "byte-minnow", discovered: true, kind: "fish" }, { id: "void-eel", discovered: false }], finds: [{ id: "floppy-disk", discovered: true }] });
  assert.deepEqual(items.map((item) => item.key), ["fish:byte-minnow", "find:floppy-disk"]);
  assert.equal(roomSeason(null, new Date(2026, 9, 1)), "autumn");
  assert.equal(roomSeason("winter", new Date(2026, 9, 1)), "winter");
  assert.equal(roomSeason("halloween"), "halloween");
});

test("saved rooms keep fish in the aquarium and patrol finds on shelves", () => {
  const oldRoom = normalizeRoom({ aquarium: "fish:byte-minnow", shelfLeft: "fish:glitch-koi", shelfRight: "fish:byte-minnow", palette: "amber" });
  assert.equal(oldRoom.aquarium, "fish:byte-minnow");
  assert.equal(oldRoom.shelfLeft, "");
  assert.equal(oldRoom.shelfRight, "");
  assert.equal(oldRoom.palette, "amber");
  const finds = normalizeRoom({ aquarium: "find:arcade-coin", shelfLeft: "find:arcade-coin", shelfRight: "find:floppy-disk" });
  assert.equal(finds.aquarium, "");
  assert.equal(finds.shelfLeft, "find:arcade-coin");
  assert.equal(finds.shelfRight, "find:floppy-disk");
});

test("fishing junk and treasure can be displayed and saved on either shelf, never in the aquarium", () => {
  const displays = ownedRoomDisplays({ fishJournal: FISH_CATALOG.map((item) => ({ ...item, discovered: true })), finds: [] });
  for (const item of displays) {
    const isFish = item.kind === "fish";
    assert.equal(isRoomDisplayAllowed("aquarium", item.key), isFish, item.id);
    for (const shelf of ["shelfLeft", "shelfRight"]) {
      assert.equal(isRoomDisplayAllowed(shelf, item.key), !isFish, item.id);
      assert.equal(normalizeRoom({ [shelf]: item.key })[shelf], isFish ? "" : item.key, item.id);
    }
    assert.equal(normalizeRoom({ aquarium: item.key }).aquarium, isFish ? item.key : "", item.id);
  }
  assert.ok(displays.filter((item) => isRoomDisplayAllowed("shelfLeft", item.key)).some((item) => item.id === "old-boot"));
  assert.equal(isRoomDisplayAllowed("shelfLeft", "fish:unknown-catch"), false);
  assert.equal(isRoomDisplayAllowed("invalid-slot", "fish:old-boot"), false);
});

test("room API persists per account without changing friendship, gear, or collections", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "daivr-room-test-"));
  const previousDir = process.env.COMMENTS_DATA_DIR;
  const previousSecret = process.env.COMMENTS_SESSION_SECRET;
  process.env.COMMENTS_DATA_DIR = directory;
  process.env.COMMENTS_SESSION_SECRET = "room-test-secret";
  writeFileSync(join(directory, "buddy-friendship.json"), JSON.stringify({ alice: { pets: 25, hiddenGear: ["scarf"], hasLoadout: true, adventure: { totalCatches: 7, fishCollection: { "byte-minnow": 2 } } } }));
  const server = createServer((req, res) => { handleBuddyRequest(req, res).catch(() => { res.writeHead(500); res.end("{}"); }); });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  t.after(async () => {
    await new Promise((done) => server.close(done));
    if (previousDir === undefined) delete process.env.COMMENTS_DATA_DIR; else process.env.COMMENTS_DATA_DIR = previousDir;
    if (previousSecret === undefined) delete process.env.COMMENTS_SESSION_SECRET; else process.env.COMMENTS_SESSION_SECRET = previousSecret;
  });
  async function api(user, body, origin) {
    const data = Buffer.from(JSON.stringify({ id: user, username: user, exp: Date.now() + 60000 })).toString("base64url");
    const token = `${data}.${createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(data).digest("base64url")}`;
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/buddy`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(user ? { Cookie: `daivr_comment_session=${token}` } : {}), ...(origin ? { Origin: origin } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }
  const body = { action: "save-room", owner: "alice", room: { palette: "plum", aquarium: "fish:byte-minnow", bed: "bunk", shelfLeft: "fish:byte-minnow", shelfRight: "find:arcade-coin" } };
  assert.equal((await api(null, body)).status, 401);
  assert.equal((await api("alice", body, "https://other.example")).status, 403);
  assert.equal((await api("bob", body)).status, 409);
  assert.equal((await api("alice")).data.hasRoom, false);
  assert.equal((await api("alice", body)).status, 200);
  const saved = (await api("alice")).data;
  assert.deepEqual(saved.room, normalizeRoom(body.room));
  assert.equal(saved.room.shelfLeft, "");
  assert.equal(saved.room.shelfRight, "find:arcade-coin");
  assert.equal(saved.hasRoom, true);
  assert.equal(saved.pets, 25);
  assert.equal(saved.adventure.fishCollection["byte-minnow"], 2);
  assert.deepEqual(saved.hiddenGear, ["scarf"]);
  assert.equal((await api("bob")).data.hasRoom, false);
  await api("alice", { action: "save-loadout", hiddenGear: [] });
  await api("alice", { action: "sync-adventure", adventure: { totalCatches: 8 } });
  assert.deepEqual((await api("alice")).data.room, saved.room);
  const fishingKeepsakes = { ...saved.room, shelfLeft: "fish:old-boot", shelfRight: "fish:token-chest" };
  assert.equal((await api("alice", { action: "save-room", owner: "alice", room: fishingKeepsakes })).status, 200);
  const restored = (await api("alice")).data;
  assert.deepEqual(restored.room, fishingKeepsakes);
  assert.equal(restored.adventure.fishCollection["byte-minnow"], 2);
  assert.equal(restored.pets, 25);
  await api("alice", { action: "save-room", owner: "alice", room: { palette: "amber" } });
  assert.equal((await api("alice")).data.room.aquarium, "");
});
