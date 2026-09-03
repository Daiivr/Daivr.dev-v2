import { ArrowLeft, ChevronRight, Home, LockKeyhole, ShieldAlert, Terminal, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

// Las rutas vivas del cabinet. Una pagina de error que solo sabe decir que la
// ruta no existe deja al visitante en un callejon; estas son las salidas.
const LIVE_ROUTES = [
  ["/#home", "Dai.exe", "01"],
  ["/#builds", "Carts", "03"],
  ["/#games", "Games", "05"],
  ["/#contact", "Comments", "08"]
];

const PAGE_CONFIG = {
  missing: {
    code: "404",
    eyebrow: "navigation fault",
    title: "You drifted off the map.",
    description: "No cartridge lives at this coordinate. The cabinet is sweeping nearby sectors, but this route has no signal, save slot, or recoverable node.",
    command: "$ sweep --lost-sector",
    file: "lost-sector.map",
    signal: "no signal",
    channel: "ch 404",
    ident: "sector ??",
    footer: "search beacon // active",
    ticker: ["err_404", "sector unmapped", "no cartridge in bay", "search beacon active", "signal lost"],
    // El tercer campo es el tono: los tres valores salian del mismo color, asi
    // que "armed" (buena noticia) pesaba igual que "not found".
    gauges: [
      ["route.map", "not found", "bad"],
      ["signal.bus", "disconnected", "bad"],
      ["fallback", "armed", "ok"]
    ],
    Icon: WifiOff
  },
  denied: {
    code: "403",
    eyebrow: "security lockdown",
    title: "Clearance rejected.",
    description: "The cabinet recognizes your session, but this archive is sealed above your access tier. The route has been quarantined and no protected data was exposed.",
    command: "$ auth --challenge",
    file: "quarantine.lock",
    signal: "gate sealed",
    channel: "tier 03",
    ident: "quarantine",
    footer: "security bus // holding",
    ticker: ["err_403", "auth gate sealed", "clearance insufficient", "route quarantined", "no data exposed"],
    gauges: [
      ["identity", "recognized", "ok"],
      ["clearance", "insufficient", "bad"],
      ["data.lock", "engaged", "warn"]
    ],
    Icon: LockKeyhole
  }
};

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

  return { x: formatAxis(x), y: formatAxis(y), z: `0x${z}` };
}

export function SystemGatePage({ requestedPath, variant = "missing" }) {
  const config = PAGE_CONFIG[variant] || PAGE_CONFIG.missing;
  const { Icon } = config;
  const pageRef = useRef(null);
  const traceId = useMemo(() => Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, "0"), []);
  const routeCoordinates = useMemo(() => getRouteCoordinates(requestedPath), [requestedPath]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${config.code} // ${config.eyebrow} · daivr.dev`;
    return () => {
      document.title = previousTitle;
    };
  }, [config.code, config.eyebrow]);

  // Parallax de puntero: las capas del fondo se separan en profundidad cuando
  // mueves el raton. Va en variables CSS y a una escritura por frame, asi que
  // React no re-renderiza nada.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const root = pageRef.current;
    if (!root) return undefined;

    // La consulta se hace por movimiento y no al montar: si se comprueba una
    // sola vez en el mount y el navegador aun no ha resuelto la preferencia,
    // el parallax se queda muerto para toda la sesion.
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
      root.style.removeProperty("--gate-px");
      root.style.removeProperty("--gate-py");
    };
  }, []);

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/");
  }

  return (
    <main className={`system-gate-page is-${variant}`} ref={pageRef}>
      {/* Cada variante pinta este mismo juego de capas con un mundo
          distinto: el 404 en el vacio (estrellas, mapa de sectores girando,
          limbo de un planeta) y el 403 encerrado (chevrones de peligro, faro
          rotatorio, barrotes). Las capas se separan con el puntero. */}
      <div className="gate-bg" aria-hidden="true">
        <span className="gate-bg-aurora" />
        <span className="gate-bg-stars" />
        <span className="gate-bg-floor" />
        <span className="gate-bg-horizon" />
        <span className="gate-bg-pillars"><i /><i /><i /><i /><i /></span>
        <span className="gate-bg-scan" />
        <span className="gate-bg-sweep" />
        <span className="gate-bg-vignette" />
      </div>

      <header className="gate-topbar">
        <a className="gate-brand arcade-focus" href="/" aria-label="Return to daivr.dev">
          <span>DV</span>
          <strong>daivr.dev</strong>
          <small>arcade recovery system</small>
        </a>
        <div className="gate-topbar-status">
          <span><i /> cabinet online</span>
          <strong>ERR_{config.code}</strong>
        </div>
      </header>

      {/* Marquesina de bombillas: la cinta que corre por encima de un mueble
          arcade real, y lo primero que dice que esto es una averia. */}
      <div className="gate-marquee" aria-hidden="true">
        <div className="gate-marquee-track">
          {[0, 1, 2, 3].map((pass) => (
            <span key={pass}>
              {config.ticker.map((word) => (
                <b key={`${pass}-${word}`}>{word}<i /></b>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="gate-monitor" aria-labelledby="gate-title">
        <div className="gate-monitor-hood" aria-hidden="true">
          <span className="gate-monitor-vent" />
          <span className="gate-monitor-plate">~/daivr/recovery/{config.file}</span>
          <span className="gate-monitor-led"><i /><i /><i /></span>
        </div>

        <div className="gate-screen">
          <div className="gate-screen-card" aria-hidden="true" />
          <div className="gate-screen-static" aria-hidden="true" />
          <div className="gate-screen-hold" aria-hidden="true" />

          {variant === "denied" ? (
            <div className="gate-shutter" aria-hidden="true">
              <i className="is-top" />
              <i className="is-bottom" />
              <span className="gate-shutter-lock"><Icon size={28} /></span>
            </div>
          ) : (
            <div className="gate-lost" aria-hidden="true">
              <span className="gate-lost-icon"><Icon size={30} /></span>
              <span className="gate-lost-ring" />
            </div>
          )}

          <div className="gate-screen-osd" aria-hidden="true">
            <span className="is-tl"><i /> {config.signal}</span>
            <span className="is-tr">{config.channel}</span>
            <span className="is-bl">{config.ident}</span>
            <span className="is-br">trace_{traceId}</span>
          </div>

          <div className="gate-screen-body">
            <p className="gate-eyebrow"><ShieldAlert size={13} aria-hidden="true" /> {config.eyebrow}</p>
            <div className="gate-code" data-code={config.code}>{config.code}</div>
            <h1 id="gate-title">{config.title}</h1>
            <p className="gate-desc">{config.description}</p>
          </div>

          <div className="gate-screen-glass" aria-hidden="true" />
        </div>

        {/* Panel de control del mueble: comando, botones y agujas en una sola
            banda horizontal, en vez de la tarjeta lateral de diagnostico. */}
        <div className="gate-deck">
          <div className="gate-deck-main">
            <div className="gate-cmd">
              <Terminal size={14} aria-hidden="true" />
              <span>{config.command}</span>
              <code>{requestedPath || "/unknown"}</code>
              <i className="gate-cmd-caret" aria-hidden="true" />
            </div>

            <div className="gate-actions">
              <a className="gate-btn is-primary arcade-focus" href="/">
                <Home size={15} aria-hidden="true" /> Return home
              </a>
              <button className="gate-btn arcade-focus" type="button" onClick={goBack}>
                <ArrowLeft size={15} aria-hidden="true" /> Previous screen
              </button>
            </div>
          </div>

          <div className="gate-deck-readout">
            <dl className="gate-gauges">
              {config.gauges.map(([label, value, tone]) => (
                <div className={`is-${tone}`} key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="gate-deck-meter">
              <div className="gate-wave" aria-hidden="true">
                {Array.from({ length: 22 }, (_, index) => <i key={index} style={{ "--route-step": index }} />)}
              </div>
              {variant === "missing" ? (
                <div className="gate-coords" aria-hidden="true">
                  <span>X {routeCoordinates.x}</span>
                  <span>Y {routeCoordinates.y}</span>
                  <span>Z {routeCoordinates.z}</span>
                </div>
              ) : (
                <div className="gate-coords is-clearance" aria-label="Clearance handshake failed at step one of five">
                  <span>handshake</span>
                  <b aria-hidden="true"><i /><i /><i /><i /><i /></b>
                  <span>01 / 05</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Estanteria de cartuchos: la mitad inferior de la pagina estaba en
          blanco y no ofrecia ni una salida. */}
      <nav className="gate-rack" aria-label="Live sectors">
        <span className="gate-rack-label">nearest live sectors</span>
        <div className="gate-rack-slots">
          {LIVE_ROUTES.map(([href, label, id]) => (
            <a className="gate-cart arcade-focus" href={href} key={href}>
              <b>{id}</b>
              <span>{label}</span>
              <ChevronRight size={13} aria-hidden="true" />
              <em aria-hidden="true" />
            </a>
          ))}
        </div>
      </nav>

      <footer className="gate-footer">
        <span>{config.footer}</span>
        <span>DAI.EXE · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
