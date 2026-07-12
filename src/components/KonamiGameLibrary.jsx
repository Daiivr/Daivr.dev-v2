import { LockKeyhole, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GAMES = [
  {
    id: "madrace",
    title: "Madrace",
    program: "MADRACE.EXE",
    description: "Physics driving trials across increasingly unreasonable roads.",
    meta: "CAMPAIGN // DISCORD RANKING",
    color: "cyan",
    image: "/arcade-library/madrace-cover.webp"
  },
  {
    id: "tower-block",
    title: "Tower Block",
    program: "TOWER.BLOCK",
    description: "Time each placement, trim the edges, and build into the signal haze.",
    meta: "ENDLESS // LOCAL HIGH SCORE",
    color: "green",
    image: "/arcade-library/tower-block-cover.webp"
  },
  {
    id: "cross-road",
    title: "Cross Road",
    program: "CROSS.ROAD",
    description: "Hop through traffic, rails, rivers, and an endless field of bad decisions.",
    meta: "ENDLESS // ARROW CONTROLS",
    color: "amber",
    image: "/arcade-library/cross-road-cover.webp"
  },
  {
    id: "rubiks-cube",
    title: "The Cube",
    program: "THE.CUBE",
    description: "Scramble, twist, and solve an animated cube against the cabinet clock.",
    meta: "PUZZLE // POINTER CONTROLS",
    color: "magenta",
    image: "/arcade-library/rubiks-cube-cover.webp"
  }
];

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
      <span className="konami-cartridge-label">
        <img src={game.image} alt="" />
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

  useEffect(() => {
    if (!open) return undefined;
    setMountingGame("");
    setMountPhase("");
    window.setTimeout(() => closeRef.current?.focus(), 80);
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [open]);

  function mountGame(gameId) {
    if (mountingGame) return;
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
      window.setTimeout(() => context.close(), 3200);
    } catch {
      // The mount sequence stays fully visual when browser audio is unavailable.
    }
  }

  if (!open) return null;
  const mountedGame = GAMES.find((game) => game.id === mountingGame);

  return (
    <div className="konami-library-backdrop">
      <section className={`konami-library ${mountingGame ? "is-mounting" : ""}`} role="dialog" aria-modal="true" aria-labelledby="konami-library-title">
        <header>
          <div>
            <span><LockKeyhole size={12} /> KONAMI CLEARANCE ACCEPTED</span>
            <h2 id="konami-library-title">SECRET GAME LIBRARY</h2>
            <p>Select a disk and mount its program.</p>
          </div>
          <button type="button" onClick={onClose} ref={closeRef} aria-label="Close secret game library"><X size={19} /></button>
        </header>

        <div className="konami-library-grid">
          {GAMES.map((game, index) => (
            <button className={`konami-game-disk is-${game.color} ${mountingGame === game.id ? "is-selected" : ""} ${mountingGame && mountingGame !== game.id ? "is-standby" : ""}`} type="button" onClick={() => mountGame(game.id)} disabled={Boolean(mountingGame)} key={game.id}>
              <span className="konami-disk-index">DISK {String(index + 1).padStart(2, "0")}</span>
              <GameCartridge game={game} />
              <span className="konami-disk-copy">
                <small>{game.program}</small>
                <strong>{game.title}</strong>
                <p>{game.description}</p>
                <em>{game.meta}</em>
              </span>
              <b>MOUNT <span>→</span></b>
            </button>
          ))}
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

        <footer><span /> {GAMES.length} PROGRAMS FOUND <i>•</i> SELECT DISK TO BOOT <b>KONAMI.SYS</b></footer>
      </section>
    </div>
  );
}
