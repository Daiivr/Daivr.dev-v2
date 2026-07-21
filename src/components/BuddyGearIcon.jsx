export function BuddyGearIcon({ id, className = "" }) {
  let artwork;

  switch (id) {
    case "miku-costume":
      artwork = (
        <>
          <path d="M3 3h4v3H6v9H4V8H2V5h1zm14 0h4v2h1v3h-2v7h-2V6h-1z" fill="#45d8ca" />
          <path d="M9 3h6v2h2v6h-2v2H9v-2H7V5h2z" fill="#ffd8c8" />
          <path d="M8 2h8v4h-2V4h-2v3h-2V4H8z" fill="#45d8ca" />
          <path d="M8 12h8v2h1v4h-3v4h-2v-4h-2v4H8v-4H6v-4h2z" fill="#252d39" />
          <path d="M10 12h4v6h-4z" fill="#45d8ca" />
          <path d="M7 17h10v2H7z" fill="#d9e5e4" />
        </>
      );
      break;
    case "miku-wig":
      artwork = (
        <>
          <path d="M8 3h8v2h2v5h-3V7h-2v5h-2V7H9v3H6V5h2z" fill="#58eadb" />
          <path d="M4 5h4v3H7v8H5v5H3v-7H2V8h2zm12 0h4v3h2v6h-1v7h-2v-5h-2V8h-1z" fill="#38bdb4" />
          <path d="M3 7h4v2H3zm14 0h4v2h-4z" fill="#ff4b9b" />
          <path d="M8 3h8v2H8z" fill="#b8fff6" />
        </>
      );
      break;
    case "party-hat":
      artwork = (
        <>
          <path d="M12 2 4 19h16z" fill="#ff3d9d" />
          <path d="M12 2 9 19h6z" fill="#ffd166" />
          <path d="M5 18h14v3H5z" fill="#45d8ff" />
          <path d="M11 1h3v3h-3z" fill="#f4fff8" />
        </>
      );
      break;
    case "star-cap":
      artwork = (
        <>
          <path d="M5 8h2V5h3V3h5v2h3v3h2v7H5z" fill="#2388a6" />
          <path d="M3 15h18v3H3z" fill="#45d8ff" />
          <path d="m12 6 1 2h3l-2 2 1 3-3-2-3 2 1-3-2-2h3z" fill="#ffd166" />
        </>
      );
      break;
    case "pixel-crown":
      artwork = (
        <>
          <path d="M3 5h4v5l5-6 5 6V5h4v14H3z" fill="#ffd166" />
          <path d="M5 15h14v3H5z" fill="#f6c453" />
          <path d="M6 12h3v3H6zm9 0h3v3h-3z" fill="#ff3d9d" />
          <path d="M11 11h3v3h-3z" fill="#45d8ff" />
        </>
      );
      break;
    case "sunglasses":
      artwork = (
        <>
          <path d="M2 8h8v8H4v-2H2zm12 0h8v6h-2v2h-6z" fill="#16232d" />
          <path d="M10 10h4v2h-4z" fill="#ff3d9d" />
          <path d="M4 9h4v2H4zm12 0h4v2h-4z" fill="#45d8ff" />
        </>
      );
      break;
    case "green-visor":
      artwork = (
        <>
          <path d="M2 7h20v10H2z" fill="#16372d" />
          <path d="M4 9h16v6H4z" fill="#3fff97" />
          <path d="M5 10h7v2H5z" fill="#b4ffcf" />
          <path d="M2 5h3v3H2zm17 0h3v3h-3z" fill="#45d8ff" />
        </>
      );
      break;
    case "gold-antenna":
      artwork = (
        <>
          <path d="M6 19h7v-3h3v-5h2V6h2v7h-2v5h-3v3H6z" fill="#3fff97" />
          <path d="m18 2 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#ffd166" />
          <path d="M4 18h5v4H4z" fill="#45d8ff" />
        </>
      );
      break;
    case "scarf":
      artwork = (
        <>
          <path d="M5 4h13v4h2v5H8v8H4V7h1z" fill="#3fff97" />
          <path d="M8 13h4v9H8zm5 0h4v6h-4z" fill="#29b86f" />
          <path d="M6 7h12v2H6z" fill="#b4ffcf" />
        </>
      );
      break;
    case "cartridge":
      artwork = (
        <>
          <path d="M4 3h16v18H4z" fill="#23764e" />
          <path d="M6 5h12v9H6z" fill="#3fff97" />
          <path d="M8 7h8v5H8z" fill="#102b21" />
          <path d="M7 17h10v4H7z" fill="#ffd166" />
          <path d="M9 18h2v3H9zm4 0h2v3h-2z" fill="#4a311b" />
        </>
      );
      break;
    case "wrench":
      artwork = (
        <>
          <path d="M4 4h7v3H8v3h5v3h4v3h3v5h-5v-3h-3v-4H9v-2H4z" fill="#45d8ff" />
          <path d="M14 8h7v5h-3v2h-4z" fill="#23313d" />
          <path d="M4 4h3v6H4z" fill="#f4fff8" />
          <path d="M16 18h2v2h-2z" fill="#ff3d9d" />
        </>
      );
      break;
    case "coffee":
      artwork = (
        <>
          <path d="M5 7h13v13H5z" fill="#f4fff8" />
          <path d="M7 9h9v8H7z" fill="#6b3f24" />
          <path d="M18 10h4v7h-4v-3h2v-2h-2z" fill="#45d8ff" />
          <path d="M8 2h2v4H8zm5 1h2v3h-2z" fill="#b8f7ff" />
        </>
      );
      break;
    case "headset":
      artwork = (
        <>
          <path d="M4 8h3V5h3V3h5v2h3v3h2v10h-5v-8h3V8h-2V6H9v2H7v2h3v8H4z" fill="#45d8ff" />
          <path d="M5 11h4v7H5zm10 0h4v7h-4z" fill="#22313c" />
          <path d="M15 17h2v3h-5v-2h3z" fill="#ff3d9d" />
        </>
      );
      break;
    case "rocket-boots":
      artwork = (
        <>
          <path d="M4 5h6v11h3v4H3v-7h1zm10 0h6v8h1v7H11v-4h3z" fill="#34313e" />
          <path d="M4 7h6v3H4zm10 0h6v3h-6z" fill="#ff3d9d" />
          <path d="M6 20h3v3H6zm9 0h3v3h-3z" fill="#ffd166" />
          <path d="M7 22h1v2H7zm9 0h1v2h-1z" fill="#45d8ff" />
        </>
      );
      break;
    case "parachute-upgrade":
      artwork = (
        <>
          <path d="M2 10V7h2V5h3V3h10v2h3v2h2v3z" fill="#ff3d9d" />
          <path d="M6 5h4v5H5zm8 0h4l1 5h-5z" fill="#45d8ff" />
          <path d="M3 10h18v2H3z" fill="#ffd166" />
          <path d="m4 12 7 8m9-8-7 8" stroke="#b8f7ff" strokeWidth="2" />
          <path d="M9 19h6v4H9z" fill="#3fff97" />
        </>
      );
      break;
    case "rod-driftwood":
    case "rod-bamboo":
    case "rod-neon":
    case "rod-golden": {
      const rodColor = id === "rod-driftwood" ? "#9a6338" : id === "rod-bamboo" ? "#3fff97" : id === "rod-neon" ? "#ff3d9d" : "#ffd166";
      const tipColor = id === "rod-golden" ? "#f4fff8" : id === "rod-neon" ? "#ffd166" : "#45d8ff";
      artwork = (
        <>
          <path d="M4 4h4v3h3v3h3v3h3v3h3v5h-4v-3h-3v-3h-3v-3H7V9H4z" fill={rodColor} />
          <path d="M3 3h5v3H3z" fill={tipColor} />
          <path d="M13 13h6v6h-6z" fill="#202633" />
          <path d="M15 15h2v2h-2z" fill="#f4fff8" />
          <path d="M4 4v14h4" fill="none" stroke="#b8f7ff" strokeWidth="1" />
          <path d="M7 18h3v4H7z" fill="#ff3d9d" />
        </>
      );
      break;
    }
    case "lure-swift":
      artwork = (
        <>
          <path d="M9 3h7l-3 6h5L8 22l3-9H6z" fill="#45d8ff" />
          <path d="M11 4h3l-2 6h3l-5 7 2-6H9z" fill="#f4fff8" />
        </>
      );
      break;
    case "lure-anchor":
      artwork = (
        <>
          <path d="M10 3h4v13h-4z" fill="#45d8ff" />
          <path d="M7 5h10v3H7z" fill="#f4fff8" />
          <path d="M3 13h4v3h3v3h4v-3h3v-3h4v5h-3v3H6v-3H3z" fill="#3fff97" />
          <path d="M11 1h2v3h-2z" fill="#ff3d9d" />
        </>
      );
      break;
    case "lure-magnet":
      artwork = (
        <>
          <path d="M4 4h6v11h4V4h6v13h-3v3H7v-3H4z" fill="#ff3d9d" />
          <path d="M4 4h6v4H4zm10 0h6v4h-6z" fill="#f4fff8" />
          <path d="M8 15h8v3H8z" fill="#45d8ff" />
        </>
      );
      break;
    case "lure":
      artwork = (
        <>
          <path d="M10 2h4v4h3v3h2v8h-2v3H7v-3H5V9h2V6h3z" fill="#ffd166" />
          <path d="M7 9h10v7H7z" fill="#f4fff8" />
          <path d="M10 9h4v3h-4z" fill="#45d8ff" />
          <path d="M11 20v3h4v-2h2" fill="none" stroke="#b8f7ff" strokeWidth="2" />
        </>
      );
      break;
    default:
      artwork = <path d="M4 4h16v16H4zm4 4v8h8V8z" fill="currentColor" />;
  }

  return (
    <svg className={`buddy-gear-icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      <g shapeRendering="crispEdges">{artwork}</g>
    </svg>
  );
}
