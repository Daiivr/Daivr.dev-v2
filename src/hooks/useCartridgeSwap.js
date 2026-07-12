import { useEffect, useRef, useState } from "react";

const EJECT_MS = 250;
const INSERT_MS = 480;

const reduceMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

/*
  Cambio de cartucho entre secciones: intercepta los clicks a anclas de
  seccion, expulsa el panel actual hacia arriba, salta el scroll con la
  pantalla en negro y asienta la seccion nueva con su golpe seco. El scroll
  vive en .app-shell, por eso el salto usa scrollTo sobre el shell y no el
  ancla nativa. Con motion reducido solo salta directo.
*/
export function useCartridgeSwap(shellRef) {
  const [phase, setPhase] = useState("");
  const targetRef = useRef("");
  const jumpedRef = useRef("");
  const busyRef = useRef(false);
  const timersRef = useRef(new Set());

  useEffect(() => {
    const timers = timersRef.current;

    function schedule(fn, ms) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    }

    function findSection(id) {
      if (!id) return null;
      return document.querySelector(`main section[id="${CSS.escape(id)}"]`);
    }

    function jumpToTarget() {
      const shell = shellRef.current;
      const section = findSection(targetRef.current);
      jumpedRef.current = targetRef.current;
      if (!shell || !section) return;

      const margin = parseFloat(window.getComputedStyle(section).scrollMarginTop) || 0;
      const top = section.getBoundingClientRect().top - shell.getBoundingClientRect().top + shell.scrollTop - margin;
      shell.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "instant" });
    }

    function swapTo(id) {
      targetRef.current = id;
      // Ya hay un cambio en vuelo: solo re-apunta; el ciclo activo lo resuelve.
      if (busyRef.current) return;

      if (reduceMotionQuery?.matches) {
        jumpToTarget();
        return;
      }

      busyRef.current = true;
      setPhase("eject");

      schedule(() => {
        jumpToTarget();
        setPhase("insert");
        window.dispatchEvent(new CustomEvent("daivr-cart-swap", { detail: { section: targetRef.current } }));
      }, EJECT_MS);

      schedule(() => {
        setPhase("");
        busyRef.current = false;
        // Click llegado despues del salto: encadena otro ciclo hacia el nuevo destino.
        if (targetRef.current !== jumpedRef.current) swapTo(targetRef.current);
      }, EJECT_MS + INSERT_MS);
    }

    function onClick(event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest?.('a[href^="#"]');
      if (!anchor) return;

      const id = anchor.getAttribute("href").slice(1);
      // Anclas que no son secciones (p. ej. el skip link) siguen nativas.
      if (!findSection(id)) return;

      event.preventDefault();
      if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
      swapTo(id);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return phase;
}
