import {
  Activity,
  Backpack,
  BookOpen,
  Boxes,
  FileClock,
  Gamepad2,
  MessageSquare,
  MonitorCog,
  RadioTower,
  ScrollText,
  Terminal,
  Wrench
} from "lucide-react";
import { navItems, profile } from "../data/site";
import { friendshipProgress } from "../hooks/useBuddyFriendship";
import { cn } from "../lib/cn";
import { DiscordPlayerCard } from "./DiscordPlayerCard";

// Un icono por destino, indexado por ancla: ocho filas de solo texto se leian
// todas iguales y habia que ir contando para encontrar una.
const NAV_ICONS = {
  "#home": Terminal,
  "#now": Activity,
  "#builds": Boxes,
  "#room": RadioTower,
  "#games": Gamepad2,
  "#toolbelt": Wrench,
  "#patchlog": FileClock,
  "#contact": MessageSquare
};

const THEME_MODES = ["crt", "glitch"];

export function Sidebar({ activeSection, buddy, onOpenBuddyModal, theme, onThemeChange }) {
  const displayNavItems = navItems
    .filter(([label]) => label !== "Links")
    .map(([label, href]) => [label === "Contact" ? "Comments" : label, href]);

  const progress = friendshipProgress(buddy.friendship.pets ?? 0);
  const gearTotal = buddy.gearItems.length || 0;

  return (
    <aside className="cabinet-sidebar border-b border-phosphor/20 bg-ink-950/95 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <a className="brand-lockup mb-4" href="#home" aria-label="Dai home">
        <span className="brand-mark" aria-hidden="true">
          <span className="brand-mark-core">
            <span>D</span>
            <span>V</span>
          </span>
          <i className="brand-mark-node" />
        </span>
        <span className="grid min-w-0 gap-0.5">
          <strong className="font-display text-lg leading-none text-white">{profile.handle}</strong>
          <small className="text-xs font-black uppercase text-phosphor-soft/60">React cabinet</small>
        </span>
      </a>

      <DiscordPlayerCard />

      <nav
        className="cabinet-nav grid grid-flow-col auto-cols-[minmax(132px,1fr)] gap-1.5 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-1 lg:overflow-visible"
        aria-label="Primary navigation"
      >
        {displayNavItems.map(([label, href], index) => {
          const Icon = NAV_ICONS[href] || Terminal;
          const isActive = activeSection === href.slice(1);

          return (
            <a
              className={cn("cabinet-nav-link arcade-focus", isActive && "is-active")}
              href={href}
              key={href}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="cabinet-nav-index">{String(index + 1).padStart(2, "0")}</span>
              <Icon className="cabinet-nav-icon" size={15} aria-hidden="true" />
              <strong>{label}</strong>
              <i className="cabinet-nav-marker" aria-hidden="true" />
            </a>
          );
        })}
      </nav>

      <div className="panel buddy-nav-card mt-3 p-3">
        <div className="buddy-nav-head">
          <p className="pixel-label buddy-nav-title">BUDDY</p>
          <span className="buddy-nav-level">lv {String(buddy.friendship.level).padStart(2, "0")}</span>
        </div>

        {/* Las caricias ya se contaban; la barra solo les da un sitio donde
            verse en vez de repetir el nivel dos veces. */}
        <div className="buddy-nav-xp">
          <span style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
        </div>
        <p className="buddy-nav-xp-note">
          {progress.next === null
            ? "max friendship // fully bonded"
            : `${progress.pets}/${progress.next} pets to lv ${String(progress.level + 1).padStart(2, "0")}`}
        </p>

        <div className="buddy-nav-card-stats">
          <span><b>{buddy.activeGearCount}/{gearTotal}</b>gear</span>
          <span><b>{String(buddy.adventure.completedCount).padStart(2, "0")}</b>quests</span>
          <span><b>{progress.pets}</b>pets</span>
        </div>

        <div className="buddy-nav-actions">
          <button className="arcade-focus" type="button" onClick={() => onOpenBuddyModal("inventory")} aria-label="Open Buddy inventory">
            <Backpack size={14} aria-hidden="true" />
            inv
          </button>
          <button className="arcade-focus" type="button" onClick={() => onOpenBuddyModal("quests")}>
            <ScrollText size={14} aria-hidden="true" />
            quests
          </button>
          <button className="arcade-focus" type="button" onClick={() => onOpenBuddyModal("journal")}>
            <BookOpen size={14} aria-hidden="true" />
            journal
          </button>
        </div>
      </div>

      {/* Interruptor de un solo cuerpo: dos botones sueltos no decian que eran
          las dos caras de la misma opcion. */}
      <div className="cabinet-theme-switch mt-3" role="group" aria-label="Cabinet theme">
        {THEME_MODES.map((mode) => (
          <button
            className={cn("arcade-focus", theme === mode && "is-active")}
            key={mode}
            type="button"
            onClick={() => onThemeChange(mode)}
            aria-pressed={theme === mode}
          >
            <MonitorCog size={14} aria-hidden="true" />
            {mode}
          </button>
        ))}
      </div>
    </aside>
  );
}
