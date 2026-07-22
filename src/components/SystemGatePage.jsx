import { ArrowLeft, Home, LockKeyhole, Radar, ShieldAlert, Terminal, WifiOff } from "lucide-react";
import { useEffect, useMemo } from "react";

const PAGE_CONFIG = {
  missing: {
    code: "404",
    eyebrow: "NAVIGATION FAULT",
    title: "You drifted off the map.",
    description: "No cartridge lives at this coordinate. The cabinet is sweeping nearby sectors, but this route has no signal, save slot, or recoverable node.",
    command: "$ sweep --lost-sector",
    file: "lost-sector.map",
    mode: "SECTOR UNMAPPED",
    footer: "SEARCH BEACON // ACTIVE",
    status: [
      ["route.map", "not found"],
      ["signal.bus", "disconnected"],
      ["fallback", "armed"]
    ],
    Icon: WifiOff
  },
  denied: {
    code: "403",
    eyebrow: "SECURITY LOCKDOWN",
    title: "Clearance rejected.",
    description: "The cabinet recognizes your session, but this archive is sealed above your access tier. The route has been quarantined and no protected data was exposed.",
    command: "$ auth --challenge",
    file: "quarantine.lock",
    mode: "AUTH GATE SEALED",
    footer: "SECURITY BUS // HOLDING",
    status: [
      ["identity", "recognized"],
      ["clearance", "insufficient"],
      ["data.lock", "engaged"]
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
  const traceId = useMemo(() => Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, "0"), []);
  const routeCoordinates = useMemo(() => getRouteCoordinates(requestedPath), [requestedPath]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${config.code} // ${config.eyebrow} · daivr.dev`;
    return () => {
      document.title = previousTitle;
    };
  }, [config.code, config.eyebrow]);

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/");
  }

  return (
    <main className={`system-gate-page is-${variant}`}>
      <div className="system-gate-grid" aria-hidden="true" />
      <div className="system-gate-glow" aria-hidden="true" />
      <div className="system-gate-scanline" aria-hidden="true" />
      <div className="system-gate-noise" aria-hidden="true" />
      <div className="system-gate-personality" aria-hidden="true">
        {variant === "missing" ? (
          <>
            <span>SECTOR_??</span><span>0xVOID</span><span>PACKET LOST</span><span>NO CART</span>
          </>
        ) : (
          <><span>RESTRICTED</span><i /><i /><i /><i /></>
        )}
      </div>

      <header className="system-gate-header">
        <a className="system-gate-brand arcade-focus" href="/" aria-label="Return to daivr.dev">
          <span>DV</span>
          <strong>daivr.dev</strong>
          <small>ARCADE RECOVERY SYSTEM</small>
        </a>
        <div className="system-gate-header-status" aria-label={`${config.code} system status`}>
          <span><i /> cabinet online</span>
          <strong>ERR_{config.code}</strong>
        </div>
      </header>

      <section className="system-gate-shell" aria-labelledby="system-gate-title">
        <div className="system-gate-shellbar">
          <span className="system-gate-lights" aria-hidden="true"><i /><i /><i /></span>
          <code>~/daivr/recovery/{config.file}</code>
          <span>TRACE_{traceId}</span>
        </div>

        <div className="system-gate-content">
          <div className="system-gate-copy">
            <p className="system-gate-eyebrow"><ShieldAlert size={14} aria-hidden="true" /> {config.eyebrow}</p>
            <div className="system-gate-code" data-code={config.code}>{config.code}</div>
            <h1 id="system-gate-title">{config.title}</h1>
            <p className="system-gate-description">{config.description}</p>

            <div className="system-gate-path">
              <Terminal size={15} aria-hidden="true" />
              <span>{config.command}</span>
              <code>{requestedPath || "/unknown"}</code>
            </div>

            <div className="system-gate-actions">
              <a className="system-gate-action is-primary arcade-focus" href="/">
                <Home size={16} aria-hidden="true" /> Return home
              </a>
              <button className="system-gate-action arcade-focus" type="button" onClick={goBack}>
                <ArrowLeft size={16} aria-hidden="true" /> Previous screen
              </button>
            </div>
          </div>

          <aside className="system-gate-diagnostic" aria-label="Route diagnostic">
            <div className="system-gate-radar" aria-hidden="true">
              <span className="system-gate-radar-ring is-outer" />
              <span className="system-gate-radar-ring is-inner" />
              <span className="system-gate-radar-sweep" />
              <span className="system-gate-radar-core"><Icon size={39} /></span>
              <span className="system-gate-radar-ping" />
              {variant === "missing" ? (
                <span className="system-gate-orbit" aria-hidden="true"><i /><i /><i /></span>
              ) : (
                <span className="system-gate-lock-brackets" aria-hidden="true"><i /><i /><i /><i /></span>
              )}
            </div>

            <div className="system-gate-diagnostic-title">
              <span><Radar size={14} aria-hidden="true" /> diagnostic.stream</span>
              <strong>{config.mode}</strong>
            </div>

            <dl className="system-gate-status-list">
              {config.status.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {variant === "missing" ? (
              <div className="system-gate-coordinates" aria-hidden="true">
                <span>X: {routeCoordinates.x}</span><span>Y: {routeCoordinates.y}</span><span>Z: {routeCoordinates.z}</span>
              </div>
            ) : (
              <div className="system-gate-clearance" aria-label="Clearance check failed">
                <span>clearance handshake</span>
                <div aria-hidden="true"><i /><i /><i /><i /><i /></div>
                <strong>01 / 05</strong>
              </div>
            )}

            <div className="system-gate-wave" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
            </div>
          </aside>
        </div>

        <footer className="system-gate-footer">
          <span>{config.footer}</span>
          <span>DAI.EXE · {new Date().getFullYear()}</span>
        </footer>
      </section>
    </main>
  );
}
