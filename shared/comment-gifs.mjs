export const MAX_GIF_FAVORITES = 100;

export function normalizeGifUrl(value) {
  if (typeof value !== "string" || value.length > 700) return "";
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

export function isGifLink(value) {
  const url = normalizeGifUrl(value);
  return !!url && /\.gif$/i.test(new URL(url).pathname);
}

export function updateGifFavorites(current, value, saved) {
  const url = normalizeGifUrl(value);
  if (!url || typeof saved !== "boolean") throw new Error("Choose a valid GIF to save or remove.");
  const urls = [...new Set((Array.isArray(current) ? current : []).map(normalizeGifUrl).filter(Boolean))];
  if (!saved) return urls.filter((entry) => entry !== url);
  if (urls.includes(url)) return urls;
  if (urls.length >= MAX_GIF_FAVORITES) throw new Error("Your favorites are full. Remove a GIF before saving another.");
  return [url, ...urls];
}

export function canProxyGif(value) {
  const url = normalizeGifUrl(value);
  if (!url) return false;
  const { protocol, hostname, port } = new URL(url);
  return protocol === "https:" && !port && (
    ["static.klipy.com", "media.klipy.com", "media.tenor.com", "c.tenor.com", "i.giphy.com"].includes(hostname) ||
    /^media\d*\.giphy\.com$/.test(hostname)
  );
}
