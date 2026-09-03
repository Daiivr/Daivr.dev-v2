import { useCallback, useEffect, useRef, useState } from "react";

const ZERO_DRAG = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1
};

// Inclinacion en reposo cuando el panel cuelga del clavo: un cuadro colgado
// nunca queda perfectamente a plomo.
const HANG_TILT = -2.4;

// Duracion del aterrizaje (chincheta clavandose + retroceso). Tiene que cubrir
// las animaciones de hero-console-pin y tack-drive de index.css.
const HANG_LAND_MS = 720;

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

export function useElasticDrag({ scopeRef, hangRef, hangRadius = 104 } = {}) {
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
    returnRaf: 0,
    // Posicion del gancho (centro del borde superior) sin transformar. Se mide
    // al agarrar y no en cada frame: getBoundingClientRect de un elemento ya
    // rotado devuelve la caja envolvente, no el punto real.
    hookBase: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isHung, setIsHung] = useState(false);
  const [hangArmed, setHangArmed] = useState(false);
  // Ventana corta justo despues de engancharse: la usa el CSS para clavar la
  // chincheta y dar el retroceso al panel antes de pasar al vaiven.
  const [hangLanded, setHangLanded] = useState(false);
  const landTimerRef = useRef(0);
  // Espejo sincrono de isHung: hangOnNail lo consulta dentro del mismo gesto,
  // antes de que React haya vuelto a renderizar.
  const isHungRef = useRef(false);

  const readHookBase = useCallback(() => {
    const target = targetRef.current;
    if (!target) return null;

    // getBoundingClientRect de un elemento rotado devuelve la caja envolvente
    // alineada a los ejes, cuyo borde superior queda POR ENCIMA del borde real
    // del panel. Colgado esta inclinado -2.4deg, asi que restar el
    // desplazamiento no bastaba: el gancho salia unos 15px demasiado arriba y
    // cada vez que se volvia a colgar el panel bajaba ese tanto. Se mide con la
    // transformacion anulada, que da la caja de maquetacion exacta.
    const prev = {
      transform: target.style.transform,
      rotate: target.style.rotate,
      animation: target.style.animation,
      transition: target.style.transition
    };

    target.style.transition = "none";
    target.style.animation = "none";
    target.style.transform = "none";
    target.style.rotate = "none";

    const rect = target.getBoundingClientRect();

    target.style.transform = prev.transform;
    target.style.rotate = prev.rotate;
    target.style.animation = prev.animation;
    target.style.transition = prev.transition;

    return { x: rect.left + rect.width / 2, y: rect.top };
  }, []);

  const readNail = useCallback(() => {
    const nail = hangRef?.current;
    if (!nail) return null;
    const rect = nail.getBoundingClientRect();
    // Bajo 1024px el clavo no se pinta: sin caja no hay sitio donde colgar.
    if (!rect.width && !rect.height) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, [hangRef]);

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

  // Un unico muelle para las dos metas: volver al sitio (0,0) o quedarse
  // colgado del clavo. restRotate null = la rotacion sigue al desplazamiento y
  // muere en 0; con valor, el panel reposa inclinado y oscila a su alrededor.
  const springTo = useCallback((toX, toY, restRotate = null) => {
    const target = targetRef.current;
    if (!target) return;

    window.cancelAnimationFrame(dragRef.current.returnRaf);

    const settle = () => {
      applyDragStyle(target, scopeRef?.current, {
        x: toX,
        y: toY,
        rotate: restRotate ?? 0,
        scale: 1
      });
      dragRef.current.x = toX;
      dragRef.current.y = toY;
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      settle();
      return;
    }

    let x = dragRef.current.x;
    let y = dragRef.current.y;
    let vx = 0;
    let vy = 0;

    function step() {
      vx = (vx + (toX - x) * 0.055) * 0.72;
      vy = (vy + (toY - y) * 0.055) * 0.72;
      x += vx;
      y += vy;

      applyDragStyle(target, scopeRef?.current, {
        x,
        y,
        rotate: restRotate === null ? x / 82 : restRotate + (x - toX) / 46,
        scale: 1 + Math.min(0.012, (Math.abs(x - toX) + Math.abs(y - toY)) / 36000)
      });

      if (Math.abs(x - toX) > 0.35 || Math.abs(y - toY) > 0.35 || Math.abs(vx) > 0.2 || Math.abs(vy) > 0.2) {
        dragRef.current.returnRaf = window.requestAnimationFrame(step);
        return;
      }

      settle();
    }

    dragRef.current.returnRaf = window.requestAnimationFrame(step);
  }, [scopeRef]);

  const returnHome = useCallback(() => {
    springTo(ZERO_DRAG.x, ZERO_DRAG.y, null);
  }, [springTo]);

  const hangOnNail = useCallback(() => {
    const base = dragRef.current.hookBase || readHookBase();
    const nail = readNail();
    if (!base || !nail) return false;

    dragRef.current.hookBase = base;

    // El aterrizaje solo suena al pasar de suelto a colgado. Un clic sobre el
    // panel ya colgado vuelve a engancharlo, y sin esto repetia el clavado y
    // el retroceso en cada pulsacion.
    if (!isHungRef.current) {
      setHangLanded(true);
      window.clearTimeout(landTimerRef.current);
      landTimerRef.current = window.setTimeout(() => setHangLanded(false), HANG_LAND_MS);
    }

    isHungRef.current = true;
    setIsHung(true);
    springTo(nail.x - base.x, nail.y - base.y, HANG_TILT);
    return true;
  }, [readHookBase, readNail, springTo]);

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
    dragRef.current.hookBase = readHookBase();
    setIsDragging(true);
  }, [readHookBase]);

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const nextX = drag.originX + event.clientX - drag.startX;
    const nextY = drag.originY + event.clientY - drag.startY;
    apply(nextX, nextY);

    // Aviso en vivo: el clavo se ilumina mientras el gancho esta a tiro.
    const base = drag.hookBase;
    const nail = readNail();
    setHangArmed(Boolean(base && nail)
      && Math.hypot(base.x + nextX - nail.x, base.y + nextY - nail.y) <= hangRadius);

    if (event.clientY < 72) {
      scrollShellBy(-14);
    } else if (event.clientY > window.innerHeight - 72) {
      scrollShellBy(14);
    }
  }, [apply, hangRadius, readNail]);

  const endDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    drag.active = false;
    drag.pointerId = null;
    setIsDragging(false);
    setHangArmed(false);

    const base = drag.hookBase;
    const nail = readNail();
    const caught = Boolean(base && nail)
      && Math.hypot(base.x + drag.x - nail.x, base.y + drag.y - nail.y) <= hangRadius;

    if (caught && hangOnNail()) return;

    isHungRef.current = false;
    setIsHung(false);
    setHangLanded(false);
    window.clearTimeout(landTimerRef.current);
    returnHome();
  }, [hangOnNail, hangRadius, readNail, returnHome]);

  // Al redimensionar, el desplazamiento guardado deja de apuntar al clavo: se
  // vuelve a medir y a colgar en la posicion nueva.
  useEffect(() => {
    if (!isHung) return undefined;

    function reseat() {
      dragRef.current.hookBase = null;
      const base = readHookBase();
      const nail = readNail();
      if (!base || !nail) return;
      dragRef.current.hookBase = base;
      springTo(nail.x - base.x, nail.y - base.y, HANG_TILT);
    }

    window.addEventListener("resize", reseat);
    return () => window.removeEventListener("resize", reseat);
  }, [isHung, readHookBase, readNail, springTo]);

  useEffect(() => () => {
    window.cancelAnimationFrame(dragRef.current.raf);
    window.cancelAnimationFrame(dragRef.current.returnRaf);
    window.clearTimeout(landTimerRef.current);
  }, []);

  return {
    handleProps: {
      onPointerCancel: endDrag,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag
    },
    hangArmed,
    hangLanded,
    isDragging,
    isHung,
    targetRef
  };
}
