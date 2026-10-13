function publicUser(user) {
  return { id: String(user.id), username: user.username || "Unknown user", avatarUrl: user.avatarUrl || "" };
}

function reactingIds(entry) {
  return new Set(Object.values(entry.reactions || {}).flatMap((ids) => Array.isArray(ids) ? ids.map(String) : []));
}

// Retain names even for people who only react and have never posted a comment.
export function rememberReactionUser(entry, user) {
  const active = reactingIds(entry);
  const users = new Map((entry.reactionUsers || []).map((profile) => [String(profile.id), publicUser(profile)]));
  users.set(String(user.id), publicUser(user));
  entry.reactionUsers = [...users.values()].filter((profile) => active.has(profile.id));
}

export async function resolveReactionUsers(comments, currentUser, lookup) {
  const entries = comments.flatMap((comment) => [comment, ...(comment.replies || [])]);
  const known = new Map();
  for (const entry of entries) {
    for (const profile of entry.reactionUsers || []) known.set(String(profile.id), publicUser(profile));
  }
  // Current author/session names take precedence over saved reaction snapshots.
  for (const entry of entries) {
    if (entry.author?.id) known.set(String(entry.author.id), publicUser(entry.author));
  }
  if (currentUser) known.set(String(currentUser.id), publicUser(currentUser));
  const ids = [...new Set(entries.flatMap((entry) => [...reactingIds(entry)]))];
  return Object.fromEntries(await Promise.all(ids.map(async (id) => {
    const profile = known.get(id) || await lookup({ id });
    return [id, publicUser({ ...profile, id })];
  })));
}
