import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PORTAL_CLOSE_MS, PORTAL_OPEN_MS, PORTAL_WALK_MS, startPortalJourney } from "../../shared/buddy-arrival.mjs";
import { PipSprite } from "./PipSprite";
import "../styles/buddy-portal-travel.css";

// Low-resolution rings and orbiting motes share the footer's 2x pixel scale.
function PortalLight({ closing, reducedMotion }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const g = canvasRef.current?.getContext("2d");
    if (!g) return undefined;
    let tick = 0;
    const draw = () => {
      const t = tick++ / 30;
      g.clearRect(0, 0, 64, 60);
      for (let y = 3; y < 57; y++) for (let x = 12; x < 52; x++) {
        const dx = (x - 32) / 15, dy = (y - 30) / 25;
        const r = Math.hypot(dx, dy);
        if (r > 1.08) continue;
        const wave = Math.sin(Math.atan2(dy, dx) * 4 - t * 3 + r * 12);
        g.fillStyle = r > 0.94 ? (wave > 0 ? "#dcfff9" : "#67e9ed")
          : r > 0.8 ? (wave > 0 ? "#9c7eff" : "#327bca")
            : wave > 0.7 ? "#2d2868" : "#10172e";
        g.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 8; i++) {
        const a = t * 1.6 + i * Math.PI / 4;
        g.fillStyle = i % 2 ? "#c5b5ff" : "#79fff0";
        g.fillRect(Math.round(32 + Math.cos(a) * 22), Math.round(30 + Math.sin(a) * 28), 1, 1);
      }
    };
    draw();
    if (reducedMotion) return undefined;
    const timer = window.setInterval(draw, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);
  return <canvas ref={canvasRef} width={64} height={60} className={`buddy-travel-portal ${closing ? "is-closing" : ""}`} />;
}

export function BuddyPortalTravel({ start, aboveSplash = false, onDone, friendshipLevel, inventory = [], hiddenGear = [], unlockedGear = [] }) {
  const [phase, setPhase] = useState("depart-open");
  const [geometry, setGeometry] = useState(null);
  const journeyRef = useRef(null);
  const onDoneRef = useRef(onDone);
  const reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  onDoneRef.current = onDone;

  useLayoutEffect(() => {
    const shell = document.querySelector(".app-shell");
    const zone = document.querySelector(".app-footer-zone");
    const footer = zone?.querySelector(".app-footer");
    if (!shell || !zone || !footer) { start.onDeparted?.(); onDoneRef.current?.(); return undefined; }
    let arriving = false, landingX = 0, handedOff = false;
    const frames = [];
    const initialRect = shell.getBoundingClientRect();
    const initialLeft = Math.max(8, Math.min(shell.clientWidth - 80, start.x - initialRect.left));
    const side = initialLeft >= 90 ? 1 : -1;
    const departure = { x: initialLeft + (side === 1 ? -12 : 84), y: start.y - initialRect.top + shell.scrollTop, side };
    function measure() {
      if (!arriving) { setGeometry(departure); return; }
      const shellRect = shell.getBoundingClientRect(), zoneRect = zone.getBoundingClientRect();
      const portalX = Math.min(zoneRect.width - 140, Math.max(48, zoneRect.width * 0.14));
      // FooterWorld draws the right-facing rig 2px to the right of its DOM anchor.
      landingX = portalX + 12 - 2;
      setGeometry({ x: zoneRect.left - shellRect.left + portalX, y: footer.getBoundingClientRect().top - shellRect.top + shell.scrollTop - 78, side: 1 });
    }
    measure();
    window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "start" } }));
    const journey = startPortalJourney({
      reducedMotion,
      onDeparted: start.onDeparted,
      onPhase(next) {
        if (next === "arrive-open") { arriving = true; measure(); }
        setPhase(next);
      },
      onDone() {
        handedOff = true;
        window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "land", x: landingX, facing: -1 } }));
        frames.push(window.requestAnimationFrame(() => {
          frames.push(window.requestAnimationFrame(() => onDoneRef.current?.()));
        }));
      }
    });
    journeyRef.current = journey;
    const observer = new IntersectionObserver(([entry]) => journey.setFooterVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15), { root: shell, threshold: 0.15 });
    observer.observe(footer);
    const resize = new ResizeObserver(measure);
    resize.observe(shell);
    resize.observe(zone);
    const content = shell.querySelector(".cabinet-layout");
    if (content) resize.observe(content);
    return () => {
      journey.dispose();
      journeyRef.current = null;
      observer.disconnect();
      resize.disconnect();
      frames.forEach(window.cancelAnimationFrame);
      if (!handedOff) window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "cancel" } }));
    };
  }, [start, reducedMotion]);

  useLayoutEffect(() => { journeyRef.current?.setPageReady(!aboveSplash); }, [aboveSplash, start, reducedMotion]);

  if (!geometry || phase === "waiting") return null;
  const arriving = phase.startsWith("arrive");
  const walking = phase.endsWith("walk");
  const closing = phase.endsWith("close");
  const inside = arriving ? phase === "arrive-open" : phase !== "depart-open";
  return (
    <div className={`buddy-portal-travel ${aboveSplash ? "is-above-splash" : ""} ${reducedMotion ? "is-reduced-motion" : ""}`}
      data-phase={phase} aria-hidden="true"
      style={{ left: geometry.x, top: geometry.y, "--portal-side": geometry.side, "--portal-open-ms": `${PORTAL_OPEN_MS}ms`, "--portal-close-ms": `${PORTAL_CLOSE_MS}ms`, "--portal-walk-ms": `${PORTAL_WALK_MS}ms` }}>
      <div className="buddy-portal-bank">
        <div className="buddy-portal-traveler" style={{ transform: `translateX(${inside ? -72 : 12}px)` }}>
          <PipSprite pose={walking ? "walk" : "idle"} expression="happy" facing={arriving ? -1 : 1}
            friendshipLevel={friendshipLevel} inventory={inventory} hiddenGear={hiddenGear} unlockedGear={unlockedGear} />
        </div>
      </div>
      <PortalLight key={arriving ? "exit" : "entrance"} closing={closing} reducedMotion={reducedMotion} />
    </div>
  );
}
