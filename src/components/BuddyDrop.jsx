import { useEffect, useRef, useState } from "react";
import { getLocalBuddyLevel } from "../hooks/useBuddyFriendship";
import { BuddyChuteCanopy, BuddySprite } from "./BuddySprite";

// Ritmo pensado para seguirlo con la rueda del mouse mientras baja la pagina.
const DROP_SPEED_PX_S = 260;
const SPRITE_HEIGHT = 61;
const SPRITE_WIDTH = 64;
const DRAG_THRESHOLD_PX = 6;
const COMMENT_POLL_MS = 380;

const LAUNCH_LINE = "geronimoooo.";
const HELD_LINES = ["hey! mid-flight!", "turbulence???", "unauthorized mid-air pickup!"];
const REDEPLOY_LINES = ["re-deploying chute!", "chute v2. good as new.", "resuming descent."];

// Comentarios por seccion mientras pasa cayendo (el hero queda cubierto por
// la linea de despegue).
const SECTION_LINES = {
  now: ["current quest: descending.", "ooh, the save-state."],
  builds: ["i was compiled somewhere around here.", "nice carts. no downloads mid-air."],
  room: ["ooh, the room signal. cozy.", "lo-fi detected. vibing."],
  games: ["988 hours of nier? respect.", "those fallout hours are concerning. love it."],
  toolbelt: ["sturdy toolbelt down there.", "powered by late nights, mostly."],
  patchlog: ["i'm in these patch notes, you know.", "the changelog mentions me. twice."],
  contact: ["leave a comment. say i waved.", "almost home. footer incoming."]
};

function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
  Caida de bienvenida: el buddy salta de la puerta del splash y desciende en
  paracaidas EN ESPACIO DE PAGINA (absoluto dentro de .app-shell), asi el
  scroll puede acompañarlo hasta el riel del footer. En el camino comenta la
  seccion que va atravesando, y se puede AGARRAR: la cupula se pliega mientras
  lo llevas y se re-despliega al soltarlo, retomando el descenso desde ahi.

  Relevo sin clones: emite "daivr-buddy-drop" {phase:"start"} al despegar
  (el ScreenBuddy del footer no aparece mientras tanto) y {phase:"land", x}
  al tocar el riel para que el ScreenBuddy tome el control justo ahi.
*/
export function BuddyDrop({ start, onDone }) {
  const [geometry, setGeometry] = useState(null);
  const [mode, setMode] = useState("boarding"); // boarding | fall | held
  const [anchorTop, setAnchorTop] = useState(0);
  const [fallMs, setFallMs] = useState(0);
  const [bubble, setBubble] = useState("");

  const rootRef = useRef(null);
  const onDoneRef = useRef(onDone);
  const modeRef = useRef("boarding");
  const leftRef = useRef(0);
  const topRef = useRef(0);
  const endTopRef = useRef(0);
  const zoneRef = useRef(null);
  const shellRef = useRef(null);
  const sectionZonesRef = useRef([]);
  const lastSectionRef = useRef("");
  const dragRef = useRef(null);
  const dragFrameRef = useRef(0);
  const pendingDragRef = useRef(null);
  const landTimerRef = useRef(0);
  const fallRafRef = useRef([0, 0]);
  const bubbleTimerRef = useRef(0);
  const landedRef = useRef(false);

  const reduceMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  function updateMode(next) {
    modeRef.current = next;
    setMode(next);
  }

  function moveLeft(value) {
    leftRef.current = value;
    setGeometry((current) => (current ? { ...current, left: value } : current));
  }

  function moveTop(value) {
    topRef.current = value;
    setAnchorTop(value);
  }

  function say(line, ms = 2600) {
    window.clearTimeout(bubbleTimerRef.current);
    setBubble(line);
    bubbleTimerRef.current = window.setTimeout(() => setBubble(""), ms);
  }

  function currentDocTop() {
    const node = rootRef.current;
    const shell = shellRef.current;
    if (!node || !shell) return topRef.current;
    return node.getBoundingClientRect().top + shell.scrollTop;
  }

  function land() {
    if (landedRef.current) return;
    landedRef.current = true;
    const zone = zoneRef.current;
    const landingX = zone ? leftRef.current - zone.getBoundingClientRect().left : null;
    window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "land", x: landingX } }));
    onDoneRef.current?.();
  }

  // Retoma (o inicia) el descenso desde fromTop hasta el riel.
  function armFall(fromTop) {
    const remaining = endTopRef.current - fromTop;
    if (remaining < 30) {
      land();
      return;
    }

    const ms = Math.round((remaining / DROP_SPEED_PX_S) * 1000);
    fallRafRef.current.forEach((raf) => window.cancelAnimationFrame(raf));
    moveTop(fromTop);
    setFallMs(ms);

    // Doble rAF: la posicion de anclaje pinta antes de transicionar.
    fallRafRef.current[0] = window.requestAnimationFrame(() => {
      fallRafRef.current[1] = window.requestAnimationFrame(() => {
        if (modeRef.current === "held") return;
        updateMode("fall");
      });
    });

    window.clearTimeout(landTimerRef.current);
    landTimerRef.current = window.setTimeout(() => {
      if (modeRef.current === "fall") land();
    }, ms + 150);
  }

  // --- Agarre en pleno vuelo ------------------------------------------------

  function applyDragFrame() {
    dragFrameRef.current = 0;
    const drag = dragRef.current;
    const point = pendingDragRef.current;
    if (!drag?.dragging || !point) return;
    moveLeft(clamp(drag.originLeft + (point.clientX - drag.startClientX), 8, drag.maxLeft));
    moveTop(clamp(drag.originTop + (point.clientY - drag.startClientY), 8, endTopRef.current));
  }

  function handlePointerDown(event) {
    if (reduceMotion || landedRef.current) return;
    if (event.button != null && event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originLeft: leftRef.current,
      originTop: 0,
      maxLeft: Math.max(8, (shellRef.current?.clientWidth || 800) - SPRITE_WIDTH - 8),
      dragging: false
    };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Punteros sinteticos o ya liberados: el arrastre funciona igual.
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    pendingDragRef.current = { clientX: event.clientX, clientY: event.clientY };

    if (!drag.dragging) {
      const moved = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
      if (moved < DRAG_THRESHOLD_PX) return;

      // Congela la caida en la posicion real antes de colgarlo del puntero.
      drag.dragging = true;
      drag.originTop = currentDocTop();
      drag.startClientX = event.clientX;
      drag.startClientY = event.clientY;
      window.clearTimeout(landTimerRef.current);
      moveTop(drag.originTop);
      setFallMs(0);
      updateMode("held");
      say(pickRandom(HELD_LINES), 2000);
    }

    if (!dragFrameRef.current) {
      dragFrameRef.current = window.requestAnimationFrame(applyDragFrame);
    }
  }

  function handlePointerRelease(event) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    pendingDragRef.current = null;
    window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = 0;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Sin captura activa no hay nada que liberar.
    }

    if (!drag.dragging || landedRef.current) return;

    say(pickRandom(REDEPLOY_LINES), 2200);
    updateMode("boarding");
    armFall(topRef.current);
  }

  // --- Vuelo + comentarios ---------------------------------------------------

  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    const zone = document.querySelector(".app-footer-zone");
    const footer = zone?.querySelector(".app-footer");

    if (reduceMotion || !shell || !zone || !footer) {
      onDoneRef.current?.();
      return undefined;
    }

    shellRef.current = shell;
    zoneRef.current = zone;

    const scrollTop = shell.scrollTop;
    const startTop = start.y + scrollTop;
    endTopRef.current = footer.getBoundingClientRect().top + scrollTop - SPRITE_HEIGHT + 2;

    // Zonas de comentario medidas una vez (la pagina no cambia durante el vuelo).
    sectionZonesRef.current = Object.entries(SECTION_LINES)
      .map(([id, lines]) => {
        const element = document.getElementById(id);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { id, lines, top: rect.top + scrollTop, bottom: rect.top + scrollTop + rect.height };
      })
      .filter(Boolean);

    window.dispatchEvent(new CustomEvent("daivr-buddy-drop", { detail: { phase: "start" } }));

    leftRef.current = start.x;
    setGeometry({ left: start.x });
    armFall(startTop);

    const launchTimer = window.setTimeout(() => {
      if (modeRef.current === "fall") say(LAUNCH_LINE, 2200);
    }, 350);

    const commentTimer = window.setInterval(() => {
      if (modeRef.current !== "fall") return;
      const docY = currentDocTop() + SPRITE_HEIGHT / 2;
      const section = sectionZonesRef.current.find((item) => docY >= item.top && docY <= item.bottom);
      if (section && section.id !== lastSectionRef.current) {
        lastSectionRef.current = section.id;
        say(pickRandom(section.lines), 2600);
      }
    }, COMMENT_POLL_MS);

    return () => {
      window.clearTimeout(launchTimer);
      window.clearInterval(commentTimer);
      window.clearTimeout(landTimerRef.current);
      window.clearTimeout(bubbleTimerRef.current);
      window.cancelAnimationFrame(dragFrameRef.current);
      fallRafRef.current.forEach((raf) => window.cancelAnimationFrame(raf));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reduceMotion || !geometry) return null;

  return (
    <div
      className={`buddy-drop ${mode === "held" ? "is-held" : ""}`}
      ref={rootRef}
      style={{
        left: `${geometry.left}px`,
        transform: `translate3d(0, ${mode === "fall" ? endTopRef.current : anchorTop}px, 0)`,
        transitionDuration: `${mode === "fall" ? fallMs : 0}ms`
      }}
      aria-hidden="true"
    >
      <div className={`screen-buddy-bubble buddy-drop-bubble ${bubble ? "is-visible" : ""}`}>{bubble}</div>
      <div
        className="buddy-drop-body"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
      >
        <BuddyChuteCanopy className="buddy-drop-canopy" />
        <BuddySprite expression="happy" friendshipLevel={getLocalBuddyLevel()} />
      </div>
    </div>
  );
}
