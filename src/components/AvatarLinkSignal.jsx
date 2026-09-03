// Medidor AVATAR LINK del splash. Vive fuera de AvatarGreeting para que el
// hueco de Suspense (mientras baja el chunk de three.js) y el estado de carga
// del VRM dibujen exactamente la misma escena, sin salto visual entre los dos.

export function AvatarLinkSignal({ progress = 0, status = "loading" }) {
  const offline = status === "error";
  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  const caption = offline
    ? "manual greeting ready"
    : percent > 0
      ? `acquiring host // ${percent}%`
      : "acquiring host signal";

  return (
    <div className="entry-avatar-fallback" aria-hidden="true">
      <div className="entry-avatar-link">
        <span className="entry-avatar-link-bars"><i /><i /><i /><i /><i /></span>
        <strong>{offline ? "HOST OFFLINE" : "AVATAR LINK"}</strong>
        <small>{caption}</small>
        {offline ? null : (
          <span className="entry-avatar-link-meter">
            <i style={{ width: `${percent}%` }} />
          </span>
        )}
      </div>
    </div>
  );
}

export function AvatarScenePlaceholder({ displayName }) {
  return (
    <div className="entry-avatar-scene is-loading is-concealed" role="img" aria-label={`3D avatar greeting ${displayName}`}>
      <div className="entry-avatar-scan" aria-hidden="true" />
      <AvatarLinkSignal />
    </div>
  );
}
