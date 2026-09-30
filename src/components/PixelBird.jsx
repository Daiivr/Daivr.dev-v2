export function PixelBird({ className = "" }) {
  return (
    <svg className={`pixel-bird-svg ${className}`} viewBox="0 0 34 26" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <path d="M5 10h6V5h12V4h8v5h3v8h-4v5h-7v3H10v-4H5z" fill="#203d4b" />
        <g className="pixel-bird-wing pixel-bird-wing-back">
          <path d="M8 12 1 5v10h9z" fill="#2b86a3" />
          <rect x="2" y="8" width="5" height="3" fill="#b8f7ff" />
        </g>
        <path d="M7 10h5V7h12v3h5v10h-5v3H11v-3H7z" fill="#58a0b2" />
        <rect x="11" y="11" width="13" height="8" fill="#386e88" />
        <path d="M9 18h5v3h9v2H11v-2H9m3-13h8v2h-8" fill="#92c5c2" />
        <g className="pixel-bird-wing pixel-bird-wing-front">
          <path d="m13 12 11 2-6 8h-6z" fill="#b8f7ff" />
          <rect x="15" y="15" width="7" height="3" fill="#45d8ff" />
        </g>
        <rect x="23" y="7" width="7" height="8" fill="#b8f7ff" />
        <path d="M23 13h4v3h-4" fill="#7daab8" />
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
