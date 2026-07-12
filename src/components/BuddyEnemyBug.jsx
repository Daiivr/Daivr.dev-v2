export function BuddyEnemyBug({ bugId }) {
  const color = bugId === "null-beetle" ? "#ff5f68" : bugId === "stack-roach" ? "#ff3d9d" : "#a78bfa";

  return (
    <svg className={`buddy-enemy-bug is-${bugId}`} viewBox="0 0 34 24" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <path d="M8 5h5V2h8v3h5v3h4v10h-4v3H8v-3H4V8h4z" fill="#071b1c" />
        <path d="M10 6h5V4h4v2h5v3h3v8h-4v2H11v-2H7V9h3z" fill={color} />
        <rect x="11" y="8" width="4" height="4" fill="#020604" />
        <rect x="20" y="8" width="4" height="4" fill="#020604" />
        <rect x="12" y="8" width="1" height="1" fill="#f4fff8" />
        <rect x="21" y="8" width="1" height="1" fill="#f4fff8" />
        <path d="M8 9H1m7 5H0m27-5h7m-7 5h7M12 5 8 0m14 5 4-5" fill="none" stroke={color} strokeWidth="2" />
        {bugId === "stack-roach" ? <rect x="16" y="6" width="3" height="12" fill="#7e174c" /> : null}
        {bugId === "memory-mite" ? <path d="m17 13-4 5h8z" fill="#ffd166" /> : null}
      </g>
    </svg>
  );
}
