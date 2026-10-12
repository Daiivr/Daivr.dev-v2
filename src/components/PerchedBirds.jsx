import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PixelBird } from "./PixelBird";

const BIRD_FLY_AWAY_MS = 2400;

const PAGE_PERCHES = [
  { id: "now", selector: ".now-card", side: "left" },
  { id: "project", selector: ".project-card", side: "right" },
  { id: "patch", selector: ".patch-desk-scene", side: "right" }
];

const SPLASH_PERCH = { id: "splash", selector: ".entry-splash-gate", side: "left", overlay: true };
const ATTRACT_PERCH = {
  id: "attract",
  selector: ".attract-scores-title",
  side: "right",
  align: "center",
  arrive: true,
  overlay: true
};

function getActivePerches() {
  if (document.querySelector(".entry-splash")) return [SPLASH_PERCH];
  if (document.querySelector(".attract-mode")) return [ATTRACT_PERCH];
  if (document.querySelector([
    ".buddy-modal-backdrop",
    ".madrace-backdrop",
    ".konami-library-backdrop",
    ".tower-modal-backdrop",
    ".arcade-embed-backdrop",
    ".project-modal-overlay[data-state=\"open\"]",
    ".comments-gif-modal",
    ".comments-delete-modal",
    ".patch-discovery-overlay",
    ".patch-lightbox-overlay"
  ].join(","))) return [];
  return PAGE_PERCHES;
}

export function PerchedBirds() {
  const [birds, setBirds] = useState([]);
  const targetsRef = useRef(new Map());
  const birdNodesRef = useRef(new Map());
  const dismissedRef = useRef(new Set());
  const timersRef = useRef(new Set());
  const visibilityRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    let trackingUntil = 0;
    let perchKey = "";
    // Lo ultimo escrito en cada pajaro: solo se toca el estilo si cambia, porque
    // escribir --bird-left/--bird-top en cada frame obligaba a recalcular estilo y
    // layout de toda la pagina a 60 fps.
    const written = new WeakMap();
    const resizeObserver = new ResizeObserver(requestMeasure);
    // Un pajaro fuera de la vista congela su animacion (pixel-birds.css): son
    // animaciones dentro del SVG y el navegador las calcula en cada frame.
    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    visibilityRef.current = visibility;
    birdNodesRef.current.forEach((node) => visibility.observe(node));

    function write(node, left, top, visible) {
      const last = written.get(node);
      if (last && last.left === left && last.top === top && last.visible === visible) return;
      written.set(node, { left, top, visible });
      node.style.setProperty("--bird-left", `${left}px`);
      node.style.setProperty("--bird-top", `${top}px`);
      node.style.visibility = visible ? "visible" : "hidden";
    }

    function measure() {
      frame = 0;

      targetsRef.current.forEach((target, id) => {
        const node = birdNodesRef.current.get(id);
        if (!node || node.classList.contains("is-flying")) return;

        if (!target.isConnected) {
          write(node, 0, 0, false);
          return;
        }

        const rect = target.getBoundingClientRect();
        const side = node.dataset.side;
        const align = node.dataset.align;
        const overlay = node.classList.contains("is-overlay-perch");
        const scrollRoot = overlay ? null : document.querySelector(".app-shell");
        const rootRect = scrollRoot?.getBoundingClientRect();
        const rootLeft = rootRect ? rootRect.left - scrollRoot.scrollLeft : 0;
        const rootTop = rootRect ? rootRect.top - scrollRoot.scrollTop : 0;
        const leftEdge = rect.left - rootLeft;
        const rightEdge = rect.right - rootLeft;
        const topEdge = rect.top - rootTop;
        const left = align === "center"
          ? leftEdge + rect.width / 2 - 17
          : side === "left" ? leftEdge + 4 : rightEdge - 38;
        write(node, Math.round(left), Math.round(topEdge - 24), Boolean(rect.width && rect.height));
      });

      if (performance.now() < trackingUntil) frame = requestAnimationFrame(measure);
    }

    function requestMeasure() {
      if (!frame) frame = requestAnimationFrame(measure);
    }

    function trackLayout(duration = 900) {
      trackingUntil = Math.max(trackingUntil, performance.now() + duration);
      requestMeasure();
    }

    function scanPerches() {
      if (!document.querySelector(".entry-splash")) dismissedRef.current.delete(SPLASH_PERCH.id);
      if (!document.querySelector(".attract-mode")) dismissedRef.current.delete(ATTRACT_PERCH.id);

      const found = getActivePerches()
        .filter((perch) => !dismissedRef.current.has(perch.id))
        .map((perch) => ({ ...perch, target: document.querySelector(perch.selector) }))
        .filter((perch) => perch.target);

      // Los cambios de layout que mueven las perchas sin cambiarles el tamano
      // (algo que crece encima) cambian el alto del contenido: tambien se observa.
      const content = document.querySelector(".cabinet-layout");
      const key = found.map((perch) => perch.id).join() + (content ? "+layout" : "");
      const targetsChanged = key !== perchKey || found.some((perch) => targetsRef.current.get(perch.id) !== perch.target);
      // El MutationObserver salta con cualquier cambio del DOM; si las perchas son
      // las mismas no hay nada que volver a montar ni que seguir.
      if (!targetsChanged) return;
      perchKey = key;
      resizeObserver.disconnect();
      targetsRef.current = new Map(found.map((perch) => [perch.id, perch.target]));
      found.forEach((perch) => resizeObserver.observe(perch.target));
      if (content) resizeObserver.observe(content);

      setBirds((current) => {
        const next = found.map((perch) => ({
          id: perch.id,
          side: perch.side,
          align: perch.align || "edge",
          overlay: Boolean(perch.overlay),
          phase: current.find((bird) => bird.id === perch.id)?.phase ?? (perch.arrive ? "arriving" : "perched")
        }));
        const nextIds = new Set(next.map((bird) => bird.id));
        const departing = current.filter((bird) => bird.phase === "flying" && !nextIds.has(bird.id));
        return [...next, ...departing];
      });
      trackLayout(1100);
    }

    const mutationObserver = new MutationObserver(scanPerches);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Solo siguen las animaciones de una percha o de algo que la contiene: son
    // las que pueden moverla. Antes cualquier animacion de la pagina (hay mas de
    // cien en bucle) reenganchaba el seguimiento frame a frame.
    const handleMotionStart = (event) => {
      const source = event.target;
      if (!(source instanceof Element)) return;
      for (const target of targetsRef.current.values()) {
        if (source.contains(target)) { trackLayout(1200); return; }
      }
    };
    const handleSplashEnter = () => flyAway(SPLASH_PERCH.id);
    // Al entrar la moneda del modo attract, el pajaro sale volando antes de la zambullida.
    const handleAttractLaunch = () => flyAway(ATTRACT_PERCH.id);
    scanPerches();
    window.addEventListener("resize", requestMeasure);
    window.addEventListener("daivr-splash-enter", handleSplashEnter);
    window.addEventListener("daivr-attract-launch", handleAttractLaunch);
    document.addEventListener("transitionrun", handleMotionStart, true);
    document.addEventListener("animationstart", handleMotionStart, true);

    const timers = timersRef.current;
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      visibility.disconnect();
      visibilityRef.current = null;
      window.removeEventListener("resize", requestMeasure);
      window.removeEventListener("daivr-splash-enter", handleSplashEnter);
      window.removeEventListener("daivr-attract-launch", handleAttractLaunch);
      document.removeEventListener("transitionrun", handleMotionStart, true);
      document.removeEventListener("animationstart", handleMotionStart, true);
      if (frame) cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  function flyAway(id) {
    dismissedRef.current.add(id);
    setBirds((current) => current.map((bird) => bird.id === id ? { ...bird, phase: "flying" } : bird));
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      targetsRef.current.delete(id);
      birdNodesRef.current.delete(id);
      setBirds((current) => current.filter((bird) => bird.id !== id));
    }, BIRD_FLY_AWAY_MS);
    timersRef.current.add(timer);
  }

  const pageRoot = document.querySelector(".app-shell") || document.body;

  return birds.map((bird) => createPortal(
    <span
      className={`page-perched-bird is-${bird.side} is-${bird.phase}${bird.overlay ? " is-overlay-perch" : ""}`}
      data-side={bird.side}
      data-align={bird.align}
      ref={(node) => {
        if (node) {
          birdNodesRef.current.set(bird.id, node);
          visibilityRef.current?.observe(node);
        } else birdNodesRef.current.delete(bird.id);
      }}
      style={{
        "--bird-left": "-100px",
        "--bird-top": "-100px",
        "--bird-fly-duration": `${BIRD_FLY_AWAY_MS}ms`,
        "--bird-fly-mid": bird.side === "left" ? "-105px" : "105px",
        "--bird-fly-far": bird.side === "left" ? "-245px" : "245px",
        "--bird-fly-near-end": bird.side === "left" ? "-360px" : "360px",
        "--bird-fly-end": bird.side === "left" ? "-440px" : "440px"
      }}
      onPointerEnter={() => bird.phase === "perched" && flyAway(bird.id)}
      onAnimationEnd={(event) => {
        if (bird.phase !== "arriving" || event.animationName !== "page-bird-fly-in") return;
        setBirds((current) => current.map((item) => item.id === bird.id ? { ...item, phase: "perched" } : item));
      }}
      aria-hidden="true"
      key={bird.id}
    >
      <PixelBird />
    </span>,
    bird.overlay ? document.body : pageRoot,
    bird.id
  ));
}
