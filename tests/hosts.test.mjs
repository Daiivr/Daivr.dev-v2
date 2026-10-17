import assert from "node:assert/strict";
import { test } from "node:test";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decryptHost, encryptHost, hostKey } from "../server/host-crypto.mjs";
import { createHostHandler } from "../server/hosts.mjs";
import { findApiRoute } from "../server/routes.mjs";
import { hostAssets } from "../shared/host-assets.mjs";
import { HOSTS } from "../src/lib/hostAvatar.js";

test("host encryption round-trips and rejects tampering, wrong IDs and wrong keys", () => {
  const key = randomBytes(32), model = Buffer.concat([Buffer.from("glTF"), randomBytes(1000)]);
  const encrypted = encryptHost(model, key, "kiyosa");
  assert.deepEqual(decryptHost(encrypted, key, "kiyosa"), model);
  assert.notDeepEqual(encryptHost(model, key, "kiyosa"), encrypted);
  assert.throws(() => decryptHost(encrypted, randomBytes(32), "kiyosa"));
  assert.throws(() => decryptHost(encrypted, key, "komoe"));
  for (const offset of [0, 8, 20, 36, encrypted.length - 1]) {
    const corrupt = Buffer.from(encrypted); corrupt[offset] ^= 1;
    assert.throws(() => decryptHost(corrupt, key, "kiyosa"));
  }
  assert.throws(() => decryptHost(encrypted.subarray(0, 30), key, "kiyosa"));
  for (const value of [undefined, "", "a".repeat(63), "z".repeat(64)]) assert.throws(() => hostKey(value));
});

async function fixture(t, mode = "valid") {
  const directory = await mkdtemp(join(tmpdir(), "daivr-host-test-"));
  const key = randomBytes(32), model = Buffer.concat([Buffer.from("glTF"), randomBytes(1020)]);
  const encrypted = encryptHost(model, key, "kiyosa");
  if (mode === "corrupt") encrypted[40] ^= 1;
  if (mode !== "missing-file") await writeFile(join(directory, "kiyosa.enc"), encrypted);
  const handler = createHostHandler({ directory, getKey: () => mode === "missing-key" ? undefined : mode === "wrong-key" ? "ab".repeat(32) : key.toString("hex") });
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    // mkdtemp returns the exact test-owned directory; never use application data.
    await rm(directory, { recursive: true, force: true });
  });
  return { model, url: `http://127.0.0.1:${server.address().port}` };
}

test("host API loads the requested asset without requiring any other model", async (t) => {
  const { model, url } = await fixture(t);
  const response = await fetch(`${url}/api/hosts/kiyosa`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "model/gltf-binary");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(Number(response.headers.get("content-length")), model.length);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), model);
  const head = await fetch(`${url}/api/hosts/kiyosa`, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  assert.equal((await fetch(`${url}/api/hosts/kiyosa`, { method: "POST" })).status, 405);
  for (const path of ["unknown", "kiyosa.enc", "%2e%2e%2f.env.local"]) {
    assert.equal((await fetch(`${url}/api/hosts/${path}`)).status, 404);
  }
});

test("missing keys/files or failed authentication never return model bytes", async (t) => {
  for (const mode of ["missing-key", "wrong-key", "missing-file", "corrupt"]) {
    await t.test(mode, async (subtest) => {
      const { url } = await fixture(subtest, mode);
      const response = await fetch(`${url}/api/hosts/kiyosa`);
      assert.equal(response.status, 503);
      assert.equal(await response.text(), "Host is temporarily unavailable.");
    });
  }
});

test("all hosts use the API and no original host binaries remain public", async () => {
  for (const host of HOSTS) {
    assert.equal(host.url, `/api/hosts/${host.id}`);
    assert.ok(findApiRoute(host.url));
  }
  for (const asset of hostAssets) {
    await access(new URL(`../private/hosts-encrypted/${asset.id}.enc`, import.meta.url));
    for (const folder of ["models", "motions"]) {
      await assert.rejects(access(new URL(`../public/${folder}/${asset.file}`, import.meta.url)));
    }
  }
});
