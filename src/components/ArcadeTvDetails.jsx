import { useState } from "react";

/** Decorative cabinet hardware; game controls remain in the modal header. */
export function ArcadeTvDetails({ channel, powered = true, off = false }) {
  return (
    <aside className={`arcade-tv-hardware ${off ? "is-off" : powered ? "is-on" : "is-warming"}`} aria-hidden="true">
      <div className="arcade-tv-maker"><strong>DAI VISION</strong><span>COLOR SYSTEM / 86</span></div>
      <div className="arcade-tv-channel"><small>AV CHANNEL</small><strong>{channel}</strong><span><i /> {powered ? "SIGNAL LOCKED" : "TUNING..."}</span></div>
      <div className="arcade-tv-tuner"><span className="arcade-tv-dial"><i /></span><small>UHF · VHF</small></div>
      <div className="arcade-tv-speaker" />
      <div className="arcade-tv-power"><i /><span>STEREO SOUND</span></div>
    </aside>
  );
}

/** The CRT switching on and off, drawn over the screen.
    On: a dot of light stretches into a line, the line opens into a flash that
    fills the screen, and the flash fades over the game, which mounts under it
    once `powered` (see useTvPowerOn).
    Off: the picture itself squashes into a bright line (arcade-tv.css), the
    line shrinks to a dot and the dot fades, before the cabinet goes away. */
export function ArcadeTvPower({ powered, off = false }) {
  const [faded, setFaded] = useState(false);
  if (!powered && faded) setFaded(false);
  if (off) return <div className="arcade-tv-crt is-off" aria-hidden="true"><i /></div>;
  if (faded) return null;
  return (
    <div className="arcade-tv-crt is-on" data-powered={powered || undefined} aria-hidden="true"
      onAnimationEnd={(event) => { if (event.animationName === "arcade-tv-glow-out") setFaded(true); }}>
      <i />
    </div>
  );
}
