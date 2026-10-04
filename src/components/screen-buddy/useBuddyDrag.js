import { useEffect, useState } from "react";
import { LINES } from "./buddyLines";
import { clamp, FALL_SPEED_PX_S, reduceMotionQuery, SPRITE_WIDTH } from "./useBuddyCore";

/*
  Agarrar y soltar: se arrastra por encima del footer (sin salir del
  viewport) y, si se suelta en alto, baja en paracaidas (o con las botas
  cohete) hasta el riel. Un arrastre no cuenta como caricia.
*/

const DRAG_THRESHOLD_PX = 7;

export function useBuddyDrag(core) {
  const [api] = useState(() => createDrag(core));
  useEffect(() => () => window.cancelAnimationFrame(api.dragFrameRef.current), [api]);
  return api;
}

function createDrag(core) {
  const { rootRef, moodRef, moodGenRef, yRef, activeEventRef, rocketBootsRef } = core;
  const { moveTo, liftTo, updateMood, say, pickLine, schedule, currentDomPosition, setWalkMs } = core;
  const dragRef = { current: null };
  const draggedRef = { current: false };
  const dragFrameRef = { current: 0 };
  const pendingDragRef = { current: null };

  function applyDragFrame() {
    dragFrameRef.current = 0;
    const drag = dragRef.current;
    const point = pendingDragRef.current;
    if (!drag?.dragging || !point) return;
    moveTo(clamp(drag.originX + (point.clientX - drag.startClientX), 4, drag.maxX));
    liftTo(clamp(drag.originY + (point.clientY - drag.startClientY), drag.minY, 0));
  }

  function handlePointerDown(event) {
    if (reduceMotionQuery?.matches) return;
    if (activeEventRef.current) return;
    if (["outage", "hunt"].includes(moodRef.current)) return;
    if (event.button != null && event.button !== 0) return;
    const node = rootRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    const position = currentDomPosition();

    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: position.x,
      originY: Math.min(0, position.y),
      // Altura maxima: que el sprite no salga del viewport por arriba.
      minY: Math.min(-40, -(parentRect.top - 26)),
      maxX: Math.max(4, parent.clientWidth - SPRITE_WIDTH - 4),
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
      drag.dragging = true;
      draggedRef.current = true;
      // Congela la posicion real antes de matar la transicion para no saltar.
      moveTo(drag.originX);
      liftTo(drag.originY);
      setWalkMs(0);
      updateMood("held");
      say(pickLine(LINES.held), 1800);
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

    if (!drag.dragging) return;
    schedule(() => {
      draggedRef.current = false;
    }, 220);

    const hasRocketBoots = rocketBootsRef.current;
    if (yRef.current < -30) {
      updateMood("chute");
      say(pickLine(hasRocketBoots ? LINES.rocketFall : LINES.chute), 2200);
      const fallMs = clamp((Math.abs(yRef.current) / FALL_SPEED_PX_S) * 1000, 650, 6500);
      const generation = moodGenRef.current;
      setWalkMs(fallMs);
      liftTo(0);
      schedule(() => {
        if (moodGenRef.current !== generation || moodRef.current !== "chute") return;
        setWalkMs(0);
        updateMood("idle");
        say(pickLine(hasRocketBoots ? LINES.rocketLanded : LINES.landed), 2200);
      }, fallMs + 60);
    } else {
      setWalkMs(0);
      liftTo(0);
      updateMood("idle");
    }
  }

  return { draggedRef, dragFrameRef, handlePointerDown, handlePointerMove, handlePointerRelease };
}
