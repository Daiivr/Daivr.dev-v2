import { ExternalLink, Radio } from "lucide-react";
import { formatSync } from "../data/time";

export function SourceLink({ source, children }) {
  return <a className="fo-source" href={source.url} target="_blank" rel="noreferrer">{children || source.name}<ExternalLink size={12} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>;
}

export function PanelHeading({ number, label, status, amber = false }) {
  return <div className={`fo-panel-heading${amber ? " is-amber" : ""}`}><span><b>{number}</b>{label}</span><span className="fo-status"><i />{status}</span></div>;
}

export function FeedNote({ feed, loading }) {
  return <div className="fo-feed-note"><span>COMMUNITY REPORT</span><span>{loading ? "Checking source…" : `Source checked: ${formatSync(feed.fetchedAt)}`}{feed.status === "stale" ? " · STALE COPY" : ""}</span></div>;
}

export function Unavailable({ loading, label = "DATABASE", onRetry }) {
  return <div className={`fo-unavailable${loading ? " is-loading" : ""}`}>
    <Radio size={24} aria-hidden="true" />
    <strong>{loading ? `ACCESSING ${label}…` : `${label} UNAVAILABLE`}</strong>
    <p>{loading ? "Requesting the latest community report." : "No current report could be confirmed. Reconnect to try again."}</p>
    {loading ? <div className="fo-loading-track" aria-hidden="true"><i /></div> : <button className="fo-text-button" onClick={onRetry} type="button">Retry connection ↗</button>}
  </div>;
}
