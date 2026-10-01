import { createPortal } from "react-dom";
import { ArrowDown, Hand, Radar, Waves, X } from "lucide-react";
import { useEffect, useState } from "react";
import { encounterPlacement } from "../../shared/buddy-encounters.mjs";
import { KrakenArt } from "./KrakenArt";

export function LeviathanEncounter({ phase, container, response = "", onInteract, creature = "leviathan", buddyX = 0 }) {
  const [dismissed, setDismissed] = useState(false);
  const [used, setUsed] = useState([]);
  useEffect(() => { if (!phase) { setDismissed(false); setUsed([]); } }, [phase]);
  if (!phase || !container) return null;
  const kraken = creature === "kraken";
  const name = kraken ? "Kraken" : "Leviathan";
  const placement = encounterPlacement(container.clientWidth, buddyX);
  const title = phase === "omen" ? "Something enormous is approaching" : phase === "monster" ? `${name} at the surface` : "Returning to the deep";
  const visit = () => {
    container.scrollIntoView({ behavior: "instant", block: "end" });
    container.querySelector(".leviathan-stage")?.focus({ preventScroll: true });
  };
  const interact = (action) => {
    if (phase !== "monster" || used.includes(action)) return;
    setUsed((current) => [...current, action]);
    onInteract?.(action);
  };
  return <>
    {!dismissed && createPortal(<div className={`leviathan-dimmer is-${phase}`} aria-hidden="true" />, container.closest(".app-shell") || document.body)}
    {createPortal(<>
      {!dismissed && <aside className="leviathan-alert" aria-label={`${name} sighting`}>
        <Radar size={24} aria-hidden="true" />
        <div role="status"><small>RARE ENCOUNTER / FOOTER</small><strong>{title}</strong></div>
        <button className="leviathan-visit" onClick={visit}>Go to footer <ArrowDown size={16} aria-hidden="true" /></button>
        <button className="leviathan-dismiss" aria-label="Dismiss sighting alert and dimming" onClick={() => setDismissed(true)}><X size={17} /></button>
      </aside>}
    </>, document.body)}
    {createPortal(<section className={`leviathan-stage creature-${creature} ${placement.facesLeft ? "faces-buddy-left" : "faces-buddy-right"} is-${phase} ${response ? `response-${response}` : ""}`} tabIndex={-1} aria-label={`${name}: ${title}`}>
      <div className="leviathan-depth-label"><span>ABYSSAL SIGNAL</span><b>{phase === "omen" ? kraken ? "TENTACLES AT THE EDGE" : "CONTACT RISING" : phase === "monster" ? `${name.toUpperCase()} // SIGHTING LOGGED` : "SIGNAL FADING"}</b></div>
      <div className="leviathan-interaction">
        <p role="status">{phase === "omen" ? kraken ? "Suckers catch the rim. Something is climbing out…" : "A shadow moves beneath the broken floor…" : phase === "retreat" ? kraken ? "Its grip loosens. Ink swirls where the giant was." : "A final flash of light. Then, still water." : response === "steady" ? "Buddy plants his feet. The tension eases." : response === "signal" ? kraken ? "One tentacle waves back. Buddy made a friend." : "Its markings glow. It recognizes your signal." : kraken ? "It grips the footer and hauls itself from the deep." : "Buddy has company. Help him greet the deep."}</p>
        {phase === "monster" ? <div><button type="button" disabled={used.includes("steady")} onClick={() => interact("steady")}><Hand size={14} aria-hidden="true" />Steady Buddy</button><button type="button" disabled={used.includes("signal")} onClick={() => interact("signal")}><Waves size={14} aria-hidden="true" />Signal hello</button></div> : null}
      </div>
      <div className="leviathan-water"><i /><i /><i /></div>
      <svg className="leviathan-art" style={{ left: placement.left, width: placement.width, right: "auto", bottom: kraken ? -(placement.width * 14 / 360) : undefined }} viewBox={kraken ? "0 0 360 160" : "0 0 360 140"} aria-hidden="true" shapeRendering="crispEdges">
        <g transform={placement.facesLeft ? "translate(360 0) scale(-1 1)" : undefined}>
        {kraken ? <KrakenArt /> : <>
        <g className="leviathan-tail">
          <path d="M112 101H80V91H55V76H32V60H18V42L8 16l20 12 9 17 15-18-5 31 15 12h22v8h28z" fill="#102c3b" stroke="#376678" strokeWidth="2" />
          <path d="M20 43h12v17h12v12h15v9h25v10h20v6H78V87H53V72H31V56H20z" fill="#286070" />
          <path d="M31 39h9v20h-5V47h-4zM12 25h5v14h-5z" fill="#66bab8" />
        </g>
        <path d="M78 95V78h20V62h28V47h38V33h45V22h45v8h25v12h23v15h24v12h19v22h-12v14h-34v12h-44v9h-73v-7h-51v-9H98V99z" fill="#102a36" stroke="#579496" strokeWidth="2" />
        <path d="M100 75h27V58h37V44h45V33h44v8h24v11h24v14h25v9h-30V64h-28V54h-40v4h-36v9h-36v10h-30v14h-26z" fill="#285362" />
        <path d="M112 97h28v8h49v8h60v-7h45v-9h32v-7h16v11h-44v12h-44v9h-70v-7h-50v-9h-22z" fill="#4a807f" />
        <path d="M153 102h9v10h-9m17-9h9v12h-9m17-10h9v13h-9m17-13h9v13h-9m17-15h9v12h-9m17-15h9v12h-9" fill="#264c57" />
        <g className="leviathan-spines">
          <path d="M111 64V46l8-8v23m27-14V27l10-9v27m29-13V14l11-10v27m29-8V8h10v15m28 15V19l9-7v31" fill="#265661" stroke="#5faaa8" strokeWidth="2" />
          <path d="M114 49h4v11h-4m35-29h5v13h-5m39-13h5v12h-5m38-17h4v10h-4" fill="#a4e8cb" />
        </g>
        <g className="leviathan-scales" fill="#376677">
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${129 + (i % 4) * 25} ${72 + Math.floor(i / 4) * 10 - (i % 4) * 5}h11v3h-3v3h-8z`} />)}
        </g>
        <g className="leviathan-markings" fill="#8de5d1">
          <path d="M112 81h5v3h-5m25-14h6v3h-6m21-13h7v3h-7m22-9h7v3h-7m22-6h8v3h-8m27-3h6v3h-6M85 87h5v3h-5" />
          <path d="M136 85h3v3h-3m29-12h3v3h-3m28-12h3v3h-3m23-8h3v3h-3" />
        </g>
        <g className="leviathan-gills" fill="none" stroke="#548e98" strokeWidth="3"><path d="M246 64v10l-6 9m15-16v12l-6 9m15-17v11l-5 8" /></g>
        <path d="M277 55h22v7h-22zM287 51h11v4h-11z" fill="#071820" />
        <g className="leviathan-eye"><path d="M280 62h17v9h-17z" fill="#ffd477" /><path d="M288 62h4v9h-4z" fill="#c86c60" /><path d="M282 63h4v3h-4z" fill="#fff6cf" /></g>
        <path d="M294 83h46v9h-17v7h-37v-5h-12v-5h20z" fill="#07141c" />
        <path d="M302 83h5v6h-5m10-6h5v4h-5m11-4h5v5h-5m-29 6h5v4h-5m12-4h5v4h-5" fill="#bdceae" />
        <path d="M307 70h13v3h-13m18 6h5v3h-5" fill="#64958f" />
        <g className="leviathan-fin"><path d="M206 84h27v13h-9v13h-14v14h-29v-11h9V98h9z" fill="#1c4859" stroke="#487d89" strokeWidth="2" /><path d="M210 89h13v6h-8v12h-13v10h-10v-6h7V99h11z" fill="#568f93" /><path d="M216 92h4v5h-8v12h-4V99h8z" fill="#8dc4b6" /></g>
        <g className="leviathan-whiskers" fill="none" stroke="#80b6ad" strokeWidth="2"><path d="M324 100v12h-8v11h-15m28-20v13h9v10h-7" /></g>
        <path className="leviathan-far-fin" d="M166 58l-22-21h-15l13 22 16 8z" fill="#2d5261" stroke="#609396" strokeWidth="1" />
        <path className="leviathan-cheek" d="M269 53l-7-14h9l12 15m-8 21h9v3h-9m6 22h14v3h-14" fill="#75a7a0" />
        </>}
        </g>
      </svg>
      {kraken ? <div className="kraken-ink" aria-hidden="true" /> : null}
      <div className="leviathan-spray" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--spray-i": i }} />)}</div>
    </section>, container)}
  </>;
}
