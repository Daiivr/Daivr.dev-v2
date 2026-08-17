import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const CURSOR_LABELS = {
  blocked: "LOCK",
  busy: "SYNC",
  default: "",
  grab: "DRAG",
  grabbing: "HOLD",
  interactive: "SELECT",
  text: "TYPE"
};

const SELECTORS = {
  blocked: ":disabled, [aria-disabled='true'], .is-disabled",
  busy: "[aria-busy='true'], .is-launching",
  grabbing: ".is-dragging, .cursor-grabbing, .screen-buddy-root.is-held, .buddy-drop.is-held",
  grab: ".screen-buddy, .buddy-drop-body, .hero-console-handle, .terminal-windowbar, [draggable='true'], .cursor-grab",
  text: "input:not([type]), input[type='email'], input[type='number'], input[type='password'], input[type='search'], input[type='tel'], input[type='text'], input[type='url'], textarea, [contenteditable='true']",
  interactive: "a[href], button, summary, select, label[for], [role='button'], input[type='button'], input[type='checkbox'], input[type='file'], input[type='radio'], input[type='range'], input[type='reset'], input[type='submit']"
};

function closest(target, selector) {
  return target instanceof Element ? target.closest(selector) : null;
}

function getCursorMode(target) {
  if (closest(target, SELECTORS.busy)) return "busy";
  if (closest(target, SELECTORS.blocked)) return "blocked";
  if (closest(target, SELECTORS.grabbing)) return "grabbing";
  if (closest(target, SELECTORS.grab)) return "grab";
  if (closest(target, SELECTORS.text)) return "text";
  if (closest(target, SELECTORS.interactive)) return "interactive";
  return "default";
}

export function SignalCursor({ theme = "crt" }) {
  const rootRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!finePointer?.matches || reducedMotion?.matches) return undefined;

    const root = rootRef.current;
    const label = labelRef.current;
    if (!root || !label) return undefined;

    const page = document.documentElement;
    const pointer = { x: -80, y: -80 };
    const follower = { x: -80, y: -80 };
    let animationFrame = 0;
    let modeRefreshFrame = 0;
    let initialized = false;
    let mode = "default";

    function setMode(nextMode) {
      if (mode === nextMode) return;
      mode = nextMode;
      root.dataset.mode = nextMode;
      label.textContent = CURSOR_LABELS[nextMode];
    }

    function paint() {
      const distanceX = pointer.x - follower.x;
      const distanceY = pointer.y - follower.y;
      follower.x += distanceX * 0.42;
      follower.y += distanceY * 0.42;

      root.style.setProperty("--signal-x", `${pointer.x}px`);
      root.style.setProperty("--signal-y", `${pointer.y}px`);
      root.style.setProperty("--signal-frame-x", `${follower.x}px`);
      root.style.setProperty("--signal-frame-y", `${follower.y}px`);

      if (Math.abs(distanceX) > 0.1 || Math.abs(distanceY) > 0.1) {
        animationFrame = window.requestAnimationFrame(paint);
      } else {
        follower.x = pointer.x;
        follower.y = pointer.y;
        animationFrame = 0;
      }
    }

    function requestPaint() {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(paint);
    }

    function requestModeRefresh() {
      if (!initialized || modeRefreshFrame) return;

      modeRefreshFrame = window.requestAnimationFrame(() => {
        modeRefreshFrame = 0;
        const target = document.elementFromPoint(pointer.x, pointer.y);
        setMode(getCursorMode(target));
      });
    }

    function updatePointer(event) {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!initialized) {
        follower.x = pointer.x;
        follower.y = pointer.y;
        initialized = true;
      }

      root.classList.add("is-visible");
      root.dataset.edgeX = pointer.x > window.innerWidth - 112 ? "right" : "left";
      root.dataset.edgeY = pointer.y > window.innerHeight - 72 ? "bottom" : "top";
      setMode(getCursorMode(event.target));
      requestPaint();
    }

    function updateTarget(event) {
      if (event.pointerType === "touch") return;
      setMode(getCursorMode(event.target));
    }

    function addClickPulse(event) {
      if (event.pointerType === "touch") return;
      root.classList.add("is-pressed");
      if (mode === "grab") setMode("grabbing");

      const pulse = document.createElement("span");
      pulse.className = "signal-cursor__pulse";
      pulse.style.setProperty("--pulse-x", `${event.clientX}px`);
      pulse.style.setProperty("--pulse-y", `${event.clientY}px`);
      root.appendChild(pulse);
      pulse.addEventListener("animationend", () => pulse.remove(), { once: true });
    }

    function beginTextSelection() {
      page.classList.add("is-text-selecting");
    }

    function releasePointer(event) {
      page.classList.remove("is-text-selecting");
      root.classList.remove("is-pressed");
      setMode(getCursorMode(event.target));
    }

    function hidePointer(event) {
      if (!event.relatedTarget) root.classList.remove("is-visible");
    }

    function hideOnBlur() {
      page.classList.remove("is-text-selecting");
      root.classList.remove("is-visible", "is-pressed");
    }

    // Cursor modes can change while the pointer is stationary (for example,
    // when the splash switches from aria-busy to ready). Keep the readout in
    // sync with those DOM state changes instead of waiting for pointermove.
    const stateObserver = new MutationObserver((records) => {
      if (records.some((record) => !root.contains(record.target))) {
        requestModeRefresh();
      }
    });

    page.classList.add("has-signal-cursor");
    window.addEventListener("pointermove", updatePointer, { passive: true, capture: true });
    window.addEventListener("pointerover", updateTarget, { passive: true, capture: true });
    window.addEventListener("pointerdown", addClickPulse, { passive: true, capture: true });
    window.addEventListener("pointerup", releasePointer, { passive: true, capture: true });
    window.addEventListener("pointercancel", releasePointer, { passive: true, capture: true });
    window.addEventListener("mouseout", hidePointer, { passive: true });
    window.addEventListener("blur", hideOnBlur);
    document.addEventListener("selectstart", beginTextSelection, { passive: true, capture: true });
    stateObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-busy", "aria-disabled", "class", "disabled"],
      childList: true,
      subtree: true
    });

    return () => {
      stateObserver.disconnect();
      page.classList.remove("has-signal-cursor", "is-text-selecting");
      window.removeEventListener("pointermove", updatePointer, { capture: true });
      window.removeEventListener("pointerover", updateTarget, { capture: true });
      window.removeEventListener("pointerdown", addClickPulse, { capture: true });
      window.removeEventListener("pointerup", releasePointer, { capture: true });
      window.removeEventListener("pointercancel", releasePointer, { capture: true });
      window.removeEventListener("mouseout", hidePointer);
      window.removeEventListener("blur", hideOnBlur);
      document.removeEventListener("selectstart", beginTextSelection, { capture: true });
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(modeRefreshFrame);
    };
  }, []);

  return createPortal(
    <div
      className={`signal-cursor is-${theme}`}
      data-edge-x="left"
      data-edge-y="top"
      data-mode="default"
      ref={rootRef}
      aria-hidden="true"
    >
      <span className="signal-cursor__core" />
      <span className="signal-cursor__frame">
        <span className="signal-cursor__frame-mark">
          <i /><i /><i /><i />
          <b />
        </span>
        <span className="signal-cursor__readout" ref={labelRef} />
      </span>
    </div>,
    document.body
  );
}
