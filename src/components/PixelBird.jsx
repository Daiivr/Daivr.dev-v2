export function PixelBird({ className = "" }) {
  return (
    <svg className={`pixel-bird-svg ${className}`} viewBox="0 0 34 26" aria-hidden="true" shapeRendering="crispEdges">
      <g className="pixel-bird-feet">
        <path d="M15 20h2v4h3v2h-7v-2h2zM23 20h2v4h4v2h-7v-2h1z" fill="#98643f" />
        <path d="M15 22h1v3h3v1h-6v-1h2zM23 22h1v3h4v1h-6v-1h1z" fill="#e9bd78" />
      </g>
      <g className="pixel-bird-body">
        <g className="pixel-bird-tail">
          <path d="M12 14H8v-2H4v-2H0v6h3v3h8v2h4z" fill="#122d40" />
          <path d="M2 12h3v2h4v2h4v3H7v-2H4v-2H2z" fill="#438999" />
          <path d="M2 12h3v2h4v1H4v-1H2z" fill="#9dcec5" />
        </g>
        <g className="pixel-bird-wing pixel-bird-wing-back">
          <path d="M19 16h-5v-3h-3V9H8V5H6V0h3v2h3v3h3v4h3z" fill="#173e53" />
          <path d="M9 4h2v3h3v4h3v4h-2v-3h-3V9h-2z" fill="#6db6ba" />
        </g>
        <path d="M10 10h6V7h10v3h4v9h-3v3h-5v2h-9v-2h-3V19H8v-6h2z" fill="#102c39" />
        <path d="M12 10h13v2h3v7h-3v3H14v-2h-3v-7h1z" fill="#548e98" />
        <path d="M18 13h10v6h-3v3h-8v-2h-2v-5h3z" fill="#d9dfbc" />
        <path d="M16 19h3v2h6v1h-9z" fill="#a3bda7" />
        <g className="pixel-bird-folded-wing">
          <path d="M11 12h9v2h3v3h-3v3h-7v-2h-3v-4h1z" fill="#214959" />
          <path d="M12 13h7v2h2v2h-3v2h-5v-2h-2v-2h1z" fill="#4599ac" />
          <path d="M12 13h7v2h-7zM14 17h5v1h-5z" fill="#9cdbd3" />
          <path d="M12 17h2v3h-2zM16 18h2v2h-2z" fill="#153b51" />
        </g>
        <g className="pixel-bird-head">
          <path d="M21 4h8v2h2v9h-3v2h-7v-2h-3V8h3z" fill="#122f41" />
          <path d="M22 5h6v2h2v6h-3v3h-6v-2h-2V9h3z" fill="#70b2ba" />
          <path d="M22 5h5v2h-5v2h-2V7h2z" fill="#b5e5d5" />
          <path d="M22 11h7v3h-3v2h-5v-3h1z" fill="#e7ebcc" />
          <path d="M30 10h3v1h1v2h-4z" fill="#f0c575" />
          <path d="M30 13h3v1h-3z" fill="#b48049" />
          <g className="pixel-bird-eye"><path d="M25 8h3v3h-3z" fill="#061520" /><path d="M25 8h1v1h-1z" fill="#f2fff3" /></g>
        </g>
        <g className="pixel-bird-wing pixel-bird-wing-front">
          <path d="M20 16h-5v-3h-3v-3H9V7H6V3H4v-5h3v2h3v3h3v3h3v4h3z" fill="#173b50" />
          <path d="M7 3h3v3h3v3h3v4h3v3h-3v-3h-3v-3h-3V7H7z" fill="#4da4b7" />
          <path d="M7 3h2v3h3v3h3v3h2v2h-3v-3h-3V8H8V6H7z" fill="#b2e2d9" />
          <path d="M11 10h2v3h3v3h-2v-2h-3z" fill="#2b6f89" />
        </g>
      </g>
    </svg>
  );
}
