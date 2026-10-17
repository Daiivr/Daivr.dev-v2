import { useMemo } from "react";
import { rodIconSprite } from "../lib/pixelWorld/events/fishing";
/*
  Caña de exhibicion para el preview del inventario: la caña y la boya que
  Buddy lleva puestas, en el mismo pixel art que su caña en el footer
  (pixelWorld/events/fishing.js). El propio Buddy (Pip) y su paracaidas son
  pixel art en lienzo: PipSprite y PipChute fuera del footer, y
  src/lib/pixelWorld dentro del mundo del footer.
*/
export function BuddyRodIcon({ className = "", rodId = "", lureId = "" }) {
  const src = useMemo(() => rodIconSprite(rodId, lureId).toDataURL(), [rodId, lureId]);
  return (
    <img
      className={`buddy-rod-icon ${rodId} ${lureId} ${className}`.replace(/\s+/g, " ").trim()}
      src={src}
      width="68"
      height="96"
      alt=""
      aria-hidden="true"
    />
  );
}
