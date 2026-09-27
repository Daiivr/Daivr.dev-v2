export const MAX_MENTIONS = 5;

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
