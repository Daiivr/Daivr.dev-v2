import { useState } from "react";

function getInitials(name = "?") {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

export function RankingAvatar({ src, name, loading = "lazy" }) {
  const [failedSrc, setFailedSrc] = useState("");
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div className="ranking-avatar" aria-hidden="true">
      {showImage ? (
        <img
          src={src}
          alt=""
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <i>{getInitials(name)}</i>
      )}
    </div>
  );
}
