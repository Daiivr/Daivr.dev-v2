import { useEffect, useId } from "react";
import { FISHING_POOL_HEIGHT, FISHING_POOL_WIDTH } from "../../shared/buddy-fishing-spot.mjs";

export const PORTAL_OPEN_MS = 850;
export const PORTAL_CLOSE_MS = 1000;

function PoolFish({ color, className }) {
  return <g className={`footer-pool-fish ${className}`}><g className="footer-pool-fish-facing">
    <path className="pool-fish-tail" d="M-6 0l-5-3 1 3-1 3z" fill={color} />
    <path d="M-6-1l5-2h5l4 3-4 3h-5l-5-2z" fill={color} />
    <path d="M-2-2l3-3 2 3M-2 2l3 3 2-3" fill={color} opacity=".5" />
    <path d="M-4 0H5" stroke="#d4f9dc" strokeWidth=".7" opacity=".4" />
    <path d="M4-2h1v1H4m0 2h1v1H4" fill="#071c24" />
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
    <svg viewBox="0 0 128 32" preserveAspectRatio="none" shapeRendering="crispEdges">
      <defs>
        <radialGradient id={`${id}-depth`} cx="52%" cy="45%" r="60%"><stop stopColor="#173e43"/><stop offset=".65" stopColor="#0b282d"/><stop offset="1" stopColor="#020c10"/></radialGradient>
        <clipPath id={`${id}-water`}><path d="M16 12h10V9h19V7h37v2h20v3h10v4h6v6h-12v3H85v2H42v-2H23v-3H12v-6h4z"/></clipPath>
      </defs>
      <g className="buddy-portal-aperture">
        {/* A foreshortened hole in the ground, with an irregular earthen lip. */}
        <path d="M7 12h13V7h21V4h45v3h21v4h12v5h7v9h-14v4H89v2H38v-2H17v-4H3v-8h4z" fill="#06110e"/>
        <path d="M10 12h13V8h19V5h43v3h20v4h12v4h6v7h-13v4H88v3H39v-3H20v-4H7v-7h3z" fill="#182b24"/>
        <path d="M16 12h10V9h19V7h37v2h20v3h10v4h6v6h-12v3H85v2H42v-2H23v-3H12v-6h4z" fill={paint("depth")}/>
        <g clipPath={paint("water")}>
          <path d="M16 16h10v-4h19V9h37v2h20v3h10v3" fill="none" stroke="#010808" strokeWidth="3"/>
          <path className="footer-pool-caustics" d="M29 13l12 4 13-3 12 4 17-5m-57 9 15-3 18 5 22-5 18 3" fill="none" stroke="#88c7b7" opacity=".12"/>
          <PoolFish color="#7aab9d" className="fish-one"/>
          <PoolFish color="#9e9869" className="fish-two"/>
          <PoolFish color="#4f8581" className="fish-three"/>
          <g className="footer-pool-ripples" fill="none" stroke="#85b6aa" strokeWidth=".7" opacity=".4">
            <path d="M34 13h13m36 0h12M22 19h11m53 3h15M45 25h16"/>
            <ellipse cx="64" cy="18" rx="13" ry="3"/><ellipse cx="64" cy="18" rx="23" ry="5" opacity=".4"/>
          </g>
        </g>
        <path d="M22 25h20v3h43v-2h21v-3h12" fill="none" stroke="#34483a"/>
        <path d="M8 12h12V8h18m51 0h15v4h12" fill="none" stroke="#263b2c"/>
        <path d="M17 10l-4-3h-6m96 1 5-4h9M22 27l-5 4m92-5 7 4" fill="none" stroke="#080e0b" strokeWidth="2"/>
        <g className="footer-pool-rubble" fill="#3d5040"><path d="M25 7h5v2h-5zM92 27h5v2h-5zM10 21h4v2h-4zM111 12h5v2h-5z"/></g>
        <path d="M34 7V4h2v4m3-3V2h2v5m57 21v-3h2v4" stroke="#3c5c3d" fill="none"/>
      </g>
    </svg>
  </div>;
}
