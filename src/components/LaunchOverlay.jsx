import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

const phases = [
  {
    label: "mounting cartridges",
    shortLabel: "mount base",
    detail: "Loading profile, routes, XP counter, and arcade canvas.",
    module: "node 01",
    route: "/homebase.jsx"
  },
  {
    label: "warming CRT phosphors",
    shortLabel: "warm CRT",
    detail: "Bringing scanlines, glow states, and visual telemetry online.",
    module: "node 02",
    route: "/crt-layer.css"
  },
  {
    label: "syncing Discord queue",
    shortLabel: "sync Discord",
    detail: "Checking presence panel, links, and community status hooks.",
    module: "node 03",
    route: "/discord.sync"
  },
  {
    label: "compiling Dai.exe",
    shortLabel: "compile app",
    detail: "Running build script and routing project modules to the canvas.",
    module: "node 04",
    route: "/project-console"
  },
  {
    label: "routing function node",
    shortLabel: "route node",
    detail: "Opening the small utility node that feeds terminal shortcuts.",
    module: "node 05",
    route: "/utility-node"
  },
  {
    label: "unlocking cabinet mode",
    shortLabel: "unlock mode",
    detail: "Finalizing online state, bonus XP, and terminal commands.",
    module: "node 06",
    route: "/cabinet.online"
  }
];

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
  const visibleBootLines = bootLines.slice(-3);
  const progressAngle = `${Math.max(3, progress * 3.6)}deg`;

  return (
    <div className={`launch-overlay fixed inset-0 z-60 grid place-items-center bg-ink-950/44 backdrop-blur-[2px] ${closing ? "is-closing" : ""}`}>
      <section className={`launch-card panel-strong ${complete ? "is-complete" : ""} ${closing ? "is-closing" : ""}`} aria-live="polite" role="status">
        <header className="launch-header">
          <div>
            <span className="pixel-label">DAI.EXE // COLD START</span>
            <h2>{complete ? "System online" : "Boot sequence"}</h2>
          </div>
          <div className="launch-readout">
            <strong>{Math.round(progress)}%</strong>
            <span>{completedCount.toString().padStart(2, "0")} / {phases.length.toString().padStart(2, "0")} nodes</span>
          </div>
        </header>

        <div className="launch-body">
          <div className="launch-radar" style={{ "--launch-angle": progressAngle }} aria-hidden="true">
            <div className="launch-grid" />
            <div className="launch-rings"><span /><span /><span /></div>
            <div className="launch-sweep" />
            {phases.map((item, index) => {
              const done = complete || index < currentIndex;
              const activeNode = !complete && index === currentIndex;
              return (
                <div className={`launch-node is-node-${index + 1} ${done ? "is-done" : ""} ${activeNode ? "is-active" : ""}`} key={item.module}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <small>{done ? "linked" : activeNode ? "sync" : "wait"}</small>
                </div>
              );
            })}
            <div className="launch-core">
              <span>DAI.EXE</span>
              <strong>{complete ? "ONLINE" : `${Math.round(progress)}% SYNC`}</strong>
            </div>
          </div>

          <div className="launch-panel">
            <div className="launch-current">
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
                    <span>
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

          <div className="launch-footer-status">
            <div className={`launch-progress-dial ${complete ? "is-complete" : ""}`} style={{ "--launch-angle": progressAngle }} aria-hidden="true">
              <span className="launch-progress-value">
                <strong>{Math.round(progress)}</strong>
                <small>%</small>
              </span>
              <span className="launch-progress-state">{complete ? "ready" : "sync"}</span>
            </div>
            <div>
              <div className="launch-progress" role="progressbar" aria-label="Dai.exe boot progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>{complete ? "Cabinet online. Terminal commands armed." : `${current.module} ${current.route} // ${current.detail}`}</p>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
