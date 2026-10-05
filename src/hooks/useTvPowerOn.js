import { useEffect, useState } from "react";

// How long the CRT warms up before the game is plugged in. Matches the beam in
// arcade-tv.css (.arcade-tv-crt), which has filled the screen by then.
const WARM_UP_MS = 880;

// Closing a game TV: the set switches off first (picture to line, line to
// dot, 520ms in arcade-tv.css), then the cabinet fades out like any modal
// (150ms). Pass it to useModalPresence so the modal stays up for both.
export const TV_CLOSE_MS = 690;

// A game TV opens switched off, warms up, and only then loads its game.
// `channel` tells sessions apart, so a different game on the same set warms up
// again. While the modal closes the set stays on, so the game's picture is
// what collapses when it switches off.
export function useTvPowerOn(open, channel) {
  const [tv, setTv] = useState({ open: false, channel: null, powered: false });
  if (open && (!tv.open || tv.channel !== channel)) {
    setTv({ open: true, channel, powered: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  } else if (!open && tv.open) {
    setTv({ ...tv, open: false });
  }
  useEffect(() => {
    if (!tv.open || tv.powered) return undefined;
    const timer = window.setTimeout(() => setTv((current) => current.open ? { ...current, powered: true } : current), WARM_UP_MS);
    return () => window.clearTimeout(timer);
  }, [tv.open, tv.powered, tv.channel]);
  return tv.powered;
}
