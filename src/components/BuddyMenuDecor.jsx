import { useEffect, useRef } from "react";
import { PIXEL_ICONS, createSkyStrip, drawTurf, vineSprite } from "../lib/pixelWorld/menuSkin";

// Icono de pixel del modal (pestañas, misiones, cartel vacio...), nitido con
// image-rendering: pixelated; el CSS lo escala por multiplos.
export function PixelIcon({ name, className = "" }) {
  const ref = useRef(null);
  const img = PIXEL_ICONS()[name];
  useEffect(() => {
    const canvas = ref.current, g = canvas?.getContext("2d");
    if (!g || !img) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(img, 0, 0);
  }, [img]);
  if (!img) return null;
  return <canvas ref={ref} className={`pixel-icon ${className}`.trim()} width={img.width} height={img.height} style={{ "--icon-w": img.width, "--icon-h": img.height }} aria-hidden="true" />;
}

// Bucle de dibujo de los adornos: a 20 fps mientras el modal esta abierto, un
// solo fotograma con movimiento reducido.
function useDecorLoop(draw) {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let frame = 0, last = -Infinity;
    draw(0);
    if (reduce) return undefined;
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 50) return;
      last = now;
      draw(Math.max(0, (now - t0) / 1000));
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [draw]);
}

// La franja del valle detras del titulo: cielo, nubes, colinas, arboles y mariposas.
export function MenuSky() {
  const ref = useRef(null);
  const drawRef = useRef(null);
  drawRef.current ??= (() => { const strip = createSkyStrip(); return (t) => { if (ref.current) strip(ref.current, t); }; })();
  useDecorLoop(drawRef.current);
  return <canvas ref={ref} className="buddy-menu-sky" aria-hidden="true" />;
}

// Las enredaderas de las esquinas de arriba y la hierba del borde de abajo.
export function MenuFrameDecor() {
  const turf = useRef(null), vineL = useRef(null), vineR = useRef(null);
  const drawRef = useRef(null);
  drawRef.current ??= (t) => { if (turf.current) drawTurf(turf.current, t); };
  useEffect(() => {
    for (const ref of [vineL, vineR]) {
      const canvas = ref.current, img = vineSprite();
      if (!canvas) continue;
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
    }
  }, []);
  useDecorLoop(drawRef.current);
  return <>
    <canvas ref={vineL} className="buddy-menu-vine is-left" aria-hidden="true" />
    <canvas ref={vineR} className="buddy-menu-vine is-right" aria-hidden="true" />
    <canvas ref={turf} className="buddy-menu-turf" aria-hidden="true" />
  </>;
}
