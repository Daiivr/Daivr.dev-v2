const SEEN_KEY = "daivr-fallout-splash-seen.v1";
let seenThisPage = false;

export function hasSeenFalloutSplash() {
  if (seenThisPage) return true;
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberFalloutSplash() {
  seenThisPage = true;
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* Keep the in-memory fallback when storage is unavailable. */ }
}
