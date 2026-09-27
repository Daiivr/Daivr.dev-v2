import { createHash } from "node:crypto";
import { readJsonStore, writeJsonStore } from "./json-store.mjs";
import { postingDelay } from "./http-guards.mjs";

const FILE = "comment-posting.json";
const ENVS = ["COMMENTS_DATA_DIR"];
const valid = (value) => !!value && typeof value === "object" && !Array.isArray(value);

export function reserveCommentPost(comments, userId, text, gifUrl, now = Date.now()) {
  const state = readJsonStore(FILE, {}, ENVS, valid);
  // Keep cooldown history even when a user deletes their comments or the server restarts.
  const log = Object.fromEntries(Object.entries(state).map(([id, entries]) => [id, entries.filter((entry) => now - entry.at < 3_600_000)]).filter(([, entries]) => entries.length));
  const recent = log[userId] || [];
  const fingerprint = createHash("sha256").update(`${text}\0${gifUrl}`).digest("hex");
  const duplicate = recent.findLast((entry) => entry.fingerprint === fingerprint);
  const waits = [postingDelay(comments, userId, text, gifUrl, now),
    recent.length ? (recent.at(-1).at + 8000 - now) / 1000 : 0,
    duplicate ? (duplicate.at + 60_000 - now) / 1000 : 0,
    recent.length >= 30 ? (recent[0].at + 3_600_000 - now) / 1000 : 0];
  const delay = Math.max(0, Math.ceil(Math.max(...waits)));
  if (delay) return delay;
  log[userId] = [...recent, { at: now, fingerprint }];
  writeJsonStore(FILE, log, {}, ENVS, valid);
  return 0;
}
