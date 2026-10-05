import { ArrowUpRight, Check, Copy, Undo2 } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { BsNintendoSwitch } from "react-icons/bs";
import { FaPlaystation, FaSteam, FaXbox } from "react-icons/fa6";
import { SiEpicgames, SiLeagueoflegends, SiRoblox } from "react-icons/si";
import { now, playerCards } from "../data/site";

// The tabletop provides this; without it (the phone layout) the tab hides.
export const NotebookTurnContext = createContext(null);

const icons = {
  steam: FaSteam,
  league: SiLeagueoflegends,
  roblox: SiRoblox,
  playstation: FaPlaystation,
  xbox: FaXbox,
  epic: SiEpicgames,
  switch: BsNintendoSwitch
};

const cards = playerCards.filter((card) => card.handle);
const rotation = now.find((entry) => entry.label === "currently playing")?.tags || [];

function PlatformIcon({ id, size }) {
  const Icon = icons[id];
  return Icon ? <Icon size={size} aria-hidden="true" focusable="false" /> : null;
}

// An index card taped to the "currently" page. It turns the page rather than
// leaving the site, so it looks like paper, not like the Discord button.
export function NotebookSocialsTab() {
  const turn = useContext(NotebookTurnContext);
  if (!turn || !cards.length) return null;
  return <button type="button" ref={turn.tabRef} className="notebook-socials-tab" onClick={turn.open} aria-label={`Turn the page: gamer tags and friend codes for ${cards.length} platforms`}>
    <span className="notebook-socials-tab-stack" aria-hidden="true">
      {cards.slice(0, 4).map((card) => <i key={card.id}><PlatformIcon id={card.id} size={13} /></i>)}
    </span>
    <span className="notebook-socials-tab-copy"><small>Player cards</small><b>add me in game</b></span>
    <span className="notebook-socials-tab-turn" aria-hidden="true">p.03 <ArrowUpRight size={12} /></span>
  </button>;
}

function CopyButton({ card }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const value = card.code || card.handle;
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(event) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older browsers: copy from a field inside the dialog, where focus is trapped.
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.className = "sr-only";
      event.currentTarget.parentElement.append(field);
      field.select();
      try { document.execCommand("copy"); } catch { /* nothing else to try */ }
      field.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return <>
    <button type="button" className={`notebook-copy${copied ? " is-copied" : ""}`} onClick={copy} aria-label={`Copy ${card.label} ${card.note}: ${value}`}>
      {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
      <span>{copied ? "copied" : "copy"}</span>
    </button>
    <span className="sr-only" role="status">{copied ? `${card.label} ${card.note} copied` : ""}</span>
  </>;
}

function ProfileLink({ card }) {
  if (!card.href) return null;
  return <a className="notebook-card-link" href={card.href} target="_blank" rel="noreferrer" aria-label={`Open ${card.label} profile (opens in a new tab)`}>
    <ArrowUpRight size={13} aria-hidden="true" />
  </a>;
}

// The spread behind the turned page: its back becomes the left page, and the
// page underneath it the right one.
export function NotebookSocialsSpread({ onBack, headingRef }) {
  return <>
    <section className="discord-notebook-page tabletop-socials-back" aria-labelledby="notebook-lobby-title">
      <p className="discord-notebook-heading" id="notebook-lobby-title" ref={headingRef} tabIndex={-1}>ADD ME / 03</p>
      <p className="notebook-lobby-hello">come play<br />with me.</p>
      {rotation.length ? <div className="notebook-lobby-rotation">
        <small>in rotation</small>
        <ul>{rotation.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </div> : null}
      <div className="notebook-lobby-steps">
        <small>how to add me</small>
        <ol><li>copy a tag</li><li>send a request</li><li>say hi so I know it’s you</li></ol>
      </div>
      <button type="button" className="notebook-turn-back" onClick={onBack}><Undo2 size={13} aria-hidden="true" /> back to the person</button>
    </section>
    <section className="discord-notebook-page tabletop-socials-page" aria-labelledby="notebook-cards-title">
      <div className="notebook-cards-head">
        <p className="discord-notebook-heading" id="notebook-cards-title">PLAYER CARDS / 04</p>
        <span>{String(cards.length).padStart(2, "0")} on file</span>
      </div>
      <ul className="notebook-cards">
        {cards.map((card) => <li className="notebook-card" key={card.id}>
          <span className="notebook-card-stamp" aria-hidden="true"><PlatformIcon id={card.id} size={17} /></span>
          <span className="notebook-card-copy"><small>{card.label} · {card.note}</small><b>{card.handle}</b></span>
          <span className="notebook-card-actions"><CopyButton card={card} /><ProfileLink card={card} /></span>
        </li>)}
      </ul>
      <p className="notebook-cards-note">send a request and tell me<br />where you found me ✳</p>
    </section>
    <span className="tabletop-turn-shade" aria-hidden="true" />
    <span className="discord-notebook-binding tabletop-socials-spine" aria-hidden="true" />
  </>;
}
