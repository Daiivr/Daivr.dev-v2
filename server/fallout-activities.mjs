import { easternDate, plainText } from "./fallout-source.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseDailyOps(html) {
  const block = html.split("mod_dailyops_widget")[1]?.split('class="row mt-2"')[0];
  const date = block?.match(/since (\d{2})\.(\d{2})\.(\d{4}) \((\d{2}):(\d{2})\)/);
  if (!date || !block.includes("America/New_York")) throw new Error("Daily Ops date missing");
  const [, day, month, year, hour, minute] = date;
  const startsAt = easternDate({ day, month: MONTHS[+month - 1], year, hour, minute });
  const next = new Date(Date.UTC(+year, +month - 1, +day + 1));
  const endsAt = easternDate({ day: next.getUTCDate(), month: MONTHS[next.getUTCMonth()], year: next.getUTCFullYear(), hour, minute });
  const mode = plainText(block.match(/dailyopstype[^>]*>\s*<div[^>]*>\s*<div[^>]*>([\s\S]*?)<\/div>/)?.[1]);
  const mutations = [...block.matchAll(/<span[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g)].map((match) => ({ name: plainText(match[2]), description: plainText(match[1]) }));
  const location = plainText(block.match(/<i class="fas fa-skull"><\/i>([^<]+)/)?.[1]);
  const enemy = plainText(block.match(/<i class="fas fa-(?:hard-hat|robot|user[^" ]*|paw|bug|skull-crossbones|alien[^" ]*|radiation[^" ]*)"><\/i>([^<]+)/)?.[1]);
  // The final two top-level cells hold location and faction; icon names vary.
  const cells = [...block.matchAll(/<div class="col-6 col-lg-2 text-center">\s*<i[^>]*><\/i>([^<]+)<\/div>/g)].map(match => plainText(match[1]));
  const enemies = cells.at(-1) || enemy;
  if (!["Uplink", "Decryption"].includes(mode) || !location || !enemies || !mutations.length) throw new Error("Daily Ops fields missing");
  return { mode, location, enemies, mutations, startsAt, endsAt };
}

export function parseChallenges(html, kind, fetchedAt) {
  if (!["daily", "weekly"].includes(kind)) throw new Error("Unknown challenge period");
  const block = html.split(`mod_fallout76challenges_${kind}`)[1]?.split(/<div class="carousel-item\b/)[0];
  if (!block) throw new Error("Challenge panel missing");
  // The source omits its closing ul. Bound the period by the carousel panel.
  const list = block.split(/<ul class="list-group[^>]*>/)[1]?.split("</ul>")[0];
  const remaining = plainText(block.match(/<small>Ends in ([\s\S]*?)<\/small>/)?.[1]);
  const units = { day: 86400000, hour: 3600000, minute: 60000 };
  const duration = [...remaining.matchAll(/(\d+)\s+(day|hour|minute)s?/g)].reduce((sum, match) => sum + +match[1] * units[match[2]], 0);
  if (!list || duration <= 0 || duration > (kind === "daily" ? 25 : 169) * 3600000 || !Number.isFinite(fetchedAt)) throw new Error("Challenge reset missing");
  const items = [...list.matchAll(/<li class="list-group-item[^>]*>([\s\S]*?)<\/li>/g)].map((match, index) => {
    const text = match[1].split('<div class="col-9">')[1]?.split(/<button|<\/div>/)[0];
    const name = plainText(text).replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
    const score = +(match[1].match(/badge badge-secondary">\s*(\d+)/)?.[1] || 0);
    if (!name || !score) throw new Error("Incomplete challenge");
    return { id: `${kind}-${index}`, name: name.replace(/^1ˢᵗ\s*/, ""), score, falloutFirst: name.startsWith("1ˢᵗ") };
  });
  if (!items.length || items.length > 30) throw new Error("Challenge list missing");
  return { items, startsAt: new Date(fetchedAt).toISOString(), endsAt: new Date(fetchedAt + duration).toISOString(), resetEstimated: true };
}
