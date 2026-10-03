import { BuddyMarketArt } from "./BuddyMarketArt";
import { BuddyFishArt, hasFishArt } from "./BuddyFishArt";
import { BuddyRelicDetails } from "./BuddyRelicDetails";
import { FISH_CATALOG } from "../../shared/buddy-catches.mjs";

const speciesColors = Object.fromEntries(FISH_CATALOG.map(({ id, color }) => [id, color]));
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

export function BuddyCollectibleIcon({ id, color = speciesColors[id] || "#45d8ff", unknown = false, className = "", ...svgProps }) {
  if (unknown) {
    return (
      <svg className={`buddy-collectible-icon is-unknown ${className}`} viewBox="0 0 56 42" aria-hidden="true">
        <FishBody color="#17372a" accent="#214b39" />
        <text x="25" y="25" fill="#3b7459" fontFamily="monospace" fontSize="14" fontWeight="900">?</text>
      </svg>
    );
  }

  let artwork;
  if (hasFishArt(id)) artwork = <BuddyFishArt id={id} color={color} />;
  else switch (id) {
    case "market-terrarium":
    case "market-moon":
    case "market-arcade": artwork = <g transform="translate(9 1) scale(1.6)"><BuddyMarketArt id={id} /></g>; break;
    case "chrono-manta": artwork = <g shapeRendering="crispEdges">
      {/* A whip tail and swept wings give the timekeeper a true ray silhouette. */}
      <g className="buddy-fish-tail">
        <path d="M19 20H9v3H4v6H0v-3h2v-6h5v-3h12z" fill="#322452" />
        <path d="M18 19H8v3H3v5H1v2h3v-6h5v-2h9z" fill="#aa8ae8" />
        <path d="M8 19h7v1H8m-5 3h1v3H3" fill="#e1d0ff" />
      </g>
      <path d="M17 20h3v-5h2V9h-2V3h5v2h4v3h4v4h5v3h5v-2h5v3h3v3h3v7h-3v3h-4v-2h-5v3h-5v4h-5v3h-5v3h-6v-4h2v-6h-2v-5h-4z" fill="#30234e" />
      <path d="M19 21h3v-5h2V9h-2V5h3v2h4v3h3v4h5v3h7v-2h3v3h3v2h2v5h-3v2h-2v-2h-6v3h-5v4h-5v3h-5v3h-3v-2h2v-7h-2v-5h-4z" fill={color} />
      <path d="M23 6h2v3h4v3h3v4h5v2h-7v-3h-3v-4h-3z" fill="#ead3ff" />
      <path d="M24 14h3v4h4v3H21v-2h3zM24 26h8v3h-3v4h-3v3h-2v-2h1v-5h-1z" fill="#8963cb" />
      <path d="M31 14h3v3h6v2h-8zM30 29h7v3h-5v3h-5v2h-2v-2h3v-3h2z" fill="#633c9e" />
      <path d="M24 23h6v3h12v-2h7v-3h3v4h-3v2h-2v-2h-6v3h-5v2H26v-3h-2z" fill="#714aa6" />
      {/* A brass-rimmed clock, with luminous ticks and distinct hands. */}
      <path d="M31 17h7v2h2v7h-2v2h-7v-2h-2v-7h2z" fill="#48334f" />
      <path d="M32 17h5v2h2v6h-2v2h-5v-2h-2v-6h2z" fill="#dfb879" />
      <path d="M32 19h5v6h-5v-1h-1v-4h1z" fill="#f3e4c1" />
      <path d="M34 19h1v3h2v1h-3z" fill="#624383" />
      <path d="M33 17h2v1h-2m5 3h1v2h-1m-5 4h2v1h-2m-4-6h1v2h-1" fill="#fff4d3" />
      {/* Bright eyes and curled cephalic fins frame the mouth. */}
      <path d="M43 16h4v4h-4m0 5h4v3h-4" fill="#efe3ff" />
      <path d="M45 17h2v3h-2m0 8h2v2h-2" fill="#211c3c" />
      <path d="M49 19h4v2h-2v3h-2m-5-9h3v1h-3M43 28h3v1h-3" fill="#d6bdff" />
      <path d="M47 22h3v1h-3" fill="#30234e" />
      <path d="M25 18h2v1h-2m-2 5h2v1h-2m4 7h2v1h-2m10-16h2v1h-2" fill="#c3f1ea" />
      <path d="M9 5h2v2h2v2h-2v2H9V9H7V7h2zM48 33h1v2h2v1h-2v2h-1v-2h-2v-1h2z" fill="#dfc7ff" />
      <path d="M14 12h1v1h-1m24 24h2v2h-2" fill="#a085d8" />
    </g>; break;
    case "moonkernel-sturgeon": artwork = <g shapeRendering="crispEdges">
      {/* An uneven fork and narrow tail root give the silhouette a swimming sweep. */}
      <g className="buddy-fish-tail">
        <path d="M15 20h-3v-3h-2v-3H8v-3H6V8H3v5h1v5h2v4h2v2H6v3H4v3H2v3h4v-2h3v-2h3v-4h4z" fill="#66738e" />
        <path d="M14 21h-3v-3H9v-3H7v-3H5v5h1v3h2v3h3v2H8v3H6v2H4v1h2v-1h3v-2h3v-3h3z" fill="#c4bbeb" />
        <path d="M5 10h1v4h2v3h2v2h1v2H9v-2H7v-3H6v-3H5zM6 29h3v-2h2v-2h2v2h-2v2H8v1H6z" fill={color} />
      </g>
      {/* Low dorsal and pelvic fins follow the back instead of forming square tabs. */}
      <path d="M17 18v-4h1v-3h2V8h3v3h2v3h3v3zM17 25h8v3h-2v3h-3v2h-2v-4h-1z" fill="#7885a5" />
      <path d="M19 16v-3h1v-2h2v3h2v2zM19 27h4v1h-2v3h-1v-2h-1z" fill="#c4bbeb" />
      {/* Fine pixel steps round the shoulder and taper into the long sturgeon snout. */}
      <path d="M12 20h3v-2h4v-2h5v-2h9v1h6v2h5v2h4v1h4v1h3v3h-5v1h-6v2h-5v2h-6v1H23v-1h-5v-2h-4v-2h-2z" fill="#485e72" />
      <path d="M13 21h3v-2h4v-2h5v-2h8v1h6v2h5v2h4v1h4v1h2v1h-5v1h-6v2h-5v2h-6v1h-8v-1h-5v-2h-4v-2h-2z" fill="#9baebc" />
      <path d="M16 21h5v-2h5v-2h7v1h6v2h5v2h-4v2h-6v3H24v-1h-5v-2h-3z" fill="#c8d6d7" />
      <path d="M20 26h5v1h8v-1h7v-2h6v-1h6v1h-8v2h-5v2h-6v1h-9v-1h-4z" fill="#e1e8df" />
      <path d="M14 23h5v1h5v1h10v-1h6v-1h3v2h-5v2H24v-1h-5v-1h-5z" fill="#7e94aa" />
      {/* Small overlapping scutes replace the full-height armor stripes. */}
      <path d="M17 18h3v2h-1v1h-2zm6-3h3v2h-1v1h-2zm7-2h3v2h-1v1h-2zm7 2h3v2h-1v1h-2z" fill="#71839f" />
      <path d="M17 18h2v1h-2m6-3h2v1h-2m7-3h2v1h-2m7 2h2v1h-2" fill={color} />
      <path d="M18 22h2v1h1v1h-3zm5-2h2v1h1v1h-3zm7 0h2v1h1v1h-3zm6 1h2v1h1v1h-3z" fill="#a49dcc" />
      {/* A little crescent nestles into the flank, without a large circular housing. */}
      <path d="M28 17h3v1h-2v2h-1v3h2v2h3v1h-5v-1h-2v-2h-1v-3h1v-2h2z" fill="#9e91cb" />
      <path d="M28 17h2v1h-2v2h-1v3h1v1h2v1h3v1h-5v-1h-2v-2h-1v-3h1v-2h2z" fill={color} />
      <path d="M31 19h1v1h-1m2 3h1v1h-1" fill="#effffc" />
      {/* A swept pectoral fin, gill seam, small eye, and sensory barbels. */}
      <g className="buddy-fish-fin">
        <path d="M34 25h5v3h-1v3h-2v2h-2v2h-3v-3h1v-4h2z" fill="#657997" />
        <path d="M35 26h3v2h-1v2h-2v2h-2v-3h1v-2h1z" fill="#b9b7dc" />
        <path d="M35 26h2v1h-1v2h-1v1h-1v-2h1z" fill={color} />
      </g>
      <path d="M39 20h1v2h1v3h-2v-1h1v-2h-1z" fill="#63788d" />
      <path d="M42 19h3v3h-3z" fill={color} />
      <path d="M43 20h2v2h-2z" fill="#122c3c" />
      <path d="M43 20h1v1h-1M47 21h4v1h-4" fill="#fff" />
      <path d="M46 24h3v1h-3" fill="#3f586c" />
      <path d="M46 25v3h-1v1h-1v-1h1v-3m4-1v3h-1v1h-1v-1h1v-3" fill="#c4bbeb" />
    </g>; break;
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
    case "tangled-cable": artwork = <g shapeRendering="crispEdges">
      <path d="M8 12C6 21 17 32 30 33s17-8 13-13-15-7-20-1-1 16 8 15 14-20 16-22M24 21C11 13 8 30 17 36" fill="none" stroke="#1c3531" strokeWidth="7" />
      <path d="M8 12C6 21 17 32 30 33s17-8 13-13-15-7-20-1-1 16 8 15 14-20 16-22M24 21C11 13 8 30 17 36" fill="none" stroke="#729383" strokeWidth="4" />
      <path d="M8 15c1 9 13 17 24 16m-7-13c6-5 13-2 16 1m-26 5c-3 3-1 7 2 9m27-15 2-4" fill="none" stroke="#b4cdb0" strokeWidth="1" />
      <path d="M23 23h4v5h-4m11-1h4v5h-4" fill="#36584a" /><path d="M23 23h4v1h-4m11 3h4v1h-4" fill="#d7b875" />
      <path d="M3 6h10v10H3m39-10h10v10H42" fill="#35584e" /><path d="M4 3h8v6H4m39-6h8v6h-8" fill="#b9cfbc" />
      <path d="M5 4h2v3H5m39-3h2v3h-2M4 10h7v1H4m39-1h7v1h-7" fill="#759d8f" />
      <path d="M17 34v5m3-4v3" stroke="#d9b37e" strokeWidth="1" />
    </g>; break;
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
    default: artwork = <BuddyFishArt id="byte-minnow" color={color} />;
  }

  return <svg className={`buddy-collectible-icon ${className}`} viewBox="0 0 56 42" aria-hidden="true" {...svgProps}><g className="buddy-species-art">{artwork}<BuddyRelicDetails id={id} /></g></svg>;
}
