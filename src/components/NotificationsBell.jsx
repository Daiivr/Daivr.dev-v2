import { Bell, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { CommunityInbox } from "./CommunityInbox";

export function NotificationsBell({ inbox }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const unread = inbox?.unread || 0;

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return <div className="comments-notifications" ref={rootRef} onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button className={`comments-notification-trigger${unread ? " has-unread" : ""}`} ref={triggerRef} type="button"
      aria-label={`Notifications, ${unread} unread`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen((current) => !current)}>
      <Bell size={17} aria-hidden="true" />
      {unread ? <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}
    </button>
    {open ? <div className="comments-notification-panel" id={id} role="dialog" aria-label="Guestbook notifications">
      <div className="comments-notification-titlebar"><span>~/guestbook/inbox</span><button ref={closeRef} type="button" aria-label="Close notifications" onClick={() => close(true)}><X size={16} aria-hidden="true" /></button></div>
      <CommunityInbox inbox={inbox} onNavigate={() => close()} />
    </div> : null}
  </div>;
}
