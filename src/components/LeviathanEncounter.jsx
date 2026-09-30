import { createPortal } from "react-dom";
import { ArrowDown, Radar, X } from "lucide-react";
import { useEffect, useState } from "react";

export function LeviathanEncounter({ phase, container }) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { if (!phase) setDismissed(false); }, [phase]);
  if (!phase || !container) return null;
  const title = phase === "omen" ? "Something enormous is approaching" : phase === "monster" ? "Leviathan at the surface" : "Returning to the deep";
  const visit = () => {
    container.scrollIntoView({ behavior: "instant", block: "end" });
    container.querySelector(".leviathan-stage")?.focus({ preventScroll: true });
  };
  return <>
    {!dismissed && createPortal(<div className={`leviathan-dimmer is-${phase}`} aria-hidden="true" />, container.closest(".app-shell") || document.body)}
    {createPortal(<>
      {!dismissed && <aside className="leviathan-alert" aria-label="Leviathan sighting">
        <Radar size={24} aria-hidden="true" />
        <div role="status"><small>RARE ENCOUNTER / FOOTER</small><strong>{title}</strong></div>
        <button className="leviathan-visit" onClick={visit}>Go to footer <ArrowDown size={16} aria-hidden="true" /></button>
        <button className="leviathan-dismiss" aria-label="Dismiss sighting alert and dimming" onClick={() => setDismissed(true)}><X size={17} /></button>
      </aside>}
    </>, document.body)}
    {createPortal(<section className={`leviathan-stage is-${phase}`} tabIndex={-1} aria-label={`Void leviathan: ${title}`}>
      <div className="leviathan-depth-label"><span>ABYSSAL SIGNAL</span><b>{phase === "omen" ? "CONTACT RISING" : phase === "monster" ? "LEVIATHAN // SIGHTING LOGGED" : "SIGNAL FADING"}</b></div>
      <div className="leviathan-water"><i /><i /><i /></div>
      <svg className="leviathan-art" viewBox="0 0 240 100" aria-hidden="true" shapeRendering="crispEdges">
        <g className="leviathan-tail"><path d="M67 57H43V45H29V33H12v14h7v12H8v19h18V67h21v9h24z" fill="#103444" /><path d="M13 35h12v14h9v8H23V47H13z" fill="#297185" /></g>
        <path d="M48 59V46h15V34h23V24h40V14h40v6h25v9h21v9h16v12h8v23h-12v10h-30v8H97v-6H73V74H56V63z" fill="#071922" stroke="#438b99" strokeWidth="2" />
        <path d="M64 45h22V34h40V24h41v5h24v9h20v10h16v8h-33v-7h-25v-6h-57v6H89v10H65z" fill="#205465" />
        <path d="M76 71h27v7h83v-6h35v8h-30v7h-87v-5H77z" fill="#3a8790" />
        <g className="leviathan-spines" fill="#57c6c9"><path d="M64 34V22h9v12m20-10V9h10v15m24-10V0h10v14m24 6V6h9v15" /><path d="M84 86v10h12V86m37 5v9h12v-9" fill="#297185" /></g>
        <path d="M112 42h7v4h-7m20-12h9v4h-9m-47 20h7v4h-7m54 8h8v4h-8m22-16h7v4h-7" fill="#67d8d1" opacity=".7" />
        <path d="M173 34h22v4h-22z" fill="#071922" />
        <g className="leviathan-eye"><path d="M179 39h16v9h-16z" fill="#ffd166" /><path d="M187 39h4v9h-4z" fill="#ff3d9d" /><rect x="180" y="39" width="4" height="3" fill="#fff5cc" /></g>
        <path d="M195 59h40v11h-42v-4h-12v-5h14z" fill="#020609" />
        <path d="M199 59h5v5h-5m12-5h5v5h-5m11-5h5v5h-5m-20 2h5v4h-5m12-4h5v4h-5" fill="#cce9d8" />
        <g className="leviathan-fin"><path d="M131 65h27v8h-8v10h-12v8h-19V77h12z" fill="#205465" /><path d="M134 68h14v7h-7v9h-11v-8h4z" fill="#438b99" /></g>
      </svg>
      <div className="leviathan-spray" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--spray-i": i }} />)}</div>
    </section>, container)}
  </>;
}
