export function CommentAdminBadge() {
  return (
    <span className="comment-admin-badge has-tooltip" role="img" aria-label="Admin" data-tooltip="Admin" tabIndex={0}>
      <svg className="comment-admin-mascot" width="16" height="16" viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges" aria-hidden="true">
        {/* A tiny crowned cat, drawn on the same pixel grid as the arcade art. */}
        <path d="M2 5h3v2h6V5h3v3h1v5h-2v2H3v-2H1V8h1z" fill="currentColor" />
        <path d="M3 6h1v3H3zM12 6h1v3h-1z" fill="#071b1c" />
        <path d="M3 12h10v2H3z" fill="#071b1c" opacity=".22" />
        <path d="M4 9h2v2H4zM10 9h2v2h-2zM7 11h2v1H7z" fill="#071b1c" />
        <path d="M3 11h2v1H3zM11 11h2v1h-2z" fill="#f28dae" />
        <path d="M5 1h1v1h1V0h2v2h1V1h1v5H5z" fill="#ffd782" />
        <path d="M6 4h4v1H6z" fill="#fff0bc" />
        <path d="M7 2h2v1H7z" fill="#ee98b4" />
      </svg>
    </span>
  );
}
