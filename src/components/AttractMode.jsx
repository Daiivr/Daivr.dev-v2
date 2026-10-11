import { useEffect, useRef, useState } from "react";
import { profile } from "../data/site";
import { useCabinetSignal } from "../lib/cabinetSignals";

const IDLE_MS = 5 * 60 * 1000;
const AFTER_BUDDY_SLEEP_MS = 3000;
const CHECK_MS = 2500;
const SCORE_CYCLE_MS = 1600;
const CLOSE_MS = 560;
const COIN_DROP_MS = 950;
const CREDIT_LINGER_MS = 450;
const LAUNCH_MS = 1000;

const RANKS = ["1ST", "2ND", "3RD", "4TH", "5TH"];

// Rivales de la casa: cada uno es el personaje de un juego favorito de la
// estanteria, con su color y su retrato. face = [ancho imagen / lado del
// recorte, x / lado, y / lado] para encuadrar la cara en el avatar cuadrado.
const HIGH_SCORES = [
  { name: "DAI", points: "999990", tag: "house record", accent: "var(--color-glitch)", image: profile.avatar, face: [1.6154, 0.2423, 0.0385] },
  { name: "2B", points: "524220", tag: "nier:automata", accent: "#dfffea", image: "/games/nier-2b-card.webp", face: [2.2615, 0.6923, 0] },
  { name: "ARTHUR", points: "117401", tag: "red dead ii", accent: "var(--color-danger-arcade)", image: "/games/rdr2-arthur-card.webp", face: [2.19, 0.5667, 0.3] },
  { name: "DWELLER", points: "076000", tag: "fallout 76", accent: "var(--color-cabinet)", image: "/games/fallout-76-power-armor-card.webp", face: [2.087, 0.3913, 0] }
];
const HOUSE_HI_SCORE = 999990;

/*
  Modo attract de cabinet real: unos segundos despues de que Buddy se duerme por
  inactividad, la pantalla se enciende como un CRT y entra la pantalla de titulo
  autonoma (HUD 1UP / HI-SCORE, logo DAI.EXE sobre un sol retro y un suelo de
  rejilla en marcha, tabla de puntajes con los rivales de la estanteria, ranura
  de moneda). Como en un arcade de verdad, moverse no lo apaga: hay que
  INSERTAR UNA MONEDA (click o Enter — el boton recibe foco al abrir) para
  volver al sitio. La moneda cae, acredita CREDIT 01, todo se zambulle en el
  horizonte a velocidad warp con el cartel PLAYER 1 READY! y el CRT se apaga.
*/
export function AttractMode({ enabled }) {
  // La fila YOU y el 1UP muestran la XP real del pasaporte; sin sesion, ceros.
  const player = useCabinetSignal("player");
  const playerXp = player?.progression?.totalXp ?? 0;
  const online = useCabinetSignal("online");
  const [active, setActive] = useState(false);
  const [closing, setClosing] = useState(false);
  const [coinDropping, setCoinDropping] = useState(false);
  const [credit, setCredit] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [scoreIndex, setScoreIndex] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const activeRef = useRef(false);
  const closingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const rootRef = useRef(null);
  const floorRef = useRef(null);
  const coinButtonRef = useRef(null);
  const buddySleepAtRef = useRef(0);
  const timersRef = useRef(new Set());

  function schedule(fn, ms) {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
    return timer;
  }

  useEffect(() => {
    enabledRef.current = enabled;
    // Iframe input does not bubble to the parent. Suspend attract mode for the
    // whole game session, then give the player a fresh idle window on exit.
    lastActivityRef.current = Date.now();
    buddySleepAtRef.current = 0;
    if (!enabled) {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
      if (activeRef.current) window.dispatchEvent(new CustomEvent("daivr-attract-mode", { detail: { active: false } }));
      activeRef.current = false;
      closingRef.current = false;
      setActive(false);
      setClosing(false);
      setCoinDropping(false);
      setCredit(false);
      setLaunching(false);
    }
  }, [enabled]);

  useEffect(() => {
    function activateAttractMode() {
      if (!enabledRef.current || activeRef.current || closingRef.current) return;
      activeRef.current = true;
      setActive(true);
      setClosing(false);
      setCoinDropping(false);
      setCredit(false);
      setLaunching(false);
      setScoreIndex(0);
      window.dispatchEvent(new CustomEvent("daivr-attract-mode", { detail: { active: true } }));
    }

    function recordActivity() {
      // Con el attract activo la actividad NO lo cierra: eso lo hace la moneda.
      if (activeRef.current) return;
      lastActivityRef.current = Date.now();
      buddySleepAtRef.current = 0;
    }

    function recordBuddySleep() {
      if (enabledRef.current) buddySleepAtRef.current = Date.now();
    }

    function checkIdle() {
      if (!enabledRef.current || activeRef.current) return;
      if (Date.now() - lastActivityRef.current < IDLE_MS) return;
      if (!buddySleepAtRef.current || Date.now() - buddySleepAtRef.current < AFTER_BUDDY_SLEEP_MS) return;
      activateAttractMode();
    }

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    events.forEach((name) => window.addEventListener(name, recordActivity, { passive: true }));
    window.addEventListener("daivr-buddy-sleep", recordBuddySleep);
    window.addEventListener("daivr-attract-request", activateAttractMode);
    const idleTimer = window.setInterval(checkIdle, CHECK_MS);
    const timers = timersRef.current;

    return () => {
      events.forEach((name) => window.removeEventListener(name, recordActivity));
      window.removeEventListener("daivr-buddy-sleep", recordBuddySleep);
      window.removeEventListener("daivr-attract-request", activateAttractMode);
      window.clearInterval(idleTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    coinButtonRef.current?.focus({ preventScroll: true });
    const cycleTimer = window.setInterval(() => {
      setScoreIndex((value) => (value + 1) % RANKS.length);
    }, SCORE_CYCLE_MS);
    return () => window.clearInterval(cycleTimer);
  }, [active]);

  function insertCoin() {
    if (coinDropping || closingRef.current) return;
    setCoinDropping(true);

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dropMs = reduceMotion ? 150 : COIN_DROP_MS;

    function powerOff() {
      closingRef.current = true;
      setClosing(true);
      schedule(() => {
        activeRef.current = false;
        closingRef.current = false;
        setActive(false);
        setClosing(false);
        setCoinDropping(false);
        setCredit(false);
        setLaunching(false);
        lastActivityRef.current = Date.now();
        window.dispatchEvent(new CustomEvent("daivr-attract-mode", { detail: { active: false } }));
      }, CLOSE_MS);
    }

    schedule(() => {
      setCredit(true);
      schedule(() => {
        // Con movimiento reducido no hay zambullida: se apaga directamente.
        if (reduceMotion) {
          powerOff();
          return;
        }
        // Cada pieza se encoge hacia el horizonte (su transform-origin apunta ahi).
        const root = rootRef.current;
        const horizon = floorRef.current?.getBoundingClientRect().top;
        if (root && Number.isFinite(horizon)) {
          root.style.setProperty("--horizon", `${Math.round(horizon)}px`);
          root.querySelectorAll(".attract-dive").forEach((node) => {
            node.style.setProperty("--dive-y", `${Math.round(horizon - node.getBoundingClientRect().top)}px`);
          });
        }
        setLaunching(true);
        window.dispatchEvent(new CustomEvent("daivr-attract-launch"));
        schedule(powerOff, LAUNCH_MS);
      }, reduceMotion ? 200 : CREDIT_LINGER_MS);
    }, dropMs);
  }

  if (!active) return null;

  const playerScore = String(Math.max(0, playerXp)).padStart(6, "0");
  const hiScore = String(Math.max(HOUSE_HI_SCORE, playerXp)).padStart(6, "0");
  const rows = [
    ...HIGH_SCORES,
    {
      name: "YOU",
      points: playerScore,
      tag: player?.user?.username || "guest // sign in",
      accent: "var(--color-cyan-arcade)",
      image: player?.user?.avatarUrl || null,
      face: null
    }
  ];

  return (
    <div
      className={`attract-mode ${credit ? "is-credited" : ""} ${launching ? "is-launching" : ""} ${closing ? "is-closing" : ""}`}
      ref={rootRef}
      role="dialog"
      aria-label="Attract mode — insert a coin to return"
    >
      <div className="attract-sky" aria-hidden="true"><i /><i /></div>

      <header className="attract-hud" aria-hidden="true">
        <div className="attract-hud-cell is-player">
          <small>1UP</small>
          <b>{playerScore}</b>
        </div>
        <div className="attract-hud-cell is-hi">
          <small>HI-SCORE</small>
          <b>{hiScore}</b>
        </div>
        <div className="attract-hud-cell is-online">
          <small>IN ARCADE</small>
          <b>{online ? String(online).padStart(2, "0") : "--"}</b>
        </div>
      </header>

      <div className="attract-title" aria-hidden="true">
        <div className="attract-sun" />
        <div className="attract-logo attract-dive">
          <span className="attract-logo-kicker">DAIVR://ARCADE-CODING-STATION</span>
          <strong data-text="DAI.EXE"><span>DAI.EXE</span></strong>
          <span className="attract-logo-sub">ARCADE STATION // SELF-RUNNING DEMO</span>
        </div>
      </div>

      <div className="attract-floor" ref={floorRef} aria-hidden="true"><i /></div>

      <div className="attract-scores attract-dive" aria-hidden="true">
        <p className="attract-scores-title">TOP PLAYERS</p>
        <div className="attract-scores-board">
          <div className="attract-scores-head">
            <span>RANK</span>
            <span>NAME</span>
            <span>SCORE</span>
          </div>
          <ol>
            {rows.map((row, index) => (
              <li
                className={index === scoreIndex ? "is-highlight" : ""}
                key={row.name}
                style={{
                  "--row-accent": row.accent,
                  "--row-index": index,
                  ...(row.face ? { "--face-size": row.face[0], "--face-x": row.face[1], "--face-y": row.face[2] } : null)
                }}
              >
                <span className="attract-score-rank">{RANKS[index]}</span>
                <i
                  className={`attract-score-face${row.face ? "" : " is-avatar"}${row.image ? "" : " is-empty"}`}
                  style={row.image ? { backgroundImage: `url("${row.image}")` } : undefined}
                />
                <strong>
                  {row.name}
                  <small>{row.tag}</small>
                </strong>
                <em>{row.points}</em>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="attract-coin-dock attract-dive">
        <button
          className={`attract-coin-slot ${coinDropping ? "is-dropping" : ""} ${credit ? "is-credited" : ""}`}
          onClick={insertCoin}
          ref={coinButtonRef}
          type="button"
          aria-label="Insert coin to return to the site"
        >
          <span className="attract-coin-slot-label">{credit ? "CREDIT ACCEPTED" : "INSERT COIN"}</span>
          <span className="attract-coin-slot-plate" aria-hidden="true">
            <i className="attract-coin-engrave">1 COIN · 1 PLAY</i>
            <i className="attract-coin-arrow is-left" />
            <i className="attract-coin-hole" />
            <i className="attract-coin-arrow is-right" />
            <i className="attract-coin-piece" />
            <i className="attract-coin-light" />
          </span>
          <span className="attract-coin-slot-sub">
            {credit ? "resuming session..." : <><kbd>ENTER</kbd> 1 credit — return to cabinet</>}
          </span>
        </button>
      </div>

      <div className="attract-warp" aria-hidden="true" />

      {launching && (
        <div className="attract-ready" aria-hidden="true">
          <small>PLAYER 1</small>
          <strong>READY!</strong>
          <span className="attract-ready-bar"><i /></span>
          <em>loading cabinet...</em>
        </div>
      )}

      <span className="attract-corner attract-corner-bl" aria-hidden="true">
        <i />ATTRACT.MODE · © {new Date().getFullYear()} DAIVR.DEV
      </span>
      <span className="attract-corner attract-corner-br" aria-hidden="true">CREDIT {credit ? "01" : "00"}</span>

      <div className="attract-crt" aria-hidden="true" />
      <div className="attract-flash" aria-hidden="true" />
    </div>
  );
}
