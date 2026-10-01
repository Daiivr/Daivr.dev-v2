import { useEffect, useId, useRef, useState } from "react";

export function GateLamp({ on, onToggle, disabled, reducedMotion }) {
  const id = `gate-lamp-${useId().replace(/:/g, "")}`;
  const paint = name => `url(#${id}-${name})`;
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
        <defs>
          <linearGradient id={`${id}-enamel`} x1="20" y1="22" x2="137" y2="55" gradientUnits="userSpaceOnUse"><stop stopColor="#101f19"/><stop offset=".28" stopColor="#46624e"/><stop offset=".42" stopColor="#2b4233"/><stop offset=".7" stopColor="#15281e"/><stop offset="1" stopColor="#07140f"/></linearGradient>
          <linearGradient id={`${id}-brass`}><stop stopColor="#24332a"/><stop offset=".3" stopColor="#899780"/><stop offset=".48" stopColor="#c1c6a2"/><stop offset=".58" stopColor="#64715a"/><stop offset="1" stopColor="#25392c"/></linearGradient>
          <radialGradient id={`${id}-glass`} cx="43%" cy="20%" r="85%"><stop stopColor="#ffffe5"/><stop offset=".45" stopColor="#e0f8ba"/><stop offset="1" stopColor="#8cba7b"/></radialGradient>
          <radialGradient id={`${id}-reflector`}><stop stopColor="#e5efcf"/><stop offset=".6" stopColor="#788e70"/><stop offset="1" stopColor="#263b2c"/></radialGradient>
          <pattern id={`${id}-grain`} width="9" height="7" patternUnits="userSpaceOnUse"><path d="M1 1h3m2 4h2M0 6h2" stroke="#c7d6b4" strokeOpacity=".16" strokeWidth=".5"/><path d="M4 2h2v1H4zM1 4h1v1H1z" fill="#010805" opacity=".4"/></pattern>
          <clipPath id={`${id}-shade`}><path d="M55 15h50l35 43H20z"/></clipPath>
        </defs>
        <path d="M70 1h20v5H70z" fill={paint('brass')} stroke="#14271c"/>
        <path d="M73 6h14v10H73z" fill={paint('brass')} stroke="#567565"/>
        <path d="M74 8h12m-12 3h12" stroke="#13261b"/>
        <path d="M55 15h50l35 43H20z" fill={paint('enamel')} stroke="#6b8c78" strokeWidth="1.5" strokeLinejoin="round"/>
        <g clipPath={paint('shade')}>
          <path d="M60 16 39 58h17l14-42z" fill="#819780" opacity=".12"/>
          <path d="m99 16 31 42h-21L89 16z" fill="#000a06" opacity=".35"/>
          <path d="M55 16 24 57m42-40L49 56m28-39-4 39m14-39 12 39m-1-39 31 39" stroke="#050f0b" strokeWidth="2"/>
          <path d="M57 17 27 57m41-40L52 56m27-39-3 39m13-39 12 39m-1-39 31 39" stroke="#9aae93" strokeOpacity=".3"/>
          <path d="M20 15h120v44H20z" fill={paint('grain')}/>
          <path d="m40 42 5-6m-13 16 7-2m61-25 4 3M66 22l5-1m42 28 9 4m-67-4 4-1" stroke="#c1c7aa" strokeWidth=".8" opacity=".4"/>
        </g>
        <path d="M56 15h48l3 4H53z" fill={paint('brass')} stroke="#14271c"/>
        <path d="M60 17h40" stroke="#dce4c0" strokeOpacity=".55"/>
        <ellipse cx="80" cy="59" rx="62" ry="10" fill={paint('brass')} stroke="#172c20" strokeWidth="2"/>
        <ellipse cx="80" cy="59" rx="58" ry="7" fill="#030d08" stroke="#99ac8c" strokeWidth=".8"/>
        <ellipse className="gate-lamp-reflector" cx="80" cy="59" rx="53" ry="5" fill={paint('reflector')}/>
        <path className="gate-lamp-reflector-ribs" d="M33 59h94m-81-3 9 6m-2-8 9 9m1-9 4 10m12-10v10m12-10-4 10m15-10-7 9m17-8-9 6" stroke="#d1e4be" strokeWidth=".6" opacity=".4"/>
        <path className="gate-lamp-bulb" d="M67 59h26v5a13 8 0 0 1-26 0z" fill={paint('glass')}/>
        <path className="gate-lamp-filament" d="M74 60v5l3-2 3 3 3-3 3 2v-5" stroke="#fff9bc" strokeWidth="1"/>
        <path className="gate-lamp-glass-glint" d="M70 61v3q0 3 5 4" stroke="#ffffec" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
        {[35,125].map(x => <g key={x}><circle cx={x} cy="57" r="2" fill={paint('brass')} stroke="#14281c" strokeWidth=".6"/><path d={`M${x-1} 57h2`} stroke="#182e1e" strokeWidth=".6"/></g>)}
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
