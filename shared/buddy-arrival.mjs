import { walkDuration } from "./buddy-motion.mjs";

export const PORTAL_CHANCE = 0.05;
export const PORTAL_OPEN_MS = 650;
export const PORTAL_WALK_MS = walkDuration(84);
export const PORTAL_CLOSE_MS = 650;

// Roll once when the splash launches, never during a render or a retry.
export function chooseBuddyArrival(random = Math.random) {
  return random() < PORTAL_CHANCE ? "portal" : "parachute";
}

// The two gates are independent: finishing the entrance cannot reveal Buddy
// at an unseen footer, and an early scroll cannot skip his entrance.
export function startPortalJourney({ onPhase, onDeparted, onDone, reducedMotion = false, schedule = setTimeout, cancel = clearTimeout }) {
  let phase = "depart-open", visible = false, ready = false, disposed = false, timer;
  const change = (next) => { phase = next; onPhase(next); };
  const after = (ms, fn) => { timer = schedule(() => { if (!disposed) fn(); }, reducedMotion ? 120 : ms); };
  const arrive = () => {
    if (phase !== "waiting" || !visible || !ready || disposed) return;
    change("arrive-open");
    after(PORTAL_OPEN_MS, () => {
      change("arrive-walk");
      after(PORTAL_WALK_MS, () => {
        change("arrive-close");
        after(PORTAL_CLOSE_MS, onDone);
      });
    });
  };
  change(phase);
  after(PORTAL_OPEN_MS, () => {
    change("depart-walk");
    after(PORTAL_WALK_MS, () => {
      change("depart-close");
      after(PORTAL_CLOSE_MS, () => { change("waiting"); onDeparted?.(); arrive(); });
    });
  });
  return {
    setFooterVisible(value) { visible = value; arrive(); },
    setPageReady(value) { ready = value; arrive(); },
    dispose() { disposed = true; cancel(timer); }
  };
}
