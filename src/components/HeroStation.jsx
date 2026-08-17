import { Activity, Cpu, Grip, Play, RadioTower, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { profile } from "../data/site";
import { useElasticDrag } from "../hooks/useElasticDrag";
import { ArcadeButton } from "./ui/ArcadeButton";
import { ArcadeCanvas } from "./ArcadeCanvas";

export function HeroStation({ buildLog, hasRun, isLaunching, launchPhase, onRun, onOpenTerminal }) {
  const stationRef = useRef(null);
  const { handleProps, isDragging, targetRef } = useElasticDrag({ scopeRef: stationRef });
  const [hasSecretArmed, setHasSecretArmed] = useState(false);
  const visibleBuildLog = buildLog.split("\n").slice(-6).join("\n");
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
          <ArcadeButton variant="primary" onClick={onRun} data-run-build>
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
            <span className="secret-bay-badge">subroutine unlocked</span>
            <strong>DEV ROOM // 1997</strong>
            <code>&gt; drag_window.unlock("dai-core")</code>
            <div className="secret-bay-meter">
              <i />
              <span>ACCESS DENIED // NOT ALLOWED HERE</span>
            </div>
          </div>
          <div className="secret-bay-lines">
            <span><b>01</b> save slot found</span>
            <span><b>02</b> coffee_level: critical</span>
            <span><b>03</b> arcade build: ok</span>
            <span><b>04</b> keep exploring</span>
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
                  {[
                    ["const", "player", "=", "\"Dai\";"],
                    ["load", "(\"discord-bots\");", "", ""],
                    ["sync", "(\"sysbot-tools\");", "", ""],
                    ["queue", "(\"game-night-ui\");", "", ""],
                    ["render", "(\"personal-site\");", "", ""]
                  ].map(([head, body, operator, value], index) => (
                    <li className={index === activeCodeLine ? "is-active" : ""} key={`${head}-${index}`}>
                      <span className="select-none text-right text-phosphor-soft/30">{index + 1}</span>
                      <code className="min-w-0 break-words">
                        <span className="text-cyan-arcade">{head}</span>
                        {body ? <span className="text-phosphor-soft"> {body}</span> : null}
                        {operator ? <span className="text-glitch"> {operator}</span> : null}
                        {value ? <span className="text-cabinet"> {value}</span> : null}
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
                <pre className="terminal-screen build-output-screen overflow-hidden whitespace-pre-wrap break-words p-3 text-[0.8rem] leading-6 text-phosphor" data-build-output>
                  <code>{visibleBuildLog}</code>
                </pre>
                <div className="mx-3 mb-3 h-3 border border-phosphor/25 bg-ink-950 p-0.5">
                  <span
                    className="block h-full bg-gradient-to-r from-phosphor via-cyan-arcade to-glitch shadow-[0_0_18px_rgba(63,255,151,.28)] transition-all duration-300"
                    style={{ width: `${progressWidth}%` }}
                  />
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

          <div className="hero-console-telemetry relative z-10" aria-label="Workstation telemetry">
            <span><b>SESSION</b> {hasRun ? "STABLE" : isLaunching ? "BOOTING" : "STANDBY"}</span>
            <span><b>NODES</b> {String(onlineNodes).padStart(2, "0")}/06</span>
            <span><b>ROUTE</b> /HOME</span>
            <strong><Activity size={12} aria-hidden="true" /> {signalState}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
