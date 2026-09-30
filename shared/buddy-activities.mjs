export const BUDDY_ACTIVITIES = [
  { id: "fish", title: "Cast into the void", label: "Fishing", detail: "Settle by the water and reel in a surprise. Equipped lures affect the catch.", reward: "Fish, treasure & journal discoveries", cooldown: 100000, motion: true },
  { id: "find", title: "Follow a signal", label: "Scavenger patrol", detail: "Send Buddy to investigate something shiny along the footer.", reward: "Collectible patrol finds", cooldown: 70000 },
  { id: "dance", title: "A little victory dance", label: "Dance break", detail: "Give your companion a moment in the spotlight. Every outfit is welcome.", reward: "Just for the joy of it", cooldown: 12000, motion: true },
  { id: "rain", title: "Cozy weather", label: "Rain watch", detail: "Let Buddy open the umbrella and listen to the rain on the cabinet.", reward: "A quiet moment together", cooldown: 85000, motion: true }
];

export function buddyActivityGate(id, { busy = "", reducedMotion = false, remaining = 0 } = {}) {
  const activity = BUDDY_ACTIVITIES.find((entry) => entry.id === id);
  if (!activity) return "That activity is unavailable.";
  if (busy) return "Buddy is finishing another activity. Try again in a moment.";
  if (reducedMotion && activity.motion) return "This activity pauses with reduced motion. Try a scavenger patrol instead.";
  if (remaining > 0) return `Buddy needs ${Math.ceil(remaining / 1000)}s before doing that again.`;
  return "";
}
