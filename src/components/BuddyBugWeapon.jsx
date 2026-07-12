export function BuddyBugWeapon({ weapon }) {
  return (
    <svg className={`buddy-hunt-weapon is-${weapon}`} viewBox="0 0 52 40" aria-hidden="true">
      <g shapeRendering="crispEdges">
        {weapon === "wrench" ? (
          <>
            <path d="M3 10h34v4h10v12H35v4H18v-7H3z" fill="#071b1c" />
            <rect x="6" y="13" width="31" height="9" fill="#45d8ff" />
            <rect x="11" y="15" width="18" height="3" fill="#b8f7ff" />
            <rect x="37" y="16" width="12" height="6" fill="#ff3d9d" />
            <rect x="41" y="18" width="10" height="2" fill="#f4fff8" />
            <path d="M19 22h13v9H21z" fill="#174b57" />
            <rect x="3" y="13" width="7" height="10" fill="#8a5428" />
            <rect className="buddy-laser-charge" x="30" y="14" width="5" height="5" fill="#ffd166" />
          </>
        ) : null}

        {weapon === "net" ? (
          <>
            <rect x="3" y="19" width="31" height="6" fill="#071b1c" />
            <rect x="4" y="20" width="30" height="3" fill="#ffd166" />
            <path d="M31 5h16v3h3v18h-3v3H31v-3h-3V8h3z" fill="#071b1c" />
            <path d="M33 7h12v3h3v14h-3v3H33v-3h-3V10h3z" fill="#b8f7ff" />
            <path d="M33 9v16m6-17v18m6-15-13 12m15-5L35 8" fill="none" stroke="#246c78" strokeWidth="2" />
            <rect x="2" y="18" width="8" height="8" fill="#8a5428" />
          </>
        ) : null}

        {weapon === "laser" ? (
          <>
            <path d="M5 12h34v4h7v12H34v5H19v-7H5z" fill="#071b1c" />
            <rect x="7" y="15" width="32" height="9" fill="#45d8ff" />
            <rect x="12" y="17" width="18" height="3" fill="#b8f7ff" />
            <rect x="39" y="18" width="9" height="5" fill="#ff3d9d" />
            <path d="M20 24h12v7H21z" fill="#174b57" />
            <rect x="4" y="16" width="7" height="10" fill="#8a5428" />
            <rect className="buddy-laser-charge" x="31" y="16" width="5" height="5" fill="#ffd166" />
          </>
        ) : null}

        {weapon === "flyswatter" ? (
          <>
            <rect x="3" y="19" width="31" height="6" fill="#071b1c" />
            <rect x="4" y="20" width="30" height="3" fill="#ffd166" />
            <path d="M30 4h19v24H30z" fill="#071b1c" />
            <rect x="33" y="7" width="13" height="18" fill="#ff3d9d" />
            <path d="M35 9h3v3h-3zm6 0h3v3h-3zm-6 6h3v3h-3zm6 0h3v3h-3zm-6 6h3v3h-3zm6 0h3v3h-3z" fill="#571333" />
            <rect x="2" y="18" width="8" height="8" fill="#8a5428" />
          </>
        ) : null}
      </g>
    </svg>
  );
}
