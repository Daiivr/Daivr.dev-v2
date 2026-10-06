import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FISH_CATALOG } from "../shared/buddy-catches.mjs";
import { FIELD_FINDS, isBuddyJournalComplete } from "../shared/buddy-journal.mjs";
import { availableKonamiGames } from "../src/data/konamiGames.js";
import { DAILY_CHALLENGES, dailyChallenge, dailyChallengeKey, dailyChallengeValue } from "../shared/player-catalog.mjs";
import { readPlayers, recordDailyRun } from "../server/player-store.mjs";
import { securityHeaders } from "../server/security-headers.mjs";
import { createNzpRankings, handleNzpRequest, validateNzpGame } from "../server/nzp.mjs";
import { issueRunToken } from "../server/run-tokens.mjs";
import { nzpPlayerName } from "../public/nzp/player-name.mjs";
import { nzpStatsLine } from "../public/nzp/stats-line.mjs";
import { crc16, hashTableQc } from "../tools/nzp-qc/build.mjs";

const complete = () => ({
  fishCollection: Object.fromEntries(FISH_CATALOG.map(({ id }) => [id, 1])),
  foundObjects: Object.fromEntries(FIELD_FINDS.map(({ id }) => [id, 1]))
});
const minutes = (count) => count * 60_000;
const DAY = 86_400_000;

// Every store these tests touch (NZ:P rankings, passports, Buddy saves) goes to
// a temporary folder, never the repo's data/.
function useTempData() {
  const directory = mkdtempSync(join(tmpdir(), "daivr-nzp-test-"));
  const keys = ["NZP_DATA_DIR", "COMMENTS_DATA_DIR", "GAME_DATA_DIR", "COMMENTS_SESSION_SECRET"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, { NZP_DATA_DIR: directory, COMMENTS_DATA_DIR: directory, GAME_DATA_DIR: directory, COMMENTS_SESSION_SECRET: "nzp-test-only-secret" });
  // A missing store file is copied in from the repo's data/ (legacy migration in
  // server/storage.mjs), so local games would leak in. Start every store empty.
  for (const [file, empty] of [["nzp-leaderboard.json", { scores: [] }], ["player-passports.json", {}], ["buddy-friendship.json", {}]]) writeFileSync(join(directory, file), JSON.stringify(empty));
  return () => {
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    rmSync(directory, { recursive: true, force: true });
  };
}

// The first day from `start` whose shared slot is NZ:P's.
function nzpDay(start = Date.UTC(2026, 9, 1)) {
  for (let day = 0; day < 8; day++) if (dailyChallenge(start + day * DAY, { nzp: true }).game === "nzp") return start + day * DAY + 3_600_000;
  throw new Error("NZ:P never takes a daily slot");
}

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

test("the game frame gets its own CSP for the upstream engine, Frag-Net co-op and the loader fonts", () => {
  const policy = securityHeaders({ headers: {} }, "/")["Content-Security-Policy"];
  assert.ok(policy.includes("frame-src 'self';"));
  const gamePolicy = securityHeaders({ headers: {} }, "/nzp/index.html")["Content-Security-Policy"];
  for (const source of ["https://nzp.gay", "wss://master.frag-net.com:27950", "https://fonts.googleapis.com", "https://fonts.gstatic.com"]) assert.ok(gamePolicy.includes(source), source);
  assert.equal(gamePolicy.includes("unsafe-inline"), false);
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

test("the game's stats lines parse, and anything else is ignored", () => {
  assert.deepEqual(nzpStatsLine("[daivr] nzp-stats round 12 87 31 15340 ndu 1\n"), { phase: "round", round: 12, kills: 87, headshots: 31, score: 15340, map: "ndu", startRound: 1 });
  assert.deepEqual(nzpStatsLine("[daivr] nzp-stats end 33 9 2 1200 nzp_warehouse2 30"), { phase: "end", round: 33, kills: 9, headshots: 2, score: 1200, map: "nzp_warehouse2", startRound: 30 });
  for (const text of ["client Dai connected", "[daivr] nzp-stats round 3 9 2 1200 ndu", "[daivr] nzp-stats start 1 0 0 0 ndu 1", "[daivr] nzp-stats end -1 0 0 0 ndu 1", "[daivr] nzp-stats end 1 0 0 0 nd u 1", "[daivr] nzp-stats end 1 0 0 0 ndu 1 extra"]) {
    assert.equal(nzpStatsLine(text), null, text);
  }
});

test("the QuakeC build ports upstream's CRC16 hash table generator", () => {
  assert.equal(crc16("123456789"), 0x29b1, "CRC-16/IBM-3740 check value");
  const qc = hashTableQc("old_path,current_path\nprogs/b.mdl,models/b.mdl\nprogs/a.mdl,models/a.mdl\n");
  const rows = qc.split("\n").filter((line) => line.startsWith("{"));
  assert.deepEqual(rows.map((row) => Number(row.slice(1, row.indexOf(",")))), [crc16("progs/b.mdl"), crc16("progs/a.mdl")].sort((a, b) => a - b));
  assert.match(qc, /^var struct \{\nfloat old_path_crc;\nstring current_path;\nfloat crc_strlen;\n\}asset_conversion_table\[\]=\{\n/);
  assert.match(qc, /,"models\/a\.mdl",11\}/);
});

test("NZ:P games validate against the client's limits and a plausible pace", () => {
  const game = (fields) => ({ round: 2, kills: 10, headshots: 0, score: 100, map: "ndu", startRound: 1, durationMs: minutes(5), ...fields });
  assert.deepEqual(validateNzpGame(game({ round: 12, kills: 180, headshots: 60, score: 21_000, durationMs: minutes(25) })).game, { round: 12, kills: 180, headshots: 60, score: 21_000, map: "ndu", durationMs: minutes(25) });
  for (const body of [{}, game({ round: 0 }), game({ round: 256, durationMs: minutes(60) }), game({ kills: 1.5 }), game({ map: "../evil" }),
    game({ headshots: 11 }), game({ headshots: undefined }), game({ headshots: -1 }), game({ startRound: undefined }), game({ startRound: 0 })]) {
    assert.equal(validateNzpGame(body).game, undefined, JSON.stringify(body));
  }
  assert.equal(validateNzpGame(game({ map: "weapon_test" })).status, 422, "developer test map");
  assert.equal(validateNzpGame(game({ round: 31, startRound: 30, durationMs: minutes(30) })).status, 422, "START ROUND past 1");
  assert.equal(validateNzpGame(game({ round: 30, durationMs: minutes(1) })).status, 422, "30 rounds in a minute");
  assert.equal(validateNzpGame(game({ kills: 5000, durationMs: minutes(1) })).status, 422, "5000 kills in a minute");
  assert.equal(validateNzpGame(game({ score: 900_000 })).status, 422, "points out of all proportion");
});

test("rankings keep each player's best round and their total kills and points across games", () => {
  let saved = [];
  const rankings = createNzpRankings({ read: () => structuredClone(saved), write: (entries) => { saved = entries; } });
  const user = (id) => ({ id, username: `Player ${id}`, avatarUrl: "" });
  rankings.record(user("a"), { round: 12, kills: 100, score: 9000, map: "ndu" }, "2026-10-01T00:00:00.000Z");
  rankings.record(user("a"), { round: 8, kills: 60, score: 5000, map: "nzp_xmas2" }, "2026-10-02T00:00:00.000Z");
  rankings.record(user("b"), { round: 12, kills: 400, score: 30000, map: "lexi_temple" }, "2026-10-03T00:00:00.000Z");
  assert.deepEqual(rankings.forUser("a"), { bestRound: 12, bestRoundMap: "ndu", totalKills: 160, totalScore: 14000, games: 2, ranks: { round: 1, kills: 2, score: 2 } });
  assert.deepEqual(rankings.leaderboard("round").map(({ discordId, value, map }) => [discordId, value, map]), [["a", 12, "ndu"], ["b", 12, "lexi_temple"]], "ties go to whoever got there first");
  assert.deepEqual(rankings.leaderboard("kills").map(({ discordId, value }) => [discordId, value]), [["b", 400], ["a", 160]]);
  assert.deepEqual(rankings.leaderboard("score").map(({ discordId, value }) => [discordId, value]), [["b", 30000], ["a", 14000]]);
  assert.equal(rankings.forUser("nobody"), null);
});

test("a best round saved on a test map before those were refused drops off the round ranking", () => {
  let saved = [{ discordId: "aoi", username: "Aoi", bestRound: 2, bestRoundMap: "weapon_test", totalKills: 15, totalScore: 1640, games: 2 }];
  const rankings = createNzpRankings({ read: () => structuredClone(saved), write: (entries) => { saved = entries; } });
  assert.deepEqual(rankings.leaderboard("round"), []);
  assert.deepEqual(rankings.leaderboard("kills").map(({ discordId, value }) => [discordId, value]), [["aoi", 15]], "totals stay");
  assert.equal(rankings.forUser("aoi").ranks.round, null);
  // The next real game sets a fresh best, even a lower round.
  rankings.record({ id: "aoi", username: "Aoi", avatarUrl: "" }, { round: 1, kills: 5, score: 1140, map: "ndu" });
  assert.deepEqual(rankings.leaderboard("round").map(({ discordId, value, map }) => [discordId, value, map]), [["aoi", 1, "ndu"]]);
  assert.equal(saved[0].bestRoundMap, "ndu");
});

test("HTTP rankings need a Discord session, a run token and a plausible game", async (t) => {
  const restore = useTempData(t);
  const server = createServer(handleNzpRequest);
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  t.after(async () => {
    await new Promise((done) => server.close(done));
    restore();
  });
  async function api(path, { id, body, method = body ? "POST" : "GET", headers = {} } = {}) {
    const payload = Buffer.from(JSON.stringify({ id, username: id, exp: Date.now() + 60000 })).toString("base64url");
    const token = `${payload}.${createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(payload).digest("base64url")}`;
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/nzp/${path}`, {
      method, headers: { "Content-Type": "application/json", ...(id ? { Cookie: `daivr_comment_session=${token}` } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, data: await response.json() };
  }
  const game = { round: 9, kills: 120, headshots: 40, score: 11_000, map: "ndu", startRound: 1, durationMs: minutes(15) };
  const runToken = issueRunToken("nzp", Date.now() - minutes(20));
  assert.equal((await api("game", { body: { ...game, runToken } })).status, 401);
  assert.equal((await api("game", { id: "alice", body: { ...game, runToken }, headers: { Origin: "https://other.test" } })).status, 403);
  assert.equal((await api("game", { id: "alice", body: game })).status, 400, "no run token");
  assert.equal((await api("game", { id: "alice", body: { ...game, runToken: issueRunToken("nzp") } })).status, 422, "longer than the token has existed");
  assert.equal((await api("game", { id: "alice", body: { ...game, runToken: issueRunToken("tower-block", Date.now() - minutes(20)) } })).status, 400, "another game's token");
  const saved = await api("game", { id: "alice", body: { ...game, runToken } });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data.stats, { bestRound: 9, bestRoundMap: "ndu", totalKills: 120, totalScore: 11_000, games: 1, ranks: { round: 1, kills: 1, score: 1 } });
  assert.equal((await api("me", { id: "alice" })).data.stats.games, 1);
  assert.equal((await api("me")).data.authenticated, false);
  const boards = await api("leaderboard?board=kills");
  assert.deepEqual([boards.data.board, boards.data.leaderboard.map(({ discordId, value }) => [discordId, value])], ["kills", [["alice", 120]]]);
  assert.equal((await api("leaderboard?board=nope")).status, 400);
  assert.ok((await api("run", { method: "POST" })).data.token.length > 40);
});

test("NZ:P takes one daily slot with a rotating goal, and players without it keep a regular challenge", () => {
  const day = nzpDay();
  const locked = dailyChallenge(day), unlocked = dailyChallenge(day, { nzp: true });
  assert.equal(unlocked.game, "nzp");
  assert.ok(["round", "headshots", "kills", "score"].includes(unlocked.metric));
  assert.ok(unlocked.task && unlocked.reward);
  assert.notEqual(locked.game, "nzp");
  assert.equal(locked.fallback, true);
  assert.equal(locked.date, unlocked.date);
  const laps = Array.from({ length: 4 }, (_, lap) => dailyChallenge(day + lap * DAILY_CHALLENGES.length * DAY, { nzp: true }));
  assert.deepEqual(new Set(laps.map((challenge) => challenge.game)), new Set(["nzp"]));
  assert.equal(new Set(laps.map((challenge) => challenge.metric)).size, 4, "every NZ:P day has the next goal");
  for (let offset = 1; offset < DAILY_CHALLENGES.length; offset++) {
    assert.deepEqual(dailyChallenge(day + offset * DAY), dailyChallenge(day + offset * DAY, { nzp: true }), "other days are the same for everyone");
  }
  const stats = { round: 7, kills: 90, headshots: 33, score: 9000 };
  assert.equal(dailyChallengeValue(unlocked, stats), stats[unlocked.metric]);
  assert.equal(dailyChallengeValue(locked, 42), 42);
  assert.notEqual(dailyChallengeKey(locked), dailyChallengeKey(unlocked));
});

test("NZ:P games count for the daily goal only for players who have NZ:P", (t) => {
  t.after(useTempData());
  const day = nzpDay();
  const challenge = dailyChallenge(day, { nzp: true });
  const result = (value) => ({ round: 1, kills: 0, headshots: 0, score: 0, [challenge.metric]: value });
  writeFileSync(join(process.env.NZP_DATA_DIR, "nzp-leaderboard.json"), JSON.stringify({ scores: [{ discordId: "zed", games: 3 }] }));
  const zed = { id: "zed", username: "Zed" }, ana = { id: "ana", username: "Ana" };
  assert.equal(recordDailyRun(zed, "nzp", result(challenge.goal - 1), day).complete, false);
  assert.equal(recordDailyRun(zed, "nzp", result(challenge.goal), day).complete, true);
  assert.equal(readPlayers().zed.daily.key, dailyChallengeKey(challenge));
  assert.equal(recordDailyRun(ana, "nzp", result(challenge.goal * 10), day), undefined, "Ana has no NZ:P, so her challenge is a regular game");
  const fallback = dailyChallenge(day);
  assert.equal(recordDailyRun(ana, fallback.game, fallback.goal, day).complete, true);
});
