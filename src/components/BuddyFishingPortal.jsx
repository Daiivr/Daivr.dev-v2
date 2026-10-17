import { useEffect } from "react";

export const PORTAL_OPEN_MS = 850;
export const PORTAL_CLOSE_MS = 1000;

// El agujero de pesca del sendero lo dibuja el mundo del footer (FooterWorld,
// src/lib/pixelWorld/events/fishing.js) a partir del estado del portal que
// ScreenBuddy publica. Aqui solo queda el reloj: cuando termina de cerrarse,
// se avisa para quitarlo.
export function BuddyFishingPortal({ portal, onClosed }) {
  useEffect(() => {
    if (portal?.phase !== "closing") return undefined;
    const timer = window.setTimeout(() => onClosed(portal.id), PORTAL_CLOSE_MS + 80);
    return () => window.clearTimeout(timer);
  }, [portal?.id, portal?.phase, onClosed]);
  return null;
}
