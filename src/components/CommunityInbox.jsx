import { useState } from "react";
import { markNotificationsRead, openComment } from "../lib/commentLinks";

export function CommunityInbox({ inbox = { items: [], unread: 0 }, onNavigate }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function mark(ids) {
    setBusy(true); setError("");
    try { await markNotificationsRead(ids); } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className="community-inbox" aria-label="Your notifications">
    <header><h3>Inbox <span>{inbox.unread} unread</span></h3><button type="button" disabled={busy || !inbox.unread} onClick={() => mark(inbox.items.filter((item) => !item.read).map((item) => item.id))}>Mark all read</button></header>
    <p>Mentions and replies to conversations you joined. Latest 100 notifications.</p>
    <div className="community-inbox-list">
      {inbox.items.length ? inbox.items.map((item) => <article key={item.id} className={item.read ? "is-read" : "is-unread"}>
        <button type="button" onClick={() => { if (!item.read) void mark([item.id]); openComment(item.commentId, item.replyId); onNavigate?.(); }}>
          <strong>{item.author} {item.type === "mention" ? "mentioned you" : "replied"}{!item.read ? " · new" : ""}</strong>
          <span>{item.preview}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>
        </button>
        {!item.read ? <button type="button" className="inbox-read-button" disabled={busy} onClick={() => mark([item.id])} aria-label={`Mark notification from ${item.author} as read`}>Mark read</button> : null}
      </article>) : <p>No notifications yet. Mentions and replies will appear here.</p>}
    </div>
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}
