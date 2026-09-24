import { Terminal } from "lucide-react";
import { navItems } from "../data/site";
import { CabinetTelemetry } from "./CabinetTelemetry";

export function CabinetTopbar({ activeSection, score, cartPhase, onOpenTerminal }) {
  const index = Math.max(0, navItems.findIndex(([, href]) => href === `#${activeSection}`));
  const [label, href] = navItems[index];

  return (
    <header className={`cart-slot cabinet-topbar${cartPhase === "insert" ? " is-cart-seat" : ""}`}>
      <div className="cabinet-topbar-location">
        <span className="cabinet-topbar-slot" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="cabinet-topbar-route" key={href}>
          <span>~/cabinet<span aria-hidden="true"> / </span><b>{href.slice(1)}</b></span>
          <strong>{label}<i aria-hidden="true" /></strong>
        </div>
        <div className="cabinet-topbar-track" aria-hidden="true">
          {navItems.map(([, route], step) => <i className={step === index ? "is-active" : ""} key={route} />)}
        </div>
      </div>
      <div className="cabinet-topbar-controls">
        <button className="cabinet-terminal-button arcade-focus" type="button" onClick={onOpenTerminal} aria-label="Open Terminal">
          <Terminal size={16} aria-hidden="true" /><span>Terminal</span>
        </button>
        <div className="cabinet-telemetry" aria-label="Cabinet telemetry">
          <span className="cabinet-telemetry-cell is-score"><small>XP</small><b data-score>{String(score).padStart(3, "0")}</b></span>
          <CabinetTelemetry />
        </div>
      </div>
    </header>
  );
}
