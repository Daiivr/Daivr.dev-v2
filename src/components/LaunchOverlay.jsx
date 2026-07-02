import { useEffect, useRef, useState } from "react";

const phases = [
  {
    label: "mounting cartridges",
    detail: "Loading profile, routes, XP counter, and arcade canvas.",
    module: "node 01",
    route: "/homebase.jsx"
  },
  {
    label: "warming CRT phosphors",
    detail: "Bringing scanlines, glow states, and visual telemetry online.",
    module: "node 02",
    route: "/crt-layer.css"
  },
  {
    label: "syncing Discord queue",
    detail: "Checking presence panel, links, and community status hooks.",
    module: "node 03",
    route: "/discord.sync"
  },
  {
    label: "compiling Dai.exe",
    detail: "Running build script and routing project modules to the canvas.",
    module: "node 04",
    route: "/project-console"
  },
  {
    label: "routing function node",
    detail: "Opening the small utility node that feeds terminal shortcuts.",
    module: "node 05",
    route: "/utility-node"
  },
  {
    label: "unlocking cabinet mode",
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

  return (
    <div className={`launch-overlay fixed inset-0 z-60 grid place-items-center bg-ink-950/44 backdrop-blur-[2px] ${closing ? "is-closing" : ""}`}>
      <section className={`launch-boot-card panel-strong ${complete ? "is-complete" : ""} ${closing ? "is-closing" : ""}`} aria-live="polite" role="status">
        <header className="launch-boot-header">
          <div>
            <span className="pixel-label">RUN DAI.EXE</span>
            <h2>Boot console</h2>
          </div>
          <div className="launch-boot-readout">
            <strong>{Math.round(progress)}%</strong>
            <span>{completedCount}/{phases.length} modules</span>
          </div>
        </header>

        <div className="launch-boot-terminal">
          {bootLines.map((line, index) => (
            <span
              className={`launch-terminal-line is-${line.tone} ${line.typing ? "is-typing" : ""}`}
              key={line.key}
              style={{
                "--type-chars": line.text.length
              }}
            >
              {line.text}
            </span>
          ))}
        </div>

        <footer className="launch-boot-footer">
          <div className="launch-boot-current">
            <span>{complete ? "status" : "current module"}</span>
            <strong>{complete ? "Dai.exe online" : `${current.module} / ${current.route}`}</strong>
          </div>
          <div>
            <div className="launch-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{complete ? "Cabinet online. Terminal commands armed." : current.detail}</p>
          </div>
        </footer>
      </section>
    </div>
  );
}
