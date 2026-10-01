import { useEffect, useId } from "react";
import { FISHING_POOL_HEIGHT, FISHING_POOL_WIDTH } from "../../shared/buddy-fishing-spot.mjs";

export const PORTAL_OPEN_MS = 850;
export const PORTAL_CLOSE_MS = 1000;

function PoolFish({ color, className }) {
  return <g className={`footer-pool-fish ${className}`}><g className="footer-pool-fish-facing">
    <path className="pool-fish-tail" d="M-9 0l-7-5v10z" fill={color} />
    <path d="M-9-3h5v-2h10v2h5v6H6v2H-4V3h-5z" fill={color} />
    <path d="M-3-5v-4l7 4M-1 5l4 4 3-4" fill={color} opacity=".6" />
    <path d="M-5-2H6v2H-5z" fill="#d4f9dc" opacity=".5" />
    <path d="M6-2h2v2H6z" fill="#061d28" /><path d="M-4 2h8v1h-8z" fill="#0c3948" opacity=".6" />
  </g></g>;
}

export function BuddyFishingPortal({ portal, onClosed }) {
  const id = useId().replace(/:/g, "");
  const paint = name => `url(#${id}-${name})`;
  useEffect(() => {
    if (portal?.phase !== "closing") return;
    const timer = window.setTimeout(() => onClosed(portal.id), PORTAL_CLOSE_MS + 80);
    return () => window.clearTimeout(timer);
  }, [portal?.id, portal?.phase, onClosed]);
  if (!portal) return null;
  return <div className={`buddy-footer-portal is-${portal.phase}`} style={{ "--portal-x": `${portal.x}px`, "--pool-width": `${FISHING_POOL_WIDTH}px`, "--pool-height": `${FISHING_POOL_HEIGHT}px`, "--portal-open-ms": `${PORTAL_OPEN_MS}ms`, "--portal-close-ms": `${PORTAL_CLOSE_MS}ms` }} aria-hidden="true">
    <svg viewBox="0 0 128 56" shapeRendering="crispEdges">
      <defs>
        <linearGradient id={`${id}-depth`} x2="0" y2="1"><stop stopColor="#2b6371"/><stop offset=".3" stopColor="#184757"/><stop offset="1" stopColor="#071e2b"/></linearGradient>
        <clipPath id={`${id}-water`}><path d="M12 8h17V5h69v5h17v9h5v21h-13v8H29v-4H10V20h4z"/></clipPath>
      </defs>
      <g className="buddy-portal-aperture">
        <path d="M2 0h122v52H2z" fill="#091711"/>
        <path d="M5 4h21V1h74v5h18v10h7v28h-14v9H26v-5H4V18h5z" fill="#030a08" stroke="#203329" strokeWidth="2"/>
        <path d="M12 8h17V5h69v5h17v9h5v21h-13v8H29v-4H10V20h4z" fill={paint("depth")} stroke="#010807" strokeWidth="4"/>
        <g clipPath={paint("water")}>
          <path className="footer-pool-caustics" d="M25 3h7l15 47H34zM72 3h4l13 47h-8zM101 5h7L92 50h-8z" fill="#adf0d8" opacity=".1"/>
          <path d="M10 42h23v4h33v-4h25v3h30v8H10z" fill="#315048"/>
          <path d="M19 44h8v2h-8m23 2h5v2h-5m24-5h7v2h-7m29 1h8v3h-8" fill="#879b73"/>
          <path className="pool-reeds" d="M107 45V27h3v18m-9-1V32h3v12m9-7h5v-3h-5m-7-6h-5v-3h5" fill="#477f68"/>
          <PoolFish color="#81b8c3" className="fish-one"/>
          <PoolFish color="#bbaf73" className="fish-two"/>
          <PoolFish color="#559389" className="fish-three"/>
          <path className="footer-pool-ripples" d="M15 11h29m9-2h22m12 6h25M23 25h18m35 7h21m-39 8h12" fill="none" stroke="#a4ddd5" strokeWidth="1" opacity=".6"/>
          <g className="pool-bubbles" fill="none" stroke="#a1d7cf" strokeWidth="1"><path d="M94 31h2v2h-2zM98 21h2v2h-2zM92 12h1v1h-1z"/></g>
          <path d="M14 8h15V5h69v5h16" fill="none" stroke="#b3e5d0" strokeWidth="2" opacity=".65"/>
        </g>
        <path d="M6 5h20V2h73v5h18v9h7M5 21v27h21v5h84v-9h14" fill="none" stroke="#354b3e" strokeWidth="2"/>
        <path d="M8 7h18v4H14v9M30 3h17v2H30m63 44h13v-7h14" fill="none" stroke="#28392b" strokeWidth="3"/>
        <path d="M1 11h8l-3 5h7M106 1v5h8M20 49v5h-9M118 47h7v6" fill="none" stroke="#4e654e"/>
        <g className="footer-pool-rubble" fill="#4f6151"><path d="M4 2h4v2H4zM115 49h5v3h-5zM17 48h5v3h-5z"/></g>
        <text x="66" y="53" textAnchor="middle" fill="#708f80" fontSize="4" fontFamily="monospace" letterSpacing="1">DEEP WATER</text>
      </g>
    </svg>
  </div>;
}
