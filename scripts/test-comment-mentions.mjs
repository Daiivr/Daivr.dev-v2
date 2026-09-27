import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { handleCommentsRequest } from "../server/comments.mjs";
import { canReply, isMentioned, mentionCandidates } from "../shared/comment-mentions.mjs";

test("mentions invite real users into a persistent thread and enforce permissions", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "daivr-mentions-"));
  const previous = { ...process.env };
  const realNow = Date.now;
  let clock = realNow();
  Date.now = () => clock;
  t.after(() => { Date.now = realNow; });
  process.env.COMMENTS_DATA_DIR = dir;
  process.env.COMMENTS_SESSION_SECRET = "mentions-test-only-secret";
  process.env.ADMIN_IDS = "admin";
  delete process.env.DISCORD_BOT_TOKEN;
  for (const name of ["comment-inbox.json", "comment-posting.json"]) writeFileSync(join(dir, name), "{}");
  const users = Object.fromEntries(["author", "invited", "other", "admin"].map((id) => [id, { id, username: id, avatarUrl: "/avatar.png" }]));
  writeFileSync(join(dir, "comments.json"), JSON.stringify(Object.values(users).map((author) => ({ id: `seed-${author.id}`, text: "Hello", author, createdAt: new Date().toISOString() }))));
  const server = createServer((request, response) => {
    handleCommentsRequest(request, response).catch((error) => { response.writeHead(500); response.end(error.message); });
  });
  t.after(async () => {
    await new Promise((done) => server.close(done));
    for (const name of ["COMMENTS_DATA_DIR", "COMMENTS_SESSION_SECRET", "ADMIN_IDS", "DISCORD_BOT_TOKEN"]) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
    rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  async function request(user, path = "", body, method = "POST") {
    clock += 10_000;
    const headers = { "Content-Type": "application/json" };
    if (user) {
      const payload = Buffer.from(JSON.stringify({ ...users[user], exp: Date.now() + 60000 })).toString("base64url");
      const signature = createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(payload).digest("base64url");
      headers.Cookie = `daivr_comment_session=${payload}.${signature}`;
    }
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/comments${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  }
  const created = await request("author", "", { text: "Come join me", mentionIds: ["invited", "invited"] });
  assert.equal(created.status, 201);
  assert.deepEqual(created.data.comment.mentions, [{ id: "invited", username: "invited" }]);
  const threadId = created.data.comment.id;
  const path = `/${threadId}/replies`;
  assert.equal((await request(null, path, { text: "Anonymous" })).status, 401);
  assert.equal((await request("other", path, { text: "Self-invite", mentionIds: ["other"] })).status, 403);
  assert.equal((await request("author", path, { text: "Follow-up" })).status, 201);
  const invitedReply = await request("invited", path, { text: "Thanks!", mentionIds: ["other"] });
  assert.equal(invitedReply.status, 201);
  assert.equal((await request("other", path, { text: "Joining via a reply mention" })).status, 201);
  assert.equal((await request("admin", path, { text: "Moderating" })).status, 201);

  for (const mentionIds of [["unknown"], "invited", [{ id: "invited" }], Array(6).fill("invited")]) {
    assert.equal((await request("author", "", { text: "Invalid invite", mentionIds })).status, 400);
  }
  assert.equal((await request("author", path, { text: "Invalid reply invite", mentionIds: ["unknown"] })).status, 400);
  assert.equal((await request("author", "", { mentionIds: ["invited"] })).status, 400);
  const plain = await request("author", "", { text: "@other is plain text, not a selected mention" });
  assert.equal(plain.status, 201);
  assert.deepEqual(plain.data.comment.mentions, []);
  assert.equal((await request("other", `/${plain.data.comment.id}/replies`, { text: "Not invited" })).status, 403);
  assert.equal((await request("admin", `/${plain.data.comment.id}/replies`, { text: "Admin access" })).status, 201);

  const persisted = JSON.parse(readFileSync(join(dir, "comments.json"), "utf8")).find((entry) => entry.id === threadId);
  assert.equal(isMentioned(persisted, "invited"), true);
  assert.equal(isMentioned(persisted, "other"), true);
  assert.equal(canReply(null, persisted), false);
  assert.equal(canReply({ id: "stranger" }, persisted), false);
  assert.equal(canReply(users.invited, persisted), true);
  assert.equal((await request("other", `${path}/${invitedReply.data.reply.id}`, undefined, "DELETE")).status, 403);
  assert.equal((await request("invited", `${path}/${invitedReply.data.reply.id}`, undefined, "DELETE")).status, 200);
  // Existing participants keep access after the message inviting them is removed.
  assert.equal((await request("other", path, { text: "Still participating" })).status, 201);
  const fetched = await request("invited", "", undefined, "GET");
  assert.equal(fetched.status, 200);
  assert.equal(isMentioned(fetched.data.comments.find((entry) => entry.id === threadId), "invited"), true);
  assert.equal(mentionCandidates(fetched.data.comments).length, 4);
});
