import { MapPin } from "lucide-react";
import { countdown, formatDate, selectVisits } from "../data/time";
import { FeedNote, PanelHeading, Unavailable } from "./TerminalPanel";

function InventoryRows({ items }) {
  return <ul className="fo-inventory-list">{items.map((item) => <li key={item.name}><span>{item.name}</span><b>{item.gold.toLocaleString("en-US")} <small>GB</small></b></li>)}</ul>;
}

export function MerchantIntel({ feed, loading, now, onRetry }) {
  const { current, next } = selectVisits(feed.data?.visits, now);
  const visit = current || next;
  const confirmed = feed.status === "current" && !!visit;
  const items = visit?.inventory;
  return <section className="fo-panel fo-merchant" id="minerva" aria-labelledby="fo-minerva-title">
    <PanelHeading number="02" label="MERCHANT INTELLIGENCE" status={loading ? "SYNCING" : !confirmed ? "UNCONFIRMED" : current ? "IN RESIDENCE" : "BETWEEN VISITS"} amber />
    <div className="fo-merchant-file">
      <div className="fo-portrait"><img className="fo-minerva-photo" src="/fallout/minerva.webp" width="400" height="536" alt="Minerva, Fallout 76’s traveling gold bullion merchant" loading="eager" decoding="async" /><span>SUBJECT: M-01</span><span className="fo-file-stamp">CARAVAN<br />INTELLIGENCE</span></div>
      <div className="fo-merchant-brief"><span className="fo-kicker">BLUE RIDGE FIELD DOSSIER</span><h2 id="fo-minerva-title" tabIndex={-1}>Minerva</h2><p className="fo-merchant-role">Gold bullion trader / rare plans</p>
        {visit ? <>
          <span className="fo-micro">{!confirmed ? "LAST REPORTED VISIT" : current ? "CURRENT LOCATION" : "NEXT DESTINATION"}</span>
          <h3><MapPin size={18} aria-hidden="true" />{visit.location}</h3>
          <p>{formatDate(visit.startsAt)} – {formatDate(visit.endsAt)}</p>
          <span className="fo-visit-type">{visit.title.includes("Big Sale") ? "BIG SALE" : "MINERVA’S EMPORIUM"} / LIST {String(visit.list).padStart(2, "0")}</span>
          {confirmed && <div className="fo-merchant-countdown"><span>{current ? "DEPARTS IN" : "ARRIVES IN"}</span><strong>{countdown(current ? visit.endsAt : visit.startsAt, now)}</strong></div>}
        </> : <Unavailable label="MERCHANT REPORT" loading={loading} onRetry={onRetry} />}
      </div>
    </div>
    <div className="fo-inventory"><div className="fo-inventory-heading"><h3>{!confirmed ? "Last reported manifest" : current ? "Current inventory" : "Upcoming manifest"}</h3><span>{items ? `${items.length} PLANS` : "AWAITING REPORT"}</span></div>
      {!current && confirmed && <p className="fo-inventory-note">Minerva is away. These are the source’s listed offers for her next visit.</p>}
      {!confirmed && items && <p className="fo-inventory-note">Archived inventory — current availability is unconfirmed.</p>}
      {items ? <><InventoryRows items={items.slice(0, 4)} />{items.length > 4 && <details className="fo-manifest"><summary>Open complete manifest <span>+{items.length - 4} PLANS</span></summary><InventoryRows items={items.slice(4)} /></details>}</> : <p className="fo-inventory-note">Item-level inventory has not been confirmed in this report. Check back after the next report update.</p>}
      {next && current && <p className="fo-next-stop">NEXT STOP <strong>{next.location}</strong> {formatDate(next.startsAt)} – {formatDate(next.endsAt)}</p>}
      {visit && <p className="fo-visit-hours">Visit opens {formatDate(visit.startsAt, true)}. Closes {formatDate(visit.endsAt, true)}.</p>}
    </div>
    <FeedNote feed={feed} loading={loading} />
  </section>;
}
