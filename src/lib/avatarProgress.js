export const AVATAR_DOWNLOAD_PROGRESS = 82;

export function avatarDownloadProgress({ lengthComputable, loaded, total }) {
  if (!lengthComputable || !Number.isFinite(total) || total <= 0 || !Number.isFinite(loaded)) return null;
  // Decoded bytes can exceed Content-Length on compressed responses. Download
  // completion must never consume the GPU preparation / entrance portion.
  return Math.max(0, Math.min(1, loaded / total)) * AVATAR_DOWNLOAD_PROGRESS;
}

export function advanceAvatarProgress(previous, value) {
  if (!Number.isFinite(value)) return previous;
  return Math.max(previous, Math.min(100, Math.max(0, Math.round(value))));
}
