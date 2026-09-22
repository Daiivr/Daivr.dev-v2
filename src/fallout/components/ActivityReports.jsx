import { CalendarDays, Clock3, Crosshair, MapPin, Repeat2, ShieldAlert, Skull, Star, Trophy } from "lucide-react";
import { countdown, formatDate } from "../data/time";
import { FeedNote, Unavailable } from "./TerminalPanel";
import "../activities.css";

export function DailyOps({ feed, loading, now, onRetry }) {
  const report = feed.data;
  return <section id="dailyOps" className="fo-panel fo-ops-file" aria-labelledby="fo-ops-title">
    <div className="fo-file-tab" aria-hidden="true">O–04 / TACTICAL BRIEFING</div>
    <header className="fo-assignment-bar"><span><Crosshair size={17} /> DAILY OPERATIONS</span><span className="fo-status"><i />{loading ? "SYNCING" : feed.status === "current" ? "ACTIVE ROTATION" : "UNCONFIRMED"}</span></header>
    <div className="fo-operation-layout"><div className="fo-operation-mission"><div className="fo-operation-seal" aria-hidden="true"><Crosshair size={45} strokeWidth={1.2} /></div><span className="fo-kicker">TODAY’S MISSION</span><h2 id="fo-ops-title" tabIndex={-1}><span className="sr-only">Daily Ops: </span>{report?.mode || "Awaiting orders"}</h2><p>Gear up. Team up. Move out.</p>{report && <div className="fo-operation-reset"><Clock3 size={15} /><span>{feed.status === "current" ? `Resets in ${countdown(report.endsAt, now)}` : "Last report · check in game"}</span></div>}</div>
      {report ? <div className="fo-operation-intel"><dl className="fo-operation-targets"><div><dt><MapPin size={17} /> OPERATION SITE</dt><dd>{report.location}</dd></div><div><dt><Skull size={17} /> HOSTILE FACTION</dt><dd>{report.enemies}</dd></div></dl><div className="fo-operation-conditions"><span className="fo-kicker">KNOW WHAT YOU’RE WALKING INTO</span>{report.mutations.map(mutation => <div key={mutation.name}><ShieldAlert size={20} aria-hidden="true" /><span><strong>{mutation.name}</strong><p>{mutation.description}</p></span></div>)}</div><p className="fo-operation-date">Rotation began {formatDate(report.startsAt, true)}</p></div> : <Unavailable label="DAILY OPS" loading={loading} onRetry={onRetry} />}
    </div><FeedNote feed={feed} loading={loading} />
  </section>;
}

export function Challenges({ kind, feed, loading, now, onRetry }) {
  const weekly = kind === "weekly";
  const report = feed.data;
  return <section id={kind} className={`fo-panel fo-challenge-file${weekly ? " is-weekly" : ""}`} aria-labelledby={`fo-${kind}-title`}>
    <div className="fo-file-tab" aria-hidden="true">{weekly ? "C–06 / WEEKLY ORDERS" : "C–05 / DAILY ORDERS"}</div>
    <header className="fo-orders-cover"><div className="fo-orders-icon" aria-hidden="true">{weekly ? <CalendarDays size={26} /> : <Clock3 size={26} />}</div><div><span className="fo-kicker">{weekly ? "THE LONG GAME" : "MAKE TODAY COUNT"}</span><h2 id={`fo-${kind}-title`} tabIndex={-1}>{weekly ? "Weekly" : "Daily"}<span>challenges</span></h2></div><span className="fo-orders-count">{report?.items.length ?? "—"}<small>ORDERS</small></span></header>
    <div className="fo-orders-reset"><Clock3 size={12} /><span>{loading ? "Receiving assignments…" : report && feed.status === "current" ? `Resets in ≈ ${countdown(report.endsAt, now)}` : "Awaiting current assignments"}</span><i className={feed.status === "current" ? "is-current" : ""} aria-hidden="true" /></div>
    {report ? <><ul className="fo-orders-list">{report.items.map((item, index) => <li key={item.id} className={/Gold Star/i.test(item.name) ? "is-gold-star" : ""}><span className="fo-order-symbol" aria-hidden="true">{/Gold Star/i.test(item.name) ? <Star size={17} /> : /^Repeatable/i.test(item.name) ? <Repeat2 size={16} /> : String(index + 1).padStart(2, "0")}</span><div>{item.falloutFirst && <b className="fo-first-tag">FALLOUT 1ST</b>}<span>{item.name}</span></div><strong className="fo-score-ticket"><span><Trophy size={10} aria-hidden="true" />{item.score.toLocaleString("en-US")}</span><small>S.C.O.R.E.</small></strong></li>)}</ul>
    </> : <Unavailable label={`${kind.toUpperCase()} CHALLENGES`} loading={loading} onRetry={onRetry} />}
    <p className="fo-orders-note">Base S.C.O.R.E. shown. Your rerolled challenges may differ.</p><FeedNote feed={feed} loading={loading} />
  </section>;
}
