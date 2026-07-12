import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PixelBird } from "./PixelBird";

const BIRD_FLY_AWAY_MS = 2400;

const PAGE_PERCHES = [
  { id: "now", selector: ".now-card", side: "left" },
  { id: "project", selector: ".project-card", side: "right" },
  { id: "patch", selector: ".patch-console", side: "right" }
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
    ".project-modal-overlay[data-state=\"open\"]",
    ".comments-gif-modal",
    ".comments-delete-modal"
  ].join(","))) return [];
  return PAGE_PERCHES;
}

export function PerchedBirds() {
  const [birds, setBirds] = useState([]);
  const targetsRef = useRef(new Map());
  const birdNodesRef = useRef(new Map());
  const dismissedRef = useRef(new Set());
  const timersRef = useRef(new Set());

  useEffect(() => {
    let frame = 0;
    let trackingUntil = 0;
    const resizeObserver = new ResizeObserver(requestMeasure);

    function measure() {
      frame = 0;

      targetsRef.current.forEach((target, id) => {
        const node = birdNodesRef.current.get(id);
        if (!node || node.classList.contains("is-flying")) return;

        if (!target.isConnected) {
          node.style.visibility = "hidden";
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
        node.style.setProperty("--bird-left", `${Math.round(left)}px`);
        node.style.setProperty("--bird-top", `${Math.round(topEdge - 24)}px`);
        node.style.visibility = rect.width && rect.height ? "visible" : "hidden";
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

      resizeObserver.disconnect();
      targetsRef.current = new Map(found.map((perch) => [perch.id, perch.target]));
      found.forEach((perch) => resizeObserver.observe(perch.target));

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

    const handleMotionStart = () => trackLayout(1200);
    scanPerches();
    window.addEventListener("resize", requestMeasure);
    document.addEventListener("transitionrun", handleMotionStart, true);
    document.addEventListener("animationstart", handleMotionStart, true);

    const timers = timersRef.current;
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", requestMeasure);
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
        if (node) birdNodesRef.current.set(bird.id, node);
        else birdNodesRef.current.delete(bird.id);
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
