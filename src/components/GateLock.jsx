import { useId } from "react";

// Each pull lives inside its door so it inherits the exact panel movement.
// Only the cross-bolt spans the seam, disappearing once it has released.
export function GateLock({ side }) {
  const id = useId().replace(/:/g, "");
  const paint = name => `url(#${id}-${name})`;
  return (
    <span className="entry-gate-lock" aria-hidden="true">
      <svg viewBox="0 0 96 168" focusable="false">
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#17281d" /><stop offset=".24" stopColor="#63725b" />
            <stop offset=".4" stopColor="#859077" /><stop offset=".54" stopColor="#45583f" /><stop offset="1" stopColor="#1c2d21" />
          </linearGradient>
          <linearGradient id={`${id}-frame`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#344638" /><stop offset="1" stopColor="#15251c" />
          </linearGradient>
          <pattern id={`${id}-grain`} width="7" height="9" patternUnits="userSpaceOnUse">
            <path d="M1 0v6 M4 3v6" stroke="#d4dcc6" strokeOpacity=".08" strokeWidth=".5" />
          </pattern>
          <clipPath id={`${id}-travel`}><rect x="18" y="73" width="55" height="18" /></clipPath>
        </defs>
        {(side ? [side === "right"] : []).map(right => (
          <g key={String(right)} className={`gate-latch-mount is-${right ? "right" : "left"}`}>
            <g transform={right ? "translate(96 0) scale(-1 1)" : undefined}>
              <path d="M17 10H39L44 15V149L39 154H17L12 149V15Z" fill="#030b07" stroke="#819276" strokeOpacity=".2" />
              <path d="M18 13H38L41 16V147L38 150H18L15 147V16Z" fill={paint("frame")} />
              <path d="M17 146V17H38" fill="none" stroke="#a7b698" strokeOpacity=".24" />
              <path d="M20 36H36V126H20Z" fill="#040e08" stroke="#8a9a7d" strokeOpacity=".18" />
              <path d="M22 38V123H35" fill="none" stroke="#000" strokeWidth="2" />
              <rect x="25" y="45" width="9" height="72" rx="2" fill="#000" />
              <rect x="24" y="42" width="8" height="72" rx="2" fill={paint("metal")} stroke="#a4b291" strokeOpacity=".25" />
              <path d="M26 48V108" stroke="#c6ceb4" strokeOpacity=".3" strokeWidth=".6" />
              <path d="M18 15H38V148H18Z" fill={paint("grain")} />
              {[24, 139].map(y => (
                <g key={y}>
                  <circle cx="28" cy={y} r="2.6" fill="#08150c" stroke="#9ba88a" strokeOpacity=".35" strokeWidth=".6" />
                  <path d={`M26.5 ${y + .8}l3 -1.6`} stroke="#849477" strokeWidth=".7" />
                </g>
              ))}
            </g>
          </g>
        ))}
        {!side && <><g className="gate-latch-bridge">
          <rect x="19" y="74" width="54" height="16" rx="2" fill="#040c07" stroke="#718167" strokeOpacity=".26" />
          <g clipPath={paint("travel")}>
            <g className="gate-latch-slider">
              <path d="M24 77H68V86H24Z" fill={paint("metal")} stroke="#a8b697" strokeOpacity=".25" />
              <path d="M26 78H66" stroke="#c4cfb2" strokeOpacity=".3" />
              <path d="M30 79V84 M33 79V84 M36 79V84" stroke="#0a180f" strokeOpacity=".7" />
            </g>
          </g>
          <path d="M61 75V89" stroke="#020805" strokeWidth="2" />
        </g>
        <g className="gate-latch-status">
          <rect x="21" y="159" width="54" height="3" rx="1" fill="#020a05" />
          <rect className="gate-latch-light" x="36" y="159.5" width="24" height="2" rx=".5" />
        </g>
        </>}
      </svg>
    </span>
  );
}
