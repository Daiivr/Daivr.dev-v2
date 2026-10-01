export function releaseMonth(patch) {
  return patch.date ? patch.date.slice(0, 7) : "legacy";
}

export function filterReleases(releases, { month = "all", query = "", annotated = false, oldestFirst = false } = {}) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = releases.filter((patch) => {
    if (month !== "all" && releaseMonth(patch) !== month) return false;
    if (annotated && !patch.story?.note) return false;
    const text = [patch.version, patch.codename, patch.date, patch.summary, patch.story?.note, ...patch.entries.map(([type, copy]) => `${type} ${copy}`)].join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
  return oldestFirst ? filtered.reverse() : filtered;
}

export function releaseFromUrl(releases, search) {
  const version = new URLSearchParams(search).get("release");
  return releases.find((patch) => patch.version === version)?.version || releases[0]?.version;
}
