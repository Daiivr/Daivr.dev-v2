import { useEffect, useRef } from "react";

const MAX_PARTICLES = 90;
const EMIT_INTERVAL_MS = 22;
const LIFE_MS = 460;

const THEME_COLORS = {
  crt: ["#3fff97", "#45d8ff", "#b4ffcf"],
  glitch: ["#ff3d9d", "#b986ff", "#45d8ff"]
};

/*
  Estela del cursor: pixeles de fosforo que decaen detras del puntero.
  Canvas fijo a viewport (pointer-events: none), emision regulada por tiempo
  y bucle rAF que solo corre mientras queden particulas vivas. Apagado en
  tactil (hover: none) y con motion reducido.
*/
export function CursorTrail({ theme = "crt" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (window.matchMedia?.("(hover: none)").matches) return undefined;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const colors = THEME_COLORS[theme] || THEME_COLORS.crt;
    const particles = [];
    let rafId = 0;
    let lastEmit = 0;
    let ratio = 1;

    function resize() {
      ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
    }

    function render(now) {
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
        context.globalAlpha = fade * 0.8;
        context.fillStyle = particle.color;
        context.fillRect(
          Math.round((particle.x + particle.driftX * life) * ratio),
          Math.round((particle.y + particle.driftY * life) * ratio),
          Math.round(size),
          Math.round(size)
        );
      }

      context.globalAlpha = 1;
      rafId = particles.length ? window.requestAnimationFrame(render) : 0;
    }

    function emit(event) {
      const now = performance.now();
      if (now - lastEmit < EMIT_INTERVAL_MS) return;
      lastEmit = now;

      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: event.clientX + (Math.random() * 8 - 4),
        y: event.clientY + (Math.random() * 8 - 4),
        born: now,
        size: Math.random() > 0.6 ? 3 : 2,
        driftX: Math.random() * 10 - 5,
        driftY: 6 + Math.random() * 14,
        color: colors[Math.floor(Math.random() * colors.length)]
      });

      if (!rafId) rafId = window.requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", emit, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", emit);
      window.cancelAnimationFrame(rafId);
    };
  }, [theme]);

  return <canvas className="cursor-trail" ref={canvasRef} aria-hidden="true" />;
}
