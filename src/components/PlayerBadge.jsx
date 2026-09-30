import { Flame, Gamepad2, HeartHandshake, MessageSquare, Shield, Trophy } from "lucide-react";

export function BadgeEmblem({ badge }) {
  const Icon = badge.metric === "streak" ? Flame : badge.metric === "completions" ? Trophy
    : ({ signal: MessageSquare, buddy: HeartHandshake, player: Gamepad2 }[badge.id] || Shield);
  return <span className={`badge-emblem badge-tier-${badge.tier || "base"}`} aria-hidden="true">
    <svg className="badge-emblem-frame" viewBox="0 0 64 72" fill="none">
      <path className="badge-ribbon" d="M15 45 10 70 23 64 31 70 32 49M49 45 54 70 41 64 33 70 32 49" />
      <path className="badge-shield" d="M14 3H50L61 14V43L50 55 32 63 14 55 3 43V14Z" />
      <path className="badge-inset" d="M16 8H48L56 16V41L47 51 32 58 17 51 8 41V16Z" />
      <path className="badge-detail" d="M15 19V15H21M43 15H49V19M20 47 32 53 44 47" />
    </svg>
    <Icon className="badge-emblem-icon" size={24} strokeWidth={1.7} />
    {badge.target ? <b className="badge-emblem-number">{badge.target}</b> : <span className="badge-emblem-star">✦</span>}
  </span>;
}

export function PlayerBadge({ badge }) {
  return <span className={`player-badge badge-tier-${badge.tier || "base"}`} title={badge.description}>
    <BadgeEmblem badge={badge} />
    <span className="player-badge-caption"><strong>{badge.label}</strong><small>{badge.metric === "streak" ? `${badge.target}-day streak` : badge.metric === "completions" ? `${badge.target} daily win${badge.target === 1 ? "" : "s"}` : "Cabinet member"}</small></span>
  </span>;
}
