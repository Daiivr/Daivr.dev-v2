// Keep the host's space reserved while its 3D chunk loads. The gate seam and
// bottom status strip provide loading feedback throughout both loading stages.
export function AvatarScenePlaceholder({ displayName }) {
  return (
    <div className="entry-avatar-scene is-loading is-concealed" role="img" aria-label={`3D avatar greeting ${displayName}`}>
      <div className="entry-avatar-scan" aria-hidden="true" />
    </div>
  );
}
