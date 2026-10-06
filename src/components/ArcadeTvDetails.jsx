import { useState } from "react";
import { Maximize } from "lucide-react";

/** Decorative cabinet hardware; game controls remain in the modal header,
    except two optional real controls on the panel: a fullscreen push button
    (`onFullscreen`) and a volume fader (`volume`, see ArcadeTvVolume). */
export function ArcadeTvDetails({ channel, powered = true, off = false, onFullscreen, volume }) {
  const controls = Boolean(onFullscreen || volume);
  return (
    <aside className={`arcade-tv-hardware ${off ? "is-off" : powered ? "is-on" : "is-warming"}`} aria-hidden={controls ? undefined : "true"} aria-label={controls ? "TV controls" : undefined}>
      <div className="arcade-tv-maker" aria-hidden="true"><strong>DAI VISION</strong><span>COLOR SYSTEM / 86</span></div>
      <div className="arcade-tv-channel" aria-hidden="true"><small>AV CHANNEL</small><strong>{channel}</strong><span><i /> {powered ? "SIGNAL LOCKED" : "TUNING..."}</span></div>
      <div className="arcade-tv-tuner" aria-hidden="true"><span className="arcade-tv-dial"><i /></span><small>UHF · VHF</small></div>
      {onFullscreen ? <button type="button" className="arcade-tv-fullscreen" onClick={onFullscreen} disabled={!powered || off}>
        <i aria-hidden="true" /><Maximize size={12} aria-hidden="true" /><span>FULL SCREEN</span>
      </button> : null}
      {volume ? <ArcadeTvVolume {...volume} /> : null}
      <div className="arcade-tv-speaker" aria-hidden="true" />
      <div className="arcade-tv-power" aria-hidden="true"><i /><span>STEREO SOUND</span></div>
    </aside>
  );
}

/** The set's volume fader: an LCD readout like the AV channel box over a
    recessed track with a metal cap. `value` is 0-100. The TV panel shows it on
    desktop; `compact` is the copy for the footer, shown only on phones, where
    the panel is hidden (arcade-tv.css). */
export function ArcadeTvVolume({ value, onChange, label, compact = false }) {
  const level = Math.round(Math.min(100, Math.max(0, Number(value) || 0)));
  return (
    <label className={`arcade-tv-volume${compact ? " is-compact" : ""}`}>
      <span className="arcade-tv-volume-readout" aria-hidden="true"><small>VOLUME</small><b>{level === 0 ? "MUTE" : String(level).padStart(2, "0")}</b></span>
      <input type="range" min="0" max="100" step="1" value={level} style={{ "--level": `${level}%` }} onChange={(event) => onChange(Number(event.target.value))} aria-label={label} aria-valuetext={level === 0 ? "Muted" : `${level}%`} />
      <span className="arcade-tv-volume-ticks" aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</span>
    </label>
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
