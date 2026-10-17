import { useEffect, useRef } from "react";
import { line } from "../lib/pixelWorld/core";
import { chuteCanvas } from "../lib/pixelWorld/events/chute";

// El paracaidas de Pip fuera del footer (caida de bienvenida, inventario): la
// misma tela que dibuja el mundo del footer, con las cuerdas bajando `lines`
// filas hasta las manos de un PipSprite colgado debajo (mirando a la derecha).
const W = 31;

export function PipChute({ className = "", upgraded = false, scale = 2, lines = 26 }) {
  const canvasRef = useRef(null);
  const h = 12 + lines;
  useEffect(() => {
    const g = canvasRef.current?.getContext("2d");
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, h);
    for (const [x0, x1] of [[2, 13], [9, 13], [21, 17], [28, 17]]) line(g, x0, 10, x1, h - 1, "#e8eef2");
    g.drawImage(chuteCanvas(upgraded), 0, 0);
  }, [upgraded, h]);
  return <canvas ref={canvasRef} className={`pip-chute ${className}`.trim()} width={W} height={h} style={{ width: W * scale, height: h * scale }} aria-hidden="true" />;
}
