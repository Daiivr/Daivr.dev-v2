import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { rememberReactionUser, resolveReactionUsers } from "../server/comment-reactions.mjs";
import { handleCommentsRequest } from "../server/comments.mjs";
import { commentPageNumbers } from "../src/lib/commentPagination.js";

test("saved reactor profiles contain only public fields and stay until the last reaction is removed", () => {
  const entry = { reactions: { fire: ["1"], smile: ["1"] } };
  const user = { id: "1", username: "Mika", avatarUrl: "/mika.png", token: "private", exp: 123 };
  rememberReactionUser(entry, user);
  assert.deepEqual(entry.reactionUsers, [{ id: "1", username: "Mika", avatarUrl: "/mika.png" }]);
  delete entry.reactions.fire;
  rememberReactionUser(entry, user);
  assert.equal(entry.reactionUsers.length, 1);
  delete entry.reactions.smile;
  rememberReactionUser(entry, user);
  assert.deepEqual(entry.reactionUsers, []);
});

test("legacy reactors resolve once across comments and replies; authors and current viewer keep their names", async () => {
  const comments = [{ author: { id: "1", username: "Renamed" }, reactions: { fire: ["1", "2", "3"] }, reactionUsers: [{ id: "1", username: "Old name" }], replies: [{ reactions: { smile: ["3"] } }] }];
  const calls = [];
  const users = await resolveReactionUsers(comments, { id: "2", username: "Viewer", token: "secret" }, async ({ id }) => { calls.push(id); return { id, username: "Legacy reactor" }; });
  assert.deepEqual(calls, ["3"]);
  assert.equal(users["1"].username, "Renamed");
  assert.equal(users["2"].username, "Viewer");
  assert.equal(users["3"].username, "Legacy reactor");
  assert.equal(users["2"].token, undefined);
});

test("pagination keeps short lists simple and large lists bounded at either end and in the middle", () => {
  assert.deepEqual(commentPageNumbers(1, 2), [1, 2]);
  for (const current of [1, 2, 6, 50, 99, 100]) {
    const pages = commentPageNumbers(current, 100);
    assert.ok(pages.length <= 7);
    assert.equal(pages[0], 1);
    assert.equal(pages.at(-1), 100);
    assert.ok(pages.includes(current));
    assert.equal(new Set(pages).size, pages.length);
  }
});

test("comment and reply reactions expose names to guests without requiring the reactor to post", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "daivr-reactions-"));
  const envNames = ["COMMENTS_DATA_DIR", "COMMENTS_SESSION_SECRET", "DISCORD_BOT_TOKEN"];
  const previous = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  process.env.COMMENTS_DATA_DIR = dir;
  process.env.COMMENTS_SESSION_SECRET = "reaction-test-only-secret";
  delete process.env.DISCORD_BOT_TOKEN;
  writeFileSync(join(dir, "comments.json"), JSON.stringify([{ id: "thread", text: "Hello", author: { id: "system", username: "Dai", avatarUrl: "/avatar.png" }, reactions: {}, replies: [{ id: "reply", text: "Hi", author: { id: "system", username: "Dai", avatarUrl: "/avatar.png" }, reactions: {} }] }]));
  const server = createServer((request, response) => handleCommentsRequest(request, response).catch((error) => { response.writeHead(500); response.end(error.message); }));
  t.after(async () => {
    await new Promise((done) => server.close(done));
    for (const name of envNames) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; }
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
    rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const payload = Buffer.from(JSON.stringify({ id: "reactor", username: "Reaction only", avatarUrl: "/reactor.png", exp: Date.now() + 60000 })).toString("base64url");
  const signature = createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(payload).digest("base64url");
  async function react(path) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/comments${path}`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `daivr_comment_session=${payload}.${signature}` }, body: JSON.stringify({ reaction: "fire" }) });
    assert.equal(response.status, 200);
    return response.json();
  }
  await react("/thread/reactions");
  await react("/thread/replies/reply/reactions");
  const guest = await fetch(`http://127.0.0.1:${server.address().port}/api/comments`).then((response) => response.json());
  assert.equal(guest.reactionUsers.reactor.username, "Reaction only");
  assert.deepEqual(guest.comments[0].reactions.fire, ["reactor"]);
  assert.deepEqual(guest.comments[0].replies[0].reactions.fire, ["reactor"]);
  await react("/thread/reactions");
  const removed = await react("/thread/replies/reply/reactions");
  assert.equal(removed.reactionUsers.reactor, undefined);
  assert.deepEqual(removed.comments[0].reactionUsers, []);
});
