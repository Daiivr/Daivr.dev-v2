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
    <svg viewBox="0 0 84 44" width="84" height="44">
      <defs>
        <radialGradient id={`${id}-aura`}><stop stopColor="#447ac4" stopOpacity=".35" /><stop offset=".7" stopColor="#5c63b9" stopOpacity=".14" /><stop offset="1" stopColor="#487dc3" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-depth`} cx="48%" cy="40%"><stop offset=".25" stopColor="#010812" /><stop offset=".65" stopColor="#091630" /><stop offset=".87" stopColor="#263458" /><stop offset="1" stopColor="#568793" /></radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".3" y2="1"><stop stopColor="#547ca6" /><stop offset=".45" stopColor="#a5a2e3" /><stop offset=".7" stopColor="#26486a" /><stop offset="1" stopColor="#83ded6" /></linearGradient>
        <clipPath id={`${id}-water`}><ellipse cx="42" cy="18" rx="32" ry="7.5" /></clipPath>
      </defs>
      <g className="buddy-portal-aperture">
        <ellipse cx="42" cy="21" rx="39" ry="16" fill={paint("aura")} />
        <ellipse cx="42" cy="21" rx="36" ry="9" fill="#020e18" opacity=".65" />
        <ellipse cx="42" cy="18" rx="37" ry="10" fill="#0b1c32" stroke={paint("rim")} strokeWidth="1.5" />
        <ellipse cx="42" cy="18" rx="33" ry="8" fill={paint("depth")} />
        <g clipPath={paint("water")}>
          <path className="buddy-portal-undertow" d="M12 18c8-9 53-9 60 0s-50 12-55 1 44-10 48-2-33 9-36 2 20-7 24-2" fill="none" stroke="#738aca" strokeWidth=".7" strokeDasharray="12 22 5 16" opacity=".5" />
          <path d="M16 21q15 7 39 3M24 13q16-3 33 0" fill="none" stroke="#65709b" strokeWidth=".6" opacity=".5" />
          <g className="buddy-portal-depth-stars" fill="#97c9db"><circle cx="27" cy="17" r=".6"/><circle cx="52" cy="21" r=".7"/><circle cx="61" cy="15" r=".45"/><circle cx="38" cy="13" r=".4"/></g>
        </g>
        <ellipse className="buddy-portal-current" cx="42" cy="18" rx="36" ry="9.5" fill="none" stroke="#9fe8df" strokeWidth="1" strokeDasharray="15 17 5 32" />
        <path d="M8 21c8 9 60 9 68-1" fill="none" stroke="#425586" strokeWidth="2" opacity=".75" />
        <path d="M16 24q13 5 28 4m9-1 8-1M14 12l6-2m44 1 5 2" fill="none" stroke="#aac9e4" strokeWidth="1" opacity=".8" />
      </g>
      <g className="buddy-portal-motes" fill="#b5deef"><circle cx="13" cy="9" r=".9"/><circle cx="69" cy="6" r=".7"/><circle cx="57" cy="30" r=".6"/><path d="M24 5v4m-2-2h4" stroke="#b5deef" strokeWidth=".65"/></g>
    </svg>
  </div>;
}
