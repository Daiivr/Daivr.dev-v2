import { BookOpen, Fish, MapPin, Radio, Radiation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { countdown, selectVisits } from "../data/time";
import { GUIDES_PATH } from "../data/pages";

const CHANNELS = [
  { id: "codes", label: "Launch codes", icon: Radiation, channel: "SILO NETWORK" },
  { id: "minerva", label: "Minerva", icon: MapPin, channel: "CARAVAN SIGNAL" },
  { id: "axolotl", label: "Fishing", icon: Fish, channel: "FIELD RESEARCH" },
  { id: "events", label: "Intel & events", icon: Radio, channel: "COMMUNITY RADIO" },
  { id: "guides", label: "Guides", icon: BookOpen, channel: "FIELD LIBRARY", reference: true },
];

export function FieldSignal({ feeds, loading, connected }) {
  return <div className="fo-rail-signal">
    <div><Radio size={14} aria-hidden="true" /><span>RECEPTION</span><b>{connected}/4</b></div>
    <div className="fo-reception-bars" aria-hidden="true">{CHANNELS.filter(channel => !channel.reference).map(({ id }) => <i key={id} className={feeds[id].status === "current" ? "is-current" : ""} />)}</div>
    <span>{loading ? "Receiving field reports…" : connected === 4 ? "All frequencies current." : connected ? "Partial signal. Check report dates." : "No current reports received."}</span>
  </div>;
}

export function FieldNavigation({ feeds, loading, now, booting }) {
  const navRef = useRef(null);
  const selectedRef = useRef("codes");
  const [active, setActive] = useState("codes");
  const { current, next } = selectVisits(feeds.minerva.data?.visits, now);
  const visit = current || next;
  const detail = {
    codes: feeds.codes.status === "current" && feeds.codes.data ? `Reset in ${countdown(feeds.codes.data.endsAt, now)}` : "Awaiting confirmation",
    minerva: feeds.minerva.status === "current" && visit ? `${current ? "At" : "Next:"} ${visit.location}` : "Awaiting sighting",
    axolotl: feeds.axolotl.status === "current" ? feeds.axolotl.data?.name : "Awaiting field report",
    events: feeds.events.status === "current" ? "Latest transmissions" : "Awaiting bulletin",
    guides: "Collectables & field notes",
  };
  useEffect(() => {
    if (booting) return;
    const root = navRef.current?.closest(".fallout-page");
    const sections = CHANNELS.map(({ id }) => root?.querySelector(`#${id}`)).filter(Boolean);
    const visibility = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target.id, entry));
      const visible = [...visibility.values()].filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible.some((entry) => entry.target.id === selectedRef.current) ? selectedRef.current : visible[0].target.id);
    }, { root, rootMargin: "-16% 0px -55% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [booting]);
  const channelIndex = CHANNELS.findIndex(({ id }) => id === active);
  return <>
    <div className="fo-channel-dial" aria-hidden="true">
      <div className="fo-dial-caption"><span>FIELD RECEIVER</span><b>CH. 0{channelIndex + 1}</b></div>
      <div className="fo-dial-scale" style={{ gridTemplateColumns: `repeat(${CHANNELS.length}, 1fr)` }}><i style={{ left: `${(channelIndex + .5) / CHANNELS.length * 100}%` }} />{CHANNELS.map(({ id }, index) => <span key={id}>0{index + 1}</span>)}</div>
      <span className="fo-dial-station">{CHANNELS[channelIndex].channel}</span>
    </div>
    <nav ref={navRef} className="fo-nav fo-field-nav" style={{ "--fo-channel-count": CHANNELS.length }} aria-label="Fallout terminal directory">{CHANNELS.map(({ id, label, icon: Icon, reference }, index) => <a href={reference ? GUIDES_PATH : `#${id}`} key={id} aria-current={active === id ? "location" : undefined} onClick={() => { selectedRef.current = id; setActive(id); }}>
      <span className="fo-directory-number">0{index + 1}</span><span className="fo-selector-cap"><Icon size={18} aria-hidden="true" /></span><span className="fo-directory-copy"><strong>{label}</strong><small>{loading && !reference ? "Receiving report…" : detail[id]}</small></span><i className={feeds[id]?.status === "current" ? "is-current" : ""} aria-hidden="true" />
    </a>)}</nav>
  </>;
}
