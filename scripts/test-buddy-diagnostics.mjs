import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { handleCommentsRequest } from "../server/comments.mjs";
import { buddyDiagnosticEvent, runAdminBuddyDiagnostic } from "../shared/buddy-diagnostics.mjs";

test("manual encounters and every existing outage alias require a server-verified admin session", async (t) => {
  const previous = { secret: process.env.COMMENTS_SESSION_SECRET, admins: process.env.ADMIN_IDS };
  process.env.COMMENTS_SESSION_SECRET = "diagnostic-test-only-secret";
  process.env.ADMIN_IDS = "test-admin";
  const server = createServer(handleCommentsRequest);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    for (const [key, value] of [["COMMENTS_SESSION_SECRET", previous.secret], ["ADMIN_IDS", previous.admins]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  function session(id, options = {}) {
    const payload = Buffer.from(JSON.stringify({ id, username: id, exp: Date.now() + 60000, ...options })).toString("base64url");
    return `${payload}.${createHmac("sha256", process.env.COMMENTS_SESSION_SECRET).update(payload).digest("base64url")}`;
  }
  const cases = [
    ["", "signed-out"],
    [session("member"), "denied"],
    [session("member", { isAdmin: true }), "denied"],
    [session("test-admin", { exp: Date.now() - 1000 }), "signed-out"],
    [`${session("test-admin")}tampered`, "signed-out"],
    [session("test-admin"), "started"]
  ];
  for (const [command, event] of [["leviathan", "daivr-buddy-leviathan"], ["kraken", "daivr-buddy-kraken"], ["blackout", "daivr-buddy-outage"], ["powerout", "daivr-buddy-outage"], ["power-out", "daivr-buddy-outage"]]) {
    assert.equal(buddyDiagnosticEvent(command), event);
    for (const [cookie, expected] of cases) {
      let starts = 0;
      const result = await runAdminBuddyDiagnostic(() => { starts++; return "started"; }, (path, options) => {
        assert.equal(options.cache, "no-store");
        assert.equal(options.credentials, "include");
        return fetch(`${origin}${path}`, { ...options, headers: { ...options.headers, Cookie: `daivr_comment_session=${cookie}` } });
      });
      assert.equal(result, expected, command);
      assert.equal(starts, expected === "started" ? 1 : 0, command);
    }
  }
  // Revoking permission takes effect on the next command, even with the same cookie.
  const adminCookie = session("test-admin");
  process.env.ADMIN_IDS = "different-admin";
  assert.equal(await runAdminBuddyDiagnostic(() => assert.fail("revoked admin started an event"), (path, options) => fetch(`${origin}${path}`, { ...options, headers: { Cookie: `daivr_comment_session=${adminCookie}` } })), "denied");
  assert.equal(buddyDiagnosticEvent("__proto__"), null);
  assert.equal(buddyDiagnosticEvent("fish"), null);
});

test("unavailable or malformed auth fails closed without starting an encounter", async () => {
  const start = () => assert.fail("unverified event started");
  for (const fetchSession of [
    async () => { throw new Error("offline"); },
    async () => new Response("{}", { status: 503 }),
    async () => new Response("not json"),
    async () => { throw new DOMException("timed out", "TimeoutError"); }
  ]) assert.equal(await runAdminBuddyDiagnostic(start, fetchSession), "offline");
  assert.equal(await runAdminBuddyDiagnostic(start, async () => Response.json({ user: { isAdmin: "true" } })), "denied");
});

test("authorized diagnostics preserve refusal reasons from a busy or unavailable Buddy", async () => {
  for (const status of ["busy", "reduced-motion", "unavailable", "started"]) {
    assert.equal(await runAdminBuddyDiagnostic(() => status, async () => Response.json({ user: { isAdmin: true } })), status);
  }
});
