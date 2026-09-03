import { ArrowLeft, Check, ChevronRight, Home, Lock, MessageSquare, Minus, Radar, ShieldX, Slash, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { recordGateReturn } from "../lib/gateReturn";

// Las rutas vivas del cabinet. Una pagina de error que solo sabe decir que la
// ruta no existe deja al visitante en un callejon; estas son las salidas.
// En el 404 son nodos del mapa, asi que cada una lleva su posicion polar.
const SECTORS = [
  { href: "/#home", label: "Dai.exe", id: "01", x: 27, y: 31 },
  { href: "/#builds", label: "Carts", id: "03", x: 73, y: 23 },
  { href: "/#games", label: "Games", id: "05", x: 79, y: 64 },
  { href: "/#contact", label: "Comments", id: "08", x: 36, y: 77 }
];

// Posiciones donde puede caer el blip perdido. Un angulo al azar acaba
// tapando un nodo segun la URL — las pastillas de sector son anchas, asi que
// la distancia entre centros no basta. Estas seis estan medidas contra las
// cajas reales de los nodos a 375px, que es donde las pastillas ocupan mayor
// proporcion del mapa; en pantallas grandes solo sobra sitio.
const LOST_SLOTS = [
  { left: 15, top: 15 },
  { left: 45, top: 15 },
  { left: 85, top: 45 },
  { left: 70, top: 85 },
  { left: 10, top: 85 },
  { left: 15, top: 55 }
];

// El handshake del 403: una secuencia que se para en un escalon concreto, en
// vez de tres agujas sueltas que no cuentan donde fallo la autorizacion.
const HANDSHAKE = [
  { key: "session.token", value: "recognized", state: "pass" },
  { key: "access.tier", value: "insufficient", state: "fail" },
  { key: "archive.lock", value: "engaged", state: "held" },
  { key: "payload", value: "never transmitted", state: "held" }
];

function getRouteCoordinates(pathname = "/unknown") {
  let hash = 2166136261;
  for (const character of pathname) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const unsigned = hash >>> 0;
  const x = ((unsigned & 0xffff) / 0xffff) * 360 - 180;
  const y = (((unsigned >>> 16) & 0xffff) / 0xffff) * 180 - 90;
  const z = ((unsigned ^ (unsigned >>> 11)) & 0xff).toString(16).toUpperCase().padStart(2, "0");
  const formatAxis = (value) => `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(3).padStart(7, "0")}`;

  // La misma semilla elige el hueco donde cae el blip perdido.
  const slot = LOST_SLOTS[(unsigned >>> 7) % LOST_SLOTS.length];

  return {
    x: formatAxis(x),
    y: formatAxis(y),
    z: `0x${z}`,
    blip: slot
  };
}

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
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.assign("/");
}

function GateTopbar({ code, status }) {
  return (
    <header className="gate-topbar">
      <a className="gate-brand arcade-focus" href="/" aria-label="Return to daivr.dev">
        <span>DV</span>
        <strong>daivr.dev</strong>
        <small>arcade recovery system</small>
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
      <span>{note}</span>
      <span>DAI.EXE · {new Date().getFullYear()}</span>
    </footer>
  );
}

/* ── 404 ─────────────────────────────────────────────────────────────────
   Carta de navegacion. La pagina esta abierta y es ancha: el texto vive a la
   izquierda y a la derecha hay un mapa que barre el sector. Las salidas no son
   una lista debajo del pliegue, son los nodos del propio mapa, porque el
   trabajo de un 404 es llevarte a otro sitio. */
function LostSectorPage({ requestedPath }) {
  const pageRef = useRef(null);
  const coordinates = useMemo(() => getRouteCoordinates(requestedPath), [requestedPath]);
  useGateTitle("404", "navigation fault");
  useGateReturnNote("missing", requestedPath);

  // Parallax de puntero: solo aqui. Una carta estelar deriva; una puerta
  // blindada no. Va por variables CSS y una escritura por frame.
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;

    const stillMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let pending = { x: 0, y: 0 };

    function apply() {
      frame = 0;
      root.style.setProperty("--gate-px", pending.x.toFixed(3));
      root.style.setProperty("--gate-py", pending.y.toFixed(3));
    }

    function onMove(event) {
      if (stillMedia.matches) return;
      pending = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1
      };
      if (!frame) frame = window.requestAnimationFrame(apply);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="gate-page is-lost" ref={pageRef}>
      <div className="lost-void" aria-hidden="true">
        <span className="lost-void-stars" />
        <span className="lost-void-dust" />
        <span className="lost-void-glow" />
      </div>

      <GateTopbar code="404" status="cabinet online" />

      <div className="lost-body">
        <section className="lost-copy">
          <p className="lost-tag"><Radar size={13} aria-hidden="true" /> navigation fault · err_404</p>
          <h1>You drifted off the map.</h1>
          <p className="lost-desc">
            No cartridge lives at this coordinate. The beacon is still sweeping,
            but this route has no signal and no save slot to recover.
          </p>

          <p className="lost-path">
            <span aria-hidden="true">$ sweep --lost-sector</span>
            <code>{requestedPath || "/unknown"}</code>
          </p>

          <dl className="lost-fix">
            <div>
              <dt>last known</dt>
              <dd>X {coordinates.x} · Y {coordinates.y} · Z {coordinates.z}</dd>
            </div>
            <div>
              <dt>signal</dt>
              <dd className="is-lost">lost</dd>
            </div>
          </dl>

          <div className="lost-actions">
            <a className="gate-btn is-primary arcade-focus" href="/">
              <Home size={15} aria-hidden="true" /> Return home
            </a>
            <button className="gate-btn arcade-focus" type="button" onClick={goBack}>
              <ArrowLeft size={15} aria-hidden="true" /> Previous screen
            </button>
          </div>
        </section>

        {/* El mapa es la navegacion: cada nodo es un enlace real, el SVG que
            hay debajo es decorativo. */}
        <section className="lost-chart" aria-labelledby="lost-chart-title">
          <h2 className="sr-only" id="lost-chart-title">Live sectors you can jump to</h2>

          <div className="lost-chart-frame">
            <svg className="lost-chart-grid" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <defs>
                <radialGradient id="lost-sweep-fade">
                  <stop offset="0%" stopColor="currentColor" stopOpacity=".38" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
              </defs>
              <g className="lost-chart-rings">
                <circle cx="100" cy="100" r="30" />
                <circle cx="100" cy="100" r="55" />
                <circle cx="100" cy="100" r="80" />
                <circle cx="100" cy="100" r="95" />
              </g>
              <g className="lost-chart-cross">
                <line x1="100" y1="4" x2="100" y2="196" />
                <line x1="4" y1="100" x2="196" y2="100" />
              </g>
              <g className="lost-chart-sweep">
                <path d="M100 100 L100 2 A98 98 0 0 1 169 31 Z" fill="url(#lost-sweep-fade)" />
              </g>
            </svg>

            <span className="lost-chart-you" style={{ left: `${coordinates.blip.left}%`, top: `${coordinates.blip.top}%` }}>
              <i aria-hidden="true" />
              <em>you</em>
            </span>

            {SECTORS.map((sector) => (
              <a
                className="lost-node arcade-focus"
                href={sector.href}
                key={sector.href}
                style={{ left: `${sector.x}%`, top: `${sector.y}%` }}
              >
                <i aria-hidden="true" />
                <span><b>{sector.id}</b>{sector.label}</span>
              </a>
            ))}
          </div>

          <p className="lost-chart-hint">
            <Radar size={12} aria-hidden="true" /> four sectors still reporting — pick one
          </p>
        </section>
      </div>

      <GateFooter note="search beacon // sweeping" />
    </main>
  );
}

/* ── 403 ─────────────────────────────────────────────────────────────────
   Puerta sellada. Todo lo contrario del 404: una columna estrecha y centrada
   que no se mueve con el raton, sin mapa y sin estanteria de salidas. Lo que
   manda es el sello y la escalera de autorizacion, que se ve pararse en el
   escalon exacto que fallo. */
function SealedGatePage({ requestedPath }) {
  useGateTitle("403", "security lockdown");
  useGateReturnNote("denied", requestedPath);

  return (
    <main className="gate-page is-sealed">
      <div className="sealed-walls" aria-hidden="true">
        <span className="sealed-walls-hazard" />
        <span className="sealed-walls-vignette" />
      </div>

      <GateTopbar code="403" status="session recognized" />

      <div className="sealed-body">
        <div className="sealed-door">
          <span className="sealed-door-hazard" aria-hidden="true" />
          <span className="sealed-stamp">
            <b>403</b>
            <i aria-hidden="true"><Lock size={15} /></i>
          </span>
          <span className="sealed-door-seam" aria-hidden="true" />
        </div>

        <section className="sealed-copy">
          <p className="sealed-tag"><ShieldX size={13} aria-hidden="true" /> security lockdown</p>
          <h1>Clearance rejected.</h1>
          <p className="sealed-desc">
            The cabinet knows who you are. This archive just sits above your
            access tier, so the route was quarantined before anything opened.
          </p>
        </section>

        {/* La escalera para donde para la autorizacion: los dos ultimos
            escalones quedan en gris porque nunca llegaron a ejecutarse. */}
        <ol className="sealed-ladder">
          {HANDSHAKE.map((step, index) => (
            <li className={`is-${step.state}`} key={step.key}>
              <span className="sealed-step-rail" aria-hidden="true" />
              <span className="sealed-step-mark" aria-hidden="true">
                {step.state === "pass" ? <Check size={12} /> : step.state === "fail" ? <X size={12} /> : <Minus size={12} />}
              </span>
              <span className="sealed-step-copy">
                <b>{step.key}</b>
                <em>{step.value}</em>
              </span>
              <span className="sealed-step-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </li>
          ))}
        </ol>

        <p className="sealed-path">
          <Slash size={12} aria-hidden="true" />
          <span aria-hidden="true">$ auth --challenge</span>
          <code>{requestedPath || "/unknown"}</code>
        </p>

        <div className="sealed-actions">
          <a className="gate-btn is-primary arcade-focus" href="/">
            <Home size={15} aria-hidden="true" /> Return home
          </a>
          <button className="gate-btn arcade-focus" type="button" onClick={goBack}>
            <ArrowLeft size={15} aria-hidden="true" /> Previous screen
          </button>
        </div>

        <p className="sealed-note">
          <MessageSquare size={12} aria-hidden="true" />
          Think this tier should be yours? <a className="arcade-focus" href="/#contact">Leave a note<ChevronRight size={12} aria-hidden="true" /></a>
        </p>
      </div>

      <GateFooter note="security bus // holding" />
    </main>
  );
}

export function SystemGatePage({ requestedPath, variant = "missing" }) {
  if (variant === "denied") return <SealedGatePage requestedPath={requestedPath} />;
  return <LostSectorPage requestedPath={requestedPath} />;
}
