import assert from "node:assert/strict";
import { test } from "node:test";
import { canProxyGif, isGifLink, MAX_GIF_FAVORITES, normalizeGifUrl, updateGifFavorites } from "../shared/comment-gifs.mjs";
import { downloadCommentGif } from "../server/comment-gif-download.mjs";

test("GIF favorites deduplicate, remove, validate URLs, and cap the collection", () => {
  const url = "https://static.klipy.com/hello.gif";
  assert.deepEqual(updateGifFavorites([], url, true), [url]);
  assert.deepEqual(updateGifFavorites([url], url, true), [url]);
  assert.deepEqual(updateGifFavorites([url], url, false), []);
  assert.equal(normalizeGifUrl("javascript:alert(1)"), "");
  assert.equal(normalizeGifUrl("https://user:password@example.com/a.gif"), "");
  assert.throws(() => updateGifFavorites([], "data:image/gif;base64,xxx", true));
  assert.throws(() => updateGifFavorites([], url, "yes"));
  const full = Array.from({ length: MAX_GIF_FAVORITES }, (_, i) => `https://static.klipy.com/${i}.gif`);
  assert.throws(() => updateGifFavorites(full, url, true), /full/);
  assert.equal(updateGifFavorites(full, full[0], true).length, MAX_GIF_FAVORITES);
  assert.equal(isGifLink("https://example.com/hi.GIF?size=small#image"), true);
  assert.equal(isGifLink("https://example.com/?next=hi.gif"), false);
});

test("GIF downloads return original image bytes and validate every redirect", async () => {
  const bytes = Buffer.from("GIF89a-test-image");
  const calls = [];
  const image = await downloadCommentGif("https://static.klipy.com/a.gif", async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1
      ? new Response(null, { status: 302, headers: { location: "https://media.tenor.com/b.gif" } })
      : new Response(bytes, { headers: { "content-type": "image/gif" } });
  });
  assert.deepEqual(image.bytes, bytes);
  assert.equal(image.filename, "guestbook-gif.gif");
  assert.equal(image.type, "image/gif");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.redirect, "manual");
  assert.equal(calls[0].options.headers.Cookie, undefined);
  let requests = 0;
  await assert.rejects(downloadCommentGif("https://media.giphy.com/a.gif", async () => {
    requests += 1;
    return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
  }), /host/);
  assert.equal(requests, 1);
  for (const url of ["http://static.klipy.com/a.gif", "https://static.klipy.com.evil.test/a.gif", "https://localhost/a.gif", "https://media.giphy.com:444/a.gif"]) {
    assert.equal(canProxyGif(url), false);
  }
});

test("GIF downloads reject unavailable, oversized, and non-image responses", async () => {
  const url = "https://static.klipy.com/a.gif";
  await assert.rejects(downloadCommentGif(url, async () => new Response("oops", { status: 404 })), /could not/);
  await assert.rejects(downloadCommentGif(url, async () => new Response("<html>Not a GIF</html>", { headers: { "content-type": "image/gif" } })), /downloadable image/);
  await assert.rejects(downloadCommentGif(url, async () => new Response("GIF89a", { headers: { "content-length": 30 * 1024 * 1024 } })), /too large/);
  await assert.rejects(downloadCommentGif(url, async () => new Response(new ReadableStream({ start(controller) {
    controller.enqueue(new Uint8Array(26 * 1024 * 1024)); controller.close();
  } }))), /too large/);
  await assert.rejects(downloadCommentGif(url, async () => new Response(null, { status: 302, headers: { location: url } })), /too many/);
});
