import { useCallback, useEffect, useRef, useState } from "react";

const ZERO_DRAG = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scrollShellBy(top) {
  // El scroll de la pagina vive en .app-shell, no en el viewport
  const scroller = document.querySelector(".app-shell") || window;
  scroller.scrollBy({ top, behavior: "auto" });
}

function applyDragStyle(element, scope, values) {
  const rotate = values.rotate ?? values.x / 72;
  const scale = values.scale ?? 1;
  const impactX = clamp(values.x * -0.055, -28, 28);
  const impactY = clamp(values.y * -0.035, -18, 18);

  for (const node of [element, scope].filter(Boolean)) {
    node.style.setProperty("--console-drag-x", `${values.x.toFixed(2)}px`);
    node.style.setProperty("--console-drag-y", `${values.y.toFixed(2)}px`);
    node.style.setProperty("--console-drag-rotate", `${rotate.toFixed(2)}deg`);
    node.style.setProperty("--console-drag-scale", scale.toFixed(3));
    node.style.setProperty("--console-impact-x", `${impactX.toFixed(2)}px`);
    node.style.setProperty("--console-impact-y", `${impactY.toFixed(2)}px`);
  }
}

export function useElasticDrag({ scopeRef } = {}) {
  const targetRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    x: 0,
    y: 0,
    raf: 0,
    returnRaf: 0
  });
  const [isDragging, setIsDragging] = useState(false);

  const apply = useCallback((x, y, options = {}) => {
    const target = targetRef.current;
    if (!target) return;

    dragRef.current.x = x;
    dragRef.current.y = y;
    window.cancelAnimationFrame(dragRef.current.raf);
    dragRef.current.raf = window.requestAnimationFrame(() => {
      applyDragStyle(target, scopeRef?.current, {
        x,
        y,
        rotate: options.rotate,
        scale: options.scale ?? (dragRef.current.active ? 1.018 : 1)
      });
    });
  }, [scopeRef]);

  const returnHome = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;

    window.cancelAnimationFrame(dragRef.current.returnRaf);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      applyDragStyle(target, scopeRef?.current, ZERO_DRAG);
      dragRef.current.x = 0;
      dragRef.current.y = 0;
      return;
    }

    let x = dragRef.current.x;
    let y = dragRef.current.y;
    let vx = 0;
    let vy = 0;

    function step() {
      vx = (vx + (0 - x) * 0.055) * 0.72;
      vy = (vy + (0 - y) * 0.055) * 0.72;
      x += vx;
      y += vy;

      applyDragStyle(target, scopeRef?.current, {
        x,
        y,
        rotate: x / 82,
        scale: 1 + Math.min(0.012, (Math.abs(x) + Math.abs(y)) / 36000)
      });

      if (Math.abs(x) > 0.35 || Math.abs(y) > 0.35 || Math.abs(vx) > 0.2 || Math.abs(vy) > 0.2) {
        dragRef.current.returnRaf = window.requestAnimationFrame(step);
        return;
      }

      applyDragStyle(target, scopeRef?.current, ZERO_DRAG);
      dragRef.current.x = 0;
      dragRef.current.y = 0;
    }

    dragRef.current.returnRaf = window.requestAnimationFrame(step);
  }, [scopeRef]);

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0 || !targetRef.current) return;

    window.cancelAnimationFrame(dragRef.current.returnRaf);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();

    dragRef.current.active = true;
    dragRef.current.pointerId = event.pointerId;
    dragRef.current.startX = event.clientX;
    dragRef.current.startY = event.clientY;
    dragRef.current.originX = dragRef.current.x;
    dragRef.current.originY = dragRef.current.y;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const nextX = drag.originX + event.clientX - drag.startX;
    const nextY = drag.originY + event.clientY - drag.startY;
    apply(nextX, nextY);

    if (event.clientY < 72) {
      scrollShellBy(-14);
    } else if (event.clientY > window.innerHeight - 72) {
      scrollShellBy(14);
    }
  }, [apply]);

  const endDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    drag.active = false;
    drag.pointerId = null;
    setIsDragging(false);
    returnHome();
  }, [returnHome]);

  useEffect(() => () => {
    window.cancelAnimationFrame(dragRef.current.raf);
    window.cancelAnimationFrame(dragRef.current.returnRaf);
  }, []);

  return {
    handleProps: {
      onPointerCancel: endDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag
    },
    isDragging,
    targetRef
  };
}
