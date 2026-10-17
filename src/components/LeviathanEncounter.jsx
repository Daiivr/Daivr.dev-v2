import { createPortal } from "react-dom";
import { ArrowDown, Hand, Radar, Waves, X } from "lucide-react";
import { useEffect, useState } from "react";

// El leviatan y el kraken se dibujan en el lienzo del footer
// (src/lib/pixelWorld/events/deep.js). Aqui queda lo que es DOM: el aviso
// arriba de la pagina (ir al footer, o cerrarlo y quitar la penumbra), la
// penumbra sobre el resto de la pagina, y el panel del encuentro en el valle
// con lo que pasa y los dos gestos de Buddy (Steady y Signal). El panel se pone
// en el lado del footer donde no esta Buddy, para no tapar a la criatura.
export function LeviathanEncounter({ phase, container, response = "", onInteract, creature = "leviathan", buddyX = 0 }) {
  const [dismissed, setDismissed] = useState(false);
  const [used, setUsed] = useState([]);
  const [stageWidth, setStageWidth] = useState(0);
  useEffect(() => {
    if (!container) return undefined;
    const resize = () => setStageWidth(container.clientWidth);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);
  useEffect(() => { if (!phase) { setDismissed(false); setUsed([]); } }, [phase]);
  if (!phase || !container) return null;
  const kraken = creature === "kraken";
  const name = kraken ? "Kraken" : "Leviathan";
  const title = phase === "omen" ? "Something enormous is approaching" : phase === "monster" ? `${name} at the surface` : "Returning to the deep";
  const hudTitle = phase === "omen" ? kraken ? "Tentacles at the edge" : "Contact rising" : phase === "monster" ? `${name} · sighting logged` : "Signal fading";
  const line = phase === "omen" ? kraken ? "Suckers catch the rim. Something is climbing out…" : "A shadow moves beneath the broken floor…"
    : phase === "retreat" ? kraken ? "Its grip loosens. Ink swirls where the giant was." : "A final flash of light. Then, still water."
      : response === "steady" ? kraken ? "Buddy plants his feet. It lets go of the rod." : "Buddy plants his feet. The tension eases."
        : response === "signal" ? kraken ? "One tentacle waves back. Buddy made a friend." : "Its markings glow. It recognizes your signal."
          : kraken ? "It grips the path and hauls itself from the deep." : "Buddy has company. Help him greet the deep.";
  const hudRight = buddyX < (stageWidth || container.clientWidth) / 2;
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
      {!dismissed && <aside className={`leviathan-alert creature-${creature}`} aria-label={`${name} sighting`}>
        <Radar size={24} aria-hidden="true" />
        <div role="status"><small>RARE ENCOUNTER / FOOTER</small><strong>{title}</strong></div>
        <button className="leviathan-visit" onClick={visit}>Go to footer <ArrowDown size={16} aria-hidden="true" /></button>
        <button className="leviathan-dismiss" aria-label="Dismiss sighting alert and dimming" onClick={() => setDismissed(true)}><X size={17} /></button>
      </aside>}
    </>, document.body)}
    {createPortal(<section className={`leviathan-stage creature-${creature} is-${phase} ${hudRight ? "is-right" : ""}`} tabIndex={-1} aria-label={`${name}: ${title}`}>
      <div className="deep-hud">
        <span className="deep-kicker">Abyssal signal</span>
        <b className="deep-title">{hudTitle}</b>
        <p className="deep-line" role="status">{line}</p>
        {phase === "monster" ? <div className="deep-actions">
          <button type="button" disabled={used.includes("steady")} onClick={() => interact("steady")}><Hand size={14} aria-hidden="true" />Steady Buddy</button>
          <button type="button" disabled={used.includes("signal")} onClick={() => interact("signal")}><Waves size={14} aria-hidden="true" />Signal hello</button>
        </div> : null}
      </div>
    </section>, container)}
  </>;
}
