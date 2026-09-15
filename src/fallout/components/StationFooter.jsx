import { ChevronDown, Radio, Wrench } from "lucide-react";
import { formatSync } from "../data/time";
import { SOURCES } from "../data/sources";
import { SourceLink } from "./TerminalPanel";

export function StationFooter({ lastSync }) {
  return <footer className="fo-diagnostics fo-service-panel">
    <div className="fo-service-heading">
      <span className="fo-service-badge" aria-hidden="true"><Wrench size={22} /></span>
      <div className="fo-service-title"><span>VT–076 / SERVICE RECORD</span><strong>Station diagnostics</strong></div>
      <span className="fo-status"><i />LOCAL INTERFACE READY</span>
    </div>
    <div className="fo-service-sync"><Radio size={15} aria-hidden="true" /><span>LAST SUCCESSFUL TRANSMISSION</span><time>{formatSync(lastSync)}</time></div>
    <details>
      <summary><span><b>REFERENCE MANUAL</b>Data sources & transmission notes</span><ChevronDown size={17} aria-hidden="true" /></summary>
      <div className="fo-service-notes">
        <p>Community reports are checked every 15 minutes. “Source current” means a recently fetched report within its published date window, not independent in-game verification. Timings use US Eastern time; source fetch timestamps use UTC. Expired launch codes are hidden.</p>
        <p>A.X.O.L.O.T.L. is this terminal’s file label for the monthly axolotl fishing rotation. It is not an official in-game acronym. Vault and silo schematics are original. Minerva’s portrait is from The Fallout Wiki. Game imagery belongs to Bethesda Softworks.</p>
        <div className="fo-source-directory"><SourceLink source={{ name: "The Fallout Wiki", url: "https://fallout.wiki/wiki/Minerva" }}>Minerva portrait</SourceLink><SourceLink source={SOURCES.bethesda}>Official Fallout news</SourceLink></div>
      </div>
    </details>
    <div className="fo-service-serial" aria-hidden="true"><span>DAI INDUSTRIES · APPALACHIA</span><i /><span>INSPECTED / 76</span></div>
  </footer>;
}
