import { ArrowLeft, ArrowUpRight, Ban, Gamepad2, Home, Layers, Lock, MessageSquare, Radio, ShieldX, TriangleAlert, Unplug, X } from "lucide-react";
import { useEffect } from "react";
import { recordGateReturn } from "../lib/gateReturn";

// Public destinations stay separate from the decorative broken-signal display.
const SECTORS = [
  { href: "/#home", label: "Home", detail: "Back to the cabinet", icon: Home },
  { href: "/#builds", label: "Projects", detail: "Explore the collection", icon: Layers },
  { href: "/#games", label: "Games", detail: "Pick something to play", icon: Gamepad2 },
  { href: "/#contact", label: "Contact", detail: "Leave a message", icon: MessageSquare }
];

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
      <span>{note}</span>
      <span>DAI.EXE · {new Date().getFullYear()}</span>
    </footer>
  );
}

/* A failed transmission above stable, keyboard-accessible recovery links. */
function LostSectorPage({ requestedPath }) {
  useGateTitle("404", "navigation fault");
  useGateReturnNote("missing", requestedPath);

  return (
    <main className="gate-page is-lost">
      <div className="lost-fault-background" aria-hidden="true" />

      <GateTopbar code="404" status="route not found" />

      <div className="lost-body">
        <section className="lost-copy" aria-labelledby="lost-title">
          <p className="lost-tag"><TriangleAlert size={16} aria-hidden="true" /> navigation error / dead end</p>
          <div className="gate-code lost-fault-code" aria-hidden="true">
            <span className="lost-fault-digits" data-code="404">404</span>
            <i><Unplug size={34} /></i>
          </div>
          <h1 id="lost-title">Page not found.</h1>
          <p className="lost-desc">
            There’s nothing at this address. The link may be broken,
            or the page may have moved. Let’s get you back on track.
          </p>

          <p className="lost-path">
            <span><X size={13} aria-hidden="true" /> No destination</span>
            <code>{requestedPath || "/unknown"}</code>
          </p>

          <div className="lost-actions gate-actions">
            <a className="crt-button crt-button-primary arcade-focus" href="/">
              <Home size={17} aria-hidden="true" /> Back to the arcade <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <button className="crt-button arcade-focus" type="button" onClick={goBack}>
              <ArrowLeft size={16} aria-hidden="true" /> Go back
            </button>
          </div>
        </section>

        <section className="gate-device lost-device" aria-labelledby="lost-device-title">
          <div className="device-header"><span><Radio size={15} aria-hidden="true" /> Cabinet receiver</span><span className="device-lights" aria-hidden="true"><i /><i /><i /></span></div>
          <div className="signal-screen" aria-hidden="true">
            <span className="signal-corner signal-corner-tl" /><span className="signal-corner signal-corner-br" />
            <div className="signal-graphic">
              <svg className="signal-wave" viewBox="0 0 400 180" fill="none">
                <path className="signal-wave-live" d="M0 90H28L37 69L47 115L59 38L72 141L85 64L98 101L112 90H134" />
                <path className="signal-wave-dead" d="M266 90H400" />
                <path className="signal-wave-break" d="M154 57L142 84L161 97L149 124M248 57L236 84L255 97L243 124" />
              </svg>
              <span className="signal-disconnect"><Unplug size={52} strokeWidth={1.5} /></span>
            </div>
            <strong className="signal-title" data-text="NO SIGNAL">NO SIGNAL</strong>
            <span className="signal-subtitle">Destination unavailable</span>
            <div className="signal-bars">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}</div>
            <span className="signal-tear" />
          </div>
          <div className="device-recovery">
            <div className="device-section-heading"><h2 id="lost-device-title">Find your way back</h2><span><i />04 online</span></div>
            <nav className="recovery-sectors" aria-label="Public destinations">
              {SECTORS.map(({ href, label, detail, icon: Icon }) => (
                <a className="recovery-sector arcade-focus" href={href} key={href}>
                  <Icon size={19} aria-hidden="true" /><span><b>{label}</b><small>{detail}</small></span><ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>
          <div className="device-footer" aria-hidden="true"><span>DAI / RECOVERY UNIT</span><span className="device-vents" /></div>
        </section>
      </div>

      <GateFooter note="navigation interrupted // recovery available" />
    </main>
  );
}

/* 403: a clear recovery route beside a sealed access-status terminal. */
function SealedGatePage({ requestedPath }) {
  useGateTitle("403", "restricted sector");
  useGateReturnNote("denied", requestedPath);

  return (
    <main className="gate-page is-sealed">
      <div className="sealed-lockdown-background" aria-hidden="true" />

      <GateTopbar code="403" status="access denied" />

      <div className="sealed-body">
        <section className="sealed-copy" aria-labelledby="sealed-title">
          <p className="sealed-tag"><ShieldX size={16} aria-hidden="true" /> restricted area / keep out</p>
          <div className="gate-code sealed-denied-code" aria-hidden="true">
            <span>403</span>
            <i><Ban size={38} /></i>
          </div>
          <h1 id="sealed-title">Access denied.</h1>
          <p className="sealed-desc">
            This part of the cabinet isn’t open to the public.
            Head back to the arcade. There’s plenty left to explore.
          </p>

          <div className="sealed-actions gate-actions">
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

        <section className="gate-device sealed-device" aria-labelledby="sealed-device-title">
          <div className="device-header"><span><ShieldX size={15} aria-hidden="true" /> Private sector</span><span className="device-status"><i />Locked</span></div>
          <div className="vault-scene" aria-hidden="true">
            <div className="vault-leaf vault-leaf-left" /><div className="vault-leaf vault-leaf-right" />
            <span className="vault-rail vault-rail-top" /><span className="vault-rail vault-rail-bottom" />
            <span className="vault-bolt vault-bolt-left" /><span className="vault-bolt vault-bolt-right" />
            <div className="vault-dial"><span className="vault-dial-ticks" /><span className="vault-emblem"><Lock size={66} strokeWidth={1.5} /></span></div>
            <div className="vault-warning"><Ban size={13} /> KEEP OUT</div>
          </div>
          <div className="vault-verdict">
            <span className="vault-verdict-icon"><ShieldX size={25} aria-hidden="true" /></span>
            <div><h2 id="sealed-device-title">This door stays closed.</h2><p>Public access is not permitted.</p></div>
          </div>
          <div className="sealed-path"><span><Lock size={13} aria-hidden="true" /> Restricted route</span><code>{requestedPath || "/unknown"}</code></div>
          <div className="device-footer" aria-hidden="true"><span>DAI / ACCESS CONTROL</span><span className="device-vents" /></div>
        </section>
      </div>

      <GateFooter note="access denied // return to a public sector" />
    </main>
  );
}

export function SystemGatePage({ requestedPath, variant = "missing" }) {
  if (variant === "denied") return <SealedGatePage requestedPath={requestedPath} />;
  return <LostSectorPage requestedPath={requestedPath} />;
}
