function PixelBlaster({ heavy }) {
  return <g className="buddy-blaster-art">
    <path d="M5 13h8v-3h25v3h9v3h4v10H30v4h-5v7H13V26H5z" fill="#172d39" />
    <path d="M8 15h29v2h10v6H27v4H15v-4H8z" fill={heavy ? "#398695" : "#448ba3"} />
    <path d="M10 14h25v3H10m-2 1h3v4H8" fill="#9edbd6" />
    <path d="M12 18h19v5H12z" fill="#285163" />
    <path d="M15 19h12v2H15z" fill="#ed79ae" />
    <path d="M34 14h5v10h-5z" fill="#263d4a" />
    <path d="M40 17h9v6h-9z" fill="#75b6c0" /><path d="M46 18h4v4h-4z" fill="#d0f5df" />
    <path d="M16 25h8v10h-9v-7h1z" fill="#485563" />
    <path d="M17 27h5v2h-5m-1 3h6v1h-6" fill="#a37a95" />
    <path d="M25 26h4v5h-5v-2h3v-1h-2z" fill="#8ab9bb" />
    <path d="M13 10h5V8h5v2m10 0h4V8h3v4" fill="#b5d8cf" />
    <path className="buddy-laser-charge" d="M30 18h3v4h-3z" fill="#ffd166" />
    <path d="M8 24h6v5H8z" fill="#619c8b" /><path d="M8 24h5v2H8z" fill="#b6dfc7" />
  </g>;
}

export function BuddyBugWeapon({ weapon }) {
  return (
    <svg className={`buddy-hunt-weapon is-${weapon}`} viewBox="0 0 52 40" aria-hidden="true">
      <g shapeRendering="crispEdges">
        {weapon === "wrench" ? <PixelBlaster heavy /> : null}

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

        {weapon === "laser" ? <PixelBlaster /> : null}

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
