import { Fish, Gift } from "lucide-react";
import { useState } from "react";
import { REWARDS } from "../data/sources";
import { countdown, formatDate, isInWindow } from "../data/time";
import { FeedNote, PanelHeading, SourceLink, Unavailable } from "./TerminalPanel";

function SpecimenImage({ specimen }) {
  const [failed, setFailed] = useState(false);
  const src = specimen?.name === "Shadow Axolotl" ? "/fallout/shadow-axolotl.webp" : specimen?.imageUrl;
  return <div className="fo-specimen">
    {src && !failed ? <img className="fo-axolotl-photo" src={src} width="512" height="512" alt={`${specimen.name} in Fallout 76`} loading="eager" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <div className="fo-photo-unavailable"><Fish size={32} aria-hidden="true" /><span>SPECIMEN IMAGE UNAVAILABLE</span></div>}
    <span className="fo-specimen-caption">FALLOUT 76 / SPECIMEN REFERENCE</span>
  </div>;
}

export function ResearchFile({ feed, loading, now, onRetry }) {
  const specimen = feed.data;
  const current = feed.status === "current" && !!specimen;
  const reward = current && REWARDS.find((item) => item.species === specimen.name && isInWindow(item, now));
  const progress = current ? Math.max(0, Math.min(100, (now - Date.parse(specimen.startsAt)) / (Date.parse(specimen.endsAt) - Date.parse(specimen.startsAt)) * 100)) : 0;
  return <section className="fo-panel fo-research" id="axolotl" aria-labelledby="fo-axolotl-title">
    <PanelHeading number="03" label="BIOLOGICAL RESEARCH" status="FIELD FILE" />
    <div className="fo-research-content"><span className="fo-kicker">MONTHLY FISHING OBSERVATORY</span><h2 id="fo-axolotl-title" tabIndex={-1}>A.X.O.L.O.T.L.</h2><div className="fo-specimen-label"><span>{specimen?.month || "SPECIMEN DATA PENDING"}</span><span>{current ? "ROTATION ACTIVE" : "UNCONFIRMED"}</span></div>
      <SpecimenImage key={`${specimen?.name}:${specimen?.imageUrl}`} specimen={specimen} />
      {specimen ? <><h3>{specimen.name}</h3><div className="fo-habitats"><Fish size={17} aria-hidden="true" /><span>{specimen.regions.join(" + ")}</span></div><p className="fo-research-note">{current ? "This month’s rare catch. Find fishable water in the reported regions." : "Last known specimen. The current fishing rotation has not been confirmed."}</p>
        <div className="fo-research-window"><span>{formatDate(specimen.startsAt)} – {formatDate(specimen.endsAt)}</span>{current && <><div className="fo-rotation-track" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div><strong>{countdown(specimen.endsAt, now)} remaining</strong></>}</div>
      </> : <Unavailable label="SPECIMEN REPORT" loading={loading} onRetry={onRetry} />}
      {reward ? <div className="fo-reward"><Gift size={22} aria-hidden="true" /><div><span className="fo-micro">RELATED MONTHLY REWARD</span><h4>{reward.title}</h4><p>{reward.description}</p><SourceLink source={reward.source} /><small>Bulletin reviewed {reward.reviewedAt}</small></div></div> : <p className="fo-research-note">Check Bethesda’s Atomic Shop bulletins for separately confirmed monthly rewards.</p>}
    </div>
    <FeedNote feed={feed} loading={loading} />
  </section>;
}
