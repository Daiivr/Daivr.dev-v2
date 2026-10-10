import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Headphones, Pause, Play, Repeat2, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { musicTracks } from "../data/music";
import "../styles/music-player.css";

// Matching Bézier segments let the edge's liquid silhouette become the panel.
const INK_REST = "M 360 0 C 360 122 357 194 337 211 C 329 217.8 320 218 314 225 C 302 239 304 251 315 263 C 326 273 335 280 343 297 C 351 312 356 326 358 334 C 359 337 360 339 360 340 L 360 0 Z";
const INK_OPEN = "M 360 0 C 350 24 332 24 300 24 C 230 24 85 24 48 24 C 22 24 12 39 12 66 C 12 128 12 257 12 282 C 12 310 35 316 65 316 C 168 316 338 310 360 340 L 360 0 Z";

function timestamp(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function MusicPlayer({ hidden = false, entrySplashOpen = false, tracks = musicTracks }) {
  const [expanded, setExpanded] = useState(false);
  const [docked, setDocked] = useState(true);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const resumeRef = useRef(false);
  const hoverTimerRef = useRef(0);
  const entryStartAttemptedRef = useRef(false);
  const entryStartPendingRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const track = tracks[index];
  const open = expanded && !hidden;

  // One timeline keeps the silhouette and record together, including reversals.
  const morph = useMotionValue(0);
  const inkPath = useTransform(morph, [0, 1], [INK_REST, INK_OPEN]);
  const recordLeft = useTransform(morph, [0, 1], ["calc(100% + -50px)", "calc(0% + 32px)"]);
  const recordTop = useTransform(morph, [0, 1], [216, 46]);
  const recordScale = useTransform(morph, [0, 1], [0.72, 1]);

  useEffect(() => {
    setDocked(false);
    const animation = animate(morph, open ? 1 : 0, {
      duration: reducedMotion ? 0 : open ? 0.72 : 0.58,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => setDocked(!open),
    });
    return () => animation.stop();
  }, [morph, open, reducedMotion]);

  useEffect(() => () => window.clearTimeout(hoverTimerRef.current), []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.getAttribute("src")) return;
    setError("");
    setWaiting(true);
    audio.play().catch((reason) => {
      if (reason.name === "AbortError") return;
      setWaiting(false);
      setError(reason.name === "NotAllowedError" ? "Press play to start the music." : "Couldn't play this track. Try again.");
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    setElapsed(0);
    setDuration(0);
    setError("");
    setPlaying(false);
    setWaiting(false);
    audio.load();
    if (resumeRef.current && track?.src) play();
    resumeRef.current = false;
  }, [track?.src, play]);

  useEffect(() => {
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!entrySplashOpen) {
      if (entryStartPendingRef.current) {
        entryStartPendingRef.current = false;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = muted;
        play();
      }
      return;
    }

    const prepareEntryMusic = () => {
      if (entryStartAttemptedRef.current || !audio.getAttribute("src")) return;
      entryStartAttemptedRef.current = true;
      entryStartPendingRef.current = true;
      // This event fires synchronously from the splash's click/keyboard handler.
      // Prime the same media element silently; audible playback waits for exit.
      audio.muted = true;
      audio.play().then(() => {
        if (entryStartPendingRef.current) {
          audio.pause();
          audio.currentTime = 0;
        }
      }).catch(() => {
        // Retry when the splash leaves; play() supplies the manual fallback.
      });
    };
    window.addEventListener("daivr-splash-enter", prepareEntryMusic);
    return () => window.removeEventListener("daivr-splash-enter", prepareEntryMusic);
  }, [entrySplashOpen, muted, play]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (!rootRef.current?.contains(event.target)) setExpanded(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const close = () => {
    window.clearTimeout(hoverTimerRef.current);
    triggerRef.current?.focus({ preventScroll: true });
    setExpanded(false);
  };

  const skip = (direction, autoPlay = playing) => {
    if (!tracks.length) return;
    if (direction < 0 && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    resumeRef.current = autoPlay;
    setIndex((current) => (current + direction + tracks.length) % tracks.length);
  };

  const status = error ? "SIGNAL LOST" : !track ? "COMING SOON" : waiting ? "TUNING IN" : playing ? "NOW PLAYING" : "ON STANDBY";

  return (
    <section
      ref={rootRef}
      className={`music-island ${open ? "is-expanded" : ""} ${docked && !open ? "is-docked" : ""} ${playing ? "is-playing" : ""} ${!track ? "is-empty" : ""}`}
      aria-label="Cabinet music player"
      hidden={hidden}
      onPointerEnter={(event) => {
        window.clearTimeout(hoverTimerRef.current);
        if (event.pointerType === "mouse") hoverTimerRef.current = window.setTimeout(() => setExpanded(true), 120);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(hoverTimerRef.current);
        // Clicking a control must not pin the panel open through retained focus.
        hoverTimerRef.current = window.setTimeout(() => setExpanded(false), 180);
      }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}
      onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }}
    >
      <audio
        ref={audioRef}
        src={track?.src}
        preload="none"
        loop={repeat}
        onPlay={() => setPlaying(true)}
        onPlaying={() => setWaiting(false)}
        onWaiting={() => setWaiting(true)}
        onPause={() => { setPlaying(false); setWaiting(false); }}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onEnded={() => { setPlaying(false); if (tracks.length > 1) skip(1, true); }}
        onError={() => { if (track) { setError("Track unavailable. Try another song."); setWaiting(false); setPlaying(false); } }}
      />
      <svg className="music-ink" viewBox="0 0 360 340" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="music-ink-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1b302c" />
            <stop offset="0.22" stopColor="#091512" />
            <stop offset="0.7" stopColor="#020605" />
            <stop offset="1" stopColor="#07120e" />
          </linearGradient>
          <linearGradient id="music-ink-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--music-accent)" stopOpacity="0.38" />
            <stop offset="0.6" stopColor="#79ab9b" stopOpacity="0.16" />
            <stop offset="1" stopColor="#020605" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          className="music-ink-body"
          d={inkPath}
          fill="url(#music-ink-surface)"
          stroke="url(#music-ink-rim)"
          strokeWidth="1.2"
        />
      </svg>
      <motion.button
        ref={triggerRef}
        className="music-record-button"
        type="button"
        aria-label="Open music controls"
        aria-expanded={open}
        aria-controls="cabinet-music-controls"
        onFocus={() => setExpanded(true)}
        onClick={() => setExpanded(true)}
        style={{ left: recordLeft, top: recordTop, scale: recordScale }}
      >
        <span className="music-record-drift" aria-hidden="true"><span className="music-record"><span className="music-record-label"><Headphones size={15} /><i /></span></span></span>
      </motion.button>
      <motion.div
        className="music-island-shell"
        initial={false}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : 24 }}
        transition={reducedMotion ? { duration: 0 } : { duration: open ? 0.36 : 0.16, delay: open ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
        inert={!open ? true : undefined}
        aria-hidden={!open}
      >
        <div className="music-island-heading">
          <div className="music-island-title" aria-hidden={!open}>
            <span className="music-eyebrow">DAI FM <span>/</span> SIDE A</span>
            <strong title={track?.title}>{track?.title || "The late-night mix"}</strong>
            <span className="music-artist">{track?.artist || (track ? "DAI FM / LOCAL MIX" : "A soundtrack for the cabinet.")}</span>
          </div>
        </div>
        <div id="cabinet-music-controls" className="music-controls" inert={!open ? true : undefined} aria-hidden={!open}>
          <div className="music-status" role="status"><span className="music-status-dot" />{status}<span>{String(tracks.length).padStart(2, "0")} TRACKS</span></div>
          <div className="music-timeline">
            <input aria-label="Seek in track" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(elapsed, duration)} disabled={!track || !duration} style={{ "--music-fill": `${duration ? elapsed / duration * 100 : 0}%` }} onChange={(event) => { const time = Number(event.target.value); audioRef.current.currentTime = time; setElapsed(time); }} />
            <div><span>{timestamp(elapsed)}</span><span>{timestamp(duration)}</span></div>
          </div>
          <div className="music-transport">
            <button type="button" className={repeat ? "is-active" : ""} aria-label="Repeat track" aria-pressed={repeat} disabled={!track} onClick={() => setRepeat((value) => !value)}><Repeat2 size={17} /></button>
            <button type="button" aria-label="Previous track" disabled={tracks.length < 2} onClick={() => skip(-1)}><SkipBack size={19} fill="currentColor" /></button>
            <button type="button" className="music-play" aria-label={playing ? "Pause music" : "Play music"} disabled={!track} onClick={() => { if (playing) audioRef.current.pause(); else play(); }}>{playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
            <button type="button" aria-label="Next track" disabled={tracks.length < 2} onClick={() => skip(1)}><SkipForward size={19} fill="currentColor" /></button>
            <span className="music-side" aria-hidden="true">33⅓</span>
          </div>
          <div className="music-bottom">
            <div className="music-volume"><button type="button" aria-label={muted ? "Unmute music" : "Mute music"} aria-pressed={muted} onClick={() => setMuted((value) => !value)}>{muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><input aria-label="Music volume" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} style={{ "--music-fill": `${muted ? 0 : volume * 100}%` }} onChange={(event) => { setVolume(Number(event.target.value)); setMuted(false); }} /></div>
            <span>{track ? "STEREO / ONLINE" : "GOOD TUNES, SOON."}</span>
          </div>
          {error ? <p className="music-error" role="alert">{error}</p> : null}
        </div>
      </motion.div>
    </section>
  );
}
