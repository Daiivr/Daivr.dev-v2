import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MAX_PARTICLES = 64;
const EMIT_INTERVAL_MS = 24;
const LIFE_MS = 420;

const THEME_COLORS = {
  crt: ["#3fff97", "#45d8ff", "#b4ffcf"],
  glitch: ["#ff3d9d", "#b986ff", "#45d8ff"]
};

export function CursorTrail({ theme = "crt" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    if (reducedMotion?.matches || !finePointer?.matches) return undefined;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const colors = THEME_COLORS[theme] || THEME_COLORS.crt;
    const particles = [];
    let animationFrame = 0;
    let lastEmit = 0;
    let ratio = 1;

    function resize() {
      ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
    }

    function paint(now) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        const life = (now - particle.born) / LIFE_MS;

        if (life >= 1) {
          particles.splice(index, 1);
          continue;
        }

        const fade = 1 - life;
        const size = Math.max(1, particle.size * fade) * ratio;
        context.globalAlpha = fade * 0.72;
        context.fillStyle = particle.color;
        context.fillRect(
          Math.round((particle.x + particle.driftX * life) * ratio),
          Math.round((particle.y + particle.driftY * life) * ratio),
          Math.round(size),
          Math.round(size)
        );
      }

      context.globalAlpha = 1;
      animationFrame = particles.length ? window.requestAnimationFrame(paint) : 0;
    }

    function emit(event) {
      if (event.pointerType === "touch") return;
      const now = performance.now();
      if (now - lastEmit < EMIT_INTERVAL_MS) return;
      lastEmit = now;

      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: event.clientX + (Math.random() * 6 - 3),
        y: event.clientY + (Math.random() * 6 - 3),
        born: now,
        size: Math.random() > 0.68 ? 3 : 2,
        driftX: Math.random() * 8 - 4,
        driftY: 5 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)]
      });

      if (!animationFrame) animationFrame = window.requestAnimationFrame(paint);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", emit, { passive: true, capture: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", emit, { capture: true });
      window.cancelAnimationFrame(animationFrame);
    };
  }, [theme]);

  return createPortal(<canvas className="cursor-trail" ref={canvasRef} aria-hidden="true" />, document.body);
}
