import "../styles/konami-games.css";
import { ChevronLeft, ChevronRight, Gamepad2, LockKeyhole, Play, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { KONAMI_GAMES } from "../data/konamiGames";

const MOUNT_STATUS = {
  aligning: "BUS DOOR OPEN // ALIGNING PIN GUIDE",
  seating: "INSERTING CARTRIDGE // ENGAGING CONTACTS",
  locked: "CLICK // CARTRIDGE SEATED",
  booting: "POWER ON // STARTING PROGRAM"
};

function GameCartridge({ game, className = "" }) {
  return (
    <span className={`konami-cartridge ${className}`} aria-hidden="true">
      <i className="konami-cartridge-grip"><b /><b /><b /><b /><b /></i>
      <i className="konami-cartridge-screw is-left" /><i className="konami-cartridge-screw is-right" />
      <span className="konami-cartridge-label">
        <img src={game.image} alt="" loading="eager" decoding="async" />
        <em>{game.program}</em>
        <strong>{game.title}</strong>
      </span>
      <i className="konami-cartridge-contacts"><b /><b /><b /><b /><b /><b /></i>
    </span>
  );
}

export function KonamiGameLibrary({ open, onClose, onSelect }) {
  const closeRef = useRef(null);
  const timersRef = useRef([]);
  const [mountingGame, setMountingGame] = useState("");
  const [mountPhase, setMountPhase] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mountingRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setMountingGame("");
    setMountPhase("");
    mountingRef.current = false;
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const cartridge = document.getElementById(`library-cart-${KONAMI_GAMES[selectedIndex].id}`);
    const shelf = cartridge?.parentElement;
    if (!shelf) return;
    const centerCartridge = () => {
      if (shelf.scrollWidth <= shelf.clientWidth) return;
      const left = shelf.scrollLeft + cartridge.getBoundingClientRect().left - shelf.getBoundingClientRect().left - (shelf.clientWidth - cartridge.clientWidth) / 2;
      shelf.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    };
    const observer = new ResizeObserver(centerCartridge);
    observer.observe(shelf);
    return () => observer.disconnect();
  }, [open, selectedIndex]);

  function mountGame(gameId) {
    if (mountingRef.current) return;
    mountingRef.current = true;
    setMountingGame(gameId);
    setMountPhase("aligning");
    playMountAudio();
    timersRef.current = [
      window.setTimeout(() => setMountPhase("seating"), 1000),
      window.setTimeout(() => setMountPhase("locked"), 1950),
      window.setTimeout(() => setMountPhase("booting"), 2380),
      window.setTimeout(() => onSelect(gameId), 2760)
    ];
  }

  function playMountAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      audioRef.current = context;
      const tones = [
        [0.56, 1240, 0.03, "triangle", 0.035],
        [1.82, 92, 0.05, "square", 0.05],
        [1.95, 118, 0.05, "square", 0.085],
        [1.99, 66, 0.1, "square", 0.08],
        [2.05, 1520, 0.025, "square", 0.04],
        [2.42, 392, 0.07, "square", 0.05],
        [2.5, 784, 0.1, "square", 0.05]
      ];
      tones.forEach(([delay, frequency, duration, type, peak]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(peak, context.currentTime + delay + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + duration + 0.02);
      });
    } catch {
      // The mount sequence stays fully visual when browser audio is unavailable.
    }
  }

  if (!open) return null;
  const mountedGame = KONAMI_GAMES.find((game) => game.id === mountingGame);
  const selectedGame = KONAMI_GAMES[selectedIndex];
  const selectRelative = (step) => setSelectedIndex((index) => (index + step + KONAMI_GAMES.length) % KONAMI_GAMES.length);

  function onShelfKeyDown(event, index) {
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!direction && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? KONAMI_GAMES.length - 1 : (index + direction + KONAMI_GAMES.length) % KONAMI_GAMES.length;
    setSelectedIndex(next);
    document.getElementById(`library-cart-${KONAMI_GAMES[next].id}`)?.focus();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <Dialog.Overlay className="konami-library-backdrop motion-backdrop">
      <Dialog.Content className={`konami-library konami-shelf-library motion-panel ${mountingGame ? "is-mounting" : ""}`} onOpenAutoFocus={(event) => { event.preventDefault(); closeRef.current?.focus(); }}>
        <header>
          <div>
            <span><LockKeyhole size={12} /> KONAMI CLEARANCE ACCEPTED</span>
            <Dialog.Title asChild><h2>SECRET GAME LIBRARY</h2></Dialog.Title>
            <Dialog.Description asChild><p>A little shelf of other worlds. Pick one. Settle in.</p></Dialog.Description>
          </div>
          <button type="button" onClick={onClose} ref={closeRef} aria-label="Close secret game library"><X size={19} /></button>
        </header>

        <div className="konami-library-room">
          <div className="konami-shelf-cabinet">
            <div className="konami-shelf-heading"><span><Gamepad2 size={14} /> THE COLLECTION</span><b>VOL. 01 — 05</b></div>
            <div className="konami-cartridge-shelves" role="tablist" aria-label="Game cartridges">
              {KONAMI_GAMES.map((game, index) => (
                <button className={`konami-shelf-cart is-${game.color} ${selectedIndex === index ? "is-current" : ""}`} type="button" role="tab" id={`library-cart-${game.id}`} aria-selected={selectedIndex === index} aria-controls="library-game-preview" tabIndex={selectedIndex === index ? 0 : -1} aria-label={game.title} onClick={() => setSelectedIndex(index)} onFocus={() => setSelectedIndex(index)} onKeyDown={(event) => onShelfKeyDown(event, index)} disabled={Boolean(mountingGame)} key={game.id}>
                  <GameCartridge game={game} />
                  <span className="konami-shelf-plaque"><i>{String(index + 1).padStart(2, "0")}</i>{game.title}<b aria-hidden="true" /></span>
                </button>
              ))}
              <div className="konami-shelf-keepsake" aria-hidden="true"><Gamepad2 size={40} /><span>ONE MORE<br />ROUND.</span><small>DAI’S PRIVATE COLLECTION</small></div>
            </div>
            <p className="konami-shelf-hint">Pick a cartridge to take a closer look.</p>
          </div>
          <div className={`konami-game-preview is-${selectedGame.color}`} role="tabpanel" id="library-game-preview" aria-labelledby={`library-cart-${selectedGame.id}`} tabIndex={0}>
            <div className="konami-preview-monitor">
              <div className="konami-preview-screen"><img src={selectedGame.image} alt={`${selectedGame.title} cover art`} /><span>READY TO PLAY</span></div>
              <div className="konami-monitor-chin"><span>DAIVR / COLOR SYSTEM</span><i /><b /></div>
            </div>
            <div className="konami-preview-copy">
              <div className="konami-preview-counter"><small>CARTRIDGE {String(selectedIndex + 1).padStart(2, "0")} / 05</small><div><button type="button" aria-label="Previous cartridge" disabled={Boolean(mountingGame)} onClick={() => selectRelative(-1)}><ChevronLeft size={16} /></button><button type="button" aria-label="Next cartridge" disabled={Boolean(mountingGame)} onClick={() => selectRelative(1)}><ChevronRight size={16} /></button></div></div>
              <h3>{selectedGame.title}</h3>
              <p>{selectedGame.description}</p>
              <span className="konami-preview-meta">{selectedGame.meta}</span>
            </div>
            <div className="konami-play-deck"><span className="konami-play-slot" aria-hidden="true" /><button type="button" className="konami-insert-game" disabled={Boolean(mountingGame)} onClick={() => mountGame(selectedGame.id)}><Play size={16} fill="currentColor" /> Insert & play <span>↵</span></button><small><i /> STATION-86 <b>CARTRIDGE SYSTEM</b></small></div>
          </div>
        </div>

        {mountedGame ? (
          <div className={`konami-mount-sequence is-${mountedGame.color} is-${mountPhase}`} aria-live="polite">
            <div className="konami-mount-rig" aria-hidden="true">
              <span className="konami-console-deck">
                <i className="konami-console-slot"><b className="is-flap-left" /><b className="is-flap-right" /></i>
              </span>
              <GameCartridge game={mountedGame} className="konami-mount-cartridge" />
              <span className="konami-console-face">
                <i className="konami-console-vents"><b /><b /><b /><b /><b /></i>
                <span className="konami-console-brand"><strong>DAIVR STATION-86</strong><small>KONAMI.SYS COMPATIBLE</small></span>
                <span className="konami-console-power">
                  <b className="konami-console-switch"><i /></b>
                  <i className="konami-console-led" />
                  <em>PWR</em>
                </span>
                <i className="konami-console-vents"><b /><b /><b /><b /><b /></i>
              </span>
              <span className="konami-mount-burst" />
              <span className="konami-mount-dust"><b /><b /><b /><b /><b /><b /></span>
            </div>
            <strong>MOUNTING {mountedGame.program}</strong>
            <small key={mountPhase}>{MOUNT_STATUS[mountPhase] || MOUNT_STATUS.aligning}</small>
            <span className="konami-mount-progress"><i /></span>
            <span className="konami-mount-flash" />
          </div>
        ) : null}

        <footer><span /> {KONAMI_GAMES.length} CARTRIDGES ON THE SHELF <i>•</i> TAKE YOUR TIME <b>KONAMI.SYS</b></footer>
      </Dialog.Content>
    </Dialog.Overlay>
    </Dialog.Root>
  );
}
