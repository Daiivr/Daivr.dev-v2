import { useEffect, useMemo, useRef } from "react";
import { getSeasonalEvent } from "../lib/seasons";
import { outfitFor, wornSlots } from "../lib/pixelWorld/pip/outfit";
import { drawJet } from "../lib/pixelWorld/pip/jets";
import { RIG_H, RIG_OY, RIG_W, rigImg } from "../lib/pixelWorld/pip/rig";

// Pip fuera del footer (barra lateral, inventario, cuarto, puerta de entrada y
// paracaidas de bienvenida): un lienzo pequeño con el mismo rig que dibuja el
// mundo del footer, el mismo equipo y la misma regla de amistad. Parpadea y
// respira solo mientras se ve. `facing` -1 mira a la derecha (como en
// ScreenBuddy); `pose` es una pose del rig (idle, sit, hang, wave...).
// Volando con las botas cohete ("hover") va mas vivo: patalea, sube y baja,
// mira hacia abajo de vez en cuando y las llamas parpadean bajo cada bota (el
// lienzo crece por abajo para que quepan, sin mover el sitio del sprite).
const POSE_FOR_EXPRESSION = { sleep: "sit" };
const JET_ROWS = 9;
const HOVER_BOB = [0, 0, -1, -1, 0, 0, 1, 1];

export function PipSprite({
  className = "", expression = "idle", pose, facing = -1, friendshipLevel = 1,
  inventory = [], hiddenGear = [], unlockedGear = [], width = 72, height = 80, animate = true
}) {
  const canvasRef = useRef(null);
  const outfitKey = JSON.stringify([friendshipLevel, inventory, hiddenGear, unlockedGear]);
  const outfit = useMemo(
    () => wornSlots(outfitFor({ friendshipLevel, inventory, hiddenGear, unlockedGear, season: getSeasonalEvent() || "" })),
    [outfitKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const rigPose = pose || POSE_FOR_EXPRESSION[expression] || "idle";
  const hover = rigPose === "hover";
  const jets = hover && outfit.feet === "rocket-boots";
  const rows = RIG_H + (jets ? JET_ROWS : 0);
  const cssHeight = height * rows / RIG_H;

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!g) return undefined;
    g.imageSmoothingEnabled = false;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let tick = 0, timer = 0, blinkAt = 8 + Math.floor(Math.random() * 16);
    const draw = () => {
      const blink = expression !== "sleep" && tick >= blinkAt && tick < blinkAt + 1;
      if (tick >= blinkAt + 1) blinkAt = tick + 18 + Math.floor(Math.random() * 24);
      // (al saludar, la mano va mas deprisa; volando, patalea)
      const frame = hover ? Math.floor(tick / 2) % 2 : Math.floor(tick / (rigPose === "wave" ? 2 : 6)) % 2;
      const lookY = hover && Math.floor(tick / 14) % 2 ? 1 : 0;
      const rig = rigImg({ pose: rigPose, frame, expr: blink ? "blink" : expression, lookX: 0, lookY, ghost: false, glow: false, outfit, handUp: false, spark: outfit.antenna === "gold-antenna" ? tick % 6 : undefined });
      const bob = hover ? HOVER_BOB[tick % HOVER_BOB.length] : 0;
      g.clearRect(0, 0, RIG_W, rows);
      g.save();
      if (facing > 0) { g.translate(RIG_W, 0); g.scale(-1, 1); }
      g.drawImage(rig.c, 0, bob + (jets ? 1 : 0));
      if (jets) for (const ft of [rig.a.feet, rig.a.feetB]) drawJet(g, [ft[0], ft[1] + RIG_OY + bob + 1], tick % 2, false);
      g.restore();
    };
    draw();
    if (!animate || reduceMotion) return undefined;
    const start = () => { if (!timer) timer = window.setInterval(() => { tick += 1; draw(); }, hover ? 90 : 130); };
    const stop = () => { window.clearInterval(timer); timer = 0; };
    const seen = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    seen.observe(canvas);
    return () => { stop(); seen.disconnect(); };
  }, [outfit, expression, rigPose, facing, animate, hover, jets, rows]);

  return (
    <canvas
      ref={canvasRef}
      className={`pip-sprite ${className}`.trim()}
      width={RIG_W}
      height={rows}
      style={{ width, height: cssHeight, marginBottom: height - cssHeight }}
      aria-hidden="true"
    />
  );
}
