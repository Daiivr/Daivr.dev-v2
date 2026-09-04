import { useEffect, useRef, useState } from "react";

export function GateLamp({ on, onToggle, disabled, reducedMotion }) {
  const [motion, setMotion] = useState({ x: 0, y: 0 });
  const motionRef = useRef(motion);
  const dragRef = useRef(null);
  const frameRef = useRef(0);
  const lengthRef = useRef(76);
  const keyPullRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  function move(x, y) {
    motionRef.current = { x, y };
    setMotion({ x, y });
  }

  function settle() {
    cancelAnimationFrame(frameRef.current);
    if (reducedMotion) { move(0, 0); return; }
    let { x, y } = motionRef.current;
    let vx = Math.abs(y) > 1 ? 18 : 0;
    let vy = 0;
    let last = performance.now();
    function tick(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Damped springs: a firm vertical return and a softer lateral sway.
      vx += (-110 * x - 11 * vx) * dt;
      vy += (-240 * y - 16 * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      if (Math.abs(x) + Math.abs(y) < .1 && Math.abs(vx) + Math.abs(vy) < .5) {
        move(0, 0);
        frameRef.current = 0;
        return;
      }
      move(x, y);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
  }

  function release(event, cancelled = false) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    settle();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!cancelled && drag.distance >= 14 && !disabled) {
      onToggle();
    }
  }

  return (
    <div className={`entry-gate-lamp ${on ? "is-on" : "is-off"}`}>
      <span className="gate-lamp-cable" aria-hidden="true" />
      <svg className="gate-lamp-fixture" viewBox="0 0 160 76" fill="none" aria-hidden="true">
        <path d="M72 2h16v13H72z" fill="#0d1c16" stroke="#567565" />
        <path d="M55 15h50l35 43H20z" fill="#14251c" stroke="#6b8c78" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m57 20-26 33m70-33 26 33M65 17l-9 36m39-36 9 36" stroke="#294837" />
        <path d="M59 18h42" stroke="#aec6af" strokeOpacity=".5" />
        <ellipse cx="80" cy="59" rx="61" ry="9" fill="#020806" stroke="#63816b" strokeWidth="1.5" />
        <ellipse className="gate-lamp-reflector" cx="80" cy="59" rx="52" ry="5" fill="#bfe8bd" />
        <path className="gate-lamp-bulb" d="M67 59h26v5a13 7 0 0 1-26 0z" fill="#efffd0" />
        <path d="m21 54 15-1m85 1 11 1M44 38l6-6" stroke="#90a18b" strokeOpacity=".3" />
      </svg>
      <button
        className={`gate-lamp-pull ${dragRef.current || keyPullRef.current ? "is-pulling" : ""}`}
        type="button"
        aria-label="Pull lamp cord"
        aria-pressed={on}
        title={`Pull to turn the lamp ${on ? "off" : "on"}`}
        disabled={disabled}
        style={{
          "--chain-pull": `${motion.y}px`,
          "--chain-drift": `${motion.x}px`,
          "--chain-stretch": `${Math.hypot(motion.x, lengthRef.current + motion.y) - lengthRef.current}px`,
          "--chain-angle": `${-Math.atan2(motion.x, lengthRef.current + motion.y)}rad`
        }}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return;
          cancelAnimationFrame(frameRef.current);
          lengthRef.current = parseFloat(getComputedStyle(event.currentTarget).getPropertyValue("--chain-length")) || 76;
          dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: motionRef.current, distance: 0 };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.id !== event.pointerId) return;
          drag.distance = Math.max(0, event.clientY - drag.y);
          move(
            Math.max(-32, Math.min(32, drag.origin.x + event.clientX - drag.x)),
            Math.min(36, Math.max(0, drag.origin.y + drag.distance))
          );
        }}
        onPointerUp={(event) => release(event)}
        onPointerCancel={(event) => release(event, true)}
        onLostPointerCapture={() => {
          if (dragRef.current) { dragRef.current = null; settle(); }
        }}
        onClick={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          if (event.repeat || disabled || keyPullRef.current) return;
          keyPullRef.current = true;
          cancelAnimationFrame(frameRef.current);
          if (!reducedMotion) move(0, 24);
        }}
        onKeyUp={(event) => {
          if ((event.key !== "Enter" && event.key !== " ") || !keyPullRef.current) return;
          event.preventDefault();
          keyPullRef.current = false;
          if (!disabled) onToggle();
          settle();
        }}
        onBlur={() => {
          if (keyPullRef.current) { keyPullRef.current = false; settle(); }
        }}
      >
        <span className="gate-lamp-chain" aria-hidden="true" />
        <span className="gate-lamp-grip" aria-hidden="true" />
        <span className="gate-lamp-hint" aria-hidden="true">pull</span>
      </button>
    </div>
  );
}
