import { MonitorCog } from "lucide-react";
import { navItems, profile } from "../data/site";
import { cn } from "../lib/cn";
import { DiscordPlayerCard } from "./DiscordPlayerCard";

export function Sidebar({ activeSection, theme, onThemeChange }) {
  const displayNavItems = navItems
    .filter(([label]) => label !== "Links")
    .map(([label, href]) => [label === "Contact" ? "Comments" : label, href]);

  return (
    <aside className="border-b border-phosphor/20 bg-ink-950/95 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
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

      <nav className="grid grid-flow-col auto-cols-[minmax(118px,1fr)] gap-2 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-1 lg:overflow-visible" aria-label="Primary navigation">
        {displayNavItems.map(([label, href], index) => (
          <a
            className={cn(
              "arcade-focus grid min-h-12 grid-cols-[32px_minmax(0,1fr)] items-center border border-phosphor/15 px-3 text-sm font-black text-phosphor-soft/70 transition hover:border-phosphor/50 hover:bg-phosphor/10 hover:text-white",
              activeSection === href.slice(1) && "border-phosphor/70 bg-phosphor/10 text-white"
            )}
            href={href}
            key={href}
          >
            <span className="text-phosphor">{String(index + 1).padStart(2, "0")}</span>
            <strong>{label}</strong>
          </a>
        ))}
      </nav>

      <div className="panel mt-4 p-3">
        <p className="pixel-label mb-3">LOADOUT</p>
        <div className="flex flex-wrap gap-2">
          {profile.tags.map((tag) => (
            <span className="tag-chip" key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {["crt", "glitch"].map((mode) => (
          <button
            className={cn(
              "arcade-focus relative inline-flex min-h-10 items-center gap-2 overflow-hidden border px-3 text-xs font-black uppercase transition",
              theme === mode
                ? "border-phosphor bg-phosphor text-ink-950 shadow-[0_0_24px_rgba(63,255,151,.34)]"
                : "border-phosphor/20 bg-ink-950/70 text-phosphor-soft/70 hover:border-phosphor/55 hover:bg-phosphor/10 hover:text-white"
            )}
            key={mode}
            type="button"
            onClick={() => onThemeChange(mode)}
            aria-pressed={theme === mode}
          >
            {theme === mode ? (
              <span className="absolute inset-y-1 left-1 w-1 bg-ink-950/70" aria-hidden="true" />
            ) : null}
            <MonitorCog size={14} aria-hidden="true" />
            {mode}
          </button>
        ))}
      </div>
    </aside>
  );
}
