import { Activity, Cpu, Grip, Play, RadioTower, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { profile } from "../data/site";
import { useElasticDrag } from "../hooks/useElasticDrag";
import { ArcadeButton } from "./ui/ArcadeButton";
import { ArcadeCanvas } from "./ArcadeCanvas";

// Mismos seis nodos (y mismo orden) que dibuja el lienzo vectorial, para que
// el checklist de arranque y la escena no cuenten cosas distintas.
const BOOT_NODES = [
  { glyph: "{}", label: "syntax" },
  { glyph: "++", label: "build" },
  { glyph: "AI", label: "agents" },
  { glyph: "$", label: "shell" },
  { glyph: "dx", label: "tooling" },
  { glyph: "fn", label: "runtime" }
];

const BOOT_SCRIPT = [
  { arg: "Dai", name: "player", type: "assign" },
  { arg: "discord-bots", name: "load", type: "call" },
  { arg: "sysbot-tools", name: "sync", type: "call" },
  { arg: "game-night-ui", name: "queue", type: "call" },
  { arg: "personal-site", name: "render", type: "call" }
];

// La cinta del bay secreto: sectores que se van bloqueando durante el escaneo.
const SECRET_SECTORS = ["0xDA1", "CRT-A", "1997", "SECTOR-07", "NODE-06", "DAI-CORE"];

// Altura fija del log en filas. La caja mide exactamente esto en CSS.
const BUILD_LOG_ROWS = 4;

// El log salia como cuatro frases planas del mismo verde. Partirlo en glifo,
// cuerpo y comentario deja leer de un vistazo cual linea es una orden, cual un
// nodo que ya entro y cual sigue esperando.
function readBuildLine(line) {
  const [head, ...rest] = line.split("//");
  const note = rest.join("//").trim();
  const body = head.trim();

  if (body.startsWith("$")) return { tone: "cmd", glyph: "$", body: body.replace(/^\$\s*/, ""), note };
  if (/online/i.test(body)) return { tone: "ok", glyph: "ok", body, note };
  if (/offline|waiting|idle/i.test(body)) return { tone: "idle", glyph: "··", body, note };
  return { tone: "run", glyph: ">", body, note };
}

export function HeroStation({ buildLog, hasRun, isLaunching, launchPhase, onRun, onOpenTerminal }) {
  const stationRef = useRef(null);
  const { handleProps, isDragging, targetRef } = useElasticDrag({ scopeRef: stationRef });
  const [hasSecretArmed, setHasSecretArmed] = useState(false);
  // El panel crecia y encogia con cada linea del arranque. La ventana es ahora
  // fija de cuatro filas, ancladas abajo: lo viejo se sale por el borde
  // superior y la caja no se mueve nunca.
  const visibleBuildLog = buildLog.split("\n").slice(-BUILD_LOG_ROWS);
  const progress = isLaunching ? Math.min(100, ((launchPhase + 1) / 6) * 100) : 0;
  const progressWidth = isLaunching ? progress : hasRun ? 100 : 0;
  const activeCodeLine = hasRun ? 4 : isLaunching ? Math.min(4, launchPhase) : 0;
  const onlineNodes = hasRun ? 6 : isLaunching ? Math.min(6, launchPhase + 1) : 0;
  const systemState = isLaunching ? "booting" : hasRun ? "online" : "offline";
  const signalState = hasRun || isLaunching ? "signal hot" : "signal cold";
  const heroChips = hasRun
    ? ["queue online", "bot signal hot", "canvas live"]
    : isLaunching
      ? ["nodes waking", "boot signal", "sync pending"]
      : ["queue offline", "nodes asleep", "canvas idle"];

  useEffect(() => {
    if (isDragging) {
      setHasSecretArmed(true);
      return;
    }

    window.dispatchEvent(new CustomEvent("random-glitch-clear-scope", {
      detail: { scope: "console-secret-bay" }
    }));
  }, [isDragging]);

  return (
    <section
      className={`hero-station relative grid min-h-[min(820px,calc(100svh-68px))] items-center gap-6 py-10 lg:grid-cols-[minmax(0,.82fr)_minmax(380px,1.05fr)] ${isDragging ? "is-console-dragging" : ""} ${hasSecretArmed ? "is-secret-armed" : ""}`}
      id="home"
      ref={stationRef}
    >
      <div className="hero-copy relative grid gap-5">
        <p className="pixel-label text-cyan-arcade">{profile.eyebrow}</p>
        <h1 className="max-w-[11.2ch] font-display text-[clamp(2.35rem,5vw,4.9rem)] font-black uppercase leading-[.94] text-white text-balance">
          {profile.headline}
        </h1>
        <p className="max-w-2xl text-base leading-8 text-phosphor-soft md:text-lg">{profile.lede}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {heroChips.map((item) => (
            <span className="status-chip" key={item}>{item}</span>
          ))}
        </div>
        <div className="hero-actions flex flex-wrap gap-3">
          <ArcadeButton
            aria-label={hasRun ? "Dai.exe is already online" : isLaunching ? "Dai.exe is starting" : "Run Dai.exe"}
            disabled={hasRun || isLaunching}
            variant="primary"
            onClick={onRun}
            data-run-build
          >
            <Play size={18} aria-hidden="true" />
            {isLaunching ? "Running..." : hasRun ? "Dai.exe Online" : "Run Dai.exe"}
          </ArcadeButton>
          <ArcadeButton onClick={onOpenTerminal} data-open-dock>
            <Terminal size={18} aria-hidden="true" />
            Terminal
          </ArcadeButton>
        </div>
      </div>

      <div className="hero-console-dock">
        <div
          className="console-secret-bay"
          aria-hidden="true"
          {...(!isDragging ? { "data-no-random-glitch": true } : {})}
        >
          <span className="secret-bay-corner secret-bay-corner-tl" />
          <span className="secret-bay-corner secret-bay-corner-tr" />
          <span className="secret-bay-corner secret-bay-corner-bl" />
          <span className="secret-bay-corner secret-bay-corner-br" />
          <div className="secret-bay-sweeps">
            <span />
            <span />
          </div>
          <div className="secret-bay-orbit">
            <span />
            <span />
            <span />
          </div>
          <div className="secret-bay-core">
            {/* El nucleo era un rectangulo negro flotando en medio de la nada.
                Con chapa arriba lee como la ventana restringida que dice ser. */}
            <span className="secret-bay-tab">dev-room.sys // restricted</span>
            <span className="secret-bay-badge">subroutine unlocked</span>
            <strong>DEV ROOM // 1997</strong>
            <code>&gt; drag_window.unlock("dai-core")</code>
            <div className="secret-bay-meter">
              <i />
              <span>ACCESS DENIED // NOT ALLOWED HERE</span>
            </div>
          </div>
          <div className="secret-bay-scan">
            <span className="secret-bay-scan-label">sector sweep</span>
            <div className="secret-bay-scan-track">
              {SECRET_SECTORS.map((sector, index) => (
                <b key={sector} style={{ "--sector-delay": `${0.5 + index * 0.85}s` }}>{sector}</b>
              ))}
            </div>
          </div>

          <div className="secret-bay-lines">
            {["save slot found", "coffee_level: critical", "arcade build: ok", "keep exploring"].map((line, index) => (
              <span key={line} style={{ "--line-delay": `${0.8 + index * 1.4}s` }}>
                <b>{String(index + 1).padStart(2, "0")}</b> {line}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`hero-console panel-strong relative overflow-hidden ${isLaunching ? "launching-panel" : ""} ${isDragging ? "is-dragging" : ""}`}
          ref={targetRef}
        >
          <div
            className="hero-console-handle relative z-10"
            {...handleProps}
          >
            <div className="hero-console-file">
              <div className="hero-console-window-lights" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="hero-console-window-id">WS-01</span>
              <code>~/daivr/homebase.jsx</code>
            </div>

            <span className="hero-console-drag-hint" aria-hidden="true">
              <Grip size={13} />
              drag panel
            </span>

            <div className="hero-console-state">
              <span className="is-signal">
                <RadioTower size={12} aria-hidden="true" />
                {signalState}
              </span>
              <span className={`is-system is-${systemState}`} data-system-state>
                <i aria-hidden="true" />
                {systemState}
              </span>
            </div>
          </div>

          <div className="hero-console-content relative z-10 grid">
            <div className="console-left border-b border-phosphor/20 p-4 md:p-5 lg:border-b-0 lg:border-r">
              <div className="code-card border border-phosphor/18 bg-ink-950/62">
                <div className="flex items-center justify-between gap-3 border-b border-phosphor/15 px-3 py-2">
                  <div>
                    <p className="pixel-label text-phosphor-soft/70">SOURCE // BOOT SCRIPT</p>
                    <small className="hero-panel-file">homebase.jsx</small>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[0.66rem] font-black uppercase text-cabinet">
                    <Cpu size={12} aria-hidden="true" />
                    ln {activeCodeLine + 1}:05
                  </span>
                </div>
                <ol className="code-lines">
                  {BOOT_SCRIPT.map((line, index) => (
                    <li className={index === activeCodeLine ? "is-active" : ""} key={line.name}>
                      <span className="select-none text-right text-phosphor-soft/30">{index + 1}</span>
                      <code className="min-w-0 break-words">
                        {line.type === "assign" ? (
                          <>
                            <span className="text-cyan-arcade">const</span>{" "}
                            <span className="text-phosphor-soft">{line.name}</span>{" "}
                            <span className="text-glitch">=</span>{" "}
                            <span className="text-cabinet">&quot;{line.arg}&quot;</span>
                            <span className="code-punct">;</span>
                          </>
                        ) : (
                          <>
                            <span className="text-cyan-arcade">{line.name}</span>
                            <span className="code-punct">(</span>
                            <span className="text-cabinet">&quot;{line.arg}&quot;</span>
                            <span className="code-punct">);</span>
                          </>
                        )}
                        {/* La linea activa solo se marcaba con un borde a la
                            izquierda; el cursor dice cual se esta ejecutando. */}
                        {index === activeCodeLine ? <span className="code-caret" aria-hidden="true" /> : null}
                      </code>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="build-output-panel border border-phosphor/18 bg-ink-950/70">
                <div className="flex items-center justify-between gap-3 border-b border-phosphor/15 px-3 py-2">
                  <div>
                    <p className="pixel-label">RUNTIME // BUILD OUTPUT</p>
                    <small className="hero-panel-file">dai.boot.log</small>
                  </div>
                  <span className={`hero-build-state is-${systemState}`}>{isLaunching ? `${Math.round(progressWidth)}%` : systemState}</span>
                </div>
                <pre className="terminal-screen build-output-screen overflow-hidden p-3 text-[0.74rem] leading-6 text-phosphor" data-build-output>
                  {visibleBuildLog.map((line, index) => {
                    const entry = readBuildLine(line);
                    return (
                      <code className={`build-output-line is-${entry.tone}`} key={index}>
                        <b aria-hidden="true">{entry.glyph}</b>
                        <span>
                          {entry.body}
                          {entry.note ? <i> // {entry.note}</i> : null}
                          {index === visibleBuildLog.length - 1 ? <span className="build-output-caret" aria-hidden="true" /> : null}
                        </span>
                      </code>
                    );
                  })}
                </pre>

                <div className="build-node-rail" aria-label={`Nodos en linea: ${onlineNodes} de ${BOOT_NODES.length}`}>
                  {BOOT_NODES.map((node, index) => (
                    <span className={`build-node ${index < onlineNodes ? "is-online" : ""}`} key={node.glyph}>
                      <b>{node.glyph}</b>
                      <i>{node.label}</i>
                      <em>{index < onlineNodes ? "on" : "off"}</em>
                    </span>
                  ))}
                </div>
                {/* La barra era un degradado liso de 12px; en una cabina la carga
                    se cuenta por bloques encendidos, y el numero al lado ahorra
                    tener que medirla a ojo. */}
                <div className="build-progress-row">
                  <div
                    className="build-progress"
                    role="progressbar"
                    aria-label="Boot progress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={Math.round(progressWidth)}
                  >
                    <span style={{ width: `${progressWidth}%` }} />
                  </div>
                  <b>{Math.round(progressWidth)}%</b>
                </div>
              </div>
            </div>

            <div className="hero-canvas-stage relative min-h-[360px] overflow-hidden bg-ink-950/85">
              <ArcadeCanvas hasRun={hasRun} isLaunching={isLaunching} launchPhase={launchPhase} onRun={onRun} />
              <div className="hero-canvas-hud pointer-events-none absolute">
                <span>VECTOR CANVAS // 01</span>
                <strong>{hasRun ? "LIVE FEED" : isLaunching ? "LINKING" : "STANDBY"}</strong>
                <small>{hasRun ? "room.render stable" : isLaunching ? `mounting node ${String(onlineNodes).padStart(2, "0")}` : "waiting for boot signal"}</small>
              </div>
              <div className="canvas-node-badge pointer-events-none absolute border border-phosphor/25 bg-ink-950/75 px-3 py-2 text-right">
                <p className="pixel-label text-[0.64rem]">PRIMARY NODE</p>
                <strong className="font-display text-lg leading-none text-white">DAI.EXE</strong>
                <small>{systemState} // {String(onlineNodes).padStart(2, "0")}/06</small>
              </div>
            </div>
          </div>

          {/* Etiqueta y valor iban del mismo gris apagado, asi que la barra se
              leia como una sola tira de texto. El valor ahora es el que brilla. */}
          <div className={`hero-console-telemetry relative z-10 is-${systemState}`} aria-label="Workstation telemetry">
            <span><b>SESSION</b> <i>{hasRun ? "STABLE" : isLaunching ? "BOOTING" : "STANDBY"}</i></span>
            <span><b>NODES</b> <i>{String(onlineNodes).padStart(2, "0")}/06</i></span>
            <span><b>ROUTE</b> <i>/HOME</i></span>
            <strong><Activity size={12} aria-hidden="true" /> {signalState}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
