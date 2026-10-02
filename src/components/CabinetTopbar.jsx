import { Terminal } from "lucide-react";
import { navItems } from "../data/site";
import { useCabinetSignal } from "../lib/cabinetSignals";
import { CabinetTelemetry } from "./CabinetTelemetry";
import { PlayerHub } from "./PlayerHub";

function compactXp(value) {
  if (value >= 100_000) return `${Math.floor(value / 1000)}K`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}

// XP real del pasaporte. Antes era un contador de 87 que se reiniciaba al
// recargar; sin sesion de Discord no hay XP que mostrar, asi que se dice.
function PlayerXpCell() {
  const progression = useCabinetSignal("player")?.progression;
  if (!progression) {
    return (
      <span className="cabinet-telemetry-cell is-score is-guest" title="Connect Discord from Player to earn XP">
        <small>XP</small><b aria-hidden="true">--</b><span className="sr-only">Guest. Connect Discord from Player to earn XP.</span>
      </span>
    );
  }
  const { level, totalXp, levelXp, levelGoal, remainingXp } = progression;
  const detail = `Level ${level}, ${totalXp.toLocaleString("en-US")} lifetime XP, ${remainingXp.toLocaleString("en-US")} XP to level ${level + 1}`;
  return (
    <span className="cabinet-telemetry-cell is-score" title={detail} style={{ "--xp-progress": levelGoal ? Math.min(1, levelXp / levelGoal) : 0 }}>
      <small aria-hidden="true">LV {level}</small><b aria-hidden="true">{compactXp(totalXp)}</b><span className="sr-only">{detail}</span>
    </span>
  );
}

// Conexiones vivas al stream del libro de visitas (cada pestana cuenta una).
// Si el stream se cae no se sabe cuantos hay, y la celda desaparece.
function PresenceCell() {
  const online = useCabinetSignal("online");
  if (!online) return null;
  const label = online === 1 ? "Just you in the arcade" : `${online} in the arcade`;
  return (
    <span className="cabinet-telemetry-cell is-presence" title={label}>
      <small aria-hidden="true"><i className="cabinet-presence-dot" />IN ARCADE</small><b aria-hidden="true">{online}</b><span className="sr-only">{label}</span>
    </span>
  );
}

export function CabinetTopbar({ activeSection, cartPhase, onOpenTerminal, onPlay, theme }) {
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
        <PlayerHub onPlay={onPlay} theme={theme} />
        <button className="cabinet-terminal-button arcade-focus" type="button" onClick={onOpenTerminal} aria-label="Open Terminal">
          <Terminal size={16} aria-hidden="true" /><span>Terminal</span>
        </button>
        <div className="cabinet-telemetry" aria-label="Cabinet telemetry">
          <PlayerXpCell />
          <PresenceCell />
          <CabinetTelemetry />
        </div>
      </div>
    </header>
  );
}
