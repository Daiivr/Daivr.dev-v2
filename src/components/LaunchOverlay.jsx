import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

// El mapa de nodos vive aqui y no en el CSS: las trazas SVG y las fichas
// tienen que salir de las mismas coordenadas o la linea apunta a un sitio
// donde no hay nodo.
const phases = [
  {
    label: "mounting cartridges",
    shortLabel: "mount base",
    detail: "Loading profile, routes, XP counter, and arcade canvas.",
    module: "node 01",
    route: "/homebase.jsx",
    x: 50,
    y: 19
  },
  {
    label: "warming CRT phosphors",
    shortLabel: "warm CRT",
    detail: "Bringing scanlines, glow states, and visual telemetry online.",
    module: "node 02",
    route: "/crt-layer.css",
    x: 83,
    y: 33
  },
  {
    label: "syncing Discord queue",
    shortLabel: "sync Discord",
    detail: "Checking presence panel, links, and community status hooks.",
    module: "node 03",
    route: "/discord.sync",
    x: 83,
    y: 67
  },
  {
    label: "compiling Dai.exe",
    shortLabel: "compile app",
    detail: "Running build script and routing project modules to the canvas.",
    module: "node 04",
    route: "/project-console",
    x: 50,
    y: 81
  },
  {
    label: "routing function node",
    shortLabel: "route node",
    detail: "Opening the small utility node that feeds terminal shortcuts.",
    module: "node 05",
    route: "/utility-node",
    x: 17,
    y: 67
  },
  {
    label: "unlocking cabinet mode",
    shortLabel: "unlock mode",
    detail: "Finalizing online state, bonus XP, and terminal commands.",
    module: "node 06",
    route: "/cabinet.online",
    x: 17,
    y: 33
  }
];

// La traza arranca en el borde del nucleo y muere antes de la ficha, si no
// la linea cruza por debajo del texto de ambos.
const CORE_RADIUS = 15;
const NODE_RADIUS = 6;
const traces = phases.map((item) => {
  const dx = item.x - 50;
  const dy = item.y - 50;
  const length = Math.hypot(dx, dy) || 1;
  return {
    module: item.module,
    x1: 50 + (dx / length) * CORE_RADIUS,
    y1: 50 + (dy / length) * CORE_RADIUS,
    x2: item.x - (dx / length) * NODE_RADIUS,
    y2: item.y - (dy / length) * NODE_RADIUS
  };
});

export function LaunchOverlay({ active, closing = false, complete = false, phase }) {
  const currentIndex = Math.max(0, Math.min(phase, phases.length - 1));
  const current = phases[currentIndex];
  const targetProgress = complete ? 100 : active ? Math.min(100, ((currentIndex + 1) / phases.length) * 100) : 0;
  const [displayProgress, setDisplayProgress] = useState(0);
  const progressRef = useRef(0);
  const completedCount = complete ? phases.length : currentIndex + 1;

  useEffect(() => {
    if (!active) {
      progressRef.current = 0;
      setDisplayProgress(0);
      return undefined;
    }

    let frame = 0;
    const start = progressRef.current;
    const delta = targetProgress - start;
    const duration = 820;
    const startedAt = performance.now();

    function tick(now) {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - elapsed) ** 3;
      const next = start + delta * eased;
      progressRef.current = next;
      setDisplayProgress(next);

      if (elapsed < 1) frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, targetProgress]);

  if (!active) return null;

  const progress = displayProgress;
  const bootLines = [
    { key: "run", tone: "command", text: "$ run Dai.exe --boot" },
    ...phases.slice(0, completedCount).map((item, index) => ({
      key: item.module,
      tone: !complete && index === currentIndex ? "active" : "ok",
      typing: !complete && index === currentIndex,
      text: `[${!complete && index === currentIndex ? "run" : " ok"}] ${item.module} ${item.route} :: ${!complete && index === currentIndex ? item.label : "online"}`
    })),
    ...(complete ? [{ key: "online", tone: "online", typing: true, text: "[online] Dai.exe online // all modules loaded" }] : [])
  ];
  const visibleBootLines = bootLines.slice(-4);
  const progressAngle = `${Math.max(3, progress * 3.6)}deg`;

  return (
    <div className={`launch-overlay fixed inset-0 z-60 grid place-items-center bg-ink-950/44 backdrop-blur-[2px] ${closing ? "is-closing" : ""}`}>
      <section className={`launch-card panel-strong ${complete ? "is-complete" : ""} ${closing ? "is-closing" : ""}`} aria-live="polite" role="status">
        {/* Cristal de la cabina: esquinas, barrido y ruido. Van en su propia
            capa para no pelearse con los pseudos de panel-strong. */}
        <span className="launch-card-frame" aria-hidden="true" />
        <span className="launch-card-scan" aria-hidden="true" />

        <header className="launch-header">
          <div className="launch-title">
            <span className="pixel-label">DAI.EXE // COLD START</span>
            <h2 data-text={complete ? "System online" : "Boot sequence"}>{complete ? "System online" : "Boot sequence"}</h2>
            <span className={`launch-state ${complete ? "is-complete" : ""}`}>
              <i aria-hidden="true" />
              {complete ? "all systems nominal" : "linking nodes"}
            </span>
          </div>
          <div className="launch-readout">
            <strong>{Math.round(progress)}%</strong>
            <span>{completedCount.toString().padStart(2, "0")} / {phases.length.toString().padStart(2, "0")} nodes</span>
            {/* Seis pastillas: el estado del mapa entero se lee sin mirar el
                radar ni bajar a la lista. */}
            <div className="launch-pips" aria-hidden="true">
              {phases.map((item, index) => (
                <i
                  className={complete || index < currentIndex ? "is-done" : !complete && index === currentIndex ? "is-active" : ""}
                  key={item.module}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="launch-body">
          <div className="launch-radar" style={{ "--launch-angle": progressAngle }} aria-hidden="true">
            <div className="launch-grid" />
            <div className="launch-bezel" />
            <div className="launch-crosshair"><span /><span /></div>
            <div className="launch-rings"><span /><span /><span /></div>
            <div className="launch-sweep" />

            {/* Las fichas flotaban sueltas sobre los anillos, sin nada que las
                atara al nucleo. Ahora cada una cuelga de su traza, y la del
                nodo en curso lleva los datos corriendo hacia fuera. */}
            <svg className="launch-traces" viewBox="0 0 100 100" preserveAspectRatio="none">
              {traces.map((trace, index) => {
                const done = complete || index < currentIndex;
                const activeNode = !complete && index === currentIndex;
                return (
                  <g className={`launch-trace ${done ? "is-done" : ""} ${activeNode ? "is-active" : ""}`} key={trace.module}>
                    <line className="launch-trace-base" x1={trace.x1} y1={trace.y1} x2={trace.x2} y2={trace.y2} vectorEffect="non-scaling-stroke" />
                    <line className="launch-trace-live" x1={trace.x1} y1={trace.y1} x2={trace.x2} y2={trace.y2} vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
            </svg>

            {phases.map((item, index) => {
              const done = complete || index < currentIndex;
              const activeNode = !complete && index === currentIndex;
              return (
                <div
                  className={`launch-node ${done ? "is-done" : ""} ${activeNode ? "is-active" : ""}`}
                  key={item.module}
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                >
                  <i className="launch-node-led" />
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <small>{done ? "linked" : activeNode ? "sync" : "wait"}</small>
                </div>
              );
            })}

            <div className="launch-core">
              <span>DAI.EXE</span>
              <strong>{complete ? "ONLINE" : `${Math.round(progress)}% SYNC`}</strong>
              <em className="launch-core-bar"><i style={{ width: `${progress}%` }} /></em>
            </div>

            <span className="launch-radar-tag is-tl">sys.map</span>
            <span className="launch-radar-tag is-tr">{phases.length.toString().padStart(2, "0")} nodes</span>
            <span className="launch-radar-tag is-bl">{complete ? "link stable" : `link ${current.module}`}</span>
            <span className="launch-radar-tag is-br">rev 2.4</span>
          </div>

          <div className="launch-panel">
            <div className={`launch-current ${complete ? "is-complete" : ""}`}>
              <span>{complete ? "boot result" : `active process // ${current.module}`}</span>
              <strong>{complete ? "Cabinet ready" : current.label}</strong>
              <p>{complete ? "Every route is mounted and the interactive cabinet is ready." : current.detail}</p>
            </div>

            <ol className="launch-checklist" aria-label="Boot modules">
              {phases.map((item, index) => {
                const done = complete || index < currentIndex;
                const activeNode = !complete && index === currentIndex;
                return (
                  <li className={`${done ? "is-done" : ""} ${activeNode ? "is-active" : ""}`} key={item.module}>
                    <span className="launch-check-icon" aria-hidden="true">
                      {done ? <Check size={13} /> : activeNode ? <LoaderCircle size={13} /> : String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="launch-check-body">
                      <strong>{item.shortLabel}</strong>
                      <small>{item.route}</small>
                    </span>
                    <b>{done ? "OK" : activeNode ? "RUN" : "WAIT"}</b>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <footer className="launch-footer">
          <div className="launch-terminal" aria-hidden="true">
            <div className="launch-terminal-head">
              <span>~/dai.exe/boot.log</span>
              <span>{bootLines.length.toString().padStart(2, "0")} lines</span>
            </div>
            <div className="launch-terminal-body">
              {visibleBootLines.map((line) => (
                <span
                  className={`launch-terminal-line is-${line.tone} ${line.typing ? "is-typing" : ""}`}
                  key={line.key}
                  style={{ "--type-chars": line.text.length }}
                >
                  {line.text}
                </span>
              ))}
            </div>
          </div>

          <div className="launch-footer-status">
            <div className={`launch-progress-dial ${complete ? "is-complete" : ""}`} style={{ "--launch-angle": progressAngle }} aria-hidden="true">
              <span className="launch-progress-value">
                <strong>{Math.round(progress)}</strong>
                <small>%</small>
              </span>
              <span className="launch-progress-state">{complete ? "ready" : "sync"}</span>
            </div>
            <div className="launch-footer-meter">
              <div className="launch-progress" role="progressbar" aria-label="Dai.exe boot progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
                <span style={{ width: `${progress}%` }} />
              </div>
              {/* Esta linea repetia palabra por palabra el detalle que ya esta
                  arriba en el panel. Ahora lleva la telemetria que no cabia en
                  ningun otro sitio. */}
              <dl className="launch-stats">
                <div>
                  <dt>node</dt>
                  <dd>{complete ? "06/06" : `${(currentIndex + 1).toString().padStart(2, "0")}/${phases.length.toString().padStart(2, "0")}`}</dd>
                </div>
                <div>
                  <dt>route</dt>
                  <dd>{complete ? "/cabinet.online" : current.route}</dd>
                </div>
                <div>
                  <dt>state</dt>
                  <dd className={complete ? "is-online" : "is-run"}>{complete ? "online" : "running"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
