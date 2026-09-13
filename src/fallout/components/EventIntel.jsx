import { formatDate } from "../data/time";
import { FeedNote, PanelHeading, Unavailable } from "./TerminalPanel";
import { RadioDiagram } from "./TerminalArt";

export function EventIntel({ feed, loading, now, onRetry }) {
  const events = (feed.data || []).filter((event) => !event.title.includes("Minerva") && Date.parse(event.endsAt || event.startsAt) > (event.endsAt ? now : now - 86400000)).slice(0, 4);
  return <section className="fo-panel fo-events" id="events" aria-labelledby="fo-events-title">
    <PanelHeading number="04" label="WASTELAND FREQUENCIES" status={feed.status === "current" ? "COMMUNITY BULLETIN" : "SIGNAL UNCONFIRMED"} amber />
    <div className="fo-events-body"><div className="fo-events-intro"><RadioDiagram /><div><span className="fo-kicker">KEEP YOUR RADIO ON.</span><h2 id="fo-events-title" tabIndex={-1}>Incoming transmissions</h2><p>Events, resets, and things worth leaving the vault for.</p></div></div>
      <div className="fo-event-list">{events.length ? events.map((event, index) => <article className="fo-event" key={event.url}><span className="fo-event-number">0{index + 1}</span><div><span className="fo-micro">{feed.status !== "current" ? "LAST REPORTED" : Date.parse(event.startsAt) > now ? "UPCOMING" : event.endsAt ? "IN PROGRESS" : "SCHEDULED TODAY"}</span><h3>{event.title}</h3><p>{formatDate(event.startsAt, true)}{event.endsAt ? ` – ${formatDate(event.endsAt, true)}` : " · End time not published"}</p></div></article>) : <Unavailable label="EVENT BULLETIN" loading={loading} onRetry={onRetry} />}</div>
    </div><FeedNote feed={feed} loading={loading} />
  </section>;
}
