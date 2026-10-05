import { useEffect, useState } from "react";

// Matches the closing animations in modal-motion.css.
const EXIT_MS = 150;

// Radix dialogs wait for their closing animation on their own. A modal that
// doesn't use Radix, or whose parent unmounts it, would vanish instead: this
// keeps it on screen a little longer (EXIT_MS, or `exitMs` for a modal with a
// longer goodbye, like the game TVs switching off), marked data-state="closed",
// so it can play the same animation. `value` is anything truthy while the
// modal is open; the last one stays available as `item` until the modal has
// finished closing, so its content doesn't empty out while it fades.
export function useModalPresence(value, exitMs = EXIT_MS) {
  const [shown, setShown] = useState(value || null);
  if (value && value !== shown) setShown(value);
  useEffect(() => {
    if (value || !shown) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setShown(null), reduced ? EXIT_MS : exitMs);
    return () => window.clearTimeout(timer);
  }, [value, shown, exitMs]);
  return { item: value || shown, state: value ? "open" : "closed" };
}
