import { useEffect, useState } from "react";

const SAMPLE_MS = 750;

// Ultima lectura publicada. La consola la consulta al vuelo para imprimir
// telemetria, y asi no tiene que suscribirse a un valor que cambia solo.
let latestFps = 60;

export function getLatestFps() {
  return latestFps;
}

export function useFps() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let rafId = 0;
    let frames = 0;
    let windowStart = performance.now();

    function loop(now) {
      frames += 1;
      const elapsed = now - windowStart;

      if (elapsed >= SAMPLE_MS) {
        // Tab was hidden (rAF paused): the window is stale, restart the sample.
        if (elapsed > SAMPLE_MS * 4) {
          frames = 0;
          windowStart = now;
        } else {
          const next = Math.round((frames * 1000) / elapsed);
          latestFps = next;
          setFps((value) => (value === next ? value : next));
          frames = 0;
          windowStart = now;
        }
      }

      rafId = window.requestAnimationFrame(loop);
    }

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
