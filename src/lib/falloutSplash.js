const SEEN_KEY = "daivr-fallout-splash-session.v1";
let seenThisPage = false;

export function hasSeenFalloutSplash() {
  if (seenThisPage) return true;
  try {
    return document.cookie.split(";").some((cookie) => cookie.trim() === `${SEEN_KEY}=1`);
  } catch {
    return false;
  }
}

export function rememberFalloutSplash() {
  seenThisPage = true;
  // No expiry: share the flag across tabs for this browser session only.
  try { document.cookie = `${SEEN_KEY}=1; Path=/; SameSite=Lax`; } catch { /* Keep the in-memory fallback when cookies are unavailable. */ }
}
