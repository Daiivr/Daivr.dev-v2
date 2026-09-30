function FishBody({ color, accent = "#f4fff8", tail = "normal", long = false }) {
  return (
    <g shapeRendering="crispEdges">
      <g className="buddy-fish-tail"><path d="M14 19H9v-4H6v-3H2v18h4v-3h3v-4h5z" fill={color} /><path d="M3 15h3v5h5v2H6v5H3z" fill={accent} opacity=".45" /></g>
      <path d={long ? "M10 18h6v-4h7v-2h17v3h7v3h5v7h-5v3h-8v3H22v-2h-6v-4h-6z" : "M11 18h5v-5h7v-3h13v3h8v4h6v9h-6v4h-8v3H23v-3h-7v-5h-5z"} fill={color} />
      <path d="M18 25h6v3h14v-2h8v3h-7v3H24v-2h-6z" fill="#041b2b" opacity=".32" />
      <path d="M20 14h6v-2h10v2h6v3H22v3h-6v-3h4z" fill={accent} opacity=".65" />
      <path d="M23 10V6h4V3h4v7M24 31v4h4v3h4v-7" fill={color} />
      <path className="buddy-fish-fin" d="M28 22h8v3h-3v4h-5z" fill={accent} opacity=".7" />
      <path d="M19 21h3v2h-3zm5-3h3v2h-3zm0 7h3v2h-3z" fill={accent} opacity=".35" />
      {tail === "star" ? <path d="M9 21 2 12l3 9-3 9z" fill="#ffd166" /> : null}
      <path d="M36 18v7h-2v-7z" fill="#041b2b" opacity=".35" />
      <rect x="39" y="17" width="6" height="6" fill="#f4fff8" />
      <rect x="42" y="18" width="3" height="4" fill="#071322" />
      <rect x="42" y="18" width="1" height="1" fill="#fff" />
      <path d="M46 25h4v2h-4z" fill="#041b2b" opacity=".65" />
    </g>
  );
}

export function BuddyCollectibleIcon({ id, color = "#45d8ff", unknown = false, className = "", ...svgProps }) {
  if (unknown) {
    return (
      <svg className={`buddy-collectible-icon is-unknown ${className}`} viewBox="0 0 56 42" aria-hidden="true">
        <FishBody color="#17372a" accent="#214b39" />
        <text x="25" y="25" fill="#3b7459" fontFamily="monospace" fontSize="14" fontWeight="900">?</text>
      </svg>
    );
  }

  let artwork;
  switch (id) {
    case "byte-minnow": artwork = <><FishBody color={color} /><rect x="18" y="21" width="4" height="3" fill="#020604" /><rect x="25" y="21" width="4" height="3" fill="#020604" /></>; break;
    case "cache-carp": artwork = <><FishBody color={color} accent="#b8f7ff" /><rect x="15" y="17" width="5" height="5" fill="#159c65" /><rect x="27" y="22" width="5" height="5" fill="#159c65" /></>; break;
    case "pixel-perch": artwork = <><FishBody color={color} accent="#ff8c69" /><path d="M18 12h4V7h4v5h4V7h4v5" fill="#ff8c69" /></>; break;
    case "buffer-bass": artwork = <><FishBody color={color} accent="#45d8ff" long /><rect x="16" y="17" width="6" height="3" fill="#071b1c" /><rect x="24" y="17" width="12" height="3" fill="#f4fff8" /><rect x="16" y="23" width="18" height="3" fill="#246c8d" /></>; break;
    case "cursor-guppy": artwork = <><FishBody color={color} accent="#45d8ff" /><rect x="20" y="16" width="3" height="11" fill="#020604" /><rect x="23" y="24" width="7" height="3" fill="#020604" /></>; break;
    case "ping-sardine": artwork = <><FishBody color={color} accent="#b8f7ff" long /><path d="M13 9c7-6 17-6 24 0M16 6c5-4 12-4 17 0" fill="none" stroke="#45d8ff" strokeWidth="2" /></>; break;
    case "syntax-salmon": artwork = <><FishBody color={color} accent="#ffd166" long /><path d="M18 19h4v4h4v-4h4v4h4v-4" fill="none" stroke="#ffd166" strokeWidth="2" /></>; break;
    case "neon-tetra": artwork = <><FishBody color={color} accent="#45d8ff" /><rect x="15" y="20" width="25" height="3" fill="#45d8ff" /><rect x="23" y="25" width="13" height="2" fill="#f4fff8" /></>; break;
    case "circuit-catfish": artwork = <><FishBody color={color} accent="#ffd166" long /><path d="M43 23h9v-5m-9 8h11v5M19 16h4v4h5v5h5" fill="none" stroke="#b8f7ff" strokeWidth="2" /></>; break;
    case "cobalt-cod": artwork = <><FishBody color={color} accent="#67e8f9" /><rect x="18" y="12" width="4" height="18" fill="#172554" /><rect x="28" y="12" width="4" height="18" fill="#172554" /><rect x="38" y="15" width="3" height="12" fill="#172554" /></>; break;
    case "packet-puffer": artwork = <g shapeRendering="crispEdges"><path d="M11 16H6v-4H2v17h4v-4h5M14 10h6V6h18v4h7v7h5v12h-5v6h-7v3H20v-3h-6v-6H9V17h5z" fill={color} /><path d="M16 26h5v5h21v-4h5v7h-8v4H21v-3h-5z" fill="#c48635" /><path d="M18 12h5V9h14v4H23v4h-8v-3h3z" fill="#fff3b0" /><path d="M18 7V2h3v5m12-1V1h3v6m10 8h6v3h-6M17 34v6h3v-5m17 0v6h3v-7" fill="#f78c61" /><path d="M20 20h3v3h-3m7-7h3v3h-3m0 11h3v3h-3m6-4h3v3h-3" fill="#b8782c" /><path className="buddy-fish-fin" d="M28 25h8v3h-4v4h-4z" fill="#ffe99a" /><rect x="39" y="16" width="7" height="7" fill="#fff9d8" /><rect x="43" y="18" width="3" height="4" fill="#18262b" /><path d="M47 25h4v2h-4" fill="#18262b" /></g>; break;
    case "void-eel": artwork = <><path d="M3 26h4v-8h9v3h6v7h6v-5h5v-9h13v3h6v10h-9v-3h-3v7h-7v5H20v-6h-8v-4H8v8H3z" fill={color} /><path d="M8 19h7v3h7v7h6v-5h6v-8h11" fill="none" stroke="#eadbff" strokeWidth="2" /><path d="M12 25h5v3h-5m10 6h7v-2m7-9h4" stroke="#43306f" strokeWidth="2" /><rect x="45" y="18" width="5" height="5" fill="#fff" /><rect x="48" y="19" width="2" height="3" fill="#ff3d9d" /></>; break;
    case "glitch-koi": artwork = <><FishBody color={color} accent="#45d8ff" /><rect x="17" y="14" width="7" height="7" fill="#f4fff8" /><rect x="28" y="22" width="8" height="6" fill="#45d8ff" /><rect x="5" y="8" width="9" height="3" fill="#ff3d9d" opacity=".65" /></>; break;
    case "recursion-ray": artwork = <g shapeRendering="crispEdges"><path d="M9 23H3v-3h14v-5h5V9h6V3h4v8h8v4h7v4h5v7h-5v4h-7v4h-8v5h-4v-6h-6v-5h-5v-5z" fill={color} /><path d="M24 15h6V9h2v6h7v4h6v6h-6v4h-7v5h-2v-6h-6v-5h-6v-4h6z" fill="#167a9f" /><path d="M29 18h7v3h5v3h-5v4h-7v-4h-5v-3h5z" fill="#b8f7ff" /><path d="M2 20h12v2H5v4H1" fill="#b8f7ff" /><rect x="41" y="17" width="3" height="3" fill="#061b30" /><rect x="41" y="26" width="3" height="3" fill="#061b30" /><path d="M46 21h5v2h-5" fill="#061b30" /></g>; break;
    case "firewall-fangfish": artwork = <><FishBody color={color} accent="#ffd166" /><path d="m40 22 5-5v10zm-7 0 4-4v8z" fill="#f4fff8" /><path d="M14 12V6m7 6V4m7 8V6" stroke="#ff8c69" strokeWidth="3" /></>; break;
    case "prism-piranha": artwork = <><FishBody color={color} accent="#f4fff8" /><path d="m17 13 6 8-6 8-6-8zm12 0 6 8-6 8-6-8z" fill="#45d8ff" /><path d="m35 14 6 7-6 7" fill="#ffd166" /></>; break;
    case "starfin": artwork = <><FishBody color={color} accent="#f4fff8" tail="star" /><path d="m28 8 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#f4fff8" /></>; break;
    case "crown-coelacanth": artwork = <><FishBody color={color} accent="#8a5428" long /><path d="M18 11V4l5 4 5-6 5 6 6-4v7z" fill="#ffd166" /><rect x="15" y="20" width="25" height="4" fill="#9a651f" /></>; break;
    case "aurora-arowana": artwork = <><FishBody color={color} accent="#c084fc" long /><path d="M13 16h8v-4h8v4h8v-4h8v5" fill="none" stroke="#3fff97" strokeWidth="3" /><path d="M15 25h9v4h9v-4h9" fill="none" stroke="#a78bfa" strokeWidth="3" /></>; break;
    case "chrono-manta": artwork = <g shapeRendering="crispEdges"><path d="M3 23 19 7h21l13 16-13 8H19z" fill={color} /><path d="M25 12h10v10H25z" fill="#f4fff8" /><path d="M30 14v5l4 2" fill="none" stroke="#5b21b6" strokeWidth="2" /><path d="M18 30 9 40h14l7-9" fill="#7c3aed" /><rect x="42" y="18" width="3" height="3" fill="#020604" /></g>; break;
    case "moonkernel-sturgeon": artwork = <><FishBody color={color} accent="#a78bfa" long /><rect x="16" y="12" width="5" height="17" fill="#6b7280" /><rect x="24" y="12" width="5" height="17" fill="#94a3b8" /><rect x="32" y="13" width="5" height="15" fill="#6b7280" /><circle cx="25" cy="21" r="7" fill="#f4fff8" /><path d="M25 14a7 7 0 0 0 0 14 5 5 0 0 1 0-14" fill="#a78bfa" /></>; break;
    case "old-boot": artwork = <g shapeRendering="crispEdges"><path d="M12 4h22v21h9v3h7v10H7V17h5z" fill="#1d302c" />
<path d="M14 6h18v20h10v4h6v5H9V19h5z" fill="#657c69" />
<path d="M15 7h14v4H15zM11 21h3v10h-3" fill="#a4b39a" />
<path d="M23 13h9v3h-9m0 3h9v3h-9m0 3h9v3h-9" fill="#c7bf9b" />
<path d="M29 12h3v14h-3m-12-9h3v13h-3m3-4h5v5h-5" fill="#354d40" />
<path d="M8 34h41v4H8zM10 38h6v2h-6m6-2h6v2h-6m7-2h6v2h-6m7-2h6v2h-6" fill="#27372e" />
<path d="M36 27h4v3h-4m-21 0h4v2h-4" fill="#c49b68" /><path d="M12 8h2v7h-2m-2 7h2v5h-2" fill="#55a785" /></g>; break;
    case "soggy-disk":
      artwork = <g shapeRendering="crispEdges"><path d="M9 3h31v3h4v4h4v29H7V3z" fill="#1b3433" />
<path d="M9 5h30v3h4v4h3v24H9z" fill={color} />
<path d="M10 6h4v27h-4m5-28h23v2H15" fill="#b0d8bf" />
<path d="M16 5h23v14H16z" fill="#bac9bb" /><path d="M18 5h12v11H18z" fill="#233e3e" /><path d="M33 7h4v8h-4z" fill="#809e98" />
<path d="M15 23h25v13H15z" fill="#d8d9b8" /><path d="M18 26h17v2H18m0 3h12v2H18" fill="#718f81" />
<path d="M39 19h4v7h-2v4h-3v-8h1" fill="#3a7063" /><path d="M10 34h3v2h-3m31-2h2v2h-2" fill="#1b3433" />
<path d="M29 35h3v4h-3m10-4h3v3h-3" fill="#72d5dc" /></g>; break;
    case "token-chest": artwork = <g shapeRendering="crispEdges"><path d="M10 5h36v4h4v6h3v23H4V15h3V9h3z" fill="#493321" />
<path d="M11 7h33v4h4v7H8v-7h3z" fill="#c2853b" /><path d="M11 8h31v3H11m-2 4h38v2H9" fill="#f2c777" />
<path d="M7 20h43v15H7z" fill="#93602f" /><path d="M8 22h40v2H8m0 7h40v2H8" fill="#704522" />
<path d="M13 7h5v29h-5m24-29h5v29h-5M6 34h45v4H6" fill="#dba848" /><path d="M14 8h2v25h-2m23-25h2v25h-2m-30 2h39v1H8" fill="#ffe39b" />
<path d="M24 16h11v13H24z" fill="#513c28" /><path d="M25 17h9v10h-9z" fill="#ffd166" /><path d="M28 19h3v3h-1v3h-1v-3h-1z" fill="#674825" />
<path d="M10 18h11v2H10m27-2h11v2H37" fill="#ffd875" /><path d="M15 10h1v2h-1m23-2h1v2h-1m-23 18h1v2h-1m23-2h1v2h-1" fill="#674825" />
<path d="M48 2h2v3h3v2h-3v3h-2V7h-3V5h3z" fill="#fff0b9" /></g>; break;
    case "cracked-controller": artwork = <g shapeRendering="crispEdges"><path d="M11 10h32v3h5v5h3v7h3v11H40v-4h-4v-3H20v3h-4v4H2V25h3v-7h3v-5h3z" fill="#253835" />
<path d="M12 12h30v3h4v5h3v12h-8v-4h-5v-3H20v3h-5v4H6V24h2v-7h4z" fill="#8da596" />
<path d="M13 12h27v3H13m-5 8h3v7H8" fill="#d6e0bc" />
<path d="M13 17h4v4h4v4h-4v4h-4v-4H9v-4h4z" fill="#284544" />
<path d="M14 18h2v4h-2m4 0h2v2h-2" fill="#527b75" />
<path d="M36 17h5v5h-5" fill="#ed739d" /><path d="M43 22h5v5h-5" fill="#69d1dc" /><path d="M27 25h4v2h-4" fill="#274140" />
<path d="M28 11v5h4v5h-4v4h4v4" fill="none" stroke="#37443b" strokeWidth="2" /><path d="M26 11v4h3" fill="none" stroke="#f6cb7e" strokeWidth="2" />
<path d="M26 10V6h-6V2" fill="none" stroke="#416258" strokeWidth="3" /></g>; break;
    case "rusty-can": artwork = <g shapeRendering="crispEdges"><path d="M16 4h23v3h4v6h-2v20h3v5H13v-5h2V12h-2V7h3z" fill="#3c382d" />
<path d="M16 10h24v23H16z" fill="#a47d55" /><path d="M17 11h4v20h-4" fill="#ceb184" /><path d="M36 11h4v21h-4" fill="#74533c" />
<path d="M15 6h26v4H15m0 24h27v3H15" fill="#8aa6a0" /><path d="M17 6h19v1H17m0 27h20v1H17" fill="#c6dcd0" />
<path d="M24 4h9v3h-9z" fill="#56776d" /><path d="M26 4h4v1h-4" fill="#d2e2c4" />
<path d="M25 13h9l-4 6h5l-10 12 3-10h-5z" fill="#ecd48d" />
<path d="M16 15h4v5h-4m2 7h5v5h-5m15-18h6v4h-6m0 11h5v4h-5" fill="#ad552f" /><path d="M17 17h2v2h-2m18-3h3v1h-3m-15 13h2v2h-2" fill="#e79254" /></g>; break;
    case "tangled-cable": artwork = <g shapeRendering="crispEdges"><path d="M8 12h13v19h19V14h7v20H27V20H15v16" fill="none" stroke="#182d2a" strokeWidth="8" />
<path d="M8 12h13v19h19V14h7v20H27V20H15v16" fill="none" stroke="#668f81" strokeWidth="5" />
<path d="M10 10h12v17m1 6h16m-9-12h6m10-6v15" fill="none" stroke="#a1c9ae" strokeWidth="1" />
<path d="M24 27h6v9h-6z" fill="#25443e" /><path d="M24 27h5v2h-5" fill="#d4b97c" />
<path d="M2 6h10v12H2m41-9h10v10H41" fill="#304940" /><path d="M3 5h8v5H3M43 5h7v5h-7" fill="#bdcfc0" />
<path d="M5 6h2v3H5M45 6h2v3h-2" fill="#5d8c88" /><path d="M14 35v5m3-5v3" stroke="#cd9665" strokeWidth="2" /></g>; break;
    case "wet-keyboard": artwork = <g shapeRendering="crispEdges"><path d="M7 9h42v5h3v14h3v10H1V24h3V13h3z" fill="#203831" /><path d="M8 11h39v4h3v19H4V25h3z" fill="#69877a" />
<path d="M9 12h36v2H9m-4 13h2v6H5" fill="#bad4b5" /><path d="M9 16h36v14H7z" fill="#28473f" />
<path d="M10 17h4v4h-4m6-4h4v4h-4m6-4h4v4h-4m6-4h4v4h-4m6-4h4v4h-4m6-4h3v4h-3M9 24h5v4H9m8-4h19v4H17m21-4h6v4h-6" fill="#b4c7ab" />
<path d="M16 17h4v2h-4m6-2h4v2h-4m12-2h4v2h-4m-16 7h13v1H22" fill="#edf3cc" />
<path d="M29 17h3v4h-3m9 3h4v4h-4" fill="#162f2a" /><path d="M8 35h39v2H8" fill="#3d6152" />
<path d="M14 4h3v5h-3m12-8h3v5h-3m11-2h3v5h-3" fill="#6ad0d5" /></g>; break;
    case "floppy-disk": artwork = <g shapeRendering="crispEdges">
      <path d="M10 3h30v4h5v4h3v28H7V3z" fill="#203a46" /><path d="M10 5h29v4h5v4h2v23H10z" fill="#4e9ba5" />
      <path d="M11 6h3v28h-3m3-29h23v2H14" fill="#a2dbce" /><path d="M16 5h22v13H16z" fill="#adbec0" /><path d="M18 5h10v10H18z" fill="#294453" />
      <path d="M32 7h4v8h-4z" fill="#65878b" /><path d="M15 23h25v13H15z" fill="#d1d7bb" /><path d="M17 24h21v3H17z" fill="#987a9f" />
      <path d="M18 29h16v2H18m0 2h9v1h-9" fill="#668b81" /><path d="M10 34h3v2h-3m31-2h2v2h-2" fill="#203a46" />
    </g>; break;
    case "arcade-coin": artwork = <g shapeRendering="crispEdges">
      <path d="M19 3h18v4h7v6h4v16h-4v6h-7v4H19v-4h-7v-6H8V13h4V7h7z" fill="#77552e" />
      <path d="M20 5h15v4h7v6h3v12h-3v6h-7v4H20v-4h-6v-6h-3V15h3V9h6z" fill="#d3a84e" />
      <path d="M20 6h13v3H20v4h-5v13h-3V14h3V9h5z" fill="#ffdf8b" /><path d="M37 12h3v17h-5v4H20v-3h14v-4h3z" fill="#a57532" />
      <path d="M24 12h7v18h-6V18h-4v-3h3z" fill="#795628" /><path d="M25 13h4v15h-2V16h-3v-2h1z" fill="#f8dc8c" />
    </g>; break;
    case "battery": artwork = <g shapeRendering="crispEdges">
      <path d="M21 2h14v4h6v33H15V6h6z" fill="#233c3c" /><path d="M23 3h10v4H23z" fill="#b8cdc0" />
      <path d="M17 8h22v27H17z" fill="#527c67" /><path d="M18 9h4v25h-4" fill="#96c6a0" /><path d="M34 9h5v26h-5" fill="#345e50" />
      <path d="M17 8h22v5H17m0 20h22v4H17" fill="#a9bfaf" /><path d="M21 15h12v15H21z" fill="#213f3b" />
      <path d="M27 16h5l-4 6h4l-8 8 2-7h-4z" fill="#dfcb79" /><path d="M24 9h8v2h-8" fill="#f1e8bd" />
    </g>; break;
    case "lost-bug": artwork = <g shapeRendering="crispEdges">
      <path d="M18 12h20v3h5v14h-5v5H18v-5h-5V15h5z" fill="#4d354c" /><path d="M19 14h17v4h5v9h-5v5H19v-5h-4v-9h4z" fill="#c76c96" />
      <path d="M20 15h6v14h-6m10-14h5v14h-5" fill="#e79ebb" /><path d="M27 15h2v18h-2" fill="#7a486b" />
      <path d="M18 11h5V7h11v4h4v6H18z" fill="#587869" /><path d="M22 9h4v4h-4m7-4h4v4h-4" fill="#dbe9bd" /><path d="M24 10h2v3h-2m7-3h2v3h-2" fill="#1f3b3c" />
      <path d="M15 19H9v4m6 4H9v5m32-13h6v4m-6 4h6v5M23 7V3h-4m14 4V3h4" fill="none" stroke="#809f89" strokeWidth="2" />
      <path d="M21 20h3v3h-3m11 3h3v3h-3" fill="#7b4868" />
    </g>; break;
    case "mini-cartridge": artwork = <g shapeRendering="crispEdges">
      <path d="M10 3h35v29h-7v7H17v-7h-7z" fill="#383a57" /><path d="M12 5h31v25h-7v7H19v-7h-7z" fill="#7d7da9" />
      <path d="M13 6h3v23h-3m3-24h25v2H16" fill="#c0b6db" /><path d="M17 11h21v16H17z" fill="#303e57" />
      <path d="M19 13h17v11H19z" fill="#638f9e" /><path d="M20 21h4v-4h4v-3h3v7h4v2H20z" fill="#c7dcca" />
      <path d="M22 31h3v6h-3m6-6h3v6h-3m5-6h2v6h-2" fill="#d5b56c" /><path d="M17 8h21v1H17" fill="#555b80" />
    </g>; break;
    default: artwork = <FishBody color={color} />;
  }

  return <svg className={`buddy-collectible-icon ${className}`} viewBox="0 0 56 42" aria-hidden="true" {...svgProps}><g className="buddy-species-art">{artwork}</g></svg>;
}
