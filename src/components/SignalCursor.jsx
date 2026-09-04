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

// Prioridad de deteccion: gana el primer selector que acierte.
const MODE_ORDER = ["busy", "blocked", "grabbing", "grab", "text", "interactive"];

// Modos que enganchan el reticulo sobre el elemento apuntado. Los objetivos
// enormes quedan fuera: encuadrar una seccion entera no lee como punteria.
const LOCK_MODES = new Set(["blocked", "grab", "grabbing", "interactive", "text"]);
const LOCK_PAD = 6;
const LOCK_MAX_WIDTH = 560;
const LOCK_MAX_HEIGHT = 320;
// Lado del reticulo replegado: dos escuadras de 8px llenan la caja justa.
const LOCK_IDLE_SIZE = 16;
// Frames sin cambio que apagan el bucle que sigue al objetivo. El presupuesto
// largo solo corre mientras el objetivo tenga una transicion viva encima.
const LOCK_SETTLE_FRAMES = 12;
const LOCK_CHASE_FRAMES = 90;

// Media vida del suavizado de la etiqueta, en ms. Al medirse contra el tiempo
// real y no contra el frame, se siente igual a 60 que a 144 Hz.
const FOLLOW_HALF_LIFE = 21;

// Contenido que dibuja su propio puntero: dentro de un iframe no llegan
// eventos, asi que el falso cursor se quedaria clavado en el borde.
const NATIVE_TAGS = new Set(["EMBED", "FRAME", "IFRAME", "OBJECT"]);

export function SignalCursor({ theme = "crt" }) {
  const rootRef = useRef(null);
  const labelRef = useRef(null);
  const lockRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!finePointer?.matches || reducedMotion?.matches) return undefined;

    const root = rootRef.current;
    const label = labelRef.current;
    const lock = lockRef.current;
    if (!root || !label || !lock) return undefined;

    const page = document.documentElement;
    const pointer = { x: -80, y: -80 };
    const follower = { x: -80, y: -80 };
    let animationFrame = 0;
    let lastFrame = 0;
    let refreshFrame = 0;
    let initialized = false;
    let mode = "default";
    let hoverNode = null;
    let lockNode = null;
    let lockBox = "";
    let lockLoop = 0;
    let lockSettled = 0;
    let locked = false;
    let nativePointer = false;

    // La estela tine sus particulas con el modo activo (ver CursorTrail).
    function publish(nextMode) {
      page.dataset.cursorMode = nextMode;
      window.dispatchEvent(new CustomEvent("daivr-cursor-mode", { detail: { mode: nextMode } }));
    }

    function resolveTarget(target) {
      if (!(target instanceof Element)) return { mode: "default", node: null };

      for (const name of MODE_ORDER) {
        const match = target.closest(SELECTORS[name]);
        if (match) return { mode: name, node: match };
      }

      return { mode: "default", node: null };
    }

    // Escribir solo cuando la caja cambia: sin esto cada pointermove sobre el
    // mismo boton ensuciaria el estilo y forzaria un layout por muestra.
    function writeLock(x, y, width, height, angle) {
      const box = `${x}|${y}|${width}|${height}|${angle}`;
      if (box === lockBox) return false;
      lockBox = box;
      root.style.setProperty("--lock-x", `${x}px`);
      root.style.setProperty("--lock-y", `${y}px`);
      root.style.setProperty("--lock-w", `${width}px`);
      root.style.setProperty("--lock-h", `${height}px`);
      root.style.setProperty("--lock-angle", `${angle}deg`);
      return true;
    }

    // getBoundingClientRect devuelve la caja alineada a los ejes, que sobre una
    // ficha girada es bastante mayor que la ficha: las esquinas del reticulo
    // acaban flotando lejos de las suyas. Recuperamos el giro acumulado de la
    // cadena de ancestros para encuadrar el elemento tal y como se ve.
    function measureTarget(node) {
      const rect = node.getBoundingClientRect();
      const plain = { x: rect.left, y: rect.top, width: rect.width, height: rect.height, angle: 0 };
      const localWidth = node.offsetWidth;
      const localHeight = node.offsetHeight;
      if (!localWidth || !localHeight) return plain;

      let matrix = new DOMMatrixReadOnly();
      for (let step = node; step && step !== document.body; step = step.parentElement) {
        const transform = window.getComputedStyle(step).transform;
        if (!transform || transform === "none") continue;
        const own = new DOMMatrixReadOnly(transform);
        // En 3D la proyeccion deja de ser un rectangulo; la caja recta sirve mas.
        if (!own.is2D) return plain;
        matrix = own.multiply(matrix);
      }
      if (matrix.isIdentity) return plain;

      const scaleX = Math.hypot(matrix.a, matrix.b);
      const scaleY = Math.hypot(matrix.c, matrix.d);
      if (!scaleX || !scaleY) return plain;
      // Con sesgo los ejes dejan de ser perpendiculares y ya no hay rectangulo.
      if (Math.abs(matrix.a * matrix.c + matrix.b * matrix.d) > scaleX * scaleY * 0.02) return plain;

      // Una transformacion afin lleva el centro de la caja al centro de su
      // huella, y la caja alineada de un paralelogramo comparte ese centro.
      const width = localWidth * scaleX;
      const height = localHeight * scaleY;
      return {
        x: rect.left + (rect.width - width) / 2,
        y: rect.top + (rect.height - height) / 2,
        width,
        height,
        angle: Math.atan2(matrix.b, matrix.a) * (180 / Math.PI)
      };
    }

    function releaseLock() {
      lockNode = null;
      if (lockLoop) {
        window.cancelAnimationFrame(lockLoop);
        lockLoop = 0;
      }
      if (!locked) return;
      locked = false;
      root.classList.remove("is-locked");
      // Replegado sobre la punta del cursor: en reposo no hay transicion, asi
      // que el proximo enganche brota desde el puntero en vez de llegar
      // volando desde el objetivo que se acaba de soltar.
      const half = LOCK_IDLE_SIZE / 2;
      writeLock(Math.round(pointer.x - half), Math.round(pointer.y - half), LOCK_IDLE_SIZE, LOCK_IDLE_SIZE, 0);
    }

    function paintLock() {
      if (!lockNode?.isConnected) {
        releaseLock();
        return false;
      }

      const box = measureTarget(lockNode);
      if (box.width < 6 || box.height < 6 || box.width > LOCK_MAX_WIDTH || box.height > LOCK_MAX_HEIGHT) {
        releaseLock();
        return false;
      }

      const moved = writeLock(
        Math.round(box.x - LOCK_PAD),
        Math.round(box.y - LOCK_PAD),
        Math.round(box.width + LOCK_PAD * 2),
        Math.round(box.height + LOCK_PAD * 2),
        Math.round(box.angle * 10) / 10
      );

      if (locked) return moved;

      // Vaciar el estilo pendiente antes de encender la transicion. Sin este
      // recalculo el navegador fusiona ambos cambios en uno y el reticulo
      // aparece animando desde la caja anterior en lugar de brotar.
      void lock.offsetWidth;
      locked = true;
      root.classList.add("is-locked");
      return moved;
    }

    // Una transicion de hover con arranque suave no mueve un solo pixel entero
    // en sus primeros 200ms. Contando unicamente frames quietos, el bucle se
    // apagaba justo antes de que el objetivo empezara a moverse y el reticulo
    // se quedaba clavado hasta el siguiente pointermove. Mientras haya una
    // transicion viva sobre el objetivo se le da mucha mas cuerda.
    function isSettling(node) {
      if (typeof CSSTransition === "undefined" || !node.getAnimations) return false;
      // Solo transiciones: una animacion decorativa infinita (el boton armado
      // de la puerta, sin ir mas lejos) dejaria el bucle girando para siempre.
      return node.getAnimations().some((animation) => animation instanceof CSSTransition && animation.playState === "running");
    }

    // Al posarse sobre una ficha, esta se endereza y crece con su propia
    // transicion. El puntero ya no se mueve, asi que nadie volveria a medir:
    // este bucle sigue al objetivo y se apaga solo cuando deja de cambiar.
    function followLock() {
      lockLoop = 0;
      if (!locked) return;

      const node = lockNode;
      if (paintLock()) lockSettled = 0;
      else lockSettled += 1;

      const budget = node && isSettling(node) ? LOCK_CHASE_FRAMES : LOCK_SETTLE_FRAMES;
      if (lockSettled < budget) lockLoop = window.requestAnimationFrame(followLock);
    }

    function chaseLock() {
      lockSettled = 0;
      if (!lockLoop) lockLoop = window.requestAnimationFrame(followLock);
    }

    function applyMode(next) {
      if (next.mode !== mode) {
        mode = next.mode;
        root.dataset.mode = next.mode;
        label.textContent = CURSOR_LABELS[next.mode];
        publish(next.mode);
      }

      lockNode = LOCK_MODES.has(next.mode) ? next.node : null;
      if (!lockNode) {
        releaseLock();
        return;
      }
      paintLock();
      chaseLock();
    }

    // El modo solo se recalcula al cambiar de elemento; recorrer seis
    // selectores en cada pointermove no aporta nada sobre el mismo nodo.
    function track(target, force) {
      if (!force && target === hoverNode) {
        if (locked) paintLock();
        return;
      }
      hoverNode = target;
      applyMode(resolveTarget(target));
    }

    function paint(now) {
      const delta = lastFrame ? Math.min(64, now - lastFrame) : 16;
      lastFrame = now;

      const ease = 1 - 2 ** (-delta / FOLLOW_HALF_LIFE);
      const distanceX = pointer.x - follower.x;
      const distanceY = pointer.y - follower.y;
      follower.x += distanceX * ease;
      follower.y += distanceY * ease;

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
        lastFrame = 0;
      }
    }

    function requestPaint() {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(paint);
    }

    // Devolver el puntero del sistema: sobre un iframe o bajo un menu
    // contextual la pagina deja de recibir eventos y el arrow se congelaria.
    function useNativePointer(active) {
      if (nativePointer === active) return;
      nativePointer = active;

      if (active) {
        page.classList.remove("has-signal-cursor");
        root.classList.remove("is-visible");
        hoverNode = null;
        releaseLock();
        publish("off");
        return;
      }

      page.classList.add("has-signal-cursor");
      publish(mode);
    }

    function isNativeSurface(target) {
      return target instanceof Element && NATIVE_TAGS.has(target.tagName);
    }

    function requestRefresh() {
      if (!initialized || refreshFrame) return;

      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0;
        if (nativePointer) return;
        track(document.elementFromPoint(pointer.x, pointer.y), true);
      });
    }

    function updatePointer(event) {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (isNativeSurface(event.target)) {
        useNativePointer(true);
        return;
      }
      useNativePointer(false);

      if (!initialized) {
        follower.x = pointer.x;
        follower.y = pointer.y;
        initialized = true;
      }

      root.classList.add("is-visible");
      root.dataset.edgeX = pointer.x > window.innerWidth - 112 ? "right" : "left";
      root.dataset.edgeY = pointer.y > window.innerHeight - 72 ? "bottom" : "top";
      track(event.target, false);
      requestPaint();
    }

    function updateTarget(event) {
      if (event.pointerType === "touch") return;

      if (isNativeSurface(event.target)) {
        useNativePointer(true);
        return;
      }
      useNativePointer(false);
      track(event.target, false);
    }

    function addClickPulse(event) {
      if (event.pointerType === "touch" || nativePointer) return;
      root.classList.add("is-pressed");
      if (mode === "grab") applyMode({ mode: "grabbing", node: lockNode });

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
      if (nativePointer) return;
      track(event.target, true);
    }

    function handleContextMenu(event) {
      // El menu del sistema se dibuja fuera de la pagina y la deja sin
      // eventos: sin esto el visitante se queda sin ningun cursor visible.
      if (!event.defaultPrevented) useNativePointer(true);
    }

    function hidePointer(event) {
      if (event.relatedTarget) return;
      root.classList.remove("is-visible");
      hoverNode = null;
      releaseLock();
    }

    function hideOnBlur() {
      page.classList.remove("is-text-selecting");
      root.classList.remove("is-visible", "is-pressed");
      hoverNode = null;
      releaseLock();
    }

    // Cursor modes can change while the pointer is stationary (for example,
    // when the splash switches from aria-busy to ready). Keep the readout in
    // sync with those DOM state changes instead of waiting for pointermove.
    const stateObserver = new MutationObserver((records) => {
      if (records.some((record) => !root.contains(record.target))) {
        requestRefresh();
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
    window.addEventListener("contextmenu", handleContextMenu, { passive: true });
    window.addEventListener("resize", requestRefresh, { passive: true });
    // La pagina se desplaza dentro de .app-shell y scroll no burbujea: solo la
    // fase de captura ve moverse el contenedor que hay bajo el puntero.
    document.addEventListener("scroll", requestRefresh, { passive: true, capture: true });
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
      delete page.dataset.cursorMode;
      window.removeEventListener("pointermove", updatePointer, { capture: true });
      window.removeEventListener("pointerover", updateTarget, { capture: true });
      window.removeEventListener("pointerdown", addClickPulse, { capture: true });
      window.removeEventListener("pointerup", releasePointer, { capture: true });
      window.removeEventListener("pointercancel", releasePointer, { capture: true });
      window.removeEventListener("mouseout", hidePointer);
      window.removeEventListener("blur", hideOnBlur);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", requestRefresh);
      document.removeEventListener("scroll", requestRefresh, { capture: true });
      document.removeEventListener("selectstart", beginTextSelection, { capture: true });
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(refreshFrame);
      window.cancelAnimationFrame(lockLoop);
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
      <span className="signal-cursor__lock" ref={lockRef}>
        <i className="signal-cursor__lock-corner is-tl" />
        <i className="signal-cursor__lock-corner is-tr" />
        <i className="signal-cursor__lock-corner is-bl" />
        <i className="signal-cursor__lock-corner is-br" />
      </span>
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
