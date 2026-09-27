const key = (userId) => `daivr.commentDraft.v1.${userId}`;
const text = (value, length = 700) => typeof value === "string" ? value.slice(0, length) : "";
const mentions = (value) => Array.isArray(value) ? value.filter((entry) => typeof entry?.id === "string" && typeof entry?.username === "string").slice(0, 5) : [];
export function loadCommentDraft(userId) {
  try {
    const value = JSON.parse(localStorage.getItem(key(userId)) || "null");
    if (!value || Date.now() - value.savedAt > 30 * 86_400_000) return null;
    return { draft: text(value.draft), draftGif: text(value.draftGif), draftMentions: mentions(value.draftMentions), replyingTo: text(value.replyingTo, 100), replyDraft: text(value.replyDraft), replyGif: text(value.replyGif), replyMentions: mentions(value.replyMentions) };
  } catch { return null; }
}
export function saveCommentDraft(userId, value) {
  try { localStorage.setItem(key(userId), JSON.stringify({ ...value, savedAt: Date.now() })); return true; }
  catch { return false; }
}
