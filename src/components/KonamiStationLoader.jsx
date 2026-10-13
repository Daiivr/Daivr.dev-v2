// Escena de "Insert & play" de la biblioteca secreta: una mesa bajo la lampara
// con la tele, la consola Station 86 y el mando enchufado. Todo es un solo SVG
// (dibujado en 800x470 y recortado a lo que se ve) para que las piezas
// cuadren a cualquier tamaño; el
// cartucho se recorta en el borde de la ranura con un clipPath fijo mientras
// se mueve, asi que de verdad entra en la consola. Las fases (aligning,
// seating, locked, booting) llegan como clase del contenedor y konami-loader.css
// enciende cada cosa: ranura y pantalla al encajar, tele y LED al arrancar.
const DISPLAY = { locked: "READY", booting: "PLAY" };
// Tubo abombado de la tele (cada lado es una curva) y las marcas del dial.
const SCREEN = "M58 191 Q107 185 156 191 Q165 242 156 293 Q107 299 58 293 Q49 242 58 191 Z";
const ticks = (inner, outer, count = 7) => Array.from({ length: count }, (_, index) => {
  const angle = (-135 + index * 270 / (count - 1)) * Math.PI / 180;
  const x = Math.sin(angle), y = -Math.cos(angle);
  return `M${(x * inner).toFixed(1)} ${(y * inner).toFixed(1)}L${(x * outer).toFixed(1)} ${(y * outer).toFixed(1)}`;
}).join("");
const DIAL_TICKS = ticks(14, 16.5), VOLUME_TICKS = ticks(10, 12, 5);
// El mando visto desde arriba: hueso con lobulos a los lados.
const PAD = "M-43 -34 C-26 -34 -23 -27 -13 -27 H13 C23 -27 26 -34 43 -34 C63 -34 76 -18 74 2 C72 24 59 36 42 35 C26 34 23 24 12 24 H-12 C-23 24 -26 34 -42 35 C-59 36 -72 24 -74 2 C-76 -18 -63 -34 -43 -34 Z";
const CROSS = "M-46.5 -15h9v10.5h10.5v9h-10.5v10.5h-9v-10.5h-10.5v-9h10.5Z";
const BUTTONS = [["is-x", 42, -14, "X"], ["is-a", 56, 0, "A"], ["is-b", 42, 14, "B"], ["is-y", 28, 0, "Y"]];
const LAMP_SHADE = "M70 40 C56 40 47 45 44 54 C39 68 27 79 17 86 Q13 89 17 92 Q70 104 123 92 Q127 89 123 86 C113 79 101 68 96 54 C93 45 84 40 70 40 Z";

// Static material passes are clipped to the shell, before labels and controls.
// Separate IDs keep the hanging lamp independent from the room SVG.
function MaterialDefs({ prefix }) {
  return <>
    <filter id={`${prefix}-grain`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" seed="23" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer><feFuncR type="linear" slope="3" intercept="-1" /><feFuncG type="linear" slope="3" intercept="-1" /><feFuncB type="linear" slope="3" intercept="-1" /></feComponentTransfer>
      <feComposite in2="SourceAlpha" operator="in" />
    </filter>
    <pattern id={`${prefix}-brushed`} width="37" height="7" patternUnits="userSpaceOnUse">
      <path d="M0 .5 H23 M27 .5 H37 M9 3 H34 M0 5.5 H16 M22 6 H37" stroke="#e7e3ba" strokeOpacity=".13" strokeWidth=".4" />
      <path d="M4 1.5 H32 M0 4 H21 M26 4 H37" stroke="#050e08" strokeOpacity=".22" strokeWidth=".5" />
    </pattern>
  </>;
}

function CaseScrew({ x, y, small = false }) {
  return <g transform={`translate(${x} ${y})${small ? " scale(.65)" : ""}`}>
    <circle r="2.5" fill="#101b13" /><circle cy="-.35" r="1.8" fill="url(#k86-chrome)" opacity=".7" />
    <path d="M-1 -.35 H1 M0 -1.35 V.65" stroke="#172119" strokeWidth=".6" />
  </g>;
}

export function KonamiStationLoader({ game, phase, channel }) {
  const longTitle = game.title.length > 10;
  return (
    <svg className="k86-scene" viewBox="20 80 760 372" aria-hidden="true" focusable="false">
      <defs>
        <MaterialDefs prefix="k86-case" />
        <linearGradient id="k86-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a120e" /><stop offset="1" stopColor="#15211a" /></linearGradient>
        <pattern id="k86-boards" width="46" height="306" patternUnits="userSpaceOnUse"><rect width="46" height="306" fill="#ffffff04" /><rect x="45" width="1" height="306" fill="#00000066" /><rect x="44" width="1" height="306" fill="#ffffff08" /></pattern>
        <radialGradient id="k86-pool"><stop offset="0" stopColor="#ffd9a0" stopOpacity=".2" /><stop offset=".5" stopColor="#ffd9a0" stopOpacity=".07" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></radialGradient>
        <radialGradient id="k86-wash"><stop className="k86-accent-stop" offset="0" stopOpacity=".34" /><stop className="k86-accent-stop" offset=".5" stopOpacity=".1" /><stop className="k86-accent-stop" offset="1" stopOpacity="0" /></radialGradient>
        <pattern id="k86-walnut" width="420" height="190" patternUnits="userSpaceOnUse"><rect width="420" height="190" fill="#2a1b12" /><image href="/arcade-library/walnut-grain.svg" width="420" height="190" preserveAspectRatio="none" /></pattern>
        <radialGradient id="k86-desklight" cx=".5" cy=".3" r=".5"><stop offset="0" stopColor="#ffd59a" stopOpacity=".3" /><stop offset=".55" stopColor="#ffd59a" stopOpacity=".1" /><stop offset="1" stopColor="#ffd59a" stopOpacity="0" /></radialGradient>
        <linearGradient id="k86-deskedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2517" /><stop offset="1" stopColor="#120b07" /></linearGradient>
        <radialGradient id="k86-shadow"><stop offset="0" stopColor="#000" stopOpacity=".7" /><stop offset=".55" stopColor="#000" stopOpacity=".3" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        {/* La habitacion se funde a negro en los bordes de lo que se ve (20-780 x
            80-452): un degradado por lado, multiplicados con una mascara dentro de
            otra, para que la mesa bajo el mando no se pierda en la esquina. */}
        <linearGradient id="k86-fade-x" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="780" y2="0"><stop offset="0" stopColor="#000" /><stop offset=".07" stopColor="#555" /><stop offset=".17" stopColor="#fff" /><stop offset=".83" stopColor="#fff" /><stop offset=".93" stopColor="#555" /><stop offset="1" stopColor="#000" /></linearGradient>
        <linearGradient id="k86-fade-y" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="452"><stop offset="0" stopColor="#000" /><stop offset=".24" stopColor="#fff" /><stop offset=".9" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
        <mask id="k86-fade-v" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="470"><rect width="800" height="470" fill="url(#k86-fade-y)" /></mask>
        <mask id="k86-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="470"><rect width="800" height="470" fill="url(#k86-fade-x)" mask="url(#k86-fade-v)" /></mask>

        <linearGradient id="k86-plastic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#66745f" /><stop offset=".35" stopColor="#4a5a49" /><stop offset="1" stopColor="#2c3a30" /></linearGradient>
        <radialGradient id="k86-crt" cx=".45" cy=".4" r=".7"><stop offset="0" stopColor="#1b2a21" /><stop offset="1" stopColor="#050907" /></radialGradient>
        <linearGradient id="k86-glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".16" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <pattern id="k86-scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" fillOpacity=".55" /></pattern>
        <radialGradient id="k86-vignette" r=".72"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></radialGradient>
        <radialGradient id="k86-knob" cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#a3ab8f" /><stop offset=".55" stopColor="#4d5b46" /><stop offset="1" stopColor="#1e2a20" /></radialGradient>
        <filter id="k86-noise-a" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="4" /><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .85  0 0 0 0 .8  1.6 0 0 0 -.45" /></filter>
        <filter id="k86-noise-b" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="11" /><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .85  0 0 0 0 .8  1.6 0 0 0 -.45" /></filter>
        <clipPath id="k86-screen-clip"><path d={SCREEN} /></clipPath>
        <linearGradient id="k86-tvshell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a977f" /><stop offset=".22" stopColor="#4c5c4a" /><stop offset="1" stopColor="#1a251c" /></linearGradient>
        <linearGradient id="k86-chamfer" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#000" stopOpacity=".7" /><stop offset=".55" stopColor="#000" stopOpacity=".2" /><stop offset="1" stopColor="#dfe3c4" stopOpacity=".35" /></linearGradient>
        <linearGradient id="k86-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1f3e4" /><stop offset=".45" stopColor="#a9ae99" /><stop offset=".55" stopColor="#7c816e" /><stop offset="1" stopColor="#d5d8c6" /></linearGradient>
        <radialGradient id="k86-knobcap" cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#e3e6d0" /><stop offset=".6" stopColor="#8e967f" /><stop offset="1" stopColor="#4a5343" /></radialGradient>

        <linearGradient id="k86-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6c7462" /><stop offset=".55" stopColor="#7f8771" /><stop offset="1" stopColor="#5c6652" /></linearGradient>
        <radialGradient id="k86-hot"><stop offset="0" stopColor="#ffe8bf" stopOpacity=".3" /><stop offset=".5" stopColor="#ffe8bf" stopOpacity=".09" /><stop offset="1" stopColor="#ffe8bf" stopOpacity="0" /></radialGradient>
        <pattern id="k86-vent" width="10.5" height="4" patternUnits="userSpaceOnUse"><rect width="7" height="3" rx="1" fill="#1f281b" /><rect y="3" width="7" height="1" fill="#b9bea233" /></pattern>
        <linearGradient id="k86-slot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset="1" stopColor="#141c13" /></linearGradient>
        <radialGradient id="k86-slotglow"><stop className="k86-accent-stop" offset="0" stopOpacity=".7" /><stop className="k86-accent-stop" offset=".5" stopOpacity=".22" /><stop className="k86-accent-stop" offset="1" stopOpacity="0" /></radialGradient>
        <clipPath id="k86-cart-clip"><rect width="800" height="326" /></clipPath>
        <linearGradient id="k86-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#404d38" /><stop offset=".12" stopColor="#36432f" /><stop offset="1" stopColor="#1f281b" /></linearGradient>

        <linearGradient id="k86-cartbody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1b2419" /><stop offset=".5" stopColor="#2f3a2b" /><stop offset="1" stopColor="#1b2419" /></linearGradient>
        <linearGradient id="k86-gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".2" /><stop offset=".3" stopColor="#fff" stopOpacity="0" /><stop offset=".72" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></linearGradient>
        <linearGradient id="k86-labelfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#010503" stopOpacity="0" /><stop offset="1" stopColor="#010503" stopOpacity=".92" /></linearGradient>
        <linearGradient id="k86-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#8f641c" /></linearGradient>
        <clipPath id="k86-label-clip"><rect x="350" y="245" width="100" height="78" rx="3" /></clipPath>

        <linearGradient id="k86-padbody" x1=".2" y1="0" x2=".7" y2="1"><stop offset="0" stopColor="#c1c6ab" /><stop offset=".3" stopColor="#9ba58a" /><stop offset=".7" stopColor="#7a876e" /><stop offset="1" stopColor="#53614e" /></linearGradient>
        <linearGradient id="k86-padedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6a765d" /><stop offset=".5" stopColor="#404d3b" /><stop offset="1" stopColor="#222e24" /></linearGradient>
        <linearGradient id="k86-padwell" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stopColor="#18231d" /><stop offset="1" stopColor="#465440" /></linearGradient>
        <linearGradient id="k86-pad-dpad" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stopColor="#4e5b4b" /><stop offset=".4" stopColor="#29382d" /><stop offset="1" stopColor="#121e17" /></linearGradient>
        <linearGradient id="k86-pad-button-gloss" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".45" /><stop offset=".48" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" /></linearGradient>
      </defs>

      {/* La habitacion: pared de listones, mesa de nogal y la luz de la lampara. */}
      <g mask="url(#k86-fade)">
        <rect width="800" height="306" fill="url(#k86-wall)" />
        <rect width="800" height="306" fill="url(#k86-boards)" />
        <ellipse cx="400" cy="236" rx="330" ry="196" fill="url(#k86-pool)" />
        <ellipse className="k86-wash" cx="160" cy="250" rx="300" ry="190" fill="url(#k86-wash)" />
        <polygon points="70,306 730,306 830,420 -30,420" fill="url(#k86-walnut)" />
        <polygon points="70,306 730,306 830,420 -30,420" fill="#0000004d" />
        <polygon points="70,306 730,306 830,420 -30,420" fill="url(#k86-desklight)" />
        <ellipse className="k86-wash" cx="170" cy="340" rx="260" ry="80" fill="url(#k86-wash)" />
        <line x1="70" y1="306.5" x2="730" y2="306.5" stroke="#f3c58a" strokeOpacity=".22" />
      </g>

      {/* Letrero de neon en la pared: tubo apagado, parpadea al encajar y se
          enciende con el color del cartucho al arrancar. */}
      <g className="k86-neon">
        <ellipse className="k86-neon-halo" cx="652" cy="168" rx="110" ry="58" fill="url(#k86-wash)" />
        <rect x="586" y="140" width="132" height="54" rx="12" fill="#0a100c" fillOpacity=".55" stroke="#0a100c" />
        <circle cx="598" cy="146" r="1.6" fill="#4b5446" /><circle cx="706" cy="146" r="1.6" fill="#4b5446" />
        <g className="k86-neon-tube">
          <rect x="592" y="146" width="120" height="42" rx="9" />
          <text x="652" y="175">GAME ON</text>
        </g>
      </g>
      <g mask="url(#k86-fade)">
        <rect x="-30" y="420" width="860" height="26" fill="url(#k86-deskedge)" />
        <line x1="-30" y1="420.5" x2="830" y2="420.5" stroke="#f3c58a" strokeOpacity=".35" />
      </g>

      {/* La tele: la carcasa de atras asoma arriba y a la derecha (el fondo de
          la caja), tubo abombado en un marco biselado, dial de canales con su
          LED (gira al canal del juego al encender) y antena telescopica. */}
      <g className="k86-tv">
        <ellipse cx="134" cy="326" rx="122" ry="11" fill="url(#k86-shadow)" />
        <path d="M50 314 L42 327 H60 L67 314 Z M194 314 L201 327 H219 L211 314 Z" fill="#0a100b" />
        <g fill="none" strokeLinecap="round">
          <path d="M124 160 L112 136" stroke="#7b8470" strokeWidth="3.2" /><path d="M112 136 L101 113" stroke="#949c85" strokeWidth="2.3" /><path d="M101 113 L91 92" stroke="#b5bca4" strokeWidth="1.5" />
          <path d="M140 160 L153 135" stroke="#7b8470" strokeWidth="3.2" /><path d="M153 135 L165 112" stroke="#949c85" strokeWidth="2.3" /><path d="M165 112 L176 90" stroke="#b5bca4" strokeWidth="1.5" />
        </g>
        <g fill="#596150"><circle cx="112" cy="136" r="2" /><circle cx="101" cy="113" r="1.5" /><circle cx="153" cy="135" r="2" /><circle cx="165" cy="112" r="1.5" /></g>
        <circle cx="91" cy="92" r="3.3" fill="url(#k86-knobcap)" /><circle cx="176" cy="90" r="3.3" fill="url(#k86-knobcap)" />
        <rect x="44" y="160" width="190" height="152" rx="18" fill="url(#k86-tvshell)" />
        <rect className="k86-material-grain" x="44" y="160" width="190" height="152" rx="18" filter="url(#k86-case-grain)" />
        <path d="M225 181 V287 M228 184 V284 M231 188 V280" stroke="#111e15" strokeWidth="1.5" strokeOpacity=".65" />
        <ellipse cx="132" cy="164" rx="22" ry="5.5" fill="#1d261c" />
        <path d="M115 164 C117 150 147 150 149 164 Z" fill="url(#k86-knob)" />
        <rect x="30" y="170" width="190" height="152" rx="18" fill="url(#k86-plastic)" stroke="#8a977f" strokeWidth="1.2" />
        <rect className="k86-material-grain" x="30" y="170" width="190" height="152" rx="18" filter="url(#k86-case-grain)" />
        <path d="M48 171 H202" stroke="#e3e8c8" strokeOpacity=".35" />
        <rect x="34" y="174" width="182" height="144" rx="15" fill="none" stroke="#c1c6a4" strokeOpacity=".12" />
        <path d="M37 298 V307 Q37 317 48 317 H191" fill="none" stroke="#18281c" strokeWidth="2" />
        <path d="M36 188 Q38 177 49 177 H78 M37 305 Q38 315 48 315 H68 M194 176 H201" fill="none" stroke="#c1caae" strokeOpacity=".4" strokeWidth=".8" strokeLinecap="round" />
        <rect x="178" y="179" width="36" height="122" rx="4" fill="#203124" stroke="#a0af91" strokeOpacity=".25" strokeWidth=".7" />
        <rect x="178" y="179" width="36" height="122" rx="4" fill="url(#k86-case-brushed)" />
        <rect x="40" y="180" width="134" height="124" rx="15" fill="#0b120d" />
        <rect x="41.5" y="181.5" width="131" height="121" rx="14" fill="none" stroke="url(#k86-chamfer)" strokeWidth="3" />
        <ellipse className="k86-tv-bloom" cx="107" cy="242" rx="72" ry="66" fill="url(#k86-wash)" />
        <path d={SCREEN} fill="url(#k86-crt)" />
        <g clipPath="url(#k86-screen-clip)">
          <rect className="k86-static is-a" x="48" y="184" width="118" height="116" filter="url(#k86-noise-a)" />
          <rect className="k86-static is-b" x="48" y="184" width="118" height="116" filter="url(#k86-noise-b)" />
          <g className="k86-tv-picture">
            <image href={game.image} x="48" y="184" width="118" height="116" preserveAspectRatio="xMidYMid slice" />
            <text className="k86-osd" x="62" y="206">CH {channel}</text>
          </g>
          <rect className="k86-tv-line" x="48" y="240" width="118" height="3" />
          <rect x="48" y="184" width="118" height="116" fill="url(#k86-scan)" />
          <rect x="48" y="184" width="118" height="116" fill="url(#k86-vignette)" />
        </g>
        <path d={SCREEN} fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="1.5" />
        <path d="M62 198 Q92 191 122 195 Q98 202 70 220 Q62 210 62 198 Z" fill="url(#k86-glare)" />
        <path d="M150 200 Q156 208 157 220" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
        <rect x="181" y="185" width="32" height="15" rx="2.5" fill="#0d0706" stroke="#2a3326" />
        <text className="k86-tv-channel" x="197" y="196.5">{channel}</text>
        <g transform="translate(197 224)">
          <path d={DIAL_TICKS} stroke="#c8ccb4" strokeOpacity=".5" />
          <circle r="12.5" fill="#121a13" />
          <g className="k86-tv-dial">
            <circle r="11" fill="url(#k86-knob)" />
            <circle r="11" fill="none" stroke="#0c120d" strokeWidth="1.6" strokeDasharray="1.2 1.4" />
            <circle r="6" fill="url(#k86-knobcap)" />
            <path d="M0 -2 L0 -9.5" stroke="#f1f3e2" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
        <g transform="translate(197 252)">
          <path d={VOLUME_TICKS} stroke="#c8ccb4" strokeOpacity=".4" />
          <circle r="8" fill="url(#k86-knob)" />
          <circle r="8" fill="none" stroke="#0c120d" strokeWidth="1.3" strokeDasharray="1 1.2" />
          <circle r="4" fill="url(#k86-knobcap)" />
          <path d="M-1.5 -1.5 L-5 -5" stroke="#f1f3e2" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <g>{[0, 1, 2, 3, 4].map((row) => <g key={row}><rect x="183" y={268 + row * 7} width="28" height="3.6" rx="1.8" fill="#08110b" /><path d={`M185 ${272 + row * 7} H209`} stroke="#8b9b7f" strokeOpacity=".4" strokeWidth=".6" /></g>)}</g>
        <rect x="86" y="308" width="42" height="9" rx="2" fill="url(#k86-chrome)" stroke="#232b20" strokeWidth=".8" />
        <text className="k86-tv-brand" x="107" y="315">DAIVR</text>
        <rect x="44" y="309" width="15" height="7" rx="2" fill="#bfc3aa" stroke="#4f574a" strokeWidth=".8" />
        <circle className="k86-tv-led" cx="66" cy="312.5" r="2.4" />
        <CaseScrew x={207} y={310} small />
        <path d="M144 310 H168 M149 312 H162" stroke="#b6c2a4" strokeOpacity=".22" strokeWidth=".6" />
      </g>
      <path d="M232 296 C 250 300, 240 330, 254 334" fill="none" stroke="#0d130c" strokeWidth="3.5" strokeLinecap="round" />

      {/* Station 86. */}
      <g className="k86-console">
        <ellipse cx="400" cy="405" rx="205" ry="13" fill="url(#k86-shadow)" />
        <rect x="246" y="394" width="28" height="8" rx="2" fill="#070b07" /><rect x="526" y="394" width="28" height="8" rx="2" fill="#070b07" />
        <polygon points="256,290 544,290 572,340 228,340" fill="url(#k86-top)" stroke="#a2a78e" strokeOpacity=".7" />
        <polygon className="k86-material-grain" points="256,290 544,290 572,340 228,340" filter="url(#k86-case-grain)" />
        <polygon points="260,294 540,294 563,335 237,335" fill="none" stroke="#243522" strokeOpacity=".5" strokeWidth=".7" />
        <path d="M260 295 H540 M238 336 H562" fill="none" stroke="#d5d9b8" strokeOpacity=".4" strokeWidth=".7" />
        <ellipse cx="400" cy="314" rx="160" ry="24" fill="url(#k86-hot)" />
        <rect x="272" y="296" width="256" height="4" fill="url(#k86-vent)" />
        <rect x="268" y="302" width="264" height="4" fill="url(#k86-vent)" />
        <g transform="translate(0 93) scale(1 .7)"><CaseScrew x={264} y={322} /><CaseScrew x={536} y={322} /></g>
        <path d="M251 329 H275 M253 327 H262 M519 310 L527 322 M521 310 L525 316" stroke="#e1dfbe" strokeOpacity=".25" strokeWidth=".65" strokeLinecap="round" />
        <polygon points="336,313 464,313 470,326 330,326" fill="url(#k86-slot)" />
        <polygon className="k86-slot-light" points="336,313 464,313 470,326 330,326" />
        <ellipse className="k86-slot-glow" cx="400" cy="318" rx="120" ry="30" fill="url(#k86-slotglow)" />
        <ellipse className="k86-cart-shadow" cx="404" cy="322" rx="86" ry="11" fill="url(#k86-shadow)" />

        <g clipPath="url(#k86-cart-clip)">
          <g className="k86-cart">
            <polygon points="460,232 467,237 467,361 460,364" fill="#141b12" />
            <rect x="340" y="228" width="120" height="136" rx="7" fill="url(#k86-cartbody)" stroke="#4a5843" />
            <path d="M352 232 h11 v7 h-11z M369 232 h11 v7 h-11z M386 232 h11 v7 h-11z M403 232 h11 v7 h-11z M420 232 h11 v7 h-11z M437 232 h11 v7 h-11z" fill="#0d130c" />
            <g clipPath="url(#k86-label-clip)">
              <rect x="350" y="245" width="100" height="78" fill="#010503" />
              <image href={game.image} x="350" y="245" width="100" height="78" preserveAspectRatio="xMidYMid slice" />
              <rect x="350" y="283" width="100" height="40" fill="url(#k86-labelfade)" />
            </g>
            <rect className="k86-cart-frame" x="350" y="245" width="100" height="78" rx="3" />
            <text className="k86-cart-program" x="356" y="307">{game.program}</text>
            <text className="k86-cart-title" x="356" y="318" {...(longTitle ? { textLength: 88, lengthAdjust: "spacingAndGlyphs" } : {})}>{game.title}</text>
            <rect x="340" y="228" width="120" height="136" rx="7" fill="url(#k86-gloss)" />
            <rect x="360" y="346" width="80" height="15" rx="1" fill="#09110a" />
            <path d="M365 348 h6 v11 h-6z M375 348 h6 v11 h-6z M385 348 h6 v11 h-6z M395 348 h6 v11 h-6z M405 348 h6 v11 h-6z M415 348 h6 v11 h-6z M425 348 h6 v11 h-6z" fill="url(#k86-gold)" />
          </g>
        </g>
        <polygon points="328,326 472,326 475,331 325,331" fill="#cfd3b8" />
        <line x1="325" y1="331.5" x2="475" y2="331.5" stroke="#1b2418" />
        <text className="k86-slot-label" x="400" y="338">INSERT THIS SIDE ▼</text>

        <path d="M228 340 H572 V388 Q572 396 564 396 H236 Q228 396 228 388 Z" fill="url(#k86-front)" />
        <path className="k86-material-grain" d="M228 340 H572 V388 Q572 396 564 396 H236 Q228 396 228 388 Z" filter="url(#k86-case-grain)" />
        <path d="M243 353 H557 V392 H243 Z" fill="url(#k86-case-brushed)" />
        <path d="M228 340 H242 V396 H236 Q228 396 228 388 Z" fill="url(#k86-walnut)" />
        <path d="M558 340 H572 V388 Q572 396 564 396 H558 Z" fill="url(#k86-walnut)" />
        <g fill="none" strokeLinecap="round"><path d="M231 344 V386 Q232 391 239 392 M561 345 V391" stroke="#bb8852" strokeOpacity=".35" strokeWidth="1.1" /><path d="M235 350 Q238 363 234 383 M566 347 Q562 372 568 388" stroke="#0a0e07" strokeOpacity=".6" strokeWidth="1.2" /></g>
        <path d="M242 350 V394 M557 350 V394 M243 390 H557" stroke="#0b170f" strokeWidth="1.2" />
        <path d="M244 392 H555" stroke="#a9b092" strokeOpacity=".2" strokeWidth=".7" />
        <path d="M228 340 H572 L570 344 H230 Z" fill="url(#k86-chrome)" opacity=".4" />
        <line x1="228" y1="340.5" x2="572" y2="340.5" stroke="#e3e4c7" strokeOpacity=".5" />
        <rect className="k86-stripe" x="242" y="347" width="316" height="2.5" />
        <text className="k86-logo" x="256" y="372">STATION<tspan dx="4">86</tspan></text>
        <text className="k86-small" x="257" y="384">HOME ARCADE SYSTEM</text>
        <rect x="384" y="357" width="64" height="22" rx="3" fill="#050d07" stroke="#969b73" strokeOpacity=".35" />
        <text className="k86-display" x="416" y="372">{DISPLAY[phase] || "— —"}</text>
        <rect x="462" y="361" width="26" height="10" rx="2" fill="#080f07" stroke="#8b9672" strokeOpacity=".45" />
        <rect className="k86-power-knob" x="463.5" y="362.5" width="11" height="7" rx="1" />
        <circle className="k86-power-led" cx="496" cy="366" r="3" />
        <text className="k86-small" x="462" y="384">POWER</text>
        <rect x="506" y="361" width="20" height="10" rx="2" fill="#c3c6ae" stroke="#5f6651" />
        <path d="M508 369 H524 M511 363 V367 M515 363 V367 M519 363 V367 M523 363 V367" stroke="#5b6751" strokeOpacity=".5" strokeWidth=".7" />
        <text className="k86-small" x="507" y="384">RESET</text>
        <rect x="536" y="356" width="16" height="12" rx="2.5" fill="#0a1109" stroke="#7d8463" />
        <rect x="536" y="373" width="16" height="12" rx="2.5" fill="#0a1109" stroke="#7d8463" />
      </g>

      {/* El mando tumbado en la mesa (escala vertical = perspectiva), con su
          grosor, gatillos, cruceta en relieve y cuatro botones del color del
          cartucho. El cable sale por arriba hacia el puerto 1. */}
      <path d="M551 365 C595 362 619 337 659 346 C688 352 678 362 678 367" fill="none" stroke="#000" strokeOpacity=".3" strokeWidth="7" strokeLinecap="round" />
      <path d="M551 362 C595 359 619 334 659 343 C688 349 678 359 678 364" fill="none" stroke="#0c1510" strokeWidth="4.6" strokeLinecap="round" />
      <path d="M551 361 C595 358 619 333 659 342 C688 348 678 358 678 363" fill="none" stroke="#71806a" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
      <rect x="542" y="358" width="12" height="8" rx="2" fill="url(#k86-padedge)" stroke="#8c9879" strokeWidth=".6" />
      <path d="M551 360 V364 M554 360 V364 M557 359.5 V363.5" stroke="#18231a" strokeWidth="1.5" />
      <g transform="translate(682 393) rotate(-8)">
        <ellipse cx="3" cy="23" rx="88" ry="19" fill="url(#k86-shadow)" />
        <g transform="scale(1 .86)">
          <rect x="-4" y="-39" width="8" height="16" rx="3" fill="#1b281e" />
          <path d="M-3 -36 H3 M-3 -33 H3 M-3 -30 H3" stroke="#64715b" strokeWidth="1" />
          <path d="M-67 -22 Q-63 -39 -39 -39 Q-30 -39 -25 -30 M67 -22 Q63 -39 39 -39 Q30 -39 25 -30" fill="url(#k86-pad-dpad)" stroke="#8b977d" strokeWidth="1.2" />
          <path d={PAD} transform="translate(0 7)" fill="url(#k86-padedge)" stroke="#18251c" strokeWidth="1.5" />
          <path d={PAD} transform="translate(0 3)" fill="#263528" stroke="#8c987d" strokeOpacity=".3" />
          <path d={PAD} fill="url(#k86-padbody)" stroke="#c9cfb6" strokeWidth="1.1" />
          <path className="k86-material-grain" d={PAD} filter="url(#k86-case-grain)" />
          <path d={PAD} transform="scale(.95 .9)" fill="none" stroke="#edf0d7" strokeOpacity=".22" strokeWidth=".8" />
          <path d="M-69 -12 Q-64 -29 -45 -30 M-18 -24 H13 Q27 -24 34 -29" fill="none" stroke="#f3f0d4" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-42" cy="1" r="23.5" fill="url(#k86-padwell)" stroke="#d1d6bd" strokeOpacity=".45" />
          <circle className="k86-material-grain" cx="-42" cy="1" r="23.5" filter="url(#k86-case-grain)" />
          <circle cx="-42" cy="0" r="21.5" fill="none" stroke="#0e1a12" strokeOpacity=".7" />
          <path d={CROSS} transform="translate(0 3.5)" fill="#0a120d" stroke="#0a120d" strokeWidth="2" strokeLinejoin="round" />
          <path d={CROSS} fill="url(#k86-pad-dpad)" stroke="#75816c" strokeWidth=".8" strokeLinejoin="round" />
          <path d="M-45 -9 L-42 -12 L-39 -9 M-45 9 L-42 12 L-39 9 M-51 -3 L-54 0 L-51 3 M-33 -3 L-30 0 L-33 3" fill="none" stroke="#a1ae92" strokeOpacity=".45" strokeWidth=".9" />
          <circle cx="-42" cy="0" r="3.3" fill="#17251a" stroke="#738269" strokeOpacity=".35" />
          <text className="k86-pad-brand" x="0" y="-14">STATION<tspan className="k86-pad-model" x="0" dy="6">— 86 —</tspan></text>
          {[-10, 10].map((x) => <g key={x} transform={`translate(${x} 5) rotate(-24)`}><rect x="-6.8" y="-3" width="13.6" height="7.5" rx="3.5" fill="#516047" stroke="#c3cbb0" strokeWidth=".6" /><rect x="-5.5" y="-3.2" width="11" height="5" rx="2.5" fill="url(#k86-pad-dpad)" /><path d="M-3 -2 H3" stroke="#b3bca4" strokeOpacity=".5" strokeLinecap="round" /></g>)}
          <text className="k86-pad-label" x="-11" y="18">SELECT</text><text className="k86-pad-label" x="11" y="18">START</text>
          <circle cx="42" cy="1" r="26" fill="url(#k86-padwell)" stroke="#d1d6bd" strokeOpacity=".45" />
          <circle className="k86-material-grain" cx="42" cy="1" r="26" filter="url(#k86-case-grain)" />
          <circle cx="42" cy="0" r="24.3" fill="none" stroke="#0e1a12" strokeOpacity=".7" />
          {BUTTONS.map(([name, x, y, label]) => <g key={name}>
            <circle cx={x} cy={y + 1.5} r="7.5" fill="#0b170f" />
            <circle cx={x} cy={y + 2} r="6.5" fill="#281e18" />
            <circle className={`k86-pad-btn ${name}`} cx={x} cy={y - 1} r="6.3" />
            <circle cx={x} cy={y - 1} r="6.3" fill="url(#k86-pad-button-gloss)" />
            <path d={`M${x - 3.6} ${y - 4} Q${x} ${y - 6} ${x + 2.8} ${y - 4.5}`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".7" strokeLinecap="round" />
            <text className="k86-pad-button-letter" x={x} y={y + 1}>{label}</text>
          </g>)}
          <path d="M-62 23 L-57 26 M-59 20 L-54 23 M-56 25 L-51 28 M54 26 L59 23 M57 20 L62 17" fill="none" stroke="#e6e9cb" strokeOpacity=".25" strokeWidth=".7" strokeLinecap="round" />
          <CaseScrew x={-19} y={-18} small /><CaseScrew x={19} y={-18} small />
        </g>
      </g>
    </svg>
  );
}

// Lampara colgante sobre la escena (konami-loader.css .konami-loader-shade):
// florón en el techo, cable, casquillo, pantalla esmaltada con su brillo y la
// boca encendida con la bombilla asomando. El halo se apaga dentro de su caja.
export function KonamiLoaderLamp() {
  return (
    <svg className="konami-loader-shade" viewBox="0 0 140 110" aria-hidden="true" focusable="false">
      <defs>
        <MaterialDefs prefix="k86-lamp" />
        <linearGradient id="k86-lamp-enamel" x1="0" y1=".2" x2="1" y2=".6"><stop offset="0" stopColor="#14251e" /><stop offset=".18" stopColor="#3e5844" /><stop offset=".32" stopColor="#708168" /><stop offset=".43" stopColor="#4e6850" /><stop offset=".7" stopColor="#283f30" /><stop offset="1" stopColor="#0d2019" /></linearGradient>
        <linearGradient id="k86-lamp-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4f4128" /><stop offset=".3" stopColor="#d0bd83" /><stop offset=".5" stopColor="#9a895a" /><stop offset="1" stopColor="#3f3826" /></linearGradient>
        <linearGradient id="k86-lamp-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#91a080" /><stop offset=".35" stopColor="#4c6047" /><stop offset=".65" stopColor="#172c20" /><stop offset="1" stopColor="#b7aa78" /></linearGradient>
        <linearGradient id="k86-lamp-reflection" x1="0" y1="0" x2="1" y2=".5"><stop offset="0" stopColor="#edf0cc" stopOpacity=".35" /><stop offset="1" stopColor="#e3ecc5" stopOpacity="0" /></linearGradient>
        <radialGradient id="k86-lamp-inner" cx=".5" cy=".7" r=".65"><stop offset="0" stopColor="#fffce8" /><stop offset=".4" stopColor="#ffe1a0" /><stop offset=".8" stopColor="#b38b4c" /><stop offset="1" stopColor="#3d3723" /></radialGradient>
        <radialGradient id="k86-lamp-bulb"><stop offset="0" stopColor="#fff" /><stop offset=".45" stopColor="#fff2c8" /><stop offset="1" stopColor="#ffcf7a" stopOpacity="0" /></radialGradient>
        <radialGradient id="k86-lamp-halo"><stop offset="0" stopColor="#ffe3a8" stopOpacity=".55" /><stop offset=".5" stopColor="#ffd28a" stopOpacity=".16" /><stop offset="1" stopColor="#ffd28a" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="70" cy="96" rx="69" ry="14" fill="url(#k86-lamp-halo)" />
      <path d="M55 0 H85 L88 4 Q70 8 52 4 Z" fill="url(#k86-lamp-enamel)" stroke="#839076" strokeOpacity=".3" />
      <path d="M70 6 V31" stroke="#0b130e" strokeWidth="3.4" />
      <path d="M69.2 6 V31" stroke="#83917a" strokeOpacity=".5" strokeWidth=".7" />
      <rect x="65" y="28" width="10" height="12" rx="2" fill="url(#k86-lamp-metal)" />
      <path d="M65 32 H75 M65 35 H75" stroke="#2e3020" strokeOpacity=".5" />
      <ellipse cx="70" cy="40" rx="13" ry="3" fill="#192c20" stroke="#8a9775" strokeOpacity=".45" />
      <path d={LAMP_SHADE} fill="url(#k86-lamp-enamel)" stroke="#8f9e7f" strokeOpacity=".3" strokeWidth=".7" />
      <path className="k86-material-grain is-enamel" d={LAMP_SHADE} filter="url(#k86-lamp-grain)" />
      <path d="M62 43 C54 47 50 51 47 59 Q37 79 24 85 Q34 86 40 87 C48 74 49 55 65 44 Z" fill="url(#k86-lamp-reflection)" />
      <path d="M52 48 Q70 43 88 48" fill="none" stroke="#dce3b7" strokeOpacity=".35" strokeLinecap="round" />
      <path d="M44 55 Q70 62 96 55" fill="none" stroke="#10261a" strokeWidth="1.5" />
      <path d="M43 57 Q70 64 97 57" fill="none" stroke="#bac69d" strokeOpacity=".3" strokeWidth=".8" />
      <path d="M34 77 L38 72 M37 78 L39 75 M92 65 L95 70 M49 53 L51 50 M103 80 L107 84" fill="none" stroke="#c7cbaa" strokeOpacity=".35" strokeWidth=".6" strokeLinecap="round" />
      <g fill="#13291d" stroke="#a8b48d" strokeOpacity=".18" strokeWidth=".6">{[55, 62, 69, 76, 83].map((x) => <rect key={x} x={x} y="49" width="2.5" height="4" rx="1.2" />)}</g>
      <ellipse cx="70" cy="90" rx="55" ry="8.2" fill="url(#k86-lamp-rim)" />
      <ellipse cx="70" cy="90" rx="55" ry="8.2" fill="url(#k86-lamp-brushed)" />
      <ellipse cx="70" cy="91" rx="50" ry="5.8" fill="#1e291b" />
      <ellipse cx="70" cy="91.7" rx="47" ry="4.6" fill="url(#k86-lamp-inner)" />
      <path d="M18 90 Q70 101 122 90" fill="none" stroke="#c3b985" strokeOpacity=".75" strokeWidth="1" />
      <path d="M24 93 L31 94 M37 95 L40 95.5 M105 94 L111 93" fill="none" stroke="#efe0b0" strokeOpacity=".7" strokeWidth=".85" strokeLinecap="round" />
      <ellipse cx="70" cy="95" rx="20" ry="10" fill="url(#k86-lamp-bulb)" />
      <path d="M64 93 Q64 99 70 99 Q76 99 76 93" fill="#fff9de" />
    </svg>
  );
}
