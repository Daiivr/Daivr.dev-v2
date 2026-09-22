import { ArrowUpRight, CalendarDays, Clock3, Crosshair } from "lucide-react";
import { ACTIVITY_PAGES } from "../data/pages";
import "../activity-pages.css";

const ICONS = { dailyOps: Crosshair, daily: Clock3, weekly: CalendarDays };
export function ActivityLinks({ feeds }) {
  return <section className="fo-dispatch-links" aria-label="Daily and weekly field reports">
    <header><span className="fo-kicker">YOUR NEXT ASSIGNMENT</span><h2>Field reports</h2><p>Pick a briefing and head out.</p></header>
    <div>{Object.entries(ACTIVITY_PAGES).map(([path, page]) => { const Icon = ICONS[page.key]; const feed = feeds[page.key]; return <a key={path} href={path}><Icon size={24} strokeWidth={1.4} aria-hidden="true" /><span><strong>{page.label}</strong><small>{feed.status !== "current" ? "Open field report" : page.key === "dailyOps" ? feed.data.mode : `${feed.data.items.length} assignments`}</small></span><ArrowUpRight size={17} aria-hidden="true" /></a>; })}</div>
  </section>;
}
