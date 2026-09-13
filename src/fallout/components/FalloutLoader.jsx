import { FalloutBackdrop } from "./FalloutBackdrop";
import "../startup.css";

const INITIAL_STAGES = ["Interface", "Reports", "Artwork", "Display"].map((label) => ({ label, status: "loading" }));
const COMMANDS = { Interface: "MOUNT LOCAL INTERFACE", Reports: "SYNC FIELD REPORTS", Artwork: "DECODE FIELD IMAGES", Display: "PREPARE DISPLAY" };

export function FalloutLoader({ onSkip, skipRef, stages = INITIAL_STAGES, phase = "loading", offline = false }) {
  const progress = stages.filter((stage) => stage.status !== "loading").length / stages.length * 100;
  const complete = phase !== "loading";
  const pending = stages.find((stage) => stage.status === "loading")?.label;
  const status = complete ? offline ? "OFFLINE VIEW READY." : "ALL SYSTEM CHECKS COMPLETE." : pending ? `${COMMANDS[pending]}...` : "FINALIZING INTERFACE...";
  return <div className={`fo-startup is-${phase}`} role={onSkip ? "dialog" : "status"} aria-modal={onSkip ? true : undefined} aria-label="Opening Fallout 76 terminal" onKeyDown={(event) => { if (event.key === "Escape") onSkip?.(); }}>
    <FalloutBackdrop />
    <div className="fo-startup-frame">
      <div className="fo-startup-case"><span>DAI INDUSTRIES / PERSONAL TERMINAL</span><span>MODEL 076</span></div>
      <div className="fo-startup-screen">
        <div className="fo-startup-brand"><div><strong>DAI INDUSTRIES</strong><span>UNIFIED FIELD OPERATING SYSTEM</span></div><img src="/games/fallout-76-logo.png" alt="Fallout 76" width="500" height="171" /></div>
        <p className="fo-startup-system">APPALACHIA DIVISION<br />PERSONAL ACCESS / DAI.EXE</p>
        <div className="fo-startup-rule" aria-hidden="true" />
        <p className="fo-startup-command"><span aria-hidden="true">&gt; </span>BOOT WASTELAND.SYS</p>
        <ol className="fo-startup-checks" aria-label="Initialization checks">{stages.map((stage) => <li key={stage.label} className={`is-${stage.status}`}><span>{COMMANDS[stage.label]}</span><i aria-hidden="true" /><b>[{stage.status === "loading" ? "WAIT" : stage.status === "ready" ? " OK " : stage.status.toUpperCase()}]</b></li>)}</ol>
        <div className="fo-startup-progress-label"><span>INITIALIZATION</span><b>{String(progress).padStart(3, "0")}%</b></div>
        <div className="fo-startup-track" role="progressbar" aria-label="Terminal initialization" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${progress}% of initialization checks complete`}><i style={{ transform: `scaleX(${progress / 100})` }} /></div>
        <div className="fo-startup-result" aria-live="polite"><p>{status}</p><p>{complete ? "OPENING FIELD STATION" : "PLEASE STAND BY"}<span className="fo-startup-caret" aria-hidden="true">▌</span></p></div>
        <div className="fo-startup-footer"><span>{complete ? "INITIALIZATION FINISHED" : "DO NOT POWER OFF TERMINAL"}</span>{onSkip && !complete && <button ref={skipRef} type="button" onClick={onSkip}>[ESC] Skip boot</button>}</div>
      </div>
      <div className="fo-startup-case-bottom" aria-hidden="true"><i /><span>PROPERTY OF DAI / FIELD EQUIPMENT</span><b /></div>
    </div>
  </div>;
}
