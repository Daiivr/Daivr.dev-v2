export function PixelFrog() {
  return (
    <svg className="pixel-frog-svg" viewBox="0 0 36 23" width="36" height="23" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <g className="pixel-frog-hind-leg">
          <path d="M2 13h10v4H8v3H1v-4h1z" fill="#29b96f" />
          <rect x="0" y="20" width="10" height="3" fill="#b4ffcf" />
        </g>
        <g className="pixel-frog-front-leg">
          <path d="M25 15h5v5h5v3h-9v-4h-3z" fill="#29b96f" />
        </g>
        <path className="pixel-frog-body" d="M8 8h5V5h13V3h6v3h3v10h-5v3H13v-3H8z" fill="#3fff97" />
        <rect x="25" y="1" width="7" height="7" fill="#73ffad" />
        <rect x="28" y="3" width="3" height="3" fill="#020604" />
        <rect x="32" y="9" width="4" height="2" fill="#b4ffcf" />
        <rect x="28" y="13" width="5" height="2" fill="#168a52" />
        <rect x="12" y="9" width="5" height="3" fill="#b4ffcf" opacity=".48" />
      </g>
    </svg>
  );
}
