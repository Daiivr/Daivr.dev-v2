export function PixelFrog() {
  return <svg className="pixel-frog-svg" viewBox="0 0 48 32" width="48" height="32" aria-hidden="true" shapeRendering="crispEdges">
    <path d="M21 23h6v5h13v2H23l-4-3z" fill="#225940" />
    <g className="pixel-frog-body">
      <path d="M7 18h3v-5h6v-3h10V6h7v3h3V5h7v4h2v5h2v8h-4v3H18v-2H7z" fill="#183e2b" />
      <path d="M10 17h3v-3h6v-2h10V8h3v5h6V7h3v4h2v5h2v5h-6v3H18v-3h-8z" fill="#5f9860" />
      <path d="M13 15h7v-2h9v2h-8v2h-8m22-5h4v2h-4m-16 3h5v2h-5" fill="#92ba77" />
      <path d="M20 21h10v-2h14v3h-5v3H22z" fill="#ccd3a0" />
      <path d="M16 18h3v2h-3m7-4h3v2h-3m5 3h2v2h-2m-15-5h2v2h-2" fill="#3b7049" />
      <g className="pixel-frog-eye"><path d="M27 8h4v5h-4z" fill="#bec78b" /><path d="M29 9h2v3h-2z" fill="#122e22" /><path d="M37 8h5v6h-5z" fill="#e9dfa3" /><path d="M39 9h3v4h-3z" fill="#102b21" /><path d="M39 9h1v1h-1z" fill="#fffbe2" /></g>
      <path d="M36 18h9v1h-9m-3 0h3v1h-3" fill="#244b32" />
      <path d="M41 15h1v1h-1" fill="#183e2b" />
      <path className="pixel-frog-throat" d="M30 21h10v3H30z" fill="#d7dda9" />
    </g>
    <g className="pixel-frog-hind-leg"><path d="M8 18h10v2h4v5h-6l-4 3H3v-3h4l4-3H7z" fill="#234e33" /><path d="M9 18h8v2h3v3h-7l-3 3H6l7-5H9z" fill="#76a268" /><path d="M2 27h12v2H2m0 0v1H0v-2h2m4 1v2H4v-2m6 0v1H8v-1" fill="#a3bd83" /></g>
    <g className="pixel-frog-front-leg"><path d="M31 22h4v5h8v2H30v-2h-2v-4z" fill="#3b754e" /><path d="M32 27h11v2H32m11-1h3v2h-3m-5 0h2v2h-2m-5-2h2v3h-2" fill="#b8cd93" /></g>
  </svg>;
}
