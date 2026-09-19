import { useId, useLayoutEffect, useRef } from "react";
import { ChevronsLeft, Power, Radiation, Zap } from "lucide-react";
import { VaultDoor } from "../../components/VaultDoor";
import { VaultControlHint, vaultHintEvents } from "../../components/VaultControlHint";
import { VAULT_OPEN_MS, VAULT_ENTER_MS, VAULT_APPROACH_MS } from "../data/vaultSequence";
import "../startup.css";
import "../vault-hardware.css";

const INITIAL_STAGES = ["Interface", "Reports", "Artwork", "Display"].map((label) => ({ label, status: "loading" }));
const COMMANDS = { Interface: "LOCAL INTERFACE", Reports: "FIELD REPORTS", Artwork: "FIELD IMAGES", Display: "DISPLAY SYSTEM" };

export function FalloutLoader({ onSkip, skipRef, stages = INITIAL_STAGES, phase = "loading", offline = false, entryOrigin, onApproachComplete }) {
  const viewportRef = useRef(null);
  const sceneRef = useRef(null);
  const paintId = `vault-paint-${useId().replace(/:/g, "")}`;
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    const measure = () => {
      // Layout dimensions stay stable while the camera transforms its contents.
      const diameter = scene.offsetWidth;
      if (!diameter) return;
      const pitchRadius = diameter * .476;
      // Park inside the wall pocket at full size. Travel and rotation share
      // the gear's pitch radius so it rolls without sliding on the rear rack.
      const travel = diameter * 1.2;
      viewport.style.setProperty("--vault-roll-distance", `${-travel}px`);
      viewport.style.setProperty("--vault-roll-angle", `${-travel / pitchRadius * 180 / Math.PI}deg`);
      viewport.style.setProperty("--vault-tooth-pitch", `${2 * Math.PI * pitchRadius / 16}px`);
      // The final aperture must clear every viewport corner before unmounting.
      const zoom = Math.hypot(viewport.clientWidth / 2, viewport.clientHeight / 2) / (diameter * .46) + .5;
      viewport.style.setProperty("--vault-camera-zoom", String(zoom));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!entryOrigin || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    const door = scene.querySelector(".fo-vault-door-carriage");
    const target = door.getBoundingClientRect();
    const x = entryOrigin.x - target.x - target.width / 2;
    const y = entryOrigin.y - target.y - target.height / 2;
    const options = { duration: VAULT_APPROACH_MS, easing: "cubic-bezier(.22,.7,.18,1)" };
    // FLIP the actual splash door from the cabinet door's position and diameter.
    viewport.classList.add("is-approaching");
    const animations = [door.animate([
      { transform: `translate(${x}px, ${y}px) scale(${entryOrigin.size / target.width}) rotate(${entryOrigin.angle || 0}deg)`, transformOrigin: "50% 50%" },
      { transform: "translate(0, 0) scale(1)", transformOrigin: "50% 50%" },
    ], options)];
    const surroundings = [
      ...viewport.querySelectorAll(".fo-vault-camera > :not(.fo-vault-scene)"),
      ...scene.querySelectorAll(":scope > :not(.fo-vault-mechanism)"),
      ...scene.querySelectorAll(".fo-vault-mechanism > :not(.fo-vault-door-release)"),
    ];
    surroundings.forEach((element) => animations.push(element.animate([{ opacity: 0 }, { opacity: getComputedStyle(element).opacity }], options)));
    animations[0].finished.then(() => { viewport.classList.remove("is-approaching"); onApproachComplete?.(); }).catch(() => {});
    return () => { animations.forEach((animation) => animation.cancel()); viewport.classList.remove("is-approaching"); };
  }, [entryOrigin, onApproachComplete]);
  const progress = stages.length ? Math.round(stages.filter((stage) => stage.status !== "loading").length / stages.length * 100) : 0;
  const complete = phase !== "loading";
  const pending = stages.find((stage) => stage.status === "loading")?.label;
  const status = phase === "entering" ? "ENTERING FIELD STATION" : phase === "leaving" ? "VAULT OPENING · STAND CLEAR" : complete ? "ACCESS GRANTED · RETRACTING LOCKS" : pending ? `CHECKING ${COMMANDS[pending] || pending.toUpperCase()}` : offline ? "OFFLINE FIELD STATION READY" : "VERIFYING ACCESS";
  return <div ref={viewportRef} className={`fo-startup is-${phase}`} tabIndex={-1} style={{ "--vault-opening-duration": `${VAULT_OPEN_MS}ms`, "--vault-entry-duration": `${VAULT_ENTER_MS}ms`, "--vault-paint-filter": `url(#${paintId})` }} role={onSkip ? "dialog" : "status"} aria-modal={onSkip ? true : undefined} aria-label="Opening Vault 76 — Fallout terminal" onKeyDown={(event) => { if (event.key === "Escape") onSkip?.(); }}>
    <svg width="0" height="0" className="fo-vault-filter-defs" aria-hidden="true"><defs>
      <filter id={paintId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".085" numOctaves="3" seed="76" result="wear" />
        <feColorMatrix in="wear" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .2126 .7152 .0722 0 0" />
        <feComponentTransfer result="paintMask"><feFuncA type="discrete" tableValues="0 .45 .86 .97 1 1 1 1" /></feComponentTransfer>
        <feComposite in="SourceGraphic" in2="paintMask" operator="in" />
      </filter>
    </defs></svg>
    <div className="fo-vault-camera">
    <div className="fo-vault-shade" aria-hidden="true" />
    <div ref={sceneRef} className="fo-vault-scene" aria-hidden="true">
      <div className="fo-vault-mechanism">
        <div className="fo-vault-reveal" />
        <div className="fo-vault-rear-track"><div className="fo-vault-rail" /></div>
        <div className="fo-vault-door-release"><div className="fo-vault-door-carriage"><VaultDoor /></div></div>
        <div className="fo-vault-steam" />
        <div className="fo-vault-track-dust" />
      </div>
      <div className="fo-vault-bulkhead"><div className="fo-vault-rim" />{Array.from({ length: 16 }, (_, i) => <i className="fo-vault-frame-bolt" key={i} style={{ "--angle": `${i * 22.5 + 11.25}deg` }} />)}</div>
      <div className="fo-vault-wall-face" />
      <div className="fo-vault-pipework"><i /><i /><i /><b>MAIN / 04</b></div>
      <div className="fo-vault-overhead"><i className="fo-vault-alarm-lens" /><div className="fo-vault-alarm-label"><strong>STAND CLEAR</strong><span>AUTOMATIC BLAST DOOR</span></div><i className="fo-vault-alarm-lens" /></div>
      <div className="fo-vault-lamp is-left"><i /><b /></div><div className="fo-vault-lamp is-right"><i /><b /></div>
      <div className="fo-vault-warning"><span>RESTRICTED AREA</span><strong>AUTHORIZED<br />PERSONNEL ONLY</strong><i /><small>BLAST DOOR / 076<br />KEEP CLEAR OF TRACK</small></div>
      <div className="fo-vault-threshold" />
    </div>
    <div className="fo-vault-atmosphere" aria-hidden="true" />
    <div className="fo-vault-stencil" aria-hidden="true">76<span>EXTERIOR<br />ACCESS LOCK</span></div>
    <div className="fo-vault-mural" aria-hidden="true">
      <div className="fo-vault-wall-symbol is-vault"><svg viewBox="0 0 140 48" fill="none"><path d="M47 15H5m40 9H15m32 9H25m68-18h42m-40 9h30m-32 9h22" stroke="currentColor" strokeWidth="4" /><circle cx="70" cy="24" r="20" stroke="currentColor" strokeWidth="3" /><circle cx="70" cy="24" r="14" stroke="currentColor" /><text x="70" y="30" textAnchor="middle" fill="currentColor" fontFamily="monospace" fontSize="17" fontWeight="bold">76</text></svg><span>RECLAMATION DIVISION</span></div>
      <div className="fo-vault-wall-symbol is-radiation"><Radiation strokeWidth={1.7} /><span>CAUTION</span></div>
      <div className="fo-vault-wall-symbol is-power"><Zap strokeWidth={1.8} /><span>HIGH VOLTAGE</span></div>
      <div className="fo-vault-wall-symbol is-direction"><ChevronsLeft strokeWidth={3} /><span>ENTRY</span></div>
      <img src="/fallout/vault-boy.png" alt="" width="773" height="1002" />
      <span>A BETTER TOMORROW<br /><strong>STARTS WITH YOU.</strong></span>
    </div>
    <div className="fo-vault-heading">
      <div className="fo-vault-nameplate">
        <svg className="fo-vault-sign-emblem" viewBox="0 0 96 76" fill="none" aria-hidden="true"><path d="M29 22H2m26 8H7m20 8H12m55-16h27M68 30h21m-20 8h15" stroke="currentColor" strokeWidth="3" /><path d="m48 3 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="currentColor" /><circle cx="48" cy="44" r="24" stroke="currentColor" strokeWidth="2" /><circle cx="48" cy="44" r="20" stroke="currentColor" opacity=".4" /><text x="48" y="54" textAnchor="middle" fill="currentColor" fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="29">76</text><path d="M21 72h54" stroke="currentColor" /></svg>
        <div className="fo-vault-sign-copy"><span>DAI INDUSTRIES · APPALACHIA</span><h1>WASTELAND<span>FIELD STATION</span></h1></div>
        <span className="fo-vault-sign-serial" aria-hidden="true">EST.<br />2076</span>
      </div>
    </div>
    <div className="fo-vault-console">
      <div className="fo-vault-console-plate" aria-hidden="true"><i />PERSONNEL ACCESS<span>VT–076</span><i /></div>
      <div className="fo-vault-console-title"><span>EXTERIOR CONTROL</span><strong>WELCOME HOME.</strong></div>
      <div className="fo-vault-sequence" aria-hidden="true"><span><b>01</b> RELEASE LOCKS</span><span><b>02</b> BREAK THE SEAL</span><span><b>03</b> OPEN THE VAULT</span></div>
      <div className="fo-vault-readiness" role="progressbar" aria-label="Vault initialization" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${progress}% of initialization checks complete`}>
        <div className="fo-vault-meter-face" aria-hidden="true">
          <span className="fo-vault-meter-title">SYSTEM READINESS</span>
          <svg className="fo-vault-meter-dial" viewBox="0 0 132 96" fill="none"><path d="M7 54A65 65 0 0 1 125 54" stroke="#4d584d" strokeWidth="1" /><path d="M104 29A65 65 0 0 1 125 54" stroke="#87723e" strokeWidth="4" />{Array.from({ length: 21 }, (_, index) => <path key={index} d={`M66 17v${index % 5 === 0 ? 9 : 4}`} stroke="#35463f" strokeWidth={index % 5 === 0 ? 1.5 : .8} transform={`rotate(${-65 + index * 6.5} 66 82)`} />)}<g fill="#3e4b42" fontFamily="monospace" fontSize="8"><text x="16" y="67">0</text><text x="60" y="40">50</text><text x="99" y="67">100</text></g><g className="fo-vault-meter-needle" style={{ transform: `rotate(${-65 + progress * 1.3}deg)` }}><path d="m66 24-2 56h4Z" fill="#843e28" /><path d="M66 82v8" stroke="#843e28" strokeWidth="3" /></g><circle cx="66" cy="82" r="5" fill="#41554e" stroke="#a8af99" strokeWidth="2" /></svg>
          <div className="fo-vault-meter-counter"><span>CHECKS COMPLETE</span><div>{String(progress).padStart(3, "0").split("").map((digit, index) => <b key={index}>{digit}</b>)}<i>%</i></div><small>DAI INSTRUMENT CO.</small></div>
        </div>
        <div className="fo-vault-status" aria-live="polite"><i aria-hidden="true" /><span>{status}</span></div>
      </div>
      <ol className="fo-vault-checks" aria-label="Initialization checks">{stages.map((stage) => <li key={stage.label} className={`is-${stage.status}`}><i aria-hidden="true" /><span>{stage.label}</span><b>{stage.status === "ready" ? "OK" : stage.status === "loading" ? "WAIT" : stage.status.toUpperCase()}</b></li>)}</ol>
      <div className="fo-vault-console-hardware" aria-hidden="true"><div className="fo-vault-gauge"><i /><span>SEAL</span></div><span>AUTOMATED ENTRY<br /><b>KEEP THE TRACK CLEAR</b></span></div>
      {onSkip && <button className="fo-vault-override vault-hint-trigger" ref={skipRef} type="button" onClick={onSkip} aria-label="Skip vault intro" aria-describedby={`${paintId}-override-hint`} {...vaultHintEvents}><Power size={15} aria-hidden="true" /><VaultControlHint id={`${paintId}-override-hint`} label="MANUAL OVERRIDE" detail="Skip the vault opening sequence" shortcut="ESC" /></button>}
    </div>
    </div>
  </div>;
}
