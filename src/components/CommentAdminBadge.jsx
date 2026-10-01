import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function CommentAdminBadge() {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const badgeRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipId = useId();

  useLayoutEffect(() => {
    if (!open) return;
    function positionTooltip() {
      const badge = badgeRef.current;
      const tooltip = tooltipRef.current;
      if (!badge || !tooltip) return;
      const rect = badge.getBoundingClientRect();
      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      const below = rect.top < height + 16;
      setPlacement({
        left: Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2)),
        top: below ? rect.bottom + 9 : rect.top - height - 9,
        below,
        glitch: Boolean(badge.closest(".theme-glitch"))
      });
    }
    const dismiss = () => setOpen(false);
    const onKeyDown = (event) => { if (event.key === "Escape") dismiss(); };
    positionTooltip();
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
    <span ref={badgeRef} className="comment-admin-badge" role="img" aria-label="Admin" aria-describedby={open ? tooltipId : undefined} tabIndex={0}
      onPointerEnter={() => setOpen(true)} onPointerLeave={() => { if (document.activeElement !== badgeRef.current) setOpen(false); }}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <svg className="comment-admin-crown" width="32" height="28" viewBox="0 0 32 28" fill="none" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M5 9h3l4 4 3-8h2l3 8 4-4h3l-3 14H8z" fill="#825127" />
        <path d="M6 10h2l4 5 4-9 4 9 4-5h2l-3 10H9z" fill="#efb640" />
        <path d="M8 12l4 5 4-9 4 9 4-5-2 7H10z" fill="#ffda74" />
        <path d="M9 21h14v3H9z" fill="#e4a537" /><path d="M9 21h14v1H9zM10 24h12v1H10z" fill="#fff0b3" />
        <path d="M15 15h2v4h-2z" fill="#55e4bb" /><path d="M15 15h1v2h-1z" fill="#e0fff2" />
        <path d="M5 7h3v3H5zM15 3h2v3h-2zM24 7h3v3h-3z" fill="#fff0b3" />
        <g className="admin-crown-sparkle is-one"><path d="M3 2v6M0 5h6" stroke="#fff7d6" strokeWidth="2" /></g>
        <g className="admin-crown-sparkle is-two"><path d="M28 13v8m-4-4h8" stroke="#fff3b0" strokeWidth="2" /></g>
        <g className="admin-crown-sparkle is-three"><path d="M23 1v4m-2-2h4" stroke="#fff7d6" /></g>
      </svg>
    </span>
    {open ? createPortal(
      <span ref={tooltipRef} id={tooltipId} role="tooltip" className={`comment-admin-tooltip${placement?.glitch ? " is-glitch" : ""}${placement?.below ? " is-below" : ""}`}
        style={{ left: placement?.left ?? 0, top: placement?.top ?? 0, visibility: placement ? "visible" : "hidden" }}>
        SITE ADMINISTRATOR
      </span>, document.body
    ) : null}
    </>
  );
}
