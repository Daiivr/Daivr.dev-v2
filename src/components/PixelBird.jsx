export function PixelBird({ className = "" }) {
  return (
    <svg className={`pixel-bird-svg ${className}`} viewBox="0 0 34 26" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <g className="pixel-bird-wing pixel-bird-wing-back">
          <path d="M8 12 1 5v10h9z" fill="#2b86a3" />
          <rect x="2" y="8" width="5" height="3" fill="#b8f7ff" />
        </g>
        <path d="M7 10h5V7h12v3h5v10h-5v3H11v-3H7z" fill="#45d8ff" />
        <rect x="11" y="11" width="13" height="8" fill="#246c8d" />
        <g className="pixel-bird-wing pixel-bird-wing-front">
          <path d="m13 12 11 2-6 8h-6z" fill="#b8f7ff" />
          <rect x="15" y="15" width="7" height="3" fill="#45d8ff" />
        </g>
        <rect x="23" y="7" width="7" height="8" fill="#b8f7ff" />
        <rect x="26" y="9" width="2" height="2" fill="#020604" />
        <path d="M30 11h4l-4 4z" fill="#ffd166" />
        <rect x="13" y="22" width="2" height="4" fill="#ffd166" />
        <rect x="21" y="22" width="2" height="4" fill="#ffd166" />
        <rect x="10" y="24" width="5" height="2" fill="#ffd166" />
        <rect x="21" y="24" width="5" height="2" fill="#ffd166" />
      </g>
    </svg>
  );
}
