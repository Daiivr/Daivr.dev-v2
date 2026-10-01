import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { getCacheControl, loadHashedAssets } from "../server/asset-cache.mjs";
import { readJsonStore, writeJsonStore } from "../server/json-store.mjs";
import { handleCommentsRequest } from "../server/comments.mjs";
import { handlePlayerRequest } from "../server/player.mjs";
import { handleBuddyRequest } from "../server/buddy.mjs";
import { FISH_CATALOG } from "../shared/buddy-catches.mjs";
import { handleTowerBlockRequest } from "../server/tower-block.mjs";
import { handleCrossRoadRequest } from "../server/cross-road.mjs";
import { handleSpaceCadetPinballRequest } from "../server/space-cadet-pinball.mjs";
import { dailyChallenge } from "../shared/player-catalog.mjs";
import { recordDailyRun, readPlayers, writePlayers } from "../server/player-store.mjs";
import { assertSessionConfiguration } from "../server/http-guards.mjs";
import { inboxEvents } from "../server/community-inbox.mjs";
import { reserveCommentPost } from "../server/comment-posting.mjs";
import { loadCommentDraft, saveCommentDraft } from "../src/lib/commentDrafts.js";

test("drafts survive reloads, stay account-specific, and tolerate blocked storage", () => {
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const draft = { draft: "Come join me", replyingTo: "thread", replyDraft: "Saved reply", draftMentions: [{ id: "bob", username: "Bob" }] };
  assert.equal(saveCommentDraft("alice", draft), true);
  assert.equal(loadCommentDraft("alice").replyDraft, "Saved reply");
  assert.equal(loadCommentDraft("bob"), null);
  assert.equal(loadCommentDraft("alice").draftMentions[0].id, "bob");
  globalThis.localStorage = { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } };
  assert.equal(loadCommentDraft("alice"), null);
  assert.equal(saveCommentDraft("alice", draft), false);
  delete globalThis.localStorage;
});

test("cache policy distinguishes build outputs from mutable public assets", () => {
  const assets = new Set([resolve("dist/assets/index-abcd1234.js")]);
  assert.match(getCacheControl(resolve("dist/assets/index-abcd1234.js"), assets), /immutable/);
  for (const path of ["dist/assets/banner-portrait.webp", "dist/games/game.js", "dist/favicon.png", "dist/host.vrm"]) {
    assert.equal(getCacheControl(path, assets), "public, max-age=0, must-revalidate");
  }
  assert.equal(getCacheControl("dist/index.html", assets), "no-cache");
  assert.equal(loadHashedAssets("no-such-build").size, 0);
});

test("inbox only notifies participants after they join and excludes own replies", () => {
  const thread = { id: "root", author: { id: "a" }, mentions: [{ id: "b" }], createdAt: "2026-01-01", replies: [
    { id: "first", author: { id: "a" }, createdAt: "2026-01-02" },
    { id: "invite", author: { id: "b" }, mentions: [{ id: "c" }], createdAt: "2026-01-03" },
    { id: "later", author: { id: "a" }, createdAt: "2026-01-04" }
  ] };
  assert.deepEqual(inboxEvents([thread], { id: "c" }).map((event) => event.id), ["later", "invite"]);
  assert.deepEqual(inboxEvents([thread], { id: "a" }).map((event) => event.id), ["invite"]);
});

test("community API, safe storage, posting limits, passports and daily rewards", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "daivr-community-"));
  const previous = { ...process.env };
  for (const key of ["COMMENTS_DATA_DIR", "DATA_DIR", "GAME_DATA_DIR"]) process.env[key] = dir;
  process.env.COMMENTS_SESSION_SECRET = "community-test-only";
  delete process.env.DISCORD_BOT_TOKEN;
  for (const name of ["comment-inbox.json", "comment-posting.json", "player-passports.json", "preferences.json", "buddy-friendship.json"]) writeFileSync(join(dir, name), "{}");
  for (const game of ["tower-block", "cross-road", "space-cadet-pinball", "madrace"]) writeFileSync(join(dir, `${game}-leaderboard.json`), '{"scores":[]}');
  const alice = { id: "100001", username: "Alice", avatarUrl: "/avatar.png" };
  const bob = { id: "100002", username: "Bob", avatarUrl: "/avatar.png" };
  const fixture = [{ id: "thread", author: alice, text: "Welcome", mentions: [{ id: bob.id, username: bob.username }], createdAt: "2026-01-01T00:00:00Z", replies: [] }];
  writeFileSync(join(dir, "comments.json"), JSON.stringify(fixture));
  const server = createServer((req, res) => {
    const handler = req.url.startsWith("/api/buddy") ? handleBuddyRequest : req.url.startsWith("/api/player") ? handlePlayerRequest : req.url.startsWith("/api/tower-block") ? handleTowerBlockRequest : req.url.startsWith("/api/cross-road") ? handleCrossRoadRequest : req.url.startsWith("/api/space-cadet-pinball") ? handleSpaceCadetPinballRequest : handleCommentsRequest;
    handler(req, res).catch((error) => { res.writeHead(500); res.end(JSON.stringify({ error: error.message })); });
  });
  t.after(async () => {
    await new Promise((done) => server.close(done));
    for (const key of ["COMMENTS_DATA_DIR", "DATA_DIR", "GAME_DATA_DIR", "COMMENTS_SESSION_SECRET", "DISCORD_BOT_TOKEN", "NODE_ENV", "JWT_SECRET"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
    assert.equal(dirname(resolve(dir)), resolve(tmpdir())); rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  async function api(path, user = bob, body, extra = {}) {
    const encoded = user ? Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 600000 })).toString("base64url") : "";
    const token = user ? `${encoded}.${createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(encoded).digest("base64url")}` : "";
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", ...(user ? { Cookie: `daivr_comment_session=${token}` } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, headers: response.headers, data: await response.json() };
  }
  assert.equal((await api("/api/comments")).data.inbox.unread, 1);
  assert.equal((await api("/api/comments/inbox/read", bob, { ids: ["thread"] })).data.inbox.unread, 0);
  assert.equal((await api("/api/comments")).data.inbox.unread, 0);
  assert.equal((await api("/api/comments/inbox/read", null, { ids: [] })).status, 401);
  const favoriteUrl = "https://static.klipy.com/test/favorite.gif";
  assert.equal((await api("/api/comments/gifs/favorites", null)).status, 401);
  assert.equal((await api("/api/comments/gifs/favorites", bob, { url: favoriteUrl, saved: true }, { Origin: "https://foreign.example" })).status, 403);
  assert.equal((await api("/api/comments/preferences", bob, { theme: "glitch" })).status, 200);
  assert.deepEqual((await api("/api/comments/gifs/favorites", bob, { url: favoriteUrl, saved: true })).data.favorites, [favoriteUrl]);
  assert.deepEqual((await api("/api/comments/gifs/favorites", bob, { url: favoriteUrl, saved: true })).data.favorites, [favoriteUrl]);
  assert.deepEqual((await api("/api/comments/gifs/favorites", alice)).data.favorites, []);
  assert.deepEqual((await api("/api/comments/gifs/favorites", bob)).data.favorites, [favoriteUrl]);
  // Vite's mounted middleware strips /api/comments before calling the handler.
  assert.deepEqual((await api("/gifs/favorites", bob)).data.favorites, [favoriteUrl]);
  assert.equal((await api("/api/comments/preferences", bob)).data.theme, "glitch");
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "preferences.json"), "utf8"))[bob.id].gifFavorites, [favoriteUrl]);
  assert.equal((await api("/api/comments/gifs/favorites", bob, { url: "javascript:alert(1)", saved: true })).status, 400);
  assert.deepEqual((await api("/api/comments/gifs/favorites", bob, { url: favoriteUrl, saved: false })).data.favorites, []);
  assert.equal((await api("/api/comments/gifs/download?url=http%3A%2F%2F127.0.0.1%2Fsecret", null)).status, 400);
  assert.match((await api("/gifs/download?url=http%3A%2F%2F127.0.0.1%2Fsecret", null)).data.error, /host/);
  assert.equal((await api("/api/comments", bob, { text: "x" }, { Origin: "https://foreign.example" })).status, 403);
  assert.equal((await api("/api/comments", bob, { text: "x".repeat(17000) })).status, 413);
  assert.equal((await api("/api/comments/thread/replies", bob, { text: "Hi Alice" })).status, 201);
  const rapid = await api("/api/comments/thread/replies", bob, { text: "Again" });
  assert.equal(rapid.status, 429); assert.ok(Number(rapid.headers.get("Retry-After")) > 0);
  assert.equal((await api("/api/comments", alice)).data.inbox.unread, 1);
  assert.ok(existsSync(join(dir, "comments.json.bak")));
  assert.equal(reserveCommentPost([], "cooldown", "same", "", 100000), 0);
  assert.ok(reserveCommentPost([], "cooldown", "different", "", 101000) > 0);
  assert.ok(reserveCommentPost([], "cooldown", "same", "", 110000) > 0);
  for (let i = 0; i < 30; i++) assert.equal(reserveCommentPost([], "hourly", `message ${i}`, "", 500000 + i * 9000), 0);
  assert.ok(reserveCommentPost([], "hourly", "over quota", "", 800000) > 0);

  const challenge = dailyChallenge();
  assert.notEqual(dailyChallenge(Date.parse(`${challenge.date}T23:59:59Z`)).date, dailyChallenge(Date.parse(challenge.resetsAt)).date);
  assert.equal((await api(`/api/${challenge.game}/score`, null, { score: challenge.goal, durationMs: 60000 })).status, 401);
  assert.equal((await api(`/api/${challenge.game}/score`, bob, { score: challenge.goal, durationMs: 60000 })).status, 200);
  let player = (await api("/api/player")).data;
  assert.equal(player.challenge.complete, true);
  assert.equal(player.passport.challengeCount, 1);
  assert.equal(player.challenge.xp.total, 100);
  assert.equal(player.passport.progression.totalXp, 275); // daily, visitor, signal, player, challenger
  assert.ok(!JSON.stringify(player).includes("first-boot"));
  assert.ok(!JSON.stringify(player).includes("fish-archivist"));
  assert.ok(!JSON.stringify(player).includes("abyss-witness"));
  recordDailyRun(bob, challenge.game, challenge.goal + 1);
  assert.equal(readPlayers()[bob.id].challengeCount, 1);
  const chosen = { title: challenge.reward, accent: challenge.reward, favoriteGame: "tower-block", featuredBadges: ["visitor", "challenger"] };
  assert.equal((await api("/api/player", bob, chosen)).status, 200);
  assert.equal((await api("/api/player")).data.passport.title, challenge.reward);
  assert.equal((await api("/api/player", alice, chosen)).status, 400);
  assert.equal((await api("/api/player", bob, { ...chosen, featuredBadges: ["unknown"] })).status, 400);
  assert.equal((await api("/api/player", null, chosen)).status, 401);
  assert.equal((await api("/api/player", null)).data.user, null);
  recordDailyRun(bob, dailyChallenge(Date.parse(challenge.resetsAt)).game, 0, Date.parse(challenge.resetsAt));
  assert.equal(readPlayers()[bob.id].daily.complete, false);
  assert.equal(readPlayers()[bob.id].challengeCount, 1);

  // Replaying an already completed date (e.g. a clock correction) cannot mint another win.
  recordDailyRun(bob, challenge.game, challenge.goal);
  assert.equal(readPlayers()[bob.id].challengeCount, 1);

  const players = readPlayers();
  players[bob.id] = { ...players[bob.id], challengeCount: 25, completedDates: [0, 1, 2].map((daysAgo) => new Date(Date.parse(`${challenge.date}T00:00:00Z`) - daysAgo * 86400000).toISOString().slice(0, 10)) };
  writePlayers(players);
  player = (await api("/api/player")).data;
  assert.equal(player.passport.currentStreak, 3);
  assert.equal(player.passport.bestStreak, 3);
  assert.ok(player.passport.badges.some((badge) => badge.id === "daily-25"));
  assert.equal((await api("/api/player", bob, { ...chosen, featuredBadges: ["daily-25", "streak-3"] })).status, 200);
  assert.equal((await api("/api/player", bob, { ...chosen, featuredBadges: ["streak-7"] })).status, 400);

  const xpBeforeSecrets = player.passport.progression.totalXp;
  const adventure = { daiBooted: true, leviathanSightings: 1, fishCollection: Object.fromEntries(FISH_CATALOG.filter((fish) => fish.kind === "fish").map((fish) => [fish.id, 1])) };
  assert.equal((await api("/api/buddy", bob, { action: "sync-adventure", adventure })).status, 200);
  player = (await api("/api/player")).data;
  assert.equal(player.passport.progression.totalXp, xpBeforeSecrets + 2575);
  assert.deepEqual(player.passport.badges.filter((badge) => badge.secret).map((badge) => badge.id), ["first-boot", "fish-archivist", "abyss-witness"]);
  assert.equal((await api("/api/player", bob, { ...chosen, featuredBadges: ["fish-archivist", "abyss-witness", "first-boot"], xpAwards: { cheat: 9999999 } })).status, 200);
  await api("/api/buddy", bob, { action: "sync-adventure", adventure: {} });
  assert.equal((await api("/api/buddy")).data.adventure.daiBooted, true);
  assert.equal((await api("/api/player")).data.passport.progression.totalXp, xpBeforeSecrets + 2575);
  assert.ok(!(await api("/api/player", alice)).data.passport.badges.some((badge) => badge.secret));

  writeJsonStore("recover.json", [1], [], [], Array.isArray);
  writeJsonStore("recover.json", [1, 2], [], [], Array.isArray);
  writeFileSync(join(dir, "recover.json"), "{broken");
  assert.deepEqual(readJsonStore("recover.json", [], [], Array.isArray), [1]);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "recover.json"), "utf8")), [1]);
  unlinkSync(join(dir, "recover.json"));
  assert.deepEqual(readJsonStore("recover.json", [], [], Array.isArray), [1]);
  writeFileSync(join(dir, "unrecoverable.json"), "broken");
  assert.throws(() => writeJsonStore("unrecoverable.json", [], [], [], Array.isArray), /Cannot read/);
  assert.equal(readFileSync(join(dir, "unrecoverable.json"), "utf8"), "broken");
  process.env.NODE_ENV = "production"; delete process.env.COMMENTS_SESSION_SECRET; delete process.env.JWT_SECRET;
  assert.throws(assertSessionConfiguration, /COMMENTS_SESSION_SECRET/);
});
