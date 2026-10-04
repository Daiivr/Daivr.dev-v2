import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { bootNodes } from "../data/site";

// Cada nodo que entra deja un digito de la combinacion de la boveda, y la
// linea final los junta. Seis nodos, seis digitos: no hay que repartir nada a
// mano, el indice del modulo es el indice del digito.
//
// Deliberadamente fuera del patch.log: el aliciente es dar con esto arrancando
// Dai.exe y mirando el registro, y una nota de version lo regalaria.
const VAULT_SHARDS = "071990";

// El mapa de nodos vive aqui y no en el CSS: las trazas SVG y las fichas
// tienen que salir de las mismas coordenadas o la linea apunta a un sitio
// donde no hay nodo. Son las seis direcciones del lienzo del panel (desde las
// 12, en sentido horario), asi que el radar es literalmente el mismo mapa.
const NODE_SPOTS = [
  [50, 17],
  [82, 33],
  [82, 67],
  [50, 83],
  [18, 67],
  [18, 33]
];

const phases = bootNodes.map((node, index) => ({
  ...node,
  module: `node ${String(index + 1).padStart(2, "0")}`,
  x: NODE_SPOTS[index][0],
  y: NODE_SPOTS[index][1]
}));

const pad = (value) => String(value).padStart(2, "0");

// La traza arranca en el borde del nucleo y muere antes de la ficha, si no
// la linea cruza por debajo del texto de ambos.
const CORE_RADIUS = 15;
const NODE_RADIUS = 7;
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
  const linkedCount = complete ? phases.length : currentIndex;

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
  // El log iba como una sola cadena por linea; partido en etiqueta, ruta,
  // mensaje y fragmento de clave, cada parte lleva su color y la clave de la
  // boveda se distingue del resto sin regalarla.
  const bootLines = [
    { key: "run", tone: "command", tag: "$", body: "run Dai.exe --boot" },
    ...phases.slice(0, complete ? phases.length : currentIndex + 1).map((item, index) => {
      const running = !complete && index === currentIndex;
      return {
        key: item.module,
        tone: running ? "active" : "ok",
        typing: running,
        tag: running ? "run" : "ok",
        body: `${item.module} ${item.route}`,
        note: running ? item.task : "online",
        // El fragmento solo aparece cuando el nodo ya esta arriba: mientras
        // arranca no ha soltado nada todavia.
        shard: running ? "" : `key ${VAULT_SHARDS[index] ?? ""}`
      };
    }),
    ...(complete
      ? [{ key: "online", tone: "online", typing: true, tag: "done", body: "Dai.exe online", note: "all modules loaded", shard: `key ${VAULT_SHARDS}` }]
      : [])
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

        {/* Un solo porcentaje, aqui. Antes salia tres veces (cabecera, nucleo
            del radar y un dial en el pie) mas dos barras. */}
        <header className="launch-header">
          <div className="launch-title">
            <span className="pixel-label">DAI.EXE // COLD START</span>
            <h2 data-text={complete ? "System online" : "Boot sequence"}>{complete ? "System online" : "Boot sequence"}</h2>
          </div>
          <div className="launch-readout">
            <strong>
              {Math.round(progress)}
              <small>%</small>
            </strong>
            <span>
              <b>{pad(linkedCount)}/{pad(phases.length)}</b> {complete ? "online" : "linked"}
            </span>
          </div>
        </header>

        <div className="launch-body">
          <div className="launch-radar" style={{ "--launch-angle": progressAngle }} aria-hidden="true">
            <div className="launch-grid" />
            <div className="launch-bezel" />
            <div className="launch-crosshair"><span /><span /></div>
            <div className="launch-rings"><span /><span /><span /></div>
            <div className="launch-sweep" />

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

            {/* Las fichas decian "01 / wait": ahora llevan el glifo y el nombre
                del nodo, igual que en el lienzo del panel. */}
            {phases.map((item, index) => {
              const done = complete || index < currentIndex;
              const activeNode = !complete && index === currentIndex;
              return (
                <div
                  className={`launch-node ${done ? "is-done" : ""} ${activeNode ? "is-active" : ""}`}
                  key={item.module}
                  style={{ left: `${item.x}%`, top: `${item.y}%`, "--node-color": item.color }}
                >
                  <i className="launch-node-led" />
                  <b>{item.glyph}</b>
                  <small>{item.name}</small>
                </div>
              );
            })}

            <div className="launch-core">
              <span>DAI.EXE</span>
              <strong>{complete ? "ONLINE" : "LINKING"}</strong>
              <small>{complete ? "6 nodes green" : `${current.glyph} ${current.name}`}</small>
            </div>

            <span className="launch-radar-tag is-tl">sys.map</span>
            <span className="launch-radar-tag is-br">rev 2.62</span>
          </div>

          <div className="launch-panel">
            <div className={`launch-current ${complete ? "is-complete" : ""}`} style={{ "--node-color": complete ? "var(--color-phosphor)" : current.color }}>
              <span className="launch-current-tag">{complete ? "boot result" : `now running // ${current.module}`}</span>
              <strong>{complete ? "Cabinet ready" : current.task}</strong>
              <b className="launch-current-glyph" aria-hidden="true">{complete ? "OK" : current.glyph}</b>
              <p>{complete ? "Every node is linked and the cabinet is live. Try clicking the canvas." : current.detail}</p>
              {/* Barra propia del nodo en curso: se rellena en lo que dura su
                  fase y vuelve a empezar con el siguiente (la key la reinicia). */}
              {complete ? null : <em className="launch-current-bar" aria-hidden="true"><i key={current.module} /></em>}
            </div>

            <ol className="launch-checklist" aria-label="Boot modules">
              {phases.map((item, index) => {
                const done = complete || index < currentIndex;
                const activeNode = !complete && index === currentIndex;
                return (
                  <li
                    className={`${done ? "is-done" : ""} ${activeNode ? "is-active" : ""}`}
                    key={item.module}
                    style={{ "--node-color": item.color }}
                  >
                    <span className="launch-check-icon" aria-hidden="true">
                      {done ? <Check size={13} /> : activeNode ? <LoaderCircle size={13} /> : pad(index + 1)}
                    </span>
                    <b className="launch-check-glyph" aria-hidden="true">{item.glyph}</b>
                    <strong className="launch-check-name">{item.name}</strong>
                    <small>{item.route}</small>
                    <em>{done ? "ok" : activeNode ? "run" : "wait"}</em>
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
              <span>{pad(bootLines.length)} lines</span>
            </div>
            <div className="launch-terminal-body">
              {visibleBootLines.map((line) => {
                const chars = [line.tag, line.body, line.note, line.shard].filter(Boolean).join("  ").length;
                return (
                  <span
                    className={`launch-terminal-line is-${line.tone} ${line.typing ? "is-typing" : ""}`}
                    key={line.key}
                    style={{ "--type-chars": chars }}
                  >
                    <b>{line.tag}</b>
                    <span>{line.body}</span>
                    {line.note ? <i>{line.note}</i> : null}
                    {line.shard ? <em>{line.shard}</em> : null}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Una barra, partida en seis tramos: cada muesca es un nodo. */}
          <div
            className={`launch-progress ${complete ? "is-complete" : ""}`}
            role="progressbar"
            aria-label="Dai.exe boot progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress)}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </footer>
      </section>
    </div>
  );
}
