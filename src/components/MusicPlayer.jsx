import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Headphones, ListMusic, LoaderCircle, Pause, Play, Repeat1, Repeat2, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { musicTracks } from "../data/music";
import { useMusicSignal } from "./music-player/useMusicSignal";
import "../styles/music-player.css";

// Matching Bézier segments let the edge's liquid silhouette become the panel.
const INK_REST = "M 360 0 C 360 156 357 228 337 245 C 329 251.8 320 252 314 259 C 302 273 304 285 315 297 C 326 307 335 314 343 331 C 351 346 356 360 358 368 C 359 371 360 373 360 374 L 360 0 Z";
const INK_OPEN = "M 360 0 C 350 24 332 24 300 24 C 230 24 85 24 48 24 C 22 24 12 39 12 66 C 12 140 12 291 12 316 C 12 344 35 350 65 350 C 168 350 338 344 360 374 L 360 0 Z";
const MEDIA_ACTIONS = ["play", "pause", "previoustrack", "nexttrack"];

function timestamp(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function MusicPlayer({ hidden = false, ducked = false, entrySplashOpen = false, tracks = musicTracks }) {
  const [expanded, setExpanded] = useState(false);
  const [docked, setDocked] = useState(true);
  const [morphing, setMorphing] = useState("");
  const [landing, setLanding] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const resumeRef = useRef(false);
  const hoverTimerRef = useRef(0);
  const landingTimerRef = useRef(0);
  const historyRef = useRef([]);
  const keyboardInteractionRef = useRef(false);
  const entryStartAttemptedRef = useRef(false);
  const entryStartPendingRef = useRef(false);
  const queueToggleRef = useRef(null);
  const mediaActionsRef = useRef({});
  const reducedMotion = useReducedMotion();
  const track = tracks[index];
  const open = expanded && !hidden;
  const { canvasRef, vuRef, connect, scrubProps } = useMusicSignal({ audioRef, rootRef, playing, open, reducedMotion, color: track?.color });

  // One timeline keeps the silhouette and record together, including reversals.
  // Past 1 the ink overshoots outward (and the record rides the corner with it);
  // the docked end is clamped so the record never slides off the screen edge.
  const morph = useMotionValue(0);
  const inkPath = useTransform(morph, [0, 1], [INK_REST, INK_OPEN], { clamp: false });
  const recordLeft = useTransform(morph, (value) => {
    const t = Math.max(0, value);
    return `calc(${(1 - t) * 100}% + ${t * 86 - 54}px)`;
  });
  const recordTop = useTransform(morph, (value) => 284 - Math.max(0, value) * 236);
  const recordScale = useTransform(morph, (value) => 0.72 + Math.max(0, value) * 0.28);
  const panelGlow = useTransform(morph, [0.45, 1], [0, 1]);
  // Gain on top of the listener's volume: a game TV fades the music to 0
  // (it keeps playing) and closing the game brings it back.
  const duck = useMotionValue(ducked ? 0 : 1);

  useEffect(() => {
    const from = morph.get();
    setLanding(false);
    if (open ? from >= 0.999 : from <= 0.001) {
      setDocked(!open);
      return undefined;
    }
    setDocked(false);
    if (reducedMotion) {
      morph.set(open ? 1 : 0);
      setDocked(!open);
      return undefined;
    }
    setMorphing(open ? "opening" : "closing");
    // Opening: the ink floods out, overshoots and settles. Closing: it takes a
    // breath, then drains back into the drop, which wobbles as it lands.
    const inhale = !open && from > 0.95;
    const animation = animate(morph, open ? [from, 1.045, 0.99, 1] : inhale ? [from, 1.02, 0] : [from, 0], {
      duration: open ? 0.9 : inhale ? 0.7 : 0.55,
      times: open ? [0, 0.6, 0.83, 1] : inhale ? [0, 0.18, 1] : [0, 1],
      ease: open ? [[0.25, 0.9, 0.3, 1], [0.45, 0, 0.55, 1], [0.45, 0, 0.55, 1]] : inhale ? [[0.3, 0, 0.6, 1], [0.55, 0, 0.3, 1]] : [[0.55, 0, 0.3, 1]],
      onComplete: () => {
        setMorphing("");
        setDocked(!open);
        if (!open) {
          setLanding(true);
          window.clearTimeout(landingTimerRef.current);
          landingTimerRef.current = window.setTimeout(() => setLanding(false), 760);
        }
      },
    });
    return () => animation.stop();
  }, [morph, open, reducedMotion]);

  useEffect(() => () => {
    window.clearTimeout(hoverTimerRef.current);
    window.clearTimeout(landingTimerRef.current);
  }, []);

  // The tracklist folds back into the deck once the panel has fully docked.
  useEffect(() => {
    if (docked && !open) setQueueOpen(false);
  }, [docked, open]);

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
    const audio = audioRef.current;
    const apply = () => { audio.volume = volume * duck.get(); };
    apply();
    return duck.on("change", apply);
  }, [duck, volume]);

  useEffect(() => {
    audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const animation = animate(duck, ducked ? 0 : 1, { duration: ducked ? 0.6 : 1.2, ease: "easeInOut" });
    return () => animation.stop();
  }, [duck, ducked]);

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
      connect();
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
  }, [entrySplashOpen, muted, play, connect]);

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

  // Focus leaves the view that goes inert first, or the panel's blur closes it.
  const toggleQueue = (next = !queueOpen) => {
    queueToggleRef.current?.focus({ preventScroll: true });
    setQueueOpen(next);
  };

  const skip = (direction, autoPlay = playing || waiting) => {
    if (!tracks.length) return;
    if (direction < 0 && (audioRef.current.currentTime > 3 || tracks.length === 1)) {
      audioRef.current.currentTime = 0;
      setElapsed(0);
      return;
    }
    resumeRef.current = autoPlay;
    if (shuffle && tracks.length > 1) {
      if (direction < 0) {
        setIndex(historyRef.current.pop() ?? (index - 1 + tracks.length) % tracks.length);
      } else {
        historyRef.current.push(index);
        if (historyRef.current.length > 100) historyRef.current.shift();
        setIndex((index + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length);
      }
    } else {
      setIndex((current) => (current + direction + tracks.length) % tracks.length);
    }
  };

  const togglePlay = () => {
    if (playing || waiting) {
      audioRef.current.pause();
      setWaiting(false);
    } else play();
  };

  const selectTrack = (next) => {
    toggleQueue(false);
    if (next === index) {
      if (!playing && !waiting) play();
      return;
    }
    if (shuffle) {
      historyRef.current.push(index);
      if (historyRef.current.length > 100) historyRef.current.shift();
    }
    resumeRef.current = true;
    setIndex(next);
  };

  // Media keys and the OS now-playing card drive the same deck.
  useEffect(() => {
    mediaActionsRef.current = {
      play: () => { if (!playing && !waiting) play(); },
      pause: () => { if (playing || waiting) togglePlay(); },
      previoustrack: () => skip(-1),
      nexttrack: () => skip(1),
    };
  });

  useEffect(() => {
    const session = navigator.mediaSession;
    if (!session) return undefined;
    const bind = (handler) => MEDIA_ACTIONS.forEach((action) => {
      try { session.setActionHandler(action, handler && (() => mediaActionsRef.current[action]?.())); } catch { /* Unsupported action. */ }
    });
    bind(true);
    return () => bind(null);
  }, []);

  useEffect(() => {
    const session = navigator.mediaSession;
    if (!session || !track || typeof window.MediaMetadata !== "function") return;
    session.metadata = new window.MediaMetadata({
      title: track.title,
      artist: track.artist || "DAI FM",
      album: "DAI FM / SIDE A",
      artwork: [{ src: "/favicon.png", sizes: "40x39", type: "image/png" }],
    });
  }, [track]);

  useEffect(() => {
    if (navigator.mediaSession) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  const silent = muted || volume === 0;
  const volumePercent = Math.round((muted ? 0 : volume) * 100);
  const toggleMute = () => {
    if (silent) {
      if (volume === 0) setVolume(0.2);
      setMuted(false);
    } else setMuted(true);
  };

  const status = error ? "SIGNAL LOST" : !track ? "COMING SOON" : waiting ? "TUNING IN" : playing ? "NOW PLAYING" : "ON STANDBY";
  const counter = (value) => String(value).padStart(2, "0");

  return (
    <section
      ref={rootRef}
      className={`music-island ${open ? "is-expanded" : ""} ${docked && !open ? "is-docked" : ""} ${playing ? "is-playing" : ""} ${!track ? "is-empty" : ""} ${queueOpen ? "is-queue" : ""} ${morphing ? `is-morphing is-${morphing}` : ""} ${landing ? "is-landing" : ""}`}
      style={{ "--music-track": track?.color }}
      aria-label="Cabinet music player"
      hidden={hidden}
      onPointerEnter={(event) => {
        window.clearTimeout(hoverTimerRef.current);
        if (event.pointerType === "mouse") hoverTimerRef.current = window.setTimeout(() => setExpanded(true), 120);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(hoverTimerRef.current);
        if (event.buttons || (keyboardInteractionRef.current && event.currentTarget.contains(document.activeElement))) return;
        // Clicking a control must not pin the panel open through retained focus.
        hoverTimerRef.current = window.setTimeout(() => setExpanded(false), 180);
      }}
      onPointerDownCapture={() => { keyboardInteractionRef.current = false; window.clearTimeout(hoverTimerRef.current); connect(); }}
      onKeyDownCapture={(event) => { keyboardInteractionRef.current = true; if (event.key === "Enter" || event.key === " ") connect(); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false); }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        if (queueOpen) toggleQueue(false);
        else close();
      }}
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
      <svg className="music-ink" viewBox="0 0 360 374" preserveAspectRatio="none" aria-hidden="true">
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
          <radialGradient id="music-ink-glow" gradientUnits="userSpaceOnUse" cx="59" cy="67" r="190">
            <stop offset="0" style={{ stopColor: "var(--music-track)", stopOpacity: 0.2 }} />
            <stop offset="0.45" style={{ stopColor: "var(--music-track)", stopOpacity: 0.05 }} />
            <stop offset="1" style={{ stopColor: "var(--music-track)", stopOpacity: 0 }} />
          </radialGradient>
          <pattern id="music-ink-scan" width="4" height="3" patternUnits="userSpaceOnUse">
            <rect width="4" height="1" fill="#b4ffcf" fillOpacity="0.04" />
          </pattern>
        </defs>
        <motion.path
          className="music-ink-body"
          d={inkPath}
          fill="url(#music-ink-surface)"
          stroke="url(#music-ink-rim)"
          strokeWidth="1.2"
        />
        {/* The record's backlight and the scanlines share the panel's outline. */}
        <motion.g className="music-ink-overlay" style={{ opacity: panelGlow }}>
          <motion.path className="music-ink-glow" d={inkPath} fill="url(#music-ink-glow)" />
          <motion.path d={inkPath} fill="url(#music-ink-scan)" />
        </motion.g>
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
        <span className="music-record-drift" aria-hidden="true">
          <span className="music-record-aura" />
          <span className="music-record-wave" />
          <span className="music-record-wave" />
          <span className="music-record"><span className="music-record-label"><Headphones size={15} /><i /></span></span>
        </span>
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
          <button type="button" className="music-close" aria-label="Close music controls" title="Close controls (Esc)" onClick={close}><X size={16} /></button>
        </div>
        <div id="cabinet-music-controls" className="music-controls" inert={!open ? true : undefined} aria-hidden={!open}>
          <div className="music-status">
            <span className="music-status-label" role="status"><span className="music-status-dot" />{status}</span>
            <button
              ref={queueToggleRef}
              type="button"
              className="music-queue-toggle"
              aria-label={`Track ${track ? index + 1 : 0} of ${tracks.length}. ${queueOpen ? "Hide" : "Show"} tracklist`}
              title={queueOpen ? "Back to the deck" : "Tracklist"}
              aria-expanded={queueOpen}
              aria-controls="cabinet-music-queue"
              disabled={!tracks.length}
              onClick={() => toggleQueue()}
            >
              {counter(track ? index + 1 : 0)} <span>/</span> {counter(tracks.length)}
              <ListMusic size={13} />
            </button>
          </div>
          <div className="music-stage">
            <div className="music-deck" inert={queueOpen ? true : undefined} aria-hidden={queueOpen}>
              <div className="music-timeline">
                <canvas ref={canvasRef} className="music-scope" aria-hidden="true" {...scrubProps} />
                <input aria-label="Seek in track" aria-valuetext={`${timestamp(elapsed)} of ${timestamp(duration)}`} type="range" min="0" max={duration || 1} step="1" value={Math.min(elapsed, duration)} disabled={!track || !duration} style={{ "--music-fill": `${duration ? Math.min(elapsed / duration * 100, 100) : 0}%` }} onChange={(event) => { const time = Number(event.target.value); audioRef.current.currentTime = time; setElapsed(time); }} />
                <div><span>{timestamp(elapsed)}</span><span title="Time remaining">−{timestamp(Math.max(0, duration - elapsed))}</span></div>
              </div>
              <div className="music-transport">
                <button type="button" className={`music-mode ${shuffle ? "is-active" : ""}`} aria-label="Shuffle" title={`Shuffle ${shuffle ? "on" : "off"}`} aria-pressed={shuffle} disabled={tracks.length < 2} onClick={() => { setShuffle((value) => !value); historyRef.current = []; }}><Shuffle size={18} /><span>{shuffle ? "ON" : "OFF"}</span></button>
                <button type="button" className="music-skip" aria-label="Previous track" title="Previous / restart track" disabled={!track} onClick={() => skip(-1)}><SkipBack size={20} fill="currentColor" /></button>
                <button type="button" className="music-play" aria-label={playing || waiting ? "Pause music" : "Play music"} title={playing || waiting ? "Pause" : "Play"} disabled={!track} onClick={() => { connect(); togglePlay(); }}>{waiting ? <LoaderCircle className="music-loading" size={24} /> : playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button>
                <button type="button" className="music-skip" aria-label="Next track" title="Next track" disabled={tracks.length < 2} onClick={() => skip(1)}><SkipForward size={20} fill="currentColor" /></button>
                <button type="button" className={`music-mode ${repeat ? "is-active" : ""}`} aria-label="Repeat track" title={`Repeat track ${repeat ? "on" : "off"}`} aria-pressed={repeat} disabled={!track} onClick={() => setRepeat((value) => !value)}>{repeat ? <Repeat1 size={18} /> : <Repeat2 size={18} />}<span>{repeat ? "ONE" : "OFF"}</span></button>
              </div>
            </div>
            <ol id="cabinet-music-queue" className="music-queue" aria-label="Side A tracklist" inert={!queueOpen ? true : undefined} aria-hidden={!queueOpen}>
              {tracks.map((item, position) => {
                const current = position === index;
                return (
                  <li key={item.id} style={{ "--queue-color": item.color }}>
                    <button
                      type="button"
                      className={`${current ? "is-current" : ""} ${current && playing ? "is-live" : ""}`}
                      aria-current={current ? "true" : undefined}
                      onClick={() => { connect(); selectTrack(position); }}
                    >
                      <span className="music-queue-number">{counter(position + 1)}</span>
                      <span className="music-queue-name"><strong>{item.title}</strong><span>{item.artist || "DAI FM / LOCAL MIX"}</span></span>
                      <span className="music-queue-state" aria-hidden="true">{current ? <><i /><i /><i /></> : <Play size={12} fill="currentColor" />}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="music-bottom">
            {error ? <p className="music-error" role="alert">{error}</p> : (
              <div className="music-volume"><button type="button" aria-label={silent ? "Unmute music" : "Mute music"} title={silent ? "Unmute" : "Mute"} aria-pressed={silent} onClick={toggleMute}>{silent ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><input aria-label="Music volume" aria-valuetext={`${volumePercent}%`} type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} style={{ "--music-fill": `${volumePercent}%` }} onChange={(event) => { setVolume(Number(event.target.value)); setMuted(false); }} /><span className="music-volume-value" aria-hidden="true">{volumePercent}%</span></div>
            )}
            <span ref={vuRef} className="music-vu" aria-hidden="true">
              <span><b>L</b><i /></span>
              <span><b>R</b><i /></span>
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
