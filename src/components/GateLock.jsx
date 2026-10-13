// Cerradura de la junta de la puerta (entry-gate.css, "Cerradura"): placa de
// acero partida en dos (una mitad en cada hoja), pernos que entran en las
// puertas, volante de tres radios y un anillo de 12 LED que se va llenando con
// la descarga de la anfitriona (`progress`, 0-100). El color, los pernos y el
// volante los mueve la clase de la puerta: ambar mientras llega, cian mientras
// habla, verde con los pernos dentro cuando se puede pasar. Al abrir, el
// volante gira, las mitades de la placa se separan con las hojas y se apaga.
const CENTER = [80, 58];
const LEDS = 12;
const BOLT_HEADS = Array.from({ length: 8 }, (_, index) => {
  const angle = (index * 45 + 22.5) * Math.PI / 180;
  return [CENTER[0] + Math.cos(angle) * 22, CENTER[1] + Math.sin(angle) * 22];
});
const SPOKES = [-90, 30, 150].map((degrees) => {
  const angle = degrees * Math.PI / 180;
  return [CENTER[0] + Math.cos(angle) * 22, CENTER[1] + Math.sin(angle) * 22];
});
const SCREWS = [[48, 14], [112, 14], [48, 102], [112, 102]];

export function GateLock({ progress = 0 }) {
  const lit = Number.isFinite(progress) ? Math.max(0, Math.min(LEDS, Math.floor(progress / 100 * LEDS))) : 0;
  const [cx, cy] = CENTER;
  return (
    <span className="entry-gate-lock" aria-hidden="true">
      <svg viewBox="0 0 160 124" focusable="false">
        <defs>
          <pattern id="gate-lock-brush" width="23" height="5" patternUnits="userSpaceOnUse"><path d="M0 .5 H17 M8 2 H23 M0 4 H9" stroke="#d2d8b9" strokeOpacity=".15" strokeWidth=".5"/><path d="M2 1.5 H21 M12 4 H23" stroke="#031007" strokeOpacity=".25" strokeWidth=".6"/></pattern>
          <linearGradient id="gate-lock-bolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3d9bf" /><stop offset=".45" stopColor="#6c7a62" /><stop offset="1" stopColor="#25301f" /></linearGradient>
          <linearGradient id="gate-lock-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b7962" /><stop offset=".3" stopColor="#465545" /><stop offset="1" stopColor="#1c271e" /></linearGradient>
          <radialGradient id="gate-lock-hub" cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#97a48b" /><stop offset=".55" stopColor="#3d4b3b" /><stop offset="1" stopColor="#121c15" /></radialGradient>
          <radialGradient id="gate-lock-well"><stop offset="0" stopColor="#0d1a12" /><stop offset="1" stopColor="#020805" /></radialGradient>
          <radialGradient id="gate-lock-head" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#dde3ca" /><stop offset=".6" stopColor="#5d6b53" /><stop offset="1" stopColor="#1a2419" /></radialGradient>
          <radialGradient id="gate-lock-glow"><stop className="gate-lock-glow-stop" offset="0" stopOpacity=".42" /><stop className="gate-lock-glow-stop" offset=".5" stopOpacity=".12" /><stop className="gate-lock-glow-stop" offset="1" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse className="gate-lock-glow" cx={cx} cy={cy} rx="78" ry="60" fill="url(#gate-lock-glow)" />
        <g className="gate-lock-bolts is-left"><rect x="18" y="36" width="28" height="8" rx="2" fill="url(#gate-lock-bolt)" /><rect x="18" y="72" width="28" height="8" rx="2" fill="url(#gate-lock-bolt)" /></g>
        <g className="gate-lock-bolts is-right"><rect x="114" y="36" width="28" height="8" rx="2" fill="url(#gate-lock-bolt)" /><rect x="114" y="72" width="28" height="8" rx="2" fill="url(#gate-lock-bolt)" /></g>
        <g className="gate-lock-plate is-left">
          <path d="M80 7 H46 Q37 7 37 16 V105 Q37 114 46 114 H80 Z" fill="#07110b" stroke="#111e13" strokeWidth="2"/>
          <path d="M80 6 H47 Q40 6 40 13 V103 Q40 110 47 110 H80 Z" fill="url(#gate-lock-plate)" stroke="#a9b597" strokeOpacity=".35" />
          <path d="M79 9 H48 Q43 9 43 14 V102 Q43 107 48 107 H79" fill="none" stroke="#000" strokeOpacity=".35" />
          <path d="M45 11 H78 V107 H45 Z" fill="url(#gate-lock-brush)" />
          <path d="M44 26 V92 M48 8 H75" stroke="#d3d9b8" strokeOpacity=".28" strokeWidth=".7"/>
        </g>
        <g className="gate-lock-plate is-right">
          <path d="M80 7 H114 Q123 7 123 16 V105 Q123 114 114 114 H80 Z" fill="#07110b" stroke="#111e13" strokeWidth="2"/>
          <path d="M80 6 H113 Q120 6 120 13 V103 Q120 110 113 110 H80 Z" fill="url(#gate-lock-plate)" stroke="#a9b597" strokeOpacity=".35" />
          <path d="M81 9 H112 Q117 9 117 14 V102 Q117 107 112 107 H81" fill="none" stroke="#000" strokeOpacity=".35" />
          <path d="M82 11 H115 V107 H82 Z" fill="url(#gate-lock-brush)" />
          <path d="M119 27 V93 M84 8 H111" stroke="#d3d9b8" strokeOpacity=".22" strokeWidth=".7"/>
        </g>
        <g className="gate-lock-face">
          <path d="M80 6 V110" stroke="#020604" strokeWidth="1.6" /><path d="M81.2 6 V110" stroke="#c9d3b7" strokeOpacity=".14" />
          {SCREWS.map(([x, y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y+1} r="3.4" fill="#09120c"/><path d={`M${x-1.5} ${y-2.6} H${x+1.5} L${x+3} ${y} L${x+1.5} ${y+2.6} H${x-1.5} L${x-3} ${y} Z`} fill="url(#gate-lock-head)" stroke="#a1af90" strokeWidth=".4"/><path d={`M${x - 1.5} ${y + .8} L${x + 1.5} ${y - .8}`} stroke="#0b130c" strokeWidth=".8" /></g>)}
          <circle cx={cx} cy={cy+1.5} r="33" fill="#101c14" stroke="#9aa888" strokeOpacity=".35"/>
          <circle cx={cx} cy={cy} r="31" fill="none" stroke="url(#gate-lock-bolt)" strokeWidth="1.3"/>
          {Array.from({ length: LEDS }, (_, index) => (
            <rect key={index} className={`gate-lock-led${index < lit ? " is-lit" : ""}${index === lit ? " is-next" : ""}`} x={cx - 1.3} y={cy - 38} width="2.6" height="5" rx="1" transform={`rotate(${index * 360 / LEDS} ${cx} ${cy})`} />
          ))}
          <circle cx={cx} cy={cy} r="29" fill="#050b07" />
          <circle cx={cx} cy={cy} r="27.5" fill="url(#gate-lock-hub)" stroke="#b4c0a2" strokeOpacity=".45" />
          <circle cx={cx} cy={cy} r="27" fill="url(#gate-lock-brush)"/>
          <circle cx={cx} cy={cy} r="24.5" fill="none" stroke="#07140a" strokeOpacity=".65" strokeWidth=".7"/>
          {BOLT_HEADS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="url(#gate-lock-head)" stroke="#0b130c" strokeWidth=".5" />)}
          <circle cx={cx} cy={cy} r="18" fill="url(#gate-lock-well)" stroke="#000" />
          <path d="M65 50 A17 17 0 0 1 87 43" stroke="#97a888" strokeOpacity=".35" fill="none" strokeWidth=".7"/>
          <g className="gate-lock-wheel">
            <circle cx={cx} cy={cy} r="27" fill="none" />
            {SPOKES.map(([x, y]) => <path key={`s-${x}`} d={`M${cx} ${cy} L${x} ${y}`} stroke="#0b130c" strokeWidth="5" strokeLinecap="round" />)}
            {SPOKES.map(([x, y]) => <path key={`l-${x}`} d={`M${cx} ${cy} L${x} ${y}`} stroke="url(#gate-lock-bolt)" strokeWidth="3" strokeLinecap="round" />)}
            {SPOKES.map(([x, y]) => <circle key={`k-${x}`} cx={x} cy={y} r="4" fill="url(#gate-lock-head)" stroke="#0b130c" strokeWidth=".7" />)}
            <circle cx={cx} cy={cy} r="7" fill="url(#gate-lock-head)" stroke="#0b130c" strokeWidth=".8" />
            <circle className="gate-lock-core" cx={cx} cy={cy} r="2.6" />
          </g>
        </g>
        <rect className="gate-lock-caption" x="56" y="115" width="48" height="9" rx="1.5" fill="#08110b" stroke="#758368" strokeOpacity=".35"/>
        <text className="gate-lock-label is-locked" x={cx} y="121">LOCKED</text>
        <text className="gate-lock-label is-open" x={cx} y="121">OPEN</text>
      </svg>
    </span>
  );
}
