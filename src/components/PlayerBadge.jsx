import { Bug, Fish, Flame, Gamepad2, HeartHandshake, MessageSquare, Moon, Music2, Radar, Shield, Terminal, Trophy } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function BadgeEmblem({ badge }) {
  const id = useId().replace(/:/g, "");
  const paint = (name) => `url(#${id}-${name})`;
  const Icon = badge.metric === "streak" ? Flame : badge.metric === "completions" ? Trophy
    : ({ boot: Terminal, fish: Fish, sighting: Radar, night: Moon, bug: Bug, music: Music2 }[badge.icon] || { signal: MessageSquare, buddy: HeartHandshake, player: Gamepad2 }[badge.id] || Shield);
  return <span className={`badge-emblem badge-tier-${badge.tier || "base"}`} aria-hidden="true">
    <svg className="badge-emblem-frame" viewBox="0 0 64 72" fill="none">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".6"/><stop offset=".2" stopColor="#fff" stopOpacity=".12"/><stop offset=".44" stopColor="#000" stopOpacity=".5"/><stop offset=".52" stopColor="#fff" stopOpacity=".48"/><stop offset=".72" stopColor="#000" stopOpacity=".18"/><stop offset="1" stopColor="#fff" stopOpacity=".3"/></linearGradient>
        <linearGradient id={`${id}-enamel`} x2=".3" y2="1"><stop stopColor="currentColor" stopOpacity=".32"/><stop offset=".48" stopColor="#080f16" stopOpacity=".2"/><stop offset="1" stopColor="#000" stopOpacity=".65"/></linearGradient>
        <pattern id={`${id}-brushing`} width="4" height="3" patternUnits="userSpaceOnUse"><path d="M0 .5h3M2 2h2" stroke="#fff" strokeOpacity=".16" strokeWidth=".45"/></pattern>
        <pattern id={`${id}-stitch`} width="3" height="4" patternUnits="userSpaceOnUse"><path d="m0 0 3 3m-1-4 3 3" stroke="#fff" strokeOpacity=".17" strokeWidth=".6"/></pattern>
        <clipPath id={`${id}-face`}><path d="M16 8H48L56 16V41L47 51 32 58 17 51 8 41V16Z"/></clipPath>
      </defs>
      <path className="badge-ribbon" d="M15 45 10 70 23 64 31 70 32 49M49 45 54 70 41 64 33 70 32 49" />
      <path d="M15 45 10 70 23 64 31 70 32 49M49 45 54 70 41 64 33 70 32 49" fill={paint("stitch")} />
      <path d="m18 54-3 10 8-4 5 5m18-11 3 10-8-4-5 5" stroke="currentColor" strokeWidth=".65" strokeDasharray="1 2" opacity=".65"/>
      <path className="badge-shield" d="M14 3H50L61 14V43L50 55 32 63 14 55 3 43V14Z" />
      <path d="M14 3H50L61 14V43L50 55 32 63 14 55 3 43V14Z" fill={paint("metal")} />
      <path d="M14 3H50L61 14V43L50 55 32 63 14 55 3 43V14Z" fill={paint("brushing")} />
      <path className="badge-inset" d="M16 8H48L56 16V41L47 51 32 58 17 51 8 41V16Z" />
      <path d="M16 8H48L56 16V41L47 51 32 58 17 51 8 41V16Z" fill={paint("enamel")} />
      <g clipPath={paint("face")}><path d="M0 27 51 0h13L0 40Z" fill="#fff" opacity=".055"/><path className="badge-foil-glint" d="m-26 0 22-8 30 80H4Z" fill="#fff" opacity=".24"/></g>
      <path d="M14 5H49L59 15M5 16V42L15 53" stroke="#fff" strokeOpacity=".5" strokeWidth=".7"/><path d="m16 56 16 6 18-9 10-11" stroke="#000" strokeOpacity=".7" strokeWidth="1.4"/>
      <g fill="currentColor" stroke="#060c10" strokeWidth=".6"><circle cx="12" cy="13" r="1.1"/><circle cx="52" cy="13" r="1.1"/><circle cx="13" cy="44" r="1"/><circle cx="51" cy="44" r="1"/></g>
      <path className="badge-detail" d="M15 19V15H21M43 15H49V19M20 47 32 53 44 47" />
    </svg>
    <Icon className="badge-emblem-icon" size={24} strokeWidth={1.7} />
    {badge.target ? <b className="badge-emblem-number">{badge.target}</b> : <span className="badge-emblem-star">✦</span>}
  </span>;
}

export function PlayerBadge({ badge, tooltip = false }) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);
  const closeTimer = useRef(null);
  const [position, setPosition] = useState(null);
  const show = () => { clearTimeout(closeTimer.current); setVisible(true); };
  const hide = () => { closeTimer.current = setTimeout(() => setVisible(false), 120); };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useLayoutEffect(() => {
    if (!visible || !tooltip) return;
    const update = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const tip = tooltipRef.current?.getBoundingClientRect();
      if (!anchor || !tip) return;
      const left = Math.max(10, Math.min(innerWidth - tip.width - 10, anchor.left + (anchor.width - tip.width) / 2));
      const top = anchor.top - tip.height - 8 >= 10 ? anchor.top - tip.height - 8 : Math.min(innerHeight - tip.height - 10, anchor.bottom + 8);
      setPosition({ left, top: Math.max(10, top), "--badge-color": getComputedStyle(anchorRef.current).getPropertyValue("--badge-color") || "#3fff97" });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(tooltipRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [visible, tooltip]);
  return <span ref={anchorRef} className={`player-badge badge-tier-${badge.tier || "base"} ${tooltip ? "player-badge-interactive" : ""}`}
    {...(tooltip ? { tabIndex: 0, role: "button", "aria-label": `${badge.label} badge details`, "aria-describedby": visible ? tooltipId : undefined,
      onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: () => setVisible(false), onClick: show,
      onKeyDown: (event) => { if (event.key === "Escape") { event.stopPropagation(); setVisible(false); } else if (["Enter", " "].includes(event.key)) { event.preventDefault(); setVisible((value) => !value); } }
    } : {})}>
    <BadgeEmblem badge={badge} />
    <span className="player-badge-caption"><strong>{badge.label}</strong><small>{badge.secret ? "Secret discovered" : badge.metric === "streak" ? `${badge.target}-day streak` : badge.metric === "completions" ? `${badge.target} daily win${badge.target === 1 ? "" : "s"}` : "Cabinet member"}</small></span>
    {tooltip && visible ? createPortal(<span ref={tooltipRef} id={tooltipId} role="tooltip" className={`player-badge-tooltip badge-tier-${badge.tier || "base"}`} style={{ ...position, visibility: position ? "visible" : "hidden" }} onMouseEnter={show} onMouseLeave={hide}><small>{badge.secret ? "SECRET DISCOVERED" : "BADGE UNLOCKED"}</small><strong>{badge.label}</strong><span>{badge.description}</span><b>+{badge.xp?.toLocaleString()} XP earned</b></span>, document.body) : null}
  </span>;
}
