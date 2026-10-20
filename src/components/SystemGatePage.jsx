import { ArrowLeft, ArrowUpRight, Ban, Gamepad2, Home, Layers, Lock, MessageSquare, Radio, ShieldX, SquareTerminal, TriangleAlert, Unplug } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLocalBuddyLevel } from "../hooks/useBuddyFriendship";
import { recordGateReturn } from "../lib/gateReturn";
import { PipSprite } from "./PipSprite";

// Public destinations stay separate from the decorative broken-signal display.
const SECTORS = [
  { href: "/#home", label: "Home", detail: "Back to the cabinet", icon: Home, tone: "phosphor" },
  { href: "/#builds", label: "Projects", detail: "Explore the collection", icon: Layers, tone: "cyan" },
  { href: "/#games", label: "Games", detail: "Pick something to play", icon: Gamepad2, tone: "pink" },
  { href: "/#contact", label: "Contact", detail: "Leave a message", icon: MessageSquare, tone: "gold" }
];

// Lo que dice Buddy encima de cada aparato (clic: salta y pasa a la siguiente).
const LOST_LINES = [
  "hmm. nothing at this address.",
  "i checked behind the cabinet. twice.",
  "maybe it moved to the arcade?",
  "the link broke. wasn't me. probably.",
  "flashlight says: still nothing."
];
const SEALED_LINES = [
  "sorry. staff only.",
  "the door says no. i agree with the door.",
  "i'm on guard duty. very serious.",
  "admin? never heard of it.",
  "nice try though."
];

const reducedMotion = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

function useGateTitle(code, subtitle) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${code} // ${subtitle} · daivr.dev`;
    return () => {
      document.title = previousTitle;
    };
  }, [code, subtitle]);
}

// Deja constancia del choque para que la anfitriona lo mencione cuando el
// visitante vuelva a la puerta, en vez de saludarle como si acabara de llegar.
function useGateReturnNote(variant, requestedPath) {
  useEffect(() => {
    recordGateReturn(variant, requestedPath);
  }, [variant, requestedPath]);
}

function goBack() {
  // History length can include a new tab's about:blank entry.
  const canGoBack = window.navigation?.canGoBack ?? (window.history.length > 1);
  if (canGoBack) {
    window.history.back();
    return;
  }
  window.location.assign("/");
}

function GateTopbar({ code, status }) {
  return (
    <header className="gate-topbar">
      <a className="brand-lockup gate-brand arcade-focus" href="/" aria-label="Return to daivr.dev">
        <span className="brand-mark" aria-hidden="true">
          <span className="brand-mark-core"><span>D</span><span>V</span></span>
          <i className="brand-mark-node" />
        </span>
        <span className="gate-brand-copy">
          <strong className="brand-lockup-name">daivr.dev</strong>
          <small className="cabinet-brand-caption">Dai’s personal cabinet</small>
        </span>
      </a>
      <div className="gate-topbar-status">
        <span><i /> {status}</span>
        <strong>ERR_{code}</strong>
      </div>
    </header>
  );
}

function GateFooter({ note }) {
  return (
    <footer className="gate-footer">
      <span>{note}<i className="gate-footer-caret" aria-hidden="true" /></span>
      <span>DAI.EXE · {new Date().getFullYear()}</span>
    </footer>
  );
}

// Fondo de sala: el color del error, un suelo de rejilla que avanza, una
// banda de barrido y las lineas del CRT.
function GateBackdrop() {
  return (
    <div className="gate-backdrop" aria-hidden="true">
      <div className="gate-backdrop-wash" />
      <div className="gate-backdrop-floor"><div className="gate-backdrop-plane"><i /></div></div>
      <div className="gate-backdrop-scan" />
      <div className="gate-backdrop-lines" />
    </div>
  );
}

// El numero en capas: halo, canto en relieve, cara con degradado y lineas, y
// dos copias de color que solo asoman en los cortes del glitch.
function GateDigits({ code, children }) {
  return (
    <div className="gate-code" aria-hidden="true">
      <span className="gate-digits">
        <span className="gate-digits-glow">{code}</span>
        <span className="gate-digits-depth">{code}</span>
        <span className="gate-digits-face">{code}</span>
        <span className="gate-digits-ghost is-cyan">{code}</span>
        <span className="gate-digits-ghost is-pink">{code}</span>
      </span>
      {children}
    </div>
  );
}

const TRACE_GLYPH = { cmd: "$", ok: "✓", bad: "✕" };

// Lo que ha pasado, como un registro que se escribe linea a linea.
function GateTrace({ title, code, lines }) {
  return (
    <div className="gate-trace">
      <header><span><SquareTerminal size={13} aria-hidden="true" /> {title}</span><b>ERR_{code}</b></header>
      <ol>
        {lines.map((line, index) => (
          <li className={`is-${line.tone}`} key={line.label} style={{ "--i": index }}>
            <b aria-hidden="true">{TRACE_GLYPH[line.tone]}</b>
            <span>{line.label}</span>
            {line.value ? <><i aria-hidden="true" /><em>{line.value}</em></> : null}
          </li>
        ))}
        <li className="gate-trace-caret" aria-hidden="true" style={{ "--i": lines.length }}><b /><span /></li>
      </ol>
    </div>
  );
}

// Buddy (Pip) subido al aparato: mira a un lado y a otro y comenta; un clic
// le hace saltar y cambiar de frase.
function GatePip({ lines, inventory, variant }) {
  const [index, setIndex] = useState(0);
  const [pose, setPose] = useState("idle");
  const [facing, setFacing] = useState(1);
  const level = useMemo(() => getLocalBuddyLevel(), []);
  const poseTimer = useRef(0);

  useEffect(() => {
    if (reducedMotion()) return undefined;
    const talk = window.setInterval(() => setIndex((value) => (value + 1) % lines.length), 5200);
    // (el guardia niega con la cabeza; el que busca mira a los lados)
    const look = window.setInterval(() => {
      if (variant === "sealed") {
        setFacing(-1);
        window.setTimeout(() => setFacing(1), 260);
        window.setTimeout(() => setFacing(-1), 520);
        window.setTimeout(() => setFacing(1), 780);
      } else {
        setFacing((value) => -value);
      }
    }, variant === "sealed" ? 6100 : 2900);
    return () => { window.clearInterval(talk); window.clearInterval(look); window.clearTimeout(poseTimer.current); };
  }, [lines.length, variant]);

  const poke = () => {
    setIndex((value) => (value + 1) % lines.length);
    setPose("jump");
    window.clearTimeout(poseTimer.current);
    poseTimer.current = window.setTimeout(() => setPose("idle"), 420);
  };

  return (
    <div className={`gate-pip is-${variant} ${facing > 0 ? "is-facing-left" : "is-facing-right"}`}>
      <p className="gate-pip-bubble" key={index} aria-hidden="true">{lines[index]}</p>
      {variant === "lost" ? <span className="gate-pip-beam" aria-hidden="true"><i /></span> : null}
      <button className="gate-pip-body arcade-focus" type="button" onClick={poke} aria-label="Poke Buddy">
        <PipSprite pose={pose} facing={facing} expression={pose === "jump" ? "happy" : variant === "sealed" ? "focus" : "idle"} friendshipLevel={level} inventory={inventory} />
      </button>
    </div>
  );
}

// Nieve de television: ruido de fosforo a baja resolucion, con alguna fila
// mas brillante, a ~14 fps.
function SignalStatic() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!g) return undefined;
    const image = g.createImageData(canvas.width, canvas.height);
    const paint = () => {
      const data = image.data, width = canvas.width;
      const band = Math.random() < 0.35 ? Math.floor(Math.random() * canvas.height) : -9;
      for (let i = 0; i < data.length; i += 4) {
        const row = (i / 4 / width) | 0;
        const value = Math.random() * 255 + (Math.abs(row - band) < 2 ? 70 : 0);
        data[i] = value * 0.55; data[i + 1] = Math.min(255, value); data[i + 2] = value * 0.78;
        data[i + 3] = value > 175 ? 255 : value > 120 ? 110 : 0;
      }
      g.putImageData(image, 0, 0);
    };
    paint();
    if (reducedMotion()) return undefined;
    const timer = window.setInterval(() => { if (!document.hidden) paint(); }, 70);
    return () => window.clearInterval(timer);
  }, []);
  return <canvas ref={canvasRef} className="signal-static" width={160} height={90} aria-hidden="true" />;
}

const TUNE_MIN = 88.1, TUNE_MAX = 107.9;

// La pantalla del receptor: busca emisora sin parar; de vez en cuando cree
// que ha encontrado algo, sale la carta de ajuste y no: "no carrier".
function SignalScreen({ code }) {
  const [tune, setTune] = useState({ freq: 96.4, lock: false });
  useEffect(() => {
    if (reducedMotion()) return undefined;
    let freq = 96.4, dir = 1, hold = 0;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (hold > 0) {
        hold -= 1;
        if (hold === 0) setTune({ freq, lock: false });
        return;
      }
      freq += 0.3 * dir;
      if (freq >= TUNE_MAX) { freq = TUNE_MAX; dir = -1; }
      if (freq <= TUNE_MIN) { freq = TUNE_MIN; dir = 1; }
      if (Math.random() < 0.025) { hold = 14; setTune({ freq, lock: true }); return; }
      setTune({ freq, lock: false });
    }, 110);
    return () => window.clearInterval(timer);
  }, []);
  const position = (tune.freq - TUNE_MIN) / (TUNE_MAX - TUNE_MIN);
  return (
    <div className={`signal-screen ${tune.lock ? "is-locking" : ""}`} aria-hidden="true">
      <SignalStatic />
      <div className="signal-testcard">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div>
      <span className="signal-osd signal-osd-channel">CH {code}</span>
      <span className="signal-osd signal-osd-scan"><i /> {tune.lock ? "Locking" : "Auto-scan"}</span>
      <div className="signal-card">
        <span className="signal-card-icon"><Unplug size={30} strokeWidth={1.6} /></span>
        <strong className="signal-title" data-text="NO SIGNAL">NO SIGNAL</strong>
        <span className="signal-subtitle">Destination unavailable</span>
      </div>
      <div className="signal-tuner" style={{ "--tune": position }}>
        <div className="signal-tuner-scale"><span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span><i /></div>
        <b>{tune.lock ? "NO CARRIER" : `SCAN ${tune.freq.toFixed(1)}`}</b>
      </div>
      <span className="signal-glass" />
    </div>
  );
}

/* A failed transmission above stable, keyboard-accessible recovery links. */
function LostSectorPage({ requestedPath }) {
  useGateTitle("404", "navigation fault");
  useGateReturnNote("missing", requestedPath);
  const path = requestedPath || "/unknown";

  return (
    <main className="gate-page is-lost">
      <GateBackdrop />

      <GateTopbar code="404" status="route not found" />

      <div className="gate-body">
        <section className="gate-copy" aria-labelledby="lost-title">
          <p className="gate-tag"><TriangleAlert size={16} aria-hidden="true" /> navigation error / dead end</p>
          <GateDigits code="404">
            <i className="gate-code-badge"><Unplug size={26} /></i>
          </GateDigits>
          <h1 id="lost-title">Page not found.</h1>
          <p className="gate-desc">
            There’s nothing at this address. The link may be broken,
            or the page may have moved. Let’s get you back on track.
          </p>

          <GateTrace
            title="route trace"
            code="404"
            lines={[
              { tone: "cmd", label: `goto ${path}` },
              { tone: "ok", label: "cabinet", value: "online" },
              { tone: "ok", label: "router", value: "responding" },
              { tone: "bad", label: path, value: "no destination" }
            ]}
          />

          <div className="gate-actions">
            <a className="crt-button crt-button-primary arcade-focus" href="/">
              <Home size={17} aria-hidden="true" /> Back to the arcade <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <button className="crt-button arcade-focus" type="button" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden="true" /> Go back
            </button>
          </div>
        </section>

        <div className="gate-rig is-lost">
          <span className="receiver-antenna" aria-hidden="true"><i /><i /><b /></span>
          <GatePip lines={LOST_LINES} inventory={["wrench"]} variant="lost" />
          <section className="gate-device lost-device" aria-labelledby="lost-device-title">
            <div className="device-header">
              <span><Radio size={15} aria-hidden="true" /> Cabinet receiver</span>
              <span className="device-lights" aria-hidden="true"><i /><i /><i /></span>
            </div>
            <SignalScreen code="404" />
            <div className="signal-link" aria-hidden="true">
              <span className="signal-link-node is-live"><i /> cabinet</span>
              <span className="signal-link-wire"><i /></span>
              <span className="signal-link-break">✕</span>
              <span className="signal-link-dead" />
              <span className="signal-link-node is-dead"><i /> {path}</span>
            </div>
            <div className="device-recovery">
              <div className="device-section-heading"><h2 id="lost-device-title">Find your way back</h2><span><i />04 online</span></div>
              <nav className="recovery-sectors" aria-label="Public destinations">
                {SECTORS.map(({ href, label, detail, icon: Icon, tone }, index) => (
                  <a className={`recovery-sector is-${tone} arcade-focus`} href={href} key={href}>
                    <span className="recovery-sector-icon"><Icon size={18} aria-hidden="true" /></span>
                    <span className="recovery-sector-copy"><b>{label}</b><small>{detail}</small></span>
                    <span className="recovery-sector-meta" aria-hidden="true"><em>0{index + 1}</em><ArrowUpRight size={14} /></span>
                  </a>
                ))}
              </nav>
            </div>
            <div className="device-footer" aria-hidden="true"><span>DAI / RECOVERY UNIT</span><span className="device-meter"><i /><i /><i /><i /><i /></span><span className="device-vents" /></div>
          </section>
        </div>
      </div>

      <GateFooter note="navigation interrupted // recovery available" />
    </main>
  );
}

// La camara de seguridad sigue al cursor; si nadie lo mueve, barre sola.
function useCameraAim(ref) {
  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion()) return undefined;
    let idleTimer = 0;
    const idle = () => node.classList.add("is-idle");
    const aim = (event) => {
      const box = node.getBoundingClientRect();
      const angle = Math.atan2(event.clientY - (box.top + box.height * 0.45), event.clientX - (box.left + box.width * 0.82)) * 180 / Math.PI;
      const turn = Math.max(-55, Math.min(28, ((angle - 180 + 540) % 360) - 180));
      node.style.setProperty("--cam-turn", `${turn.toFixed(1)}deg`);
      node.classList.remove("is-idle");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(idle, 3200);
    };
    idle();
    window.addEventListener("pointermove", aim, { passive: true });
    return () => { window.removeEventListener("pointermove", aim); window.clearTimeout(idleTimer); };
  }, [ref]);
}

/* 403: a clear recovery route beside a sealed access-status terminal. */
function SealedGatePage({ requestedPath }) {
  useGateTitle("403", "restricted sector");
  useGateReturnNote("denied", requestedPath);
  const cameraRef = useRef(null);
  useCameraAim(cameraRef);
  const path = requestedPath || "/unknown";

  return (
    <main className="gate-page is-sealed">
      <GateBackdrop />

      <GateTopbar code="403" status="access denied" />

      <div className="gate-body">
        <section className="gate-copy" aria-labelledby="sealed-title">
          <p className="gate-tag"><ShieldX size={16} aria-hidden="true" /> restricted area / keep out</p>
          <GateDigits code="403">
            <i className="gate-code-badge"><Ban size={30} /></i>
            <span className="sealed-tape is-back" aria-hidden="true"><span>{"restricted ✕ keep out ✕ ".repeat(6)}</span></span>
            <span className="sealed-tape is-front" aria-hidden="true"><span>{"keep out ✕ staff only ✕ ".repeat(6)}</span></span>
          </GateDigits>
          <h1 id="sealed-title">Access denied.</h1>
          <p className="gate-desc">
            This part of the cabinet isn’t open to the public.
            Head back to the arcade. There’s plenty left to explore.
          </p>

          <GateTrace
            title="clearance check"
            code="403"
            lines={[
              { tone: "cmd", label: `open ${path}` },
              { tone: "ok", label: "visitor", value: "recognised" },
              { tone: "bad", label: "clearance", value: "staff only" },
              { tone: "bad", label: "door", value: "stays shut" }
            ]}
          />

          <div className="gate-actions">
            <a className="crt-button crt-button-primary arcade-focus" href="/">
              <Home size={17} aria-hidden="true" /> Back to the arcade <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <button className="crt-button arcade-focus" type="button" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden="true" /> Go back
            </button>
          </div>

          <p className="sealed-note">
            <MessageSquare size={15} aria-hidden="true" />
            <span>Think this is a mistake? <a className="arcade-focus" href="/#contact">Leave a note <ArrowUpRight size={13} aria-hidden="true" /></a></span>
          </p>
        </section>

        <div className="gate-rig is-sealed">
          <span className="sealed-beacon" aria-hidden="true"><span className="sealed-beacon-sweep"><i /></span><b /></span>
          <GatePip lines={SEALED_LINES} inventory={["coffee"]} variant="sealed" />
          <section className="gate-device sealed-device" aria-labelledby="sealed-device-title">
            <div className="device-header"><span><ShieldX size={15} aria-hidden="true" /> Private sector</span><span className="device-status"><i />Locked</span></div>
            <div className="vault-scene" aria-hidden="true">
              <div className="vault-leaf vault-leaf-left" /><div className="vault-leaf vault-leaf-right" />
              <span className="vault-rail vault-rail-top" /><span className="vault-rail vault-rail-bottom" />
              <span className="vault-bolt vault-bolt-left" /><span className="vault-bolt vault-bolt-right" />
              <div className="vault-dial"><span className="vault-dial-ticks" /><span className="vault-emblem"><Lock size={62} strokeWidth={1.5} /></span></div>
              <div className="vault-warning"><Ban size={13} /> KEEP OUT</div>
              <span className="vault-laser"><i /></span>
              <span className="vault-camera" ref={cameraRef}>
                <svg className="vault-camera-arm" viewBox="0 0 22 40" fill="none">
                  <path d="M6 0h12v6h-4v26H10V6H6z" />
                  <circle cx="12" cy="33" r="5" />
                </svg>
                <svg className="vault-camera-head" viewBox="0 0 72 34" fill="none">
                  <path className="vault-camera-hood" d="M14 3h46l6 6H10z" />
                  <path className="vault-camera-body" d="M14 9h50a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14z" />
                  <path className="vault-camera-shade" d="M14 21h53v3a3 3 0 0 1-3 3H14z" />
                  <path className="vault-camera-face" d="M6 8h10v20H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" />
                  <circle className="vault-camera-lens" cx="9.5" cy="18" r="5.2" />
                  <circle className="vault-camera-glint" cx="8" cy="16.4" r="1.5" />
                  <circle className="vault-camera-led" cx="58" cy="15.5" r="2" />
                </svg>
              </span>
            </div>
            <div className="vault-verdict">
              <span className="vault-verdict-icon"><ShieldX size={24} aria-hidden="true" /></span>
              <div><h2 id="sealed-device-title">This door stays closed.</h2><p>Public access is not permitted.</p></div>
              <span className="vault-lcd" aria-hidden="true"><b>DENIED</b><i>• • • •</i></span>
            </div>
            <div className="sealed-path"><span><Lock size={13} aria-hidden="true" /> Restricted route</span><code>{path}</code><em aria-hidden="true">attempt 01</em></div>
            <div className="device-footer" aria-hidden="true"><span>DAI / ACCESS CONTROL</span><span className="device-meter is-alarm"><i /><i /><i /><i /><i /></span><span className="device-vents" /></div>
          </section>
        </div>
      </div>

      <GateFooter note="access denied // return to a public sector" />
    </main>
  );
}

export function SystemGatePage({ requestedPath, variant = "missing" }) {
  if (variant === "denied") return <SealedGatePage requestedPath={requestedPath} />;
  return <LostSectorPage requestedPath={requestedPath} />;
}
