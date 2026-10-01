const COMMAND_EVENTS = Object.freeze({
  leviathan: "daivr-buddy-leviathan",
  kraken: "daivr-buddy-kraken",
  blackout: "daivr-buddy-outage",
  powerout: "daivr-buddy-outage",
  "power-out": "daivr-buddy-outage"
});

export function buddyDiagnosticEvent(command) {
  return Object.hasOwn(COMMAND_EVENTS, command) ? COMMAND_EVENTS[command] : null;
}

// Check the signed Discord session afresh at the event receiver, including
// direct diagnostic events. Local profile flags are never permission grants.
export async function runAdminBuddyDiagnostic(start, fetchSession = fetch) {
  let user;
  try {
    const response = await fetchSession("/api/comments/me", {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return "offline";
    user = (await response.json())?.user;
  } catch {
    return "offline";
  }
  if (!user) return "signed-out";
  if (user.isAdmin !== true) return "denied";
  return start();
}
