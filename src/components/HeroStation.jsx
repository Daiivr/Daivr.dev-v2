import { ArrowDownRight, Cpu, Grip, Play, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bootNodes, profile, projects } from "../data/site";
import { projectStories } from "../data/projectStories";
import { useElasticDrag } from "../hooks/useElasticDrag";
import { reopenSameHash } from "../lib/hashLinks";
import { ArcadeButton } from "./ui/ArcadeButton";
import { ArcadeCanvas } from "./ArcadeCanvas";
import { DevRoomVault } from "./DevRoomVault";

// Los cartuchos de Carts, en corto: numero, nombre, que son y su version.
// El enlace usa el mismo #project-<slug> que abre la ficha en Carts.
const HERO_CARTS = projects
  .map((project) => ({
    title: project.title,
    number: project.kicker,
    badge: project.badge,
    slug: projectStories[project.title]?.slug,
    kind: (projectStories[project.title]?.eyebrow ?? project.meta).toLowerCase()
  }))
  .filter((cart) => cart.slug);

const BOOT_SCRIPT = [
  { arg: "Dai", name: "player", type: "assign" },
  { arg: "discord-bots", name: "load", type: "call" },
  { arg: "sysbot-tools", name: "sync", type: "call" },
  { arg: "game-night-ui", name: "queue", type: "call" },
  { arg: "personal-site", name: "render", type: "call" }
];

// Radio de enganche de la chincheta, en px. Una sola fuente: el hook decide
// con el, y el aro lo dibuja a tamano real, para que lo que se ve sea
// exactamente lo que engancha.
const HANG_RADIUS = 54;

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

function formatUptime(seconds) {
  return [seconds / 3600, (seconds % 3600) / 60, seconds % 60]
    .map((value) => String(Math.floor(value)).padStart(2, "0"))
    .join(":");
}

// Reloj de sesion: cuenta desde que Dai.exe entra en linea. Sustituye al
// "signal cold/hot" del pie, que repetia el estado de la barra de titulo.
// Va en su propio componente para que el tic de cada segundo no repinte el
// panel entero (con el lienzo y la boveda dentro).
function SessionUptime({ online }) {
  const [elapsed, setElapsed] = useState(-1);

  useEffect(() => {
    if (!online) {
      setElapsed(-1);
      return undefined;
    }

    const startedAt = Date.now();
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [online]);

  return (
    <strong className={online ? "is-live" : ""}>
      <b>UPTIME</b> <i>{elapsed < 0 ? "--:--:--" : formatUptime(elapsed)}</i>
    </strong>
  );
}

export function HeroStation({ buildLog, hasRun, isLaunching, launchPhase, onRun, onOpenTerminal }) {
  const stationRef = useRef(null);
  const nailRef = useRef(null);
  const { handleProps, hangArmed, hangLanded, isDragging, isHung, targetRef } = useElasticDrag({
    hangRef: nailRef,
    hangRadius: HANG_RADIUS,
    scopeRef: stationRef
  });
  const [hasSecretArmed, setHasSecretArmed] = useState(false);
  // El panel crecia y encogia con cada linea del arranque. La ventana es ahora
  // fija de cuatro filas, ancladas abajo: lo viejo se sale por el borde
  // superior y la caja no se mueve nunca.
  const buildLines = buildLog.split("\n");
  const visibleBuildLog = buildLines.slice(-BUILD_LOG_ROWS);
  const progress = isLaunching ? Math.min(100, ((launchPhase + 1) / 6) * 100) : 0;
  const progressWidth = isLaunching ? progress : hasRun ? 100 : 0;
  const activeCodeLine = hasRun ? 4 : isLaunching ? Math.min(4, launchPhase) : 0;
  const onlineNodes = hasRun ? 6 : isLaunching ? Math.min(6, launchPhase + 1) : 0;
  const systemState = isLaunching ? "booting" : hasRun ? "online" : "offline";
  const linkingNode = bootNodes[Math.min(bootNodes.length - 1, Math.max(0, onlineNodes - 1))];
  const nodeCount = `${String(onlineNodes).padStart(2, "0")}/${String(bootNodes.length).padStart(2, "0")}`;
  useEffect(() => {
    if (isDragging || isHung) {
      setHasSecretArmed(true);
      return;
    }

    window.dispatchEvent(new CustomEvent("random-glitch-clear-scope", {
      detail: { scope: "console-secret-bay" }
    }));
  }, [isDragging, isHung]);

  return (
    <section
      className={`hero-station relative grid items-center ${isDragging ? "is-console-dragging" : ""} ${isHung ? "is-console-hung" : ""} ${hangLanded ? "is-hang-landing" : ""} ${hangArmed ? "is-hang-armed" : ""} ${hasSecretArmed ? "is-secret-armed" : ""}`}
      id="home"
      ref={stationRef}
    >
      {/* El clavo de la pared: solo se cuelga arrastrando el panel hasta aqui.
          Es un blanco de soltado, no un control, asi que no responde al clic
          y no entra en el orden de tabulacion. Para descolgarlo se vuelve a
          arrastrar el panel fuera del clavo. */}
      <span className="hero-nail" ref={nailRef} aria-hidden="true" style={{ "--hang-radius": `${HANG_RADIUS}px` }}>
        <span className="hero-nail-head" />
        <span className="hero-nail-shadow" />
        <span className="hero-nail-ring" />
        <span className="hero-nail-shock" />
        <span className="hero-nail-hint">{isHung ? "drag off to unhook" : "hang it here"}</span>
      </span>

      <div className={`hero-copy relative grid gap-5 is-${systemState}`}>
        <div className="hero-identity">
          <p className="pixel-label text-cyan-arcade">{profile.eyebrow}</p>
          <p className="hero-greeting">Hey, I'm <strong>{profile.name}.</strong><span aria-hidden="true">_</span></p>
        </div>
        <h1 className="hero-headline font-display font-black uppercase text-white" aria-label={profile.headline}>
          {profile.headline.split(/(?<=\.)\s+/).map((line, index) => (
            <span className={`hero-headline-line is-line-${index + 1}`} key={line}>{line}</span>
          ))}
        </h1>
        <p className="hero-introduction">
          I build <b className="is-bots">Discord bots</b>, <b className="is-tools">SysBot tools</b>, and <b className="is-web">playful web interfaces</b>. Welcome to my personal cabinet: part terminal, part arcade, part late-night dev room.
        </p>
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
          {/* El atajo existia (la tecla /) pero nada lo decia. */}
          <ArcadeButton onClick={onOpenTerminal} aria-keyshortcuts="/" data-open-dock>
            <Terminal size={18} aria-hidden="true" />
            Terminal
            <kbd className="hero-key" aria-hidden="true">/</kbd>
          </ArcadeButton>
        </div>

        {/* Tres fichas con "queue offline / nodes asleep / canvas idle"
            repetian el estado del panel de al lado. En su sitio, lo que de
            verdad hay en el banco: cada cartucho abre su ficha en Carts. */}
        <nav className="hero-carts" aria-label="Builds on the bench">
          <div className="hero-carts-head">
            <span>on the bench</span>
            <a className="arcade-focus" href="#builds">
              all carts <ArrowDownRight size={13} aria-hidden="true" />
            </a>
          </div>
          <ul>
            {HERO_CARTS.map((cart) => (
              <li key={cart.slug}>
                <a className="hero-cart arcade-focus" href={`#project-${cart.slug}`} onClick={reopenSameHash}>
                  <b className="hero-cart-number">{cart.number}</b>
                  <span className="hero-cart-body">
                    <strong>{cart.title}</strong>
                    <small>{cart.kind}</small>
                  </span>
                  <em className="hero-cart-badge">{cart.badge}</em>
                  <ArrowDownRight className="hero-cart-arrow" size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="hero-console-dock">
        <div className="hero-workstation-caption" aria-hidden="true"><span>01 / THE WORKSTATION</span><span>interactive · draggable</span></div>
        {/* La boveda solo es alcanzable con el panel colgado: hasta entonces
            vive detras de la ventana, asi que inert la saca del orden de
            tabulacion y bloquea el raton. Sin esto habria botones enfocables
            escondidos debajo de otro elemento. */}
        <div
          className="console-secret-bay"
          {...(!isDragging ? { "data-no-random-glitch": true } : {})}
          inert={!isHung}
        >
          <span className="secret-bay-corner secret-bay-corner-tl" aria-hidden="true" />
          <span className="secret-bay-corner secret-bay-corner-tr" aria-hidden="true" />
          <span className="secret-bay-corner secret-bay-corner-bl" aria-hidden="true" />
          <span className="secret-bay-corner secret-bay-corner-br" aria-hidden="true" />
          <div className="secret-bay-sweeps" aria-hidden="true">
            <span />
            <span />
          </div>

          <DevRoomVault active={isHung} />

          {/* Barrido y registro: la telemetria de la puerta, debajo del
              mecanismo. */}
          <div className="secret-bay-readout" aria-hidden="true">
            <div className="secret-bay-scan">
              <span className="secret-bay-scan-label">sector sweep</span>
              <div className="secret-bay-scan-track">
                {SECRET_SECTORS.map((sector, index) => (
                  <b key={sector} style={{ "--sector-delay": `${0.5 + index * 0.85}s` }}>{sector}</b>
                ))}
              </div>
            </div>

            <div className="secret-bay-lines">
              <span className="secret-bay-lines-label">trace log</span>
              {["save slot found", "coffee_level: critical", "arcade build: ok", "keep exploring"].map((line, index) => (
                <span key={line} style={{ "--line-delay": `${0.24 + index * 0.16}s` }}>
                  <b>{String(index + 1).padStart(2, "0")}</b> {line}
                </span>
              ))}
            </div>
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

            {/* Un solo piloto de estado. Habia dos ("signal cold" + "offline")
                que decian lo mismo, y el estado se repetia otras cinco veces
                por el panel. */}
            <div className="hero-console-state">
              <span className={`is-system is-${systemState}`} data-system-state>
                <i aria-hidden="true" />
                {isLaunching ? `booting ${Math.round(progressWidth)}%` : systemState}
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
                {/* Las lineas ya ejecutadas quedan marcadas en el margen y las
                    que faltan, apagadas: el guion se ve correr con el arranque. */}
                <ol className={`code-lines is-${systemState}`}>
                  {BOOT_SCRIPT.map((line, index) => (
                    <li
                      className={index === activeCodeLine ? "is-active" : index < activeCodeLine || hasRun ? "is-done" : isLaunching ? "is-pending" : ""}
                      key={line.name}
                    >
                      <span className="code-gutter select-none">{index + 1}</span>
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
                  {/* Aqui iba otra vez el estado (offline / 42%); ya lo dicen el
                      piloto de arriba y la barra de abajo. */}
                  <span className="hero-build-count">
                    <b>{String(buildLines.length).padStart(2, "0")}</b> lines
                  </span>
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

                {/* Seis modulos legibles en vez de seis fichas con letra de 5px
                    y un "on/off" al final: el nombre se lee y el LED (con el
                    color de su nodo en el lienzo) dice si esta arriba. */}
                <ul className="build-node-rail" aria-label={`Nodes online: ${onlineNodes} of ${bootNodes.length}`}>
                  {bootNodes.map((node, index) => {
                    const online = index < onlineNodes;
                    const linking = isLaunching && index === onlineNodes - 1;
                    return (
                      <li
                        className={`build-node ${online ? "is-online" : ""} ${linking ? "is-linking" : ""}`}
                        key={node.glyph}
                        style={{ "--node-color": node.color }}
                      >
                        <b aria-hidden="true">{node.glyph}</b>
                        <span>{node.name}</span>
                        <em aria-label={online ? "online" : "offline"} />
                      </li>
                    );
                  })}
                </ul>
                <div className={`build-progress-row is-${systemState}`}>
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
                  <b>{isLaunching ? `${Math.round(progressWidth)}%` : hasRun ? "ready" : "idle"}</b>
                </div>
              </div>
            </div>

            <div className="hero-canvas-stage relative min-h-[360px] overflow-hidden bg-ink-950/85">
              <ArcadeCanvas hasRun={hasRun} isLaunching={isLaunching} launchPhase={launchPhase} onRun={onRun} />
              <div className={`hero-canvas-hud is-${systemState} pointer-events-none absolute`}>
                <span>NODE MAP // XP FEED</span>
                <strong>{hasRun ? "LIVE FEED" : isLaunching ? "LINKING" : "STANDBY"}</strong>
                <small>{hasRun ? "packets flowing to core" : isLaunching ? `${linkingNode.glyph} ${linkingNode.name} coming up` : "6 nodes asleep"}</small>
              </div>
              {/* Antes aqui iba una ficha "PRIMARY NODE // DAI.EXE // offline"
                  que repetia el nucleo del lienzo palabra por palabra. Lo que
                  no contaba nadie es que el lienzo se juega: ahora la esquina
                  dice que hace cada clic. */}
              <dl className={`canvas-controls is-${systemState} pointer-events-none absolute`} aria-label="Canvas controls">
                {hasRun ? (
                  <>
                    <div><dt>click node</dt><dd>burst</dd></div>
                    <div><dt>click core</dt><dd>overclock</dd></div>
                  </>
                ) : isLaunching ? (
                  <div><dt>linking</dt><dd>{nodeCount}</dd></div>
                ) : (
                  <div><dt>click core</dt><dd>boot</dd></div>
                )}
              </dl>
            </div>
          </div>

          {/* Etiqueta apagada, valor encendido. El "signal cold" de la derecha
              repetia el piloto de la barra de titulo; ahora es el reloj de la
              sesion, lo unico del pie que cambia solo. */}
          <div className={`hero-console-telemetry relative z-10 is-${systemState}`} aria-label="Workstation telemetry">
            <span><b>SESSION</b> <i>{hasRun ? "STABLE" : isLaunching ? "BOOTING" : "STANDBY"}</i></span>
            <span><b>NODES</b> <i>{nodeCount}</i></span>
            <span><b>ROUTE</b> <i>/HOME</i></span>
            <SessionUptime online={hasRun} />
          </div>
        </div>
      </div>
    </section>
  );
}
