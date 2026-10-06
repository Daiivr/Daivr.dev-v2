import { useState } from "react";
import { Maximize } from "lucide-react";

/** Decorative cabinet hardware; game controls remain in the modal header,
    except an optional fullscreen push button (`onFullscreen`) on the panel. */
export function ArcadeTvDetails({ channel, powered = true, off = false, onFullscreen }) {
  return (
    <aside className={`arcade-tv-hardware ${off ? "is-off" : powered ? "is-on" : "is-warming"}`} aria-hidden={onFullscreen ? undefined : "true"} aria-label={onFullscreen ? "TV controls" : undefined}>
      <div className="arcade-tv-maker" aria-hidden="true"><strong>DAI VISION</strong><span>COLOR SYSTEM / 86</span></div>
      <div className="arcade-tv-channel" aria-hidden="true"><small>AV CHANNEL</small><strong>{channel}</strong><span><i /> {powered ? "SIGNAL LOCKED" : "TUNING..."}</span></div>
      <div className="arcade-tv-tuner" aria-hidden="true"><span className="arcade-tv-dial"><i /></span><small>UHF · VHF</small></div>
      {onFullscreen ? <button type="button" className="arcade-tv-fullscreen" onClick={onFullscreen} disabled={!powered || off}>
        <i aria-hidden="true" /><Maximize size={12} aria-hidden="true" /><span>FULL SCREEN</span>
      </button> : null}
      <div className="arcade-tv-speaker" aria-hidden="true" />
      <div className="arcade-tv-power" aria-hidden="true"><i /><span>STEREO SOUND</span></div>
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
