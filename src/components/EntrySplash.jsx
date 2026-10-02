import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getLocalBuddyLevel } from "../hooks/useBuddyFriendship";
import { consumeGateReturn } from "../lib/gateReturn";
import { AvatarScenePlaceholder } from "./AvatarScenePlaceholder";
import { BuddySprite } from "./BuddySprite";
import { GatePatina } from "./GatePatina";
import { GateLamp } from "./GateLamp";
import { SeasonalSplashNotice } from "./SeasonalSplashNotice";

// El anfitrion VRM arrastra three.js + @pixiv/three-vrm. Cargarlo aparte deja
// que la puerta pinte sin esperar a ese chunk, y el splash movil (que nunca
// monta la escena) deja de descargarlo del todo.
const AvatarGreeting = lazy(() => import("./AvatarGreeting").then((module) => ({ default: module.AvatarGreeting })));

const SPLASH_SEEN_KEY = "daivr.splashSeen.v1";

// Ritmo de la conversacion. Al volver dentro de la misma pestana el visitante
// ya vio la ceremonia entera, asi que el guion se acelera en vez de repetirse
// a velocidad completa.
// El ritmo acelerado iba a 26ms por letra (unos 38 caracteres por segundo,
// bastante por encima de lo que se lee comodamente) y solo dejaba 700ms de
// pausa: al recargar en la misma pestana la frase se escribia y desaparecia
// antes de poder leerla. Ahora sigue siendo mas rapido que la primera visita,
// pero se puede seguir con la vista.
const TYPE_SPEED = 58;
const FAST_TYPE_SPEED = 44;
const LINE_HOLD = 1800;
const FAST_LINE_HOLD = 1300;
// Shared with CSS so the overlay stays mounted through the entire reveal.
const GATE_OPEN_MS = 1200;
// Si el VRM no llega (red lenta, GPU sin WebGL) el anfitrion habla igual: el
// saludo nunca puede quedarse esperando a trece megas de descarga.
const HOST_PATIENCE_MS = 9000;

const SEASON_ASIDES = {
  halloween: "ignore the spiders. they pay rent.",
  winter: "mind the ice. it snows indoors here.",
  birthday: "good week to show up. it's dai's birthday.",
  anniversary: "the cabinet turns another year old this week.",
  "april-fools": "everything you see today is completely trustworthy."
};

// El visitante que vuelve de una pagina de sistema no acaba de llegar: acaba de
// estrellarse. Repetirle la bienvenida de siempre suena a que nadie estaba
// mirando, asi que la anfitriona lo comenta y sigue.
function buildReturnLines({ gateReturn, hostName, linked, visitorName }) {
  const who = linked ? visitorName : "you";
  const greeting = linked ? `oh — ${visitorName}. you made it back.` : "oh — you're back.";

  if (gateReturn.variant === "denied") {
    return [
      greeting,
      `${gateReturn.path} is sealed above your tier. that one's not on me.`,
      linked
        ? "your pass is fine — that shelf just answers to someone else."
        : `i'm ${hostName}, and i don't hold that key either.`,
      "nothing leaked, for what it's worth. door held."
    ];
  }

  return [
    greeting,
    `${gateReturn.path} was never on the map. i checked twice.`,
    linked
      ? "the index is older than some of the carts. it happens."
      : `i'm ${hostName}. i keep dai's cabinet running — mostly.`,
    `let's get ${who} somewhere that actually exists.`
  ];
}

function buildScript({ gateReturn, hostName, linked, seasonalEvent, visitorName }) {
  const lines = gateReturn
    ? buildReturnLines({ gateReturn, hostName, linked, visitorName })
    : linked
      ? [`oh — ${visitorName}!`, "discord pass checks out. good to have you back."]
      : ["oh — hey. didn't hear you walk up.", `i'm ${hostName}. i keep dai's cabinet running.`];

  if (!gateReturn) {
    lines.push(linked
      ? "floor's still warm. everything's where you left it."
      : "projects, experiments, and a few games nobody mentions.");
  }

  const aside = SEASON_ASIDES[seasonalEvent];
  if (aside) lines.push(aside);

  lines.push("gate's yours whenever you want it.");
  return lines;
}

// cabinetReady: el armario (App) ya esta montado detras de la puerta. La puerta
// se pinta antes desde el chunk de entrada, pero no deja pasar hasta entonces, y
// el buddy no sale hasta tener su equipo (lo sabe App) para no cambiarse de ropa
// a la vista.
export function EntrySplash({ onEnter, onBuddyLaunch, seasonalEvent, friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], returnContext = null, cabinetReady = true }) {
  // Bajo 800px no se monta la escena 3D: ahi el anfitrion es Buddy, el mismo
  // sprite que luego vive en el footer.
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 800px)").matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [discordUser, setDiscordUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hostStage, setHostStage] = useState("loading");
  const [hostOverdue, setHostOverdue] = useState(false);
  const [buddyAwake, setBuddyAwake] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  // Read after commit: Suspense may discard a render, so consuming storage
  // inside a state initializer could lose the greeting before it is displayed.
  const [gateReturn, setGateReturn] = useState(returnContext);
  const [returnChecked, setReturnChecked] = useState(Boolean(returnContext));
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [opening, setOpening] = useState(false);
  const [lampOn, setLampOn] = useState(true);
  const [buddyLevel] = useState(() => getLocalBuddyLevel());
  const [fastBoot] = useState(() => {
    try {
      return window.sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const rootRef = useRef(null);
  const returnReadRef = useRef(false);
  const hostRef = useRef(null);
  const perchRef = useRef(null);
  const typeTimerRef = useRef(0);
  const openTimerRef = useRef(0);

  const visitorName = discordUser?.username || "guest";
  const hostName = compact ? "buddy" : "the host";
  const script = useMemo(
    () => buildScript({ gateReturn, hostName, linked: Boolean(discordUser), seasonalEvent, visitorName }),
    [discordUser, gateReturn, hostName, seasonalEvent, visitorName]
  );

  const hostPresent = compact
    ? buddyAwake && cabinetReady
    : hostOverdue || hostStage === "greeting" || hostStage === "waving" || hostStage === "error";
  const talking = hostPresent && authChecked && returnChecked && !opening;
  const line = script[lineIndex] ?? "";
  const lineComplete = typed >= line.length;
  const lastLine = lineIndex >= script.length - 1;
  const scriptDone = talking && lastLine && lineComplete;
  // La puerta no se abre hasta que la barra del HUD esta llena. hostPresent ya
  // cubre las salidas de emergencia (host caido, WebGL ausente, los 9s de
  // HOST_PATIENCE_MS), asi que esperar aqui no puede dejar a nadie encerrado.
  const gateReady = authChecked && hostPresent && cabinetReady;
  const canEnter = gateReady && !opening;

  useEffect(() => {
    if (returnReadRef.current) return;
    returnReadRef.current = true;
    setGateReturn(returnContext || consumeGateReturn());
    setReturnChecked(true);
  }, [returnContext]);

  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 800px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncCompact = () => setCompact(compactQuery.matches);
    const syncMotion = () => setReducedMotion(motionQuery.matches);

    compactQuery.addEventListener?.("change", syncCompact);
    motionQuery.addEventListener?.("change", syncMotion);
    return () => {
      compactQuery.removeEventListener?.("change", syncCompact);
      motionQuery.removeEventListener?.("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadIdentity() {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2200);

      try {
        // /api/comments devuelve el hilo entero y rehidrata cada autor contra la
        // API de Discord. Aqui solo hace falta la sesion, y /me la resuelve sin
        // salir del proceso.
        const response = await fetch("/api/comments/me", {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`auth returned ${response.status}`);
        const payload = await response.json();
        if (!cancelled) setDiscordUser(payload.user || null);
      } catch {
        if (!cancelled) setDiscordUser(null);
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) setAuthChecked(true);
      }
    }

    loadIdentity();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add("entry-splash-lock");
    body.classList.add("entry-splash-lock");
    rootRef.current?.focus({ preventScroll: true });

    try {
      window.sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // sessionStorage bloqueado: la ceremonia se queda en su ritmo largo.
    }

    return () => {
      root.classList.remove("entry-splash-lock");
      body.classList.remove("entry-splash-lock");
      window.clearTimeout(openTimerRef.current);
      window.clearInterval(typeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setHostOverdue(true), HOST_PATIENCE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!compact) return undefined;
    const timer = window.setTimeout(() => setBuddyAwake(true), fastBoot ? 420 : 900);
    return () => window.clearTimeout(timer);
  }, [compact, fastBoot]);

  // Una linea, un intervalo. El efecto se reinicia con cada frase, asi que el
  // contador local nunca sobrevive al cambio de linea.
  useEffect(() => {
    if (!talking) return undefined;

    window.clearInterval(typeTimerRef.current);
    if (reducedMotion || !line) {
      setTyped(line.length);
      return undefined;
    }

    setTyped(0);
    let count = 0;
    typeTimerRef.current = window.setInterval(() => {
      count += 1;
      setTyped(count);
      if (count >= line.length) window.clearInterval(typeTimerRef.current);
    }, fastBoot ? FAST_TYPE_SPEED : TYPE_SPEED);

    return () => window.clearInterval(typeTimerRef.current);
  }, [fastBoot, line, reducedMotion, talking]);

  useEffect(() => {
    if (!talking || !lineComplete || lastLine) return undefined;
    const timer = window.setTimeout(() => setLineIndex((index) => index + 1), fastBoot ? FAST_LINE_HOLD : LINE_HOLD);
    return () => window.clearTimeout(timer);
  }, [fastBoot, lastLine, lineComplete, lineIndex, talking]);

  // Toque en la burbuja: completa la frase en curso o pasa a la siguiente, el
  // gesto de siempre en una novela visual.
  const advanceScript = useCallback(() => {
    if (!talking) return;
    if (!lineComplete) {
      window.clearInterval(typeTimerRef.current);
      setTyped(line.length);
      return;
    }
    if (!lastLine) setLineIndex((index) => index + 1);
  }, [lastLine, line.length, lineComplete, talking]);

  const requestEnter = useCallback(() => {
    if (!canEnter) return;

    window.dispatchEvent(new CustomEvent("daivr-splash-enter"));

    const perchRect = perchRef.current?.getBoundingClientRect();
    const hostRect = hostRef.current?.getBoundingClientRect();
    const perchedBuddyIsVisible = perchRect && perchRect.width > 0 && perchRect.height > 0;
    onBuddyLaunch?.({
      x: perchedBuddyIsVisible
        ? perchRect.left
        : hostRect
          ? hostRect.left + hostRect.width * 0.68
          : window.innerWidth * 0.68,
      y: perchedBuddyIsVisible
        ? perchRect.top
        : hostRect
          ? Math.max(16, hostRect.top + 20)
          : 20
    });

    setOpening(true);
    window.clearInterval(typeTimerRef.current);
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = window.setTimeout(onEnter, reducedMotion ? 220 : GATE_OPEN_MS);
  }, [canEnter, onBuddyLaunch, onEnter, reducedMotion]);

  useEffect(() => {
    function enterOnKey(event) {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      // Los botones (la burbuja incluida) ya responden a su propio teclado; sin
      // esto el espacio dispararia dos acciones a la vez.
      if (event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      requestEnter();
    }

    window.addEventListener("keydown", enterOnKey);
    return () => window.removeEventListener("keydown", enterOnKey);
  }, [requestEnter]);

  const streaming = !compact && !hostPresent;
  const signalProgress = streaming ? Math.max(0, Math.min(100, Math.round(avatarProgress))) : 100;
  const signalCopy = streaming
    ? avatarProgress > 0
      ? "streaming host"
      : "linking host signal"
    : hostStage === "error" && !compact
      ? "host offline // gate still open"
      : "system ready";

  const buttonLabel = gateReady ? "open the gate" : "warming up";
  const buttonHint = !gateReady
    ? (streaming ? "linking host" : cabinetReady ? "stand by" : "loading cabinet")
    : opening ? "gate opening" : "press enter";
  const moreToSay = talking && (!lineComplete || !lastLine);

  return (
    <div
      className={`entry-gate ${compact ? "is-compact" : "is-immersive"} ${opening ? "is-opening" : ""} ${scriptDone ? "is-armed" : ""} ${hostPresent ? "is-host-present" : "is-host-waiting"} ${lampOn ? "is-lamp-on" : "is-lamp-off"}`}
      style={{ "--gate-open-duration": `${GATE_OPEN_MS}ms` }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-gate-title"
      ref={rootRef}
      tabIndex={-1}
    >
      <div className="entry-gate-sky" aria-hidden="true">
        <i className="entry-gate-grid" />
        <i className="entry-gate-horizon" />
        <i className="entry-gate-halo" />
        <i className="entry-gate-floor" />
        <i className="entry-gate-motes" />
      </div>

      <div className="entry-gate-doors" aria-hidden="true">
        {["left", "right"].map(side => <i key={side} className={`entry-gate-door is-${side}`}><i className="entry-gate-door-shade" /><i className="entry-gate-door-texture" /><span className="entry-gate-door-hardware"><i/><i/><i/><i/><span className="gate-door-vent"/></span><GatePatina side={side} seasonalEvent={seasonalEvent} /></i>)}
        <i className="entry-gate-seam" />
      </div>

      <div className="entry-gate-room-light" aria-hidden="true" />
      <GateLamp on={lampOn} onToggle={() => setLampOn((value) => !value)} disabled={opening} reducedMotion={reducedMotion} />

      {seasonalEvent === "winter" || seasonalEvent === "halloween" ? (
        // Decorado estacional del splash: el evento se ve desde la puerta.
        <div className={`entry-splash-season is-${seasonalEvent}`} aria-hidden="true">
          {seasonalEvent === "winter"
            ? Array.from({ length: 16 }, (_, index) => (
              <i
                className="splash-flake"
                key={index}
                style={{
                  "--delay": `${-((index * 1.31) % 11)}s`,
                  "--drift": `${((index * 53) % 120) - 60}px`,
                  "--duration": `${8 + (index % 7)}s`,
                  "--left": `${(index * 37) % 100}%`,
                  "--size": `${(.5 + (index % 4) * .22).toFixed(2)}rem`
                }}
              >
                ❄
              </i>
            ))
            : null}
          {seasonalEvent === "halloween" ? (
            <>
              <svg className="splash-web" viewBox="0 0 130 130">
                <g fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M0 0 L125 18 M0 0 L109 63 M0 0 L72 103 M0 0 L22 124" />
                  <path d="M36 5 Q27 9 31 18 Q21 20 21 30 Q11 27 6 36" />
                  <path d="M67 9 Q51 18 59 34 Q40 37 39 56 Q21 50 12 67" />
                  <path d="M99 14 Q76 26 87 50 Q59 54 57 82 Q31 74 17 99" />
                </g>
              </svg>
              <span className="splash-spider"><i /></span>
              <div className="splash-bats"><i /><i /><i /></div>
            </>
          ) : null}
        </div>
      ) : null}

      {seasonalEvent ? <SeasonalSplashNotice event={seasonalEvent} /> : null}

      <header className="entry-gate-topbar">
        <div className="entry-gate-brand">
          <div className="entry-gate-nameplate">
            <strong>DAI<b>.EXE</b></strong>
            <span>INTERACTIVE PORTFOLIO</span>
          </div>
        </div>

        <span className="entry-gate-edition">PERSONAL ARCADE <i aria-hidden="true" /> PLAYER ONE</span>
      </header>

      <div className="entry-gate-scene">
        <section className="entry-gate-intro" aria-labelledby="entry-gate-title">
          <div className="entry-gate-intro-copy">
            <p className="entry-gate-eyebrow"><span aria-hidden="true">01 /</span> WELCOME TO MY WORLD</p>
            <svg className="entry-gate-lettering-filters" aria-hidden="true" width="0" height="0">
              <defs>
                <filter id="gate-cut-lettering" x="-5%" y="-15%" width="110%" height="140%" colorInterpolationFilters="sRGB">
                  <feOffset in="SourceAlpha" dx="0" dy="1" result="rimOffset" />
                  <feComposite in="rimOffset" in2="SourceAlpha" operator="out" result="rim" />
                  <feFlood floodColor="#d7e6ce" floodOpacity=".42" />
                  <feComposite in2="rim" operator="in" result="metalEdge" />
                  <feOffset in="SourceAlpha" dx="1.2" dy="2.4" result="cutOffset" />
                  <feComposite in="SourceAlpha" in2="cutOffset" operator="out" result="cut" />
                  <feGaussianBlur in="cut" stdDeviation=".65" />
                  <feComposite in2="SourceAlpha" operator="in" result="innerEdge" />
                  <feFlood floodColor="#020806" floodOpacity=".95" />
                  <feComposite in2="innerEdge" operator="in" result="cutShadow" />
                  <feMerge><feMergeNode in="metalEdge" /><feMergeNode in="SourceGraphic" /><feMergeNode in="cutShadow" /></feMerge>
                </filter>
              </defs>
            </svg>
            <h1 className="entry-gate-title" id="entry-gate-title">
              <span className="entry-gate-title-line">A little <span className="entry-gate-painted-word">code.<svg className="entry-gate-paint-run is-short" viewBox="0 0 18 34" aria-hidden="true"><path d="M0 0H18C17 4 12 3 11 7C10 11 12 17 11 21C10 26 5 26 5 22C5 18 7 14 6 9C5 4 1 5 0 0Z" /></svg></span></span>
              <span className="entry-gate-title-line">A lot of <span className="entry-gate-painted-word is-accent">play.<svg className="entry-gate-paint-run is-long" viewBox="0 0 18 34" aria-hidden="true"><path d="M0 0H18C17 4 11 3 10 8C9 13 11 21 10 25C13 32 5 35 4 29C3 25 6 22 6 18L5 8C5 4 1 4 0 0Z" /></svg><svg className="entry-gate-paint-run is-bead" viewBox="0 0 18 34" aria-hidden="true"><path d="M0 0H18C16 5 12 3 11 8C10 12 13 17 10 19C6 22 4 17 5 13C7 7 3 5 0 0Z" /></svg></span></span>
            </h1>
            <p className="entry-gate-description">Step into Dai’s arcade. Projects, experiments,<br className="entry-gate-desktop-break" /> and a few distractions worth discovering.</p>
            <div className="entry-gate-categories" aria-label="Inside the portfolio"><span>BUILD</span><i aria-hidden="true" /><span>EXPLORE</span><i aria-hidden="true" /><span>PLAY</span></div>
          </div>
          <div className="entry-gate-actions">
            <button
              className="entry-gate-enter"
              type="button"
              onClick={requestEnter}
              disabled={!canEnter}
              aria-label={canEnter ? "Open the gate and enter the Dai.exe portfolio" : "The host is still arriving"}
            >
              <span>
                <strong>{opening ? "opening..." : buttonLabel}</strong>
                <small>{gateReady && !opening ? <><kbd>Enter</kbd><span>to step inside</span></> : buttonHint}</small>
              </span>
              <ArrowRight aria-hidden="true" size={20} />
            </button>

          </div>
        </section>
        <div className={`entry-gate-host ${hostPresent ? "is-present" : ""}`} ref={hostRef}>
          {compact ? (
            <div className={`entry-gate-buddy ${hostPresent ? "is-awake" : ""}`}>
              <BuddySprite
                className="entry-gate-buddy-sprite"
                expression={hostPresent ? "happy" : "idle"}
                friendshipLevel={Math.max(friendshipLevel, buddyLevel)}
                inventory={inventory}
                hiddenGear={hiddenGear}
                unlockedGear={unlockedGear}
                width={172}
                height={165}
              />
              <i className="entry-gate-buddy-pad" aria-hidden="true" />
            </div>
          ) : (
            <Suspense fallback={<AvatarScenePlaceholder displayName={visitorName} />}>
              <AvatarGreeting
                active={!opening}
                lampOn={lampOn}
                displayName={visitorName}
                onLoadProgress={setAvatarProgress}
                onStage={setHostStage}
              />
            </Suspense>
          )}
        </div>

        <div className="entry-gate-speech">
          {talking ? (
            <button
              className={`entry-gate-bubble ${lineComplete ? "is-settled" : "is-typing"}`}
              type="button"
              onClick={advanceScript}
              aria-label={moreToSay ? "Continue the greeting" : "Greeting finished"}
              disabled={!moreToSay}
            >
              <span className="entry-gate-bubble-body">
                {/* Copia invisible de la frase entera: sostiene la caja para que
                    la burbuja no crezca letra a letra mientras se escribe. */}
                <span className="entry-gate-bubble-ghost" aria-hidden="true">{line}</span>
                <span className="entry-gate-bubble-text" aria-hidden="true">{line.slice(0, typed)}</span>
              </span>
              <span className="entry-gate-bubble-read" aria-live="polite">{lineComplete ? line : ""}</span>
              {moreToSay ? <i className="entry-gate-bubble-next" aria-hidden="true" /> : null}
            </button>
          ) : (
            <span className="entry-gate-bubble is-thinking" aria-hidden="true">
              <i /><i /><i />
            </span>
          )}
        </div>
      </div>

      <footer className="entry-gate-hud">
        <svg className="entry-gate-paint-spill" viewBox="0 0 210 54" aria-hidden="true" focusable="false">
          <g className="entry-gate-spill-mint">
            <path d="M12 8C17 5 25 7 30 5C39 1 47 5 51 6C60 5 69 6 72 9C69 12 57 11 49 12C43 13 46 21 42 23C37 24 40 15 36 13C27 11 16 13 12 8Z" />
            <ellipse cx="5" cy="7" rx="2.5" ry="1.2" /><ellipse cx="28" cy="2" rx="2" ry="1" />
          </g>
          <g className="entry-gate-spill-green">
            <path d="M48 9C53 6 65 7 71 5C79 2 87 5 94 6C105 3 115 6 122 5C128 3 135 6 140 7C149 6 160 7 164 10C158 14 147 12 140 13C134 14 137 23 133 24C128 25 130 17 127 14C121 12 112 13 107 14C103 17 108 29 104 33C99 37 96 30 99 26C101 20 97 15 94 14C88 12 80 14 76 12C67 13 55 13 48 9Z" />
            <ellipse cx="174" cy="9" rx="5" ry="1.8" /><ellipse cx="187" cy="6" rx="2" ry="1" />
            <ellipse cx="115" cy="23" rx="1.6" ry="2.2" /><ellipse cx="154" cy="18" rx="2.2" ry="1.4" />
          </g>
          <path className="entry-gate-spill-shine" d="M20 8Q34 5 45 8M66 9Q82 5 93 8M109 8Q119 6 126 8M101 17Q103 23 101 27" />
        </svg>
        <div className={`entry-gate-signal ${streaming ? "is-streaming" : "is-open"}`}>
          <div className="entry-gate-signal-heading"><span><i aria-hidden="true" />{signalCopy}</span><small>{streaming ? `${signalProgress}%` : "READY"}</small></div>
          {streaming ? <i className="entry-gate-signal-meter" role="progressbar" aria-label="Host loading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={streaming && signalProgress === 0 ? undefined : signalProgress} aria-valuetext={streaming ? `${signalCopy}, ${signalProgress}%` : signalCopy}>
            <b style={{ width: `${signalProgress}%` }} />
          </i> : null}
        </div>

        <span className="entry-gate-footer-note">A little code. A little chaos.</span>
        <div className={`splash-buddy ${opening ? "is-launched" : ""}`} aria-hidden="true" ref={perchRef}>
          {cabinetReady ? <BuddySprite
            className="splash-buddy-sprite"
            expression={hostPresent ? "happy" : "idle"}
            friendshipLevel={Math.max(friendshipLevel, buddyLevel)}
            inventory={inventory}
            hiddenGear={hiddenGear}
            unlockedGear={unlockedGear}
          /> : null}
        </div>
      </footer>
    </div>
  );
}
