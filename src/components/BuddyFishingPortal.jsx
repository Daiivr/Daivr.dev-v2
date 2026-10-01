import { useEffect, useId } from "react";

export const PORTAL_OPEN_MS = 850;
export const PORTAL_CLOSE_MS = 1000;

export function BuddyFishingPortal({ portal, onClosed }) {
  const id = useId().replace(/:/g, "");
  const paint = (name) => `url(#${id}-${name})`;
  useEffect(() => {
    if (portal?.phase !== "closing") return;
    const timer = window.setTimeout(() => onClosed(portal.id), PORTAL_CLOSE_MS + 80);
    return () => window.clearTimeout(timer);
  }, [portal?.id, portal?.phase, onClosed]);

  if (!portal) return null;
  return <div className={`buddy-footer-portal is-${portal.phase}`} style={{ "--portal-x": `${portal.x}px`, "--portal-open-ms": `${PORTAL_OPEN_MS}ms`, "--portal-close-ms": `${PORTAL_CLOSE_MS}ms` }} aria-hidden="true">
    <svg viewBox="0 0 84 44" width="84" height="44" shapeRendering="crispEdges">
      <defs>
        <linearGradient id={`${id}-depth`} x2="0" y2="1"><stop stopColor="#255966" /><stop offset=".4" stopColor="#113a4a" /><stop offset="1" stopColor="#061923" /></linearGradient>
        <clipPath id={`${id}-water`}><path d="M13 10h16V6h20v5h19v6h7v13H62v5H30v-4H11V19h5z" /></clipPath>
      </defs>
      <g className="buddy-portal-aperture">
        <path d="M6 7h18V2h30v5h18v7h8v19H65v6H27v-5H5V20h5z" fill="#071410" stroke="#566350" strokeWidth="2" />
        <path d="M13 10h16V6h20v5h19v6h7v13H62v5H30v-4H11V19h5z" fill={paint("depth")} />
        <g clipPath={paint("water")}>
          <path d="M22 7h4l14 29h-7zM48 8h3l11 25h-4z" fill="#b1ead8" opacity=".1" />
          <g className="footer-pool-fish"><path d="M22 24h8v4h-8l-4 3V21z" fill="#5e9da3" /><path d="M28 25h1v1h-1z" fill="#c9f6dc" /></g>
          <g className="footer-pool-fish fish-two"><path d="M52 17h8v4h-8l-4 3V14z" fill="#69916e" /><path d="M58 18h1v1h-1z" fill="#e8dca8" /></g>
          <path className="footer-pool-ripples" d="M14 13h17m8 3h19m-40 4h10m25 9h17m-36 4h15" stroke="#8bcdc6" strokeWidth="1" opacity=".65" />
        </g>
        <path d="M6 7h18V2h30v5h18v7h8M5 20v14h22v5h38v-6h15" fill="none" stroke="#85937a" strokeWidth="2" />
        <path d="M7 9h16v5H12v5m18-15h16v3H30m40 8v4h6v10m-45 8h29v-3" fill="none" stroke="#3b4b3e" strokeWidth="3" />
        <path d="M0 13h8l-4 6h6M73 6h5V2h6M62 38v5h8" fill="none" stroke="#7d8563" strokeWidth="1" />
        <g className="footer-pool-rubble"><path d="M3 3h6v3H3zM73 36h5v4h-5zM19 37h5v3h-5z" fill="#68715b" /><path d="M3 3h6v1H3zM74 36h4v1h-4z" fill="#b1b592" /></g>
      </g>
    </svg>
  </div>;
}
