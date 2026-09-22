import { ArrowLeft, Crosshair, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { ACTIVITY_PAGES, FALLOUT_PAGES } from "./data/pages";
import { effectiveFeed } from "./data/time";
import { useFalloutIntel } from "./services/useFalloutIntel";
import { FalloutBackdrop } from "./components/FalloutBackdrop";
import { Challenges, DailyOps } from "./components/ActivityReports";
import "./fallout.css";
import "./field-station.css";
import "./operations.css";
import "./activity-pages.css";

export default function ActivityPage({ path }) {
  const page = ACTIVITY_PAGES[path];
  const { intel, loading, refresh } = useFalloutIntel();
  const [now, setNow] = useState(Date.now);
  const feed = effectiveFeed(intel[page.key], now, true);
  useEffect(() => { setNow(Date.now()); }, [intel]);
  useEffect(() => {
    const previous = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const description = meta?.content;
    document.title = FALLOUT_PAGES[path].title;
    if (meta) meta.content = FALLOUT_PAGES[path].description;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(timer); document.title = previous; if (meta) meta.content = description; };
  }, [path]);
  return <div className="fallout-page fo-activity-page"><FalloutBackdrop /><div className="fo-interface">
    <a className="fo-skip" href="#activity-main">Skip to report</a>
    <header className="fo-report-sitebar"><a href="/fallout"><Crosshair size={25} /><span>WASTELAND<small>OPERATIONS / FIELD REPORTS</small></span></a><a href="/fallout"><ArrowLeft size={14} />Operations desk</a></header>
    <main id="activity-main"><header className="fo-report-intro"><div><span className="fo-kicker">APPALACHIA / FIELD DISPATCH</span><h1>{page.label}</h1><p>{page.subtitle}</p></div><button type="button" onClick={refresh} disabled={loading}><RefreshCw size={15} className={loading ? "fo-spin" : ""} />{loading ? "Syncing…" : "Refresh report"}</button></header>
      <nav className="fo-report-tabs" aria-label="Field reports">{Object.entries(ACTIVITY_PAGES).map(([href, item]) => <a key={href} href={href} aria-current={href === path ? "page" : undefined}>{item.label}<span aria-hidden="true">↗</span></a>)}</nav>
      {page.key === "dailyOps" ? <DailyOps feed={feed} loading={loading} now={now} onRetry={refresh} /> : <Challenges kind={page.key} feed={feed} loading={loading} now={now} onRetry={refresh} />}
      <footer className="fo-report-footer"><a href="/fallout"><ArrowLeft size={13} />Back to operations desk</a><span>FALLOUT 76 / COMMUNITY FIELD REPORT</span></footer>
    </main>
  </div></div>;
}
