import { readJsonStore, writeJsonStore } from "./json-store.mjs";

const FILE = "comment-inbox.json";
const ENVS = ["COMMENTS_DATA_DIR"];
const valid = (value) => !!value && typeof value === "object" && !Array.isArray(value);

export function inboxEvents(comments, user) {
  if (!user) return [];
  const events = [];
  for (const comment of comments) {
    const participants = new Set([String(comment.author?.id)]);
    for (const entry of [comment, ...(comment.replies || [])]) {
      const mentioned = (entry.mentions || []).some((mention) => String(mention.id) === String(user.id));
      if (String(entry.author?.id) !== String(user.id) && (mentioned || (entry !== comment && participants.has(String(user.id))))) {
        events.push({ id: entry.id, commentId: comment.id, replyId: entry === comment ? null : entry.id,
          type: mentioned ? "mention" : "reply", author: entry.author?.username || "Guestbook user",
          preview: (entry.text || "Shared a GIF").slice(0, 140), createdAt: entry.createdAt });
      }
      participants.add(String(entry.author?.id));
      for (const mention of entry.mentions || []) participants.add(String(mention.id));
    }
  }
  return events.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100);
}

export function buildInbox(comments, user) {
  if (!user) return { items: [], unread: 0 };
  const state = readJsonStore(FILE, {}, ENVS, valid);
  const read = new Set(state[user.id]?.readIds || []);
  const items = inboxEvents(comments, user).map((event) => ({ ...event, read: read.has(event.id) }));
  return { items, unread: items.filter((item) => !item.read).length };
}

export function markInboxRead(comments, user, ids) {
  if (!Array.isArray(ids) || ids.length > 100 || ids.some((id) => typeof id !== "string")) throw Object.assign(new Error("Select up to 100 notifications."), { status: 400 });
  const allowed = new Set(inboxEvents(comments, user).map((event) => event.id));
  const state = readJsonStore(FILE, {}, ENVS, valid);
  state[user.id] = { readIds: [...new Set([...(state[user.id]?.readIds || []), ...ids])].filter((id) => allowed.has(id)) };
  writeJsonStore(FILE, state, {}, ENVS, valid);
}
