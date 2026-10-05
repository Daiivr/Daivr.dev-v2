import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, BookOpen, Gamepad2, Headphones, Moon, Radio, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiscordDeskControls } from "./DiscordDeskControls";
import { DiscordDeskKeepsakes } from "./DiscordDeskKeepsakes";

const objects = {
  notebook: { title: "Dai’s notebook", description: "A little about the person behind the screen.", label: "Open Dai’s notebook" },
  music: { title: "On repeat", description: "What Dai is listening to, live from Discord.", label: "Pick up the iPod" },
  game: { title: "One more level", description: "What Dai is playing, live from Discord.", label: "Pick up the Game Boy" }
};

function NotebookCover({ opening = false }) {
  return <span className={`tabletop-book-cover${opening ? " is-opening" : ""}`} aria-hidden="true">
    <span className="tabletop-book-spine" />
    <span className="tabletop-book-edition">PERSONAL ARCHIVE / VOL. 01</span>
    <span className="tabletop-book-title">Little things<br />from my<br /><em>digital life.</em></span>
    <span className="tabletop-book-sticker"><Gamepad2 size={36} /><span>just one<br />more level</span></span>
    <span className="tabletop-book-signature">Dai’s notebook <ArrowUpRight size={15} /></span>
    <span className="tabletop-book-elastic" />
    <span className="tabletop-book-ribbon" />
  </span>;
}

function DeskEarphones() {
  return <div className="tabletop-earphones" aria-hidden="true">
    <svg viewBox="0 0 320 440" fill="none" focusable="false">
      <defs><linearGradient id="desk-earbud-shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffbee" /><stop offset=".55" stopColor="#d6dbcf" /><stop offset="1" stopColor="#8b9d92" /></linearGradient></defs>
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M151 64c53-57 133 14 135 107 2 74 18 162-34 211-38 36-151 35-188-2-43-42-56-146-16-207" stroke="#0b211b66" strokeWidth="6" transform="translate(2 3)" />
        <path d="M151 64c53-57 133 14 135 107 2 74 18 162-34 211-38 36-151 35-188-2-43-42-56-146-16-207" stroke="#bec9b9" strokeWidth="3" />
        <path d="M48 173C25 133 14 76 32 34M48 173c38-24 55-74 45-121" stroke="#0b211b55" strokeWidth="5" transform="translate(2 3)" />
        <path d="M48 173C25 133 14 76 32 34M48 173c38-24 55-74 45-121" stroke="#dce0cf" strokeWidth="2.5" />
        <path d="m48 173-5 11" stroke="#e5e7d8" strokeWidth="5" />
        <path d="m151 64 5 10" stroke="#a8b6a3" strokeWidth="6" /><path d="m156 74 3 6" stroke="#d8bd7c" strokeWidth="3" />
      </g>
      <g transform="translate(31 24) rotate(22)"><ellipse rx="12" ry="15" fill="url(#desk-earbud-shell)" stroke="#a3b09f" /><ellipse cx="-3" cy="-2" rx="6" ry="9" fill="#64796b" /><path d="M-5-6v8m4-10v12" stroke="#a8ba9e" strokeWidth="1.5" /><rect x="5" y="5" width="7" height="24" rx="3.5" fill="url(#desk-earbud-shell)" /><path d="m7 13 2 0" stroke="#879b8c" /></g>
      <g transform="translate(88 39) rotate(-27)"><ellipse rx="12" ry="15" fill="url(#desk-earbud-shell)" stroke="#a3b09f" /><ellipse cx="3" cy="-2" rx="6" ry="9" fill="#64796b" /><path d="M2-7v12m4-10v8" stroke="#a8ba9e" strokeWidth="1.5" /><rect x="-11" y="5" width="7" height="24" rx="3.5" fill="url(#desk-earbud-shell)" /></g>
    </svg>
  </div>;
}

function NotebookInspection({ children, phase }) {
  return <div className={`tabletop-open-book is-${phase}`}>
    {children}
    {phase !== "reading" && <NotebookCover opening />}
  </div>;
}

function DevicePreview({ kind, activity, image, signal }) {
  const music = kind === "music";
  return <span className={`tabletop-device tabletop-${kind} ${activity ? "is-on" : "is-off"}`} aria-hidden="true">
    <span className="tabletop-device-brand">{music ? "daiPod" : "DAI BOY"}<i /><small>{music ? "♪" : "COLOR"}</small></span>
    <span className="tabletop-lcd">
      {activity ? <>
        <span className="tabletop-lcd-bar">{music ? "Now playing" : "Currently playing"}<span>▰</span></span>
        {image ? <img src={image} alt="" /> : music ? <Headphones size={36} /> : <Gamepad2 size={40} />}
        <strong>{activity.name}</strong>
        <small>{activity.detail || activity.state || "Live from Discord"}</small>
        {music ? <span className="tabletop-equalizer"><i /><i /><i /><i /><i /><i /><i /></span> : <span className="tabletop-playing">● IN GAME</span>}
      </> : <span className="tabletop-screen-sleep"><Moon size={22} /><span>{signal || "POWER OFF"}</span></span>}
    </span>
    <DiscordDeskControls music={music} handheld={!music} />
    <span className="tabletop-device-engraving">{music ? "a soundtrack for the everyday" : "DOT MATRIX WITH SOUL"}</span>
  </span>;
}

export function DiscordTabletop({ notebook, activities, renderActivities, status, statusKey, error, loading, updatedAt, activityImages, onInspect }) {
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("reading");
  const [origin, setOrigin] = useState({});
  const [portalContainer, setPortalContainer] = useState(null);
  const trigger = useRef(null);
  const pickupSource = useRef(null);
  const signal = error ? "SIGNAL LOST" : loading ? "SYNCING" : null;
  const liveActivities = error || loading || statusKey === "offline" ? [] : activities;
  const music = liveActivities.filter((activity) => activity.type === 2);
  const games = liveActivities.filter((activity) => activity.type === 0);
  const otherActivities = liveActivities.filter((activity) => activity.type !== 0 && activity.type !== 2);
  const selectedActivities = selected === "music" ? music : games;

  // Measure the actual object, excluding the dialog heading and the rotated
  // bounding box. The first pickup frame then matches its place on the desk.
  const measurePickup = useCallback((dialog) => {
    if (!dialog || !pickupSource.current) return;
    const item = dialog.querySelector(selected === "notebook" ? ".tabletop-book-cover" : ".tabletop-travel-preview > .tabletop-device, .tabletop-idle-hardware > .tabletop-device");
    if (!item) return;
    dialog.style.animation = "none";
    const destination = item.getBoundingClientRect();
    dialog.style.removeProperty("animation");
    const source = pickupSource.current;
    pickupSource.current = null;
    const scale = source.width / destination.width;
    const angle = source.rotation * Math.PI / 180;
    const dx = (destination.left + destination.width / 2 - window.innerWidth / 2) * scale;
    const dy = (destination.top + destination.height / 2 - window.innerHeight / 2) * scale;
    setOrigin((current) => ({
      ...current,
      "--pickup-x": `${source.x - window.innerWidth / 2 - dx * Math.cos(angle) + dy * Math.sin(angle)}px`,
      "--pickup-y": `${source.y - window.innerHeight / 2 - dx * Math.sin(angle) - dy * Math.cos(angle)}px`,
      "--pickup-scale": scale,
      "--pickup-rotation": `${source.rotation}deg`
    }));
  }, [selected]);

  // Keep the dialog mounted while closing the book and returning the object.
  // One phase owns each transform, so opening and closing cannot fight each other.
  useEffect(() => {
    if (!open || phase === "reading") return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const durations = { lifting: 800, opening: selected === "notebook" ? 700 : 320, closing: selected === "notebook" ? 650 : 280, returning: 850 };
    const next = { lifting: "reading", opening: "reading", closing: "returning" };
    const timer = window.setTimeout(() => {
      if (phase === "returning") setOpen(false);
      else setPhase(next[phase]);
    }, reduced ? 0 : durations[phase] + 300);
    return () => window.clearTimeout(timer);
  }, [open, phase, selected]);

  function putBack() {
    if (phase === "closing" || phase === "returning") return;
    onInspect();
    setPhase("closing");
  }

  function finishMotion(event) {
    const name = event.animationName;
    if (name === "tabletop-pickup" && phase === "lifting") setPhase("reading");
    if (name === "tabletop-device-reveal" && phase === "opening") setPhase("reading");
    if (name === "tabletop-device-stow" && phase === "closing") setPhase("returning");
    if (selected === "notebook" && name === "tabletop-book-center") {
      if (phase === "opening") setPhase("reading");
      if (phase === "closing") setPhase("returning");
    }
    if (name === "tabletop-put-back" && phase === "returning") setOpen(false);
  }

  function inspect(kind, event) {
    const target = event.currentTarget;
    const rect = target.firstElementChild.getBoundingClientRect();
    const matrix = new DOMMatrixReadOnly(getComputedStyle(target).transform);
    const rotation = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    pickupSource.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: target.firstElementChild.offsetWidth, rotation };
    const width = target.firstElementChild.offsetWidth;
    const height = target.firstElementChild.offsetHeight;
    const deviceWidth = Math.min(310, Math.max(280, window.innerHeight - 230) * width / height);
    const zoom = deviceWidth / width;
    setOrigin({
      "--preview-width": `${width}px`,
      "--preview-zoom": zoom,
      "--device-width": `${deviceWidth}px`,
      "--device-height": `${height * zoom}px`,
      "--wheel-size": `${(target.querySelector(".discord-player-wheel")?.offsetWidth || 110) * zoom}px`
    });
    trigger.current = target;
    setPortalContainer(target.closest(".app-shell"));
    setSelected(kind);
    setPhase("lifting");
    setOpen(true);
    onInspect();
  }

  return <>
    <div className="tabletop-scene" data-picked={open ? selected : undefined}>
      <div className="tabletop-mat" aria-hidden="true" />
      <header className="tabletop-intro">
        <span className="tabletop-eyebrow">MAKE YOURSELF AT HOME</span>
        <h3>A little downtime.</h3>
        <p>A few things from my side of the screen.<br />Pick something up. Take a look around.</p>
      </header>
      <div className={`tabletop-live ${error ? "is-disconnected" : ""}`} role="status"><Radio size={13} /><span>{signal || `DAI · ${status.toUpperCase()}`}</span></div>

      <button type="button" className="tabletop-object tabletop-notebook" onClick={(event) => inspect("notebook", event)} aria-label={objects.notebook.label} aria-haspopup="dialog">
        <NotebookCover />
        <span className="tabletop-object-caption"><span>01 / THE PERSON</span><BookOpen size={13} /> Open notebook</span>
      </button>
      <DeskEarphones />
      <button type="button" className="tabletop-object tabletop-ipod" onClick={(event) => inspect("music", event)} aria-label={`${objects.music.label}: ${music[0]?.name || (signal ? signal.toLowerCase() : "not listening to music")}`} aria-haspopup="dialog">
        <DevicePreview kind="music" activity={music[0]} image={music[0]?.image || activityImages[music[0]?.name]} signal={signal} />
        <span className="tabletop-object-caption"><span>02 / THE SOUNDTRACK</span><Headphones size={13} /> {music.length ? "Listening now" : "Taking a breather"}</span>
      </button>
      <button type="button" className="tabletop-object tabletop-gameboy" onClick={(event) => inspect("game", event)} aria-label={`${objects.game.label}: ${games[0]?.name || (signal ? signal.toLowerCase() : "not playing a game")}`} aria-haspopup="dialog">
        <DevicePreview kind="game" activity={games[0]} image={games[0]?.image || activityImages[games[0]?.name]} signal={signal} />
        <span className="tabletop-object-caption"><span>03 / THE NEXT LEVEL</span><Gamepad2 size={13} /> {games.length ? "In a game" : "Rest mode"}</span>
      </button>

      <div className="tabletop-keepsakes"><DiscordDeskKeepsakes /></div>
      <div className="tabletop-note" aria-hidden="true"><span>note to self:</span><p>make cool things.<br />take little breaks.<br /><s>go to bed early.</s></p><span className="tabletop-note-star">✳</span></div>
      <div className="tabletop-pencils" aria-hidden="true"><span className="discord-desk-pencil"><i /><span>ONE MORE IDEA</span></span><span className="discord-desk-pencil tabletop-pencil-two"><i /></span></div>
      <footer className="tabletop-footer"><span>DAI’S DESK · EST. ONLINE</span><span>{error ? "Connection interrupted · reconnecting" : loading ? "Connecting to Discord…" : `Last synced ${updatedAt}`}</span></footer>
    </div>

    <Dialog.Root open={open} onOpenChange={(value) => { if (!value) putBack(); }}>
      <Dialog.Portal container={portalContainer}>
        <Dialog.Overlay className="tabletop-overlay" data-phase={phase} />
        <Dialog.Content ref={measurePickup} className={`discord-desk tabletop-dialog is-${selected}`} data-phase={phase} style={origin} onAnimationEnd={finishMotion} onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }}>
          <header className="tabletop-dialog-heading">
            <div><Dialog.Title>{objects[selected]?.title}</Dialog.Title><Dialog.Description>{objects[selected]?.description}</Dialog.Description></div>
            <Dialog.Close className="tabletop-close" aria-label="Put back on the desk"><X size={20} /></Dialog.Close>
          </header>
          <div className="tabletop-dialog-scroll">
            {selected === "notebook" ? <>
              <NotebookInspection phase={phase}>{notebook}</NotebookInspection>
              {otherActivities.length > 0 ? <div className="tabletop-extra-activities"><span>ALSO IN THE ROOM</span>{otherActivities.map((activity) => <p key={activity.activityKey}>{activity.typeLabel}: <strong>{activity.name}</strong>{activity.detail ? ` · ${activity.detail}` : ""}</p>)}</div> : null}
            </> : selectedActivities.length ? <div className="tabletop-inspected-devices">
              {renderActivities(selectedActivities)}
              <div className="tabletop-travel-preview"><DevicePreview kind={selected === "music" ? "music" : "game"} activity={selectedActivities[0]} image={selectedActivities[0]?.image || activityImages[selectedActivities[0]?.name]} signal={signal} /></div>
            </div> : <div className="tabletop-idle-device">
              <div className="tabletop-idle-hardware"><DevicePreview kind={selected === "music" ? "music" : "game"} signal={signal} /></div>
              <h4>{error ? "The signal took a break." : loading ? "Tuning into Discord…" : selected === "music" ? "A quiet moment." : "Between adventures."}</h4>
              <p>{error ? "Live activity is unavailable. The desk will reconnect automatically." : loading ? "Waiting for Dai’s latest activity." : selected === "music" ? "Dai isn’t listening to music right now. This little screen lights up when the music starts." : "Dai isn’t playing a game right now. The handheld lights up when the next session starts."}</p>
            </div>}
          </div>
          <Dialog.Close className="tabletop-return">↙ Put back on the desk <kbd>ESC</kbd></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
