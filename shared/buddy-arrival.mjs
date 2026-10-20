import { walkDuration } from "./buddy-motion.mjs";

export const PORTAL_CHANCE = 0.05;
// La grieta se abre (chispa, raja de luz, ovalo con rebote).
export const PORTAL_OPEN_MS = 950;
// En la puerta: un salto de ganas, camina hasta que el portal se lo traga
// entero y un "trago" del remolino.
export const PORTAL_HOP_MS = 500;
export const PORTAL_DIVE_PX = 60;
export const PORTAL_GULP_MS = 300;
export const PORTAL_WALK_MS = PORTAL_HOP_MS + walkDuration(PORTAL_DIVE_PX) + PORTAL_GULP_MS;
// En el footer: sale del remolino y da unos pasos por el sendero.
export const PORTAL_EMERGE_PX = 64;
export const PORTAL_EMERGE_MS = walkDuration(PORTAL_EMERGE_PX);
// El ovalo se cierra en una raja y la raja en una estrella.
export const PORTAL_CLOSE_MS = 800;
// Ya fuera, se gira a despedirse del portal y vuelve a mirar al frente.
export const PORTAL_SETTLE_MS = 400;

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
      after(PORTAL_EMERGE_MS, () => {
        change("arrive-close");
        after(PORTAL_CLOSE_MS + PORTAL_SETTLE_MS, onDone);
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
