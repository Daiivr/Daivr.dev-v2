export function BuddyGearArt({ id }) {
  let artwork;

  switch (id) {
    case "miku-costume":
      artwork = (
        <>
          <path d="M3 4h4v13H6v3H2v-4H1V8h2zM17 4h4v4h2v8h-1v4h-4v-3h-1z" fill="#12353e" />
          <path d="M3 7h3v9H5v3H3zM18 7h3v12h-2v-3h-1z" fill="#2abbb6" />
          <path d="M3 8h1v7H3zM20 8h1v7h-1z" fill="#70e9d6" />
          <path d="M8 1h8v2h2v8h-2v2H8v-2H6V3h2z" fill="#12353e" />
          <path d="M8 5h8v6h-2v1h-4v-1H8z" fill="#ffe1ca" />
          <path d="M8 2h8v2h1v3h-2V5h-2v2h-2V4H9v2H7V4h1z" fill="#2abbb6" />
          <path d="M8 2h6v1H8z" fill="#70e9d6" />
          <path d="M5 3h2v5H5zM17 3h2v5h-2z" fill="#f163a5" />
          <path d="M9 8h2v2H9zM14 8h2v2h-2z" fill="#253344" />
          <path d="M9 8h1v1H9zM14 8h1v1h-1z" fill="#70e9d6" />
          <path d="M8 12h8v2h2v4h-2v4h-3v-3h-2v3H8v-4H6v-4h2z" fill="#273342" />
          <path d="M9 13h6v4H9z" fill="#d6e7e5" />
          <path d="M11 13h2v4h-2zM7 18h10v1H7zM8 22h3v1H8zM13 22h3v1h-3z" fill="#40c9c1" />
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
      artwork = <><path d="M10 1h4v4h2v4h2v4h2v5h2v4H2v-4h2v-5h2V9h2V5h2z" fill="#201624" />
<path d="M11 3h2v3h2v4h2v4h2v5H5v-5h2v-4h2V6h2z" fill="#f454a7" />
<path d="M11 6h2v4h2v4h-4v5H8v-5h2v-4h1z" fill="#ffe39b" />
<path d="M3 19h18v2H3z" fill="#4fd5e3" /><path d="M5 19h13v1H5zM11 2h2v2h-2z" fill="#f1fff6" /></>;
      break;
    case "star-cap":
      artwork = <><path d="M7 3h9v2h3v3h2v6h2v5H2v-5h1V8h2V5h2z" fill="#0b2937" />
<path d="M8 4h7v2h3v3h2v6H4V9h2V6h2z" fill="#278fa7" />
<path d="M8 5h3v2H8v3H6v4H4V9h2V7h2z" fill="#7de9ed" />
<path d="M3 15h19v3H3z" fill="#45d8ff" /><path d="M5 18h15v2H5z" fill="#17506e" />
<path d="M12 7h2v2h3v2h-2v3h-2v-2h-2v2H9v-3H8V9h4z" fill="#ffe397" /></>;
      break;
    case "pixel-crown":
      artwork = <><path d="M1 4h5v3h3V2h6v5h3V4h5v16H1z" fill="#573921" />
<path d="M3 5h2v4h5V4h4v5h5V5h2v13H3z" fill="#ffd166" />
<path d="M3 5h2v8H3m7-9h2v7h-2m7-2h2v4h-2" fill="#fff0af" />
<path d="M3 17h18v3H3z" fill="#b58032" /><path d="M4 17h16v1H4z" fill="#fff0af" />
<path d="M5 12h3v3H5m11-3h3v3h-3" fill="#ff548b" /><path d="M11 11h3v5h-3z" fill="#45d8ff" /></>;
      break;
    case "sunglasses":
      artwork = <><path d="M1 7h9v2h4V7h9v8h-2v3h-7v-6h-4v6H3v-3H1z" fill="#11222e" />
<path d="M2 8h7v7H4v-2H2m13-5h7v5h-2v2h-5" fill="#24627b" />
<path d="M3 9h4v2H3m13-2h4v2h-4" fill="#92e9ed" /><path d="M10 9h4v2h-4z" fill="#ff659d" /></>;
      break;
    case "green-visor":
      artwork = <><path d="M1 6h22v12H1z" fill="#092e28" /><path d="M2 7h20v9H2z" fill="#409781" />
<path d="M4 9h16v5H4z" fill="#0e5b3a" /><path d="M4 9h11v2H4z" fill="#9effc1" />
<path d="M5 12h14v2H5z" fill="#3fff97" /><path d="M17 9h2v2h-2" fill="#e9fff3" />
<path d="M0 9h2v5H0m22-5h2v5h-2" fill="#4ed5df" /></>;
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
      artwork = <><path d="M3 3h17v3h2v8h-4v9h-6v-8h-2v7H3V8H1V5h2z" fill="#472334" />
<path d="M4 4h15v3h2v5H8v9H4V7H2V5h2z" fill="#ed559a" />
<path d="M13 12h5v9h-5z" fill="#be3473" /><path d="M4 5h14v2H4m-1 3h5v2H3m1 7h4v2H4m9-2h5v2h-5" fill="#ff9dc9" />
<path d="M4 21h2v2H4m3-2h2v2H7m6-2h2v2h-2m3-2h2v2h-2" fill="#ffd166" /></>;
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
      artwork = <><path d="M1 5h16v2h5v7h-5v2h-3v7H8v-8H4v-3H1z" fill="#112b38" />
<path d="M3 7h13v2h5v3h-6v3H9v-3H3z" fill="#388fa8" />
<path d="M4 7h10v2H4m5 7h4v5H9" fill="#8eeaf1" /><path d="M6 10h7v2H6z" fill="#ff5c9e" />
<path d="M17 8h4v4h-4z" fill="#ecfff6" /><rect x="10" y="17" width="2" height="3" fill="#275365" /></>;
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
      artwork = <><path d="M7 2h10v2h3v3h2v13h-7V9h3V7h-2V5H8v2H6v2h3v11H2V7h2V4h3z" fill="#12323f" />
<path d="M7 3h10v2h2v3h-2V6H7v2H5V5h2z" fill="#83eced" />
<path d="M3 10h5v9H3m13-9h5v9h-5" fill="#329aaa" /><path d="M4 11h2v6H4m13-6h2v6h-2" fill="#45d8ff" />
<path d="M19 19v3h-8v-3h3v1h3v-1z" fill="#ed659e" /></>;
      break;
    case "rocket-boots":
      artwork = <><path d="M2 3h9v10h2V3h9v12h1v6H1v-8h1z" fill="#2d263e" />
<path d="M3 4h7v10h2v5H2v-5h1m11-10h7v10h1v5H13v-5h1" fill="#9a3974" />
<path d="M4 5h5v2H4m11-2h5v2h-5" fill="#ff9ec5" /><path d="M3 9h6v2H3m11-2h6v2h-6" fill="#ff4c9f" />
<path d="M2 17h10v3H2m11-3h10v3H13" fill="#388caa" /><path d="M4 21h5v2H4m11-2h5v2h-5" fill="#ffd166" /><path d="M5 21h3v1H5m11-1h3v1h-3" fill="#fff5d0" /></>;
      break;
    case "parachute-upgrade":
      artwork = (
        <>
          <path d="M2 10V7h2V5h3V3h10v2h3v2h2v3z" fill="#d9e2ef" />
          <path d="M6 5h4v5H5zm8 0h4l1 5h-5z" fill="#91a7bb" />
          <path d="M3 10h18v2H3z" fill="#f4fff8" />
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
          <path d="M14 16h5v6h-5z" fill="#704627" /><path d="M14 17h5v1h-5m0 2h5v1h-5" fill="#e4bd78" /><path d="M12 12h7v7h-7z" fill="#202633" />
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

  return <g shapeRendering="crispEdges">{artwork}</g>;
}

export function BuddyGearIcon({ id, className = "" }) {
  return <svg className={`buddy-gear-icon ${className}`.trim()} data-gear={id} viewBox="0 0 24 24" aria-hidden="true"><BuddyGearArt id={id} /></svg>;
}

export function BuddyWornGear({ id, x, y, width, height, className = "" }) {
  return <svg className={`buddy-worn-gear ${className}`} data-gear={id} x={x} y={y} width={width} height={height} viewBox="0 0 24 24" preserveAspectRatio="none" overflow="visible"><BuddyGearArt id={id} /></svg>;
}
