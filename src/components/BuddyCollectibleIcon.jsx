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
    case "old-boot": artwork = <g shapeRendering="crispEdges"><path d="M13 6h19v20h15v10H9V17h4z" fill={color} /><rect x="16" y="9" width="12" height="4" fill="#b8f7ff" opacity=".5" /><rect x="9" y="33" width="40" height="4" fill="#31473b" /></g>; break;
    case "soggy-disk":
    case "floppy-disk": artwork = <g shapeRendering="crispEdges"><path d="M10 4h31l7 7v27H8V4z" fill={color} /><rect x="15" y="7" width="23" height="11" fill="#071b1c" /><rect x="18" y="25" width="20" height="13" fill="#b8f7ff" /><rect x="31" y="28" width="4" height="8" fill="#071b1c" /></g>; break;
    case "token-chest": artwork = <g shapeRendering="crispEdges"><rect x="7" y="16" width="43" height="22" fill="#8a5428" /><path d="M10 8h37l4 10H6z" fill="#ffd166" /><rect x="26" y="20" width="7" height="12" fill="#f4fff8" /><rect x="9" y="34" width="40" height="4" fill="#d29330" /></g>; break;
    case "cracked-controller": artwork = <g shapeRendering="crispEdges"><path d="M9 14h38l7 20H40l-6-7H22l-6 7H2z" fill={color} /><rect x="15" y="19" width="12" height="4" fill="#071b1c" /><rect x="19" y="15" width="4" height="12" fill="#071b1c" /><rect x="38" y="17" width="4" height="4" fill="#ff3d9d" /><rect x="44" y="23" width="4" height="4" fill="#45d8ff" /><path d="m29 14 4 5-5 5 5 4" fill="none" stroke="#ffd166" strokeWidth="2" /></g>; break;
    case "rusty-can": artwork = <g shapeRendering="crispEdges"><rect x="16" y="5" width="25" height="33" fill={color} /><rect x="13" y="7" width="31" height="4" fill="#b8f7ff" /><rect x="13" y="33" width="31" height="4" fill="#4f3a2c" /><path d="m18 14 21 15m-18 2 17-14" stroke="#d97745" strokeWidth="4" /></g>; break;
    case "tangled-cable": artwork = <g fill="none" stroke={color} strokeWidth="5" shapeRendering="crispEdges"><path d="M6 12h13v18h19V11h12v24H27V19H12v17" /><path d="M4 9h6v7H4zm42-2h7v8h-7z" fill="#b8f7ff" stroke="none" /></g>; break;
    case "wet-keyboard": artwork = <g shapeRendering="crispEdges"><path d="M5 11h44l5 26H2z" fill={color} /><path d="M9 15h36v16H7z" fill="#071b1c" /><path d="M11 17h5v4h-5zm8 0h5v4h-5zm8 0h5v4h-5zm8 0h5v4h-5zM11 24h5v4h-5zm8 0h14v4H19zm17 0h5v4h-5z" fill="#b8f7ff" /><path d="M13 7h3m9-3h3m10 3h3" stroke="#45d8ff" strokeWidth="3" /></g>; break;
    case "arcade-coin": artwork = <g shapeRendering="crispEdges"><rect x="14" y="5" width="28" height="32" fill="#9a651f" /><rect x="10" y="10" width="36" height="22" fill="#ffd166" /><rect x="18" y="14" width="20" height="14" fill="#9a651f" /><text x="22" y="26" fill="#ffd166" fontFamily="monospace" fontSize="13" fontWeight="900">1</text></g>; break;
    case "battery": artwork = <g shapeRendering="crispEdges"><rect x="18" y="7" width="20" height="31" fill="#3fff97" /><rect x="23" y="3" width="10" height="5" fill="#b8f7ff" /><rect x="21" y="11" width="14" height="11" fill="#071b1c" /><path d="m28 13-5 8h4l-2 7 8-10h-4l3-5z" fill="#ffd166" /></g>; break;
    case "lost-bug": artwork = <g shapeRendering="crispEdges"><rect x="19" y="10" width="19" height="25" fill="#ff3d9d" /><rect x="15" y="15" width="27" height="14" fill="#ff3d9d" /><rect x="22" y="14" width="4" height="4" fill="#020604" /><rect x="31" y="14" width="4" height="4" fill="#020604" /><path d="M15 17H7m8 7H5m37-7h8m-8 7h10" stroke="#ff3d9d" strokeWidth="3" /></g>; break;
    case "mini-cartridge": artwork = <g shapeRendering="crispEdges"><path d="M11 5h34v27h-7v6H18v-6h-7z" fill="#a78bfa" /><rect x="16" y="10" width="24" height="14" fill="#20133f" /><rect x="19" y="13" width="18" height="8" fill="#45d8ff" /><rect x="20" y="32" width="4" height="6" fill="#ffd166" /><rect x="28" y="32" width="4" height="6" fill="#ffd166" /></g>; break;
    default: artwork = <FishBody color={color} />;
  }

  return <svg className={`buddy-collectible-icon ${className}`} viewBox="0 0 56 42" aria-hidden="true" {...svgProps}><g className="buddy-species-art">{artwork}</g></svg>;
}
