import { canProxyGif } from "../shared/comment-gifs.mjs";

const MAX_BYTES = 25 * 1024 * 1024;
const failure = (message, status = 502) => Object.assign(new Error(message), { status });

// Only public GIF-provider CDNs are fetched server-side. Recheck each redirect;
// never forward cookies or turn a comment URL into an unrestricted proxy.
// `until` lets a caller stop reading early: it gets the bytes so far and
// returns a result once it has enough (the preview only needs frame one).
export async function readCommentGif(value, fetcher = fetch, { maxBytes = MAX_BYTES, until = null, checkEvery = 64 * 1024 } = {}) {
  let url = value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      if (!canProxyGif(url)) throw failure("This GIF host does not support server downloads.", 400);
      const response = await fetcher(url, { redirect: "manual", signal: controller.signal, headers: { Accept: "image/gif,image/webp,image/png" } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        if (!location) throw failure("The GIF provider returned an invalid redirect.");
        url = new URL(location, url).href;
        continue;
      }
      if (!response.ok || !response.body) { await response.body?.cancel(); throw failure("The GIF could not be downloaded. Try again."); }
      if (!until && Number(response.headers.get("content-length")) > maxBytes) { await response.body.cancel(); throw failure("This GIF is too large to download here.", 413); }
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      let nextCheck = checkEvery;
      try {
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          size += chunk.byteLength;
          chunks.push(Buffer.from(chunk));
          if (until && size >= nextCheck) {
            nextCheck = size + checkEvery;
            const early = until(Buffer.concat(chunks));
            if (early) return { early };
          }
          if (size > maxBytes) throw failure("This GIF is too large to download here.", 413);
        }
      } finally { await reader.cancel(); }
      const bytes = Buffer.concat(chunks);
      if (until) {
        const early = until(bytes);
        if (early) return { early };
      }
      const magic = bytes.subarray(0, 6).toString("ascii");
      const format = ["GIF87a", "GIF89a"].includes(magic) ? "gif"
        : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png"
          : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" ? "webp" : "";
      if (!format) throw failure("The provider did not return a downloadable image.");
      return { bytes, format };
    }
    throw failure("The GIF provider redirected too many times.");
  } catch (error) {
    if (error.name === "AbortError") throw failure("The GIF download timed out. Try again.", 504);
    throw error;
  } finally { clearTimeout(timer); }
}

export async function downloadCommentGif(value, fetcher = fetch) {
  const { bytes, format } = await readCommentGif(value, fetcher);
  return { bytes, type: `image/${format}`, filename: `guestbook-gif.${format}` };
}
