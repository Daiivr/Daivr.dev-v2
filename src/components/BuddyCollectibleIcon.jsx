function FishBody({ color, accent = "#f4fff8", tail = "normal", long = false }) {
  return (
    <g shapeRendering="crispEdges">
      <path d={long ? "M8 18h7v-5h27v3h8v10h-8v3H15v-5H8L2 31V11z" : "M10 17h7v-5h23v3h8v12h-8v4H17v-5h-7L3 32V10z"} fill={color} />
      {tail === "star" ? <path d="M9 21 2 12l3 9-3 9z" fill="#ffd166" /> : null}
      <rect x="39" y="17" width="3" height="3" fill="#020604" />
      <rect x="22" y="13" width="9" height="3" fill={accent} opacity="0.75" />
      <path d="M25 29h8l-4 6z" fill={accent} opacity="0.75" />
    </g>
  );
}

export function BuddyCollectibleIcon({ id, color = "#45d8ff", unknown = false, className = "" }) {
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
    case "packet-puffer": artwork = <g shapeRendering="crispEdges"><path d="M9 12h5V7h25v5h6v5h5v11h-5v5h-6v4H14v-4H9v-5H4V17h5z" fill={color} /><path d="M13 7 9 1l8 6m20 0 5-6v8M13 36l-4 5 10-5m18 0 5 5v-7" stroke="#ff8c69" strokeWidth="3" /><rect x="39" y="16" width="3" height="3" fill="#020604" /></g>; break;
    case "void-eel": artwork = <><path d="M4 25c8-17 17 10 26-5s17 7 22-5v9c-10 15-17-8-25 6S10 23 4 34z" fill={color} /><rect x="46" y="17" width="3" height="3" fill="#ff3d9d" /></>; break;
    case "glitch-koi": artwork = <><FishBody color={color} accent="#45d8ff" /><rect x="17" y="14" width="7" height="7" fill="#f4fff8" /><rect x="28" y="22" width="8" height="6" fill="#45d8ff" /><rect x="5" y="8" width="9" height="3" fill="#ff3d9d" opacity=".65" /></>; break;
    case "recursion-ray": artwork = <g shapeRendering="crispEdges"><path d="M4 22 22 7h18l12 15-12 13H22z" fill={color} /><path d="m12 22 12-9h12l8 9-8 7H24z" fill="#246c8d" /><path d="m22 22 6-4h6l4 4-4 3h-6z" fill="#b8f7ff" /><rect x="40" y="17" width="3" height="3" fill="#020604" /></g>; break;
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

  return <svg className={`buddy-collectible-icon ${className}`} viewBox="0 0 56 42" aria-hidden="true">{artwork}</svg>;
}
