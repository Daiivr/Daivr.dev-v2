import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DAILY_CHALLENGES, dailyChallenge } from "../shared/player-catalog.mjs";
import { availableKonamiGames } from "../src/data/konamiGames.js";
import { readPlayers } from "../server/player-store.mjs";
import { securityHeaders } from "../server/security-headers.mjs";
import { MAX_RUN_S, createPokesurvivorService, handlePokesurvivorRequest, mergeSaves, periodIds, validateRun } from "../server/pokesurvivor.mjs";
import { issueRunToken } from "../server/run-tokens.mjs";
import { extractTar, idleFrames } from "../tools/pokesurvivor/build.mjs";

const DAY = 86_400_000;
const minutes = (count) => count * 60_000;

// Every store goes to a temporary folder, never the repo's data/.
function useTempData() {
  const directory = mkdtempSync(join(tmpdir(), "daivr-pokesurvivor-test-"));
  const keys = ["POKESURVIVOR_DATA_DIR", "COMMENTS_DATA_DIR", "GAME_DATA_DIR", "COMMENTS_SESSION_SECRET"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, { POKESURVIVOR_DATA_DIR: directory, COMMENTS_DATA_DIR: directory, GAME_DATA_DIR: directory, COMMENTS_SESSION_SECRET: "pokesurvivor-test-only-secret" });
  return {
    directory,
    restore() {
      for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
      rmSync(directory, { recursive: true, force: true });
    }
  };
}

// The first day (from a fixed start) whose daily challenge is PokéSurvivor's.
function pokesurvivorDay(start = Date.UTC(2026, 9, 1)) {
  for (let day = 0; day < DAILY_CHALLENGES.length * 2; day++) if (dailyChallenge(start + day * DAY).game === "pokesurvivor") return start + day * DAY + 3_600_000;
  throw new Error("PokéSurvivor never takes a daily slot");
}

const save = (over = {}) => ({ v: 3, name: "Ash", created: 1, updated: 1, coins: 500, owned: {}, shiny: {}, partner: 25, pupg: {}, upgrades: {}, legends: {}, stats: { runs: 0, bestTime: 0 }, ...over });
const user = (id, username = `user${id}`) => ({ id, username, avatarUrl: "/favicon.png" });

// A sink that records what the stream would send.
function sink() {
  const events = [];
  return { events, send: (event, data) => events.push({ event, data }), replaced() { events.push({ event: "replaced" }); }, last: (event) => [...events].reverse().find((e) => e.event === event)?.data };
}

test("saves merge like the game: collections are unioned, stats keep the maximum", () => {
  const laptop = save({ updated: 10, owned: { 1: { at: 5 }, 4: { at: 6 } }, stats: { runs: 3, bestTime: 200 }, pused: { 4: 2 }, dfav: { 4: 50 } });
  const phone = save({ updated: 20, owned: { 1: { at: 2 }, 7: { at: 9 } }, shiny: { 7: { at: 9 } }, stats: { runs: 5, bestTime: 90 }, pused: { 4: 1, 7: 3 }, dfav: { 4: -60 }, pstart: { 7: "bubble" } });
  const merged = mergeSaves(laptop, phone);
  assert.deepEqual(Object.keys(merged.owned).sort(), ["1", "4", "7"]);
  assert.equal(merged.owned[1].at, 2, "the earliest catch is kept");
  assert.deepEqual(merged.stats, { runs: 5, bestTime: 200 });
  assert.deepEqual(merged.pused, { 4: 2, 7: 3 }, "runs per Pokémon keep the maximum");
  assert.equal(merged.dfav[4], -60, "the latest favourite change wins, even an unfavourite");
  assert.equal(merged.pstart[7], "bubble");
  assert.deepEqual(mergeSaves(merged, phone), merged, "merging again changes nothing");
});

test("personal records with each Pokémon and endless records keep the best of both devices", () => {
  const laptop = save({ updated: 10, precs: { 6: { t: 900, lv: 30, k: 2000, dps: 120, dmg: 90000 } }, stats: { runs: 4, endlessTime: 2500, endlessRuns: 2 } });
  const phone = save({ updated: 20, precs: { 6: { t: 1200, lv: 25, k: 2500, dps: 100, dmg: 120000 }, 25: { t: 60, lv: 4 } }, stats: { runs: 6, endlessTime: 3100, endlessRuns: 1 } });
  const merged = mergeSaves(laptop, phone);
  assert.deepEqual(merged.precs[6], { t: 1200, lv: 30, k: 2500, dps: 120, dmg: 120000 });
  assert.deepEqual(merged.precs[25], { t: 60, lv: 4 });
  assert.equal(merged.stats.endlessTime, 3100);
  assert.equal(merged.stats.endlessRuns, 2);
  assert.deepEqual(mergeSaves(merged, laptop), merged, "merging again changes nothing");
  assert.deepEqual(mergeSaves(save({ updated: 3, precs: "bad" }), save({ updated: 1 })).precs, {}, "junk is dropped");
});

test("coins and tickets add up across devices through each device's ledger, like the original", () => {
  // Both started from the same synced save: 500 coins and 2 tickets, then each played on its own.
  const base = { c: [500, 0], t1: [2, 0], t10: [0, 0] };
  const laptop = save({ updated: 10, coins: 800, tickets: { t1: 1, t10: 0 }, led: { base, dlaptop: { c: [300, 0], t1: [0, 1] } } });
  const phone = save({ updated: 20, coins: 450, tickets: { t1: 4, t10: 1 }, led: { base, dphone: { c: [150, 200], t1: [2, 0], t10: [1, 0] } } });
  const merged = mergeSaves(laptop, phone);
  assert.equal(merged.coins, 500 + 300 + 150 - 200, "what each device earned and spent counts, not just the newer save");
  assert.deepEqual(merged.tickets, { t1: 2 - 1 + 2, t10: 1 });
  assert.deepEqual(mergeSaves(merged, laptop), merged, "merging again changes nothing");
  // A save from before the ledger: its balance becomes the starting entry.
  const legacy = mergeSaves(save({ updated: 5, coins: 900 }), save({ updated: 9, coins: 120 }));
  assert.equal(legacy.coins, 900, "without a ledger the higher balance is kept, like the original");
});

test("runs are checked for nonsense, not for level or defeated caps", () => {
  assert.ok(validateRun({ mode: "s", t: 600, lv: 40, kills: 3000, dex: 25 }));
  // Like the original, level and defeated counts aren't capped; only nonsense is refused.
  // Since the Judgment fix (18-10-2026) Arceus one-shots you around minute 40: runs are capped at 45, like the original.
  assert.ok(validateRun({ mode: "s", t: 39 * 60, lv: 120, kills: 8000, dex: 25 }), "a 39-minute run against Arceus");
  assert.ok(validateRun({ mode: "s", t: 1980, lv: 1500, kills: 90_000, dex: 25 }), "a 33-minute run that faced Arceus");
  assert.ok(validateRun({ mode: "s", t: MAX_RUN_S, lv: 90, kills: 5000, dex: 25 }), "right at the cap");
  assert.equal(validateRun({ mode: "s", t: MAX_RUN_S + 1, lv: 90, kills: 5000, dex: 25 }), null, "past the Judgment's cap");
  assert.equal(validateRun({ mode: "s", t: 600, lv: 0, kills: 10, dex: 25 }), null, "level 0");
  assert.equal(validateRun({ mode: "s", t: 60, lv: 5, kills: -1, dex: 25 }), null, "negative defeated");
  assert.equal(validateRun({ mode: "s", t: 90_000, lv: 5, kills: 5, dex: 25 }), null, "longer than a run token lives");
  assert.equal(validateRun({ mode: "s", t: 60, lv: 5, kills: 5, dex: 0 }), null, "unknown Pokémon");
  assert.equal(validateRun({ mode: "g", t: 60, lv: 5, kills: 5, members: [{ uid: "1", dex: 25 }] }), null, "a group needs two players");
  assert.equal(validateRun({ mode: "g", t: 60, lv: 5, kills: 5, members: [{ uid: "1", dex: 25 }, { uid: "1", dex: 4 }] }), null, "no duplicate players");
  assert.equal(periodIds(new Date("2026-10-11T23:30:00Z")).d, "d20261012r", "periods follow Madrid time, like the original");
  assert.equal(periodIds().a, "all3", "every board restarted after the Judgment fix (18-10-2026), like the original");
  assert.match(periodIds(new Date("2026-10-14T12:00:00Z")).w, /^w2026-42r$/);
  assert.match(periodIds(new Date("2026-10-14T12:00:00Z")).m, /^m202610r$/);
});

test("nicknames are unique, saves merge on the server, and deleting the account removes everything", (t) => {
  const data = useTempData();
  t.after(data.restore);
  const service = createPokesurvivorService();
  assert.equal(service.claimNick("1", "Ash"), "Ash");
  assert.throws(() => service.claimNick("2", "ash"), { code: "taken" });
  assert.throws(() => service.claimNick("2", "a"), { code: "bad-nick" });
  assert.equal(service.claimNick("2", "Misty"), "Misty");

  service.storeSave("1", save({ updated: 10, owned: { 1: { at: 1 } } }));
  const merged = service.storeSave("1", save({ updated: 5, owned: { 4: { at: 2 } } }));
  assert.deepEqual(Object.keys(merged.owned).sort(), ["1", "4"], "an older device never drops a catch");
  assert.throws(() => service.storeSave("1", { nope: true }), { code: "bad-save" });

  service.requestFriend("1", "misty");
  service.acceptFriend("2", "1");
  const token = issueRunToken("pokesurvivor", Date.now() - minutes(20));
  service.submitRun(user("1"), { mode: "s", t: 600, lv: 30, kills: 900, dex: 25, runToken: token });
  service.deleteAccount("1");
  assert.equal(service.readSave("1"), null);
  assert.equal(service.nickOf("1"), null);
  assert.equal(existsSync(join(data.directory, "pokesurvivor-saves", "1.json")), false);
  assert.equal(service.siteScore("1"), null);
  assert.deepEqual(service.rankingView("2", new URLSearchParams("mode=s&period=a")).rows, []);
  assert.deepEqual(service.snapshot("2").friends, []);
  assert.equal(service.claimNick("3", "Ash"), "Ash", "the freed nickname can be taken again");
});

test("friends see each other online through the stream, and rooms follow the original rules", (t) => {
  const data = useTempData();
  t.after(data.restore);
  const service = createPokesurvivorService();
  const ids = ["1", "2", "3", "4", "5", "6"];
  ids.forEach((id) => service.claimNick(id, `Trainer${id}`));
  const streams = Object.fromEntries(ids.map((id) => [id, sink()]));
  ids.forEach((id) => service.attachStream(id, streams[id]));

  assert.throws(() => service.requestFriend("1", "nobody"), { code: "no-player" });
  service.requestFriend("1", "trainer2");
  assert.equal(streams[2].last("friends").list[0].status, "in");
  assert.throws(() => service.requestFriend("1", "trainer2"), { code: "sent" });
  service.requestFriend("2", "trainer1");
  const mine = streams[1].last("friends").list[0];
  assert.equal(mine.status, "ok");
  assert.equal(mine.online, true);

  service.setPlaying("2", true);
  assert.equal(streams[1].last("friends").list[0].play, true);

  // Sessions work like NZ:P's Create / Join Game: a name, an optional password and a size.
  const room = service.createRoom("1", { dex: 25, shiny: false, name: "Night <b>shift</b>", password: "pika", max: 4 });
  assert.equal(room.name, "Night bshift/b", "no markup in session names");
  assert.equal(room.locked, true);
  assert.deepEqual(service.sessionsList().map(({ name, host, players, max, locked }) => ({ name, host, players, max, locked })), [{ name: "Night bshift/b", host: "Trainer1", players: 1, max: 4, locked: true }]);
  assert.equal(JSON.stringify(service.sessionsList()).includes("pika"), false, "the password never leaves the server");
  assert.throws(() => service.joinRoom("3", room.id, { dex: 4 }), { code: "room-locked" });
  assert.throws(() => service.joinRoom("3", room.id, { dex: 4, password: "chu" }), { code: "room-password" });
  assert.throws(() => service.invite("1", "3"), { code: "not-friends" });
  service.joinRoom("2", room.id, { dex: 7, password: "pika" });
  assert.deepEqual(streams[1].last("room").room.members.map((m) => m.uid), ["1", "2"]);

  assert.throws(() => service.relay("3", "1", [{ f: "3", d: {} }]), { code: "not-in-room" });
  service.relay("2", "1", [{ f: "2", sig: { c: "candidate" } }]);
  assert.deepEqual(streams[1].last("relay"), { f: "2", items: [{ f: "2", sig: { c: "candidate" } }] });

  for (const id of ["3", "4", "5"]) { service.requestFriend("1", `trainer${id}`); service.acceptFriend(id, "1"); }
  service.invite("1", "3");
  assert.equal(streams[3].last("invites").list[0].room, room.id);
  service.joinRoom("3", room.id, {});
  assert.equal(service.snapshot("3").room.id, room.id, "an invite skips the password");
  service.joinRoom("4", room.id, { password: "pika" });
  assert.throws(() => service.joinRoom("5", room.id, { password: "pika" }), { code: "room-full" });
  service.leaveRoom("4");
  service.setRoomOpen("1", false);
  assert.deepEqual(service.sessionsList(), [], "started games leave the list");
  assert.throws(() => service.joinRoom("5", room.id, { password: "pika" }), { code: "room-started" });
  assert.throws(() => service.setRoomOpen("2", true), { code: "not-host" });

  // Public two-player session with the default name: anyone can join until it's full.
  const duo = service.createRoom("5", { max: 2 });
  assert.equal(duo.name, "Trainer5 co-op");
  service.joinRoom("6", duo.id, {});
  assert.throws(() => service.joinRoom("4", duo.id, {}), { code: "room-full" });

  // The host of a started game with two or more others left: the game goes on
  // and the longest-standing member becomes the host.
  service.leaveRoom("1");
  const moved = streams[2].last("room");
  assert.deepEqual(moved.migrated, { from: "1", to: "2" });
  assert.equal(moved.room.host, "2");
  assert.deepEqual(moved.room.members.map((m) => m.uid), ["2", "3"]);
  assert.deepEqual(streams[3].last("room").migrated, { from: "1", to: "2" }, "everyone left hears about it");
  assert.deepEqual(streams[1].last("room"), { room: null, id: room.id });
  assert.equal(service.snapshot("2").room.host, "2");
  // ...but with only one player left there is no one to hand it to: closed.
  service.leaveRoom("2");
  assert.deepEqual(streams[3].last("room"), { room: null, id: room.id, closed: true }, "the last host leaving closes the room");
  assert.equal(service.snapshot("3").room, null);

  // In the waiting room the host leaving still closes it (they can hand it over first).
  const lobby = service.createRoom("1", { dex: 25 });
  service.joinRoom("3", lobby.id, {});
  service.joinRoom("4", lobby.id, {});
  assert.throws(() => service.transferHost("3", "4"), { code: "not-host" });
  assert.throws(() => service.transferHost("1", "6"), { code: "not-member" });
  assert.throws(() => service.transferHost("1", "1"), { code: "not-member" });
  assert.equal(service.transferHost("1", "4").host, "4");
  assert.deepEqual(streams[3].last("room").transferred, { from: "1", to: "4" });
  assert.equal(service.sessionsList().find((s) => s.id === lobby.id).host, "Trainer4", "the open list shows the new host");
  service.setRoomOpen("4", false);
  assert.throws(() => service.transferHost("4", "1"), { code: "room-started" }, "only before the game starts");
  service.setRoomOpen("4", true);
  service.leaveRoom("4");
  assert.deepEqual(streams[3].last("room"), { room: null, id: lobby.id, closed: true }, "the host leaving the waiting room closes it");

  // A second tab takes over the stream; the first one stops reconnecting.
  const tab = sink();
  service.attachStream("1", tab);
  assert.equal(streams[1].events.at(-1).event, "replaced");
  assert.equal(tab.events[0].event, "hello");
});

test("rankings: solo boards per period, group runs only for the team that started, and the site leaderboard", (t) => {
  const data = useTempData();
  t.after(data.restore);
  let clock = Date.UTC(2026, 9, 12, 12);
  const service = createPokesurvivorService({ now: () => clock });
  ["1", "2", "3"].forEach((id) => service.claimNick(id, `Trainer${id}`));
  const token = issueRunToken("pokesurvivor", clock - minutes(30));

  assert.throws(() => service.submitRun(user("9"), { mode: "s", t: 60, lv: 5, kills: 5, dex: 25, runToken: token }), { code: "need-nick" });
  assert.throws(() => service.submitRun(user("1"), { mode: "s", t: 600, lv: 30, kills: 900, dex: 25 }), { code: "run-token" });
  assert.throws(() => service.submitRun(user("1"), { mode: "s", t: 2000, lv: 30, kills: 900, dex: 25, runToken: token }), { code: "run-too-long" }, "33 min on a 30-min-old token");

  const first = service.submitRun(user("1", "Dai"), { mode: "s", t: 600, lv: 30, kills: 900, dex: 25, shiny: true, runToken: token });
  assert.deepEqual(first.better.sort(), ["a", "d", "m", "w"]);
  assert.equal(first.score.rank, 1);
  assert.equal(first.score.bestScore, 600);
  assert.deepEqual(service.submitRun(user("1", "Dai"), { mode: "s", t: 300, lv: 20, kills: 300, dex: 4, runToken: token }).better, [], "a worse run improves nothing");
  service.submitRun(user("2"), { mode: "s", t: 900, lv: 40, kills: 1200, dex: 7, runToken: token });

  const all = service.rankingView("1", new URLSearchParams("mode=s&period=a"));
  assert.deepEqual(all.rows.map((row) => row.uids[0]), ["2", "1"]);
  assert.deepEqual(all.me, { pos: 2, t: 600, row: all.rows[1] });
  assert.equal(all.rows[1].names[0], "Trainer1", "the in-game board shows nicknames");
  assert.deepEqual(service.rankingView("1", new URLSearchParams("mode=s&period=a&dex=25")).rows.map((row) => row.uids[0]), ["1"], "per-Pokémon all-time board");
  assert.deepEqual(service.rankingView("1", new URLSearchParams("mode=s&period=a&friends=1")).rows.map((row) => row.uids[0]), ["1"], "friends only: just you until you add someone");

  // The site's board (TV trophy, passport, terminal) uses Discord names.
  const site = service.siteLeaderboard(10);
  assert.deepEqual(site.map((entry) => [entry.discordId, entry.bestScore]), [["2", 900], ["1", 600]]);
  assert.equal(site[1].username, "Dai");
  assert.equal(site[1].bestLevel, 30, "the best run's level, not the later worse one");

  // Group: only the host, and only with the team that started the game.
  service.requestFriend("1", "trainer2"); service.acceptFriend("2", "1");
  const room = service.createRoom("1", { dex: 25 });
  service.joinRoom("2", room.id, { dex: 7 });
  const team = [{ uid: "1", dex: 25 }, { uid: "2", dex: 7 }];
  assert.throws(() => service.submitRun(user("1"), { mode: "g", t: 300, lv: 20, kills: 400, members: team, runToken: token }), { code: "bad-team" }, "the game never started");
  service.setRoomOpen("1", false);
  assert.throws(() => service.submitRun(user("2"), { mode: "g", t: 300, lv: 20, kills: 400, members: team, runToken: token }), { code: "bad-team" }, "guests don't submit");
  assert.throws(() => service.submitRun(user("1"), { mode: "g", t: 300, lv: 20, kills: 400, members: [team[0], { uid: "3", dex: 4 }], runToken: token }), { code: "bad-team" });
  service.submitRun(user("1"), { mode: "g", t: 300, lv: 20, kills: 400, members: team, runToken: token });
  const group = service.rankingView("2", new URLSearchParams("mode=g&period=w"));
  assert.equal(group.rows[0].id, "1_2");
  assert.deepEqual(group.rows[0].names, ["Trainer1", "Trainer2"]);
  assert.equal(group.me.pos, 1, "everyone in the team sees the group's rank");
  assert.equal(service.siteScore("1").bestScore, 600, "group runs stay out of the solo site board");

  // The passport's secret medals: catches from the save (only real dex numbers),
  // and the squad board counts for every member of the team.
  service.storeSave("1", save({ updated: 20, owned: { 1: { at: 1 }, 4: { at: 1 }, 9999: { at: 1 } }, shiny: { 25: { at: 1 } }, legends: { 150: 1 } }));
  assert.deepEqual(service.passportStats("1"), { dex: 2, shinies: 1, legends: 1, groupBest: 300, squadRuns: 1 });
  assert.deepEqual(service.passportStats("2"), { dex: 0, shinies: 0, legends: 0, groupBest: 300, squadRuns: 1 });
  assert.deepEqual(service.passportStats("3"), { dex: 0, shinies: 0, legends: 0, groupBest: 0, squadRuns: 0 });

  // Next day: the daily board starts empty again.
  clock += DAY;
  assert.deepEqual(service.rankingView("1", new URLSearchParams("mode=s&period=d")).rows, []);
});

test("after a host migration the new host submits the group mark, for the team that started", (t) => {
  const data = useTempData();
  t.after(data.restore);
  const clock = Date.UTC(2026, 9, 12, 12);
  const service = createPokesurvivorService({ now: () => clock });
  ["1", "2", "3"].forEach((id) => service.claimNick(id, `Trainer${id}`));
  const token = issueRunToken("pokesurvivor", clock - minutes(30));
  const room = service.createRoom("1", { dex: 25 });
  service.joinRoom("2", room.id, { dex: 7 });
  service.joinRoom("3", room.id, { dex: 4 });
  service.setRoomOpen("1", false);
  service.leaveRoom("1");
  const team = [{ uid: "1", dex: 25 }, { uid: "2", dex: 7 }, { uid: "3", dex: 4 }];
  assert.throws(() => service.submitRun(user("1"), { mode: "g", t: 400, lv: 20, kills: 400, members: team, runToken: token }), { code: "bad-team" }, "the host who left no longer submits");
  assert.throws(() => service.submitRun(user("3"), { mode: "g", t: 400, lv: 20, kills: 400, members: team, runToken: token }), { code: "bad-team" }, "nor does a guest");
  assert.deepEqual(service.submitRun(user("2"), { mode: "g", t: 400, lv: 20, kills: 400, members: team, runToken: token }).better.sort(), ["a", "d", "m", "w"]);
  assert.equal(service.rankingView("3", new URLSearchParams("mode=g&period=w")).rows[0].id, "1_2_3");
});

test("surviving five minutes completes PokéSurvivor's daily challenge, mid-run or at the end", (t) => {
  const data = useTempData();
  t.after(data.restore);
  const day = pokesurvivorDay();
  const service = createPokesurvivorService({ now: () => day });
  const token = issueRunToken("pokesurvivor", day - minutes(10));
  assert.throws(() => service.checkChallenge(user("1"), { score: 400, durationMs: minutes(2), runToken: token }), { code: "bad-run" }, "game time can't outrun real time");
  assert.equal(service.checkChallenge(user("1"), { score: 120, durationMs: minutes(2), runToken: token }).daily.complete, false);
  const done = service.checkChallenge(user("1"), { score: 310, durationMs: minutes(6), runToken: token }).daily;
  assert.equal(done.complete, true);
  assert.ok(readPlayers()["1"].cosmetics.includes("Trainer"));
  assert.equal(dailyChallenge(day).task, "Survive 5 minutes");
});

test("the API needs a Discord session for anything personal and refuses cross-site writes", async (t) => {
  const data = useTempData();
  t.after(data.restore);
  const service = createPokesurvivorService();
  const server = createServer((request, response) => handlePokesurvivorRequest(request, response, service));
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  t.after(() => new Promise((done) => server.close(done)));
  async function api(path, { id, body, method = body ? "POST" : "GET", headers = {} } = {}) {
    const payload = Buffer.from(JSON.stringify({ id, username: `user${id}`, exp: Date.now() + 60000 })).toString("base64url");
    const token = `${payload}.${createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(payload).digest("base64url")}`;
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/pokesurvivor/${path}`, {
      method, headers: { "Content-Type": "application/json", ...(id ? { Cookie: `daivr_comment_session=${token}` } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, data: await response.json() };
  }
  assert.deepEqual((await api("me")).data, { authenticated: false, user: null, nick: null, score: null });
  assert.equal((await api("social")).status, 401);
  assert.equal((await api("save", { id: "11", body: { save: save() }, headers: { Origin: "https://evil.test" } })).status, 403);
  assert.equal((await api("save", { id: "11", body: { save: save({ coins: 777 }) } })).data.save.coins, 777);
  const me = (await api("me?save=1", { id: "11" })).data;
  assert.equal(me.user.id, "11");
  assert.equal(me.save.coins, 777);
  assert.equal("save" in (await api("me", { id: "11" })).data, false, "the TV's /me doesn't carry the save");
  assert.equal((await api("nick", { id: "11", body: { name: "Brock" } })).data.nick, "Brock");
  assert.deepEqual((await api("leaderboard?limit=5")).data, { leaderboard: [] });
  assert.equal((await api("account", { id: "11", method: "DELETE" })).status, 200);
  assert.equal((await api("me?save=1", { id: "11" })).data.save, null);
});

test("the cartridge sits before NZ:P on the shelf and its folder gets the game CSP", () => {
  assert.equal(availableKonamiGames(false).at(-1).id, "pokesurvivor");
  assert.equal(availableKonamiGames(true).at(-1).id, "nzp", "the journal reward stays last");
  assert.equal(availableKonamiGames(true).length, 7);
  assert.equal(availableKonamiGames(true, true).some(({ id }) => id === "pokesurvivor"), false, "desktop only, like NZ:P");
  const policy = securityHeaders({ headers: {} }, "/pokesurvivor/index.html")["Content-Security-Policy"];
  assert.ok(policy.includes("'unsafe-inline'"), "the page's language script runs");
});

test("the build's tar reader follows GitHub's pax paths and strips the top folder", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "daivr-pokesurvivor-tar-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const block = (name, type, body = Buffer.alloc(0)) => {
    const header = Buffer.alloc(512);
    header.write(name, 0, 100);
    header.write(body.length.toString(8).padStart(11, "0"), 124, 12);
    header.write(type, 156, 1);
    return Buffer.concat([header, body, Buffer.alloc(Math.ceil(body.length / 512) * 512 - body.length)]);
  };
  const long = `repo-abc/assets/pokemon/25/${"x".repeat(120)}.png`;
  const pax = Buffer.from(`${long.length + 9 + String(long.length + 9).length} path=${long}\n`);
  const tar = Buffer.concat([block("pax_global_header", "g", Buffer.from("52 comment=abc\n")), block("repo-abc/", "5"), block("repo-abc/LICENSE", "0", Buffer.from("MIT")), block("PaxHeader", "x", pax), block("short-name", "0", Buffer.from("png")), block("repo-abc/../evil", "0", Buffer.from("no")), Buffer.alloc(1024)]);
  extractTar(tar, directory);
  assert.equal(existsSync(join(directory, "LICENSE")), true);
  assert.equal(existsSync(join(directory, "assets", "pokemon", "25", `${"x".repeat(120)}.png`)), true);
  assert.equal(existsSync(join(directory, "..", "evil")), false);
});

test("the build lists each Pokémon's first Idle frame for the TV's co-op board", () => {
  const meta = [
    "G.SPRITE_META = {",
    '  25: {"s":1,"a":{"Idle":{"w":40,"h":56,"n":6,"r":8},"Walk":{"w":32,"h":40,"n":4,"r":8}},"sh":1},',
    '  132: {"s":1,"a":{"Idle":{"w":24,"h":32,"n":2,"r":8}}},',
    '  351: {"s":1,"a":{"Idle":{"w":32,"h":32,"n":4,"r":8}},"sh":1,"sa":{"Idle":{"w":40,"h":48,"n":4,"r":8}}},',
    "};"
  ].join("\r\n");
  assert.deepEqual(idleFrames(meta), { 25: [40, 56], 132: [24, 32, 0], 351: [32, 32, 40, 48] });
});
