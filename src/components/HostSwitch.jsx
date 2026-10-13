import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, LockKeyhole, ShoppingBag } from "lucide-react";
import { MARKET_SPECIALS } from "../../shared/buddy-market.mjs";
import { useModalPresence } from "../hooks/useModalPresence";
import { HOSTS, hostById } from "../lib/hostAvatar";

const channel = (host) => String(HOSTS.indexOf(host) + 1).padStart(2, "0");
const gold = (value) => value.toLocaleString("en-US");

// Que falta para cada anfitriona bloqueada y donde se consigue.
function lockFor(host, { coins = 0, species = 0, totalSpecies = 0 }) {
  if (host.unlockItem) {
    const price = MARKET_SPECIALS.find((item) => item.id === host.unlockItem)?.price ?? 0;
    return {
      need: `Woodland Market · ${gold(price)} gold`,
      meter: price ? Math.min(1, coins / price) : 0,
      detail: `${gold(Math.min(coins, price))} / ${gold(price)} gold`,
      view: "market",
      action: "Visit market",
      Icon: ShoppingBag
    };
  }
  return {
    need: "Unlock Buddy's Miku costume",
    meter: totalSpecies ? Math.min(1, species / totalSpecies) : 0,
    detail: totalSpecies ? `Catch journal ${species} / ${totalSpecies}` : "Complete the catch journal",
    view: "journal",
    action: "Open journal",
    Icon: BookOpen
  };
}

// The HOST selector saves who greets the visitor on their next visit.
export function HostSwitch({ hostId, unlockedIds = ["original"], onChoose, progress = {}, onOpenBuddyModal }) {
  const [open, setOpen] = useState(false);
  const presence = useModalPresence(open || null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();
  const current = hostById(hostId);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function choose(id) {
    setOpen(false);
    if (id !== current.id) onChoose?.(id);
    triggerRef.current?.focus();
  }

  function goUnlock(view) {
    setOpen(false);
    onOpenBuddyModal?.(view);
  }

  return (
    <div className={`host-switch is-${current.id}${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        ref={triggerRef}
        className="host-switch-trigger arcade-focus"
        type="button"
        aria-expanded={open}
        aria-controls={presence.item ? panelId : undefined}
        aria-haspopup="dialog"
        aria-label={`Gate host: ${current.name}. Change host`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="host-switch-face" aria-hidden="true"><img src={current.portrait} alt="" width="320" height="400" decoding="async" /></span>
        <span className="host-switch-readout" aria-hidden="true">
          <small>HOST <b>CH {channel(current)}</b></small>
          <strong>{current.name}</strong>
        </span>
        <span className="host-switch-pips" aria-hidden="true">
          {HOSTS.map((host) => <i key={host.id} className={`is-${host.id}${unlockedIds.includes(host.id) ? " is-unlocked" : ""}${host.id === current.id ? " is-active" : ""}`} />)}
        </span>
        <ChevronDown className="host-switch-chevron" size={14} aria-hidden="true" />
      </button>

      {presence.item ? (
        <div className="host-switch-panel" id={panelId} role="dialog" aria-label="Choose your gate host" data-state={presence.state}>
          <div className="host-switch-panel-body">
          <header className="host-switch-heading">
            <span>~/cabinet/gate.host</span>
            <strong>Who opens the gate?</strong>
            <small>{unlockedIds.length} / {HOSTS.length} unlocked</small>
          </header>
          <ul className="host-switch-cards">
            {HOSTS.map((host) => {
              const unlocked = unlockedIds.includes(host.id);
              const active = host.id === current.id;
              const lock = unlocked ? null : lockFor(host, progress);
              return (
                <li key={host.id} className={`host-card is-${host.id}${active ? " is-active" : ""}${unlocked ? "" : " is-locked"}`}>
                  <button
                    className="host-card-select"
                    type="button"
                    disabled={!unlocked}
                    aria-pressed={unlocked ? active : undefined}
                    aria-label={unlocked ? `${host.name}${active ? ", selected for your next visit" : ", select for your next visit"}` : `${host.name}, locked. ${lock.need}`}
                    onClick={() => choose(host.id)}
                  >
                    <span className="host-card-screen" aria-hidden="true">
                      <img src={host.portrait} alt="" width="320" height="400" loading="lazy" decoding="async" />
                      <span className="host-card-channel">CH {channel(host)}</span>
                      {active ? <span className="host-card-live"><Check size={11} />SELECTED</span> : null}
                      {!unlocked ? <span className="host-card-lock"><LockKeyhole size={18} /></span> : null}
                    </span>
                    <strong>{host.name}</strong>
                    <small>{active ? "Your next visit" : unlocked ? "Choose host" : lock.need}</small>
                  </button>
                  {lock ? (
                    <div className="host-card-unlock">
                      <span className="host-card-meter" style={{ "--fill": lock.meter }} aria-hidden="true"><i /></span>
                      <small>{lock.detail}</small>
                      <button type="button" onClick={() => goUnlock(lock.view)}><lock.Icon size={12} aria-hidden="true" />{lock.action}</button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="host-switch-note">Your choice is saved for your next visit. Switching hosts won't reopen the splash.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
