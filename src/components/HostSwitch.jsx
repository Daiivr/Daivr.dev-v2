import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, LockKeyhole, RotateCcw, ShoppingBag } from "lucide-react";
import { MARKET_ITEMS } from "../../shared/buddy-market.mjs";
import { useModalPresence } from "../hooks/useModalPresence";
import { HOSTS, hostById } from "../lib/hostAvatar";

const channel = (host) => String(HOSTS.indexOf(host) + 1).padStart(2, "0");
const gold = (value) => value.toLocaleString("en-US");

// Lo que dice cada anfitriona al abrir la puerta (su primera frase en
// EntrySplash) y una linea sobre ella, para la pantalla grande del selector.
const HOST_CARDS = {
  original: { quote: "oh — hey. didn't hear you walk up.", blurb: "Dai's original front-desk greeter. Keeps the cabinet running — mostly." },
  miku: { quote: "oh — hey! i'm miku.", blurb: "Teal twin-tails and a stage voice. Unlocks with Buddy's Miku costume." },
  komoe: { quote: "oh — hi! i'm komoe.", blurb: "Bunny ears and a big smile. Came home from the Woodland Market." },
  nh02: { quote: "hello! i'm nh-02. happy to see you.", blurb: "A friendly unit from the Woodland Market, built for warm welcomes." },
  kiyosa: { quote: "hello! i'm kiyosa. lovely to see you.", blurb: "Gentle and polite, with a summer outfit from June to August." }
};

// Que falta para cada anfitriona bloqueada y donde se consigue.
function lockFor(host, { coins = 0, species = 0, totalSpecies = 0 }) {
  if (host.unlockItem) {
    const item = MARKET_ITEMS.find((item) => item.id === host.unlockItem);
    const price = item?.price ?? 0;
    return {
      need: `Woodland Market · ${gold(price)} gold${item?.availability ? ` · ${item.availability.toLowerCase()}` : ""}`,
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

// The HOST selector saves who greets the visitor on their next visit. The
// panel is a little casting booth: a big CRT preview of the host you point at
// (her greeting, a line about her, and either "make her the host" or how to
// unlock her) and a channel rack with every host.
export function HostSwitch({ hostId, unlockedIds = ["original"], onChoose, progress = {}, onOpenBuddyModal }) {
  const [open, setOpen] = useState(false);
  const [previewId, setPreviewId] = useState(hostId);
  const [saved, setSaved] = useState("");
  const presence = useModalPresence(open || null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const rackRef = useRef(null);
  const panelId = useId();
  const current = hostById(hostId);
  const preview = hostById(previewId);
  const previewUnlocked = unlockedIds.includes(preview.id);
  const previewActive = preview.id === current.id;
  const previewLock = previewUnlocked ? null : lockFor(preview, progress);
  const card = HOST_CARDS[preview.id] || HOST_CARDS.original;

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

  function toggle() {
    if (!open) { setPreviewId(current.id); setSaved(""); }
    setOpen((value) => !value);
  }

  function choose(id) {
    if (id === current.id || !unlockedIds.includes(id)) return;
    onChoose?.(id);
    setSaved(id);
  }

  function goUnlock(view) {
    setOpen(false);
    onOpenBuddyModal?.(view);
  }

  // Flechas arriba/abajo por el rack de canales (y la vista previa las sigue).
  function onRackKey(event) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const rows = [...(rackRef.current?.querySelectorAll(".host-row") || [])];
    const at = rows.indexOf(document.activeElement);
    const next = rows[(at + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length];
    next?.focus();
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
        onClick={toggle}
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
          <div className={`host-switch-panel-body is-${preview.id}`}>
            <header className="host-switch-heading">
              <span>~/cabinet/gate.host</span>
              <strong>Who opens the gate?</strong>
              <small><b>{unlockedIds.length}</b> / {HOSTS.length} unlocked</small>
            </header>

            {/* La pantalla grande: la anfitriona que se mira (o su señal bloqueada). */}
            <section className={`host-stage is-${preview.id}${previewUnlocked ? "" : " is-locked"}${previewActive ? " is-active" : ""}`} aria-live="polite">
              <div className="host-stage-screen" key={preview.id}>
                <img src={preview.portrait} alt="" width="320" height="400" decoding="async" />
                <span className="host-stage-static" aria-hidden="true" />
                <span className="host-stage-osd" aria-hidden="true">CH {channel(preview)}</span>
                <span className={`host-stage-lamp${previewActive ? " is-on-air" : previewUnlocked ? " is-standby" : " is-locked"}`} aria-hidden="true"><i />{previewActive ? "ON AIR" : previewUnlocked ? "STANDBY" : "NO SIGNAL"}</span>
                {!previewUnlocked ? <span className="host-stage-lock" aria-hidden="true"><LockKeyhole size={22} /></span> : null}
                <div className="host-stage-plate">
                  <strong>{preview.name}</strong>
                  <q>{previewUnlocked ? card.quote : "· · · signal locked · · ·"}</q>
                </div>
              </div>
              <div className="host-stage-info">
                <p>{card.blurb}</p>
                {previewLock ? (
                  <div className="host-stage-unlock">
                    <small>{previewLock.need}</small>
                    <span className="host-meter" style={{ "--fill": previewLock.meter }} aria-hidden="true"><i /></span>
                    <small className="host-stage-progress">{previewLock.detail}</small>
                    <button type="button" className="host-stage-action is-unlock" onClick={() => goUnlock(previewLock.view)}><previewLock.Icon size={14} aria-hidden="true" />{previewLock.action}</button>
                  </div>
                ) : previewActive ? (
                  <div className="host-stage-done">
                    <span><Check size={14} aria-hidden="true" />{saved === preview.id ? `Saved. ${preview.name} opens the gate on your next visit.` : `${preview.name} opens the gate on your next visit.`}</span>
                    {saved === preview.id ? <button type="button" className="host-stage-reload" onClick={() => window.location.reload()}><RotateCcw size={12} aria-hidden="true" />Reload now</button> : null}
                  </div>
                ) : (
                  <button type="button" className="host-stage-action" onClick={() => choose(preview.id)}>Make {preview.name} the gate host</button>
                )}
              </div>
            </section>

            {/* El rack de canales: todas las anfitrionas; al pasar por encima se ven en grande. */}
            <ul className="host-rack" ref={rackRef} onKeyDown={onRackKey} aria-label="Gate hosts">
              {HOSTS.map((host) => {
                const unlocked = unlockedIds.includes(host.id);
                const active = host.id === current.id;
                const lock = unlocked ? null : lockFor(host, progress);
                return (
                  <li key={host.id}>
                    <button
                      className={`host-row is-${host.id}${active ? " is-active" : ""}${unlocked ? "" : " is-locked"}${host.id === preview.id ? " is-previewed" : ""}`}
                      type="button"
                      aria-pressed={host.id === preview.id}
                      aria-label={unlocked ? `${host.name}${active ? ", gate host for your next visit" : ", available"}` : `${host.name}, locked. ${lock.need}`}
                      onPointerEnter={() => setPreviewId(host.id)}
                      onFocus={() => setPreviewId(host.id)}
                      onClick={() => { setPreviewId(host.id); if (unlocked) choose(host.id); }}
                    >
                      <span className="host-row-thumb" aria-hidden="true"><img src={host.portrait} alt="" width="320" height="400" loading="lazy" decoding="async" /></span>
                      <span className="host-row-text">
                        <small>CH {channel(host)}</small>
                        <strong>{host.name}</strong>
                        {lock ? <span className="host-meter is-mini" style={{ "--fill": lock.meter }} aria-hidden="true"><i /></span> : null}
                      </span>
                      <span className={`host-row-chip${active ? " is-active" : unlocked ? "" : " is-locked"}`} aria-hidden="true">
                        {active ? <><Check size={11} />HOST</> : unlocked ? "READY" : <><LockKeyhole size={10} />{Math.round(lock.meter * 100)}%</>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="host-switch-note">Your pick is saved for your next visit. Only that host's 3D model loads then.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
