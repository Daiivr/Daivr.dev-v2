// Narrow, fail-closed adapters for public Nuka Knights pages. No private API,
// authenticated content, source images, or third-party HTML reaches the client.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE = /(?<day>\d{1,2})(?:st|nd|rd|th)?\s+(?<month>[A-Za-z]{3})\s+(?<year>\d{4})\s*\(?(?<hour>\d{1,2}):(?<minute>\d{2})\)?/g;

export function plainText(value = "") {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|nbsp|quot|apos|lt|gt);|&#(?:x[\da-f]+|\d+);/gi, (entity) => {
      const named = { "&amp;": "&", "&nbsp;": " ", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
      if (named[entity]) return named[entity];
      const number = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10);
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : "";
    }).replace(/\s+/g, " ").trim();
}

// The anonymous English source renders America/New_York dates. Intl handles
// US DST; never infer the offset from this server's local timezone.
export function easternDate({ day, month, year, hour, minute }) {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex < 0 || +day < 1 || +day > 31 || +hour > 23 || +minute > 59) throw new Error("Invalid source date");
  const wall = Date.UTC(+year, monthIndex, +day, +hour, +minute);
  if (new Date(wall).getUTCDate() !== +day) throw new Error("Invalid calendar date");
  let utc = wall;
  for (let i = 0; i < 2; i++) {
    const fields = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(new Date(utc)).map((part) => [part.type, part.value]));
    utc += wall - Date.UTC(+fields.year, +fields.month - 1, +fields.day, +fields.hour, +fields.minute);
  }
  return new Date(utc).toISOString();
}

function dates(text) {
  return [...plainText(text).matchAll(DATE)].map((match) => easternDate(match.groups));
}

function validWindow(startsAt, endsAt, maxDays = 45) {
  const span = Date.parse(endsAt) - Date.parse(startsAt);
  if (!(span > 0 && span <= maxDays * 86400000)) throw new Error("Invalid source window");
}

export function parseCodes(html) {
  const block = html.split('class="nukecodes-current text-center')[1]?.split('class="nukecodes-archive"')[0];
  if (!block) throw new Error("Codes panel missing");
  const range = plainText(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]);
  const match = range.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})(?:\s+(\d{4}))?\s*[-–]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})\s+(\d{4})\s*\((\d{1,2}):(\d{2})\)$/);
  if (!match) throw new Error("Codes validity missing");
  const [, day, month, explicitYear, endDay, endMonth, endYear, hour, minute] = match;
  const year = explicitYear || String(+endYear - (MONTHS.indexOf(month) > MONTHS.indexOf(endMonth) ? 1 : 0));
  const startsAt = easternDate({ day, month, year, hour, minute });
  const endsAt = easternDate({ day: endDay, month: endMonth, year: endYear, hour, minute });
  validWindow(startsAt, endsAt, 8);
  const codes = {};
  for (const name of ["Alpha", "Bravo", "Charlie"]) {
    const value = block.match(new RegExp(`>${name}</div>\\s*<div class="nukecodes-current-code">([\\d ]+)</div>`))?.[1]?.replace(/\s/g, "");
    if (!/^\d{8}$/.test(value || "")) throw new Error("Incomplete launch codes");
    codes[name.toLowerCase()] = value;
  }
  return { startsAt, endsAt, codes };
}

export function parseHomeEvents(html) {
  const events = [];
  const chunks = html.split(/<div class="mb-4 mod_fallout76dates_event\b/).slice(1);
  for (const chunk of chunks) {
    const head = chunk.match(/<h4 class="mod_fallout76dates_event_title"[^>]*>([\s\S]*?)<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>/);
    if (!head) continue;
    const path = head[1].match(/href="(\/events\/[\w/-]+\/)"/)?.[1];
    const [startsAt, endsAt = null] = dates(head[2]);
    if (!path || !startsAt) continue;
    if (endsAt) validWindow(startsAt, endsAt, 180);
    const title = plainText(head[1]);
    const inventory = [...chunk.matchAll(/<div class="col-7 col-md-8">([^<]+)<\/div><div class="col-5 col-md-4 text-right">(\d+) Gold/g)]
      .map((match) => ({ name: plainText(match[1]).replace(/^Plan:\s*/, ""), gold: +match[2] }));
    events.push({ title, startsAt, endsAt, url: `https://nukaknights.com${path}`, inventory: inventory.length ? inventory : null });
  }
  if (!events.length) throw new Error("Event records missing");
  return events;
}

export function parseMinerva(html, homeEvents = []) {
  const visits = [];
  for (const chunk of html.split(/data-minerva-index="\d+"/).slice(1)) {
    const head = chunk.split('class="mb-3 minerva-event-detail-meta"')[1]?.split('class="mod_fallout76rewards_minerva')[0];
    if (!head) continue;
    const title = plainText(head.match(/<h3[^>]*>([\s\S]*?)<span/)?.[1]);
    const location = plainText(head.match(/Location:\s*([^<]+)/)?.[1]);
    const list = +(title.match(/List (\d+)/)?.[1] || 0);
    const [startsAt, endsAt] = dates(head);
    const path = chunk.match(/href="(\/events\/[\w/-]+\/)"/)?.[1];
    if (!list || !location || !startsAt || !endsAt || !path) continue;
    validWindow(startsAt, endsAt, 5);
    const url = `https://nukaknights.com${path}`;
    visits.push({ id: path, title, location, list, startsAt, endsAt, url, inventory: homeEvents.find((event) => event.url === url)?.inventory || null });
  }
  if (!visits.length) throw new Error("Minerva schedule missing");
  return { visits };
}

export function parseAxolotl(html) {
  const chunk = html.split('class="container bg-light mb-3 mod_axolotl_widget"')[1]?.split('class="d-lg-none col-12"')[0];
  if (!chunk || !chunk.includes("America/New_York")) throw new Error("Axolotl panel missing");
  const month = plainText(chunk.match(/<h5>(.*?)<\/h5>/)?.[1]);
  const name = plainText(chunk.match(/<p><b>(.*?)<\/b><\/p>/)?.[1]);
  const [startsAt, lastMinute] = dates(chunk);
  const regionText = plainText(chunk.match(/<p>Only in .*? in ([\s\S]*?)<br\s*\/>\s*Small Fish<\/p>/)?.[1]);
  if (!name.endsWith("Axolotl") || !month || !regionText || !startsAt || !lastMinute) throw new Error("Incomplete axolotl record");
  // Source gives the inclusive last minute, while our intervals are exclusive.
  const endsAt = new Date(Date.parse(lastMinute) + 60000).toISOString();
  validWindow(startsAt, endsAt);
  const imagePath = chunk.match(/src="(\/img\/axolotl\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp))"/)?.[1];
  return { name, month, startsAt, endsAt, regions: regionText.split(/\s*&\s*/).map((region) => region.replace(/^the /, "")), imageUrl: imagePath ? `https://nukaknights.com${imagePath}` : null };
}
