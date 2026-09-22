const API = "https://fallout.fandom.com/api.php";
const MAX_BYTES = 250_000;

export function validateItemTitle(value) {
  if (typeof value !== "string" || value.length > 180 || !/^(Plan|Recipe): [\p{L}\p{N}][\p{L}\p{N}\s:'’(),.\-/]+$/u.test(value)) throw new Error("Invalid item title");
  return value;
}

export function createWikiService({ fetcher = fetch, clock = Date.now } = {}) {
  const cache = new Map();
  const pending = new Map();
  async function query(parameters) {
    const url = new URL(API);
    url.search = new URLSearchParams({ format: "json", redirects: "1", ...parameters });
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000), redirect: "error", headers: { Accept: "application/json", "User-Agent": "DaivrWastelandTerminal/1.0 (+https://daivr.dev/fallout)" } });
    if (!response.ok) throw new Error("Wiki unavailable");
    const reader = response.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const { done, value: bytes } = await reader.read();
        if (done) break;
        size += bytes.byteLength;
        if (size > MAX_BYTES) throw new Error("Wiki response too large");
        chunks.push(bytes);
      }
    } finally { await reader.cancel().catch(() => {}); }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  function imageFrom(page) {
    try {
      const image = new URL(page?.thumbnail?.source);
      return image.origin === "https://static.wikia.nocookie.net" && image.pathname.startsWith("/fallout/images/") ? image.href : null;
    } catch { return null; }
  }
  async function itemImage(page) {
    const primary = imageFrom(page);
    if (primary) return primary;
    // Follow source-linked crafting unlocks when the plan has no image.
    try {
      const parsed = await query({ action: "parse", page: page.title, prop: "text" });
      const unlocks = parsed.parse?.text?.["*"]?.split('id="Unlocks"')[1]?.split("</h2>")[1]?.split(/<h[23]\b/)[0];
      const links = [...(unlocks?.split("</p>")[0]?.matchAll(/href="\/wiki\/([^"#]+)(#[^"]*)?"[^>]*>([^<]+)<\/a>/g) || [])];
      const titles = [...new Set(links.map(([, path, fragment, label]) => fragment ? label : decodeURIComponent(path).replaceAll("_", " ")))]
        .filter(title => title.length <= 180 && !/[|&\u0000-\u001f]/.test(title) && !/workbench/i.test(title)).slice(0, 3);
      if (!titles.length) return null;
      const data = await query({ action: "query", prop: "pageimages", piprop: "thumbnail", pithumbsize: "400", titles: titles.join("|") });
      const aliases = new Map([...(data.query?.normalized || []), ...(data.query?.redirects || [])].map(({ from, to }) => [from, to]));
      const pages = Object.values(data.query?.pages || {});
      for (let title of titles) {
        for (let step = 0; aliases.has(title) && step < 5; step++) title = aliases.get(title);
        const image = imageFrom(pages.find(candidate => candidate.title === title));
        if (image) return image;
      }
      return null;
    } catch { return null; }
  }
  return async function getItem(value) {
    const title = validateItemTitle(value);
    const saved = cache.get(title);
    if (saved && saved.until > clock()) return saved.data;
    if (pending.has(title)) return pending.get(title);
    if (pending.size >= 12) throw new Error("Wiki busy");
    const work = (async () => {
      const result = await query({ action: "query", prop: "extracts|info|pageimages", inprop: "url", explaintext: "1", piprop: "thumbnail", pithumbsize: "400", titles: title });
      const page = Object.values(result.query?.pages || {})[0];
      if (!page || page.missing !== undefined || !page.extract?.trim()) return null;
      const canonical = new URL(page.fullurl);
      if (canonical.origin !== "https://fallout.fandom.com" || !canonical.pathname.startsWith("/wiki/")) throw new Error("Invalid wiki link");
      // A short attributed extract; the complete article remains on the wiki.
      const text = page.extract.split(/\n== (?:Gallery|References|Notes) ==/)[0].trim();
      const words = text.split(/\s+/);
      const excerpt = words.length > 190 ? words.slice(0, 190).join(" ") + "…" : text;
      const data = { title: page.title, excerpt, imageUrl: await itemImage(page), url: canonical.href, revision: page.lastrevid, source: "Nukapedia · Fallout Wiki", licenseUrl: "https://www.fandom.com/licensing" };
      if (cache.size >= 150) cache.delete(cache.keys().next().value);
      cache.set(title, { data, until: clock() + 86400000 });
      return data;
    })().finally(() => pending.delete(title));
    pending.set(title, work);
    return work;
  };
}

const getItem = createWikiService();
export async function handleFalloutItemRequest(request, response) {
  const send = (status, data) => {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(status === 405 ? { Allow: "GET, HEAD" } : {}) });
    response.end(request.method === "HEAD" ? undefined : JSON.stringify(data));
  };
  if (!["GET", "HEAD"].includes(request.method)) return send(405, { error: "Method not allowed" });
  let title;
  try { title = validateItemTitle(new URL(request.url, "http://localhost").searchParams.get("title")); }
  catch { return send(400, { error: "Choose a valid plan or recipe." }); }
  try {
    const item = await getItem(title);
    return send(item ? 200 : 404, item || { error: "No wiki entry was found for this item." });
  } catch { return send(502, { error: "The wiki is temporarily unavailable. You can open the item on the wiki or try again." }); }
}
