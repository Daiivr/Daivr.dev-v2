import { useEffect, useRef } from "react";

// Animate the board directly so dragging never rerenders the live countdown.
export function useHangingSign() {
  const signRef = useRef(null);
  const animation = useRef(null);
  const drag = useRef(null);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => () => animation.current?.cancel(), []);

  function sway(angle = 3) {
    const node = signRef.current;
    if (!node) return;
    animation.current?.cancel();
    node.style.transform = "";
    if (reducedMotion()) return;
    animation.current = node.animate(
      [angle, -angle * .65, angle * .35, -angle * .15, 0].map((value) => ({ transform: `rotate(${value}deg)` })),
      { duration: 1100, easing: "ease-in-out" }
    );
  }

  function release(event) {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    const angle = drag.current.angle;
    drag.current = null;
    signRef.current?.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    sway(angle || 2);
  }

  return {
    signRef,
    signEvents: {
      onPointerEnter: (event) => { if (event.pointerType === "mouse" && !drag.current) sway(1.8); },
      onPointerDown: (event) => {
        if (event.button !== 0 || event.target.closest("button, a, input") || reducedMotion()) return;
        animation.current?.cancel();
        drag.current = { id: event.pointerId, start: event.clientX, angle: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.setAttribute("data-dragging", "true");
      },
      onPointerMove: (event) => {
        if (!drag.current || event.pointerId !== drag.current.id) return;
        const angle = Math.max(-6, Math.min(6, (event.clientX - drag.current.start) / 14));
        drag.current.angle = angle;
        event.currentTarget.style.transform = `rotate(${angle}deg)`;
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
      onKeyDown: (event) => {
        if (event.target !== event.currentTarget || !["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        sway(event.key === "ArrowLeft" ? -3 : 3);
      }
    }
  };
}
