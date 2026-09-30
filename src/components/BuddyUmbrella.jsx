export function BuddyUmbrella() {
  return (
    <svg className="buddy-umbrella" viewBox="0 0 48 54" width="64" height="72" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <g className="buddy-umbrella-shaft">
          <path d="M22 16h4v32h4v-7h4v9h-2v3h-8v-3h-2z" fill="#163d49" />
          <path d="M23 17h2v31h-2z" fill="#88c2c8" />
          <path d="M23 18h1v24h-1z" fill="#d9eee0" />
          <path d="M24 46h2v4h5v-8h2v9h-2v1h-6v-2h-1z" fill="#c89568" />
          <path d="M25 48h1v2h4v1h-5z" fill="#f4d4a1" />
        </g>
        <g className="buddy-umbrella-canopy">
          <path d="M22 0h4v4h-4z" fill="#d6aa60" /><path d="M23 0h1v2h-1z" fill="#fff1bd" />
          <path d="M16 3h16v3h6v3h5v4h3v8h-7v-2h-6v3h-7v-2h-5v2h-7v-3H8v2H2v-8h3V9h5V6h6z" fill="#183644" />
          <path d="M16 5h16v3h6v3h5v4h1v3h-7v-2h-7v3H18v-3h-7v2H4v-4h3v-4h5V8h4z" fill="#447f91" />
          <path d="M21 5h6v3h3v5h3v5H17v-5h2V8h2z" fill="#a6558e" />
          <path d="M22 5h4v3h2v6h2v3H19v-4h2V8h1z" fill="#d17aaa" />
          <path d="M16 6h5v2h-4v3h-4v4H8v2H5v-3h3v-4h5V8h3z" fill="#83c9cc" />
          <path d="M30 7h3v2h4v3h4v3h2v2h-5v-3h-5v-4h-3z" fill="#326171" />
          <path d="M21 5h2v3h-2v5h-2v5h-2v-5h2V8h2m6-3h2v3h2v5h2v5h-2v-5h-2V8h-2z" fill="#304759" />
          <path d="M5 18h7v-1h5v3h4v-2h6v2h5v-3h5v1h6v2h-5v-1h-5v3h-7v-2h-5v2h-7v-3H8v1H5z" fill="#a3ddd4" />
          <path d="M18 6h3v1h-3m5-2h2v5h-2" fill="#f5d6e2" />
          <g className="buddy-umbrella-splashes">
            {[[8, 11], [16, 7], [24, 3], [34, 8], [41, 13]].map(([x, y], index) => (
              <g key={index} transform={`translate(${x} ${y})`}>
                <g className="buddy-umbrella-splash" style={{ "--splash-i": index }}>
                  <path d="M-3-3h2v2h-2m5-3h1v2H2m-2 2h1v2H0z" fill="#bbe7e5" />
                </g>
              </g>
            ))}
          </g>
          <g className="buddy-umbrella-runoff" fill="#84d4de">
            <path className="umbrella-drip umbrella-drip-l" d="M3 21h2v3H3z" />
            <path className="umbrella-drip umbrella-drip-r" d="M42 21h2v3h-2z" />
          </g>
        </g>
      </g>
    </svg>
  );
}
