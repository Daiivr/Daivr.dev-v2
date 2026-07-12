export function PixelLeapFish({ color = "#45d8ff" }) {
  return (
    <svg className="pixel-leap-fish-svg" viewBox="0 0 42 28" width="42" height="28" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <path d="M3 12h6V8h5V5h15v3h5v4h5v7h-5v4h-5v3H14v-3H9v-4H3L0 23V8z" fill={color} />
        <path d="M13 5h10V2h7v5H13z" fill="#b8f7ff" opacity=".72" />
        <path d="M13 24h10v4h-8z" fill="#ff3d9d" opacity=".82" />
        <rect x="31" y="10" width="4" height="4" fill="#f4fff8" />
        <rect x="33" y="11" width="2" height="2" fill="#020604" />
        <rect x="36" y="18" width="4" height="2" fill="#071b1c" />
        <rect x="15" y="9" width="10" height="2" fill="#f4fff8" opacity=".34" />
      </g>
    </svg>
  );
}
