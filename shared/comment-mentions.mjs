export const MAX_MENTIONS = 5;

// Match whole handles, longest first (display names may contain spaces or
// punctuation). Email addresses and longer usernames must remain plain text.
export function mentionPattern(mentions = []) {
  const names = [...new Set(mentions.map((user) => user.username).filter(Boolean))]
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return names.length ? `(?<![\\p{L}\\p{N}_@/])@(?:${names.join("|")})(?![\\p{L}\\p{N}_@]|[.-][\\p{L}\\p{N}_])` : "(?!)";
}

export function findMentionRanges(text, mentions = []) {
  const users = mentions.map((user) => ({ user, pattern: new RegExp(`^(?:${mentionPattern([user])})$`, "iu") }));
  return [...String(text || "").matchAll(new RegExp(mentionPattern(mentions), "giu"))]
    .map((match) => ({ start: match.index, end: match.index + match[0].length, user: users.find(({ pattern }) => pattern.test(match[0])).user }));
}

export function mentionsInText(text, mentions = []) {
  const ids = new Set(findMentionRanges(text, mentions).map(({ user }) => user.id));
  return mentions.filter((user) => ids.has(user.id));
}

export function mentionQuery(text, cursor) {
  const match = text.slice(0, cursor).match(/(?:^|[\s([{])@([^@\n]{0,32})$/u);
  return match ? { start: cursor - match[1].length - 1, query: match[1] } : null;
}

export function insertMention(text, cursor, user, maxLength = 700) {
  const match = mentionQuery(text, cursor);
  if (!match) return null;
  const suffix = text.slice(cursor);
  const token = `@${user.username}`;
  const space = !suffix || !/^[\s.,!?;:)}\]]/u.test(suffix) ? " " : "";
  const value = text.slice(0, match.start) + token + space + suffix;
  const nextCursor = match.start + token.length + space.length + (suffix.startsWith(" ") ? 1 : 0);
  return value.length <= maxLength ? { value, cursor: nextCursor } : null;
}

// Older comments/drafts stored selected recipients separately from their text.
// Keep those recipients visible inline without rewriting saved comments.
export function withMentionText(text, mentions = []) {
  const present = new Set(mentionsInText(text, mentions).map((user) => user.id));
  const missing = mentions.filter((user) => !present.has(user.id)).map((user) => `@${user.username}`);
  return [text, ...missing].filter(Boolean).join(" ");
}

export function mentionCandidates(comments) {
  const users = new Map();
  for (const comment of comments) {
    for (const entry of [comment, ...(comment.replies || [])]) {
      const author = entry.author;
      if (!author?.id || ["system", "terminal"].includes(String(author.id))) continue;
      users.set(String(author.id), { id: String(author.id), username: author.username || "Discord user" });
    }
  }
  return [...users.values()].sort((a, b) => a.username.localeCompare(b.username));
}

export function isMentioned(comment, userId) {
  if (!userId) return false;
  return [comment, ...(comment.replies || [])].some((entry) =>
    (entry.mentions || []).some((mention) => String(mention.id) === String(userId))
  );
}

export function canReply(user, comment) {
  if (!user || !comment) return false;
  return !!user.isAdmin || String(comment.author?.id) === String(user.id) ||
    isMentioned(comment, user.id) ||
    (comment.replies || []).some((reply) => String(reply.author?.id) === String(user.id));
}

export function resolveMentions(ids, comments, userId) {
  if (ids == null) return [];
  if (!Array.isArray(ids) || ids.length > MAX_MENTIONS || ids.some((id) => typeof id !== "string")) {
    throw new Error(`Select up to ${MAX_MENTIONS} guestbook users to mention.`);
  }
  const users = new Map(mentionCandidates(comments).map((user) => [user.id, user]));
  return [...new Set(ids)].filter((id) => id !== String(userId)).map((id) => {
    if (!users.has(id)) throw new Error("A mentioned user is no longer in the guestbook. Remove their mention and try again.");
    return users.get(id);
  });
}
