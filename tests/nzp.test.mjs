import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FISH_CATALOG } from "../shared/buddy-catches.mjs";
import { FIELD_FINDS, isBuddyJournalComplete } from "../shared/buddy-journal.mjs";
import { normalizeNzpAddress, nzpHostLaunch, nzpJoinLaunch } from "../shared/nzp.mjs";
import { availableKonamiGames } from "../src/data/konamiGames.js";
import { createNzpLobbyService, handleNzpRequest } from "../server/nzp.mjs";
import { securityHeaders } from "../server/security-headers.mjs";
import { cleanMenu, removeSocialBadges } from "../public/nzp/menu-cleanup.mjs";
import { nzpPlayerName } from "../public/nzp/player-name.mjs";
import { nzpBrokerFailed, nzpListeningRoom, nzpSessionArgs } from "../public/nzp/session-args.mjs";

const complete = () => ({
  fishCollection: Object.fromEntries(FISH_CATALOG.map(({ id }) => [id, 1])),
  foundObjects: Object.fromEntries(FIELD_FINDS.map(({ id }) => [id, 1]))
});
const user = (id) => ({ id, username: `Player ${id}` });

test("NZ:P needs every catch and patrol find; duplicates, junk IDs, and totals cannot unlock it", () => {
  assert.equal(isBuddyJournalComplete(), false);
  assert.equal(isBuddyJournalComplete(complete()), true);
  for (const [key, catalogue] of [["fishCollection", FISH_CATALOG], ["foundObjects", FIELD_FINDS]]) {
    for (const { id } of catalogue) {
      const adventure = complete();
      delete adventure[key][id];
      adventure[key].unknown = 999999;
      adventure.discoveredFishCount = 999999;
      assert.equal(isBuddyJournalComplete(adventure), false, id);
      for (const value of [0, -1, NaN, Infinity]) {
        adventure[key][id] = value;
        assert.equal(isBuddyJournalComplete(adventure), false, `${id}: ${value}`);
      }
    }
  }
  assert.equal(availableKonamiGames(false).some(({ id }) => id === "nzp"), false);
  assert.equal(availableKonamiGames(true).at(-1).id, "nzp");
  assert.equal(availableKonamiGames(false).length, 5);
  assert.equal(availableKonamiGames(true, true).some(({ id }) => id === "nzp"), false);
  assert.equal(availableKonamiGames(true, true).length, 5);
});

test("co-op launches allow relay numbers, stock maps and plain text only, and cannot inject engine commands", () => {
  assert.equal(normalizeNzpAddress(" 12345 "), "/12345");
  assert.deepEqual(nzpJoinLaunch({ address: "668" }), { mode: "join", address: "/668", password: "" });
  for (const input of ["", "//evil.test", "wss://evil.test", "/123;+quit", "/12\n+quit", "123 +exec bad.cfg", "1234567890123"]) {
    assert.equal(nzpJoinLaunch({ address: input }), null, input);
  }
  assert.equal(nzpJoinLaunch({ address: "/668", password: 'x";quit' }), null);
  assert.deepEqual(nzpHostLaunch({ name: "  Friday   Night!! ", map: "nzp_warehouse2", password: "zombie-2" }), { mode: "host", name: "Friday Night", map: "nzp_warehouse2", password: "zombie-2" });
  assert.equal(nzpHostLaunch({ name: "Friday", map: "../maps/evil" }), null);
  assert.equal(nzpHostLaunch({ name: "🔥", map: "ndu" }), null);
  for (const password of ["has space", "semi;colon", "quote\"", "x".repeat(25), "+quit"]) {
    assert.equal(nzpHostLaunch({ name: "Friday", map: "ndu", password }), null, password);
  }

  const hostArgs = nzpSessionArgs({ mode: "host", name: "Friday Night", map: "ndu", password: "" });
  assert.deepEqual(hostArgs.slice(0, 11), ["+set", "sv_public", "2", "+set", "sv_listen_qw", "1", "+set", "maxclients", "4", "+set", "hostname"]);
  assert.deepEqual(hostArgs.slice(11, 14), ["Friday Night", "+cvarreset", "password"], "open sessions clear a saved password");
  assert.deepEqual(hostArgs.slice(-2), ["+map", "ndu"]);
  assert.deepEqual(nzpSessionArgs({ mode: "join", address: "/668", password: "zombie-2" }), ["+set", "password", "zombie-2", "+connect", "/668"]);
  for (const launch of [null, {}, { mode: "host", name: "-dedicated", map: "ndu" }, { mode: "host", name: "ok", map: "ndu;quit" }, { mode: "host", name: "ok", map: "ndu", password: "a b" },
    { mode: "join", address: "/668;quit" }, { mode: "join", address: "/668", password: "$rcon" }, { mode: "solo" }]) {
    assert.throws(() => nzpSessionArgs(launch), /can't start/, JSON.stringify(launch));
  }

  assert.equal(nzpListeningRoom("Listening on /NZP-REBOOT/668\n"), "/668", "NZ:P's web engine");
  assert.equal(nzpListeningRoom("Publicly listening on /668"), "/668", "upstream FTE");
  assert.equal(nzpListeningRoom("Listening on wss://master.frag-net.com:27950/NZP-REBOOT/42"), "/42");
  for (const text of ["Listening on /NZP-REBOOT/", "Listening on /668x", "client Listening on connected", "Listening on /1234567890123"]) assert.equal(nzpListeningRoom(text), "", text);
  assert.equal(nzpBrokerFailed("rtc broker connection to master.frag-net.com:27950 failed (retry: 30 secs)"), true);
  assert.equal(nzpBrokerFailed("client Dai connected"), false);
  const policy = securityHeaders({ headers: {} }, "/")["Content-Security-Policy"];
  assert.ok(policy.includes("frame-src 'self';"));
  const gamePolicy = securityHeaders({ headers: {} }, "/nzp/index.html")["Content-Security-Policy"];
  assert.ok(gamePolicy.includes("https://nzp.gay"));
  assert.ok(gamePolicy.includes("wss://master.frag-net.com:27950"));
});

test("social menu cleanup removes the badge function without changing other instructions", () => {
  const bytes = new Uint8Array(400), view = new DataView(bytes.buffer);
  for (const [offset, value] of [[0, 7], [8, 200], [12, 3], [32, 224], [36, 2], [40, 92], [44, 50]]) view.setInt32(offset, value, true);
  bytes.set(new TextEncoder().encode("other\0Menu_SocialBadge\0"), 92);
  view.setInt32(224 + 36, 1, true);
  view.setInt32(224 + 36 + 16, 6, true);
  bytes.fill(17, 200, 224);
  const cleaned = removeSocialBadges(bytes);
  assert.deepEqual([...cleaned.slice(208, 216)], Array(8).fill(0));
  assert.deepEqual(cleaned.slice(0, 208), bytes.slice(0, 208));
  assert.deepEqual(cleaned.slice(216), bytes.slice(216));
  assert.equal(bytes[208], 17, "input archive remains untouched");
  assert.throws(() => removeSocialBadges(new Uint8Array(20)), /Unsupported/);
  view.setInt32(0, 999, true);
  assert.throws(() => removeSocialBadges(bytes), /Unsupported/);
});

// A tiny menu.dat laid out like FTEQCC's output for menu_main.qc: hexen2-style
// CALLnH calls, `Menu_Button(...) ? current_menu = X : 0;` branches, and the
// menu_main_buttons array read through `return menu_main_buttons[0];`.
function fakeMenu({ creditsId = "mm_credits", buttons = ["mm_start", "mm_coop", "mm_options", "mm_bios", "mm_credits", "mm_quit"] } = {}) {
  const functions = ["", "Menu_SocialBadge", "Menu_GetBuildDate", "Menu_Button", "Menu_DrawDivider", "Menu_Main", "Menu_Main_GetNextButton"];
  const at = {}; let stringSize = 0;
  for (const value of [...functions, "mm_start", "mm_coop", "mm_options", "mm_bios", "mm_credits", "mm_quit"]) {
    at[value] ??= stringSize;
    stringSize += value.length + 1;
  }
  const globals = new Int32Array(70);
  Object.assign(globals, { 30: 3, 31: 4, 32: at.mm_bios, 33: at[creditsId] });
  buttons.forEach((id, slot) => { globals[40 + slot] = at[id]; });
  const branch = [[31, 1, 60], [50, 60, 4], [31, 53, 61], [31, 53, 62], [61, 2], [31, 54, 62]];
  const statements = [
    [0], [31, 1, 2], [31, 1, 2], [0], [0],
    [105, 31, 50], [31, 51, 10], [108, 30, 52, 32], ...branch, // 5: divider + CHARACTER BIOS
    [105, 31, 55], [31, 56, 10], [31, 57, 13], [108, 30, 58, 33], ...branch, // 14: divider + CREDITS
    [0],
    [12, 63, 64, 60], [50, 60, 2], [43, 40], [0] // 25: Menu_Main_GetNextButton
  ];
  const firsts = [0, 1, 2, 3, 4, 5, 25];
  const offsets = { statements: 92, functions: 92 + statements.length * 8 };
  offsets.strings = offsets.functions + functions.length * 36;
  offsets.globals = offsets.strings + stringSize;
  const bytes = new Uint8Array(offsets.globals + globals.length * 4), view = new DataView(bytes.buffer);
  for (const [field, value] of [[0, 7], [8, offsets.statements], [12, statements.length], [32, offsets.functions], [36, functions.length], [40, offsets.strings], [44, stringSize], [48, offsets.globals], [52, globals.length]]) view.setInt32(field, value, true);
  statements.forEach(([op, a = 0, b = 0, c = 0], index) => [op, a, b, c].forEach((value, slot) => view.setInt16(offsets.statements + index * 8 + slot * 2, value, true)));
  functions.forEach((name, index) => { view.setInt32(offsets.functions + index * 36, firsts[index], true); view.setInt32(offsets.functions + index * 36 + 16, at[name], true); });
  for (const [value, offset] of Object.entries(at)) bytes.set(new TextEncoder().encode(value), offsets.strings + offset);
  globals.forEach((value, index) => view.setInt32(offsets.globals + index * 4, value, true));
  return { bytes, view, at, offsets };
}

test("menu cleanup hides the build number and credits, and arrow keys skip the removed button", () => {
  const { bytes, at, offsets } = fakeMenu();
  const cleaned = cleanMenu(bytes), view = new DataView(cleaned.buffer);
  const statement = (index) => [0, 1, 2, 3].map((slot) => view.getInt16(offsets.statements + index * 8 + slot * 2, true));
  const original = new DataView(bytes.buffer);
  const before = (index) => [0, 1, 2, 3].map((slot) => original.getInt16(offsets.statements + index * 8 + slot * 2, true));
  assert.deepEqual(statement(1), [0, 0, 0, 0], "social badges return immediately");
  assert.deepEqual(statement(2), [0, 0, 0, 0], "the build date is never read");
  assert.deepEqual(statement(14), [61, 10, 0, 0], "the credits divider jumps past the CREDITS button");
  for (const index of [0, 3, 4, ...Array.from({ length: 9 }, (_, step) => 5 + step), ...Array.from({ length: 14 }, (_, step) => 15 + step)]) {
    assert.deepEqual(statement(index), before(index), `statement ${index}`);
  }
  const buttons = Array.from({ length: 6 }, (_, slot) => view.getInt32(offsets.globals + (40 + slot) * 4, true));
  assert.deepEqual(buttons, [at.mm_start, at.mm_coop, at.mm_options, at.mm_bios, at.mm_quit, at.mm_start]);
  assert.equal(view.getInt32(offsets.globals + 33 * 4, true), at.mm_credits, "the button id itself is unchanged");
  assert.equal(original.getInt16(offsets.statements + 14 * 8, true), 105, "input archive remains untouched");
  assert.throws(() => cleanMenu(fakeMenu({ creditsId: "mm_quit" }).bytes), /menu changed/);
  assert.throws(() => cleanMenu(fakeMenu({ buttons: ["mm_start", "mm_coop", "mm_options", "mm_bios", "mm_quit", "mm_quit"] }).bytes), /menu changed/);
});

test("Discord names become safe NZ:P player names", () => {
  for (const [input, expected] of [
    ["Dai", "Dai"], ["  Dai   Bob  ", "Dai Bob"], ["José Ñandú", "Jose Nandu"], ["Ｄａｉ", "Dai"],
    ["-dedicated", "dedicated"], ["^1Red", "1Red"], ["🔥🔥", ""], [null, ""], [undefined, ""], ["x".repeat(40), "x".repeat(32)]
  ]) assert.equal(nzpPlayerName(input), expected, String(input));
  for (const input of ['Dai"; quit', "Dai\n+exec bad.cfg", "$rcon_password", "//comment", "a\\b", "+quit", "name;disconnect", "@host"]) {
    assert.match(nzpPlayerName(input), /^(?:[A-Za-z0-9][A-Za-z0-9 _.-]*)?$/, input);
  }
});

test("four-player lobby enforces capacity, membership, host publishing and host closure", () => {
  const service = createNzpLobbyService();
  const host = user("host");
  const { room } = service.act(host, { action: "create" });
  assert.throws(() => service.act(host, { action: "create" }), { status: 409 });
  for (const id of ["a", "b", "c"]) service.act(user(id), { action: "join", roomId: room.id });
  assert.equal(service.act(user("a"), { action: "join", roomId: room.id }).room.members.length, 4);
  assert.throws(() => service.act(user("d"), { action: "join", roomId: room.id }), { status: 409 });
  assert.throws(() => service.act(user("a"), { action: "publish", roomId: room.id, address: "/123" }), { status: 403 });
  assert.throws(() => service.act(user("d"), { action: "publish", roomId: room.id, address: "/123" }), { status: 404 });
  assert.throws(() => service.act(host, { action: "publish", roomId: room.id, address: "/123;quit" }), { status: 400 });
  service.act(host, { action: "publish", roomId: room.id, address: "/123" });
  assert.equal(service.snapshot(user("a")).room.address, "/123");
  assert.equal(service.snapshot(user("d")).rooms[0].address, undefined);
  service.act(user("a"), { action: "leave", roomId: room.id });
  service.act(user("d"), { action: "join", roomId: room.id });
  service.act(host, { action: "leave", roomId: "stale-room" });
  assert.equal(service.snapshot(host).room.id, room.id);
  service.act(host, { action: "leave", roomId: room.id });
  assert.equal(service.snapshot(user("d")).room, null);
  assert.equal(service.snapshot(host).rooms.length, 0);
});

test("sessions list name, map and lock, and passwords gate the room number with limited guesses", () => {
  let time = 1;
  const service = createNzpLobbyService({ now: () => time });
  const host = user("host");
  assert.throws(() => service.act(host, { action: "create", map: "evil" }), { status: 400 });
  assert.throws(() => service.act(host, { action: "create", password: "has space" }), { status: 400 });
  const open = service.act(user("other"), { action: "create", name: " ", map: "lexi_house" }).room;
  assert.equal(open.name, "Player other co-op", "a blank name falls back to the host's");
  const { room } = service.act(host, { action: "create", name: 'Friday "Night"; quit', map: "nzp_warehouse2", password: "zombie-2" });
  assert.deepEqual([room.name, room.map, room.locked, room.address], ["Friday Night quit", "nzp_warehouse2", true, ""]);
  assert.equal(JSON.stringify(service.snapshot(host)).includes("zombie-2"), false, "the password is never echoed");
  service.act(host, { action: "publish", roomId: room.id, address: "/668" });
  time += 1;
  const listed = service.snapshot(user("guest")).rooms;
  assert.deepEqual(listed.map(({ name, locked, ready }) => [name, locked, ready]), [["Friday Night quit", true, true], ["Player other co-op", false, false]]);
  assert.equal(listed.some((entry) => "address" in entry), false);

  const guest = user("guest");
  assert.throws(() => service.act(guest, { action: "join", roomId: room.id }), { status: 403, code: "password" });
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.throws(() => service.act(guest, { action: "join", roomId: room.id, password: `wrong-${attempt}` }), { status: 403, code: "password" });
  }
  assert.throws(() => service.act(guest, { action: "join", roomId: room.id, password: "zombie-2" }), { status: 429 }, "guesses are capped");
  for (let step = 0; step < 4; step++) {
    time += 150_000;
    service.act(host, { action: "heartbeat", roomId: room.id });
    service.act(user("other"), { action: "heartbeat", roomId: open.id });
  }
  const joined = service.act(guest, { action: "join", roomId: room.id, password: "zombie-2" }).room;
  assert.equal(joined.address, "/668");
  assert.equal(service.act(guest, { action: "join", roomId: room.id }).room.members.length, 2, "members rejoin without the password");
  assert.equal(service.act(user("third"), { action: "join", roomId: open.id }).room.locked, false);
});

test("stale guests release seats and a missing host expires the entire lobby", () => {
  let time = 1;
  const service = createNzpLobbyService({ now: () => time });
  const host = user("host");
  const { room } = service.act(host, { action: "create" });
  service.act(user("guest"), { action: "join", roomId: room.id });
  time += 170_000;
  service.act(host, { action: "heartbeat", roomId: room.id });
  time += 10_000;
  assert.equal(service.snapshot(host).room.members.length, 1);
  time += 180_000;
  assert.equal(service.snapshot(host).room, null);
  assert.throws(() => service.act(user("guest"), { action: "join", roomId: room.id }), { status: 404 });
});

test("HTTP lobby requires a real session and server-saved journal for every participant", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "daivr-nzp-test-"));
  const previous = { dir: process.env.COMMENTS_DATA_DIR, secret: process.env.COMMENTS_SESSION_SECRET };
  process.env.COMMENTS_DATA_DIR = directory;
  process.env.COMMENTS_SESSION_SECRET = "nzp-test-only-secret";
  writeFileSync(join(directory, "buddy-friendship.json"), JSON.stringify({ alice: { adventure: complete() }, bob: { adventure: complete() } }));
  const server = createServer(handleNzpRequest);
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  t.after(async () => {
    await new Promise((done) => server.close(done));
    if (previous.dir === undefined) delete process.env.COMMENTS_DATA_DIR; else process.env.COMMENTS_DATA_DIR = previous.dir;
    if (previous.secret === undefined) delete process.env.COMMENTS_SESSION_SECRET; else process.env.COMMENTS_SESSION_SECRET = previous.secret;
    rmSync(directory, { recursive: true, force: true });
  });
  async function api(id, body, extra = {}) {
    const payload = Buffer.from(JSON.stringify({ id, username: id, exp: Date.now() + 60000 })).toString("base64url");
    const token = `${payload}.${createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(payload).digest("base64url")}`;
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/nzp/lobby`, {
      method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(id ? { Cookie: `daivr_comment_session=${token}` } : {}), ...extra },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, data: await response.json() };
  }
  assert.equal((await api(null)).status, 401);
  assert.equal((await api(null, { action: "create" })).status, 401);
  const locked = await api("locked", { action: "create", journalComplete: true, adventure: complete() });
  assert.deepEqual([locked.status, locked.data.code], [403, "journal"]);
  assert.equal((await api("alice", { action: "create" }, { Origin: "https://other.test" })).status, 403);
  assert.equal((await api("alice", null, { Cookie: "daivr_comment_session=forged.bad" })).status, 401);
  const created = await api("alice", { action: "create" });
  assert.equal(created.status, 200);
  const roomId = created.data.room.id;
  assert.equal((await api("locked", { action: "join", roomId })).status, 403);
  const joined = await api("bob", { action: "join", roomId });
  assert.equal(joined.status, 200);
  assert.equal(joined.data.room.members.length, 2);
  assert.equal((await api("bob", { action: "publish", roomId, address: "/123" })).status, 403);
  assert.equal((await api("alice", { action: "publish", roomId, address: "/123" })).status, 200);
  assert.equal((await api("bob")).data.room.address, "/123");
  assert.equal((await api("alice", { action: "publish", address: "x".repeat(3000), roomId })).status, 413);
  assert.equal((await api("alice", { action: "leave", roomId })).status, 200);
  assert.equal((await api("bob")).data.room, null);
  const secret = await api("alice", { action: "create", name: "Night shift", map: "ndu", password: "zombie-2" });
  assert.deepEqual([secret.data.room.name, secret.data.room.locked], ["Night shift", true]);
  const wrong = await api("bob", { action: "join", roomId: secret.data.room.id, password: "nope" });
  assert.deepEqual([wrong.status, wrong.data.code], [403, "password"], "a wrong password is not mistaken for a locked journal");
  assert.equal((await api("bob", { action: "join", roomId: secret.data.room.id, password: "zombie-2" })).status, 200);
});
