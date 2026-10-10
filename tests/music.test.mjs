import assert from "node:assert/strict";
import { test } from "node:test";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decryptMusic, encryptMusic, musicKey } from "../server/music-crypto.mjs";
import { createMusicHandler } from "../server/music.mjs";
import { findApiRoute } from "../server/routes.mjs";
import { musicTracks } from "../src/data/music.js";

test("music encryption round-trips, randomizes nonces and rejects tampering or wrong keys/IDs", () => {
  const key = randomBytes(32);
  const audio = Buffer.concat([Buffer.from("ID3"), randomBytes(1000)]);
  const encrypted = encryptMusic(audio, key, "volt");
  assert.deepEqual(decryptMusic(encrypted, key, "volt"), audio);
  assert.notDeepEqual(encryptMusic(audio, key, "volt"), encrypted);
  assert.throws(() => decryptMusic(encrypted, randomBytes(32), "volt"));
  assert.throws(() => decryptMusic(encrypted, key, "atlas"));
  for (const offset of [0, 8, 20, 36, encrypted.length - 1]) {
    const corrupt = Buffer.from(encrypted);
    corrupt[offset] ^= 1;
    assert.throws(() => decryptMusic(corrupt, key, "volt"));
  }
  assert.throws(() => decryptMusic(encrypted.subarray(0, 30), key, "volt"));
  for (const invalid of [undefined, "", "a".repeat(63), "z".repeat(64)]) assert.throws(() => musicKey(invalid));
  assert.deepEqual(musicKey(key.toString("hex")), key);
});

async function fixture(t, mode = "valid") {
  const directory = await mkdtemp(join(tmpdir(), "daivr-music-test-"));
  const key = randomBytes(32);
  const audio = Buffer.concat([Buffer.from("ID3"), randomBytes(1021)]);
  const encrypted = encryptMusic(audio, key, "volt");
  if (mode === "corrupt") encrypted[40] ^= 1;
  if (mode !== "missing-file") await writeFile(join(directory, "volt.enc"), encrypted);
  const handler = createMusicHandler({ directory, getKey: () => mode === "missing-key" ? undefined : mode === "wrong-key" ? "ab".repeat(32) : key.toString("hex") });
  const server = createServer((request, response) => handler(request, response));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  return { audio, url: `http://127.0.0.1:${server.address().port}` };
}

test("the playback API returns exact audio, HEAD metadata and seekable byte ranges", async (t) => {
  const { audio, url } = await fixture(t);
  const response = await fetch(`${url}/api/music/volt`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), audio);
  const head = await fetch(`${url}/api/music/volt`, { method: "HEAD", headers: { Range: "bytes=0-9" } });
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers.get("content-length")), audio.length);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  for (const [range, start, end] of [["bytes=0-9", 0, 9], ["bytes=900-", 900, 1023], ["bytes=-12", 1012, 1023], ["bytes=1000-9999", 1000, 1023]]) {
    const part = await fetch(`${url}/api/music/volt`, { headers: { Range: range } });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get("content-range"), `bytes ${start}-${end}/${audio.length}`);
    assert.deepEqual(Buffer.from(await part.arrayBuffer()), audio.subarray(start, end + 1));
  }
  for (const range of ["bytes=1024-", "bytes=20-10", "bytes=-0", "bytes=-", "bytes=0-2,4-6", "bytes=nope"]) {
    const invalid = await fetch(`${url}/api/music/volt`, { headers: { Range: range } });
    assert.equal(invalid.status, 416, range);
    assert.equal(invalid.headers.get("content-range"), `bytes */${audio.length}`);
    await invalid.text();
  }
  const ifRange = await fetch(`${url}/api/music/volt`, { headers: { Range: "bytes=0-9", "If-Range": '"old"' } });
  assert.equal(ifRange.status, 200);
  await ifRange.arrayBuffer();
  assert.equal((await fetch(`${url}/api/music/volt`, { method: "POST" })).status, 405);
  for (const path of ["/api/music/unknown", "/api/music/volt.enc", "/api/music/%2e%2e%2f.env.local"]) {
    assert.equal((await fetch(`${url}${path}`)).status, 404);
  }
});

test("missing keys/files, incorrect keys and tampered ciphertext return no audio", async (t) => {
  for (const mode of ["missing-key", "wrong-key", "missing-file", "corrupt"]) {
    await t.test(mode, async (subtest) => {
      const { url } = await fixture(subtest, mode);
      const response = await fetch(`${url}/api/music/volt`, { headers: { Range: "bytes=0-9" } });
      assert.equal(response.status, 503);
      assert.equal(await response.text(), "Music is temporarily unavailable.");
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    });
  }
});

test("each player track uses the shared music API route", () => {
  assert.equal(new Set(musicTracks.map(({ id }) => id)).size, musicTracks.length);
  for (const track of musicTracks) {
    assert.equal(track.src, `/api/music/${track.id}`);
    assert.ok(findApiRoute(track.src));
  }
});
