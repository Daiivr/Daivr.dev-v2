export function commentHash(commentId, replyId) {
  return `#${replyId ? "reply" : "comment"}-${encodeURIComponent(replyId || commentId)}`;
}

export async function markNotificationsRead(ids) {
  const response = await fetch("/api/comments/inbox/read", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Could not update inbox.");
  window.dispatchEvent(new CustomEvent("daivr-inbox", { detail: payload.inbox }));
  return payload.inbox;
}

export function openComment(commentId, replyId) {
  window.location.hash = commentHash(commentId, replyId);
  window.dispatchEvent(new Event("daivr-open-comment"));
}
