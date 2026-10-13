import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function CommentReaction({ reaction, users, mine, disabled, onReact }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const closeTimer = useRef(0);
  const tooltipId = useId();
  const isHeart = reaction.id === "sparkle-heart" || reaction.id === "heart-eyes";
  const names = users.map((user) => user.username).join(", ");
  function show() { window.clearTimeout(closeTimer.current); setOpen(true); }
  function hide() { closeTimer.current = window.setTimeout(() => setOpen(false), 120); }

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  useLayoutEffect(() => {
    if (!open) { setPosition(null); return; }
    const anchor = buttonRef.current.getBoundingClientRect();
    const box = tooltipRef.current.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(anchor.left + anchor.width / 2 - box.width / 2, window.innerWidth - box.width - 12)),
      top: anchor.top >= box.height + 20 ? anchor.top - box.height - 8 : Math.min(anchor.bottom + 8, window.innerHeight - box.height - 12)
    });
  }, [open, names]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onScroll = (event) => { if (!tooltipRef.current?.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === "Escape") close(); };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return <>
    <button ref={buttonRef} className={`reaction-chip ${mine ? "is-mine" : ""} ${isHeart ? "is-heart" : ""}`} type="button" onClick={onReact} disabled={disabled}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
      aria-label={`${reaction.label}: ${users.length} ${users.length === 1 ? "reaction" : "reactions"}`} aria-pressed={mine} aria-describedby={open ? tooltipId : undefined}>
      {reaction.src ? <img className="reaction-emoji" src={reaction.src} alt="" width="96" height="96" decoding="async" /> : <span className="reaction-emoji">{reaction.label}</span>}
      <b>{users.length}</b>
    </button>
    {open ? createPortal(<div ref={tooltipRef} id={tooltipId} role="tooltip" className="comment-reaction-tooltip" style={{ ...position, visibility: position ? "visible" : "hidden" }} onMouseEnter={show} onMouseLeave={hide}>
      <div className="comment-reaction-tooltip-heading"><span>{reaction.src ? <img src={reaction.src} alt="" /> : null}{reaction.label}</span><b>{String(users.length).padStart(2, "0")}</b></div>
      <ul>{users.map((user) => <li key={user.id}>
        <span className="comment-reactor-avatar" aria-hidden="true"><span>{user.username.slice(0, 2)}</span>{user.avatarUrl ? <img src={user.avatarUrl} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}</span>
        <span>{user.username}</span>{user.isYou ? <small>you</small> : null}
      </li>)}</ul>
      <div className="comment-reaction-tooltip-footer">Reacted to this message</div>
    </div>, document.body) : null}
  </>;
}
