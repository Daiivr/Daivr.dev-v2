// Quiet desktop-only props; live presence remains in the notebook and devices.

const cupDefs = <>
  <radialGradient id="desk-cup-ceramic" cx=".3" cy=".22" r=".85">
    <stop stopColor="#e0e5ce" /><stop offset=".52" stopColor="#aebfac" /><stop offset=".85" stopColor="#6e8a79" /><stop offset="1" stopColor="#425f51" />
  </radialGradient>
  <radialGradient id="desk-cup-saucer" cx=".4" cy=".35" r=".65">
    <stop stopColor="#597263" /><stop offset=".6" stopColor="#8da28e" /><stop offset=".87" stopColor="#b4c3a9" /><stop offset=".95" stopColor="#839d87" /><stop offset="1" stopColor="#3d594c" />
  </radialGradient>
  <radialGradient id="desk-cup-coffee" cx=".38" cy=".3" r=".75">
    <stop stopColor="#67402a" /><stop offset=".55" stopColor="#38261a" /><stop offset=".88" stopColor="#251c14" /><stop offset="1" stopColor="#ae7946" />
  </radialGradient>
  <radialGradient id="desk-cup-shadow">
    <stop offset=".55" stopColor="#010c09" stopOpacity=".65" /><stop offset="1" stopColor="#010c09" stopOpacity="0" />
  </radialGradient>
  <linearGradient id="desk-cup-handle" x2=".8" y2="1">
    <stop stopColor="#cfdbc2" /><stop offset=".45" stopColor="#91aa94" /><stop offset="1" stopColor="#4c6b5b" />
  </linearGradient>
</>;

const cupArt = <g shapeRendering="geometricPrecision">
  <ellipse cx="44" cy="52" rx="51" ry="47" fill="url(#desk-cup-shadow)" />
  <circle cx="38" cy="43" r="41" fill="url(#desk-cup-saucer)" />
  <circle cx="38" cy="43" r="37.5" fill="none" stroke="#d5ddc4" strokeOpacity=".28" strokeWidth=".7" />
  <circle cx="40" cy="46" r="31" fill="#233e31" opacity=".32" />
  <g transform="rotate(28 38 43)">
    <path d="M63 32c21-3 23 24 1 23" fill="none" stroke="#20392c" strokeOpacity=".45" strokeWidth="9" transform="translate(1 2)" />
    <path d="M63 30c21-3 23 24 1 23" fill="none" stroke="url(#desk-cup-handle)" strokeWidth="8" />
    <path d="M66 28c11 0 15 8 11 15" fill="none" stroke="#e0e7d0" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
  </g>
  <circle cx="38" cy="43" r="29" fill="url(#desk-cup-ceramic)" stroke="#91a98f" strokeWidth=".6" />
  <circle cx="38" cy="43" r="24.5" fill="#506350" />
  <circle cx="38" cy="43" r="23" fill="url(#desk-cup-coffee)" />
  <path d="M17 42a21 21 0 0 1 32-17" fill="none" stroke="#ce9a61" strokeWidth="1.2" strokeOpacity=".6" strokeLinecap="round" />
  <path d="M20 37c5-10 16-13 26-8-10-2-19 1-26 8" fill="#e0b886" opacity=".12" />
  <path d="M15 30a27 27 0 0 1 34-12" fill="none" stroke="#f0eed8" strokeOpacity=".7" strokeWidth="1.5" strokeLinecap="round" />
  <path d="M58 58a26 26 0 0 1-29 10" fill="none" stroke="#355545" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
  <g fill="#cda36d" opacity=".6">
    <circle cx="21" cy="32" r=".8" /><circle cx="23" cy="29" r=".5" />
    <circle cx="26" cy="27" r=".65" /><circle cx="19" cy="36" r=".45" />
    <circle cx="48" cy="62" r=".55" /><circle cx="51" cy="60" r=".8" />
  </g>
</g>;

// The tabletop sets the cup down on its own, so it can leave this row.
export function DiscordDeskKeepsakes({ cup = true }) {
  return (
    <div className="discord-desk-keepsakes" aria-hidden="true">
      <svg viewBox={cup ? "0 0 460 112" : "0 0 330 112"} focusable="false">
        <defs>
          <linearGradient id="desk-cassette-shell" x2="0" y2="1">
            <stop stopColor="#38564c" /><stop offset="1" stopColor="#172e29" />
          </linearGradient>
          <linearGradient id="desk-note-paper" x2="0" y2="1">
            <stop stopColor="#a4b18c" /><stop offset="1" stopColor="#75876b" />
          </linearGradient>
          {cup ? cupDefs : null}
          <pattern id="desk-keepsake-grain" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M0 0h1M2 2h1" stroke="#c0ddbf" strokeOpacity=".13" />
          </pattern>
        </defs>

        <g transform="translate(27 16) rotate(-7 70 39)">
          <rect x="3" y="6" width="145" height="83" rx="5" fill="#020d0b" opacity=".65" />
          <rect width="145" height="81" rx="4" fill="url(#desk-cassette-shell)" stroke="#638274" />
          <rect x="6" y="5" width="133" height="68" rx="2" fill="url(#desk-keepsake-grain)" stroke="#0c211b" />
          <path d="M11 11h123v41H11z" fill="#9aa783" />
          <path d="M11 11h123v12H11z" fill="#35594c" />
          <text x="18" y="19" fill="#c7d6b7" fontSize="6" letterSpacing="1.2">AFTER HOURS / VOL. 01</text>
          <path d="M17 29h111M17 32h111" stroke="#526b55" strokeWidth="1" />
          <rect x="27" y="37" width="92" height="20" rx="9" fill="#172d24" stroke="#516a52" />
          <circle cx="43" cy="47" r="8" fill="#8b9f85" /><circle cx="103" cy="47" r="8" fill="#8b9f85" />
          <path d="M43 41v12m-6-6h12m54-6v12m-6-6h12" stroke="#354f3d" strokeWidth="3" />
          <rect x="59" y="41" width="27" height="12" fill="#536342" stroke="#091d17" />
          <path d="M30 79l8-17h69l8 17z" fill="#233c32" stroke="#587365" />
          <circle cx="45" cy="72" r="3" fill="#091e17" /><circle cx="100" cy="72" r="3" fill="#091e17" />
          <path d="M8 7h3M134 7h3M8 73h3M134 73h3" stroke="#96aa94" />
          <text x="14" y="65" fill="#bbceb2" fontSize="6">A</text>
        </g>

        <g transform="translate(204 18) rotate(6 51 36)">
          <path d="M3 4h106v68l-13 12H3z" fill="#020d0b" opacity=".5" />
          <path d="M0 0h105v65L92 79H0z" fill="url(#desk-note-paper)" />
          <path d="M0 0h105v65L92 79H0z" fill="url(#desk-keepsake-grain)" />
          <path d="M92 79V65h13" fill="#bfcaab" />
          <path d="M10 24h82M10 42h82M10 60h72" stroke="#485e4544" />
          <path d="M43-5h24v14H43z" fill="#c6c49a" opacity=".58" />
          <text x="12" y="21" fill="#284537" fontSize="9" fontStyle="italic">one more song,</text>
          <text x="12" y="39" fill="#284537" fontSize="9" fontStyle="italic">one more idea.</text>
          <path d="M18 55v10m-5-5h10m45-5h3v3h3v3h-3v3h-3v-3h-3v-3h3z" fill="#3d6451" stroke="#3d6451" />
        </g>

        {cup ? <g transform="translate(347 12)">{cupArt}</g> : null}
      </svg>
    </div>
  );
}

// Same cup, seen from above, with a little steam drifting off it.
export function DeskCoffee() {
  return (
    <div className="tabletop-coffee" aria-hidden="true">
      <svg viewBox="-8 -8 106 106" focusable="false">
        <defs>{cupDefs}</defs>
        {cupArt}
        <g className="tabletop-coffee-steam" fill="none" stroke="#f3eedc" strokeLinecap="round">
          <path d="M30 40c-6-9 6-14 0-24s4-16 1-22" />
          <path d="M40 38c-5-8 5-12 0-21s3-13 1-19" />
          <path d="M48 41c-6-8 6-13 1-22s3-14 0-20" />
        </g>
      </svg>
    </div>
  );
}
