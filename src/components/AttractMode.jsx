import { useEffect, useRef, useState } from "react";

const IDLE_MS = 60000;
const CHECK_MS = 2500;
const SCORE_CYCLE_MS = 1600;
const CLOSE_MS = 420;
const COIN_DROP_MS = 950;
const CREDIT_LINGER_MS = 700;

const HIGH_SCORES = [
  ["DAI", "999990"],
  ["2B", "524220"],
  ["ARTHUR", "117401"],
  ["DWELLER", "076000"]
];

/*
  Modo attract de cabinet real: tras 60s sin actividad la pantalla se atenua y
  entra un screensaver autonomo (logo DAI.EXE a la deriva, tabla de puntajes,
  ranura de moneda). Como en un arcade de verdad, moverse no lo apaga: hay que
  INSERTAR UNA MONEDA (click o Enter — el boton recibe foco al abrir) para
  volver al sitio. La moneda cae, acredita CREDIT 01 y la sesion se reanuda.
*/
export function AttractMode({ enabled, score = 0 }) {
  const [active, setActive] = useState(false);
  const [closing, setClosing] = useState(false);
  const [coinDropping, setCoinDropping] = useState(false);
  const [credit, setCredit] = useState(false);
  const [scoreIndex, setScoreIndex] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const activeRef = useRef(false);
  const closingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const coinButtonRef = useRef(null);
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
    if (!enabled) lastActivityRef.current = Date.now();
  }, [enabled]);

  useEffect(() => {
    function recordActivity() {
      // Con el attract activo la actividad NO lo cierra: eso lo hace la moneda.
      if (activeRef.current) return;
      lastActivityRef.current = Date.now();
    }

    function checkIdle() {
      if (!enabledRef.current || activeRef.current) return;
      if (Date.now() - lastActivityRef.current < IDLE_MS) return;
      activeRef.current = true;
      setActive(true);
    }

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    events.forEach((name) => window.addEventListener(name, recordActivity, { passive: true }));
    const idleTimer = window.setInterval(checkIdle, CHECK_MS);
    const timers = timersRef.current;

    return () => {
      events.forEach((name) => window.removeEventListener(name, recordActivity));
      window.clearInterval(idleTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    coinButtonRef.current?.focus({ preventScroll: true });
    const cycleTimer = window.setInterval(() => {
      setScoreIndex((value) => (value + 1) % (HIGH_SCORES.length + 1));
    }, SCORE_CYCLE_MS);
    return () => window.clearInterval(cycleTimer);
  }, [active]);

  function insertCoin() {
    if (coinDropping || closingRef.current) return;
    setCoinDropping(true);

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dropMs = reduceMotion ? 150 : COIN_DROP_MS;

    schedule(() => {
      setCredit(true);
      schedule(() => {
        closingRef.current = true;
        setClosing(true);
        schedule(() => {
          activeRef.current = false;
          closingRef.current = false;
          setActive(false);
          setClosing(false);
          setCoinDropping(false);
          setCredit(false);
          lastActivityRef.current = Date.now();
        }, CLOSE_MS);
      }, reduceMotion ? 200 : CREDIT_LINGER_MS);
    }, dropMs);
  }

  if (!active) return null;

  const playerScore = String(Math.max(0, score) * 1000).padStart(6, "0");
  const rows = [...HIGH_SCORES, ["YOU", playerScore]];

  return (
    <div className={`attract-mode ${closing ? "is-closing" : ""}`} role="dialog" aria-label="Attract mode — insert a coin to return">
      <div className="attract-grid" aria-hidden="true" />
      <div className="attract-vignette" aria-hidden="true" />

      <div className="attract-drift-x" aria-hidden="true">
        <div className="attract-drift-y">
          <div className="attract-logo">
            <span className="attract-logo-kicker">DAIVR://ARCADE-CODING-STATION</span>
            <strong>DAI.EXE</strong>
            <span className="attract-logo-sub">ARCADE STATION // SELF-RUNNING DEMO</span>
          </div>
        </div>
      </div>

      <div className="attract-scores" aria-hidden="true">
        <p className="attract-scores-title">— TOP PLAYERS —</p>
        <ol>
          {rows.map(([name, points], index) => (
            <li className={index === scoreIndex ? "is-highlight" : ""} key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{name}</strong>
              <em>{points}</em>
            </li>
          ))}
        </ol>
      </div>

      <div className="attract-coin-dock">
        <button
          className={`attract-coin-slot ${coinDropping ? "is-dropping" : ""} ${credit ? "is-credited" : ""}`}
          onClick={insertCoin}
          ref={coinButtonRef}
          type="button"
          aria-label="Insert coin to return to the site"
        >
          <span className="attract-coin-slot-label">{credit ? "CREDIT ACCEPTED" : "INSERT COIN"}</span>
          <span className="attract-coin-slot-plate" aria-hidden="true">
            <i className="attract-coin-piece" />
            <i className="attract-coin-hole" />
            <i className="attract-coin-light" />
          </span>
          <span className="attract-coin-slot-sub">
            {credit ? "resuming session..." : "1 credit — return to cabinet"}
          </span>
        </button>
      </div>

      <span className="attract-corner attract-corner-tl" aria-hidden="true">ATTRACT.MODE</span>
      <span className="attract-corner attract-corner-br" aria-hidden="true">CREDIT {credit ? "01" : "00"}</span>
    </div>
  );
}
