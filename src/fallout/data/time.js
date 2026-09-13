export function isInWindow(item, now) {
  return !!item && Date.parse(item.startsAt) <= now && now < Date.parse(item.endsAt);
}

export function effectiveFeed(feed, now, timed = false) {
  const tooOld = !feed.fetchedAt || now - Date.parse(feed.fetchedAt) > 30 * 60000;
  const expired = timed && !isInWindow(feed.data, now);
  return feed.status === "current" && (tooOld || expired) ? { ...feed, status: "stale" } : feed;
}

export function selectVisits(visits = [], now = Date.now()) {
  const sorted = [...visits].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return {
    current: sorted.find((visit) => isInWindow(visit, now)) || null,
    next: sorted.find((visit) => Date.parse(visit.startsAt) > now) || null
  };
}

export function countdown(date, now) {
  const remaining = Date.parse(date) - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Awaiting update";
  const minutes = Math.floor(remaining / 60000);
  return `${Math.floor(minutes / 1440)}d ${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function formatDate(value, withTime = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York",
    ...(withTime ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {})
  }).format(new Date(value));
}

export function formatSync(value) {
  if (!value) return "No successful sync";
  return new Intl.DateTimeFormat("en-GB", {
    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "UTC"
  }).format(new Date(value)) + " UTC";
}
