import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Award, X } from "lucide-react";
import { PLAYER_GAMES } from "../../shared/player-catalog.mjs";
import { CommunityInbox } from "./CommunityInbox";

export function PlayerHub({ onPlay }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load(signal) {
    try {
      const response = await fetch("/api/player", { credentials: "include", signal });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Player panel unavailable.");
      if (signal?.aborted) return;
      setData(value); setEdit(value.passport || null); setMessage("");
    } catch (error) { if (error.name !== "AbortError") setMessage("Player panel is unavailable. Try again shortly."); }
  }
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const inbox = (event) => setData((current) => current ? { ...current, inbox: event.detail } : current);
    window.addEventListener("daivr-inbox", inbox);
    return () => { controller.abort(); window.removeEventListener("daivr-inbox", inbox); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    load(controller.signal);
    // Refresh the UTC challenge at rollover without discarding unsaved edits.
    const timer = window.setTimeout(() => load(controller.signal), Math.max(1000, Date.parse(data?.challenge?.resetsAt || new Date(Date.now() + 86_400_000).toISOString()) - Date.now() + 100));
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [open, data?.challenge?.date]);
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/player", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: edit.title, favoriteGame: edit.favoriteGame, featuredBadges: edit.featuredBadges, accent: edit.accent }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Save failed.");
      setData(value); setEdit(value.passport); setMessage("Passport saved.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const card = data?.passport;
  const challenge = data?.challenge;
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button className="player-hub-trigger arcade-focus" type="button"><Award size={16} aria-hidden="true" /><span>Player</span>{data?.inbox?.unread ? <b aria-label={`${data.inbox.unread} unread notifications`}>{data.inbox.unread}</b> : null}</button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="player-hub-overlay" /><Dialog.Content className="player-hub-dialog">
      <header className="player-hub-heading"><div><span className="pixel-label">YOUR SAVE SLOT</span><Dialog.Title>Player passport</Dialog.Title></div><Dialog.Close asChild><button type="button" aria-label="Close player panel"><X size={20} /></button></Dialog.Close></header>
      <Dialog.Description>Your identity, daily challenge, and conversations in one place.</Dialog.Description>
      {message ? <p role="status">{message}</p> : null}
      {!data ? <button type="button" onClick={() => load()}>Retry loading player panel</button> : null}
      {data && !data.user ? <p className="player-signin"><a href="/api/comments/auth/discord">Connect Discord</a> to save a passport, earn challenge rewards, and see your inbox.</p> : null}
      {card && edit ? <>
        <section className={`player-passport accent-${edit.accent.toLowerCase()}`} aria-label="Your passport preview">
          <img src={card.user.avatarUrl} alt="" /><div><small>{edit.title}</small><h3>{card.user.username}</h3><p>Buddy level {card.level} · {card.quests} quests · {card.challengeCount} daily wins</p><p>Favorite: {PLAYER_GAMES.find((game) => game.id === edit.favoriteGame)?.name || "Not chosen yet"}</p></div>
          <div className="passport-badges">{card.badges.filter((badge) => edit.featuredBadges.includes(badge.id)).map((badge) => <span key={badge.id}>{badge.label}</span>)}</div>
        </section>
        <form className="passport-form" onSubmit={save}>
          <div className="passport-fields">
            <label>Title<select value={edit.title} disabled={busy} onChange={(event) => setEdit({ ...edit, title: event.target.value })}>{card.titles.map((title) => <option key={title}>{title}</option>)}</select></label>
            <label>Favorite game<select value={edit.favoriteGame} disabled={busy} onChange={(event) => setEdit({ ...edit, favoriteGame: event.target.value })}><option value="">Choose a game</option>{PLAYER_GAMES.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
            <label>Card accent<select value={edit.accent} disabled={busy} onChange={(event) => setEdit({ ...edit, accent: event.target.value })}>{["default", ...card.cosmetics].map((accent) => <option key={accent}>{accent}</option>)}</select></label>
          </div>
          <fieldset disabled={busy}><legend>Display up to three earned badges</legend><div className="passport-badge-options">{card.badges.map((badge) => <label key={badge.id}><input type="checkbox" checked={edit.featuredBadges.includes(badge.id)} disabled={!edit.featuredBadges.includes(badge.id) && edit.featuredBadges.length >= 3} onChange={(event) => setEdit({ ...edit, featuredBadges: event.target.checked ? [...edit.featuredBadges, badge.id] : edit.featuredBadges.filter((id) => id !== badge.id) })} />{badge.label}</label>)}</div></fieldset>
          <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save passport"}</button>
        </form>
        <section className="passport-records" aria-label="Personal bests">{card.records.map((record) => <div key={record.game}><span>{PLAYER_GAMES.find((game) => game.id === record.game)?.name}</span><strong>{record.best === null ? "No run yet" : record.best.toLocaleString()}</strong></div>)}</section>
      </> : null}
      {challenge ? <section className="daily-challenge"><div><span className="pixel-label">DAILY CABINET CHALLENGE · {challenge.date}</span><h3>{challenge.name}</h3><p>Score {challenge.goal.toLocaleString()} {challenge.unit} in {PLAYER_GAMES.find((game) => game.id === challenge.game)?.name} in one run.</p><p>Reward: <strong>{challenge.reward}</strong> passport title and accent. Resets at 00:00 UTC.</p></div>
        <progress max={challenge.goal} value={Math.min(challenge.goal, challenge.best || 0)} aria-label="Daily challenge progress" /><p>{challenge.complete ? "Complete — reward unlocked!" : `${challenge.best || 0} / ${challenge.goal} ${challenge.unit}`}</p>
        <button type="button" onClick={() => { setOpen(false); onPlay(challenge.game); }}>Play challenge</button><small>Sign in before playing. Progress saves when a completed run is accepted.</small>
      </section> : null}
      {data?.user ? <CommunityInbox inbox={data.inbox} onNavigate={() => setOpen(false)} /> : null}
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
