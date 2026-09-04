import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MAX_PARTICLES = 180;
const LIFE_MS = 420;

// La estela se siembra por distancia recorrida, no por tiempo: un barrido
// rapido dejaba antes seis motas sueltas en lugar de un rastro de fosforo.
const STEP_PX = 7;
const MAX_STEPS = 14;
const TELEPORT_PX = 260;
const FAST_PX = 46;

// Paleta viva por tema; el modo del cursor decide que acento lidera.
const THEME_INK = {
  crt: { accent: "#ffd166", danger: "#ff5f68", main: "#3fff97", secondary: "#45d8ff", soft: "#b4ffcf" },
  glitch: { accent: "#3fff97", danger: "#ff5f68", main: "#ff3d9d", secondary: "#b986ff", soft: "#ffb3d9" }
};

const MODE_INK = {
  blocked: ["danger", "accent", "soft"],
  busy: ["accent", "soft", "main"],
  default: ["main", "secondary", "soft"],
  grab: ["accent", "main", "soft"],
  grabbing: ["accent", "main", "soft"],
  interactive: ["secondary", "main", "soft"],
  text: ["secondary", "soft", "main"]
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

    const ink = THEME_INK[theme] || THEME_INK.crt;
    const particles = [];
    // Al cambiar de tema este efecto se remonta; el cursor no vuelve a
    // anunciar su modo, asi que el ultimo queda espejado en el documento.
    const bootMode = document.documentElement.dataset.cursorMode || "default";
    let palette = (MODE_INK[bootMode] || MODE_INK.default).map((key) => ink[key]);
    let animationFrame = 0;
    let ratio = 1;
    let lastX = null;
    let lastY = null;
    let carry = 0;
    let suspended = bootMode === "off";

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
        context.globalAlpha = fade * particle.glow;
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

    function spawn(x, y, now, speed) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: x + (Math.random() * 4 - 2),
        y: y + (Math.random() * 4 - 2),
        born: now,
        color: palette[Math.floor(Math.random() * palette.length)],
        driftX: (Math.random() * 6 - 3) * (0.4 + speed),
        driftY: (4 + Math.random() * 10) * (0.5 + speed),
        glow: 0.46 + speed * 0.3,
        size: Math.random() > 0.72 ? 3 : 2
      });
    }

    // Siembra el tramo entre la ultima muestra y esta, con el sobrante
    // acumulado para que los micro-movimientos tambien cuenten.
    function trace(x, y, now) {
      if (lastX === null) {
        lastX = x;
        lastY = y;
        return;
      }

      const deltaX = x - lastX;
      const deltaY = y - lastY;
      const distance = Math.hypot(deltaX, deltaY);
      lastX = x;
      lastY = y;

      // Saltos (volver a la ventana, cambio de escritorio) no dejan rastro.
      if (distance > TELEPORT_PX) {
        carry = 0;
        return;
      }

      carry += distance;
      if (carry < STEP_PX) return;

      const steps = Math.min(MAX_STEPS, Math.floor(carry / STEP_PX));
      carry -= steps * STEP_PX;

      const speed = Math.min(1, distance / FAST_PX);
      for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        spawn(x - deltaX * (1 - progress), y - deltaY * (1 - progress), now, speed);
      }
    }

    function emit(event) {
      if (event.pointerType === "touch" || suspended) return;

      const now = performance.now();
      // Windows entrega varias muestras por frame: usarlas todas mantiene la
      // curva del gesto en vez de recortarla en lineas rectas.
      const samples = event.getCoalescedEvents?.() || [];
      if (samples.length) {
        for (const sample of samples) trace(sample.clientX, sample.clientY, now);
      } else {
        trace(event.clientX, event.clientY, now);
      }

      if (particles.length && !animationFrame) animationFrame = window.requestAnimationFrame(paint);
    }

    // El cursor anuncia su modo; la estela hereda el color del contexto y se
    // apaga sobre superficies nativas (iframes, menu del sistema).
    function syncMode(event) {
      const mode = event.detail?.mode || "default";
      suspended = mode === "off";
      if (suspended) {
        lastX = null;
        lastY = null;
        carry = 0;
        return;
      }
      palette = (MODE_INK[mode] || MODE_INK.default).map((key) => ink[key]);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", emit, { passive: true, capture: true });
    window.addEventListener("daivr-cursor-mode", syncMode);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", emit, { capture: true });
      window.removeEventListener("daivr-cursor-mode", syncMode);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [theme]);

  return createPortal(<canvas className="cursor-trail" ref={canvasRef} aria-hidden="true" />, document.body);
}
