import { useId } from "react";

// The torch and light cone share a pivot, so the beam stays attached while scanning.
export function BuddyOutageKit({ phase }) {
  const id = useId();
  return (
    <span className={`buddy-outage-kit is-${phase}`} aria-hidden="true">
      <span className="buddy-outage-ground" />
      <span className="buddy-torch-rig">
        <svg className="buddy-flashlight-beam" viewBox="0 0 168 112" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${id}-beam`}>
              <stop stopColor="#fff4c2" stopOpacity=".45" />
              <stop offset=".45" stopColor="#ffe9a2" stopOpacity=".13" />
              <stop offset="1" stopColor="#ffe9a2" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-core`}>
              <stop stopColor="#fffce6" stopOpacity=".65" />
              <stop offset="1" stopColor="#fffce6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 51 168 12v88L0 61z" fill={`url(#${id}-beam)`} />
          <path d="M0 54 144 35v42L0 58z" fill={`url(#${id}-core)`} />
          <g className="buddy-beam-dust" fill="#fff1b6">
            <rect x="28" y="53" width="1" height="1" />
            <rect x="64" y="43" width="1" height="1" />
            <rect x="97" y="70" width="1" height="1" />
          </g>
        </svg>
        <svg className="buddy-flashlight" viewBox="0 0 36 20" shapeRendering="crispEdges">
          <path d="M1 6h19V3h4V1h8v3h3v12h-3v3h-8v-2h-4v-3H1z" fill="#06171c" />
          <path d="M3 7h18v7H3z" fill="#537d88" />
          <path d="M4 7h17v2H4zM21 5h3v10h-3z" fill="#b5e3e1" />
          <path d="M5 10h3v4H5zM10 10h3v4h-3zM15 10h3v4h-3z" fill="#233e4d" />
          <path d="M24 3h7v14h-7z" fill="#d5a448" />
          <path d="M25 4h6v3h-6z" fill="#fff0ae" />
          <path d="M25 14h6v3h-6z" fill="#986633" />
          <path d="M30 5h3v10h-3z" fill="#fffce3" />
          <path d="M12 5h5v2h-5z" fill="#3fff97" />
          <path d="M6 13h9v5H6z" fill="#082a28" />
          <path d="M7 13h7v3H7z" fill="#72dcba" />
          <path d="M8 13h5v1H8z" fill="#d0fff0" />
        </svg>
      </span>

      <svg className="buddy-breaker-box" viewBox="0 0 48 64" shapeRendering="crispEdges">
        <path d="M9 57h4v7H9zM33 57h4v7h-4z" fill="#527580" />
        <path d="M10 58h1v6h-1zM34 58h1v6h-1z" fill="#a4b8ad" />
        <path d="M4 1h38v3h4v52h-4v4H4v-4H1V5h3z" fill="#07151d" />
        <path d="M4 4h38v52H4z" fill="#30535d" />
        <path d="M4 4h38v2H6v48H4z" fill="#8eafb3" />
        <path d="M40 6h3v50H6v-3h34z" fill="#183540" />
        <path d="M7 8h31v40H7z" fill="#102b35" />
        <path d="M8 9h29v9H8z" fill="#061a22" />
        <path d="M13 10h5l-3 3h3l-5 4 1-3h-3z" fill="#ffd166" />
        <path d="M22 11h12v2H22zM22 15h8v1h-8z" fill="#7da5a6" />
        <path d="M22 21h15v13H22z" fill="#06171f" />
        <path d="M24 23h11v8H24z" fill="#bdd6c1" />
        <path d="M25 24h1v2h-1zM29 24h1v2h-1zM33 24h1v2h-1z" fill="#38686b" />
        <rect className="buddy-breaker-needle" x="29" y="25" width="1" height="6" fill="#d66b56" />
        <path d="M28 30h3v2h-3z" fill="#1e4853" />
        <path d="M8 21h11v24H8z" fill="#050f17" />
        <path d="M9 22h1v21H9zM17 22h1v21h-1z" fill="#4a7580" />
        <path d="M11 23h5v2h-5z" fill="#3a9876" />
        <path d="M11 41h5v2h-5z" fill="#b25c51" />
        <g className="buddy-breaker-lever">
          <path d="M12 29h3v10h-3z" fill="#a7c3c6" />
          <path d="M14 30h2v9h-2z" fill="#43626f" />
          <path d="M9 27h9v6H9z" fill="#611e36" />
          <path d="M9 27h8v4H9z" fill="#ee697a" />
          <path d="M10 27h6v1h-6z" fill="#ffb6a2" />
        </g>
        <path d="M11 38h6v3h-6z" fill="#52747d" />
        <rect className="buddy-breaker-led buddy-breaker-led-a" x="23" y="37" width="4" height="3" fill="#ff726d" />
        <rect className="buddy-breaker-led buddy-breaker-led-b" x="32" y="37" width="4" height="3" fill="#ff726d" />
        <g fill="#608189"><path d="M23 43h14v1H23zM23 46h14v1H23z" /></g>
        <path d="M7 50h31v3H7z" fill="#081b22" />
        <path d="M8 50h4v1H8zM10 51h4v2h-4zM18 50h4v1h-4zM20 51h4v2h-4zM28 50h4v1h-4zM30 51h4v2h-4z" fill="#e4bb68" />
        <path d="M5 6h2v2H5zM38 6h2v2h-2zM5 53h2v2H5zM38 53h2v2h-2z" fill="#d1e5db" />
        <path className="buddy-breaker-power-track" d="M11 61v2h24v-2" fill="none" stroke="#57efbf" strokeWidth="1" />
      </svg>

      <svg className="buddy-repair-arm" viewBox="0 0 48 20" shapeRendering="crispEdges">
        <path d="M1 9h9V6h9v3h19v7H16v-2H1z" fill="#062323" />
        <path d="M3 10h10V8h5v3h20v3H16v-2H3z" fill="#3d927e" />
        <path d="M19 10h17v2H19z" fill="#a1ead2" />
        <path d="M34 6h10v3h3v6h-3v3H34z" fill="#09332e" />
        <path d="M35 7h8v3h-4v3h5v3h-9z" fill="#73deb7" />
        <path d="M36 7h6v2h-6z" fill="#d0fff0" />
      </svg>
      <span className="buddy-breaker-sparks"><i /><i /><i /><i /></span>
      <span className="buddy-power-return"><i /><i /><i /></span>
    </span>
  );
}
