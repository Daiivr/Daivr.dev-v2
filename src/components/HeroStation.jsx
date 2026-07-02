import { Cpu, Play, RadioTower, Terminal } from "lucide-react";
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
        <div className="flex flex-wrap gap-3">
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
            className="hero-console-handle relative z-10 flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-phosphor/20 bg-ink-950/80 px-4 py-2"
            {...handleProps}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 bg-danger-arcade shadow-[0_0_14px_rgba(255,95,104,.45)]" />
              <span className="h-2.5 w-2.5 bg-cabinet shadow-[0_0_14px_rgba(255,209,102,.35)]" />
              <span className="h-2.5 w-2.5 bg-phosphor shadow-[0_0_14px_rgba(63,255,151,.35)]" />
              <code className="ml-2 truncate text-xs font-black text-phosphor-soft/65">~/daivr/homebase.jsx</code>
            </div>
            <div className="flex items-center gap-2 text-[0.66rem] font-black uppercase">
              <span className="inline-flex items-center gap-1 border border-cyan-arcade/25 px-2 py-1 text-cyan-arcade">
                <RadioTower size={12} aria-hidden="true" />
                {signalState}
              </span>
              <span className="border border-phosphor/25 px-2 py-1 text-phosphor" data-system-state>{systemState}</span>
            </div>
          </div>

          <div className="hero-console-content relative z-10 grid xl:grid-cols-[minmax(330px,.95fr)_minmax(0,1.05fr)]">
            <div className="console-left border-b border-phosphor/20 p-4 md:p-5 lg:border-b-0 lg:border-r">
              <div className="code-card border border-phosphor/18 bg-ink-950/62">
                <div className="flex items-center justify-between gap-3 border-b border-phosphor/15 px-3 py-2">
                  <p className="pixel-label text-phosphor-soft/70">BOOT SCRIPT</p>
                  <span className="inline-flex items-center gap-1 text-[0.66rem] font-black uppercase text-cabinet">
                    <Cpu size={12} aria-hidden="true" />
                    jsx
                  </span>
                </div>
                <ol className="code-lines grid gap-0 px-3 py-3 text-sm leading-7 md:text-[0.94rem]">
                  {[
                    ["const", "player", "=", "\"Dai\";"],
                    ["load", "(\"discord-bots\");", "", ""],
                    ["sync", "(\"sysbot-tools\");", "", ""],
                    ["queue", "(\"game-night-ui\");", "", ""],
                    ["render", "(\"personal-site\");", "", ""]
                  ].map(([head, body, operator, value], index) => (
                    <li className="grid grid-cols-[2ch_minmax(0,1fr)] gap-3 py-1" key={`${head}-${index}`}>
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
                  <p className="pixel-label">BUILD OUTPUT</p>
                  <span className="text-xs font-black text-cabinet">{Math.round(progressWidth)}%</span>
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
              <ArcadeCanvas hasRun={hasRun} isLaunching={isLaunching} launchPhase={launchPhase} />
              <div className="pointer-events-none absolute left-4 top-4 grid gap-2 text-[0.66rem] font-black uppercase">
                <span className="w-fit border border-cyan-arcade/35 bg-ink-950/70 px-2 py-1 text-cyan-arcade">{hasRun ? "canvas live" : isLaunching ? "canvas booting" : "canvas idle"}</span>
                <span className="w-fit border border-phosphor/25 bg-ink-950/70 px-2 py-1 text-phosphor-soft/70">{hasRun ? "vector room" : "nodes offline"}</span>
              </div>
              <div className="canvas-node-badge pointer-events-none absolute border border-phosphor/25 bg-ink-950/75 px-3 py-2 text-right">
                <p className="pixel-label text-[0.64rem]">NODE</p>
                <strong className="font-display text-lg leading-none text-white">DAI.EXE</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
