export function PixelFrog() {
  return <svg className="pixel-frog-svg" viewBox="0 0 40 28" width="40" height="28" aria-hidden="true" shapeRendering="crispEdges">
    <g className="pixel-frog-hind-leg">
      <path d="M4 14h12v4h-3v5H3v-3H1v-4h3z" fill="#103d2d" />
      <path d="M5 15h8v4H9v4H2v-2h3z" fill="#28ae67" />
      <path d="M1 24h13v3H0v-2h1z" fill="#b5ef96" />
    </g>
    <g className="pixel-frog-body">
      <path d="M9 11h5V7h8V3h5V1h7v3h3v6h2v10h-5v3H15v-2H9z" fill="#103d2d" />
      <path d="M11 12h5V8h9V4h9v7h3v8h-5v3H16v-3h-5z" fill="#59d982" />
      <path d="M14 10h10v2H14m-3 3h4v3h-4m7-9h6v1h-6" fill="#a9f6a1" />
      <path d="M19 18h17v2h-5v3H19z" fill="#e6efad" />
      <path d="M16 14h3v2h-3m6-5h2v2h-2m-2 5h3v2h-3" fill="#249267" />
      <g className="pixel-frog-eye"><path d="M27 4h7v7h-7z" fill="#effbc2" /><path d="M30 5h3v5h-3z" fill="#05271e" /><rect x="30" y="5" width="1" height="1" fill="#fff" /></g>
      <path d="M32 15h6v1h-6m-2 1h3v1h-3" fill="#174b37" />
      <rect x="27" y="13" width="3" height="2" fill="#f5b98c" />
      <path className="pixel-frog-throat" d="M28 19h7v3h-7z" fill="#e6efad" />
    </g>
    <g className="pixel-frog-front-leg"><path d="M26 21h4v3h7v3H25v-2h-2v-4z" fill="#249267" /><path d="M26 25h12v2H26z" fill="#b5ef96" /></g>
  </svg>;
}
