import { useEffect, useRef } from "react";

// Animate the board directly so dragging never rerenders the live countdown.
export function useHangingSign() {
  const signRef = useRef(null);
  const animation = useRef(null);
  const drag = useRef(null);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => () => animation.current?.cancel(), []);

  const swingTransform = (angle) => `perspective(650px) rotateX(${angle}deg)`;

  function sway(angle = -10, fromRest = true) {
    const node = signRef.current;
    if (!node) return;
    animation.current?.cancel();
    node.style.transform = "";
    if (reducedMotion()) return;
    animation.current = node.animate(
      [...(fromRest ? [0] : []), angle, -angle * .65, angle * .35, -angle * .15, 0].map((value) => ({ transform: swingTransform(value) })),
      { duration: 2600, easing: "ease-in-out" }
    );
  }

  function release(event) {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    const angle = drag.current.angle;
    drag.current = null;
    signRef.current?.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === "pointercancel") {
      signRef.current.style.transform = "";
      return;
    }
    sway(angle || -8, !angle);
  }

  return {
    signRef,
    signEvents: {
      onPointerEnter: (event) => { if (event.pointerType === "mouse" && !drag.current) sway(); },
      onPointerDown: (event) => {
        if (event.button !== 0 || event.target.closest("button, a, input") || reducedMotion()) return;
        animation.current?.cancel();
        drag.current = { id: event.pointerId, start: event.clientY, angle: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.setAttribute("data-dragging", "true");
      },
      onPointerMove: (event) => {
        if (!drag.current || event.pointerId !== drag.current.id) return;
        const angle = Math.max(-14, Math.min(14, (event.clientY - drag.current.start) / 8));
        drag.current.angle = angle;
        event.currentTarget.style.transform = swingTransform(angle);
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
      onKeyDown: (event) => {
        if (event.target !== event.currentTarget || !["Enter", " ", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        sway(event.key === "ArrowDown" ? 10 : -10);
      }
    }
  };
}
