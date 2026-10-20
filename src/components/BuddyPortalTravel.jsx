import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PORTAL_DIVE_PX, PORTAL_EMERGE_MS, PORTAL_EMERGE_PX, PORTAL_HOP_MS, startPortalJourney } from "../../shared/buddy-arrival.mjs";
import { WALK_SPEED_PX_S, walkDuration } from "../../shared/buddy-motion.mjs";
import { getSeasonalEvent } from "../lib/seasons";
import { outfitFor, wornSlots } from "../lib/pixelWorld/pip/outfit";
import { RIG_FOOT_X, RIG_TALL, RIG_W, rigImg } from "../lib/pixelWorld/pip/rig";
import { PIP_HALF, PORTAL_RX, PORTAL_RY, createPortalPainter, cutAtPlane, portalSpot } from "../lib/pixelWorld/portal";
import { dropActor, publishActor, worldLayout } from "../lib/pixelWorld/worldBus";
import "../styles/buddy-portal-travel.css";

// La entrada rara de la puerta (1 de cada 20): en vez del paracaidas, se
// abre un portal en el riel junto a Pip, da un salto de ganas y se mete; la
// puerta se abre y, cuando el footer se ve, el portal se abre en el sendero
// (lo dibuja el mundo del footer, events/portal.js, con su luz) y sale por
// el. El portal es el mismo en los dos sitios (src/lib/pixelWorld/portal.js).

const ART = 2;
// Lienzo de la puerta, en px de arte: el riel (pies de Pip) en la fila GROUND.
const CW = 108, CH = 76, GROUND = 63;
const CY = GROUND + 1 - PORTAL_RY;
// Pip empieza a 24 px de arte del plano del portal y anda hasta perderse.
const START_GAP = 24;
const ART_SPEED = WALK_SPEED_PX_S / ART;
const HOP_S = PORTAL_HOP_MS / 1000;
const DIVE_S = walkDuration(PORTAL_DIVE_PX) / 1000;
// Al llegar: sale 6 px por detras del plano y anda hasta +26.
const EMERGE_FROM = -6, EMERGE_TO = EMERGE_FROM + PORTAL_EMERGE_PX / ART;
// Centro del sprite en el escenario de Buddy (FooterWorld: SPRITE_HALF).
const SPRITE_HALF = 36;
const TRAVELER = "portal-trip";
const now = () => performance.now() / 1000;

// La salida en la puerta: pose de Pip y del portal en cada instante (e en s).
function departFrame(phase, e, side) {
  const toPortal = side === 1;
  if (phase === "depart-open") {
    return { portal: "open", pe: e, centre: START_GAP, pose: e > 0.42 && e < 0.62 ? "land" : "idle", expr: e < 0.3 ? "idle" : e < 0.92 ? "surprised" : "happy", flip: e < 0.3 ? true : toPortal };
  }
  if (phase === "depart-walk") {
    if (e < HOP_S) {
      const k = e / HOP_S, up = k >= 0.18 && k < 0.82;
      return { portal: "steady", centre: START_GAP, pose: k < 0.18 ? "crouch" : up ? "jump" : "land", hop: up ? Math.round(Math.sin((k - 0.18) / 0.64 * Math.PI) * 5) : 0, expr: "happy", flip: toPortal };
    }
    const walked = Math.min(DIVE_S, e - HOP_S) * ART_SPEED;
    const touch = HOP_S + (START_GAP - PIP_HALF - (PORTAL_RX - 1)) / ART_SPEED;
    const ripples = [touch, touch + 0.55].filter((at) => e >= at).map((at, i) => ({ dy: i ? -6 : 2, age: e - at }));
    const gone = e - HOP_S - DIVE_S;
    return {
      portal: "steady", centre: START_GAP - walked, pose: "walk", frame: Math.floor(walked / 2.2) % 6, expr: "happy", flip: toPortal, ripples,
      gulp: gone >= 0 ? gone : null, hidden: gone >= 0
    };
  }
  return { portal: "close", pe: e, hidden: true };
}

export function BuddyPortalTravel({ start, aboveSplash = false, onDone, friendshipLevel, inventory = [], hiddenGear = [], unlockedGear = [] }) {
  const [phase, setPhase] = useState("depart-open");
  const [geometry, setGeometry] = useState(null);
  const journeyRef = useRef(null);
  const onDoneRef = useRef(onDone);
  const phaseRef = useRef({ name: "depart-open", at: now() });
  const canvasRef = useRef(null);
  const reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  onDoneRef.current = onDone;
  const outfitKey = JSON.stringify([friendshipLevel, inventory, hiddenGear, unlockedGear]);
  // (en la puerta, con lo de temporada; en el footer lo pone el mundo)
  const outfit = useMemo(() => outfitFor({ friendshipLevel, inventory, hiddenGear, unlockedGear }), [outfitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const outfitRef = useRef(outfit);
  outfitRef.current = outfit;

  useLayoutEffect(() => {
    const shell = document.querySelector(".app-shell");
    const zone = document.querySelector(".app-footer-zone");
    const footer = zone?.querySelector(".app-footer");
    if (!shell || !zone || !footer) { start.onDeparted?.(); onDoneRef.current?.(); return undefined; }
    let handedOff = false, trip = null;
    const frames = [];
    // En la puerta: el portal a un lado de Pip (a su izquierda si cabe),
    // con Pip exactamente donde estaba posado.
    const shellRect = shell.getBoundingClientRect();
    const spriteLeft = Math.max(8, Math.min(shell.clientWidth - 80, start.x - shellRect.left));
    const side = spriteLeft >= 90 ? 1 : -1;
    const x0 = side === 1 ? 36 : CW - 36;
    const startLeftArt = x0 + side * START_GAP - (RIG_W - 1 - RIG_FOOT_X);
    setGeometry({
      left: spriteLeft - startLeftArt * ART,
      top: start.y - shellRect.top + shell.scrollTop - (GROUND - RIG_TALL) * ART,
      side, x0
    });

    // En el footer: el sitio del portal sale del reparto del mundo.
    function publishTrip(next) {
      if (!trip) {
        const L = worldLayout();
        const width = zone.getBoundingClientRect().width;
        const spot = portalSpot(L) || { x: Math.round(Math.max(30, width / ART * 0.3)), side: 1 };
        trip = { plane: spot.x, side: spot.side };
      }
      const centre = trip.plane + trip.side * (next === "arrive-open" ? EMERGE_FROM : EMERGE_TO);
      publishActor(TRAVELER, {
        x: centre * ART - SPRITE_HALF, y: 0, walkMs: next === "arrive-open" || reducedMotion ? 0 : PORTAL_EMERGE_MS,
        facing: trip.side === 1 ? -1 : 1, mood: "idle", expression: "happy", outfit: outfitRef.current,
        portalTrip: { x: trip.plane, side: trip.side, phase: next }
      });
    }

    window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "start" } }));
    const journey = startPortalJourney({
      reducedMotion,
      onDeparted: start.onDeparted,
      onPhase(next) {
        phaseRef.current = { name: next, at: now() };
        if (next.startsWith("arrive")) publishTrip(next);
        setPhase(next);
      },
      onDone() {
        handedOff = true;
        const x = (trip.plane + trip.side * EMERGE_TO) * ART - SPRITE_HALF;
        window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "land", x, facing: trip.side === 1 ? -1 : 1 } }));
        frames.push(window.requestAnimationFrame(() => {
          frames.push(window.requestAnimationFrame(() => { dropActor(TRAVELER); onDoneRef.current?.(); }));
        }));
      }
    });
    journeyRef.current = journey;
    const observer = new IntersectionObserver(([entry]) => journey.setFooterVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15), { root: shell, threshold: 0.15 });
    observer.observe(footer);
    return () => {
      journey.dispose();
      journeyRef.current = null;
      observer.disconnect();
      frames.forEach(window.cancelAnimationFrame);
      dropActor(TRAVELER);
      if (!handedOff) window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "cancel" } }));
    };
  }, [start, reducedMotion]);

  useLayoutEffect(() => { journeyRef.current?.setPageReady(!aboveSplash); }, [aboveSplash, start, reducedMotion]);

  // La salida, dibujada en su propio lienzo encima de la puerta.
  const departing = phase.startsWith("depart");
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!g || !geometry || !departing) return undefined;
    g.imageSmoothingEnabled = false;
    const painter = createPortalPainter();
    const { side, x0 } = geometry;
    const season = getSeasonalEvent() || "";
    const fit = wornSlots(outfitFor({ friendshipLevel, inventory, hiddenGear, unlockedGear, season }));
    let raf = 0, blinkAt = now() + 1.2;
    const draw = () => {
      const { name, at } = phaseRef.current;
      if (!name.startsWith("depart")) return;
      const t = now(), e = t - at;
      const f = reducedMotion
        ? { portal: "steady", centre: START_GAP, pose: "idle", expr: "happy", flip: side === 1, hidden: name !== "depart-open" }
        : departFrame(name, e, side);
      g.clearRect(0, 0, CW, CH);
      let traveler = null;
      if (!f.hidden) {
        const blink = t > blinkAt && t < blinkAt + 0.13 && (f.expr === "idle" || f.expr === "happy");
        if (t > blinkAt + 0.13) blinkAt = t + 2.2 + Math.random() * 2.5;
        const rig = rigImg({ pose: f.pose, frame: f.frame || 0, expr: blink ? "blink" : f.expr, lookX: 0, lookY: 0, ghost: false, glow: false, outfit: fit, handUp: false });
        const centre = x0 + side * f.centre;
        const left = Math.round(centre - (f.flip ? RIG_W - 1 - RIG_FOOT_X : RIG_FOOT_X)), top = GROUND - RIG_TALL - (f.hop || 0);
        const img = f.portal === "steady" || f.portal === "close" ? cutAtPlane(rig.c, left, f.flip, x0, side) : rig.c;
        if (f.flip) { g.save(); g.translate(left + img.width, top); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore(); }
        else g.drawImage(img, left, top);
        traveler = { img, left, top, flip: f.flip };
      }
      painter.draw(g, x0, CY, {
        phase: f.portal, e: f.pe ?? e, t, near: side, ground: GROUND + 1, flow: "in",
        traveler, ripples: f.ripples, gulp: f.gulp, pulse: f.gulp != null ? Math.max(0, 1 - f.gulp / 0.3) : 0
      });
      if (!reducedMotion) raf = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(raf);
  }, [geometry, departing, reducedMotion, friendshipLevel, outfitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!geometry) return null;
  if (!departing) return <i className="buddy-portal-travel is-in-world" data-phase={phase} hidden />;
  return (
    <canvas
      ref={canvasRef}
      className={`buddy-portal-travel ${aboveSplash ? "is-above-splash" : ""}`}
      data-phase={phase}
      aria-hidden="true"
      width={CW}
      height={CH}
      style={{ left: geometry.left, top: geometry.top, width: CW * ART, height: CH * ART }}
    />
  );
}
