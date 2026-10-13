import "../styles/konami-games.css";
import { ChevronLeft, ChevronRight, Gamepad2, LockKeyhole, Play, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { KONAMI_GAMES, availableKonamiGames } from "../data/konamiGames";
import { KonamiLoaderLamp, KonamiStationLoader } from "./KonamiStationLoader";
import { useMobileView } from "../hooks/useMobileView";

const MOUNT_STATUS = {
  aligning: "Cartridge ready",
  seating: "Inserting cartridge",
  locked: "Cartridge locked in",
  booting: "Starting your game"
};
const MOUNT_TIMING = { seating: 1150, locked: 2400, booting: 2900, launch: 3700 };
const MOUNT_STEPS = [["aligning", "READY"], ["seating", "INSERT"], ["locked", "LOCK"], ["booting", "PLAY"]];

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

export function KonamiGameLibrary({ open, onClose, onSelect, journalComplete = false }) {
  const mobileView = useMobileView();
  const games = availableKonamiGames(journalComplete, mobileView);
  const closeRef = useRef(null);
  const timersRef = useRef([]);
  const [mountingGame, setMountingGame] = useState("");
  const [mountPhase, setMountPhase] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mountingRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => { setSelectedIndex((index) => Math.min(index, games.length - 1)); }, [games.length]);

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

  function mountGame(gameId) {
    if (mountingRef.current || !games.some((game) => game.id === gameId)) return;
    mountingRef.current = true;
    setMountingGame(gameId);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMountPhase("booting");
      timersRef.current = [window.setTimeout(() => onSelect(gameId), 250)];
      return;
    }
    setMountPhase("aligning");
    playMountAudio();
    timersRef.current = [
      ...["seating", "locked", "booting"].map((phase) => window.setTimeout(() => setMountPhase(phase), MOUNT_TIMING[phase])),
      window.setTimeout(() => onSelect(gameId), MOUNT_TIMING.launch)
    ];
  }

  function playMountAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      audioRef.current = context;
      void context.resume().catch(() => {});
      // A quiet filtered scrape follows the contacts into the slot, ending at the latch.
      const slideDuration = .85;
      const slideBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * slideDuration), context.sampleRate);
      const samples = slideBuffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
      const slide = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const slideGain = context.createGain();
      slide.buffer = slideBuffer;
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      const slideStart = context.currentTime + 1.48;
      slideGain.gain.setValueAtTime(0, slideStart);
      slideGain.gain.linearRampToValueAtTime(.018, slideStart + .15);
      slideGain.gain.linearRampToValueAtTime(0, slideStart + slideDuration);
      slide.connect(filter).connect(slideGain).connect(context.destination);
      slide.start(slideStart);
      slide.stop(slideStart + slideDuration);
      const tones = [
        [1.45, 150, 0.04, "triangle", 0.025],
        [MOUNT_TIMING.locked / 1000, 112, 0.065, "triangle", 0.07],
        [MOUNT_TIMING.locked / 1000 + .045, 68, 0.08, "sine", 0.06],
        [MOUNT_TIMING.booting / 1000, 392, 0.09, "triangle", 0.035],
        [MOUNT_TIMING.booting / 1000 + .12, 784, 0.15, "sine", 0.04]
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
  const mountedGame = games.find((game) => game.id === mountingGame);
  const mountStep = MOUNT_STEPS.findIndex(([phase]) => phase === mountPhase);
  // El mismo canal que luego enseña la tele del juego (ArcadeTvDetails).
  const mountedChannel = String(KONAMI_GAMES.findIndex((game) => game.id === mountingGame) + 1).padStart(2, "0");
  const selectedGame = games[Math.min(selectedIndex, games.length - 1)];
  const selectRelative = (step) => setSelectedIndex((index) => (index + step + games.length) % games.length);
  // Two shelves of three; a seventh cartridge (NZ:P next to the regular six,
  // desktop only) turns them into shelves of four.
  const columns = games.length > 6 ? 4 : 3;
  const rowStarts = [0, columns];

  function onShelfKeyDown(event, index) {
    const direction = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
    if (!direction && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? games.length - 1 : (index + direction + games.length) % games.length;
    setSelectedIndex(next);
    document.getElementById(`library-cart-${games[next].id}`)?.focus();
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

        <div className={`konami-library-room is-${selectedGame.color}`}>
          <div className="konami-shelf-cabinet">
            <div className="konami-shelf-heading"><span><Gamepad2 size={16} /> DAI’S GAME SHELF</span><b>EST. 1986</b></div>
            <div className={`konami-cartridge-shelves ${columns === 4 ? "is-wide" : ""}`} role="tablist" aria-label="Game cartridges">
              {rowStarts.map((start) => (
                <div className="konami-shelf-row" role="presentation" key={start}>
                  <i className="konami-shelf-dust" aria-hidden="true" />
                  {games.slice(start, start + columns).map((game, offset) => {
                    const index = start + offset;
                    return (
                      <button className={`konami-shelf-cart is-${game.color} ${selectedIndex === index ? "is-current" : ""}`} type="button" role="tab" id={`library-cart-${game.id}`} aria-selected={selectedIndex === index} aria-controls="library-game-preview" tabIndex={selectedIndex === index ? 0 : -1} aria-label={game.title} onClick={() => setSelectedIndex(index)} onFocus={() => setSelectedIndex(index)} onKeyDown={(event) => onShelfKeyDown(event, index)} disabled={Boolean(mountingGame)} key={game.id}>
                        <GameCartridge game={game} />
                        <span className="konami-shelf-plaque"><i>{String(index + 1).padStart(2, "0")}</i>{game.title}<b aria-hidden="true" /></span>
                      </button>
                    );
                  })}
                  {start === columns && games.length < columns * 2 && <div className="konami-shelf-keepsake" aria-hidden="true"><Gamepad2 size={40} /><span>ONE MORE<br />ROUND.</span><small>DAI’S PRIVATE COLLECTION</small></div>}
                </div>
              ))}
            </div>
            <p className="konami-shelf-hint"><span>THE GOOD STUFF. ALWAYS WITHIN REACH.</span>Pick a cartridge. Make yourself at home.</p>
          </div>
          <div className={`konami-game-preview is-${selectedGame.color}`} role="tabpanel" id="library-game-preview" aria-labelledby={`library-cart-${selectedGame.id}`} tabIndex={0}>
            <div className="konami-station-heading"><span><i aria-hidden="true" /> PLAYER 01</span><span>THE PLAY CORNER</span></div>
            <div className="konami-preview-monitor">
              {/* Keyed on the cartridge, so every switch replays the channel flip. */}
              <div className="konami-preview-screen"><img key={selectedGame.id} src={selectedGame.image} alt={`${selectedGame.title} cover art`} /><span>READY TO PLAY</span><b className="konami-preview-osd" aria-hidden="true">CH {String(selectedIndex + 1).padStart(2, "0")}</b><i key={`static-${selectedGame.id}`} className="konami-preview-static" aria-hidden="true" /></div>
              <div className="konami-monitor-chin"><span><strong>DAIVR</strong> COLOR / STEREO</span><b aria-hidden="true" /><span className="konami-monitor-dials" aria-hidden="true"><em /><em /></span><i aria-hidden="true" /></div>
            </div>
            <div className="konami-preview-copy">
              <div className="konami-preview-counter"><div className="konami-preview-title"><small>CARTRIDGE {String(selectedIndex + 1).padStart(2, "0")} / {String(games.length).padStart(2, "0")}</small><h3>{selectedGame.title}</h3></div><div className="konami-preview-navigation"><button type="button" aria-label="Previous cartridge" disabled={Boolean(mountingGame)} onClick={() => selectRelative(-1)}><ChevronLeft size={16} /></button><button type="button" aria-label="Next cartridge" disabled={Boolean(mountingGame)} onClick={() => selectRelative(1)}><ChevronRight size={16} /></button></div></div>
              <p>{selectedGame.description}</p>
              <span className="konami-preview-meta">{selectedGame.meta.split("//").map((tag) => <b key={tag}>{tag.trim()}</b>)}</span>
            </div>
            <div className="konami-play-deck">
              <div className="konami-deck-top"><span>CARTRIDGE INPUT<span className="konami-play-slot" aria-hidden="true" /></span><i className="konami-deck-vents" aria-hidden="true" /></div>
              <button type="button" className="konami-insert-game" disabled={Boolean(mountingGame)} onClick={() => mountGame(selectedGame.id)}><i className="konami-insert-icon" aria-hidden="true"><Play size={13} fill="currentColor" /></i> Insert & play <span>↵</span></button>
              <small><i /> STATION-86 <b>GOOD GAMES. NO QUARTERS.</b></small>
            </div>
          </div>
        </div>

        {mountedGame ? (
          <div className={`konami-mount-sequence konami-loader is-${mountedGame.color} is-${mountPhase}`} style={{ "--load-duration": `${MOUNT_TIMING.launch}ms` }}>
            <div className="konami-loader-lamp" aria-hidden="true"><KonamiLoaderLamp /><span className="konami-loader-beam"><i /><b /></span><span className="konami-loader-motes" /></div>
            <div className="konami-loader-card">
              <div className="konami-loader-heading"><span>DAIVR / HOME ARCADE</span><i aria-hidden="true" /><span>STATION 86 // CH {mountedChannel}</span></div>
              <div className="konami-loader-stage"><KonamiStationLoader game={mountedGame} phase={mountPhase} channel={mountedChannel} /></div>
              <div className="konami-loader-copy" role="status" aria-live="polite"><small>{MOUNT_STATUS[mountPhase]}</small><strong>{mountedGame.title}</strong><p>{mountedGame.description}</p>
                <span className="konami-loader-tags" aria-hidden="true"><b>{mountedGame.program}</b>{mountedGame.meta.split("//").map((tag) => <b key={tag}>{tag.trim()}</b>)}</span>
                <ol className="konami-loader-steps" aria-hidden="true">{MOUNT_STEPS.map(([phase, label], index) => <li className={index < mountStep ? "is-done" : index === mountStep ? "is-active" : ""} key={phase}><i />{label}</li>)}</ol>
              </div>
            </div>
          </div>
        ) : null}

        <footer><span /> {games.length} CARTRIDGES ON THE SHELF <i>•</i> TAKE YOUR TIME <b>KONAMI.SYS</b></footer>
      </Dialog.Content>
    </Dialog.Overlay>
    </Dialog.Root>
  );
}
